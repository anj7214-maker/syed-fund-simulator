import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set } from "idb-keyval";
import { sampleAccruals, sampleActivities, sampleBreaks, sampleCashRecon, sampleCorporateActions, sampleDerivatives, sampleFundSetup, sampleFx, sampleHoldings, sampleInvestors, samplePositionRecon, sampleSecurityMaster, sampleTrades, sampleUploads } from "../data/sampleData";
import { recalculate } from "../engine/recalc";
import { applyScenarioEffect, createImpactSnapshot, scenarioCatalog } from "../engine/scenarioEngine";
import { AuditEvent, BreakItem, CapitalActivity, CashReconRow, CopilotContext, CorporateAction, Derivative, FundSetup, FxRate, Holding, ImpactSnapshot, Investor, JournalEntry, JournalLine, ModuleId, PositionReconRow, SandboxRole, SandboxTrack, ScenarioRun, SecurityMaster, Trade, TrainingMode, UploadBatch, UploadModule, ValidationIssue } from "../types";

const idbStorage = {
  getItem: async (name: string) => (await get(name)) ?? null,
  setItem: async (name: string, value: string) => set(name, value),
  removeItem: async (name: string) => set(name, null),
};

const impacts: Record<string, ModuleId[]> = {
  holding: ["holdings", "pricing", "gl", "trialBalance", "pl", "balanceSheet", "nav", "capital", "mgmtFees", "perfFees", "audit", "exceptions", "risk", "ops"],
  fx: ["fx", "holdings", "pl", "balanceSheet", "nav", "capital", "risk", "audit"],
  trade: ["trades", "holdings", "gl", "trialBalance", "cashRecon", "positionRecon", "nav", "audit"],
  investor: ["capital", "subsReds", "nav", "mgmtFees", "perfFees", "equalization", "waterfall", "investorReporting", "audit"],
  derivative: ["otc", "mtm", "gl", "trialBalance", "pl", "balanceSheet", "nav", "risk", "audit"],
  fee: ["mgmtFees", "perfFees", "gl", "trialBalance", "pl", "balanceSheet", "nav", "investorReporting", "audit"],
  fund: ["fund", "mgmtFees", "perfFees", "nav", "workflow", "audit"],
  break: ["reconBreaks", "exceptions", "workflow", "ops", "audit"],
  cashRecon: ["cashRecon", "reconBreaks", "exceptions", "nav", "audit", "ops"],
  positionRecon: ["positionRecon", "reconBreaks", "exceptions", "holdings", "nav", "audit", "ops"],
  corporateAction: ["corporateActions", "dividends", "coupons", "gl", "trialBalance", "pl", "balanceSheet", "nav", "cashRecon", "audit", "ops"],
  backendGl: ["workflow", "gl", "trialBalance", "pl", "balanceSheet", "nav", "reconBreaks", "exceptions", "audit", "ops"],
};

const cashReconStatus = (row: CashReconRow): CashReconRow["status"] => {
  const matched = Math.abs(row.internalLedgerCash - row.custodianCash) < 1
    && Math.abs(row.internalLedgerCash - row.primeBrokerCash) < 1;
  if (matched) return row.status === "Approved" ? "Approved" : "Resolved";
  return row.status === "Resolved" ? "Investigating" : row.status;
};

const positionReconStatus = (row: PositionReconRow): Pick<PositionReconRow, "status" | "settlementStatus"> => {
  const matched = Math.abs(row.internalPosition - row.custodianPosition) < 1
    && Math.abs(row.internalPosition - row.pbPosition) < 1;
  if (matched) {
    return {
      status: row.status === "Approved" ? "Approved" : "Resolved",
      settlementStatus: "Settled",
    };
  }
  return {
    status: row.status === "Resolved" ? "Investigating" : row.status,
    settlementStatus: row.settlementStatus === "Settled" ? "Pending Settlement" : row.settlementStatus,
  };
};

type BackendPostingPayload = {
  posting_id: string;
  approval_id: string;
  source_entity_type: string;
  source_entity_id: string;
  memo: string;
  lines: Array<{ account: string; debit: number; credit: number }>;
  nav_impact: number;
  posted_by: string;
  posted_at: string;
};

export interface FundState {
  activeModule: ModuleId;
  collapsed: boolean;
  fundMode: string;
  holdings: Holding[];
  fundSetup: FundSetup;
  securityMaster: SecurityMaster[];
  corporateActions: CorporateAction[];
  cashRecon: CashReconRow[];
  positionRecon: PositionReconRow[];
  breaks: BreakItem[];
  uploads: UploadBatch[];
  learningMode: boolean;
  trainingMode: TrainingMode;
  sandboxRole: SandboxRole;
  sandboxTrack: SandboxTrack;
  sandboxSlaMinutes: number;
  sandboxTimeEvent: string;
  manualEditMode: boolean;
  aiPanelOpen: boolean;
  copilotContext: CopilotContext | null;
  activeScenarioId: string | null;
  activeScenarioImpact: { before: ImpactSnapshot; after: ImpactSnapshot } | null;
  manualBaseline: ImpactSnapshot | null;
  scenarioRuns: ScenarioRun[];
  learnerScore: number;
  trades: Trade[];
  fxRates: FxRate[];
  investors: Investor[];
  activities: CapitalActivity[];
  accruals: typeof sampleAccruals;
  derivatives: Derivative[];
  managementFeePct: number;
  performanceFeePct: number;
  backendGlPostings: JournalEntry[];
  backendNavAdjustments: number;
  auditTrail: AuditEvent[];
  flashed: Record<string, "up" | "down">;
  impactedModules: ModuleId[];
  setActiveModule: (m: ModuleId) => void;
  toggleSidebar: () => void;
  updateHolding: (id: string, field: keyof Holding, value: string | number) => void;
  updateFx: (pair: string, value: number) => void;
  updateTrade: (id: string, field: keyof Trade, value: string | number) => void;
  updateInvestor: (id: string, field: keyof Investor, value: number) => void;
  updateDerivative: (id: string, field: keyof Derivative, value: number) => void;
  updateCashRecon: (id: string, field: keyof CashReconRow, value: string | number) => void;
  updatePositionRecon: (id: string, field: keyof PositionReconRow, value: string | number) => void;
  updateCorporateAction: (id: string, field: keyof CorporateAction, value: string | number) => void;
  updateFundSetup: (field: keyof FundSetup, value: string | number | boolean) => void;
  updateBreak: (id: string, field: keyof BreakItem, value: string | number) => void;
  updateWorkflow: (status: FundSetup["workflowStatus"]) => void;
  applyBackendGlPosting: (posting: BackendPostingPayload) => void;
  processUpload: (module: UploadModule, sourceType: string, file: { name: string; text: string }) => void;
  toggleLearningMode: () => void;
  setTrainingMode: (mode: TrainingMode) => void;
  setSandboxRole: (role: SandboxRole) => void;
  setSandboxTrack: (track: SandboxTrack) => void;
  triggerSandboxTimeEvent: (event: string) => void;
  toggleManualEditMode: () => void;
  setAiPanelOpen: (open: boolean) => void;
  explainContext: (context: CopilotContext) => void;
  setFee: (kind: "management" | "performance", value: number) => void;
  submitManualUpdates: (label: string, fields: string) => void;
  applyScenario: (scenario: string) => void;
  submitScenario: (learnerResponse: string) => void;
  resetScenario: () => void;
  setFundMode: (mode: string) => void;
  reset: () => void;
}

function audit(field: string, oldValue: unknown, newValue: unknown, impactedModules: ModuleId[], action = "Manual override"): AuditEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    field,
    oldValue: String(oldValue),
    newValue: String(newValue),
    impactedModules,
    action,
  };
}

function categoryForAccount(account: string): JournalLine["category"] {
  const value = account.toLowerCase();
  if (value.includes("payable") || value.includes("liability")) return "Liability";
  if (value.includes("capital") || value.includes("partner")) return "Capital";
  if (value.includes("income") || value.includes("gain")) return "Income";
  if (value.includes("fee") || value.includes("expense") || value.includes("loss")) return "Expense";
  return "Asset";
}

function postingToJournalEntry(posting: BackendPostingPayload): JournalEntry {
  return {
    id: `JE-BE-${posting.posting_id.slice(0, 8)}`,
    date: posting.posted_at.slice(0, 10),
    source: "Backend Workflow Approval Queue",
    memo: posting.memo,
    auto: true,
    lines: posting.lines.map((line) => ({
      account: line.account,
      category: categoryForAccount(line.account),
      debit: line.debit,
      credit: line.credit,
      ref: posting.approval_id,
    })),
  };
}

export const useFundStore = create<FundState>()(
  persist(
    (set) => ({
      activeModule: "dashboard",
      collapsed: false,
      fundMode: "Multi-Strategy Fund",
      holdings: sampleHoldings,
      fundSetup: sampleFundSetup,
      securityMaster: sampleSecurityMaster,
      corporateActions: sampleCorporateActions,
      cashRecon: sampleCashRecon,
      positionRecon: samplePositionRecon,
      breaks: sampleBreaks,
      uploads: sampleUploads,
      learningMode: false,
      trainingMode: "Live Mode",
      sandboxRole: "Analyst (0-4 Years)",
      sandboxTrack: "Reconciliation Operations",
      sandboxSlaMinutes: 105,
      sandboxTimeEvent: "Base T+0 operations window",
      manualEditMode: true,
      aiPanelOpen: true,
      copilotContext: null,
      activeScenarioId: null,
      activeScenarioImpact: null,
      manualBaseline: null,
      scenarioRuns: [],
      learnerScore: 0,
      trades: sampleTrades,
      fxRates: sampleFx,
      investors: sampleInvestors,
      activities: sampleActivities,
      accruals: sampleAccruals,
      derivatives: sampleDerivatives,
      managementFeePct: 0.015,
      performanceFeePct: 0.2,
      backendGlPostings: [],
      backendNavAdjustments: 0,
      auditTrail: [],
      flashed: {},
      impactedModules: [],
      setActiveModule: (activeModule) => set({ activeModule }),
      toggleSidebar: () => set((s) => ({ collapsed: !s.collapsed })),
      updateHolding: (id, field, value) => set((s) => {
        const old = s.holdings.find((h) => h.id === id)?.[field];
        const numericFields = ["quantity", "costPrice", "marketPrice", "fxRate"] as Array<keyof Holding>;
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          holdings: s.holdings.map((h) => h.id === id ? { ...h, [field]: nextValue } : h),
          impactedModules: impacts.holding,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Holding ${id}.${String(field)}`, old, nextValue, impacts.holding), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateFx: (pair, value) => set((s) => {
        const old = s.fxRates.find((fx) => fx.pair === pair)?.rate;
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          fxRates: s.fxRates.map((fx) => fx.pair === pair ? { ...fx, priorRate: fx.rate, rate: value } : fx),
          impactedModules: impacts.fx,
          flashed: { [`fx-${pair}`]: value >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`FX ${pair}`, old, value, impacts.fx), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateTrade: (id, field, value) => set((s) => {
        const old = s.trades.find((t) => t.id === id)?.[field];
        const nextValue = ["quantity", "price", "fees"].includes(String(field)) ? Number(value) : value;
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          trades: s.trades.map((t) => t.id === id ? { ...t, [field]: nextValue } : t),
          impactedModules: impacts.trade,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Trade ${id}.${String(field)}`, old, nextValue, impacts.trade, "Trade amendment"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateInvestor: (id, field, value) => set((s) => {
        const old = s.investors.find((i) => i.id === id)?.[field];
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          investors: s.investors.map((i) => i.id === id ? { ...i, [field]: value } : i),
          impactedModules: impacts.investor,
          flashed: { [`${id}-${String(field)}`]: value >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Investor ${id}.${String(field)}`, old, value, impacts.investor), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateDerivative: (id, field, value) => set((s) => {
        const old = s.derivatives.find((d) => d.id === id)?.[field];
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          derivatives: s.derivatives.map((d) => d.id === id ? { ...d, [field]: value } : d),
          impactedModules: impacts.derivative,
          flashed: { [`${id}-${String(field)}`]: value >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Derivative ${id}.${String(field)}`, old, value, impacts.derivative, "MTM override"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateCashRecon: (id, field, value) => set((s) => {
        const old = s.cashRecon.find((row) => row.id === id)?.[field];
        const numericFields = ["internalLedgerCash", "custodianCash", "primeBrokerCash"] as Array<keyof CashReconRow>;
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        const cashRecon = s.cashRecon.map((row) => {
          if (row.id !== id) return row;
          const updated = { ...row, [field]: nextValue } as CashReconRow;
          return { ...updated, status: cashReconStatus(updated) };
        });
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          cashRecon,
          impactedModules: impacts.cashRecon,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Cash recon ${id}.${String(field)}`, old, nextValue, impacts.cashRecon, "Cash reconciliation amendment"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updatePositionRecon: (id, field, value) => set((s) => {
        const old = s.positionRecon.find((row) => row.id === id)?.[field];
        const numericFields = ["internalPosition", "custodianPosition", "pbPosition"] as Array<keyof PositionReconRow>;
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        const positionRecon = s.positionRecon.map((row) => {
          if (row.id !== id) return row;
          const updated = { ...row, [field]: nextValue } as PositionReconRow;
          const statusUpdate = positionReconStatus(updated);
          return { ...updated, ...statusUpdate };
        });
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          positionRecon,
          impactedModules: impacts.positionRecon,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Position recon ${id}.${String(field)}`, old, nextValue, impacts.positionRecon, "Position reconciliation amendment"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateCorporateAction: (id, field, value) => set((s) => {
        const old = s.corporateActions.find((row) => row.id === id)?.[field];
        const numericFields = ["eligibleQuantity", "grossAmount", "withholdingTax", "netReceivable"] as Array<keyof CorporateAction>;
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        const corporateActions = s.corporateActions.map((row) => {
          if (row.id !== id) return row;
          const updated = { ...row, [field]: nextValue };
          if (field === "grossAmount" || field === "withholdingTax") {
            updated.netReceivable = Number(updated.grossAmount) - Number(updated.withholdingTax);
          }
          return updated;
        });
        const updatedAction = corporateActions.find((row) => row.id === id);
        const accruals = updatedAction
          ? s.accruals.map((a) => {
              if (a.ticker !== updatedAction.security) return a;
              if (updatedAction.eventType === "Dividend" && a.kind === "Dividend") return { ...a, sharesEligible: updatedAction.eligibleQuantity, withholdingTax: updatedAction.grossAmount ? updatedAction.withholdingTax / updatedAction.grossAmount : 0, netDividend: updatedAction.netReceivable };
              if (updatedAction.eventType === "Coupon" && a.kind === "Coupon") return { ...a, accruedInterest: updatedAction.netReceivable };
              return a;
            })
          : s.accruals;
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          corporateActions,
          accruals,
          impactedModules: impacts.corporateAction,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Corporate action ${id}.${String(field)}`, old, nextValue, impacts.corporateAction, "Corporate action amendment"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateFundSetup: (field, value) => set((s) => {
        const old = s.fundSetup[field];
        const numericFields = ["managementFeePct", "performanceFeePct", "hurdleRate"] as Array<keyof FundSetup>;
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          fundSetup: { ...s.fundSetup, [field]: nextValue },
          managementFeePct: field === "managementFeePct" ? Number(nextValue) : s.managementFeePct,
          performanceFeePct: field === "performanceFeePct" ? Number(nextValue) : s.performanceFeePct,
          impactedModules: impacts.fund,
          flashed: { [`fund-${String(field)}`]: "up" },
          auditTrail: [audit(`Fund setup.${String(field)}`, old, nextValue, impacts.fund, "Fund configuration update"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateBreak: (id, field, value) => set((s) => {
        const old = s.breaks.find((b) => b.id === id)?.[field];
        return {
          manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
          breaks: s.breaks.map((b) => b.id === id ? { ...b, [field]: field === "aging" || field === "navImpact" || field === "slaHours" ? Number(value) : value } : b),
          impactedModules: impacts.break,
          flashed: { [`${id}-${String(field)}`]: "up" },
          auditTrail: [audit(`Break ${id}.${String(field)}`, old, value, impacts.break, "Break workflow update"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateWorkflow: (status) => set((s) => ({
        manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
        fundSetup: { ...s.fundSetup, workflowStatus: status },
        impactedModules: ["workflow", "nav", "audit", "ops"],
        flashed: { workflow: "up" },
        auditTrail: [audit("NAV workflow status", s.fundSetup.workflowStatus, status, ["workflow", "nav", "audit", "ops"], "Maker-checker workflow"), ...s.auditTrail].slice(0, 100),
      })),
      applyBackendGlPosting: (posting) => set((s) => {
        const alreadyPosted = s.backendGlPostings.some((entry) => entry.id === `JE-BE-${posting.posting_id.slice(0, 8)}`);
        if (alreadyPosted) return {};
        const before = createImpactSnapshot(s);
        const journal = postingToJournalEntry(posting);
        const nextState = {
          ...s,
          backendGlPostings: [journal, ...s.backendGlPostings],
          backendNavAdjustments: s.backendNavAdjustments + posting.nav_impact,
        };
        const after = createImpactSnapshot(nextState);
        return {
          backendGlPostings: nextState.backendGlPostings,
          backendNavAdjustments: nextState.backendNavAdjustments,
          activeScenarioImpact: { before, after },
          manualBaseline: after,
          impactedModules: impacts.backendGl,
          flashed: { ...s.flashed, "backend-gl": posting.nav_impact >= 0 ? "up" : "down", nav: posting.nav_impact >= 0 ? "up" : "down" },
          auditTrail: [audit(
            `Backend GL posting ${posting.posting_id.slice(0, 8)}`,
            `NAV ${before.nav.toLocaleString("en-US")}`,
            `NAV ${after.nav.toLocaleString("en-US")}`,
            impacts.backendGl,
            "Backend approval posted to GL/NAV",
          ), ...s.auditTrail].slice(0, 100),
          copilotContext: {
            tab: "workflow",
            title: "Approved workflow posted to GL",
            summary: `${posting.memo} was posted by ${posting.posted_by}. The simulator consumed the backend journal and recalculated GL, trial balance, P&L, balance sheet, NAV and exception status.`,
            accountingImpact: `Debit ${posting.lines[0]?.account ?? "N/A"} and credit ${posting.lines[1]?.account ?? "N/A"} for NAV impact ${posting.nav_impact.toLocaleString("en-US")}.`,
            navImpact: `NAV moved from ${before.nav.toLocaleString("en-US", { maximumFractionDigits: 2 })} to ${after.nav.toLocaleString("en-US", { maximumFractionDigits: 2 })}.`,
            recommendedAction: "Review General Ledger, Trial Balance, P&L, Balance Sheet and NAV Package before NAV release.",
            relatedEntries: ["Workflow Approval Queue", "General Ledger", "Trial Balance", "P&L Statement", "NAV Package"],
          },
        };
      }),
      processUpload: (module, sourceType, file) => set((s) => {
        const lines = file.text.trim().split(/\r?\n/).filter(Boolean);
        const extension = file.name.split(".").pop()?.toLowerCase();
        const isSupported = extension === "csv" || extension === "json" || extension === "xlsx";
        const rowCount = extension === "json" ? Math.max(1, (file.text.match(/\{/g) ?? []).length - 1) : Math.max(0, lines.length - 1);
        const issues: ValidationIssue[] = [];
        if (!isSupported) issues.push({ id: crypto.randomUUID(), severity: "Critical", message: "Unsupported file type", recommendedAction: "Reject upload and request CSV, XLSX or JSON" });
        if (rowCount === 0) issues.push({ id: crypto.randomUUID(), severity: "Critical", message: "No data rows detected", recommendedAction: "Reject upload and request populated template" });
        if (extension === "xlsx") issues.push({ id: crypto.randomUUID(), severity: "Info", message: "XLSX accepted in simulation mode using metadata-only validation", recommendedAction: "Preview workbook tabs before posting" });
        if (file.text.toLowerCase().includes("duplicate")) issues.push({ id: crypto.randomUUID(), severity: "Warning", field: "record_id", message: "Potential duplicate record detected", recommendedAction: "Review duplicate and select reject, partial accept or override" });
        if (module === "pricing" && file.text.toLowerCase().includes("stale")) issues.push({ id: crypto.randomUUID(), severity: "Warning", field: "price_date", message: "Stale pricing date detected", recommendedAction: "Route item to price challenge workflow" });
        if (module === "cashRecon" && file.text.toLowerCase().includes("unmatched")) issues.push({ id: crypto.randomUUID(), severity: "Warning", field: "cash_amount", message: "Unmatched cash movement detected", recommendedAction: "Generate timing-difference break and assign Treasury" });
        const rejectedRows = issues.filter((i) => i.severity === "Critical").length;
        const warnings = issues.filter((i) => i.severity === "Warning").length;
        const upload: UploadBatch = {
          id: `UPL-${Math.floor(1000 + Math.random() * 9000)}`,
          module,
          sourceType,
          fileName: file.name,
          uploadedBy: "Current User",
          timestamp: new Date().toISOString(),
          processingStatus: rejectedRows ? "Rejected" : warnings ? "Partially Accepted" : "Validated",
          validationStatus: rejectedRows ? "Critical" : warnings ? "Warnings" : "Clean",
          rowCount,
          rejectedRows,
          duplicateRecords: file.text.toLowerCase().includes("duplicate") ? 1 : 0,
          warnings,
          issues,
        };
        const generatedBreak: BreakItem | null = warnings || rejectedRows ? {
          id: `BRK-${Math.floor(2000 + Math.random() * 7000)}`,
          breakType: module === "cashRecon" ? "Cash" : module === "positionRecon" ? "Position" : module === "pricing" ? "Pricing" : module === "corporateActions" ? "Corporate Action" : module === "trades" ? "Trade Settlement" : module === "security" ? "Pricing" : "NAV Variance" as BreakItem["breakType"],
          severity: rejectedRows ? "High" : "Medium",
          aging: 0,
          owner: module === "pricing" ? "Valuations" : module === "cashRecon" ? "Treasury" : "Ops L2",
          navImpact: warnings ? rowCount * 1250 : rowCount * 5000,
          rootCause: `${sourceType} validation generated ${warnings + rejectedRows} issue(s)`,
          status: "Open",
          resolutionNotes: "System-generated from upload validation",
          escalationLevel: rejectedRows ? "L2" : "L1",
          comments: [`Created from ${file.name}`],
          slaHours: rejectedRows ? 8 : 24,
        } : null;
        return {
          uploads: [upload, ...s.uploads].slice(0, 50),
          breaks: generatedBreak ? [generatedBreak, ...s.breaks] : s.breaks,
          impactedModules: [module as ModuleId, "reconBreaks", "exceptions", "audit", "ops", "nav"],
          flashed: { [`upload-${module}`]: rejectedRows ? "down" : "up" },
          auditTrail: [audit(`Upload ${file.name}`, "New file", upload.processingStatus, [module as ModuleId, "reconBreaks", "audit", "ops"], "File ingestion and validation"), ...s.auditTrail].slice(0, 100),
          copilotContext: {
            tab: module as ModuleId,
            title: `${sourceType} uploaded`,
            summary: `${file.name} processed with ${rowCount} rows, ${warnings} warning(s), ${rejectedRows} rejected row(s).`,
            accountingImpact: generatedBreak ? "A break was generated and will remain outside NAV approval until resolved or approved." : "No blocking accounting issue was detected.",
            navImpact: generatedBreak ? `Estimated NAV impact ${generatedBreak.navImpact.toLocaleString("en-US")}.` : "No material NAV impact detected.",
            recommendedAction: rejectedRows ? "Reject or partially accept with approval; review error log first." : warnings ? "Review validation warnings, assign owner, and approve partial acceptance if immaterial." : "Post the upload and proceed to downstream review.",
          },
        };
      }),
      toggleLearningMode: () => set((s) => ({ learningMode: !s.learningMode, aiPanelOpen: true })),
      setTrainingMode: (trainingMode) => set((s) => ({
        trainingMode,
        learningMode: trainingMode === "Sandbox",
        aiPanelOpen: trainingMode === "Sandbox" ? true : s.aiPanelOpen,
        auditTrail: [audit("Operating mode", s.trainingMode, trainingMode, ["scenario", "aiCopilot", "audit"], "Mode switch"), ...s.auditTrail].slice(0, 100),
      })),
      setSandboxRole: (sandboxRole) => set((s) => ({
        sandboxRole,
        impactedModules: ["sandboxCommand", "workflow", "exceptions", "audit"],
        auditTrail: [audit("Sandbox role", s.sandboxRole, sandboxRole, ["sandboxCommand", "workflow", "audit"], "Sandbox role selection"), ...s.auditTrail].slice(0, 100),
      })),
      setSandboxTrack: (sandboxTrack) => set((s) => ({
        sandboxTrack,
        impactedModules: ["sandboxCommand", "scenario", "exceptions", "audit"],
        auditTrail: [audit("Sandbox track", s.sandboxTrack, sandboxTrack, ["sandboxCommand", "scenario", "audit"], "Sandbox track selection"), ...s.auditTrail].slice(0, 100),
      })),
      triggerSandboxTimeEvent: (event) => set((s) => {
        const minutes = event.includes("Cutoff") ? 42 : event.includes("Month-End") ? 75 : event.includes("Investor") ? 48 : 25;
        const generatedBreak: BreakItem = {
          id: `TIME-${Math.floor(1000 + Math.random() * 9000)}`,
          breakType: event.includes("Investor") ? "NAV Variance" : "Trade Settlement",
          severity: event.includes("Escalation") ? "Critical" : "High",
          aging: event.includes("T+1") ? 1 : 0,
          owner: event.includes("Investor") ? "Transfer Agency" : "NAV Control",
          navImpact: event.includes("Escalation") ? 1_250_000 : 420_000,
          rootCause: `${event} triggered sandbox operational pressure.`,
          status: "Open",
          resolutionNotes: "Sandbox time-machine event. Investigate using real workflow tabs.",
          escalationLevel: event.includes("Escalation") ? "L3" : "L2",
          comments: [`${event} triggered from Sandbox Command Center`],
          slaHours: Math.max(1, Math.round(minutes / 60)),
        };
        return {
          sandboxTimeEvent: event,
          sandboxSlaMinutes: minutes,
          breaks: [generatedBreak, ...s.breaks],
          impactedModules: ["sandboxCommand", "reconBreaks", "exceptions", "workflow", "nav", "audit"],
          flashed: { sandbox: "down", scenario: "down" },
          auditTrail: [audit("Sandbox time machine", s.sandboxTimeEvent, event, ["sandboxCommand", "reconBreaks", "workflow", "nav", "audit"], "Sandbox time pressure"), ...s.auditTrail].slice(0, 100),
          copilotContext: {
            tab: "sandboxCommand",
            title: event,
            summary: "Sandbox time pressure was injected into the live operational screens. Trainee must investigate breaks, workflow blockers, NAV readiness and evidence.",
            accountingImpact: "No artificial quiz layer was created; the event appears through breaks, workflow status, NAV controls and audit trail.",
            navImpact: `A simulated operational risk item with ${generatedBreak.navImpact.toLocaleString("en-US")} NAV impact was added.`,
            recommendedAction: "Navigate to Reconciliation Breaks, Workflow Approval Queue, NAV Package and Audit Trail to clear the issue.",
            relatedEntries: ["Sandbox Command Center", "Reconciliation Breaks", "Workflow Approval Queue", "NAV Package"],
          },
        };
      }),
      toggleManualEditMode: () => set((s) => ({
        manualEditMode: !s.manualEditMode,
        auditTrail: [audit("Manual data edit mode", s.manualEditMode ? "Enabled" : "Disabled", !s.manualEditMode ? "Enabled" : "Disabled", ["editableFields", "audit"], "Manual data control"), ...s.auditTrail].slice(0, 100),
      })),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      explainContext: (copilotContext) => set((s) => ({ copilotContext, aiPanelOpen: true, auditTrail: [audit("AI explanation", "Context selected", copilotContext.title, ["audit", copilotContext.tab], "AI-assisted action"), ...s.auditTrail].slice(0, 100) })),
      setFee: (kind, value) => set((s) => ({
        manualBaseline: s.manualBaseline ?? createImpactSnapshot(s),
        [kind === "management" ? "managementFeePct" : "performanceFeePct"]: value,
        impactedModules: impacts.fee,
        flashed: { [`fee-${kind}`]: "up" },
        auditTrail: [audit(`${kind} fee pct`, kind === "management" ? s.managementFeePct : s.performanceFeePct, value, impacts.fee, "Fee engine update"), ...s.auditTrail].slice(0, 100),
      })),
      submitManualUpdates: (label, fields) => set((s) => {
        const before = s.manualBaseline ?? createImpactSnapshot(s);
        const after = createImpactSnapshot(s);
        const navDelta = after.nav - before.nav;
        const pnlDelta = after.pnl - before.pnl;
        const cashDelta = after.cash - before.cash;
        const investorDelta = after.investorCapital - before.investorCapital;
        const impactedModules: ModuleId[] = s.impactedModules.length
          ? s.impactedModules
          : ["editableFields", "gl", "trialBalance", "pl", "balanceSheet", "nav", "capital", "audit", "ops"];
        return {
          activeScenarioImpact: { before, after },
          manualBaseline: after,
          impactedModules,
          flashed: { ...s.flashed, "manual-submit": navDelta >= 0 ? "up" : "down", nav: navDelta >= 0 ? "up" : "down" },
          auditTrail: [audit(
            `Manual submit: ${label}`,
            `NAV ${before.nav.toLocaleString("en-US")}`,
            `NAV ${after.nav.toLocaleString("en-US")}`,
            impactedModules,
            "Submitted manual update",
          ), ...s.auditTrail].slice(0, 100),
          copilotContext: {
            tab: s.activeModule,
            title: `${label} submitted`,
            summary: `${fields} were submitted through the manual update control. The recalculation engine refreshed NAV, NAV/share, GL, P&L, balance sheet, investor allocation, materiality and dependency flow.`,
            accountingImpact: `P&L moved by ${pnlDelta.toLocaleString("en-US", { maximumFractionDigits: 2 })}; cash/capital movement is ${cashDelta.toLocaleString("en-US", { maximumFractionDigits: 2 })}; investor capital movement is ${investorDelta.toLocaleString("en-US", { maximumFractionDigits: 2 })}.`,
            navImpact: `NAV moved from ${before.nav.toLocaleString("en-US", { maximumFractionDigits: 2 })} to ${after.nav.toLocaleString("en-US", { maximumFractionDigits: 2 })}, a delta of ${navDelta.toLocaleString("en-US", { maximumFractionDigits: 2 })}.`,
            recommendedAction: "Review Impact Summary, dependency flow, materiality status and maker-checker approval before NAV release.",
            relatedEntries: impactedModules.map((module) => module),
          },
        };
      }),
      applyScenario: (scenario) => set((s) => {
        const definition = scenarioCatalog.find((item) => item.id === scenario || item.scenarioName === scenario)
          ?? scenarioCatalog.find((item) => item.scenarioName.toLowerCase().includes(scenario.toLowerCase()))
          ?? scenarioCatalog[0];
        const before = createImpactSnapshot(s);
        const effect = applyScenarioEffect(s, definition);
        const nextState = { ...s, ...effect };
        const after = createImpactSnapshot(nextState);
        const run: ScenarioRun = {
          id: `RUN-${Math.floor(1000 + Math.random() * 9000)}`,
          scenarioId: definition.id,
          scenarioName: definition.scenarioName,
          module: definition.module,
          trainingMode: s.trainingMode,
          status: "Active",
          startedAt: new Date().toISOString(),
          score: 0,
          before,
          after,
          evaluationNotes: ["Scenario started. Investigate source change, failed control, NAV impact and expected resolution."],
        };
        return {
          ...effect,
          activeScenarioId: definition.id,
          activeScenarioImpact: { before, after },
          manualBaseline: null,
          scenarioRuns: [run, ...s.scenarioRuns].slice(0, 40),
          impactedModules: ["stress", "scenario", "holdings", "fx", "otc", "gl", "trialBalance", "pl", "balanceSheet", "nav", "exceptions", "risk", "audit"],
          flashed: { scenario: "down" },
          auditTrail: [audit(`Scenario ${definition.scenarioName}`, "Base case", "Applied", ["stress", "scenario", "nav", "risk", "audit"], "Scenario simulation"), ...s.auditTrail].slice(0, 100),
          copilotContext: {
            tab: definition.module,
            title: definition.scenarioName,
            summary: `${definition.businessContext} Learner task: ${definition.learnerTask}`,
            accountingImpact: definition.expectedGLImpact,
            navImpact: `${definition.expectedNAVImpact} Before NAV ${before.nav.toLocaleString("en-US")} / after NAV ${after.nav.toLocaleString("en-US")}.`,
            recommendedAction: definition.expectedResolution,
            relatedEntries: definition.affectedTables,
          },
        };
      }),
      submitScenario: (learnerResponse) => set((s) => {
        const active = s.scenarioRuns.find((run) => run.scenarioId === s.activeScenarioId && run.status === "Active");
        if (!active) return {};
        const definition = scenarioCatalog.find((item) => item.id === active.scenarioId);
        const response = learnerResponse.toLowerCase();
        const checks = [
          response.includes("nav"),
          response.includes("break") || response.includes("recon") || response.includes("exception"),
          response.includes("gl") || response.includes("journal") || response.includes("account"),
          response.includes("approve") || response.includes("evidence") || response.includes("control"),
        ];
        const score = checks.filter(Boolean).length / checks.length * (definition?.scoreWeightage ?? 20);
        const status = score >= (definition?.scoreWeightage ?? 20) * 0.75 ? "Passed" : "Needs Review";
        return {
          learnerScore: Math.round(s.learnerScore + score),
          scenarioRuns: s.scenarioRuns.map((run) => run.id === active.id ? {
            ...run,
            status,
            completedAt: new Date().toISOString(),
            score: Math.round(score),
            learnerResponse,
            evaluationNotes: status === "Passed"
              ? ["Good investigation. You covered NAV/accounting controls and operational resolution."]
              : ["Needs review. Include source table, NAV impact, failed control, GL treatment and approval evidence."],
          } : run),
          auditTrail: [audit(`Scenario submission ${active.scenarioName}`, "Active", status, ["scenario", "workflow", "audit"], "Scenario learner evaluation"), ...s.auditTrail].slice(0, 100),
        };
      }),
      resetScenario: () => set((s) => ({
        holdings: sampleHoldings,
        fundSetup: sampleFundSetup,
        securityMaster: sampleSecurityMaster,
        corporateActions: sampleCorporateActions,
        cashRecon: sampleCashRecon,
        positionRecon: samplePositionRecon,
        breaks: sampleBreaks,
        uploads: sampleUploads,
        trades: sampleTrades,
        fxRates: sampleFx,
        investors: sampleInvestors,
        activities: sampleActivities,
        accruals: sampleAccruals,
        derivatives: sampleDerivatives,
        activeScenarioId: null,
        activeScenarioImpact: null,
        manualBaseline: null,
        impactedModules: ["scenario", "dashboard", "nav", "audit"],
        flashed: { scenario: "up" },
        scenarioRuns: s.scenarioRuns.map((run) => run.status === "Active" ? { ...run, status: "Reset", completedAt: new Date().toISOString() } : run),
        auditTrail: [audit("Scenario reset", "Scenario case", "Base book restored", ["scenario", "dashboard", "nav", "audit"], "Scenario reset"), ...s.auditTrail].slice(0, 100),
      })),
      setFundMode: (fundMode) => set((s) => ({
        fundMode,
        impactedModules: ["dashboard", "holdings", "risk", "scenario"],
        auditTrail: [audit("Simulation mode", s.fundMode, fundMode, ["dashboard", "holdings", "risk", "scenario"], "Preset changed"), ...s.auditTrail].slice(0, 100),
      })),
      reset: () => set((s) => {
        const before = createImpactSnapshot(s);
        const resetState = {
          holdings: sampleHoldings,
          fundSetup: sampleFundSetup,
          securityMaster: sampleSecurityMaster,
          corporateActions: sampleCorporateActions,
          cashRecon: sampleCashRecon,
          positionRecon: samplePositionRecon,
          breaks: sampleBreaks,
          uploads: sampleUploads,
          trades: sampleTrades,
          fxRates: sampleFx,
          investors: sampleInvestors,
          activities: sampleActivities,
          accruals: sampleAccruals,
          derivatives: sampleDerivatives,
          backendGlPostings: [],
          backendNavAdjustments: 0,
          managementFeePct: 0.015,
          performanceFeePct: 0.2,
        };
        const after = createImpactSnapshot({ ...s, ...resetState });
        return {
          ...resetState,
          activeScenarioImpact: { before, after },
          manualBaseline: after,
          auditTrail: [audit("Reset book", `NAV ${before.nav.toLocaleString("en-US")}`, `NAV ${after.nav.toLocaleString("en-US")}`, ["dashboard", "nav", "audit", "ops"], "Reset to expanded practice dataset")],
          flashed: { reset: "up", nav: after.nav >= before.nav ? "up" : "down" },
          impactedModules: ["dashboard", "holdings", "cashRecon", "positionRecon", "reconBreaks", "nav", "audit", "ops"],
          copilotContext: {
            tab: s.activeModule,
            title: "Book reset to practice baseline",
            summary: "The simulator reloaded the expanded institutional practice book and restored prior figures across holdings, trades, recon, investors, pricing, breaks and uploads.",
            accountingImpact: "GL, trial balance, P&L, balance sheet and investor allocation have been recalculated from the reset source data.",
            navImpact: `NAV moved from ${before.nav.toLocaleString("en-US", { maximumFractionDigits: 2 })} to ${after.nav.toLocaleString("en-US", { maximumFractionDigits: 2 })}.`,
            recommendedAction: "Use the reset baseline as the control book, then amend values and submit manual updates to compare impact.",
            relatedEntries: ["Reset book", "Expanded practice data", "Impact Summary", "Audit Trail"],
          },
        };
      }),
    }),
    { name: "syed-fund-simulator-v2", storage: createJSONStorage(() => idbStorage) },
  ),
);

export const useRecalc = () => {
  const s = useFundStore();
  return recalculate({
    ...s,
    manualJournalEntries: s.backendGlPostings,
    manualNavAdjustments: s.backendNavAdjustments,
  });
};
