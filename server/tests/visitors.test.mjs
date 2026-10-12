import assert from "node:assert/strict";
import test from "node:test";
import visitors, { validateVisitor, noticeVersion } from "../../api/visitors.mjs";

const sample = { name: "Test Visitor", email: "TEST@example.com", profile: "student", college: "Sample College", accessConsent: true, marketingConsent: false, noticeVersion };

test("student registration records opt-out and server consent evidence", () => {
  const row = validateVisitor(sample);
  assert.equal(row.email, "test@example.com");
  assert.equal(row.marketing_consent, false);
  assert.equal(row.industry, "");
  assert.ok(row.privacy_notice.includes("paid offerings"));
  assert.ok(Number.isFinite(Date.parse(row.consent_at)));
});

test("professional requires industry but company is optional", () => {
  const row = validateVisitor({ ...sample, profile: "professional", industry: "Finance", marketingConsent: true });
  assert.equal(row.company, "");
  assert.equal(row.college, "");
  assert.equal(row.marketing_consent, true);
  assert.throws(() => validateVisitor({ ...sample, profile: "professional" }));
});

test("rejects missing required consent, stale notice and invalid inputs", () => {
  for (const change of [{ accessConsent: false }, { noticeVersion: "old" }, { email: "bad" }, { college: " " }, { marketingConsent: "true" }, { name: "x".repeat(121) }]) {
    assert.throws(() => validateVisitor({ ...sample, ...change }));
  }
});

function response() {
  return { statusCode: 0, headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = JSON.parse(body); } };
}

test("public endpoint never exposes registration lists", async () => {
  const res = response();
  await visitors({ method: "GET" }, res);
  assert.equal(res.statusCode, 405);
});

test("production rejects registration when persistent storage is missing", async () => {
  const previous = { VERCEL: process.env.VERCEL, SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.VERCEL = "1";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const res = response();
    await visitors({ method: "POST", body: sample }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.registrationId, undefined);
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test("database save must succeed before registration is acknowledged", async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = "https://database.example.com";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key";
  try {
    let saved;
    globalThis.fetch = async (_url, request) => { saved = JSON.parse(request.body); return { ok: true }; };
    const success = response();
    await visitors({ method: "POST", body: sample }, success);
    assert.equal(success.statusCode, 201);
    assert.equal(saved.marketing_consent, false);
    assert.equal(success.body.registrationId, saved.id);
    assert.equal(success.body.email, undefined);
    globalThis.fetch = async () => ({ ok: false });
    const failure = response();
    await visitors({ method: "POST", body: sample }, failure);
    assert.equal(failure.statusCode, 503);
    assert.equal(failure.body.registrationId, undefined);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});
