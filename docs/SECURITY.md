# Security

## Sprint 1 security boundary

[Approved implementation](SPRINT_1_IMPLEMENTATION.md) extends explicit RBAC and
RLS to school records without finance grants. Two new authenticated-only RPCs
protect writes/history/audit and insert-only import commits; their static field
allowlists, verified actor, locked active tenant, current permissions, empty
search path and no anonymous execution are tested. The original six retained
definer dispositions and owner-verified hosted Advisor counts remain unchanged
because the new migration has not been deployed.
Dry-run writes no database data. A separate random local/staging key seals
actor/tenant-bound previews; expiry, tampering, current grants and references are
checked again at commit. ZIP expansion/CRC/dimension controls precede XLSX parsing.
New school/import request URLs and action arguments are excluded from development
request logging; neither PII nor sealed tokens are audit metadata. The 5-MiB
transport ceiling supports bounded uploads; actual configured file/row/cell limits
remain lower. Existing Auth/session/rate-limit and preview/pilot/production gates
are preserved. No production-readiness inference follows from this sprint.

Owner acceptance — **2026-11-19**: the owner explicitly accepts Sprint 0 for
**development-only closure**, including documented residual risks with their
existing gates; no mandatory security check or HIGH vulnerability is waived.
[PR #11](https://github.com/Edleben/ScoGes_App/pull/11) is merged as
`5a346d060a9cd95f793a5de59db4324faf1f3f61`;
[merge CI](https://github.com/Edleben/ScoGes_App/actions/runs/44550187309) passed.
[Current closure evidence](SPRINT_0_OWNER_CLOSURE_REVIEW_2026-11-19.md) supersedes
older pending-acceptance notes below. This follow-up records the approved tracker
transition through a protected PR; it is not published to main until that PR
merges. Public preview, real-data pilot and production remain separately gated.
Sprint 1 planning is authorized only after the closure transition is finalized;
implementation remains unauthorized. No deployment or plan change is authorized.

Latest owner closure review — 2026-11-19: [current hosted/CI evidence](SPRINT_0_OWNER_CLOSURE_REVIEW_2026-11-19.md)
supersedes pending minimum-six/no-class and final-CI checkpoints below. Owner has
saved minimum 12/four classes; all six intentional authenticated-definer
dispositions and the Free-plan leaked-password residual remain unchanged. No
authorization for public preview, pilot, production, merge or Sprint 1 follows.

Final verification checkpoint — 2026-11-19: [review/control matrix](SPRINT_0_FINAL_VALIDATION_2026-11-19.md) records six intentional authenticated definers plus Free-plan leaked-password protection, matches live function bodies/ACLs/paths to reviewed migrations and confirms no anonymous public definers. Initial isolated CI is green; final-head and owner-hosted policy evidence are tracked separately. No hosted function or setting is changed to obtain zero warnings.

2026-11-19 dependency update: [targeted remediation](DEPENDENCY_SECURITY_2026-11-19.md) removes the three active moderate advisories (two Next.js and one transitive minimatch) using supported releases. Audit reports zero known findings; the former picomatch high advisory was withdrawn upstream and is not credited as a code fix. No audit/rule threshold was weakened. Existing hosted Auth and final-head isolated-CI/owner gates remain open.

2026-11-19: [application password policy](PASSWORD_POLICY_2026-11-19.md) now enforces
12–128 characters plus lowercase/uppercase/digit/supported symbol on signup/reset.
Existing login rules remain unchanged. No hosted setting, RLS, permission or
session-revocation control changed. Direct Auth policy remains an owner-action gate;
application validation alone does not resolve the last verified hosted minimum six.

Latest owner-verified assessment — **2026-11-18**: [hosted security review](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) supersedes earlier missing-Advisor/password-value notes. Refreshed hosted result **0 ERROR / 7 WARN / 1 INFO** is owner-verified; current catalog/negative tests reconcile six deliberate authenticated definers and the plan-constrained password warning. Hosted minimum **6** with no required classes is a **Sprint 0 blocker**, not accepted development risk. Target **12 + digits/lowercase/uppercase/symbols** needs a coordinated application/test alignment and explicit owner dashboard action. No Auth setting changed; connector unavailability is not a security defect. Other password-change/OTP/public-exposure and dependency gates remain documented.

2026-11-18: [Security Advisor remediation](SECURITY_ADVISOR_2026-11-18.md)
records the applied seventh migration, exact function dispositions, anonymous
revocations, hardened onboarding identity and server-only delivery bookkeeping.
Six authenticated definer functions intentionally retain internal authorization;
none of the flagged functions remains anonymously executable. Full Advisor
after-count and hosted Auth password policy are unverified due access limits.
Leaked-password protection remains a Free-plan residual and real-data gate.
New dependency audit findings supersede historical zero-high evidence. Sprint 0
security closure remains blocked.

Current hosted checkpoint — **2026-11-11**: PR #10 is merged; the R2 helper and R3 direct-RPC quota migrations are now applied to the configured project and post-deployment checks passed. [Deployment evidence](DEPLOYMENT_2026-11-11.md) supersedes older pending-deployment notes below. Full advisor refresh, Vercel/monitoring and Sprint 0 acceptance remain open; Sprint 1 is inactive.

## Tenant Isolation

Tenant isolation is enforced in layers:

- Supabase Auth establishes identity.
- `memberships` links users to tenants.
- Role permissions are checked server-side before sensitive actions.
- Tenant-scoped RLS policies restrict table reads.
- RPC functions check `auth.uid()` and live permissions before writing; legacy actor parameters must match the authenticated principal.

Client-provided `tenant_id`, role, permission, amount, or status values are never authoritative.

## Authentication

Supabase Auth is the authentication provider. Public Supabase URL and publishable key are browser-visible. The administrative `SUPABASE_SECRET_KEY` (`sb_secret_...`, preferred over the legacy service-role key) is server-only and must never be exposed as `NEXT_PUBLIC_*`. Application auth actions do not use administrative keys; isolated live test fixtures use the secret key for setup/cleanup only.

## Authorization

Tenant permissions are modeled through:

- `roles`
- `permissions`
- `role_permissions`
- `memberships`
- `membership_roles`

Application helpers in `src/modules/identity/authorization.ts` provide reusable checks for tests and server logic. Database policies use `current_user_has_permission`.

## Audit

Sprint 0 audit events cover tenant creation, invitation issuance/delivery/acceptance, role assignment/change, settings updates and membership deactivation/revocation. Administrative events and their mutations share a transaction with safe before/after metadata and generated request IDs. The application metadata helper strips common secret-bearing fields; RPCs construct their metadata explicitly.

## Secrets

Only `.env.example` is committed. Real `.env` and `.env.local` files are ignored.

## Known Limitations

The four-migration chain in [DATA_MODEL.md](DATA_MODEL.md) was verified applied to the configured hosted project on 2026-10-30. Other environments must apply the reviewed chain independently. Production backup, restore drills, CSP hardening, rate limiting implementation, and storage policies must be completed before pilot production.

## Membership Self-Resolution

Active users can read their own membership and assigned roles without `users.read`.
Reading other members and their profiles still requires `users.read` in the same tenant.
Inactive memberships do not gain self-access. Database failures raise a safe error
instead of being interpreted as missing membership and redirected to onboarding.

Real database authorization tests and their limits are documented in
[Database testing](DATABASE_TESTING.md). SQL RLS/RPC tests run under database roles;
unit helper tests alone are not evidence of database isolation.

## Authentication Lifecycle

Signup/recovery, PKCE callbacks, password updates, session refresh, SMTP delivery,
and invitation acceptance are implemented as described in
[Authentication lifecycle](AUTHENTICATION.md). Invitation acceptance binds the verified
recipient identity to the database-stored invitation; tenant/role fields from the
browser are not authoritative. Passwords/tokens are excluded from application and
development action logs. Hosted Auth SMTP/redirect settings and live mailbox delivery
remain external configuration requirements; unverified delivery is not reported as working.

## Administration writes

Role/status/settings mutations now use permission-checked RPC transactions with tenant-row serialization, last-active-administrator protection, stale revision checks and atomic audit writes. Invitation acceptance shares the authorization lock. Revocation removes tenant access through live membership/RLS checks while preserving other memberships. See [Administration](ADMINISTRATION.md).

## Sprint 0 validation follow-up

Onboarding no longer returns raw database/transport errors. Duplicate slugs receive safe localized feedback; other failures use the generic service-unavailable response, and malformed RPC results cannot produce a success redirect. Unit/component tests exercise provider failures without disrupting hosted services. See [Validation evidence](SPRINT_0_VALIDATION.md) for coverage limits and outstanding security/deployment debt.

## Evidence and handoff limits

The [validation report](SPRINT_0_VALIDATION.md) separates actual SQL/browser verification from mocked provider failures; real controlled mailbox receipt and link completion now have [separate evidence](SPRINT_0_EMAIL_VALIDATION.md). The existing `public.touch_updated_at` search-path warning and three moderate development-tool advisories remain known debt at the 2026-11-01 checkpoint; recheck before remediation. Preserve TLS, RLS, server permissions, audit rollback, last-admin protection and CI checks during any agent handoff. See [AI_HANDOFF.md](AI_HANDOFF.md).

Locale is presentation-only. The proxy overwrites incoming locale headers, permits only French/English, and keeps session-cookie forwarding, no-store and no-referrer behavior on authentication-sensitive routes. Localized redirects continue to use the existing allowlist before adding locale; no arbitrary return URL is trusted. Global error output never renders raw exceptions.

## Closure risk boundary — 2026-11-01

[The closure register](SPRINT_0_CLOSURE.md) explicitly proposes the remaining risk dispositions for owner review. SQL invitation issuance already serializes actor/recipient requests and enforces 20 per actor/hour plus a one-minute pending-recipient cooldown. Hosted Auth also supplies its own throttling. A shared application rate-limit abstraction and CSP/security-header deployment policy are still absent; they require explicit development-baseline exception acceptance and remediation before public preview/pilot. This closure does not grant production readiness or silently waive security requirements. Pilot backup/restore, deployment monitoring and accessibility/UAT remain separate evidence gates.

## R2 timestamp helper — 2026-11-03

The prepared append-only migration pins `public.touch_updated_at()` to trusted `pg_catalog` without replacing its body, altering ownership/grants, changing invoker security or rebinding triggers. Local-only tests check hostile search-path behavior plus fresh/upgrade invariants; [R2 evidence and deployment plan](R2_TIMESTAMP_HARDENING.md) records the limits. The configured hosted database was inspected read-only and still has the old setting/four-migration history. No hosted resolution or warning clearance is claimed before authorized deployment and post-checks. R1 remains partial and other risks remain open.

## R3 remediation checkpoint — 2026-11-10

The earlier statement that shared limits and CSP are absent is superseded for this implementation branch. Server-only managed Redis sliding windows, explicit fail-closed handling, verified-ingress selection, keyed identifiers, nonce CSP and response headers are implemented. Configuration/deployment checks and final PR validation remain distinct from code completion. See [the R3 policy and residual-risk record](R3_ABUSE_AND_BROWSER_SECURITY.md); do not infer pilot approval or Sprint 0 closure.

## Direct API backstop prepared — 2026-11-11

[Private R3 write quotas](R3_DIRECT_RPC_BACKSTOP.md) now cover the audited onboarding, administration, invitation, delivery and acceptance mutation paths, including the legacy invitation wrapper. Fixed verified-user attribution, cross-tenant actor aggregation, private schema/RLS/revoked client privileges and atomic quota/audit rollback preserve authorization. The prepared append-only migration has not been applied to hosted Supabase. Only after deployment/verification may the direct-successful-write gap be considered mitigated there; request/DDoS, Vercel and quota/monitoring gates remain open.

## R4 operational-security plan — 2026-11-11

[R4 planning](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md) requires encrypted restricted backup/key custody, explicit source/target isolation and outbound-effect containment before restore, supported Auth/private-schema recovery, and reconciliation of post-backup role revocations/consumed credentials before reopening access. Recovery timings, full advisor scan, collector scrubbing/retention and alert delivery/acknowledgement remain unverified. No real source backup/restore, security-setting change or production rollout was executed by the planning task.
