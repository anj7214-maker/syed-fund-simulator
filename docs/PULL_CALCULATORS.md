# FundOps Lab Pull Calculators

## Release Boundary
The public `/calculators` route is separate from Hedge Fund and Real Estate operating books. It requires no registration to calculate or inspect the mathematical trace. Existing workspace registration, permissions, exports, approvals, Copilot, accounting engines and Live/Sandbox storage are not changed.

This first release contains two synthetic scenario models, not an LPA interpretation service or investor-specific production engine. It must not be described as audited, audit-proof, a certified appraisal or investment advice.

## Financial Contracts
### Waterfall
- All LP capital is contributed at one inception date; GP has promoted interest but no co-investment in this model.
- European: a common capital/preference pool across dated exits. American: independent deal pools, with a final optional GP clawback against the same European-model entitlement.
- Preferred return is simple ACT/365 on outstanding capital; unpaid preference does not compound.
- Management fee uses original deal capital and holding days; paid from gross exit cash first. Insufficient cash leaves a displayed unpaid amount.
- Return of capital, preference, catch-up, then residual tiers. Catch-up percentage is the GP share during catch-up, not the ultimate carry rate. Zero disables catch-up; a positive rate must exceed first-tier carry.
- Residual tiers target annualized LP IRR on dated cash flows, not arbitrary profit bands. LP/GP split amounts settle to cents, with the residual assigned deterministically to LP.
- The explicitly selected property-linked exit derives cash from NOI/cap rate less bullet debt and simple accrued debt interest. Changing exit dates does not silently move the property link. Negative equity is displayed; cash available for distribution is floored at zero.
- Occupancy stress scales NOI from the current occupancy. No lease forecast, tax, transaction costs, debt amortization or interim rental distribution is implied.
- Clawback assumes full terminal GP recovery; tax caps, escrow, interim clawbacks and LPA-specific clauses are excluded. Negative final GP cash flow is possible. Preference/capital shortfalls are waterfall allocation categories, not enforceable debts.

### Hedge Fund NAV
- Fixed units, one investor pool, no capital flows, equalization, classes or benchmarks.
- Gross asset P&L is applied to net NAV plus the prior unpaid incentive liability.
- Management fees accrue ACT/365 on opening net NAV and are assumed paid each valuation period.
- Incentive eligibility requires positive profit above the HWM and the hard hurdle anchor. The hard hurdle accrues simply since the last crystallization.
- The new total incentive accrual replaces the old liability, including reversals after losses; it is not charged cumulatively a second time.
- Crystallization assumes payment. HWM only rises to a higher post-fee NAV/share, rounded to cents. Between crystallizations HWM is unchanged.
- Bridge: opening NAV + gross P&L - paid management - crystallized incentive paid - closing incentive accrual = closing NAV.

## Precision
Monetary inputs parse decimal strings directly to integer cents. BigInt rational multiplication handles money/rate/date allocations with explicit half-up cent settlement; rates are integer basis points. Inputs and aggregates are bounded to supported safe ranges. Dates are strict UTC ISO calendar dates. Fractional-year IRR necessarily uses numerical exponentiation and bisection; only conventional initial-outflow/subsequent-inflow series are supported. Undefined or out-of-range IRR is reported, not fabricated. IRR target payments round up once to a cent.

## Save, Sharing And Reports
Save/share/report actions reuse existing visitor registration, which is not verified authentication. Browser-local saved cases use a separate key and never write operational books. A portable public link embeds a versioned, canonical input snapshot in its URL fragment; the recipient recalculates using the same engine version. Only the selected model's edits are saved/shared; inactive models revert to the synthetic defaults rather than exposing unrelated inputs or blocking a valid report. Unknown properties are stripped. Malformed, oversized, invalid and incompatible snapshots are rejected.

These links are editable and unsigned, have no server-backed revocation, and may be forwarded. Explicit synthetic/non-confidential consent is required before copying one. They are not suitable for client data. Secure revocable sharing remains a separate backend release requiring verified owners, stored snapshots, access controls, revocation and expiry.

The free LP Scenario Sanity Report preview contains sensitivity, source assumptions, dated cash flows, complete mathematical trace and synthetic-data branding. The browser's Print / Save as PDF produces a PDF; this is not a server-certified report or a ledger audit trail.

## Monetization Boundary
Excel Pro details are visible but explicitly unavailable for purchase/download. No price, checkout, entitlement or payment success is fabricated. Formula-linked Excel, scheduled investor emails and advanced consolidated service access require a later paid release with verified accounts, server-side authorization, Razorpay/webhook validation, export reconciliation and independently reviewed workbook formulas. Existing workspace exports and consolidation are not retroactively paywalled.

## Measurement And Rollback
Anonymous event counters remain in this browser only: visits, incoming shared-link visits, first numeric edit, saves, copied links and report previews. They contain no email or model data and are not central conversion analytics. No new analytics network call is made.

To roll back, remove the calculator lazy route, Home calculator action and `/calculators` rewrite, then restore the previous navigation union. Operational books do not require migration or rollback. New files live under `src/calculators`, with `scripts/test-pull-calculators.mjs` as the isolated test suite.

## QC - 2026-10-13
- 42 new checks passed, including independent flat/tiered waterfall fixtures, dated IRR, fee crystallization/accrual reversal, clawback, 200 small cent-conservation samples, malformed snapshot rejection, active-only sharing and visitor-registration boundaries.
- All 89 existing checks passed: workspace navigation, Home demo, walkthrough policy and Real Estate accounting. Total: 131 checks.
- TypeScript passed. The standard production build is still blocked by the Windows runner's Vite `spawn EPERM`; the verification-only bundle succeeded. That bundle is never a production release.
- Browser checks covered calculator switching, invalid-input result suppression, input reset, save, report preview, consent gating and visible manual link-copy fallback. Automated snapshot encode/decode tests pass; clipboard-bridge restrictions prevented browser automation from testing automatic copy and recipient reopening. No claim of hosted/revocable sharing is made.
- A 360 CSS-pixel viewport had no page overflow, monetary figures remained single-line, and the 310px chart rendered. Mobile results screenshot capture timed out; results layout was inspected through DOM geometry. Physical-device and printed-PDF pagination checks remain outstanding.
- Independent finish review found three material issues. All were resolved, with source recheck and browser confirmation:

| Finding | Final Verdict | Evidence |
| --- | --- | --- |
| Relinking could restore stale proceeds | Resolved | Selector and handler refuse invalid input state; correcting and relinking retained the former derived USD3,759,835.62 value. |
| Relinking could hide an invalid field | Resolved | Invalid manual proceeds remain editable; selector is disabled until correction, then re-enabled. |
| Snapshot version/type accepted before canonicalization | Resolved | Both entry validators reject original discriminators; explicit regression test passed. |

The only mechanical design warning was incumbent Inter typography; retained to preserve the existing product identity. No source dependency, operational engine or global access-control change was made. This release is local only and has not been pushed or deployed.
