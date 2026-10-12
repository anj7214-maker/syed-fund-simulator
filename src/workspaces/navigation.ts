export type AssetWorkspace = "hedge-fund" | "real-estate";
export type Pathway = "student" | "professional";
export type PortalRoute = AssetWorkspace | "home" | "not-found";

export function resolveRoute(pathname: string): PortalRoute {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/hedge-fund") return "hedge-fund";
  if (path === "/real-estate") return "real-estate";
  return "not-found";
}

export function splitNavigationEnabled(setting: string | undefined, search: string) {
  return setting !== "false" && new URLSearchParams(search).get("layout") !== "legacy";
}

export const hedgeEssentials = new Set([
  "aboutTool", "toolNavigator", "dashboard", "sandboxCommand", "scenario", "fund", "holdings", "trades",
  "pricing", "cashRecon", "positionRecon", "reconBreaks", "gl", "trialBalance", "nav", "capital",
  "workflow", "audit", "exports", "aiCopilot",
]);
export const realEstateEssentials = new Set([
  "Overview & Close", "Fund & Entity Structure", "Property Register", "Rent Roll & Receivables",
  "Property Expenses & Capex", "Cash & Bank Reconciliation", "Debt & Interest", "Valuation & Performance",
  "Capital Calls & Distributions", "Investor Accounting", "Consolidation", "Journals & General Ledger",
  "Trial Balance", "NAV Working & Movement Bridge", "Exceptions & Controls", "Approvals & Audit",
  "Sandbox Scenarios", "Practice Resources",
]);

const preferenceKey = "fundops-workspace-navigation-v1";
export interface PortalPreferences { pathway: Pathway; lastWorkspace?: AssetWorkspace; lastHedgeModule?: string }
export function readPreferences(storage: Pick<Storage, "getItem">): PortalPreferences {
  try {
    const value = JSON.parse(storage.getItem(preferenceKey) ?? "null");
    return {
      pathway: value?.pathway === "professional" ? "professional" : "student",
      lastWorkspace: ["hedge-fund", "real-estate"].includes(value?.lastWorkspace) ? value.lastWorkspace : undefined,
      lastHedgeModule: typeof value?.lastHedgeModule === "string" && value.lastHedgeModule !== "realEstate" ? value.lastHedgeModule : undefined,
    };
  } catch { return { pathway: "student" }; }
}
export function savePreferences(storage: Pick<Storage, "setItem">, value: PortalPreferences) {
  try { storage.setItem(preferenceKey, JSON.stringify(value)); } catch { /* Navigation remains usable without storage. */ }
}
