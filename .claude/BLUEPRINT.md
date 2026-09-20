# BLUEPRINT — the design record for this studio

What was decided, and why, when this Claude Code studio was built for **this** repo: a static Next.js 16 App Router personal/resume site on Vercel. It is a **record of decisions**, not a rebuild spec — the authoritative artifacts are the files under `.claude/`, and where this document and a shipped file disagree, the file wins.

**Every version literal here is a snapshot as of 2026-09-17 — re-verify.** The research behind these decisions was fact-checked on that date; nothing in it is permanent.

---

## 1. Archetype

**Brownfield static web frontend.** A fully prerendered (`○`) Next.js 16 App Router site: no server code, no environment variables, deployed exclusively through Vercel's Git integration. Four forces shaped the design:

1. **Content and feature work** on an existing, live site — not greenfield scaffolding.
2. **A backlog of correctness defects**: hydration mismatches from nondeterminism in `useState` initializers, accessibility gaps (div toggles without roles or names, no `nav` landmark, no focus trap on the sidenav, empty `alt` on certificates), empty root metadata, `fill` images without `sizes`, a Node global in client code, invalid HTML nesting.
3. **A broken client-side encryption scheme** (no KDF or salt, unauthenticated AES-CBC, a reused IV plus a verifier that acts as an offline oracle, raw key bytes in React state, decryption during render) that must be replaced wholesale.
4. **A deliberately sequenced tooling-modernization backlog** the owner wants as isolated, reviewed PRs — never bundled into feature work.

Emphasis, in priority order: **hydration/RSC-boundary correctness → accessibility (WCAG 2.2 AA) → keeping every route `○ (Static)` → client-crypto correctness → tooling modernization as isolated PRs → read-only deploy diagnosis.**

---

## 2. The golden workflow

**design → plan → fact-check → ⏸ PLAN GATE → implement (parallel file-disjoint tracks) → quality gate → review board (parallel) → fix loop → APPROVED verdict → PR with a `## User Test Plan`**

Two cross-cutting mechanisms carry it:

- **Parallel implementer tracks with file ownership.** The planner assigns every task an explicit `Owns` file set and groups tasks into ordered batches that are disjoint within a batch. One implementer per task; cross-track needs are reported, never reached across.
- **Implement↔review loops with explicit verdicts.** Every reviewer emits `VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED` with Must-fix / Should-fix / Nit. The loop is capped at ~3 rounds; a non-converging disagreement escalates to the human rather than being resolved by the loudest agent.

### Why the gate has a preflight

The repo is **not yet bootstrapped**: as of 2026-09-17 there is no `typecheck` script, no Vitest, no Playwright, no `e2e/` directory; Biome is on 1.7.3 with `--apply` flags that no longer exist in Biome 2; the ESLint flat config's trailing re-spread empirically downgrades real Next rules to warnings; there is no `engines.node`. A gate that assumed the toolchain would have been red on day one for reasons that are not defects — and a red gate that is normal is a gate nobody reads.

So `/quality-gate` **detects first** and reports missing components as *"not yet bootstrapped → run `/upgrade <step>`"*, then runs the six steps it can: **Biome → ESLint → `next typegen && tsc --noEmit` → Vitest → `next build` + the static-route assertion → Playwright + axe**, failing fast in that order. Two details are load-bearing and are stated identically in `.claude/skills/quality-gate/SKILL.md`, `/quality-gate`, and `CLAUDE.md`:

- **The typecheck step is mandatory** because `next build`'s TypeScript step silently skips `*.test.ts(x)` — type errors and unresolved imports inside tests still produce a green build.
- **The static-route assertion fails on an unparseable or empty route table**, not only on a `ƒ` route. A build-output format change must never silently green the gate.

**"Done" = a green gate AND a review board `VERDICT: APPROVED`.** Never one without the other.

---

## 3. Agent roster (16) and why

Model policy: design, planning, implementation, and fixing on **opus**; testers, reviewers, the fact-checker, `test-engineer`, and `deploy-doctor` on **sonnet**. Read-only agents are given no `Write`/`Edit` tools at all rather than being asked politely — **four agents have edit access**, and they are the only ones that can change the repo.

| Agent | Model | Edit | Why it exists |
|---|---|---|---|
| `feature-designer` | opus | — | Content and feature requests arrive as prose. This turns one into a testable spec with the RSC/client boundary and a11y acceptance criteria decided *before* code. |
| `site-planner` | opus | — | Owns `Owns` sets, batching, the test plan, the reviewer routing, and the clustered `[VERIFY]` list — the two things that make parallelism safe. |
| `fact-checker` | sonnet | — | Version, API, config, and browser-support claims are the studio's main failure mode. Fans out per verification cluster; refuted items go back to the planner, not into code. |
| `upgrade-planner` | opus | — | The modernization backlog needs an owner that **re-derives what is already done from the current branch** and refuses to bundle concerns. |
| `site-implementer` | opus | **yes** | One agent with three named tracks (**ui**, **logic-crypto**, **tooling-config**) instead of three near-identical agents — the planner's `Owns` sets already do the routing. One instance per task in a batch. |
| `test-engineer` | sonnet | **yes** | Coverage backfill is a distinct activity from feature work; scoping it to test files and test config keeps "add tests" from quietly changing behavior. |
| `code-refactorer` | opus | **yes** | Behavior-preserving cleanup with a green gate before *and* after — a different contract from bug-fixing. |
| `bug-fixer` | opus | **yes** | The defect backlog justifies a dedicated reproduce → **failing regression test first** → minimal fix loop. |
| `unit-tester` | sonnet | — | Runs the real suite and the typecheck; separates product bugs from test bugs. Never edits, so it cannot "fix" a test into passing. |
| `e2e-a11y-tester` | sonnet | — | The real-artifact tester: Playwright + axe against the **production build** on port 3100, or a preview URL. Also the source of "what I could not verify from here". |
| `nextjs-reviewer` | sonnet | — | RSC boundaries, hydration-unsafe patterns, metadata, images, and the `○` guarantee — the framework-specific half of correctness. |
| `code-quality-reviewer` | sonnet | — | TS/React idioms plus rule ownership, **and** the tooling/upgrade-PR reviewer. Folding tooling review in here avoided a fifteenth near-duplicate reviewer. |
| `a11y-ux-reviewer` | sonnet | — | Everything axe cannot detect: focus order and management, keyboard paths, status messages, reflow, target size, color-only signalling. |
| `security-reviewer` | sonnet | — | The 12-point crypto / headers / supply-chain / secret-hygiene checklist; reads the real-secrets flag at use-time to decide blocking vs advisory. |
| `performance-reviewer` | sonnet | — | **Conditional and advisory only** — the owner explicitly removed the performance gate, so this reviewer emits Should-fix and Nit, never Must-fix, and never blocks. |
| `deploy-doctor` | sonnet | — | **Diagnosis, not a verdict.** Locates a failed deployment, reads its *build* logs, reproduces locally, works the common-cause checklist, recommends reverting the PR. Never deploys. |

### Review routing

Always, in parallel: `nextjs-reviewer` + `code-quality-reviewer` + `a11y-ux-reviewer`. Added by surface: `security-reviewer` for crypto / headers / dependencies / anything secret-adjacent; `performance-reviewer` (advisory) for UI dependencies, images, fonts, and the client-component surface; `code-quality-reviewer` in tooling-PR mode for CI, scripts, and lint/TS config; `deploy-doctor` for deployment symptoms.

---

## 4. Skills (15) and rules (5)

Skills carry the depth; every one states its **boundary against its nearest neighbour** in `when_to_use`, because three of them touch axe and two touch hydration and an ambiguous boundary means both or neither get loaded.

| Skill | Owns | Boundary |
|---|---|---|
| `quality-gate` | The gate definition, preflight, static-route assertion | Not tool configuration |
| `nextjs-app-router-conventions` | RSC boundaries, metadata, routing, images, Next 16 defaults | Mismatch diagnosis → `hydration-safety` |
| `hydration-safety` | Mismatch diagnosis and the fix order | Structure/metadata → `nextjs-app-router-conventions` |
| `styling-mui-tailwind` | Cascade/layer model, MUI styling, icons, UI upgrade order, **the MUI major + browser floor** | Accessible markup → `accessibility` |
| `accessibility` | WCAG 2.2 AA patterns, the manual checklist | axe mechanics → `testing-e2e-playwright` |
| `testing-unit-vitest` | Vitest config, the Vitest 5 gotchas, the jest-dom matcher-type shim | Anything needing a browser → `testing-e2e-playwright` |
| `testing-e2e-playwright` | The E2E harness, the axe invocation, preview mode | a11y judgement → `accessibility` |
| `client-crypto` | The WebCrypto v2 scheme, blob schema, migration | Headers/supply chain → `web-security` |
| `web-security` | Headers/CSP, env rules, supply chain, secret scanning | The cipher itself → `client-crypto` |
| `vercel-deploy` | Deploy path, the CLI allowlist, quotas, the diagnosis runbook | Headers → `web-security` |
| `code-quality` | Biome/ESLint division of labor, pre-commit, CI shape | Type rules → `typescript` |
| `typescript` | The typecheck gate, tsconfig invariants, the TS upgrade path | Lint ownership → `code-quality` |
| `modernization-roadmap` | Step ordering, dependencies, PR discipline | Per-tool how-to → that tool's skill |
| `low-priority-execution` | The `nice -n 19` convention | What the commands do → `quality-gate` |
| `verify-at-use-time` | The standing verification procedure and this project's recurring checks | Every other skill defers its version literals here |

**Rules** (`.claude/rules/*.md`) are path-scoped and deliberately short — they restate the non-negotiables at the moment a matching file is touched and point at the skill that holds the reasoning: `app-router.md` (`app/**`) · `styling.md` (CSS, Tailwind/PostCSS config, `app/ui/**`) · `crypto.md` (the crypto module, the encrypted-content component, the encryption script, encrypted and private content) · `tests.md` (unit tests, `e2e/**`, the test configs) · `tooling.md` (CI, `package.json`, lint/TS/Next config, pre-commit).

A rule with unparseable frontmatter is skipped **silently**, which is why `.claude/README.md` tells the installer to confirm one actually loads.

---

## 5. Commands (14)

`/feature` and `/features` carry the full pipeline; the rest are slices of it or standalone read-only tools.

- **`/feature <idea>`** — the whole workflow, ending in a PR. Explicitly **refuses to include tooling changes**: if the work needs an upgrade, it stops and routes to `/upgrade` first.
- **`/features <file.md>`** — batch mode: one git worktree per feature, the full pipeline per worktree, **one PR per feature**, each item checked off in the source Markdown as its PR opens. Runs `npm ci` per worktree (a fresh worktree has no `node_modules`), creates worktrees serially, warns when N is large because N concurrent builds and Playwright runs are heavy, and forwards every ⏸ gate labeled by feature.
- **`/plan`**, **`/implement`**, **`/fix`**, **`/review`**, **`/quality-gate`**, **`/upgrade`**, **`/deploy-doctor`**, **`/a11y-audit`**, **`/security-review`**, **`/verify`**, **`/new-page`**, **`/harden`** — each documented in `README.md`.

### The `## User Test Plan` convention

Every delivery ends with one, and it is never omitted. Five parts: why automation could not reach these; **Get it running** (bootstrap vocabulary read from `CLAUDE.md` → Project specifics at use-time, ending at the **Vercel preview URL**); **Check these** (numbered `do X → expect Y`, highest-risk first, each traceable to an acceptance criterion, a ⏸ decision, a tester's out-of-reach line, or a reviewer's judgement call); **Already verified — don't redo**; and optionally **You may notice**.

In a `/features` PR the block must be **self-contained and open with a fresh-checkout step** — the worktree gets deleted, the PR does not. The in-tree `/feature` copy has no checkout step.

This site's recurring genuinely-human items: the preview deployment on a real device; the factual accuracy of resume text, dates, links, and certificates; visual and cascade regressions after MUI/Tailwind/layer changes; a real screen-reader pass; mobile decryption latency on a real mid-range phone; decryption with the **real** passwords and content; image transformation quota impact; anything true only on the production custom domain. **Never** a password, token, bypass secret, or private URL — PR bodies are not private and the diff hook does not scan them. Testable-but-untested is a coverage gap to fix, not a hand-off; the empty case is written out explicitly, naming what covered it.

---

## 6. Hooks and settings

Five wired hooks plus `lib.sh`, which is sourced and wired to no event. All are `bash`, `set -u`, **never `set -e`**, and must never break the session: an unknown state exits 0 with a note.

| Hook | Event | Contract |
|---|---|---|
| `protect-secrets.sh` | PreToolUse `Edit\|Write` | Exit 2 blocks writes to `.env*` (**except `.env.example`**, which the hook owns because gitignore-style negation in a permission rule is unconfirmed), the Vercel directory, private content, key/cert files, the local settings file, and the lockfile. |
| `guard-bash.sh` | PreToolUse `Bash` | Splits the command on separators, strips env assignments and `npx`/`npm exec`, and blocks deploying/mutating Vercel commands, `--token` anywhere, force-pushes to the default branch, `--no-verify`, and `npm publish`. **Fails open with a warning** if it cannot parse the command — a parse artifact must never wedge a session. |
| `format-on-edit.sh` | PostToolUse `Edit\|Write` | Formats the single edited file with Biome 2.x; on Biome 1.x it defers to the gate and says why; a missing `node_modules` or a parse error comes back as `additionalContext`. Never exits non-zero. Not wrapped in `nice` — it is a single file. |
| `client-safety-lint.sh` | PostToolUse `Edit\|Write` | Advisory grep for this codebase's actual defect classes, each finding citing the skill that owns it. Always exit 0. |
| `no-secrets-in-diff.sh` | Stop / SubagentStop | Scans changed and untracked files, gitleaks if present and a grep fallback otherwise, reporting **path + rule name only, never a value**. |

Two deliberate details: **PostToolUse cannot block**, so all of its feedback goes through `hookSpecificOutput.additionalContext` rather than an exit code; and `no-secrets-in-diff.sh` **allowlists the studio's own files** (`.claude/**`, `CLAUDE.md`, `README.md`, `BLUEPRINT.md`) along with the encrypted content, the lockfile, and the intentionally-public encryption test page — without that it would flag its own installation and get disabled on day one.

### Permissions: the deny list is belt-and-braces, `guard-bash.sh` is the enforcement point

Permission rules match by prefix with a suffix wildcard. That makes "deny `vercel promote <id>` but allow `vercel promote status`" **inexpressible** — a `Bash(npx vercel promote:*)` deny would swallow the read-only allow. The committed `.claude/settings.json` therefore denies only the families that can be denied wholesale (the bare binary; `deploy`, `redeploy`, `remove`/`rm`; the `env` mutations including `pull` and `run`; `link`, `pull`, `buy`, `api`, `tokens`, `cache`, `firewall`, `redirects`, `routes`, `git`, `teams`, `integration`, `mcp`, `agent`; and the mutating `alias`/`dns`/`domains` subcommands) and **deliberately has no `promote` or `rollback` deny family**.

**The named coverage gap:** `vercel promote <id>`, `vercel rollback <id>`, and any invocation that reaches the CLI by a path no prefix rule sees (notably `npm exec vercel deploy`) are **caught only by `guard-bash.sh`**, which parses the command text. Read that hook as the enforcement point; read the deny list as a second layer that also survives a hook being disabled for the families it can express. The `.env` deny patterns likewise never match `.env.example` — `protect-secrets.sh` owns that exception precisely. No allow rule for a low-priority wrapper appears in any settings file: `nice` is stripped before permission matching, so such a rule would be dead configuration.

Also committed: the **read-only Vercel CLI allowlist** (`--version`, `whoami`, `list`, `inspect [--logs]`, `logs`, `httpstat`, `promote status`, `rollback status`, `env ls`, `project ls`, `domains ls`). These are safe unconditionally and useless without authentication, so making each installer copy them out of a local example bought nothing. `settings.local.json.example` is left for genuine personal convenience — the routine command allowlist — plus pre-loaded `mcp__vercel__*` deny entries so that opting into the MCP server later is safe by default.

### Why no MCP

There is **no `.mcp.json`**, on purpose. The real artifact is this repo's own Playwright suite, run by exit code in the gate and in CI; a browser MCP would add a surface CI cannot reproduce. **Vercel MCP is not wired** either: it is Public Beta, has no read-only mode, and exposes a deploy tool that can target production, purchase tools that spend real money, and a URL-access tool. Both are documented opt-ins in `README.md`.

---

## 7. Parameters — the chosen values

| Decision | Chosen | Where it lives | If you flip it |
|---|---|---|---|
| **MUI major target** | **9** — browser floor Chrome 117 · Edge 121 · Firefox 121 · Safari 17.0 (`@mui/material` 9.4.0 as of 2026-09-17 — re-verify) | One line in `CLAUDE.md` → Project specifics, and the parameter table in `styling-mui-tailwind` (the **only** place the floors appear) | `7.3.x` LTS (floor Chrome 109 · Edge 121 · Firefox 115 · Safari 15.4) changes the pinned versions, the quoted floor row, and the codemod list — nothing else. The `v16-appRouter` import specifier is identical on both lines. |
| **Encrypted content holds real secrets** | **yes** → the crypto checklist items 1–7 are **blocking Must-fix** | One line in `CLAUDE.md` → Project specifics, read at use-time by `security-reviewer` and `/security-review` | `no` demotes those items to advisory Should-fix. A missing or ambiguous line is treated as `yes` — the safe default is the strict one. Real content behind encryption also requires a generated high-entropy passphrase: password entropy is the ceiling and published ciphertext is forever. |
| **Vercel CLI / MCP** | Read-only CLI allowlist **in the committed `settings.json`**; mutating families denied there; `guard-bash.sh` as the enforcement point; **MCP not wired**, documented opt-in with deny entries pre-loaded | `.claude/settings.json`, `.claude/settings.local.json.example`, `README.md` | Wiring MCP means adding a server *and* keeping the deny entries. |
| **Accessibility target** | **WCAG 2.2 AA**, all public routes | `accessibility` skill + the a11y scope line in Project specifics | Scope, not target, is the thing likely to change — see §8 on branch-scoped routes. |
| **pre-commit framework** | **kept** — a local system Biome hook (version sourced from the lockfile), with the hook-repo pins bumped in the Biome upgrade PR | `code-quality` skill | The official Biome pre-commit repo tags are documented as the alternative. |
| **E2E port** | **3100**, dedicated | `testing-e2e-playwright` | Chosen so an E2E run never collides with a dev server on 3000. |
| **Default branch** | **`master`** | Project specifics; also the Biome VCS config | — |

---

## 8. Reference snapshot and what is branch-scoped

**Snapshot, 2026-09-17 — orientation only, re-verify.** Installed: Next 16.2.3 · React/React-DOM 19.2.5 · TypeScript 5.4.4 · MUI 5.18.0 + Emotion 11.11 · Tailwind 3.4.3 · Biome 1.7.3 · ESLint 9.39.4 · `@heroicons/react` 2.1.3 · a single-maintainer encryption library · no tests · no `engines` · no Vercel config file · every route `○`. Upstream at the same date: Next 16.3.5 · React 19.3.0 · TypeScript 6.0.3 (7.0.2 is GA but **blocked**) · Biome 2.5.14 · ESLint 9.39.5 (10.10.0 **blocked**) · MUI 9.4.0 / 7.3.11 LTS · Tailwind 4.3.3 · Vitest 5.0.1 · Playwright 1.63.0 · `@axe-core/playwright` 4.13.0 · jsdom 30.1.0 · gitleaks 8.30.1 · Vercel CLI 59.20.0.

**Hard constraints codified from that research:** TypeScript 7 blocked (the installed Next cannot type-check with it, `typescript-eslint` peers `<6.1.0`, the Next tsserver plugin does not run on it) · ESLint 10 blocked (an `eslint-plugin-react` crash, and it arrives transitively) · **MUI 5 is unsupported on Next 16** (no `v16-appRouter` entry point before `@mui/material-nextjs@7.3.5`) · `@mui/icons-material` must match the `@mui/material` major · the v8 coverage provider pins the exact Vitest version · jsdom 30 needs Node ≥ 24.15.0 · **Vercel does not read `.nvmrc`**, so `engines.node: "24.x"` is its source of truth.

**Branch-scoped, verified 2026-09-17 — do not treat as settled.** `@ionic/react`, `app/ui/expandable-content.tsx`, and the `/playground` and `/side-projects/filter-0` routes exist **only on the in-flight `Filter-Pt-0` branch**; `master` has none of them. Consequences, both already encoded in the shipped files:

- **Ionic removal is pending, not complete.** It applies when that branch's work merges, against whatever base it lands on, and it lands before or with the MUI step. No file records it as done.
- **The accessibility scope line names those two routes conditionally** — in scope if and when they reach the default branch.

Everything else about repo state re-derives from the current branch at use-time. That is the entire point of roadmap Step 0.

---

## 9. The modernization roadmap

**Step 0 — always: re-derive the state from the CURRENT branch.** Never trust a written list of what is done, including this one. `git branch --show-current`, then for each step read `package.json` and the lockfile for the dependency, check whether the config file exists, and grep the source for the API being removed. Only then say what is done.

| # | Step | Depends on |
|---|---|---|
| 1 | Repo/CI hygiene — fix the workflow ordering and triggers, SHA-pin the actions, add `engines.node`, add the `typecheck` script, drop the dead lint script | — |
| 2 | ESLint flat-config fix — remove the severity-downgrading re-spread, delete the legacy config and the redundant globals dependency, pin `typescript-eslint` exactly | 1 |
| 3 | Biome 1 → 2 — pin an exact 2.x, migrate, grep the result for a silently disabled preset, replace the removed `--apply` flags, update pre-commit; reformat in a **separate commit** | — |
| 4 | Vitest harness — config, setup, the jest-dom matcher-type shim, first real tests, the CI job, the artifact gitignore entries | 1 |
| 5 | Playwright + axe harness — config, the route list, the console-error fixture, first specs, the CI job | 1 |
| 6 | TypeScript 5.4 → 5.9 (expect the typed-array/ArrayBuffer breaks, concentrated in the encrypted-content component) | 1, 4 |
| 7 | TypeScript 5.9 → 6.0 — review the new defaults; never add a deprecated option to silence an error | 6 |
| 8 | UI library: MUI 5 → the target major, with the App Router cache provider **without** the CSS layer option; Ionic removal lands before or with this, per Step 0 | 5 |
| 9 | Tailwind 3 → 4 **+** the layer order **+** enabling the MUI CSS layer — these three land together; verify computed styles on a Button and the Drawer | 8 |
| 10 | Next 16.2.3 → 16.3.x — run the upgrade codemod, add the `@AGENTS.md` import line to `CLAUDE.md` (16.3's dev server maintains that block; Claude Code reads CLAUDE.md), re-check the build filesystem-cache default | 1–5 green |
| 11 | Security headers + CSP in `next.config.mjs` — Report-Only first, enforce in a follow-up | 5 |
| 12 | Crypto v2 migration — the WebCrypto module, the build-time encryption script, fixture re-encryption, removal of the legacy library; real content re-encrypted with **new** high-entropy passphrases | 4, 5 |
| 13 | Metadata/SEO — `metadataBase`, the title template, sitemap, robots, the OG image | 10 |
| 14 | Optional/later — automated dependency updates, pinning npm, subresource integrity for scripts, the React Compiler, type-aware linting, analytics | — |

Rules: one concern per PR; tooling never rides along with feature or content work; a step is done only when its PR is **merged with a green gate**; every step states its rollback; codemod output is reviewed hunk by hunk, never trusted.

**Site-defect work is not on this list.** Hydration fixes, accessibility fixes, `sizes` on `fill` images, image filename cleanup, the invalid nesting bug, and the module-level fetch cache go through `/fix` and `/feature` — ideally after step 5, so the safety net exists first.

---

## 10. Verify at use-time

The studio's defining constraint: **nothing version-specific is hardcoded where it can be checked.** The recurring checks, encoded in `verify-at-use-time` and cited by the skills that need them:

1. `npm -v` before relying on any install-script blocking behavior; the npm config help for its flags.
2. `command -v gitleaks`, and the tool's own `--help` before using a flag.
3. Upstream issue status for the two workarounds that exist only until their issues close (the jest-dom matcher-type shim; the tsconfig-paths plugin choice).
4. `node -v` against the jsdom floor; `engines.node` against the **Vercel project's** Node setting.
5. `npm view <pkg> version peerDependencies` before any upgrade; the config package's dependency range before an ESLint major; the typescript-eslint peer range before a TypeScript major; GitHub Action pins re-verified by SHA.
6. Next API questions answered from `node_modules/next/dist/docs/` for the **installed** version — including what differs between it and the next minor.
7. After a Biome config migration, grep the result for a silently disabled rule preset.
8. Vercel project settings: Deployment Protection level, Node version, system environment variable exposure, header precedence (never duplicate headers across config files), and any current per-CVE deploy block.
9. Mobile key-derivation latency measured on a real mid-range phone — never a hardcoded millisecond figure.
10. Never name a custom Tailwind utility after a core utility; check MUI deep-import paths against the package's `exports` map.
11. The **production** (minified) hydration error text before writing a console-error allowlist.
12. Visual and cascade regressions during the UI upgrades, via screenshots and computed-style checks.
13. Whether the encryption-test route — and the branch-scoped routes in §8 — stay public and in the accessibility gate's scope.

---

## 11. Deliberate divergences and non-goals

Choices made against a plausible default, recorded so they are not "fixed" by accident:

- **`nice -n 19` only, at the invocation level.** No `ionice` (it cannot be prefix-approved, so it prompts on every heavy command), no priority wrappers inside `package.json` scripts, test configs, or workflows, and never in CI. Exit codes are never swallowed.
- **Hook matchers are `Edit|Write`.** There is no separate multi-edit tool to match.
- **Path permission rules appear only as `Read(...)` and `Edit(...)`** — write-tool and glob-tool path rules are silently never consulted, which is exactly why `protect-secrets.sh` exists.
- **Commands take `$ARGUMENTS`**, and hook commands quote the project-directory variable.
- **`CLAUDE.md` is the instruction file Claude Code reads**, not `AGENTS.md`. The Next 16.3 upgrade (step 10) adds an import line rather than moving instructions.
- **No performance gate**, by the owner's decision — hence an advisory-only reviewer.
- **No application code or configuration ships with this studio.** The reference configs, fixtures, workflows, and the encryption script exist as reviewed code blocks inside skills and reach the repo only through `/upgrade` PRs. A studio that drops config files into a repo it has not gated yet is just an unreviewed commit.
