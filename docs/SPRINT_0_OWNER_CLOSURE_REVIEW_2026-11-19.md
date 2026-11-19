# Sprint 0 hosted compatibility and owner closure review — 2026-11-19

## Evidence and boundary

This review supersedes the pending-policy and pending-final-CI checkpoints in
earlier dated records. It does not accept the sprint on behalf of the owner.
Validated application commit: `7608a711e6a7b6bcca6dc1c4db931033a5e161af`.
Documentation updates after that commit are not represented as a new tested
application commit. No application code, dependency, migration, hosted setting,
plan or paid service is changed by this review.

The owner explicitly confirms saved hosted Auth minimum **12** and required
**digits + lowercase + uppercase + symbols** for `jlaufrjmjjheisdqkkao`.
This is owner-verified dashboard evidence, not an automated management API read.
Secure password change, require-current-password, OTP expiration/length and
Free-plan leaked-password protection remain intentionally unchanged.

## Advisor reconciliation

Owner-supplied refreshed screenshots show **0 ERROR / 7 WARN / 1 INFO**,
compared with the original **0 / 14 / 1**. The retained warning identities and
per-function authorization dispositions remain those in the
[final control matrix](SPRINT_0_FINAL_VALIDATION_2026-11-19.md).

The six intentional authenticated definers are `accept_tenant_invitation`,
`administer_tenant_membership`, `create_tenant_with_admin`,
`current_user_has_permission`, `issue_tenant_invitation` and
`update_tenant_settings`. Preserve their reviewed authenticated-only execution,
no anonymous execution, `auth.uid()` identity, internal permission/tenant checks,
atomic audit and empty search path. Authentication alone is not authorization.
No grants or function bodies are changed to suppress warnings.

The seventh warning, leaked-password protection disabled on Free, remains a
documented development-only residual risk. No plan upgrade is requested.
The INFO screenshot identifies `app_private.rpc_write_windows`: RLS enabled
without a policy is intentional deny-by-default on private quota metadata;
schema/table client grants are revoked and protected internal functions perform
the writes. Adding client policies would weaken this boundary.

## Password and login compatibility

Signup and reset/update actions share the minimum-12, maximum-128, four-class
schema. The update action validates before calling `auth.updateUser`, requires a
verified user, rate limits the request and globally signs out after success.
FR/EN guidance and safe provider errors remain aligned. No password is trimmed.
The application maximum is an additional bounded-input constraint.

Login retains its existing minimum eight with no new character-class check;
existing eight-to-eleven-character login passwords remain accepted by its schema.
The historical six/seven-character login limitation is unchanged. Supabase
[documents](https://supabase.com/docs/guides/auth/password-security) that policy
updates apply to new passwords rather than invalidating existing login passwords.
The targeted schema suite was rerun: **36 passed**.

## Exact-commit CI reconfirmed

Both [PR run 44476901717](https://github.com/Edleben/ScoGes_App/actions/runs/44476901717)
and [push run 44476896057](https://github.com/Edleben/ScoGes_App/actions/runs/44476896057)
have successful Quality/security, Isolated integration/browser and Required
validation jobs. The PR run is reconfirmed against the exact validated SHA.

Actual final evidence: lint, typecheck and build pass; **202 unit/contract tests,
12 CI guards, 3 Redis tests and 38 E2E cases** pass. Fresh seven-migration install,
history/order verification, guarded privilege-migration replay, upgrade/data/ACL
preservation, concurrency, RLS/tenant isolation, actor/role authorization,
invitation lifecycle, onboarding and authorized administration pass. Full email
confirmation/recovery/invitation delivery journeys were executed against isolated
services with the same target Auth policy, not against real recipients.

## Hosted execution and decision

Hosted Auth and membership-schema connectivity each return HTTP 200.
The unchanged production application was served only on loopback port 3127 and
tested against the configured hosted development project after owner confirmation.
Synthetic accounts/tenants were created and cleaned by the existing test fixtures;
no schema, settings or real business records were changed. Hosted execution passed
sign-in/protected dashboard/sign-out, password update/global sign-out/old-password
rejection, invitation acceptance/replay protection, role/settings administration,
last-admin protection, FR/EN onboarding, tenant access and stale-write rejection.
Signup validation passed in FR/EN without sending real email; complete signup and
email recovery remain the isolated-CI evidence, not a newly claimed hosted email run.

The first hosted browser run was **21 passed / 2 failed**: the French invalid-login
case observed a safe service-unavailable response with a rate-limit-unavailable
event, and the administration case did not render revoked status within its
five-second assertion window. An explicit `--last-failed` run on the same code and
configuration passed **both cases (2/2)**, including the complete administration
and audit assertions. No retries, timeouts, assertions or security controls were
weakened. Do not describe this hosted run as a single clean 23/23 run or the hosted
environment as free of transient dependency/latency issues. Final isolated CI
remains 38/38 with no failed, flaky or skipped cases.

## Residual risks and final disposition

- FINAL-01 (hosted policy alignment): resolved by owner-confirmed saved settings,
  aligned shared schema, hosted password-update/login execution and matching
  target-policy isolated signup/reset/email journeys.
- FINAL-02 (exact-commit CI): resolved by the final green runs linked above.
- FINAL-03: leaked-password protection remains disabled on Free; documented
  development-only residual, no upgrade requested or performed.
- FINAL-04/05: password-change step-up/current-password, OTP and existing
  operational/backup/recovery dispositions remain future exposure gates and owner
  closure-review items. No new acceptance or production readiness is inferred.
- HOSTED-TRANSIENT: intermittent rate-limit availability/UI network latency was
  observed; failed cases subsequently passed unchanged. Track for operational
  readiness before public exposure. No cross-tenant access, anonymous privileged
  execution, spoofed actor or unauthorized escalation was observed.

**SPRINT 0 SECURITY/QUALITY GATE PASSED — READY FOR OWNER CLOSURE REVIEW**

This is bounded development-only technical readiness. No merge, deployment,
public preview, real-data pilot, production launch, plan upgrade or Sprint 1 is
authorized. Owner operational-risk dispositions and final sprint acceptance remain
separate from technical security/quality readiness.

## Explicit owner acceptance and merge verification

The owner now explicitly accepts formal **development-only closure**, including
the documented residual risks and their existing future-gate dispositions. This
supersedes pending owner acceptance above; no security test, tenant isolation,
authorization requirement or unresolved HIGH vulnerability is waived. The owner
previously confirmed the hosted 12/four-class policy; no subsequent change is
reported or inferred. The audit rerun during transition again reports zero
findings at every severity.

GitHub reports PR #11 merged on 2026-11-19, head exactly
`7608a711e6a7b6bcca6dc1c4db931033a5e161af`, merge commit
`5a346d060a9cd95f793a5de59db4324faf1f3f61`. The merge tree equals the validated
head tree; main contains its ancestry. Merge run
[44550187309](https://github.com/Edleben/ScoGes_App/actions/runs/44550187309)
has successful quality/security, isolated integration/browser and Required
validation jobs. No new merge was initiated by the agent. Review submissions and
review threads are empty. Main is protected and advertises Required validation;
the full administrative protection endpoint is access-denied, so no claim is
made to have re-audited every branch rule. No protection was bypassed or changed.

The approved tracker transition is prepared in this follow-up, including both
languages and the Markdown/UI synchronization test. Formal completion of the
requested workflow still requires publishing this closure follow-up through a
protected PR and verifying its checks and final working state. Do not claim the
new closure documents are already on main. Sprint 1 planning waits for that
completion; no Sprint 1 implementation is authorized.
