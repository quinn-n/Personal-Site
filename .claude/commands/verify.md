---
description: Fact-check version, API, config, CLI-flag, or browser-support claims in parallel and return CONFIRMED / REFUTED / UNVERIFIABLE with evidence.
argument-hint: <claim | list of claims | path to a plan's [VERIFY] list>
---

Verify: **$ARGUMENTS**

**Read-only. No ⏸ gate, no code changes, no `/quality-gate`.** Use this before writing any version number, config key, CLI flag, API name, or browser-support claim into code, a config file, a plan, or a PR body.

1. **Collect the claims.** From the argument, or — if it names a plan — from that plan's `[VERIFY]` list. Group them into **disjoint clusters** by source (installed tree / registry / upstream issue tracker / vendor docs / repo state), since each cluster is an independent lookup.
2. **Fan out** — launch **one `fact-checker` per cluster in a single turn** (multiple Task calls), each given only its cluster. Use one checker when there are only a couple of claims.
3. **Each claim is resolved against a real source, in this order of preference:**
   - **Installed code first** — the bundled Next documentation that ships in the installed `next` package under `node_modules` is the primary source for any Next API question, at the version actually installed; `package.json` and the lockfile are the source for what version that is.
   - `npm view <pkg> version` and `npm view <pkg> peerDependencies` for registry facts and peer ranges.
   - `node -v`, `npm -v`, and `<tool> --help` for the local environment and for whether a flag exists **in the installed version** — never quote a flag from memory.
   - The upstream issue or changelog for "is this bug still open / has this been removed" questions.
   - The repo itself (`git rev-parse --abbrev-ref HEAD`, the file tree) for claims about what this project currently contains — files and branches move, so nothing is assumed.
4. **Return one merged report**, one row per claim: **CONFIRMED / REFUTED / UNVERIFIABLE**, the evidence (command run and its output, file path, URL + date), and the corrected value where a claim is refuted.
5. **For every UNVERIFIABLE item, state the at-use-time check to encode instead** of a hardcoded value — the command or file read that the code, skill, or agent should perform when it runs. That is the deliverable, not a best guess.
6. **Nothing dated is permanent.** Any version, flag, or default recorded in this studio is a snapshot from when it was written; re-verify rather than trusting it. See the `verify-at-use-time` skill for the standing list of items that must always be checked rather than remembered.

If a refuted claim invalidates a plan already in flight, say so explicitly and name the step that needs revising (route it back through `/plan`).
