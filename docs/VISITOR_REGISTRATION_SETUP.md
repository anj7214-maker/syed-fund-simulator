# Visitor registration setup

The public simulator now collects visitor details without Clerk or passwords.
This is a visitor form, not verified authentication. It is intended for the sample-data simulator.
Institutional APIs retain their existing separate authorization checks.

## Local use

1. Run `cmd /c npm run api` in one terminal and `cmd /c npm run dev` in another.
2. Open the local URL and complete the visitor form.
3. Registrations append to `.data/visitor-registrations.jsonl` (ignored by Git).
4. The browser remembers only a registration ID and notice version, not personal details.
5. Incognito or a different browser requires a new registration.

## Vercel storage setup

The deployment uses the Supabase Marketplace integration in Vercel. A free database named
`syed-visitor-registrations` is connected to the simulator's Production and Preview environments.
The API accepts the integration's `NEXT_PUBLIC_SUPABASE_URL` as the database URL;
`SUPABASE_SERVICE_ROLE_KEY` stays server-only. No credentials are recorded in this guide.
The registration table has row level security enabled with no public read policies.
For Vercel's SQL editor, wrap the schema script in `DO $$ BEGIN ... END $$;` to run multiple
schema statements in a single request.

1. Create a Supabase project at https://supabase.com/dashboard.
2. In its SQL Editor, run `db/visitor-registration.sql` from this repository.
3. Find the project URL and server service-role key in Supabase's project API settings.
4. In Vercel > project > Settings > Environment Variables, add:
   - `SUPABASE_URL`: the Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the server service-role key, stored as Secret.
5. Set them for Production and Preview (use a separate test database for previews when appropriate).
6. Neither variable may have a `VITE_` prefix. Never put the key into source code or chat.
7. Deploy the changes. Vercel serves `api/visitors.mjs` as `/api/visitors`.
8. Remove obsolete `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_APPROVED_EMAILS` variables after deployment.
9. Test a student and a professional registration, including one without marketing consent.
10. Confirm the rows appear in Supabase's Table Editor before sharing the site.

Without production database configuration the form shows a service error and does not claim details were saved.
An existing registration remains usable on that browser. No browser authentication is claimed.

## Feedback and promotion lists

Only administrators access registrations in Supabase; the public endpoint supports inserts only.
Export from the Table Editor/SQL Editor. There is no public download endpoint for contact information.

Each registration includes the consent choices, exact notice and consent text, server timestamp, and notice version.
An unchecked promotional checkbox is stored as `false` and must never be treated as permission to market.
Email addresses are self-reported and unverified. Use a confirmed subscription flow before starting promotional campaigns.

For the current promotional list, use the latest consent per email and exclude any email with a recorded withdrawal:

```sql
with latest as (
  select distinct on (email) * from public.visitor_registrations
  order by email, consent_at desc, id desc
)
select name, email, profile, college, industry, company, consent_at
from latest
where marketing_consent
and not exists (
  select 1 from public.visitor_registrations r
  where r.email = latest.email and r.marketing_withdrawn_at is not null
);
```

Provide a working unsubscribe link in every campaign through your email provider.
Record withdrawals for all matching email rows by setting `marketing_consent = false`
and `marketing_withdrawn_at = now()`. No promotional or feedback messages are sent automatically by this app.
Set a retention period and designate a contact for access/deletion requests before campaigning.
