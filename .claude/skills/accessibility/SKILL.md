---
name: accessibility
description: The WCAG 2.2 AA target for this site — the component patterns (real button toggles, disclosure regions, a focus-trapping drawer, landmarks, alt text, focus-visible rings, reduced motion), the manual checklist that automated scanning cannot cover, and the rules for exclusions. Use on any UI or content change and whenever writing or reviewing an interactive component.
when_to_use: Any UI, content, or styling change, and whenever writing or reviewing an interactive component. This skill owns WCAG 2.2 AA patterns and the manual checklist; the mechanics of invoking axe (tags, AxeBuilder, where the scan runs) live in `testing-e2e-playwright`.
---

# Accessibility — WCAG 2.2 AA

**Target: WCAG 2.2 Level AA. Scope: every public route**, including `/encryption-test` (confirm the current public route list before claiming coverage — see `verify-at-use-time`).

Accessibility is a gate here, not a nicety: the automated scan runs in the E2E suite, and the manual checklist below is part of every UI review.

## Patterns this codebase uses

| Need | Pattern |
|---|---|
| Toggle (expand/collapse, open/close) | A real `<button type="button">` with `aria-expanded` and `aria-controls` pointing at the controlled region, plus an accessible name (visible text or `aria-label`). **Never** a `div`/`span` with an `onClick`. |
| Disclosure | Button + **sibling** region (the region is not inside the button). Content nested inside a `<button>` is invalid and unreadable to assistive tech. |
| Side navigation | MUI `Drawer` with `variant="temporary"` — it is a styled `Modal`, so it gives you focus trapping, focus restoration on close, and Escape-to-close for free. Wrap the nav in a `<nav>` landmark. |
| Links | Plain `Link`/`<a>` with real href. **No `onKeyUp` handlers on links** — the browser already activates a link on Enter. |
| Closed off-canvas nav | Must not be focusable. If it is still in the DOM, it is `hidden`/`inert`, not merely translated off-screen. |
| Images that carry meaning (certificates, logos) | Meaningful `alt` text describing the credential. `alt=""` only for genuinely decorative images. |
| Focus indication | Explicit `focus-visible:` ring utilities on every interactive element; never remove the outline without replacing it. |
| Motion | `motion-reduce:transition-none` (and equivalent) on animated affordances. |
| Visually-hidden text | An `sr-only` utility — never `display: none` for text a screen reader should hear. |
| Status messages | A live region (`role="status"` / `aria-live="polite"`) for asynchronous results such as a failed password attempt — not a silently-appearing paragraph. |

The target MUI major exposes a focus-visible theme token; keep focus styling consistent between utility-styled elements and MUI components (`styling-mui-tailwind`).

## The manual checklist (run on every UI/content change)

Automated scanning catches a minority of real accessibility problems. Walk these by hand:

1. **Keyboard path** — can you reach and operate every control with Tab/Shift-Tab/Enter/Space/Escape only? Nothing reachable that shouldn't be; nothing operable only by mouse.
2. **Focus visible and not obscured** — the focus ring is clearly visible on every stop, and no sticky header/drawer/overlay hides the focused element (WCAG 2.2: Focus Not Obscured).
3. **Focus management** — opening a dialog/drawer moves focus into it and traps it; closing returns focus to the trigger; a disclosure leaves focus on its button.
4. **Screen-reader names and roles** — every control announces a meaningful name and the right role. Icon-only buttons need an `aria-label`.
5. **Status messages** are announced without stealing focus.
6. **Colour is never the only signal** — errors, states, and links carry text, shape, or underline as well.
7. **Reflow** — usable at 320px width and at 200% zoom with no horizontal scrolling of content or clipped controls.
8. **Reduced motion** — with `prefers-reduced-motion: reduce`, animations are removed or reduced, not just shortened.
9. **Target size** — interactive targets are at least 24×24 CSS pixels (or have adequate spacing).
10. **Content order** makes sense when CSS is off (the DOM order matches the visual reading order).

A **real screen-reader pass** (VoiceOver/NVDA/Orca) belongs in the PR's User Test Plan — no automated tool substitutes for it.

## What the automated scan cannot tell you

It cannot judge whether alt text is *accurate*, whether the focus order is *logical*, whether an ARIA name is *meaningful*, whether a status message is *timely*, whether the keyboard path is *complete*, or whether the page makes sense to a screen-reader user. A clean scan is a floor, not a pass. It also reports `incomplete` results that a human must resolve — treat them as work, not as noise.

## Exclusions

- An exclusion (a scan exclusion, a disabled rule, a suppressed check) requires **a reason and a tracking issue link in the code**, and it is a review discussion — never a silent edit.
- **Never disable colour-contrast checking site-wide.** If a brand colour genuinely fails, fix the colour or document the specific element with its issue link.
- "It's only the test page" is not a reason — `/encryption-test` is public and in scope.

## Sibling skills
- `testing-e2e-playwright` — how the axe scan is invoked, which routes and interactive states are covered, and how `incomplete` results are surfaced.
- `styling-mui-tailwind` — the component and utility layer these patterns are built from.
