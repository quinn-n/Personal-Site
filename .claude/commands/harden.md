---
description: Strengthen an area with no behavior change — backfill unit/E2E/axe coverage, clean up structure, and pass the a11y and security reviews, with a green gate before and after.
argument-hint: "[file / route / area to harden, or leave blank for the current diff]"
---

Harden: **$ARGUMENTS** (default: the current diff / recently changed files).

**No behavior change.** If hardening uncovers a real defect, don't fix it inline — hand it to `/fix` (or `/feature` if it needs a spec). If it needs a dependency or config change, hand it to `/upgrade`. This command makes existing behavior safer to change, nothing else.

1. **Establish the baseline.** Re-derive the repo state (`git rev-parse --abbrev-ref HEAD`, `git status`, read the files in scope — never from memory), then run **`/quality-gate`**. **A green gate before is the precondition**; if it's red, stop and report — hardening on top of a failing gate hides the cause. If the test harness isn't installed yet, report **"not yet bootstrapped → run `/upgrade <step>`"**; backfilling coverage is impossible without it.
2. **Backfill coverage — `test-engineer`.** Meaningful Vitest unit/component tests, Playwright specs for the routes and interactive states in scope, and axe coverage of those states. It edits **only test files and test configuration**. Coverage exists to make the next refactor safe — no assertion-free tests, no snapshots standing in for behavior.
3. **Surface issues — in parallel, read-only:** `a11y-ux-reviewer` (WCAG 2.2 AA by hand: keyboard path, focus visibility and management, accessible names, status messages, reflow, reduced motion, target size) and `security-reviewer` (the full checklist — see `/security-review` for how its blocking vs advisory items are decided).
4. **Clean up — `code-refactorer`**, on the now-green baseline: component extraction, dead CSS and utility removal, tightened typing, removing orphan lint suppressions. **Behavior-preserving only** — if a change alters rendered output, semantics, or public behavior, it isn't a refactor; stop and route it.
5. **Route the fixes.** Findings from step 3 that require product changes do **not** belong to this command: defects → `/fix`, planned work → `/implement` or `/feature`, dependency/tooling → `/upgrade`. Say so explicitly rather than quietly widening scope.
6. **Re-gate and review.** Run **`/quality-gate`** again — green **before and after** is the whole contract, and the static-route assertion must still show every route `○ (Static)`. Then run the review board over the diff (`nextjs-reviewer`, `code-quality-reviewer`, `a11y-ux-reviewer`, plus `security-reviewer` if anything secret-adjacent moved) and loop Must-fix items back to `test-engineer` or `code-refactorer` until **APPROVED** (cap ~3 rounds, then ⏸ escalate to me). `unit-tester` and `e2e-a11y-tester` confirm the suites genuinely pass rather than merely running.
7. **Report** coverage before → after (what is now tested that wasn't), the structural cleanups, the findings routed elsewhere with their destination command, both gate results, and what was deliberately left out of scope. If this becomes a PR, close with the `## User Test Plan` section exactly as `/feature` specifies — for a no-behavior-change PR the empty case is common, so write it explicitly (naming the gate and the tester coverage that justifies it), never a bare "N/A".

Run heavy commands at low priority locally: `if [ -n "$CI" ]; then npm test; else nice -n 19 npm test; fi`. Never in CI, never swallowing the exit code, and `nice` is the only wrapper used.
