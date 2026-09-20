---
name: typescript
description: TypeScript rules for this repo — why `next typegen && tsc --noEmit` is the required typecheck gate, the tsconfig invariants, the staged 5.4 to 6.0 upgrade path, why TypeScript 7 is blocked, the 6.0 deprecations that must never be added, one-strictness-flag-per-PR, and the type idioms this codebase uses. Use for any TypeScript error, tsconfig change, or TypeScript version move.
when_to_use: Any TypeScript error, `tsconfig.json` change, or TypeScript version move. This skill owns type rules, the typecheck gate, and the TS upgrade constraints; lint rule ownership and the ESLint/Biome configs live in `code-quality`.
---

# TypeScript

Versions as of 2026-09-17 — **re-verify** (`verify-at-use-time`). Installed: TypeScript **5.4.4** (declared `^5`; `tsc --noEmit` passes today), `@types/node` `^24`. Upstream: **6.0.3** is the latest 6.0.x, 5.9.3 closes the 5.x line, and **7.0.2 is GA but blocked here** (below).

## The typecheck gate

```sh
npm run typecheck    # = next typegen && tsc --noEmit
```

**This is required and cannot be replaced by `next build`.** Empirically, `next build`'s TypeScript step **silently skips `*.test.ts(x)` files** — type errors and unresolved imports inside tests still produce a green build. Since the test suite is where a lot of the new code lives, skipping this step means shipping broken types.

- `next typegen` generates `.next/types/routes.d.ts` and repoints `next-env.d.ts`; `next dev` writes its own copy under `.next/dev/types`. **Keep both include globs in `tsconfig.json`** or the generated route types disappear depending on which command ran last.
- `next-env.d.ts` is generated and gitignored — **never edit it**, never commit it.
- The `typecheck` script does not exist in the repo yet (as of 2026-09-17); it lands in the CI/hygiene upgrade step (`modernization-roadmap`).

## tsconfig

- Keep the current values; change one thing at a time.
- Keep `target: ES2017` (Next's own recommendation for this setup).
- Global route types (`PageProps`, `LayoutProps`, `RouteContext`) come from Next's generated types — use them instead of hand-writing page prop shapes.
- Minimum TypeScript for Next 16 is 5.1.0 (5.1.3 for async Server Component typing).
- **One strictness flag per PR**, each with the fixes it forces: `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, then `verbatimModuleSyntax` (Next waives its `isolatedModules` requirement when it is set; caveat: `import { type X } from 'server-only'` inside a client component errors under Turbopack — use a plain `import 'server-only'`). `exactOptionalPropertyTypes` is opt-in only; it is a large, noisy change.
- Custom global declarations live in a separate `.d.ts` (that is also where the jest-dom matcher shim goes — `testing-unit-vitest`).

## Version path: target 6.0.x, and TS 7 is blocked

**Do not upgrade to TypeScript 7.** Three independent blockers, all verified 2026-09-17:

1. On Next **16.2.3**, `next build` type-checks through the TypeScript **JS API**, which TS 7 (the native rewrite) does not provide, and `experimental.useTypeScriptCli` does not exist before Next 16.3. TS 7 therefore cannot work with `next build` at all here.
2. `typescript-eslint` peers TypeScript `>=4.8.4 <6.1.0` and crashes under TS 7, with no announced support (`code-quality`).
3. The Next tsserver plugin does not run under the TS 7 language server.

The staged path, one PR per step:

| Step | What it is | Watch for |
|---|---|---|
| A | Add the `typecheck` script and its CI step **while still on 5.4** | Establishes the gate before changing the compiler. |
| B | **5.4 → 5.9** (bump `@types/node` with it) | The 5.7 generic `Uint8Array<TArrayBuffer>` change and the 5.9 "ArrayBuffer is no longer a supertype of typed arrays/Buffer" break. The hotspot in this repo is the encrypted-content component — write `Uint8Array<ArrayBuffer>` or pass `.buffer` explicitly rather than casting through `any`. |
| C | **5.9 → 6.0** | Review the new defaults (`strict`, `module: esnext`, `target: es2025`, `types: []`, `rootDir`, `noUncheckedSideEffectImports`). `types: []` is safe here — Node and CSS module types still resolve through the triple-slash reference in `next-env.d.ts`. `ignoreDeprecations: "6.0"` is a grace period, not a fix. `stableTypeOrdering` is diagnostic-only and measurably slower. The `ts5to6` codemod only handles `baseUrl`/`rootDir`. |
| D | **Next 16.3.x** | Unblocks the *possibility* of TS 7 later (the local `tsc` CLI path), nothing more. |
| E | TS 7 | **Only** once `typescript-eslint` and the Next plugin support it. Re-check the peer range and the upstream tracking issue before even planning it. |

### 6.0 deprecations — never add these

`target: es5`, `downlevelIteration`, `moduleResolution: node`/`node10`/`classic`, `module: amd`/`umd`/`system`/`none`, `baseUrl`, `outFile`, `esModuleInterop: false`, `allowSyntheticDefaultImports: false`, `alwaysStrict: false`, `module`-keyword namespaces, `asserts`-style import attributes, `no-default-lib` directives.

They are deprecated in 6.0 and **errors in 7.0**. Adding one to silence an error trades a fix for a future hard failure.

## Idioms

- **Function components, never `React.FC`** — it fixes the children type and adds nothing.
- **`import type` for type-only imports** (and type-only specifiers), so bundlers can drop them.
- **Anything parsed or fetched is `unknown` first**, then narrowed with a type guard. Never assert a shape you did not validate.
- **No `any`.** No unjustified non-null `!`. No `@ts-ignore` — if a suppression is truly unavoidable, it is `@ts-expect-error` with a comment and an issue link, and it is a review discussion.
- **Honest wire types** — model what the source can actually return (including `null`/absent), not what you hope it returns.
- Let inference work; annotate exported boundaries.

## Sibling skills
- `testing-unit-vitest` — the jest-dom matcher-type shim that this gate requires, and why.
- `code-quality` — `typescript-eslint` configuration, and the ESLint constraint that ties into the TS 7 block.
- `modernization-roadmap` — where these version steps sit in the overall sequence.
