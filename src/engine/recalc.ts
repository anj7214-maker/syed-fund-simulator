import { baseExceptions } from "../data/sampleData";
import { Accrual, CapitalActivity, CashReconRow, CorporateAction, Derivative, ExceptionItem, FxRate, Holding, Investor, JournalEntry, PositionReconRow, RecalcResult, Trade } from "../types";

const round = (value: number, dp = 2) => Number(value.toFixed(dp));
const signedValue = (h: Holding) => h.quantity * h.marketPrice * h.fxRate;
const costValue = (h: Holding) => h.quantity * h.costPrice * h.fxRate;

function tradeEntries(trades: Trade[]): JournalEntry[] {
  return trades.map((t) => {
    const gross = t.quantity * t.price;
    const cashSign = t.side === "Buy" ? "credit" : "debit";
    return {
      id: `JE-${t.id}`,
      date: t.tradeDate,
      source: "Trade Blotter",
      memo: `${t.side} ${t.quantity.toLocaleString()} ${t.ticker}`,
      auto: true,
      lines: [
        { account: t.side === "Buy" ? "Investments at fair value" : "Cash at broker", category: "Asset", debit: cashSign === "credit" ? gross : gross - t.fees, credit: 0, ref: t.id },
        { account: t.side === "Buy" ? "Cash at broker" : "Investments at fair value", category: "Asset", debit: 0, credit: cashSign === "credit" ? gross + t.fees : gross, ref: t.id },
        { account: "Broker fees", category: "Expense", debit: t.fees, credit: 0, ref: t.id },
      ],
    };
  });
}

function accrualEntries(accruals: Accrual[]): JournalEntry[] {
  return accruals.map((a) => {
    const amount = a.kind === "Dividend" ? a.netDividend ?? 0 : a.accruedInterest ?? 0;
    return {
      id: `JE-${a.id}`,
      date: a.exDate ?? "2026-05-09",
      source: `${a.kind} Accrual`,
      memo: `${a.kind} accrual for ${a.ticker}`,
      auto: true,
      lines: [
        { account: a.kind === "Dividend" ? "Dividend receivable" : "Interest receivable", category: "Asset", debit: amount, credit: 0, ref: a.id },
        { account: a.kind === "Dividend" ? "Dividend income" : "Interest income", category: "Income", debit: 0, credit: amount, ref: a.id },
      ],
    };
  });
}

function corporateActionEntries(corporateActions: CorporateAction[]): JournalEntry[] {
  return corporateActions
    .filter((a) => a.netReceivable !== 0 && a.postingStatus !== "Pending")
    .map((a) => ({
      id: `JE-${a.id}`,
      date: a.exDate,
      source: "Corporate Actions",
      memo: `${a.eventType} processing for ${a.security}`,
      auto: true,
      lines: [
        { account: a.postingStatus === "Cash Settled" ? "Cash at broker" : "Corporate action receivable", category: "Asset" as const, debit: Math.max(a.netReceivable, 0), credit: Math.max(-a.netReceivable, 0), ref: a.id },
        { account: a.eventType === "Coupon" ? "Interest income" : "Corporate action income", category: "Income" as const, debit: Math.max(-a.netReceivable, 0), credit: Math.max(a.netReceivable, 0), ref: a.id },
      ],
    }));
}

function feeEntries(managementFee: number, performanceFee: number): JournalEntry[] {
  return [
    {
      id: "JE-MGMT-FEE",
      date: "2026-05-09",
      source: "Management Fee Engine",
      memo: "Daily management fee accrual",
      auto: true,
      lines: [
        { account: "Management fee expense", category: "Expense", debit: managementFee, credit: 0, ref: "MGMT" },
        { account: "Management fee payable", category: "Liability", debit: 0, credit: managementFee, ref: "MGMT" },
      ],
    },
    {
      id: "JE-PERF-FEE",
      date: "2026-05-09",
      source: "Performance Fee Engine",
      memo: "Performance allocation over high water mark",
      auto: true,
      lines: [
        { account: "Performance fee expense", category: "Expense", debit: performanceFee, credit: 0, ref: "PERF" },
        { account: "Performance fee payable", category: "Liability", debit: 0, credit: performanceFee, ref: "PERF" },
      ],
    },
  ];
}

function mtmEntries(unrealizedGains: number, fxGainLoss: number, derivatives: Derivative[]): JournalEntry[] {
  const derivativeMtm = derivatives.reduce((sum, d) => sum + d.mtm, 0);
  return [
    {
      id: "JE-UNREALIZED",
      date: "2026-05-09",
      source: "Pricing Engine",
      memo: "Fair value and FX remeasurement",
      auto: true,
      lines: [
        { account: "Investments at fair value", category: "Asset", debit: Math.max(unrealizedGains, 0), credit: Math.max(-unrealizedGains, 0), ref: "FV" },
        { account: "Unrealized gain/loss", category: "Income", debit: Math.max(-unrealizedGains, 0), credit: Math.max(unrealizedGains, 0), ref: "FV" },
        { account: "FX gain/loss", category: "Income", debit: Math.max(-fxGainLoss, 0), credit: Math.max(fxGainLoss, 0), ref: "FX" },
      ],
    },
    {
      id: "JE-DERIV-MTM",
      date: "2026-05-09",
      source: "Swaps & Futures MTM",
      memo: "OTC derivative MTM adjustment",
      auto: true,
      lines: [
        { account: "Derivative asset/liability", category: derivativeMtm >= 0 ? "Asset" : "Liability", debit: Math.max(derivativeMtm, 0), credit: Math.max(-derivativeMtm, 0), ref: "OTC" },
        { account: "OTC MTM gain/loss", category: "Income", debit: Math.max(-derivativeMtm, 0), credit: Math.max(derivativeMtm, 0), ref: "OTC" },
      ],
    },
  ];
}

export function recalculate(params: {
  holdings: Holding[];
  trades: Trade[];
  fxRates: FxRate[];
  investors: Investor[];
  activities: CapitalActivity[];
  accruals: Accrual[];
  derivatives: Derivative[];
  corporateActions?: CorporateAction[];
  cashRecon?: CashReconRow[];
  positionRecon?: PositionReconRow[];
  managementFeePct: number;
  performanceFeePct: number;
  manualExceptions?: ExceptionItem[];
  manualJournalEntries?: JournalEntry[];
  manualNavAdjustments?: number;
}): RecalcResult {
  const holdingsRaw = params.holdings.map((h) => ({ ...h, fxRate: params.fxRates.find((fx) => fx.base === h.currency)?.rate ?? h.fxRate }));
  const grossExposure = holdingsRaw.reduce((sum, h) => sum + Math.abs(signedValue(h)), 0);
  const holdings = holdingsRaw.map((h) => {
    const localMarketValue = h.quantity * h.marketPrice;
    const localCostValue = h.quantity * h.costPrice;
    const costFx = h.costFx ?? h.fxRate;
    const mv = localMarketValue * h.fxRate;
    const cv = localCostValue * costFx;
    const pricePnl = (h.marketPrice - h.costPrice) * h.quantity * costFx;
    const fxPnl = localMarketValue * (h.fxRate - costFx);
    const totalUnrealizedPnl = pricePnl + fxPnl;
    return {
      ...h,
      marketValue: round(mv),
      costValue: round(cv),
      totalCost: round(cv),
      localMarketValue: round(localMarketValue),
      baseMarketValue: round(mv),
      pricePnl: round(pricePnl),
      fxPnl: round(fxPnl),
      totalUnrealizedPnl: round(totalUnrealizedPnl),
      unrealized: round(totalUnrealizedPnl),
      exposurePct: grossExposure ? round((Math.abs(mv) / grossExposure) * 100, 2) : 0,
      priceMovePct: h.priorPrice ? round(((h.marketPrice - h.priorPrice) / h.priorPrice) * 100, 2) : 0,
    };
  });

  const portfolioMv = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const unrealizedGains = holdings.reduce((sum, h) => sum + h.unrealized, 0);
  const priorFxValue = params.holdings.reduce((sum, h) => {
    const priorFx = params.fxRates.find((fx) => fx.base === h.currency)?.priorRate ?? h.fxRate;
    return sum + h.quantity * h.marketPrice * (h.currency === "USD" ? 1 : priorFx);
  }, 0);
  const fxGainLoss = portfolioMv - priorFxValue;
  const derivativeMtm = params.derivatives.reduce((sum, d) => sum + d.mtm + d.accruedInterest, 0);
  const derivativeCollateral = params.derivatives.reduce((sum, d) => sum + d.collateral, 0);
  const dividendIncome = params.accruals.filter((a) => a.kind === "Dividend").reduce((sum, a) => sum + (a.netDividend ?? 0), 0);
  const interestIncome = params.accruals.filter((a) => a.kind === "Coupon").reduce((sum, a) => sum + (a.accruedInterest ?? 0), 0);
  const corporateActionIncome = (params.corporateActions ?? [])
    .filter((a) => a.postingStatus !== "Pending")
    .reduce((sum, a) => sum + a.netReceivable, 0);
  const brokerFees = params.trades.reduce((sum, t) => sum + t.fees, 0);
  const investorCapital = params.investors.reduce((sum, i) => sum + i.capital, 0);
  const subscriptions = params.activities.filter((a) => a.type === "Subscription" && a.status === "Approved").reduce((sum, a) => sum + a.amount, 0);
  const redemptions = params.activities.filter((a) => a.type === "Redemption" && a.status !== "Rejected").reduce((sum, a) => sum + a.amount, 0);
  const netInvestorCash = investorCapital + subscriptions - redemptions;
  const adminExpenses = 185000;
  const averageNav = netInvestorCash + unrealizedGains * 0.5;
  const managementFee = round((averageNav * params.managementFeePct) / 365);
  const hwmBase = params.investors.reduce((sum, i) => sum + i.hwm * i.shares, 0);
  const performanceProfit = Math.max(0, portfolioMv + derivativeMtm + netInvestorCash - hwmBase);
  const performanceFee = round(performanceProfit * params.performanceFeePct);
  const liabilities = round(managementFee + performanceFee + adminExpenses + Math.max(-derivativeMtm, 0));
  const manualNavAdjustments = params.manualNavAdjustments ?? 0;
  const adjustedPortfolioMv = portfolioMv + manualNavAdjustments;
  const grossAssets = round(Math.max(adjustedPortfolioMv, 0) + Math.max(derivativeMtm, 0) + derivativeCollateral + dividendIncome + interestIncome + corporateActionIncome + Math.max(netInvestorCash, 0));
  const netAssets = round(grossAssets - liabilities);
  const sharesOutstanding = params.investors.reduce((sum, i) => sum + i.shares, 0);
  const navPerShare = sharesOutstanding ? round(netAssets / sharesOutstanding, 4) : 0;
  const realizedGains = params.trades.filter((t) => t.side === "Sell").reduce((sum, t) => sum + t.quantity * t.price * 0.037, 0);

  const gl = [
    ...tradeEntries(params.trades),
    ...accrualEntries(params.accruals),
    ...corporateActionEntries(params.corporateActions ?? []),
    ...mtmEntries(unrealizedGains, fxGainLoss, params.derivatives),
    ...feeEntries(managementFee, performanceFee),
    ...(params.manualJournalEntries ?? []),
  ];
  const trialMap = new Map<string, { account: string; category: string; debit: number; credit: number }>();
  gl.flatMap((je) => je.lines).forEach((line) => {
    const row = trialMap.get(line.account) ?? { account: line.account, category: line.category, debit: 0, credit: 0 };
    row.debit += line.debit;
    row.credit += line.credit;
    trialMap.set(line.account, row);
  });
  const trialBalance = [...trialMap.values()].map((r) => ({ ...r, debit: round(r.debit), credit: round(r.credit), balance: round(r.debit - r.credit) }));

  const exceptions = [
    ...baseExceptions.filter((item) => {
      if (params.positionRecon && item.module === "Position Reconciliation") return false;
      if (params.cashRecon && item.module === "Cash Reconciliation") return false;
      return true;
    }),
    ...(params.manualExceptions ?? []),
  ];
  (params.positionRecon ?? []).forEach((row) => {
    const custodianDifference = row.internalPosition - row.custodianPosition;
    const pbDifference = row.internalPosition - row.pbPosition;
    if (Math.abs(custodianDifference) >= 1 || Math.abs(pbDifference) >= 1) {
      exceptions.push({
        id: `pos-recon-${row.id}`,
        severity: Math.max(Math.abs(custodianDifference), Math.abs(pbDifference)) > 1000 ? "High" : "Medium",
        module: "Position Reconciliation",
        message: `${row.ticker} position mismatch: custodian difference ${custodianDifference.toLocaleString("en-US")}, PB difference ${pbDifference.toLocaleString("en-US")}`,
        owner: row.owner,
        status: row.status === "Resolved" || row.status === "Approved" ? "Cleared" : row.status === "Investigating" ? "Investigating" : "Open",
      });
    }
  });
  (params.cashRecon ?? []).forEach((row) => {
    const custodianDifference = row.internalLedgerCash - row.custodianCash;
    const pbDifference = row.internalLedgerCash - row.primeBrokerCash;
    if (Math.abs(custodianDifference) >= 1 || Math.abs(pbDifference) >= 1) {
      exceptions.push({
        id: `cash-recon-${row.id}`,
        severity: Math.max(Math.abs(custodianDifference), Math.abs(pbDifference)) > 100000 ? "Medium" : "Low",
        module: "Cash Reconciliation",
        message: `${row.currency} cash mismatch: custodian difference ${custodianDifference.toLocaleString("en-US")}, PB difference ${pbDifference.toLocaleString("en-US")}`,
        owner: row.owner,
        status: row.status === "Resolved" || row.status === "Approved" ? "Cleared" : row.status === "Investigating" ? "Investigating" : "Open",
      });
    }
  });
  params.holdings.forEach((h) => {
    const minutesOld = (Date.now() - new Date(h.lastPriceTime).getTime()) / 60000;
    if (minutesOld > 90) exceptions.push({ id: `stale-${h.id}`, severity: "Medium", module: "Pricing", message: `${h.ticker} price is stale against valuation cut`, owner: "Valuations", status: "Open" });
  });
  const debitTotal = trialBalance.reduce((sum, r) => sum + r.debit, 0);
  const creditTotal = trialBalance.reduce((sum, r) => sum + r.credit, 0);
  if (Math.abs(debitTotal - creditTotal) > 1) exceptions.push({ id: "gl-oob", severity: "High", module: "General Ledger", message: "Debit and credit totals are out of balance", owner: "Fund Accounting", status: "Open" });
  const capitalNavDifference = investorCapital - netAssets;
  const capitalNavVariancePct = Math.abs(capitalNavDifference) / Math.max(Math.abs(netAssets), 1);
  if (capitalNavVariancePct > 0.005) {
    exceptions.push({
      id: "capital-nav-tieout",
      severity: capitalNavVariancePct > 0.02 ? "High" : "Medium",
      module: "Investor Capital",
      message: `Investor capital differs from NAV by ${round(capitalNavDifference).toLocaleString("en-US")}`,
      owner: "NAV Control",
      status: "Open",
    });
  }

  return {
    holdings,
    grossAssets,
    liabilities,
    netAssets,
    investorCapital,
    sharesOutstanding,
    navPerShare,
    managementFee,
    performanceFee,
    realizedGains: round(realizedGains),
    unrealizedGains: round(unrealizedGains),
    dividendIncome: round(dividendIncome),
    interestIncome: round(interestIncome + corporateActionIncome),
    fxGainLoss: round(fxGainLoss),
    adminExpenses,
    brokerFees,
    trialBalance,
    gl,
    pnl: [
      { line: "Realized gains", amount: round(realizedGains) },
      { line: "Unrealized gains", amount: round(unrealizedGains) },
      { line: "Dividend income", amount: round(dividendIncome) },
      { line: "Interest income", amount: round(interestIncome) },
      { line: "Corporate action income", amount: round(corporateActionIncome) },
      { line: "Backend posted GL adjustments", amount: round(manualNavAdjustments) },
      { line: "FX gains/losses", amount: round(fxGainLoss) },
      { line: "Management fees", amount: -managementFee },
      { line: "Performance fees", amount: -performanceFee },
      { line: "Admin expenses", amount: -adminExpenses },
      { line: "Broker fees", amount: -brokerFees },
    ],
    balanceSheet: [
      { section: "Assets", line: "Investments at fair value", amount: round(Math.max(adjustedPortfolioMv, 0)) },
      { section: "Assets", line: "Investor capital cash", amount: round(Math.max(netInvestorCash, 0)) },
      { section: "Assets", line: "Derivative receivable and collateral", amount: round(Math.max(derivativeMtm, 0) + derivativeCollateral) },
      { section: "Assets", line: "Income receivable", amount: round(dividendIncome + interestIncome) },
      { section: "Assets", line: "Corporate action receivable", amount: round(corporateActionIncome) },
      { section: "Liabilities", line: "Fee accruals and expenses payable", amount: round(liabilities) },
      { section: "Capital", line: "Partners capital", amount: round(netAssets) },
    ],
    exceptions,
    waterfall: [
      { name: "Opening NAV", value: investorCapital },
      { name: "Subscriptions", value: subscriptions },
      { name: "Redemptions", value: -redemptions },
      { name: "Realized gains", value: round(realizedGains) },
      { name: "Unrealized gains", value: round(unrealizedGains) },
      { name: "Posted GL adjustments", value: round(manualNavAdjustments) },
      { name: "Income", value: round(dividendIncome + interestIncome + fxGainLoss) },
      { name: "Expenses", value: -round(adminExpenses + brokerFees) },
      { name: "Fees", value: -round(managementFee + performanceFee) },
      { name: "Closing NAV", value: netAssets },
    ],
    exposures: Object.entries(holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.strategy] = (acc[h.strategy] ?? 0) + Math.abs(h.marketValue);
      return acc;
    }, {})).map(([name, value]) => ({ name, value: round(value) })),
  };
}
