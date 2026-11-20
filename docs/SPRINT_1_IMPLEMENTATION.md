# Sprint 1 — implementation and verification record

Status: **technical delivery; owner review and exact-head CI required before merge, not formally closed**.
Active scope and business rules: [approved S1-D1–D6](SPRINT_1_DECISIONS.md).
Branch: `feat/sprint-1-academics-students-enrollments`, based on clean main
`2b248aaff8d85bfcdfaf9db94ca43c19852fbf99` after Sprint 0 closure PR #12.
No automatic merge, hosted migration, public deployment or Sprint 2.

## PR #13 targeted review remediation — 2026-11-20

The final review identified three cases absent from the original green suite:
worksheet paths outside the hard-coded lowercase directory could bypass sparse
coordinate checks; saved references outside the 500-option window could disappear
on edit; and legal formula namespace prefixes could bypass regex rejection.

The targeted fixes inspect every accepted XML part before workbook parsing, using
namespace-aware SAX element/attribute events rather than path or prefix regexes.
Coordinate/dimension and physical row/cell budgets apply regardless of part path;
formula local names are rejected before cached values can be read. Ambiguous
coordinate attributes fail closed, and a 64-element XML depth cap bounds the safety
parser's own stack. ZIP/CRC/expanded-byte limits, DTD/entity,
external-link and macro/binary protections remain enforced. `saxes` 6.0.0, already
resolved through jsdom, is now a pinned direct server dependency: Node has no
built-in XML parser, and the XLSX reader's internal parser is not a supported
public API. No package upgrade or additional resolved package is introduced.

Edit pages retain the 500-item suggestion bound and tenant-scope fetch only the
edited record's missing saved reference IDs, which come from the server-loaded
record. Missing/inaccessible saved references fail closed; optional clearing still
requires the user's explicit selection. New mandatory unit/component cases cover
FR/EN preservation, clearing, in-window references and foreign-tenant denial.
XLSX regressions cover canonical/case-variant/custom paths, extreme sparse rows
and columns, decoded/ambiguous attributes, namespace variants and normal files;
spies prove dangerous files are rejected before the workbook reader is invoked.

No business-rule, migration, RLS, permission, CSP or hosted configuration change
is part of this remediation. The original CI #102 is historical evidence only;
the remediated PR head requires a fresh complete PR CI run. Final head/run,
re-review and rollout checklist are recorded in `reports/PR_13_FINAL_REVIEW.md`.

## Baseline recheck — 2026-11-20

Fresh `git fetch origin` confirms current `origin/main` is still
`2b248aaff8d85bfcdfaf9db94ca43c19852fbf99`, the Sprint 0 closure PR #12 merge.
The branch reflog records creation directly from that `origin/main` on
2026-11-19 at 19:35:46 UTC. `git merge-base HEAD origin/main` returns the same
commit; `git rev-list --left-right --count origin/main...HEAD` returns `0 9`
before this documentation commit. No main commit is missing and no merge/rebase
is necessary. All nine additional commits implement or verify Sprint 1; no old
Sprint 0 branch work was carried independently. Existing applied migration files
are unchanged; only the append-only Sprint 1 migration is added.

CI #99 failed its two Sprint 1 browser cases because client-imported Zod validation
probed dynamic code execution prohibited by the existing CSP. Commit `ddeb877`
separates plain client metadata from server-only validation/import preparation;
no CSP relaxation or test bypass was made. CI #100 passes all three mandatory
jobs. Earlier fixture failures were corrected in place: explicit test role setup,
preservation of the shared private schema during rollback-only quota replay, and
complete tenant settings for concurrency fixtures. Form revision updates also
preserve success feedback. `Required validation` is the aggregate dependency gate;
it failed when integration failed, without an independent defect. Historical red
runs remain visible and are superseded by green run #100, not erased or bypassed.

## Domain and UI

- Academics: years, optional periods, reusable programs/levels and year-scoped
  classes. Years may overlap; a partial unique index permits at most one active
  year per tenant. Closed historical year identity/dates cannot be overwritten.
- People: students and guardians with tenant-unique immutable internal codes,
  editable names/contacts/fr-en language/preferences, logical archiving and
  many-to-many relationships with explicit relationship, priority and primary flag.
  Guardian creation never creates an Auth account or sends notifications. Billing
  contact is metadata only; there are no financial records or billing operations.
- Enrollments: one canonical student/year record; draft → active → completed or
  withdrawn, draft → cancelled. Terminal records cannot be rewritten. Changes in
  class/level/program/status have immutable before/after history and actor identity.
- Routes: `/dashboard/school/{years,terms,programs,levels,classes,students,guardians,links,enrollments}`
  and `/dashboard/imports`, preserving `?locale=fr|en`. Lists paginate at 25,
  search code/name and filter status. A selected person shows family links and
  enrollments. Reference suggestions are bounded to 500; a server-resolved code
  input permits selection outside that window without trusting client IDs.
- Labels, errors, status names, navigation and import outcomes are centralized
  in FR/EN messages. Responsive forms and horizontally scrollable tables preserve
  native labels, keyboard controls, required states and live error/status feedback.
  Client form metadata is plain data; Zod schemas and database/import preparation
  are server-only. This avoids browser JIT/eval under the unchanged strict CSP.
  Form action state survives revisions; only the editor fields reset when the
  server returns a new revision, preserving optimistic concurrency and feedback.

## Database and authorization

New append-only migration: `20261119210612_sprint_1_academics_people.sql`.
It adds ten public tables: five academic references, students, guardians,
student_guardians, enrollments and enrollment_history. Composite `(tenant_id,id)`
foreign keys prevent foreign-tenant relationships; codes and canonical enrollment
uniqueness are database constraints. No existing applied migration is rewritten.

Authenticated clients receive SELECT only, protected by active tenant membership
and domain-specific read permissions. There is no direct INSERT/UPDATE/DELETE grant.
Fourteen explicit permissions are assigned only to tenant_admin/registrar; finance,
cashier, auditor and platform metadata gain no new implicit access. Application
roles and current database permission are both checked; caller-selected tenant,
actor, role, revision or protected ownership is never authoritative.

Two deliberate authenticated definer RPCs are introduced:

| RPC                                                      | Why privileged execution is required                                      | Mandatory checks                                                                                                                                                                                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `save_school_record(uuid,text,uuid,bigint,jsonb)`        | Atomic mutation/history/audit while domain tables remain client read-only | Verified Auth identity from `auth.uid()`, active membership and explicit per-entity permission, active tenant lock and recheck, static entity/field allowlists, typed database columns, immutable code/ownership, expected revision, reference/status invariants, write quota. |
| `commit_school_import(uuid,text,uuid,timestamptz,jsonb)` | Per-row atomic insertion plus idempotent batch result/audit               | Current import/domain permissions, same locked active tenant, expiry/size/row bounds, actor-derived batch ownership, SHA-256 payload match on replay, insert-only calls to the same guarded mutation gateway.                                                                  |

Both have `search_path=''`, schema-qualified objects and no PUBLIC/anon/service_role
execution. Private helper functions are not exposed. The existing six Sprint 0
definer dispositions are unchanged. The hosted Advisor result remains the last
owner-verified **0 ERROR / 7 WARN / 1 INFO** because this migration is not deployed;
no new hosted counts are fabricated. Local advisor errors remain a required gate.

Every mutation and required audit insert commit together. Enrollment snapshots
contain reference IDs/status/revision, not contact data. Other audit metadata
records revision/status without names/emails/files. Authenticated ordinary clients
cannot change history. Code/tenant/actor spoofing, unauthorized role access,
cross-tenant IDs, duplicate races, stale writes and audit failures are negative tests.

## CSV/XLSX preview and commit

Dry-run performs **no database writes**. Server parsing/validation and tenant-scoped
batched reference/code lookups produce normalized rows, explicit conflicts and
row/field errors. Existing codes are conflicts, never an inferred update operation.
References use stable codes; name/email/phone are never duplicate identity keys.

A dedicated 32-byte `IMPORT_PREVIEW_SECRET` seals the valid rows with AES-256-GCM,
purpose-bound AAD, a random nonce, actor, tenant, batch UUID and expiry. There is no
server file/preview persistence. Tampering, another actor/tenant, expired previews
and rotated keys fail closed. Preview values are visible only to the authorized
uploading user; raw files, preview tokens and PII are not logged or audited.

Commit revalidates identity, current permissions, schema and references; database
constraints arbitrate changes since preview. Valid rows commit atomically per row;
invalid/conflicting rows have explicit outcomes. The private batch record retains
only hash/results (row number, outcome, inserted ID), derived actor and tenant.
Same-batch retry returns the original result; changed payload reuse is rejected.
New corrected files obtain new batches and existing successes become explicit
conflicts, preventing duplicate writes. An import-wide audit failure rolls back
the transaction rather than returning fabricated partial success.

Initial operational settings: 2 MiB upload, 500 data rows, 15-minute validity,
30 columns, 1,000 characters/cell and 10 MiB expanded XLSX. Environment settings
may reduce the limits within documented defensive caps; expanding the caps needs
review and matching database/schema validation, not an implicit product promise.
The global Server Action transport cap is 5 MiB to allow bounded uploads and
multipart overhead; each import still checks its lower actual byte budget before
decoding. Auth schemas/rate limits and CSRF/origin protections remain unchanged.

CSV is strict UTF-8 with optional BOM and comma delimiter; dates use ISO YYYY-MM-DD.
XLSX is read by pinned `read-excel-file` behind an adapter. Existing dependencies
cannot read this format. ZIP preflight independently checks actual bounded
inflation, CRC, paths, overlapping entries and coordinate dimensions; it rejects
ZIP64/encryption, binary/macro content, formulas, external links and DTD/entities.
Only one worksheet is accepted, with codes stored as text to preserve leading zeros.
CSV cells are strings and never evaluated; future export must handle formula safety.
No queue, storage vendor, paid service or second spreadsheet library is introduced.

## Deployment and regression boundary

No hosted migration or public rollout is authorized by this implementation.
Review and apply the new migration in the approved environment before using the
new routes, and configure an independent preview key there. Missing configuration
fails closed; fixtures use masked, freshly generated local secrets in disposable CI.
Forward fixes are preferred; rollback must preserve school/history data, never reset
an existing database or rewrite migration history.

`next-env.d.ts` is now untracked/ignored per the installed Next 16.4.5 guide. The
local file and tsconfig include remain; `next typegen` regenerates it. No unrelated
Git cleanup or application architecture replacement was performed.

Validation must include the final head's quality/security and isolated integration
jobs, not an earlier green commit. Existing foundation suites remain mandatory.
New checks cover schema/permissions, sealed previews, real XLSX safety, database
atomicity, concurrent active years/enrollments/revisions and bilingual browser
journeys, including CSV/XLSX preview/commit/corrected retry and a mobile viewport.
Run links and actual counts belong in the final review report once complete.

## Executed validation checkpoint — 2026-11-19

Functional head `ddeb87763728e20120f21f36653202b120248e03` passed
[CI 44626834646](https://github.com/Edleben/ScoGes_App/actions/runs/44626834646):
Quality and security, Isolated integration and browser tests, Required validation.

| Check                                                               | Executed result                             |
| ------------------------------------------------------------------- | ------------------------------------------- |
| Lint, route generation/typecheck, production build                  | Passed locally and in CI                    |
| Unit/component/contract                                             | 234 passed, 32 files                        |
| CI safety guards                                                    | 14 passed                                   |
| Isolated Redis                                                      | 3 passed in CI                              |
| Production browser suite                                            | 40 passed in CI; 0 failed, skipped or flaky |
| Foundation local production browser regression                      | 23 passed on dedicated loopback port        |
| Fresh migration application, ordering and privilege replay          | Passed in disposable CI                     |
| Timestamp/quota upgrade preservation and concurrency                | Passed in disposable CI                     |
| Tenant isolation, authorization, actor/ID spoofing and atomic audit | Passed in disposable CI                     |
| Sprint 1 active-year/canonical-enrollment/revision races            | Passed in disposable CI                     |
| Invitations, onboarding, administration and email lifecycle         | Passed in disposable CI                     |
| Dependency audit                                                    | No known vulnerabilities, locally and in CI |

The 40-case suite includes the existing 38 foundation cases and two full FR/EN
Sprint 1 journeys: academic setup, student/guardian relationships, enrollment
history, CSV preview without writes, conflicts/errors, corrected-row retry, XLSX
preview/commit, editing/archiving and a 390px viewport. The strict CSP guard detects
runtime, hydration and policy errors. Client metadata deliberately imports no Zod:
schema validation and XLSX preparation stay server-only, avoiding CSP-blocked JIT.
The local UI diagnostic used fake loopback services only; it is not DB security
evidence. An initial default-port development browser run failed 2/23; the dedicated
production run passed all 23 without changing tests. New DB/browser journeys ran
against disposable CI, since the Sprint 1 migration is intentionally not hosted.

The final documentation/tracker head requires its own green mandatory CI; the
completion report must identify that exact head/run, not reuse this checkpoint.
Tracker 100% describes delivered technical milestones, not owner acceptance,
production readiness or permission to start Sprint 2.

## Owner review and remaining deployment gates

- Review the append-only migration, permission matrix and approved S1-D1–D6 rules;
  merge only through normal protected review, with no automatic merge by the agent.
- Before using these routes in another environment, separately approve/apply the
  migration and configure a distinct `IMPORT_PREVIEW_SECRET`. Existing deployment,
  ingress, recovery/backup and monitoring gates remain applicable. No real-data
  readiness is inferred from isolated tests.
- Sprint 0's hosted Advisor evidence remains 0 ERROR / 7 WARN / 1 INFO from the
  owner, including six intentional authenticated definers and Free-plan leaked
  password protection risk. This migration adds two reviewed authenticated-only
  definers in disposable CI; no new hosted Advisor count is claimed. Anonymous
  execution is denied and tested. Hosted password policy remains owner-confirmed
  12 characters with all four classes; Auth behavior/configuration was not changed.
- Imports are insert-only and bounded; larger batches, update mode, multiple
  simultaneous active years and financial functions require future decisions.
- No public deployment, hosted database change, paid service, Sprint 1 formal
  closure or Sprint 2 implementation was performed by this delivery.
