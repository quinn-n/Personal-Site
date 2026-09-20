---
name: testing-e2e-playwright
description: End-to-end and accessibility testing for this site with Playwright and @axe-core/playwright — the reference playwright.config.ts (production build on port 3100), the single route list, the auto console-error fixture, the exact axe invocation and its tag set, preview-URL mode, and the CI notes. Use when writing or running E2E specs, running the axe scan, or testing against a deployment preview.
when_to_use: Writing or running Playwright specs, invoking the axe scan, or pointing the suite at a deployment preview. This skill owns the E2E harness and the axe invocation mechanics; the judgement about what is accessible — the WCAG 2.2 AA patterns and the manual checklist — lives in `accessibility`.
---

# E2E + accessibility tests (Playwright + axe)

Versions as of 2026-09-17 — **re-verify** (`verify-at-use-time`): `@playwright/test` **1.63.0**, `@axe-core/playwright` **4.13.0**. As of that date the repo has **no `e2e/` directory and no Playwright config** — everything below is what the E2E-harness `/upgrade` step creates. These snippets are **reference material, not files this studio ships.**

The E2E suite runs against the **production build**, which makes it the only place that sees what users see: real hydration, real minified errors, real CSS layering, real images.

## Reference `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : '50%',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Preview mode only: the protection-bypass headers come from a CI secret, never a committed value.
    ...(process.env.PLAYWRIGHT_BASE_URL && process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { extraHTTPHeaders: {
            'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
            'x-vercel-set-bypass-cookie': 'true',
          } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Skip the local server entirely when testing a deployed URL.
  ...(process.env.PLAYWRIGHT_BASE_URL ? {} : {
    webServer: {
      command: 'npm run build && npm run start -- -p 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  }),
});
```

**Port 3100 is dedicated** so a running `next dev` on 3000 is never mistaken for the build under test. Do not put `nice` in `webServer.command` — the wrapper is invocation-level (`low-priority-execution`).

## The route list — one source of truth

```ts
// e2e/routes.ts
export const ROUTES = [
  '/',
  // …every public route; add here when a route is added, and the axe spec picks it up for free.
] as const;
```

Every new route added by `/new-page` lands here in the same PR.

## The auto console-error fixture

A console error or an uncaught page error is a **test failure**, automatically, in every spec:

```ts
// e2e/fixtures.ts
import { test as base, expect } from '@playwright/test';

// Allowlist entries need a reason and a tracking link, and must match the PRODUCTION (minified)
// text — capture the real string from a real run before adding one.
const ALLOWLIST: RegExp[] = [
  // Example shape — keep empty unless justified:
  // /some minified text/, // <reason> — <issue link>
];

const notAllowlisted = (text: string) => !ALLOWLIST.some((re) => re.test(text));

export const test = base.extend<{ failOnConsoleErrors: void }>({
  failOnConsoleErrors: [async ({ page }, use) => {
    await use();
    const pageErrors = (await page.pageErrors()).map((e) => e.message);
    const consoleErrors = (await page.consoleMessages())
      .filter((m) => m.type() === 'error')
      .map((m) => m.text());
    expect([...pageErrors, ...consoleErrors].filter(notAllowlisted)).toEqual([]);
  }, { auto: true }],
});

export { expect };
```

**Every spec imports `test` and `expect` from `./fixtures`**, never from `@playwright/test` directly — importing the wrong one silently disables the console check. `page.consoleMessages()` / `page.pageErrors()` are available from Playwright 1.56 and retain up to 200 entries; the `filter`/`clear*` variants arrived in 1.59 — confirm against the installed version.

## The axe scan — exactly one per route/state

```ts
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    // Surface `results.incomplete` in the report — it is work to triage, not noise.
  });
}
```

Rules:
- **One scan per route or interactive state.** Multiple scans on the same state waste minutes and produce duplicate findings.
- **Never chain `.options()`** — it overrides `withTags`/`withRules` and silently changes what ran.
- The tag set above is complete: there is **no `wcag22a` tag**. A tag-based run **does** execute `target-size` (it is disabled only for untagged runs).
- Both the named and default `AxeBuilder` exports work; prefer the named one.
- **Interactive states need their own scan**: side navigation open, disclosure expanded, password-error state shown. A closed drawer tests nothing about the open drawer.
- Exclusions and disabled rules need a reason and an issue link; never disable colour-contrast site-wide (`accessibility`).

## Other things the E2E suite owns

- **Images actually load** (`naturalWidth > 0`) — catches quota failures, bad filenames, and broken `remotePatterns`.
- **Response headers** — once security headers ship, assert them here (`web-security`).
- **Crypto in a real browser** — the decrypt flow on `/encryption-test` is the in-browser truth that a jsdom unit test cannot provide (`client-crypto`).
- **Async Server Components**, which cannot be unit-tested at all.

## Preview-URL mode

Set `PLAYWRIGHT_BASE_URL` to a deployment preview to run the same specs against it. Then:
- The local `webServer` is skipped (the config above does this).
- The protection-bypass header comes from a **CI secret only** — never committed, never pasted into a PR body, never printed in a log.
- **Do not commit traces from preview runs** — they capture request headers, including the bypass secret.
- **Do not assert indexability on a preview.** Previews (and outdated production deployments) are served `noindex` by the host; that assertion belongs to the production domain only.

## CI notes

- `npx playwright install --with-deps chromium` before the run (`--only-shell` for a headless-only image).
- **Do not cache the browser binaries** — the cache/versionskew costs more than the download.
- Upload `playwright-report/` and `test-results/` as artifacts `if: failure()`.
- Test artifacts belong in `.gitignore`: `.vitest/`, `coverage/`, `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/` — those entries land with the harness upgrade PR.

## Sibling skills
- `accessibility` — what the findings mean and the manual checklist the scan cannot replace.
- `vercel-deploy` — preview URLs, protection, and what is only true on the production domain.
- `quality-gate` — where `playwright test` sits in the six steps.
- `testing-unit-vitest` — what belongs in-process instead.
