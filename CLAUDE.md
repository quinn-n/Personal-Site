# Project: Personal Site — static Next.js 16 site on Vercel

A personal/resume site: **Next.js 16 App Router, React 19, TypeScript, MUI + Tailwind**, npm + `package-lock.json`, default branch `master`, hosted on **Vercel via Git integration only**. Every route is prerendered static; there is no server code. This studio **maintains and extends an existing site** — it does not scaffold a new one.

This file is your standing instructions. Treat it as binding. Depth lives in `.claude/skills/`; path-scoped specifics live in `.claude/rules/`.

## Verify at use-time — read this first

- **Never hardcode or recall a version, config key, CLI flag, API name, or browser-support claim.** Confirm it, then write it.
- **Next API questions are answered from `node_modules/next/dist/docs/`** — the docs for the *installed* version ship in the package. Read them before any web source.
- `npm view <pkg> version peerDependencies` before an upgrade · `<cmd> --help` before a flag · `node -v` / `npm -v` before asserting runtime behavior · read the installed config file rather than remembering it.
- **Every version literal in this studio is a snapshot dated 2026-09-17 — orientation only, re-verify.** The repo is actively changing; re-read files, never trust remembered line numbers.
- Route `[VERIFY]` items to the `fact-checker` (or `/verify`) before they reach code. See the `verify-at-use-time` skill.

## The golden workflow

**design → plan → fact-check → ⏸ PLAN GATE → implement (parallel file-disjoint tracks) → quality gate → review board (parallel) → fix loop → APPROVED verdict → PR with a `## User Test Plan`**

- **Parallel tracks with file ownership.** The planner gives every task an explicit `Owns` file set and groups tasks into ordered, file-disjoint batches. An implementer edits only its `Owns` files and reports cross-track needs instead of reaching across.
- **Implement↔review loops with explicit verdicts.** Reviewers emit `VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED` with Must-fix / Should-fix / Nit. Cap at ~3 rounds; escalate a non-converging loop to me.
- **⏸ gates:** after the fact-checked plan; before any PR that would mix concerns; before anything that could make a route dynamic.

### The quality gate (`/quality-gate`)

`/quality-gate` is **the only name for the gate** in this studio. "Done" means **a green `/quality-gate` AND a review board `VERDICT: APPROVED`** — never one without the other.

**Step 0 — preflight: detect, never assume.** Probe `node -v`, `npm -v`, the Biome major (`npx --no-install biome --version`), the `typecheck` / `test` / `test:e2e` scripts, `vitest.config.mts`, `playwright.config.ts`, `e2e/`. The toolchain is being brought up in stages: report a missing component as **"not yet bootstrapped → run `/upgrade <step>`"**, never as a failure, and say which steps you skipped.

**Then fail fast, in this order** (stop at the first non-zero exit):

```sh
# 1. Format + general lint (Biome). Biome 2.x:
if [ -n "$CI" ]; then npx biome check .; else nice -n 19 npx biome check .; fi
#    Biome 1.x still installed → the repo config is scoped to ./app; run and say so:
#    nice -n 19 npx biome check ./app

# 2. Framework/react/a11y/TS lint (ESLint 9)
if [ -n "$CI" ]; then npx eslint .; else nice -n 19 npx eslint .; fi

# 3. Typecheck — REQUIRED, not optional
if [ -n "$CI" ]; then npm run typecheck; else nice -n 19 npm run typecheck; fi   # = next typegen && tsc --noEmit

# 4. Unit/component tests (never watch mode in a gate)
if [ -n "$CI" ]; then npm test; else nice -n 19 npm test; fi                     # = vitest run

# 5. Production build + the static-route assertion (below)
if [ -n "$CI" ]; then npm run build; else nice -n 19 npm run build; fi

# 6. E2E + accessibility against the production build on port 3100
if [ -n "$CI" ]; then npm run test:e2e; else nice -n 19 npm run test:e2e; fi     # = playwright test
```

**Static-route assertion (exact).** Parse the `next build` route table; the legend is verbatim:

```
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Fail if any route line begins with `ƒ`. Also fail if the route table is empty or unparseable** — a build-output format change must never silently green the gate. Use `next build --debug` for detail. Never weaken a check to go green; never run a watcher in a gate. Full definition: the `quality-gate` skill.

## Subagents (16)

Model policy: design, planning, implementation, and fixing run on **opus**; testers, reviewers, the fact-checker, `test-engineer`, and `deploy-doctor` run on **sonnet**. **Only the four Build agents have edit access** — every other agent is read-only by design.

**Design · plan · verify (read-only)**

- `feature-designer` — turns an idea or content change into a testable spec: routes touched, RSC/client boundary, data shape, a11y acceptance criteria, responsive behavior, static-rendering impact.
- `site-planner` — ordered tasks with `Owns` file sets, file-disjoint batches, the Vitest/Playwright test plan, reviewer routing, and a clustered `[VERIFY]` list. Stops before code.
- `fact-checker` — confirms or refutes `[VERIFY]` items against installed code and current sources; returns CONFIRMED / REFUTED / UNVERIFIABLE with evidence.
- `upgrade-planner` — re-derives which modernization steps are already done, picks the next one, scopes it to a single concern, lists commands/codemods/rollback/risks.

**Build (edit access — the only agents that write files)**

- `site-implementer` — executes ONE assigned track (**ui** / **logic-crypto** / **tooling-config**), stays strictly in its `Owns` files, writes its slice's tests, keeps the gate green, loops to APPROVED.
- `test-engineer` — backfills meaningful Vitest/Playwright/axe coverage; edits test files and test config only.
- `code-refactorer` — behavior-preserving cleanup; green gate before **and** after.
- `bug-fixer` — reproduce → root cause → **failing regression test first** → minimal fix → prove green.

**Testers (read-only; each closes with a "could not verify from here" list)**

- `unit-tester` — runs `vitest run` + `npm run typecheck`, reports failures with file/line, separates product bugs from test bugs.
- `e2e-a11y-tester` — Playwright + `@axe-core/playwright` against the **production build** on port 3100 (or a preview via `PLAYWRIGHT_BASE_URL`); console errors, image loads, `incomplete` axe results.

**Review board (read-only; verdicts)**

- `nextjs-reviewer` — RSC/client boundaries, hydration-unsafe patterns, metadata correctness, `next/image`, and that **every route is still `○`**.
- `code-quality-reviewer` — TS/React idioms, Biome-vs-ESLint rule ownership, suppression hygiene, and **tooling/upgrade-PR review**.
- `a11y-ux-reviewer` — WCAG 2.2 AA by hand where axe cannot reach: semantics, names, focus order/management, keyboard paths, reflow, target size.
- `security-reviewer` — the 12-point crypto / headers / supply-chain / secret-hygiene checklist.
- `performance-reviewer` — *conditional and advisory only, never blocks*: bundle deltas, image/font loading, client-component surface. Should-fix and Nit only.
- `deploy-doctor` — *read-only diagnosis, not a verdict*: locates a failed Vercel deployment, reads its **build** logs, reproduces locally, recommends remediation. Never deploys.

## Skills (15) · rules (5)

Skills (`.claude/skills/<name>/SKILL.md`) — invoke the one that owns the question:

- `quality-gate` — the gate definition, the preflight, and the static-route assertion.
- `nextjs-app-router-conventions` — RSC boundaries, metadata, routing, images, Next 16 defaults.
- `hydration-safety` — mismatch diagnosis and the fix order; no nondeterminism in render.
- `styling-mui-tailwind` — the cascade/layer model, MUI styling rules, icons, the UI upgrade order, the MUI major + browser floor.
- `accessibility` — WCAG 2.2 AA patterns and the manual checklist.
- `testing-unit-vitest` — Vitest 5 config, gotchas, and the jest-dom matcher-type shim.
- `testing-e2e-playwright` — the E2E harness, the axe invocation, preview-URL mode.
- `client-crypto` — the WebCrypto v2 scheme, blob schema, migration, crypto review checklist.
- `web-security` — headers/CSP, env-var rules, supply chain, secret scanning.
- `vercel-deploy` — Git-integration-only deploys, the read-only CLI allowlist, quotas, the diagnosis runbook.
- `code-quality` — Biome/ESLint division of labor, pre-commit, CI shape.
- `typescript` — the typecheck gate, tsconfig invariants, the staged TS upgrade.
- `modernization-roadmap` — the ordered upgrade sequence and PR discipline.
- `low-priority-execution` — how heavy local commands are wrapped.
- `verify-at-use-time` — the standing verification procedure and this project's recurring checks.

Path-scoped rules (`.claude/rules/*.md`, loaded when matching files are touched): `app-router.md` (`app/**`) · `styling.md` (`app/globals.css`, `tailwind.config.ts`, `postcss.config.*`, `app/ui/**`) · `crypto.md` (`app/lib/crypto/**`, `app/ui/encrypted-content.tsx`, `scripts/encrypt-content.*`, `public/encrypted-content/**`, `content-private/**`) · `tests.md` (`**/*.test.ts(x)`, `e2e/**`, test configs) · `tooling.md` (`.github/**`, `package.json`, lint/TS/Next config, `.pre-commit-config.yaml`).

## Commands (14)

`/feature` full pipeline for a feature, page, or content change · `/features` batch mode, one git worktree and one PR per feature · `/plan` design + plan + fact-check, stops before code · `/implement` execute an approved plan in batches · `/fix` regression-test-first bug fix · `/review` the review board in parallel · `/quality-gate` preflight + the six steps · `/upgrade` one single-concern modernization PR · `/deploy-doctor` read-only deployment diagnosis · `/a11y-audit` axe + manual WCAG audit (audits, never fixes) · `/security-review` the security checklist over a diff or scope · `/verify` parallel fact-checks · `/new-page` scaffold a static route · `/harden` coverage + cleanup with no behavior change.

## Review routing (what `/review` runs)

Always, in parallel: **`nextjs-reviewer` + `code-quality-reviewer` + `a11y-ux-reviewer`**.

| Touched surface | Add |
| --- | --- |
| `app/lib/crypto/**`, `app/ui/encrypted-content.tsx`, `scripts/encrypt-content.*`, `public/encrypted-content/**`, headers/CSP, `package.json` deps, anything env/secret-adjacent | `security-reviewer` |
| UI dependencies, images, fonts, client-component surface, bundle-affecting changes | `performance-reviewer` (advisory) |
| `.github/**`, `package.json` scripts, `biome.json`, `eslint.config.mjs`, `tsconfig.json`, `.pre-commit-config.yaml` | `code-quality-reviewer` in tooling-PR mode |
| Deployment symptoms (failed build, wrong preview) | `deploy-doctor` (diagnosis, not a verdict) |

## Hard rules

1. **Verify at use-time, never assume.** Installed Next docs for Next APIs; `npm view` for versions/peers; `--help` for flags; re-verify Action SHAs. Never invent a version, config key, or command.
2. **Every route stays `○ (Static)`.** No `cookies()` / `headers()` / `connection()`, no nonce CSP, no `proxy.ts`, no `force-dynamic` without an explicit ⏸ decision. The gate asserts it and fails on an unparseable table.
3. **Server Components by default.** `"use client"` only on leaf components under `app/ui` — **never** on `page.tsx` or `layout.tsx` (it kills `metadata`). **No Node globals or modules in client code** (`Buffer`, `globalThis.Buffer`, `process.env`, `require`); use `Uint8Array`, `TextEncoder`, `atob`/`btoa`, WebCrypto.
4. **No nondeterministic render.** No `Math.random` / `Date` / locale / `window` in render **or in a `useState` initializer**. Fix order: mount-effect two-pass → `dynamic(..., { ssr: false })` → build-time pick. **`suppressHydrationWarning` is never a fix.**
5. **Accessibility is a gate, not a nicety.** WCAG 2.2 AA: real semantics, accessible names, `aria-expanded`/`aria-controls`, keyboard paths, focus management and visible rings, reduced motion. Every route and interactive state gets the single tag-based axe scan; **never disable color-contrast site-wide**; exclusions need a reason and an issue link.
6. **Tests are not optional; the gate defines "ready."** Biome → ESLint → **`next typegen && tsc --noEmit`** (required — `next build` silently skips test files) → Vitest → build + the `○` assertion → Playwright + axe. Never watch mode in a gate; never weaken a check to go green.
7. **Security gate before committing anything touching crypto, headers/CSP, dependencies, env vars, or secrets.** WebCrypto only — no JS crypto libraries, no `Math.random` for an IV/salt; v2 blob invariants; non-extractable keys; nothing sensitive in state/storage/URLs/logs; no `NEXT_PUBLIC_` secrets; `npm ci` + `npm audit --audit-level=high` + `npm audit signatures`, with the install-script check gated on `npm -v`.
8. **Run compute-heavy commands at low OS priority locally: `nice -n 19 <cmd>`** — `next build`/`dev`, `playwright test`/`install`, `vitest run`, typecheck, full `eslint .`, `npm ci`, `next experimental-analyze`, repo-wide `biome ci`. **Never in CI** (`if [ -n "$CI" ]; …`). **Never swallow the exit code.** **Invocation-level only** — never inside `package.json` scripts, test configs, or workflows. See `low-priority-execution`.
9. **Deployment is Vercel Git integration only.** Never run `vercel deploy` / `promote <id>` / `rollback <id>` / `remove` or any `vercel env` mutation, and **never pass `--token`** (use `VERCEL_TOKEN` in the environment). Read-only diagnosis only. **`guard-bash.sh` is the enforcement point**; the settings deny list is belt-and-braces.
10. **One concern per PR.** Tooling modernization never rides along with feature or content work — it goes through `/upgrade`, in the roadmap's order, each step its own reviewed PR.
11. **Styling discipline.** Tailwind + MUI only. Layer order declared first in `globals.css`; **no unlayered global rules**; MUI styled via `className` + `slotProps`, `sx` only for MUI internals; Heroicons is the icon default; **never name a custom utility after a core utility**.
12. **Lint ownership is single-owner.** Biome = format + import organizing + general lint; ESLint = Next / react-hooks / react / jsx-a11y / typescript-eslint. **Stay on ESLint 9.** No orphan `biome-ignore` / `eslint-disable`; every suppression names its owner and a reason.
13. **Never hand-edit `package-lock.json`, `next-env.d.ts`, `.env*`, `.vercel/**`, or `content-private/**`.** Secrets never enter the repo, a PR body, or a test fixture.
14. **Every delivery ends with a `## User Test Plan`** — never omitted, never an escape hatch for testable-but-untested work, never containing a credential or a private URL.
15. **Stop and ask** on a blocker, a review loop past ~3 rounds, or any surprise that contradicts the plan.

**Blocked upgrades (as of 2026-09-17 — re-verify):** TypeScript 7 (the installed Next's type-check path, the typescript-eslint peer range, and the Next tsserver plugin) · ESLint 10 (eslint-plugin-react crash) · staying on MUI 5 (no `v16-appRouter` entry point before `@mui/material-nextjs@7.3.5`, so MUI 5 is unsupported on Next 16).

## Hooks (5 wired + a shared lib) · No MCP (intentional)

- `protect-secrets.sh` — **PreToolUse** (`Edit|Write`): blocks writes to `.env*` (except `.env.example`), `.vercel/**`, `content-private/**`, key/cert files, `.claude/settings.local.json`, and `package-lock.json`. Path permission rules are never consulted for `Write`, so this hook is the only thing that stops one.
- `guard-bash.sh` — **PreToolUse** (`Bash`): the real enforcement point for deploy and history safety (deploying/mutating Vercel commands, `--token`, force-push to `master`, `--no-verify`, `npm publish`). Fails **open** with a warning if it cannot parse the command.
- `format-on-edit.sh` — **PostToolUse** (`Edit|Write`): formats the edited file with Biome 2.x; degrades gracefully on Biome 1.x or a missing `node_modules`.
- `client-safety-lint.sh` — **PostToolUse** (`Edit|Write`): advisory grep for hydration, RSC-boundary, unsized-`fill`-image, unsafe-link, and crypto slips.
- `no-secrets-in-diff.sh` — **Stop / SubagentStop**: scans changed files for secrets (gitleaks if installed, otherwise a grep fallback) and reports path + rule only, never a value.
- `lib.sh` is sourced by the others and wired to no event. PostToolUse hooks never exit non-zero — their feedback arrives as `additionalContext`.

**No MCP, on purpose.** The real artifact is this repo's own Playwright suite, run by exit code in the gate and in CI; a browser MCP adds a surface CI cannot reproduce. **Vercel MCP is not wired** — it is Public Beta, has no read-only mode, and exposes deploy and purchase tools. Both are documented opt-ins in `README.md`; the deny entries that make opting in safe already ship in `.claude/settings.local.json.example`.

## Project specifics (fill these in)

- Production domain — `quinnneufeld.com` (drives `metadataBase`, and the HSTS/indexability checks that are only true in production)
- Vercel org/project + plan — `<quinn-n/personal-site · Hobby>` (image transformation quotas, Password Protection availability)
- Deployment Protection level — `<verify in the Vercel project settings at use-time>`
- MUI major target: 9 — browser floor Chrome 117 / Edge 121 / Firefox 121 / Safari 17.0. `7.3.x` LTS is the documented alternative; the full floor table for both options lives in `styling-mui-tailwind`.
- Encrypted content holds real secrets: yes — crypto checklist items 1–7 are **blocking Must-fix**, and any real content behind encryption needs a generated high-entropy passphrase. `security-reviewer` and `/security-review` read this line at use-time.
- A11y scope — WCAG 2.2 AA, all public routes including `/encryption-test`; add `/playground` and `/side-projects/filter-0` if and when they reach the default branch.
- Default branch — `master`
- Node — `.nvmrc` is `24`; **local/CI patch floor ≥ 24.15.0** (jsdom 30 requires it); **`engines.node: "24.x"` is Vercel's source of truth — Vercel does not read `.nvmrc`** (lands with the CI-hygiene upgrade PR)
- Package manager — npm + `package-lock.json`; `npm ci` in CI and in every worktree
- E2E port — `3100` (dedicated; never collides with `next dev` on 3000)
- gitleaks installed? — **no, as of 2026-09-17** → `no-secrets-in-diff.sh` uses its grep fallback
- Next docs — `node_modules/next/dist/docs/` for the installed version

---

**Confirm current Claude Code formats when working here** — subagent/command/skill frontmatter fields, hook events, and settings shape evolve. Run `/agents` to confirm the roster actually loads, and verify a `rules/*.md` file loads before trusting the rest: malformed frontmatter fails silently.
