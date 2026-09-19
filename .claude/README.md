# Personal Site — Claude Code studio

A Claude Code studio for **maintaining and extending this site**: a static Next.js 16 App Router personal/resume site (React 19, TypeScript, MUI + Tailwind, npm) hosted on **Vercel through Git integration**.

It ships 16 subagents, 15 skills, 5 path-scoped rules, 14 slash commands, 5 hooks, and a committed permission set, all tuned to this codebase: keeping every route prerendered static, hydration correctness, WCAG 2.2 AA accessibility, the client-side encryption scheme, and a sequenced tooling-modernization backlog.

## What it does not do

- **It never deploys.** No `vercel deploy`, `promote <id>`, `rollback <id>`, `remove`, or `vercel env` mutation, and never `--token`. Deployment happens the way it already does: PR → preview, merge to `master` → production. Deployment problems are *diagnosed* read-only by `/deploy-doctor`.
- **It never edits site code outside the pipeline.** Only four agents can write files, and they run inside `/feature`, `/features`, `/implement`, `/fix`, `/upgrade`, `/new-page`, or `/harden` — each ending in a green quality gate plus an explicit review verdict.
- **It ships no application code or configuration.** The reference `vitest.config.mts`, `playwright.config.ts`, `biome.json`, `eslint.config.mjs`, CI workflows, and the encryption script live as reviewed code blocks inside skills; they reach the repo through `/upgrade` PRs you approve.

## Install

From the **Personal-Site repo root** (this site's repository):

1. **Copy in the studio** — the `.claude/` directory (which carries this README and `BLUEPRINT.md` inside it) plus `CLAUDE.md` at the repo root, where Claude Code reads it. Nothing else lands at the root, so the site's own `README.md` is never touched. If a `.claude/` directory already exists, **merge, do not overwrite** (as of 2026-09-17 there is none). If a `CLAUDE.md` already exists, merge its project-specific content in rather than replacing it.
2. **Make the hooks executable** — `chmod +x .claude/hooks/*.sh`.
3. **Create your machine-local settings** — `cp .claude/settings.local.json.example .claude/settings.local.json`. That file is for **personal convenience overrides only** (it stops routine, non-destructive commands from re-prompting); it is already gitignored by `.claude/.gitignore`. The safety properties, and the read-only Vercel CLI allowlist, are in the **committed** `.claude/settings.json` — you do not need to copy anything out of the example to get them.
4. **Fill in `CLAUDE.md` → Project specifics** (see below). `security-reviewer` reads one of those lines at use-time, so a placeholder there will stop a security review.
5. **Restart Claude Code**, then run `/agents` to confirm all 16 subagents load, and touch a file under `app/` to confirm a `.claude/rules/*.md` file loads — malformed rule frontmatter fails *silently*.

Test-artifact `.gitignore` entries (`.vitest/`, `coverage/`, `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`) are **not** added at install time; they land with the test-harness `/upgrade` PR that introduces those directories.

## Optional local tools

- **gitleaks** — install the release binary (v8.30.1 as of 2026-09-17 — re-verify). Not installed here as of 2026-09-17, so the `no-secrets-in-diff.sh` hook uses its built-in grep fallback: still useful, but narrower than gitleaks' rule set.
- **pre-commit** — the repo keeps the pre-commit framework; run `pre-commit install` once so the format hook runs on commit.
- **Node ≥ 24.15.0** — `.nvmrc` pins major `24`; the patch floor matters once jsdom 30 is installed. Check with `node -v`.

## First run

1. `/quality-gate` — this reports the **bootstrap state** rather than failing: which of Biome, ESLint, typecheck, Vitest, the production build, and Playwright + axe exist yet, and which report "not yet bootstrapped → run `/upgrade <step>`".
2. `/upgrade next` — works the modernization roadmap one single-concern PR at a time. The first steps bring up CI hygiene, the ESLint config fix, Biome 2, the Vitest harness, and the Playwright + axe harness, so later work has a safety net.
3. Then: `/feature <idea>` for feature or content work, `/features <file.md>` for a batch (one worktree and one PR per item), `/fix <symptom>` for a defect, `/a11y-audit` for an accessibility sweep.

## The commands

| Command | What it does |
|---|---|
| `/feature <idea>` | Full pipeline: design → plan → fact-check → ⏸ gate → parallel implementation → quality gate → review board → fix loop → PR with a `## User Test Plan`. |
| `/features <file.md>` | Batch mode: one git worktree per feature, the full pipeline per feature, one PR each, items checked off in the source file as PRs open. |
| `/plan <feature>` | Design, plan, and fact-check only — stops before any code so you can review the plan. |
| `/implement` | Execute an already-approved plan in ordered, file-disjoint batches with review loops. |
| `/fix <symptom>` | Reproduce, root-cause, write the **failing regression test first**, then the minimal fix. |
| `/review [--scope diff]` | Run the review board in parallel and consolidate Must-fix / Should-fix / Nit. Reviews only. |
| `/quality-gate` | Preflight, then Biome → ESLint → typecheck → Vitest → build + the static-route assertion → Playwright + axe. |
| `/upgrade <step\|next>` | One single-concern modernization PR, in roadmap order. Refuses to include feature or content changes. |
| `/deploy-doctor [<pr>\|<url>]` | Read-only diagnosis of a failed or odd Vercel deployment; recommends a remediation, usually reverting the PR. |
| `/a11y-audit [route ...]` | axe over the routes and interactive states plus a manual WCAG 2.2 AA review. Audits, never fixes. |
| `/security-review [--scope diff]` | The crypto / headers / supply-chain / secret-hygiene checklist, `npm audit`, and a secret scan. |
| `/verify <claim\|list>` | Parallel fact-checks returning CONFIRMED / REFUTED / UNVERIFIABLE with evidence. |
| `/new-page <route> [purpose]` | Scaffold a new **static** route with its own metadata, a colocated test, and an axe pass. |
| `/harden [surface]` | Coverage backfill and cleanup with no behavior change; green gate before and after. |

## How work reaches production

**PR → Vercel preview → review → merge to `master` → production.** Vercel's Git integration builds every push; the studio never triggers a deployment. Each PR body carries a `## User Test Plan` that includes checking the **preview deployment** on a real device (preview protection may ask you to log in first, and indexability is never asserted on a preview). If a deployment goes wrong, `/deploy-doctor` diagnoses it and normally recommends **reverting the PR** — Instant Rollback is a human-only action that turns off auto-assignment of production domains.

## Verify at use-time (nothing here is a permanent fact)

Every version number in this studio is a snapshot dated **2026-09-17**. The agents are instructed to re-check these rather than recall them — expect them to run these commands, and treat any answer that skips them as suspect:

- Next.js API behavior → the docs bundled with the installed version at `node_modules/next/dist/docs/` (also the source for what differs between the installed version and the next minor).
- Any dependency version, peer range, or upgrade → `npm view <pkg> version peerDependencies`; GitHub Action pins re-verified by SHA.
- `node -v` (≥ 24.15.0 for jsdom 30) and `engines.node` against the **Vercel project's** Node setting — Vercel does not read `.nvmrc`.
- `npm -v` before assuming anything about install-script blocking; `npm help config` for its flags.
- `command -v gitleaks`, and `gitleaks git --help` before using a flag.
- Upstream issue status before relying on a workaround: the jest-dom matcher-type shim and the Vitest tsconfig-paths plugin both exist only until their issues close.
- After a Biome config migration, grep the result for a silently disabled rule preset.
- Vercel project settings: Deployment Protection level, Node version, system environment variable exposure, header precedence, and any current per-CVE deploy block.
- Mobile decryption latency measured on a real mid-range phone — never a hardcoded number.
- Custom Tailwind utility names never shadowing core ones; MUI deep-import paths checked against the package's `exports` map.
- The **production** (minified) hydration error text before writing any console-error allowlist.
- Visual and cascade regressions during the MUI and Tailwind + CSS-layer upgrades, via screenshots and computed-style checks.
- Whether `/encryption-test` — and `/playground` and `/side-projects/filter-0`, if they reach the default branch — stay public and in the accessibility gate's scope.

## Opt-ins (off by default)

- **Vercel CLI (read-only)** — the read-only commands (`--version`, `whoami`, `list`, `inspect [--logs]`, `logs`, `promote status`, `rollback status`, `env ls`, `project ls`, `domains ls`) are already allowed in the committed `.claude/settings.json`. They still need you to be authenticated: `vercel login`, or `VERCEL_TOKEN` exported in your own shell. **Never pass `--token`** — it overrides the environment and leaks into the process list.
- **Vercel MCP** — not wired. It is Public Beta, has no read-only mode, and exposes deploy and purchase tools. If you want it: `claude mcp add --transport http vercel https://mcp.vercel.com --scope local`. The `mcp__vercel__*` deny entries that make that safe are **already pre-loaded** in `.claude/settings.local.json.example`, so copying that file first (install step 3) is what makes opting in safe by default.
- **Preview smoke tests** — a `repository_dispatch` workflow triggered by Vercel's deployment-success event, running the E2E suite against the preview URL. The primary gate stays the local production build in PR CI.
- **Dependabot**, **subresource integrity for scripts**, the **React Compiler**, and **Vercel Analytics / Speed Insights** — each a separate, reviewed `/upgrade` PR with its own rationale (Analytics also needs a CSP and privacy note).

## Honest limits

- **No performance gate.** There is no Lighthouse or bundle-size threshold: `performance-reviewer` is advisory and never blocks. Regressions in Core Web Vitals will not fail anything automatically.
- **axe catches a minority of accessibility issues.** The automated scan is a floor, not a ceiling; the manual WCAG 2.2 AA checklist and a real screen-reader pass are yours to do. `a11y-ux-reviewer` reasons about the code, which is not the same as using the site.
- **Playwright runs chromium only.** Safari and Firefox behavior — especially anything at the MUI browser floor — is unverified here.
- **The studio cannot verify truth or production-only behavior.** Whether your resume text, dates, links, and certificates are accurate; whether decryption works with the *real* passwords and content (the fixtures are public test data); real-device unlock latency; HSTS, indexability, and anything else that is only true on the production custom domain. That is exactly what each PR's `## User Test Plan` hands back to you.
- **Everything dated is a snapshot.** See the verify-at-use-time section above.

## Project specifics to fill in

`CLAUDE.md` ends with a **Project specifics** block: production domain, Vercel org/project and plan, Deployment Protection level, the MUI major target, whether encrypted content holds real secrets, the accessibility scope, default branch, Node floor, package manager, E2E port, gitleaks availability, and where the Next docs live. Agents read those lines **at use-time** — fill them in before the first real run, and update them when the answer changes.
