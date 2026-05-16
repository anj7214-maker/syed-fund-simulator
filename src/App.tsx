import { AnimatePresence, motion } from "framer-motion";
import { SignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Activity, AlertTriangle, Banknote, BookOpenCheck, Bot, Brain, Calculator, ChevronRight, Download, FileDown, FileSpreadsheet, Gauge, GitBranch, Landmark, LineChart as LineIcon, LockKeyhole, MessageSquare, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, ShieldAlert, Sigma, SlidersHorizontal, TrendingDown, TrendingUp, UploadCloud, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFundStore, useRecalc } from "./store/fundStore";
import type { FundState } from "./store/fundStore";
import { CopilotContext, ModuleId, UploadModule } from "./types";

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

function buildSuggestedPrompts(active: ModuleId) {
  const defaults = ["Explain this workflow", "What is the NAV impact?", "What should I review next?"];
  const byTab: Partial<Record<ModuleId, string[]>> = {
    holdings: ["Explain unrealized P&L", "Show biggest exposure", "Explain FX impact"],
    pricing: ["Analyze price tolerance breaches", "Why did NAV change after price update?", "Explain price challenge workflow"],
    cashRecon: ["Analyze cash breaks", "Is this timing or real break?", "How do I upload custody cash?"],
    positionRecon: ["Analyze position differences", "Which side is mismatching?", "How do I resolve failed trades?"],
    reconBreaks: ["Show highest NAV impact breaks", "Explain unresolved items", "How do I escalate a break?"],
    exceptions: ["Analyze open breaks", "Which breaks block NAV?", "Recommend break resolution steps"],
    gl: ["Explain journal logic", "Why do debits equal credits?", "Show source modules"],
    trialBalance: ["Explain trial balance status", "What causes imbalance?", "Which accounts moved?"],
    nav: ["Why did NAV move today?", "Explain NAV waterfall", "Explain fee accruals"],
    corporateActions: ["Explain dividend accrual", "Explain withholding tax", "What happens on pay date?"],
    mgmtFees: ["Explain management fee accrual", "Show fee impact on NAV", "What changes if fee percent changes?"],
    perfFees: ["Explain performance fee", "How does HWM work?", "Why did performance fee increase?"],
    workflow: ["How do I publish NAV?", "Explain maker-checker approval", "What blocks approval?"],
    risk: ["Explain exposure changes", "Show largest strategy risk", "What is concentration risk?"],
    stress: ["Explain scenario impact", "What moved NAV?", "Which investors are impacted?"],
  };
  return byTab[active] ?? defaults;
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
  const lead = mode === "Learning"
    ? `In ${label}, think of this as a fund-admin control step. `
    : `${label}: `;

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
        {["risk", "stress", "scenario", "ops"].includes(active) && <ReconRiskOps type={active} />}
        {active === "exports" && <ExportView />}
      </motion.main>
    </AnimatePresence>
  );
}

function CopilotPanel() {
  const { aiPanelOpen, setAiPanelOpen, copilotContext, activeModule, learningMode } = useFundStore();
  const store = useFundStore();
  const r = useRecalc();
  const [mode, setMode] = useState<"Learning" | "Professional">("Professional");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "I am your institutional operations copilot. Ask me about NAV movement, breaks, uploads, GL postings, fee accruals, or workflow approvals.", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
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
  const suggested = buildSuggestedPrompts(activeModule);
  const ask = (text: string) => {
    const question = text.trim();
    if (!question || typing) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: question, timestamp: new Date().toLocaleTimeString() };
    setMessages((m) => [...m, userMessage]);
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      const answer = generateCopilotReply(question, { active: activeModule, label, r, store, mode: learningMode ? "Learning" : mode, context: ctx, history: [...messages, userMessage] });
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: answer, timestamp: new Date().toLocaleTimeString() }]);
      setTyping(false);
    }, 450);
  };
  return (
    <aside className="ai-panel">
      <div className="ai-title"><Bot size={18} /><b>Institutional AI Copilot</b><button onClick={() => setAiPanelOpen(false)}>×</button></div>
      <div className="ai-mode">{learningMode ? "Learning Mode enabled" : `${mode} Mode`} · {label}</div>
      <div className="ai-mode-toggle"><button className={mode === "Professional" && !learningMode ? "selected" : ""} onClick={() => setMode("Professional")}>Professional</button><button className={mode === "Learning" || learningMode ? "selected" : ""} onClick={() => setMode("Learning")}>Learning</button></div>
      <div className="chat-window">
        {messages.map((m) => <div key={m.id} className={`chat-message ${m.role}`}><p>{m.text}</p><span>{m.timestamp}</span></div>)}
        {typing && <div className="chat-message assistant typing"><p>Analyzing live NAV, breaks, uploads and workflow context...</p></div>}
      </div>
      <div className="suggested-prompts">{suggested.map((p) => <button key={p} onClick={() => ask(p)}>{p}</button>)}</div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about NAV, breaks, GL, uploads..." />
        <button type="submit">Ask</button>
      </form>
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
