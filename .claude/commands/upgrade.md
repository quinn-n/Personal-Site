---
description: Plan and execute one single-concern modernization step (dependency, toolchain, config, or framework) as its own reviewed PR — never bundled with feature or content work.
argument-hint: <step name | next>
---

Run the modernization step: **$ARGUMENTS** (`next` = whichever step the roadmap says comes next).

**This command refuses to include any feature or content change.** One concern per PR. If product work is needed to unblock the step, stop and say so — it goes through `/feature` or `/fix` in its own PR.

1. **Plan — delegate to `upgrade-planner`.** Its **step 0 is always to re-derive which steps are already done from the repo** (read `package.json` and the lockfile, grep for the dependency, check whether the config file exists, check the current branch with `git rev-parse --abbrev-ref HEAD`). Any list of "current state" is a snapshot; the repo is actively changing, so nothing is assumed. It then picks the step, scopes it to **one** concern, and returns:
   - what changes and what explicitly does **not**;
   - the exact commands and codemods, in order;
   - the new/changed versions with their peer constraints, each as a `[VERIFY]` item;
   - the **rollback**;
   - the risks, including any cascade effects (a styling or layer change can move every computed style on the site);
   - how the step will be verified beyond the gate (e.g. computed-style or screenshot checks after a UI-library or CSS-layer step).
2. **Fact-check** — fan out `fact-checker`s, one per `[VERIFY]` cluster, in a single turn. Every version, peer range, CLI flag, config key, and pinned GitHub Action SHA is confirmed against current sources and the installed tree before it is written anywhere. Known blocked upgrades (**as of 2026-09-17 — re-verify before every attempt**) live in the `modernization-roadmap`, `typescript`, `code-quality`, and `styling-mui-tailwind` skills; if a fact-check refutes one of them, report the change rather than quietly proceeding.
3. ⏸ **GATE — present the scoped plan, the confirmed facts, the rollback, and the verification approach, and wait for my approval before any file changes.** Also ⏸ stop and ask before enabling anything that could make a route dynamic, and before any change that alters the public browser-support floor.
4. **Implement** — one `site-implementer` on the **`tooling-config`** track, scoped to the step's `Owns` files. It runs the codemods, **reviews the codemod output rather than trusting it**, keeps formatting churn in its own commit where the step calls for it, and never touches product code beyond what the step strictly requires. Run heavy commands at low priority locally — `if [ -n "$CI" ]; then npm ci; else nice -n 19 npm ci; fi` — never in CI, never swallowing the exit code, and `nice` is the only wrapper used.
5. **Gate** — run **`/quality-gate`**. Steps the toolchain doesn't support yet are reported as **"not yet bootstrapped → run `/upgrade <step>`"**, not as failures; a step that *is* installed must be green. The build step's static-route assertion must still show every route `○ (Static)`.
6. **Review** — `code-quality-reviewer` in **tooling-PR mode** (single concern, codemod output reviewed, lockfile consistency, no forbidden compiler options, one rule owner per lint rule) plus the surface-specific reviewers: `nextjs-reviewer` for anything touching `app/**`, `next.config.mjs`, routing, or metadata; `security-reviewer` for dependency, header/CSP, or secret-adjacent changes; `performance-reviewer` (**advisory only — never blocking**) when UI dependencies, images, fonts, or the client surface move. Loop Must-fix items back to the same implementer with a change log until **APPROVED** (cap ~3 rounds, then ⏸ escalate to me).
7. **Verify the tester coverage that the gate can't express** — `unit-tester` and `e2e-a11y-tester` on the post-upgrade build; after a UI-library, Tailwind, or CSS-layer step also check computed styles / screenshots on the components the step can move, and say plainly what wasn't checked.
8. **PR** — verify PR tooling at use-time (`gh --version`, `gh auth status`, `git remote get-url origin`; fall back to pushing the branch and printing the compare URL). Open the PR **labeled as a tooling PR**, titled with the step, and state in the body: the single concern, the commands/codemods run, the versions before → after, the rollback, and the gate + verdict results. **The studio never deploys** — the preview comes from the repo's Git integration.
9. **Close with a `## User Test Plan`**, in the same five-part shape `/feature` specifies (fresh-checkout "Get it running" in the PR body, ≤ ~5 numbered `do X → expect Y` items, "Already verified — don't redo", explicit empty case, no credentials or private URLs). For tooling steps the genuinely-human items are usually **visual/cascade regression checks** on the affected components, the **Vercel preview** rendering correctly on a real device, and — after a browser-support-floor change — confirming the floor is acceptable to you.

**Done = a green `/quality-gate` AND the review board APPROVED**, and the PR contains exactly one concern.
