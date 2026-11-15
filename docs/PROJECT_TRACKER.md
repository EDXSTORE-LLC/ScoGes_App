# Project tracker

Closure-review checkpoint: **2026-11-01**. Active sprint: **Sprint 0**, in progress. Work branch: `edwakson/ScoGes_App`; main changes only through validated PRs.

This Markdown tracker and the UI consume the same milestone definitions in `src/modules/project-tracker/tracker-data.ts`. A unit test compares every row below with that data to prevent drift. Edit the data and this table together; rerun verification before changing completion status.

## Sprint status

| ID       | Status      | Progress | Scope                                       |
| -------- | ----------- | -------- | ------------------------------------------- |
| sprint-0 | in_progress | 100%     | Fondations plateforme                       |
| sprint-1 | planned     | 0%       | Academique, eleves, responsables et imports |
| sprint-2 | planned     | 0%       | Frais, facturation et echeanciers           |
| sprint-3 | planned     | 0%       | Paiements, rapprochement et recus           |
| sprint-4 | planned     | 0%       | Recouvrement et communications              |
| sprint-5 | planned     | 0%       | Reporting et administration avancee         |

## Milestones

| ID                         | Status  | Progress | Sprint   | Milestone                                   |
| -------------------------- | ------- | -------- | -------- | ------------------------------------------- |
| workspace-quality          | done    | 100%     | sprint-0 | Workspace et qualite                        |
| tenant-rbac                | done    | 100%     | sprint-0 | Tenant, membership et RBAC                  |
| onboarding-audit           | done    | 100%     | sprint-0 | Onboarding et audit                         |
| foundation-ui              | done    | 100%     | sprint-0 | Shell UI administration                     |
| bilingual-completion       | done    | 100%     | sprint-0 | Compléter la traduction de la fondation     |
| email-lifecycle-validation | done    | 100%     | sprint-0 | Valider les parcours e-mail de bout en bout |
| academic-references        | planned | 0%       | sprint-1 | References academiques                      |
| students-guardians         | planned | 0%       | sprint-1 | Eleves et responsables                      |
| enrollments                | planned | 0%       | sprint-1 | Inscriptions                                |
| imports                    | planned | 0%       | sprint-1 | Imports CSV/XLSX                            |
| fee-configuration          | planned | 0%       | sprint-2 | Configuration des frais                     |
| invoices                   | planned | 0%       | sprint-2 | Factures                                    |
| installments               | planned | 0%       | sprint-2 | Echeanciers                                 |
| payment-abstraction        | planned | 0%       | sprint-3 | Abstraction paiement                        |
| allocations-reconciliation | planned | 0%       | sprint-3 | Allocations et rapprochement                |
| receipts-webhooks          | planned | 0%       | sprint-3 | Recus et webhooks                           |
| collections                | planned | 0%       | sprint-4 | Workflow recouvrement                       |
| reminders                  | planned | 0%       | sprint-4 | Relances automatisees                       |
| reports                    | planned | 0%       | sprint-5 | Rapports                                    |
| exports                    | planned | 0%       | sprint-5 | Exports                                     |
| advanced-admin             | planned | 0%       | sprint-5 | Administration avancee                      |

## Evidence and interpretation

- [Merged PR #1: CI](https://github.com/Edleben/ScoGes_App/pull/1), [PR #2: administration](https://github.com/Edleben/ScoGes_App/pull/2), and [PR #3: Sprint 0 validation](https://github.com/Edleben/ScoGes_App/pull/3). PR #3 merged as `92efae9`.
- [Reviewed validation CI](https://github.com/Edleben/ScoGes_App/actions/runs/41133779878): 68 unit/component/contract tests, 4 CI safety tests, 15 browser tests; required gate passed. These counts describe that dated functional baseline; later documentation/invariant checks can increase the unit-test total.
- Hosted development verification: all 15 browser tests, SQL/RLS/audit assertions, Auth/schema connectivity and SMTP authentication passed. Synthetic fixtures were cleaned up. SMTP verification does not prove inbox receipt.
- All six technical milestones are delivered. Sprint 0 progress is `round(600 / 6) = 100%`, an unweighted engineering checklist score. Its status remains `in_progress` pending final PR review/owner acceptance. It is not SaaS-wide completion, code coverage, automatic CI telemetry, or production certification.

## Remaining Sprint 0 work

Bilingual foundation coverage is complete, including authenticated FR/EN onboarding validation, localized navigation and document language. Global error safety/retry is component-tested in both languages; no hosted outage was induced.

Real FR/EN confirmation, recovery, invitation delivery/acceptance and invitation replay rejection passed. See [email verification evidence](SPRINT_0_EMAIL_VALIDATION.md). Final closure review remains pending; Sprint 1 is not active.

The onboarding form currently resets edited fields after validation failure; preserve/re-enter the complete form in tests and record any future UX change explicitly. The refreshed risk register records 19 pre-existing formatting failures, three moderate development-tool advisories, the timestamp-helper search-path warning, shared ingress/header hardening and pilot operational gaps. These are proposed dispositions requiring explicit owner acceptance; see [closure review](SPRINT_0_CLOSURE.md).

See [validation evidence](SPRINT_0_VALIDATION.md), [agent handoff](AI_HANDOFF.md), and [documentation map](README.md). Do not start Sprint 1 without the owner's explicit instruction.

## Sprint 1 planning

A [bounded Sprint 1 proposal](prompts/SPRINT_1_MASTER_PROMPT.md) is ready for review. The [foundation completion gate](SPRINT_0_COMPLETION_GATE.md) has complete technical evidence and awaits final review/owner acceptance. Preparing this prompt does not change any milestone status, activate Sprint 1 or authorize its implementation.

Both [PR #6](https://github.com/Edleben/ScoGes_App/pull/6) and [PR #7](https://github.com/Edleben/ScoGes_App/pull/7) are merged; the latest baseline is `6a76c43`. Current closure review: [PR #8](https://github.com/Edleben/ScoGes_App/pull/8) and its [required checks](https://github.com/Edleben/ScoGes_App/pull/8/checks). Historical PR #3 results above retain their original test counts.

Supplemental email coverage now includes hosted controlled expired/reused links and an audited transport failure. Repeatable isolated FR/EN cases validate actual captured messages and state transitions; see [the negative-case matrix](SPRINT_0_EMAIL_VALIDATION.md). Milestone percentages and sprint activation are unchanged.

## Closure acceptance checkpoint — 2026-11-01

The UI checkpoint and this tracker point to PR #8. All six technical milestones remain delivered, with Sprint 0 `in_progress` at 100% pending owner acceptance of the exact validated closure head and [residual risks R1–R7](SPRINT_0_CLOSURE.md). Quality/build/security, migration/RLS/audit, concurrent administrator protection and all Chromium cases must pass on that head. Prior PR #7 totals (98 unit/component, 6 safety and 32 isolated browser tests) are historical evidence until refreshed by the closure checks. Record run links/results in PR #8; do not claim acceptance or change either sprint status prematurely. Sprint 1 stays planned at zero.

## Owner decision — gate open for remediation (2026-11-01)

The owner declined the R1–R7 deferral proposal. [The remediation backlog](SPRINT_0_REMEDIATION.md) now records all seven open items, priorities, responsible functions, acceptance criteria and release gates. Both sprint-status records remain `in_progress` at 100% of the original six delivered milestones; this historical score excludes remediation and does not imply accepted closure. No UI/application code changes are part of documenting this decision. Sprint 1 remains planned at zero.

## R1 partial remediation — 2026-11-01

The targeted Vitest/mocker 5.0.3 patch removes two moderate findings; one minimatch finding remains across legacy lint dependency paths. [R1 evidence](R1_DEPENDENCY_REMEDIATION.md) explains the compatibility blocker and remaining acceptance work. R1 remains open/partial; R2–R7 remain open. Original milestone percentages and UI checkpoint are unchanged historical delivery data, not remediation completion. Sprint 0 stays `in_progress`; no closure or Sprint 1 activation is inferred from merged PR #8.

## R2 prepared hardening — 2026-11-03

[R2](R2_TIMESTAMP_HARDENING.md) now has a minimal append-only helper configuration fix and guarded fresh/upgrade regression coverage prepared for review. Hosted deployment remains pending and requires authorization; read-only history still has four versions. No original milestone or sprint percentage changes: Sprint 0 remains `in_progress`, R1 partial and the completion gate open. Future sprint implementation is not activated.

## R3 remediation in validation — 2026-11-10

UI summary and this tracker now identify R3 Redis/CSP validation and pending deployment verification. The owner approved Vercel ingress and provisioned managed Upstash Redis on the Free plan. [R3 evidence and operational residual risks](R3_ABUSE_AND_BROWSER_SECURITY.md) govern the current slice. Original six milestones remain delivered/100%; Sprint 0 remains `in_progress`, its acceptance gate open, and Sprint 1 planned/zero. No deployment or merge is authorized by this checkpoint.

## R3 database backstop in validation — 2026-11-11

[The direct RPC quota migration](R3_DIRECT_RPC_BACKSTOP.md) is prepared with isolated regression/upgrade/concurrency/HTTP tests. Both UI language summaries reflect the pending database rollout and deployment/monitoring gates. All original milestone percentages remain unchanged: Sprint 0 `in_progress` / 100% of six delivered milestones; later sprints planned/zero. No hosted deployment or closure is claimed.

## R3 direct RPC validation checkpoint — 2026-11-11

[Backstop implementation and evidence](R3_DIRECT_RPC_BACKSTOP.md) now pass isolated CI, including direct HTTP429 and concurrent cross-tenant quotas. Both UI language summaries distinguish CI validation from pending hosted migration/deployment/monitoring. Sprint 0 and R3 remain open; original milestones/progress and Sprint 1 inactivity are unchanged.

## Authorized hosted rollout — 2026-11-11

[R2/R3 deployment and post-checks](DEPLOYMENT_2026-11-11.md) are now executed on the configured Supabase project: six recorded migration versions, pinned invoker helper, enabled private quota enforcement, hosted SQL/PT429/direct HTTP429 and 20 clean Chromium cases. Both language summaries now reflect applied database migrations and the remaining Vercel/monitoring work. Full hosted advisor refresh is pending due connector permissions. Sprint 0 remains `in_progress` / 100% of its six historical milestones; Sprint 1 stays planned/zero. No acceptance gate is closed.

## R4 planning package — 2026-11-11

[Recovery/deployment/monitoring planning](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md) is prepared; owner decisions and operational drills are pending. UI French/English summaries now distinguish deployed R2/R3 database controls from unexecuted R4 recovery/monitoring work. Milestone rows/progress remain unchanged: Sprint 0 `in_progress` / historical 100%, later sprints planned/zero. PR #11's original Ubuntu-DNS browser-install failures remain disclosed; new review-head checks must pass before merge.

## R4 owner decisions — 2026-11-12

Recorded primary incident/recovery owner as the project owner (user), technical backup unassigned, and business-hours coverage (exact window/timezone pending). Backup/monitoring evaluation may consider up to US$50/month total additional cost; every purchase/paid upgrade still needs explicit approval. Owner will provide different RPO/RTO values; earlier numerical proposals are not adopted. See [the updated decision register](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md). No provider, paid resource, backup/restore, deployment, alert schedule or acceptance gate was changed.

## R4 approved recovery targets — 2026-11-12

Supersedes earlier pending numerical-target/coverage notes: owner approved Sprint 0 foundation/controlled-pilot RPO ≤4h with automated backups 24/7, RTO ≤8 covered business hours, Monday–Friday 09:00–17:00 Atlantic/Reykjavik; report elapsed outage separately. Primary: project owner (user); technical backup unassigned. Evaluate ≤US$50/month total additional backup/monitoring cost; purchases/upgrades require approval. See [implementation proposal](R4_IMPLEMENTATION_PROPOSAL.md) and [updated R4 plan](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md). Daily backups alone are insufficient; published PITR pricing exceeds the ceiling; hourly encrypted backups remain a conditional proposal pending inventory, combined quote, completeness and measured isolated restoration. Off-hours failure response remains a gap. No provisioning, customer export or restore performed. R3, R4 and Sprint 0 gate remain open; reassess before financial transactions go live.

R4 feasibility follow-up — 2026-11-12: read-only metadata on the exact configured project verified PostgreSQL 17.11, 13,096,627 database bytes, six migration versions, and zero Storage buckets/object records. Management connector still denies project access; plan/recovery points/PITR are unverified. The [proposal](R4_IMPLEMENTATION_PROPOSAL.md) now contains a concrete candidate (dedicated $6 runner, encrypted B2 storage, independent free heartbeat, possible $25 Pro increment) with $41.70 combined monthly estimate including $10 drill reserve; account quote/tax/usage/privilege/maintainer assumptions prevent a budget or recovery guarantee. No provisioning, export, restore, purchase or code change. R3/R4 and foundation gate remain open.

## R4 scoped owner acceptance — 2026-11-15

Owner verified configured project `jlaufrjmjjheisdqkkao` in the dashboard: organization Free; scheduled-backup timestamp N/A (no automatic project backups); PITR disabled/unavailable. Owner accepts this backup-protection gap for development and Sprint 0 technical closure only. See the [scoped risk disposition](SPRINT_0_CLOSURE.md) and [R4 plan](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md). This is not acceptance of remaining R4/R3 work or overall completion. Sprint 0 stays `in_progress`; the PR stays unmerged. Adequate approved backup/recovery protection and tested restoration remain mandatory before real school/student/financial data in pilot/production. Four-hour RPO/24/7 automation and eight-covered-hour RTO remain unproven pilot targets. No upgrade, PITR activation, provisioning, export, restore, destructive operation or Sprint 1 is authorized. Source: owner-provided dashboard verification; API access remains denied.

R1–R7 review — 2026-11-15: [acceptance matrix](SPRINT_0_RISK_ACCEPTANCE_REVIEW.md) records R2 targeted remediation deployed, R3 implementation/backstop delivered with operational gates open, one current moderate development minimatch advisory (zero high/critical), 20 full-format differences, and remaining R6/R7 evidence. Only R4's backup gap has development-only acceptance. PR #11 remains open/unmerged at e108ee9; PR CI run 43213159586 passed on that committed head, not these uncommitted edits. No additional waiver, merge, pilot approval, cloud action or Sprint 1 activation occurred.

R6a closure-candidate implementation — 2026-11-15: onboarding alone prevents React's automatic native form reset so six editable non-secret settings survive safe failure replies and correction/retry. No auth form, server authorization, schema or shared field-control behavior changed. Added eight FR/EN retry tests and strengthened real authenticated FR/EN Chromium checks with non-default settings and persisted-setting assertions. [Risk review](SPRINT_0_RISK_ACCEPTANCE_REVIEW.md) records individual engineering recommendations; owner acceptance remains pending except the previously accepted R4 backup gap. Hosted advisor request remains permission-denied; no full report claimed. Overall Sprint 0 stays open and PR must remain unmerged.

R6a validation checkpoint: 142 unit/component/contract, ten CI safety and three Redis integration tests, lint/typecheck/build, changed-file formatting and hosted rollback-only DB checks pass. Chromium: 18 regression cases passed, then both enhanced FR/EN onboarding cases passed after correcting a stale test expectation (not a clean single 20-case run). See [full limitations and risk decisions](SPRINT_0_RISK_ACCEPTANCE_REVIEW.md). Full hosted advisor report and owner dispositions remain pending; final review-commit CI is still required.
