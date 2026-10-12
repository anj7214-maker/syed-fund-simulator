import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play, X } from "lucide-react";
import type { AssetWorkspace } from "./navigation";
import { previewShouldPlay } from "./previewPolicy";

export function WorkspacePreview({ asset, title, poster, expanded, obscured, onExpand }: {
  asset: AssetWorkspace; title: string; poster: string; expanded: boolean; obscured: boolean; onExpand: (asset: AssetWorkspace | null) => void;
}) {
  const frame = useRef<HTMLDivElement>(null); const video = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false); const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [manual, setManual] = useState(false); const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false); const [ready, setReady] = useState(false); const [playing, setPlaying] = useState(false); const [failed, setFailed] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const expand = useRef<HTMLButtonElement>(null);
  const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const shouldPlay = !failed && previewShouldPlay({ obscured, inView, pageVisible, manual, paused, reducedMotion, saveData });
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(reduced.matches);
    const visibility = () => setPageVisible(!document.hidden);
    reduced.addEventListener("change", update); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting && entries[0].intersectionRatio >= .5), { threshold: [0, .5] });
    if (frame.current) observer.observe(frame.current);
    return () => { observer.disconnect(); reduced.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    const media = video.current;
    if (shouldPlay) { setLoaded(true); if (loaded) media?.play().catch(() => setPlaying(false)); }
    else media?.pause();
    return () => media?.pause();
  }, [shouldPlay, loaded]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExpand(null);
      if (event.key !== "Tab") return;
      const buttons = Array.from(frame.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") || []);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keys);
    return () => { document.removeEventListener("keydown", keys); if (previous?.isConnected) previous.focus(); else expand.current?.focus(); };
  }, [expanded, onExpand]);
  return <div ref={frame} className={`portal-preview-media${expanded ? " expanded" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? `${title} recorded preview` : undefined}>
    {expanded && <button ref={close} className="icon-btn portal-preview-close" aria-label="Close expanded preview" title="Close preview" onClick={() => onExpand(null)}><X size={20} /></button>}
    {!ready && <img className="portal-preview-poster" src={poster} alt={`${title} demonstration workspace`} width={1200} height={500} loading="lazy" />}
    <video ref={video} className={ready ? "portal-preview-video ready" : "portal-preview-video"} src={loaded ? `/workspace-previews/${asset}.webm` : undefined} poster={poster} autoPlay={shouldPlay} muted loop playsInline preload="metadata" aria-label={`Recorded ${title} Sandbox walkthrough`} aria-describedby={`preview-note-${asset}`} onCanPlay={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setReady(false); setPlaying(false); }} />
    <div className="portal-preview-caption"><span id={`preview-note-${asset}`}><span className={`portal-preview-signal${playing ? " running" : ""}`} aria-hidden="true" />{failed ? "Preview unavailable" : `Prerecorded Sandbox · ${playing ? "Running" : "Paused"}`}</span><div>
      <button className="icon-btn" disabled={failed} title={playing ? `Pause ${title} preview` : `Play ${title} preview`} aria-label={playing ? `Pause ${title} preview` : `Play ${title} preview`} onClick={() => { if (playing) { setPaused(true); video.current?.pause(); } else { setPaused(false); setManual(true); if (loaded) video.current?.play().catch(() => setPlaying(false)); } }}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
      {!expanded && <button ref={expand} className="icon-btn" disabled={!ready} title={`Expand ${title} preview`} aria-label={`Expand ${title} preview`} onClick={() => onExpand(asset)}><Maximize size={15} /></button>}
    </div></div>
  </div>;
}
