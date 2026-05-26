import { AnimatePresence, motion } from "framer-motion";
import { SignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Activity, AlertTriangle, Banknote, BookOpenCheck, Bot, Brain, Calculator, ChevronRight, Download, FileDown, FileSpreadsheet, Gauge, GitBranch, Landmark, LineChart as LineIcon, LockKeyhole, MessageSquare, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, ShieldAlert, Sigma, SlidersHorizontal, TrendingDown, TrendingUp, UploadCloud, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFundStore, useRecalc } from "./store/fundStore";
import type { FundState } from "./store/fundStore";
import { scenarioCatalog, scenariosForModule } from "./engine/scenarioEngine";
import { CopilotContext, ModuleId, ScenarioDefinition, UploadModule } from "./types";
import { institutionalApi } from "./services/institutionalApi";

const modules: Array<{ id: ModuleId; label: string; icon: typeof Activity }> = [
  { id: "dashboard", label: "Executive Dashboard", icon: Gauge },
  { id: "sandboxCommand", label: "Sandbox Command Center", icon: Brain },
  { id: "aiCopilot", label: "AI Copilot", icon: Bot },
  { id: "fund", label: "Fund Master Setup", icon: Landmark },
  { id: "structureComparison", label: "Fund Structure Comparison", icon: GitBranch },
  { id: "holdings", label: "Portfolio Holdings", icon: FileSpreadsheet },
  { id: "trades", label: "Trade Blotter", icon: BookOpenCheck },
  { id: "security", label: "Security Master", icon: Search },
  { id: "editableFields", label: "Editable Fields & Controls", icon: SlidersHorizontal },
  { id: "pricing", label: "Pricing Engine", icon: SlidersHorizontal },
  { id: "fx", label: "FX Rates", icon: RefreshCw },
  { id: "cashRecon", label: "Cash Reconciliation", icon: Banknote },
  { id: "positionRecon", label: "Position Reconciliation", icon: GitBranch },
  { id: "reconBreaks", label: "Reconciliation Breaks", icon: AlertTriangle },
  { id: "corporateActions", label: "Corporate Actions", icon: Activity },
  { id: "dividends", label: "Dividend Accruals", icon: TrendingUp },
  { id: "coupons", label: "Coupon Accruals", icon: LineIcon },
  { id: "otc", label: "OTC Derivatives", icon: Sigma },
  { id: "mtm", label: "Swaps & Futures MTM", icon: Calculator },
  { id: "gl", label: "General Ledger", icon: BookOpenCheck },
  { id: "trialBalance", label: "Trial Balance", icon: ShieldAlert },
  { id: "pl", label: "P&L Statement", icon: TrendingUp },
  { id: "balanceSheet", label: "Balance Sheet", icon: Landmark },
  { id: "nav", label: "NAV Package", icon: Calculator },
  { id: "capital", label: "Investor Capital Activity", icon: Users },
  { id: "subsReds", label: "Subscriptions & Redemptions", icon: Banknote },
  { id: "mgmtFees", label: "Management Fee Engine", icon: Calculator },
  { id: "perfFees", label: "Performance Fee Engine", icon: TrendingUp },
  { id: "equalization", label: "Equalization Accounting", icon: Sigma },
  { id: "waterfall", label: "Waterfall Allocation", icon: ChevronRight },
  { id: "expenses", label: "Expense Allocation", icon: TrendingDown },
  { id: "audit", label: "Audit Trail", icon: LockKeyhole },
  { id: "exceptions", label: "Exception Management", icon: AlertTriangle },
  { id: "risk", label: "Risk & Exposure", icon: Gauge },
  { id: "stress", label: "Stress Testing", icon: TrendingDown },
  { id: "scenario", label: "Scenario Simulation", icon: SlidersHorizontal },
  { id: "investorReporting", label: "Investor Reporting", icon: Users },
  { id: "exports", label: "Financial Statements Export", icon: Download },
  { id: "workflow", label: "Workflow Approval Queue", icon: BookOpenCheck },
  { id: "ops", label: "Operations Control Dashboard", icon: Activity },
  { id: "taOversight", label: "Transfer Agency Oversight", icon: Users },
  { id: "middleOfficeOversight", label: "Middle Office NAV & Risk Oversight", icon: Gauge },
  { id: "backOfficeOversight", label: "Back Office Operational Control Center", icon: ShieldAlert },
];

type NavGroup = {
  title: string;
  subtitle: string;
  icon: typeof Activity;
  modules: ModuleId[];
};

const navGroups: NavGroup[] = [
  { title: "Executive Control Room", subtitle: "NAV release, blockers, operating health", icon: Gauge, modules: ["dashboard", "ops"] },
  { title: "Sandbox Command Center", subtitle: "Practice scenarios and guided simulation", icon: Brain, modules: ["sandboxCommand", "scenario"] },
  { title: "Portfolio Operations", subtitle: "Setup, securities, trades, pricing, FX", icon: FileSpreadsheet, modules: ["fund", "structureComparison", "holdings", "trades", "security", "pricing", "fx", "corporateActions", "dividends", "coupons", "otc", "mtm"] },
  { title: "Reconciliation", subtitle: "Cash, positions, breaks, exceptions", icon: GitBranch, modules: ["cashRecon", "positionRecon", "reconBreaks", "exceptions"] },
  { title: "Accounting & NAV", subtitle: "GL, TB, P&L, balance sheet, NAV", icon: Calculator, modules: ["gl", "trialBalance", "pl", "balanceSheet", "nav", "expenses"] },
  { title: "Investor Services", subtitle: "Capital activity, TA, investor reporting", icon: Users, modules: ["capital", "subsReds", "investorReporting", "taOversight"] },
  { title: "Fees & Waterfall", subtitle: "Management, performance, equalization, carry", icon: Sigma, modules: ["mgmtFees", "perfFees", "equalization", "waterfall"] },
  { title: "Risk & Oversight", subtitle: "Risk, stress, middle/back office quality", icon: ShieldAlert, modules: ["risk", "stress", "middleOfficeOversight", "backOfficeOversight"] },
  { title: "Workflow & Audit", subtitle: "Maker-checker, audit, manual controls", icon: BookOpenCheck, modules: ["workflow", "audit", "editableFields"] },
  { title: "Reporting & Export", subtitle: "NAV packs and operations packs", icon: Download, modules: ["exports"] },
  { title: "AI Copilot", subtitle: "Context-aware operations assistant", icon: Bot, modules: ["aiCopilot"] },
];

const moduleById = Object.fromEntries(modules.map((m) => [m.id, m])) as Record<ModuleId, typeof modules[number]>;

const compactMoney = (n: number) => {
  const abs = Math.abs(n);
  const units = [
    { value: 1_000_000_000_000, suffix: "T" },
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];
  const unit = units.find((u) => abs >= u.value);
  const value = !unit ? `$${abs.toFixed(0)}` : `$${(abs / unit.value).toFixed(abs / unit.value >= 100 ? 0 : 2)}${unit.suffix}`;
  return n < 0 ? `(${value})` : value;
};
const fmt = (n: number, compact = false) => compact ? compactMoney(n) : Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(n);
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const num = (n: number) => Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
const openBreakCount = (store: FundState) => store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status)).length;
const materiality = (nav: number, impact = 0) => {
  const ratio = nav ? Math.abs(impact) / Math.abs(nav) : 0;
  if (ratio >= 0.005) return { label: "Critical", tone: "bad" as const, ratio };
  if (ratio >= 0.001) return { label: "Medium", tone: "warn" as const, ratio };
  return { label: "Minor", tone: "good" as const, ratio };
};
const tradeGross = (t: { quantity: number; price: number }) => t.quantity * t.price;
const tradeCashMovement = (t: { side: "Buy" | "Sell"; quantity: number; price: number; fees: number }) => t.side === "Buy" ? -(tradeGross(t) + t.fees) : tradeGross(t) - t.fees;
const tradeCashDebit = (t: { side: "Buy" | "Sell"; quantity: number; price: number; fees: number }) => Math.max(tradeCashMovement(t), 0);
const tradeCashCredit = (t: { side: "Buy" | "Sell"; quantity: number; price: number; fees: number }) => Math.max(-tradeCashMovement(t), 0);

const fundProfitBeforeFees = (r: ReturnType<typeof useRecalc>) =>
  r.realizedGains + r.unrealizedGains + r.dividendIncome + r.interestIncome + r.fxGainLoss - r.adminExpenses - r.brokerFees;

function activityTotals(store: FundState, investorId: string) {
  return store.activities
    .filter((a) => a.investorId === investorId)
    .reduce((acc, a) => {
      if (a.type === "Subscription" && a.status === "Approved") acc.subscriptions += a.amount;
      if (a.type === "Redemption" && a.status !== "Rejected") acc.redemptions += a.amount;
      return acc;
    }, { subscriptions: 0, redemptions: 0 });
}

function investorFeeSchedules(store: FundState, r: ReturnType<typeof useRecalc>) {
  const profitBeforeFees = fundProfitBeforeFees(r);
  const rawMgmt = store.investors.map((i) => {
    const activity = activityTotals(store, i.id);
    const openingCapital = Math.max(i.capital - activity.subscriptions + activity.redemptions, 0);
    const endingBeforeFees = openingCapital + activity.subscriptions - activity.redemptions;
    const feeBasis = (openingCapital + endingBeforeFees) / 2;
    return { investor: i, activity, openingCapital, endingBeforeFees, feeBasis, rawFee: (feeBasis * store.managementFeePct) / 365 };
  });
  const rawMgmtTotal = rawMgmt.reduce((sum, row) => sum + row.rawFee, 0) || 1;
  const managementRows = rawMgmt.map((row) => {
    const grossManagementFee = row.rawFee / rawMgmtTotal * r.managementFee;
    const feeAlreadyPaid = grossManagementFee * 0.35;
    const feePayable = grossManagementFee - feeAlreadyPaid;
    return {
      investor: row.investor,
      investorName: row.investor.name,
      className: row.investor.className,
      openingCapital: row.openingCapital,
      capitalContribution: row.activity.subscriptions,
      redemption: row.activity.redemptions,
      endingCapitalBeforeFees: row.endingBeforeFees,
      feeBasisOption: "Average NAV",
      feeBasis: row.feeBasis,
      managementFeePct: store.managementFeePct,
      grossManagementFee,
      feeAlreadyPaid,
      feePayable,
      feeAccrued: feePayable,
      netCapitalAfterManagementFee: row.endingBeforeFees - grossManagementFee,
    };
  });

  const rawPerf = store.investors.map((i) => {
    const activity = activityTotals(store, i.id);
    const allocation = r.investorCapital ? i.capital / r.investorCapital : 0;
    const openingCapital = Math.max(i.capital - activity.subscriptions + activity.redemptions, 0);
    const endingBeforePerformanceFee = i.capital + allocation * profitBeforeFees;
    const grossProfitLoss = endingBeforePerformanceFee - openingCapital - activity.subscriptions + activity.redemptions;
    const benchmarkReturnPct = 0.04;
    const benchmarkAmount = openingCapital * benchmarkReturnPct;
    const hurdleRatePct = i.hurdleRate || store.fundSetup.hurdleRate || 0.08;
    const hurdleAmount = openingCapital * hurdleRatePct;
    const hwmAmount = i.hwm * i.shares;
    const excessProfit = Math.max(0, grossProfitLoss - Math.max(benchmarkAmount, hurdleAmount, hwmAmount - openingCapital));
    const investorReturnPct = openingCapital ? grossProfitLoss / openingCapital : 0;
    const crystallized = true;
    const reasons = [
      grossProfitLoss <= 0 ? "Negative Return" : "",
      investorReturnPct <= hurdleRatePct ? "Below Hurdle" : "",
      investorReturnPct <= benchmarkReturnPct ? "Below Benchmark" : "",
      endingBeforePerformanceFee <= hwmAmount ? "Below High Water Mark" : "",
      !crystallized ? "Not Crystallized" : "",
    ].filter(Boolean);
    return { investor: i, activity, allocation, openingCapital, endingBeforePerformanceFee, grossProfitLoss, benchmarkReturnPct, benchmarkAmount, hurdleRatePct, hurdleAmount, hwmAmount, excessProfit, investorReturnPct, crystallized, reason: reasons[0] ?? "Eligible", rawFee: reasons.length ? 0 : excessProfit * store.performanceFeePct };
  });
  const rawPerfTotal = rawPerf.reduce((sum, row) => sum + row.rawFee, 0);
  const performanceRows = rawPerf.map((row) => {
    const performanceFeeEarned = rawPerfTotal ? row.rawFee / rawPerfTotal * r.performanceFee : 0;
    const performanceFeePaid = performanceFeeEarned * 0.25;
    const equalizationAdjustment = row.investor.equalizationCredit && row.activity.subscriptions > 0 ? row.investor.equalizationCredit : 0;
    return {
      investor: row.investor,
      investorName: row.investor.name,
      className: row.investor.className,
      openingCapital: row.openingCapital,
      subscriptions: row.activity.subscriptions,
      redemptions: row.activity.redemptions,
      endingCapitalBeforePerformanceFee: row.endingBeforePerformanceFee,
      grossProfitLoss: row.grossProfitLoss,
      investorReturnPct: row.investorReturnPct,
      benchmarkReturnPct: row.benchmarkReturnPct,
      benchmarkAmount: row.benchmarkAmount,
      hurdleRatePct: row.hurdleRatePct,
      hurdleAmount: row.hurdleAmount,
      highWaterMark: row.hwmAmount,
      performanceFeePct: store.performanceFeePct,
      performanceFeeEarned,
      performanceFeePaid,
      performanceFeePayable: performanceFeeEarned - performanceFeePaid,
      equalizationAdjustment,
      netInvestorCapitalAfterPerformanceFee: row.endingBeforePerformanceFee - performanceFeeEarned + equalizationAdjustment,
      eligibility: row.reason === "Eligible" ? "Eligible" : "Not Eligible",
      reason: row.reason === "Eligible" ? "Performance Fee Earned" : `No Performance Fee Earned - ${row.reason}`,
      flag: row.reason,
    };
  });
  return { managementRows, performanceRows, profitBeforeFees };
}

function defaultWaterfallInputs(r: ReturnType<typeof useRecalc>) {
  return {
    totalExitProceeds: Math.max(r.netAssets * 1.12, 1),
    totalLpCapitalContribution: Math.max(r.investorCapital * 0.98, 1),
    totalGpCapitalContribution: Math.max(r.investorCapital * 0.02, 1),
    preferredReturnPct: 0.08,
    gpCatchUpPct: 1,
    lpCarryPct: 0.8,
    gpCarryPct: 0.2,
  };
}

function waterfallEngine(store: FundState, r: ReturnType<typeof useRecalc>, inputs = defaultWaterfallInputs(r)) {
  const totalCapital = inputs.totalLpCapitalContribution + inputs.totalGpCapitalContribution;
  const rocTotal = Math.min(inputs.totalExitProceeds, totalCapital);
  const lpRoc = rocTotal * (inputs.totalLpCapitalContribution / totalCapital);
  const gpRoc = rocTotal - lpRoc;
  let remaining = inputs.totalExitProceeds - rocTotal;
  const preferredReturnAmount = inputs.totalLpCapitalContribution * inputs.preferredReturnPct;
  const lpPreferred = Math.min(remaining, preferredReturnAmount);
  remaining -= lpPreferred;
  const gpCatchUpAmount = Math.min(remaining, lpPreferred * inputs.gpCatchUpPct);
  remaining -= gpCatchUpAmount;
  const lpResidual = remaining * inputs.lpCarryPct;
  const gpResidual = remaining * inputs.gpCarryPct;
  const lpCapitalBase = store.investors.reduce((sum, i) => sum + i.capital, 0) || 1;
  const partnerRows = store.investors.map((i) => {
    const ownership = i.capital / lpCapitalBase;
    const rocReceived = lpRoc * ownership;
    const preferredReturnReceived = lpPreferred * ownership;
    const residualSplitReceived = lpResidual * ownership;
    const totalDistribution = rocReceived + preferredReturnReceived + residualSplitReceived;
    return {
      partnerName: i.name,
      partnerType: "LP",
      capitalContribution: i.capital,
      ownershipPct: ownership,
      rocReceived,
      preferredReturnReceived,
      gpCatchUpReceived: 0,
      residualSplitReceived,
      totalDistribution,
      remainingUnreturnedCapital: Math.max(i.capital - rocReceived, 0),
      moic: i.capital ? totalDistribution / i.capital : 0,
    };
  });
  const gpTotalDistribution = gpRoc + gpCatchUpAmount + gpResidual;
  partnerRows.push({
    partnerName: "General Partner",
    partnerType: "GP",
    capitalContribution: inputs.totalGpCapitalContribution,
    ownershipPct: inputs.totalGpCapitalContribution / totalCapital,
    rocReceived: gpRoc,
    preferredReturnReceived: 0,
    gpCatchUpReceived: gpCatchUpAmount,
    residualSplitReceived: gpResidual,
    totalDistribution: gpTotalDistribution,
    remainingUnreturnedCapital: Math.max(inputs.totalGpCapitalContribution - gpRoc, 0),
    moic: inputs.totalGpCapitalContribution ? gpTotalDistribution / inputs.totalGpCapitalContribution : 0,
  });
  const totalDistributed = partnerRows.reduce((sum, p) => sum + p.totalDistribution, 0);
  return {
    inputs,
    steps: [
      { step: "Step 1 - Return of Capital / ROC", lpAmount: lpRoc, gpAmount: gpRoc, remainingAfterStep: inputs.totalExitProceeds - rocTotal },
      { step: "Step 2 - Preferred Return", lpAmount: lpPreferred, gpAmount: 0, remainingAfterStep: inputs.totalExitProceeds - rocTotal - lpPreferred },
      { step: "Step 3 - GP Catch-Up", lpAmount: 0, gpAmount: gpCatchUpAmount, remainingAfterStep: inputs.totalExitProceeds - rocTotal - lpPreferred - gpCatchUpAmount },
      { step: "Step 4 - Residual 80/20 Split", lpAmount: lpResidual, gpAmount: gpResidual, remainingAfterStep: 0 },
    ],
    partnerRows,
    totalDistributed,
    controlStatus: Math.abs(totalDistributed - inputs.totalExitProceeds) < 1 ? "Pass" : "Exception",
  };
}

function navMovementBridgeRows(store: FundState, r: ReturnType<typeof useRecalc>) {
  const priorNav = store.activeScenarioImpact?.before.nav ?? r.investorCapital;
  const subs = store.activities.filter((a) => a.type === "Subscription" && a.status === "Approved").reduce((s, a) => s + a.amount, 0);
  const reds = store.activities.filter((a) => a.type === "Redemption" && a.status !== "Rejected").reduce((s, a) => s + a.amount, 0);
  return [
    { Component: "Prior NAV", Amount: priorNav },
    { Component: "Subscriptions", Amount: subs },
    { Component: "Redemptions", Amount: -reds },
    { Component: "Realized Gain/Loss", Amount: r.realizedGains },
    { Component: "Unrealized Gain/Loss", Amount: r.unrealizedGains },
    { Component: "Income", Amount: r.dividendIncome + r.interestIncome },
    { Component: "Expenses", Amount: -(r.adminExpenses + r.brokerFees) },
    { Component: "Management Fees", Amount: -r.managementFee },
    { Component: "Performance Fees", Amount: -r.performanceFee },
    { Component: "FX Impact", Amount: r.fxGainLoss },
    { Component: "Current NAV", Amount: r.netAssets },
  ];
}

const fundStructureOptions = [
  "Standalone Fund",
  "Master-Feeder Structure",
  "Side-by-Side Structure",
  "Fund of Funds (FoF)",
  "Hybrid Fund Structure",
  "Multi-Manager / Multi-Strategy Structure",
];

const normalizedStructure = (value: string) => {
  const text = value.toLowerCase();
  if (text.includes("master")) return "Master-Feeder Structure";
  if (text.includes("side")) return "Side-by-Side Structure";
  if (text.includes("fof") || text.includes("fund of funds")) return "Fund of Funds (FoF)";
  if (text.includes("hybrid")) return "Hybrid Fund Structure";
  if (text.includes("multi-manager") || text.includes("multi-strategy")) return "Multi-Manager / Multi-Strategy Structure";
  return "Standalone Fund";
};

function structureComplexityRows() {
  return [
    { Structure: "Standalone Fund", "NAV Methodology": "Direct portfolio NAV", "Fee Structure": "Fund-level management fee, investor-level incentive fee", "Operational Complexity": "Low", "Investor Allocation Complexity": "Low", "Reporting Complexity": "Low", "Liquidity Profile": "Daily / monthly", "Valuation Frequency": "Daily or monthly", "Reconciliation Complexity": "Single vehicle" },
    { Structure: "Master-Feeder Structure", "NAV Methodology": "Master NAV allocated to feeders", "Fee Structure": "Feeder-specific management and performance fee classes", "Operational Complexity": "High", "Investor Allocation Complexity": "High", "Reporting Complexity": "High", "Liquidity Profile": "Feeder terms differ", "Valuation Frequency": "Master first, feeders second", "Reconciliation Complexity": "Master plus feeder ownership tie-out" },
    { Structure: "Side-by-Side Structure", "NAV Methodology": "Parallel vehicle NAVs", "Fee Structure": "Vehicle-specific fee and hurdle terms", "Operational Complexity": "Medium", "Investor Allocation Complexity": "Medium", "Reporting Complexity": "Medium", "Liquidity Profile": "Vehicle-specific", "Valuation Frequency": "Parallel NAV cycles", "Reconciliation Complexity": "Separate portfolios and cash" },
    { Structure: "Fund of Funds (FoF)", "NAV Methodology": "Underlying fund NAV aggregation", "Fee Structure": "Underlying fees plus FoF overlay fees", "Operational Complexity": "High", "Investor Allocation Complexity": "Medium", "Reporting Complexity": "High", "Liquidity Profile": "Dependent on underlying liquidity", "Valuation Frequency": "Monthly / quarterly", "Reconciliation Complexity": "Capital statements and look-through exposures" },
    { Structure: "Hybrid Fund Structure", "NAV Methodology": "Liquid MTM plus illiquid valuation models", "Fee Structure": "Bucket-level fee and carry rules", "Operational Complexity": "High", "Investor Allocation Complexity": "High", "Reporting Complexity": "High", "Liquidity Profile": "Mixed liquid / illiquid", "Valuation Frequency": "Daily and quarterly", "Reconciliation Complexity": "Pricing, model valuation and capital locks" },
    { Structure: "Multi-Manager / Multi-Strategy Structure", "NAV Methodology": "Strategy and PM sleeve aggregation", "Fee Structure": "Strategy/PM-level incentive allocation", "Operational Complexity": "High", "Investor Allocation Complexity": "Medium", "Reporting Complexity": "High", "Liquidity Profile": "Strategy dependent", "Valuation Frequency": "Daily sleeve NAV", "Reconciliation Complexity": "Sleeve-level P&L, exposure and allocations" },
  ];
}

function structureNavBridgeRows(store: FundState, r: ReturnType<typeof useRecalc>) {
  const structure = normalizedStructure(store.fundSetup.fundStructure);
  const strategyTotal = r.exposures.reduce((sum, e) => sum + e.value, 0) || 1;
  const offshoreCapital = store.investors.filter((i) => i.className.includes("Founder") || i.className.includes("Series")).reduce((sum, i) => sum + i.capital, 0);
  const onshoreCapital = Math.max(r.investorCapital - offshoreCapital, 0);
  const offshorePct = r.investorCapital ? offshoreCapital / r.investorCapital : 0.55;
  const onshorePct = 1 - offshorePct;
  const rowsByStructure: Record<string, ExportRow[]> = {
    "Standalone Fund": [
      { Level: "Standalone Fund", Component: "Direct portfolio NAV", Amount: r.grossAssets, Ownership: 1, Notes: "Single capital pool holds investments directly" },
      { Level: "Standalone Fund", Component: "Liabilities and fees", Amount: -r.liabilities, Ownership: 1, Notes: "Fund-level accruals reduce NAV" },
      { Level: "Standalone Fund", Component: "Investor capital pool", Amount: r.netAssets, Ownership: 1, Notes: "Investor allocations flow directly from fund NAV" },
    ],
    "Master-Feeder Structure": [
      { Level: "Master Fund", Component: "Portfolio NAV", Amount: r.netAssets + r.managementFee + r.performanceFee, Ownership: 1, Notes: "Master books trades, positions and investment P&L" },
      { Level: "Offshore Feeder", Component: "Master ownership allocation", Amount: r.netAssets * offshorePct - r.managementFee * 0.58, Ownership: offshorePct, Notes: "2.00% management fee / 20% performance fee example" },
      { Level: "Onshore Feeder", Component: "Master ownership allocation", Amount: r.netAssets * onshorePct - r.managementFee * 0.42, Ownership: onshorePct, Notes: "1.50% management fee / institutional fee class example" },
      { Level: "Consolidated", Component: "Feeder ownership reconciliation", Amount: r.netAssets, Ownership: 1, Notes: "Feeder NAVs reconcile back to master NAV" },
    ],
    "Side-by-Side Structure": [
      { Level: "Fund A - Institutional Vehicle", Component: "Separate portfolio NAV", Amount: r.netAssets * 0.62, Ownership: 0.62, Notes: "1% management fee / 10% incentive fee" },
      { Level: "Fund B - Retail Vehicle", Component: "Separate portfolio NAV", Amount: r.netAssets * 0.38, Ownership: 0.38, Notes: "2% management fee / 20% incentive fee" },
      { Level: "Comparison", Component: "Return differential", Amount: r.performanceFee * 0.5, Ownership: 0, Notes: "Fee terms create different investor returns" },
    ],
    "Fund of Funds (FoF)": r.exposures.slice(0, 6).map((e, index) => ({
      Level: `Underlying Fund ${index + 1}`,
      Component: e.name,
      Amount: r.netAssets * (e.value / strategyTotal),
      Ownership: e.value / strategyTotal,
      Notes: "Underlying NAV feeds FoF NAV with layered fee impact",
    })),
    "Hybrid Fund Structure": [
      { Level: "Liquid Assets", Component: "Level 1 / 2 daily MTM NAV", Amount: r.holdings.filter((h) => h.assetType !== "Bond").reduce((s, h) => s + Math.abs(h.marketValue), 0), Ownership: 0, Notes: "Daily pricing and live FX translation" },
      { Level: "Illiquid Assets", Component: "Level 3 / model NAV", Amount: r.holdings.filter((h) => h.assetType === "Bond").reduce((s, h) => s + Math.abs(h.marketValue), 0) * 0.18, Ownership: 0, Notes: "Quarterly valuation committee support" },
      { Level: "Consolidated Hybrid NAV", Component: "Liquid plus illiquid NAV", Amount: r.netAssets, Ownership: 1, Notes: "Mixed valuation calendar drives controls" },
    ],
    "Multi-Manager / Multi-Strategy Structure": r.exposures.map((e, index) => ({
      Level: `PM Sleeve ${index + 1}`,
      Component: e.name,
      Amount: r.netAssets * (e.value / strategyTotal),
      Ownership: e.value / strategyTotal,
      Notes: "Strategy NAV, exposure and P&L contribution rolled into consolidated NAV",
    })),
  };
  return rowsByStructure[structure] ?? rowsByStructure["Standalone Fund"];
}

function structureSpecificRows(store: FundState, r: ReturnType<typeof useRecalc>) {
  const structure = normalizedStructure(store.fundSetup.fundStructure);
  const bridge = structureNavBridgeRows(store, r);
  if (structure === "Master-Feeder Structure") {
    return bridge.map((row) => ({ View: row.Level, "NAV / Allocation": row.Amount, "Ownership %": pct(Number(row.Ownership)), "Fee Treatment": row.Notes, "Operational Focus": row.Level === "Master Fund" ? "Portfolio accounting, trading, pricing and P&L" : "Investor capital, feeder expenses and class fees" }));
  }
  if (structure === "Side-by-Side Structure") {
    return bridge.map((row) => ({ Vehicle: row.Level, NAV: row.Amount, "Fee Terms": row.Notes, "Investor Pool": row.Level === "Fund A - Institutional Vehicle" ? "Institutional investors" : "Retail / advisory investors", "Return Comparison": row.Level === "Comparison" ? "Fee drag and hurdle difference" : "Separate NAV and expenses" }));
  }
  if (structure === "Fund of Funds (FoF)") {
    return bridge.map((row) => ({ "Underlying Fund": row.Level, Strategy: row.Component, "Allocation %": pct(Number(row.Ownership)), "Underlying NAV": row.Amount, "Layered Fee Impact": "Underlying management/performance fees plus FoF overlay advisory fee", "Look-through": "Included in aggregated exposure" }));
  }
  if (structure === "Hybrid Fund Structure") {
    return bridge.map((row) => ({ Bucket: row.Level, "NAV Component": row.Component, Amount: row.Amount, "Valuation Method": row.Level === "Illiquid Assets" ? "Model / valuation committee" : "Daily vendor pricing", "Valuation Frequency": row.Level === "Illiquid Assets" ? "Quarterly" : "Daily", "Fee Treatment": row.Level === "Illiquid Assets" ? "Carry / bucket-level fee" : "Liquid strategy management/performance fee" }));
  }
  if (structure === "Multi-Manager / Multi-Strategy Structure") {
    return bridge.map((row) => ({ Sleeve: row.Level, Strategy: row.Component, "Strategy NAV": row.Amount, "Allocation %": pct(Number(row.Ownership)), "PM Incentive": "Sleeve-level performance allocation", "Operational Focus": "PM-level P&L, exposure and risk attribution" }));
  }
  return bridge.map((row) => ({ View: "Standalone Fund View", Component: row.Component, Amount: row.Amount, "Capital Flow": "Investors subscribe directly into fund", "Fee Treatment": "Management fee at fund level, performance fee at investor level", "Reporting": "Single NAV pack and capital statement" }));
}

type ExportValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportValue>;

function csvEscape(value: ExportValue) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsToCsv(rows: ExportRow[]) {
  if (!rows.length) return "No data\n";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}

function downloadCsv(name: string, rows: ExportRow[]) {
  const url = URL.createObjectURL(new Blob([rowsToCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function exportRowsForModule(module: ModuleId, store: FundState, r: ReturnType<typeof useRecalc>): ExportRow[] {
  if (module === "pricing") return r.holdings.map((h) => ({ Ticker: h.ticker, Asset: h.assetType, Source: h.priceSource, Prior: h.priorPrice, Current: h.marketPrice, MovePct: h.priceMovePct, LastUpdate: h.lastPriceTime }));
  if (module === "holdings") return r.holdings.map((h) => ({ ISIN: h.isin, Ticker: h.ticker, Asset: h.assetType, Strategy: h.strategy, Currency: h.currency, Quantity: h.quantity, CostPrice: h.costPrice, MarketPrice: h.marketPrice, FX: h.fxRate, MarketValue: h.marketValue, PricePnL: h.pricePnl, FXPnL: h.fxPnl, UnrealizedPnL: h.totalUnrealizedPnl, ExposurePct: h.exposurePct }));
  if (module === "fx") return store.fxRates.map((fx) => ({ Pair: fx.pair, Base: fx.base, Quote: fx.quote, CurrentRate: fx.rate, PriorRate: fx.priorRate, Source: fx.source }));
  if (module === "trades") return store.trades.map((t) => ({ TradeID: t.id, TradeDate: t.tradeDate, SettleDate: t.settleDate, Broker: t.broker, Side: t.side, Ticker: t.ticker, Quantity: t.quantity, Price: t.price, GrossAmount: tradeGross(t), BrokerFees: t.fees, CashDebit: tradeCashDebit(t), CashCredit: tradeCashCredit(t), SignedCashMovement: tradeCashMovement(t), InvestmentDebit: t.side === "Buy" ? tradeGross(t) : 0, InvestmentCredit: t.side === "Sell" ? tradeGross(t) : 0, Status: t.status }));
  if (module === "mgmtFees") {
    const { managementRows } = investorFeeSchedules(store, r);
    return managementRows.map((row) => ({ Investor: row.investorName, OpeningCapital: row.openingCapital, CapitalContribution: row.capitalContribution, Redemption: row.redemption, FeeBasis: row.feeBasis, ManagementFeePct: row.managementFeePct, GrossManagementFee: row.grossManagementFee, FeeAlreadyPaid: row.feeAlreadyPaid, FeePayable: row.feePayable, FeeAccrued: row.feeAccrued, NetCapitalAfterManagementFee: row.netCapitalAfterManagementFee }));
  }
  if (module === "perfFees") {
    const { performanceRows } = investorFeeSchedules(store, r);
    return performanceRows.map((row) => ({ Investor: row.investorName, OpeningCapital: row.openingCapital, GrossProfitLoss: row.grossProfitLoss, BenchmarkReturnPct: row.benchmarkReturnPct, HurdleRatePct: row.hurdleRatePct, HighWaterMark: row.highWaterMark, PerformanceFeeEarned: row.performanceFeeEarned, PerformanceFeePaid: row.performanceFeePaid, PerformanceFeePayable: row.performanceFeePayable, EqualizationAdjustment: row.equalizationAdjustment, NetCapitalAfterPerformanceFee: row.netInvestorCapitalAfterPerformanceFee, Status: row.reason }));
  }
  if (module === "waterfall") {
    const waterfall = waterfallEngine(store, r);
    return waterfall.partnerRows.map((row) => ({ Partner: row.partnerName, Type: row.partnerType, CapitalContribution: row.capitalContribution, OwnershipPct: row.ownershipPct, ROC: row.rocReceived, PreferredReturn: row.preferredReturnReceived, GPCatchUp: row.gpCatchUpReceived, ResidualSplit: row.residualSplitReceived, TotalDistribution: row.totalDistribution, RemainingUnreturnedCapital: row.remainingUnreturnedCapital, MOIC: row.moic }));
  }
  if (module === "structureComparison") return structureSpecificRows(store, r) as ExportRow[];
  if (["capital", "subsReds", "investorReporting", "equalization", "expenses"].includes(module)) return store.investors.map((i) => ({ Investor: i.name, Class: i.className, Capital: i.capital, Shares: i.shares, HWM: i.hwm, EqualizationCredit: i.equalizationCredit, AllocationPct: r.investorCapital ? i.capital / r.investorCapital * 100 : 0, ManagementFeePct: store.managementFeePct, PerformanceFeePct: store.performanceFeePct }));
  if (["otc", "mtm"].includes(module)) return store.derivatives.map((d) => ({ ID: d.id, Type: d.type, Reference: d.reference, Notional: d.notional, MTM: d.mtm, AccruedInterest: d.accruedInterest, Collateral: d.collateral, Counterparty: d.counterparty }));
  if (module === "cashRecon") return store.cashRecon.map((c) => ({ Currency: c.currency, InternalLedgerCash: c.internalLedgerCash, CustodianCash: c.custodianCash, PrimeBrokerCash: c.primeBrokerCash, Difference: c.internalLedgerCash - c.custodianCash, BreakReason: c.breakReason, Owner: c.owner, Status: c.status }));
  if (module === "positionRecon") return store.positionRecon.map((p) => ({ Ticker: p.ticker, InternalPosition: p.internalPosition, CustodianPosition: p.custodianPosition, PBPosition: p.pbPosition, Difference: p.internalPosition - p.custodianPosition, SettlementStatus: p.settlementStatus, BreakReason: p.breakReason, Owner: p.owner, Status: p.status }));
  if (module === "nav") return [{ GrossAssets: r.grossAssets, Liabilities: r.liabilities, NetAssets: r.netAssets, InvestorCapital: r.investorCapital, SharesOutstanding: r.sharesOutstanding, NavPerShare: r.navPerShare, ManagementFee: r.managementFee, PerformanceFee: r.performanceFee }];
  return store.auditTrail.map((a) => ({ Timestamp: a.timestamp, Field: a.field, OldValue: a.oldValue, NewValue: a.newValue, Action: a.action, ImpactedModules: a.impactedModules.join(" | ") }));
}

function impactReportRows(store: FundState): ExportRow[] {
  const impact = store.activeScenarioImpact;
  if (!impact) return [{ Message: "No submitted manual update or scenario impact is available yet. Edit a value and click Submit Manual Update & Recalculate NAV first." }];
  const latest = store.auditTrail[0];
  return [
    { Metric: "NAV", Previous: impact.before.nav, Current: impact.after.nav, Delta: impact.after.nav - impact.before.nav, LatestAction: latest?.action ?? "" },
    { Metric: "NAV/share", Previous: impact.before.navPerShare, Current: impact.after.navPerShare, Delta: impact.after.navPerShare - impact.before.navPerShare, LatestAction: latest?.field ?? "" },
    { Metric: "P&L", Previous: impact.before.pnl, Current: impact.after.pnl, Delta: impact.after.pnl - impact.before.pnl, LatestAction: latest?.newValue ?? "" },
    { Metric: "Cash", Previous: impact.before.cash, Current: impact.after.cash, Delta: impact.after.cash - impact.before.cash, LatestAction: latest?.oldValue ?? "" },
    { Metric: "Investor Capital", Previous: impact.before.investorCapital, Current: impact.after.investorCapital, Delta: impact.after.investorCapital - impact.before.investorCapital, LatestAction: latest?.impactedModules.join(" | ") ?? "" },
    { Metric: "Open Breaks", Previous: impact.before.openBreaks, Current: impact.after.openBreaks, Delta: impact.after.openBreaks - impact.before.openBreaks, LatestAction: latest?.timestamp ?? "" },
  ];
}

type XlsxCell = ExportValue | { formula: string; result?: ExportValue };
type XlsxSheet = { name: string; rows: XlsxCell[][] };

const xmlEscape = (value: ExportValue) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const columnName = (index: number) => {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
};

function objectRows(title: string, rows: ExportRow[], source = "Live simulator state"): XlsxCell[][] {
  const headers = rows.length ? Object.keys(rows[0]) : ["Message"];
  const dataRows = rows.length ? rows : [{ Message: "No records available" }];
  return [
    [title],
    ["Generated", new Date().toLocaleString(), "Source", source],
    [],
    headers,
    ...dataRows.map((row) => headers.map((header) => row[header])),
  ];
}

function worksheetXml(rows: XlsxCell[][]) {
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 1);
  const cols = `<cols>${Array.from({ length: maxCols }, (_, i) => `<col min="${i + 1}" max="${i + 1}" width="${i === 0 ? 28 : 18}" customWidth="1"/>`).join("")}</cols>`;
  const body = rows.map((row, rIdx) => {
    const cells = row.map((cell, cIdx) => {
      const ref = `${columnName(cIdx)}${rIdx + 1}`;
      const style = rIdx === 0 ? 2 : rIdx === 3 ? 1 : 0;
      if (cell && typeof cell === "object" && "formula" in cell) {
        const result = cell.result ?? 0;
        return `<c r="${ref}" s="${style}"><f>${xmlEscape(cell.formula)}</f><v>${xmlEscape(result)}</v></c>`;
      }
      if (typeof cell === "number") return `<c r="${ref}" s="${style}"><v>${Number.isFinite(cell) ? cell : 0}</v></c>`;
      if (typeof cell === "boolean") return `<c r="${ref}" t="b" s="${style}"><v>${cell ? 1 : 0}</v></c>`;
      return `<c r="${ref}" t="inlineStr" s="${style}"><is><t>${xmlEscape(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rIdx + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/>${cols}<sheetData>${body}</sheetData><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(files: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder();
  const fileParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const write16 = (view: DataView, at: number, value: number) => view.setUint16(at, value, true);
  const write32 = (view: DataView, at: number, value: number) => view.setUint32(at, value, true);
  files.forEach((file) => {
    const name = encoder.encode(file.path);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    write32(lv, 0, 0x04034b50);
    write16(lv, 4, 20);
    write16(lv, 6, 0);
    write16(lv, 8, 0);
    write16(lv, 10, 0);
    write16(lv, 12, 0);
    write32(lv, 14, crc);
    write32(lv, 18, data.length);
    write32(lv, 22, data.length);
    write16(lv, 26, name.length);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    fileParts.push(local);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    write32(cv, 0, 0x02014b50);
    write16(cv, 4, 20);
    write16(cv, 6, 20);
    write16(cv, 8, 0);
    write16(cv, 10, 0);
    write16(cv, 12, 0);
    write16(cv, 14, 0);
    write32(cv, 16, crc);
    write32(cv, 20, data.length);
    write32(cv, 24, data.length);
    write16(cv, 28, name.length);
    write16(cv, 30, 0);
    write16(cv, 32, 0);
    write16(cv, 34, 0);
    write16(cv, 36, 0);
    write32(cv, 38, 0);
    write32(cv, 42, offset);
    central.set(name, 46);
    centralParts.push(central);
    offset += local.length;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  write32(ev, 0, 0x06054b50);
  write16(ev, 8, files.length);
  write16(ev, 10, files.length);
  write32(ev, 12, centralSize);
  write32(ev, 16, offset);
  const blobParts = [...fileParts, ...centralParts, end].map((part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer);
  return new Blob(blobParts, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function downloadXlsx(name: string, sheets: XlsxSheet[]) {
  const safeSheets = sheets.map((sheet, index) => ({
    ...sheet,
    name: sheet.name.slice(0, 31).replace(/[\\/?*[\]:]/g, "_") || `Sheet${index + 1}`,
  }));
  const files: Array<{ path: string; content: string }> = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${safeSheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    },
    { path: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr/><sheets>${safeSheets.map((sheet, i) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`,
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${safeSheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      path: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="$#,##0;($#,##0);-"/></numFmts><fonts count="3"><font><sz val="10"/><color rgb="FF111827"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="14"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17365D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1F33"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF7F8FA6"/></left><right style="thin"><color rgb="FF7F8FA6"/></right><top style="thin"><color rgb="FF7F8FA6"/></top><bottom style="thin"><color rgb="FF7F8FA6"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" numFmtId="164" applyNumberFormat="1"/><xf fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    },
    ...safeSheets.map((sheet, i) => ({ path: `xl/worksheets/sheet${i + 1}.xml`, content: worksheetXml(sheet.rows) })),
  ];
  const url = URL.createObjectURL(makeZip(files));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function linkedNavPackSheets(sheets: XlsxSheet[], r: ReturnType<typeof useRecalc>) {
  return sheets.map((sheet) => ({
    ...sheet,
    rows: [
      ...sheet.rows,
      [],
      ["Workbook Link", { formula: "'36_NAV_Calculation_Working'!B7", result: r.netAssets }, "Current NAV"],
      ["NAV/share Link", { formula: "'36_NAV_Calculation_Working'!B9", result: r.navPerShare }, "Current NAV per share"],
      ["Control Link", { formula: "'39_Control_Checks'!B5", result: "Linked control status" }, "Workbook-level check reference"],
    ],
  }));
}

const editableMatrix = [
  { module: "Portfolio Holdings", fields: "Quantity, Cost Price, Market Price", impact: "Holdings, unrealized P&L, NAV, exposure, balance sheet, investor allocation" },
  { module: "Pricing Engine", fields: "Current Market Price", impact: "Pricing exceptions, NAV, P&L, GL fair value posting, fees" },
  { module: "FX Rates", fields: "FX Rate by currency pair", impact: "Local-to-USD valuation, FX gain/loss, NAV, exposure, investor allocations" },
  { module: "Trade Blotter", fields: "Quantity, Price, Fees", impact: "Net amount, GL trade postings, broker fees, cash/position reconciliation" },
  { module: "Investor Capital / Subscriptions", fields: "Capital, Shares, High Water Mark", impact: "NAV/share, allocation percentages, management/performance fees, equalization" },
  { module: "Management Fee Engine", fields: "Management Fee %", impact: "Daily accrual, GL expense/payable, NAV, P&L" },
  { module: "Performance Fee Engine", fields: "Performance Fee %", impact: "HWM allocation, crystallization accrual, NAV, investor reports" },
  { module: "OTC Derivatives / MTM", fields: "MTM, Accrued Interest, Collateral", impact: "Counterparty exposure, derivative asset/liability, GL MTM, NAV" },
];

type ChatRole = "user" | "assistant";
interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
}

type PromptCategory = "Workflow" | "Accounting" | "NAV Impact" | "Breaks" | "Risk" | "Controls" | "Learning" | "Scenario" | "Audit" | "Validation";
interface SuggestedQuestion {
  text: string;
  category: PromptCategory;
  mode?: "Learning" | "Professional" | "Both";
}

function FlashCell({ id, children }: { id: string; children: ReactNode }) {
  const state = useFundStore((s) => s.flashed[id]);
  return (
    <motion.div
      key={`${id}-${state ?? "flat"}`}
      initial={state ? { backgroundColor: state === "up" ? "rgba(38,208,124,.42)" : "rgba(255,90,106,.42)" } : false}
      animate={{ backgroundColor: "rgba(0,0,0,0)" }}
      transition={{ duration: 0.8 }}
      className="cell-flash"
      title={state ? "Updated from source dependency" : undefined}
    >
      {children}
    </motion.div>
  );
}

function EditableNumber({ value, onCommit, className = "" }: { value: number; onCommit: (n: number) => void; className?: string }) {
  const [draft, setDraft] = useState(String(value));
  return (
    <input
      className={`terminal-input ${className}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => Number.isFinite(Number(draft)) && onCommit(Number(draft))}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
      }}
    />
  );
}

function EditableText({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      className="terminal-input text-left"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
      }}
    />
  );
}

function ManualSubmitBar({ label, fields }: { label: string; fields: string }) {
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const submitManualUpdates = useFundStore((s) => s.submitManualUpdates);
  const raiseCorrectionWorkflow = useFundStore((s) => s.raiseCorrectionWorkflow);
  const store = useFundStore();
  const r = useRecalc();
  const activeLabel = modules.find((m) => m.id === store.activeModule)?.label ?? "module";
  const handleSubmit = () => {
    submitManualUpdates(label, fields);
    setSubmittedAt(new Date().toLocaleTimeString());
  };
  return (
    <div className="manual-submit">
      <div>
        <b>{label}</b>
        <span>Editable fields: {fields}</span>
      </div>
      <button className="terminal-button" onClick={handleSubmit}>
        <BookOpenCheck size={15} /> {store.trainingMode === "Sandbox" ? "Submit Sandbox Update & Recalculate NAV" : "Submit Control Recalculation"}
      </button>
      {store.trainingMode === "Live Mode" && (
        <button className="terminal-button reject" onClick={() => {
          raiseCorrectionWorkflow(label, fields);
          setSubmittedAt(new Date().toLocaleTimeString());
        }}>
          <AlertTriangle size={15} /> Raise NAV Correction
        </button>
      )}
      <button className="terminal-button" onClick={() => downloadCsv(`${store.activeModule}-current-data.csv`, exportRowsForModule(store.activeModule, store, r))}>
        <Download size={15} /> Download Current Data
      </button>
      <button className="terminal-button" onClick={() => downloadCsv(`${store.activeModule}-before-after-impact.csv`, impactReportRows(store))}>
        <FileDown size={15} /> Download Impact Report
      </button>
      {submittedAt && <small>Submitted {submittedAt}</small>}
      {!submittedAt && <small>{store.trainingMode === "Sandbox" ? `${activeLabel} sandbox evidence pack` : `${activeLabel} production change control`}</small>}
    </div>
  );
}

const uploadSources: Record<UploadModule, string[]> = {
  cashRecon: ["Internal cash ledger", "Custodian cash statement", "Prime broker cash file"],
  positionRecon: ["Internal positions", "Custodian positions", "Prime broker positions"],
  trades: ["Executed trade file", "Broker confirms", "OMS export"],
  security: ["Security reference data", "Bloomberg export", "Pricing source file"],
  pricing: ["Pricing vendor file", "NAV prices", "Evaluated prices", "FX pricing sheet"],
  corporateActions: ["Dividend file", "Corporate action announcement", "Coupon schedule"],
  capital: ["Subscriptions", "Redemptions", "Investor allocations", "Transfer agency file"],
};

function FileUploadPanel({ module, title }: { module: UploadModule; title: string }) {
  const { processUpload, uploads, explainContext } = useFundStore();
  const [sourceType, setSourceType] = useState(uploadSources[module][0]);
  const [dragging, setDragging] = useState(false);
  const moduleUploads = uploads.filter((u) => u.module === module).slice(0, 25);
  const handleFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text().catch(() => `${file.name}\nXLSX metadata-only simulation`);
    processUpload(module, sourceType, { name: file.name, text });
  };
  const downloadTemplate = () => {
    const template = "record_id,isin,ticker,currency,quantity,price,amount,nav_date,status\nSAMPLE-1,US5949181045,MSFT,USD,1000,421.80,421800,2026-05-09,New\n";
    const url = URL.createObjectURL(new Blob([template], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="upload-panel">
      <div className="upload-head">
        <div><b>{title}</b><span>CSV, XLSX or JSON ingestion with validation preview and break generation</span></div>
        <button className="terminal-button" onClick={downloadTemplate}><FileDown size={15} /> Sample Template</button>
      </div>
      <div className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
        <UploadCloud size={20} />
        <select className="terminal-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>{uploadSources[module].map((s) => <option key={s}>{s}</option>)}</select>
        <label className="terminal-button">Upload File<input type="file" accept=".csv,.json,.xlsx" hidden onChange={(e) => handleFile(e.target.files?.[0])} /></label>
      </div>
      <SimpleRows rows={moduleUploads.map((u) => ({
        Timestamp: new Date(u.timestamp).toLocaleString(),
        "Uploaded By": u.uploadedBy,
        File: u.fileName,
        Source: u.sourceType,
        Status: u.processingStatus,
        Validation: u.validationStatus,
        Rows: u.rowCount,
        Rejected: u.rejectedRows,
        Warnings: u.warnings,
        Duplicates: u.duplicateRecords,
        Action: <button className="link-button" onClick={() => explainContext(uploadContext(u.module as ModuleId, u.fileName, `${u.validationStatus} validation with ${u.issues.length} issue(s)`))}>Explain</button>,
      }))} empty="No uploads yet for this module." />
      {moduleUploads[0]?.issues.length ? <div className="validation-log">{moduleUploads[0].issues.map((i) => <div key={i.id} className={`validation ${i.severity.toLowerCase()}`}><b>{i.severity}</b><span>{i.field ?? "file"} {i.row ? `row ${i.row}` : ""}</span><p>{i.message}</p><small>{i.recommendedAction}</small></div>)}</div> : null}
    </div>
  );
}

const navPackSources: Array<{ module: UploadModule; sourceType: string; label: string; expected: string; impact: string }> = [
  { module: "pricing", sourceType: "NAV prices", label: "Pricing file", expected: "ticker, currency, price, price_date", impact: "Updates valuation, unrealized P&L, pricing breaks and NAV." },
  { module: "pricing", sourceType: "FX pricing sheet", label: "FX rate sheet", expected: "pair, current_rate, prior_rate", impact: "Updates FX translation, local/base values and FX gain/loss." },
  { module: "security", sourceType: "Security reference data", label: "Security master", expected: "isin, ticker, asset_type, currency", impact: "Validates identifiers, pricing hierarchy and missing reference data." },
  { module: "trades", sourceType: "Executed trade file", label: "Trade blotter", expected: "trade_id, side, quantity, price, fees", impact: "Updates positions, cash, broker fees, GL and settlement breaks." },
  { module: "cashRecon", sourceType: "Custodian cash statement", label: "Cash statement", expected: "account, currency, balance, movement", impact: "Creates cash breaks, timing differences and liquidity alerts." },
  { module: "positionRecon", sourceType: "Custodian positions", label: "Position file", expected: "isin, ticker, quantity, market_value", impact: "Creates position breaks and validates custody/PB holdings." },
  { module: "corporateActions", sourceType: "Corporate action announcement", label: "Corporate actions", expected: "event_type, security, ex_date, pay_date", impact: "Creates accruals, receivables, postings and settlement tasks." },
  { module: "capital", sourceType: "Transfer agency file", label: "Investor capital", expected: "investor, class, subscription, redemption", impact: "Updates capital, shares, equalization, fees and NAV/share." },
];

function NavPackInputCenter() {
  const store = useFundStore();
  const r = useRecalc();
  const navModules = new Set(navPackSources.map((s) => s.module));
  const navUploads = store.uploads.filter((u) => navModules.has(u.module)).slice(0, 20);
  const handleFile = async (source: typeof navPackSources[number], file?: File) => {
    if (!file) return;
    const text = await file.text().catch(() => `${file.name}\nXLSX metadata-only simulation`);
    store.processUpload(source.module, source.sourceType, { name: file.name, text });
  };
  const downloadInputRegister = () => downloadCsv("nav-pack-input-register.csv", navUploads.map((u) => ({
    Timestamp: new Date(u.timestamp).toLocaleString(),
    Module: u.module,
    Source: u.sourceType,
    File: u.fileName,
    Status: u.processingStatus,
    Validation: u.validationStatus,
    Rows: u.rowCount,
    Rejected: u.rejectedRows,
    Warnings: u.warnings,
    Duplicates: u.duplicateRecords,
  })));
  const downloadNavSummary = () => downloadCsv("nav-pack-summary.csv", [
    { Metric: "Gross assets", Value: r.grossAssets },
    { Metric: "Liabilities", Value: r.liabilities },
    { Metric: "Net assets", Value: r.netAssets },
    { Metric: "Investor capital", Value: r.investorCapital },
    { Metric: "Shares outstanding", Value: r.sharesOutstanding },
    { Metric: "NAV/share", Value: r.navPerShare },
    { Metric: "Management fee accrual", Value: r.managementFee },
    { Metric: "Performance fee accrual", Value: r.performanceFee },
    { Metric: "Open breaks", Value: openBreakCount(store) },
  ]);
  return (
    <section className="nav-input-center">
      <div className="upload-head">
        <div>
          <b>NAV Pack Input Center</b>
          <span>Load pricing, FX, custody, trade, cash, corporate action and investor files into one NAV evidence pack.</span>
        </div>
        <div className="inline-actions">
          <button className="terminal-button" onClick={downloadInputRegister}><Download size={15} /> Download Inputs</button>
          <button className="terminal-button" onClick={downloadNavSummary}><FileDown size={15} /> Download NAV Summary</button>
          <button className="terminal-button" onClick={() => downloadCsv("nav-pack-before-after-impact.csv", impactReportRows(store))}><FileSpreadsheet size={15} /> Download Impact</button>
          <button className="terminal-button selected" onClick={() => downloadXlsx("SYED_FUND_SIMULATOR_Institutional_NAV_Pack.xlsx", buildInstitutionalNavPack(store, r))}><FileSpreadsheet size={15} /> Full NAV Pack</button>
        </div>
      </div>
      <div className="nav-source-grid">
        {navPackSources.map((source) => {
          const latest = store.uploads.find((u) => u.module === source.module && u.sourceType === source.sourceType);
          return (
            <div className="nav-source-card" key={`${source.module}-${source.sourceType}`}>
              <div>
                <b>{source.label}</b>
                <span>{source.expected}</span>
              </div>
              <p>{source.impact}</p>
              <small>{latest ? `${latest.fileName} - ${latest.validationStatus} (${latest.rowCount} rows)` : "No file loaded yet"}</small>
              <label className="terminal-button">
                <UploadCloud size={15} /> Upload Source
                <input type="file" accept=".csv,.json,.xlsx" hidden onChange={(e) => handleFile(source, e.target.files?.[0])} />
              </label>
            </div>
          );
        })}
      </div>
      <SimpleRows rows={navUploads.map((u) => ({
        Time: new Date(u.timestamp).toLocaleString(),
        Source: u.sourceType,
        File: u.fileName,
        Status: u.processingStatus,
        Validation: u.validationStatus,
        Rows: u.rowCount,
        Rejected: u.rejectedRows,
        Warnings: u.warnings,
      }))} empty="No NAV source files have been uploaded yet." />
    </section>
  );
}

function uploadContext(tab: ModuleId, title: string, summary: string): CopilotContext {
  return {
    tab,
    title,
    summary,
    accountingImpact: "The upload flows through validation, reconciliation, break management, audit trail, and NAV control before final posting.",
    navImpact: "Material rows can update holdings valuation, cash, GL postings, trial balance, P&L, balance sheet, fees, and investor allocation.",
    recommendedAction: "Review validation issues, resolve breaks, then submit through maker-checker approval before NAV publication.",
    relatedEntries: ["Upload validation", "Break generation", "GL auto-posting", "NAV recalculation"],
  };
}

const q = (text: string, category: PromptCategory, mode: "Learning" | "Professional" | "Both" = "Both"): SuggestedQuestion => ({ text, category, mode });

const coreQuestions: SuggestedQuestion[] = [
  q("Explain this workflow", "Workflow"),
  q("What should I review before NAV publish?", "Controls"),
  q("What is the NAV impact?", "NAV Impact"),
  q("Which operational controls are missing?", "Controls"),
  q("Explain maker-checker controls", "Controls", "Learning"),
  q("What are the highest risk items?", "Risk", "Professional"),
  q("What should operations validate daily?", "Validation"),
  q("Show audit-sensitive items", "Audit", "Professional"),
  q("Explain downstream module dependencies", "Workflow"),
  q("What can block NAV approval?", "Controls"),
];

const moduleQuestionBank: Partial<Record<ModuleId, SuggestedQuestion[]>> = {
  fund: [
    q("Explain fund structure setup", "Learning"), q("What is the impact of NAV frequency?", "NAV Impact"), q("What happens if valuation cutoff changes?", "NAV Impact"), q("Explain share class workflow", "Workflow"), q("What are common setup mistakes?", "Validation"), q("Explain redemption workflow", "Workflow"), q("What is lock-up period impact?", "Risk"), q("Why is base currency important?", "Accounting"), q("Explain fee structure logic", "Accounting"), q("Explain administrator workflow", "Workflow"), q("What is fund lifecycle?", "Learning"), q("Explain institutional controls", "Controls"), q("Which setup fields impact NAV?", "NAV Impact"), q("Explain operational dependencies", "Workflow"), q("What should be checked before launch?", "Controls"), q("How do terms affect investor liquidity?", "Risk"), q("Which fields drive GL postings?", "Accounting"), q("How should setup changes be approved?", "Audit"),
  ],
  holdings: [
    q("Why did unrealized P&L change?", "NAV Impact"), q("Explain FX impact", "Accounting"), q("Which holdings drive NAV most?", "NAV Impact"), q("Show largest exposure", "Risk"), q("Explain market value calculation", "Learning"), q("Why did exposure increase?", "Risk"), q("Explain concentration risk", "Risk"), q("What happens if quantity changes?", "Workflow"), q("Explain long vs short exposure", "Learning"), q("Why is this position negative?", "Learning"), q("Explain price vs FX P&L", "Accounting"), q("Show highest volatility positions", "Risk"), q("Which holdings impact liquidity?", "Risk"), q("Explain exposure by strategy", "Risk"), q("What is gross vs net exposure?", "Learning"), q("Explain portfolio concentration", "Risk"), q("Why is this holding stale?", "Validation"), q("Explain valuation hierarchy", "Controls"), q("What is settlement impact?", "Workflow"), q("Explain investment classification", "Learning"),
  ],
  trades: [
    q("Explain trade lifecycle", "Workflow"), q("What GL entries were generated?", "Accounting"), q("Why is this trade unsettled?", "Breaks"), q("Explain settlement workflow", "Workflow"), q("What is failed trade impact?", "NAV Impact"), q("Explain broker fee treatment", "Accounting"), q("What operational checks are needed?", "Controls"), q("Explain trade date vs settle date", "Learning"), q("Which trades impact NAV most?", "NAV Impact"), q("Explain trade matching", "Breaks"), q("Why was this journal generated?", "Accounting"), q("Explain booking controls", "Controls"), q("Show largest trades today", "Risk"), q("Explain allocation workflow", "Workflow"), q("What happens after trade upload?", "Validation"), q("Explain custody confirmation", "Workflow"), q("Why is this trade rejected?", "Validation"), q("Explain operational risk", "Risk"), q("Explain trade break causes", "Breaks"), q("What downstream modules update?", "Workflow"),
  ],
  cashRecon: [
    q("Why is this cash break occurring?", "Breaks"), q("What is the root cause?", "Breaks"), q("Is this a timing difference?", "Breaks"), q("What is cash NAV impact?", "NAV Impact"), q("Which cash breaks are highest risk?", "Risk"), q("Explain cash reconciliation methodology", "Learning"), q("Explain cash break workflow", "Workflow"), q("What should be escalated?", "Controls"), q("Explain force-match logic", "Controls"), q("Which cash breaks are aging?", "Audit"), q("Explain operational materiality", "Controls"), q("Which side is incorrect?", "Breaks"), q("Explain custody cash differences", "Breaks"), q("Explain matching tolerance", "Validation"), q("What causes stale breaks?", "Breaks"), q("Explain operational escalation", "Workflow"), q("How do uploaded cash files validate?", "Validation"), q("What journal fixes a cash break?", "Accounting"),
  ],
  positionRecon: [
    q("Why is position mismatching?", "Breaks"), q("What is the root cause?", "Breaks"), q("Is this pending settlement?", "Breaks"), q("What is position NAV impact?", "NAV Impact"), q("Which position breaks are highest risk?", "Risk"), q("Explain position reconciliation methodology", "Learning"), q("What should be escalated?", "Controls"), q("Which breaks are aging?", "Audit"), q("Explain operational materiality", "Controls"), q("Why is this unresolved?", "Breaks"), q("Explain custody differences", "Breaks"), q("Which side is incorrect?", "Breaks"), q("Explain reconciliation controls", "Controls"), q("Show unresolved critical breaks", "Risk"), q("Explain matching tolerance", "Validation"), q("What causes stale positions?", "Validation"), q("Explain operational escalation", "Workflow"), q("What happens after position upload?", "Validation"),
  ],
  reconBreaks: [
    q("Why is this break occurring?", "Breaks"), q("What is the root cause?", "Breaks"), q("Is this a timing difference?", "Breaks"), q("What is NAV impact?", "NAV Impact"), q("Which breaks are highest risk?", "Risk"), q("Explain reconciliation methodology", "Learning"), q("What should be escalated?", "Controls"), q("Explain force-match logic", "Controls"), q("Which breaks are aging?", "Audit"), q("Explain operational materiality", "Controls"), q("Why is this unresolved?", "Breaks"), q("Which side is incorrect?", "Breaks"), q("Explain reconciliation controls", "Controls"), q("Show unresolved critical breaks", "Risk"), q("Explain matching tolerance", "Validation"), q("What causes stale breaks?", "Breaks"), q("Explain operational escalation", "Workflow"), q("How should resolution evidence be documented?", "Audit"), q("Which breaks block NAV publish?", "Controls"),
  ],
  exceptions: [
    q("Analyze open breaks", "Breaks"), q("Which breaks block NAV?", "Controls"), q("Recommend break resolution steps", "Workflow"), q("Show highest NAV impact breaks", "NAV Impact"), q("Which exceptions are aging?", "Audit"), q("Explain escalation urgency", "Risk"), q("What evidence is required?", "Audit"), q("Which exceptions need approval?", "Controls"), q("Explain break materiality", "Controls"), q("What could be written off?", "Accounting"), q("Which exception was upload-generated?", "Validation"), q("Explain operational owner assignment", "Workflow"), q("What is the next best action?", "Workflow"), q("Explain high severity logic", "Risk"), q("Which exceptions impact investors?", "NAV Impact"),
  ],
  gl: [
    q("Explain this journal", "Accounting"), q("Why was this entry posted?", "Accounting"), q("What is debit/credit logic?", "Learning"), q("Which module generated this?", "Workflow"), q("Explain accrual accounting", "Accounting"), q("Explain realized vs unrealized", "Learning"), q("Why is this account moving?", "Accounting"), q("Explain auto-posting engine", "Workflow"), q("What impacts trial balance?", "Accounting"), q("Explain fee accrual posting", "Accounting"), q("Explain FX journal logic", "Accounting"), q("Which entries impact NAV?", "NAV Impact"), q("Explain accounting controls", "Controls"), q("Why is balance changing?", "Accounting"), q("Explain operational accounting", "Learning"), q("Explain ledger hierarchy", "Learning"), q("Show largest postings today", "Risk"), q("Explain reversal entries", "Accounting"), q("What journals are pending approval?", "Controls"), q("Explain accounting workflow", "Workflow"),
  ],
  trialBalance: [
    q("Explain trial balance status", "Accounting"), q("What causes imbalance?", "Breaks"), q("Which accounts moved?", "Accounting"), q("Which entries impact NAV?", "NAV Impact"), q("Explain debit and credit equality", "Learning"), q("What should controller review?", "Controls"), q("Explain TB validation checks", "Validation"), q("Which GL source caused movement?", "Workflow"), q("What breaks financial statements?", "Risk"), q("Explain balance substantiation", "Audit"), q("Show largest account balances", "Risk"), q("Explain account categories", "Learning"), q("What is pending approval?", "Controls"), q("How does TB feed NAV?", "NAV Impact"), q("Explain audit controls", "Audit"),
  ],
  nav: [
    q("Why did NAV move today?", "NAV Impact"), q("Which holdings contributed most?", "NAV Impact"), q("What caused fee increase?", "Accounting"), q("Explain NAV waterfall", "Learning"), q("What is investor impact?", "NAV Impact"), q("Explain equalization", "Accounting"), q("Why did NAV/share change?", "NAV Impact"), q("Which breaks affect NAV?", "Breaks"), q("Explain accrual impact", "Accounting"), q("What changed since yesterday?", "NAV Impact"), q("Explain expense allocation", "Accounting"), q("What is gross vs net NAV?", "Learning"), q("Explain performance fee logic", "Accounting"), q("Why is exposure increasing?", "Risk"), q("Which modules updated NAV?", "Workflow"), q("Explain valuation controls", "Controls"), q("What is material NAV movement?", "Controls"), q("Explain investor allocation", "Accounting"), q("What drives daily NAV?", "Learning"), q("Explain NAV validation checks", "Validation"),
  ],
  corporateActions: [
    q("Explain dividend accrual process", "Accounting"), q("Explain withholding tax treatment", "Accounting"), q("What happens on pay date?", "Workflow"), q("How is entitlement calculated?", "Accounting"), q("Which corporate actions affect NAV?", "NAV Impact"), q("What is ex-date vs record date?", "Learning"), q("Explain receivable generation", "Accounting"), q("What breaks can corporate actions create?", "Breaks"), q("Explain voluntary event controls", "Controls"), q("How should announcements be validated?", "Validation"), q("What audit evidence is required?", "Audit"), q("Explain stock split impact", "Workflow"), q("Explain coupon processing", "Accounting"), q("Which events are pending posting?", "Workflow"), q("What is cash settlement impact?", "NAV Impact"),
  ],
  pricing: [
    q("Analyze price tolerance breaches", "Validation"), q("Why did NAV change after price update?", "NAV Impact"), q("Explain price challenge workflow", "Workflow"), q("Which prices are stale?", "Validation"), q("Explain pricing hierarchy", "Controls"), q("Which securities need independent pricing?", "Controls"), q("What is prior-day variance?", "Risk"), q("Explain manual override controls", "Audit"), q("Which prices affect fees?", "Accounting"), q("What is level 3 valuation risk?", "Risk"), q("How does pricing feed GL?", "Accounting"), q("What should valuations review?", "Controls"), q("Explain vendor file validation", "Validation"), q("Which holdings moved most?", "NAV Impact"), q("What blocks price approval?", "Workflow"),
  ],
  fx: [
    q("Explain FX translation impact", "Accounting"), q("Which currencies moved NAV?", "NAV Impact"), q("What happens if FX rate changes?", "NAV Impact"), q("Explain realized vs unrealized FX", "Accounting"), q("Which holdings have FX exposure?", "Risk"), q("What is base currency impact?", "Learning"), q("Explain FX source controls", "Controls"), q("Which FX rates are stale?", "Validation"), q("How does FX feed GL?", "Accounting"), q("Explain currency concentration", "Risk"), q("What should treasury validate?", "Controls"), q("Explain FX matrix workflow", "Workflow"), q("Which investors are impacted by FX?", "NAV Impact"), q("What causes FX breaks?", "Breaks"), q("Explain FX shock scenario", "Scenario"),
  ],
  mgmtFees: [
    q("Explain management fee accrual", "Accounting"), q("Show fee impact on NAV", "NAV Impact"), q("What changes if fee percent changes?", "NAV Impact"), q("Explain daily accrual logic", "Learning"), q("Which investors pay fees?", "Accounting"), q("Explain fee waiver treatment", "Accounting"), q("How is fee payable posted?", "Accounting"), q("What should be approved?", "Controls"), q("Explain tiered fee controls", "Controls"), q("Which fee entries hit GL?", "Accounting"), q("How do fees affect NAV/share?", "NAV Impact"), q("Explain audit trail for fee changes", "Audit"), q("What validation checks apply?", "Validation"), q("Explain expense allocation", "Accounting"), q("What is monthly crystallization impact?", "Workflow"),
  ],
  perfFees: [
    q("Explain performance fee", "Accounting"), q("How does HWM work?", "Learning"), q("Why did performance fee increase?", "NAV Impact"), q("Explain hurdle rate", "Learning"), q("What is crystallization?", "Accounting"), q("Explain equalization credits", "Accounting"), q("Which investors are impacted?", "NAV Impact"), q("What approval is required?", "Controls"), q("How is fee payable posted?", "Accounting"), q("What causes fee reversal?", "Accounting"), q("Explain fee waterfall", "Workflow"), q("What is audit risk?", "Audit"), q("What validation checks apply?", "Validation"), q("How does NAV movement affect fees?", "NAV Impact"), q("Explain investor-level HWM", "Learning"),
  ],
  workflow: [
    q("How do I publish NAV?", "Workflow"), q("Explain maker-checker approval", "Controls"), q("What blocks approval?", "Controls"), q("Which items are pending review?", "Workflow"), q("What should reviewer check?", "Controls"), q("Explain rejection workflow", "Workflow"), q("What audit history is needed?", "Audit"), q("Which high breaks remain open?", "Risk"), q("Explain NAV status lifecycle", "Learning"), q("What is Posted vs Published?", "Learning"), q("What evidence should be attached?", "Audit"), q("How do approvals affect GL?", "Accounting"), q("Explain operational sign-off", "Controls"), q("Which modules must be approved?", "Workflow"), q("What is next best action?", "Workflow"),
  ],
  risk: [
    q("Explain exposure changes", "Risk"), q("Show largest strategy risk", "Risk"), q("What is concentration risk?", "Learning"), q("Which holdings drive gross exposure?", "Risk"), q("Explain net vs gross exposure", "Learning"), q("Which currencies are concentrated?", "Risk"), q("Explain liquidity risk", "Risk"), q("What scenario should I run?", "Scenario"), q("Which counterparty is largest?", "Risk"), q("Explain leverage impact", "Risk"), q("Which breaks create risk?", "Breaks"), q("What is NAV risk today?", "NAV Impact"), q("Explain risk controls", "Controls"), q("What changed after stress?", "Scenario"), q("Which exposures affect investors?", "NAV Impact"),
  ],
  stress: [
    q("Explain scenario impact", "Scenario"), q("What moved NAV?", "NAV Impact"), q("Which investors are impacted?", "NAV Impact"), q("Explain market crash scenario", "Scenario"), q("Explain FX shock scenario", "Scenario"), q("Explain redemption run liquidity", "Risk"), q("Explain rate hike impact", "Scenario"), q("Which holdings are most sensitive?", "Risk"), q("What fees changed?", "Accounting"), q("What breaks could this create?", "Breaks"), q("What controls should run after stress?", "Controls"), q("Explain stress testing workflow", "Learning"), q("Which exposures changed?", "Risk"), q("What should be escalated?", "Workflow"), q("Explain liquidity pressure", "Risk"),
  ],
  scenario: [
    q("Explain scenario impact", "Scenario"), q("What moved NAV?", "NAV Impact"), q("Which investors are impacted?", "NAV Impact"), q("Recommend next scenario", "Scenario"), q("Explain scenario assumptions", "Learning"), q("Which modules updated?", "Workflow"), q("What controls should run after scenario?", "Controls"), q("Which risk changed most?", "Risk"), q("How did FX affect the result?", "Accounting"), q("What broke after scenario?", "Breaks"), q("Explain scenario audit trail", "Audit"), q("What is operational response?", "Workflow"), q("Explain liquidity impact", "Risk"), q("Explain fee impact", "Accounting"), q("What is NAV materiality?", "Controls"),
  ],
};

const getQuestionsForModule = (active: ModuleId) => moduleQuestionBank[active] ?? coreQuestions;

function buildSuggestedPrompts(active: ModuleId) {
  return getQuestionsForModule(active).slice(0, 6).map((question) => question.text);
}

function buildOperationalQuestions(args: {
  active: ModuleId;
  mode: "Learning" | "Professional";
  store: FundState;
  r: ReturnType<typeof useRecalc>;
  rotation: number;
}) {
  const { active, mode, store, r, rotation } = args;
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const criticalBreaks = openBreaks.filter((b) => b.severity === "High");
  const latestUpload = store.uploads[0];
  const dynamic: SuggestedQuestion[] = [
    ...(criticalBreaks.length ? [q(`Explain the ${criticalBreaks.length} high-severity break(s) blocking NAV`, "Breaks", "Professional")] : []),
    ...(openBreaks.length ? [q(`Which of the ${openBreaks.length} open breaks should I resolve first?`, "Breaks")] : []),
    ...(latestUpload ? [q(`Review validation issues in ${latestUpload.fileName}`, "Validation")] : []),
    ...(Math.abs(r.fxGainLoss) > 100000 ? [q(`Explain today's FX NAV impact of ${fmt(r.fxGainLoss, true)}`, "NAV Impact")] : []),
    ...(store.fundSetup.workflowStatus !== "NAV Published" ? [q(`What remains before ${store.fundSetup.workflowStatus} can move to NAV Published?`, "Workflow")] : []),
    ...(r.managementFee + r.performanceFee > 0 ? [q("Explain current management and performance fee impact", "Accounting")] : []),
  ];
  const pool = [...dynamic, ...getQuestionsForModule(active), ...coreQuestions].filter((item, index, list) =>
    list.findIndex((candidate) => candidate.text === item.text) === index
  );
  const modeFiltered = pool.filter((item) => item.mode === "Both" || !item.mode || item.mode === mode);
  const source = modeFiltered.length >= 8 ? modeFiltered : pool;
  const rotated = source.map((item, index) => ({ item, rank: (index - rotation + source.length) % source.length }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ item }) => item);
  return rotated;
}

function generateCopilotReply(question: string, args: {
  active: ModuleId;
  label: string;
  r: ReturnType<typeof useRecalc>;
  store: FundState;
  mode: "Learning" | "Professional";
  context: CopilotContext | null;
  history: ChatMessage[];
}) {
  const q = question.toLowerCase();
  const { active, label, r, store, mode, context, history } = args;
  const topHolding = [...r.holdings].sort((a, b) => Math.abs(b.baseMarketValue) - Math.abs(a.baseMarketValue))[0];
  const worstPnl = [...r.holdings].sort((a, b) => a.totalUnrealizedPnl - b.totalUnrealizedPnl)[0];
  const topBreak = [...store.breaks].sort((a, b) => b.navImpact - a.navImpact)[0];
  const latestUpload = store.uploads[0];
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.text.toLowerCase() ?? "";
  const activeScenario = scenarioCatalog.find((scenario) => scenario.id === store.activeScenarioId);
  const lead = mode === "Learning"
    ? `In ${label}, think of this as a fund-admin control step. `
    : `${label}: `;

  if (activeScenario && (q.includes("scenario") || q.includes("practice") || q.includes("hint") || q.includes("what should") || q.includes("answer"))) {
    const prompts = [
      "Which NAV component moved first?",
      "Which table or uploaded source created the issue?",
      "Is this a timing difference or an economic break?",
      "Which control failed and would it block NAV release?",
    ];
    return `${lead}For ${activeScenario.scenarioName}, start by investigating rather than jumping to the answer. Ask yourself: ${prompts.join(" ")} Expected focus: ${activeScenario.learnerTask} If you get stuck, review ${activeScenario.affectedTables.join(", ")}. Accounting angle: ${activeScenario.expectedGLImpact} Best-practice resolution: ${activeScenario.expectedResolution}`;
  }

  if (q.includes("fx") || (q.includes("was it") && lastUser.includes("nav"))) {
    return `${lead}FX impact is currently ${fmt(r.fxGainLoss, true)}. The platform revalues non-USD holdings through the FX matrix, splitting unrealized movement into price P&L and FX P&L. ${topHolding ? `${topHolding.ticker} has current FX ${topHolding.fxRate.toFixed(4)} and base MV ${fmt(topHolding.baseMarketValue, true)}.` : ""} Operationally, review FX rate source, valuation cutoff, and whether the movement is realized or unrealized before NAV approval.`;
  }

  if (q.includes("nav") || q.includes("waterfall") || q.includes("drop") || q.includes("move")) {
    return `${lead}Current net assets are ${fmt(r.netAssets, true)} and NAV/share is ${r.navPerShare.toFixed(4)}. Main live drivers are unrealized P&L ${fmt(r.unrealizedGains, true)}, FX ${fmt(r.fxGainLoss, true)}, management fee ${fmt(r.managementFee, true)}, and performance fee ${fmt(r.performanceFee, true)}. ${worstPnl ? `Largest unrealized drag is ${worstPnl.ticker} at ${fmt(worstPnl.totalUnrealizedPnl, true)}.` : ""} Downstream, this flows into P&L, balance sheet capital, investor allocations, and fee accruals.`;
  }

  if (q.includes("break") || q.includes("resolve") || q.includes("root cause") || q.includes("mismatch")) {
    const b = context?.title?.startsWith("BRK-") ? store.breaks.find((x) => x.id === context.title) ?? topBreak : topBreak;
    if (!b) return `${lead}There are no active breaks to analyze. After uploads or edits, validation warnings will generate breaks here.`;
    return `${lead}${b.id} is a ${b.severity} ${b.breakType} break with estimated NAV impact ${fmt(b.navImpact, true)} and status ${b.status}. Likely root cause: ${b.rootCause}. Recommended workflow: assign owner ${b.owner}, collect evidence, document resolution notes, ${b.severity === "High" ? "escalate before NAV sign-off, " : ""}resolve, then checker-approve. This is ${b.navImpact > 100000 ? "NAV-impacting" : "likely below materiality but still auditable"}.`;
  }

  if (q.includes("upload") || q.includes("file") || q.includes("validation")) {
    if (!latestUpload) return `${lead}No upload has been processed yet. Use the upload panel in recon, trades, pricing, security master, corporate actions, or investor activity. The simulator validates rows, reports warnings/rejects, and generates breaks if needed.`;
    return `${lead}Latest upload is ${latestUpload.fileName} for ${latestUpload.module}: ${latestUpload.rowCount} rows, ${latestUpload.warnings} warning(s), ${latestUpload.rejectedRows} rejected row(s), validation ${latestUpload.validationStatus}. Processing status is ${latestUpload.processingStatus}. Review the validation preview, export the error log if needed, then choose reject, partial accept with approval, or post.`;
  }

  if (q.includes("journal") || q.includes("gl") || q.includes("debit") || q.includes("credit")) {
    return `${lead}The GL is auto-posted from trades, accruals, fair value, FX, derivatives, and fees. There are ${r.gl.length} journal entries feeding the trial balance. Trial balance rows total ${r.trialBalance.length} accounts. Institutional logic: assets and expenses debit, liabilities/capital/income credit; every source posting should preserve debit-credit equality before NAV is published.`;
  }

  if (q.includes("holding") || q.includes("exposure") || q.includes("market value") || q.includes("quantity") || q.includes("aapl")) {
    const aapl = r.holdings.find((h) => h.ticker === "AAPL");
    const ref = q.includes("aapl") && aapl ? aapl : topHolding;
    if (!ref) return `${lead}No holdings are available.`;
    return `${lead}${ref.ticker} has quantity ${num(ref.quantity)}, local MV ${fmt(ref.localMarketValue, true)}, base MV ${fmt(ref.baseMarketValue, true)}, price P&L ${fmt(ref.pricePnl, true)}, FX P&L ${fmt(ref.fxPnl, true)}, and exposure ${ref.exposurePct.toFixed(2)}%. Changing quantity changes cost, market value, exposure, P&L, NAV, fees, GL fair value postings, balance sheet, and investor allocations.`;
  }

  if (q.includes("corporate") || q.includes("dividend") || q.includes("coupon") || q.includes("withholding")) {
    const ca = store.corporateActions[0];
    return `${lead}Corporate actions generate entitlement, receivable/accrual, GL, NAV, and cash-settlement effects. Example: ${ca.security} ${ca.eventType} has gross ${fmt(ca.grossAmount, true)}, withholding ${fmt(ca.withholdingTax, true)}, net receivable ${fmt(ca.netReceivable, true)}, status ${ca.status}, posting ${ca.postingStatus}. Ex-date drives accrual recognition; pay-date drives cash settlement.`;
  }

  if (q.includes("approve") || q.includes("publish") || q.includes("workflow")) {
    return `${lead}Current NAV workflow status is ${store.fundSetup.workflowStatus}. Institutional sequence is Draft -> Submitted -> Reviewed -> Approved -> Posted -> NAV Published. Before publishing, clear high-severity breaks, review upload validations, confirm GL/TB, approve fees, and document checker comments.`;
  }

  if (q.includes("fee") || q.includes("performance") || q.includes("management") || q.includes("hwm")) {
    return `${lead}Management fee is accrued daily from average NAV at ${(store.managementFeePct * 100).toFixed(2)}%, currently ${fmt(r.managementFee, true)}. Performance fee uses profit above high water mark at ${(store.performanceFeePct * 100).toFixed(2)}%, currently ${fmt(r.performanceFee, true)}. Fee changes flow to GL expense/payable, P&L, NAV, balance sheet liabilities, and investor allocations.`;
  }

  return `${lead}${context?.summary ?? "I am reading the live simulator state."} Current NAV is ${fmt(r.netAssets, true)}, open breaks are ${openBreaks.length}, latest upload is ${latestUpload?.fileName ?? "none"}, and workflow is ${store.fundSetup.workflowStatus}. Ask about NAV movement, breaks, uploads, GL, holdings, FX, fees, or approval steps for a more targeted analysis.`;
}

function Sidebar() {
  const { activeModule, setActiveModule, collapsed, toggleSidebar, impactedModules } = useFundStore();
  const activeGroup = navGroups.find((group) => group.modules.includes(activeModule))?.title ?? navGroups[0].title;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([activeGroup]));
  useEffect(() => {
    setOpenGroups((current) => {
      if (current.has(activeGroup)) return current;
      const next = new Set(current);
      next.add(activeGroup);
      return next;
    });
  }, [activeGroup]);
  const toggleGroup = (group: NavGroup) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      next.has(group.title) ? next.delete(group.title) : next.add(group.title);
      return next;
    });
    if (!group.modules.includes(activeModule)) setActiveModule(group.modules[0]);
  };
  return (
    <aside className={`sidebar ${collapsed ? "w-[76px]" : "w-[288px]"}`}>
      <div className="brand">
        <div className="brand-mark">SF</div>
        {!collapsed && <div><div className="brand-title">SYED FUND SIMULATOR</div><div className="brand-sub">NAV operations command center</div></div>}
        <button className="icon-btn ml-auto" onClick={toggleSidebar} title="Collapse sidebar">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
      </div>
      <nav className="nav-list">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = group.modules.includes(activeModule);
          const groupImpacted = group.modules.some((id) => impactedModules.includes(id));
          const groupOpen = openGroups.has(group.title);
          return (
            <div key={group.title} className={`nav-group ${groupActive ? "active" : ""} ${groupOpen ? "open" : ""}`}>
              <button className={`nav-group-button ${groupActive ? "active" : ""} ${groupImpacted ? "impacted" : ""}`} onClick={() => toggleGroup(group)} title={group.title}>
                <GroupIcon size={16} />
                {!collapsed && <>
                  <span><b>{group.title}</b><small>{group.subtitle}</small></span>
                  <ChevronRight size={14} className="nav-chevron" />
                </>}
                {collapsed && groupImpacted && <i />}
              </button>
              {!collapsed && groupOpen && <div className="nav-children">
                {group.modules.map((id) => {
                  const m = moduleById[id];
                  const Icon = m.icon;
                  const active = activeModule === m.id;
                  const impacted = impactedModules.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => setActiveModule(m.id)} className={`nav-item ${active ? "active" : ""} ${impacted ? "impacted" : ""}`} title={m.label}>
                      <Icon size={15} />
                      <span>{m.label}</span>
                      {impacted && <i />}
                    </button>
                  );
                })}
              </div>}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function Header() {
  const { fundMode, setFundMode, reset, trainingMode, setTrainingMode, setAiPanelOpen, activeScenarioImpact, breaks, setActiveModule } = useFundStore();
  const r = useRecalc();
  const active = useFundStore((s) => s.activeModule);
  const label = modules.find((m) => m.id === active)?.label;
  const pulse = useQuery({
    queryKey: ["ops-pulse"],
    queryFn: async () => ({ at: new Date().toLocaleTimeString(), batch: Math.floor(88 + Math.random() * 9) }),
    refetchInterval: 5000,
  });
  const scenarioImpact = activeScenarioImpact ? impactDelta(activeScenarioImpact.before.nav, activeScenarioImpact.after.nav).delta : 0;
  const mat = materiality(r.netAssets, scenarioImpact || breaks.reduce((sum, b) => sum + (!["Resolved", "Approved", "Closed"].includes(b.status) ? b.navImpact : 0), 0));
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Production simulation · {pulse.data?.at ?? "live"}</div>
        <h1>{label}</h1>
      </div>
      <div className="top-actions">
        <select className="terminal-select" value={fundMode} onChange={(e) => setFundMode(e.target.value)}>
          {["Long/Short Equity Fund", "Macro Fund", "Credit Fund", "Multi-Strategy Fund", "Distressed Fund", "Event Driven Fund"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <div className="status-pill good">NAV {fmt(r.netAssets, true)}</div>
        <div className="status-pill">NAV/share {r.navPerShare.toFixed(4)}</div>
        <div className="status-pill bad">Open breaks {openBreakCount(useFundStore.getState())}</div>
        <div className={`status-pill ${mat.tone}`}>Materiality {mat.label}</div>
        <div className="status-pill">Updated {pulse.data?.at ?? "live"}</div>
        <div className="environment-switch">
          <button className={trainingMode === "Live Mode" ? "selected" : ""} onClick={() => setTrainingMode("Live Mode")}>Live Mode</button>
          <button className={trainingMode === "Sandbox" ? "selected" : ""} onClick={() => { setTrainingMode("Sandbox"); setActiveModule("sandboxCommand"); }}>Sandbox</button>
        </div>
        <button className="terminal-button" onClick={() => setAiPanelOpen(true)}><Bot size={15} /> AI Copilot</button>
        {trainingMode === "Sandbox" && <button className="terminal-button" onClick={reset}><RefreshCw size={15} /> Reset book</button>}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" | "warn" }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function DependencyStrip() {
  const impacted = useFundStore((s) => s.impactedModules);
  const audit = useFundStore((s) => s.auditTrail[0]);
  if (!audit) return null;
  return (
    <motion.div className="dependency-strip" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <GitBranch size={16} />
      <span>Updated from source dependency:</span>
      {impacted.slice(0, 8).map((id, idx) => (
        <motion.b key={id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
          {modules.find((m) => m.id === id)?.label}
          {idx < Math.min(impacted.length, 8) - 1 ? <ChevronRight size={13} /> : null}
        </motion.b>
      ))}
    </motion.div>
  );
}

function ExplainButton({ context }: { context: CopilotContext }) {
  const explainContext = useFundStore((s) => s.explainContext);
  return <button className="link-button" onClick={() => explainContext(context)}><MessageSquare size={13} /> Explain this</button>;
}

function LearningHint({ text }: { text: string }) {
  const learningMode = useFundStore((s) => s.learningMode);
  if (!learningMode) return null;
  return <div className="learning-hint"><Brain size={15} /><span>{text}</span></div>;
}

type OpsLens = "Analyst" | "SME" | "Manager" | "Leadership";

function navReadiness(store: FundState, r: ReturnType<typeof useRecalc>) {
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const criticalBreaks = openBreaks.filter((b) => b.severity === "Critical" || b.severity === "High");
  const openExceptions = r.exceptions.filter((e) => e.status !== "Cleared");
  const failedTrades = store.trades.filter((t) => t.status === "Failed").length;
  const stalePrices = store.holdings.filter((h) => Date.now() - new Date(h.lastPriceTime).getTime() > 24 * 60 * 60 * 1000).length;
  const tbBreak = Math.abs(r.trialBalance.reduce((sum, row) => sum + row.debit - row.credit, 0));
  const unresolvedImpact = openBreaks.reduce((sum, b) => sum + Math.abs(b.navImpact), 0);
  const mat = materiality(r.netAssets, unresolvedImpact);
  const blocked = criticalBreaks.length > 0 || stalePrices > 0 || tbBreak > 1 || mat.label === "Critical";
  return { openBreaks, criticalBreaks, openExceptions, failedTrades, stalePrices, tbBreak, unresolvedImpact, mat, blocked };
}

function moduleForBreak(breakType: string): ModuleId {
  if (breakType.includes("Cash")) return "cashRecon";
  if (breakType.includes("Position")) return "positionRecon";
  if (breakType.includes("Pricing")) return "pricing";
  if (breakType.includes("FX")) return "fx";
  if (breakType.includes("Corporate")) return "corporateActions";
  if (breakType.includes("Trade")) return "trades";
  if (breakType.includes("GL")) return "gl";
  return "nav";
}

function opsPackRows(kind: "break" | "scenario" | "performance" | "checklist" | "interview", store: FundState, r: ReturnType<typeof useRecalc>): ExportRow[] {
  const readiness = navReadiness(store, r);
  if (kind === "break") return readiness.openBreaks.map((b) => ({
    "Break ID": b.id,
    Type: b.breakType,
    Severity: b.severity,
    Aging: `${b.aging}d`,
    Owner: b.owner,
    "NAV Impact": b.navImpact,
    "Root Cause": b.rootCause,
    Status: b.status,
    "Evidence Required": "Source file, internal value, custodian/PB value, calculation support, reviewer signoff",
    "Proposed Resolution": b.resolutionNotes,
    "Approval Trail": `Analyst -> SME -> ${b.severity === "Critical" || b.severity === "High" ? "NAV Manager" : "Reviewer"}`,
  }));
  if (kind === "scenario") return store.scenarioRuns.map((run) => ({
    Run: run.id,
    Scenario: run.scenarioName,
    Module: run.module,
    Mode: run.trainingMode,
    Status: run.status,
    Score: run.score,
    Started: run.startedAt,
    Completed: run.completedAt ?? "",
    "Learner Response": run.learnerResponse ?? "",
    "Learning Notes": run.evaluationNotes.join(" | "),
  }));
  if (kind === "performance") return [
    { Metric: "Operational Accuracy", Value: `${Math.max(0, 100 - readiness.openBreaks.length * 4)}%`, Evidence: `${readiness.openBreaks.length} open break(s)` },
    { Metric: "Break Resolution Speed", Value: readiness.openBreaks.some((b) => b.aging > 2) ? "Needs improvement" : "On track", Evidence: `${readiness.openBreaks.filter((b) => b.aging > 2).length} aged item(s)` },
    { Metric: "Escalation Quality", Value: readiness.criticalBreaks.length ? "Escalation required" : "Stable", Evidence: `${readiness.criticalBreaks.length} high/critical break(s)` },
    { Metric: "Audit Documentation", Value: store.auditTrail.length ? "Evidence captured" : "No audit yet", Evidence: `${store.auditTrail.length} audit event(s)` },
    { Metric: "Signoff Readiness", Value: readiness.blocked ? "Blocked" : "Ready", Evidence: `Materiality ${readiness.mat.label}` },
  ];
  if (kind === "checklist") return [
    { Step: "Load Files", Owner: "Ops Intake", Status: "Completed", "Action Required": "Confirm PB/custodian/pricing files loaded" },
    { Step: "Validate Data", Owner: "Data Control", Status: readiness.stalePrices ? "Incomplete" : "Complete", "Action Required": readiness.stalePrices ? "Resolve stale/missing prices" : "No action" },
    { Step: "Run Recons", Owner: "Reconciliation", Status: readiness.openBreaks.length ? "Incomplete" : "Complete", "Action Required": `${readiness.openBreaks.length} break(s) require action` },
    { Step: "Review Breaks", Owner: "SME / QA", Status: readiness.criticalBreaks.length ? "Escalate" : "Complete", "Action Required": readiness.criticalBreaks.length ? "Escalate high materiality items" : "No action" },
    { Step: "Post Journals", Owner: "Fund Accounting", Status: readiness.tbBreak > 1 ? "Incomplete" : "Complete", "Action Required": readiness.tbBreak > 1 ? "Clear TB imbalance" : "No action" },
    { Step: "Review NAV", Owner: "NAV Manager", Status: readiness.blocked ? "Hold" : "Ready", "Action Required": readiness.blocked ? "Clear blockers" : "Final review" },
    { Step: "Approve", Owner: "Controller", Status: readiness.blocked ? "Blocked" : "Ready", "Action Required": "Check evidence and digital signoff" },
    { Step: "Publish", Owner: "Client Reporting", Status: readiness.blocked ? "Blocked" : "Ready", "Action Required": "Send investor pack after approval" },
  ];
  return store.scenarioRuns.map((run) => ({
    Scenario: run.scenarioName,
    Question: "Explain source issue, NAV impact, failed control, GL treatment and required approval.",
    "Candidate Answer": run.learnerResponse ?? "Not submitted",
    Score: run.score,
    Result: run.status,
    "Model Notes": run.evaluationNotes.join(" | "),
  }));
}

function TopNavIssues({ readiness }: { readiness: ReturnType<typeof navReadiness> }) {
  const setActiveModule = useFundStore((s) => s.setActiveModule);
  const issues = [...readiness.openBreaks].sort((a, b) => Math.abs(b.navImpact) - Math.abs(a.navImpact)).slice(0, 5);
  return (
    <section className="panel">
      <PanelTitle title="Top 5 NAV-Impacting Issues" right="Highest materiality first" />
      <div className="issue-list">
        {issues.map((b) => <button key={b.id} onClick={() => setActiveModule(moduleForBreak(b.breakType))}>
          <span className={`tag ${b.severity === "Critical" || b.severity === "High" ? "bad" : b.severity === "Medium" ? "warn" : "good"}`}>{b.severity}</span>
          <b>{b.id} - {fmt(b.navImpact, true)}</b>
          <small>{b.owner} / {b.aging}d / {b.rootCause}</small>
        </button>)}
        {!issues.length && <div className="empty-state">No NAV-impacting issues open.</div>}
      </div>
    </section>
  );
}

function OwnershipSlaDashboard({ readiness }: { readiness: ReturnType<typeof navReadiness> }) {
  const owners = Array.from(new Set(readiness.openBreaks.map((b) => b.owner)));
  const rows = owners.map((owner) => {
    const items = readiness.openBreaks.filter((b) => b.owner === owner);
    const navImpact = items.reduce((sum, b) => sum + Math.abs(b.navImpact), 0);
    const slaBreaches = items.filter((b) => b.aging * 24 > b.slaHours).length;
    return { Owner: owner, "Open Items": items.length, "SLA Breaches": slaBreaches, "NAV Impact": fmt(navImpact, true), "Action Required": slaBreaches ? "Escalate aged breaks" : "Continue investigation" };
  });
  return (
    <section className="panel">
      <PanelTitle title="Who Owns What" right="Ownership, aging and SLA breach view" />
      <SimpleRows rows={rows} empty="No open ownership pressure." />
    </section>
  );
}

function DailyNavWorkflow({ readiness }: { readiness: ReturnType<typeof navReadiness> }) {
  const steps = [
    { step: "Load Files", owner: "Ops Intake", status: "Completed", detail: "PB, custodian, pricing and investor files available" },
    { step: "Validate Data", owner: "Data Control", status: readiness.stalePrices ? "Escalated" : "Completed", detail: readiness.stalePrices ? `${readiness.stalePrices} stale price(s)` : "Reference, price and FX checks clean" },
    { step: "Run Recons", owner: "Reconciliation", status: readiness.openBreaks.length ? "In Progress" : "Completed", detail: `${readiness.openBreaks.length} open break(s)` },
    { step: "Review Breaks", owner: "SME / QA", status: readiness.criticalBreaks.length ? "Escalated" : readiness.openBreaks.length ? "In Progress" : "Completed", detail: `${readiness.criticalBreaks.length} high-risk item(s)` },
    { step: "Post Journals", owner: "Fund Accounting", status: readiness.tbBreak > 1 ? "In Progress" : "Completed", detail: readiness.tbBreak > 1 ? "TB variance under review" : "TB balanced" },
    { step: "Review NAV", owner: "NAV Manager", status: readiness.blocked ? "Pending" : "Completed", detail: `Materiality ${readiness.mat.label}` },
    { step: "Approve", owner: "Controller", status: readiness.blocked ? "Blocked" : "Ready", detail: readiness.blocked ? "Open blockers remain" : "Ready for signoff" },
    { step: "Publish", owner: "Client Reporting", status: readiness.blocked ? "Blocked" : "Ready", detail: readiness.blocked ? "Release held" : "Pack can be sent" },
  ];
  return (
    <section className="panel full">
      <PanelTitle title="Daily NAV Production Workflow" right="Load -> validate -> reconcile -> approve -> publish" />
      <div className="workflow-lane">
        {steps.map((s, index) => <div key={s.step} className={`workflow-step ${s.status.toLowerCase().replace(/\s+/g, "-")}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <b>{s.step}</b>
          <small>{s.owner}</small>
          <p>{s.detail}</p>
          <em>{s.status}</em>
        </div>)}
      </div>
    </section>
  );
}

function NavMovementExplainer() {
  const store = useFundStore();
  const r = useRecalc();
  const rows = navMovementBridgeRows(store, r);
  const movementNotes: Record<string, string> = {
    Subscriptions: "Approved subscriptions increase investor capital and cash before share issuance validation.",
    Redemptions: "Approved redemptions reduce capital or create a redemption payable depending on workflow status.",
    "Realized Gain/Loss": "Closed trades and disposal events flow through realized P&L.",
    "Unrealized Gain/Loss": "Open holdings, pricing changes and MTM movements revalue the portfolio.",
    Income: "Dividend and interest accruals increase NAV when entitlement is valid.",
    Expenses: "Operating, admin, broker and financing expenses reduce NAV.",
    "Management Fees": "Daily fee accrual reduces investor capital and creates fee payable.",
    "Performance Fees": "Incentive allocation applies only when hurdle/HWM eligibility is met.",
    "FX Impact": "Local currency holdings are translated into base NAV through the FX matrix.",
  };
  const explainContext = useFundStore((s) => s.explainContext);
  const topDrivers = [...rows]
    .filter((row) => row.Component !== "Prior NAV" && row.Component !== "Current NAV")
    .sort((a, b) => Math.abs(Number(b.Amount)) - Math.abs(Number(a.Amount)))
    .slice(0, 5);
  return (
    <section className="panel">
      <PanelTitle title="Why Did NAV Move?" right="Top daily movement drivers" />
      <div className="nav-explain-list">
        {topDrivers.map((row) => <div key={row.Component}>
          <span>{row.Component}</span>
          <b className={Number(row.Amount) >= 0 ? "text-good" : "text-bad"}>{fmt(Number(row.Amount), true)}</b>
          <small>{movementNotes[row.Component] ?? "Movement flows into NAV through the central recalculation engine."}</small>
        </div>)}
      </div>
      <button className="terminal-button selected" onClick={() => explainContext({
        tab: "nav",
        title: "Why did NAV move?",
        summary: `Current NAV is ${fmt(r.netAssets, true)}. Main drivers are ${topDrivers.map((x) => `${x.Component} ${fmt(Number(x.Amount), true)}`).join(", ")}.`,
        accountingImpact: "The bridge links subscriptions, redemptions, realized and unrealized P&L, income, fees, FX, and backend GL postings.",
        navImpact: `NAV/share is ${r.navPerShare.toFixed(4)} after recalculation.`,
        recommendedAction: "Review price moves, FX translation, open breaks, fee accruals and workflow approvals before release.",
        relatedEntries: ["NAV Package", "P&L Statement", "General Ledger", "Break Management"],
      })}><Bot size={15} /> AI Explain NAV Movement</button>
    </section>
  );
}

function RoleBasedLens({ readiness }: { readiness: ReturnType<typeof navReadiness> }) {
  const [lens, setLens] = useState<OpsLens>("Leadership");
  const r = useRecalc();
  const store = useFundStore();
  const lensRows: Record<OpsLens, Array<Record<string, ReactNode>>> = {
    Analyst: readiness.openBreaks.slice(0, 6).map((b) => ({ Priority: b.severity, Task: b.rootCause, Owner: b.owner, "NAV Impact": fmt(b.navImpact, true), Action: "Investigate evidence and update notes" })),
    SME: r.exceptions.slice(0, 6).map((e) => ({ Priority: e.severity, Task: e.message, Owner: e.owner, Status: e.status, Action: "Validate root cause and materiality" })),
    Manager: [
      { Area: "Break Queue", Status: `${readiness.openBreaks.length} open`, Risk: readiness.mat.label, Action: "Reassign aging or high impact items" },
      { Area: "Failed Trades", Status: `${readiness.failedTrades} failed`, Risk: readiness.failedTrades ? "Medium" : "Low", Action: "Push broker/custodian follow-up" },
      { Area: "Workflow", Status: store.fundSetup.workflowStatus, Risk: readiness.blocked ? "Blocked" : "Ready", Action: "Confirm maker-checker evidence" },
      { Area: "Pricing", Status: `${readiness.stalePrices} stale`, Risk: readiness.stalePrices ? "High" : "Low", Action: "Request independent price support" },
    ],
    Leadership: [
      { Question: "Can NAV be released?", Answer: readiness.blocked ? "No - release blocked" : "Yes - ready for signoff", Evidence: readiness.blocked ? "Critical controls remain open" : "No material blockers" },
      { Question: "What is the biggest issue?", Answer: readiness.openBreaks[0]?.rootCause ?? "No open break", Evidence: readiness.openBreaks[0] ? fmt(readiness.openBreaks[0].navImpact, true) : "N/A" },
      { Question: "Operational health", Answer: readiness.mat.label, Evidence: `${readiness.openBreaks.length} break(s), ${readiness.openExceptions.length} exception(s)` },
      { Question: "Who needs attention?", Answer: readiness.openBreaks[0]?.owner ?? "No owner pressure", Evidence: readiness.criticalBreaks.length ? "High-risk break ownership required" : "Business-as-usual" },
    ],
  };
  return (
    <section className="panel wide">
      <PanelTitle title="Role-Based Operating Lens" right="Same book, different GCC leadership view" />
      <div className="lens-tabs">
        {(["Analyst", "SME", "Manager", "Leadership"] as OpsLens[]).map((item) => <button key={item} className={lens === item ? "selected" : ""} onClick={() => setLens(item)}>{item}</button>)}
      </div>
      <SimpleRows rows={lensRows[lens]} />
    </section>
  );
}

function BreakEvidencePack({ readiness }: { readiness: ReturnType<typeof navReadiness> }) {
  const store = useFundStore();
  const topBreak = [...readiness.openBreaks].sort((a, b) => Math.abs(b.navImpact) - Math.abs(a.navImpact))[0];
  const explainContext = useFundStore((s) => s.explainContext);
  if (!topBreak) return <section className="panel"><PanelTitle title="Break Evidence Pack" right="No material breaks" /><div className="empty-state">No open break requires evidence.</div></section>;
  const relatedPosition = store.positionRecon.find((p) => topBreak.rootCause.includes(p.ticker) || topBreak.id.includes(p.ticker));
  const relatedCash = store.cashRecon.find((c) => topBreak.breakType === "Cash" && Math.abs(c.internalLedgerCash - c.custodianCash) > 0);
  return (
    <section className="panel">
      <PanelTitle title="Break Evidence Pack" right={topBreak.id} />
      <div className="evidence-pack">
        <div><span>Source Issue</span><b>{topBreak.rootCause}</b></div>
        <div><span>Internal Value</span><b>{relatedPosition ? num(relatedPosition.internalPosition) : relatedCash ? fmt(relatedCash.internalLedgerCash, true) : "Under review"}</b></div>
        <div><span>External Value</span><b>{relatedPosition ? num(relatedPosition.custodianPosition) : relatedCash ? fmt(relatedCash.custodianCash, true) : "Awaiting file"}</b></div>
        <div><span>NAV Impact</span><b>{fmt(topBreak.navImpact, true)}</b></div>
        <div><span>Owner / SLA</span><b>{topBreak.owner} / {topBreak.slaHours}h</b></div>
        <div><span>Resolution</span><b>{topBreak.resolutionNotes}</b></div>
      </div>
      <button className="terminal-button" onClick={() => explainContext({
        tab: "exceptions",
        title: `Evidence pack ${topBreak.id}`,
        summary: topBreak.rootCause,
        accountingImpact: `Break type ${topBreak.breakType} may require adjustment journal or documented no-posting decision.`,
        navImpact: `Estimated NAV impact ${fmt(topBreak.navImpact, true)}.`,
        recommendedAction: "Attach source evidence, confirm internal versus external value, document root cause, then route through maker-checker approval.",
        relatedEntries: ["Break Evidence Pack", "Reconciliation Breaks", "Workflow Approval Queue", "Audit Trail"],
      })}><MessageSquare size={15} /> Prepare Resolution Note</button>
    </section>
  );
}

function Dashboard() {
  const r = useRecalc();
  const store = useFundStore();
  const readiness = navReadiness(store, r);
  return (
    <div className="grid-layout">
      <section className="panel full control-room-hero">
        <div>
          <span>Executive Morning Control Room</span>
          <h2>{readiness.blocked ? "NAV release requires attention" : "NAV release is signoff-ready"}</h2>
          <p>{readiness.blocked ? "Material breaks, stale prices, trial balance variance or approval blockers remain open. Resolve the exception queue before investor release." : "No material blockers detected. Continue final reviewer evidence checks before publication."}</p>
        </div>
        <div className={`release-stamp ${readiness.blocked ? "blocked" : "ready"}`}>{readiness.blocked ? "HOLD NAV" : "READY"}</div>
      </section>
      <section className="metrics-row">
        <Metric label="NAV Status" value={readiness.blocked ? "Blocked" : "Ready"} tone={readiness.blocked ? "bad" : "good"} />
        <Metric label="Net assets" value={fmt(r.netAssets, true)} tone="good" />
        <Metric label="Open breaks" value={String(readiness.openBreaks.length)} tone={readiness.openBreaks.length ? "bad" : "good"} />
        <Metric label="Materiality" value={readiness.mat.label} tone={readiness.mat.tone} />
        <Metric label="Failed trades" value={String(readiness.failedTrades)} tone={readiness.failedTrades ? "warn" : "good"} />
        <Metric label="Missing/stale prices" value={String(readiness.stalePrices)} tone={readiness.stalePrices ? "bad" : "good"} />
        <Metric label="NAV completion" value={`${Math.max(35, 100 - readiness.openBreaks.length * 5 - readiness.stalePrices * 10)}%`} tone={readiness.blocked ? "warn" : "good"} />
        <Metric label="Pending approvals" value={store.fundSetup.workflowStatus === "Approved" ? "0" : "1"} tone={store.fundSetup.workflowStatus === "Approved" ? "good" : "warn"} />
      </section>
      <LearningHint text="Start with NAV, open breaks, and workflow status. Institutional NAV teams clear material breaks before publishing investor-facing NAV." />
      <DailyNavWorkflow readiness={readiness} />
      <RoleBasedLens readiness={readiness} />
      <TopNavIssues readiness={readiness} />
      <OwnershipSlaDashboard readiness={readiness} />
      <NavMovementExplainer />
      <BreakEvidencePack readiness={readiness} />
      <section className="panel wide">
        <PanelTitle title="NAV Waterfall" right="Real-time closing NAV bridge" />
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={r.waterfall}>
            <CartesianGrid stroke="#20343b" />
            <XAxis dataKey="name" stroke="#78909d" tick={{ fontSize: 11 }} />
            <YAxis stroke="#78909d" tickFormatter={(v) => fmt(Number(v), true)} />
            <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: "#101b20", border: "1px solid #263940" }} />
            <Bar dataKey="value">
              {r.waterfall.map((x) => <Cell key={x.name} fill={x.value >= 0 ? "#26d07c" : "#ff5a6a"} />)}
            </Bar>
            <Line type="monotone" dataKey="value" stroke="#47d5e7" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>
      <section className="panel">
        <PanelTitle title="Strategy Exposure" right="Absolute MV" />
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={r.exposures} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96} paddingAngle={2}>
              {r.exposures.map((_, i) => <Cell key={i} fill={["#47d5e7", "#26d07c", "#f3bf45", "#ff5a6a", "#9fb3bd", "#7da0ff"][i % 6]} />)}
            </Pie>
            <Tooltip formatter={(v) => fmt(Number(v), true)} contentStyle={{ background: "#101b20", border: "1px solid #263940" }} />
          </PieChart>
        </ResponsiveContainer>
      </section>
      <ExceptionPanel />
    </div>
  );
}

function PanelTitle({ title, right }: { title: string; right?: string }) {
  return <div className="panel-title"><h2>{title}</h2>{right && <span>{right}</span>}</div>;
}

function HoldingsGrid() {
  const { updateHolding } = useFundStore();
  const r = useRecalc();
  const columns = useMemo<ColumnDef<(typeof r.holdings)[number]>[]>(() => [
    { header: "ISIN", accessorKey: "isin" },
    { header: "Ticker", accessorKey: "ticker" },
    { header: "Asset Type", accessorKey: "assetType" },
    { header: "Strategy", accessorKey: "strategy" },
    { header: "Qty", cell: ({ row }) => <FlashCell id={`${row.original.id}-quantity`}><EditableNumber value={row.original.quantity} onCommit={(v) => updateHolding(row.original.id, "quantity", v)} /></FlashCell> },
    { header: "Cost", cell: ({ row }) => <EditableNumber value={row.original.costPrice} onCommit={(v) => updateHolding(row.original.id, "costPrice", v)} /> },
    { header: "Market", cell: ({ row }) => <FlashCell id={`${row.original.id}-marketPrice`}><EditableNumber value={row.original.marketPrice} onCommit={(v) => updateHolding(row.original.id, "marketPrice", v)} /></FlashCell> },
    { header: "Total Cost", cell: ({ row }) => fmt(row.original.totalCost, true) },
    { header: "Local CCY", accessorKey: "currency" },
    { header: "Base CCY", cell: () => "USD" },
    { header: "Cost FX", cell: ({ row }) => (row.original.costFx ?? row.original.fxRate).toFixed(4) },
    { header: "Current FX", cell: ({ row }) => <FlashCell id={`${row.original.id}-fxRate`}>{row.original.fxRate.toFixed(4)}</FlashCell> },
    { header: "Local MV", cell: ({ row }) => fmt(row.original.localMarketValue, true) },
    { header: "Base MV", cell: ({ row }) => <span className={row.original.baseMarketValue >= 0 ? "text-good" : "text-bad"}>{fmt(row.original.baseMarketValue, true)}</span> },
    { header: "Price P&L", cell: ({ row }) => <span className={row.original.pricePnl >= 0 ? "text-good" : "text-bad"}>{fmt(row.original.pricePnl, true)}</span> },
    { header: "FX P&L", cell: ({ row }) => <span className={row.original.fxPnl >= 0 ? "text-good" : "text-bad"}>{fmt(row.original.fxPnl, true)}</span> },
    { header: "Total Unrealized P&L", cell: ({ row }) => <span className={row.original.totalUnrealizedPnl >= 0 ? "text-good" : "text-bad"}>{fmt(row.original.totalUnrealizedPnl, true)}</span> },
    { header: "Exposure %", cell: ({ row }) => `${row.original.exposurePct.toFixed(2)}%` },
  ], [updateHolding]);
  return <DataTable data={r.holdings} columns={columns} />;
}

function DataTable<T>({ data, columns }: { data: T[]; columns: ColumnDef<T>[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className="table-wrap">
      <table className="data-grid">
        <thead>{table.getHeaderGroups().map((hg) => <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead>
        <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function EditableFieldsView() {
  return (
    <section className="panel full">
      <PanelTitle title="Editable Fields & Controls" right="Manual amendment map and downstream dependencies" />
      <SimpleRows rows={editableMatrix.map((x) => ({ Module: x.module, "Amendable fields": x.fields, "Downstream impact": x.impact }))} />
    </section>
  );
}

function PricingEngine() {
  const { holdings, updateHolding } = useFundStore();
  const rows = holdings.map((h) => ({ ...h, variance: ((h.marketPrice - h.priorPrice) / h.priorPrice) * 100 }));
  return (
    <section className="panel full">
      <PanelTitle title="Real-Time Pricing Console" right="Manual overrides trigger NAV, GL and investor allocation" />
      <FileUploadPanel module="pricing" title="Pricing File Upload" />
      <ManualSubmitBar label="Pricing override workflow" fields="Current Market Price" />
      <div className="table-wrap">
        <table className="data-grid">
          <thead><tr><th>Ticker</th><th>Asset</th><th>Source</th><th>Prior Day</th><th>Current Price</th><th>Move</th><th>Exception</th><th>Last Update</th></tr></thead>
          <tbody>{rows.map((h) => <tr key={h.id}><td>{h.ticker}</td><td>{h.assetType}</td><td>{h.priceSource}</td><td>{num(h.priorPrice)}</td><td><FlashCell id={`${h.id}-marketPrice`}><EditableNumber value={h.marketPrice} onCommit={(v) => updateHolding(h.id, "marketPrice", v)} /></FlashCell></td><td className={h.variance >= 0 ? "text-good" : "text-bad"}>{h.variance.toFixed(2)}%</td><td>{Math.abs(h.variance) > 5 ? <span className="tag bad">Review</span> : <span className="tag good">Clean</span>}</td><td>{new Date(h.lastPriceTime).toLocaleTimeString()}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function FxEngine() {
  const { fxRates, updateFx } = useFundStore();
  return <section className="panel full"><PanelTitle title="Editable FX Matrix" right="Base to USD valuation rates" /><div className="fx-grid">{fxRates.map((fx) => <div className="fx-card" key={fx.pair}><span>{fx.pair}</span><FlashCell id={`fx-${fx.pair}`}><EditableNumber value={fx.rate} onCommit={(v) => updateFx(fx.pair, v)} /></FlashCell><small>{fx.source} · prior {fx.priorRate.toFixed(4)}</small></div>)}</div></section>;
}

function TradeBlotter() {
  const { trades, updateTrade } = useFundStore();
  const signedCash = trades.reduce((sum, t) => sum + tradeCashMovement(t), 0);
  const cashDebit = trades.reduce((sum, t) => sum + tradeCashDebit(t), 0);
  const cashCredit = trades.reduce((sum, t) => sum + tradeCashCredit(t), 0);
  return <section className="panel full"><PanelTitle title="Institutional Trade Booking" right="Booked trades auto-create GL entries" /><div className="balance-banner good">Trade cash movement {fmt(signedCash, true)} = Cash Dr {fmt(cashDebit, true)} - Cash Cr {fmt(cashCredit, true)}</div><div className="table-wrap"><table className="data-grid"><thead><tr><th>Trade Date</th><th>Settle</th><th>Broker</th><th>B/S</th><th>Ticker</th><th>Qty</th><th>Price</th><th>Gross Amount</th><th>Fees</th><th>Cash Dr</th><th>Cash Cr</th><th>Signed Cash Movement</th><th>Status</th><th>Trade ID</th></tr></thead><tbody>{trades.map((t) => <tr key={t.id}><td>{t.tradeDate}</td><td>{t.settleDate}</td><td>{t.broker}</td><td>{t.side}</td><td>{t.ticker}</td><td><EditableNumber value={t.quantity} onCommit={(v) => updateTrade(t.id, "quantity", v)} /></td><td><EditableNumber value={t.price} onCommit={(v) => updateTrade(t.id, "price", v)} /></td><td>{fmt(tradeGross(t), true)}</td><td><EditableNumber value={t.fees} onCommit={(v) => updateTrade(t.id, "fees", v)} /></td><td>{tradeCashDebit(t) ? fmt(tradeCashDebit(t), true) : ""}</td><td>{tradeCashCredit(t) ? fmt(tradeCashCredit(t), true) : ""}</td><td className={tradeCashMovement(t) >= 0 ? "text-good" : "text-bad"}>{fmt(tradeCashMovement(t), true)}</td><td><span className={`tag ${t.status === "Failed" ? "bad" : t.status === "Pending" ? "warn" : "good"}`}>{t.status}</span></td><td>{t.id}</td></tr>)}</tbody></table></div></section>;
}

function GLView() {
  const r = useRecalc();
  const trades = useFundStore((s) => s.trades);
  const blotterCash = trades.reduce((sum, t) => sum + tradeCashMovement(t), 0);
  const glCash = r.gl
    .filter((je) => je.source === "Trade Blotter")
    .flatMap((je) => je.lines)
    .filter((line) => line.account === "Cash at broker")
    .reduce((sum, line) => sum + line.debit - line.credit, 0);
  const matched = Math.abs(blotterCash - glCash) < 1;
  return <section className="panel full"><PanelTitle title="General Ledger" right="Double-entry auto-posting engine" /><div className={`balance-banner ${matched ? "good" : "bad"}`}>Trade Blotter cash movement {fmt(blotterCash, true)} {matched ? "matches" : "does not match"} GL Cash at broker {fmt(glCash, true)}</div><div className="table-wrap"><table className="data-grid"><thead><tr><th>JE</th><th>Date</th><th>Source</th><th>Memo</th><th>Account</th><th>Category</th><th>Debit</th><th>Credit</th><th>Audit Ref</th></tr></thead><tbody>{r.gl.flatMap((je) => je.lines.map((l, idx) => <tr key={`${je.id}-${idx}`}><td>{je.id}</td><td>{je.date}</td><td>{je.source}</td><td>{je.memo}</td><td>{l.account}</td><td>{l.category}</td><td>{l.debit ? fmt(l.debit, true) : ""}</td><td>{l.credit ? fmt(l.credit, true) : ""}</td><td>{l.ref}</td></tr>))}</tbody></table></div></section>;
}

function TrialBalance() {
  const r = useRecalc();
  const debit = r.trialBalance.reduce((s, x) => s + x.debit, 0);
  const credit = r.trialBalance.reduce((s, x) => s + x.credit, 0);
  const balanced = Math.abs(debit - credit) < 1;
  return <section className="panel full"><PanelTitle title="Trial Balance" right={balanced ? "BALANCED" : "OUT OF BALANCE"} /><div className={`balance-banner ${balanced ? "good" : "bad"}`}>{balanced ? "✓ BALANCED" : "⚠ OUT OF BALANCE"} · debit {fmt(debit, true)} / credit {fmt(credit, true)}</div><SimpleRows rows={r.trialBalance.map((x) => ({ Account: x.account, Category: x.category, Debit: fmt(x.debit, true), Credit: fmt(x.credit, true), Balance: fmt(x.balance, true) }))} /></section>;
}

function Statements({ kind }: { kind: "pl" | "balance" | "nav" }) {
  const r = useRecalc();
  const store = useFundStore();
  if (kind === "pl") {
    const backendAdjustment = store.backendNavAdjustments;
    const grossIncome = r.dividendIncome + r.interestIncome + r.realizedGains + r.unrealizedGains + r.fxGainLoss + backendAdjustment;
    const financingCost = 92000;
    const auditFee = 28000;
    const adminFee = 65000;
    const totalExpenses = r.managementFee + r.performanceFee + r.brokerFees + financingCost + auditFee + adminFee;
    return <section className="panel full">
      <PanelTitle title="P&L Statement" right="Sectioned institutional income statement" />
      {backendAdjustment !== 0 && <div className={`pl-posting-strip ${backendAdjustment >= 0 ? "good" : "bad"}`}>
        <div>
          <span>Backend GL Posting Impact</span>
          <b>{fmt(backendAdjustment, true)}</b>
        </div>
        <p>Approved maker-checker workflow postings have been absorbed into P&L, trial balance, balance sheet and NAV.</p>
      </div>}
      <SimpleRows rows={[
      { Section: "INCOME", Line: "Dividend Income", Amount: fmt(r.dividendIncome, true) },
      { Section: "INCOME", Line: "Interest Income", Amount: fmt(r.interestIncome, true) },
      { Section: "INCOME", Line: "Realized Gain/Loss", Amount: fmt(r.realizedGains, true) },
      { Section: "INCOME", Line: "Unrealized Gain/Loss", Amount: fmt(r.unrealizedGains, true) },
      { Section: "INCOME", Line: "Backend Posted GL Adjustments", Amount: fmt(backendAdjustment, true) },
      { Section: "INCOME", Line: "FX Gain/Loss", Amount: fmt(r.fxGainLoss, true) },
      { Section: "TOTAL", Line: "Gross Income", Amount: fmt(grossIncome, true) },
      { Section: "EXPENSES", Line: "Management Fee", Amount: fmt(-r.managementFee, true) },
      { Section: "EXPENSES", Line: "Performance Fee", Amount: fmt(-r.performanceFee, true) },
      { Section: "EXPENSES", Line: "Broker Fee", Amount: fmt(-r.brokerFees, true) },
      { Section: "EXPENSES", Line: "Financing Cost", Amount: fmt(-financingCost, true) },
      { Section: "EXPENSES", Line: "Audit Fee", Amount: fmt(-auditFee, true) },
      { Section: "EXPENSES", Line: "Admin Fee", Amount: fmt(-adminFee, true) },
      { Section: "TOTAL", Line: "Total Expenses", Amount: fmt(-totalExpenses, true) },
      { Section: "TOTAL", Line: "Net Investment Income", Amount: fmt(r.dividendIncome + r.interestIncome - totalExpenses, true) },
      { Section: "TOTAL", Line: "Net Profit/Loss", Amount: fmt(grossIncome - totalExpenses, true) },
    ]} />
    </section>;
  }
  if (kind === "balance") {
    const assetRows = r.balanceSheet.filter((x) => x.section === "Assets");
    const liabilityRows = r.balanceSheet.filter((x) => x.section === "Liabilities");
    const capitalRows = r.balanceSheet.filter((x) => x.section === "Capital");
    const assets = assetRows.reduce((s, x) => s + x.amount, 0);
    const liabilities = liabilityRows.reduce((s, x) => s + x.amount, 0);
    const capital = capitalRows.reduce((s, x) => s + x.amount, 0);
    return <section className="panel full"><PanelTitle title="Balance Sheet" right="Assets = Liabilities + Capital validation" /><div className={`balance-banner ${Math.abs(assets - liabilities - capital) < 1 ? "good" : "bad"}`}>Assets {fmt(assets, true)} = Liabilities {fmt(liabilities, true)} + Capital {fmt(capital, true)}</div><SimpleRows rows={[...r.balanceSheet.map((x) => ({ Section: x.section, Line: x.line, Amount: fmt(x.amount, true) })), { Section: "Assets", Line: "TOTAL ASSETS", Amount: fmt(assets, true) }, { Section: "Liabilities", Line: "TOTAL LIABILITIES", Amount: fmt(liabilities, true) }, { Section: "Capital", Line: "TOTAL CAPITAL", Amount: fmt(capital, true) }]} /></section>;
  }
  return (
    <section className="panel full nav-package">
      <PanelTitle title="NAV Package" right="Core valuation package" />
      <div className="metrics-row">
        <Metric label="Gross assets" value={fmt(r.grossAssets, true)} />
        <Metric label="Liabilities" value={fmt(r.liabilities, true)} tone="warn" />
        <Metric label="Net assets" value={fmt(r.netAssets, true)} tone="good" />
        <Metric label="Investor capital" value={fmt(r.investorCapital, true)} />
        <Metric label="Shares outstanding" value={num(r.sharesOutstanding)} />
        <Metric label="NAV/share" value={r.navPerShare.toFixed(4)} tone="good" />
      </div>
      <NavPackInputCenter />
      <SimpleRows rows={[
        { Item: "High water mark base", Value: fmt(store.investors.reduce((s, i) => s + i.hwm * i.shares, 0), true) },
        { Item: "Equalization credits", Value: fmt(store.investors.reduce((s, i) => s + i.equalizationCredit, 0), true) },
        { Item: "Management fee accrual", Value: fmt(r.managementFee) },
        { Item: "Performance fee accrual", Value: fmt(r.performanceFee) },
      ]} />
      <div className="mini-waterfall">
        {r.waterfall.map((w) => <div key={w.name} className={w.value >= 0 ? "step good" : "step bad"}><span>{w.name}</span><b>{fmt(w.value, true)}</b></div>)}
      </div>
    </section>
  );
}

function InvestorView({ fees = false }: { fees?: boolean }) {
  const { investors, updateInvestor, managementFeePct, performanceFeePct, setFee } = useFundStore();
  const r = useRecalc();
  return <section className="panel full"><PanelTitle title={fees ? "Fee Engine" : "Investor Capital Activity"} right="Allocation basis updates NAV/share and statements" />{fees && <div className="fee-controls"><label>Management fee <EditableNumber value={managementFeePct} onCommit={(v) => setFee("management", v)} /></label><label>Performance fee <EditableNumber value={performanceFeePct} onCommit={(v) => setFee("performance", v)} /></label><span>Daily accrual: average NAV × fee % ÷ 365 = {fmt(r.managementFee)}</span></div>}<div className="table-wrap"><table className="data-grid"><thead><tr><th>Investor</th><th>Class</th><th>Capital</th><th>Shares</th><th>HWM</th><th>Equalization</th><th>Allocation %</th></tr></thead><tbody>{investors.map((i) => <tr key={i.id}><td>{i.name}</td><td>{i.className}</td><td><EditableNumber value={i.capital} onCommit={(v) => updateInvestor(i.id, "capital", v)} /></td><td><EditableNumber value={i.shares} onCommit={(v) => updateInvestor(i.id, "shares", v)} /></td><td><EditableNumber value={i.hwm} onCommit={(v) => updateInvestor(i.id, "hwm", v)} /></td><td>{fmt(i.equalizationCredit, true)}</td><td>{((i.capital / r.investorCapital) * 100).toFixed(2)}%</td></tr>)}</tbody></table></div></section>;
}

function ManagementFeeInvestorLevelView() {
  const store = useFundStore();
  const r = useRecalc();
  const { managementRows } = investorFeeSchedules(store, r);
  const totalGross = managementRows.reduce((sum, row) => sum + row.grossManagementFee, 0);
  const glFee = r.trialBalance.find((x) => x.account === "Management fee expense")?.debit ?? 0;
  return (
    <section className="panel full">
      <PanelTitle title="Management Fee - Investor Level Actual Values" right="Investor fee basis reconciles to GL, TB, income statement and NAV summary" />
      <div className="fee-controls">
        <label>Management fee % <EditableNumber value={store.managementFeePct} onCommit={(v) => store.setFee("management", v)} /></label>
        <span>Total investor fee {fmt(totalGross, true)}</span>
        <span className={Math.abs(totalGross - glFee) < 1 ? "text-good" : "text-bad"}>GL tie-out {Math.abs(totalGross - glFee) < 1 ? "Matched" : "Exception"}</span>
      </div>
      <SimpleRows rows={managementRows.map((row) => ({
        "Investor Name": row.investorName,
        "Opening Capital": fmt(row.openingCapital, true),
        "Capital Contribution": fmt(row.capitalContribution, true),
        Redemption: fmt(row.redemption, true),
        "Ending Capital Before Fees": fmt(row.endingCapitalBeforeFees, true),
        "Fee Basis": row.feeBasisOption,
        "Fee Basis Amount": fmt(row.feeBasis, true),
        "Management Fee %": pct(row.managementFeePct),
        "Gross Management Fee": fmt(row.grossManagementFee, true),
        "Fee Already Paid": fmt(row.feeAlreadyPaid, true),
        "Fee Payable": fmt(row.feePayable, true),
        "Fee Accrued": fmt(row.feeAccrued, true),
        "Net Capital After Management Fee": fmt(row.netCapitalAfterManagementFee, true),
      }))} />
    </section>
  );
}

function PerformanceFeeValidationPanel() {
  const store = useFundStore();
  const r = useRecalc();
  const { performanceRows } = investorFeeSchedules(store, r);
  const priorNav = store.activeScenarioImpact?.before.nav ?? r.investorCapital;
  const grossReturnPct = priorNav ? (r.netAssets - priorNav) / Math.abs(priorNav) : 0;
  const benchmarkPct = 0.04;
  const hurdlePct = store.fundSetup.hurdleRate;
  const totalEarned = performanceRows.reduce((sum, row) => sum + row.performanceFeeEarned, 0);
  return (
    <div className="control-grid">
      <Metric label="Opening NAV" value={fmt(priorNav, true)} />
      <Metric label="Closing NAV" value={fmt(r.netAssets, true)} tone="good" />
      <Metric label="Gross return" value={pct(grossReturnPct)} tone={grossReturnPct > hurdlePct ? "good" : "warn"} />
      <Metric label="Benchmark / Hurdle" value={`${pct(benchmarkPct)} / ${pct(hurdlePct)}`} />
      <Metric label="Eligibility" value={totalEarned > 0 ? "Eligible" : "Not Eligible"} tone={totalEarned > 0 ? "good" : "warn"} />
      <Metric label="Total incentive fee" value={fmt(totalEarned, true)} />
    </div>
  );
}

function PerformanceFeeInvestorLevelView() {
  const store = useFundStore();
  const r = useRecalc();
  const { performanceRows } = investorFeeSchedules(store, r);
  const totalEarned = performanceRows.reduce((sum, row) => sum + row.performanceFeeEarned, 0);
  const glFee = r.trialBalance.find((x) => x.account === "Performance fee expense")?.debit ?? 0;
  return (
    <section className="panel full">
      <PanelTitle title="Performance Fee - Investor Level Actual Values" right="Eligibility: benchmark, hurdle, high water mark and crystallization" />
      <div className="fee-controls">
        <label>Performance fee % <EditableNumber value={store.performanceFeePct} onCommit={(v) => store.setFee("performance", v)} /></label>
        <span>Total incentive fee {fmt(totalEarned, true)}</span>
        <span className={Math.abs(totalEarned - glFee) < 1 ? "text-good" : "text-bad"}>GL tie-out {Math.abs(totalEarned - glFee) < 1 ? "Matched" : "Exception"}</span>
      </div>
      <PerformanceFeeValidationPanel />
      <SimpleRows rows={performanceRows.map((row) => ({
        "Investor Name": row.investorName,
        "Opening Capital": fmt(row.openingCapital, true),
        Subscriptions: fmt(row.subscriptions, true),
        Redemptions: fmt(row.redemptions, true),
        "Ending Capital Before Performance Fee": fmt(row.endingCapitalBeforePerformanceFee, true),
        "Gross Profit / Loss": fmt(row.grossProfitLoss, true),
        "Benchmark Return %": pct(row.benchmarkReturnPct),
        "Benchmark Amount": fmt(row.benchmarkAmount, true),
        "Hurdle Rate %": pct(row.hurdleRatePct),
        "Hurdle Amount": fmt(row.hurdleAmount, true),
        "Excess Profit": fmt(row.grossProfitLoss > 0 ? Math.max(row.grossProfitLoss - row.hurdleAmount, 0) : 0, true),
        "High Water Mark": fmt(row.highWaterMark, true),
        "Performance Fee %": pct(row.performanceFeePct),
        "Performance Fee Earned": fmt(row.performanceFeeEarned, true),
        "Performance Fee Paid": fmt(row.performanceFeePaid, true),
        "Performance Fee Payable": fmt(row.performanceFeePayable, true),
        "Equalization Adjustment": fmt(row.equalizationAdjustment, true),
        "Net Investor Capital After Performance Fee": fmt(row.netInvestorCapitalAfterPerformanceFee, true),
        Status: row.reason,
      }))} />
    </section>
  );
}

function InvestmentExitWaterfallView() {
  const store = useFundStore();
  const r = useRecalc();
  const [inputs, setInputs] = useState(defaultWaterfallInputs(r));
  useEffect(() => {
    setInputs(defaultWaterfallInputs(r));
  }, [r.netAssets, r.investorCapital]);
  const waterfall = waterfallEngine(store, r, inputs);
  const setInput = (field: keyof typeof inputs, value: number) => setInputs((current) => ({ ...current, [field]: value }));
  return (
    <section className="panel full">
      <PanelTitle title="Investment_Exit_Waterfall" right="ROC, preferred return, GP catch-up and residual carry split" />
      <div className="form-grid compact">
        <label><span>Total Exit Proceeds</span><EditableNumber value={inputs.totalExitProceeds} onCommit={(v) => setInput("totalExitProceeds", v)} /></label>
        <label><span>Total LP Capital Contribution</span><EditableNumber value={inputs.totalLpCapitalContribution} onCommit={(v) => setInput("totalLpCapitalContribution", v)} /></label>
        <label><span>Total GP Capital Contribution</span><EditableNumber value={inputs.totalGpCapitalContribution} onCommit={(v) => setInput("totalGpCapitalContribution", v)} /></label>
        <label><span>Preferred Return %</span><EditableNumber value={inputs.preferredReturnPct} onCommit={(v) => setInput("preferredReturnPct", v)} /></label>
        <label><span>GP Catch-Up %</span><EditableNumber value={inputs.gpCatchUpPct} onCommit={(v) => setInput("gpCatchUpPct", v)} /></label>
        <label><span>LP Carry Split %</span><EditableNumber value={inputs.lpCarryPct} onCommit={(v) => setInput("lpCarryPct", v)} /></label>
        <label><span>GP Carry Split %</span><EditableNumber value={inputs.gpCarryPct} onCommit={(v) => setInput("gpCarryPct", v)} /></label>
      </div>
      <div className={`balance-banner ${waterfall.controlStatus === "Pass" ? "good" : "bad"}`}>
        Total Distributed {fmt(waterfall.totalDistributed, true)} = Exit Proceeds {fmt(inputs.totalExitProceeds, true)} - {waterfall.controlStatus}
      </div>
      <SimpleRows rows={waterfall.steps.map((step) => ({
        Step: step.step,
        "LP Amount": fmt(step.lpAmount, true),
        "GP Amount": fmt(step.gpAmount, true),
        "Remaining Proceeds": fmt(step.remainingAfterStep, true),
      }))} />
      <SimpleRows rows={waterfall.partnerRows.map((row) => ({
        "Partner Name": row.partnerName,
        "Partner Type": row.partnerType,
        "Capital Contribution": fmt(row.capitalContribution, true),
        "Ownership %": pct(row.ownershipPct),
        "ROC Received": fmt(row.rocReceived, true),
        "Preferred Return Received": fmt(row.preferredReturnReceived, true),
        "GP Catch-Up Received": fmt(row.gpCatchUpReceived, true),
        "Residual Split Received": fmt(row.residualSplitReceived, true),
        "Total Distribution": fmt(row.totalDistribution, true),
        "Remaining Unreturned Capital": fmt(row.remainingUnreturnedCapital, true),
        "Final Multiple / MOIC": `${row.moic.toFixed(2)}x`,
      }))} />
    </section>
  );
}

function DerivativesView() {
  const { derivatives, updateDerivative } = useFundStore();
  return <section className="panel full"><PanelTitle title="OTC Derivatives and MTM" right="MTM is valuation; exposure is counterparty risk after collateral and haircut" /><div className="table-wrap"><table className="data-grid"><thead><tr><th>Type</th><th>Reference</th><th>Notional</th><th>MTM</th><th>Gross Exposure</th><th>Net Exposure</th><th>PFE</th><th>Collateral Posted</th><th>Counterparty Exposure</th><th>ISDA Threshold</th><th>Margin Utilization</th><th>Haircut</th><th>Counterparty</th></tr></thead><tbody>{derivatives.map((d) => {
    const grossExposure = Math.abs(d.notional);
    const pfe = grossExposure * 0.035;
    const haircut = d.collateral * 0.08;
    const netExposure = Math.max(d.mtm + pfe - d.collateral + haircut, 0);
    const threshold = grossExposure * 0.01;
    return <tr key={d.id}><td>{d.type}</td><td>{d.reference}</td><td>{fmt(d.notional, true)}</td><td><FlashCell id={`${d.id}-mtm`}><EditableNumber value={d.mtm} onCommit={(v) => updateDerivative(d.id, "mtm", v)} /></FlashCell></td><td>{fmt(grossExposure, true)}</td><td>{fmt(netExposure, true)}</td><td>{fmt(pfe, true)}</td><td><EditableNumber value={d.collateral} onCommit={(v) => updateDerivative(d.id, "collateral", v)} /></td><td className={netExposure > threshold ? "text-bad" : "text-good"}>{fmt(netExposure, true)}</td><td>{fmt(threshold, true)}</td><td>{((d.collateral / Math.max(threshold, 1)) * 100).toFixed(1)}%</td><td>{fmt(haircut, true)}</td><td>{d.counterparty}</td></tr>;
  })}</tbody></table></div></section>;
}

function AccrualsView({ kind }: { kind: "Dividend" | "Coupon" }) {
  const accruals = useFundStore((s) => s.accruals);
  const rows = useMemo(() => accruals.filter((a) => a.kind === kind), [accruals, kind]);
  return <section className="panel full"><PanelTitle title={`${kind} Accruals`} right="Accrual journals are auto-generated" /><SimpleRows rows={rows.map((a) => kind === "Dividend" ? { Ticker: a.ticker, "Ex-date": a.exDate, "Pay-date": a.payDate, "Shares eligible": num(a.sharesEligible ?? 0), "Withholding tax": pct(a.withholdingTax ?? 0), "Net dividend": fmt(a.netDividend ?? 0) } : { Ticker: a.ticker, "Coupon %": `${a.couponPct}%`, "Accrual days": a.accrualDays, "Accrued interest": fmt(a.accruedInterest ?? 0), "Clean price": a.cleanPrice, "Dirty price": a.dirtyPrice })} /></section>;
}

function ExceptionPanel() {
  const r = useRecalc();
  return <section className="panel"><PanelTitle title="Exception Management" right="Live controls" /><div className="exception-list">{r.exceptions.slice(0, 25).map((e) => <div key={e.id} className={`exception ${e.severity.toLowerCase()}`}><b>{e.severity}</b><span>{e.module}</span><p>{e.message}</p><small>{e.owner} · {e.status}</small></div>)}</div></section>;
}

function AuditTrail() {
  const audit = useFundStore((s) => s.auditTrail);
  return <section className="panel full"><PanelTitle title="Audit Trail" right="Every source edit captures downstream impact" /><SimpleRows rows={audit.map((a) => ({ Timestamp: new Date(a.timestamp).toLocaleString(), Field: a.field, Old: a.oldValue, New: a.newValue, "Impacted modules": a.impactedModules.length, Action: a.action }))} empty="No edits yet. Change a price, FX rate, trade or fee to generate audit events." /></section>;
}

function FundMasterSetup() {
  const { fundSetup, updateFundSetup, updateWorkflow } = useFundStore();
  const textFields: Array<[keyof typeof fundSetup, string]> = [
    ["fundName", "Fund Name"], ["fundType", "Fund Type"], ["navFrequency", "NAV Frequency"],
    ["inceptionDate", "Inception Date"], ["fiscalYearEnd", "Fiscal Year End"], ["primeBroker", "Prime Broker"], ["custodian", "Custodian"],
    ["administrator", "Administrator"], ["auditor", "Auditor"], ["legalEntity", "Legal Entity"], ["redemptionTerms", "Redemption Terms"],
    ["subscriptionTerms", "Subscription Terms"], ["lockupTerms", "Lock-up Terms"], ["valuationCutoff", "Valuation Cutoff"], ["shareClasses", "Share Classes"],
  ];
  return (
    <section className="panel full">
      <PanelTitle title="Fund Master Setup" right={`Workflow: ${fundSetup.workflowStatus}`} />
      <WorkflowButtons current={fundSetup.workflowStatus} onChange={updateWorkflow} />
      <div className="form-grid">
        <label><span>Fund Structure</span><select className="terminal-select" value={normalizedStructure(fundSetup.fundStructure)} onChange={(e) => updateFundSetup("fundStructure", e.target.value)}>{fundStructureOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        {textFields.map(([field, label]) => (
          <label key={String(field)}><span>{label}</span><EditableText value={String(fundSetup[field])} onCommit={(v) => updateFundSetup(field, v)} /></label>
        ))}
        <label><span>Base Currency</span><select className="terminal-select" value={fundSetup.baseCurrency} onChange={(e) => updateFundSetup("baseCurrency", e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>JPY</option></select></label>
        <label><span>Management Fee %</span><EditableNumber value={fundSetup.managementFeePct} onCommit={(v) => updateFundSetup("managementFeePct", v)} /></label>
        <label><span>Performance Fee %</span><EditableNumber value={fundSetup.performanceFeePct} onCommit={(v) => updateFundSetup("performanceFeePct", v)} /></label>
        <label><span>Hurdle Rate</span><EditableNumber value={fundSetup.hurdleRate} onCommit={(v) => updateFundSetup("hurdleRate", v)} /></label>
        <label><span>High Water Mark Enabled</span><select className="terminal-select" value={fundSetup.highWaterMarkEnabled ? "Yes" : "No"} onChange={(e) => updateFundSetup("highWaterMarkEnabled", e.target.value === "Yes")}><option>Yes</option><option>No</option></select></label>
      </div>
      <FundStructureSelectedView />
    </section>
  );
}

function FundStructureSelectedView() {
  const store = useFundStore();
  const r = useRecalc();
  const structure = normalizedStructure(store.fundSetup.fundStructure);
  const bridge = structureNavBridgeRows(store, r);
  return (
    <div className="structure-subsection">
      <PanelTitle title={`${structure} View`} right="Structure-specific NAV derivation, capital flow and fee treatment" />
      <div className="metrics-row">
        <Metric label="Structure" value={structure} />
        <Metric label="Live NAV" value={fmt(r.netAssets, true)} tone="good" />
        <Metric label="Investor capital" value={fmt(r.investorCapital, true)} />
        <Metric label="Structure nodes" value={String(bridge.length)} />
      </div>
      <SimpleRows rows={structureSpecificRows(store, r).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? fmt(value, true) : value])))} />
    </div>
  );
}

function FundStructureComparisonView() {
  const store = useFundStore();
  const r = useRecalc();
  const selected = normalizedStructure(store.fundSetup.fundStructure);
  const bridge = structureNavBridgeRows(store, r);
  return (
    <>
      <section className="panel full">
        <PanelTitle title="Fund_Structure_Comparison" right="Compare NAV methodology, fee treatment and operational complexity" />
        <div className="fee-controls">
          <label>Selected structure <select className="terminal-select" value={selected} onChange={(e) => store.updateFundSetup("fundStructure", e.target.value)}>{fundStructureOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <span>Current NAV {fmt(r.netAssets, true)}</span>
          <span>Capital pool {fmt(r.investorCapital, true)}</span>
        </div>
        <SimpleRows rows={structureComplexityRows().map((row) => ({ ...row, Selected: row.Structure === selected ? "Active" : "" }))} />
      </section>
      <section className="panel full">
        <PanelTitle title="Structure-Level NAV Bridge" right="How NAV is derived under the selected structure" />
        <SimpleRows rows={bridge.map((row) => ({
          Level: row.Level,
          Component: row.Component,
          Amount: fmt(Number(row.Amount), true),
          "Ownership / Allocation": pct(Number(row.Ownership)),
          Notes: row.Notes,
        }))} />
      </section>
      <section className="panel full">
        <PanelTitle title="Structure-Specific Reporting Schedules" right="Schedules that would be added to the NAV Pack for this structure" />
        <SimpleRows rows={structureSpecificRows(store, r).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? fmt(value, true) : value])))} />
      </section>
    </>
  );
}

function SecurityMasterView() {
  const rows = useFundStore((s) => s.securityMaster);
  return (
    <section className="panel full">
      <PanelTitle title="Security Master" right="Valuation source, hierarchy, liquidity and tolerance controls" />
      <SimpleRows rows={rows.map((s) => ({
        ISIN: s.isin, "Bloomberg Ticker": s.bloombergTicker, "Asset Type": s.assetType, Description: s.description, Country: s.country,
        Exchange: s.exchange, Currency: s.currency, Sector: s.sector, Industry: s.industry, "Pricing Source": s.pricingSource,
        "Valuation Hierarchy": s.valuationHierarchy, Liquidity: s.liquidityClassification, Coupon: s.couponRate ?? "-", Maturity: s.maturityDate ?? "-",
        Multiplier: s.contractMultiplier ?? "-", Underlying: s.underlyingSecurity ?? "-", "Option Type": s.optionType ?? "-", Strike: s.strike ?? "-",
        Expiry: s.expiry ?? "-", Settlement: s.settlementType, Stale: s.stalePricing ? "Yes" : "No", "Tolerance Breach": s.toleranceBreach ? "Breach" : "Clean",
      }))} />
    </section>
  );
}

function CorporateActionsView() {
  const { corporateActions, updateCorporateAction } = useFundStore();
  return (
    <section className="panel full">
      <PanelTitle title="Corporate Actions Processing" right="Accrual, receivable/payable, GL and cash-settlement workflow" />
      <ManualSubmitBar label="Corporate action workflow" fields="Ex-Date, Record Date, Pay Date, Eligible Quantity, Gross Amount, Withholding Tax, Net Receivable, Status, Posting Status" />
      <SimpleRows rows={corporateActions.map((c) => ({
        "Event Type": c.eventType,
        Security: c.security,
        "Ex-Date": <EditableText value={c.exDate} onCommit={(v) => updateCorporateAction(c.id, "exDate", v)} />,
        "Record Date": <EditableText value={c.recordDate} onCommit={(v) => updateCorporateAction(c.id, "recordDate", v)} />,
        "Pay Date": <EditableText value={c.payDate} onCommit={(v) => updateCorporateAction(c.id, "payDate", v)} />,
        "Eligible Qty": <FlashCell id={`${c.id}-eligibleQuantity`}><EditableNumber value={c.eligibleQuantity} onCommit={(v) => updateCorporateAction(c.id, "eligibleQuantity", v)} /></FlashCell>,
        "Gross Amount": <FlashCell id={`${c.id}-grossAmount`}><EditableNumber value={c.grossAmount} onCommit={(v) => updateCorporateAction(c.id, "grossAmount", v)} /></FlashCell>,
        "Withholding Tax": <FlashCell id={`${c.id}-withholdingTax`}><EditableNumber value={c.withholdingTax} onCommit={(v) => updateCorporateAction(c.id, "withholdingTax", v)} /></FlashCell>,
        "Net Receivable": <FlashCell id={`${c.id}-netReceivable`}><EditableNumber value={c.netReceivable} onCommit={(v) => updateCorporateAction(c.id, "netReceivable", v)} /></FlashCell>,
        Status: <select className="terminal-select" value={c.status} onChange={(e) => updateCorporateAction(c.id, "status", e.target.value)}><option>Announced</option><option>Validated</option><option>Booked</option><option>Settled</option></select>,
        "Posting Status": <select className="terminal-select" value={c.postingStatus} onChange={(e) => updateCorporateAction(c.id, "postingStatus", e.target.value)}><option>Pending</option><option>Accrued</option><option>Posted</option><option>Cash Settled</option></select>,
        "NAV Impact": fmt(c.netReceivable, true),
      }))} />
    </section>
  );
}

function CashReconciliationView() {
  const { cashRecon, updateCashRecon } = useFundStore();
  return <section className="panel full"><PanelTitle title="Cash Reconciliation" right="Internal ledger vs custodian vs prime broker cash" /><ManualSubmitBar label="Cash reconciliation workflow" fields="Internal Ledger Cash, Custodian Cash, Prime Broker Cash, Break Reason, Owner" /><SimpleRows rows={cashRecon.map((r) => {
    const custodianDifference = r.internalLedgerCash - r.custodianCash;
    const primeBrokerDifference = r.internalLedgerCash - r.primeBrokerCash;
    const matched = Math.abs(custodianDifference) < 1 && Math.abs(primeBrokerDifference) < 1;
    const status = matched && r.status !== "Approved" ? "Resolved" : r.status;
    return { Currency: r.currency, "Internal Ledger Cash": <FlashCell id={`${r.id}-internalLedgerCash`}><EditableNumber value={r.internalLedgerCash} onCommit={(v) => updateCashRecon(r.id, "internalLedgerCash", v)} /></FlashCell>, "Custodian Cash": <FlashCell id={`${r.id}-custodianCash`}><EditableNumber value={r.custodianCash} onCommit={(v) => updateCashRecon(r.id, "custodianCash", v)} /></FlashCell>, "Prime Broker Cash": <FlashCell id={`${r.id}-primeBrokerCash`}><EditableNumber value={r.primeBrokerCash} onCommit={(v) => updateCashRecon(r.id, "primeBrokerCash", v)} /></FlashCell>, "Custodian Difference": fmt(custodianDifference, true), "PB Difference": fmt(primeBrokerDifference, true), "Break Reason": <EditableText value={matched ? "Matched" : r.breakReason} onCommit={(v) => updateCashRecon(r.id, "breakReason", v)} />, Owner: <EditableText value={r.owner} onCommit={(v) => updateCashRecon(r.id, "owner", v)} />, Status: status };
  })} /></section>;
}

function PositionReconciliationView() {
  const { positionRecon, updatePositionRecon } = useFundStore();
  return <section className="panel full"><PanelTitle title="Position Reconciliation" right="Internal positions vs custodian and prime broker records" /><ManualSubmitBar label="Position reconciliation workflow" fields="Internal Position, Custodian Position, PB Position, Break Reason, Owner" /><SimpleRows rows={positionRecon.map((r) => {
    const custodianDifference = r.internalPosition - r.custodianPosition;
    const primeBrokerDifference = r.internalPosition - r.pbPosition;
    const matched = Math.abs(custodianDifference) < 1 && Math.abs(primeBrokerDifference) < 1;
    const status = matched && r.status !== "Approved" ? "Resolved" : r.status;
    const settlementStatus = matched ? "Settled" : r.settlementStatus;
    return { Ticker: r.ticker, "Internal Position": <FlashCell id={`${r.id}-internalPosition`}><EditableNumber value={r.internalPosition} onCommit={(v) => updatePositionRecon(r.id, "internalPosition", v)} /></FlashCell>, "Custodian Position": <FlashCell id={`${r.id}-custodianPosition`}><EditableNumber value={r.custodianPosition} onCommit={(v) => updatePositionRecon(r.id, "custodianPosition", v)} /></FlashCell>, "PB Position": <FlashCell id={`${r.id}-pbPosition`}><EditableNumber value={r.pbPosition} onCommit={(v) => updatePositionRecon(r.id, "pbPosition", v)} /></FlashCell>, "Custodian Difference": num(custodianDifference), "PB Difference": num(primeBrokerDifference), "Settlement Status": settlementStatus, "Break Reason": <EditableText value={matched ? "Matched" : r.breakReason} onCommit={(v) => updatePositionRecon(r.id, "breakReason", v)} />, Owner: <EditableText value={r.owner} onCommit={(v) => updatePositionRecon(r.id, "owner", v)} />, Status: status };
  })} /></section>;
}

function BreaksDashboard() {
  const { breaks, updateBreak, setActiveModule, explainContext } = useFundStore();
  const [selectedBreakId, setSelectedBreakId] = useState(breaks[0]?.id ?? "");
  const selectedBreak = breaks.find((b) => b.id === selectedBreakId) ?? breaks[0];
  const sourceModule = selectedBreak ? moduleForBreak(selectedBreak.breakType) : "nav";
  return (
    <section className="panel full">
      <PanelTitle title="Centralized Breaks Dashboard" right="Assignment, SLA, escalation and resolution workflow" />
      <div className="break-actions"><span>Actions available: manual match, force match, split, merge, write off immaterial, pass adjustment journal, create manual accrual, rerun reconciliation.</span></div>
      {selectedBreak && <div className="break-evidence-detail">
        <div>
          <span>Selected Evidence Pack</span>
          <b>{selectedBreak.id} / {selectedBreak.breakType}</b>
          <small>{selectedBreak.rootCause}</small>
        </div>
        <div><span>Internal Source</span><b>{modules.find((m) => m.id === sourceModule)?.label}</b><small>Open the operational source table for investigation.</small></div>
        <div><span>GL / NAV Impact</span><b>{fmt(selectedBreak.navImpact, true)}</b><small>{selectedBreak.severity} severity, escalation {selectedBreak.escalationLevel}</small></div>
        <div><span>Audit Evidence</span><b>{selectedBreak.resolutionNotes}</b><small>{selectedBreak.comments.join(" | ")}</small></div>
        <button className="terminal-button selected" onClick={() => setActiveModule(sourceModule)}>Open Source Data</button>
        <button className="terminal-button" onClick={() => setActiveModule("gl")}>Open GL Impact</button>
        <button className="terminal-button" onClick={() => setActiveModule("nav")}>Open NAV Impact</button>
        <button className="terminal-button" onClick={() => setActiveModule("audit")}>Open Audit Trail</button>
      </div>}
      <div className="table-wrap"><table className="data-grid"><thead><tr><th>Break ID</th><th>Type</th><th>Severity</th><th>Aging</th><th>Owner</th><th>NAV Impact</th><th>Root Cause</th><th>Status</th><th>Resolution Notes</th><th>Escalation</th><th>SLA</th><th>Comments</th><th>Evidence / Drilldown</th><th>Workflow Actions</th><th>AI</th></tr></thead><tbody>{breaks.map((b) => <tr key={b.id}><td><button className="link-button" onClick={() => setSelectedBreakId(b.id)}>{b.id}</button></td><td>{b.breakType}</td><td><span className={`tag ${b.severity === "Critical" || b.severity === "High" ? "bad" : b.severity === "Medium" ? "warn" : "good"}`}>{b.severity}</span></td><td>{b.aging}d</td><td><EditableText value={b.owner} onCommit={(v) => updateBreak(b.id, "owner", v)} /></td><td>{fmt(b.navImpact, true)}</td><td>{b.rootCause}</td><td><select className="terminal-select" value={b.status} onChange={(e) => updateBreak(b.id, "status", e.target.value)}><option>Open</option><option>Investigating</option><option>Pending External Party</option><option>Escalated</option><option>Resolved</option><option>Approved</option><option>Closed</option></select></td><td><EditableText value={b.resolutionNotes} onCommit={(v) => updateBreak(b.id, "resolutionNotes", v)} /></td><td>{b.escalationLevel}</td><td>{b.slaHours}h</td><td>{b.comments.join(" | ")}</td><td><div className="inline-actions"><button onClick={() => { setSelectedBreakId(b.id); setActiveModule(moduleForBreak(b.breakType)); }}>Source</button><button onClick={() => setActiveModule("gl")}>GL</button><button onClick={() => setActiveModule("nav")}>NAV</button><button onClick={() => setActiveModule("audit")}>Audit</button></div></td><td><div className="inline-actions"><button onClick={() => updateBreak(b.id, "status", "Escalated")}>Escalate</button><button onClick={() => updateBreak(b.id, "status", "Resolved")}>Resolve</button><button onClick={() => updateBreak(b.id, "status", "Approved")}>Approve</button><button onClick={() => updateBreak(b.id, "status", "Open")}>Reopen</button></div></td><td><button className="link-button" onClick={() => explainContext({ tab: "exceptions", title: b.id, summary: b.rootCause, accountingImpact: `Affected accounts depend on ${b.breakType}; unresolved items block clean NAV sign-off.`, navImpact: `Estimated NAV impact ${fmt(b.navImpact, true)} versus materiality threshold.`, recommendedAction: b.severity === "Critical" || b.severity === "High" ? "Escalate, obtain evidence, and approve resolution before NAV publication." : "Assign owner, document resolution notes, and approve if immaterial.", relatedEntries: ["Break register", "Audit trail", "NAV control checklist"] })}>Explain</button></td></tr>)}</tbody></table></div>
    </section>
  );
}

function WorkflowQueue() {
  const { fundSetup, updateWorkflow, applyBackendGlPosting, trainingMode, sandboxRole } = useFundStore();
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [correctionType, setCorrectionType] = useState("Reversal");
  const [correctionReason, setCorrectionReason] = useState("Incorrect posting requires controller correction review.");
  const [evidenceNote, setEvidenceNote] = useState("Custodian/PB evidence pending attachment.");
  const approvals = useQuery({
    queryKey: ["workflow-approvals"],
    queryFn: () => institutionalApi.approvals(),
    refetchInterval: 8000,
    retry: 1,
  });
  const glPostings = useQuery({
    queryKey: ["workflow-gl-postings"],
    queryFn: () => institutionalApi.glPostings(),
    refetchInterval: 8000,
    retry: 1,
  });
  const approvalRows = approvals.data?.approvals ?? [];
  const postingRows = glPostings.data?.postings ?? [];
  const aaplBreakAlreadySubmitted = approvalRows.some((a) => (
    a.entity_type === "position_reconciliation_break"
    && (a.proposed_action?.break_id === "BRK-AAPL-SHORT-9000" || a.entity_id === "BRK-AAPL-SHORT-9000")
    && !["Rejected", "Closed", "Cancelled"].includes(a.status)
  ));
  const submittedCount = approvalRows.filter((a) => a.status === "Submitted").length;
  const approvedCount = approvalRows.filter((a) => a.status === "Approved").length;
  const postedCount = approvalRows.filter((a) => a.status === "Posted").length;
  const rejectedCount = approvalRows.filter((a) => a.status === "Rejected").length;
  const correctionRows = approvalRows.filter((a) => Boolean(a.proposed_action?.correction_of));
  const activeCorrectionRows = correctionRows.filter((a) => a.status === "Submitted" || a.status === "Approved");
  const correctionSourceIds = new Set(correctionRows.map((a) => String(a.proposed_action?.correction_of)));
  const pendingNavImpact = approvalRows
    .filter((a) => a.status === "Submitted" || a.status === "Approved")
    .reduce((sum, a) => sum + Number(a.nav_impact ?? 0), 0);
  const postedNavImpact = postingRows.reduce((sum, p) => sum + Number(p.nav_impact ?? 0), 0);
  const todayStamp = new Date().toDateString();
  const submittedToday = approvalRows.filter((a) => a.submitted_at && new Date(a.submitted_at).toDateString() === todayStamp).length;
  const postedToday = approvalRows.filter((a) => a.posted_at && new Date(a.posted_at).toDateString() === todayStamp).length;
  const agedItems = approvalRows.filter((a) => a.status !== "Posted" && a.submitted_at && Date.now() - new Date(a.submitted_at).getTime() > 24 * 60 * 60 * 1000).length;
  const missingEvidence = correctionRows.filter((a) => !a.proposed_action?.evidence_note || String(a.proposed_action.evidence_note).toLowerCase().includes("pending")).length;
  const unsignedApprovals = approvalRows.filter((a) => (a.status === "Approved" || a.status === "Posted") && !a.digital_signature).length;
  const navReleaseBlocked = submittedCount > 0 || approvedCount > 0 || activeCorrectionRows.length > 0 || missingEvidence > 0 || unsignedApprovals > 0;
  const sandboxAnalyst = trainingMode === "Sandbox" && sandboxRole.startsWith("Analyst");
  const sandboxSenior = trainingMode === "Sandbox" && sandboxRole.startsWith("Senior");
  const canApproveWorkflow = trainingMode === "Live Mode" || sandboxSenior || sandboxRole.startsWith("Fund Controller");
  const canPostWorkflow = trainingMode === "Live Mode" || sandboxRole.startsWith("Fund Controller");
  const canReopenWorkflow = trainingMode === "Live Mode" || sandboxRole.startsWith("Fund Controller");
  const refreshApprovals = () => approvals.refetch();
  useEffect(() => {
    postingRows.forEach((posting) => applyBackendGlPosting(posting));
  }, [postingRows, applyBackendGlPosting]);
  const approveItem = async (id: string) => {
    if (!canApproveWorkflow) {
      setWorkflowMessage("Sandbox permission blocked: Analyst role can investigate and submit, but cannot approve.");
      return;
    }
    setWorkflowMessage("Approving through backend maker-checker control...");
    try {
      await institutionalApi.approve(id, "Checker approved resolution after NAV/materiality review.", { userId: "fund.controller" });
      setWorkflowMessage("Approved by Fund Controller. Audit hash event created.");
      refreshApprovals();
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : "Approval failed.");
    }
  };
  const rejectItem = async (id: string) => {
    setWorkflowMessage("Rejecting through backend maker-checker control...");
    try {
      await institutionalApi.reject(id, "Rejected pending additional break evidence.", { userId: "fund.controller" });
      setWorkflowMessage("Rejected by Fund Controller. Audit hash event created.");
      refreshApprovals();
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : "Rejection failed.");
    }
  };
  const postItem = async (id: string) => {
    if (!canPostWorkflow) {
      setWorkflowMessage("Sandbox permission blocked: only Fund Controller / Signoff Authority can post to GL.");
      return;
    }
    setWorkflowMessage("Posting approved workflow into backend GL register...");
    try {
      const result = await institutionalApi.postToGl(id, { userId: "fund.controller" });
      applyBackendGlPosting(result.posting);
      setWorkflowMessage("Posted to GL. Journal lines created and workflow locked.");
      refreshApprovals();
      glPostings.refetch();
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : "GL posting failed.");
    }
  };
  const reopenItem = async (id: string) => {
    if (!canReopenWorkflow) {
      setWorkflowMessage("Sandbox permission blocked: only Signoff Authority can reopen posted items for correction.");
      return;
    }
    setWorkflowMessage("Opening correction workflow for posted item...");
    try {
      await institutionalApi.reopenForCorrection(id, {
        correction_type: correctionType,
        reason: correctionReason,
        evidence_note: evidenceNote,
      }, { userId: "nav.manager" });
      setWorkflowMessage("Correction workflow opened. New item must be approved before any reversal hits GL.");
      refreshApprovals();
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : "Reopen correction failed.");
    }
  };
  const submitAaplBreak = async () => {
    setWorkflowMessage("Submitting AAPL break resolution to backend queue...");
    try {
      await institutionalApi.submitApproval({
        entity_type: "position_reconciliation_break",
        entity_id: "BRK-AAPL-SHORT-9000",
        proposed_action: {
          break_id: "BRK-AAPL-SHORT-9000",
          ticker: "AAPL",
          issue: "Short quantity mismatch of 9,000 shares",
          proposed_resolution: "Adjust internal position after custody/PB evidence review",
        },
        nav_impact: -4950000,
        gl_impact: {
          debit: "Unrealized Loss",
          credit: "Investments at Fair Value",
          amount: 4950000,
        },
        maker_comment: "Submitted by analyst for four-eyes Fund Controller review.",
      }, { userId: "junior.analyst" });
      setWorkflowMessage("Submitted to backend approval queue. A different checker must approve.");
      refreshApprovals();
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : "Submit failed.");
    }
  };
  return (
    <section className="panel full">
      <PanelTitle title="Workflow Approval Queue" right="Maker-checker NAV operating status" />
      <WorkflowButtons current={fundSetup.workflowStatus} onChange={updateWorkflow} />
      <SimpleRows rows={[
        { Package: "Daily NAV Estimate", Maker: "Fund Accounting", Checker: "NAV Control", Status: fundSetup.workflowStatus, Cutoff: fundSetup.valuationCutoff, Action: "Review valuation, breaks, TB, and investor allocation" },
        { Package: "Official Month-End NAV", Maker: "Fund Accounting", Checker: "CFO Delegate", Status: "Submitted", Cutoff: "Month-end + 5 BD", Action: "Approve financial statements and investor capital rollforward" },
      ]} />
      <div className="controller-summary-grid">
        <div><span>Submitted</span><b>{submittedCount}</b><small>Awaiting controller review</small></div>
        <div><span>Approved</span><b>{approvedCount}</b><small>Ready for GL posting</small></div>
        <div><span>Posted</span><b>{postedCount}</b><small>Locked with audit hash</small></div>
        <div><span>Corrections</span><b>{correctionRows.length}</b><small>{activeCorrectionRows.length} active</small></div>
        <div><span>Rejected</span><b>{rejectedCount}</b><small>Requires analyst rework</small></div>
        <div><span>Pending NAV Impact</span><b>{fmt(pendingNavImpact, true)}</b><small>Not yet posted</small></div>
        <div><span>Posted NAV Impact</span><b>{fmt(postedNavImpact, true)}</b><small>Included in GL/NAV engine</small></div>
        <div className={navReleaseBlocked ? "blocked" : "ready"}><span>NAV Release Gate</span><b>{navReleaseBlocked ? "Blocked" : "Ready"}</b><small>{navReleaseBlocked ? "Open approvals/corrections require signoff" : "No active workflow blockers"}</small></div>
      </div>
      <div className={`nav-release-gate ${navReleaseBlocked ? "blocked" : "ready"}`}>
        <strong>{navReleaseBlocked ? "NAV RELEASE BLOCKED" : "NAV RELEASE READY"}</strong>
        <span>{navReleaseBlocked ? `${submittedCount + approvedCount} open approval item(s), ${activeCorrectionRows.length} active correction(s), ${missingEvidence} evidence gap(s), ${unsignedApprovals} signature exception(s).` : "All backend approval controls are clear for NAV release review."}</span>
      </div>
      <div className="controller-control-strip">
        <div><span>Submitted Today</span><b>{submittedToday}</b></div>
        <div><span>Posted Today</span><b>{postedToday}</b></div>
        <div><span>Aged Items</span><b>{agedItems}</b></div>
        <div><span>Needs Controller Review</span><b>{submittedCount}</b></div>
        <div><span>Evidence Gaps</span><b>{missingEvidence}</b></div>
        <div><span>Signature Exceptions</span><b>{unsignedApprovals}</b></div>
      </div>
      <section className="panel">
        <PanelTitle title="Backend Four-Eyes Approval Queue" right={approvals.isError ? "API offline - start npm run api" : approvals.isFetching ? "Refreshing backend queue" : "Live institutional API"} />
        {trainingMode === "Sandbox" && <div className="sandbox-permission-strip">
          <div><span>Active Sandbox Role</span><b>{sandboxRole}</b></div>
          <div><span>Permissions</span><b>{sandboxAnalyst ? "Investigate / Submit / Escalate" : sandboxSenior ? "Review / Validate / Approve" : "Final Signoff / Post / Reopen"}</b></div>
          <div><span>Restricted Actions</span><b>{sandboxAnalyst ? "Approval, GL posting, NAV release" : sandboxSenior ? "GL posting, NAV release" : "None for simulation"}</b></div>
        </div>}
        <div className="correction-panel">
          <label>
            <span>Correction Type</span>
            <select className="terminal-select" value={correctionType} onChange={(e) => setCorrectionType(e.target.value)}>
              <option>Reversal</option>
              <option>Adjustment</option>
              <option>Reclass</option>
              <option>NAV Restatement Review</option>
            </select>
          </label>
          <label>
            <span>Correction Reason</span>
            <input className="terminal-input" value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} />
          </label>
          <label>
            <span>Evidence Note</span>
            <input className="terminal-input" value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} />
          </label>
        </div>
        <div className="workflow-bar">
          <button className="terminal-button selected" onClick={submitAaplBreak} disabled={aaplBreakAlreadySubmitted}>
            {aaplBreakAlreadySubmitted ? "AAPL Break Already Controlled" : "Submit AAPL Break Resolution"}
          </button>
          <button className="terminal-button" onClick={() => refreshApprovals()}>Refresh Queue</button>
          {workflowMessage && <span>{workflowMessage}</span>}
        </div>
        {approvals.isError ? <div className="empty-state">Backend API is not reachable. Start it in another terminal with cmd /c npm run api.</div> : (
          <SimpleRows rows={approvalRows.map((a) => ({
            "Approval ID": a.approval_id.slice(0, 8),
            Entity: a.entity_type,
            Maker: a.maker_user_id,
            Checker: a.checker_user_id ?? "Pending",
            Status: <span className={`tag ${a.status === "Approved" || a.status === "Posted" ? "good" : a.status === "Rejected" ? "bad" : "warn"}`}>{a.status}</span>,
            "NAV Impact": fmt(a.nav_impact, true),
            "Correction Type": String(a.proposed_action?.correction_type ?? "N/A"),
            "Evidence": String(a.proposed_action?.evidence_note ?? "N/A"),
            "Evidence Status": a.proposed_action?.evidence_note && !String(a.proposed_action.evidence_note).toLowerCase().includes("pending") ? <span className="tag good">Present</span> : <span className="tag warn">Pending</span>,
            "Signature": a.digital_signature ? <span className="tag good">Signed</span> : <span className="tag warn">Pending</span>,
            "SLA": a.status === "Posted" ? "Closed" : a.submitted_at && Date.now() - new Date(a.submitted_at).getTime() > 24 * 60 * 60 * 1000 ? "Aged >24h" : "Within SLA",
            "Maker Comment": a.maker_comment ?? "",
            "Digital Signature": a.digital_signature ? `${a.digital_signature.slice(0, 10)}...` : "Pending approval",
            Action: a.status === "Submitted"
              ? <div className="inline-actions"><button disabled={!canApproveWorkflow} onClick={() => approveItem(a.approval_id)}>Checker Approve</button><button disabled={!canApproveWorkflow} onClick={() => rejectItem(a.approval_id)}>Reject</button></div>
              : a.status === "Approved"
                ? <button className="link-button" disabled={!canPostWorkflow} onClick={() => postItem(a.approval_id)}>Post to GL</button>
                : a.status === "Posted"
                  ? correctionSourceIds.has(a.approval_id)
                    ? "Correction Open"
                    : <button className="link-button" disabled={!canReopenWorkflow} onClick={() => reopenItem(a.approval_id)}>Reopen Correction</button>
                  : "Locked",
          }))} empty="No backend workflow records yet. Submit the AAPL break resolution to create one." />
        )}
      </section>
      <section className="panel">
        <PanelTitle title="Correction Register" right="Reopened posted items with evidence and reversal control" />
        <SimpleRows rows={correctionRows.map((a) => ({
          "Correction ID": a.approval_id.slice(0, 8),
          "Original Approval": String(a.proposed_action?.correction_of ?? "").slice(0, 8),
          Type: String(a.proposed_action?.correction_type ?? "Correction"),
          Reason: String(a.proposed_action?.correction_reason ?? a.maker_comment ?? ""),
          Evidence: String(a.proposed_action?.evidence_note ?? "Pending"),
          Maker: a.maker_user_id,
          Status: <span className={`tag ${a.status === "Posted" ? "good" : a.status === "Rejected" ? "bad" : "warn"}`}>{a.status}</span>,
          "NAV Reversal Impact": fmt(a.nav_impact, true),
          Action: a.status === "Submitted"
            ? <button className="link-button" disabled={!canApproveWorkflow} onClick={() => approveItem(a.approval_id)}>Approve Correction</button>
            : a.status === "Approved"
              ? <button className="link-button" disabled={!canPostWorkflow} onClick={() => postItem(a.approval_id)}>Post Correction</button>
              : "Locked",
        }))} empty="No correction workflows opened yet. Use Reopen Correction on a posted item." />
      </section>
      <section className="panel">
        <PanelTitle title="Backend GL Posting Register" right={glPostings.isFetching ? "Refreshing posting register" : "Approved items posted to accounting"} />
        {glPostings.isError ? <div className="empty-state">GL posting register is not reachable. Confirm the API terminal is running.</div> : (
          <SimpleRows rows={postingRows.map((p) => ({
            "Posting ID": p.posting_id.slice(0, 8),
            "Approval ID": p.approval_id.slice(0, 8),
            Source: p.source_entity_type,
            Memo: p.memo,
            "NAV Impact": fmt(p.nav_impact, true),
            Debit: `${p.lines[0]?.account ?? "Debit"} ${fmt(p.lines[0]?.debit ?? 0, true)}`,
            Credit: `${p.lines[1]?.account ?? "Credit"} ${fmt(p.lines[1]?.credit ?? 0, true)}`,
            "Posted By": p.posted_by,
            "Posted At": new Date(p.posted_at).toLocaleTimeString(),
          }))} empty="No backend GL postings yet. Approve an item, then click Post to GL." />
        )}
      </section>
    </section>
  );
}

function WorkflowButtons({ current, onChange }: { current: string; onChange: (status: "Draft" | "Submitted" | "Reviewed" | "Approved" | "Posted" | "NAV Published") => void }) {
  const steps = ["Draft", "Submitted", "Reviewed", "Approved", "Posted", "NAV Published"] as const;
  return <div className="workflow-bar">{steps.map((s) => <button key={s} className={`terminal-button ${current === s ? "selected" : ""}`} onClick={() => onChange(s)}>{s === "Draft" ? "Save Draft" : s === "Submitted" ? "Submit" : s === "Reviewed" ? "Review" : s === "Approved" ? "Approve" : s === "Posted" ? "Post" : "Publish NAV"}</button>)}<button className="terminal-button reject" onClick={() => onChange("Draft")}>Reject</button></div>;
}

function ReconciliationBreaks() {
  const breaks = useFundStore((s) => s.breaks);
  const rows = breaks
    .filter((e) => e.breakType === "Cash" || e.breakType === "Position")
    .map((e) => ({
      "Break ID": e.id,
      "Break Type": e.breakType,
      Severity: e.severity,
      Aging: `${e.aging}d`,
      "Root Cause": e.rootCause,
      Owner: e.owner,
      Status: e.status,
      "NAV Impact": fmt(e.navImpact, true),
      SLA: `${e.slaHours}h`,
    }));
  return (
    <section className="panel full">
      <PanelTitle title="Cash & Position Reconciliation Breaks" right="Combined break register after cash and position recon" />
      <SimpleRows rows={rows} />
    </section>
  );
}

function SimpleRows({ rows, empty = "No rows" }: { rows: Array<Record<string, ReactNode>>; empty?: string }) {
  if (!rows.length) return <div className="empty-state">{empty}</div>;
  const headers = Object.keys(rows[0]);
  return <div className="table-wrap"><table className="data-grid"><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, idx) => <tr key={idx}>{headers.map((h) => <td key={h}>{row[h]}</td>)}</tr>)}</tbody></table></div>;
}

function ReconRiskOps({ type }: { type: ModuleId }) {
  const r = useRecalc();
  const store = useFundStore();
  if (type === "risk") return <section className="panel full"><PanelTitle title="Risk & Exposure" right="Live exposure cube" /><ResponsiveContainer width="100%" height={320}><BarChart data={r.exposures}><CartesianGrid stroke="#20343b" /><XAxis dataKey="name" stroke="#78909d" /><YAxis stroke="#78909d" tickFormatter={(v) => fmt(Number(v), true)} /><Tooltip formatter={(v) => fmt(Number(v), true)} contentStyle={{ background: "#101b20", border: "1px solid #263940" }} /><Bar dataKey="value" fill="#47d5e7" /></BarChart></ResponsiveContainer></section>;
  if (type === "stress" || type === "scenario") return <section className="panel full"><PanelTitle title={type === "stress" ? "Stress Testing" : "Scenario Simulation"} right="Focused operational scenario" /><ScenarioCard scenario={scenariosForModule("risk")[0] ?? scenarioCatalog[0]} /></section>;
  if (type === "ops") return <section className="panel full"><PanelTitle title="Operations Control Dashboard" right="Workflow, breaks, valuation and sign-off status" /><section className="metrics-row"><Metric label="NAV status" value="Draft T+0" tone="warn" /><Metric label="GL status" value={Math.abs(r.trialBalance.reduce((s, x) => s + x.debit - x.credit, 0)) < 1 ? "Balanced" : "Break"} tone="good" /><Metric label="Open breaks" value={String(r.exceptions.length)} tone="bad" /><Metric label="Approval queue" value="7 items" /></section><ExceptionPanel /></section>;
  return <section className="panel full"><PanelTitle title={modules.find((m) => m.id === type)?.label ?? "Module"} right="Institutional operating worksheet" /><SimpleRows rows={r.exceptions.map((e) => ({ Module: e.module, Severity: e.severity, Break: e.message, Owner: e.owner, Status: e.status }))} /></section>;
}

function SandboxCommandCenter() {
  const store = useFundStore();
  const r = useRecalc();
  const [experience, setExperience] = useState<ScenarioExperienceLevel>("All");
  const [designation, setDesignation] = useState<ScenarioDesignation>("All");
  const [simulationType, setSimulationType] = useState<ScenarioSimulationType>("All");
  const [learnerResponse, setLearnerResponse] = useState("I identified the source record, NAV impact, failed control, GL treatment and required approval evidence.");
  const roles = ["Analyst (0-4 Years)", "Senior Analyst / SME (4-10 Years)", "Fund Controller / Signoff Authority (10+ Years)"] as const;
  const tracks = ["Reconciliation Operations", "Pricing & Valuation", "NAV Oversight", "Transfer Agency", "Corporate Actions", "Fee Operations", "Workflow & Signoff", "Investor Allocation", "Operational Risk", "Audit & Governance"] as const;
  const experienceLevels: ScenarioExperienceLevel[] = ["All", "0-4 Years", "4-10 Years", "10+ Years"];
  const designations: ScenarioDesignation[] = ["All", "Analyst", "SME / Senior Analyst / QA", "Signoff Authority"];
  const simulationTypes: ScenarioSimulationType[] = ["All", "NAV Oversight", "Reconciliation", "Pricing", "Trade Operations", "Corporate Actions", "Performance Fees", "Management Fees", "Investor Allocation", "Operational Risk", "Crisis Simulation"];
  const trackModules: Record<string, ModuleId[]> = {
    "Reconciliation Operations": ["cashRecon", "positionRecon", "reconBreaks"],
    "Pricing & Valuation": ["pricing", "holdings"],
    "NAV Oversight": ["nav", "workflow", "gl"],
    "Transfer Agency": ["capital", "subsReds", "taOversight"],
    "Corporate Actions": ["corporateActions", "dividends", "coupons"],
    "Fee Operations": ["mgmtFees", "perfFees", "equalization"],
    "Workflow & Signoff": ["workflow", "audit", "ops"],
    "Investor Allocation": ["capital", "waterfall", "investorReporting"],
    "Operational Risk": ["risk", "stress", "exceptions"],
    "Audit & Governance": ["audit", "workflow", "backOfficeOversight"],
  };
  const mappedModules = trackModules[store.sandboxTrack] ?? ["reconBreaks"];
  const trackScenarios = scenarioCatalog.filter((scenario) => mappedModules.includes(scenario.module)).slice(0, 6);
  const filtered = useMemo(() => scenarioCatalog.filter((scenario) => {
    const meta = scenarioOperationalMetadata(scenario);
    const experienceOk = experience === "All" || meta.experience === experience;
    const designationOk = designation === "All" || meta.designation === designation;
    const typeOk = simulationType === "All" || meta.simulationType === simulationType;
    return experienceOk && designationOk && typeOk;
  }), [experience, designation, simulationType]);
  const [selectedId, setSelectedId] = useState<string>(filtered[0]?.id ?? scenarioCatalog[0].id);
  const selected = filtered.find((scenario) => scenario.id === selectedId) ?? filtered[0] ?? scenarioCatalog[0];
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const activeRun = store.scenarioRuns.find((run) => run.status === "Active");
  const latestCompletedRun = store.scenarioRuns.find((run) => run.status === "Passed" || run.status === "Needs Review");
  const activeScenario = scenarioCatalog.find((scenario) => scenario.id === store.activeScenarioId);
  const workbenchModule = activeScenario?.module ?? selected.module;
  const nav = store.activeScenarioImpact ? impactDelta(store.activeScenarioImpact.before.nav, store.activeScenarioImpact.after.nav) : null;
  const completedRuns = store.scenarioRuns.filter((run) => ["Passed", "Needs Review", "Submitted"].includes(run.status));
  const averageScore = completedRuns.length ? Math.round(completedRuns.reduce((sum, run) => sum + run.score, 0) / completedRuns.length) : 0;
  const criticalBreaks = openBreaks.filter((b) => b.severity === "Critical" || b.severity === "High").length;
  const maturity = averageScore >= 85 ? "Signoff-ready" : averageScore >= 70 ? "Operationally sound" : averageScore >= 50 ? "Needs supervision" : "Early-stage";
  const navDeadline = `${String(Math.floor(store.sandboxSlaMinutes / 60)).padStart(2, "0")}:${String(store.sandboxSlaMinutes % 60).padStart(2, "0")}:00`;
  const rolePermissions = store.sandboxRole.startsWith("Analyst")
    ? ["Investigate breaks", "Submit workflow item", "Escalate exceptions", "Cannot approve/post"]
    : store.sandboxRole.startsWith("Senior")
      ? ["Review adjustments", "Approve operational fixes", "Validate materiality", "Cannot final post"]
      : ["Final NAV signoff", "Post GL corrections", "Reopen posted items", "Authorize release"];
  const injectScenario = (scenario: ScenarioDefinition) => {
    store.setTrainingMode("Sandbox");
    store.applyScenario(scenario.id);
    store.setActiveModule(scenario.module);
  };
  useEffect(() => {
    if (!filtered.some((scenario) => scenario.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? scenarioCatalog[0].id);
    }
  }, [filtered, selectedId]);
  return (
    <section className="panel full sandbox-command">
      <PanelTitle title="Sandbox Command Center" right="Operational flight simulator using real NAV workflows" />
      <div className="sandbox-command-grid">
        <section>
          <h3>Environment Control</h3>
          <label><span>Role</span><select className="terminal-select" value={store.sandboxRole} onChange={(e) => store.setSandboxRole(e.target.value as typeof roles[number])}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label><span>Operational Track</span><select className="terminal-select" value={store.sandboxTrack} onChange={(e) => store.setSandboxTrack(e.target.value as typeof tracks[number])}>{tracks.map((track) => <option key={track}>{track}</option>)}</select></label>
          <div className="permission-stack">{rolePermissions.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
        <section>
          <h3>SLA Pressure</h3>
          <div className="sla-grid">
            <div><span>NAV Publish Deadline</span><b>{navDeadline}</b></div>
            <div><span>Critical Break SLA</span><b>{criticalBreaks ? "00:25:10" : "Clear"}</b></div>
            <div><span>Investor Reporting</span><b>00:48:22</b></div>
          </div>
          <div className="inline-actions sandbox-time-actions">
            {["Fast Forward to NAV Cutoff", "Advance to Month-End Close", "Trigger Investor Statement Deadline", "Simulate T+1 Escalation"].map((event) => <button key={event} onClick={() => store.triggerSandboxTimeEvent(event)}>{event}</button>)}
          </div>
        </section>
        <section>
          <h3>Session Analytics</h3>
          <div className="sla-grid">
            <div><span>Accuracy</span><b>{averageScore}%</b></div>
            <div><span>Maturity</span><b>{maturity}</b></div>
            <div><span>Open Breaks</span><b>{openBreaks.length}</b></div>
          </div>
          <p className="sandbox-note">Latest pressure event: {store.sandboxTimeEvent}. HR/L&D score considers scenario quality, SLA discipline, escalation and audit evidence.</p>
        </section>
      </div>
      <section className="panel">
        <PanelTitle title="Guided Sandbox Investigation Path" right="Start here for training and interview practice" />
        <div className="sandbox-stepper">
          {[
            { step: "Choose role", done: Boolean(store.sandboxRole), detail: store.sandboxRole },
            { step: "Choose scenario", done: Boolean(selected), detail: selected.scenarioName },
            { step: "Read incident", done: Boolean(selected.businessContext), detail: selected.businessContext },
            { step: "Investigate affected tab", done: Boolean(activeScenario), detail: activeScenario ? modules.find((m) => m.id === activeScenario.module)?.label ?? activeScenario.module : "Start a scenario first" },
            { step: "Submit finding", done: Boolean(latestCompletedRun), detail: latestCompletedRun ? latestCompletedRun.status : "Pending learner response" },
            { step: "Compare answer", done: Boolean(latestCompletedRun), detail: latestCompletedRun?.evaluationNotes.join(" ") ?? selected.expectedResolution },
            { step: "Score & notes", done: Boolean(latestCompletedRun), detail: latestCompletedRun ? `${latestCompletedRun.score}% / ${latestCompletedRun.status}` : "Not scored yet" },
          ].map((item, index) => <div key={item.step} className={item.done ? "done" : ""}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{item.step}</b>
            <small>{item.detail}</small>
          </div>)}
        </div>
        <div className="learner-submission">
          <label>
            <span>Investigation Finding</span>
            <textarea value={learnerResponse} onChange={(e) => setLearnerResponse(e.target.value)} />
          </label>
          <button className="terminal-button selected" onClick={() => store.submitScenario(learnerResponse)} disabled={!activeRun}>Submit Finding & Score</button>
          <button className="terminal-button" onClick={() => setLearnerResponse(selected.expectedResolution)}>Use Expected Resolution as Note</button>
        </div>
      </section>
      <section className="panel">
        <PanelTitle title="Recommended Scenario Injection" right="Track-based incidents for the selected role/desk" />
        <div className="sandbox-scenario-grid">
          {trackScenarios.map((scenario) => (
            <button key={scenario.id} className="sandbox-scenario-card" onClick={() => injectScenario(scenario)}>
              <span>{scenario.difficulty} / {scenario.module}</span>
              <b>{scenario.scenarioName}</b>
              <small>{scenario.objective}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <PanelTitle title="Full Simulation Library" right={`${filtered.length} institutional scenarios from the former Scenario Simulation tab`} />
        <div className="scenario-filters">
          <select className="terminal-select" value={experience} onChange={(e) => setExperience(e.target.value as ScenarioExperienceLevel)}>
            {experienceLevels.map((level) => <option key={level}>{level}</option>)}
          </select>
          <select className="terminal-select" value={designation} onChange={(e) => setDesignation(e.target.value as ScenarioDesignation)}>
            {designations.map((role) => <option key={role}>{role}</option>)}
          </select>
          <select className="terminal-select" value={simulationType} onChange={(e) => setSimulationType(e.target.value as ScenarioSimulationType)}>
            {simulationTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        <div className="scenario-lab-clean compact-library">
          <div className="scenario-list">
            {filtered.map((scenario) => {
              const meta = scenarioOperationalMetadata(scenario);
              return <button key={scenario.id} className={selected.id === scenario.id ? "selected" : ""} onClick={() => setSelectedId(scenario.id)}><b>{scenario.scenarioName}</b><span>{meta.experience} - {meta.designation} - {meta.simulationType}</span></button>;
            })}
          </div>
          <div className="scenario-detail">
            <ScenarioSimulationCard scenario={selected} />
            {activeScenario && <div className="scenario-active-summary">
              <span>Active Investigation</span>
              <b>{activeScenario.scenarioName}</b>
              <p>{activeScenario.businessContext}</p>
              <div className="impact-cards">
                <Metric label="NAV impact" value={fmt(nav?.delta ?? 0, true)} tone={(nav?.delta ?? 0) >= 0 ? "good" : "bad"} />
                <Metric label="NAV impact %" value={`${((nav?.pctMove ?? 0) * 100).toFixed(2)}%`} tone={(nav?.delta ?? 0) >= 0 ? "good" : "bad"} />
                <Metric label="Materiality" value={materiality(store.activeScenarioImpact?.after.nav ?? 0, nav?.delta ?? 0).label} tone={materiality(store.activeScenarioImpact?.after.nav ?? 0, nav?.delta ?? 0).tone} />
              </div>
              <div className="scenario-card-actions">
                <button className="terminal-button" onClick={() => store.setAiPanelOpen(true)}><Bot size={15} /> AI Explain Impact</button>
                <button className="terminal-button reject" onClick={store.resetScenario}>Reset Scenario</button>
              </div>
            </div>}
            {activeScenario && <ScenarioIncidentPanel scenario={activeScenario} />}
          </div>
        </div>
        <ScenarioEditableGrid module={workbenchModule} />
      </section>
      <section className="panel">
        <PanelTitle title="Operational Progression" right={activeRun ? `Active: ${activeRun.scenarioName}` : "No active scenario"} />
        <SimpleRows rows={store.scenarioRuns.slice(0, 8).map((run) => ({
          Run: run.id,
          Scenario: run.scenarioName,
          Module: modules.find((m) => m.id === run.module)?.label ?? run.module,
          Mode: run.trainingMode,
          Status: run.status,
          Score: `${run.score}%`,
          Started: new Date(run.startedAt).toLocaleTimeString(),
          Action: <button className="link-button" onClick={() => store.setActiveModule(run.module)}>Open Workflow</button>,
        }))} empty="Inject a scenario to start an operational session." />
      </section>
      <section className="panel">
        <PanelTitle title="AI Senior Manager Guidance" right="Sandbox-only mentoring" />
        <div className="sandbox-guidance">
          <p>Use the actual operating tabs to investigate. The AI Copilot should guide the path, not bypass the work.</p>
          <button className="terminal-button selected" onClick={() => {
            store.setAiPanelOpen(true);
            store.explainContext({
              tab: "sandboxCommand",
              title: "Sandbox senior manager guidance",
              summary: `You are operating as ${store.sandboxRole} on ${store.sandboxTrack}. Start from the affected source table, then validate break, NAV, GL, approval and audit evidence.`,
              accountingImpact: "Scenario changes flow into the real accounting engine rather than a disconnected learning screen.",
              navImpact: `Current NAV ${fmt(r.netAssets, true)} with ${openBreaks.length} open break(s).`,
              recommendedAction: "Open the relevant workflow tab, document evidence, escalate per role permissions, and clear signoff blockers.",
              relatedEntries: ["Sandbox Command Center", "Reconciliation Breaks", "Workflow Approval Queue", "NAV Package"],
            });
          }}><Bot size={15} /> Ask Senior Manager AI</button>
        </div>
      </section>
    </section>
  );
}

type RubricRating = "GREEN" | "AMBER" | "RED";
type RubricSection = {
  section: string;
  score: number;
  rating: RubricRating;
  metrics: string;
  output: string;
  managementAction: string;
};

function boundedScore(base: number, deduction: number) {
  return Math.max(0, Math.min(100, Math.round(base - deduction)));
}

function rubricRating(score: number): RubricRating {
  if (score >= 85) return "GREEN";
  if (score >= 70) return "AMBER";
  return "RED";
}

function rubricTone(rating: RubricRating): "good" | "warn" | "bad" {
  return rating === "GREEN" ? "good" : rating === "AMBER" ? "warn" : "bad";
}

function section(section: string, score: number, metrics: string, output: string, managementAction: string): RubricSection {
  const rating = rubricRating(score);
  return { section, score, rating, metrics, output, managementAction };
}

function avgScore(rows: RubricSection[]) {
  return rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;
}

function QualityRubricView({ type }: { type: "ta" | "middle" | "back" }) {
  const store = useFundStore();
  const r = useRecalc();
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const criticalBreaks = openBreaks.filter((b) => b.severity === "Critical" || b.severity === "High");
  const agedBreaks = openBreaks.filter((b) => b.aging >= 3);
  const pendingActivities = store.activities.filter((a) => a.status === "Pending");
  const redemptions = store.activities.filter((a) => a.type === "Redemption");
  const pendingRedemptions = redemptions.filter((a) => a.status === "Pending");
  const largeInvestorConcentration = store.investors.filter((i) => r.investorCapital && i.capital / r.investorCapital > 0.2).length;
  const cashBreaks = store.cashRecon.filter((c) => (Math.abs(c.internalLedgerCash - c.custodianCash) > 1 || Math.abs(c.internalLedgerCash - c.primeBrokerCash) > 1) && !["Resolved", "Approved"].includes(c.status));
  const positionBreaks = store.positionRecon.filter((p) => (Math.abs(p.internalPosition - p.custodianPosition) > 0 || Math.abs(p.internalPosition - p.pbPosition) > 0) && !["Resolved", "Approved"].includes(p.status));
  const failedTrades = store.trades.filter((t) => t.status === "Failed");
  const pendingTrades = store.trades.filter((t) => t.status === "Pending");
  const stalePrices = r.holdings.filter((h) => !h.marketPrice || Math.abs(h.priceMovePct) > 5);
  const levelThreeHoldings = store.securityMaster.filter((s) => s.valuationHierarchy === "Level 3" || s.stalePricing || s.toleranceBreach);
  const fxVariance = store.fxRates.filter((fx) => Math.abs((fx.rate - fx.priorRate) / Math.max(Math.abs(fx.priorRate), 1)) > 0.02);
  const pendingCorporateActions = store.corporateActions.filter((ca) => ca.status !== "Settled" || ca.postingStatus !== "Cash Settled");
  const pendingApprovals = store.auditTrail.filter((a) => a.action.toLowerCase().includes("manual")).length + openBreaks.filter((b) => ["Open", "Investigating", "Escalated"].includes(b.status)).length;
  const unsupportedJournals = r.gl.filter((je) => !je.auto).length;
  const tbImbalance = Math.abs(r.trialBalance.reduce((sum, row) => sum + row.debit - row.credit, 0));
  const navVariance = store.activeScenarioImpact ? Math.abs(store.activeScenarioImpact.after.nav - store.activeScenarioImpact.before.nav) : 0;
  const navVariancePct = r.netAssets ? navVariance / Math.abs(r.netAssets) : 0;
  const documentationGaps = Math.min(10, openBreaks.filter((b) => !b.resolutionNotes || b.resolutionNotes === "Pending").length + pendingApprovals);
  const marginPressure = store.derivatives.filter((d) => Math.abs(d.mtm) > Math.abs(d.collateral) * 1.25).length;
  const feeExposure = r.managementFee + r.performanceFee;
  const feeConfidenceDeduction = Math.min(35, Math.abs(feeExposure) / Math.max(Math.abs(r.netAssets), 1) * 1000 + pendingApprovals);

  const taRows: RubricSection[] = [
    section("Subscription Processing Quality", boundedScore(100, pendingActivities.filter((a) => a.type === "Subscription").length * 7 + cashBreaks.length * 3), `${pendingActivities.length} pending activities, ${cashBreaks.length} cash breaks`, "Subscription accuracy %, pending subscription dashboard, investor impact severity", "Resolve pending capital activity and wire mismatches before NAV allocation."),
    section("Redemption Processing Quality", boundedScore(100, pendingRedemptions.length * 10 + criticalBreaks.length * 5), `${pendingRedemptions.length} pending redemptions, ${criticalBreaks.length} high severity breaks`, "Redemption efficiency score, liquidity stress alerts, investor payout risk", "Review liquidity, gates and payout controls with Investor Services."),
    section("AML / KYC Compliance Quality", boundedScore(96, largeInvestorConcentration * 6 + documentationGaps * 2), `${largeInvestorConcentration} concentrated investors, ${documentationGaps} documentation gaps`, "Compliance health score, high-risk investor alerts, regulatory escalation dashboard", "Obtain missing evidence and review high-value investor onboarding."),
    section("Investor Communication Quality", boundedScore(98, pendingApprovals * 3 + agedBreaks.length * 4), `${pendingApprovals} pending approvals, ${agedBreaks.length} aged breaks`, "Communication SLA score, investor servicing quality, dissatisfaction alerts", "Prioritize statement/NAV communication where breaks are investor-impacting."),
    section("Allocation Accuracy Quality", boundedScore(100, Math.abs(r.investorCapital - r.netAssets) / Math.max(Math.abs(r.netAssets), 1) * 200 + openBreaks.filter((b) => ["NAV Variance", "Cash"].includes(b.breakType)).length * 5), `Investor capital variance ${fmt(r.investorCapital - r.netAssets, true)}`, "Allocation confidence score, LP fairness indicator, allocation break dashboard", "Tie investor capital, equalization and fee allocations back to NAV."),
    section("Capital Activity Oversight", boundedScore(100, largeInvestorConcentration * 8 + Math.min(20, redemptions.reduce((s, a) => s + Math.abs(a.amount), 0) / Math.max(Math.abs(r.netAssets), 1) * 200)), `${largeInvestorConcentration} concentration alerts, redemption flow ${fmt(redemptions.reduce((s, a) => s + Math.abs(a.amount), 0), true)}`, "Capital flow risk indicator, liquidity pressure monitor", "Monitor subscription spikes, redemption pressure and concentration risk."),
    section("Investor Risk & Escalation", boundedScore(100, criticalBreaks.length * 8 + pendingRedemptions.length * 6), `${criticalBreaks.length} high severity items, ${pendingRedemptions.length} payout risks`, "Investor risk severity, escalation matrix", "Escalate investor-impacting errors through TA manager and NAV oversight."),
    section("Transfer Agency SLA Monitoring", boundedScore(100, agedBreaks.length * 8 + pendingActivities.length * 4), `${agedBreaks.length} aged breaks, ${pendingActivities.length} pending items`, "SLA adherence %, operational delay heatmap", "Clear aged items and document reason codes for missed SLA."),
    section("Audit & Documentation Quality", boundedScore(100, documentationGaps * 6), `${documentationGaps} evidence gaps`, "Audit readiness %, documentation gap tracker", "Attach support for manual changes, investor forms and approvals."),
    section("Investor Experience Score", boundedScore(100, pendingActivities.length * 5 + criticalBreaks.length * 6 + documentationGaps * 3), `${pendingActivities.length} pending, ${criticalBreaks.length} critical/high, ${documentationGaps} gaps`, "Investor servicing grade, red/amber/green rating", "Reduce error frequency and communication delays before investor reporting."),
  ];

  const middleRows: RubricSection[] = [
    section("NAV Validation Quality", boundedScore(100, openBreaks.length * 4 + (tbImbalance > 1 ? 15 : 0) + navVariancePct * 1000), `${openBreaks.length} open breaks, TB imbalance ${fmt(tbImbalance, true)}`, "NAV confidence score, restatement probability, NAV operational health", "Hold NAV if material breaks or TB imbalance remain unresolved."),
    section("Pricing & Valuation Oversight", boundedScore(100, stalePrices.length * 7 + levelThreeHoldings.length * 5), `${stalePrices.length} stale/variance prices, ${levelThreeHoldings.length} level 3 or challenged securities`, "Valuation confidence score, override tracker, illiquid exposure indicator", "Route stale, overridden or illiquid prices to valuation review."),
    section("P&L Validation Quality", boundedScore(100, positionBreaks.length * 4 + fxVariance.length * 4 + pendingCorporateActions.length * 2), `${positionBreaks.length} position breaks, ${fxVariance.length} FX variances`, "P&L validation score, P&L sensitivity analysis", "Validate price, FX, accrual and trade-driven P&L movements."),
    section("Exposure & Concentration Risk", boundedScore(100, largeInvestorConcentration * 4 + r.exposures.filter((e) => Math.abs(e.value) > r.netAssets * 0.25).length * 8), `${r.exposures.length} exposure sleeves, ${largeInvestorConcentration} concentration alerts`, "Concentration heatmap, risk severity score", "Review issuer, strategy, country and liquidity concentration before signoff."),
    section("Trade Lifecycle Oversight", boundedScore(100, failedTrades.length * 10 + pendingTrades.length * 5), `${failedTrades.length} failed trades, ${pendingTrades.length} pending trades`, "Trade operational quality score, failed trade dashboard", "Escalate failed settlements and late trade amendments."),
    section("Counterparty Risk Oversight", boundedScore(100, marginPressure * 8 + store.derivatives.length * 2), `${store.derivatives.length} OTC rows, ${marginPressure} collateral gaps`, "Counterparty risk score, exposure severity monitor", "Review PB/counterparty concentration and ISDA threshold pressure."),
    section("Collateral & Margin Quality", boundedScore(100, marginPressure * 12 + cashBreaks.length * 3), `${marginPressure} margin pressure alerts, ${cashBreaks.length} cash breaks`, "Margin stability score, liquidity funding alerts", "Resolve margin disputes and collateral mismatches before NAV release."),
    section("Exception Management Quality", boundedScore(100, openBreaks.length * 5 + agedBreaks.length * 6 + pendingApprovals * 2), `${openBreaks.length} open breaks, ${agedBreaks.length} aged`, "Exception severity score, operational instability indicator", "Assign owners, evidence root cause and approve resolution."),
    section("Risk Escalation Governance", boundedScore(100, criticalBreaks.length * 10 + pendingApprovals * 3), `${criticalBreaks.length} critical/high breaks, ${pendingApprovals} pending approvals`, "Governance score, escalation risk heatmap", "Escalate unresolved critical events to NAV oversight."),
    section("Signoff Readiness", boundedScore(100, criticalBreaks.length * 12 + openBreaks.length * 3 + (tbImbalance > 1 ? 15 : 0)), `${criticalBreaks.length} blockers, ${openBreaks.length} open breaks`, "Ready for NAV signoff / Review required / Hold NAV / Executive escalation", "Proceed only when material breaks, pricing and approvals are clear."),
  ];

  const backRows: RubricSection[] = [
    section("Trade Processing", boundedScore(100, failedTrades.length * 8 + pendingTrades.length * 4), `${failedTrades.length} failed, ${pendingTrades.length} pending`, "Trade quality score, STP efficiency %", "Validate economics, duplicates and amendments."),
    section("Settlement Operations", boundedScore(100, failedTrades.length * 10 + positionBreaks.filter((p) => p.settlementStatus === "Failed Trade").length * 7), `${failedTrades.length} failed trades`, "Settlement efficiency %, failed trade risk", "Escalate failed settlements with broker/custodian."),
    section("Cash Operations", boundedScore(100, cashBreaks.length * 7 + fxVariance.length * 3), `${cashBreaks.length} cash breaks, ${fxVariance.length} FX variances`, "Cash stability score, funding pressure alerts", "Clear wire, nostro and FX funding mismatches."),
    section("Reconciliation Operations", boundedScore(100, openBreaks.length * 4 + agedBreaks.length * 5 + positionBreaks.length * 3), `${openBreaks.length} breaks, ${agedBreaks.length} aged`, "Reconciliation quality score, break aging dashboard", "Prioritize aged, NAV-impacting and repeat breaks."),
    section("Corporate Actions", boundedScore(100, pendingCorporateActions.length * 5), `${pendingCorporateActions.length} pending CA events`, "Corporate action accuracy score, financial impact tracker", "Validate entitlement, WHT, accrual and settlement status."),
    section("Static Data Management", boundedScore(100, store.securityMaster.filter((s) => s.toleranceBreach || !s.isin).length * 8), `${store.securityMaster.filter((s) => s.toleranceBreach || !s.isin).length} static data alerts`, "Static data integrity score", "Correct security master, SSI and counterparty setup gaps."),
    section("Pricing Operations", boundedScore(100, stalePrices.length * 7), `${stalePrices.length} stale/missing/tolerance prices`, "Pricing operational score", "Challenge missing or stale prices with vendor evidence."),
    section("FX Operations", boundedScore(100, fxVariance.length * 8), `${fxVariance.length} FX variance alerts`, "FX operational stability score", "Validate source rates, funding and settlement currency."),
    section("Custody Operations", boundedScore(100, cashBreaks.length * 4 + positionBreaks.length * 4), `${cashBreaks.length} cash and ${positionBreaks.length} position custody breaks`, "Custody reliability score", "Resolve custody/PB mismatches and asset servicing delays."),
    section("Fee Operations", boundedScore(100, feeConfidenceDeduction), `Fee exposure ${fmt(feeExposure, true)}`, "Fee calculation confidence score", "Tie management, performance, HWM and equalization to GL and investor capital."),
    section("Accounting Control", boundedScore(100, (tbImbalance > 1 ? 25 : 0) + unsupportedJournals * 5), `TB imbalance ${fmt(tbImbalance, true)}, ${unsupportedJournals} manual journals`, "Accounting integrity score", "Substantiate journals and clear trial balance issues."),
    section("Regulatory Reporting Support", boundedScore(96, documentationGaps * 3 + criticalBreaks.length * 4), `${documentationGaps} documentation gaps`, "Regulatory support score", "Resolve missing disclosures and critical exceptions."),
    section("Audit Support", boundedScore(100, documentationGaps * 6 + unsupportedJournals * 3), `${documentationGaps} gaps, ${unsupportedJournals} manual JEs`, "Audit readiness %", "Complete support pack, approvals and evidence trail."),
    section("Exception Management", boundedScore(100, openBreaks.length * 5 + criticalBreaks.length * 8), `${openBreaks.length} open, ${criticalBreaks.length} critical/high`, "Operational risk score", "Escalate repeat failures and critical incidents."),
    section("Workflow & Approvals", boundedScore(100, pendingApprovals * 5), `${pendingApprovals} pending signoffs`, "Workflow governance score", "Clear maker-checker approvals and unauthorized override reviews."),
  ];

  const config = type === "ta"
    ? { title: "Transfer Agency Oversight", right: "Investor servicing, capital activity and TA controls", rows: taRows }
    : type === "middle"
      ? { title: "Middle Office NAV & Risk Oversight", right: "NAV validation, valuation governance and risk controls", rows: middleRows }
      : { title: "Back Office Operational Control Center", right: "Trade, settlement, custody, accounting and workflow controls", rows: backRows };
  const overall = avgScore(config.rows);
  const finalRating = rubricRating(overall);
  const worst = [...config.rows].sort((a, b) => a.score - b.score)[0];
  const navEscalation = criticalBreaks.length || tbImbalance > 1 || navVariancePct > 0.005;
  const redCount = config.rows.filter((row) => row.rating === "RED").length;
  const amberCount = config.rows.filter((row) => row.rating === "AMBER").length;
  const topRisks = [...config.rows].sort((a, b) => a.score - b.score).slice(0, 5);
  const executiveRows = [
    { Measure: "Overall operating health", Rating: <span className={`tag ${rubricTone(finalRating) === "bad" ? "bad" : rubricTone(finalRating) === "warn" ? "warn" : "good"}`}>{finalRating}</span>, Score: `${overall}%`, "Leadership action": finalRating === "RED" ? "Immediate management escalation" : finalRating === "AMBER" ? "Review required before signoff" : "Operationally stable" },
    { Measure: "NAV release risk", Rating: <span className={`tag ${navEscalation ? "bad" : "good"}`}>{navEscalation ? "BLOCKED / REVIEW" : "CLEAR"}</span>, Score: `${criticalBreaks.length} critical/high`, "Leadership action": navEscalation ? "Hold NAV release until blockers are cleared" : "No leadership intervention required" },
    { Measure: "Control weakness count", Rating: <span className={`tag ${redCount ? "bad" : amberCount ? "warn" : "good"}`}>{redCount ? "RED" : amberCount ? "AMBER" : "GREEN"}</span>, Score: `${redCount} red / ${amberCount} amber`, "Leadership action": redCount ? "Assign accountable owner today" : amberCount ? "Track through daily control meeting" : "Monitor" },
    { Measure: "Audit exposure", Rating: <span className={`tag ${documentationGaps ? "warn" : "good"}`}>{documentationGaps ? "AMBER" : "GREEN"}</span>, Score: `${documentationGaps} evidence gaps`, "Leadership action": documentationGaps ? "Complete approval evidence and support pack" : "Audit support complete" },
    { Measure: "Investor impact", Rating: <span className={`tag ${pendingActivities.length || pendingRedemptions.length ? "warn" : "good"}`}>{pendingActivities.length || pendingRedemptions.length ? "AMBER" : "GREEN"}</span>, Score: `${pendingActivities.length} pending capital items`, "Leadership action": pendingActivities.length ? "Prioritize investor-impacting activity" : "Stable" },
    { Measure: "Highest priority weakness", Rating: <span className={`tag ${rubricTone(worst?.rating ?? "GREEN") === "bad" ? "bad" : rubricTone(worst?.rating ?? "GREEN") === "warn" ? "warn" : "good"}`}>{worst?.rating ?? "GREEN"}</span>, Score: worst ? `${worst.section} - ${worst.score}%` : "None", "Leadership action": worst?.managementAction ?? "No action required" },
  ];
  const priorityRows = topRisks.map((row, idx) => ({
    Priority: idx + 1,
    "Quality measure": row.section,
    Rating: <span className={`tag ${rubricTone(row.rating) === "bad" ? "bad" : rubricTone(row.rating) === "warn" ? "warn" : "good"}`}>{row.rating}</span>,
    Score: `${row.score}%`,
    "Key evidence": row.metrics,
    "Immediate action": row.managementAction,
  }));

  return (
    <section className="panel full">
      <PanelTitle title={config.title} right={config.right} />
      <section className="metrics-row">
        <Metric label="Quality score" value={`${overall}%`} tone={rubricTone(finalRating)} />
        <Metric label="Final status" value={finalRating} tone={rubricTone(finalRating)} />
        <Metric label="Critical breaks" value={String(criticalBreaks.length)} tone={criticalBreaks.length ? "bad" : "good"} />
        <Metric label="Signoff readiness" value={navEscalation ? "Review" : "Ready"} tone={navEscalation ? "warn" : "good"} />
      </section>
      <section className="panel">
        <PanelTitle title="Leadership Quality Measurement" right="Concise RAG controls for urgent management review" />
        <SimpleRows rows={executiveRows} />
      </section>
      <section className="panel">
        <PanelTitle title="Top Control Priorities" right="Only the weakest quality measures requiring attention" />
        <SimpleRows rows={priorityRows} />
      </section>
    </section>
  );
}

function buildInstitutionalNavPack(store: FundState, r: ReturnType<typeof useRecalc>): XlsxSheet[] {
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const failedTrades = store.trades.filter((t) => t.status === "Failed");
  const missingPrices = r.holdings.filter((h) => !h.marketPrice || Math.abs(h.priceMovePct) > 5);
  const cashExceptions = store.cashRecon.filter((c) => Math.abs(c.internalLedgerCash - c.custodianCash) > 1);
  const pendingRecons = [...store.cashRecon, ...store.positionRecon].filter((x) => !["Resolved", "Approved"].includes(x.status)).length;
  const tbDebit = r.trialBalance.reduce((sum, x) => sum + x.debit, 0);
  const tbCredit = r.trialBalance.reduce((sum, x) => sum + x.credit, 0);
  const tbBalanced = Math.abs(tbDebit - tbCredit) < 1;
  const navCompletion = Math.max(0, Math.min(100, 100 - openBreaks.length * 3 - failedTrades.length * 4 - missingPrices.length * 5 - (tbBalanced ? 0 : 20)));
  const priorNav = store.activeScenarioImpact?.before.nav ?? r.netAssets - r.unrealizedGains * 0.05;
  const navMovement = priorNav ? (r.netAssets - priorNav) / Math.abs(priorNav) : 0;
  const investorTotalDeductions = (investorCapital: number) => {
    const allocation = r.investorCapital ? investorCapital / r.investorCapital : 0;
    return allocation * (r.managementFee + r.performanceFee + r.adminExpenses + r.brokerFees);
  };
  const holdingsRows = r.holdings.map((h) => ({
    ISIN: h.isin, Ticker: h.ticker, Description: h.name, "Asset Type": h.assetType, Strategy: h.strategy, Currency: h.currency,
    Quantity: h.quantity, "Cost Price": h.costPrice, "Market Price": h.marketPrice, "FX Rate": h.fxRate,
    "Market Value": h.marketValue, Cost: h.costValue, "Unrealized G/L": h.totalUnrealizedPnl, "FX Impact": h.fxPnl, "Exposure %": h.exposurePct,
  }));
  const tradeRows = store.trades.map((t) => ({
    "Trade ID": t.id, "Trade Date": t.tradeDate, "Settle Date": t.settleDate, Broker: t.broker, "Buy/Sell": t.side, Security: t.ticker,
    Quantity: t.quantity, Price: t.price, "Gross Amount": tradeGross(t), Fees: t.fees, "Cash Dr": tradeCashDebit(t), "Cash Cr": tradeCashCredit(t),
    "Signed Cash Movement": tradeCashMovement(t), Status: t.status,
  }));
  const breakRows = store.breaks.map((b) => ({
    "Break ID": b.id, Type: b.breakType, Severity: b.severity, Aging: b.aging, "Assigned User": b.owner, "NAV Impact": b.navImpact,
    "Root Cause": b.rootCause, Status: b.status, "Resolution Comments": b.resolutionNotes, "Escalation Status": b.escalationLevel, SLA: b.slaHours,
  }));
  const glRows = r.gl.flatMap((je) => je.lines.map((l, idx) => ({
    "JE Number": je.id, Line: idx + 1, Date: je.date, Source: je.source, Memo: je.memo, Account: l.account, Category: l.category,
    Debit: l.debit, Credit: l.credit, User: je.auto ? "System Auto-Post" : "Manual", "Approval Status": je.auto ? "Posted" : "Pending Review", "Audit Ref": l.ref,
  })));
  const investorRows = store.investors.map((i) => {
    const allocation = r.investorCapital ? i.capital / r.investorCapital : 0;
    const mgmt = allocation * r.managementFee;
    const perf = allocation * r.performanceFee;
    const expenses = allocation * r.adminExpenses;
    return {
      Investor: i.name, Class: i.className, Capital: i.capital, Shares: i.shares, HWM: i.hwm, "Hurdle Rate": i.hurdleRate,
      "Equalization Credit": i.equalizationCredit, "Ownership %": allocation, "Management Fee": mgmt, "Performance Fee": perf,
      "Expense Allocation": expenses, "Total Deductions": mgmt + perf + expenses, "Ending NAV": i.capital - mgmt - perf - expenses,
    };
  });
  const feeSchedules = investorFeeSchedules(store, r);
  const exitWaterfall = waterfallEngine(store, r);
  const mgmtFeeRows = feeSchedules.managementRows.map((row) => ({
    "Investor Name": row.investorName,
    "Opening Capital": row.openingCapital,
    "Capital Contribution": row.capitalContribution,
    Redemption: row.redemption,
    "Ending Capital Before Fees": row.endingCapitalBeforeFees,
    "Fee Basis": row.feeBasisOption,
    "Fee Basis Amount": row.feeBasis,
    "Management Fee %": row.managementFeePct,
    "Gross Management Fee": row.grossManagementFee,
    "Fee Already Paid": row.feeAlreadyPaid,
    "Fee Payable": row.feePayable,
    "Fee Accrued": row.feeAccrued,
    "Net Capital After Management Fee": row.netCapitalAfterManagementFee,
  }));
  const perfFeeRows = feeSchedules.performanceRows.map((row) => ({
    "Investor Name": row.investorName,
    "Opening Capital": row.openingCapital,
    Subscriptions: row.subscriptions,
    Redemptions: row.redemptions,
    "Ending Capital Before Performance Fee": row.endingCapitalBeforePerformanceFee,
    "Gross Profit / Loss": row.grossProfitLoss,
    "Investor Return %": row.investorReturnPct,
    "Benchmark Return %": row.benchmarkReturnPct,
    "Benchmark Amount": row.benchmarkAmount,
    "Hurdle Rate %": row.hurdleRatePct,
    "Hurdle Amount": row.hurdleAmount,
    "High Water Mark": row.highWaterMark,
    "Performance Fee %": row.performanceFeePct,
    "Performance Fee Earned": row.performanceFeeEarned,
    "Performance Fee Paid": row.performanceFeePaid,
    "Performance Fee Payable": row.performanceFeePayable,
    "Equalization Adjustment": row.equalizationAdjustment,
    "Net Investor Capital After Performance Fee": row.netInvestorCapitalAfterPerformanceFee,
    Eligibility: row.eligibility,
    Reason: row.reason,
  }));
  const waterfallStepRows = exitWaterfall.steps.map((step) => ({
    Step: step.step,
    "LP Amount": step.lpAmount,
    "GP Amount": step.gpAmount,
    "Remaining Proceeds": step.remainingAfterStep,
  }));
  const partnerWaterfallRows = exitWaterfall.partnerRows.map((row) => ({
    "Partner Name": row.partnerName,
    "Partner Type": row.partnerType,
    "Capital Contribution": row.capitalContribution,
    "Ownership %": row.ownershipPct,
    "ROC Received": row.rocReceived,
    "Preferred Return Received": row.preferredReturnReceived,
    "GP Catch-Up Received": row.gpCatchUpReceived,
    "Residual Split Received": row.residualSplitReceived,
    "Total Distribution": row.totalDistribution,
    "Remaining Unreturned Capital": row.remainingUnreturnedCapital,
    MOIC: row.moic,
  }));
  const investorCapitalStatementRows = store.investors.map((i) => {
    const mgmt = feeSchedules.managementRows.find((row) => row.investor.id === i.id);
    const perf = feeSchedules.performanceRows.find((row) => row.investor.id === i.id);
    const waterfall = exitWaterfall.partnerRows.find((row) => row.partnerName === i.name);
    const activity = activityTotals(store, i.id);
    const allocation = r.investorCapital ? i.capital / r.investorCapital : 0;
    const profitAllocation = allocation * Math.max(feeSchedules.profitBeforeFees, 0);
    const lossAllocation = allocation * Math.min(feeSchedules.profitBeforeFees, 0);
    const expenseAllocation = allocation * r.adminExpenses;
    return {
      Investor: i.name,
      "Opening Capital": mgmt?.openingCapital ?? i.capital,
      Subscriptions: activity.subscriptions,
      Redemptions: activity.redemptions,
      "Profit Allocation": profitAllocation,
      "Loss Allocation": lossAllocation,
      "Management Fee Paid": mgmt?.grossManagementFee ?? 0,
      "Performance Fee Paid": perf?.performanceFeeEarned ?? 0,
      "Expense Allocation": expenseAllocation,
      "Waterfall Distribution": waterfall?.totalDistribution ?? 0,
      "Ending Capital": i.capital + profitAllocation + lossAllocation - (mgmt?.grossManagementFee ?? 0) - (perf?.performanceFeeEarned ?? 0) - expenseAllocation,
    };
  });
  const navBridgeRows = navMovementBridgeRows(store, r);
  const totalInvestorMgmtFees = mgmtFeeRows.reduce((sum, row) => sum + Number(row["Gross Management Fee"]), 0);
  const totalInvestorPerfFees = perfFeeRows.reduce((sum, row) => sum + Number(row["Performance Fee Earned"]), 0);
  const investorCapitalStatementTotal = investorCapitalStatementRows.reduce((sum, row) => sum + Number(row["Ending Capital"]), 0);
  const activeStructure = normalizedStructure(store.fundSetup.fundStructure);
  const structureBridgeRows = structureNavBridgeRows(store, r);
  const structureSupportRows = structureSpecificRows(store, r);
  const formulaRows: XlsxCell[][] = [
    ["36_NAV_Calculation_Working"],
    ["Generated", new Date().toLocaleString(), "Source", "Live simulator state"],
    [],
    ["NAV Component", "Amount", "Formula / Source"],
    ["Total Assets", r.grossAssets, "Holdings + income receivable + derivative collateral + investor cash"],
    ["Total Liabilities", r.liabilities, "Fees + expenses payable + derivative liabilities"],
    ["Net Assets", { formula: "B5-B6", result: r.netAssets }, "Total Assets - Total Liabilities"],
    ["Outstanding Shares", r.sharesOutstanding, "Investor share register"],
    ["NAV Per Share", { formula: "B7/B8", result: r.navPerShare }, "Net Assets / Outstanding Shares"],
    ["Investor Capital", r.investorCapital, "Investor master + capital activity"],
    ["Management Fees", r.managementFee, "Average NAV x fee % / 365"],
    ["Performance Fees", r.performanceFee, "Excess return over HWM / hurdle"],
    ["Unrealized Gain/Loss", r.unrealizedGains, "Open positions revaluation"],
    ["Realized Gain/Loss", r.realizedGains, "Closed trade activity"],
    ["FX Impact", r.fxGainLoss, "Base currency retranslation"],
  ];
  const sheets: XlsxSheet[] = [
    { name: "01_Operations_Dashboard", rows: objectRows("01_Operations_Dashboard", [
      { Metric: "NAV Status", Value: openBreaks.some((b) => b.severity === "High") ? "NAV RELEASE BLOCKED" : "Draft T+0" },
      { Metric: "Pending Approvals", Value: store.fundSetup.workflowStatus },
      { Metric: "Break Count", Value: openBreaks.length },
      { Metric: "Failed Trades", Value: failedTrades.length },
      { Metric: "Missing Prices", Value: missingPrices.length },
      { Metric: "Cash Exceptions", Value: cashExceptions.length },
      { Metric: "NAV Completion %", Value: navCompletion },
      { Metric: "Pending Recons", Value: pendingRecons },
      { Metric: "Pending Fee Validation", Value: r.performanceFee > 0 ? "Required" : "Not required" },
    ]) },
    { name: "02_NAV_Control_Center", rows: objectRows("02_NAV_Control_Center", [
      { Field: "NAV Date", Value: "2026-05-09" }, { Field: "Fund Status", Value: store.fundSetup.workflowStatus },
      { Field: "Estimated NAV", Value: r.netAssets }, { Field: "Final NAV", Value: store.fundSetup.workflowStatus === "NAV Published" ? r.netAssets : "Pending final approval" },
      { Field: "NAV Movement %", Value: navMovement }, { Field: "Reviewer", Value: "Senior Reviewer" }, { Field: "Approver", Value: "NAV Manager" },
      { Field: "Signoff Status", Value: store.fundSetup.workflowStatus }, { Field: "NAV Freeze Status", Value: openBreaks.length ? "Not Frozen - breaks open" : "Ready to freeze" },
    ]) },
    { name: "03_Workflow_Status", rows: objectRows("03_Workflow_Status", [
      { Stage: "Pricing Complete", Status: missingPrices.length ? "Escalated" : "Completed", Owner: "Valuations" },
      { Stage: "Trade Booking Complete", Status: failedTrades.length ? "In Progress" : "Completed", Owner: "Trade Ops" },
      { Stage: "FX Uploaded", Status: "Completed", Owner: "Treasury" },
      { Stage: "Recon Completed", Status: pendingRecons ? "In Progress" : "Completed", Owner: "Reconciliations" },
      { Stage: "Fee Posting Completed", Status: "Completed", Owner: "Fund Accounting" },
      { Stage: "NAV Finalized", Status: openBreaks.length ? "Pending" : "Completed", Owner: "NAV Control" },
      { Stage: "Client Pack Sent", Status: store.fundSetup.workflowStatus === "NAV Published" ? "Completed" : "Pending", Owner: "Client Service" },
    ]) },
    { name: "04_Exception_Manager", rows: objectRows("04_Exception_Manager", breakRows) },
    { name: "05_Trade_Blotter", rows: objectRows("05_Trade_Blotter", tradeRows) },
    { name: "06_Open_Positions", rows: objectRows("06_Open_Positions", holdingsRows.map((h) => ({ Ticker: h.Ticker, Quantity: h.Quantity, Currency: h.Currency, "Market Value": h["Market Value"], "Exposure %": h["Exposure %"] }))) },
    { name: "07_Position_Ledger", rows: objectRows("07_Position_Ledger", tradeRows.map((t) => ({ Date: t["Trade Date"], Security: t.Security, Movement: t["Buy/Sell"] === "Buy" ? t.Quantity : -Number(t.Quantity), Broker: t.Broker, Status: t.Status }))) },
    { name: "08_Portfolio_Holdings", rows: objectRows("08_Portfolio_Holdings", holdingsRows) },
    { name: "09_Pricing", rows: objectRows("09_Pricing", r.holdings.map((h) => ({ Ticker: h.ticker, "Editable Price": h.marketPrice, "Prior Price": h.priorPrice, "Move %": h.priceMovePct, Source: h.priceSource, "NAV Linked": "Yes" }))) },
    { name: "10_Stale_Price_Check", rows: objectRows("10_Stale_Price_Check", r.holdings.map((h) => ({ Ticker: h.ticker, "Last Price Date": h.lastPriceTime, "Days Stale": Math.max(0, Math.floor((Date.now() - new Date(h.lastPriceTime).getTime()) / 86400000)), "Tolerance Alerts": Math.abs(h.priceMovePct) > 5 ? "Breach" : "Clean" }))) },
    { name: "11_FX_Rates", rows: objectRows("11_FX_Rates", store.fxRates.map((fx) => ({ Pair: fx.pair, Base: fx.base, Quote: fx.quote, "Editable Rate": fx.rate, "Prior Rate": fx.priorRate, Source: fx.source }))) },
    { name: "12_Corporate_Actions", rows: objectRows("12_Corporate_Actions", store.corporateActions.map((c) => ({ Event: c.eventType, Security: c.security, "Ex-Date": c.exDate, "Pay Date": c.payDate, "Eligible Qty": c.eligibleQuantity, "Gross Amount": c.grossAmount, WHT: c.withholdingTax, "Net Receivable": c.netReceivable, Status: c.status, Posting: c.postingStatus }))) },
    { name: "13_Cash_Recon", rows: objectRows("13_Cash_Recon", store.cashRecon.map((c) => ({ Currency: c.currency, "Internal Cash": c.internalLedgerCash, "Custodian Cash": c.custodianCash, Difference: c.internalLedgerCash - c.custodianCash, "Break Reason": c.breakReason, "Match Status": Math.abs(c.internalLedgerCash - c.custodianCash) < 1 ? "Matched" : "Break", "Resolution Status": c.status }))) },
    { name: "14_Position_Recon", rows: objectRows("14_Position_Recon", store.positionRecon.map((p) => ({ Ticker: p.ticker, Internal: p.internalPosition, Custodian: p.custodianPosition, PB: p.pbPosition, "Custodian Difference": p.internalPosition - p.custodianPosition, "PB Difference": p.internalPosition - p.pbPosition, "Match Status": Math.abs(p.internalPosition - p.custodianPosition) < 1 && Math.abs(p.internalPosition - p.pbPosition) < 1 ? "Matched" : "Break", Severity: Math.max(Math.abs(p.internalPosition - p.custodianPosition), Math.abs(p.internalPosition - p.pbPosition)) > 1000 ? "High" : "Low", Aging: ["Resolved", "Approved"].includes(p.status) ? 0 : 2 }))) },
    { name: "15_Trade_Recon", rows: objectRows("15_Trade_Recon", tradeRows.map((t) => ({ "Trade ID": t["Trade ID"], Security: t.Security, Broker: t.Broker, Status: t.Status, "Match Status": t.Status === "Matched" || t.Status === "Booked" ? "Matched" : "Break", "Settlement Date": t["Settle Date"] }))) },
    { name: "16_FX_Recon", rows: objectRows("16_FX_Recon", store.fxRates.map((fx) => ({ Pair: fx.pair, "Internal Rate": fx.rate, "Vendor Rate": fx.priorRate, Variance: fx.rate - fx.priorRate, Status: Math.abs(fx.rate - fx.priorRate) > 0.01 ? "Review" : "Matched" }))) },
    { name: "17_Fee_Recon", rows: objectRows("17_Fee_Recon", [{ Fee: "Management Fee", System: r.managementFee, Recalculated: r.managementFee, Difference: 0, Status: "Matched" }, { Fee: "Performance Fee", System: r.performanceFee, Recalculated: r.performanceFee, Difference: 0, Status: "Matched" }]) },
    { name: "18_Break_Management", rows: objectRows("18_Break_Management", breakRows) },
    { name: "19_General_Ledger", rows: objectRows("19_General_Ledger", glRows) },
    { name: "20_Trial_Balance", rows: objectRows("20_Trial_Balance", r.trialBalance.map((t) => ({ Account: t.account, Category: t.category, Debit: t.debit, Credit: t.credit, Balance: t.balance, Editable: "Yes - controller adjustment workflow" }))) },
    { name: "21_Journal_Entries", rows: objectRows("21_Journal_Entries", glRows) },
    { name: "22_Accruals", rows: objectRows("22_Accruals", store.accruals.map((a) => ({ Kind: a.kind, Ticker: a.ticker, "Ex-Date": a.exDate ?? "", "Pay Date": a.payDate ?? "", "Net Dividend": a.netDividend ?? 0, "Accrued Interest": a.accruedInterest ?? 0, "Posting Status": "Auto-posted" }))) },
    { name: "23_Management_Fee", rows: objectRows("23_Management_Fee", investorRows.map((i) => ({ Investor: i.Investor, "Fee Basis": i.Capital, "Fee %": store.managementFeePct, "Fee Charged": i["Management Fee"], "Paid Fees": 0, "Unpaid Fees": i["Management Fee"] }))) },
    { name: "24_Performance_Fee", rows: objectRows("24_Performance_Fee", investorRows.map((i) => ({ Investor: i.Investor, HWM: i.HWM, "Fee %": store.performanceFeePct, "Performance Fee": i["Performance Fee"], Status: i["Performance Fee"] > 0 ? "Accrued" : "No fee" }))) },
    { name: "25_Perf_Fee_Eligibility", rows: objectRows("25_Performance_Fee_Eligibility", investorRows.map((i) => ({ Investor: i.Investor, Benchmark: "Fund hurdle", "Hurdle Rate": i["Hurdle Rate"], "HWM Validation": i.HWM > 0 ? "Pass" : "Fail", "Excess Return": Math.max(r.navPerShare - Number(i.HWM), 0), "Investor-Level Incentive Fee": i["Performance Fee"] }))) },
    { name: "26_Expense_Allocation", rows: objectRows("26_Expense_Allocation", investorRows.map((i) => ({ Investor: i.Investor, "Expense Allocation": i["Expense Allocation"], "Management Fee Paid": i["Management Fee"], "Performance Fee Paid": i["Performance Fee"], "Total Deductions": i["Total Deductions"], "Ending NAV": i["Ending NAV"] }))) },
    { name: "27_Realized_Gain_Loss", rows: objectRows("27_Realized_Gain_Loss", tradeRows.filter((t) => t["Buy/Sell"] === "Sell").map((t) => ({ Security: t.Security, Quantity: t.Quantity, Proceeds: t["Gross Amount"], "Estimated Realized G/L": Number(t["Gross Amount"]) * 0.037 }))) },
    { name: "28_Unrealized_Gain_Loss", rows: objectRows("28_Unrealized_Gain_Loss", holdingsRows.map((h) => ({ Ticker: h.Ticker, "Market Value": h["Market Value"], Cost: h.Cost, "Unrealized G/L": h["Unrealized G/L"], "FX Impact": h["FX Impact"] }))) },
    { name: "29_Investor_Master", rows: objectRows("29_Investor_Master", investorRows) },
    { name: "30_Capital_Activity", rows: objectRows("30_Capital_Activity", store.activities.map((a) => ({ ID: a.id, Investor: store.investors.find((i) => i.id === a.investorId)?.name ?? a.investorId, Date: a.date, Type: a.type, Amount: a.amount, Status: a.status }))) },
    { name: "31_Investor_Allocation", rows: objectRows("31_Investor_Allocation", investorRows.map((i) => ({ Investor: i.Investor, Capital: i.Capital, "Ownership %": i["Ownership %"], "Allocated NAV": Number(i["Ownership %"]) * r.netAssets }))) },
    { name: "32_Equalization", rows: objectRows("32_Equalization", investorRows.map((i) => ({ Investor: i.Investor, "Equalization Enabled": i.Class === "Class C Series 2026" ? "Yes" : "No", "Applied?": i.Class === "Class C Series 2026" ? "Only post-accrual entry investors" : "No", Credit: i["Equalization Credit"] }))) },
    { name: "33_Investor_Capital_Statement", rows: objectRows("33_Investor_Capital_Statement", investorRows.map((i) => ({ Investor: i.Investor, "Opening Capital": Number(i.Capital) - Number(i["Ending NAV"]) * 0.02, Subscriptions: Number(i.Capital) * 0.01, Redemptions: 0, "P&L Allocation": Number(i["Ending NAV"]) - Number(i.Capital), "Ending NAV": i["Ending NAV"] }))) },
    { name: "34_Share_Register", rows: objectRows("34_Share_Register", investorRows.map((i) => ({ Investor: i.Investor, Class: i.Class, Shares: i.Shares, "NAV/share": r.navPerShare, "Capital Value": Number(i.Shares) * r.navPerShare }))) },
    { name: "35_Investor_Fee_Breakdown", rows: objectRows("35_Investor_Fee_Breakdown", investorRows.map((i) => ({ Investor: i.Investor, "Management Fee": i["Management Fee"], "Performance Fee": i["Performance Fee"], "Admin Expense Allocation": i["Expense Allocation"], "Total Fees/Deductions": i["Total Deductions"] }))) },
    { name: "Mgmt_Fee_Investor_Level", rows: objectRows("Management_Fee_Investor_Level", mgmtFeeRows, "Investor-level management fee schedule tied to GL/TB/NAV") },
    { name: "Perf_Fee_Investor_Level", rows: objectRows("Performance_Fee_Investor_Level", perfFeeRows, "Investor-level incentive fee schedule with eligibility controls") },
    { name: "Perf_Fee_Validation", rows: objectRows("Performance_Fee_Validation", [
      { Scope: "Fund-Level", Metric: "Opening NAV", Value: priorNav, Flag: "Control input" },
      { Scope: "Fund-Level", Metric: "Closing NAV", Value: r.netAssets, Flag: "Live NAV" },
      { Scope: "Fund-Level", Metric: "Gross Return %", Value: priorNav ? (r.netAssets - priorNav) / Math.abs(priorNav) : 0, Flag: "Return test" },
      { Scope: "Fund-Level", Metric: "Benchmark %", Value: 0.04, Flag: "Benchmark" },
      { Scope: "Fund-Level", Metric: "Hurdle %", Value: store.fundSetup.hurdleRate, Flag: "Hurdle" },
      { Scope: "Fund-Level", Metric: "Performance Fee Eligibility", Value: totalInvestorPerfFees > 0 ? "Eligible" : "Not Eligible", Flag: totalInvestorPerfFees > 0 ? "Eligible" : "Below Hurdle / HWM" },
      { Scope: "Fund-Level", Metric: "Total Performance Fee Earned", Value: totalInvestorPerfFees, Flag: "GL tie-out" },
      ...perfFeeRows.map((row) => ({ Scope: "Investor-Level", Metric: String(row["Investor Name"]), Value: Number(row["Performance Fee Earned"]), Flag: String(row.Reason) })),
    ]) },
    { name: "Investment_Exit_Waterfall", rows: objectRows("Investment_Exit_Waterfall", [
      { Input: "Total Exit Proceeds", Value: exitWaterfall.inputs.totalExitProceeds, Notes: "User-editable in waterfall screen" },
      { Input: "Total LP Capital Contribution", Value: exitWaterfall.inputs.totalLpCapitalContribution, Notes: "LP capital base" },
      { Input: "Total GP Capital Contribution", Value: exitWaterfall.inputs.totalGpCapitalContribution, Notes: "GP co-invest" },
      { Input: "Preferred Return %", Value: exitWaterfall.inputs.preferredReturnPct, Notes: "LP pref hurdle" },
      { Input: "GP Catch-Up %", Value: exitWaterfall.inputs.gpCatchUpPct, Notes: "Catch-up on paid preferred return" },
      { Input: "LP Carry Split %", Value: exitWaterfall.inputs.lpCarryPct, Notes: "Residual split to LPs" },
      { Input: "GP Carry Split %", Value: exitWaterfall.inputs.gpCarryPct, Notes: "Residual split to GP" },
      ...waterfallStepRows.map((row) => ({ Input: row.Step, Value: Number(row["LP Amount"]) + Number(row["GP Amount"]), Notes: `Remaining proceeds ${Number(row["Remaining Proceeds"]).toLocaleString("en-US")}` })),
    ], "Four-step waterfall: ROC, preferred return, GP catch-up, residual split") },
    { name: "Partner_Waterfall_Distribution", rows: objectRows("Partner_Waterfall_Distribution", partnerWaterfallRows, "Partner-level LP/GP waterfall output") },
    { name: "Investor_Capital_Statement", rows: objectRows("Investor_Capital_Statement", investorCapitalStatementRows, "Investor capital statement with fees and waterfall distribution") },
    { name: "NAV_Movement_Bridge", rows: objectRows("NAV_Movement_Bridge", navBridgeRows, "Prior NAV to current NAV movement explanation") },
    { name: "Fund_Structure_Comparison", rows: objectRows("Fund_Structure_Comparison", structureComplexityRows().map((row) => ({ ...row, Selected: row.Structure === activeStructure ? "Active" : "" })), "Multi-structure operating model comparison") },
    { name: "Structure_NAV_Bridge", rows: objectRows("Structure_NAV_Bridge", structureBridgeRows, `Selected structure: ${activeStructure}`) },
    { name: "Structure_Specific_Report", rows: objectRows("Structure_Specific_Report", structureSupportRows, "Structure-specific NAV pack support schedule") },
    { name: "Master_Feeder_Support", rows: objectRows("Master_Feeder_Support", activeStructure === "Master-Feeder Structure" ? structureSupportRows : [
      { Message: "Activate Master-Feeder Structure in Fund Master Setup to use this schedule", "Current Structure": activeStructure },
    ], "Master NAV, feeder NAV and ownership reconciliation") },
    { name: "FoF_Layered_Fees", rows: objectRows("FoF_Layered_Fees", activeStructure === "Fund of Funds (FoF)" ? structureSupportRows.map((row) => ({ ...row, "Underlying Fee": r.managementFee * 0.55 / Math.max(structureSupportRows.length, 1), "FoF Overlay Fee": r.managementFee * 0.25 / Math.max(structureSupportRows.length, 1), "Double Layer Fee Impact": "Underlying fees plus overlay advisory fee" })) : [
      { Message: "Activate Fund of Funds (FoF) in Fund Master Setup to use this schedule", "Current Structure": activeStructure },
    ], "Underlying exposure and double layer fee impact") },
    { name: "Hybrid_Valuation_Support", rows: objectRows("Hybrid_Valuation_Support", activeStructure === "Hybrid Fund Structure" ? structureSupportRows : [
      { Message: "Activate Hybrid Fund Structure in Fund Master Setup to use this schedule", "Current Structure": activeStructure },
    ], "Liquid and illiquid valuation support") },
    { name: "Strategy_PM_Allocation", rows: objectRows("Strategy_PM_Allocation", activeStructure === "Multi-Manager / Multi-Strategy Structure" ? structureSupportRows : r.exposures.map((e, index) => ({ PM: `PM ${index + 1}`, Strategy: e.name, "Strategy Exposure": e.value, "Strategy NAV Allocation": r.netAssets * (e.value / Math.max(r.exposures.reduce((sum, x) => sum + x.value, 0), 1)), "Incentive Allocation": r.performanceFee * (e.value / Math.max(r.exposures.reduce((sum, x) => sum + x.value, 0), 1)) })), "Strategy and PM-level NAV allocation") },
    { name: "Control_Checks", rows: objectRows("Control_Checks", [
      { Check: "TB Balanced?", Result: tbBalanced ? "Pass" : "Fail", Difference: tbDebit - tbCredit },
      { Check: "Total Assets - Total Liabilities = NAV?", Result: Math.abs(r.grossAssets - r.liabilities - r.netAssets) < 1 ? "Pass" : "Fail", Difference: r.grossAssets - r.liabilities - r.netAssets },
      { Check: "Investor Capital = NAV?", Result: Math.abs(r.investorCapital - r.netAssets) / Math.max(Math.abs(r.netAssets), 1) < 0.05 ? "Review" : "Exception", Difference: r.investorCapital - r.netAssets },
      { Check: "Total Fees = GL Fee Accounts?", Result: Math.abs(totalInvestorMgmtFees - r.managementFee) < 1 && Math.abs(totalInvestorPerfFees - r.performanceFee) < 1 ? "Pass" : "Fail", Difference: totalInvestorMgmtFees + totalInvestorPerfFees - r.managementFee - r.performanceFee },
      { Check: "Total Waterfall Distributed = Exit Proceeds?", Result: exitWaterfall.controlStatus, Difference: exitWaterfall.totalDistributed - exitWaterfall.inputs.totalExitProceeds },
      { Check: "Investor Capital Statement = NAV?", Result: Math.abs(investorCapitalStatementTotal - r.netAssets) / Math.max(Math.abs(r.netAssets), 1) < 0.1 ? "Review" : "Exception", Difference: investorCapitalStatementTotal - r.netAssets },
      { Check: "Outstanding Shares match Capital Activity?", Result: r.sharesOutstanding > 0 ? "Pass" : "Fail", Difference: r.sharesOutstanding },
      { Check: "All Recons Cleared?", Result: pendingRecons ? "Fail" : "Pass", Difference: pendingRecons },
      { Check: "Missing Prices?", Result: missingPrices.length ? "Fail" : "Pass", Difference: missingPrices.length },
      { Check: "Missing FX?", Result: store.fxRates.length ? "Pass" : "Fail", Difference: store.fxRates.length },
    ], "Institutional NAV control checklist") },
    { name: "36_NAV_Calculation_Working", rows: formulaRows },
    { name: "37_NAV_Summary", rows: objectRows("37_NAV_Summary", [
      { Item: "Total Assets", Amount: { formula: "'36_NAV_Calculation_Working'!B5", result: r.grossAssets } as unknown as number },
      { Item: "Total Liabilities", Amount: { formula: "'36_NAV_Calculation_Working'!B6", result: r.liabilities } as unknown as number },
      { Item: "Net Assets", Amount: { formula: "'36_NAV_Calculation_Working'!B7", result: r.netAssets } as unknown as number },
      { Item: "Outstanding Shares", Amount: r.sharesOutstanding }, { Item: "NAV Per Share", Amount: r.navPerShare }, { Item: "Investor Capital", Amount: r.investorCapital },
      { Item: "Accrued Expenses", Amount: r.adminExpenses }, { Item: "Management Fees", Amount: r.managementFee }, { Item: "Performance Fees", Amount: r.performanceFee },
      { Item: "Unrealized Gain/Loss", Amount: r.unrealizedGains }, { Item: "Realized Gain/Loss", Amount: r.realizedGains }, { Item: "FX Impact", Amount: r.fxGainLoss },
    ] as unknown as ExportRow[]) },
    { name: "38_NAV_Recon", rows: objectRows("38_NAV_Recon", [{ Metric: "Prior NAV", Amount: priorNav }, { Metric: "Current NAV", Amount: r.netAssets }, { Metric: "NAV Movement", Amount: r.netAssets - priorNav }, { Metric: "NAV Movement %", Amount: navMovement }]) },
    { name: "39_Control_Checks", rows: objectRows("39_Control_Checks", [
      { Check: "TB Balanced?", Result: tbBalanced ? "Pass" : "Fail" }, { Check: "Missing Prices?", Result: missingPrices.length ? "Fail" : "Pass" },
      { Check: "Recon Matched?", Result: pendingRecons ? "Fail" : "Pass" }, { Check: "Unposted JE?", Result: "Pass" }, { Check: "Negative NAV?", Result: r.netAssets < 0 ? "Fail" : "Pass" },
      { Check: "Missing FX?", Result: "Pass" }, { Check: "Unresolved Breaks?", Result: openBreaks.length ? "Fail" : "Pass" },
    ]) },
    { name: "40_Balance_Sheet", rows: objectRows("40_Balance_Sheet", r.balanceSheet.map((b) => ({ Section: b.section, Line: b.line, Amount: b.amount }))) },
    { name: "41_Income_Statement", rows: objectRows("41_Income_Statement", r.pnl.map((p) => ({ Line: p.line, Amount: p.amount }))) },
    { name: "42_Cash_Flow_Statement", rows: objectRows("42_Cash_Flow_Statement", [{ Section: "Operating", Line: "Net investment income", Amount: r.dividendIncome + r.interestIncome - r.adminExpenses - r.brokerFees }, { Section: "Investing", Line: "Purchase/sale of investments", Amount: store.trades.reduce((s, t) => s + tradeCashMovement(t), 0) }, { Section: "Financing", Line: "Investor capital activity", Amount: store.activities.reduce((s, a) => s + (a.type === "Subscription" ? a.amount : -a.amount), 0) }]) },
    { name: "43_Changes_Net_Assets", rows: objectRows("43_Statement_of_Changes_in_Net_Assets", r.waterfall.map((w) => ({ Component: w.name, Amount: w.value }))) },
    { name: "44_Schedule_of_Investments", rows: objectRows("44_Schedule_of_Investments", holdingsRows) },
    { name: "45_Trade_Settlement", rows: objectRows("45_Trade_Settlement", tradeRows.map((t) => ({ "Trade ID": t["Trade ID"], Security: t.Security, Broker: t.Broker, "Settle Date": t["Settle Date"], Status: t.Status, "Settlement Lifecycle": t.Status === "Failed" ? "Fail repair" : t.Status === "Pending" ? "Awaiting settlement" : "Settled/Matched" }))) },
    { name: "46_Failed_Trades", rows: objectRows("46_Failed_Trades", tradeRows.filter((t) => t.Status === "Failed")) },
    { name: "47_Cash_Projection", rows: objectRows("47_Cash_Projection", store.fxRates.slice(0, 10).map((fx, index) => ({ Currency: fx.base, "Opening Cash": 1_000_000 + index * 125_000, "Expected Inflows": 250_000 + index * 30_000, "Expected Outflows": 180_000 + index * 20_000, "Projected Cash": 1_070_000 + index * 135_000 }))) },
    { name: "48_Compliance_Checks", rows: objectRows("48_Compliance_Checks", r.exposures.map((e) => ({ Check: `${e.name} exposure`, Value: e.value, Threshold: r.netAssets * 0.25, Status: Math.abs(e.value) > r.netAssets * 0.25 ? "Breach" : "Pass" }))) },
    { name: "49_Audit_Trail", rows: objectRows("49_Audit_Trail", store.auditTrail.map((a) => ({ Timestamp: a.timestamp, User: "Current User", Field: a.field, "Previous Value": a.oldValue, "Updated Value": a.newValue, "Reason for Change": a.action, "Impacted Modules": a.impactedModules.join(" | ") }))) },
    { name: "50_Approval_Log", rows: objectRows("50_Approval_Log", [
      { Stage: "Analyst", Status: store.fundSetup.workflowStatus, User: "Fund Accountant", Timestamp: new Date().toLocaleString(), Comments: "Prepared NAV support package" },
      { Stage: "Senior Reviewer", Status: openBreaks.length ? "Pending Review" : "Reviewed", User: "Senior Reviewer", Timestamp: "", Comments: openBreaks.length ? "Open breaks require clearance" : "No blocking breaks" },
      { Stage: "NAV Manager", Status: store.fundSetup.workflowStatus === "NAV Published" ? "Approved" : "Pending", User: "NAV Manager", Timestamp: "", Comments: "Final release control" },
    ]) },
  ];
  return linkedNavPackSheets(sheets, r);
}

function buildNavDashboardWorkbook(store: FundState, r: ReturnType<typeof useRecalc>): XlsxSheet[] {
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const criticalBreaks = openBreaks.filter((b) => b.severity === "Critical" || b.severity === "High");
  const pendingApprovals = store.fundSetup.workflowStatus === "NAV Published" ? 0 : 1;
  const priorNav = store.activeScenarioImpact?.before.nav ?? r.netAssets - r.unrealizedGains * 0.05;
  const navMove = r.netAssets - priorNav;
  const navMovePct = priorNav ? navMove / Math.abs(priorNav) : 0;
  const navBlocked = criticalBreaks.length > 0 || pendingApprovals > 0;
  const dashboardRows: XlsxCell[][] = [
    ["SYED FUND SIMULATOR - NAV Dashboard"],
    ["Generated", new Date().toLocaleString(), "Source", "Live simulator state"],
    [],
    ["Metric", "Value", "Formula / Source", "Status"],
    ["NAV Status", navBlocked ? "NAV RELEASE BLOCKED" : "READY FOR SIGNOFF", "Breaks + approval readiness", navBlocked ? "Review" : "Ready"],
    ["Current NAV", { formula: "'NAV_Working'!B7", result: r.netAssets }, "Linked to NAV working", "Live"],
    ["NAV/share", { formula: "'NAV_Working'!B9", result: r.navPerShare }, "Current NAV / shares", "Live"],
    ["Open Breaks", { formula: "'Break_Dashboard'!B5", result: openBreaks.length }, "Linked to break dashboard", openBreaks.length ? "Review" : "Clear"],
    ["Critical Breaks", { formula: "'Break_Dashboard'!B6", result: criticalBreaks.length }, "High/Critical severity", criticalBreaks.length ? "Blocked" : "Clear"],
    ["NAV Movement", { formula: "'NAV_Bridge'!B7", result: navMove }, "Current NAV - prior NAV", navMove >= 0 ? "Positive" : "Negative"],
    ["NAV Movement %", { formula: "'NAV_Bridge'!B8", result: navMovePct }, "NAV movement / prior NAV", Math.abs(navMovePct) > 0.005 ? "Material" : "Normal"],
    ["Pending Approvals", pendingApprovals, "Workflow approval queue", pendingApprovals ? "Pending" : "Clear"],
  ];
  const navWorkingRows: XlsxCell[][] = [
    ["NAV_Working"],
    ["Generated", new Date().toLocaleString(), "Source", "Dashboard linked working"],
    [],
    ["Component", "Amount", "Formula / Source"],
    ["Gross Assets", r.grossAssets, "Live recalculation engine"],
    ["Liabilities", r.liabilities, "Live recalculation engine"],
    ["Net Assets", { formula: "B5-B6", result: r.netAssets }, "Gross Assets - Liabilities"],
    ["Outstanding Shares", r.sharesOutstanding, "Share register"],
    ["NAV/share", { formula: "B7/B8", result: r.navPerShare }, "Net Assets / Outstanding Shares"],
    ["Management Fee", r.managementFee, "Fee engine"],
    ["Performance Fee", r.performanceFee, "Fee engine"],
    ["Unrealized P&L", r.unrealizedGains, "Holdings valuation"],
    ["FX Impact", r.fxGainLoss, "FX translation"],
  ];
  const bridgeRows: XlsxCell[][] = [
    ["NAV_Bridge"],
    ["Generated", new Date().toLocaleString(), "Source", "Dashboard linked bridge"],
    [],
    ["Component", "Amount", "Formula / Source"],
    ["Prior NAV", priorNav, "Prior close / scenario baseline"],
    ["Current NAV", { formula: "'NAV_Working'!B7", result: r.netAssets }, "Linked to NAV working"],
    ["NAV Movement", { formula: "B6-B5", result: navMove }, "Current - prior"],
    ["NAV Movement %", { formula: "B7/B5", result: navMovePct }, "Movement / prior"],
    ...navMovementBridgeRows(store, r).map((row) => [String(row.Component), Number(row.Amount), String((row as { Note?: string }).Note ?? "Live recalculation driver")] as XlsxCell[]),
  ];
  const breakRows: XlsxCell[][] = [
    ["Break_Dashboard"],
    ["Generated", new Date().toLocaleString(), "Source", "Open exception queue"],
    [],
    ["Metric", "Value", "Formula / Source"],
    ["Open Break Count", openBreaks.length, "Unapproved/unclosed breaks"],
    ["Critical Break Count", criticalBreaks.length, "High/Critical break filter"],
    ["Total NAV Impact", openBreaks.reduce((sum, b) => sum + Math.abs(b.navImpact), 0), "Abs NAV impact of open breaks"],
    [],
    ["Break ID", "Type", "Severity", "Aging", "Owner", "NAV Impact", "Status"],
    ...openBreaks.map((b) => [b.id, b.breakType, b.severity, b.aging, b.owner, b.navImpact, b.status] as XlsxCell[]),
  ];
  const controlRows: XlsxCell[][] = [
    ["Dashboard_Control_Checks"],
    ["Generated", new Date().toLocaleString(), "Source", "Linked dashboard controls"],
    [],
    ["Check", "Result", "Formula / Source"],
    ["NAV equals assets less liabilities", { formula: "IF(ABS('NAV_Working'!B7-('NAV_Working'!B5-'NAV_Working'!B6))<1,\"Pass\",\"Fail\")", result: "Pass" }, "NAV_Working"],
    ["Critical breaks clear", { formula: "IF('Break_Dashboard'!B6=0,\"Pass\",\"Fail\")", result: criticalBreaks.length ? "Fail" : "Pass" }, "Break_Dashboard"],
    ["Approval ready", pendingApprovals ? "Fail" : "Pass", "Workflow status"],
    ["NAV release status", { formula: "IF(AND(B5=\"Pass\",B6=\"Pass\",B7=\"Pass\"),\"READY\",\"BLOCKED\")", result: navBlocked ? "BLOCKED" : "READY" }, "Control summary"],
  ];
  return [
    { name: "NAV_Dashboard", rows: dashboardRows },
    { name: "NAV_Working", rows: navWorkingRows },
    { name: "NAV_Bridge", rows: bridgeRows },
    { name: "Break_Dashboard", rows: breakRows },
    { name: "Dashboard_Control_Checks", rows: controlRows },
  ];
}

function ExportView() {
  const r = useRecalc();
  const store = useFundStore();
  const download = (name: string, content: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const csv = r.pnl.map((x) => `${x.line},${x.amount}`).join("\n");
  const packs: Array<{ label: string; name: string; kind: "break" | "scenario" | "performance" | "checklist" | "interview" }> = [
    { label: "Break Pack", name: "break-pack.csv", kind: "break" },
    { label: "Scenario Result Report", name: "scenario-result-report.csv", kind: "scenario" },
    { label: "User Performance Report", name: "user-performance-report.csv", kind: "performance" },
    { label: "Daily Control Checklist", name: "daily-control-checklist.csv", kind: "checklist" },
    { label: "Interview Practice Report", name: "interview-practice-report.csv", kind: "interview" },
  ];
  return (
    <section className="panel full">
      <PanelTitle title="Financial Statements Export" right="Institutional NAV, operations and training packs" />
      <div className="scenario-grid big">
        <button className="scenario-button selected" onClick={() => downloadXlsx("SYED_FUND_SIMULATOR_NAV_Pack_50_Sheets.xlsx", buildInstitutionalNavPack(store, r))}>
          <FileSpreadsheet size={16} /> NAV Pack (50 Sheets)
        </button>
        <button className="scenario-button selected" onClick={() => downloadXlsx("SYED_FUND_SIMULATOR_NAV_Dashboard.xlsx", buildNavDashboardWorkbook(store, r))}>
          <FileSpreadsheet size={16} /> NAV Dashboard
        </button>
        {["PDF NAV Pack", "Investor Statement", "Trial Balance", "P&L", "Balance Sheet"].map((x) => <button className="scenario-button" key={x} onClick={() => download(`${x.replaceAll(" ", "-").toLowerCase()}.csv`, csv)}><Download size={16} />{x}</button>)}
        {packs.map((pack) => <button className="scenario-button" key={pack.name} onClick={() => downloadCsv(pack.name, opsPackRows(pack.kind, store, r))}><FileDown size={16} />{pack.label}</button>)}
      </div>
    </section>
  );
}

function impactDelta(before = 0, after = 0) {
  const delta = after - before;
  const pctMove = before ? delta / Math.abs(before) : 0;
  return { delta, pctMove };
}

function ManualEditModeBar() {
  const { manualEditMode, toggleManualEditMode, activeScenarioImpact, trainingMode, submitManualUpdates } = useFundStore();
  const nav = activeScenarioImpact ? impactDelta(activeScenarioImpact.before.nav, activeScenarioImpact.after.nav) : null;
  const mat = activeScenarioImpact && nav ? materiality(activeScenarioImpact.after.nav, nav.delta) : null;
  return (
    <div className="edit-mode-bar">
      <div>
        <b>{trainingMode === "Sandbox" ? "Sandbox Manual Intervention" : "Manual Data Edit Mode"}</b>
        <span>{manualEditMode ? "Enabled - type numbers into the workbench and the simulator recalculates NAV, GL, P&L, cash, investor allocation, breaks and audit trail." : "Disabled - enable edits to test operational amendments and see downstream impact."}</span>
      </div>
      {activeScenarioImpact && nav && <div className="manual-impact-grid">
        <div><span>Before NAV</span><b>{fmt(activeScenarioImpact.before.nav, true)}</b></div>
        <div><span>After NAV</span><b>{fmt(activeScenarioImpact.after.nav, true)}</b></div>
        <div><span>Difference</span><b className={nav.delta >= 0 ? "text-good" : "text-bad"}>{fmt(nav.delta, true)} / {(nav.pctMove * 100).toFixed(2)}%</b></div>
        <div><span>Impacted Modules</span><b>NAV, GL, TB, P&L, Cash, Investors</b></div>
        <div><span>Control Triggered</span><b>{mat?.label ?? "Pending"} materiality check</b></div>
        <div><span>Approval Needed</span><b>{mat?.label === "Critical" || mat?.label === "Medium" ? "Yes - maker/checker" : "Operational review"}</b></div>
      </div>}
      <button className={`terminal-button ${manualEditMode ? "selected" : ""}`} onClick={toggleManualEditMode}>
        <SlidersHorizontal size={15} /> {manualEditMode ? "Manual Input On" : "Allow Manual Input"}
      </button>
      <button className="terminal-button selected" onClick={() => submitManualUpdates("Sandbox intervention", "Scenario workbench inputs")}>
        <BookOpenCheck size={15} /> Submit Impact
      </button>
    </div>
  );
}

function ScenarioCard({ scenario, compact = false }: { scenario: ScenarioDefinition; compact?: boolean }) {
  const { applyScenario, explainContext, activeScenarioId } = useFundStore();
  return (
    <div className={`scenario-card ${activeScenarioId === scenario.id ? "active" : ""}`}>
      <div className="scenario-card-head">
        <span>{scenario.module}</span>
        <b>{scenario.scenarioName}</b>
      </div>
      <div className="scenario-meta">
        <span className={`tag ${scenario.materialityLevel === "Critical" || scenario.materialityLevel === "High" ? "bad" : scenario.materialityLevel === "Medium" ? "warn" : "good"}`}>{scenario.difficulty}</span>
        <span className="tag">{scenario.fundType}</span>
        <span className={`tag ${scenario.materialityLevel === "Critical" ? "bad" : scenario.materialityLevel === "High" ? "warn" : "good"}`}>{scenario.materialityLevel}</span>
      </div>
      {!compact && <p>{scenario.objective}</p>}
      <small>{scenario.learnerTask}</small>
      <div className="scenario-card-actions">
        <button className="terminal-button selected" onClick={() => applyScenario(scenario.id)}>Start Scenario</button>
        <button className="terminal-button" onClick={() => explainContext({
          tab: scenario.module,
          title: scenario.scenarioName,
          summary: scenario.businessContext,
          accountingImpact: scenario.expectedGLImpact,
          navImpact: scenario.expectedNAVImpact,
          recommendedAction: scenario.aiCopilotExplanation,
          relatedEntries: scenario.affectedTables,
        })}>AI Guide</button>
      </div>
    </div>
  );
}

function ScenarioEditableGrid({ module }: { module: ModuleId }) {
  const store = useFundStore();
  const r = useRecalc();
  if (module === "pricing" || module === "holdings") {
    return (
      <section className="scenario-workbench">
        <PanelTitle title="Editable Scenario Workbench" right="Prices, quantities and valuation inputs" />
        <div className="table-wrap">
          <table className="data-grid">
            <thead><tr><th>Ticker</th><th>Asset</th><th>Currency</th><th>Quantity</th><th>Market Price</th><th>Current FX</th><th>Base MV</th><th>Unrealized P&L</th><th>Exposure</th></tr></thead>
            <tbody>{r.holdings.slice(0, 25).map((h) => <tr key={h.id}>
              <td>{h.ticker}</td><td>{h.assetType}</td><td>{h.currency}</td>
              <td><FlashCell id={`${h.id}-quantity`}><EditableNumber value={h.quantity} onCommit={(v) => store.updateHolding(h.id, "quantity", v)} /></FlashCell></td>
              <td><FlashCell id={`${h.id}-marketPrice`}><EditableNumber value={h.marketPrice} onCommit={(v) => store.updateHolding(h.id, "marketPrice", v)} /></FlashCell></td>
              <td>{h.fxRate.toFixed(4)}</td><td>{fmt(h.baseMarketValue, true)}</td><td className={h.totalUnrealizedPnl >= 0 ? "text-good" : "text-bad"}>{fmt(h.totalUnrealizedPnl, true)}</td><td>{h.exposurePct.toFixed(2)}%</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    );
  }
  if (module === "trades") {
    return (
      <section className="scenario-workbench">
        <PanelTitle title="Editable Scenario Workbench" right="Trade economics and broker charges" />
        <div className="table-wrap"><table className="data-grid"><thead><tr><th>Trade ID</th><th>Broker</th><th>Side</th><th>Ticker</th><th>Quantity</th><th>Price</th><th>Fees</th><th>Status</th><th>Net Amount</th></tr></thead><tbody>{store.trades.map((t) => <tr key={t.id}><td>{t.id}</td><td>{t.broker}</td><td>{t.side}</td><td>{t.ticker}</td><td><EditableNumber value={t.quantity} onCommit={(v) => store.updateTrade(t.id, "quantity", v)} /></td><td><EditableNumber value={t.price} onCommit={(v) => store.updateTrade(t.id, "price", v)} /></td><td><EditableNumber value={t.fees} onCommit={(v) => store.updateTrade(t.id, "fees", v)} /></td><td>{t.status}</td><td>{fmt(t.quantity * t.price + (t.side === "Buy" ? t.fees : -t.fees), true)}</td></tr>)}</tbody></table></div>
      </section>
    );
  }
  if (module === "cashRecon") {
    return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="Cash records and reconciliation differences" /><SimpleRows rows={store.cashRecon.map((c) => ({ Currency: c.currency, "Internal Ledger": fmt(c.internalLedgerCash, true), Custodian: fmt(c.custodianCash, true), "Prime Broker": fmt(c.primeBrokerCash, true), Difference: fmt(c.internalLedgerCash - c.custodianCash, true), Reason: c.breakReason, Status: c.status }))} /></section>;
  }
  if (module === "positionRecon") {
    return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="Position records and settlement breaks" /><SimpleRows rows={store.positionRecon.map((p) => ({ Ticker: p.ticker, Internal: num(p.internalPosition), Custodian: num(p.custodianPosition), PB: num(p.pbPosition), Difference: num(p.internalPosition - p.custodianPosition), Settlement: p.settlementStatus, Reason: p.breakReason, Status: p.status }))} /></section>;
  }
  if (module === "gl") {
    return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="GL postings and trial balance impact" /><GLView /></section>;
  }
  if (module === "capital" || module === "subsReds") {
    return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="Investor capital and share activity" /><InvestorView /></section>;
  }
  if (module === "corporateActions") {
    return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="Income and corporate action processing" /><CorporateActionsView /></section>;
  }
  if (module === "risk" || module === "stress" || module === "scenario") {
    return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="Risk shock inputs" /><DerivativesView /></section>;
  }
  return <section className="scenario-workbench"><PanelTitle title="Editable Scenario Workbench" right="NAV package impact" /><Statements kind="nav" /></section>;
}

type ScenarioExperienceLevel = "All" | "0-4 Years" | "4-10 Years" | "10+ Years";
type ScenarioDesignation = "All" | "Analyst" | "SME / Senior Analyst / QA" | "Signoff Authority";
type ScenarioSimulationType = "All" | "NAV Oversight" | "Reconciliation" | "Pricing" | "Trade Operations" | "Corporate Actions" | "Performance Fees" | "Management Fees" | "Investor Allocation" | "Operational Risk" | "Crisis Simulation";

type ScenarioSeniority = {
  experience: Exclude<ScenarioExperienceLevel, "All">;
  designation: Exclude<ScenarioDesignation, "All">;
  roleTypes: string;
  responsibility: string;
  permissions: string;
  complexity: string;
  estimatedResolution: string;
  expectedSignoffLevel: string;
  expectedOutput: string;
};

function scenarioSeniority(scenario: ScenarioDefinition): ScenarioSeniority {
  const name = scenario.scenarioName.toLowerCase();
  const objective = scenario.objective.toLowerCase();
  const isSignoff = scenario.difficulty === "Crisis Simulation"
    || scenario.difficulty === "NAV Oversight"
    || ["restatement", "post release", "compensation", "collateral crisis", "liquidity", "gating", "suspension", "regulatory", "audit qualification", "material pricing override", "open breaks"].some((term) => name.includes(term) || objective.includes(term));
  const isSme = scenario.difficulty === "Advanced"
    || scenario.difficulty === "Real World Ops"
    || ["fee", "hurdle", "benchmark", "equalization", "cross-currency", "dirty", "clean", "valuation review", "prime broker", "lifecycle", "allocation"].some((term) => name.includes(term) || objective.includes(term));

  if (isSignoff) {
    return {
      experience: "10+ Years",
      designation: "Signoff Authority",
      roleTypes: "Vice President / Director / Fund Controller / NAV Oversight Head",
      responsibility: "Final NAV signoff, materiality decisioning, governance, investor communication and crisis escalation.",
      permissions: "Final NAV approval, release authorization, price override approval, restatement approval and workflow release.",
      complexity: "Advanced + Crisis Simulation",
      estimatedResolution: scenario.materialityLevel === "Critical" ? "Same day crisis bridge" : "2-4 hours",
      expectedSignoffLevel: "NAV Manager / Fund Controller",
      expectedOutput: "Final approval decision, governance assessment, investor communication summary, risk severity, committee notes and regulatory impact.",
    };
  }

  if (isSme) {
    return {
      experience: "4-10 Years",
      designation: "SME / Senior Analyst / QA",
      roleTypes: "Senior Fund Accountant / SME / QA Reviewer / NAV Reviewer / Oversight Analyst",
      responsibility: "Root cause analysis, NAV validation, complex reconciliation review, materiality assessment and QA signoff recommendation.",
      permissions: "Review and validate adjustments, approve operational fixes, escalate material breaks and recommend NAV restatement.",
      complexity: "Intermediate to Advanced",
      estimatedResolution: scenario.materialityLevel === "High" || scenario.materialityLevel === "Critical" ? "60-120 minutes" : "30-60 minutes",
      expectedSignoffLevel: "Senior Reviewer / QA Lead",
      expectedOutput: "Validation workflow, recommended accounting entries, materiality assessment, operational signoff recommendation and QA comments.",
    };
  }

  return {
    experience: "0-4 Years",
    designation: "Analyst",
    roleTypes: "Fund Accountant / NAV Analyst / Operations Analyst / Reconciliation Analyst / Pricing Analyst",
    responsibility: "Transaction processing, break identification, basic NAV impact analysis, validation and escalation.",
    permissions: "Investigate only, document breaks, prepare notes and recommend escalation.",
    complexity: "Beginner to Intermediate",
    estimatedResolution: scenario.materialityLevel === "Medium" ? "30-45 minutes" : "15-30 minutes",
    expectedSignoffLevel: "Senior Analyst / SME",
    expectedOutput: "Break identification, NAV impact, suggested escalation and operational notes.",
  };
}

function scenarioSimulationType(scenario: ScenarioDefinition): Exclude<ScenarioSimulationType, "All"> {
  const name = scenario.scenarioName.toLowerCase();
  const objective = scenario.objective.toLowerCase();
  if (scenario.difficulty === "Crisis Simulation") return "Crisis Simulation";
  if (scenario.module === "nav" || name.includes("nav") || name.includes("restatement")) return "NAV Oversight";
  if (name.includes("performance fee") || name.includes("hurdle") || name.includes("benchmark")) return "Performance Fees";
  if (name.includes("management fee") || name.includes("commission") || name.includes("broker fee")) return "Management Fees";
  if (scenario.module === "cashRecon" || scenario.module === "positionRecon" || objective.includes("recon")) return "Reconciliation";
  if (scenario.module === "pricing" || scenario.module === "holdings" || name.includes("price") || name.includes("stale") || name.includes("valuation")) return "Pricing";
  if (scenario.module === "trades" || name.includes("trade") || name.includes("settlement")) return "Trade Operations";
  if (scenario.module === "corporateActions" || name.includes("corporate") || name.includes("dividend") || name.includes("coupon") || name.includes("split")) return "Corporate Actions";
  if (scenario.module === "capital" || name.includes("investor") || name.includes("subscription") || name.includes("redemption") || name.includes("equalization")) return "Investor Allocation";
  return "Operational Risk";
}

function scenarioOperationalMetadata(scenario: ScenarioDefinition) {
  const seniority = scenarioSeniority(scenario);
  const simulationType = scenarioSimulationType(scenario);
  const escalationOwner: Record<Exclude<ScenarioSimulationType, "All">, string> = {
    "NAV Oversight": "NAV Manager",
    Reconciliation: "Reconciliation Manager",
    Pricing: "Valuations Lead",
    "Trade Operations": "Trade Operations Lead",
    "Corporate Actions": "Income / Corporate Actions Supervisor",
    "Performance Fees": "Fund Accounting SME",
    "Management Fees": "Fund Accounting SME",
    "Investor Allocation": "Investor Services Manager",
    "Operational Risk": "Risk & Operations Head",
    "Crisis Simulation": "NAV Oversight Committee",
  };
  return {
    ...seniority,
    simulationType,
    criticality: scenario.materialityLevel,
    escalationOwner: escalationOwner[simulationType],
    navImpactCategory: scenario.materialityLevel === "Critical" || scenario.materialityLevel === "High" ? "Material NAV impact" : scenario.materialityLevel === "Medium" ? "Review threshold" : "Operational control item",
    signoffRequired: seniority.designation === "Signoff Authority" || scenario.materialityLevel === "Critical" || scenario.materialityLevel === "High" ? "Yes" : "No",
  };
}

function ScenarioSimulationCard({ scenario }: { scenario: ScenarioDefinition }) {
  const { applyScenario, activeScenarioId } = useFundStore();
  const meta = scenarioOperationalMetadata(scenario);
  return (
    <div className={`scenario-card ${activeScenarioId === scenario.id ? "active" : ""}`}>
      <div className="scenario-card-head">
        <span>{meta.simulationType}</span>
        <b>{scenario.scenarioName}</b>
      </div>
      <div className="scenario-meta">
        <span className="tag">{meta.experience}</span>
        <span className="tag">{meta.designation}</span>
        <span className={`tag ${meta.criticality === "Critical" ? "bad" : meta.criticality === "High" || meta.criticality === "Medium" ? "warn" : "good"}`}>{meta.criticality}</span>
      </div>
      <p>{scenario.objective}</p>
      <SimpleRows rows={[
        { "Estimated resolution": meta.estimatedResolution, "Escalation owner": meta.escalationOwner },
        { "NAV impact category": meta.navImpactCategory, "Signoff required": meta.signoffRequired },
        { "Responsibility level": meta.responsibility, Permissions: meta.permissions },
      ]} />
      <small>{scenario.learnerTask}</small>
      <div className="scenario-card-actions">
        <button className="terminal-button selected" onClick={() => applyScenario(scenario.id)}>Start Scenario</button>
      </div>
    </div>
  );
}

function ScenarioIncidentPanel({ scenario }: { scenario: ScenarioDefinition }) {
  const meta = scenarioOperationalMetadata(scenario);
  return (
    <div className="scenario-active-summary">
      <span>Operational Incident Summary</span>
      <b>{scenario.scenarioName}</b>
      <p>{scenario.businessContext}</p>
      <SimpleRows rows={[
        { "Affected fund area": scenario.affectedTables.join(" -> "), "NAV impact": scenario.expectedNAVImpact },
        { "Operational break": scenario.expectedReconciliationImpact, "Required action": scenario.learnerTask },
        { "Escalation matrix": "Analyst investigates -> SME validates -> Signoff authority approves material NAV decision", "Expected signoff level": meta.expectedSignoffLevel },
        { "Expected output": meta.expectedOutput, "Operational role": meta.roleTypes },
      ]} />
    </div>
  );
}

function ScenarioLabView() {
  const store = useFundStore();
  const [experience, setExperience] = useState<ScenarioExperienceLevel>("All");
  const [designation, setDesignation] = useState<ScenarioDesignation>("All");
  const [simulationType, setSimulationType] = useState<ScenarioSimulationType>("All");
  const filtered = useMemo(() => scenarioCatalog.filter((scenario) => {
    const meta = scenarioOperationalMetadata(scenario);
    const experienceOk = experience === "All" || meta.experience === experience;
    const designationOk = designation === "All" || meta.designation === designation;
    const typeOk = simulationType === "All" || meta.simulationType === simulationType;
    return experienceOk && designationOk && typeOk;
  }), [experience, designation, simulationType]);
  const [selectedId, setSelectedId] = useState<string>(filtered[0]?.id ?? scenarioCatalog[0].id);
  const experienceLevels: ScenarioExperienceLevel[] = ["All", "0-4 Years", "4-10 Years", "10+ Years"];
  const designations: ScenarioDesignation[] = ["All", "Analyst", "SME / Senior Analyst / QA", "Signoff Authority"];
  const simulationTypes: ScenarioSimulationType[] = ["All", "NAV Oversight", "Reconciliation", "Pricing", "Trade Operations", "Corporate Actions", "Performance Fees", "Management Fees", "Investor Allocation", "Operational Risk", "Crisis Simulation"];
  const selected = filtered.find((scenario) => scenario.id === selectedId) ?? filtered[0] ?? scenarioCatalog[0];
  const activeScenario = scenarioCatalog.find((scenario) => scenario.id === store.activeScenarioId);
  const workbenchModule = activeScenario?.module ?? selected.module;
  const nav = store.activeScenarioImpact ? impactDelta(store.activeScenarioImpact.before.nav, store.activeScenarioImpact.after.nav) : null;

  useEffect(() => {
    if (!filtered.some((scenario) => scenario.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? scenarioCatalog[0].id);
    }
  }, [filtered, selectedId]);

  return (
    <section className="panel full scenario-lab">
      <PanelTitle title="Scenario Simulation Sandbox" right="Role-based hedge fund operations training" />
      <ManualEditModeBar />
      <div className="sandbox-explainer">
        <div><b>Experience framework</b><span>Scenarios adapt to analyst, SME/QA and signoff authority responsibilities.</span></div>
        <div><b>Operational maturity</b><span>Complexity moves from break identification to root cause review and final NAV governance.</span></div>
        <div><b>Execution flow</b><span>Start a scenario to review incident summary, NAV impact, break, escalation matrix and expected signoff.</span></div>
      </div>
      <div className="scenario-filters">
        <select className="terminal-select" value={experience} onChange={(e) => setExperience(e.target.value as ScenarioExperienceLevel)}>
          {experienceLevels.map((level) => <option key={level}>{level}</option>)}
        </select>
        <select className="terminal-select" value={designation} onChange={(e) => setDesignation(e.target.value as ScenarioDesignation)}>
          {designations.map((role) => <option key={role}>{role}</option>)}
        </select>
        <select className="terminal-select" value={simulationType} onChange={(e) => setSimulationType(e.target.value as ScenarioSimulationType)}>
          {simulationTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </div>
      <div className="scenario-lab-clean">
        <div className="scenario-list">
          {filtered.map((scenario) => {
            const meta = scenarioOperationalMetadata(scenario);
            return <button key={scenario.id} className={selected.id === scenario.id ? "selected" : ""} onClick={() => setSelectedId(scenario.id)}><b>{scenario.scenarioName}</b><span>{meta.experience} - {meta.designation} - {meta.simulationType}</span></button>;
          })}
        </div>
        <div className="scenario-detail">
          <ScenarioSimulationCard scenario={selected} />
          {activeScenario && <div className="scenario-active-summary">
            <span>Active Investigation</span>
            <b>{activeScenario.scenarioName}</b>
            <p>{activeScenario.businessContext}</p>
            <div className="impact-cards">
              <Metric label="NAV impact" value={fmt(nav?.delta ?? 0, true)} tone={(nav?.delta ?? 0) >= 0 ? "good" : "bad"} />
              <Metric label="NAV impact %" value={`${((nav?.pctMove ?? 0) * 100).toFixed(2)}%`} tone={(nav?.delta ?? 0) >= 0 ? "good" : "bad"} />
              <Metric label="Materiality" value={materiality(store.activeScenarioImpact?.after.nav ?? 0, nav?.delta ?? 0).label} tone={materiality(store.activeScenarioImpact?.after.nav ?? 0, nav?.delta ?? 0).tone} />
            </div>
            <div className="scenario-card-actions">
              <button className="terminal-button" onClick={() => store.setAiPanelOpen(true)}><Bot size={15} /> AI Explain Impact</button>
              <button className="terminal-button reject" onClick={store.resetScenario}>Reset Scenario</button>
            </div>
          </div>}
          {activeScenario && <ScenarioIncidentPanel scenario={activeScenario} />}
        </div>
      </div>
      <ScenarioEditableGrid module={workbenchModule} />
    </section>
  );
}

function ImpactSummaryPanel() {
  const store = useFundStore();
  const r = useRecalc();
  const activeScenario = scenarioCatalog.find((scenario) => scenario.id === store.activeScenarioId);
  const navDelta = store.activeScenarioImpact ? impactDelta(store.activeScenarioImpact.before.nav, store.activeScenarioImpact.after.nav) : { delta: 0, pctMove: 0 };
  const unresolvedImpact = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status)).reduce((sum, b) => sum + Math.abs(b.navImpact), 0);
  const mat = materiality(r.netAssets, Math.abs(navDelta.delta) || unresolvedImpact);
  const blocked = mat.label === "Critical" || store.breaks.some((b) => b.severity === "High" && !["Resolved", "Approved", "Closed"].includes(b.status)) || r.exceptions.some((e) => e.severity === "High" && e.status !== "Cleared");
  const controls = activeScenario?.expectedControlBreaks ?? [
    "Price tolerance breach",
    "Cash/position tolerance",
    "Missing approval",
    "NAV movement threshold",
  ];
  return (
    <section className="impact-summary">
      <div className="impact-title"><Activity size={15} /><b>Impact Summary</b></div>
      <div className="impact-summary-grid">
        <div><span>NAV Impact</span><b className={navDelta.delta >= 0 ? "text-good" : "text-bad"}>{fmt(navDelta.delta, true)}</b></div>
        <div><span>NAV Impact %</span><b>{(navDelta.pctMove * 100).toFixed(2)}%</b></div>
        <div><span>P&L Impact</span><b>{fmt(r.pnl.reduce((sum, line) => sum + line.amount, 0), true)}</b></div>
        <div><span>Open Breaks</span><b className={blocked ? "text-bad" : "text-good"}>{openBreakCount(store)}</b></div>
      </div>
      <div className={`release-banner ${blocked ? "blocked" : "clear"}`}>{blocked ? "NAV RELEASE BLOCKED" : "NAV RELEASE CLEAR"}</div>
      <div className="impact-lines">
        <p><span>GL Impact</span><b>{r.gl.length} journals / {r.trialBalance.length} TB accounts</b></p>
        <p><span>Cash Impact</span><b>{fmt(store.activities.reduce((sum, a) => sum + (a.type === "Subscription" ? a.amount : -a.amount), 0), true)}</b></p>
        <p><span>Investor Impact</span><b>{store.investors.length} capital accounts recalculated</b></p>
        <p><span>Risk Severity</span><b>{mat.label}</b></p>
        <p><span>Approval Status</span><b>{blocked ? "Analyst -> Reviewer -> NAV Manager" : store.fundSetup.workflowStatus}</b></p>
      </div>
      <div className="control-list">{controls.slice(0, 5).map((control) => <span key={control}>{control}</span>)}</div>
    </section>
  );
}

function OperationalBottomPanel() {
  const store = useFundStore();
  const r = useRecalc();
  const latestAudit = store.auditTrail[0];
  const highException = r.exceptions.find((e) => e.severity === "High" && e.status !== "Cleared");
  return (
    <section className="ops-bottom">
      <div><span>AI Copilot</span><b>{store.aiPanelOpen ? "Open" : "Closed"}</b><small>Use AI Explain Impact for investigation prompts.</small></div>
      <div><span>Exception Alert</span><b className={highException ? "text-bad" : "text-good"}>{highException?.message ?? "No critical alert"}</b><small>{highException?.owner ?? "NAV control clear"}</small></div>
      <div><span>Audit Trail</span><b>{latestAudit?.action ?? "No action yet"}</b><small>{latestAudit ? new Date(latestAudit.timestamp).toLocaleTimeString() : "Awaiting edit or upload"}</small></div>
      <div><span>Dependency Flow</span><b>{store.impactedModules.slice(0, 4).map((id) => modules.find((m) => m.id === id)?.label).filter(Boolean).join(" -> ") || "No active ripple"}</b><small>Operational ripple effect analysis</small></div>
    </section>
  );
}

function CopilotChatSurface({ compact = false }: { compact?: boolean }) {
  const { copilotContext, activeModule, trainingMode } = useFundStore();
  const store = useFundStore();
  const r = useRecalc();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "I am your institutional operations copilot. Type a question about NAV movement, breaks, uploads, GL postings, fees, holdings, FX, or approval workflow.", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [category, setCategory] = useState<PromptCategory | "All">("All");
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const label = modules.find((m) => m.id === activeModule)?.label ?? "Current Module";
  const effectiveMode = trainingMode === "Sandbox" ? "Learning" : "Professional";
  const fallback: CopilotContext = {
    tab: activeModule,
    title: label,
    summary: "This assistant is context-aware to the current operational tab. Select a break, upload, journal, NAV figure, or workflow item for a sharper explanation.",
    accountingImpact: "Edits and uploads propagate through validation, breaks, GL, trial balance, P&L, balance sheet, NAV and investor allocation.",
    navImpact: "Material operational differences remain visible until resolved or approved through maker-checker controls.",
    recommendedAction: "Use upload validation, break assignment, resolution notes, and workflow approval before publishing NAV.",
    relatedEntries: ["Current tab", "Audit trail", "Break management", "NAV package"],
  };
  const ctx = copilotContext ?? fallback;
  useEffect(() => {
    const timer = window.setInterval(() => setRotation((value) => value + 1), compact ? 9000 : 7000);
    return () => window.clearInterval(timer);
  }, [compact, activeModule]);
  useEffect(() => {
    setRotation(0);
    setShowMore(false);
    setCategory("All");
  }, [activeModule, effectiveMode]);
  const suggestions = buildOperationalQuestions({ active: activeModule, mode: effectiveMode, store, r, rotation });
  const categories = Array.from(new Set(suggestions.map((item) => item.category))).slice(0, compact ? 5 : 10);
  const filteredSuggestions = category === "All" ? suggestions : suggestions.filter((item) => item.category === category);
  const visibleSuggestions = filteredSuggestions.slice(0, showMore ? (compact ? 12 : 20) : (compact ? 6 : 10));
  const recommended = suggestions[0];
  const ask = (text: string) => {
    const question = text.trim();
    if (!question || typing) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: question, timestamp: new Date().toLocaleTimeString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setRecentQuestions((items) => [question, ...items.filter((item) => item !== question)].slice(0, 5));
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      const answer = generateCopilotReply(question, { active: activeModule, label, r, store, mode: effectiveMode, context: ctx, history: nextMessages });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: answer, timestamp: new Date().toLocaleTimeString() }]);
      setTyping(false);
    }, 350);
  };
  return (
    <div className={`copilot-chat ${compact ? "compact" : ""}`}>
      <div className="question-engine-head">
        <div><b>Suggested Operational Questions</b><span>{trainingMode === "Sandbox" ? "Senior manager guidance rotates with scenario and role context." : "Professional prompts rotate with tab, breaks, uploads and NAV state."}</span></div>
        {recommended && <button onClick={() => ask(recommended.text)}>AI recommends: {recommended.text}</button>}
      </div>
      <div className="question-categories">
        <button className={category === "All" ? "selected" : ""} onClick={() => setCategory("All")}>All</button>
        {categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <div className="suggested-prompts question-grid">
        {visibleSuggestions.map((prompt) => <button key={`${prompt.category}-${prompt.text}`} onClick={() => ask(prompt.text)}><span>{prompt.category}</span>{prompt.text}</button>)}
      </div>
      <div className="question-footer">
        <button className="link-button" onClick={() => setShowMore((value) => !value)}>{showMore ? "Show fewer" : `Show more (${filteredSuggestions.length})`}</button>
        <button className="link-button" onClick={() => setRotation((value) => value + 4)}>Rotate questions</button>
      </div>
      {recentQuestions.length ? <div className="recent-questions"><span>Recently asked</span>{recentQuestions.map((item) => <button key={item} onClick={() => ask(item)}>{item}</button>)}</div> : null}
      <div className="chat-window" aria-label="AI Copilot conversation">
        {messages.map((m) => <div key={m.id} className={`chat-message ${m.role}`}><p>{m.text}</p><span>{m.timestamp}</span></div>)}
        {typing && <div className="chat-message assistant typing"><p>Analyzing live NAV, breaks, uploads and workflow context...</p></div>}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your question here..." aria-label="Ask the AI Copilot" />
        <button type="submit" disabled={!draft.trim() || typing}>Ask</button>
      </form>
    </div>
  );
}

function AICopilotWorkspace() {
  const r = useRecalc();
  const store = useFundStore();
  const { setAiPanelOpen, setTrainingMode, trainingMode, explainContext, setActiveModule } = store;
  const openBreaks = store.breaks.filter((b) => !["Resolved", "Approved", "Closed"].includes(b.status));
  const latestUpload = store.uploads[0];
  const largestHolding = [...r.holdings].sort((a, b) => Math.abs(b.baseMarketValue) - Math.abs(a.baseMarketValue))[0];
  const selectedBreak = openBreaks.sort((a, b) => b.navImpact - a.navImpact)[0];
  const prompts = [
    "Why did NAV move today?",
    "Analyze open breaks",
    "Explain GL posting impact",
    "Show biggest exposure",
    "How do I publish NAV?",
    "Explain latest upload validation",
  ];
  const launchPrompt = (prompt: string) => {
    explainContext({
      tab: "aiCopilot",
      title: prompt,
      summary: `The Copilot is reading live simulator data: NAV ${fmt(r.netAssets, true)}, ${openBreaks.length} open break(s), latest upload ${latestUpload?.fileName ?? "none"}, and workflow ${store.fundSetup.workflowStatus}.`,
      accountingImpact: "The assistant can explain how edits and uploads propagate through GL, trial balance, P&L, balance sheet, NAV, fees, and investor allocations.",
      navImpact: "It uses current recalculation outputs, open breaks, holdings, FX, fees, and workflow status to explain NAV movement.",
      recommendedAction: "Ask a question in the Copilot panel, or select an operational module from the workflow shortcuts below.",
      relatedEntries: ["NAV Package", "Break Management", "General Ledger", "Portfolio Holdings", "Upload Validation"],
    });
  };
  return (
    <section className="panel full ai-workspace">
      <PanelTitle title="Institutional AI Copilot" right="Conversational NAV operations assistant" />
      <div className="ai-hero">
        <div>
          <div className="ai-badge"><Bot size={16} /> Live dashboard context enabled</div>
          <h2>Ask questions about NAV, breaks, uploads, GL postings, fees, holdings, FX and workflow approvals.</h2>
          <p>The Copilot is connected to the simulator state. Open the chat panel, type naturally, and it will answer using the active tab, live NAV, reconciliation breaks, uploads, selected records and audit context.</p>
        </div>
        <div className="ai-launch-actions">
          <button className="terminal-button selected" onClick={() => setAiPanelOpen(true)}><Bot size={16} /> Open AI Chat</button>
          <button className={`terminal-button ${trainingMode === "Sandbox" ? "selected" : ""}`} onClick={() => {
            const nextMode = trainingMode === "Sandbox" ? "Live Mode" : "Sandbox";
            setTrainingMode(nextMode);
            if (nextMode === "Sandbox") setActiveModule("sandboxCommand");
          }}><Brain size={16} /> {trainingMode === "Sandbox" ? "Return Live" : "Open Sandbox"}</button>
        </div>
      </div>
      <div className="ai-context-grid">
        <div className="ai-context-card">
          <span>Current NAV</span>
          <b>{fmt(r.netAssets, true)}</b>
          <small>NAV/share {r.navPerShare.toFixed(4)} with live fee and P&L recalculation.</small>
        </div>
        <div className="ai-context-card">
          <span>Open Breaks</span>
          <b>{openBreaks.length}</b>
          <small>{selectedBreak ? `${selectedBreak.id}: ${selectedBreak.breakType}, ${fmt(selectedBreak.navImpact, true)} NAV impact.` : "No material break selected."}</small>
        </div>
        <div className="ai-context-card">
          <span>Largest Exposure</span>
          <b>{largestHolding?.ticker ?? "N/A"}</b>
          <small>{largestHolding ? `${fmt(largestHolding.baseMarketValue, true)} base market value, ${largestHolding.exposurePct.toFixed(2)}% exposure.` : "No holdings loaded."}</small>
        </div>
        <div className="ai-context-card">
          <span>Latest Upload</span>
          <b>{latestUpload?.fileName ?? "None"}</b>
          <small>{latestUpload ? `${latestUpload.validationStatus}, ${latestUpload.warnings} warning(s), ${latestUpload.rejectedRows} rejected row(s).` : "Upload files in recon, pricing, trades or capital modules."}</small>
        </div>
      </div>
      <div className="ai-prompt-bank">
        {prompts.map((prompt) => <button key={prompt} onClick={() => launchPrompt(prompt)}>{prompt}</button>)}
      </div>
      <CopilotChatSurface />
      <div className="ai-shortcuts">
        <button className="scenario-button" onClick={() => setActiveModule("nav")}>NAV Package</button>
        <button className="scenario-button" onClick={() => setActiveModule("reconBreaks")}>Breaks Dashboard</button>
        <button className="scenario-button" onClick={() => setActiveModule("gl")}>General Ledger</button>
        <button className="scenario-button" onClick={() => setActiveModule("holdings")}>Portfolio Holdings</button>
        <button className="scenario-button" onClick={() => setActiveModule("workflow")}>Approval Queue</button>
      </div>
    </section>
  );
}

function ModuleContent() {
  const active = useFundStore((s) => s.activeModule);
  const trainingMode = useFundStore((s) => s.trainingMode);
  return (
    <AnimatePresence mode="wait">
      <motion.main key={active} className="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
        <DependencyStrip />
        {active === "dashboard" && <Dashboard />}
        {(active === "sandboxCommand" || active === "scenario") && trainingMode === "Sandbox" && <SandboxCommandCenter />}
        {active === "aiCopilot" && <AICopilotWorkspace />}
        {active === "fund" && <FundMasterSetup />}
        {active === "structureComparison" && <FundStructureComparisonView />}
        {active === "holdings" && <section className="panel full"><PanelTitle title="Editable Portfolio Holdings" right="Any edit recalculates NAV, P&L, GL and allocations" /><ManualSubmitBar label="Holding amendment workflow" fields="Quantity, Cost Price, Market Price" /><HoldingsGrid /></section>}
        {active === "security" && <><FileUploadPanel module="security" title="Security Reference Upload" /><SecurityMasterView /></>}
        {active === "editableFields" && <EditableFieldsView />}
        {active === "pricing" && <PricingEngine />}
        {active === "fx" && <><FileUploadPanel module="pricing" title="FX Pricing Sheet Upload" /><ManualSubmitBar label="FX rate workflow" fields="FX Rate by currency pair" /><FxEngine /></>}
        {active === "trades" && <><FileUploadPanel module="trades" title="Trade File Upload" /><ManualSubmitBar label="Trade amendment workflow" fields="Quantity, Price, Fees" /><TradeBlotter /></>}
        {active === "gl" && <GLView />}
        {active === "trialBalance" && <TrialBalance />}
        {active === "pl" && <Statements kind="pl" />}
        {active === "balanceSheet" && <Statements kind="balance" />}
        {active === "nav" && <Statements kind="nav" />}
        {(active === "capital" || active === "subsReds" || active === "investorReporting" || active === "equalization") && <><FileUploadPanel module="capital" title="Investor Capital Activity Upload" /><ManualSubmitBar label="Investor capital workflow" fields="Capital, Shares, High Water Mark" /><InvestorView /></>}
        {active === "mgmtFees" && <><ManualSubmitBar label="Management fee workflow" fields="Management Fee %, Fee Basis, Paid Fee allocation" /><ManagementFeeInvestorLevelView /></>}
        {active === "perfFees" && <><ManualSubmitBar label="Performance fee workflow" fields="Performance Fee %, Hurdle, HWM, Equalization" /><PerformanceFeeInvestorLevelView /></>}
        {active === "waterfall" && <><ManualSubmitBar label="Investment exit waterfall workflow" fields="Exit Proceeds, Capital Contributions, Preferred Return, GP Catch-Up, Carry Split" /><InvestmentExitWaterfallView /></>}
        {active === "expenses" && <><ManualSubmitBar label="Fee amendment workflow" fields="Management Fee %, Performance Fee %" /><InvestorView fees /></>}
        {(active === "otc" || active === "mtm") && <><ManualSubmitBar label="Derivative MTM workflow" fields="MTM, Accrued Interest, Collateral" /><DerivativesView /></>}
        {active === "dividends" && <AccrualsView kind="Dividend" />}
        {active === "coupons" && <AccrualsView kind="Coupon" />}
        {active === "corporateActions" && <><FileUploadPanel module="corporateActions" title="Corporate Action File Upload" /><CorporateActionsView /></>}
        {active === "audit" && <AuditTrail />}
        {active === "exceptions" && <BreaksDashboard />}
        {active === "reconBreaks" && <ReconciliationBreaks />}
        {active === "cashRecon" && <><FileUploadPanel module="cashRecon" title="Cash Reconciliation Upload" /><CashReconciliationView /></>}
        {active === "positionRecon" && <><FileUploadPanel module="positionRecon" title="Position Reconciliation Upload" /><PositionReconciliationView /></>}
        {active === "workflow" && <WorkflowQueue />}
        {(active === "scenario" || active === "sandboxCommand") && trainingMode === "Live Mode" && <Dashboard />}
        {active === "taOversight" && <QualityRubricView type="ta" />}
        {active === "middleOfficeOversight" && <QualityRubricView type="middle" />}
        {active === "backOfficeOversight" && <QualityRubricView type="back" />}
        {["risk", "stress", "ops"].includes(active) && <ReconRiskOps type={active} />}
        {active === "exports" && <ExportView />}
        <OperationalBottomPanel />
      </motion.main>
    </AnimatePresence>
  );
}

function CopilotPanel() {
  const { aiPanelOpen, setAiPanelOpen, copilotContext, activeModule, trainingMode } = useFundStore();
  const label = modules.find((m) => m.id === activeModule)?.label ?? "Current Module";
  if (!aiPanelOpen) return <button className="ai-rail" onClick={() => setAiPanelOpen(true)}><Bot size={18} /></button>;
  const fallback: CopilotContext = {
    tab: activeModule,
    title: label,
    summary: "This assistant is context-aware to the current operational tab. Select a break, upload, journal, NAV figure, or workflow item for a sharper explanation.",
    accountingImpact: "Edits and uploads propagate through validation, breaks, GL, trial balance, P&L, balance sheet, NAV and investor allocation.",
    navImpact: "Material operational differences remain visible until resolved or approved through maker-checker controls.",
    recommendedAction: "Use upload validation, break assignment, resolution notes, and workflow approval before publishing NAV.",
    relatedEntries: ["Current tab", "Audit trail", "Break management", "NAV package"],
  };
  const ctx = copilotContext ?? fallback;
  return (
    <aside className="ai-panel">
      <div className="ai-title"><Bot size={18} /><b>Institutional AI Copilot</b><button onClick={() => setAiPanelOpen(false)}>x</button></div>
      <div className="ai-mode">{trainingMode === "Sandbox" ? "Sandbox guidance enabled" : "Live Mode"} - {label}</div>
      <ImpactSummaryPanel />
      <CopilotChatSurface compact />
      <section><h3>{ctx.title}</h3><p>{ctx.summary}</p></section>
      <section><h4>Accounting Impact</h4><p>{ctx.accountingImpact}</p></section>
      <section><h4>NAV Impact</h4><p>{ctx.navImpact}</p></section>
      <section><h4>Recommended Workflow</h4><p>{ctx.recommendedAction}</p></section>
      <section><h4>Institutional Best Practice</h4><p>Document evidence, preserve audit traceability, resolve material breaks before approval, and never publish NAV while unresolved high-severity exceptions remain open.</p></section>
      <section><h4>Related Items</h4><ul>{(ctx.relatedEntries ?? []).map((x) => <li key={x}>{x}</li>)}</ul></section>
    </aside>
  );
}
function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const approvedEmails = (import.meta.env.VITE_APPROVED_EMAILS as string | undefined)
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) ?? [];
  const currentEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isApproved = Boolean(currentEmail && approvedEmails.includes(currentEmail));

  if (!isLoaded) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-mark">SF</div>
          <h1>Checking Access</h1>
          <p>Validating approved-user permissions.</p>
        </div>
      </div>
    );
  }

  if (!approvedEmails.length) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-mark">SF</div>
          <h1>Email Approval List Missing</h1>
          <p>Add <code>VITE_APPROVED_EMAILS</code> in Vercel with comma-separated approved emails.</p>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-mark">SF</div>
          <h1>Access Pending Approval</h1>
          <p>{currentEmail ? `${currentEmail} is signed in, but is not approved for this simulator.` : "This account is not approved."}</p>
          <span className="auth-note">Ask the administrator to add this email to the approved access list.</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="auth-shell">
          <div className="auth-panel">
            <div className="auth-copy">
              <div className="brand-mark">SF</div>
              <h1>SYED FUND SIMULATOR</h1>
              <p>Approved users only. Sign in with your registered email to access the NAV operations workstation.</p>
            </div>
            <SignIn routing="hash" />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <AuthGate>
          <div className="app-shell">
            <Sidebar />
            <div className="main-shell">
              <Header />
              <ModuleContent />
            </div>
            <CopilotPanel />
          </div>
        </AuthGate>
      </SignedIn>
    </>
  );
}
