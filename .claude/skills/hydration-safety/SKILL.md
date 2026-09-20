---
name: hydration-safety
description: How to avoid, diagnose, and fix hydration mismatches and console errors on this prerendered site — no nondeterminism in render or useState initializers, the fix order (mount-effect two-pass, then ssr:false, then build-time pick), the invalid-nesting traps, and why Node globals break only in the browser. Use when a hydration mismatch or console error is suspected, or when writing a component that reads time, randomness, locale, or window.
when_to_use: When a hydration mismatch, console error, or nondeterministic render is suspected, or when writing any component that reads time, randomness, locale, or `window`. This skill owns mismatch diagnosis and the fix order; general App Router structure, metadata, and routing conventions live in `nextjs-app-router-conventions`.
---

# Hydration safety

This site is **prerendered at build time**. The HTML is frozen when the build runs and is then hydrated in a browser, possibly months later, in another time zone. Anything that can differ between those two moments is a bug.

## The rule

**No nondeterminism in render — and `useState` initializers count as render.**

Banned in a component's render path (including the argument to `useState(...)`, `useMemo`, and module top level of a client component):

- `Math.random()`
- `new Date()`, `Date.now()`, and anything derived from them
- locale/timezone-dependent formatting (`toLocaleString`, `Intl.*` with implicit locale)
- `window`, `document`, `navigator`, `localStorage`, `matchMedia`
- values that depend on the user agent or viewport

Live examples in this repo (verify against the current branch before quoting line numbers — the repo changes): `app/ui/background-image.tsx` and `app/ui/under-construction.tsx` both call `Math.random()` inside a `useState` initializer, producing a different value on the server render than on hydration.

## Fix order (take the first one that fits)

1. **Mount-effect two-pass (default).** Render the deterministic/server-safe output first; compute the nondeterministic value in `useEffect` and set state. The first client paint matches the prerendered HTML, then the component updates.
   ```tsx
   const [pick, setPick] = useState<string | null>(null);   // deterministic on the server
   useEffect(() => { setPick(images[Math.floor(Math.random() * images.length)]); }, []);
   ```
   Give the first pass a real, non-jarring appearance (a fixed default, not a layout-shifting blank).
2. **Client-only component** — `dynamic(() => import('./thing'), { ssr: false })` — when the component genuinely cannot render on the server at all. Costs you the prerendered markup for that subtree; use it deliberately.
3. **Build-time pick** — choose the value once, at build time, on the server, and pass it down as a prop. Legitimate on a static site when "random per build" is acceptable (it is frozen until the next deploy — say so in the PR).

**`suppressHydrationWarning` is never a fix.** It hides the symptom and leaves the DOM divergent. The only acceptable use is a deliberately-server-differing leaf such as a timestamp node, and even then it needs a comment explaining why, plus review sign-off.

**`useSyncExternalStore`** is the right tool only for genuinely subscribable browser state (media queries, online status, storage events) — not as a hydration workaround.

## Other mismatch sources

- **Invalid nesting.** The browser re-parents invalid HTML, so the client DOM stops matching the server HTML. Never put block-level content inside `<p>`; never nest interactive elements (a `<button>` inside a `<button>`, an `<a>` inside an `<a>`). A `<p>`-nesting defect of this kind exists on an in-flight feature branch of this repo — check the branch you are on.
- **Node globals in client code.** Both bundlers rewrite the **bare identifier** `Buffer` to a vendored polyfill at build time, so `Buffer.from(...)` appears to work — but **`globalThis.Buffer` / `window.Buffer` is not shimmed** and is `undefined` in the browser. The result is code that passes a build and explodes at runtime, or behaves differently between server and client. Use `Uint8Array`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, and WebCrypto instead (see `client-crypto`).
- **Browser extensions** mutating the DOM before hydration — real, but never the first hypothesis; reproduce in a clean profile before blaming one.

## Diagnosing a reported mismatch

1. **Reproduce against the production build**, not `next dev`: `npm run build` then `npm run start -- -p 3100`. The dev overlay is friendlier, but production is the truth.
2. Read the error. In **development** the overlay shows a diff (its `data-nextjs-hydration-diff-*` attributes are internal and unversioned — never assert on them in a test). In **production** React's hydration errors are **minified**; capture the actual string before you write anything that depends on its text (for instance an allowlist entry in the E2E console-error fixture — see `testing-e2e-playwright` and `verify-at-use-time`).
3. Bisect by boundary: which client component's subtree diverges? Server components cannot mismatch by themselves — the nondeterminism is always in a client leaf or in invalid markup.
4. **Write the failing test first** (a Playwright spec that asserts a clean console, or a Vitest component test for a pure-logic cause), then fix, then prove the test goes green.
5. A console error in the E2E run is a **gate failure**, not noise. The auto console-error fixture exists so these cannot be ignored.

## Sibling skills
- `nextjs-app-router-conventions` — where `"use client"` is allowed, and what keeps routes static.
- `testing-e2e-playwright` — the auto console-error fixture that catches these in CI, and the allowlist discipline.
- `client-crypto` — the browser-safe replacements for Node crypto/buffer APIs.
