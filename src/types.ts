export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "CHF" | "SGD";
export type AssetType = "Equity" | "Bond" | "FX Forward" | "Swap" | "Option" | "Future" | "ETF" | "CFD" | "Commodity";
export type ModuleId =
  | "dashboard" | "fund" | "holdings" | "trades" | "security" | "pricing" | "fx"
  | "cashRecon" | "positionRecon" | "corporateActions" | "dividends" | "coupons"
  | "otc" | "mtm" | "gl" | "trialBalance" | "pl" | "balanceSheet" | "nav"
  | "capital" | "subsReds" | "mgmtFees" | "perfFees" | "equalization" | "waterfall"
  | "expenses" | "audit" | "exceptions" | "risk" | "stress" | "scenario"
  | "investorReporting" | "exports" | "workflow" | "ops";

export interface Holding {
  id: string;
  isin: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  strategy: string;
  currency: Currency;
  quantity: number;
  costPrice: number;
  marketPrice: number;
  fxRate: number;
  counterparty: string;
  settlementDate: string;
  priceSource: string;
  priorPrice: number;
  lastPriceTime: string;
}

export interface Trade {
  id: string;
  tradeDate: string;
  settleDate: string;
  broker: string;
  side: "Buy" | "Sell";
  ticker: string;
  quantity: number;
  price: number;
  fees: number;
  status: "Booked" | "Matched" | "Failed" | "Pending";
}

export interface FxRate {
  pair: string;
  base: Currency;
  quote: Currency;
  rate: number;
  priorRate: number;
  source: string;
}

export interface Investor {
  id: string;
  name: string;
  className: string;
  capital: number;
  shares: number;
  hwm: number;
  equalizationCredit: number;
  hurdleRate: number;
}

export interface CapitalActivity {
  id: string;
  investorId: string;
  date: string;
  type: "Subscription" | "Redemption";
  amount: number;
  status: "Approved" | "Pending" | "Rejected";
}

export interface Accrual {
  id: string;
  kind: "Dividend" | "Coupon";
  ticker: string;
  exDate?: string;
  payDate?: string;
  sharesEligible?: number;
  withholdingTax?: number;
  netDividend?: number;
  couponPct?: number;
  accrualDays?: number;
  accruedInterest?: number;
  cleanPrice?: number;
  dirtyPrice?: number;
}

export interface Derivative {
  id: string;
  type: "IRS" | "CDS" | "FX Swap" | "TRS" | "Future";
  reference: string;
  notional: number;
  mtm: number;
  accruedInterest: number;
  collateral: number;
  counterparty: string;
}

export interface JournalLine {
  account: string;
  category: "Asset" | "Liability" | "Capital" | "Income" | "Expense";
  debit: number;
  credit: number;
  ref: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  source: string;
  memo: string;
  lines: JournalLine[];
  auto: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  impactedModules: ModuleId[];
  action: string;
}

export interface ExceptionItem {
  id: string;
  severity: "High" | "Medium" | "Low";
  module: string;
  message: string;
  owner: string;
  status: "Open" | "Investigating" | "Cleared";
}

export interface RecalcResult {
  holdings: Array<Holding & {
    marketValue: number;
    costValue: number;
    unrealized: number;
    exposurePct: number;
    priceMovePct: number;
  }>;
  grossAssets: number;
  liabilities: number;
  netAssets: number;
  investorCapital: number;
  sharesOutstanding: number;
  navPerShare: number;
  managementFee: number;
  performanceFee: number;
  realizedGains: number;
  unrealizedGains: number;
  dividendIncome: number;
  interestIncome: number;
  fxGainLoss: number;
  adminExpenses: number;
  brokerFees: number;
  trialBalance: Array<{ account: string; category: string; debit: number; credit: number; balance: number }>;
  gl: JournalEntry[];
  pnl: Array<{ line: string; amount: number }>;
  balanceSheet: Array<{ section: "Assets" | "Liabilities" | "Capital"; line: string; amount: number }>;
  exceptions: ExceptionItem[];
  waterfall: Array<{ name: string; value: number }>;
  exposures: Array<{ name: string; value: number }>;
}
