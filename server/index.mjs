import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";

const port = Number(process.env.API_PORT ?? 8787);
const corsOrigin = process.env.API_CORS_ORIGIN ?? "http://127.0.0.1:5173";
const serviceToken = process.env.API_SERVICE_TOKEN ?? "local-dev-token";
const defaultTenantId = "11111111-1111-4111-8111-111111111111";
const defaultFundId = "22222222-2222-4222-8222-222222222222";
const dataFile = process.env.API_DATA_FILE ?? path.join(".data", "syed-fund-api.json");
const databaseUrl = process.env.SYED_DATABASE_URL ?? process.env.DATABASE_URL;

let storageMode = "memory";
let db = null;

const seedApprovals = [
  {
    approval_id: crypto.randomUUID(),
    tenant_id: defaultTenantId,
    fund_id: defaultFundId,
    entity_type: "position_reconciliation_break",
    entity_id: "33333333-3333-4333-8333-333333333333",
    proposed_action: {
      break_id: "BRK-AAPL-SHORT-9000",
      adjustment: "Align internal short quantity to custodian after failed borrow confirmation.",
      ticker: "AAPL",
      quantity_difference: -9000,
    },
    nav_impact: -4_950_000,
    gl_impact: {
      debit: "Unrealized Loss",
      credit: "Investments at Fair Value",
      amount: 4_950_000,
    },
    maker_user_id: "analyst.syed",
    checker_user_id: null,
    status: "Submitted",
    maker_comment: "High-materiality AAPL short quantity mismatch requires controller approval.",
    checker_comment: null,
    digital_signature: null,
    submitted_at: new Date().toISOString(),
    approved_at: null,
    posted_at: null,
  },
];

let approvals = [...seedApprovals];
let auditTrail = [];
let glPostings = [];

async function tryInitPostgres() {
  if (!databaseUrl) return false;
  try {
    const { Pool } = await import("pg");
    db = new Pool({ connectionString: databaseUrl });
    await db.query("select 1");
    await db.query(`
      create table if not exists api_workflow_approvals (
        approval_id uuid primary key,
        tenant_id uuid not null,
        fund_id uuid not null,
        entity_type text not null,
        entity_id text not null,
        proposed_action jsonb not null,
        nav_impact numeric not null default 0,
        gl_impact jsonb not null default '{}'::jsonb,
        maker_user_id text not null,
        checker_user_id text,
        status text not null,
        maker_comment text,
        checker_comment text,
        digital_signature text,
        submitted_at timestamptz,
        approved_at timestamptz,
        posted_at timestamptz,
        created_at timestamptz not null default now()
      );
      create table if not exists api_gl_postings (
        posting_id uuid primary key,
        tenant_id uuid not null,
        fund_id uuid not null,
        approval_id uuid not null,
        source_entity_type text not null,
        source_entity_id text not null,
        memo text not null,
        lines jsonb not null,
        nav_impact numeric not null default 0,
        posted_by text not null,
        posted_at timestamptz not null
      );
      create table if not exists api_audit_events (
        audit_id uuid primary key,
        tenant_id uuid not null,
        fund_id uuid,
        actor_user_id text not null,
        action_type text not null,
        entity_type text not null,
        entity_id text,
        old_value jsonb,
        new_value jsonb,
        approval_status text,
        previous_hash text,
        event_hash text not null,
        created_at timestamptz not null
      );
    `);
    storageMode = "postgres";
    await ensurePostgresSeed();
    await hydrateFromPostgres();
    return true;
  } catch (error) {
    console.warn(`PostgreSQL mode unavailable; falling back to file persistence. ${error instanceof Error ? error.message : error}`);
    db = null;
    return false;
  }
}

async function ensurePostgresSeed() {
  if (!db) return;
  const existing = await db.query("select count(*)::int as count from api_workflow_approvals where tenant_id = $1 and fund_id = $2", [defaultTenantId, defaultFundId]);
  if (existing.rows[0]?.count) return;
  for (const approval of seedApprovals) await upsertApproval(approval);
}

async function hydrateFromPostgres() {
  if (!db) return;
  const [approvalRows, postingRows, auditRows] = await Promise.all([
    db.query("select * from api_workflow_approvals order by created_at desc"),
    db.query("select * from api_gl_postings order by posted_at desc"),
    db.query("select * from api_audit_events order by created_at desc"),
  ]);
  approvals = approvalRows.rows.map(normalizeApproval);
  glPostings = postingRows.rows.map(normalizePosting);
  auditTrail = auditRows.rows.map(normalizeAudit);
}

function normalizeApproval(row) {
  return {
    ...row,
    nav_impact: Number(row.nav_impact ?? 0),
    proposed_action: row.proposed_action ?? {},
    gl_impact: row.gl_impact ?? {},
    submitted_at: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    approved_at: row.approved_at ? new Date(row.approved_at).toISOString() : null,
    posted_at: row.posted_at ? new Date(row.posted_at).toISOString() : null,
  };
}

function normalizePosting(row) {
  return {
    ...row,
    nav_impact: Number(row.nav_impact ?? 0),
    lines: row.lines ?? [],
    posted_at: row.posted_at ? new Date(row.posted_at).toISOString() : null,
  };
}

function normalizeAudit(row) {
  return {
    ...row,
    old_value: row.old_value ?? null,
    new_value: row.new_value ?? null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function approvalControlKey(approval) {
  return String(approval?.proposed_action?.break_id ?? approval?.entity_id ?? "").trim().toLowerCase();
}

function findDuplicateApproval(candidate) {
  const controlKey = approvalControlKey(candidate);
  if (!controlKey) return null;
  return approvals.find((approval) => (
    approval.tenant_id === candidate.tenant_id
    && approval.fund_id === candidate.fund_id
    && approval.entity_type === candidate.entity_type
    && approvalControlKey(approval) === controlKey
    && !["Rejected", "Closed", "Cancelled"].includes(approval.status)
  ));
}

async function loadFileStore() {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    approvals = parsed.approvals?.length ? parsed.approvals : approvals;
    glPostings = parsed.glPostings ?? [];
    auditTrail = parsed.auditTrail ?? [];
    storageMode = "file";
  } catch {
    storageMode = "file";
    await saveFileStore();
  }
}

async function saveFileStore() {
  if (storageMode !== "file") return;
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify({ approvals, glPostings, auditTrail }, null, 2));
}

async function upsertApproval(approval) {
  if (db) {
    await db.query(`
      insert into api_workflow_approvals (
        approval_id, tenant_id, fund_id, entity_type, entity_id, proposed_action, nav_impact, gl_impact,
        maker_user_id, checker_user_id, status, maker_comment, checker_comment, digital_signature,
        submitted_at, approved_at, posted_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      on conflict (approval_id) do update set
        checker_user_id = excluded.checker_user_id,
        status = excluded.status,
        checker_comment = excluded.checker_comment,
        digital_signature = excluded.digital_signature,
        approved_at = excluded.approved_at,
        posted_at = excluded.posted_at
    `, [
      approval.approval_id, approval.tenant_id, approval.fund_id, approval.entity_type, approval.entity_id,
      approval.proposed_action, approval.nav_impact, approval.gl_impact, approval.maker_user_id, approval.checker_user_id,
      approval.status, approval.maker_comment, approval.checker_comment, approval.digital_signature,
      approval.submitted_at, approval.approved_at, approval.posted_at,
    ]);
  }
  await saveFileStore();
}

async function insertPosting(posting) {
  if (db) {
    await db.query(`
      insert into api_gl_postings (
        posting_id, tenant_id, fund_id, approval_id, source_entity_type, source_entity_id, memo, lines, nav_impact, posted_by, posted_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      on conflict (posting_id) do nothing
    `, [
      posting.posting_id, posting.tenant_id, posting.fund_id, posting.approval_id, posting.source_entity_type,
      posting.source_entity_id, posting.memo, posting.lines, posting.nav_impact, posting.posted_by, posting.posted_at,
    ]);
  }
  await saveFileStore();
}

async function insertAuditEvent(event) {
  if (db) {
    await db.query(`
      insert into api_audit_events (
        audit_id, tenant_id, fund_id, actor_user_id, action_type, entity_type, entity_id, old_value, new_value,
        approval_status, previous_hash, event_hash, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [
      event.audit_id, event.tenant_id, event.fund_id, event.actor_user_id, event.action_type, event.entity_type,
      event.entity_id, event.old_value, event.new_value, event.approval_status, event.previous_hash, event.event_hash, event.created_at,
    ]);
  }
  await saveFileStore();
}

function audit({ tenantId, fundId, actor, action, entityType, entityId, oldValue, newValue, approvalStatus }) {
  const previousHash = auditTrail[0]?.event_hash ?? "GENESIS";
  const payload = {
    tenant_id: tenantId,
    fund_id: fundId,
    actor_user_id: actor,
    action_type: action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
    approval_status: approvalStatus,
    previous_hash: previousHash,
    created_at: new Date().toISOString(),
  };
  const eventHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const event = { audit_id: crypto.randomUUID(), ...payload, event_hash: eventHash };
  auditTrail.unshift(event);
  void insertAuditEvent(event);
  return event;
}

async function initializeStorage() {
  const postgresReady = await tryInitPostgres();
  if (!postgresReady) {
    await loadFileStore();
  }
  if (!approvals.length) {
    approvals = [...seedApprovals];
    await Promise.all(approvals.map((approval) => upsertApproval(approval)));
  }
}

function send(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-tenant-id,x-fund-id,x-user-id,x-client-cert-fingerprint",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function requireAuth(req) {
  const expected = `Bearer ${serviceToken}`;
  const got = req.headers.authorization;
  if (got !== expected) return { ok: false, status: 401, message: "Missing or invalid service token" };
  if (process.env.API_REQUIRE_MTLS === "true" && !req.headers["x-client-cert-fingerprint"]) {
    return { ok: false, status: 401, message: "Missing client certificate fingerprint" };
  }
  return { ok: true };
}

function context(req) {
  return {
    tenantId: String(req.headers["x-tenant-id"] ?? defaultTenantId),
    fundId: String(req.headers["x-fund-id"] ?? defaultFundId),
    actor: String(req.headers["x-user-id"] ?? "local.user"),
  };
}

function routePath(url) {
  return url.pathname.replace(/\/$/, "") || "/";
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = routePath(url);

  if (req.method === "OPTIONS") return send(res, 204, {});
  if (path === "/health") return send(res, 200, { status: "ok", service: "syed-fund-api", persistence: storageMode, time: new Date().toISOString() });

  const auth = requireAuth(req);
  if (!auth.ok) return send(res, auth.status, { error: auth.message });

  try {
    const ctx = context(req);

    if (req.method === "GET" && path === "/api/v1/bootstrap") {
      return send(res, 200, {
        tenant: { tenant_id: ctx.tenantId, legal_name: "Syed Fund Simulator Institutional Sandbox" },
        fund: { fund_id: ctx.fundId, fund_name: "Long/Short Equity Fund", base_currency: "USD", strategy: "Long/Short" },
        controls: { maker_checker: true, audit_hash_chain: true, tenant_isolation: true, persistence: storageMode },
      });
    }

    if (req.method === "GET" && path === "/api/v1/workflow/approvals") {
      return send(res, 200, { approvals: approvals.filter((a) => a.tenant_id === ctx.tenantId && a.fund_id === ctx.fundId) });
    }

    if (req.method === "GET" && path === "/api/v1/gl/postings") {
      return send(res, 200, { postings: glPostings.filter((p) => p.tenant_id === ctx.tenantId && p.fund_id === ctx.fundId) });
    }

    if (req.method === "POST" && path === "/api/v1/workflow/approvals") {
      const body = await readBody(req);
      const approval = {
        approval_id: crypto.randomUUID(),
        tenant_id: ctx.tenantId,
        fund_id: ctx.fundId,
        entity_type: body.entity_type ?? "position_reconciliation_break",
        entity_id: body.entity_id ?? body.proposed_action?.break_id ?? crypto.randomUUID(),
        proposed_action: body.proposed_action ?? {},
        nav_impact: Number(body.nav_impact ?? 0),
        gl_impact: body.gl_impact ?? {},
        maker_user_id: ctx.actor,
        checker_user_id: null,
        status: "Submitted",
        maker_comment: body.maker_comment ?? "Submitted for four-eyes review.",
        checker_comment: null,
        digital_signature: null,
        submitted_at: new Date().toISOString(),
        approved_at: null,
        posted_at: null,
      };
      const duplicate = findDuplicateApproval(approval);
      if (duplicate) {
        return send(res, 409, {
          error: "Duplicate workflow item blocked",
          message: `This break is already ${duplicate.status}. Open the existing item instead of submitting it again.`,
          existing_approval_id: duplicate.approval_id,
          existing_status: duplicate.status,
        });
      }
      approvals.unshift(approval);
      audit({ ...ctx, action: "approval_submitted", entityType: approval.entity_type, entityId: approval.entity_id, oldValue: null, newValue: approval, approvalStatus: approval.status });
      await upsertApproval(approval);
      return send(res, 201, { approval });
    }

    const approveMatch = path.match(/^\/api\/v1\/workflow\/approvals\/([^/]+)\/approve$/);
    if (req.method === "POST" && approveMatch) {
      const approval = approvals.find((a) => a.approval_id === approveMatch[1] && a.tenant_id === ctx.tenantId);
      if (!approval) return send(res, 404, { error: "Approval not found" });
      if (approval.maker_user_id === ctx.actor) return send(res, 409, { error: "Maker cannot approve own workflow item" });
      const body = await readBody(req);
      const oldValue = { ...approval };
      approval.checker_user_id = ctx.actor;
      approval.status = "Approved";
      approval.checker_comment = body.checker_comment ?? "Approved by checker.";
      approval.approved_at = new Date().toISOString();
      approval.digital_signature = crypto.createHash("sha256").update(`${approval.approval_id}:${ctx.actor}:${approval.approved_at}`).digest("hex");
      audit({ ...ctx, action: "approval_approved", entityType: approval.entity_type, entityId: approval.entity_id, oldValue, newValue: approval, approvalStatus: approval.status });
      await upsertApproval(approval);
      return send(res, 200, { approval });
    }

    const rejectMatch = path.match(/^\/api\/v1\/workflow\/approvals\/([^/]+)\/reject$/);
    if (req.method === "POST" && rejectMatch) {
      const approval = approvals.find((a) => a.approval_id === rejectMatch[1] && a.tenant_id === ctx.tenantId);
      if (!approval) return send(res, 404, { error: "Approval not found" });
      const body = await readBody(req);
      const oldValue = { ...approval };
      approval.checker_user_id = ctx.actor;
      approval.status = "Rejected";
      approval.checker_comment = body.checker_comment ?? "Rejected by checker.";
      audit({ ...ctx, action: "approval_rejected", entityType: approval.entity_type, entityId: approval.entity_id, oldValue, newValue: approval, approvalStatus: approval.status });
      await upsertApproval(approval);
      return send(res, 200, { approval });
    }

    const postMatch = path.match(/^\/api\/v1\/workflow\/approvals\/([^/]+)\/post$/);
    if (req.method === "POST" && postMatch) {
      const approval = approvals.find((a) => a.approval_id === postMatch[1] && a.tenant_id === ctx.tenantId);
      if (!approval) return send(res, 404, { error: "Approval not found" });
      if (approval.status !== "Approved") return send(res, 409, { error: "Only approved workflow items can be posted to GL" });
      if (!approval.checker_user_id || !approval.digital_signature) return send(res, 409, { error: "Checker approval and digital signature required before posting" });
      const existingPosting = glPostings.find((posting) => posting.approval_id === approval.approval_id);
      if (existingPosting) return send(res, 409, { error: "This approved workflow item has already been posted to GL", posting: existingPosting });
      const oldValue = { ...approval };
      const amount = Math.abs(Number(approval.gl_impact?.amount ?? approval.nav_impact ?? 0));
      const posting = {
        posting_id: crypto.randomUUID(),
        tenant_id: approval.tenant_id,
        fund_id: approval.fund_id,
        approval_id: approval.approval_id,
        source_entity_type: approval.entity_type,
        source_entity_id: approval.entity_id,
        memo: `Posted approved workflow ${approval.approval_id.slice(0, 8)} to GL`,
        lines: [
          {
            account: approval.gl_impact?.debit ?? "Unrealized Loss",
            debit: amount,
            credit: 0,
          },
          {
            account: approval.gl_impact?.credit ?? "Investments at Fair Value",
            debit: 0,
            credit: amount,
          },
        ],
        nav_impact: approval.nav_impact,
        posted_by: ctx.actor,
        posted_at: new Date().toISOString(),
      };
      approval.status = "Posted";
      approval.posted_at = posting.posted_at;
      glPostings.unshift(posting);
      audit({ ...ctx, action: "approval_posted_to_gl", entityType: approval.entity_type, entityId: approval.entity_id, oldValue, newValue: { approval, posting }, approvalStatus: approval.status });
      await upsertApproval(approval);
      await insertPosting(posting);
      return send(res, 200, { approval, posting });
    }

    const reopenMatch = path.match(/^\/api\/v1\/workflow\/approvals\/([^/]+)\/reopen$/);
    if (req.method === "POST" && reopenMatch) {
      const approval = approvals.find((a) => a.approval_id === reopenMatch[1] && a.tenant_id === ctx.tenantId);
      if (!approval) return send(res, 404, { error: "Approval not found" });
      if (approval.status !== "Posted") return send(res, 409, { error: "Only posted workflow items can be reopened through correction workflow" });
      const body = await readBody(req);
      const correctionId = crypto.randomUUID();
      const originalBreakId = approval.proposed_action?.break_id ?? approval.entity_id;
      const amount = Math.abs(Number(approval.gl_impact?.amount ?? approval.nav_impact ?? 0));
      const correctionType = body.correction_type ?? "Reversal";
      const correctionReason = body.reason ?? "Reopen posted item for correction/reversal review.";
      const evidenceNote = body.evidence_note ?? "Pending supporting evidence upload/review.";
      const correctionApproval = {
        approval_id: correctionId,
        tenant_id: approval.tenant_id,
        fund_id: approval.fund_id,
        entity_type: approval.entity_type,
        entity_id: `${approval.entity_id}-CORR-${correctionId.slice(0, 8)}`,
        proposed_action: {
          ...approval.proposed_action,
          break_id: `${originalBreakId}-CORR-${correctionId.slice(0, 8)}`,
          correction_of: approval.approval_id,
          correction_type: correctionType,
          correction_reason: correctionReason,
          evidence_note: evidenceNote,
          proposed_resolution: "Review and post corrective GL/NAV entry after controller approval.",
        },
        nav_impact: -Number(approval.nav_impact ?? 0),
        gl_impact: {
          debit: approval.gl_impact?.credit ?? "Investments at Fair Value",
          credit: approval.gl_impact?.debit ?? "Unrealized Loss",
          amount,
        },
        maker_user_id: ctx.actor,
        checker_user_id: null,
        status: "Submitted",
        maker_comment: `${correctionType}: ${correctionReason} Evidence: ${evidenceNote}`,
        checker_comment: null,
        digital_signature: null,
        submitted_at: new Date().toISOString(),
        approved_at: null,
        posted_at: null,
      };
      approvals.unshift(correctionApproval);
      audit({
        ...ctx,
        action: "approval_reopened_for_correction",
        entityType: approval.entity_type,
        entityId: approval.entity_id,
        oldValue: approval,
        newValue: correctionApproval,
        approvalStatus: correctionApproval.status,
      });
      await upsertApproval(correctionApproval);
      return send(res, 201, { approval, correction_approval: correctionApproval });
    }

    if (req.method === "GET" && path === "/api/v1/audit") {
      return send(res, 200, { audit: auditTrail.filter((a) => a.tenant_id === ctx.tenantId) });
    }

    if (req.method === "POST" && path === "/api/v1/copilot/investigate") {
      const body = await readBody(req);
      const event = audit({ ...ctx, action: "copilot_investigation", entityType: "ai_copilot", entityId: crypto.randomUUID(), oldValue: null, newValue: { question: body.question, scope: body.scope }, approvalStatus: "ReadOnly" });
      if (storageMode === "file") await saveFileStore();
      return send(res, 200, {
        answer: "Review the source break, quantify NAV and GL impact, separate timing from economic differences, and route material adjustments through maker-checker approval before posting.",
        controls: ["Tenant-scoped retrieval", "No autonomous posting", "Audit logged", "No model training on client data"],
      });
    }

    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : "Internal server error" });
  }
});

await initializeStorage();

server.listen(port, "127.0.0.1", () => {
  console.log(`Syed Fund API listening on http://127.0.0.1:${port} (${storageMode} persistence)`);
});
