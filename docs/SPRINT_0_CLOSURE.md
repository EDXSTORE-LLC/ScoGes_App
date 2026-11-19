# Sprint 0 closure review — 2026-11-01

2026-11-19 dependency checkpoint: [targeted dependency fixes](DEPENDENCY_SECURITY_2026-11-19.md) now yield a zero-finding registry audit with Next/config 16.4.5 and upstream TypeScript-ESLint 8.73.0. This supersedes the dependency-advisory blocker in older checkpoints, subject to final review-head CI. Hosted password-policy alignment and other applicable owner/operational gates remain open; no overall Sprint 0 closure, waiver, merge, deployment, pilot or Sprint 1 is claimed.

Fresh hosted-review checks: lint/typecheck, 148 unit/component tests, ten CI safety tests and rollback-only tenant/authorization SQL suites pass; dedicated production Chromium **21/21 in one clean run**. Build passes on retry with its dependency security warning retained; audit still has one high/three moderate findings. No hosted Auth setting changed. Required fresh disposable/exact-review-head CI remains outstanding.

Final hosted review follow-up — **2026-11-18**: [owner-verified security review](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) records **0 ERROR / 7 WARN / 1 INFO** and actual hosted Auth values. Missing connector access is no longer a report-count/password-value blocker. The weak **6-character/no-class** policy is unaccepted and blocks Sprint 0 security closure; password hardening is proposed, not executed. Dependency and final-head/disposable-CI requirements remain open. **SPRINT 0 SECURITY GATE BLOCKED — REMEDIATION STILL REQUIRED**. No new residual-risk waiver, merge, public preview/deployment, pilot, plan change or Sprint 1.

Security gate checkpoint — **2026-11-18**: **SPRINT 0 SECURITY GATE BLOCKED —
REMEDIATION STILL REQUIRED**. [Detailed remediation/evidence](SECURITY_ADVISOR_2026-11-18.md)
records the applied function-privilege migration and passing hosted transactional
negative/valid-flow checks. A full hosted Advisor refresh and hosted password
policy verification remain inaccessible; leaked-password protection is still
plan-constrained. Newly reported Next.js/picomatch dependency advisories require
review/remediation. No additional risk acceptance, overall closure, merge, public
deployment, real-data pilot or Sprint 1 is authorized or claimed.

Current evidence review (2026-11-15): [R1–R7 acceptance matrix](SPRINT_0_RISK_ACCEPTANCE_REVIEW.md) separates completed R2 remediation, partial R1/R3/R6/R7 controls, the scoped R4 backup acceptance, unaccepted development deferrals and pilot blockers. It supersedes older absent-control/pending-deployment descriptions; overall Sprint 0 remains open.

## Owner-approved backup risk disposition — 2026-11-15

The owner manually verified the dashboard for configured Supabase project `jlaufrjmjjheisdqkkao` and reported: **organization plan Free; latest successful scheduled backup N/A (no automatic project backups on this plan); PITR disabled/unavailable**. This is owner-verified dashboard evidence, not a successful connector/API inspection. No off-site backup or recoverability is inferred.

The owner explicitly accepts **this lack of automatic backup/PITR protection as a residual infrastructure risk for development and Sprint 0 technical closure only**. This supersedes the earlier unaccepted/pending disposition for the backup portion of R4. It does not accept every R4 item, other R1–R7 dispositions, or overall Sprint 0 completion. Keep Sprint 0 `in_progress` pending the remaining applicable checks and explicit overall acceptance; R3 and remaining R4 operational work stay open.

**Pilot/production blocker:** before real school/student/financial data is used, approve and implement adequate backup/recovery protection and test restoration. A paid daily backup alone does not meet the approved four-hour RPO; off-site manual backups alone do not demonstrate the previously approved automated 24/7 objective. Retain the four-hour RPO/eight-covered-business-hour RTO as unproven pilot planning targets unless explicitly revised. No production readiness, purchase, upgrade, PITR activation, export, restore, destructive database operation, PR merge or Sprint 1 activation is authorized.

Primary risk owner: project owner (user); technical backup remains unassigned. Reassess before pilot/production and before financial transactions become live. Execution evidence remains required for the operational protection, even though this scoped risk is accepted for development closure.

## Historical baseline — read with the 2026-11-15 scoped disposition above

Status: **gate open for remediation; proposed R1–R7 deferrals not accepted**. This record proposes technical closure, not production readiness, deployment or Sprint 1 activation. Sprint 0 stays `in_progress` at 100% until explicit owner acceptance is recorded through the validated closure PR.

Review: [PR #8](https://github.com/Edleben/ScoGes_App/pull/8), [required checks](https://github.com/Edleben/ScoGes_App/pull/8/checks). Final-head run links and actual results belong in that PR; this document does not predeclare a pending check successful.

## Owner decision and remediation follow-up

On 2026-11-01 the owner explicitly chose **“Keep the gate open for remediation.”** The dispositions below are historical proposals, not accepted waivers. [The R1–R7 remediation backlog](SPRINT_0_REMEDIATION.md) is the current actionable record: severity/priority, impacts, existing mitigations, responsible functions, release gates, acceptance criteria and verification. All seven items remain open. Renewed acceptance requires completed remediation or specifically approved dispositions; a green CI gate does not override this decision.

## Reviewed baseline and scope

PR #7 is merged as `6a76c436b5d7d2eb4efe50ea3895142412731540`. The clean work branch was fast-forwarded to that commit before preparing closure. Prior bilingual and real-mail evidence remains in [validation](SPRINT_0_VALIDATION.md) and [email validation](SPRINT_0_EMAIL_VALIDATION.md). No new migration, dependency, authorization rule or financial feature is proposed.

The closure commit must rerun the entire required pipeline: frozen install, formatting ratchet, lint, generated route types, typecheck, unit/contract and CI safety tests, build, dependency/security scans, fresh migration application, security advisors, database constraints/RLS, transactional audit rollback, concurrent administrator removal and production-mode Chromium. Missing, skipped or flaky tests cannot satisfy acceptance. CI must validate the final review head, not merely the already-merged email baseline.

## Historical risk dispositions — not accepted

| ID  | Finding and current evidence                                                                                                                                                                                                                          | Disposition / owner / due gate                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C0  | Final-head checks and explicit owner acceptance are not inherited from PR #7                                                                                                                                                                          | Closure blockers until the closure PR passes required validation and the owner accepts its scope and risk dispositions; owner/reviewer                                                                                                                                                                       |
| R1  | `pnpm audit` on 2026-11-01: zero high/critical, three moderate development-tool advisories (two `@vitest/mocker`, one `minimatch`); all findings are development-only                                                                                 | Proposed nonblocking development debt under the existing high threshold; engineering/security to patch Vitest >=5.0.3 and investigate compatible upstream minimatch >=11.0.1 before pilot; do not force an incompatible major override                                                                       |
| R2  | Existing `public.touch_updated_at` has mutable search path; this is a trigger helper, not a new privileged write API                                                                                                                                  | Proposed nonblocking foundation debt; database/security owner to pin search path in an append-only reviewed migration before pilot; fresh CI advisors must still have no error-level findings                                                                                                                |
| R3  | Shared application rate-limit abstraction and CSP/security-header deployment policy are absent. Existing controls are narrower: hosted Auth limits plus SQL invitation serialization, 20 issuances per actor/hour and a one-minute recipient cooldown | Explicit Sprint 0 security-baseline deviation requiring owner acceptance for development-only closure; engineering/security to document/test shared ingress abuse protection and deployment headers before public preview/pilot, preserving existing SQL limits. No production security readiness is claimed |
| R4  | Backup/restore drill, RPO/RTO, deployment/environment/monitoring runbook, broader mobile/accessibility/UAT remain unverified                                                                                                                          | Operational pilot blockers, separate from the development foundation; operations/product/security owners must supply evidence before pilot. Do not deploy based on this closure                                                                                                                              |
| R5  | Full `pnpm format` fails on 19 pre-existing files, including canonical documents/generated lockfile; changed-file formatting remains enforced                                                                                                         | Proposed nonblocking maintenance debt; engineering to address selectively, without rewriting requirements or disabling the ratchet                                                                                                                                                                           |
| R6  | Onboarding resets edited values on validation failure; global-error/dependency rendering is component-tested rather than a hosted outage drill                                                                                                        | Proposed nonblocking UX/coverage debt; product/engineering to improve retained non-secret values and plan resilience/accessibility checks before pilot                                                                                                                                                       |
| R7  | Hosted email evidence covers controlled mailboxes; expiry ages owned fixtures. Asynchronous bounces, all-provider delivery and naturally elapsed expiry are not certified                                                                             | Explicit evidence limit; operations/identity to monitor real deployment delivery, bounce handling and quotas before pilot. No SMTP/global lifetime/clock changes are authorized                                                                                                                              |

No safeguard is waived by this register. A newly failing required check, isolation leak, missing permission, broken audit transaction, lost last-administrator protection or migration failure blocks closure and requires correction. Risk acceptance is a human review decision, not something an agent infers from passing tests.

## Acceptance procedure

1. Reconcile the UI/Markdown tracker, handoff and current documentation with this candidate. Keep later sprints planned at zero.
2. Verify the exact closure commit locally where available and through both required push and PR CI. Use disposable CI services for committed concurrency fixtures; never enable those fixtures on hosted Supabase.
3. Record actual SHA, test totals, run links, failures/retries and limits in the closure PR. CI results attached to that immutable SHA are the final validation evidence; do not create a documentation-only untested successor just to copy a green badge.
4. The owner explicitly accepts Sprint 0 technical closure and R1–R7 dispositions in the validated PR. Do not auto-merge or claim acceptance before that decision. Record the approval/merge evidence and then update both trackers to `done` through the same protected PR process, with fresh validation for any changed head.
5. Stop. Sprint 1 requires separate explicit owner activation of its [bounded prompt](prompts/SPRINT_1_MASTER_PROMPT.md); neither closure nor PR merge activates it.

## R1 partial remediation checkpoint — 2026-11-01

[The targeted Vitest patch](R1_DEPENDENCY_REMEDIATION.md) removes both mocker advisories; the refreshed audit reports one moderate minimatch finding, zero high/critical. R1 remains partial pending a compatible resolution of legacy lint consumers. The historical three-finding row above is superseded for audit totals, not for owner acceptance. R2–R7 and the completion gate remain open; no previously declined deferral is accepted.

## R3 remediation update — 2026-11-10

The historical R3 absence entry is superseded on the implementation branch by [distributed Redis controls and CSP/header hardening](R3_ABUSE_AND_BROWSER_SECURITY.md). Deployment configuration, trusted-ingress evidence, quota/monitoring and final review remain required. R3 is not accepted/closed merely because the implementation exists. Owner acceptance and the Sprint 0 completion gate remain open.
