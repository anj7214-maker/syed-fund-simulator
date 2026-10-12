import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Building2, GraduationCap, Landmark, BriefcaseBusiness, GitBranch, ScanLine, Scale, TrendingUp, UserRound, Play } from "lucide-react";
import { HomeImpactDemo } from "./HomeImpactDemo";
import { WorkspacePreview } from "./WorkspacePreview";
import type { AssetWorkspace, Pathway } from "./navigation";
import "./premiumHome.css";

export function PremiumHome({ pathway, setPathway, navigate, lastWorkspace, videoEnabled }: { pathway: Pathway; setPathway: (value: Pathway) => void; navigate: (asset: AssetWorkspace) => void; lastWorkspace?: AssetWorkspace; videoEnabled: boolean }) {
  const [walkthrough, setWalkthrough] = useState<AssetWorkspace | null>(null);
  const choice = useRef<HTMLHeadingElement>(null); const demo = useRef<HTMLHeadingElement>(null);
  const focusSection = (target: typeof choice) => { target.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); target.current?.focus({ preventScroll: true }); };
  const assets = [
    { id: "hedge-fund" as const, title: "Hedge Fund", subtitle: "From market activity to a controlled NAV.", Icon: Landmark, steps: ["Trades", "Positions", "NAV"], purpose: "Work through pricing, cash and position breaks, journal entries, fees and investor capital.", action: "Explore Hedge Fund Practice" },
    { id: "real-estate" as const, title: "Real Estate", subtitle: "From property books to consolidated fund NAV.", Icon: Building2, steps: ["Property", "SPV", "Fund NAV"], purpose: "Connect rent, property expenses, debt, valuations and investor movements through the close.", action: "Explore Real Estate Practice" },
  ];
  const features = [
    { title: "Trades", Icon: GitBranch, text: "Follow transaction economics into positions and accounting entries." },
    { title: "Pricing", Icon: TrendingUp, text: "Challenge a mark and inspect the valuation and P&L consequences." },
    { title: "Reconciliation", Icon: ScanLine, text: "Investigate differences, support a correction and review exceptions." },
    { title: "NAV Impact", Icon: Scale, text: "Trace source changes through the book to the fund's net assets." },
  ];
  return <div className="portal-home premium-home">
    <header className="home-header"><a href="/" className="home-brand" aria-label="FundOps Lab Home"><img src="/brand/fundops-lab-icon.png" alt="" width={40} height={40} /><strong>FundOps Lab</strong></a><nav aria-label="Home navigation"><a href="#home-demo">See how it works</a><button className="home-button small" onClick={() => focusSection(choice)}>Start Practicing <ArrowUpRight size={16} /></button></nav></header>
    <main>
      <section className="home-hero"><img className="home-hero-mark" src="/brand/fundops-lab-icon.png" alt="" aria-hidden="true" /><div className="home-container home-hero-content">
        <h1>FundOps Lab</h1><p className="home-hero-outcome">Practice fund accounting.<br />Understand every NAV movement.</p>
        <p className="home-hero-description">Work through hedge fund and real estate accounting using connected books, operational exceptions, and visible financial impact.</p>
        <div className="home-hero-actions"><button className="home-button" onClick={() => focusSection(choice)}>Start Practicing <ArrowRight size={19} /></button><button className="home-text-button" onClick={() => focusSection(demo)}><Play size={17} /> See How It Works</button></div>
        <div className="home-founder"><UserRound size={18} /><span>Founded by <strong>Syed Ali Jafri</strong></span><span className="home-founder-credentials">ACSI ICA</span></div>
      </div></section>
      <section id="home-demo" className="home-section home-demo-section"><div className="home-container"><div className="home-section-heading"><h2 ref={demo} tabIndex={-1} className="home-section-title">One adjustment.<br />The whole book reacts.</h2><p>Explore the financial effect, not just the final number.</p></div><HomeImpactDemo /></div></section>
      <section className="home-section home-asset-section" id="home-workspaces"><div className="home-container"><div className="home-section-heading"><h2 ref={choice} tabIndex={-1} className="home-section-title">Choose your practice desk.</h2><div className="home-choice-pathway" role="group" aria-label="Practice pathway"><button aria-pressed={pathway === "student"} onClick={() => setPathway("student")}><GraduationCap size={16} />Student</button><button aria-pressed={pathway === "professional"} onClick={() => setPathway("professional")}><BriefcaseBusiness size={16} />Professional</button></div></div>
        <div className="home-asset-grid">{assets.map(asset => <article className="home-asset-card" key={asset.id}><div className="home-asset-identity"><asset.Icon size={36} strokeWidth={1.4} /><h3>{asset.title}</h3></div><p className="home-asset-subtitle">{asset.subtitle}</p><div className="home-asset-chain">{asset.steps.map((step, index) => <span key={step}>{step}{index < 2 && <ArrowRight size={16} aria-hidden="true" />}</span>)}</div><p className="home-asset-purpose">{asset.purpose}</p><button className="home-button" onClick={() => navigate(asset.id)}>{asset.action}<ArrowRight size={17} /></button><button className="home-walkthrough-link" onClick={() => setWalkthrough(asset.id)}><Play size={14} />Watch Sandbox Walkthrough</button></article>)}</div>
        {lastWorkspace && <button className="home-return-link" onClick={() => navigate(lastWorkspace)}>Continue your {lastWorkspace === "hedge-fund" ? "Hedge Fund" : "Real Estate"} workspace<ArrowUpRight size={16} /></button>}
      </div></section>
      <section className="home-section home-path-section"><div className="home-container"><h2 className="home-section-title">Your next step, at your level.</h2><div className="home-path-grid">
        <div><GraduationCap size={25} /><h3>Preparing for the desk</h3><p>Start with core books and NAV. Build the reasoning to explain a journal, investigate a break and discuss investor impact.</p><button className="home-text-button" onClick={() => { setPathway("student"); focusSection(choice); }}>Choose Student Pathway <ArrowRight size={16} /></button></div>
        <div><BriefcaseBusiness size={25} /><h3>Already on the desk</h3><p>Practice connected exceptions, evidence-led corrections, materiality review and maker-checker decisions across the operating floor.</p><button className="home-text-button" onClick={() => { setPathway("professional"); focusSection(choice); }}>Choose Professional Pathway <ArrowRight size={16} /></button></div>
      </div></div></section>
      <section className="home-section home-capabilities"><div className="home-container"><h2 className="home-section-title">Practice the work behind the number.</h2><div className="home-feature-grid">{features.map(feature => <div key={feature.title}><feature.Icon size={24} /><h3>{feature.title}</h3><p>{feature.text}</p></div>)}</div></div></section>
      <section className="home-section home-final-action"><div className="home-container"><h2 className="home-section-title">Make the next adjustment yours.</h2><button className="home-button" onClick={() => focusSection(choice)}>Start Practicing <ArrowRight size={19} /></button><p>Choose an asset class. Visitor registration is required to enter.</p></div></section>
    </main>
    <footer className="home-footer"><div className="home-container"><div className="home-footer-line"><a className="home-brand" href="/" aria-label="FundOps Lab Home"><img src="/brand/fundops-lab-icon.png" alt="" width={32} height={32} /><strong>FundOps Lab</strong></a><span>Founded by Syed Ali Jafri ACSI ICA</span><a href="/?home=classic">Classic Home</a></div><p>Synthetic-data simulation, not a live client-accounting service. Visitor registration is required to enter; it is not a verified login. Do not upload confidential employer or client data.</p><span>Copyright {new Date().getFullYear()} Syed Ali Jafri</span></div></footer>
    {walkthrough && <WorkspacePreview asset={walkthrough} title={walkthrough === "hedge-fund" ? "Hedge Fund Accounting" : "Real Estate Fund Accounting"} poster={`/workspace-previews/${walkthrough}.png`} expanded obscured={false} onExpand={setWalkthrough} staticOnly={!videoEnabled} />}
  </div>;
}
