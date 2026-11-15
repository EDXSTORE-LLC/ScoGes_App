# R4 isolated restore drill — execution runbook and evidence template

Status: **not executed**. Use with [the R4 plan](../R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md). This template authorizes no export, restore, destructive action, resource purchase or disclosure. Current configured Supabase is the source to protect, not a rehearsal overwrite target.

Approved planning targets (2026-11-12): Sprint 0 foundation/controlled pilot, RPO ≤4h with automated backups 24/7; RTO ≤8 covered business hours. Coverage is Monday–Friday 09:00–17:00 Atlantic/Reykjavik. These are objectives, not demonstrated capabilities. See the [implementation proposal](../R4_IMPLEMENTATION_PROPOSAL.md).

## Preconditions / stop rules

1. Record approved RPO/RTO, owner and backup responder, drill window, cost envelope, source artifact and dataset permission. Assign an independent reviewer to verify source/target identities.
2. Verify provider plan/recovery-point entitlement, current tool/DB/extension versions and supported Auth/custom-schema restoration. Read current CLI help/provider procedure before generating any command. No copy-paste credential-bearing command lines or unsupported managed-schema rewrites.
3. Provision/approve an isolated, disposable target. Its project/database/credentials must differ from the configured source; a different schema or URL alias on the same source is not isolation. Confirm by provider identity plus metadata, not hostname spelling alone.
4. Before import, contain outbound effects: replace/disable production mail, webhooks, jobs and external credentials using approved controls. Use test mail sinks and a separate Redis database. Block accidental external delivery before restoring triggers/data; if the platform cannot provide the needed isolation, stop.
5. Verify artifact checksum/encryption/key access/retention and source timestamp. Do not put decrypted dumps in the repository, screenshots, chat or ordinary CI artifacts. Use approved restricted storage/runner and sanitized reports only.
6. Prepare a controlled backup canary or another owner-approved identity validation method. Never attempt to sign in as a real customer. A newly created post-restore account alone does not prove restored identity/password-hash behavior.

Stop if source/target identities differ from approval, backup scope is incomplete, costs are unapproved, decryption/restore permissions fail, outbound effects cannot be contained, or source writes could be touched. No reset/drop/restore command may target the configured source in this rehearsal.

## Execute and measure

1. Record incident/recovery-start time and latest valid source recovery point in UTC. Begin the full RTO clock before provisioning/retrieval, not only when the restore command starts. For an RPO drill, use an approved canary timeline to measure the last recovered committed write.
2. Export/retrieve only through the approved source-safe procedure. A backup read must not reset migrations, change application grants or stop the source without separate authorization. Record status/checksum/size/tool versions without dumping contents.
3. Follow the reviewed provider-aware schema/roles/data/Auth procedure on the confirmed isolated target. Preserve managed ownership requirements, six migration history versions, private quotas, RLS, policy/function/trigger definitions and intentional grants. Do not assume a public-only export or replaying migrations recovers all data/identity/configuration.
4. Reconstruct environment-specific Auth issuer/URLs/redirects, mail sink, secret references and separate Redis. Do not reuse production provider secrets in the drill target. Validate private-schema function paths and quota trigger before allowing application writes.
5. Run the validation matrix below. Distinguish restored source canaries from freshly seeded data. Record failures as failures; do not edit balances, roles, history or counters merely to make checks pass.
6. Evaluate restored security state: backups can reintroduce old roles, sessions or pending invitations. Reconcile post-backup role/membership revocations and consumed invitation/recovery credentials before reopening access. Apply a reviewed provider-supported session/link invalidation/reconciliation procedure when needed; do not blindly resurrect access or rotate signing keys without authorization.
7. Capture usable-service/canary completion and owner acceptance time. Compute observed RPO as the interval between incident onset and the latest recoverable source snapshot/controlled commit, documenting write inactivity separately. Compute covered RTO by summing only overlap with Monday–Friday 09:00–17:00 Atlantic/Reykjavik from incident onset through validated usable service; pass threshold is eight covered hours. No holiday exclusions are approved. Separately report total elapsed outage without removing nights/weekends. Include provisioning, retrieval, decryption, import, security reconciliation and validation. Record detection/acknowledgement delay independently. For example, a Friday 16:00 incident restored Monday 16:00 consumes eight covered hours but 72 elapsed hours.
8. Record disposition and cleanup. Destroy only the approved disposable target/artifacts under explicit cleanup authorization and retention policy; never delete the source or its last good backup. Keep sanitized evidence and checksum references.

## Required validation matrix

| Area                | Proof required                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Completeness        | Schema/data/constraints/indexes/extensions and all six migration versions match the approved backup manifest; reconcile row counts/checksums without exporting PII to reports |
| Identity            | Controlled restored identity signs in correctly; target issuer/session/callback configuration works; no production session/cookie/secret is accepted accidentally             |
| Tenant isolation    | Tenant A cannot enumerate/read/mutate Tenant B; anonymous/inactive/revoked/forged context remains denied                                                                      |
| Authorization/audit | Live permissions, last-administrator concurrency, stale revisions and atomic business/audit rollback pass                                                                     |
| R2/R3               | Invoker helper pinned to pg_catalog; private schema/RLS/grants intact; quota history retained, direct HTTP429 and rollback behavior verified with controlled fixtures         |
| Invitations/mail    | One-use/expired/issuer-revoked rules; approved reconciliation of links consumed after backup; test-mail receipt/link completion without real recipients                       |
| Application         | FR/EN login/onboarding/dashboard/tracker/users/settings journeys, locale navigation and document language; CSP/hydration/error handling                                       |
| External assets     | If any Storage objects are in scope, verify binaries as well as metadata and access policies; otherwise record inventory-confirmed not applicable                             |
| Operational         | Restore/failure/backup-age alerts reach the named responder and are acknowledged; complete artifact and target cleanup evidence                                               |

Local-only destructive upgrade/race fixtures in existing scripts must never be pointed at a hosted restore target. Use their isolated CI coverage plus a separately approved target-safe validation procedure. Database/financial recovery guarantees for unimplemented later-sprint features are outside this foundation drill.

## Evidence record — fill only after execution

| Field                                                       | Recorded value                                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Approval / source classification / exact target             | Pending                                                                                                           |
| Primary, backup, reviewer and coverage                      | Primary: project owner (user); technical backup/reviewer unassigned; Monday–Friday 09:00–17:00 Atlantic/Reykjavik |
| Accepted RPO/RTO                                            | Planning: ≤4h / ≤8 covered business hours; not demonstrated                                                       |
| Incident start / recovery-point UTC / validated-service UTC | Not measured                                                                                                      |
| Tool/DB versions, backup ID/checksum/key reference          | Not captured; references only, no secrets                                                                         |
| Export/decrypt/import/configure/validate timings            | Not measured                                                                                                      |
| Observed RPO / covered RTO / elapsed outage / objective met | Not measured / not claimed                                                                                        |
| Validation outcomes and access/link reconciliation          | Not executed                                                                                                      |
| Alert delivery / acknowledgement                            | Not executed                                                                                                      |
| Source unchanged / cleanup proof / retained artifacts       | Not executed                                                                                                      |
| Failures, residual risks and owner sign-off                 | Pending                                                                                                           |

Provider references: [backups and coverage](https://supabase.com/docs/guides/platform/backups), [provider-aware backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). Verify actual project capabilities before execution.
