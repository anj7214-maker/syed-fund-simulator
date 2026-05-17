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
import { CopilotContext, ModuleId, ScenarioDefinition, ScenarioDifficulty, TrainingMode, UploadModule } from "./types";

const modules: Array<{ id: ModuleId; label: string; icon: typeof Activity }> = [
  { id: "dashboard", label: "Executive Dashboard", icon: Gauge },
  { id: "aiCopilot", label: "AI Copilot", icon: Bot },
  { id: "fund", label: "Fund Master Setup", icon: Landmark },
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
];

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
  return (
    <div className="manual-submit">
      <div>
        <b>{label}</b>
        <span>Editable fields: {fields}</span>
      </div>
      <button className="terminal-button" onClick={() => setSubmittedAt(new Date().toLocaleTimeString())}>
        <BookOpenCheck size={15} /> Submit Manual Updates
      </button>
      {submittedAt && <small>Submitted {submittedAt}</small>}
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
  const moduleUploads = uploads.filter((u) => u.module === module).slice(0, 4);
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
  const openBreaks = store.breaks.filter((b) => !["Approved", "Closed"].includes(b.status));
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
  const openBreaks = store.breaks.filter((b) => !["Approved", "Closed"].includes(b.status));
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
  return (
    <aside className={`sidebar ${collapsed ? "w-[76px]" : "w-[288px]"}`}>
      <div className="brand">
        <div className="brand-mark">SF</div>
        {!collapsed && <div><div className="brand-title">SYED FUND SIMULATOR</div><div className="brand-sub">NAV operations command center</div></div>}
        <button className="icon-btn ml-auto" onClick={toggleSidebar} title="Collapse sidebar">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
      </div>
      <nav className="nav-list">
        {modules.map((m) => {
          const Icon = m.icon;
          const active = activeModule === m.id;
          const impacted = impactedModules.includes(m.id);
          return (
            <button key={m.id} onClick={() => setActiveModule(m.id)} className={`nav-item ${active ? "active" : ""} ${impacted ? "impacted" : ""}`} title={m.label}>
              <Icon size={16} />
              {!collapsed && <span>{m.label}</span>}
              {impacted && <i />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Header() {
  const { fundMode, setFundMode, reset, learningMode, toggleLearningMode, setAiPanelOpen } = useFundStore();
  const r = useRecalc();
  const active = useFundStore((s) => s.activeModule);
  const label = modules.find((m) => m.id === active)?.label;
  const pulse = useQuery({
    queryKey: ["ops-pulse"],
    queryFn: async () => ({ at: new Date().toLocaleTimeString(), batch: Math.floor(88 + Math.random() * 9) }),
    refetchInterval: 5000,
  });
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
        <button className={`terminal-button ${learningMode ? "selected" : ""}`} onClick={toggleLearningMode}><Brain size={15} /> Learning Mode</button>
        <button className="terminal-button" onClick={() => setAiPanelOpen(true)}><Bot size={15} /> AI Copilot</button>
        <button className="terminal-button" onClick={reset}><RefreshCw size={15} /> Reset book</button>
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

function Dashboard() {
  const r = useRecalc();
  const store = useFundStore();
  return (
    <div className="grid-layout">
      <section className="metrics-row">
        <Metric label="Gross assets" value={fmt(r.grossAssets, true)} tone="good" />
        <Metric label="Liabilities" value={fmt(r.liabilities, true)} tone="warn" />
        <Metric label="Net assets" value={fmt(r.netAssets, true)} tone="good" />
        <Metric label="Unrealized P&L" value={fmt(r.unrealizedGains, true)} tone={r.unrealizedGains >= 0 ? "good" : "bad"} />
        <Metric label="Open exceptions" value={String(r.exceptions.filter((e) => e.status !== "Cleared").length)} tone="bad" />
      </section>
      <LearningHint text="Start with NAV, open breaks, and workflow status. Institutional NAV teams clear material breaks before publishing investor-facing NAV." />
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
      <section className="panel">
        <PanelTitle title="Simulation Controls" right={store.fundMode} />
        <div className="scenario-grid">
          {["Market Crash", "FX Shock", "Redemption Run", "Rate Hike", "Counterparty Default"].map((s) => (
            <button key={s} className="scenario-button" onClick={() => store.applyScenario(s)}>{s}</button>
          ))}
        </div>
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
  return <section className="panel full"><PanelTitle title="Institutional Trade Booking" right="Booked trades auto-create GL entries" /><div className="table-wrap"><table className="data-grid"><thead><tr><th>Trade Date</th><th>Settle</th><th>Broker</th><th>B/S</th><th>Ticker</th><th>Qty</th><th>Price</th><th>Fees</th><th>Net Amount</th><th>Status</th><th>Trade ID</th></tr></thead><tbody>{trades.map((t) => <tr key={t.id}><td>{t.tradeDate}</td><td>{t.settleDate}</td><td>{t.broker}</td><td>{t.side}</td><td>{t.ticker}</td><td><EditableNumber value={t.quantity} onCommit={(v) => updateTrade(t.id, "quantity", v)} /></td><td><EditableNumber value={t.price} onCommit={(v) => updateTrade(t.id, "price", v)} /></td><td><EditableNumber value={t.fees} onCommit={(v) => updateTrade(t.id, "fees", v)} /></td><td>{fmt(t.quantity * t.price + (t.side === "Buy" ? t.fees : -t.fees), true)}</td><td><span className={`tag ${t.status === "Failed" ? "bad" : t.status === "Pending" ? "warn" : "good"}`}>{t.status}</span></td><td>{t.id}</td></tr>)}</tbody></table></div></section>;
}

function GLView() {
  const r = useRecalc();
  return <section className="panel full"><PanelTitle title="General Ledger" right="Double-entry auto-posting engine" /><div className="table-wrap"><table className="data-grid"><thead><tr><th>JE</th><th>Date</th><th>Source</th><th>Memo</th><th>Account</th><th>Category</th><th>Debit</th><th>Credit</th><th>Audit Ref</th></tr></thead><tbody>{r.gl.flatMap((je) => je.lines.map((l, idx) => <tr key={`${je.id}-${idx}`}><td>{je.id}</td><td>{je.date}</td><td>{je.source}</td><td>{je.memo}</td><td>{l.account}</td><td>{l.category}</td><td>{l.debit ? fmt(l.debit, true) : ""}</td><td>{l.credit ? fmt(l.credit, true) : ""}</td><td>{l.ref}</td></tr>))}</tbody></table></div></section>;
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
  if (kind === "pl") {
    const grossIncome = r.dividendIncome + r.interestIncome + r.realizedGains + r.unrealizedGains + r.fxGainLoss;
    const financingCost = 92000;
    const auditFee = 28000;
    const adminFee = 65000;
    const totalExpenses = r.managementFee + r.performanceFee + r.brokerFees + financingCost + auditFee + adminFee;
    return <section className="panel full"><PanelTitle title="P&L Statement" right="Sectioned institutional income statement" /><SimpleRows rows={[
      { Section: "INCOME", Line: "Dividend Income", Amount: fmt(r.dividendIncome, true) },
      { Section: "INCOME", Line: "Interest Income", Amount: fmt(r.interestIncome, true) },
      { Section: "INCOME", Line: "Realized Gain/Loss", Amount: fmt(r.realizedGains, true) },
      { Section: "INCOME", Line: "Unrealized Gain/Loss", Amount: fmt(r.unrealizedGains, true) },
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
    ]} /></section>;
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
  return <section className="panel full nav-package"><PanelTitle title="NAV Package" right="Core valuation package" /><div className="metrics-row"><Metric label="Gross assets" value={fmt(r.grossAssets, true)} /><Metric label="Liabilities" value={fmt(r.liabilities, true)} tone="warn" /><Metric label="Net assets" value={fmt(r.netAssets, true)} tone="good" /><Metric label="Investor capital" value={fmt(r.investorCapital, true)} /><Metric label="Shares outstanding" value={num(r.sharesOutstanding)} /><Metric label="NAV/share" value={r.navPerShare.toFixed(4)} tone="good" /></div><SimpleRows rows={[{ Item: "High water mark base", Value: fmt(useFundStore.getState().investors.reduce((s, i) => s + i.hwm * i.shares, 0), true) }, { Item: "Equalization credits", Value: fmt(useFundStore.getState().investors.reduce((s, i) => s + i.equalizationCredit, 0), true) }, { Item: "Management fee accrual", Value: fmt(r.managementFee) }, { Item: "Performance fee accrual", Value: fmt(r.performanceFee) }]} /><div className="mini-waterfall">{r.waterfall.map((w) => <div key={w.name} className={w.value >= 0 ? "step good" : "step bad"}><span>{w.name}</span><b>{fmt(w.value, true)}</b></div>)}</div></section>;
}

function InvestorView({ fees = false }: { fees?: boolean }) {
  const { investors, updateInvestor, managementFeePct, performanceFeePct, setFee } = useFundStore();
  const r = useRecalc();
  return <section className="panel full"><PanelTitle title={fees ? "Fee Engine" : "Investor Capital Activity"} right="Allocation basis updates NAV/share and statements" />{fees && <div className="fee-controls"><label>Management fee <EditableNumber value={managementFeePct} onCommit={(v) => setFee("management", v)} /></label><label>Performance fee <EditableNumber value={performanceFeePct} onCommit={(v) => setFee("performance", v)} /></label><span>Daily accrual: average NAV × fee % ÷ 365 = {fmt(r.managementFee)}</span></div>}<div className="table-wrap"><table className="data-grid"><thead><tr><th>Investor</th><th>Class</th><th>Capital</th><th>Shares</th><th>HWM</th><th>Equalization</th><th>Allocation %</th></tr></thead><tbody>{investors.map((i) => <tr key={i.id}><td>{i.name}</td><td>{i.className}</td><td><EditableNumber value={i.capital} onCommit={(v) => updateInvestor(i.id, "capital", v)} /></td><td><EditableNumber value={i.shares} onCommit={(v) => updateInvestor(i.id, "shares", v)} /></td><td><EditableNumber value={i.hwm} onCommit={(v) => updateInvestor(i.id, "hwm", v)} /></td><td>{fmt(i.equalizationCredit, true)}</td><td>{((i.capital / r.investorCapital) * 100).toFixed(2)}%</td></tr>)}</tbody></table></div></section>;
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
  return <section className="panel"><PanelTitle title="Exception Management" right="Live controls" /><div className="exception-list">{r.exceptions.slice(0, 7).map((e) => <div key={e.id} className={`exception ${e.severity.toLowerCase()}`}><b>{e.severity}</b><span>{e.module}</span><p>{e.message}</p><small>{e.owner} · {e.status}</small></div>)}</div></section>;
}

function AuditTrail() {
  const audit = useFundStore((s) => s.auditTrail);
  return <section className="panel full"><PanelTitle title="Audit Trail" right="Every source edit captures downstream impact" /><SimpleRows rows={audit.map((a) => ({ Timestamp: new Date(a.timestamp).toLocaleString(), Field: a.field, Old: a.oldValue, New: a.newValue, "Impacted modules": a.impactedModules.length, Action: a.action }))} empty="No edits yet. Change a price, FX rate, trade or fee to generate audit events." /></section>;
}

function FundMasterSetup() {
  const { fundSetup, updateFundSetup, updateWorkflow } = useFundStore();
  const textFields: Array<[keyof typeof fundSetup, string]> = [
    ["fundName", "Fund Name"], ["fundStructure", "Fund Structure"], ["fundType", "Fund Type"], ["navFrequency", "NAV Frequency"],
    ["inceptionDate", "Inception Date"], ["fiscalYearEnd", "Fiscal Year End"], ["primeBroker", "Prime Broker"], ["custodian", "Custodian"],
    ["administrator", "Administrator"], ["auditor", "Auditor"], ["legalEntity", "Legal Entity"], ["redemptionTerms", "Redemption Terms"],
    ["subscriptionTerms", "Subscription Terms"], ["lockupTerms", "Lock-up Terms"], ["valuationCutoff", "Valuation Cutoff"], ["shareClasses", "Share Classes"],
  ];
  return (
    <section className="panel full">
      <PanelTitle title="Fund Master Setup" right={`Workflow: ${fundSetup.workflowStatus}`} />
      <WorkflowButtons current={fundSetup.workflowStatus} onChange={updateWorkflow} />
      <div className="form-grid">
        {textFields.map(([field, label]) => (
          <label key={String(field)}><span>{label}</span><EditableText value={String(fundSetup[field])} onCommit={(v) => updateFundSetup(field, v)} /></label>
        ))}
        <label><span>Base Currency</span><select className="terminal-select" value={fundSetup.baseCurrency} onChange={(e) => updateFundSetup("baseCurrency", e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>JPY</option></select></label>
        <label><span>Management Fee %</span><EditableNumber value={fundSetup.managementFeePct} onCommit={(v) => updateFundSetup("managementFeePct", v)} /></label>
        <label><span>Performance Fee %</span><EditableNumber value={fundSetup.performanceFeePct} onCommit={(v) => updateFundSetup("performanceFeePct", v)} /></label>
        <label><span>Hurdle Rate</span><EditableNumber value={fundSetup.hurdleRate} onCommit={(v) => updateFundSetup("hurdleRate", v)} /></label>
        <label><span>High Water Mark Enabled</span><select className="terminal-select" value={fundSetup.highWaterMarkEnabled ? "Yes" : "No"} onChange={(e) => updateFundSetup("highWaterMarkEnabled", e.target.value === "Yes")}><option>Yes</option><option>No</option></select></label>
      </div>
    </section>
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
  const rows = useFundStore((s) => s.corporateActions);
  return (
    <section className="panel full">
      <PanelTitle title="Corporate Actions Processing" right="Accrual, receivable/payable, GL and cash-settlement workflow" />
      <SimpleRows rows={rows.map((c) => ({
        "Event Type": c.eventType, Security: c.security, "Ex-Date": c.exDate, "Record Date": c.recordDate, "Pay Date": c.payDate,
        "Eligible Qty": num(c.eligibleQuantity), "Gross Amount": fmt(c.grossAmount, true), "Withholding Tax": fmt(c.withholdingTax, true),
        "Net Receivable": fmt(c.netReceivable, true), Status: c.status, "Posting Status": c.postingStatus, "NAV Impact": fmt(c.netReceivable, true),
      }))} />
    </section>
  );
}

function CashReconciliationView() {
  const rows = useFundStore((s) => s.cashRecon);
  return <section className="panel full"><PanelTitle title="Cash Reconciliation" right="Internal ledger vs custodian vs prime broker cash" /><SimpleRows rows={rows.map((r) => ({ Currency: r.currency, "Internal Ledger Cash": fmt(r.internalLedgerCash, true), "Custodian Cash": fmt(r.custodianCash, true), "Prime Broker Cash": fmt(r.primeBrokerCash, true), Difference: fmt(r.internalLedgerCash - r.custodianCash, true), "Break Reason": r.breakReason, Owner: r.owner, Status: r.status }))} /></section>;
}

function PositionReconciliationView() {
  const rows = useFundStore((s) => s.positionRecon);
  return <section className="panel full"><PanelTitle title="Position Reconciliation" right="Internal positions vs custodian and prime broker records" /><SimpleRows rows={rows.map((r) => ({ Ticker: r.ticker, "Internal Position": num(r.internalPosition), "Custodian Position": num(r.custodianPosition), "PB Position": num(r.pbPosition), Difference: num(r.internalPosition - r.custodianPosition), "Settlement Status": r.settlementStatus, "Break Reason": r.breakReason, Owner: r.owner, Status: r.status }))} /></section>;
}

function BreaksDashboard() {
  const { breaks, updateBreak } = useFundStore();
  return (
    <section className="panel full">
      <PanelTitle title="Centralized Breaks Dashboard" right="Assignment, SLA, escalation and resolution workflow" />
      <div className="break-actions"><span>Actions available: manual match, force match, split, merge, write off immaterial, pass adjustment journal, create manual accrual, rerun reconciliation.</span></div>
      <div className="table-wrap"><table className="data-grid"><thead><tr><th>Break ID</th><th>Type</th><th>Severity</th><th>Aging</th><th>Owner</th><th>NAV Impact</th><th>Root Cause</th><th>Status</th><th>Resolution Notes</th><th>Escalation</th><th>SLA</th><th>Comments</th><th>Workflow Actions</th><th>AI</th></tr></thead><tbody>{breaks.map((b) => <tr key={b.id}><td>{b.id}</td><td>{b.breakType}</td><td><span className={`tag ${b.severity === "High" ? "bad" : b.severity === "Medium" ? "warn" : "good"}`}>{b.severity}</span></td><td>{b.aging}d</td><td><EditableText value={b.owner} onCommit={(v) => updateBreak(b.id, "owner", v)} /></td><td>{fmt(b.navImpact, true)}</td><td>{b.rootCause}</td><td><select className="terminal-select" value={b.status} onChange={(e) => updateBreak(b.id, "status", e.target.value)}><option>Open</option><option>Investigating</option><option>Pending External Party</option><option>Escalated</option><option>Resolved</option><option>Approved</option><option>Closed</option></select></td><td><EditableText value={b.resolutionNotes} onCommit={(v) => updateBreak(b.id, "resolutionNotes", v)} /></td><td>{b.escalationLevel}</td><td>{b.slaHours}h</td><td>{b.comments.join(" | ")}</td><td><div className="inline-actions"><button onClick={() => updateBreak(b.id, "status", "Escalated")}>Escalate</button><button onClick={() => updateBreak(b.id, "status", "Resolved")}>Resolve</button><button onClick={() => updateBreak(b.id, "status", "Approved")}>Approve</button><button onClick={() => updateBreak(b.id, "status", "Open")}>Reopen</button></div></td><td><ExplainButton context={{ tab: "exceptions", title: b.id, summary: b.rootCause, accountingImpact: `Affected accounts depend on ${b.breakType}; unresolved items block clean NAV sign-off.`, navImpact: `Estimated NAV impact ${fmt(b.navImpact, true)} versus materiality threshold.`, recommendedAction: b.severity === "High" ? "Escalate, obtain evidence, and approve resolution before NAV publication." : "Assign owner, document resolution notes, and approve if immaterial.", relatedEntries: ["Break register", "Audit trail", "NAV control checklist"] }} /></td></tr>)}</tbody></table></div>
    </section>
  );
}

function WorkflowQueue() {
  const { fundSetup, updateWorkflow } = useFundStore();
  return (
    <section className="panel full">
      <PanelTitle title="Workflow Approval Queue" right="Maker-checker NAV operating status" />
      <WorkflowButtons current={fundSetup.workflowStatus} onChange={updateWorkflow} />
      <SimpleRows rows={[
        { Package: "Daily NAV Estimate", Maker: "Fund Accounting", Checker: "NAV Control", Status: fundSetup.workflowStatus, Cutoff: fundSetup.valuationCutoff, Action: "Review valuation, breaks, TB, and investor allocation" },
        { Package: "Official Month-End NAV", Maker: "Fund Accounting", Checker: "CFO Delegate", Status: "Submitted", Cutoff: "Month-end + 5 BD", Action: "Approve financial statements and investor capital rollforward" },
      ]} />
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
  if (type === "stress" || type === "scenario") return <section className="panel full"><PanelTitle title={type === "stress" ? "Stress Testing" : "Scenario Simulation"} right="Applies shocks across pricing, FX, derivatives and capital" /><div className="scenario-grid big">{["Market Crash", "FX Shock", "Redemption Run", "Rate Hike", "Counterparty Default"].map((s) => <button className="scenario-button" key={s} onClick={() => store.applyScenario(s)}>{s}</button>)}</div></section>;
  if (type === "ops") return <section className="panel full"><PanelTitle title="Operations Control Dashboard" right="Workflow, breaks, valuation and sign-off status" /><section className="metrics-row"><Metric label="NAV status" value="Draft T+0" tone="warn" /><Metric label="GL status" value={Math.abs(r.trialBalance.reduce((s, x) => s + x.debit - x.credit, 0)) < 1 ? "Balanced" : "Break"} tone="good" /><Metric label="Open breaks" value={String(r.exceptions.length)} tone="bad" /><Metric label="Approval queue" value="7 items" /></section><ExceptionPanel /></section>;
  return <section className="panel full"><PanelTitle title={modules.find((m) => m.id === type)?.label ?? "Module"} right="Institutional operating worksheet" /><SimpleRows rows={r.exceptions.map((e) => ({ Module: e.module, Severity: e.severity, Break: e.message, Owner: e.owner, Status: e.status }))} /></section>;
}

function ExportView() {
  const r = useRecalc();
  const download = (name: string, content: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const csv = r.pnl.map((x) => `${x.line},${x.amount}`).join("\n");
  return <section className="panel full"><PanelTitle title="Financial Statements Export" right="Excel, PDF, NAV pack and investor statements" /><div className="scenario-grid big">{["Excel NAV Pack", "PDF NAV Pack", "Investor Statement", "Trial Balance", "P&L", "Balance Sheet"].map((x) => <button className="scenario-button" key={x} onClick={() => download(`${x.replaceAll(" ", "-").toLowerCase()}.csv`, csv)}><Download size={16} />{x}</button>)}</div></section>;
}

function impactDelta(before = 0, after = 0) {
  const delta = after - before;
  const pctMove = before ? delta / Math.abs(before) : 0;
  return { delta, pctMove };
}

function ManualEditModeBar() {
  const { manualEditMode, toggleManualEditMode, activeScenarioImpact } = useFundStore();
  const nav = activeScenarioImpact ? impactDelta(activeScenarioImpact.before.nav, activeScenarioImpact.after.nav) : null;
  return (
    <div className="edit-mode-bar">
      <div>
        <b>Manual Data Edit Mode</b>
        <span>{manualEditMode ? "Enabled - edits recalculate NAV, GL, P&L, balance sheet, fees, breaks and audit trail." : "Disabled - use scenario controls or enable edits to practice manual amendments."}</span>
      </div>
      {nav && <div className="impact-mini"><span>NAV Impact</span><b className={nav.delta >= 0 ? "text-good" : "text-bad"}>{fmt(nav.delta, true)} / {(nav.pctMove * 100).toFixed(2)}%</b></div>}
      <button className={`terminal-button ${manualEditMode ? "selected" : ""}`} onClick={toggleManualEditMode}>
        <SlidersHorizontal size={15} /> {manualEditMode ? "Edit Data On" : "Edit Data"}
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

function PracticeScenariosPanel({ active }: { active: ModuleId }) {
  const { trainingMode, setTrainingMode, activeScenarioImpact, activeScenarioId, submitScenario, resetScenario, scenarioRuns, learnerScore } = useFundStore();
  const moduleScenarios = scenariosForModule(active).slice(0, 4);
  const activeScenario = scenarioCatalog.find((scenario) => scenario.id === activeScenarioId);
  const [answer, setAnswer] = useState("");
  if (active === "aiCopilot" || active === "exports" || active === "audit") return null;
  const nav = activeScenarioImpact ? impactDelta(activeScenarioImpact.before.nav, activeScenarioImpact.after.nav) : null;
  const latestRun = scenarioRuns[0];
  const modes: TrainingMode[] = ["Learning Mode", "Operations Mode", "Interview Mode", "Exam Mode"];
  return (
    <section className="panel full practice-panel">
      <PanelTitle title="Practice Scenarios" right={`${moduleScenarios.length || scenarioCatalog.length} module cases available`} />
      <ManualEditModeBar />
      <div className="training-mode-row">
        {modes.map((mode) => <button key={mode} className={`terminal-button ${trainingMode === mode ? "selected" : ""}`} onClick={() => setTrainingMode(mode)}>{mode}</button>)}
        <span>Learner score: <b>{learnerScore}</b></span>
        {latestRun && <span>Latest: <b>{latestRun.status}</b> ({latestRun.score} pts)</span>}
      </div>
      {activeScenario && activeScenarioImpact && (
        <div className="active-scenario">
          <div>
            <span>Active Scenario</span>
            <b>{activeScenario.scenarioName}</b>
            <p>{activeScenario.businessContext}</p>
          </div>
          <div className="impact-cards">
            <Metric label="NAV impact" value={fmt(nav?.delta ?? 0, true)} tone={(nav?.delta ?? 0) >= 0 ? "good" : "bad"} />
            <Metric label="NAV impact %" value={`${((nav?.pctMove ?? 0) * 100).toFixed(2)}%`} tone={(nav?.delta ?? 0) >= 0 ? "good" : "bad"} />
            <Metric label="Before NAV/share" value={activeScenarioImpact.before.navPerShare.toFixed(4)} />
            <Metric label="After NAV/share" value={activeScenarioImpact.after.navPerShare.toFixed(4)} tone="warn" />
            <Metric label="Open breaks" value={String(activeScenarioImpact.after.openBreaks)} tone="bad" />
          </div>
          <div className="learner-submit">
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Explain root cause, NAV impact, failed control, GL/accounting treatment and resolution evidence..." />
            <div>
              <button className="terminal-button selected" onClick={() => { submitScenario(answer); setAnswer(""); }}>Submit Investigation</button>
              <button className="terminal-button reject" onClick={resetScenario}>Reset Scenario</button>
            </div>
          </div>
        </div>
      )}
      <div className="scenario-strip">
        {(moduleScenarios.length ? moduleScenarios : scenarioCatalog.slice(0, 4)).map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} compact />)}
      </div>
    </section>
  );
}

function ScenarioLabView() {
  const [moduleFilter, setModuleFilter] = useState<ModuleId | "All">("All");
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty | "All">("All");
  const filtered = useMemo(() => scenarioCatalog.filter((scenario) => {
    const moduleOk = moduleFilter === "All" || scenario.module === moduleFilter;
    const difficultyOk = difficulty === "All" || scenario.difficulty === difficulty;
    return moduleOk && difficultyOk;
  }), [moduleFilter, difficulty]);
  const difficulties: Array<ScenarioDifficulty | "All"> = ["All", "Beginner", "Intermediate", "Advanced", "Real World Ops", "NAV Oversight", "Interview Mode", "Crisis Simulation"];
  const scenarioModules = Array.from(new Set(scenarioCatalog.map((scenario) => scenario.module)));
  return (
    <section className="panel full scenario-lab">
      <PanelTitle title="Scenario Lab" right={`${filtered.length} institutional practice cases`} />
      <div className="scenario-filters">
        <select className="terminal-select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value as ModuleId | "All")}>
          <option>All</option>
          {scenarioModules.map((module) => <option key={module}>{module}</option>)}
        </select>
        <select className="terminal-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as ScenarioDifficulty | "All")}>
          {difficulties.map((level) => <option key={level}>{level}</option>)}
        </select>
      </div>
      <div className="scenario-lab-grid">
        {filtered.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} />)}
      </div>
    </section>
  );
}

function CopilotChatSurface({ compact = false }: { compact?: boolean }) {
  const { copilotContext, activeModule, learningMode } = useFundStore();
  const store = useFundStore();
  const r = useRecalc();
  const [mode, setMode] = useState<"Learning" | "Professional">("Professional");
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
  const effectiveMode = learningMode ? "Learning" : mode;
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
        <div><b>Suggested Operational Questions</b><span>{effectiveMode} prompts rotate with tab, breaks, uploads and NAV state.</span></div>
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
  const { setAiPanelOpen, toggleLearningMode, learningMode, explainContext, setActiveModule } = store;
  const openBreaks = store.breaks.filter((b) => !["Approved", "Closed"].includes(b.status));
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
          <button className={`terminal-button ${learningMode ? "selected" : ""}`} onClick={toggleLearningMode}><Brain size={16} /> {learningMode ? "Learning Mode On" : "Enable Learning Mode"}</button>
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
  return (
    <AnimatePresence mode="wait">
      <motion.main key={active} className="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
        <DependencyStrip />
        <PracticeScenariosPanel active={active} />
        {active === "dashboard" && <Dashboard />}
        {active === "aiCopilot" && <AICopilotWorkspace />}
        {active === "fund" && <FundMasterSetup />}
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
        {(active === "capital" || active === "subsReds" || active === "investorReporting" || active === "equalization" || active === "waterfall") && <><FileUploadPanel module="capital" title="Investor Capital Activity Upload" /><ManualSubmitBar label="Investor capital workflow" fields="Capital, Shares, High Water Mark" /><InvestorView /></>}
        {(active === "mgmtFees" || active === "perfFees" || active === "expenses") && <><ManualSubmitBar label="Fee amendment workflow" fields="Management Fee %, Performance Fee %" /><InvestorView fees /></>}
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
        {active === "scenario" && <ScenarioLabView />}
        {["risk", "stress", "ops"].includes(active) && <ReconRiskOps type={active} />}
        {active === "exports" && <ExportView />}
      </motion.main>
    </AnimatePresence>
  );
}

function CopilotPanel() {
  const { aiPanelOpen, setAiPanelOpen, copilotContext, activeModule, learningMode } = useFundStore();
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
      <div className="ai-mode">{learningMode ? "Learning Mode enabled" : "Professional Mode"} - {label}</div>
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
