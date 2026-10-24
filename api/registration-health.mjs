export async function databaseAvailable({ env = process.env, fetchImpl = fetch } = {}) {
  const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return false;
  try {
    const url = new URL("/rest/v1/visitor_registrations?select=id&limit=0", base);
    if (url.protocol !== "https:") return false;
    // HEAD and zero rows exercise the table without returning visitor records.
    const response = await fetchImpl(url, {
      method: "HEAD", headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000), redirect: "error",
    });
    return response.ok;
  } catch { return false; }
}

export default async function registrationHealth(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed." }));
  }
  const ok = await databaseAvailable();
  res.statusCode = ok ? 200 : 503;
  res.end(JSON.stringify({ service: "registration-database", status: ok ? "ok" : "unavailable" }));
}

