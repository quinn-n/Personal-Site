---
name: quality-gate
description: The definition of "ready" for this site — the bootstrap preflight, the six fail-fast gate steps (Biome, ESLint, typecheck, Vitest, build + the static-route assertion, Playwright + axe), and the rule that a check is never weakened to go green. Use before declaring any work done, when a gate step fails, or when wiring a gate step into CI or a command.
when_to_use: Before declaring any work done, and whenever a gate step fails. This skill owns the gate definition and the bootstrap detection; it does not own tool configuration — Biome/ESLint config lives in `code-quality`, Vitest config in `testing-unit-vitest`, Playwright/axe config in `testing-e2e-playwright`.
---

# The quality gate

`/quality-gate` is **the only name for the gate** in this studio. "Done" means **a green `/quality-gate` AND a review board `VERDICT: APPROVED`** — never one without the other.

## Step 0 — preflight: detect, never assume

This repo is **not yet fully bootstrapped**. As of 2026-09-17 (re-verify — the repo changes) there is no `typecheck` script, no Vitest, no Playwright, no `e2e/` directory, Biome is on 1.x with dead `--apply` flags, the ESLint flat config has a severity-downgrade bug, and `engines.node` is missing. A gate that assumed the toolchain would be red on day one for reasons that are not defects.

Detect first, and report missing pieces as **"not yet bootstrapped → run `/upgrade <step>`"**, not as failures:

| Probe | What it tells you |
|---|---|
| `node -v` | Must be ≥ 24.15.0 once jsdom 30 is installed (jsdom 30 requires it). Below that, say so and skip the Vitest DOM step rather than reporting a phantom failure. |
| `npm -v` | Drives the install-script expectations in the security gate (see `web-security`). |
| `npx --no-install biome --version` | Biome **major 1** vs **major 2** changes the lint invocation (below). Absent → not bootstrapped. |
| `node -e "…"` / read `package.json` scripts | Presence of `typecheck`, `test`, `test:e2e`. |
| `ls vitest.config.mts playwright.config.ts e2e/` | Presence of the unit and E2E harnesses. |

Report the preflight as a short table: each component `present` / `not yet bootstrapped → /upgrade <step>`. Then run only the steps whose tooling exists, and state explicitly which steps were skipped and why.

## The six steps (fail fast, in this order)

Run each locally through the low-priority wrapper (`low-priority-execution`) — these are the heavy commands:

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

**Fail fast:** stop at the first non-zero exit, report the failing step with the real output, and fix that before moving on. Never reorder to "get further".

**Why step 3 is mandatory:** `next build`'s TypeScript step **silently skips `*.test.ts(x)` files** — type errors and unresolved imports inside tests still produce a green build. `next typegen && tsc --noEmit` is the only thing that catches them. See `typescript`.

**Biome 1.x vs 2.x:** on 1.x the scripts still carry `--apply`/`--apply-unsafe`, which **do not exist in Biome 2** (`--write` / `--fix` / `--unsafe` replaced them). Detect the major before choosing the invocation, and never "fix" a 1.x failure by editing a script that the Biome 1→2 upgrade PR owns — see `code-quality` and `modernization-roadmap`.

## The static-route assertion (exact)

Every route on this site must stay **`○ (Static)`**. Parse the route table that `next build` prints. The legend lines are verbatim:

```
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- **Fail if any route line begins with `ƒ`.**
- **Fail if the route table is empty or cannot be parsed.** A build-output format change must never silently green the gate — an unparseable table is a gate failure that a human resolves, not a pass.
- On failure, re-run with `next build --debug` for detail and hand the diagnosis to `nextjs-app-router-conventions` (the list of things that make a route dynamic: `cookies()`, `headers()`, `connection()`, a nonce CSP, `proxy.ts`, `export const dynamic = 'force-dynamic'`).

Turning a route dynamic is a ⏸ human decision, never a silent side effect of a fix.

## Rules

1. **Never weaken a check to go green.** No `--no-verify`, no skipping a spec, no disabling a lint rule, no `@ts-expect-error`, no `test.skip`, no lowering an axe tag set, no deleting the static-route assertion. If a check is genuinely wrong, say so and get a human decision.
2. **Never run a watcher in the gate.** `vitest run`, not `vitest`; `playwright test`, not `--ui`.
3. **The gate runs on the real artifact.** Step 6 tests the **production build** served on port 3100, not `next dev`.
4. **Report honestly.** Green steps, skipped steps (with the bootstrap reason), and failures with file/line. A gate report that hides a skip is a broken gate.
5. **Re-run the whole gate after a fix.** Partial re-runs hide regressions introduced by the fix.
6. **CI runs the same steps at full speed** — never `nice` in CI.

## Sibling skills
- `low-priority-execution` — how every heavy command above is wrapped locally.
- `code-quality` — Biome/ESLint configuration and the rule-ownership split behind steps 1–2.
- `typescript` — what step 3 checks and the TS upgrade constraints.
- `testing-unit-vitest` — step 4's config, the Vitest 5 gotchas, and the jest-dom matcher-type shim (without it step 3 fails).
- `testing-e2e-playwright` — step 6's harness, the axe invocation, and the console-error fixture.
- `modernization-roadmap` — the order in which the missing gate components get bootstrapped.
