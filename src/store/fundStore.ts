import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set } from "idb-keyval";
import { sampleAccruals, sampleActivities, sampleBreaks, sampleCashRecon, sampleCorporateActions, sampleDerivatives, sampleFundSetup, sampleFx, sampleHoldings, sampleInvestors, samplePositionRecon, sampleSecurityMaster, sampleTrades, sampleUploads } from "../data/sampleData";
import { recalculate } from "../engine/recalc";
import { AuditEvent, BreakItem, CapitalActivity, CashReconRow, CopilotContext, CorporateAction, Derivative, FundSetup, FxRate, Holding, Investor, ModuleId, PositionReconRow, SecurityMaster, Trade, UploadBatch, UploadModule, ValidationIssue } from "../types";

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
  aiPanelOpen: boolean;
  copilotContext: CopilotContext | null;
  trades: Trade[];
  fxRates: FxRate[];
  investors: Investor[];
  activities: CapitalActivity[];
  accruals: typeof sampleAccruals;
  derivatives: Derivative[];
  managementFeePct: number;
  performanceFeePct: number;
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
  updateFundSetup: (field: keyof FundSetup, value: string | number | boolean) => void;
  updateBreak: (id: string, field: keyof BreakItem, value: string | number) => void;
  updateWorkflow: (status: FundSetup["workflowStatus"]) => void;
  processUpload: (module: UploadModule, sourceType: string, file: { name: string; text: string }) => void;
  toggleLearningMode: () => void;
  setAiPanelOpen: (open: boolean) => void;
  explainContext: (context: CopilotContext) => void;
  setFee: (kind: "management" | "performance", value: number) => void;
  applyScenario: (scenario: string) => void;
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
      aiPanelOpen: true,
      copilotContext: null,
      trades: sampleTrades,
      fxRates: sampleFx,
      investors: sampleInvestors,
      activities: sampleActivities,
      accruals: sampleAccruals,
      derivatives: sampleDerivatives,
      managementFeePct: 0.015,
      performanceFeePct: 0.2,
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
          holdings: s.holdings.map((h) => h.id === id ? { ...h, [field]: nextValue } : h),
          impactedModules: impacts.holding,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Holding ${id}.${String(field)}`, old, nextValue, impacts.holding), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateFx: (pair, value) => set((s) => {
        const old = s.fxRates.find((fx) => fx.pair === pair)?.rate;
        return {
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
          trades: s.trades.map((t) => t.id === id ? { ...t, [field]: nextValue } : t),
          impactedModules: impacts.trade,
          flashed: { [`${id}-${String(field)}`]: Number(nextValue) >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Trade ${id}.${String(field)}`, old, nextValue, impacts.trade, "Trade amendment"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateInvestor: (id, field, value) => set((s) => {
        const old = s.investors.find((i) => i.id === id)?.[field];
        return {
          investors: s.investors.map((i) => i.id === id ? { ...i, [field]: value } : i),
          impactedModules: impacts.investor,
          flashed: { [`${id}-${String(field)}`]: value >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Investor ${id}.${String(field)}`, old, value, impacts.investor), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateDerivative: (id, field, value) => set((s) => {
        const old = s.derivatives.find((d) => d.id === id)?.[field];
        return {
          derivatives: s.derivatives.map((d) => d.id === id ? { ...d, [field]: value } : d),
          impactedModules: impacts.derivative,
          flashed: { [`${id}-${String(field)}`]: value >= Number(old ?? 0) ? "up" : "down" },
          auditTrail: [audit(`Derivative ${id}.${String(field)}`, old, value, impacts.derivative, "MTM override"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateFundSetup: (field, value) => set((s) => {
        const old = s.fundSetup[field];
        const numericFields = ["managementFeePct", "performanceFeePct", "hurdleRate"] as Array<keyof FundSetup>;
        const nextValue = numericFields.includes(field) ? Number(value) : value;
        return {
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
          breaks: s.breaks.map((b) => b.id === id ? { ...b, [field]: field === "aging" || field === "navImpact" || field === "slaHours" ? Number(value) : value } : b),
          impactedModules: impacts.break,
          flashed: { [`${id}-${String(field)}`]: "up" },
          auditTrail: [audit(`Break ${id}.${String(field)}`, old, value, impacts.break, "Break workflow update"), ...s.auditTrail].slice(0, 100),
        };
      }),
      updateWorkflow: (status) => set((s) => ({
        fundSetup: { ...s.fundSetup, workflowStatus: status },
        impactedModules: ["workflow", "nav", "audit", "ops"],
        flashed: { workflow: "up" },
        auditTrail: [audit("NAV workflow status", s.fundSetup.workflowStatus, status, ["workflow", "nav", "audit", "ops"], "Maker-checker workflow"), ...s.auditTrail].slice(0, 100),
      })),
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
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      explainContext: (copilotContext) => set((s) => ({ copilotContext, aiPanelOpen: true, auditTrail: [audit("AI explanation", "Context selected", copilotContext.title, ["audit", copilotContext.tab], "AI-assisted action"), ...s.auditTrail].slice(0, 100) })),
      setFee: (kind, value) => set((s) => ({
        [kind === "management" ? "managementFeePct" : "performanceFeePct"]: value,
        impactedModules: impacts.fee,
        flashed: { [`fee-${kind}`]: "up" },
        auditTrail: [audit(`${kind} fee pct`, kind === "management" ? s.managementFeePct : s.performanceFeePct, value, impacts.fee, "Fee engine update"), ...s.auditTrail].slice(0, 100),
      })),
      applyScenario: (scenario) => set((s) => {
        let holdings = s.holdings;
        let fxRates = s.fxRates;
        let derivatives = s.derivatives;
        let activities = s.activities;
        if (scenario === "Market Crash") holdings = holdings.map((h) => ({ ...h, priorPrice: h.marketPrice, marketPrice: h.assetType === "Option" ? h.marketPrice * 1.45 : h.marketPrice * 0.88 }));
        if (scenario === "FX Shock") fxRates = fxRates.map((fx) => ({ ...fx, priorRate: fx.rate, rate: fx.base === "JPY" || fx.base === "INR" ? fx.rate * 0.94 : fx.rate * 1.06 }));
        if (scenario === "Redemption Run") activities = [...activities, { id: crypto.randomUUID(), investorId: "i2", date: "2026-05-09", type: "Redemption", amount: 7500000, status: "Pending" }];
        if (scenario === "Rate Hike") derivatives = derivatives.map((d) => ({ ...d, mtm: d.type === "IRS" ? d.mtm - 1250000 : d.mtm - 120000 }));
        if (scenario === "Counterparty Default") derivatives = derivatives.map((d) => d.counterparty === "Barclays" ? { ...d, collateral: d.collateral * 0.35, mtm: d.mtm - 900000 } : d);
        return {
          holdings,
          fxRates,
          derivatives,
          activities,
          impactedModules: ["stress", "scenario", "holdings", "fx", "otc", "gl", "trialBalance", "pl", "balanceSheet", "nav", "exceptions", "risk", "audit"],
          flashed: { scenario: "down" },
          auditTrail: [audit(`Scenario ${scenario}`, "Base case", "Applied", ["stress", "scenario", "nav", "risk", "audit"], "Scenario simulation"), ...s.auditTrail].slice(0, 100),
        };
      }),
      setFundMode: (fundMode) => set((s) => ({
        fundMode,
        impactedModules: ["dashboard", "holdings", "risk", "scenario"],
        auditTrail: [audit("Simulation mode", s.fundMode, fundMode, ["dashboard", "holdings", "risk", "scenario"], "Preset changed"), ...s.auditTrail].slice(0, 100),
      })),
      reset: () => set({
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
        managementFeePct: 0.015,
        performanceFeePct: 0.2,
        auditTrail: [],
        flashed: {},
        impactedModules: [],
      }),
    }),
    { name: "syed-fund-simulator-v1", storage: createJSONStorage(() => idbStorage) },
  ),
);

export const useRecalc = () => {
  const s = useFundStore();
  return recalculate(s);
};
