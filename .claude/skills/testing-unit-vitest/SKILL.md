---
name: testing-unit-vitest
description: Unit and component testing for this site with Vitest 5 — the reference vitest.config.mts and setup file, the Vitest 5 breaking changes that bite (top-level vi.mock, clearMocks, awaited .resolves), the jest-dom matcher-type shim the typecheck gate needs, the jsdom opt-in, and what belongs in a unit test versus E2E. Use when writing or debugging Vitest tests or the Vitest configuration.
when_to_use: Writing or debugging Vitest unit/component tests, the Vitest config, or the test setup file. This skill owns Vitest and everything that runs in-process; anything that needs a real browser — rendering a route, the axe scan, console-error checks — lives in `testing-e2e-playwright`.
---

# Unit & component tests (Vitest)

Versions as of 2026-09-17 — **re-verify** (`verify-at-use-time`): vitest **5.0.1** (Node `^22.12 || ^24 || >=26`), vite **8.3.0**, `@vitejs/plugin-react` **6.1.1** (peers Vite 8), `vite-tsconfig-paths` **6.1.1**, `@vitest/coverage-v8` **5.0.1** (peers the **exact** Vitest version — bump the two together), jsdom **30.1.0** (requires Node **≥ 24.15.0**), `@testing-library/react` **16.3.3**, `@testing-library/dom` **10.4.2** (a required peer — install it explicitly), `@testing-library/jest-dom` **7.0.1**, `@testing-library/user-event` **14.6.7**.

As of that date the repo has **no Vitest harness at all** — everything below is what the test-harness `/upgrade` step creates. The snippets here are **reference material, not files this studio ships.**

## Reference `vitest.config.mts`

```ts
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Use vite-tsconfig-paths ONLY. Vite 8's built-in resolve.tsconfigPaths does not apply under
  // Vitest (vitest-dev/vitest#10054, open as of 2026-09-17 — re-check before replacing this).
  plugins: [tsconfigPaths(), react()],
  test: {
    // environment: 'node' is the default; DOM tests opt in per file (see below).
    include: ['app/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'e2e/**', '.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    maxWorkers: process.env.CI ? undefined : '50%',
    coverage: {
      provider: 'v8',
      include: ['app/**'],          // coverage include/exclude are ROOT-relative in Vitest 5
    },
  },
});
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => { cleanup(); });   // globals are off, so cleanup is wired by hand
```

DOM tests opt in per file:

```ts
// @vitest-environment jsdom
```

## Vitest 5 changes that actually bite

- **`clearMocks` defaults to `true`.** Mock call history is cleared between tests; do not rely on accumulation across tests.
- **`vi.mock` and `vi.hoisted` are top-level only.** Calling either inside a `describe`, a `test`, or any function **throws**. (`vi.doMock` is exempt and is the escape hatch for conditional mocking.)
- **Unawaited `.resolves` / `.rejects` fail.** `await expect(p).resolves.toBe(x)` — always await.
- **`test.sequential` / `describe.sequential` are removed** — use `{ concurrent: false }`.
- Reporter output lands in **`.vitest/`** (json/junit write files by default; html is a directory).
- Default `include` is broad and default `exclude` is narrow — that is why the config above sets both explicitly.

## The jest-dom matcher-type shim (required for a green typecheck)

`@testing-library/jest-dom` 7.x matcher **types** do not merge with Vitest 5's matcher interface (`testing-library/jest-dom#738`, open as of 2026-09-17). The matchers work at runtime, but `toBeInTheDocument()` and friends fail `tsc --noEmit` — which means they fail the gate (`quality-gate` step 3). Ship a local ambient declaration, included by `tsconfig.json`:

```ts
// types/jest-dom-vitest.d.ts — REFERENCE SNIPPET, created by the test-harness upgrade PR.
// Workaround for testing-library/jest-dom#738. Re-check the issue at use-time and DELETE this
// file once upstream ships the fix.
//
// Read the installed @testing-library/jest-dom package's `exports` map and its bundled .d.ts to
// confirm (a) the entry point that exports `TestingLibraryMatchers` and (b) the order of that
// type's parameters, before pinning the two lines below. Do not guess them.
import type { TestingLibraryMatchers } from '<entry point from the installed package>';

declare module 'vitest' {
  interface Matchers<R = unknown, T = unknown> extends TestingLibraryMatchers<T, R> {}
}
```

Do not work around the missing types with `as any`, `@ts-expect-error`, or by dropping the matchers.

## What goes where

- **Unit tests are colocated**: `app/**/*.test.ts(x)`. They are never routed by the App Router (test files are not route files) — verified empirically, but keep them out of `page.tsx`-shaped filenames anyway.
- **Async Server Components cannot be unit-tested** — Next's own guidance. Cover them end-to-end instead (`testing-e2e-playwright`).
- **WebCrypto works under the jsdom environment** (PBKDF2 → AES-GCM round trip verified), and also under the default node environment. Crypto tests get round-trip, tamper-detection (a flipped ciphertext byte must reject), and edge cases — see `client-crypto`. Characterization tests against the legacy scheme are acceptable *before* the migration, not after.
- Test behaviour through the public surface (rendered output, exported functions), not internals.

## Scripts

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"typecheck": "next typegen && tsc --noEmit"
```

**Never run watch mode in a gate** — `npm test` must be `vitest run`.

## Sibling skills
- `typescript` — the typecheck gate these tests must satisfy, and why `next build` alone does not catch test-file type errors.
- `quality-gate` — where `vitest run` sits in the six steps.
- `testing-e2e-playwright` — browser-level tests, the axe scan, and the console-error fixture.
- `client-crypto` — what a crypto test must assert.
