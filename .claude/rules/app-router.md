---
paths:
  - "app/**"
---

# App Router rules (`app/**`)

- **Server Components by default.** `"use client"` belongs only on leaf components under `app/ui` — **never** on `page.tsx` or `layout.tsx` (a client page loses its `metadata` export).
- **No nondeterminism in render** — no `Math.random()`, `Date`/`Date.now()`, locale formatting, or `window`/`document` in the render path **or in a `useState` initializer**. Fix order: mount-effect two-pass → `dynamic(..., { ssr: false })` → build-time pick. `suppressHydrationWarning` is never a fix.
- **No Node globals in client code** — no `Buffer`, `globalThis.Buffer`, `process.env`, `require`. Use `Uint8Array`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, WebCrypto.
- **No invalid nesting** — no block elements inside `<p>`, no nested interactive elements.
- **`next/image`**: `sizes` is required on every `fill` image; remote hosts go in `images.remotePatterns`; `public/` filenames are kebab-case with no spaces.
- **Every route stays `○ (Static)`.** Nothing that forces dynamic rendering — `cookies()`, `headers()`, `connection()`, a nonce CSP, `proxy.ts`, `dynamic = 'force-dynamic'` — without an explicit human decision.
- **Metadata**: `metadataBase` when any metadata URL is relative; `title.template` and `title.default` together; `openGraph` shallow-merges (a child object replaces the parent's); every route sets its own `title`.
- **Read `node_modules/next/dist/docs/` for any Next API question** — the installed version ships its own docs.

Depth: `nextjs-app-router-conventions` (structure, metadata, routing, images, Next 16 defaults) and `hydration-safety` (mismatch diagnosis and fix order).
