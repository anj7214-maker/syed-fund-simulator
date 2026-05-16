import { Accrual, BreakItem, CapitalActivity, CashReconRow, CorporateAction, Derivative, ExceptionItem, FundSetup, FxRate, Holding, Investor, PositionReconRow, SecurityMaster, Trade, UploadBatch } from "../types";

export const sampleHoldings: Holding[] = [
  { id: "h1", isin: "US5949181045", ticker: "MSFT", name: "Microsoft Corp", assetType: "Equity", strategy: "Long/Short Equity", currency: "USD", quantity: 52000, costPrice: 388.4, marketPrice: 421.8, fxRate: 1, counterparty: "Goldman Sachs", settlementDate: "2026-05-11", priceSource: "Bloomberg BGN", priorPrice: 417.2, lastPriceTime: "2026-05-09T15:58:00" },
  { id: "h2", isin: "US0378331005", ticker: "AAPL", name: "Apple Inc", assetType: "Equity", strategy: "Event Driven", currency: "USD", quantity: -41000, costPrice: 192.1, marketPrice: 187.35, fxRate: 1, counterparty: "Morgan Stanley", settlementDate: "2026-05-11", priceSource: "NASDAQ", priorPrice: 189.5, lastPriceTime: "2026-05-09T15:58:00" },
  { id: "h3", isin: "XS2180007549", ticker: "DBR 1.7 2032", name: "Germany Bund 2032", assetType: "Bond", strategy: "Credit Relative Value", currency: "EUR", quantity: 18000000, costPrice: 96.12, marketPrice: 98.44, fxRate: 1.08, counterparty: "BNP Paribas", settlementDate: "2026-05-13", priceSource: "ICE", priorPrice: 98.12, lastPriceTime: "2026-05-09T15:30:00" },
  { id: "h4", isin: "GB00B03MLX29", ticker: "VOD LN", name: "Vodafone Group", assetType: "CFD", strategy: "Long/Short Equity", currency: "GBP", quantity: 760000, costPrice: 0.72, marketPrice: 0.79, fxRate: 1.26, counterparty: "UBS PB", settlementDate: "2026-05-12", priceSource: "LSE", priorPrice: 0.78, lastPriceTime: "2026-05-09T16:00:00" },
  { id: "h5", isin: "JP3902900004", ticker: "MUFG JT", name: "Mitsubishi UFJ", assetType: "Equity", strategy: "Macro", currency: "JPY", quantity: 1250000, costPrice: 1360, marketPrice: 1452, fxRate: 0.0065, counterparty: "Nomura", settlementDate: "2026-05-14", priceSource: "TSE", priorPrice: 1420, lastPriceTime: "2026-05-09T07:10:00" },
  { id: "h6", isin: "US4642872000", ticker: "IWM", name: "iShares Russell 2000 ETF", assetType: "ETF", strategy: "Index Hedge", currency: "USD", quantity: -88000, costPrice: 209.8, marketPrice: 203.4, fxRate: 1, counterparty: "JP Morgan", settlementDate: "2026-05-11", priceSource: "NYSE Arca", priorPrice: 205.1, lastPriceTime: "2026-05-09T15:59:00" },
  { id: "h7", isin: "FUT-NQ-JUN26", ticker: "NQM6", name: "Nasdaq 100 Future Jun26", assetType: "Future", strategy: "Macro", currency: "USD", quantity: 74, costPrice: 19880, marketPrice: 20125, fxRate: 20, counterparty: "CME Clearing", settlementDate: "2026-06-19", priceSource: "CME", priorPrice: 19970, lastPriceTime: "2026-05-09T15:59:00" },
  { id: "h8", isin: "OPT-SPX-5200P", ticker: "SPX 5200P", name: "SPX Put Jun26", assetType: "Option", strategy: "Tail Hedge", currency: "USD", quantity: 380, costPrice: 48.2, marketPrice: 55.4, fxRate: 100, counterparty: "CBOE OCC", settlementDate: "2026-06-20", priceSource: "CBOE", priorPrice: 50.1, lastPriceTime: "2026-05-09T15:55:00" },
  { id: "h9", isin: "CMD-XAU", ticker: "XAU", name: "Gold Spot Synthetic", assetType: "Commodity", strategy: "Inflation Hedge", currency: "USD", quantity: 9200, costPrice: 2310, marketPrice: 2388, fxRate: 1, counterparty: "HSBC", settlementDate: "2026-05-10", priceSource: "LBMA", priorPrice: 2362, lastPriceTime: "2026-05-09T15:45:00" },
  { id: "h10", isin: "FXF-EURUSD", ticker: "EURUSD FWD", name: "EUR/USD 3M Forward", assetType: "FX Forward", strategy: "Currency Overlay", currency: "EUR", quantity: -24000000, costPrice: 1.074, marketPrice: 1.082, fxRate: 1, counterparty: "Deutsche Bank", settlementDate: "2026-08-12", priceSource: "Reuters", priorPrice: 1.079, lastPriceTime: "2026-05-09T15:50:00" }
];

export const sampleFundSetup: FundSetup = {
  fundName: "SYED Multi-Strategy Master Fund",
  fundStructure: "Master-Feeder",
  fundType: "Open-ended Cayman exempted company",
  baseCurrency: "USD",
  navFrequency: "Daily estimate / Monthly official",
  inceptionDate: "2024-01-02",
  fiscalYearEnd: "31-Dec",
  primeBroker: "Goldman Sachs / JP Morgan",
  custodian: "Northern Trust",
  administrator: "SYED Fund Administration Services",
  auditor: "Deloitte",
  legalEntity: "Syed Fund Simulator Ltd.",
  redemptionTerms: "Monthly, 30 calendar days notice",
  subscriptionTerms: "Monthly, cleared funds T-2",
  lockupTerms: "12-month soft lock-up, 2% early redemption fee",
  valuationCutoff: "17:00 New York",
  shareClasses: "Class A Founder, Class B Institutional, Class C Series",
  managementFeePct: 0.015,
  performanceFeePct: 0.2,
  hurdleRate: 0.05,
  highWaterMarkEnabled: true,
  workflowStatus: "Draft",
};

export const sampleSecurityMaster: SecurityMaster[] = [
  { id: "sec1", isin: "US5949181045", bloombergTicker: "MSFT US Equity", assetType: "Equity", description: "Microsoft Corp", country: "United States", exchange: "NASDAQ", currency: "USD", sector: "Technology", industry: "Software", pricingSource: "Bloomberg BGN", valuationHierarchy: "Level 1", liquidityClassification: "Daily", settlementType: "Physical", stalePricing: false, toleranceBreach: false },
  { id: "sec2", isin: "XS2180007549", bloombergTicker: "DBR 1.7 2032 Corp", assetType: "Bond", description: "Germany Bund 2032", country: "Germany", exchange: "EuroMTS", currency: "EUR", sector: "Sovereign", industry: "Government Bonds", pricingSource: "ICE", valuationHierarchy: "Level 2", liquidityClassification: "Daily", couponRate: 1.7, maturityDate: "2032-08-15", settlementType: "Physical", stalePricing: false, toleranceBreach: false },
  { id: "sec3", isin: "OPT-SPX-5200P", bloombergTicker: "SPX US 06/20/26 P5200", assetType: "Option", description: "SPX Put Jun26", country: "United States", exchange: "CBOE", currency: "USD", sector: "Index", industry: "Equity Derivatives", pricingSource: "CBOE Surface", valuationHierarchy: "Level 2", liquidityClassification: "Daily", contractMultiplier: 100, underlyingSecurity: "SPX Index", optionType: "Put", strike: 5200, expiry: "2026-06-20", settlementType: "Cash", stalePricing: true, toleranceBreach: true },
  { id: "sec4", isin: "FXF-EURUSD", bloombergTicker: "EURUSD 3M FWD", assetType: "FX Forward", description: "EUR/USD 3M Forward", country: "Multi", exchange: "OTC", currency: "EUR", sector: "Currency", industry: "FX Forward", pricingSource: "Reuters", valuationHierarchy: "Level 2", liquidityClassification: "Daily", settlementType: "Cash", stalePricing: false, toleranceBreach: false },
];

export const sampleTrades: Trade[] = [
  { id: "TRD-10482", tradeDate: "2026-05-09", settleDate: "2026-05-13", broker: "Goldman Sachs", side: "Buy", ticker: "MSFT", quantity: 8000, price: 421.8, fees: 4200, status: "Booked" },
  { id: "TRD-10483", tradeDate: "2026-05-09", settleDate: "2026-05-11", broker: "JP Morgan", side: "Sell", ticker: "IWM", quantity: 22000, price: 203.4, fees: 2600, status: "Matched" },
  { id: "TRD-10484", tradeDate: "2026-05-08", settleDate: "2026-05-14", broker: "Nomura", side: "Buy", ticker: "MUFG JT", quantity: 300000, price: 1452, fees: 5100, status: "Pending" },
  { id: "TRD-10485", tradeDate: "2026-05-08", settleDate: "2026-05-12", broker: "Barclays", side: "Sell", ticker: "AAPL", quantity: 9000, price: 187.35, fees: 1900, status: "Failed" }
];

export const sampleFx: FxRate[] = [
  { pair: "EUR/USD", base: "EUR", quote: "USD", rate: 1.08, priorRate: 1.074, source: "WM/Reuters" },
  { pair: "GBP/USD", base: "GBP", quote: "USD", rate: 1.26, priorRate: 1.254, source: "WM/Reuters" },
  { pair: "JPY/USD", base: "JPY", quote: "USD", rate: 0.0065, priorRate: 0.0064, source: "WM/Reuters" },
  { pair: "INR/USD", base: "INR", quote: "USD", rate: 0.012, priorRate: 0.0121, source: "RBI/Reuters" },
  { pair: "CHF/USD", base: "CHF", quote: "USD", rate: 1.11, priorRate: 1.105, source: "WM/Reuters" },
  { pair: "SGD/USD", base: "SGD", quote: "USD", rate: 0.74, priorRate: 0.739, source: "WM/Reuters" },
  { pair: "CAD/USD", base: "CAD", quote: "USD", rate: 0.73, priorRate: 0.728, source: "WM/Reuters" },
  { pair: "AUD/USD", base: "AUD", quote: "USD", rate: 0.66, priorRate: 0.658, source: "WM/Reuters" },
  { pair: "NZD/USD", base: "NZD", quote: "USD", rate: 0.61, priorRate: 0.608, source: "WM/Reuters" },
  { pair: "HKD/USD", base: "HKD", quote: "USD", rate: 0.128, priorRate: 0.128, source: "HKMA/Reuters" },
  { pair: "CNH/USD", base: "CNH", quote: "USD", rate: 0.138, priorRate: 0.137, source: "CFETS/Reuters" },
  { pair: "SEK/USD", base: "SEK", quote: "USD", rate: 0.095, priorRate: 0.094, source: "WM/Reuters" },
  { pair: "NOK/USD", base: "NOK", quote: "USD", rate: 0.092, priorRate: 0.091, source: "WM/Reuters" },
  { pair: "DKK/USD", base: "DKK", quote: "USD", rate: 0.145, priorRate: 0.144, source: "WM/Reuters" },
  { pair: "ZAR/USD", base: "ZAR", quote: "USD", rate: 0.054, priorRate: 0.053, source: "JSE/Reuters" },
  { pair: "BRL/USD", base: "BRL", quote: "USD", rate: 0.195, priorRate: 0.193, source: "B3/Reuters" },
  { pair: "MXN/USD", base: "MXN", quote: "USD", rate: 0.058, priorRate: 0.057, source: "Banxico/Reuters" },
  { pair: "KRW/USD", base: "KRW", quote: "USD", rate: 0.00074, priorRate: 0.00073, source: "KRX/Reuters" }
];

export const sampleInvestors: Investor[] = [
  { id: "i1", name: "Al Noor Sovereign Fund", className: "Class A Founder", capital: 41200000, shares: 389000, hwm: 108.4, equalizationCredit: 320000, hurdleRate: 0.05 },
  { id: "i2", name: "Blue Harbor Endowment", className: "Class B Institutional", capital: 28600000, shares: 276000, hwm: 104.2, equalizationCredit: 110000, hurdleRate: 0.04 },
  { id: "i3", name: "Crescent Family Office", className: "Class C Series 2026", capital: 18400000, shares: 181000, hwm: 101.0, equalizationCredit: 86000, hurdleRate: 0.06 },
  { id: "i4", name: "Northern Pension Trust", className: "Class B Institutional", capital: 33750000, shares: 326500, hwm: 105.7, equalizationCredit: 205000, hurdleRate: 0.04 }
];

export const sampleActivities: CapitalActivity[] = [
  { id: "cap1", investorId: "i1", date: "2026-05-01", type: "Subscription", amount: 2500000, status: "Approved" },
  { id: "cap2", investorId: "i3", date: "2026-05-05", type: "Redemption", amount: 850000, status: "Pending" },
  { id: "cap3", investorId: "i4", date: "2026-05-08", type: "Subscription", amount: 1200000, status: "Approved" }
];

export const sampleAccruals: Accrual[] = [
  { id: "a1", kind: "Dividend", ticker: "MSFT", exDate: "2026-05-15", payDate: "2026-06-12", sharesEligible: 52000, withholdingTax: 0.15, netDividend: 31200 },
  { id: "a2", kind: "Dividend", ticker: "VOD LN", exDate: "2026-05-20", payDate: "2026-06-28", sharesEligible: 760000, withholdingTax: 0.1, netDividend: 41800 },
  { id: "a3", kind: "Coupon", ticker: "DBR 1.7 2032", couponPct: 1.7, accrualDays: 41, accruedInterest: 34893, cleanPrice: 98.44, dirtyPrice: 98.63 }
];

export const sampleDerivatives: Derivative[] = [
  { id: "d1", type: "IRS", reference: "USD SOFR 5Y Pay Fixed", notional: 65000000, mtm: 840000, accruedInterest: 128000, collateral: 760000, counterparty: "Citibank" },
  { id: "d2", type: "CDS", reference: "CDX HY S43", notional: 42000000, mtm: -390000, accruedInterest: 94000, collateral: 450000, counterparty: "Barclays" },
  { id: "d3", type: "TRS", reference: "MSCI World Basket", notional: 31000000, mtm: 520000, accruedInterest: 58000, collateral: 610000, counterparty: "Morgan Stanley" }
];

export const sampleCorporateActions: CorporateAction[] = [
  { id: "ca1", eventType: "Dividend", security: "MSFT", exDate: "2026-05-15", recordDate: "2026-05-16", payDate: "2026-06-12", eligibleQuantity: 52000, grossAmount: 36705, withholdingTax: 5505, netReceivable: 31200, status: "Validated", postingStatus: "Accrued" },
  { id: "ca2", eventType: "Coupon", security: "DBR 1.7 2032", exDate: "2026-05-09", recordDate: "2026-05-09", payDate: "2026-08-15", eligibleQuantity: 18000000, grossAmount: 34893, withholdingTax: 0, netReceivable: 34893, status: "Booked", postingStatus: "Posted" },
  { id: "ca3", eventType: "Stock Split", security: "MUFG JT", exDate: "2026-05-22", recordDate: "2026-05-23", payDate: "2026-05-24", eligibleQuantity: 1250000, grossAmount: 0, withholdingTax: 0, netReceivable: 0, status: "Announced", postingStatus: "Pending" },
  { id: "ca4", eventType: "Rights Issue", security: "VOD LN", exDate: "2026-05-20", recordDate: "2026-05-21", payDate: "2026-06-28", eligibleQuantity: 760000, grossAmount: 46444, withholdingTax: 4644, netReceivable: 41800, status: "Validated", postingStatus: "Accrued" },
];

export const sampleCashRecon: CashReconRow[] = [
  { id: "cash1", currency: "USD", internalLedgerCash: 18420000, custodianCash: 18420000, primeBrokerCash: 18418000, breakReason: "PB fee sweep posted after cutoff", owner: "Treasury", status: "Investigating" },
  { id: "cash2", currency: "EUR", internalLedgerCash: 6125000, custodianCash: 6025000, primeBrokerCash: 6125000, breakReason: "DB settlement timing difference", owner: "Ops L2", status: "Open" },
  { id: "cash3", currency: "JPY", internalLedgerCash: 940000000, custodianCash: 940000000, primeBrokerCash: 940000000, breakReason: "Matched", owner: "Treasury", status: "Approved" },
];

export const samplePositionRecon: PositionReconRow[] = [
  { id: "pos1", ticker: "AAPL", internalPosition: -41000, custodianPosition: -32000, pbPosition: -41000, settlementStatus: "Failed Trade", breakReason: "Short sale failed at custodian", owner: "Ops L2", status: "Investigating" },
  { id: "pos2", ticker: "MSFT", internalPosition: 52000, custodianPosition: 52000, pbPosition: 52000, settlementStatus: "Settled", breakReason: "Matched", owner: "Position Control", status: "Approved" },
  { id: "pos3", ticker: "MUFG JT", internalPosition: 1250000, custodianPosition: 950000, pbPosition: 1250000, settlementStatus: "Pending Settlement", breakReason: "T+2 Asia settlement pending", owner: "Asia Ops", status: "Open" },
];

export const sampleBreaks: BreakItem[] = [
  { id: "BRK-1001", breakType: "Position", severity: "High", aging: 2, owner: "Ops L2", navImpact: 1686150, rootCause: "AAPL failed trade not reflected by custodian", status: "Investigating", resolutionNotes: "Broker locate confirmation requested", escalationLevel: "L2", comments: ["Prime broker matched internal books", "Custodian awaiting fail repair"], slaHours: 24 },
  { id: "BRK-1002", breakType: "Cash", severity: "Medium", aging: 1, owner: "Treasury", navImpact: 100000, rootCause: "EUR cash settlement timing difference", status: "Open", resolutionNotes: "Expected to clear next bank file", escalationLevel: "L1", comments: ["Cash file imported after valuation cut"], slaHours: 12 },
  { id: "BRK-1003", breakType: "Pricing", severity: "Low", aging: 0, owner: "Valuations", navImpact: 21850, rootCause: "SPX option surface stale by 5 minutes", status: "Open", resolutionNotes: "Request independent broker mark", escalationLevel: "L1", comments: ["Within tolerance but flagged"], slaHours: 8 },
  { id: "BRK-1004", breakType: "Corporate Action", severity: "Medium", aging: 3, owner: "Income", navImpact: 41800, rootCause: "Vodafone dividend tax rate pending validation", status: "Escalated", resolutionNotes: "Tax team reviewing treaty rate", escalationLevel: "L3", comments: ["Accrued at conservative withholding"], slaHours: 48 },
];

export const sampleUploads: UploadBatch[] = [
  {
    id: "UPL-9001",
    module: "pricing",
    sourceType: "Pricing vendor file",
    fileName: "nav_prices_2026-05-09.csv",
    uploadedBy: "Valuations",
    timestamp: "2026-05-09T16:05:00",
    processingStatus: "Partially Accepted",
    validationStatus: "Warnings",
    rowCount: 124,
    rejectedRows: 2,
    duplicateRecords: 1,
    warnings: 4,
    issues: [
      { id: "VAL-1", severity: "Warning", row: 44, field: "price", message: "SPX option price exceeds prior-day tolerance", recommendedAction: "Route to price challenge workflow" },
      { id: "VAL-2", severity: "Info", row: 87, field: "source", message: "Vendor source switched from BGN to evaluated price", recommendedAction: "Review hierarchy before posting" },
    ],
  },
];

export const baseExceptions: ExceptionItem[] = [
  { id: "ex1", severity: "High", module: "Position Reconciliation", message: "AAPL short quantity differs from prime broker by 9,000 shares", owner: "Ops L2", status: "Investigating" },
  { id: "ex2", severity: "Medium", module: "Cash Reconciliation", message: "EUR cash timing difference pending DB settlement", owner: "Treasury", status: "Open" },
  { id: "ex3", severity: "Low", module: "Pricing", message: "CBOE option surface updated 5 minutes after valuation cut", owner: "Valuations", status: "Open" }
];
