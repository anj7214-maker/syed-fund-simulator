import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const noticeVersion = "2026-10-12";
const consentText = "I have read the Privacy Notice and agree to the use of my details for simulator access and feedback requests.";
const marketingText = "I would like to receive emails about training programmes, product upgrades, and paid offerings.";
const privacyText = "We collect your name, email address, profile type, and college or professional details to provide access to the simulator, understand our users, and request feedback. With your separate consent, we may also email you about training programmes, product upgrades, and paid offerings. You can unsubscribe from promotional emails at any time.";

export function validateVisitor(body) {
  const clean = (value, max) => typeof value === "string" && value.trim().length <= max ? value.trim() : "";
  const name = clean(body?.name, 120);
  const email = clean(body?.email, 254).toLowerCase();
  const profile = body?.profile;
  const college = profile === "student" ? clean(body?.college, 180) : "";
  const industry = profile === "professional" ? clean(body?.industry, 120) : "";
  const company = profile === "professional" ? clean(body?.company, 180) : "";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid name and email address.");
  if (!["student", "professional"].includes(profile) || (profile === "student" && !college) || (profile === "professional" && !industry)) throw new Error("Complete your college or industry details.");
  if (body.accessConsent !== true || body.noticeVersion !== noticeVersion || typeof body.marketingConsent !== "boolean") throw new Error("Please acknowledge the current Privacy Notice.");
  return { id: crypto.randomUUID(), name, email, profile, college, industry, company,
    access_consent: true, marketing_consent: body.marketingConsent,
    notice_version: noticeVersion, privacy_notice: privacyText, access_consent_text: consentText,
    marketing_consent_text: marketingText, consent_at: new Date().toISOString() };
}

async function readJson(req) {
  if (req.body !== undefined) {
    if (Buffer.byteLength(typeof req.body === "string" ? req.body : JSON.stringify(req.body)) > 8192) throw new Error("Request too large.");
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw new Error("Request too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default async function visitors(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const send = (status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(body)); };
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(405, { error: "Method not allowed." }); }
  let record;
  try { record = validateVisitor(await readJson(req)); } catch (error) { return send(400, { error: error instanceof SyntaxError ? "Invalid registration data." : error.message }); }
  try {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/visitor_registrations`, {
        method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(record), signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Database write failed.");
    } else if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      const file = path.join(".data", "visitor-registrations.jsonl");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.appendFile(file, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    } else { return send(503, { error: "Visitor registration is being configured. Please try again shortly." }); }
    return send(201, { registrationId: record.id });
  } catch { return send(503, { error: "Your details could not be saved. Please try again shortly." }); }
}
