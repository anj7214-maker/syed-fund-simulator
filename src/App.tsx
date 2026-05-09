import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, Banknote, BookOpenCheck, Calculator, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Gauge, GitBranch, Landmark, LineChart as LineIcon, LockKeyhole, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, ShieldAlert, Sigma, SlidersHorizontal, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFundStore, useRecalc } from "./store/fundStore";
import { ModuleId } from "./types";

const modules: Array<{ id: ModuleId; label: string; icon: typeof Activity }> = [
  { id: "dashboard", label: "Executive Dashboard", icon: Gauge },
  { id: "fund", label: "Fund Master Setup", icon: Landmark },
  { id: "holdings", label: "Portfolio Holdings", icon: FileSpreadsheet },
  { id: "trades", label: "Trade Blotter", icon: BookOpenCheck },
  { id: "security", label: "Security Master", icon: Search },
  { id: "pricing", label: "Pricing Engine", icon: SlidersHorizontal },
  { id: "fx", label: "FX Rates", icon: RefreshCw },
  { id: "cashRecon", label: "Cash Reconciliation", icon: Banknote },
  { id: "positionRecon", label: "Position Reconciliation", icon: GitBranch },
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

const fmt = (n: number, compact = false) => Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: compact ? "compact" : "standard",
  maximumFractionDigits: compact ? 2 : 0,
}).format(n);
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const num = (n: number) => Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);

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
  const { fundMode, setFundMode, reset } = useFundStore();
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
        <button className="terminal-button" onClick={reset}><RefreshCw size={15} /> Reset book</button>
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
    { header: "FX", cell: ({ row }) => <FlashCell id={`${row.original.id}-fxRate`}>{row.original.fxRate.toFixed(4)}</FlashCell> },
    { header: "Market Value", cell: ({ row }) => <span className={row.original.marketValue >= 0 ? "text-good" : "text-bad"}>{fmt(row.original.marketValue, true)}</span> },
    { header: "Unrealized G/L", cell: ({ row }) => <span className={row.original.unrealized >= 0 ? "text-good" : "text-bad"}>{fmt(row.original.unrealized, true)}</span> },
    { header: "Exposure %", cell: ({ row }) => `${row.original.exposurePct.toFixed(2)}%` },
    { header: "Counterparty", accessorKey: "counterparty" },
    { header: "Settlement", accessorKey: "settlementDate" },
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

function PricingEngine() {
  const { holdings, updateHolding } = useFundStore();
  const rows = holdings.map((h) => ({ ...h, variance: ((h.marketPrice - h.priorPrice) / h.priorPrice) * 100 }));
  return (
    <section className="panel full">
      <PanelTitle title="Real-Time Pricing Console" right="Manual overrides trigger NAV, GL and investor allocation" />
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
  if (kind === "pl") return <section className="panel full"><PanelTitle title="P&L Statement" right="Institutional income statement" /><SimpleRows rows={r.pnl.map((x) => ({ Line: x.line, Amount: fmt(x.amount, true) }))} /></section>;
  if (kind === "balance") return <section className="panel full"><PanelTitle title="Balance Sheet" right="Assets = Liabilities + Capital validation" /><div className="balance-banner good">Assets {fmt(r.grossAssets, true)} = Liabilities {fmt(r.liabilities, true)} + Capital {fmt(r.netAssets, true)}</div><SimpleRows rows={r.balanceSheet.map((x) => ({ Section: x.section, Line: x.line, Amount: fmt(x.amount, true) }))} /></section>;
  return <section className="panel full nav-package"><PanelTitle title="NAV Package" right="Core valuation package" /><div className="metrics-row"><Metric label="Gross assets" value={fmt(r.grossAssets, true)} /><Metric label="Liabilities" value={fmt(r.liabilities, true)} tone="warn" /><Metric label="Net assets" value={fmt(r.netAssets, true)} tone="good" /><Metric label="Investor capital" value={fmt(r.investorCapital, true)} /><Metric label="Shares outstanding" value={num(r.sharesOutstanding)} /><Metric label="NAV/share" value={r.navPerShare.toFixed(4)} tone="good" /></div><SimpleRows rows={[{ Item: "High water mark base", Value: fmt(useFundStore.getState().investors.reduce((s, i) => s + i.hwm * i.shares, 0), true) }, { Item: "Equalization credits", Value: fmt(useFundStore.getState().investors.reduce((s, i) => s + i.equalizationCredit, 0), true) }, { Item: "Management fee accrual", Value: fmt(r.managementFee) }, { Item: "Performance fee accrual", Value: fmt(r.performanceFee) }]} /><div className="mini-waterfall">{r.waterfall.map((w) => <div key={w.name} className={w.value >= 0 ? "step good" : "step bad"}><span>{w.name}</span><b>{fmt(w.value, true)}</b></div>)}</div></section>;
}

function InvestorView({ fees = false }: { fees?: boolean }) {
  const { investors, updateInvestor, managementFeePct, performanceFeePct, setFee } = useFundStore();
  const r = useRecalc();
  return <section className="panel full"><PanelTitle title={fees ? "Fee Engine" : "Investor Capital Activity"} right="Allocation basis updates NAV/share and statements" />{fees && <div className="fee-controls"><label>Management fee <EditableNumber value={managementFeePct} onCommit={(v) => setFee("management", v)} /></label><label>Performance fee <EditableNumber value={performanceFeePct} onCommit={(v) => setFee("performance", v)} /></label><span>Daily accrual: average NAV × fee % ÷ 365 = {fmt(r.managementFee)}</span></div>}<div className="table-wrap"><table className="data-grid"><thead><tr><th>Investor</th><th>Class</th><th>Capital</th><th>Shares</th><th>HWM</th><th>Equalization</th><th>Allocation %</th></tr></thead><tbody>{investors.map((i) => <tr key={i.id}><td>{i.name}</td><td>{i.className}</td><td><EditableNumber value={i.capital} onCommit={(v) => updateInvestor(i.id, "capital", v)} /></td><td><EditableNumber value={i.shares} onCommit={(v) => updateInvestor(i.id, "shares", v)} /></td><td><EditableNumber value={i.hwm} onCommit={(v) => updateInvestor(i.id, "hwm", v)} /></td><td>{fmt(i.equalizationCredit, true)}</td><td>{((i.capital / r.investorCapital) * 100).toFixed(2)}%</td></tr>)}</tbody></table></div></section>;
}

function DerivativesView() {
  const { derivatives, updateDerivative } = useFundStore();
  return <section className="panel full"><PanelTitle title="OTC Derivatives and MTM" right="IRS, CDS, FX Swaps, TRS and listed futures exposure" /><div className="table-wrap"><table className="data-grid"><thead><tr><th>Type</th><th>Reference</th><th>Notional</th><th>MTM</th><th>Accrued Interest</th><th>Collateral</th><th>Counterparty</th><th>Exposure</th></tr></thead><tbody>{derivatives.map((d) => <tr key={d.id}><td>{d.type}</td><td>{d.reference}</td><td>{fmt(d.notional, true)}</td><td><FlashCell id={`${d.id}-mtm`}><EditableNumber value={d.mtm} onCommit={(v) => updateDerivative(d.id, "mtm", v)} /></FlashCell></td><td><EditableNumber value={d.accruedInterest} onCommit={(v) => updateDerivative(d.id, "accruedInterest", v)} /></td><td><EditableNumber value={d.collateral} onCommit={(v) => updateDerivative(d.id, "collateral", v)} /></td><td>{d.counterparty}</td><td className={d.mtm - d.collateral >= 0 ? "text-good" : "text-bad"}>{fmt(d.mtm - d.collateral, true)}</td></tr>)}</tbody></table></div></section>;
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

function ModuleContent() {
  const active = useFundStore((s) => s.activeModule);
  return (
    <AnimatePresence mode="wait">
      <motion.main key={active} className="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
        <DependencyStrip />
        {active === "dashboard" && <Dashboard />}
        {active === "holdings" && <section className="panel full"><PanelTitle title="Editable Portfolio Holdings" right="Any edit recalculates NAV, P&L, GL and allocations" /><HoldingsGrid /></section>}
        {active === "pricing" && <PricingEngine />}
        {active === "fx" && <FxEngine />}
        {active === "trades" && <TradeBlotter />}
        {active === "gl" && <GLView />}
        {active === "trialBalance" && <TrialBalance />}
        {active === "pl" && <Statements kind="pl" />}
        {active === "balanceSheet" && <Statements kind="balance" />}
        {active === "nav" && <Statements kind="nav" />}
        {(active === "capital" || active === "subsReds" || active === "investorReporting" || active === "equalization" || active === "waterfall") && <InvestorView />}
        {(active === "mgmtFees" || active === "perfFees" || active === "expenses") && <InvestorView fees />}
        {(active === "otc" || active === "mtm") && <DerivativesView />}
        {active === "dividends" && <AccrualsView kind="Dividend" />}
        {active === "coupons" && <AccrualsView kind="Coupon" />}
        {active === "audit" && <AuditTrail />}
        {active === "exceptions" && <ExceptionPanel />}
        {["cashRecon", "positionRecon", "corporateActions", "security", "fund", "workflow"].includes(active) && <ReconRiskOps type={active} />}
        {["risk", "stress", "scenario", "ops"].includes(active) && <ReconRiskOps type={active} />}
        {active === "exports" && <ExportView />}
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Header />
        <ModuleContent />
      </div>
    </div>
  );
}
