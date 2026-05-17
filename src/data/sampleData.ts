import { Accrual, BreakItem, CapitalActivity, CashReconRow, CorporateAction, Currency, Derivative, ExceptionItem, FundSetup, FxRate, Holding, Investor, PositionReconRow, SecurityMaster, Trade, UploadBatch } from "../types";

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

const extendedHoldings: Holding[] = [
  { id: "h11", isin: "US88160R1014", ticker: "TSLA", name: "Tesla Inc", assetType: "Equity", strategy: "Long/Short Equity", currency: "USD", quantity: 34000, costPrice: 172.4, marketPrice: 181.9, fxRate: 1, counterparty: "Morgan Stanley", settlementDate: "2026-05-11", priceSource: "NASDAQ", priorPrice: 178.2, lastPriceTime: "2026-05-09T15:59:00" },
  { id: "h12", isin: "US0231351067", ticker: "AMZN", name: "Amazon.com Inc", assetType: "Equity", strategy: "Event Driven", currency: "USD", quantity: 28500, costPrice: 178.6, marketPrice: 185.2, fxRate: 1, counterparty: "Goldman Sachs", settlementDate: "2026-05-11", priceSource: "Bloomberg BGN", priorPrice: 183.7, lastPriceTime: "2026-05-09T15:58:00" },
  { id: "h13", isin: "US02079K3059", ticker: "GOOGL", name: "Alphabet Inc", assetType: "Equity", strategy: "Quality Growth", currency: "USD", quantity: 41000, costPrice: 151.8, marketPrice: 158.4, fxRate: 1, counterparty: "JP Morgan", settlementDate: "2026-05-11", priceSource: "NASDAQ", priorPrice: 157.1, lastPriceTime: "2026-05-09T15:59:00" },
  { id: "h14", isin: "US67066G1040", ticker: "NVDA", name: "NVIDIA Corp", assetType: "Equity", strategy: "Technology Momentum", currency: "USD", quantity: 22600, costPrice: 905.2, marketPrice: 941.6, fxRate: 1, counterparty: "UBS PB", settlementDate: "2026-05-11", priceSource: "NASDAQ", priorPrice: 932.4, lastPriceTime: "2026-05-09T15:59:00" },
  { id: "h15", isin: "US46625H1005", ticker: "JPM", name: "JPMorgan Chase", assetType: "Equity", strategy: "Financials Relative Value", currency: "USD", quantity: 63000, costPrice: 201.4, marketPrice: 207.8, fxRate: 1, counterparty: "JP Morgan", settlementDate: "2026-05-11", priceSource: "NYSE", priorPrice: 206.1, lastPriceTime: "2026-05-09T15:58:00" },
  { id: "h16", isin: "US91282CHT18", ticker: "T 4.25 2034", name: "US Treasury 4.25% 2034", assetType: "Bond", strategy: "Rates", currency: "USD", quantity: 24000000, costPrice: 99.1, marketPrice: 100.34, fxRate: 1, counterparty: "Citibank", settlementDate: "2026-05-12", priceSource: "ICE", priorPrice: 100.12, lastPriceTime: "2026-05-09T15:25:00" },
  { id: "h17", isin: "FR001400QMF9", ticker: "FRTR 3 2034", name: "France OAT 3% 2034", assetType: "Bond", strategy: "Rates", currency: "EUR", quantity: 14500000, costPrice: 97.9, marketPrice: 98.35, fxRate: 1.08, counterparty: "BNP Paribas", settlementDate: "2026-05-13", priceSource: "ICE", priorPrice: 98.02, lastPriceTime: "2026-05-09T15:26:00" },
  { id: "h18", isin: "GB00BMBL1F74", ticker: "UKT 0.875 2033", name: "UK Gilt 0.875% 2033", assetType: "Bond", strategy: "Rates", currency: "GBP", quantity: 11800000, costPrice: 84.2, marketPrice: 85.65, fxRate: 1.26, counterparty: "Barclays", settlementDate: "2026-05-13", priceSource: "Tradeweb", priorPrice: 85.31, lastPriceTime: "2026-05-09T15:27:00" },
  { id: "h19", isin: "CH0012032048", ticker: "ROG SW", name: "Roche Holding", assetType: "Equity", strategy: "Defensive Equity", currency: "CHF", quantity: 24000, costPrice: 247.3, marketPrice: 253.6, fxRate: 1.11, counterparty: "Credit Suisse", settlementDate: "2026-05-12", priceSource: "SIX", priorPrice: 252.4, lastPriceTime: "2026-05-09T15:50:00" },
  { id: "h20", isin: "SG1M31001969", ticker: "DBS SP", name: "DBS Group Holdings", assetType: "Equity", strategy: "Asia Financials", currency: "SGD", quantity: 190000, costPrice: 42.1, marketPrice: 43.3, fxRate: 0.74, counterparty: "DBS PB", settlementDate: "2026-05-14", priceSource: "SGX", priorPrice: 42.9, lastPriceTime: "2026-05-09T07:20:00" },
  { id: "h21", isin: "INE002A01018", ticker: "RELIANCE IN", name: "Reliance Industries", assetType: "Equity", strategy: "Emerging Markets", currency: "INR", quantity: 510000, costPrice: 2820, marketPrice: 2914, fxRate: 0.012, counterparty: "HSBC", settlementDate: "2026-05-14", priceSource: "NSE", priorPrice: 2891, lastPriceTime: "2026-05-09T07:05:00" },
  { id: "h22", isin: "HK0000069689", ticker: "700 HK", name: "Tencent Holdings", assetType: "Equity", strategy: "Asia Technology", currency: "HKD", quantity: 160000, costPrice: 382.4, marketPrice: 397.8, fxRate: 0.128, counterparty: "HSBC", settlementDate: "2026-05-13", priceSource: "HKEX", priorPrice: 392.6, lastPriceTime: "2026-05-09T07:00:00" },
  { id: "h23", isin: "AU000000BHP4", ticker: "BHP AU", name: "BHP Group", assetType: "Equity", strategy: "Commodities", currency: "AUD", quantity: 285000, costPrice: 42.2, marketPrice: 43.9, fxRate: 0.66, counterparty: "Macquarie", settlementDate: "2026-05-14", priceSource: "ASX", priorPrice: 43.5, lastPriceTime: "2026-05-09T06:55:00" },
  { id: "h24", isin: "CA0641491075", ticker: "BNS CN", name: "Bank of Nova Scotia", assetType: "Equity", strategy: "Financials Relative Value", currency: "CAD", quantity: -175000, costPrice: 66.7, marketPrice: 64.9, fxRate: 0.73, counterparty: "RBC", settlementDate: "2026-05-12", priceSource: "TSX", priorPrice: 65.3, lastPriceTime: "2026-05-09T15:57:00" },
  { id: "h25", isin: "BRPETRACNPR6", ticker: "PETR4 BZ", name: "Petrobras PN", assetType: "Equity", strategy: "Energy", currency: "BRL", quantity: 620000, costPrice: 37.2, marketPrice: 38.6, fxRate: 0.195, counterparty: "Itau", settlementDate: "2026-05-14", priceSource: "B3", priorPrice: 38.1, lastPriceTime: "2026-05-09T15:40:00" },
  { id: "h26", isin: "MXP370711014", ticker: "WALMEX*", name: "Walmart de Mexico", assetType: "Equity", strategy: "Consumer Staples", currency: "MXN", quantity: 740000, costPrice: 61.8, marketPrice: 63.4, fxRate: 0.058, counterparty: "Santander", settlementDate: "2026-05-14", priceSource: "BMV", priorPrice: 62.7, lastPriceTime: "2026-05-09T15:38:00" },
  { id: "h27", isin: "KR7005930003", ticker: "005930 KS", name: "Samsung Electronics", assetType: "Equity", strategy: "Asia Technology", currency: "KRW", quantity: 145000, costPrice: 72400, marketPrice: 73800, fxRate: 0.00074, counterparty: "Mirae", settlementDate: "2026-05-14", priceSource: "KRX", priorPrice: 73100, lastPriceTime: "2026-05-09T06:45:00" },
  { id: "h28", isin: "FUT-CL-JUN26", ticker: "CLM6", name: "WTI Crude Future Jun26", assetType: "Future", strategy: "Commodities", currency: "USD", quantity: 155, costPrice: 76.2, marketPrice: 78.1, fxRate: 1000, counterparty: "NYMEX Clearing", settlementDate: "2026-06-20", priceSource: "CME", priorPrice: 77.4, lastPriceTime: "2026-05-09T15:58:00" },
  { id: "h29", isin: "OPT-NDX-19000C", ticker: "NDX 19000C", name: "NDX Call Jul26", assetType: "Option", strategy: "Technology Momentum", currency: "USD", quantity: -210, costPrice: 620, marketPrice: 588, fxRate: 100, counterparty: "CBOE OCC", settlementDate: "2026-07-17", priceSource: "CBOE Surface", priorPrice: 601, lastPriceTime: "2026-05-09T15:53:00" },
  { id: "h30", isin: "FXF-GBPUSD", ticker: "GBPUSD FWD", name: "GBP/USD 6M Forward", assetType: "FX Forward", strategy: "Currency Overlay", currency: "GBP", quantity: 18000000, costPrice: 1.251, marketPrice: 1.263, fxRate: 1, counterparty: "Deutsche Bank", settlementDate: "2026-11-12", priceSource: "Reuters", priorPrice: 1.258, lastPriceTime: "2026-05-09T15:52:00" },
];

sampleHoldings.push(...extendedHoldings);

sampleSecurityMaster.push(...sampleHoldings.slice(4).map((h, index): SecurityMaster => ({
  id: `sec-ext-${index + 1}`,
  isin: h.isin,
  bloombergTicker: `${h.ticker} ${h.currency === "USD" ? "US" : h.currency} ${h.assetType}`,
  assetType: h.assetType,
  description: h.name,
  country: h.currency === "JPY" ? "Japan" : h.currency === "GBP" ? "United Kingdom" : h.currency === "EUR" ? "Eurozone" : h.currency === "INR" ? "India" : h.currency === "HKD" ? "Hong Kong" : h.currency === "AUD" ? "Australia" : h.currency === "CAD" ? "Canada" : h.currency === "BRL" ? "Brazil" : h.currency === "MXN" ? "Mexico" : h.currency === "KRW" ? "South Korea" : "United States",
  exchange: h.assetType === "FX Forward" || h.assetType === "Swap" ? "OTC" : h.assetType === "Future" ? "Listed Derivatives" : h.assetType === "Option" ? "Options Exchange" : "Primary Exchange",
  currency: h.currency,
  sector: h.strategy,
  industry: h.assetType === "Bond" ? "Fixed Income" : h.assetType === "Future" || h.assetType === "Commodity" ? "Commodities" : h.assetType === "FX Forward" ? "Currency" : "Listed Securities",
  pricingSource: h.priceSource,
  valuationHierarchy: h.assetType === "Equity" || h.assetType === "ETF" ? "Level 1" : h.assetType === "Option" || h.assetType === "FX Forward" ? "Level 2" : "Level 2",
  liquidityClassification: h.assetType === "Bond" ? "Weekly" : h.assetType === "Option" ? "Daily" : "Daily",
  couponRate: h.assetType === "Bond" ? Number((1.2 + (index % 5) * 0.55).toFixed(2)) : undefined,
  maturityDate: h.assetType === "Bond" ? `203${index % 8}-08-15` : undefined,
  contractMultiplier: h.assetType === "Option" ? 100 : h.assetType === "Future" ? h.fxRate : undefined,
  underlyingSecurity: h.assetType === "Option" ? h.ticker.split(" ")[0] : undefined,
  optionType: h.assetType === "Option" ? (h.ticker.includes("P") ? "Put" : "Call") : undefined,
  strike: h.assetType === "Option" ? Number(h.ticker.match(/\d+/)?.[0] ?? 100) : undefined,
  expiry: h.assetType === "Option" ? "2026-07-17" : undefined,
  settlementType: h.assetType === "Option" || h.assetType === "FX Forward" ? "Cash" : "Physical",
  stalePricing: index % 11 === 0,
  toleranceBreach: index % 13 === 0,
})));

sampleTrades.push(...sampleHoldings.slice(10).map((h, index): Trade => ({
  id: `TRD-${10500 + index}`,
  tradeDate: `2026-05-${String(6 + (index % 4)).padStart(2, "0")}`,
  settleDate: `2026-05-${String(11 + (index % 5)).padStart(2, "0")}`,
  broker: ["Goldman Sachs", "JP Morgan", "Morgan Stanley", "UBS PB", "Barclays", "BNP Paribas", "HSBC", "Nomura"][index % 8],
  side: index % 3 === 0 ? "Sell" : "Buy",
  ticker: h.ticker,
  quantity: Math.max(1, Math.round(Math.abs(h.quantity) * (0.04 + (index % 5) * 0.01))),
  price: h.marketPrice,
  fees: 950 + index * 275,
  status: index % 9 === 0 ? "Failed" : index % 5 === 0 ? "Pending" : index % 2 === 0 ? "Matched" : "Booked",
})));

const investorNames = [
  "Atlas University Endowment", "Riverview Pension Scheme", "Amanah Insurance Pool", "Cedar Grove Foundation", "Falcon Global Macro Fund", "Harbor View Trust",
  "Meridian Sovereign Reserve", "Orchid Family Office", "Pacific Teachers Pension", "Qatar Strategic Holdings", "Redwood Capital Partners", "Sapphire Health Foundation",
  "Taurus Multi-Family Office", "Union Retirement Trust", "Vista Charitable Trust", "Westbridge Institutional Fund", "Yamato Pension Reserve", "Zenith Alternatives Platform",
];
sampleInvestors.push(...investorNames.map((name, index): Investor => ({
  id: `i${index + 5}`,
  name,
  className: index % 3 === 0 ? "Class A Founder" : index % 3 === 1 ? "Class B Institutional" : "Class C Series 2026",
  capital: 8_500_000 + index * 1_725_000,
  shares: 82_000 + index * 13_400,
  hwm: Number((101.2 + index * 0.37).toFixed(2)),
  equalizationCredit: 45_000 + index * 18_500,
  hurdleRate: index % 2 === 0 ? 0.05 : 0.04,
})));

sampleActivities.push(...sampleInvestors.slice(4).map((investor, index): CapitalActivity => ({
  id: `cap${index + 4}`,
  investorId: investor.id,
  date: `2026-05-${String(1 + (index % 9)).padStart(2, "0")}`,
  type: index % 4 === 0 ? "Redemption" : "Subscription",
  amount: 250_000 + index * 125_000,
  status: index % 7 === 0 ? "Pending" : index % 11 === 0 ? "Rejected" : "Approved",
})));

sampleAccruals.push(...sampleHoldings.slice(10).map((h, index): Accrual => (index % 3 === 0 ? {
  id: `acc-div-${index}`,
  kind: "Dividend",
  ticker: h.ticker,
  exDate: `2026-05-${String(12 + (index % 10)).padStart(2, "0")}`,
  payDate: `2026-06-${String(5 + (index % 18)).padStart(2, "0")}`,
  sharesEligible: Math.abs(h.quantity),
  withholdingTax: index % 2 === 0 ? 0.15 : 0.1,
  netDividend: Math.round(Math.abs(h.quantity) * (0.08 + index * 0.01)),
} : {
  id: `acc-cpn-${index}`,
  kind: "Coupon",
  ticker: h.ticker,
  couponPct: Number((1.5 + (index % 6) * 0.45).toFixed(2)),
  accrualDays: 18 + (index % 44),
  accruedInterest: 12_000 + index * 2_850,
  cleanPrice: Number((96.5 + (index % 8) * 0.41).toFixed(2)),
  dirtyPrice: Number((96.8 + (index % 8) * 0.43).toFixed(2)),
})));

sampleDerivatives.push(...Array.from({ length: 17 }, (_, index): Derivative => ({
  id: `d${index + 4}`,
  type: (["IRS", "CDS", "FX Swap", "TRS", "Future"] as const)[index % 5],
  reference: ["EUR Euribor 7Y Receive Fixed", "iTraxx XO S45", "USDJPY 6M Swap", "S&P 500 Basket TRS", "US 10Y Note Future"][index % 5],
  notional: 18_000_000 + index * 4_250_000,
  mtm: (index % 2 === 0 ? 1 : -1) * (120_000 + index * 48_000),
  accruedInterest: 22_000 + index * 7_500,
  collateral: 160_000 + index * 52_000,
  counterparty: ["Citibank", "Barclays", "Morgan Stanley", "Deutsche Bank", "Goldman Sachs", "HSBC"][index % 6],
})));

sampleCorporateActions.push(...sampleHoldings.slice(8).map((h, index): CorporateAction => {
  const eventType = (["Dividend", "Coupon", "Stock Split", "Rights Issue", "Merger", "Spin-off"] as const)[index % 6];
  const grossAmount = eventType === "Stock Split" ? 0 : Math.round(Math.abs(h.quantity) * (0.04 + index * 0.008));
  const withholdingTax = eventType === "Dividend" || eventType === "Rights Issue" ? Math.round(grossAmount * 0.15) : 0;
  return {
    id: `ca${index + 5}`,
    eventType,
    security: h.ticker,
    exDate: `2026-05-${String(10 + (index % 15)).padStart(2, "0")}`,
    recordDate: `2026-05-${String(11 + (index % 15)).padStart(2, "0")}`,
    payDate: `2026-06-${String(4 + (index % 20)).padStart(2, "0")}`,
    eligibleQuantity: Math.abs(h.quantity),
    grossAmount,
    withholdingTax,
    netReceivable: grossAmount - withholdingTax,
    status: index % 5 === 0 ? "Announced" : index % 4 === 0 ? "Settled" : index % 3 === 0 ? "Booked" : "Validated",
    postingStatus: index % 5 === 0 ? "Pending" : index % 4 === 0 ? "Cash Settled" : index % 3 === 0 ? "Posted" : "Accrued",
  };
}));

sampleCashRecon.push(...sampleFx.map((fx, index): CashReconRow => ({
  id: `cash-ext-${index}`,
  currency: fx.base,
  internalLedgerCash: Math.round((2_000_000 + index * 415_000) / Math.max(fx.rate, 0.0001)),
  custodianCash: Math.round((2_000_000 + index * 415_000 + (index % 4 === 0 ? -75_000 : index % 5 === 0 ? 42_500 : 0)) / Math.max(fx.rate, 0.0001)),
  primeBrokerCash: Math.round((2_000_000 + index * 415_000 + (index % 6 === 0 ? 18_000 : 0)) / Math.max(fx.rate, 0.0001)),
  breakReason: index % 4 === 0 ? "Custodian timing difference" : index % 5 === 0 ? "PB financing charge pending" : "Matched",
  owner: ["Treasury", "Cash Recon", "Ops L2", "PB Control"][index % 4],
  status: index % 4 === 0 ? "Open" : index % 5 === 0 ? "Investigating" : "Approved",
})));

samplePositionRecon.push(...sampleHoldings.slice(4).map((h, index): PositionReconRow => ({
  id: `pos-ext-${index}`,
  ticker: h.ticker,
  internalPosition: h.quantity,
  custodianPosition: index % 5 === 0 ? h.quantity - Math.sign(h.quantity || 1) * Math.round(Math.abs(h.quantity) * 0.08) : h.quantity,
  pbPosition: index % 7 === 0 ? h.quantity + Math.sign(h.quantity || 1) * Math.round(Math.abs(h.quantity) * 0.04) : h.quantity,
  settlementStatus: index % 6 === 0 ? "Failed Trade" : index % 4 === 0 ? "Pending Settlement" : "Settled",
  breakReason: index % 5 === 0 ? "Custodian quantity mismatch" : index % 7 === 0 ? "PB file pending settlement update" : "Matched",
  owner: ["Position Control", "Asia Ops", "EMEA Ops", "PB Control"][index % 4],
  status: index % 5 === 0 ? "Open" : index % 7 === 0 ? "Investigating" : "Approved",
})));

const breakTypes: BreakItem["breakType"][] = ["Pricing", "FX", "Cash", "Position", "Corporate Action", "Trade Settlement", "OTC", "GL Imbalance", "NAV Variance"];
sampleBreaks.push(...Array.from({ length: 22 }, (_, index): BreakItem => ({
  id: `BRK-${1100 + index}`,
  breakType: breakTypes[index % breakTypes.length],
  severity: index % 6 === 0 ? "High" : index % 3 === 0 ? "Medium" : "Low",
  aging: index % 8,
  owner: ["Valuations", "Treasury", "Position Control", "Income", "Fund Accounting", "Ops L2"][index % 6],
  navImpact: 18_500 + index * 42_750,
  rootCause: ["Vendor price variance", "FX rate source mismatch", "Cash timing difference", "Custodian position mismatch", "Corporate action not fully posted", "Broker confirm pending"][index % 6],
  status: (["Open", "Investigating", "Pending External Party", "Escalated", "Resolved", "Approved"] as const)[index % 6],
  resolutionNotes: "Practice item generated for operational investigation and maker-checker review",
  escalationLevel: (["L1", "L2", "L3", "CFO"] as const)[index % 4],
  comments: ["Auto-generated practice break", "Review source evidence", "Assess NAV materiality"],
  slaHours: 8 + (index % 5) * 8,
})));

sampleUploads.push(...Array.from({ length: 20 }, (_, index): UploadBatch => {
  const module = (["cashRecon", "positionRecon", "trades", "security", "pricing", "corporateActions", "capital"] as const)[index % 7];
  const warnings = index % 4;
  const rejectedRows = index % 9 === 0 ? 1 : 0;
  return {
    id: `UPL-${9010 + index}`,
    module,
    sourceType: ["Custodian file", "Prime broker file", "Broker confirm", "Bloomberg export", "Pricing vendor file", "Corporate action file", "Transfer agency file"][index % 7],
    fileName: `${module}_practice_${String(index + 1).padStart(2, "0")}.csv`,
    uploadedBy: ["Valuations", "Treasury", "Ops L2", "Fund Accounting", "Investor Services"][index % 5],
    timestamp: `2026-05-09T${String(10 + (index % 7)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`,
    processingStatus: rejectedRows ? "Rejected" : warnings ? "Partially Accepted" : "Validated",
    validationStatus: rejectedRows ? "Critical" : warnings ? "Warnings" : "Clean",
    rowCount: 25 + index * 11,
    rejectedRows,
    duplicateRecords: index % 5 === 0 ? 2 : 0,
    warnings,
    issues: warnings || rejectedRows ? [
      { id: `VAL-EXT-${index}`, severity: rejectedRows ? "Critical" : "Warning", row: 3 + index, field: module === "pricing" ? "price" : module === "capital" ? "investor_id" : "record_id", message: "Practice validation issue generated from uploaded source file", recommendedAction: "Review validation preview, document evidence, and approve or reject through workflow" },
    ] : [],
  };
}));

baseExceptions.push(...Array.from({ length: 18 }, (_, index): ExceptionItem => ({
  id: `ex-ext-${index}`,
  severity: index % 7 === 0 ? "High" : index % 3 === 0 ? "Medium" : "Low",
  module: ["Pricing", "Cash Reconciliation", "Position Reconciliation", "General Ledger", "Investor Servicing", "Corporate Actions"][index % 6],
  message: ["Price tolerance breach requires valuation review", "Cash movement unmatched to bank file", "Custodian quantity differs from internal book", "Manual journal pending approval", "Investor allocation file contains pending item", "Income event awaiting tax validation"][index % 6],
  owner: ["Valuations", "Treasury", "Ops L2", "Fund Accounting", "Investor Services", "Income"][index % 6],
  status: index % 5 === 0 ? "Investigating" : index % 4 === 0 ? "Cleared" : "Open",
})));
