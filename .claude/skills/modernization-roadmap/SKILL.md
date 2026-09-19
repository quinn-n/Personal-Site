---
name: modernization-roadmap
description: The ordered tooling-modernization sequence for this repo — re-deriving what is already done from the current branch, then CI hygiene, ESLint config fix, Biome 2, the Vitest and Playwright harnesses, the TypeScript steps, the UI library and CSS upgrades, Next 16.3, headers/CSP, the crypto migration, and metadata — with the one-concern-per-PR rule and the blocked upgrades. Use before starting any upgrade and whenever deciding what to modernize next.
when_to_use: Before starting any upgrade, and whenever deciding what to modernize next. This skill owns the ordering, the dependencies between steps, and the PR discipline; the how-to for each tool lives in that tool's skill (`code-quality`, `typescript`, `testing-unit-vitest`, `testing-e2e-playwright`, `styling-mui-tailwind`, `web-security`, `client-crypto`).
---

# Modernization roadmap

## Step 0 — always: re-derive the state from the CURRENT branch

**Never trust a written list of what is done — including this one.** This repo is actively developed across branches, and a step that is complete on one branch may be untouched on another. Before planning any upgrade:

```sh
git branch --show-current
git status --short
```

Then, for each step you care about: read `package.json` and `package-lock.json` for the dependency, check whether the config file exists, and grep the source for the API being removed. Only then say what is done.

Specifically, as of 2026-09-17: **`@ionic/react` is not present on `master`, but it is present on an in-flight feature branch** (where it supplies chevron icons to an expandable-content component). **Ionic removal is therefore pending, not complete** — it applies when that branch's work merges, against whatever base it lands on. Do not record it as done, and do not plan around it being done.

## The rules

1. **One concern per PR.** A tooling PR contains exactly one step from the list below and nothing else.
2. **Tooling never rides along with feature or content work** and feature work never carries a dependency bump. If a feature needs a step from this list, the step ships first, in its own reviewed PR.
3. **A step is done when its PR is merged with a green gate** (`quality-gate`) — not when the command succeeded locally.
4. **Every step has a stated rollback** in its PR description (usually: revert the PR; for a dependency step, revert both `package.json` and `package-lock.json` together).
5. **Confirm versions and peers before touching anything**: `npm view <pkg> version peerDependencies` (`verify-at-use-time`). Every version literal here and in the tool skills is a snapshot **as of 2026-09-17 — re-verify**.
6. **Codemod output is reviewed, never trusted.** Read the diff hunk by hunk.

## Blocked upgrades (do not attempt)

- **TypeScript 7** — the framework cannot type-check with it before Next 16.3, `typescript-eslint` peers `<6.1.0` and crashes under it, and the framework's tsserver plugin does not run on it. Target 6.0.x (`typescript`).
- **ESLint 10** — `eslint-plugin-react` 7.37.x crashes on it, and it arrives transitively through `eslint-config-next`. Stay on ESLint 9 (`code-quality`).
- **Staying on MUI 5 is not an option on Next 16** — that line has no `v16-appRouter` integration entry point, so the supported App Router integration does not exist there. The UI step below is a prerequisite, not a preference (`styling-mui-tailwind`).

## The sequence

| # | Step | Depends on | Notes |
|---|---|---|---|
| 1 | **Repo/CI hygiene** | — | Fix the CI workflow: checkout **before** setup-node, `npm ci` (not `npm install`), add the `pull_request` trigger, `permissions: contents: read`, a concurrency group, SHA-pinned actions. Add `engines.node: "24.x"`, add the `typecheck` script, delete the dead `nextlint` script. (`code-quality`) |
| 2 | **ESLint flat-config fix** | 1 | Remove the trailing `...next` re-spread (it downgrades real rules to warnings), delete `.eslintrc.json` and the `globals` dependency, add exact-pinned `typescript-eslint`, switch to `defineConfig` + `globalIgnores`. (`code-quality`) |
| 3 | **Biome 1 → 2** | — | Pin an exact 2.x, `biome migrate --write`, grep for `"preset": "none"`, rewrite `biome.json`, replace the removed `--apply` flags, update the pre-commit local hook and bump `pre-commit-hooks`. Reformat in a **separate commit**. (`code-quality`) |
| 4 | **Vitest harness** | 1 (typecheck script) | Config, setup file, the jest-dom matcher-type shim, first real tests, the CI job, the test-artifact gitignore entries. (`testing-unit-vitest`) |
| 5 | **Playwright + axe harness** | 1 | `playwright.config.ts`, the route list, the console-error fixture, first specs including the axe scan, the CI job. (`testing-e2e-playwright`) |
| 6 | **TypeScript 5.4 → 5.9** | 1, 4 | Bump `@types/node` with it; expect the typed-array/ArrayBuffer breaks, concentrated in the encrypted-content component. (`typescript`) |
| 7 | **TypeScript 5.9 → 6.0** | 6 | Review the new defaults; never add a deprecated option to silence an error. (`typescript`) |
| 8 | **UI library: MUI 5 → the target major** | 5 (visual safety net) | Add `AppRouterCacheProvider` from the `v16-appRouter` entry point **without** `enableCssLayer`; run the codemods for the target major and review their output. Ionic removal (see Step 0) lands before or with this, depending on the branch. (`styling-mui-tailwind`) |
| 9 | **Tailwind 3 → 4 + layer order + `enableCssLayer: true`** | 8 | These three land **together** — the layer declaration is meaningless without the framework that honours it. Verify computed styles on a Button and the Drawer. (`styling-mui-tailwind`) |
| 10 | **Next 16.2.3 → 16.3.x** | 1–5 green | Run the upgrade codemod. 16.3's dev server maintains an `AGENTS.md` block; since Claude Code reads **CLAUDE.md**, this PR adds an `@AGENTS.md` import line to CLAUDE.md. Re-check the build filesystem-cache default, which flips in 16.3. (`nextjs-app-router-conventions`) |
| 11 | **Security headers + CSP** | 5 (header assertions) | `next.config.mjs` `headers()`, Report-Only first, enforce in a follow-up. (`web-security`) |
| 12 | **Crypto v2 migration** | 4, 5 | The WebCrypto module, the build-time encryption script, fixture re-encryption, removal of the legacy library. Real content is re-encrypted with **new** high-entropy passphrases. (`client-crypto`) |
| 13 | **Metadata/SEO** | 10 | `metadataBase`, the title template, `app/sitemap.ts`, `app/robots.ts`, `opengraph-image`. (`nextjs-app-router-conventions`) |
| 14 | **Optional / later** | — | Automated dependency updates; pinning npm; subresource integrity for scripts; the React Compiler; type-aware linting; analytics. Each its own PR, each optional. |

Steps 1–3 are independent of each other and can be sequenced in any order; 4 and 5 both want 1 in place first because they add CI jobs and a typecheck script.

## Site-defect work is not on this list

Hydration fixes, accessibility fixes, missing `sizes` on `fill` images, image filename kebab-casing, invalid nesting, and the unbounded module-level cache are **defects**, fixed through the bug/feature flow — not through the upgrade flow. They should land **after step 5**, so the unit and E2E safety net exists to prove the fix and catch the regression.

## Sibling skills
- `code-quality` · `typescript` · `testing-unit-vitest` · `testing-e2e-playwright` · `styling-mui-tailwind` · `web-security` · `client-crypto` · `nextjs-app-router-conventions` — the how-to for each step.
- `verify-at-use-time` — re-confirm every version and peer range before starting a step.
- `quality-gate` — what "merged with a green gate" means.
