---
name: verify-at-use-time
description: The standing procedure for confirming any version number, config key, CLI flag, API name, browser-support claim, or issue status against the installed code and current sources instead of recalling it — plus the 13 checks this project must re-run whenever the relevant subject comes up. Use before writing any version-specific or API-specific statement into code, config, a plan, or a PR.
when_to_use: Before writing any version number, config key, CLI flag, browser-support claim, or API name — in code, config, a plan, a review comment, or a PR body. Every other skill in this studio defers its version literals to this one; each of those literals is a snapshot dated 2026-09-17, not a fact.
---

# Verify at use-time

**Everything in this studio that carries a version number is a reference snapshot from 2026-09-17, recorded for orientation.** It tells you what the world looked like then. It does not tell you what is installed in this repo today, and it is not a source you may cite in a PR. Confirm, then write.

## The procedure

| Question | How you answer it — always |
|---|---|
| A Next.js API, config key, or default | Read `node_modules/next/dist/docs/` — the **installed** version ships its own docs there (present since Next 16.2). This is the primary source; web docs describe whatever version is current upstream, which may not be ours. |
| A package version or peer range | `npm view <pkg> version` and `npm view <pkg> peerDependencies`. For what is *installed*: `package.json` + `package-lock.json`, or `npm ls <pkg>`. |
| A CLI flag | `<tool> --help` (or the subcommand's `--help`) **before** using the flag. Flags are removed between majors. |
| A runtime version | `node -v`, `npm -v`. Never infer npm's version from Node's. |
| A config file's current contents | Read the file. Never describe a config from memory — this repo's configs are mid-modernization and several are known to be stale. |
| An open-issue status | Fetch the issue. "Open as of 2026-09-17" is a snapshot; workarounds get dropped when upstream fixes land. |
| A browser-support claim | Check the feature's current baseline, and re-derive the project's own floor from the installed UI library major (see `styling-mui-tailwind`). |
| A GitHub Action version | Re-resolve the tag → commit SHA before pinning; a SHA recorded earlier may no longer be that tag. |
| Anything about the hosting project | Read the project settings (see `vercel-deploy`) — they are not in the repo and can change without a commit. |

When something cannot be confirmed: say **UNVERIFIABLE**, state what you tried, and encode the at-use-time check in the code or instructions instead of a guessed literal.

## The 13 checks this project re-runs

1. **npm install-script blocking.** Run `npm -v` before asserting that install scripts are blocked. npm 12 blocks dependency install scripts by default, but the Node 24 line has shipped npm 11.x — on stock Node 24 the blocking is **not** active. For `--strict-allow-scripts` and the `allowScripts` field, check `npm help config` at use-time rather than quoting a flag.
2. **gitleaks.** `command -v gitleaks` decides whether the secret scan uses gitleaks or the grep fallback (it is not installed as of 2026-09-17 — re-verify). Before using any flag, `gitleaks git --help`; `--pre-commit` is unconfirmed, and `detect`/`protect` are deprecated in favour of `gitleaks git` / `gitleaks dir` / `gitleaks stdin`.
3. **Two open upstream issues gate two workarounds.** `testing-library/jest-dom#738` (matcher types don't merge with Vitest 5) keeps the local ambient type shim alive — drop the shim when it closes. `vitest-dev/vitest#10054` (Vite's `resolve.tsconfigPaths` doesn't apply under Vitest) keeps `vite-tsconfig-paths` in the Vitest config — re-check before replacing it. Both were open as of 2026-09-17.
4. **Node floor.** `node -v` ≥ **24.15.0** is required by jsdom 30 on the 24 line. Separately, the deployment platform reads `engines.node` (**not** `.nvmrc`) — confirm `engines.node` against the hosting project's Node setting.
5. **Before any upgrade PR.** `npm view <pkg> version peerDependencies` for every package in the step; `npm view eslint-config-next dependencies` before touching ESLint; the typescript-eslint TS peer range before any TypeScript major; re-verify the GitHub Action SHAs you are about to pin.
6. **Next 16.2.3 vs 16.3 differences** — read the installed docs. The known deltas: from 16.3 the dev server writes and maintains its own agent-instructions block in the repo (Claude Code reads **CLAUDE.md** — handled in `modernization-roadmap` step 10), the Turbopack build filesystem-cache default flips to true in 16.3, `experimental.useTypeScriptCli` exists only from 16.3, and React's `use(browser())` needs the react-dom that 16.3 vendors.
7. **After `biome migrate --write`** — grep the result for `"preset": "none"`; the migration can rewrite `recommended: true` into it (upstream issue open as of 2026-09-17). Also confirm whether the installed Biome expands `package.json` arrays before committing a reformat.
8. **Hosting project settings** — Deployment Protection level, Node.js version, whether system environment variables are exposed, and any current per-CVE deploy blocks. Never duplicate response headers across config files: the precedence between them is undocumented.
9. **Mobile key-derivation latency** — measure PBKDF2 unlock time on a real mid-range phone; never quote a millisecond number you did not measure. The same applies to any third-party KDF parameter set you cite.
10. **Utility-name collisions and deep imports** — never name a custom CSS utility after a core framework utility (collision behaviour is undocumented); before deep-importing from a UI library, check its `exports` map for the installed major.
11. **Production hydration error text is minified.** Before adding anything to the console-error allowlist in the E2E fixture, capture the actual production string from a real run.
12. **Visual and cascade regressions** during UI-library and CSS-layer upgrades — verify with screenshots and computed-style assertions, not by reasoning about specificity.
13. **Route scope for the accessibility gate** — confirm which routes are public and in scope (including `/encryption-test`) before asserting coverage; the route list changes as branches land.

## How this shows up in generated work

- In **code and config**: prefer a value read from the installed package (for example, point a config `$schema` at the copy inside `node_modules`) over a hardcoded version string.
- In **plans**: mark every version-dependent assumption `[VERIFY]` and cluster them so they can be checked in parallel before implementation starts.
- In **instructions and skills**: write the check, not the answer — "run `<tool> --help` and use the documented flag", not a flag you remember.
- In **PR bodies and review comments**: cite the evidence (the command you ran and its output), not a recollection.

## Sibling skills

Every skill in this studio defers here for its version literals: `quality-gate`, `nextjs-app-router-conventions`, `hydration-safety`, `styling-mui-tailwind`, `accessibility`, `testing-unit-vitest`, `testing-e2e-playwright`, `client-crypto`, `web-security`, `vercel-deploy`, `code-quality`, `typescript`, `modernization-roadmap`, `low-priority-execution`. The most drift-prone of them are `nextjs-app-router-conventions`, `typescript`, `code-quality`, the two testing skills, `styling-mui-tailwind`, `web-security`, `vercel-deploy`, and `modernization-roadmap`.
