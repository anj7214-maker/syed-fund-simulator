import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Building2, GraduationCap, Home, Landmark, BriefcaseBusiness } from "lucide-react";
import { VisitorGate } from "../components/VisitorGate";
import { WorkspacePreview } from "./WorkspacePreview";
import { workspacePreviewsEnabled } from "./previewPolicy";
import { readPreferences, resolveRoute, savePreferences, type AssetWorkspace, type Pathway, type PortalPreferences } from "./navigation";
import "./portal.css";

const PremiumHome = lazy(() => import("./PremiumHome").then(module => ({ default: module.PremiumHome })));

function PathwayChoice({ value, onChange }: { value: Pathway; onChange: (value: Pathway) => void }) {
  return <div className="portal-pathways" role="group" aria-label="Practice pathway">
    <button aria-pressed={value === "student"} onClick={() => onChange("student")}><GraduationCap size={17} /> Student</button>
    <button aria-pressed={value === "professional"} onClick={() => onChange("professional")}><BriefcaseBusiness size={17} /> Working Professional</button>
  </div>;
}

export function AssetClassPortal({ renderWorkspace }: { renderWorkspace: (asset: AssetWorkspace, pathway: Pathway) => ReactNode }) {
  const [route, setRoute] = useState(() => resolveRoute(window.location.pathname));
  const [preferences, setPreferences] = useState(() => readPreferences(localStorage));
  const [expandedPreview, setExpandedPreview] = useState<AssetWorkspace | null>(null);
  const animatedPreviews = workspacePreviewsEnabled(import.meta.env.VITE_WORKSPACE_PREVIEWS, window.location.search);
  const premiumHome = import.meta.env.VITE_PREMIUM_HOME !== "false" && new URLSearchParams(window.location.search).get("home") !== "classic";
  const pathway = preferences.pathway;
  useEffect(() => {
    const back = () => { setExpandedPreview(null); setRoute(resolveRoute(window.location.pathname)); };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => {
    document.title = route === "home" ? "FundOps Lab | Accounting Practice" : route === "hedge-fund" ? "Hedge Fund Accounting | FundOps Lab" : route === "real-estate" ? "Real Estate Fund Accounting | FundOps Lab" : "Page Not Found | FundOps Lab";
    if (route === "hedge-fund" || route === "real-estate") {
      const current = readPreferences(localStorage);
      if (current.lastWorkspace !== route) {
        const next = { ...current, lastWorkspace: route };
        savePreferences(localStorage, next);
        setPreferences(next);
      }
    }
  }, [route]);
  function navigate(next: "home" | AssetWorkspace) {
    setExpandedPreview(null);
    window.history.pushState({}, "", next === "home" ? "/" : `/${next}`);
    setRoute(next);
    if (next !== "home") updatePreferences({ lastWorkspace: next });
    window.scrollTo({ top: 0 });
  }
  function updatePreferences(changes: Partial<PortalPreferences>) {
    const next = { ...readPreferences(localStorage), ...changes };
    savePreferences(localStorage, next);
    setPreferences(next);
  }
  const setPathway = (value: Pathway) => updatePreferences({ pathway: value });
  const cards = [
    { asset: "hedge-fund" as const, title: "Hedge Fund Accounting", Icon: Landmark, image: "/workspace-previews/hedge-fund.png", purpose: "Follow trades and positions through reconciliation, accounting and NAV.", topics: "Trades & holdings · Pricing · Reconciliation · GL & NAV · Investor capital" },
    { asset: "real-estate" as const, title: "Real Estate Fund Accounting", Icon: Building2, image: "/workspace-previews/real-estate.png", purpose: "Follow property and SPV books through consolidation and fund NAV.", topics: "Rent & receivables · Property expenses · Debt · Valuation · Consolidation" },
  ];
  if (route === "home" && premiumHome) return <Suspense fallback={<main className="portal-not-found"><h1>FundOps Lab</h1><p>Loading practice desks...</p></main>}><PremiumHome pathway={pathway} setPathway={setPathway} navigate={navigate} lastWorkspace={preferences.lastWorkspace} videoEnabled={animatedPreviews} /></Suspense>;
  if (route === "home") return <div className="portal-home">
    <header className="portal-home-header"><a href="/" aria-label="FundOps Lab Home"><img className="fundops-logo" src="/brand/fundops-lab-icon.png" alt="" /><b>FundOps Lab</b></a><span>Accounting & Operations Practice</span></header>
    <main className="portal-home-main">
      <section className="portal-intro"><h1>FundOps Lab</h1><p>Connected accounting books. Operational practice. Visible NAV impact.</p><div className="portal-home-actions"><PathwayChoice value={pathway} onChange={setPathway} />{preferences.lastWorkspace && <button className="terminal-button" onClick={() => navigate(preferences.lastWorkspace!)}>Continue {preferences.lastWorkspace === "hedge-fund" ? "Hedge Fund" : "Real Estate"} <ArrowRight size={16} /></button>}</div></section>
      <section aria-labelledby="workspace-choice"><h2 id="workspace-choice">Choose your asset class</h2><div className="portal-workspace-grid">{cards.map(({ asset, title, Icon, image, purpose, topics }) => <article className="portal-workspace-card" key={asset}><div className="portal-card-title"><Icon size={22} /><h3>{title}</h3></div>{animatedPreviews ? <WorkspacePreview asset={asset} title={title} poster={image} expanded={expandedPreview === asset} obscured={expandedPreview !== null && expandedPreview !== asset} onExpand={setExpandedPreview} /> : <img className="portal-preview" src={image} alt={`${title} demonstration workspace`} width={1200} height={500} loading="lazy" />}<div className="portal-card-body"><p>{purpose}</p><p className="portal-topics">{topics}</p><button className="terminal-button" onClick={() => navigate(asset)}>Enter {asset === "hedge-fund" ? "Hedge Fund" : "Real Estate"} <ArrowRight size={16} /></button></div></article>)}</div></section>
      <section className="portal-pathway-summary"><h2>{pathway === "student" ? "Build interview-ready accounting reasoning" : "Practice operational judgment"}</h2><p>{pathway === "student" ? "Start with core books and NAV, investigate a case, then explain the journal, control and investor impact." : "Investigate connected exceptions, prepare corrections and work through review, evidence and signoff."}</p></section>
      <p className="portal-notice">Synthetic-data simulation, not a live client-accounting service. Visitor registration is required to enter; it is not a verified login. Do not upload confidential employer or client data.</p>
    </main><footer className="portal-home-footer"><span>Founded by Syed Ali Jafri ACSI ICA</span><a href="/?layout=legacy">Classic workspace</a><span>Copyright {new Date().getFullYear()} Syed Ali Jafri</span></footer>
  </div>;
  if (route === "not-found") return <main className="portal-not-found"><h1>Page not found</h1><button className="terminal-button" onClick={() => navigate("home")}><Home size={16} /> Choose a workspace</button></main>;
  return <div className="portal-workspace">
    <div className="portal-workspace-bar"><button className="terminal-button" onClick={() => navigate("home")}><Home size={16} /> Home / Switch Workspace</button><strong>{route === "hedge-fund" ? "Hedge Fund Accounting" : "Real Estate Fund Accounting"}</strong><PathwayChoice value={pathway} onChange={setPathway} /></div>
    <VisitorGate>{renderWorkspace(route, pathway)}</VisitorGate>
  </div>;
}
