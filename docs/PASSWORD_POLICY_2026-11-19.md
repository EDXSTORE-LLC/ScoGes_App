# Application password hardening — 2026-11-19

Owner-authorized, bounded Sprint 0 application change. The prior
[hosted review](SPRINT_0_HOSTED_SECURITY_REVIEW_2026-11-18.md) remains the source
for owner-verified Supabase settings. No provider configuration, database migration,
dependency, existing account password, OTP lifetime or password-change toggle is changed.

## STABLE scope and behavior

Signup and reset now share server-side validation for **12–128 characters**,
including ASCII lowercase, uppercase, a digit and a Supabase-supported symbol.
Passwords are never trimmed, normalized or echoed. Matching confirmation remains
mandatory. Validation fails before rate-limit/provider/session side effects.
Provider `weak_password` refusal has safe localized feedback on both flows.

`password-policy.ts` contains the shared bounds and character check;
`schemas.ts` applies them to both new-password schemas. Login retains the existing
minimum eight and does not require character classes: this change does not block
existing eight-to-eleven-character passwords. The previously documented inability
to log in with six/seven-character provider passwords is unchanged, not newly
introduced or silently fixed.

Signup/reset fields advertise minimum 12 and maximum 128, retain `new-password`
autocomplete and show matching FR/EN guidance associated with both fields using
`aria-describedby`. Generic invalid-form feedback no longer advertises a password
policy on unrelated forms. Passwords still clear after action replies; the entered
email remains preserved. No client-side storage or new dependency was introduced.
The shared input change adds only an optional accessible-description attribute.

Preserved: verified-user checks, authentication redirects, email confirmation,
rate-limit failure behavior, successful reset/global sign-out ordering, invitation
flows, tenant authorization/RLS, audit and every database function/signature.
The React review checked stable `useId`, accessible labels/descriptions, direct
lightweight policy imports, existing submission states and absence of new effects
or password state/persistence.

## Acceptance and verification

Tests cover both shared schemas: length boundaries, missing character classes,
space/emoji not substituting for a supported symbol, confirmation mismatch,
supported punctuation and exact password preservation. Action tests cover FR/EN
pre-provider rejection and safe reset refusal; positive signup/reset fixtures use
compliant values while legacy login fixtures remain deliberately unchanged.
Component tests verify mode-specific bounds, autocomplete, associated guidance
and password clearing. Browser tests preserve the mismatch path with compliant
but different values and check FR/EN browser-length/server-class rejection without
sending email. Existing authenticated reset/onboarding/invitation/admin cases run
as regression checks.

| Check                                      | Actual result                                                                                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm lint`                                | Passed.                                                                                                                                                                                                                                    |
| `pnpm typecheck`                           | Passed.                                                                                                                                                                                                                                    |
| `pnpm test`                                | 202 tests / 26 files passed, including 54 added cases.                                                                                                                                                                                     |
| `pnpm test:db`                             | Tenant isolation, invitation lifecycle, administration/audit and security ACL/actor/trusted-delivery suites passed; fixtures/DDL rolled back.                                                                                              |
| `pnpm test:ci-tools`                       | All 10 safety tests passed.                                                                                                                                                                                                                |
| `pnpm build`                               | Compiled, then initially stopped on the existing Next.js security advisory; retry passed with the advisory warning retained. No dependency fix claimed.                                                                                    |
| `pnpm test:e2e --workers=1`                | Passed: all 23 Chromium cases in one production-mode run on loopback port 3110 (2.8 minutes), with no failures/skips/retries. Includes new FR/EN rejection cases and existing real reset, onboarding, invitation and administration flows. |
| `pnpm format:changed` / `git diff --check` | Passed.                                                                                                                                                                                                                                    |

Repository/remote inspection found the expected branch at `123a9bd`, with a clean
starting tree. The remote check succeeded after an initial Windows credential-context
failure; no branch was changed, committed, pushed or merged. Runtime browser logging
may append to the existing tracked `debug.log`; it is outside the implementation
and is not used as committed security evidence. Fresh disposable Supabase/SMTP
and independent-connection CI remain required on the review head; no Docker-based
fresh provider-policy run is claimed here. No real email delivery is requested.

## Hosted rollout and remaining gates

The last owner-verified hosted policy remains **minimum six/no required classes**.
Application validation does not constrain direct Supabase Auth calls. The existing
disposable Supabase configuration is unchanged in this application-only task.
After reviewing this change, the owner must separately save minimum **12** and
**digits + lowercase + uppercase + symbols** in the configured project's Email
Auth settings, then supply the non-secret saved values and verify controlled
signup/reset and existing-account login. No automatic provider change is implied.

Keep secure email change and email confirmation enabled. Do not blindly enable
reauthentication/current-password requirements: the separate compatibility work
identified in the hosted review is not part of this task. Leaked-password
protection remains plan-constrained. Dependency advisories, hosted-policy alignment,
required final-head isolated CI and existing owner dispositions keep Sprint 0's
overall security gate open. No PR merge, public deployment/pilot, paid plan change
or Sprint 1 is authorized or claimed by this implementation.

## Material files changed

- Policy and server validation: `src/modules/identity/password-policy.ts`, `schemas.ts`, `actions.ts`.
- Localized UI: `src/modules/identity/auth-messages.ts`, `src/components/auth/auth-form.tsx`, optional description attribute in `src/components/ui/form-field.tsx`.
- Tests: new `src/modules/identity/schemas.test.ts`, updated `actions.test.ts`, `src/components/auth/auth-form.test.tsx`, `tests/e2e/auth-public.spec.ts`.
- Documentation: this note, `docs/AUTHENTICATION.md`, `AI_HANDOFF.md`, `SECURITY.md`, `IMPLEMENTATION_LOG.md`.

No routes, migrations, required environment variables or packages were added.
Application hardening is complete within scope; hosted configuration alignment
and the broader Sprint 0 security gate remain open.
