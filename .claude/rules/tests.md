---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "e2e/**"
  - "vitest.config.mts"
  - "playwright.config.ts"
---

# Test rules

- **Vitest 5 gotchas**: `vi.mock`/`vi.hoisted` are **top-level only** (they throw inside a function, `describe`, or `test` — `vi.doMock` is the exception); `clearMocks` defaults to `true`; `.resolves`/`.rejects` must be awaited; `test.sequential` is gone (`{ concurrent: false }`).
- The **jest-dom matcher-type shim** (a local ambient `.d.ts` included by tsconfig) is what keeps `toBeInTheDocument()` and friends type-checking. Do not delete it while the upstream issue is open, and never paper over the types with `as any` or `@ts-expect-error`.
- **Unit tests are colocated** as `app/**/*.test.ts(x)`; DOM tests opt in with `// @vitest-environment jsdom`. Async Server Components cannot be unit-tested — cover them in E2E.
- **E2E specs import `test` and `expect` from `./fixtures`**, never from `@playwright/test` directly — the fixtures file is what fails a test on console errors.
- **One axe scan per route or interactive state**, `new AxeBuilder({ page }).withTags([...]).analyze()`. **Never chain `.options()`** (it overrides the tags). Surface `incomplete` results; exclusions need a reason and an issue link; never disable colour-contrast site-wide.
- New routes are added to the E2E route list in the same PR that creates them.
- E2E runs against the **production build on port 3100**. Never `nice` inside a test config, and **never watch mode in a gate** (`vitest run`, `playwright test`).

Depth: `testing-unit-vitest`, `testing-e2e-playwright`, and `accessibility` (what the findings mean).
