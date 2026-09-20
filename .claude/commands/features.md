---
description: From a Markdown file listing multiple features or content changes, build each one in its own git worktree via the full `/feature` pipeline, open one PR per feature, and check each item off in the source file.
argument-hint: <path/to/features.md>
---

Build **every feature listed in the Markdown file at `$ARGUMENTS`**, each isolated in its **own git worktree**, running the same pipeline `/feature` runs — design → plan → fact-check → ⏸ plan gate → parallel implement↔review loops → `/quality-gate` → testers → review board → fix — then open **one pull request per feature** and **check that feature off in the source file**.

Worktrees give true isolation: parallel features can't collide on files, the index, or the gate — stronger than in-tree `Owns` sets. Correctness still beats concurrency: create worktrees serially, **serialize the build/E2E phase** (see step 3), and never mutate the base checkout mid-run — the sole exception is checking completed features off in the features file itself (step 4), a doc-only edit that touches nothing a worktree builds from.

Same hard rules as `/feature`: one concern per PR, **no tooling/dependency/config work in a feature PR** (route it to `/upgrade`), every route stays `○ (Static)`, and **the studio never deploys** — no `vercel deploy`/`promote`/`rollback`/`remove`/`env` mutation, never `--token`.

## 0. Preflight (once, before any worktree)

- If `$ARGUMENTS` is empty or not a readable `.md` file, ask me for the path. Read the file.
- **Re-derive the repo state — never assume a branch.** Capture the **base branch** (`git rev-parse --abbrev-ref HEAD`) and confirm a sane starting state (`git status` — clean, not detached HEAD). If the tree is dirty, detached, or there are multiple remotes, **stop and ask me**.
- **Verify PR tooling at use-time:** `gh --version`, `gh auth status`, `git remote get-url origin` (does it point at the host `gh` is configured for?). If `gh` is missing or unauthenticated, we still do all the work but **fall back** to pushing each branch and printing its compare URL. Tell me up front which path we're on.
- Note the bootstrap state once (`package.json` scripts, `vitest.config.mts`, `playwright.config.ts`, `e2e/`) so each pipeline knows what `/quality-gate` can actually run; anything missing is **"not yet bootstrapped → run `/upgrade <step>`"**, not a failure.
- Claude Code also has a native worktree surface (`--worktree`, the subagent `isolation: worktree` field, and a `.worktreeinclude` file for copying untracked files into new worktrees). It auto-names branches, so it isn't a drop-in for feature-derived names — we hand-roll `git worktree` below for deterministic names. Re-check `claude --help` at use-time; use `.worktreeinclude` if you want `.claude/settings.local.json` (untracked, so **absent from every fresh worktree**) copied in.

## 1. Parse the features file

- **One feature per top-level item — auto-detect the structure.** `##` headings → each heading is a feature (heading text = *name*, the prose/bullets beneath it = *description*). A top-level **numbered**, **bulleted**, or **checklist** (`- [ ]`) list → each top-level item is a feature (item text = *name*, indented sub-bullets = *description*). A leading `#` title, an intro paragraph, and headers that merely group the list are context, not features; `---`-separated blocks also work. **State how you parsed the file** at the ⏸ gate so I can correct you.
- **Decide how you'll mark each item done from that same structure** — checklist `- [ ]` → `- [x]`; numbered or plain-bulleted item → append ` — ✅ DONE`; `##`-heading feature → append ` — ✅ DONE` to the heading; `---`-separated block → mark its title line. Items **already** marked (`- [x]`, or a trailing `DONE`/`COMPLETE`/`✅`) are **already built → skip them** unless I say otherwise.
- Derive a **slug** from each name (lowercase, kebab-case, punctuation stripped, ≤ ~40 chars). Branch = `feature/<slug>`, worktree dir = `../<repo>-worktrees/<slug>`. De-duplicate collisions (`-2`, `-3`).
- **If any item is really a tooling, dependency, or config change, flag it here** — it belongs to `/upgrade`, not to a feature worktree. Ask before excluding it.
- **Warn me when N is large.** Each feature runs `npm ci`, a production `next build`, and a Playwright run — N of those is heavy on one machine. State N, recommend a concurrency cap (typically 2–3 pipelines at a time), and offer to run in waves.
- ⏸ **Present the parsed list — name, one-line description, branch, worktree path — plus how each item will be marked done, which items you're skipping as already-done, any items routed to `/upgrade`, and the proposed concurrency cap. Wait for my approval.**

## 2. Create one worktree per feature (serial)

Create worktrees **one at a time** (multi-worktree git operations aren't guaranteed concurrency-safe), even though the pipelines afterward overlap:
- Pre-check collisions first: branch exists? (`git show-ref --verify --quiet refs/heads/<branch>`) path exists? If so, pick a suffixed name — git otherwise hard-fails. Then: `git worktree add -b <branch> ../<repo>-worktrees/<slug> <base-branch>`.
- A worktree checks out only *tracked* files, so it has **no `node_modules`** → **run `npm ci` in each worktree** before anything builds or tests there. `.claude/settings.local.json` is untracked and will **not** appear in a worktree (see `.worktreeinclude` above); the committed `.claude/` config does.
- Don't run repo-wide git operations (`git gc`, `git fetch --all`) from more than one worktree at once.
- Show me the final (feature → branch → worktree path) mapping.

## 3. Run the full `/feature` pipeline in each worktree

For each feature, run the **complete `/feature` pipeline scoped to its worktree** — every subagent (`feature-designer`, `site-planner`, `fact-checker`, `site-implementer`(s), `unit-tester`, `e2e-a11y-tester`, `nextjs-reviewer`, `code-quality-reviewer`, `a11y-ux-reviewer`, and `security-reviewer` / `performance-reviewer` per the routing table, plus `bug-fixer`) works against **that worktree's absolute path**, and `/quality-gate` must go green **there**. Inside each feature, honor the studio's rules: file-disjoint `site-implementer` batches, implement↔review loops to **APPROVED** (cap ~3 rounds), the ⏸ plan gate, and the ⏸ gate before anything that could make a route dynamic.

**Concurrency, and the one phase you must serialize:**
- Design, plan, fact-check, and code-writing phases may run concurrently across features (launch the current phase for all unblocked features in the same turn), up to the approved cap.
- **Run the build/E2E phase — `/quality-gate` step 5–6 and `e2e-a11y-tester` — one worktree at a time.** The Playwright harness pins **port 3100** and reuses an existing server outside CI, so two concurrent runs would attach to the *other* worktree's server and report green against the wrong build. Serialize it (or give each worktree a distinct port and say so explicitly). Do not "optimize" this back.
- Run heavy commands at low priority locally: `if [ -n "$CI" ]; then npm run build; else nice -n 19 npm run build; fi`. Never in CI, never swallow the exit code; `nice` is the only wrapper used.

**Forward gates and questions to me, labeled by feature.** Collect ⏸ gates and genuine subagent questions across all running features and surface them together, each tagged with **feature name + worktree + phase + the exact question + the context I need** (spec/plan excerpt, options, the agent's recommendation). Never silently decide a real choice. Don't let one feature's pending gate stall the others. Route my answers back to the right pipeline.

Give a **one-paragraph status per round** covering every feature: phase, verdicts, round counts, what's blocked on me.

## 4. Open a PR per feature, then check it off

When a feature is fully green in its worktree (**green `/quality-gate` AND review board APPROVED** — never one without the other):
- Commit its work on its branch with a clear message.
- **Push first — `gh pr create` will not push for you here:** `git push -u origin <branch>` from inside that worktree.
- Open the PR and capture the URL: `PR_URL=$(gh pr create --base <base-branch> --head <branch> --title "<feature name>" --body-file <summary-file>)`. Write a real body (what was built, gate result, tester results, review rounds, then the User Test Plan below) rather than `--fill`. Report `PR_URL`.
- **Fallback** (no `gh`/remote from preflight): after `git push -u origin <branch>`, print `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1` for manual PR creation (the `?expand=1` is an informal convention — best-effort UX, not something to depend on).
- **One PR per feature** — never fold two features into one branch or PR.
- **Then mark that feature done in the source file.** With its PR open (or, in the fallback, its branch pushed and compare URL printed), edit `$ARGUMENTS` in place to mark **only that feature's item** complete using the convention chosen in step 1. **Re-read the file immediately before each edit** so features finishing around the same time don't clobber each other's check-offs, and leave every other line unchanged. If the file can't be written, report it and move on — never fail a finished feature over a check-off.

### Every PR body ends with a section headed exactly `## User Test Plan`

**Never omitted.** Same derivation as `/feature`: it covers **only what the pipeline could not verify** — acceptance criteria the testers didn't mark passing, each tester's closing "could not verify from here" list, ⏸ gate decisions, and reviewer judgment calls. Never restate what the gate asserted.

**Five parts, the last optional:**

1. **Why** — one line on what automation couldn't reach, and why.
2. **Get it running** — **self-contained**: this worktree is deleted at step 5, but the PR outlives it, so the block opens with a **fresh checkout** — `git fetch origin && git switch <branch>` → `npm ci` → `npm run build && npm run start` → then the **Vercel preview URL from this PR's checks** (`gh pr checks`), opened on a real device/browser. Preview protection may require a login; **never check indexability on a preview**. Take the script names and vocabulary from CLAUDE.md's **Project specifics at use-time** and emit `<fill in: …>` rather than inventing a port, path, or script name. You may add **one** line noting the worktree at `<path>` is already installed *if* it still exists — as a shortcut, never as the only route.
3. **Check these** — numbered `do X → expect Y`, ≤ ~5, highest-risk first, each traceable to an acceptance criterion, a ⏸ decision, a tester's out-of-reach line, or a reviewer judgment call.
4. **Already verified — don't redo** — name the green `/quality-gate` (Biome → ESLint → typecheck → Vitest → build + the `○ (Static)` assertion → Playwright + axe) and what `unit-tester` and `e2e-a11y-tester` covered.
5. *(optional)* **You may notice** — outstanding Should-fix/Nit items.

**This site's recurring genuinely-human items** (draw from these, never invent busywork): the **Vercel preview** rendering correctly on a real device; **content/factual accuracy** of resume text, dates, links, certificates; **visual/cascade regressions** after MUI/Tailwind/layer changes; a **real screen-reader pass**; **mobile PBKDF2 unlock latency** on a real mid-range phone; decryption with the **real** passwords and content (committed fixtures are public test data); **image transformation quota** impact; anything true only on the **production custom domain**.

**Rules:** **never** put a password, token, bypass secret, or private URL in a PR body — it's public, and the diff secret-scan hook scans the working diff, not the body. **Scope every item to this feature alone** — never mention a sibling feature, its branch, or its worktree; each PR is read on its own. Testable-but-untested is a **coverage gap to flag as a follow-up**, not a hand-off. When nothing is needed, write the one explicit sentence naming what covered it (`"Nothing required — …"`), never a bare "N/A" and never a missing section. If the repo has a PR template, fold the section into it.

## 5. Summary & cleanup

- Report a table: feature → branch → worktree → PR URL (or compare URL) → gate result → review rounds → **User Test Plan** (`N items` / `nothing required`) → outstanding Should-fix/Nit → anything still waiting on me.
- **Then one consolidated cross-feature test pass.** Merge every PR's `## User Test Plan` into a single hands-on checklist **grouped by feature** (feature name → its numbered `do X → expect Y` items, keeping each item's traceability), plus a closing line listing the features whose plan was "nothing required". Lead with the items that need a real device or the deployed preview so I can batch them. This is a convenience view only — each PR still carries its own self-contained copy.
- The completed features are now **checked off in `$ARGUMENTS`** (unfinished or blocked ones left unmarked). That edit is an **uncommitted change in the base working tree** — commit or revert it as you prefer; it's separate from the per-feature branches.
- **Ask before removing worktrees.** On my OK: `git worktree remove <path>` each (`-f` if dirty), then `git worktree prune`. Leave branches and PRs intact.

Stop and ask if a feature's preconditions fail, a pipeline loop won't converge, or a PR can't be created — surface it, don't paper over it.
