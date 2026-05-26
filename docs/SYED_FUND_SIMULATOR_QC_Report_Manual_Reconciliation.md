# SYED FUND SIMULATOR QC Report

## Scope

QC focus requested:

1. Manual input changes should reconcile across all relevant tabs.
2. If a settlement/reconciliation break amount becomes zero, status should update correctly.
3. Reset Book should not be available in Live Mode; it should only be available in Sandbox.

## Immediate Fixes Applied

### 1. Reset Book visibility

Status: Fixed locally.

Change:

- `Reset book` now appears only when the simulator is in `Sandbox`.
- In `Live Mode`, the reset action is hidden to preserve institutional operating discipline.

Rationale:

Live Mode should behave like a production oversight environment. A full book reset is a training/sandbox control, not a live operations control.

Files changed:

- `src/App.tsx`

### 2. Cash reconciliation status when matched

Status: Fixed locally.

Change:

- Cash reconciliation now checks both:
  - Internal Ledger Cash vs Custodian Cash
  - Internal Ledger Cash vs Prime Broker Cash
- If both differences are below tolerance, the row status becomes `Resolved` unless already `Approved`.
- If a previously resolved row becomes unmatched again, status moves back to `Investigating`.
- The screen now shows separate `Custodian Difference` and `PB Difference`.

Files changed:

- `src/store/fundStore.ts`
- `src/App.tsx`

### 3. Position reconciliation / settlement status when matched

Status: Fixed locally.

Change:

- Position reconciliation now checks:
  - Internal Position vs Custodian Position
  - Internal Position vs Prime Broker Position
- If both differences are below tolerance:
  - Status becomes `Resolved` unless already `Approved`.
  - Settlement Status becomes `Settled`.
- If a previously resolved row becomes unmatched again:
  - Status moves back to `Investigating`.
  - Settlement Status moves to `Pending Settlement` if it had been auto-settled.
- The screen now shows separate `Custodian Difference` and `PB Difference`.

Files changed:

- `src/store/fundStore.ts`
- `src/App.tsx`

## Build Verification

Status: Passed.

Command run:

```cmd
cmd /c npm run build
```

Result:

- TypeScript build passed.
- Vite production build passed.
- Existing dependency warnings about ignored `"use client"` directives remain non-blocking.

## QC Findings Across Tabs

### A. Manual input propagation is partially connected, not yet fully centralized

Severity: High.

Observation:

Manual edits currently update the relevant source table and set `impactedModules`, audit trail, and impact snapshot. The recalculation hook recalculates NAV outputs from the current Zustand store. This works well for:

- Holdings / pricing
- FX
- Trades
- Investor capital
- Corporate actions
- Derivatives / MTM
- Fees
- Backend GL postings

However, reconciliation status and operational breaks are not governed by one centralized rules engine yet. Some modules recalculate values correctly, but status, break queues, and approval state may remain stale unless explicitly updated.

Recommended fix:

Create a single `submitManualUpdates` reconciliation orchestrator that runs after every manual submit:

1. Recalculate NAV.
2. Reconcile source module rows.
3. Recompute break status.
4. Update central break queue.
5. Update exceptions.
6. Update workflow blockers.
7. Update audit trail.
8. Refresh NAV Pack export source data.

### B. Break register is not fully synchronized with source reconciliation rows

Severity: High.

Observation:

Cash and position tabs have their own row statuses. The centralized break dashboards use `store.breaks`. Resolving a source row does not always close or reduce the matching central break item because there is no persistent relationship between source recon row IDs and break IDs.

Recommended fix:

Add explicit linkage:

- `sourceModule`
- `sourceRowId`
- `sourceField`
- `breakId`
- `resolvedBy`
- `resolvedAt`

Then when a source row resolves, the linked break should move to `Resolved`, reduce NAV impact to zero if appropriate, and no longer block NAV release.

### C. GL/TB/NAV logic is recalculated, but some operational statuses remain manual

Severity: Medium.

Observation:

GL, TB, P&L, Balance Sheet, NAV, fees, and investor capital are recalculated from the live store. Operational status fields such as trade status, corporate action posting status, workflow status, and break status are still partly user-controlled.

Recommended fix:

Keep human status fields, but add derived controls:

- `Computed Status`
- `Manual Status`
- `Control Result`

This gives realism: operations can mark something as resolved, but the system can still show whether the underlying data actually ties out.

### D. Investor capital edits now move NAV, but investor activity and shares need tighter validation

Severity: Medium.

Observation:

Investor capital edits feed NAV through investor capital and shares feed NAV/share. However, the system should also validate:

- Investor capital equals NAV.
- Shares outstanding match capital activity.
- Subscriptions/redemptions reconcile to investor register.
- Fees reconcile to investor-level fee schedules.

Recommended fix:

Add investor capital control checks after manual submit.

### E. Corporate actions are editable and flow to accruals, but cash-settlement and recon linkage should be strengthened

Severity: Medium.

Observation:

Corporate action edits update accruals and NAV through income/receivable logic. The next improvement should link corporate action settlement to:

- Cash reconciliation.
- Receivable clearing.
- Break management.
- GL postings.

Recommended fix:

When `Posting Status = Cash Settled`, the cash recon and break queue should update automatically.

### F. Reset behavior is now correctly scoped, but persisted local data may still show old values until reload/reset

Severity: Low.

Observation:

The app uses persisted IndexedDB state. Users with old local state may still see prior statuses until they edit, reload, or use Sandbox reset.

Recommended fix:

Add a versioned migration or a small "Refresh control statuses" action in Sandbox / admin tools.

## Recommended Next Implementation

The highest-value next change is a centralized Manual Submit QC Engine:

```text
Manual edit
-> Submit Manual Update
-> Recalculate NAV
-> Recompute source row status
-> Recompute central breaks
-> Recompute exceptions
-> Recompute materiality
-> Recompute approval blockers
-> Write audit event
-> Update export source data
```

This will address the user's main concern that all tabs should reconcile consistently after manual input.

## Current Status

Local changes are implemented and build successfully. They still need to be committed and pushed before Vercel reflects them.
