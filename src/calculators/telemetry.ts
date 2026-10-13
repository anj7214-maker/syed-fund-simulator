export type FunnelEvent = "calculator_visit" | "shared_link_visit" | "first_numeric_edit" | "case_saved" | "share_link_copied" | "report_previewed" | "pro_details_opened";
export function recordFunnel(event: FunnelEvent) {
  try {
    const key = "fundops-calculator-funnel-v1";
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
    const prior = typeof stored[event] === "number" && Number.isSafeInteger(stored[event]) && stored[event] >= 0 ? stored[event] : 0;
    localStorage.setItem(key, JSON.stringify({ ...stored, [event]: Math.min(prior + 1, 1000000) }));
  } catch { /* Local-only diagnostics must never block the calculator. */ }
}
