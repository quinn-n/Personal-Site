---
description: Diagnose and fix a bug — hydration mismatch, console error, broken route, failing test — with a failing regression test written before the fix.
argument-hint: <symptom / repro steps / error text>
---

Fix this: **$ARGUMENTS**

**Route it first:**
- If the symptom is a **deployment** one (a Vercel build failed, a preview looks wrong, production drifts from the repo), this is not a code bug yet → run **`/deploy-doctor`** instead and come back with its diagnosis.
- If the fix requires a dependency, toolchain, or config change, **stop and route that part to `/upgrade`** — a fix PR carries the fix only.

1. **Re-derive the repo state.** `git rev-parse --abbrev-ref HEAD`, `git status`, and re-read the files involved — never trust a remembered path, component name, or line number, and never assume a file exists on the current branch just because it exists somewhere.
2. **Delegate to `bug-fixer`:** reproduce → root cause → **failing regression test first** → minimal fix → prove it green.
   - Reproduce in the real artifact: a Playwright spec for anything route-, render-, or browser-level; a Vitest test for pure logic. Hydration mismatches and console errors reproduce against the **production build** (dev-overlay text differs from minified production text — check the actual text at use-time before adding any console allowlist entry).
   - Hydration, nondeterministic-render, and console-error symptoms consult the `hydration-safety` skill: no `Math.random`/`Date`/locale/`window` in render **or `useState` initializers** (the site's `app/ui/background-image.tsx` and `app/ui/under-construction.tsx` are the live examples — confirm they still look that way before citing them); fix order is mount-effect two-pass → client-side `dynamic(..., { ssr: false })` → build-time pick. **`suppressHydrationWarning` is never a fix.**
   - Keep the fix minimal and in scope. If the root cause is larger than the symptom, report that and ⏸ ask before expanding.
3. **Re-gate** — run **`/quality-gate`**. The build step's static-route assertion must still show every route `○ (Static)`. Run heavy commands at low priority locally (`if [ -n "$CI" ]; then npm run build; else nice -n 19 npm run build; fi`) — never in CI, never swallowing the exit code.
4. **Confirm the suites, don't just run them** — `unit-tester` reports the Vitest suite and typecheck with file/line, and for any UI-visible fix `e2e-a11y-tester` re-runs the affected route specs plus the axe scan against the production build, closing with what it could not verify from here.
5. **Verify the regression test actually regresses** — confirm it fails on the pre-fix code and passes after. A test that passes both ways proves nothing.
6. **Review** — send the diff to `nextjs-reviewer` + `code-quality-reviewer`, adding `a11y-ux-reviewer` for any UI/content/styling change and `security-reviewer` for anything touching crypto, headers/CSP, dependencies, or secret-adjacent code. Loop Must-fix items back to `bug-fixer` until **APPROVED** (cap ~3 rounds, then escalate to me).
7. **Report** symptom → root cause → fix → test evidence (the regression test's before/after) → gate result → verdicts. If this becomes a PR, close with the `## User Test Plan` section exactly as `/feature` specifies.
