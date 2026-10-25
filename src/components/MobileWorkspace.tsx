import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Menu, Search, X } from "lucide-react";
import { mobileNavigationEnabled, searchAreas, type MobileArea } from "./mobileNavigation";
if (mobileNavigationEnabled) void import("./mobileWorkspace.css");

export function useMobileLayout() {
  const [mobile, setMobile] = useState(() => matchMedia("(max-width: 980px)").matches);
  useEffect(() => {
    const query = matchMedia("(max-width: 980px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile && mobileNavigationEnabled;
}

export function ResponsiveDisclosure({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  const mobile = useMobileLayout();
  const [open, setOpen] = useState(false);
  if (!mobile) return <div style={{ display: "contents" }} className={`desktop-disclosure ${className}`}>{children}</div>;
  return <details className={`mobile-disclosure ${className}`} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{label}<ChevronDown size={16} aria-hidden="true" /></summary>
    <div className="mobile-disclosure-body">{children}</div>
  </details>;
}

export function MobileModules({ areas, activeId, onSelect, workspace, options }: {
  areas: MobileArea[]; activeId: string; onSelect: (id: string) => void; workspace: string; options?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeArea = areas.find(area => area.items.some(item => item.id === activeId));
  const activeItem = activeArea?.items.find(item => item.id === activeId);
  const [expanded, setExpanded] = useState(() => new Set(activeArea ? [activeArea.title] : []));
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const title = useId();
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    search.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);
  function select(id: string) {
    onSelect(id);
    setOpen(false);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".mobile-module-bar h1")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  const filtered = searchAreas(areas, query);
  return <>
    <div className="mobile-module-bar">
      <img className="fundops-logo" src="/brand/fundops-lab-icon.png" alt="FundOps Lab" width={26} height={26} />
      <button ref={trigger} className="mobile-modules-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => {
        setQuery("");
        setExpanded(new Set(activeArea ? [activeArea.title] : []));
        setOpen(true);
      }}><Menu size={18} /> Modules</button>
      <div><span>{activeArea?.title ?? workspace}</span><h1 tabIndex={-1}>{activeItem?.label ?? activeId}</h1></div>
    </div>
    {open && createPortal(<dialog ref={dialog} className="mobile-module-dialog" aria-labelledby={title} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } }} onCancel={event => { event.preventDefault(); setOpen(false); }} onClose={() => { if (!dialog.current?.open) setOpen(false); }}>
      <header><div><span>{workspace}</span><h2 id={title}>Modules</h2></div><button aria-label="Close modules" onClick={() => setOpen(false)}><X size={22} /></button></header>
      <label className="mobile-module-search"><Search size={18} /><input ref={search} type="search" aria-label="Search modules" placeholder="Search modules" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {options && <div className="mobile-module-options">{options}</div>}
      <nav aria-label={`${workspace} modules`} className="mobile-module-list">
        {!filtered.length && <p role="status">No matching modules.</p>}
        {filtered.map((area, index) => {
          const show = !!query.trim() || expanded.has(area.title);
          const id = `${listId}-${index}`;
          return <section key={area.title}>
            <button className="mobile-area-heading" aria-expanded={show} aria-controls={id} onClick={() => setExpanded(current => {
              const next = new Set(current);
              next.has(area.title) ? next.delete(area.title) : next.add(area.title);
              return next;
            })}><span>{area.title}</span>{show ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button>
            <div id={id} hidden={!show}>{area.items.map(item => <button key={item.id} className="mobile-area-tab" aria-current={item.id === activeId ? "page" : undefined} onClick={() => select(item.id)}>{item.label}<ChevronRight size={16} /></button>)}</div>
          </section>;
        })}
      </nav>
    </dialog>, document.body)}
  </>;
}

interface ReadableRow { label: string; values: { heading: string; value: string }[] }
export function ResponsiveTable({ children, label = "Scrollable data table" }: { children: ReactNode; label?: string }) {
  const mobile = useMobileLayout();
  const container = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [wide, setWide] = useState(false);
  const [rows, setRows] = useState<ReadableRow[] | null>(null);
  const [selected, setSelected] = useState(0);
  const title = useId();
  useEffect(() => {
    if (!mobile || !container.current) return;
    const element = container.current;
    const measure = () => setWide(element.scrollWidth > element.clientWidth + 2);
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    if (element.firstElementChild) resize.observe(element.firstElementChild);
    const mutation = new MutationObserver(measure);
    mutation.observe(element, { childList: true, subtree: true, characterData: true });
    measure();
    return () => { resize.disconnect(); mutation.disconnect(); };
  }, [mobile]);
  useEffect(() => {
    if (!rows || !mobile) return;
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; trigger.current?.focus({ preventScroll: true }); };
  }, [rows, mobile]);
  const readRows = () => {
    const element = container.current;
    if (!element) return;
    const headings = [...element.querySelectorAll("thead tr:last-child th")].map(cell => cell.textContent?.trim() ?? "");
    const data = [...element.querySelectorAll("tbody tr")].map((row, index) => {
      const values = [...row.querySelectorAll(":scope > td,:scope > th")].map((cell, i) => {
        const controls = [...cell.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea")];
        const value = controls.length ? controls.map(control => control instanceof HTMLSelectElement ? control.selectedOptions[0]?.text : control instanceof HTMLInputElement && control.type === "checkbox" ? (control.checked ? "Yes" : "No") : control.value).join(" / ") : cell.textContent?.trim() ?? "";
        return { heading: headings[i] || `Field ${i + 1}`, value };
      });
      return { label: `${index + 1}. ${values[0]?.value || "Record"}`, values };
    });
    setSelected(0);
    setRows(data);
  };
  return <div className="responsive-table">
    {mobile && wide && <div className="mobile-table-tools"><span>More columns <ChevronRight size={14} /></span><button ref={trigger} onClick={readRows}>Row details</button></div>}
    <div className="table-wrap" ref={container} tabIndex={mobile ? 0 : undefined} role={mobile ? "region" : undefined} aria-label={mobile ? label : undefined}>{children}</div>
    {rows && mobile && createPortal(<dialog ref={dialog} className="mobile-row-dialog" aria-labelledby={title} onCancel={event => { event.preventDefault(); setRows(null); }} onClose={() => { if (!dialog.current?.open) setRows(null); }}>
      <header><h2 id={title}>Record details</h2><button aria-label="Close row details" onClick={() => setRows(null)}><X size={22} /></button></header>
      {rows.length ? <><label>Record<select value={selected} onChange={event => setSelected(Number(event.target.value))}>{rows.map((row, index) => <option key={index} value={index}>{row.label}</option>)}</select></label><dl>{rows[selected]?.values.map((value, index) => <div key={index}><dt>{value.heading}</dt><dd>{value.value || "Not set"}</dd></div>)}</dl></> : <p>No matching records.</p>}
    </dialog>, document.body)}
  </div>;
}
