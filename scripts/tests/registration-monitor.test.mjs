import assert from "node:assert/strict";
import test from "node:test";
import { probe, notify, healthUrl } from "../check-registration-health.mjs";

const env = { GITHUB_REPOSITORY: "owner/project", GITHUB_TOKEN: "test-only-token", GITHUB_RUN_ID: "123" };
const incident = { number: 7, title: "[Monitor] FundOps Lab registration database unavailable", body: "<!-- fundops-registration-health-v1 -->", user: { login: "github-actions[bot]" } };
const fail = { ok: false, attempts: 3, reason: "HTTP 503" };

test("probe requires the exact database contract, not just an online homepage", async () => {
  const result = await probe({ fetchImpl: async (url, init) => {
    assert.equal(url, healthUrl);
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    return { ok: true, json: async () => ({ service: "registration-database", status: "ok" }) };
  } });
  assert.deepEqual(result, { ok: true, attempts: 1 });
});

test("transient failures retry then recover", async () => {
  let calls = 0; let sleeps = 0;
  const result = await probe({ fetchImpl: async () => ++calls === 1 ? { ok: false, status: 503 } : { ok: true, json: async () => ({ service: "registration-database", status: "ok" }) }, sleep: async () => { sleeps++; } });
  assert.deepEqual(result, { ok: true, attempts: 2 });
  assert.equal(sleeps, 1);
});

test("invalid JSON, wrong service, HTTP and network failures never pass", async () => {
  for (const reply of [async () => { throw new Error("secret-bearing error"); }, async () => ({ ok: true, json: async () => { throw new Error("bad JSON"); } }), async () => ({ ok: true, json: async () => ({ status: "ok" }) }), async () => ({ ok: false, status: 503 })]) {
    const result = await probe({ fetchImpl: reply, sleep: async () => {} });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 3);
    assert.ok(!result.reason.includes("secret"));
  }
});

function githubMock(issues) {
  const writes = [];
  return { writes, fetchImpl: async (url, init) => {
    assert.ok(url.startsWith("https://api.github.com/repos/owner/project/"));
    assert.equal(init.headers.Authorization, "Bearer test-only-token");
    if (init.method === "GET") return { ok: true, json: async () => issues };
    writes.push({ url, method: init.method, body: JSON.parse(init.body) });
    return { ok: true, json: async () => ({}) };
  } };
}

test("healthy state creates no issue or comment", async () => {
  const mock = githubMock([]);
  await notify({ ok: true }, { ...mock, env });
  assert.equal(mock.writes.length, 0);
});

test("failure opens one assigned incident; repeats do not spam", async () => {
  const mock = githubMock([]);
  await notify(fail, { ...mock, env });
  assert.equal(mock.writes.length, 1);
  assert.deepEqual(mock.writes[0].body.assignees, ["owner"]);
  assert.ok(mock.writes[0].body.body.includes("actions/runs/123"));
  const repeated = githubMock([incident]);
  await notify(fail, { ...repeated, env });
  assert.equal(repeated.writes.length, 0);
});

test("recovery comments and closes only marked bot incidents", async () => {
  const mock = githubMock([incident, { ...incident, number: 8, user: { login: "human" } }, { ...incident, number: 9, body: "Unrelated issue" }]);
  await notify({ ok: true }, { ...mock, env });
  assert.equal(mock.writes.length, 2);
  assert.ok(mock.writes[0].url.endsWith("/issues/7/comments"));
  assert.equal(mock.writes[1].method, "PATCH");
  assert.equal(mock.writes[1].body.state, "closed");
});

test("notification errors fail visibly without response body leaks", async () => {
  await assert.rejects(notify(fail, { env: {}, fetchImpl: async () => { throw new Error("Do not call"); } }), /configuration missing/);
  await assert.rejects(notify(fail, { env, fetchImpl: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
});
