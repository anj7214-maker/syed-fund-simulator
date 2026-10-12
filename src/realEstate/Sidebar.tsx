import { useEffect, useState } from "react";
import { Building2, Calculator, ChevronRight, Landmark, LineChart, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, Users, X } from "lucide-react";
import type { Pathway } from "../workspaces/navigation";
import "./sidebar.css";

interface REGroup { name: string; tabs: string[] }
const areaDetails = {
  Setup: { Icon: Landmark, purpose: "Fund, entities and properties" },
  Property: { Icon: Building2, purpose: "Rent, expenses, capex and cash" },
  "Valuation & Debt": { Icon: LineChart, purpose: "Appraisals, loans and interest" },
  Investors: { Icon: Users, purpose: "Capital, allocations and fees" },
  "Accounting & NAV": { Icon: Calculator, purpose: "GL, TB, consolidation and NAV" },
  "Controls & Practice": { Icon: ShieldCheck, purpose: "Exceptions, signoff and cases" },
};

export function RealEstateSidebar({ groups, activeTab, onSelect, pathway, showAll, onShowAll }: {
  groups: REGroup[]; activeTab: string; onSelect: (tab: string) => void;
  pathway?: Pathway; showAll: boolean; onShowAll: (value: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 980px)").matches);
  const activeGroup = groups.find(group => group.tabs.includes(activeTab))?.name ?? groups[0].name;
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));
  const expanded = mobile || !collapsed;
  useEffect(() => {
    const query = window.matchMedia("(max-width: 980px)");
    const changed = () => { setMobile(query.matches); setMobileOpen(false); };
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
    setOpenGroups(current => current.has(activeGroup) ? current : new Set([...current, activeGroup]));
  }, [activeTab, activeGroup]);
  function toggleGroup(group: REGroup) {
    setOpenGroups(current => {
      const next = new Set(current);
      next.has(group.name) ? next.delete(group.name) : next.add(group.name);
      return next;
    });
    if (!group.tabs.includes(activeTab)) onSelect(group.tabs[0]);
    if (collapsed && !mobile) setCollapsed(false);
  }
  return <aside className={`sidebar re-sidebar ${collapsed ? "re-sidebar-collapsed" : ""} ${mobileOpen ? "mobile-nav-open" : ""}`}>
    <div className="brand">
      <img className="fundops-logo" src="/brand/fundops-lab-icon.png" alt="FundOps Lab" width={42} height={42} />
      {expanded && <div className="brand-copy"><div className="brand-title">FundOps Lab</div><div className="brand-sub">Real Estate Fund Accounting</div></div>}
      <button className="icon-btn ml-auto desktop-nav-toggle" aria-label={collapsed ? "Expand Real Estate sidebar" : "Collapse Real Estate sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(value => !value)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
      <button className="icon-btn ml-auto mobile-nav-toggle" aria-label={mobileOpen ? "Close Real Estate navigation" : "Open Real Estate navigation"} aria-expanded={mobileOpen} aria-controls="real-estate-navigation" title={mobileOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
    <nav className="nav-list" id="real-estate-navigation" aria-label="Real Estate operating areas" onKeyDown={event => { if (event.key === "Escape") setMobileOpen(false); }}>
      {pathway === "student" && expanded && <label className="portal-essential-toggle"><input type="checkbox" checked={showAll} onChange={event => onShowAll(event.target.checked)} /> All operating areas</label>}
      {groups.map(group => {
        const { Icon, purpose } = areaDetails[group.name as keyof typeof areaDetails] ?? areaDetails.Setup;
        const active = group.name === activeGroup;
        const open = openGroups.has(group.name);
        return <div className={`nav-group ${active ? "active" : ""} ${open ? "open" : ""}`} key={group.name}>
          <button className={`nav-group-button ${active ? "active" : ""}`} title={group.name} aria-expanded={expanded && open} onClick={() => toggleGroup(group)}><Icon size={16} />{expanded && <><span><b>{group.name}</b><small>{purpose}</small></span><ChevronRight size={14} className="nav-chevron" /></>}</button>
          {expanded && open && <div className="nav-children">{group.tabs.map(tab => <button key={tab} title={tab} className={`nav-item ${tab === activeTab ? "active" : ""}`} aria-current={tab === activeTab ? "page" : undefined} onClick={() => { onSelect(tab); setMobileOpen(false); }}><Icon size={15} /><span>{tab}</span></button>)}</div>}
        </div>;
      })}
    </nav>
  </aside>;
}
