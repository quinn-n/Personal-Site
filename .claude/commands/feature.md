---
description: Run the full feature pipeline for a feature, page, or content change — design, plan, fact-check, parallel implement+review loops, test, review board, PR with a User Test Plan.
argument-hint: <feature / page / content change description>
---

Build the following end to end on this site: **$ARGUMENTS**

Orchestrate the specialized subagents in the order below, pausing at every ⏸ gate. Do not skip gates. Keep me informed with a one-paragraph status per phase (which tracks are running, current verdicts, round counts) and stop and ask on any blocker.

**One concern per PR.** A feature PR carries feature/content work only. If the work turns out to need a dependency, toolchain, config, or framework change, **stop and route that part to `/upgrade` first** — never bundle it here. The `site-implementer` tracks in play for a feature are **ui** and **logic-crypto**; the **tooling-config** track belongs to `/upgrade` and must not appear in a feature batch.

## 0. Preflight — re-derive the repo state, never assume it

This repo changes underneath you. Before anything else:
- `git rev-parse --abbrev-ref HEAD` and `git status` — capture the **current** branch as the base; never assume which branch you are on or what exists on it. If the tree is dirty or you are on a detached HEAD, stop and ask.
- Read `package.json` (scripts, dependencies) and check for `vitest.config.mts`, `playwright.config.ts`, `e2e/` so you know what the gate can actually run. Report anything missing as **"not yet bootstrapped → run `/upgrade <step>`"**, not as a failure.
- Re-read every file you intend to touch. Never trust a remembered path, line number, or component name.

## 1. Design ⏸

Delegate to `feature-designer`. It returns a testable spec: routes touched, the server-vs-client boundary, data shape, a11y acceptance criteria, responsive behavior, static-rendering impact, edge cases. Present it. ⏸ **Wait for my approval or edits.**

## 2. Plan

Delegate to `site-planner` with the approved spec. It must return ordered tasks with per-task **`Owns`** file sets, **file-disjoint execution batches**, the Vitest/Playwright test plan, the reviewer routing for each touched surface, and a **clustered `[VERIFY]` list**. It writes no code.

## 3. Fact-check (fan out) ⏸ PLAN GATE

The `[VERIFY]` items are independent lookups, so resolve them concurrently: launch **one `fact-checker` per verification cluster in a single turn** (multiple Task calls), giving each only its cluster. If the plan lists no clusters, split the items into disjoint groups yourself; use a single `fact-checker` when there are only a couple. Merge the verdicts (CONFIRMED / REFUTED / UNVERIFIABLE with evidence) into one report.
- Anything **refuted** goes back to `site-planner` to revise the affected steps; then re-run only the affected `fact-checker`(s). Repeat until the plan rests only on confirmed facts.
- For **UNVERIFIABLE** items, the plan must encode an at-use-time check instead of a hardcoded value.

⏸ **PLAN GATE — present the final spec, plan (with `Owns` sets and batches), test plan, reviewer routing, and fact-check report, and wait for my approval before any code is written.**

## 4. Implement in parallel batches, each track gated by a review loop

Work through the batches **in order**. For each batch:
- Launch **one `site-implementer` per independent task in the batch, in parallel** (multiple Task calls in a single turn). Give each its task, its **track** (`ui` or `logic-crypto`), and its `Owns` file set, and tell it to stay strictly inside that set and report cross-track needs rather than reaching across. Two tasks share a batch only if they are independent **and** file-disjoint.
- **Run an implement↔review loop per track** — code must *pass* review, not merely be written:
  a. The `site-implementer` writes the code plus the tests the plan specifies and gets them green locally.
  b. Send that track's diff to the reviewers the routing table selects for its surface (always `nextjs-reviewer` + `code-quality-reviewer` + `a11y-ux-reviewer`; add `security-reviewer` for crypto/headers/deps/secret-adjacent changes; add `performance-reviewer` — **advisory only, Should-fix/Nit, never Must-fix, never blocking** — for UI-dependency, image, font, or client-surface changes). Each returns **VERDICT: APPROVED** or **VERDICT: CHANGES REQUESTED** with Must-fix / Should-fix / Nit.
  c. On CHANGES REQUESTED, send the Must-fix list back to the **same** track's `site-implementer`, which addresses it with a change log; then re-review.
  d. Loop until **APPROVED**. Cap at ~3 rounds; if it hasn't converged, or the implementer and a reviewer disagree on a Must-fix, ⏸ **surface the disagreement to me** instead of looping further.
- Review loops for different tracks run concurrently. When every track in the batch is APPROVED, integrate the batch (resolve flagged shared touch-points serially yourself or with one dedicated `site-implementer`), then run **`/quality-gate`** for the batch. Only a green gate starts the next batch.
- ⏸ **Before enabling anything that could make a route dynamic** (`cookies()`, `headers()`, `connection()`, a nonce CSP, `proxy.ts`, `dynamic = 'force-dynamic'`), stop and ask. Every route stays `○ (Static)`.
- Run compute-heavy commands at low OS priority locally — `if [ -n "$CI" ]; then npm run build; else nice -n 19 npm run build; fi` — never in CI, never swallowing the exit code, and `nice` is the only wrapper used. See the `low-priority-execution` skill.

## 5. Test the integrated feature

In parallel:
- `unit-tester` — runs the real Vitest suite and `npm run typecheck`, reporting failures with file/line.
- `e2e-a11y-tester` — runs Playwright + `@axe-core/playwright` against the **production build** on port 3100, covering the changed routes and their interactive states, plus console errors and image loads.

Each tester closes with its **"could not verify from here"** list — that list is raw material for the User Test Plan, not an excuse for missing coverage.

## 6. Feature-level review board (parallel)

Run the board on the integrated change per the routing table (same selection as step 4b). Each returns a verdict. Route every CHANGES REQUESTED back through `site-implementer` (or `bug-fixer` for defects) with the same capped loop, then re-run the affected tests.

## 7. Fix

Route remaining defects to `bug-fixer`: reproduce → root cause → **failing regression test first** → minimal fix → prove green. Loop its output back through the reviewers that flagged the issue until APPROVED.

## 8. Done = green `/quality-gate` AND review board APPROVED

Never one without the other. Run `/quality-gate` once more on the final integrated state. Never weaken a check to make it pass.

## 9. Commit, push, PR

- **Verify the PR tooling at use-time, don't assume it:** `gh --version`, `gh auth status`, `git remote get-url origin`. If `gh` is missing or unauthenticated, do the work anyway and **fall back** to pushing the branch and printing the compare URL (`https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1`) for manual PR creation. Say up front which path we're on.
- Commit on a feature branch off the base branch captured in step 0, push (`git push -u origin <branch>`), then `gh pr create --base <base-branch> --head <branch> --title "<feature>" --body-file <summary-file>`. Write a real body — what was built, which tracks ran in parallel, how many review rounds each took, the gate result, tester results, outstanding Should-fix/Nit — then the section below.
- **The studio never deploys.** The PR's Vercel preview comes from the repo's Git integration; never run `vercel deploy`, `promote`, `rollback`, `remove`, or any `vercel env` mutation, and never pass `--token`.

## 10. Close with a section headed exactly `## User Test Plan`

**Always emitted, never omitted.** It covers **only what this pipeline could not verify** — derived from acceptance criteria the testers did not mark passing, each tester's closing "could not verify from here" list, anything settled at a ⏸ gate, reviewer items left as judgment calls, and the surface itself. Never restate what the gate already asserted.

**Five parts, the last optional:**

1. **Why** — one line on what automation couldn't reach here, and why.
2. **Get it running** — a copy-pasteable block using **this repo's real bootstrap vocabulary, read from CLAUDE.md's Project specifics at use-time**: `npm ci` → `npm run build && npm run start` → and the **Vercel preview URL from the PR checks** (`gh pr checks`), opened on a real device/browser. Note that preview protection may require a login, and that **indexability is never checked on a preview**. `/feature` runs in the current working tree, so there is **no checkout step**. Never invent a port, path, entry point, or script name — if a project-specific is still a placeholder, emit `<fill in: …>`.
3. **Check these** — numbered `do X → expect Y` steps, ≤ ~5, highest-risk first, each traceable to a specific acceptance criterion, a ⏸ decision, a tester's out-of-reach line, or a reviewer judgment call.
4. **Already verified — don't redo** — name the green `/quality-gate` (Biome → ESLint → typecheck → Vitest → build + the `○ (Static)` assertion → Playwright + axe) and what `unit-tester` and `e2e-a11y-tester` covered.
5. *(optional)* **You may notice** — outstanding Should-fix/Nit items a reader might trip over.

**This site's recurring genuinely-human items** — draw from these, never invent busywork:
- the **Vercel preview deployment** renders correctly on a real device/browser;
- **content and factual accuracy** of resume text, dates, links, and certificates — only you know the truth;
- **visual/cascade regressions** after MUI, Tailwind, or CSS-layer changes — screenshots can't judge intent;
- a **real screen-reader pass**;
- **mobile PBKDF2 unlock latency** on a real mid-range phone;
- decryption with the **real** passwords and content (the committed fixtures are public test data);
- **image transformation quota** impact on the hosting plan;
- anything true only on the **production custom domain** (HSTS, indexability, production URL env).

**Rules for this section:**
- **Never include a password, token, bypass secret, or private URL.** PR bodies are public and the diff secret-scan hook scans the working diff, not a PR body.
- **Not an escape hatch.** Testable-but-untested is a **coverage gap to fix** in this pipeline, not a hand-off to me. If the honest list runs past ~5 items, say so plainly — that means the change needed more automated coverage.
- **When nothing is needed, say so explicitly** in one sentence naming what covered it — never a bare "N/A", never an absent section. E.g. *"Nothing required — `/quality-gate` is green including the `○ (Static)` assertion, and `e2e-a11y-tester` verified all four acceptance criteria plus the axe scan on both changed routes at 320px and 1440px."*
- If the repo has a PR template (`.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE/`), fold this section into it rather than fighting it.
