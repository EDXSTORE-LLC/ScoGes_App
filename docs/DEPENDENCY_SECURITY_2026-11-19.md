# Targeted dependency security remediation — 2026-11-19

## STABLE scope and decision

Owner authorized targeted vulnerability fixes only, without an unnecessary major
upgrade or broad refactor. Preserve the uncommitted application-password work and
other existing changes. Branch: `edwakson/ScoGes_App`, starting commit `123a9bd`.
No application/business logic, lint configuration, CI threshold, database schema,
hosted Auth setting, plan, deployment or sprint status is changed by this slice.

Affected manifests: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`.
Risks: framework/auth/browser regressions, changed lint matching/rules, transitive
API incompatibility, unrelated resolver churn and misleading audit attribution.
Acceptance: no currently reported targeted advisories; frozen install; preserved
lint coverage/options; passing appropriate application/security/browser checks.

## Fresh baseline, not historical totals

Before changes, the configured registry audit reported **three moderate findings,
zero high/critical**. The previous high picomatch advisory was
[withdrawn upstream on 2026-11-18](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).
No picomatch remediation or general absence of future matcher vulnerabilities is
claimed from that withdrawal.

| Active finding                                                                                                | Before                                          | Targeted resolution                                                                                           |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h), Next.js cache/root-param disclosure | Next 16.4.1                                     | Next 16.4.5, the first patched version listed by the advisory.                                                |
| [GHSA-vc7v-qv4w-wrv8](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8), nested-cache root-param disclosure  | Next 16.4.1                                     | Same 16.4.5 patch.                                                                                            |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), globparts amplification             | minimatch 10.2.6 under TypeScript-ESLint 8.70.0 | Official TypeScript-ESLint/parser 8.73.0 dependency graph resolves minimatch 11.0.5 (patched range >=11.0.1). |

The current minimatch advisory range is **>=7.0.0 <11.0.1**. The legacy minimatch
3.1.5 consumers are not in that reported range and remain untouched. This
supersedes the broader historical affected-version assumptions in the Nov 1 R1
investigations; it does not rewrite their actual rejected-prototype evidence.

## Smallest supported change

- Raise Next and its matching `eslint-config-next` minimums from `^16.4.1` to
  `^16.4.5`; the lock resolves exactly 16.4.5. Corresponding Next env/plugin/SWC
  binaries follow that same patch. No Next/ESLint/React/TypeScript major upgrade.
- [Upstream TypeScript-ESLint 8.73.0](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v8.73.0)
  officially depends on patched minimatch. Two bounded package-manager overrides
  raise only `typescript-eslint` and `@typescript-eslint/parser` requests below
  8.73.0 within major 8 to 8.73.0. Their exact-version internal family dependencies
  follow upstream metadata. This avoids a global minimatch override, callable
  adapter, vendored patch or unsupported edit of the removed `makeRe` API.
- Remove these two overrides once all relevant parent ranges require >=8.73.0.
  Requests whose minimum already excludes the old range, and other major lines,
  are not overridden. Existing broad parent requests remain pinned to 8.73.0
  until that removal criterion is met; review these pins during future updates.
- Keep existing Vite/Undici/source-map overrides, ESLint 9.39.1 and every lint
  rule/ignore/CI audit threshold unchanged. No root dependency is added.
- The final lock delta contains only the Next patch family, TypeScript-ESLint
  family, minimatch 10→11 and its required `@isaacs/nonrecursive-glob-match` helper.
  Unrelated Babel, resolver, accessibility, Zod and other updates from an initial
  broader resolver attempt were discarded. No vulnerable version label was faked.

Package-manager pin remains **pnpm 11.19.0**. The desktop's default pnpm shim was
11.25.0 and selected a different store; final installation/verification uses
`corepack pnpm` with the declared pin and the existing store. No global setting or
package-manager major was changed. Fresh frozen installation passed.

## Audit and verification

Final targeted graph audit: **0 info, 0 low, 0 moderate, 0 high, 0 critical**;
empty advisory list; exit 0. This is a dated registry result, not a guarantee
against undisclosed vulnerabilities. No audit exclusion, severity relaxation or
accepted-risk waiver was introduced.

Before dependency edits, an ESLint API baseline captured 123 included files,
zero diagnostics and full rule/options maps for representative TSX, TS and MJS
files. Post-update comparison passed with identical included files, rule maps/
options and zero diagnostics. Focused real TypeScript project-service probes
passed for a matching default-project glob and rejected a nonmatching glob.
Those probes use separate processes; initial harness assumptions about an
unexported package metadata path and a nonexistent cache-reset helper were
corrected without modifying any dependency or application API. No temporary
compatibility loader is installed. Local baseline/output files remain in ignored
`reports/`; no secrets or source contents are committed as evidence.

| Check                                  | Actual final-graph result                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm 11.19.0 frozen-lockfile install   | Passed.                                                                                                                                                     |
| `pnpm audit --json`                    | Exit 0; no known findings at any severity.                                                                                                                  |
| ESLint API compatibility comparison    | Passed: same 123 files, rule/options maps and zero diagnostics.                                                                                             |
| TypeScript project-service glob probes | Matching allowed default project parsed with type information; nonmatching project rejected.                                                                |
| `pnpm lint`                            | Passed.                                                                                                                                                     |
| `pnpm typecheck`                       | Passed.                                                                                                                                                     |
| `pnpm test`                            | Passed: 202 tests / 26 files, including the prior application password-hardening work.                                                                      |
| `pnpm build`                           | Passed on the first final-graph run, Next 16.4.5; no former Next.js vulnerability stop/reminder.                                                            |
| `pnpm test:db`                         | Passed tenant isolation, invitation lifecycle, administration/audit and security ACL/actor/trusted-delivery assertions; all synthetic data/DDL rolled back. |
| `pnpm test:ci-tools`                   | Passed: 10 safety tests.                                                                                                                                    |
| Production Chromium                    | Passed: 23/23 cases in one production-mode run on loopback port 3112 (2.7 minutes), no failures/skips/retries.                                              |
| Formatting / diff checks               | Passed: changed-file formatting and git diff whitespace checks.                                                                                             |

The installation reports ESLint 9 end-of-support as maintenance information; no
ESLint major migration is introduced solely to remove that warning. Fresh isolated
Linux/Node 22 migration/concurrency/SMTP CI on the final review head remains
separately required; local Windows/Node 24 results do not certify that matrix or
authorize merge/deployment. No new real-mail delivery was performed.

## Remaining scope boundaries

No database migration, production credential, hosted setting, real-data pilot,
public deployment, paid service, PR merge or Sprint 1. The hosted minimum-six/
no-class password setting remains last owner-verified evidence until the owner
changes it. Fixing this dependency slice alone cannot close the overall Sprint 0
security gate or accept outstanding recovery/operations/owner dispositions.

## Reviewable files and delivery state

This dependency slice changes `package.json`, `pnpm-workspace.yaml` and the generated
`pnpm-lock.yaml`, plus this evidence note and the dated R1/security/closure/handoff/
implementation-log checkpoints. The earlier application-password source/test edits
remain intact and are covered by the same 202-unit/23-browser results. No dependency
remediation source refactor or new root package was introduced. Changes remain
local/uncommitted; no remote branch, PR, production deployment or database history
was modified by this slice. The dependency-audit blocker is resolved locally;
overall Sprint 0 remains open pending its other applicable gates.
