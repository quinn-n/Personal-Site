---
description: Run the review board in parallel over the current diff (or a named scope) and consolidate the verdicts into one prioritized list. Reviews only — never fixes.
argument-hint: "[--scope diff | <paths or area to review>]"
---

Review: **$ARGUMENTS** (default: the current diff — `git diff HEAD` plus staged and untracked changes).

**Read-only. No ⏸ gate, no code changes, and this command does not run `/quality-gate`** — it changes nothing, so there is nothing to re-gate. Hand its Must-fix items to `/fix`, `/implement`, or `/upgrade`.

1. **Determine the scope and the touched surfaces** — `git status`, `git diff --name-only HEAD`, plus untracked files. Re-read the changed files; never review from memory.
2. **Fan out the board in parallel** (a single turn, multiple Task calls). Always:
   - `nextjs-reviewer` — RSC/client boundary, hydration-unsafe patterns, metadata, `next/image`, `next.config.mjs`, and **every route still `○ (Static)`**.
   - `code-quality-reviewer` — TS/React idioms, Biome-vs-ESLint rule ownership and orphan suppressions, script/config hygiene.
   - `a11y-ux-reviewer` — WCAG 2.2 AA by hand where axe can't reach: semantics, accessible names, focus order/visibility/management, keyboard paths, status messages, reflow, reduced motion, target size.

   Add, by touched surface:

   | touched | add |
   |---|---|
   | `app/lib/crypto/**`, the encrypted-content UI, the build-time encryption script, `public/encrypted-content/**`, headers/CSP, `package.json` dependencies, anything env/secret-adjacent | `security-reviewer` |
   | UI dependencies, images, fonts, client-component surface, bundle-affecting changes | `performance-reviewer` — **advisory only: Should-fix/Nit, never Must-fix, never blocks** |
   | `.github/**`, `package.json` scripts, `biome.json`, `eslint.config.mjs`, `tsconfig.json`, `.pre-commit-config.yaml` | `code-quality-reviewer` in **tooling-PR mode** (single concern, codemod output reviewed, lockfile consistency) |

3. **Consolidate** into one prioritized list — **Must fix**, **Should fix**, **Nits** — each with file:line, a concrete fix, and which reviewer flagged it. Note where two reviewers disagree rather than picking a winner. Finish with the overall state: **APPROVED** only if every non-advisory reviewer returned `VERDICT: APPROVED`; otherwise **CHANGES REQUESTED** with the blocking items listed first.
4. **Do not change code.** If I ask for the fixes, route them: defects → `/fix`, planned work → `/implement`, tooling/dependency items → `/upgrade`.

Remember: **"done" = a green `/quality-gate` AND this board APPROVED.** This command covers the second half only.
