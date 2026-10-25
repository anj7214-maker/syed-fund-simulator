export const mobileNavigationEnabled = import.meta.env.VITE_MOBILE_WORKSPACE_V2 !== "false";

export interface MobileArea { title: string; description?: string; items: { id: string; label: string }[] }

const taskAliases: [RegExp, string][] = [
  [/cash.*recon|bank.*recon/i, "cash break bank mismatch wire nostro"],
  [/position.*recon/i, "position break custody mismatch holdings difference"],
  [/pricing|valuation/i, "price stale mark valuation vendor"],
  [/general ledger|journal/i, "journal entry posting debit credit"],
  [/rent|lease|income.*expense|property.*account/i, "rent tenant lease property income"],
  [/workflow|approval/i, "approve signoff maker checker release"],
  [/fee/i, "fees management incentive hurdle hwm"],
];

export function recordLabel(values: { heading: string; value: string }[], index: number) {
  const identity = values.filter(value => /^(entity|account|currency|ticker|investor|investor name|trade id|id|file)$/i.test(value.heading) && value.value);
  return `${index + 1}. ${(identity.length ? identity : values).slice(0, 3).map(value => value.value).filter(Boolean).join(" / ") || "Record"}`;
}

export function searchAreas(areas: MobileArea[], query: string): MobileArea[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return areas;
  return areas.map(area => ({ ...area, items: area.items.filter(item => {
    const aliases = taskAliases.filter(([pattern]) => pattern.test(item.label)).map(([, terms]) => terms).join(" ");
    return words.every(word => `${area.title} ${item.label} ${aliases}`.toLowerCase().includes(word));
  }) })).filter(area => area.items.length);
}
