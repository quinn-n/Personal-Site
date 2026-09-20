---
name: vercel-deploy
description: How this site reaches production — Git-integration-only deploys, the read-only CLI allowlist versus the commands that are never run, preview URLs and deployment protection, image transformation quotas, the failed-deployment diagnosis runbook, and why remediation is reverting the PR. Use for anything about deployments, previews, the Vercel CLI, image quotas, or a broken or odd deployment.
when_to_use: Anything about deployments, previews, the Vercel CLI, image transformation quotas, or a deployment that failed or looks wrong. This skill owns the hosting platform and the diagnosis runbook; response headers, CSP, and supply-chain rules live in `web-security`, and the preview-URL test harness lives in `testing-e2e-playwright`.
---

# Deployment (Vercel, Git integration only)

**Git integration is the only deploy path.** A PR produces a preview deployment; merging to `master` produces production. There is no other route, and **the agent never deploys.**

Never run, under any circumstance: a bare `vercel` (it deploys), `vercel deploy`, `redeploy`, `promote <id>`, `rollback <id>`, `remove`, any `vercel env add|rm|update|pull|run`, `link`, `pull`, any mutating `alias`/`dns`/`domains`/`certs` subcommand, `buy`, `api`, `tokens`, `cache`, `firewall`, `git`, `teams`, `integration`, `mcp`, or `agent`.

## The CLI: read-only only

The committed `.claude/settings.json` allowlists the read-only CLI surface, and denies the mutating commands. The deny list is **belt-and-braces**: permission rules are prefix plus suffix-wildcard, so "deny `deploy` but allow `list`" cannot be expressed in general. **The Bash guard hook is the real enforcement point** — it parses the command line, splits on separators, and blocks a mutating invocation with an explanation.

| Allowed (read-only) | Never |
|---|---|
| `vercel --version`, `whoami` | bare `vercel` (deploys!) |
| `vercel list`, `vercel inspect <url>`, `vercel inspect <url> --logs` | `deploy`, `redeploy`, `remove` |
| `vercel logs <url>` (runtime logs) | `promote <id>`, `rollback <id>` |
| `vercel promote status`, `vercel rollback status` | `env add/rm/update/pull/run` |
| `vercel env ls`, `project ls`, `domains ls` | `link`, `pull`, `alias`/`dns`/`domains` mutations |
|  | `buy`, `api`, `tokens`, `cache`, `firewall`, `git`, `teams`, `integration`, `mcp`, `agent` |

**Authentication: `VERCEL_TOKEN` in the environment, never `--token` on the command line.** The flag overrides the environment *and* leaks the token into the process list and shell history. CLI **59.20.0** as of 2026-09-17 — re-verify; invoke as `npx vercel …`.

The platform MCP server is **not wired** (Public Beta, no read-only mode, and it exposes deploy and purchase tools). If it is ever enabled, it must come with deny rules for the deploying and purchasing tools.

## Project configuration

- **Zero-config.** Do **not** add a platform config file unless a platform-only setting is genuinely needed — only one such file is allowed, and response headers must not be duplicated there (`web-security`). If one ever becomes necessary, pin its `$schema` to `https://openapi.vercel.sh/vercel.json` and keep it to the single setting that required it.
- **No `output: 'export'`** — it discards headers, redirects, rewrites, and the default image optimizer.
- The platform reads **`engines.node`**, not `.nvmrc`. Keep them consistent (`nextjs-app-router-conventions`).
- Analytics and Speed Insights are off; enabling either is a separate PR with a CSP and privacy note.

## Previews and protection

- Standard Deployment Protection with platform authentication is the default for new projects, which means a preview URL may require a login before it renders. **Verify this project's actual setting in the project dashboard at use-time** — it predates this studio.
- Password Protection is a paid-plan feature.
- Previews **and outdated production deployments** are served `x-robots-tag: noindex`. Never assert indexability against a preview; that check belongs to the production domain.
- Running the E2E suite against a preview: `PLAYWRIGHT_BASE_URL` plus a bypass header **from a CI secret only** (`testing-e2e-playwright`). Never commit the secret, never paste it into a PR body, never upload traces from a preview run.
- An optional preview-smoke workflow can trigger on the platform's deployment-success repository dispatch event (payload carries the deployment URL and the git SHA); the workflow file must exist on the default branch for the dispatch to fire. The primary E2E gate remains the local production build in PR CI.

## Images and quotas

On the free tier: **5,000 transformations, 300,000 cache reads, and 100,000 cache writes per month.** Exceeding the transformation quota makes **new** images return 402 (the `onError` path shows the alt text) — existing cached images keep working. Practical rules:

- `sizes` on every `fill` image; pre-size large sources (source images must be ≤ 8192px).
- Only jpeg/png/webp/avif are optimized; GIF and SVG are served as-is — mark them `unoptimized`.
- Locally-stored images are cached up to 31 days and **a redeploy does not invalidate that cache** — rename the file to force a refresh.
- Filenames in `public/` are kebab-case with no spaces.
- A Playwright assertion that images actually load is what turns a quota failure into a red gate instead of a silent blank.

## Runbook: a deployment failed or looks wrong

1. **Locate the deployment.** `gh pr checks <pr>` for the PR's deployment status; `npx vercel list` / `npx vercel inspect <url>` for the deployment itself.
2. **Read the BUILD logs**: `npx vercel inspect <url> --logs`. `vercel logs` shows **runtime** logs, which a static site barely has — using it is the most common wrong turn.
3. **Reproduce locally on Node 24**: `npm ci && npm run build` (wrapped per `low-priority-execution`). A local reproduction turns a platform problem into an ordinary bug.
4. **Walk the common causes:**
   - lockfile drift (someone ran `npm install` and committed a partial lockfile, or did not commit it)
   - type errors that the gate would have caught but the PR skipped
   - **case-sensitive import paths** — works on a case-insensitive local filesystem, fails on the build machine
   - `engines.node` disagreeing with the project's Node setting
   - a missing environment variable *in that specific environment*
   - a **platform-wide per-CVE deploy block** — the platform can refuse to build a dependency version with a known CVE. Check the platform changelog. **Fix by upgrading the dependency, not by setting the opt-out variable.**
5. **Remediate by reverting the PR.** That is the safe, reviewable path: it restores production through the normal Git flow and leaves history intact.
6. **Instant Rollback is a human action, never an agent action.** It only goes back to the immediately previous deployment, and it **turns off automatic assignment of production domains** to future deployments — which quietly breaks the next deploy until someone undoes it (via promoting a deployment or the dashboard's Undo). If you recommend it, say this out loud.

Diagnosis produces a recommendation and evidence. It never produces a deploy.

## Sibling skills
- `web-security` — headers, CSP, and the environment-variable rules that interact with deployments.
- `testing-e2e-playwright` — running the suite against a preview URL safely.
- `verify-at-use-time` — the project settings and quota numbers above are snapshots; confirm them in the dashboard.
- `quality-gate` — reproducing a failed deployment build locally.
