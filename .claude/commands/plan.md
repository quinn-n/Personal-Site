---
description: Design, plan, and fact-check a change without implementing it — stops before any code so you can review the plan.
argument-hint: <feature / page / content change description>
---

Produce a verified, ready-to-build plan for: **$ARGUMENTS**

**No code is written by this command.** All three agents are read-only.

0. **Re-derive the repo state** — `git rev-parse --abbrev-ref HEAD`, `git status`, read `package.json` and the files in scope. Never assume a branch, a file's presence, or a line number; this repo changes underneath you. Note whether `vitest.config.mts`, `playwright.config.ts`, and `e2e/` exist so the test plan is realistic — anything missing is **"not yet bootstrapped → run `/upgrade <step>`"**.
1. **Design** — delegate to `feature-designer`. It returns routes touched, the server-vs-client boundary, data shape, a11y acceptance criteria, responsive behavior, static-rendering impact, and edge cases. ⏸ **Present it and wait for my approval or edits.**
2. **Plan** — delegate to `site-planner` with the approved spec. It must return ordered tasks with per-task **`Owns`** file sets, **file-disjoint execution batches**, the Vitest/Playwright test plan, the reviewer routing per touched surface, and a **clustered `[VERIFY]` list**. If any task is really a tooling, dependency, or config change, it must be split out and routed to `/upgrade` — feature work never bundles tooling.
3. **Fact-check (fan out)** — launch **one `fact-checker` per `[VERIFY]` cluster in a single turn** (multiple Task calls), each given only its cluster. Merge the verdicts into one CONFIRMED / REFUTED / UNVERIFIABLE report with evidence. Anything **refuted** goes back to `site-planner` to revise, then re-check only the affected items, until the plan rests solely on confirmed facts. For **UNVERIFIABLE** items, the plan must encode an **at-use-time check** instead of a hardcoded value.
4. **Present** the final spec, plan (with `Owns` sets and batches), test plan, reviewer routing, and fact-check report — plus any ⏸ decision the plan needs from me (especially anything that could make a route non-`○`). **Stop here.** Hand the approved plan to `/implement` when you're ready.
