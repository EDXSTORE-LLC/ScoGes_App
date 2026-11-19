# R4 — Recovery, deployment and monitoring plan

## Owner-approved backup risk disposition — 2026-11-15

The owner manually verified the dashboard for configured Supabase project `jlaufrjmjjheisdqkkao` and reported: **organization plan Free; latest successful scheduled backup N/A (no automatic project backups on this plan); PITR disabled/unavailable**. This is owner-verified dashboard evidence, not a successful connector/API inspection. No off-site backup or recoverability is inferred.

The owner explicitly accepts **this lack of automatic backup/PITR protection as a residual infrastructure risk for development and Sprint 0 technical closure only**. This supersedes the earlier unaccepted/pending disposition for the backup portion of R4. It does not accept every R4 item, other R1–R7 dispositions, or overall Sprint 0 completion. Keep Sprint 0 `in_progress` pending the remaining applicable checks and explicit overall acceptance; R3 and remaining R4 operational work stay open.

**Pilot/production blocker:** before real school/student/financial data is used, approve and implement adequate backup/recovery protection and test restoration. A paid daily backup alone does not meet the approved four-hour RPO; off-site manual backups alone do not demonstrate the previously approved automated 24/7 objective. Retain the four-hour RPO/eight-covered-business-hour RTO as unproven pilot planning targets unless explicitly revised. No production readiness, purchase, upgrade, PITR activation, export, restore, destructive database operation, PR merge or Sprint 1 activation is authorized.

Primary risk owner: project owner (user); technical backup remains unassigned. Reassess before pilot/production and before financial transactions become live. Execution evidence remains required for the operational protection, even though this scoped risk is accepted for development closure.

Checkpoint: 2026-11-12 (owner decisions updated). **Planning prepared; operational execution and acceptance are open.** This is risk R4 within Sprint 0. Roadmap implementation remains at Sprint 0. No backup/export, restore, cloud resource, deployment, alert subscription, paid upgrade or customer communication is authorized by the presence of this plan. Owner requested planning only. Sprint 1 remains inactive.

## Outcome and evidence standard

Prepare a recoverable, controlled foundation environment with a measured restore procedure, reproducible release/rollback, tested alerts and bounded bilingual/mobile/UAT evidence. Completion requires executed evidence and owner acceptance; CI, SQL rollback tests, a backup file or a configured dashboard do not individually prove recoverability.

| Verified repository/provider evidence                                                                                           | Limitation / follow-up                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Hosted R2/R3 rollout](DEPLOYMENT_2026-11-11.md): six migration versions, quota/RLS/HTTP429 and 20 hosted Chromium cases passed | No restore drill, recovery timing or public Vercel validation was performed                                                                                                  |
| PR #10 merged at main `fc90421`; [merge CI](https://github.com/Edleben/ScoGes_App/actions/runs/43026311448) passed              | Historical evidence; every release needs its own reviewed commit/environment                                                                                                 |
| [PR #11](https://github.com/Edleben/ScoGes_App/pull/11) is open for deployment evidence; quality/database steps passed          | Both original runs failed at Chromium dependency installation because Ubuntu mirrors could not resolve; Chromium cases did not start. No browser regression pass is inferred |
| Current Supabase project is the one configured locally; connector denied project-settings/advisor access                        | Owner verified Free/no scheduled backups/PITR unavailable on 2026-11-15; connector and isolated restore permissions remain unresolved                                        |
| Vercel connector returned zero projects in the queried default scope; no repository link/config was found                       | Team/project/environment/domain/region are unverified; zero visible projects is not proof none exists in another scope                                                       |
| Upstash Free was selected by the owner; Redis limits fail closed                                                                | Current usage/plan dashboard, quota alerts, isolation and incident response are unverified; no paid upgrade is approved                                                      |
| Safe events `security.rate_limit.unavailable` and `auth.signup.failed` exist                                                    | No Sentry/OpenTelemetry SDK/instrumentation or functioning collector/alert route was found; `SENTRY_DSN` is a placeholder, not an integration                                |
| Private actor-scoped quotas and transactional audit exist                                                                       | Missing-config/unknown-ingress paths can return unavailable without the Redis warning event; 200/5xx uptime checks alone miss broken authentication                          |

Repository observations apply to the inspected branch. Provider permissions prevent a complete cloud inventory; never substitute a globally connected project for the configured one. No Redis key values, customer rows, dumps or environment secrets were inspected for this planning task.

## Decisions requiring owner approval

| ID    | Proposed decision / input                                                                                                                                                    | Status                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| R4-D1 | Sprint 0 foundation/controlled pilot: RPO ≤4 hours with automated backups 24/7; RTO ≤8 covered business hours; report elapsed outage separately                              | Planning targets approved 2026-11-12; capability not demonstrated. Reassess before financial transactions go live             |
| R4-D2 | Evaluate backup/monitoring options within **US$50/month total additional cost**; mechanism, retention, encryption/key custody and storage still need selection               | Evaluation ceiling accepted 2026-11-12; every purchase/paid upgrade requires separate owner approval. No new spend authorized |
| R4-D3 | **Primary: project owner (user). Backup: unassigned. Coverage: Monday–Friday, 09:00–17:00, Atlantic/Reykjavik.** Contact route and acceptance authority still need recording | Ownership and exact coverage approved 2026-11-12; no 24/7 human coverage. Backup assignment remains open                      |
| R4-D4 | Exact isolated restore source/target, authorized dataset, restore window, target destruction/retention policy and any compute cost                                           | Not approved; no restore/export may start until recorded                                                                      |
| R4-D5 | Vercel team/project, protected preview and intended production targets, domains, region and separate backend/Redis/mail resources                                            | Unverified; production credentials must not leak into arbitrary PR previews                                                   |
| R4-D6 | Backup/log retention and access review, customer-data handling, canary identities and post-restore session/invitation reconciliation procedure                               | Pending security/product approval                                                                                             |
| R4-D7 | Controlled pilot participants, accessibility/UAT approvers and incident/release acceptance authority                                                                         | Unassigned; current journeys cover foundation only, not school-fee collection                                                 |

Record the owner's actual answer with date and scope; silence and these proposals are not approval. If budget cannot support the selected target, report the gap and revise scope/targets explicitly rather than claiming success. Revisit objectives before financial/student-data workloads begin.

## Backup design options to evaluate

Keep the current provider stack while verifying capabilities; no new provider is selected here.

| Candidate                                                                 | What must be verified before selection                                                                                                                                                                   |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Supabase managed daily backups                                   | Actual plan, retained successful points, scope/export access and isolated-restore support. Daily granularity alone cannot satisfy the approved four-hour RPO                                             |
| Provider-aware encrypted logical exports to an approved independent store | Complete consistent schema/data/roles/Auth/private metadata coverage, schedule, upload verification, retention, key recovery and measured restore. A default public-schema dump is insufficient evidence |
| Supabase PITR if eligible and separately approved                         | Plan/add-on availability, recovery window, cost, permissions and an actual isolated restore exercise. Fine recovery granularity is not proof of the approved eight-covered-business-hour service RTO     |

Supabase documents daily-backup retention by plan, recommends regular off-site exports for Free projects, and offers PITR on eligible paid plans. Database backups do not include Storage object binaries; maintain a separate object inventory/restore procedure if Storage is introduced. Actual project capabilities remain unknown. [Provider backup documentation](https://supabase.com/docs/guides/platform/backups)

See the [bounded implementation proposal](R4_IMPLEMENTATION_PROPOSAL.md) for feasibility and costs. Proposed hourly automated backups run 24/7, including weekends; cadence is not yet configured. Measure freshness from the consistent source snapshot, not upload completion. Proposed warnings at age 2h, urgent at 3h and a recorded breach beyond 4h leave headroom for retry; these are proposals, not functioning alerts. A failed export/upload never advances the verified recovery point.

RTO counts the intersection of incident-onset-to-validated-service with Monday–Friday 09:00–17:00 in Atlantic/Reykjavik, with a limit of eight covered hours. Record detection, acknowledgement and every recovery stage separately; do not start the clock at detection or exclude provisioning/validation. Also report the full elapsed outage. No holiday exclusions have been approved. Automated backup coverage is 24/7, human response is not: an unattended weekend failure can breach RPO. Automated retry and alerts alone do not prove that gap closed. Obtain a tested response/escalation disposition without silently relaxing the target. Preserve independent access to backup keys and release artifacts.

Proposed operational retention for owner review: frequent recovery points for 48 hours, daily points for 14 days and weekly points for four weeks, subject to data classification, actual provider support and approved storage costs. Estimate retained bytes from measured backup size/copy count plus object data and transfer; do not assume a free plan can supply this policy. This is a recovery proposal, not a decision about financial/legal record retention. Business audit history is not shortened by backup expiry.

Proposed verification cadence: validate each artifact, test independent key access/an older retained point monthly, and perform an initial pre-pilot restore plus quarterly rehearsals or after material backup/Auth/schema/provider changes. No schedule or automation has been created; D2/D3 approval and feasibility proof remain necessary.

## Recovery manifest and controls

The approved backup manifest must cover business tables/constraints/indexes, all six migration versions and reviewed SQL hashes, RLS/policies/grants, functions/triggers/search paths/extensions, `app_private.rpc_write_windows`, and supported Auth users/identity/password-hash restoration. Include Auth provider/redirect configuration, app/environment inventory and object binaries separately where applicable. Redis counters are transient security state, not financial records; their recovery/reset must not disable fail-closed controls or the database backstop.

Store dumps only in approved encrypted restricted storage. Treat identity data/password hashes as sensitive. Keep decrypting keys and recovery access independent from the artifact; verify backup-operator access and inherited/PUBLIC EXECUTE permissions before describing a credential as read-only. No production secret or data dump belongs in ordinary PR CI, Git, raw test artifacts or chat. Separately reviewed privileged backup workflows need protected environments, trusted refs and least-privilege access; ordinary CI remains secret-free.

Retained artifacts need source timestamp, completion/verification time, checksum, size, format/tool/DB versions, schema/migration reference, source classification, storage locator, expiry and access-owner references. Record locators/secret references, not credentials. Verify retention of an older point and independent key access as well as the newest backup.

## Ordered execution slices

| Slice                                   | Deliverable and acceptance                                                                                                          | Dependency / authority                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| R4-01 Inventory and decisions           | Confirm D1–D7, account capabilities, backup/alert ownership and cost envelope                                                       | Owner answers and correct provider access; no paid resource provisioned during planning |
| R4-02 Backup path                       | Approved mechanism/schedule/retention/key recovery plus automated freshness/failure evidence                                        | D1/D2/D3/D6 accepted; separate implementation authorization                             |
| R4-03 Isolated restore drill            | Complete [restore runbook](runbooks/RESTORE_DRILL.md), actual RPO/RTO, identity/tenant/audit/quota checks and cleanup evidence      | D4 approved; never restore over the configured source project for a rehearsal           |
| R4-04 Protected Vercel preview          | Confirm environment separation, branch protection, actual HTTPS/ingress/CSP/callback/session behavior in FR/EN                      | D5 approved; separate deployment/configuration authorization                            |
| R4-05 Release/rollback and alert drills | Execute [release/incident runbook](runbooks/RELEASE_MONITORING_INCIDENTS.md), compatible rollback and delivered/acknowledged alerts | Known-good artifacts and staffed response route; no database downgrade/limit bypass     |
| R4-06 Foundation usability/UAT          | Keyboard/mobile/bilingual/accessibility and role-negative journeys; dated defect dispositions                                       | D7 and controlled test data/participants; only implemented foundation flows             |
| R4-07 Acceptance                        | Owner reviews evidence against objectives and residual risks; decide R3/R4 dispositions through validated PR                        | Not inferred from any earlier approval/merge, backup existence or green CI              |

Original PR #11 infrastructure failure: retain the gate, inspect sanitized package/DNS failure, retry on a fresh runner only when justified, and escalate repeated provider failures. Do not remove Chromium/dependency/security checks, alter DNS globally or merge failed validations. Maintain a known-good compatible deployment artifact for recovery; an emergency rollback is not an unvalidated code release.

## Monitoring and initial response proposals

All rows below are **unconfigured/untested** until proof of collection, delivery and acknowledgement is recorded. Thresholds are initial proposals for the controlled pilot; owners tune them from evidence.

| Signal                        | Proposed trigger                                                                                                             | First response / evidence                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backup freshness/integrity    | Proposed source-point age: warn 2h, urgent 3h, breach >4h; any failed verification or missing decryption key                 | Check last source recovery point, escalate to owner; never mark an empty/failed artifact successful                                                    |
| Public/protected availability | Two consecutive 1m public failures; controlled login/dashboard canary every 5m; any unexpected dependency-unavailable result | Distinguish page uptime from functional auth readiness; canary uses dedicated identity and bounded quota, no real customer reads                       |
| Redis provider/configuration  | Any provider-unavailable event in 5m or failed auth/readiness canary                                                         | Check scoped environment metadata and provider state; preserve fail-closed behavior. Missing config/ingress errors need independent readiness coverage |
| Redis usage                   | Warn 70%, urgent 90%, or projected exhaustion <7 days of verified allowance                                                  | Notify named owner, confirm response/approved plan action; Free plan does not imply paid budget-alert features exist                                   |
| Application errors/latency    | Sustained unexpected 5xx >1% with ≥100 requests/5m, or three failures at low volume; p95 >2s/10m                             | Correlate safe event/status/release ID; never export raw cookies/forms/URLs with tokens                                                                |
| Data API abuse/auth failure   | Sustained PT429/denial anomaly; any unexpected cross-tenant success is critical immediately                                  | Separate expected negative tests/legitimate throttling from abuse; preserve RLS and both quota layers                                                  |
| Auth/mail                     | Confirmation/recovery/invitation errors or missing delivery from an authorized controlled probe                              | Diagnose provider quota/transport/receipt; SMTP authentication alone is not delivery proof. No routine real-user reset-email spam                      |
| DB/security/config drift      | Unexpected migration/grant/search-path/trigger change; full advisor error or failed targeted check                           | Contain affected writes, compare reviewed metadata, fix forward with approval; no dump of customer records                                             |
| Release/CI                    | Any required gate failure or failed deployed smoke check                                                                     | Stop promotion; diagnose code versus external installation failure without suppressing tests                                                           |

Upstash exposes console usage metrics; actual alert/API/retention entitlement needs confirmation. Verify any native notification feature before relying on it. SDK identifier analytics stay disabled. [Metrics documentation](https://upstash.com/docs/redis/howto/metrics-and-charts), [plan/budget documentation](https://upstash.com/pricing/redis).

## Exit evidence checklist

- Accepted D1–D7 and named owners/coverage; approved costs and target environment map.
- Successful scheduled backups, freshness/failure alerts and independent artifact/key access demonstrated.
- Isolated restore report with measured loss/time, tenant-negative/Auth/audit/private-quota checks and post-backup access-change reconciliation.
- Protected preview, actual Vercel trust/HTTPS/CSP/locale tests and a compatible release/rollback drill.
- Delivered and acknowledged alerts, tested escalation and quota/outage response; observability data minimization verified.
- Foundation keyboard/mobile/UAT evidence and reviewed defects; no fabricated academic/payment/parent-portal capability.
- Correct-project full hosted advisor review and unresolved security dispositions; code/CI checks green on the review head.
- Explicit owner acceptance. R4/R3 and Sprint 0 remain open until applicable evidence passes; no production/pilot launch or Sprint 1 is automatic.

## Recorded owner response — 2026-11-12

Owner approved Sprint 0 foundation/controlled-pilot planning targets: RPO ≤4h with automated backups 24/7; RTO ≤8 covered business hours, with elapsed outage reported separately. Coverage: Monday–Friday 09:00–17:00 Atlantic/Reykjavik. Primary: project owner (user); technical backup unassigned. Evaluate total additional backup/monitoring cost within US$50/month; obtain approval before every purchase/upgrade. No provisioning, customer export or restore is authorized. Actual feasibility, provider selection and executed evidence remain pending. R3, R4 and Sprint 0 gate stay open. Reassess before financial transactions go live.

## Read-only feasibility follow-up — 2026-11-12

The [implementation proposal](R4_IMPLEMENTATION_PROPOSAL.md) now records exact-project read-only SQL metadata (PostgreSQL 17.11, approximately 12.5 MiB, six migration versions, no Storage buckets/object records), repeated management permission denial and a concrete candidate cost model of $41.70/month including a $10 drill reserve. This is conditional on published rates, actual account billing, workload, region/terms and unpriced operational cover. Actual backup points and PITR entitlement remain unknown. Source data was not exported or changed; no resources, paid plans or restore operations were executed. Existing cloud inventory gaps remain open.
