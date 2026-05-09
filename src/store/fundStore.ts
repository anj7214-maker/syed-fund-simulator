import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set } from "idb-keyval";
import { sampleAccruals, sampleActivities, sampleDerivatives, sampleFx, sampleHoldings, sampleInvestors, sampleTrades } from "../data/sampleData";
import { recalculate } from "../engine/recalc";
import { AuditEvent, CapitalActivity, Derivative, FxRate, Holding, Investor, ModuleId, Trade } from "../types";

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
};

interface FundState {
  activeModule: ModuleId;
  collapsed: boolean;
  fundMode: string;
  holdings: Holding[];
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
