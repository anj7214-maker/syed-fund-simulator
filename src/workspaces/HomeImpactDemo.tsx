import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Pause, Play, RotateCcw } from "lucide-react";
import type { AssetWorkspace } from "./navigation";
import { getHomeDemo } from "./homeDemo";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function HomeImpactDemo() {
  const [asset, setAsset] = useState<AssetWorkspace>("hedge-fund");
  const [movement, setMovement] = useState(-8);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const frame = useRef<HTMLDivElement>(null);
  const demo = useMemo(() => getHomeDemo(asset, movement), [asset, movement]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches); const visibility = () => setVisible(!document.hidden);
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting), { threshold: .1 });
    if (frame.current) observer.observe(frame.current);
    media.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); media.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (paused || reduced || !inView || !visible) return;
    const timer = setInterval(() => setPhase(p => (p + 1) % 4), 1800);
    return () => clearInterval(timer);
  }, [paused, reduced, inView, visible]);
  const isPaused = paused || reduced;
  const signedImpact = `${demo.impact > 0 ? "+" : ""}${usd.format(demo.impact)}`;
  return <div ref={frame} className="home-impact-tool">
    <div className="home-demo-toolbar">
      <div className="home-demo-modes" role="group" aria-label="Interactive demonstration asset class">
        <button aria-pressed={asset === "hedge-fund"} onClick={() => { setAsset("hedge-fund"); setPhase(0); }}>Hedge Fund</button>
        <button aria-pressed={asset === "real-estate"} onClick={() => { setAsset("real-estate"); setPhase(0); }}>Real Estate</button>
      </div>
      <span className="home-demo-label">Interactive demo / Synthetic data</span>
      <button className="home-icon-button" title={isPaused ? "Resume dependency highlight" : "Pause dependency highlight"} aria-label={isPaused ? "Resume dependency highlight" : "Pause dependency highlight"} disabled={reduced} onClick={() => setPaused(p => !p)}>{isPaused ? <Play size={18} /> : <Pause size={18} />}</button>
    </div>
    <div className="home-demo-adjustment">
      <div><strong>{demo.source}</strong><label htmlFor="home-market-move">{asset === "hedge-fund" ? "Price movement" : "Valuation movement"}</label></div>
      <input id="home-market-move" type="range" min={-12} max={12} step={1} value={movement} aria-label={demo.inputLabel} onChange={event => { setMovement(Number(event.target.value)); setPhase(0); }} />
      <output htmlFor="home-market-move" className="home-demo-percent">{movement > 0 ? "+" : ""}{movement}%</output>
      <button className="home-icon-button" aria-label="Reset demo movement" title="Reset demo movement" onClick={() => { setMovement(0); setPhase(0); }}><RotateCcw size={17} /></button>
    </div>
    <div className="home-dependency-flow">{demo.nodes.map((node, index) => <div className={`home-dependency-node${phase === index && !isPaused ? " traced" : ""}`} key={node.name}>
      <span className="home-node-index">{String(index + 1).padStart(2, "0")}</span><h3>{node.name}</h3>
      <span className="home-node-value-label">Baseline</span><span className="home-node-before">{usd.format(node.before)}</span><span className="home-node-value-label">Preview</span><strong>{usd.format(node.after)}</strong>
      {index < 3 && <ArrowRight className="home-node-arrow" size={18} aria-hidden="true" />}
    </div>)}</div>
    <div className="home-demo-result"><div><span>Projected NAV movement</span><strong className={demo.impact < 0 ? "home-negative" : demo.impact > 0 ? "home-positive" : ""} aria-live="polite">{signedImpact}</strong></div><span className="home-demo-check"><Check size={16} />{demo.balanced ? "Assets and liabilities tie to NAV" : "Review required"}</span></div>
    <p className="home-demo-explanation">{demo.explanation}</p>
    <details className="home-demo-sources"><summary>Where do these numbers come from?</summary><ul>{demo.sources.map(source => <li key={source}>{source}</li>)}</ul></details>
  </div>;
}
