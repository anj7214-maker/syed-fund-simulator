# Syed Fund Simulator Enterprise SaaS Foundation

This phase adds the first production foundation around the existing frontend without redesigning the dashboard.

## What Was Added

- Local backend API service in `server/index.mjs`
- PostgreSQL institutional schema in `db/schema.sql`
- Docker API image in `Dockerfile.api`
- Local Postgres/API stack in `docker-compose.yml`
- Customer VPC Terraform starter in `infra/aws`
- Frontend API client in `src/services/institutionalApi.ts`

## Target Architecture

```text
Vercel UI
  |
  | OAuth2 bearer token + mTLS + tenant/fund headers
  v
Customer API Gateway
  |
  v
Private Backend API
  |
  +-- PostgreSQL with tenant RLS
  +-- Immutable audit trail
  +-- Maker-checker workflow queue
  +-- ETL landing zone and DLQ
```

## Local API

Run the API:

```cmd
npm run api
```

The API now persists approval queue, GL posting register, and audit hash events.

Default local mode:

```text
.data/syed-fund-api.json
```

Optional PostgreSQL mode:

```text
SYED_DATABASE_URL=postgres://syed:syed@127.0.0.1:5432/syed_fund
```

If PostgreSQL mode is enabled, the API creates the lightweight runtime tables shown in `db/api_persistence.sql`.

Health check:

```cmd
curl http://127.0.0.1:8787/health
```

The health response includes the active persistence mode:

```json
{
  "status": "ok",
  "service": "syed-fund-api",
  "persistence": "file"
}
```

Get approval queue:

```cmd
curl -H "Authorization: Bearer local-dev-token" http://127.0.0.1:8787/api/v1/workflow/approvals
```

## Local Docker Stack

```cmd
docker compose up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- API on `localhost:8787`

The database initializes from `db/schema.sql`.

## Maker-Checker Rule

The API enforces:

```text
maker_user_id must not equal checker_user_id
```

An analyst can submit an approval item. A different checker must approve it before it is eligible for downstream GL/NAV posting.

## Audit Trail Rule

The database schema creates `immutable_audit_trail` as append-only:

- updates are blocked
- deletes are blocked
- every insert gets a hash chained to the prior event

## Next Build Step

The next practical milestone is to connect the existing `Workflow Approval Queue` screen to:

```text
GET /api/v1/workflow/approvals
POST /api/v1/workflow/approvals
POST /api/v1/workflow/approvals/:id/approve
POST /api/v1/workflow/approvals/:id/reject
```

After that, approved break resolutions can flow into GL/NAV posting logic.

## Implemented UI Connection

The existing `Workflow Approval Queue` now includes a backend-connected section:

- loads approval records from `/api/v1/workflow/approvals`
- submits an AAPL short mismatch break resolution
- allows checker approve/reject actions
- blocks self-approval at API level
- writes backend audit hash events for submit/approve/reject
- allows approved workflow items to be posted into the backend GL posting register
- loads posted journal lines from `/api/v1/gl/postings`

## GL Posting Flow

After a checker approves an item, the UI shows `Post to GL`.

```text
Submit AAPL Break Resolution
  -> Checker Approve
  -> Post to GL
  -> Backend GL Posting Register
  -> Immutable audit hash event
```

The posting endpoint is:

```text
POST /api/v1/workflow/approvals/:id/post
```

Posting creates balanced debit/credit lines from the approved workflow item's `gl_impact`, marks the workflow item as `Posted`, and locks it from further approval actions.

Posted approvals and backend GL postings are now durable. To confirm:

```text
1. Submit, approve, and post an item in Workflow Approval Queue.
2. Stop the API terminal.
3. Start the API again.
4. Refresh the dashboard.
```

The posted workflow rows and Backend GL Posting Register should still be visible.

## Correction / Reopen Control

Posted GL items remain locked for audit integrity. If a posted item was incorrect, use:

```text
Reopen Correction
```

This does not edit or delete the original posting. It creates a new maker-checker correction workflow with the opposite NAV/GL impact, so a controller can approve and post a reversal or corrective entry through the same controlled process.

To test locally, run both:

```cmd
cmd /c npm run api
cmd /c npm run dev
```

Then open the dashboard and go to:

```text
Workflow Approval Queue
```
