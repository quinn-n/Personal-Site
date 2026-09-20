---
description: Run the project quality gate — preflight detection, then Biome, ESLint, typecheck, Vitest, build + the static-route assertion, and Playwright + axe, failing fast in that order.
---

Run the quality gate on the current working tree. **This is the only name for the gate — there is no `/gate` alias.**

Run compute-heavy steps at low OS priority locally and never in CI: `if [ -n "$CI" ]; then <cmd>; else nice -n 19 <cmd>; fi`. `nice` execs in place, so the exit code is preserved — **never swallow it**. See the `low-priority-execution` skill.

## The gate

**Step 0 — preflight (detect, never assume):** `node -v` (>= 24.15.0 once jsdom 30 is present), `npm -v`, Biome major (`npx --no-install biome --version`), presence of `typecheck`/`test`/`test:e2e` scripts, `vitest.config.mts`, `playwright.config.ts`, `e2e/`. Missing components are reported as **"not yet bootstrapped → run `/upgrade <step>`"**, not as failures.

Then, fail-fast in this order:
1. `npx biome check .` (Biome 1.x present → `npx biome check ./app`, and say so)
2. `npx eslint .`
3. `npm run typecheck` (= `next typegen && tsc --noEmit`) — **required**: `next build` silently skips `*.test.ts(x)` type errors
4. `npm test` (= `vitest run`; never watch)
5. `npm run build` **+ the static-route assertion**
6. `npm run test:e2e` (= `playwright test`; webServer builds + serves on **port 3100**)

Skip the steps whose tooling isn't installed yet, and say exactly which ones you skipped and why.

Delegate step 4 to `unit-tester` (Vitest + typecheck, failures reported with file/line and triaged into product bugs vs test bugs) and step 6 to `e2e-a11y-tester` (Playwright + `@axe-core/playwright` against the production build, reporting violations, `incomplete` axe results, console errors, and what it could not verify from here). Steps 1–3 and 5 you run directly. This command invokes **no edit-access agent** — it reports, it never fixes.

## Static-route assertion

Parse the `next build` route table. The legend is verbatim:

```
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Fail if any route line begins with `ƒ`. Also fail if the route table is empty or unparseable** — a build-output format change must never silently green the gate. Use `next build --debug` for detail when it fails.

## Report

- Preflight results, including anything "not yet bootstrapped → run `/upgrade <step>`".
- Each step: pass / fail / skipped, with the failing output (file:line where available) for the first failure.
- The static-route assertion result: number of routes parsed and confirmation that every one is `○`.
- **Never weaken a check, narrow a scope, or add a suppression to go green** — a failing gate is information.

**"Done" = a green gate AND the review board APPROVED.** Never one without the other. This command covers only the first half; run `/review` for the second.
