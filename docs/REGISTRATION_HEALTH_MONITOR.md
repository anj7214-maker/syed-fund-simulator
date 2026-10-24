# Registration Database Health Monitor

On 24 October 2026 the registration database was paused. The website loaded but
new visitors received HTTP 503. Resuming Supabase restored registration.

## Implementation

- GET /api/registration-health makes a server-side PostgREST HEAD query against
  visitor_registrations with select=id&limit=0. No rows, counts or personal data
  are returned. Only a service identifier and ok/unavailable status are public.
- Existing server-only Supabase credentials remain in Vercel, never in GitHub.
- No-cache responses, 8-second database timeout, no redirect or write operations.
- GitHub Actions runs every six hours, approximately 05:47, 11:47, 17:47 and 23:47
  Asia/Calcutta. Manual runs are available.
- Three attempts ten seconds apart before failure. One bot-authored GitHub issue
  is assigned to anj7214-maker on failure; no duplicate comments on repeats.
  Recovery comments and closes the same incident.
- Healthy runs are quiet. GitHub notification preferences determine delivery.
  No email sender or new credentials are required.
- The workflow uses contents:read and issues:write with a short-lived GitHub token.
  Checkout is pinned to a verified official commit; no npm installation is needed.

## Limits

This checks database/table reachability and server configuration, not a complete
registration INSERT or browser signup. No fake registrations are created.
Registration, privacy controls, workspaces and financial calculations are unchanged.

Activity may reduce inactivity-pausing risk; it is not guaranteed. Paid non-pausing
hosting remains the recommendation for commercial subscriptions. Public GitHub
schedules may be disabled after 60 days of repository inactivity, and scheduled
runs may be delayed. Review the enabled state monthly. Do not generate dummy
commits or registrations to evade service lifecycle rules.

The public endpoint incurs a bounded database query per request. It is not a
replacement for enterprise authentication, abuse protection or an uptime SLA.
The separate local institutional workflow API is not deployed by this change.

## Verify and Recover

1. Confirm Vercel Ready, then GET the production health URL for HTTP 200/status ok.
2. Manually run Registration database health in GitHub Actions; confirm success.
3. On failure check Supabase project status, provider incidents and existing Vercel
   server configuration. Resume a paused project without exposing keys.
4. Run the monitor after recovery to close its incident.
5. Disable the workflow to stop checks; revert only these six new files to remove
   this feature. Existing accounting and registration code need no changes.

Tests:
node --test server/tests/registration-health.test.mjs scripts/tests/registration-monitor.test.mjs

References:
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
