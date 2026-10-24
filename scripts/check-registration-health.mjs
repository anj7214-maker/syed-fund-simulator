import { pathToFileURL } from "node:url";
import { appendFile } from "node:fs/promises";

export const healthUrl = "https://syed-fund-simulator.vercel.app/api/registration-health";
const issueTitle = "[Monitor] FundOps Lab registration database unavailable";
const issueMarker = "<!-- fundops-registration-health-v1 -->";

export async function probe({ fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  let reason = "Network error or timeout";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetchImpl(healthUrl, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const body = await response.json();
        if (body.service === "registration-database" && body.status === "ok") return { ok: true, attempts: attempt };
        reason = "Unexpected health response";
      } else { reason = `HTTP ${response.status}`; }
    } catch { reason = "Network error, invalid JSON or timeout"; }
    if (attempt < 3) await sleep(10000);
  }
  return { ok: false, attempts: 3, reason };
}

export async function notify(result, { fetchImpl = fetch, env = process.env } = {}) {
  const repo = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || "") || !env.GITHUB_TOKEN) throw new Error("GitHub notification configuration missing");
  const runUrl = `https://github.com/${repo}/actions/runs/${env.GITHUB_RUN_ID}`;
  const api = async (path, method = "GET", body) => {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
      method,
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000), redirect: "error",
    });
    if (!response.ok) throw new Error(`GitHub notification failed (HTTP ${response.status})`);
    return response.status === 204 ? null : response.json();
  };
  const issues = await api("/issues?state=open&creator=github-actions%5Bbot%5D&per_page=100");
  const open = issues.filter(issue => !issue.pull_request && issue.title === issueTitle && issue.body?.includes(issueMarker) && issue.user?.login === "github-actions[bot]");
  if (!result.ok && !open.length) {
    await api("/issues", "POST", {
      title: issueTitle,
      body: `${issueMarker}\nRegistration database checks failed after ${result.attempts} attempts (${result.reason}).\n\nNew visitors may be unable to enter either workspace.\n\nCheck Supabase for pausing or an outage and verify the registration configuration in Vercel. Do not bypass registration or disclose credentials.\n\n[Check run](${runUrl})\n\nThis issue closes automatically after a successful check.`,
      assignees: [env.HEALTH_ALERT_USER || repo.split("/")[0]],
    });
    return "Opened failure alert";
  }
  if (result.ok && open.length) {
    for (const issue of open) {
      await api(`/issues/${issue.number}/comments`, "POST", { body: `Recovered: the read-only registration database check passed. No visitor rows were created or returned.\n\n[Recovery check](${runUrl})` });
      await api(`/issues/${issue.number}`, "PATCH", { state: "closed", state_reason: "completed" });
    }
    return "Closed recovered alert";
  }
  return result.ok ? "Healthy; no notification needed" : "Existing alert remains open; no duplicate notification";
}

async function main() {
  const result = await probe();
  console.log(result.ok ? `Database healthy (${result.attempts} attempt(s))` : `Database unavailable: ${result.reason}`);
  let notification;
  try { notification = await notify(result); }
  catch (error) { notification = error.message; process.exitCode = 1; }
  console.log(notification);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Registration database health\n\n${result.ok ? "PASS" : "FAIL"} after ${result.attempts} attempt(s). ${notification}.\n\nRead-only database/table availability check; not a full registration-write test. No visitor data is returned.\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("Registration monitor failed; inspect configuration and workflow logs."); process.exitCode = 1; });
}
