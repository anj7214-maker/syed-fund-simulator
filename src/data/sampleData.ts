import { Accrual, CapitalActivity, Derivative, ExceptionItem, FxRate, Holding, Investor, Trade } from "../types";

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
  { pair: "SGD/USD", base: "SGD", quote: "USD", rate: 0.74, priorRate: 0.739, source: "WM/Reuters" }
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

export const baseExceptions: ExceptionItem[] = [
  { id: "ex1", severity: "High", module: "Position Reconciliation", message: "AAPL short quantity differs from prime broker by 9,000 shares", owner: "Ops L2", status: "Investigating" },
  { id: "ex2", severity: "Medium", module: "Cash Reconciliation", message: "EUR cash timing difference pending DB settlement", owner: "Treasury", status: "Open" },
  { id: "ex3", severity: "Low", module: "Pricing", message: "CBOE option surface updated 5 minutes after valuation cut", owner: "Valuations", status: "Open" }
];
