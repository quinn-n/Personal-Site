---
name: code-quality
description: The lint, format, and CI toolchain for this repo — the Biome/ESLint division of labor and single-owner rule, the target biome.json and eslint.config.mjs, the Biome 1 to 2 migration, why ESLint stays on 9, the pre-commit hook, and the CI workflow with SHA-pinned actions. Use when changing lint or format configuration, resolving a lint error, or reviewing a tooling PR.
when_to_use: Changing lint/format configuration, resolving a lint or format error, wiring CI, or reviewing a tooling PR. This skill owns Biome, ESLint, pre-commit, and the CI workflow shape; type rules, `tsconfig.json`, and TypeScript version moves live in `typescript`.
---

# Lint, format, and CI

Versions as of 2026-09-17 — **re-verify** (`verify-at-use-time`). Installed: Biome **1.7.3** (minimal config, scoped to `./app`, scripts still using the removed `--apply` flags), ESLint **9.39.4** with a flat config whose trailing re-spread silently downgrades rule severity. Upstream: Biome **2.5.14**, ESLint **9.39.5** maintenance (**10.10.0 is blocked — see below**), `eslint-config-next` **16.3.5**, `typescript-eslint` **8.70.0**.

## Division of labor — one owner per rule

| Tool | Owns |
|---|---|
| **Biome** | Formatting, import organizing, and general-purpose linting. |
| **ESLint** | `@next/next/*` (core-web-vitals), `react-hooks` v7 (which includes the React Compiler rules — Biome has no equivalent), `react`, `jsx-a11y`, and `typescript-eslint`. |

Biome's Next/React *domains* are turned **off** so the two tools never both own a rule. The reason ESLint stays in the stack at all: Biome has **no JSX equivalent** for `@next/next/no-html-link-for-pages` or `no-sync-scripts` (its similarly-named rule targets HTML files and is unrelated), and no React Compiler rules.

Consequences:

- **Run Biome first, then ESLint.** Formatting changes can move lines that ESLint reports on.
- **Every suppression names its owner and a reason.** A `biome-ignore` for a rule ESLint owns (or vice versa) is an orphan — Biome reports unused ignores; convert or delete them.
- Adding a rule to one tool means checking the other does not already own it.

## Target `biome.json`

```jsonc
{
  // Point at the schema inside node_modules so it always matches the installed version.
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true, "defaultBranch": "master" },
  "files": {
    "ignoreUnknown": true,
    // Biome 2 syntax: "!" excludes, "!!" force-ignores (the scanner skips it too). No implicit "**/".
    "includes": ["**", "!!**/.next", "!**/next-env.d.ts", "!app/globals.css"]
  },
  "formatter": { "enabled": true, "indentStyle": "space" },
  "linter": {
    "enabled": true,
    "rules": { "preset": "recommended" },
    "domains": { "next": "none", "react": "none" }   // ESLint owns these
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

`vcs.defaultBranch` is required for `--staged` / `--changed` to work. `app/globals.css` is excluded **only while the repo is on Tailwind 3** (its `@tailwind` directives trip the unknown-at-rule lint); drop that exclusion in the Tailwind 4 step (`styling-mui-tailwind`).

## Biome 1 → 2 (its own PR)

1. `npm i -D -E @biomejs/biome@<2.x>` — pin the exact version.
2. `npx @biomejs/biome migrate --write`.
3. **Grep the result for `"preset": "none"`** — the migration can rewrite `recommended: true` into it and silently disable the whole rule set (upstream issue open as of 2026-09-17).
4. Review the migrated config by hand against the target above.
5. Fix the scripts: **`--apply` and `--apply-unsafe` were removed in Biome 2** — the replacements are `--write`, `--fix`, and `--unsafe`.
6. **Reformat the repo as a separate commit** so the config diff stays readable.
7. Also verify whether the installed Biome expands `package.json` arrays before committing the reformat.

Useful commands: `biome check .` (lint + format + import check — the gate), `biome check --write .` (safe fixes), `biome ci .` (non-interactive; emits GitHub annotations automatically in Actions), `biome format --write -- <file>` (single file, used by the per-edit hook).

## Target `eslint.config.mjs`

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tseslint.configs.strict,
  // Turn off anything Biome owns (formatting/stylistic) so there is exactly one owner per rule.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
```

The current config's defects, all fixed in the ESLint flat-config PR:

- **Delete the trailing `...next` re-spread.** Empirically (`eslint --print-config`) it downgrades `@next/next/no-html-link-for-pages` and `no-sync-scripts` from error to warn — the config silently weakens itself.
- Delete the redundant `globals` block and the `globals` dependency.
- Delete the obsolete `.eslintrc.json` and the dead `nextlint` script (`next lint` no longer exists in Next 16).
- Add `typescript-eslint` as a **direct, exact-pinned** devDependency — it is currently only transitive, and its `strict` preset is not semver-stable.

**Stay on ESLint 9.** `eslint-plugin-react` 7.37.x crashes on ESLint 10 (upstream issues open as of 2026-09-17), and `eslint-config-next` pulls that plugin in. Before ever attempting the bump: `npm view eslint-config-next dependencies`. ESLint 10 additionally raises the Node floor and removes eslintrc support. Related, from `typescript`: **TypeScript 7 is blocked** partly by this same layer — `typescript-eslint` peers TS `<6.1.0` and crashes under TS 7.

Type-aware linting (`parserOptions.projectService`, the type-checked presets) is an optional, separate PR — it materially slows the lint step.

## Pre-commit

The repo keeps the pre-commit framework. The Biome hook is a **local system hook**, so the Biome version comes from the lockfile (one source of truth):

```yaml
- repo: local
  hooks:
    - id: biome-check
      name: biome check
      entry: npx biome check --write --files-ignore-unknown=true --no-errors-on-unmatched
      language: system
      types_or: [javascript, jsx, ts, tsx, json, css]
```

pre-commit passes the staged filenames to the entry. Bump the shared `pre-commit-hooks` repo from v3.2.0 to **v6.0.0** with `pre-commit autoupdate` in the same tooling PR. The upstream Biome pre-commit repository's tags are a documented alternative, at the cost of pinning the version in two places.

**Never `git commit --no-verify`** to get past a hook.

## CI (GitHub Actions)

```yaml
name: CI
on:
  push: { branches: [master] }
  pull_request:
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
permissions: { contents: read }

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      # Checkout BEFORE setup-node — setup-node's npm cache needs the lockfile on disk.
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx biome ci .
      - run: npx eslint .
      - run: npm run typecheck
      - run: npm test

  build-e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
        with:
          path: ${{ github.workspace }}/.next/cache
          key: next-${{ hashFiles('package-lock.json') }}-${{ hashFiles('app/**', 'next.config.mjs') }}
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        if: failure()
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
```

Rules:

- **Pin every action by commit SHA with the version in a trailing comment**, and **re-verify the SHA at use-time** — a tag can be repointed. The four SHAs above were verified 2026-09-17.
- `permissions: contents: read` at the workflow level; avoid `pull_request_target` entirely.
- The current workflow's bug is ordering: it runs `setup-node` **before** `checkout` and uses `npm install`. Fix both, and add the `pull_request` trigger — today it only runs on push.
- Run `next build` in CI even though the host also builds: CI is where a broken build should stop a PR.
- A separate security job runs `npm audit --audit-level=high`, `npm audit signatures`, and the secret scan (`web-security`).
- **Never `nice` in CI** (`low-priority-execution`).

## Sibling skills
- `typescript` — the typecheck step, the TS version constraints, and `tsconfig.json`.
- `quality-gate` — the order these commands run in locally and what "green" means.
- `modernization-roadmap` — which of the fixes above is the next PR.
- `low-priority-execution` — wrapping the local lint/format runs.
- `web-security` — the security job and the supply-chain checks it runs.
