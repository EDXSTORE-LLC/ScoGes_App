# Final bounded Sprint 0 validation — 2026-11-19

**Superseding closure verification:** [owner closure review](SPRINT_0_OWNER_CLOSURE_REVIEW_2026-11-19.md)
records the owner's hosted minimum-12/four-class confirmation, refreshed Advisor
screenshots, exact final-commit CI and subsequent hosted compatibility checks.
Pending statuses below describe the earlier checkpoint, not the latest decision.

## Authority and candidate scope

Owner authorized final password/dependency remediation and isolated validation of
the final PR commit. PR #11 targets `main` from `edwakson/ScoGes_App`. No merge,
public deployment/preview, real-data pilot, paid service, plan change or Sprint 1.
Keep milestone statuses unchanged until explicit owner closure acceptance.

The candidate includes the previously tested application password policy and
targeted dependency fixes, plus disposable-CI Auth policy alignment and an isolated
repeatability check for the existing privilege migration. No applied migration
file or hosted function is modified by this final verification slice.

## Security Advisor reconciliation

Owner-supplied hosted evidence: original **0 ERROR / 14 WARN / 1 INFO**;
post-remediation **0 ERROR / 7 WARN / 1 INFO**. The owner supplied the seven
remaining finding identities in this task; the table is no longer inferred only
from the count. A further refreshed hosted result has been requested after this
final slice. No connector success or zero-warning result is invented.

All six function findings are `0029_authenticated_security_definer_function_executable`.
The reviewed contract is: owner `postgres`, intentional authenticated RPC access,
no PUBLIC/anon/service_role execution, `auth.uid()` identity and empty pinned
`search_path`. Definer is required to perform the listed protected operation;
authenticated execution alone never grants tenant authority.

| Finding / public object                                           | Internal authorization / ownership protection                                                                                                                                                                                                                      | Why definer is needed                                    | Disposition and gate                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `accept_tenant_invitation(text)`                                  | Verified Auth email, matching pending/unexpired one-use token digest; active stored tenant, inviter permissions/role rechecked under tenant lock; tenant and role from invitation, audit atomic.                                                                   | Protected membership/profile/invitation/role writes.     | Justified intentional exposure; retain and regression-test.                                                                                                                    |
| `administer_tenant_membership(uuid,uuid,timestamptz,text[],text)` | Active exact-tenant permission before/after tenant lock; target membership tenant match, role allowlist/admin authority, stale revision and last-active-admin invariant.                                                                                           | Atomic protected role/status/audit writes.               | Justified intentional exposure; retain and regression-test.                                                                                                                    |
| `create_tenant_with_admin(text,text,text,text,text,text,uuid)`    | Non-null existing Auth principal; compatibility actor equals `auth.uid()`; persisted identities from principal; new generated tenant only, no existing-tenant selection; atomic audit/quota. Membership/permission prechecks do not apply to new-tenant bootstrap. | Atomic protected onboarding before a membership exists.  | Justified intentional exposure; retain and regression-test.                                                                                                                    |
| `current_user_has_permission(uuid,text)`                          | Caller-owned active membership in exact tenant, database role/permission joins; inactive/revoked/foreign memberships return false; no editable metadata.                                                                                                           | Avoids recursive RLS evaluation of authorization tables. | Justified intentional exposure; retain and regression-test.                                                                                                                    |
| `issue_tenant_invitation(uuid,text,text)`                         | Active caller membership and tenant; both invite/manage_roles permissions, authorized tenant role/admin restriction; normalized email, cooldown, digest, pending replacement, expiry and audit/quota.                                                              | Protected invitation/digest/audit writes.                | Justified intentional exposure; retain and regression-test.                                                                                                                    |
| `update_tenant_settings(uuid,timestamptz,text,text,text,text)`    | Exact-tenant write permission rechecked under lock, current revision, country/currency syntax, valid timezone and FR/EN locale; audit atomic.                                                                                                                      | Protected settings/audit writes.                         | Justified intentional exposure; retain and regression-test.                                                                                                                    |
| `auth_leaked_password_protection`                                 | Disabled on owner-verified Free plan; not a function or EXECUTE grant. No replacement protection claimed.                                                                                                                                                          | Not applicable.                                          | Plan-constrained development residual; public exposure requires explicit security disposition, real-data pilot/production gated on approved protection. No upgrade authorized. |

The earlier anonymous 0028 findings are resolved; infrastructure RLS helper remains
owner/internal only, delivery recording is service-only invoker, and the legacy
invitation wrapper delegates as invoker. Any anonymous/unjustified privilege,
cross-tenant access, spoofed actor, escalation, weakened RLS, client-delivery access
or failing security test blocks the gate. See the existing
[full hosted review](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) and
[applied migration review](SECURITY_ADVISOR_2026-11-18.md).

## Password hardening

[Application implementation](PASSWORD_POLICY_2026-11-19.md): shared signup/reset
12–128-character policy, digit/lowercase/uppercase/supported symbol, matching
confirmation, FR/EN accessible guidance and safe validation. Existing login rules,
verified-user/rate-limit/session-revocation guards and tenant isolation are preserved.

This candidate aligns **disposable local/CI** Supabase to minimum 12 and
`lower_upper_letters_digits_symbols`, so isolated signup/reset/mail journeys test
the target provider policy rather than the old minimum eight. No `config push`
or hosted settings change is authorized/performed. Generated fixtures already
satisfy the target. Secure password-change/current-password/OTP settings remain
unchanged. Owner has been asked to save hosted minimum 12/all four classes and
confirm the non-secret values before hosted post-change compatibility is claimed.
Until that confirmation, last owner-verified hosted minimum six/no classes remains
a blocker; application validation cannot constrain direct Auth calls.

## Dependency remediation

[Targeted dependency record](DEPENDENCY_SECURITY_2026-11-19.md): active pre-change
audit had three moderate findings, zero high/critical. The historical picomatch
high advisory was withdrawn upstream and is not credited as our fix. Next and
matching lint config 16.4.1→16.4.5 resolve GHSA-mfr8-8qww-v76h and
GHSA-vc7v-qv4w-wrv8. Supported TypeScript-ESLint/parser 8.70→8.73 resolves
GHSA-g3hv-75wg-m249 through its patched minimatch 11.0.5 dependency. Legacy
callable minimatch 3 consumers, ESLint 9 and lint/CI thresholds remain unchanged.
Fresh audit before candidate commit: zero known findings. Final CI must repeat it.

## Isolated migration and quality verification

The existing workflow applies all seven append-only migrations to a fresh
disposable Supabase, verifies SQL/RLS/audit and invitation behavior, timestamp
upgrade hardening, last-admin/membership concurrency, quota upgrades/races and
direct HTTP429, Redis failure/expiry behavior, TLS SMTP and the complete FR/EN
email/auth/browser suite. Production secrets are neither needed nor uploaded.

New `scripts/tests/security-advisor.mjs` additionally replays only the explicitly
repeatable seventh privilege/body migration twice inside a rolled-back transaction,
comparing function identities/bodies/owners/ACLs/paths, default privileges and
synthetic data fingerprints. Historical CREATE TABLE migrations remain once-only;
no full-chain replay is falsely required. Two guard tests reject hosted/deceptive
endpoints and missing isolated opt-in before connection. No hosted replay/reset.

First committed candidate `0b3284bf83fc8bef7c7e8bbc41dd19ece9a89656` passed
[PR CI 44475640119](https://github.com/Edleben/ScoGes_App/actions/runs/44475640119):
both quality/security and isolated integration jobs, plus Required validation.
Logs confirm frozen install, lint/types, 202 unit/contract tests, 12 CI safety
tests, clean build/audit/secret scan, fresh migrations, privilege replay invariants,
timestamp fresh/upgrade tests, last-admin concurrency, quota upgrade/races and
direct HTTP429 atomicity, 3 Redis tests and **37 browser cases, zero failed/flaky/
skipped**. Local 23-case browser evidence did not include the isolated mail suite.

The final evidence commit adds an explicit installed-history/order assertion and
one isolated provider-level password test (short/missing classes rejected; exactly
12/all classes accepted with email confirmation still required). This sends only
to disposable loopback Mailpit and must reject non-loopback service URLs. These
additional checks require a new exact-head run; the first candidate result above
is supporting evidence only. The authoritative final outcome is the latest
head-matching run linked from [PR #11 checks](https://github.com/Edleben/ScoGes_App/pull/11/checks)
and the owner completion report. No earlier SHA is substituted for that outcome.

The final commit's run SHA/ID cannot be embedded in its own Git tree. Record its
actual link/results in the review report/PR metadata once it completes; do not
create an untested documentation successor just to copy a green badge. A final
hosted minimum-12/all-class save confirmation and Advisor refresh are still awaited
from the owner. The connector's inability to inspect them is not a security defect.

GitHub connector write access to PR metadata was denied. An attempted fallback
using a stored Git credential for a REST mutation was rejected by automatic
approval review before execution; no credential was retrieved. No bypass is used.
A reviewable manual PR title/body is prepared in ignored
`reports/PR_11_FINAL_BODY.md` and will contain the actual final head/run evidence.
This metadata limitation does not waive any code/CI/hosted gate.

## Residual risks and closure boundary

| ID       | Severity                 | Status / reason                                                                                                                                  | Gate and next requirement                                                                      |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| FINAL-01 | High if publicly exposed | Hosted password change/compatibility confirmation pending; no exception accepted.                                                                | Blocks security gate until owner save/confirmation and controlled compatibility checks.        |
| FINAL-02 | Verification             | Exact-head isolated CI pending; no earlier commit substituted.                                                                                   | Blocks quality gate until all required jobs succeed.                                           |
| FINAL-03 | Moderate                 | Leaked-password protection unavailable on current Free plan; documented plan constraint, not fixed.                                              | Development-only residual for owner review; approved protection before real data/public gates. |
| FINAL-04 | Moderate                 | Existing password-change step-up/OTP window and R3/R4/R6b/R7 operational evidence remain scoped development-review items, not silently accepted. | Preview/pilot/production protections and explicit owner dispositions remain required.          |
| FINAL-05 | Infrastructure           | Only the historical development-only lack of automatic backup/PITR has owner acceptance. No restore/recovery guarantee.                          | Real-data pilot/production requires approved adequate protection and tested recovery.          |

Technical security/quality readiness is not owner acceptance of the whole sprint
or operational deferrals. Do not mark Sprint 0 done, merge, deploy, start a pilot,
spend funds or begin Sprint 1. The final report must use only actually executed CI
and owner-verified hosted evidence and return one of the owner's two decisions.
