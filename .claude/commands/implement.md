---
description: Execute an already-approved, fact-checked plan — ordered file-disjoint batches, one implementer per task, the quality gate per batch, and review loops to APPROVED.
argument-hint: "[plan file path or a description of the approved plan]"
---

Execute the approved plan: **$ARGUMENTS** (default: the most recent plan from `/plan` in this session).

Prerequisite: the plan must already be **approved and fact-checked**. If its `[VERIFY]` items were never resolved, stop and run `/plan` (or `/verify`) first — never implement on unconfirmed facts.

0. **Re-derive the repo state** before touching anything: `git rev-parse --abbrev-ref HEAD`, `git status`, and re-read every file in the plan's `Owns` sets. Never trust remembered paths or line numbers. **If the plan contains tooling, dependency, or config work, stop** — that belongs to `/upgrade` as its own PR.
1. **Read the plan's batches.** If it lacks explicit execution batches, derive them from task dependencies and file ownership; two tasks share a batch only if they are independent **and** file-disjoint. If everything is interdependent, run one sequential batch.
2. **Per batch, in order:** launch **one `site-implementer` per independent task, in parallel** (multiple Task calls in one turn), each given its task, its **track** (`ui` or `logic-crypto` for product work; `tooling-config` only inside `/upgrade`), and its `Owns` file set — with instructions to stay strictly inside it and report cross-track needs rather than reaching across. For each track run the **implement↔review loop**:
   - The `site-implementer` writes the code plus the tests the plan specifies and gets them green.
   - The reviewers selected by the plan's routing return **VERDICT: APPROVED** or **VERDICT: CHANGES REQUESTED** with Must-fix / Should-fix / Nit — always `nextjs-reviewer` + `code-quality-reviewer` + `a11y-ux-reviewer`; add `security-reviewer` for crypto, headers/CSP, dependency, or secret-adjacent changes; add `performance-reviewer` (**advisory only — Should-fix/Nit, never Must-fix, never blocking**) for UI-dependency, image, font, or client-surface changes.
   - On CHANGES REQUESTED the **same** implementer addresses the Must-fix list with a change log, then re-review. Loop to **APPROVED**, cap ~3 rounds, then ⏸ surface any disagreement to me instead of looping further.
   - When every track in the batch is APPROVED, integrate (serialize shared touch-points), run **`/quality-gate`**, and only start the next batch on green.
   - ⏸ **Stop and ask before enabling anything that could make a route dynamic** (`cookies()`, `headers()`, `connection()`, nonce CSP, `proxy.ts`, `force-dynamic`). Every route stays `○ (Static)`.
   - Run heavy commands at low priority locally: `if [ -n "$CI" ]; then npm test; else nice -n 19 npm test; fi`. Never in CI, never swallowing the exit code, and `nice` is the only wrapper used.
3. **Test the integrated result** — `unit-tester` (Vitest + typecheck) and `e2e-a11y-tester` (Playwright + axe against the production build on port 3100) in parallel. Each closes with its **"could not verify from here"** list.
4. **Feature-level review board** in parallel per the routing table; loop any CHANGES REQUESTED back through `site-implementer` (or `bug-fixer` for defects) until APPROVED, re-running the affected tests after each round.
5. **Report** — tracks that ran in parallel, review rounds per track, gate results, tester results, and outstanding Should-fix/Nit items. **Done = a green `/quality-gate` AND the review board APPROVED.** If this work is heading for a PR, close it with the `## User Test Plan` section exactly as `/feature` specifies.

Keep me informed with a one-paragraph status per batch, and stop and ask on any blocker or non-converging loop.
