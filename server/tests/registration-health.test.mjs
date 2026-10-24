import assert from "node:assert/strict";
import test from "node:test";
import handler, { databaseAvailable } from "../../api/registration-health.mjs";

const env = { SUPABASE_URL: "https://db.example.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-secret" };

test("health uses server credentials, HEAD and zero rows without reading records", async () => {
  let called = false;
  assert.equal(await databaseAvailable({ env, fetchImpl: async (url, init) => {
    called = true;
    assert.equal(url.pathname, "/rest/v1/visitor_registrations");
    assert.equal(url.searchParams.get("select"), "id");
    assert.equal(url.searchParams.get("limit"), "0");
    assert.equal(init.method, "HEAD");
    assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, "Bearer test-secret");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    return { ok: true, json() { throw new Error("Must not read visitor data"); } };
  } }), true);
  assert.equal(called, true);
});

test("health accepts Marketplace URL fallback", async () => {
  assert.equal(await databaseAvailable({ env: { NEXT_PUBLIC_SUPABASE_URL: env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY }, fetchImpl: async () => ({ ok: true }) }), true);
});

test("missing configuration and unsafe URLs fail without network access", async () => {
  for (const config of [{}, { SUPABASE_URL: env.SUPABASE_URL }, { ...env, SUPABASE_URL: "http://db.example.invalid" }, { ...env, SUPABASE_URL: "bad" }]) {
    let called = false;
    assert.equal(await databaseAvailable({ env: config, fetchImpl: async () => { called = true; } }), false);
    assert.equal(called, false);
  }
});

test("paused, inaccessible and timed-out databases fail", async () => {
  assert.equal(await databaseAvailable({ env, fetchImpl: async () => ({ ok: false }) }), false);
  assert.equal(await databaseAvailable({ env, fetchImpl: async () => { throw new Error("private diagnostic"); } }), false);
});

test("handler rejects writes and exposes no secrets or database records", async () => {
  const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } });
  const rejected = response();
  await handler({ method: "POST" }, rejected);
  assert.equal(rejected.statusCode, 405);
  assert.equal(rejected.headers.Allow, "GET");
  const keys = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const oldFetch = globalThis.fetch;
  Object.assign(process.env, env);
  try {
    for (const ok of [false, true]) {
      globalThis.fetch = async () => ({ ok });
      const res = response();
      await handler({ method: "GET" }, res);
      assert.equal(res.statusCode, ok ? 200 : 503);
      assert.equal(res.headers["Cache-Control"], "no-store");
      assert.deepEqual(res.body, { service: "registration-database", status: ok ? "ok" : "unavailable" });
    }
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
