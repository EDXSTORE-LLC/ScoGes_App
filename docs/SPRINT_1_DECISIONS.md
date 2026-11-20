# Sprint 1 implementation decisions

Status: **S1-D1 through S1-D6 explicitly approved by the owner, with corrections below.**

## Verified starting point

Main `2b248aaff8d85bfcdfaf9db94ca43c19852fbf99` contains PR #12 and the
development-only Sprint 0 closure records. Merge CI
[44591018599](https://github.com/Edleben/ScoGes_App/actions/runs/44591018599)
passed. The working tree was clean before creating
`feat/sprint-1-academics-students-enrollments` from that exact main.
The current owner authorizes Sprint 1 implementation, no automatic merge or Sprint 2.
Older dated statements that Sprint 1 is unauthorized are superseded by this instruction.

## Approved business rules and sources

PRODUCT_SPEC sections 7.3–7.6, 7.22, 10 and 25 establish the features, bilingual
requirement and tenant isolation, but do not settle the following detailed rules.
The formal PDF, page 3 section 4.2, requires tenant-unique internal identifiers,
logical archiving, guardian links/contact priority, preserved enrollment history
and partial import recovery. Pages 8–10 require bounded pagination, negative
authorization tests and valid-row import/error reporting. No specification fixes
the numeric upload limits or a complete role/transition matrix.

The active sprint prompt explicitly requires accepted decisions before the
affected implementation. The following proposals are approved subject to the controlling clarifications below.

| ID                | Approved rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1-D1 Students    | Given name, family name and a tenant-unique, case-insensitive school code are mandatory. Code is entered/imported, immutable after creation; UUID is the internal key. Date of birth and contact details optional. Active/archived status; no hard delete; archive preserves links and enrollments and prevents new enrollment. No duplicate inference from names.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S1-D2 Academics   | Academic year has name/code/start/end dates, may overlap another year; dates are inclusive. At most one year is active per tenant. Optional terms belong to a year and stay within its dates. Programs and levels are reusable tenant references; classes belong to one year and one level, optionally one program. Academic codes unique within their documented parent scope. Archive references rather than deleting used history.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| S1-D3 Enrollments | One enrollment per student/year, including cancelled records, enforced by a unique constraint. Statuses: draft → active → completed or withdrawn; draft may become cancelled. Terminal states are immutable. Correct class/program/level only while draft/active with revision checks and audit; no silent cross-year transfer or history replacement. A new year creates a new record. No enrollment of archived students/references.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S1-D4 Guardians   | Given/family names mandatory; email/phone optional, at least one required. Preferred language fr/en, defaults to tenant locale. Notification channel preferences default false and do not constitute consent or send messages. Explicit student link stores relationship, primary-contact flag, positive contact priority and billing-contact flag (metadata only, no billing flow). Tenant-unique immutable guardian code enables imports; shared email/phone never auto-merges records. Archive/unlink preserves audit; no Auth account/parent portal creation.                                                                                                                                                                                                                                                                                                 |
| S1-D5 Permissions | Explicit academics/students/guardians/enrollments read/write/archive and imports.preview/commit permissions. Tenant admin and registrar receive these administrative permissions. Finance manager/cashier/auditor receive no new domain access by default. Platform support receives no implicit bypass. Every operation checks active membership and exact-tenant permission both server-side and in the database.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S1-D6 Imports     | CSV UTF-8 (optional BOM), comma delimiter; XLSX only, no encrypted/macro content, formulas or external links. Separate student/guardian/link/enrollment templates using explicit stable codes and ISO dates YYYY-MM-DD. Existing academic references must match; never auto-create them. Duplicate explicit code/link is reported and skipped, never auto-updated. Preview bound to tenant/actor, expires after 15 minutes; commit revalidates permissions/references and values. Valid rows commit atomically per row, bad rows report errors; retry cannot duplicate successful rows. Maximum 2 MiB compressed upload, 10 MiB expanded XLSX, 500 data rows, 30 columns, 1,000 characters per cell; private preview data retained no longer than 24 hours, no raw files or PII in logs/audit. Larger imports rejected with a clear message, no queue introduced. |

## Independent technical decision: Next generated types

Installed Next 16.4.5 documentation at
`node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md`,
section `next-env.d.ts`, explicitly recommends ignoring this generated file and
removing it from Git if tracked. Keep the local file and its tsconfig include;
remove only the index entry and add `.gitignore`. Existing CI runs `next typegen`
before typecheck; verify regeneration locally. This owner-requested check does
not justify other Git cleanup.

## Delivery sequence after decisions

1. Append-only academic/people/enrollment schema and explicit permissions; negative
   RLS/FK/actor/revision/transactional-audit tests in disposable CI.
2. Academics FR/EN administration, then students/guardians/linking, then enrollment
   history. Reuse established session, tenant, locale and error patterns.
3. Bounded parser adapters, sealed client-held previews and private non-PII commit results with idempotency,
   row errors, duplicate handling and current authorization checks.
4. Full bilingual E2E journeys, existing foundation regressions, migration/security
   validation and documentation. No hosted migration or public deployment implied.

The explicit owner answer below resolves S1-D1–D6. Any future business expansion still requires its own decision; no answer is inferred from silence.

## Controlling owner clarifications — approved 2026-11-19

- D1: Student and guardian codes are mandatory, tenant-unique and immutable. Names,
  email, phone, preferred language and preferences remain editable by permission.
  Email/phone are never the immutable identifier.
- D2: Historical/future years may coexist and overlap. Exactly **at most one active
  year per tenant** in Sprint 1, enforced with a partial unique index. No destructive
  overwrite/deletion of historical years. Configurable hierarchy is approved.
- D3: One canonical enrollment per student/year. Class/program/level/status changes
  and transfers/withdrawals/completion preserve history and transactional audit.
- D4: Tenant-safe many-to-many links, explicit relationship and primary-contact flag.
  Contact details/preferences editable; fr/en supported. No implicit Auth access.
- D5: Explicit administrative permissions for tenant admins and authorized registrars;
  no authenticated-only write access and no new finance write permissions. Existing
  role/permission architecture remains authoritative, with RLS as defense in depth.
- D6: Stable-code matching, explicit existing-code conflicts at preview, no silent
  updates. Per-row validation/errors and safe corrected-row retry are approved.
  Configurable initial limits: 2 MiB, 500 rows, preview valid 15 minutes. Approved
  parser/decompression/cell limits remain operational settings, not permanent
  product promises. Dry-run must perform **no database writes**, including previews;
  use a short-lived sealed actor/tenant-bound payload. Commit revalidates against
  current state and records only non-PII results/audit.

These explicit answers resolve the decision prerequisite. Proceed only within
Sprint 1; no merge, hosted rollout, Sprint 2, billing or payments are authorized.
