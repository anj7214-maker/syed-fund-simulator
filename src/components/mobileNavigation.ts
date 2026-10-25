export const mobileNavigationEnabled = import.meta.env.VITE_MOBILE_WORKSPACE_V2 !== "false";

export interface MobileArea { title: string; description?: string; items: { id: string; label: string }[] }

export function searchAreas(areas: MobileArea[], query: string): MobileArea[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return areas;
  return areas.map(area => ({ ...area, items: area.items.filter(item => words.every(word => `${area.title} ${item.label}`.toLowerCase().includes(word))) })).filter(area => area.items.length);
}
