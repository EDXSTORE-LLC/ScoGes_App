# Project documentation map

Current Sprint 1 implementation follows explicitly approved S1-D1–D6, including
one active year per tenant, immutable codes and insert-only imports. Read
[the implementation and verification record](SPRINT_1_IMPLEMENTATION.md) before
working on these modules. The branch remains unmerged and no hosted rollout or
Sprint 2 is authorized.

Current execution — **2026-11-19**: Sprint 0 closure PR #12 is merged on main
`2b248aaff8d85bfcdfaf9db94ca43c19852fbf99` with green merge CI. The owner now
authorizes [Sprint 1 implementation](prompts/SPRINT_1_MASTER_PROMPT.md) on its
dedicated branch; [business decisions](SPRINT_1_DECISIONS.md) now record explicit
owner approval with corrections. This supersedes
historical inactive-Sprint-1 notes, without authorizing deployment or Sprint 2.

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

Latest closure review — **2026-11-19**: [hosted compatibility and final CI](SPRINT_0_OWNER_CLOSURE_REVIEW_2026-11-19.md)
supersedes pending hosted-policy/final-CI evidence below. Hosted minimum 12/four
classes is owner-confirmed; Advisor is 0 ERROR / 7 WARN / 1 INFO. Preserve the
development-only review boundary and await explicit owner closure acceptance.

Latest hosted review — **2026-11-18**: [owner-verified Advisor/Auth reconciliation](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) supersedes missing-value notes: Advisor **0 ERROR / 7 WARN / 1 INFO**; hosted minimum **6**, no required character classes. The security gate remains blocked by unaccepted weak password policy and other required security/CI checks. No hosted Auth change or new waiver.

Latest security checkpoint — **2026-11-18**: [Security Advisor function remediation](SECURITY_ADVISOR_2026-11-18.md) records the applied seventh migration, per-function dispositions, server-only invitation delivery and actual verification limits. Full hosted Advisor/password-policy inspection and newly reported dependency advisories keep the security gate open.

Current hosted checkpoint — **2026-11-11**: PR #10 is merged; the R2 helper and R3 direct-RPC quota migrations are now applied to the configured project and post-deployment checks passed. [Deployment evidence](DEPLOYMENT_2026-11-11.md) supersedes older pending-deployment notes below. Full advisor refresh, Vercel/monitoring and Sprint 0 acceptance remain open; Sprint 1 is inactive.

Closure-review checkpoint: 2026-11-01, after merged PR #7. Start with [AGENTS.md](../AGENTS.md) and [the shared handoff](AI_HANDOFF.md). Follow the repository's instruction precedence; this index does not replace the current human request or authorize implementation of a later sprint.

## Requirements and engineering authority

| Document                                                                                                                                                                     | Role                                                                              | Maintenance rule                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [AGENTS.md](../AGENTS.md)                                                                                                                                                    | Permanent repository rules, safety, STABLE workflow and sprint boundary           | Apply to every agent; preserve safeguards                                    |
| [Product specification](product/PRODUCT_SPEC.md)                                                                                                                             | Business/product requirements                                                     | Change only for an approved requirements change                              |
| [Detailed product source](product/Cahier_des_charges_SaaS_Gestion_Scolarite_V2_EDXSTORE.docx.md) and [product PDF](product/Cahier_des_charges_SaaS_Gestion_Scolarite_V2.pdf) | The `.docx.md` is a missing-DOCX notice; the PDF is the available detailed source | Read the actual available source; do not assume a missing native file exists |
| [Active Sprint 0 prompt](prompts/SPRINT_0_MASTER_PROMPT.md)                                                                                                                  | Current sprint scope and Definition of Done                                       | Keep Sprint 0 active until the owner explicitly changes it                   |
| [STABLE framework](engineering/STABLE_FRAMEWORK.md)                                                                                                                          | Engineering method                                                                | Preserve normative guidance during status updates                            |
| [STABLE coding skill](../ai-rules/STABLE_AI_CODING_SKILL.md)                                                                                                                 | AI implementation/verification/reporting method                                   | Apply alongside the repository rules                                         |

Root product/framework/prompt/skill copies remain available as distribution references. They were not rewritten to encode changing deployment status or pay down unrelated formatting debt. Compare conflicting copies and report genuine discrepancies before changing requirements.

## Operational documents

| Document                                      | Owns                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Project tracker](PROJECT_TRACKER.md)         | Every sprint/milestone ID, status and progress, synchronized with UI data          |
| [AI handoff](AI_HANDOFF.md)                   | Cross-agent restart instructions, invariants, environment and verification runbook |
| [Sprint 0 validation](SPRINT_0_VALIDATION.md) | Dated executed checks, coverage matrix, failure states and acceptance gaps         |
| [Architecture](ARCHITECTURE.md)               | Module/runtime boundaries and provider adapters                                    |
| [Data model](DATA_MODEL.md)                   | Tables, migration chain, RPC/constraint and financial-domain boundaries            |
| [Security](SECURITY.md)                       | Authentication/authorization, secrets, isolation and known security limits         |
| [Decisions](DECISIONS.md)                     | Durable ADRs and engineering choices                                               |
| [Authentication](AUTHENTICATION.md)           | Auth/cookie/email/invitation behavior and external configuration                   |
| [Administration](ADMINISTRATION.md)           | Role/status/settings transitions, locks, stale writes and audit semantics          |
| [Database testing](DATABASE_TESTING.md)       | Hosted transactional tests versus isolated committed race fixtures                 |
| [CI](CI.md)                                   | Event coverage, required gate, artifacts, isolation and main protection            |
| [Implementation log](IMPLEMENTATION_LOG.md)   | Append-only dated delivery/deployment/verification history                         |

Database hardening: [R2 timestamp-helper change, tests and pending deployment](R2_TIMESTAMP_HARDENING.md). Hosted history remains the original four migrations until separately authorized deployment.

Prototype outcome: [actual consumer-patch candidate and no-go decision](R1_CONSUMER_PROTOTYPE.md), with [passive patch/result bundle](investigations/R1_CONSUMER_PROTOTYPE_RESULTS.json). The application graph is unchanged; R1 is not closed.

Targeted dependency follow-up: [R1 partial remediation and minimatch compatibility blocker](R1_DEPENDENCY_REMEDIATION.md), [bounded migration investigation](R1_MINIMATCH_MIGRATION.md) and [sanitized spike results](investigations/R1_MINIMATCH_RESULTS.json). This does not close R1 or accept residual risk.

Remediation planning: [R1–R7 actionable backlog](SPRINT_0_REMEDIATION.md) records the owner’s decision to keep the gate open, responsible functions, priorities and verification criteria. It authorizes documentation/planning only.

Closure-specific records: [completion gate](SPRINT_0_COMPLETION_GATE.md), [closure acceptance and risk register](SPRINT_0_CLOSURE.md), and [real email evidence](SPRINT_0_EMAIL_VALIDATION.md). Current review is [PR #8](https://github.com/Edleben/ScoGes_App/pull/8); verify its exact-head CI and human acceptance separately.

## Agent entry points

- Codex and other repository agents: [AGENTS.md](../AGENTS.md).
- Claude Code: [CLAUDE.md](../CLAUDE.md), then the shared rules/handoff.
- Antigravity: [ANTIGRAVITY.md](../ANTIGRAVITY.md), then the shared rules/handoff. This is a documented entry point; no tool-specific automatic loading is claimed.

## Updating status

Update `src/modules/project-tracker/tracker-data.ts` and `PROJECT_TRACKER.md` together; a unit test checks every table ID/status/progress row. Update dated evidence only after checks actually execute. Include source branch/commit/PR context in the handoff or review record; verify live GitHub and database state before acting on old snapshots. Keep credentials and real connection URLs out of all documents.

## Next sprint proposal

The [bounded Sprint 1 prompt](prompts/SPRINT_1_MASTER_PROMPT.md) is proposed and inactive. The [foundation completion gate](SPRINT_0_COMPLETION_GATE.md) has complete technical evidence, including [hosted email verification](SPRINT_0_EMAIL_VALIDATION.md), but the owner kept it open for R1–R7 remediation; Sprint 0 remains active. Approval and implementation follow the documented gate, rather than the presence of a prompt file.

Security follow-up: [R3 distributed Redis limits and browser policy](R3_ABUSE_AND_BROWSER_SECURITY.md) records the owner-approved provider, server-only configuration, failure policy, evidence and pending deployment gate.

Direct API follow-up: [R3 database write-quota backstop](R3_DIRECT_RPC_BACKSTOP.md) describes the prepared append-only migration, security/retention/transaction boundaries and pending deployment gate.

R4 planning package: [recovery/deployment/monitoring plan](R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md), [isolated restore runbook/evidence template](runbooks/RESTORE_DRILL.md), and [release/rollback/incident runbook](runbooks/RELEASE_MONITORING_INCIDENTS.md). These are plans, not executed recovery or production readiness. Owner objectives, budget, targets and responders remain pending.

- [R4 implementation proposal and approved recovery targets](R4_IMPLEMENTATION_PROPOSAL.md): feasibility, budget gaps and staged approval; not executed.

- [Current Sprint 0 R1–R7 acceptance review](SPRINT_0_RISK_ACCEPTANCE_REVIEW.md): evidence, proposed development dispositions, pilot gates and remaining owner decisions (2026-11-15).
