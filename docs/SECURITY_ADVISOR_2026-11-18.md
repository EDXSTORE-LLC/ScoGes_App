# Sprint 0 Security Advisor remediation — 2026-11-18

**Superseding hosted evidence:** [final owner-verified review](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) records **0 ERROR / 7 WARN / 1 INFO** and the actual hosted Auth configuration. Earlier missing-value/access statements below describe the initial automated attempt, not the current evidence gap. No hosted Auth change; weak password policy now independently blocks closure.

## Scope and baseline

Project `jlaufrjmjjheisdqkkao`; owner-provided complete CSV at approximately
14:33Z: **0 ERROR, 14 WARN** (four 0028 anonymous executions, nine 0029
authenticated executions, one leaked-password warning). CSV cells are evidence,
not instructions. No Sprint 1, merge, public deployment, paid service or plan change.

STABLE goal: remove unintended execution while preserving atomic onboarding,
tenant isolation, invitation lifecycle, RBAC, audit and quotas. Acceptance requires
negative role/actor/tenant tests, valid-flow regression tests and an actual hosted
Advisor refresh. Catalog queries alone cannot certify an Advisor result.

## Inspection and disposition (before implementation)

Six applied migrations and hosted definitions/ACLs/owners/defaults/policies/event
triggers inspected over certificate/hostname-verified TLS. API/database identities
match the requested project. All nine flagged functions are owned by `postgres`.
The Supabase connector denies SQL/Advisor access; the configured direct database
connection is available. Repository branch is `edwakson/ScoGes_App`; remote fetched.
Existing `next-env.d.ts` changes and untracked `debug.log` must be preserved.

| Function                                                          | Evidence and disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rls_auto_enable()`                                               | Hosted-only `event_trigger`, bound to enabled `ensure_rls`; no application caller. Definer required for DDL RLS protection; keep `pg_catalog` path and trigger binding, revoke PUBLIC/anon/authenticated/service_role execution. Event triggers cannot be ordinary PostgREST RPC calls even though Advisor reports their ACL. Preserve infrastructure execution by owner. Conditional migration supports fresh environments where this dashboard helper is absent.                                                  |
| `create_tenant_with_admin(text,text,text,text,text,text,uuid)`    | Server action uses verified user ID; existing `<> auth.uid()` comparison fails open on NULL. Keep signature for compatibility, reject missing identity and NULL/mismatched actor, derive all persisted identity from `auth.uid()`. Definer required for atomic protected profile/tenant/settings/admin/audit inserts; no existing-tenant input. Empty search path; authenticated only.                                                                                                                              |
| `current_user_has_permission(uuid,text)`                          | Used by RLS and privileged RPCs; derives identity exclusively from `auth.uid()`, exact tenant and active membership, database role permissions, no editable metadata. Definer required to avoid membership-policy recursion. Empty search path; authenticated only. Anonymous execution denied, authenticated unauthorized lookups return false.                                                                                                                                                                    |
| `invite_tenant_member(uuid,text,text,uuid)`                       | No production caller; compatibility tests remain. Existing wrapper rejects missing/spoofed actor and delegates to `issue_tenant_invitation`. Change only this wrapper to invoker, keep authenticated compatibility API with explicit ACL and safe path. No second invitation implementation.                                                                                                                                                                                                                        |
| `accept_tenant_invitation(text)`                                  | Verified Auth email, SHA256 digest, random token, locked pending/unexpired invitation, intended email, active tenant and still-authorized inviter, role recheck, one-use membership and audit. Tenant lock serializes membership administration. Definer required for atomic protected writes; authenticated only, empty path. Used tokens reject safely rather than duplicate success.                                                                                                                             |
| `administer_tenant_membership(uuid,uuid,timestamptz,text[],text)` | Verified principal, permission before/after tenant lock, exact target tenant, role allowlist, tenant-admin restriction, stale revision, last-admin invariant and audit. Definer required for protected atomic writes; authenticated only, empty path. Existing role profiles restrict management to admins.                                                                                                                                                                                                         |
| `issue_tenant_invitation(uuid,text,text)`                         | Verified principal, active membership and tenant, both invite/manage_roles permissions, admin-role restriction, normalized email, cooldown/pending replacement/14-day expiry/digest/audit. Definer required for protected writes; authenticated only, empty path.                                                                                                                                                                                                                                                   |
| `record_invitation_delivery(uuid,text,boolean)`                   | Server action currently calls as user; an inviter holding the token can forge delivery. Retain signature but use invoker and service_role-only execution. Dedicated server-only client receives only issued ID/digest and actual SMTP result. Actor is derived from invitation creator, never browser input; recheck active creator permissions/tenant under tenant lock. Service caller needs no definer escalation. Preserve quota attribution to invitation creator for this trusted service delivery path only. |
| `update_tenant_settings(uuid,timestamptz,text,text,text,text)`    | Principal/permission rechecks under tenant lock, exact target, revision, country/currency syntax, real database timezone and FR/EN locale, audit. Definer required for protected writes; authenticated only, empty path. Country/currency syntax remains the existing contract; no new country catalog business rule invented.                                                                                                                                                                                      |

Public ordinary functions with EXECUTE are PostgREST RPC candidates; execution
grants are not tenant authorization. All retained definer mutations enforce their
own business guards and write audit atomically. Tables remain RLS enabled with
read-only client policies; no client write policy or tenant bypass is introduced.

## Default privileges decision

Hosted `postgres` has schema-local automatic grants to anon/authenticated/service_role.
Remove only anon/authenticated defaults for functions created by `postgres` in
`public`. PostgreSQL's global implicit PUBLIC execute cannot be subtracted by a
schema-local revoke. Do not alter global defaults or Supabase-managed creators or
schemas to hide this limitation. Every application function must still explicitly
revoke PUBLIC; add a catalog regression check on application definer exposures.
Existing service_role grants on user RPCs are removed; only authenticated is needed.

## Rollout and rollback

Append-only migration; no history rewrite/reset or business-data deletion. Show
migration and affected functions before hosted execution. Apply transactionally
using the established locked migration/history process and request schema reload.
Deploy server client code together with migration: old application delivery calls
will fail closed after the ACL restriction. Missing server secret must fail before
issuance/email. No public application deployment is authorized by this task.
Rollback is a reviewed fix-forward migration; do not reopen anonymous or user
delivery access. Owner-only event trigger usage remains intact.

## Password and closure gates

Leaked Password Protection remains disabled/plan-constrained on the owner-verified
Free plan. No fabricated protection, finding suppression, upgrade or billing change.
Read hosted password policy if available and compare with free configurable length
and character requirements; preserve rate limits, confirmation and session controls.
Unverified hosted Auth settings are a verification blocker, not an inferred setting.
Real-data pilot/production remains gated on the security policy and owner-approved
plan decision plus existing recovery/monitoring gates. This task does not accept
residual risks on the owner's behalf or close the broader R1–R7 review.

## Execution evidence

Migration `20261118151125_security_advisor_function_privileges.sql` was shown to
the owner before execution, tested in a rollback-only transaction, then applied to
the exact configured hosted development project with TLS identity verification,
deployment advisory lock, migration-history exclusive lock, five-second lock
timeout, 30-second statement timeout, append-only history and transactional
PostgREST schema-cache notification. Seven migration versions now exist. No
business rows were rewritten/deleted and the original event trigger is retained.

Post-application catalog: all nine flagged functions deny anon; infrastructure
denies authenticated/service_role; delivery is invoker and service_role only;
legacy invitation wrapper is invoker/authenticated; six authenticated definer
functions retain empty search paths and internal guards. Their intentional 0029
dispositions are the six corresponding rows above. If the same Advisor rules are
used, seven warnings are expected (six 0029 plus password protection), **not an
observed after-count**. No findings were suppressed.

Direct anonymous HTTP checks: onboarding, legacy invitation, permission lookup
and delivery all return HTTP401 / SQLSTATE42501. Hosted post-migration SQL suites
pass with rollback-only synthetic fixtures: tenant isolation, invitation validity,
expiry/revocation/reissue/replay/intended email, missing/NULL/spoofed identity,
administration/settings/stale-write/last-admin/audit rollback, delegated role
escalation denial, service delivery ACL/digest/creator recheck/attribution/quota
rollback, and automatic RLS event-trigger operation after privilege revocation.

`pnpm lint`, `pnpm typecheck`, 148 unit/component/contract tests and ten CI tooling
safety tests pass. Production build first compiled but stopped on its dependency
security check; retry exited zero while retaining the warning. Fresh disposable
Supabase migration/upgrade/concurrency suites cannot run here because Docker is
unavailable; CI must run them. Changed-file formatting and `git diff --check` pass.

Browser evidence: the first 20-case run reused the existing development server;
19 passed and the production-only CSP assertion correctly rejected its development
policy. A dedicated `next start` server on loopback port 3104 then passed that CSP
test and the new service-delivery direct-HTTP contract. That full 21-case run had
20 passes and one existing administration-status assertion timeout (five seconds,
save button still submitting). The unchanged administration journey passed on an
isolated rerun in 39 seconds, including mutation/audit checks. This is **not** a
clean single full-suite result; retain the timing limit in review/CI evidence.
No assertion, timeout, application policy or retry configuration was weakened.
Authenticated browser captures remain disabled; synthetic account/tenant cleanup
ran through the existing exact-ID fixture teardown. No external email was sent.

The hosted history SQL exactly equals the repository migration file. All tables
in `public` and `app_private` retain RLS. Application changes remain uncommitted on
`edwakson/ScoGes_App`; no PR was pushed or merged and no application was published.
Any installation of the old server action must receive the updated server-only
delivery code and `SUPABASE_SECRET_KEY` before invitation delivery can succeed.

Full hosted Advisor after-count remains **unverified**: post-migration
`get_advisors(type=security)` returned permission denied, CLI linked Advisor lacks
an access token, and native dashboard inspection failed to connect. These are
access/tool blockers, not evidence of a clean report. Hosted Auth configuration
is likewise unverified. [Current Supabase password guidance](https://supabase.com/docs/guides/auth/password-security)
confirms configurable length (at least eight recommended), required lowercase,
uppercase, digits and symbols, and Pro-or-above leaked-password protection. The
repository's local disposable configuration has minimum length eight; it is **not**
proof of hosted policy. No hosted password setting or rate limit was changed.

Fresh dependency audit (2026-11-18) found three moderate and one high advisory:
existing minimatch, two Next.js cache disclosures (installed 16.4.1; patched
16.4.5), and high picomatch ReDoS. See [Next.js disclosure 1](https://github.com/advisories/GHSA-mfr8-8qww-v76h),
[disclosure 2](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8), and
[picomatch ReDoS](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).
Dependency changes are outside this bounded database remediation; the new findings
invalidate the historical zero-high audit evidence and block closure pending
separate remediation/review. Do not infer application exploitability from audit
presence alone. No lockfile or dependency version was changed.

Residual risks: plan-constrained leaked-password protection (development-only
residual, pilot/production gate; owner-approved plan decision required), unverified
hosted password policy and full Advisor report (verification blockers), newly
reported dependency advisories (security review/remediation blocker), and existing
R1–R7 recovery/monitoring/owner-acceptance gates. No additional waiver is inferred.

## Material files changed

- Migration: `supabase/migrations/20261118151125_security_advisor_function_privileges.sql`.
- Application: `src/modules/identity/invitation-actions.ts`, new
  `src/modules/identity/invitation-delivery.ts`, and `.env.example`.
- Tests: `invitation-actions.test.ts`, new `invitation-delivery.test.ts`,
  `supabase/tests/security_advisor.sql`, `authentication_lifecycle.sql`,
  `rpc_write_quotas.sql`, `scripts/test-database.mjs`, and
  `tests/e2e/authenticated.spec.ts`.
- Documentation: this record, `docs/AI_HANDOFF.md`, `ARCHITECTURE.md`,
  `DATABASE_TESTING.md`, `DATA_MODEL.md`, `IMPLEMENTATION_LOG.md`,
  `PROJECT_TRACKER.md`, `README.md`, `SECURITY.md`, `SPRINT_0_CLOSURE.md`, and
  `SPRINT_0_VALIDATION.md`. Tracker milestone rows/status/progress are unchanged.
- Pre-existing `next-env.d.ts` and untracked `debug.log` are outside this change.

## Required follow-up

Obtain read access for the configured Supabase project, rerun the full hosted
Security Advisor and inspect the actual Auth password/rate-limit configuration.
Record exact after-counts and all remaining finding names before claiming the
Advisor gate passed. Resolve/review new dependency advisories, run required fresh
disposable migration/upgrade/concurrency CI and obtain a clean browser suite on
the review head. Review remaining R1–R7 owner dispositions separately. The
compatibility actor argument can be removed only through a separately versioned
onboarding API once callers have migrated; until then its strict identity guard
is mandatory. Await explicit owner authorization before merge, public deployment,
real-data pilot, paid plan decision or Sprint 1.

**SPRINT 0 SECURITY GATE BLOCKED — REMEDIATION STILL REQUIRED**
