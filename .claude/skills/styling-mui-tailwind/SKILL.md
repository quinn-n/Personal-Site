---
name: styling-mui-tailwind
description: The styling model for this site — Tailwind utilities plus MUI components, the CSS cascade/layer end-state, how to style MUI (className + slotProps, sx only for internals), Heroicons as the icon default, the custom-utility cleanup list, the Tailwind 3→4 migration notes, and the ordered UI upgrade sequence with its browser-floor decision. Use for any change to globals.css, tailwind.config.ts, MUI usage, or icons.
when_to_use: Any change to `app/globals.css`, `tailwind.config.ts`, `postcss.config.*`, MUI component usage, or icons. This skill owns the cascade/layer model, the UI library versions and browser floor, and the UI upgrade order; accessible markup and interaction patterns for those components live in `accessibility`.
---

# Styling: Tailwind + MUI

Two systems share one cascade. The rules below exist so they stop fighting.

Snapshot as of 2026-09-17 — **re-verify** (`verify-at-use-time`). Installed: Tailwind **3.4.3** + postcss/autoprefixer, MUI `@mui/material` **5.18.0** + Emotion 11.11 (used for `Button` and `Backdrop`), `@heroicons/react` **2.1.3**, **no** `AppRouterCacheProvider`. Upstream: Tailwind **4.3.3**, MUI **9.4.0** (v9 stable; there is no v8) and **7.3.11** on the v7 LTS line, Emotion **11.14.0**, Heroicons **2.2.0**.

## How to style

1. **Tailwind utilities are the default** for layout, spacing, colour, typography — on your own elements and on MUI components.
2. **Style MUI through `className` and `slotProps.{slot}.className`.** Reach for `sx` only when the thing you need to reach is a MUI internal that has no slot.
   ```tsx
   <Button className="rounded-lg px-4" slotProps={{ startIcon: { className: "size-5" } }}>Download</Button>
   ```
3. **Icons: Heroicons is the default** — `import { ChevronDownIcon } from "@heroicons/react/24/outline"`. They are plain forwardRef SVG components and are safe in Server Components. `@mui/icons-material` requires a documented reason in the PR (and its version must match the `@mui/material` major).
4. **Emotion only through MUI.** Do not add Emotion as a direct styling API; MUI owns that dependency.
5. **Pigment CSS is not adopted** (upstream describes it as alpha/on hold).
6. MUI modules ship `'use client'`, so importing one turns that leaf into a client component — keep MUI usage in leaves under `app/ui` (`nextjs-app-router-conventions`).

## The cascade / layer end-state

Reached at the end of the UI upgrade sequence (Tailwind 4 + `enableCssLayer` land **together**):

```css
/* app/globals.css — the layer declaration must be the FIRST line in the file */
@layer theme, base, mui, components, utilities;
@import "tailwindcss";
```

```tsx
// app/layout.tsx
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

<AppRouterCacheProvider options={{ enableCssLayer: true }}>{children}</AppRouterCacheProvider>
```

`options` are Emotion cache options (including `key`) plus `enableCssLayer`.

**Unlayered CSS beats every layer.** That is the whole reason this works — and the whole reason for the rule: **no unlayered global rules**. The current `globals.css` has an unlayered `body {}` block; it moves into `@layer base` (or becomes classes on `<body>`) as part of the Tailwind 4 step.

**Never name a custom utility after a core utility.** Collision behaviour is undocumented, and the current config shadows real utilities today. Pick a distinct name.

## Cleanup list (current custom CSS)

| Item | Action |
|---|---|
| `.justify-between` (custom, shadows the core utility) | delete — use the core utility |
| `.border-box` | delete — use `box-border` |
| `.text-balance` (duplicated in `globals.css`) | delete — use the core utility |
| dead `theme.extend.utilities` block | delete |
| dead `./pages` / `./components` content globs | delete |
| `w-fill` in the sidenav (not a real class) | fix to a real utility |
| `.link-text` (inline plugin) | port to `@utility link-text { … }` under Tailwind 4 |
| unlayered `body {}` in `globals.css` | move into `@layer base` |

## Tailwind 3 → 4 notes

- Install `tailwindcss` + `@tailwindcss/postcss` + `postcss`; **remove autoprefixer**.
  ```js
  // postcss.config.mjs
  export default { plugins: { "@tailwindcss/postcss": {} } };
  ```
- CSS entry becomes `@import "tailwindcss";` (no `@tailwind` directives).
- `npx @tailwindcss/upgrade` runs the migration (needs Node 20+); review every hunk.
- **JS config is no longer auto-detected.** `@config` exists for back-compat, but `corePlugins`, `safelist`, and `separator` are unsupported — move to CSS-first `@theme`, `@utility name { … }`, and `@source` / `@source not` / `source(none)` / `@source inline()`.
- Renames and behaviour changes that touch this site: `flex-grow` → `grow`, `shadow-sm` → `shadow-xs` (the whole shadow scale shifts), `outline-none` → `outline-hidden`, `ring` is 1px (was 3px), `!` moves to the end (`flex!`), arbitrary CSS variables are `bg-(--x)`.
- **Preflight no longer sets `cursor: pointer` on buttons.** If you want it back:
  ```css
  @layer base { button:not(:disabled), [role='button']:not(:disabled) { cursor: pointer; } }
  ```
- `hover:` is gated behind `@media (hover: hover)` — hover-only affordances are invisible on touch. Pair them with a focus/active state.
- Tailwind 4's own browser floor (Safari 16.4 / Chrome 111 / Firefox 128) is below the MUI floor chosen here, so MUI sets the effective floor.
- `@tailwindcss/webpack` is webpack-only (it requires `--webpack`) — not usable here, since Turbopack is the default builder.
- While the repo is still on Tailwind 3, `app/globals.css` stays excluded from Biome (the `@tailwind` directives trip its unknown-at-rule lint) — see `code-quality`.

## The UI upgrade order (one PR per step, in this order)

The cascade and the component API both change; doing them together makes a regression impossible to attribute.

1. **Drop Ionic → Heroicons.** *Branch-scoped:* `@ionic/react` is **not** present on `master`; it is present on the in-flight feature branch, where `IonIcon` chevrons are used in an expandable-content component. When that branch's work is the base, replace those icons with Heroicons and remove the dependency. Re-derive the actual state from the current branch before planning (`modernization-roadmap` step 0).
2. **MUI 5 → the target major**, adding `AppRouterCacheProvider` from `@mui/material-nextjs/v16-appRouter` **without** `enableCssLayer`.
3. **Tailwind 3 → 4 + the layer order + `enableCssLayer: true`, together.** Then verify computed styles on a `Button` and the `Drawer` — layer interaction is exactly the kind of thing that cannot be reasoned about reliably.

After steps 2 and 3, verify with **screenshots and computed-style Playwright assertions**, and put the visual check in the PR's User Test Plan — an automated diff cannot judge intent.

## MUI major: target and browser floor

**Target for this project: MUI v9** (`@mui/material` 9.4.0 as of 2026-09-17 — re-verify).

| Option | Browser floor | Notes |
|---|---|---|
| **v9 (chosen)** | Chrome 117 · Edge 121 · Firefox 121 · Safari 17.0 | Current major; `@mui/icons-material` must match the major. |
| v7.3.x LTS (documented alternative) | Chrome 109 · Edge 121 · Firefox 115 · Safari 15.4 | Only reason to pick it: a hard requirement to support older Safari/Firefox. Switching means re-pinning versions and rerunning the codemods; the `@mui/material-nextjs/v16-appRouter` import specifier is identical on both lines, so nothing else changes. |

**These floor numbers live only here.** Other skills refer to "the target major (see `styling-mui-tailwind`)" rather than restating versions.

**MUI 5 is unsupported on Next 16.** `@mui/material-nextjs@5.x` peers `next ^13 || ^14 || ^15` and has **no `v16-appRouter`** entry point; the `v15-appRouter` path breaks on Next 16. `v16-appRouter` first appears in `@mui/material-nextjs@7.3.5` and is present in 9.4.0 (peers `next ^13`–`^16`). Moving off MUI 5 is therefore a prerequisite for a supported integration, not a nice-to-have.

### v9 changes that touch this site

- **`Button`**: Enter/Space activations now bubble as a `MouseEvent`; the `nativeButton` prop controls the underlying element.
- **`Backdrop`** is no longer `aria-hidden` by default.
- **`disableEscapeKeyDown` is removed** — handle it in `onClose(event, reason)`.
- `TransitionComponent` / `TransitionProps` → `slots.transition` / `slotProps.transition`; `components` → `slots`.
- **System props are removed** — codemod: `npx @mui/codemod@latest v9.0.0/system-props <path>`. Review the codemod's diff; never commit it unread.
- Path imports are one level deep (`@mui/material/Button`). Deeper imports changed in v7 — check the package's `exports` map for the installed major before deep-importing.

## Sibling skills
- `accessibility` — the accessible patterns these components must implement (Drawer focus trap, disclosure buttons, focus-visible rings, reduced motion).
- `modernization-roadmap` — where these upgrade steps sit in the overall sequence, and the re-derive-first rule.
- `nextjs-app-router-conventions` — why MUI usage stays in client leaves.
- `verify-at-use-time` — re-check every version and floor above before acting on it.
