---
name: nextjs-app-router-conventions
description: How this static Next.js 16 App Router site is structured — Server Components by default, where "use client" is allowed, metadata rules, keeping every route prerendered as static, next/image usage, Next 16 defaults and breaking changes, and the React 19 idioms this codebase uses. Use for any change under app/** or next.config.mjs, or any routing, metadata, or image question.
when_to_use: Any change under `app/**` or `next.config.mjs`, and any routing, metadata, image, or Next-configuration question. This skill owns RSC boundaries, metadata, routing, images, and Next 16 defaults; hydration mismatch diagnosis and the nondeterministic-render rules live in `hydration-safety`.
---

# App Router conventions (Next 16, static site)

**Primary source for any Next API question: `node_modules/next/dist/docs/`** — the installed version ships its own documentation there (since Next 16.2). Read that copy before the web docs and before your memory. Versions below are a snapshot as of 2026-09-17 — re-verify (`verify-at-use-time`).

Installed at that snapshot: **Next 16.2.3**, React/React-DOM **19.2.5**; upstream **Next 16.3.5** / React **19.3.0**. Everything under `app/` — routes, `app/ui/`, `app/ui/resume/`, `app/context/`, `app/lib/`.

## Server/client boundary

- **Server Components by default.** A file gets `"use client"` only when it needs state, effects, browser APIs, or event handlers.
- **`"use client"` goes on leaf components under `app/ui` only.** Never on a `page.tsx` or `layout.tsx` — a client page cannot export `metadata`, and it drags its whole subtree into the client bundle.
- Push the boundary **down**: a server page renders a server shell and imports the small interactive leaf.
- **No Node globals or modules in client code** — no `Buffer`, `globalThis.Buffer`, `process.env`, `require`. Use `Uint8Array`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, and WebCrypto. (See `hydration-safety` for why `globalThis.Buffer` is a browser-only landmine, and `client-crypto` for the crypto replacements.)
- Context providers wrap `children` as deep as possible, not at the root, so the server tree above them stays server-rendered.

## Every route stays `○ (Static)`

This site is fully prerendered and has no server code. The gate asserts it from the build output (`quality-gate`).

Things that turn a route dynamic — none of them may be introduced without an explicit ⏸ human decision:

- `cookies()`, `headers()`, `connection()`
- a **nonce-based CSP** (rejected for this site — see `web-security`)
- a `proxy.ts` (the Next 16 replacement for `middleware.ts`)
- `export const dynamic = 'force-dynamic'` (or an equivalent route segment config)

If a build shows `ƒ` on any route, find which of the above was introduced; do not "fix" the assertion.

## Metadata

- Root `layout.tsx` exports `metadata` with **`metadataBase`** (required as soon as any metadata field uses a relative URL — otherwise the build errors), `title` as an object with **both `template` and `default`** (they are required together), `description`, and `openGraph`.
- **`openGraph` shallow-merges**: a child route's `openGraph` object *replaces* the parent's rather than merging field by field. Restate the fields you still want.
- Every route exports its own `title` (the root `template` wraps it).
- Site-level metadata files live at `app/sitemap.ts`, `app/robots.ts`, and `app/opengraph-image.*` — all static/cached by default, so they do not threaten the `○` assertion.
- A `"use client"` page silently loses `metadata` entirely. This is the most common cause of "my title didn't change".

## Images (`next/image`)

- **`sizes` is required on every `fill` image** — without it the browser downloads the largest candidate.
- Remote images go through `images.remotePatterns`; `images.domains` is deprecated. Query strings need `localPatterns.search`.
- Next 16 defaults worth knowing: `qualities` defaults to `[75]`, `minimumCacheTTL` to 14400, and `imageSizes` no longer includes 16.
- Filenames in `public/` are **kebab-case, no spaces**. Source images must be ≤ 8192px. GIF/SVG are served as-is, not optimized.
- Transformation and cache quotas are a hosting concern — see `vercel-deploy`.

## Next 16 defaults and breaking changes (snapshot 2026-09-17 — re-verify in the installed docs)

- **Turbopack is the default** for `next dev` and `next build` (`--webpack` opts out). A custom `webpack()` function in `next.config.mjs` **breaks the build**; Turbopack config is the top-level `turbopack` key.
- **`middleware.ts` → `proxy.ts`** (Node.js runtime only). We have neither, and adding one makes routes dynamic.
- **`next lint` is removed** and the `eslint` key in `next.config.mjs` is gone — ESLint is invoked directly (`code-quality`). The codemod is `next-lint-to-eslint-cli`.
- **`cacheComponents`** is an opt-in top-level key — **do not enable it** on this site.
- **`reactCompiler`** is stable and off by default; enabling it is a dedicated, separately reviewed PR.
- Async request APIs only; the build output no longer prints bundle-size/First Load JS columns; `next dev` writes to `.next/dev`.
- `typedRoutes: true` is a stable top-level key.
- `experimental.turbopackFileSystemCacheForBuild` defaults to **false on 16.2.3** and **true from 16.3.0** — check the installed version before reasoning about build caching.
- Upgrades run through `npx @next/codemod@canary upgrade latest` **in their own PR** (`modernization-roadmap`).

## React 19 idioms used here

- `createContext<T | null>(null)` plus a guard hook that throws outside the provider — never a silently-undefined context.
- `<Ctx value={…}>` in new code (`.Provider` still works and is not deprecated, but prefer the short form).
- Effects must be **idempotent** — Strict Mode double-invokes them in development. Clean up with `AbortController` for anything fetch-like.
- Stable, meaningful `key`s — never an array index for reorderable lists.
- `useEffectEvent` for logic that must read the latest props/state without becoming a dependency.
- `use(browser())` needs the react-dom vendored by Next 16.3 — it is **not** available on 16.2.3. Tie any use of it to that upgrade PR.

## Node version

**`engines.node` is the deployment platform's source of truth — `.nvmrc` is not read by the host.** Keep `.nvmrc` for local/CI (`setup-node` reads it) and `engines.node: "24.x"` for the host, and keep them consistent. The local patch floor is **≥ 24.15.0** because jsdom 30 requires it.

## Bundle analysis

`npx next experimental-analyze --output` — `--output` / `-o` is a **boolean** flag; it writes to `.next/diagnostics/analyze` and is Turbopack-only. Run it before and after a UI dependency change. `optimizePackageImports` already covers the icon and UI packages by default; verify against the installed docs before adding entries.

## Sibling skills
- `hydration-safety` — nondeterministic render, mismatch diagnosis, the client-code Node-globals trap.
- `styling-mui-tailwind` — how components under `app/ui` are styled, and the UI upgrade order.
- `verify-at-use-time` — the procedure behind "read the installed docs".
- `quality-gate` — where the `○` assertion actually runs.
