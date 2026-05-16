export type Currency =
  | "USD" | "EUR" | "GBP" | "JPY" | "INR" | "CHF" | "SGD" | "CAD" | "AUD" | "NZD"
  | "HKD" | "CNH" | "SEK" | "NOK" | "DKK" | "ZAR" | "BRL" | "MXN" | "KRW";
export type AssetType = "Equity" | "Bond" | "FX Forward" | "Swap" | "Option" | "Future" | "ETF" | "CFD" | "Commodity";
export type ModuleId =
  | "dashboard" | "fund" | "holdings" | "trades" | "security" | "pricing" | "fx"
  | "editableFields" | "cashRecon" | "positionRecon" | "reconBreaks" | "corporateActions" | "dividends" | "coupons"
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
  costFx?: number;
  counterparty: string;
  settlementDate: string;
  priceSource: string;
  priorPrice: number;
  lastPriceTime: string;
}

export interface FundSetup {
  fundName: string;
  fundStructure: string;
  fundType: string;
  baseCurrency: Currency;
  navFrequency: string;
  inceptionDate: string;
  fiscalYearEnd: string;
  primeBroker: string;
  custodian: string;
  administrator: string;
  auditor: string;
  legalEntity: string;
  redemptionTerms: string;
  subscriptionTerms: string;
  lockupTerms: string;
  valuationCutoff: string;
  shareClasses: string;
  managementFeePct: number;
  performanceFeePct: number;
  hurdleRate: number;
  highWaterMarkEnabled: boolean;
  workflowStatus: "Draft" | "Submitted" | "Reviewed" | "Approved" | "Posted" | "NAV Published";
}

export interface SecurityMaster {
  id: string;
  isin: string;
  bloombergTicker: string;
  assetType: AssetType;
  description: string;
  country: string;
  exchange: string;
  currency: Currency;
  sector: string;
  industry: string;
  pricingSource: string;
  valuationHierarchy: "Level 1" | "Level 2" | "Level 3";
  liquidityClassification: "Daily" | "Weekly" | "Monthly" | "Illiquid";
  couponRate?: number;
  maturityDate?: string;
  contractMultiplier?: number;
  underlyingSecurity?: string;
  optionType?: "Call" | "Put";
  strike?: number;
  expiry?: string;
  settlementType: "Cash" | "Physical";
  stalePricing: boolean;
  toleranceBreach: boolean;
}

export interface CorporateAction {
  id: string;
  eventType: "Dividend" | "Coupon" | "Stock Split" | "Rights Issue" | "Merger" | "Spin-off" | "Mandatory" | "Voluntary";
  security: string;
  exDate: string;
  recordDate: string;
  payDate: string;
  eligibleQuantity: number;
  grossAmount: number;
  withholdingTax: number;
  netReceivable: number;
  status: "Announced" | "Validated" | "Booked" | "Settled";
  postingStatus: "Pending" | "Accrued" | "Posted" | "Cash Settled";
}

export interface CashReconRow {
  id: string;
  currency: Currency;
  internalLedgerCash: number;
  custodianCash: number;
  primeBrokerCash: number;
  breakReason: string;
  owner: string;
  status: "Open" | "Investigating" | "Resolved" | "Approved";
}

export interface PositionReconRow {
  id: string;
  ticker: string;
  internalPosition: number;
  custodianPosition: number;
  pbPosition: number;
  settlementStatus: "Settled" | "Pending Settlement" | "Failed Trade";
  breakReason: string;
  owner: string;
  status: "Open" | "Investigating" | "Resolved" | "Approved";
}

export interface BreakItem {
  id: string;
  breakType: "Pricing" | "FX" | "Cash" | "Position" | "Corporate Action" | "Trade Settlement" | "OTC" | "GL Imbalance" | "NAV Variance";
  severity: "High" | "Medium" | "Low";
  aging: number;
  owner: string;
  navImpact: number;
  rootCause: string;
  status: "Open" | "Investigating" | "Pending External Party" | "Escalated" | "Resolved" | "Approved" | "Closed";
  resolutionNotes: string;
  escalationLevel: "L1" | "L2" | "L3" | "CFO";
  comments: string[];
  slaHours: number;
}

export type UploadModule = "cashRecon" | "positionRecon" | "trades" | "security" | "pricing" | "corporateActions" | "capital";
export type ValidationSeverity = "Info" | "Warning" | "Critical";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  row?: number;
  field?: string;
  message: string;
  recommendedAction: string;
}

export interface UploadBatch {
  id: string;
  module: UploadModule;
  sourceType: string;
  fileName: string;
  uploadedBy: string;
  timestamp: string;
  processingStatus: "Queued" | "Processing" | "Validated" | "Partially Accepted" | "Rejected" | "Posted";
  validationStatus: "Clean" | "Warnings" | "Critical";
  rowCount: number;
  rejectedRows: number;
  duplicateRecords: number;
  warnings: number;
  issues: ValidationIssue[];
}

export interface CopilotContext {
  tab: ModuleId;
  title: string;
  summary: string;
  accountingImpact: string;
  navImpact: string;
  recommendedAction: string;
  relatedEntries?: string[];
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
    totalCost: number;
    localMarketValue: number;
    baseMarketValue: number;
    pricePnl: number;
    fxPnl: number;
    totalUnrealizedPnl: number;
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
