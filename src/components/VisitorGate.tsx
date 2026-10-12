import { useState, type FormEvent, type ReactNode } from "react";

const storageKey = "syed-visitor-registration-v1";
const noticeVersion = "2026-10-12";
const notice = "We collect your name, email address, profile type, and college or professional details to provide access to the simulator, understand our users, and request feedback. With your separate consent, we may also email you about training programmes, product upgrades, and paid offerings. You can unsubscribe from promotional emails at any time.";

function hasRegistration() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return saved?.noticeVersion === noticeVersion && typeof saved?.registrationId === "string";
  } catch { return false; }
}

export function VisitorGate({ children }: { children: ReactNode }) {
  const [registered, setRegistered] = useState(hasRegistration);
  const [profile, setProfile] = useState("student");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const endpoint = import.meta.env.VITE_REGISTRATION_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8787/api/visitors" : "/api/visitors");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"), email: form.get("email"), profile,
          college: profile === "student" ? form.get("college") : "",
          industry: profile === "professional" ? form.get("industry") : "",
          company: profile === "professional" ? form.get("company") : "",
          accessConsent: form.get("accessConsent") === "on",
          marketingConsent: form.get("marketingConsent") === "on",
          noticeVersion,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.registrationId) throw new Error(result.error || "Registration could not be saved. Please try again.");
      try {
        localStorage.setItem(storageKey, JSON.stringify({ registrationId: result.registrationId, noticeVersion }));
      } catch { /* Access can continue when browser storage is unavailable. */ }
      setRegistered(true);
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TypeError" ? cause.message : "Registration service is unavailable. Please try again shortly.");
    } finally { setPending(false); }
  }

  if (registered) return children;
  return <div className="auth-shell">
    <section className="visitor-panel" aria-labelledby="visitor-title">
      <div className="auth-copy">
        <div className="brand-mark">SF</div>
        <h1 id="visitor-title">SYED FUND SIMULATOR</h1>
        <p>Tell us about yourself</p>
        <span className="visitor-subtitle">Enter your details to access the simulator.</span>
      </div>
      <form onSubmit={submit} className="visitor-form">
        <fieldset disabled={pending}>
          <label>Full name<input name="name" autoComplete="name" required maxLength={120} /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label>Profile<select name="profile" value={profile} onChange={(event) => setProfile(event.target.value)}>
            <option value="student">Student</option><option value="professional">Working Professional</option>
          </select></label>
          {profile === "student" ? <label>College name<input name="college" required maxLength={180} /></label> : <>
            <label>Industry<input name="industry" required maxLength={120} /></label>
            <label>Company name <span>(optional)</span><input name="company" autoComplete="organization" maxLength={180} /></label>
          </>}
          <div className="visitor-privacy"><h2>Privacy Notice</h2><p>{notice}</p>
            <p>To withdraw promotional consent, use the unsubscribe option in any promotional email. This form records visitor details; it does not verify your email or create a secure account.</p>
          </div>
          <label className="visitor-consent"><input type="checkbox" name="accessConsent" required /><span>I have read the Privacy Notice and agree to the use of my details for simulator access and feedback requests.</span></label>
          <label className="visitor-consent"><input type="checkbox" name="marketingConsent" /><span>I would like to receive emails about training programmes, product upgrades, and paid offerings. (Optional)</span></label>
          <button type="submit" className="terminal-button">{pending ? "Saving details..." : "Enter simulator"}</button>
        </fieldset>
        {error && <p role="alert" className="visitor-error">{error}</p>}
      </form>
    </section>
  </div>;
}
