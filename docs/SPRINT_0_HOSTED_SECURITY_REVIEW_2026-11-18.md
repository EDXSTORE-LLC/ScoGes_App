# Sprint 0 hosted security verification — 2026-11-18

## Scope, sources and STABLE assessment

Bounded verification of Supabase project `jlaufrjmjjheisdqkkao`; no runtime
refactoring, new migration, hosted Auth change, paid action, plan change, public
deployment, pilot, PR merge or Sprint 1. Existing uncommitted remediation work is
preserved on `edwakson/ScoGes_App`.

Sources: owner-authored dashboard verification supplied after the remediation;
the original 14-warning CSV; the applied append-only migration
`20261118151125_security_advisor_function_privileges.sql`; fresh TLS-verified
database catalog/ACL inspection and repository tests. The hosted migration SQL
still exactly matches the repository file. The connector remains unavailable;
that is an access limitation, **not a security defect**. No credentials, personal
data or additional connector permissions were requested for this review.

The owner verified a refreshed hosted Security Advisor result:

| Level | Before | After |
| ----- | -----: | ----: |
| ERROR |      0 |     0 |
| WARN  |     14 |     7 |
| INFO  |      1 |     1 |

These counts are owner-verified dashboard evidence, not an agent-run Advisor
report. The owner supplied counts, not refreshed individual rows. The warning
mapping below reconciles the original named findings with current independent
catalog evidence and the owner-confirmed leaked-password setting. The INFO
item's name/object was not supplied and is not invented or declared resolved.
Warning-count reduction alone does not establish closure.

Goal: validate the narrow remediation, reconcile remaining exposures and assess
Auth compatibility against secure-by-default Sprint 0 requirements. Main risks:
privileged RPC access, weak direct-Auth password policy, password-change takeover,
expired/replayed invitations, provider configuration incompatibility and existing
dependency/required-check failures. Plan: inspect, test actual roles/HTTP denial,
record per-object dispositions, propose staged owner actions, preserve all gates.

## Remaining seven warnings

For all six function findings: exact lint is
`0029_authenticated_security_definer_function_executable`; owner is `postgres`;
effective EXECUTE is available to `authenticated` and the owner, not PUBLIC,
anon or service_role. `SECURITY DEFINER` is retained; `search_path = ''` and
schema-qualified relations protect name resolution. Direct PostgREST invocation
is intentional and is **not** authorization by itself. Identity comes from
`auth.uid()`, not caller metadata. Each function enforces the following guards.

| Affected public function (identity arguments)                     | Why definer is required                                                                                            | Internal authorization and tenant validation                                                                                                                                                                                                                                                                    | Disposition / gate                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create_tenant_with_admin(text,text,text,text,text,text,uuid)`    | Atomic protected profile, new tenant, settings, admin membership and audit inserts before caller has a membership. | Requires non-null Auth principal and an existing Auth user; compatibility actor must equal `auth.uid()`. All persisted actor/owner IDs derive from that principal. Tenant ID is newly generated; caller cannot select an existing tenant or another administrator. Constraints and audit quota remain enforced. | Intentionally retained and justified; no independent development blocker after tests. Review before any expansion.                                                                                                                         |
| `current_user_has_permission(uuid,text)`                          | Reads protected membership/role authorization data without recursive membership RLS evaluation.                    | Returns true only for caller's active membership in the exact target tenant and database-assigned permission. Inactive/revoked/other-tenant memberships return false; no user-editable metadata.                                                                                                                | Intentionally retained and justified; no independent development blocker.                                                                                                                                                                  |
| `accept_tenant_invitation(text)`                                  | Atomic protected membership/role/profile/invitation/audit writes.                                                  | Verified Auth email matches locked pending, unexpired invitation; SHA256 token digest, tenant active, inviter still active with both permissions, admin-role authority rechecked. Tenant and role come from stored invitation; one-time status, tenant lock and audit prevent replay/partial acceptance.        | Intentionally retained and justified; no independent development blocker.                                                                                                                                                                  |
| `administer_tenant_membership(uuid,uuid,timestamptz,text[],text)` | Atomic protected role/status updates and audit, with shared tenant locking.                                        | Active principal and exact tenant permission before/after tenant lock; target membership must belong to that tenant. Explicit role allowlist/admin authority, stale revision and last-active-admin invariants.                                                                                                  | Intentionally retained and justified; no independent development blocker.                                                                                                                                                                  |
| `issue_tenant_invitation(uuid,text,text)`                         | Protected invitation/digest/audit creation without general client table-write grants.                              | Caller requires active exact-tenant membership with both `users.invite` and `users.manage_roles`; active tenant, tenant-scoped role and admin-role restriction. Normalized email, cooldown/pending replacement, expiry, digest and quotas remain enforced.                                                      | Intentionally retained and justified; no independent development blocker.                                                                                                                                                                  |
| `update_tenant_settings(uuid,timestamptz,text,text,text,text)`    | Atomic protected settings and audit writes.                                                                        | Active exact-tenant membership with `tenant.settings.write`, permission recheck under tenant lock, stale revision, country/currency syntax, database-valid timezone and FR/EN locale.                                                                                                                           | Intentionally retained and justified; no independent development blocker.                                                                                                                                                                  |
| Auth: `auth_leaked_password_protection`                           | Not a database function; EXECUTE/search_path/definer are not applicable.                                           | Owner confirms disabled on Free plan. No alternative breached-password protection is claimed.                                                                                                                                                                                                                   | Plan-constrained development-only residual, not fixed/suppressed and not newly owner-accepted. Public preview requires explicit security disposition; real-data pilot/production remain blocked pending approved protection/plan decision. |

The exact parameter names and complete body review are in
[the remediation record](SECURITY_ADVISOR_2026-11-18.md).

Resolved exposures: all four original 0028 anonymous findings; 0029 exposure on
`rls_auto_enable()` (owner/internal only), `record_invitation_delivery(uuid,text,boolean)`
(invoker/service_role only), and `invite_tenant_member(uuid,text,text,uuid)`
(guarded invoker compatibility wrapper). Current catalog inspection finds **zero**
public definer functions executable by anon, no PUBLIC execute on flagged
functions, and zero application/private tables lacking RLS. The enabled RLS event
trigger remains effective. Delivery is not callable by ordinary authenticated
clients and derives audit attribution from the invitation creator. No suppression
or blanket invoker conversion was used.

## Owner-verified hosted Auth configuration and gate matrix

No hosted values beyond the following are inferred. Rate-limit numbers, MFA,
session lifetimes and other provider settings were not supplied or reconfigured.
"Conditional development" below is an engineering disposition proposal; it is
not an accepted exception or authorization to close the sprint.

| Item / current value                                 | Development disposition                                                                                                                                        | Before public preview                                                                                                                                  | Before real-data pilot                                        | Before production                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Email provider: enabled                              | Acceptable for implemented email auth.                                                                                                                         | Retain; validate deployment delivery.                                                                                                                  | Retain; operational delivery monitoring.                      | Retain; operational delivery monitoring.                        |
| Email confirmation: enabled                          | Acceptable; retain.                                                                                                                                            | Required; retain and verify flows.                                                                                                                     | Required.                                                     | Required.                                                       |
| Minimum password length: **6**                       | **Sprint 0 blocker**; no existing accepted password exception, below secure-default guidance. App's eight-character rule does not constrain direct Auth calls. | Set **12** and align application/tests.                                                                                                                | At least approved 12-character target.                        | At least approved 12-character target; review policy over time. |
| Required character classes: **none configured**      | Part of the same **Sprint 0 password-policy blocker**; no exception accepted.                                                                                  | Select **digits + lowercase + uppercase + symbols** and align validation/messages.                                                                     | Retain approved target.                                       | Retain approved target; review policy over time.                |
| Secure email change: **enabled**                     | Acceptable; retain.                                                                                                                                            | Retain and verify controlled changes.                                                                                                                  | Required.                                                     | Required.                                                       |
| Secure password change: **disabled**                 | Conditional nonpublic-development deferral only; no acceptance inferred. Existing verified-user check is not recent reauthentication.                          | Implement/test provider-supported recent reauthentication/nonce or an explicitly reviewed equivalent before enabling exposure.                         | Required tested step-up protection.                           | Required tested step-up protection.                             |
| Require current password when updating: **disabled** | Conditional nonpublic-development deferral only. Ordinary password changes and forgotten-password recovery must be distinguished.                              | Require current password or reviewed equivalent step-up for ordinary in-session changes; preserve separately verified recovery. Do not blindly toggle. | Required equivalent protection with recovery tests.           | Required equivalent protection with recovery tests.             |
| Leaked-password protection: **disabled**             | Plan-constrained residual on Free; no fabricated mitigation or new acceptance.                                                                                 | Explicit security decision/protection required before public exposure; no automatic upgrade.                                                           | Blocking pending approved protection/plan decision.           | Blocking pending approved protection/plan decision.             |
| Email OTP expiration: **3600 seconds**               | Conditional development-only residual; one-hour bearer-code window is not a proven exploit, but permits a longer interception/replay opportunity.              | Owner/security approve shorter bounded lifetime; recommend **600 seconds** after controlled confirmation/recovery delivery testing.                    | Approved shortened lifetime and expiry/replay tests required. | Same, with delivery/abuse monitoring.                           |
| Email OTP length: **8 digits**                       | Acceptable length; retain.                                                                                                                                     | Retain; verify attempt limits/expiry and code/link behavior.                                                                                           | Retain with tested abuse controls.                            | Retain with monitored abuse controls.                           |

The 600-second OTP value is a **recommendation**, not a new observed hosted
setting or a previously approved requirement. Eight-digit codes alone do not
prove brute-force resistance; hosted attempt/rate-limit settings were not given.
Email OTP settings must not be confused with application tenant-invitation token
expiry (currently 14 days in the database).

## Password-policy compatibility and safest change procedure

[Current Supabase password documentation](https://supabase.com/docs/guides/auth/password-security)
describes strengthened requirements for new/reset passwords and says existing
users can still sign in with old passwords, with weak-password feedback. This is
provider behavior, not a successful test of a strengthened setting on this project.
Do not claim retroactive password rehash, forced rotation, session revocation or
existing-account compliance. Password hashes cannot establish which users meet
the target; do not export hashes or request passwords to inventory them.

Affected code/tests:

- `src/modules/identity/schemas.ts`: sign-in, signup and reset currently use min 8;
  new-password schemas accept eight-to-eleven-character and missing-class values.
- `src/components/auth/auth-form.tsx`: all password fields currently advertise min 8.
  Signup/reset need the target; applying 12 to **login** would unnecessarily block
  existing eight-to-eleven-character accounts that the provider still permits.
  Existing six/seven-character provider accounts already cannot use the app's
  min-8 login form; that pre-existing mismatch must be accounted for by controlled
  recovery, not assumed absent.
- `src/modules/identity/auth-messages.ts`: FR/EN guidance says eight characters;
  align new-password guidance without misleading existing-user login guidance.
- `src/modules/identity/actions.ts`: signup already maps provider `weak_password`
  to a safe localized error. Reset has a generic failure; sign-in only checks
  `error`. The installed Auth SDK's `signInWithPassword` returns successful-session
  weak-password feedback as `data.weakPassword` when provided; the action does not
  consume it. This is not automatically a sign-in error. Exercise that feedback
  and recovery guidance when implementing policy alignment.
- `tests/e2e/authenticated.spec.ts`: generated hosted fixtures use UUID + `Aa1!`
  or `Bb2!` (40 characters), satisfying the proposed length/classes. Existing
  environment overrides must meet the target; their secret values were not read
  or printed for this assessment.
- `scripts/ci/export-environment.mjs`: disposable CI uses 24 random bytes as hex
  plus `Aa1!`/`Bb2!` (52 characters); email-lifecycle fixtures consume these.
- `src/modules/identity/actions.test.ts`: mocked `password123` fixtures do not
  prove hosted compatibility and will need adjustment for positive signup/reset
  cases when schemas change. Preserve short/missing-class/mismatch negative tests.
- `tests/e2e/auth-public.spec.ts`: intentional mismatch values are negative tests,
  not credentials to upgrade blindly. `supabase/config.toml` remains min 8 for
  disposable CI and must be aligned in the approved policy change.

Safe sequence, **proposed and not executed**:

1. Owner authorizes a small Sprint 0 password-policy alignment change: new-password
   validation/minimums and FR/EN guidance, preserving existing-user login and recovery;
   focused length/class/weak-password tests and disposable Auth policy config.
2. Verify generated fixture compatibility and controlled account sign-in/reset,
   without enumerating real users or changing their passwords. Any legacy account
   migration uses a controlled recovery plan, not a blanket reset.
3. Run confirmation, recovery, invitation acceptance, existing-user login and new
   password tests against the target on disposable Supabase. Resolve user-safe
   errors before the hosted change. No current account is silently invalidated.
4. Exact owner dashboard action: in project `jlaufrjmjjheisdqkkao`, Authentication
   → Email provider settings, set minimum password length to **12**, select
   **digits + lowercase + uppercase + symbols**, then save. This requires no plan
   change. Keep email confirmation and secure email change enabled. Do not change
   the password-change toggles or OTP lifetime in this same untested step.
5. Record the non-secret saved values and verify controlled new signup/reset
   rejection/acceptance plus existing-user login/recovery. No external test email
   is sent without specific recipient authorization. Re-run applicable checks.
6. Treat password-change reauthentication/current-password support as a separate
   bounded change: current action sends neither `nonce` nor `current_password`;
   turning on provider enforcement can break stale-session changes and potentially
   recovery. Test provider behavior and recovery exceptions rather than assuming
   them. Propose the shortened OTP lifetime only after delivery/expiry testing.

Strengthening length/classes is feasible within Sprint 0 as a small coordinated
change, but **is not implemented or authorized for automatic hosted execution by
this verification task**. The current minimum six/no-class configuration is not
recorded as accepted risk: AGENTS.md secure-by-default rules and the closure
checklist require explicit dispositions, and only the historical backup/PITR
development exception is accepted. No threshold of 12 was invented as an old
requirement; it is the owner's explicit target for the next policy change.

## Fresh verification

Fresh runs in this owner-evidence follow-up:

| Check                                             | Actual result                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                       | Passed, exit 0.                                                                                                                                                                                                                                                 |
| `pnpm typecheck`                                  | Passed, exit 0.                                                                                                                                                                                                                                                 |
| `pnpm test`                                       | Passed: 148 tests / 25 files.                                                                                                                                                                                                                                   |
| `pnpm test:ci-tools`                              | Passed: 10 safety tests.                                                                                                                                                                                                                                        |
| `pnpm test:db`                                    | Passed tenant isolation, invitation lifecycle, administrative authorization/transactional audit and new security ACL/actor/trusted-delivery assertions. All temporary fixtures/DDL rolled back.                                                                 |
| Catalog and anonymous HTTP probes                 | Passed: zero public definers executable by anon; flagged function ACLs/paths as above; no application/private table missing RLS; applied SQL equals repository file; four anonymous privileged RPC attempts returned HTTP401 / SQLSTATE42501.                   |
| `pnpm build`                                      | First attempt compiled/generated routes then exited 1 on the Next.js dependency security check. Retry exited 0 while retaining the vulnerability warning. Do not label dependency security clean.                                                               |
| `pnpm test:e2e --workers=1`                       | Passed: all 21 cases in one clean production-mode run on loopback port 3106 (3.4 minutes), including onboarding, invitation acceptance/replay denial, direct delivery ACLs, authorized administration and stale writes. No failures, skips or retries reported. |
| `pnpm audit --json`                               | Still 1 high / 3 moderate / 0 critical; no dependency change or waiver.                                                                                                                                                                                         |
| `pnpm format:changed` / `git diff --check`        | Passed.                                                                                                                                                                                                                                                         |
| Fresh disposable migration/upgrade/concurrency CI | Not run here: Docker is unavailable; required exact-review-head CI remains outstanding.                                                                                                                                                                         |

This verification does not test the **proposed** strengthened provider settings:
they were not changed. Browser fixtures use existing exact-ID teardown and disable
authenticated captures. No new real-mail delivery or naturally elapsed OTP-expiry
drill was performed. No persistent hosted Auth configuration mutation occurred.

## Residual risk register

| ID    | Severity               | Rationale                                                                                                             | Gate affected                                                                               | Required remediation / disposition                                                                                       |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| HS-01 | High                   | Hosted min 6/no classes permits weak direct-Auth passwords despite app min 8.                                         | Sprint 0 security closure; preview/pilot/production.                                        | Coordinated policy alignment and owner save of 12/all four classes, with regression evidence; no inferred exception.     |
| HS-02 | Moderate               | No recent reauthentication/current-password enforcement for password changes; action does not supply required fields. | Unaccepted development deferral; block preview/pilot/production pending protection.         | Implement/test ordinary change vs verified recovery and provider-supported step-up; then owner-approved settings change. |
| HS-03 | Moderate               | Free-plan leaked-password protection disabled.                                                                        | Documented development-only residual; preview security decision and pilot/production gates. | Owner-approved protection/plan decision; no upgrade or billing action now.                                               |
| HS-04 | Moderate               | One-hour OTP lifetime extends code/link compromise window; exact hosted rate-limit values unknown.                    | Conditional development disposition; pre-preview/pilot/production Auth hardening.           | Approve/test shorter expiry (proposed 600s), replay rejection and attempt limits; retain 8 digits.                       |
| HS-05 | High / Moderate        | Current dependency audit retains one high picomatch and three moderate findings (two Next.js, one minimatch).         | Sprint 0 required security checks and all exposure gates until reviewed/remediated.         | Separate bounded dependency remediation/review; no broad upgrades in this task.                                          |
| HS-06 | Verification gap       | Fresh disposable migration/upgrade/concurrency CI and exact-review-head clean evidence remain required.               | Overall development-only closure.                                                           | Run required isolated CI and resolve any failures; no hosted reset or blanket waiver.                                    |
| HS-07 | Operational / existing | Remaining R1–R7 owner dispositions, recovery/release/monitoring evidence are separate from the Advisor count.         | Overall closure where mandatory; preview/pilot/production per existing register.            | Follow the existing scoped risk/acceptance procedure. No additional acceptance inferred.                                 |

INFO count is recorded without severity escalation or an invented item name. The
six intentionally retained 0029 findings are reviewed privileged API surfaces,
not automatically exploitable vulnerabilities and not independent blockers after
their guards pass. Any unintended anon privilege, cross-tenant access, actor spoof,
role escalation, disabled RLS, ordinary-client delivery access or failed security
test would immediately block the gate regardless of warning totals.

## Final decision

**SPRINT 0 SECURITY GATE BLOCKED — REMEDIATION STILL REQUIRED**

This review cannot grant public preview, pilot, production, PR merge, deployment,
paid-service approval, overall owner acceptance or Sprint 1. Stop after the report.
