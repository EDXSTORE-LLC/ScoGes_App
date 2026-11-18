# Foundation completion gate

Hosted-security evidence update — **2026-11-18**: [owner-verified review](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) records Advisor **0 ERROR / 7 WARN / 1 INFO**, reconciled privileged RPCs and hosted Auth configuration. Advisor-count reduction does not close this gate: minimum **6/no classes** has no accepted exception; dependency/required final-head CI and owner dispositions remain outstanding. No overall development closure or subsequent phase is authorized.

Current evidence review (2026-11-15): [R1–R7 acceptance matrix](SPRINT_0_RISK_ACCEPTANCE_REVIEW.md) separates completed R2 remediation, partial R1/R3/R6/R7 controls, the scoped R4 backup acceptance, unaccepted development deferrals and pilot blockers. It supersedes older absent-control/pending-deployment descriptions; overall Sprint 0 remains open.

## Owner-approved backup risk disposition — 2026-11-15

The owner manually verified the dashboard for configured Supabase project `jlaufrjmjjheisdqkkao` and reported: **organization plan Free; latest successful scheduled backup N/A (no automatic project backups on this plan); PITR disabled/unavailable**. This is owner-verified dashboard evidence, not a successful connector/API inspection. No off-site backup or recoverability is inferred.

The owner explicitly accepts **this lack of automatic backup/PITR protection as a residual infrastructure risk for development and Sprint 0 technical closure only**. This supersedes the earlier unaccepted/pending disposition for the backup portion of R4. It does not accept every R4 item, other R1–R7 dispositions, or overall Sprint 0 completion. Keep Sprint 0 `in_progress` pending the remaining applicable checks and explicit overall acceptance; R3 and remaining R4 operational work stay open.

**Pilot/production blocker:** before real school/student/financial data is used, approve and implement adequate backup/recovery protection and test restoration. A paid daily backup alone does not meet the approved four-hour RPO; off-site manual backups alone do not demonstrate the previously approved automated 24/7 objective. Retain the four-hour RPO/eight-covered-business-hour RTO as unproven pilot planning targets unless explicitly revised. No production readiness, purchase, upgrade, PITR activation, export, restore, destructive database operation, PR merge or Sprint 1 activation is authorized.

Primary risk owner: project owner (user); technical backup remains unassigned. Reassess before pilot/production and before financial transactions become live. Execution evidence remains required for the operational protection, even though this scoped risk is accepted for development closure.

## Historical baseline — read with the 2026-11-15 scoped disposition above

Assessment: **2026-11-01 — owner kept the gate open for remediation**. Six technical milestones are delivered at 100%; Sprint 0 stays `in_progress` until explicit acceptance is recorded. Sprint 1 remains planned at 0%. This is a development-foundation gate, not production certification or authorization to activate a later sprint.

The owner declined the proposed R1–R7 deferrals. Use [the remediation backlog](SPRINT_0_REMEDIATION.md) before requesting renewed closure acceptance. All items remain open; no risk waiver, merge, deployment or Sprint 1 activation is implied.

## Current review and evidence

[PR #7](https://github.com/Edleben/ScoGes_App/pull/7) is merged as `6a76c436b5d7d2eb4efe50ea3895142412731540`. Its final-head CI passed 98 unit/component tests, 6 safety tests and 32 isolated Chromium cases, with no skipped/flaky results. Real hosted FR/EN confirmation/recovery/invitation receipt and completion, controlled negative-link checks and audited SMTP failure are documented in [email evidence](SPRINT_0_EMAIL_VALIDATION.md).

The closure candidate is [PR #8](https://github.com/Edleben/ScoGes_App/pull/8), with [current required checks](https://github.com/Edleben/ScoGes_App/pull/8/checks). All required checks must execute on its final head; prior green runs do not certify a later commit. Actual SHA/run links/totals are recorded in that PR after execution. See [validation history](SPRINT_0_VALIDATION.md), [both tracker records](PROJECT_TRACKER.md) and the [closure risk/acceptance register](SPRINT_0_CLOSURE.md).

## Closure checklist

| Gate                          | Assessment / evidence required                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bilingual foundation          | Delivered: authenticated FR/EN onboarding, shell/dashboard/tracker, safe errors, locale navigation and document language; refresh full Chromium on closure head                                          |
| Real email lifecycle          | Delivered: actual receipt/link completion, expired/reused-link rejection, password/membership state and failed-delivery audit; retain the hosted-versus-isolated limits in the email matrix              |
| Quality/build/security        | Final-head lint, generated route types, typecheck, unit/contract and CI safety tests, changed-file formatting, production build, dependency audit and secret scan must pass                              |
| Migration/RLS/audit           | Final-head CI applies every migration fresh; tests real database roles, tenant isolation, permission denial, stale writes and atomic audit rollback; hosted refresh must leave no schema/fixture changes |
| Concurrency/Chromium          | Disposable CI verifies independent-connection last-administrator races/audit counts and the complete browser suite; zero failures, skips and flaky results                                               |
| Documentation/risk acceptance | UI and Markdown tracker/checkpoint agree; shared handoff is current; owner explicitly accepts technical closure and R1–R7 dispositions in PR #8                                                          |

Evaluate the full [Sprint 0 Definition of Done](prompts/SPRINT_0_MASTER_PROMPT.md). The [risk register](SPRINT_0_CLOSURE.md) identifies the shared rate-limit abstraction/header-policy deviation rather than quietly claiming complete production security. Existing hosted Auth limits and SQL invitation throttles remain in force. New security/data-integrity failures always block closure; documented debt does not authorize weakening safeguards.

## Transition procedure

1. Complete final-head checks and review PR #8. Record explicit owner acceptance of Sprint 0 and residual-risk dispositions; a request to verify, SMTP readiness, merged email PR or green badge alone is not acceptance.
2. After acceptance, record review/merge evidence and set Sprint 0 to `done` in both trackers through a protected, freshly validated PR. Keep the six milestones at 100%, preserving dated evidence. Until that decision, both trackers intentionally remain `in_progress` at 100%.
3. Stop at Sprint 0. Obtain separate explicit activation of the [bounded Sprint 1 proposal](prompts/SPRINT_1_MASTER_PROMPT.md) and resolve its business decisions before affected slices.
4. Production deployment, hosted migration changes and pilot readiness require their own authorization and evidence. Do not infer them from closure.

## R3 direct RPC checkpoint — 2026-11-11

[The prepared database backstop](R3_DIRECT_RPC_BACKSTOP.md) passed clean implementation push/PR CI, including upgraded history, authorization/audit rollback, direct HTTP429, races and 34 Chromium cases. Hosted metadata confirms it is not deployed. R3 remains open for reviewed deployment, actual Vercel/HTTPS configuration and exercised quota/outage monitoring; this does not accept residual risks or close the owner-controlled Sprint 0 gate.

## R4 planning does not close a gate — 2026-11-11

[The R4 plan](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md) defines proposed recovery objectives, isolated restore/release/alert drills and owner acceptance evidence. Those operational checks have not run. Backup existence, CI, merged database hardening or written runbooks cannot substitute for measured recovery, actual Vercel/HTTPS checks, delivered/acknowledged alerts and controlled foundation UAT. R3/R4 and the owner-controlled Sprint 0 gate remain open; Sprint 1 is not activated.
