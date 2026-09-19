---
name: low-priority-execution
description: How to run this project's compute-heavy commands (next build/dev, playwright test and install, vitest run, next typegen && tsc --noEmit, full eslint ., npm ci, next experimental-analyze, repo-wide biome ci) at lowered OS priority locally with `nice -n 19`, without swallowing exit codes and without ever slowing CI. Use before invoking any long-running or CPU-heavy command.
when_to_use: Before running any compute-heavy local command. This skill owns only the low-priority wrapper convention; what the commands are for and in what order they run belongs to `quality-gate`.
---

# Low-priority execution (`nice -n 19`, Linux, local only)

Heavy local runs should not lag the machine you are working on. Wrap them at the **point of invocation**:

```sh
nice -n 19 <command>
```

That is the whole convention. Everything below is the fine print that keeps it from breaking a gate.

## Rules

1. **`nice -n 19` only.** Not `-n 10`, not anything else. This project targets Linux; there is no macOS/Windows variant in this studio.
2. **Do NOT use `ionice`.** Claude Code cannot prefix-approve exec wrappers like `ionice` — a command starting with `ionice` always prompts, which turns every heavy command into an interruption. `nice`, by contrast, is stripped before permission matching.
3. **No `Bash(nice:*)` permission rule is needed or wanted.** Because `nice` is stripped before matching, an existing rule such as `Bash(npm run build *)` already matches `nice -n 19 npm run build`. Adding `Bash(nice:*)` (or `Bash(ionice:*)`, or `Bash(taskpolicy:*)`) is dead configuration — do not add it to any settings file.
4. **Never swallow the exit code.** `nice` execs the command in place, so the exit status passes through unchanged (empirically 3→3, 1→1, 0→0) and children inherit the niceness. A gate that cannot see a non-zero exit is broken.
5. **Never in CI.** CI has nothing to yield to; lowering priority only makes the run slower. Use the guard form:
   ```sh
   if [ -n "$CI" ]; then npm run build; else nice -n 19 npm run build; fi
   ```
6. **Invocation-level only.** Never bake `nice` into `package.json` scripts, `playwright.config.ts` (including its `webServer.command`), a hook, or a GitHub Actions workflow — CI runs the same scripts, and a wrapper there would violate rule 5. It belongs in the command you type or the command an agent runs.
7. **Never pipe without `set -o pipefail`.** `nice -n 19 npm test | tee log` reports `tee`'s status, not the test suite's.
8. **Single-file work is not wrapped.** The per-edit Biome format in the PostToolUse hook formats one file in milliseconds — wrapping it adds noise for no benefit. Repo-wide `biome ci .` *is* wrapped.
9. **Contention only.** On an idle machine this changes nothing; it is a good-neighbour tool, not a speed knob. If a timing-sensitive Playwright assertion becomes flaky under contention, fix the assertion (or its timeout) — do not silently drop the wrapper.

## The heavy list (wrap these)

`next build` · `next dev` · `playwright test` (it builds and serves the app in its `webServer`) · `playwright install` · `vitest run` · `next typegen` / `tsc --noEmit` · a full `eslint .` · `npm ci` / `npm install` · `next experimental-analyze` · a repo-wide `biome ci .` / `biome check .`.

Light commands (`node -v`, `npm view`, `git status`, a single-file format, reading files) are never wrapped.

## The gate commands, wrapped

```sh
if [ -n "$CI" ]; then npx biome check .;   else nice -n 19 npx biome check .;   fi
if [ -n "$CI" ]; then npx eslint .;        else nice -n 19 npx eslint .;        fi
if [ -n "$CI" ]; then npm run typecheck;   else nice -n 19 npm run typecheck;   fi
if [ -n "$CI" ]; then npm test;            else nice -n 19 npm test;            fi
if [ -n "$CI" ]; then npm run build;       else nice -n 19 npm run build;       fi
if [ -n "$CI" ]; then npm run test:e2e;    else nice -n 19 npm run test:e2e;    fi
```

## Reusable shell helper

For any script you write that shells out to a heavy tool (this studio's hooks share one already):

```sh
# Run a compute-heavy command at low OS priority locally; full speed in CI.
# Preserves the command's exit code. Degrades to a plain run when `nice` is missing.
low_prio() {
  if [ -n "${CI:-}${GITHUB_ACTIONS:-}${GITLAB_CI:-}" ]; then "$@"; return; fi
  if command -v nice >/dev/null 2>&1; then nice -n 19 "$@"; return; fi
  "$@"
}
```

## Sibling skills
- `quality-gate` — the six commands this convention fronts, and the order they run in.
