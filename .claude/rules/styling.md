---
paths:
  - "app/globals.css"
  - "tailwind.config.ts"
  - "postcss.config.*"
  - "app/ui/**"
---

# Styling rules

- **Layer order is declared first.** The `@layer` declaration is the first line of `app/globals.css`, before the framework import.
- **No unlayered global rules.** Unlayered CSS outranks every layer, which silently defeats the ordering. Global styles go in `@layer base` or become classes on the element.
- **Never name a custom utility after a core utility.** Collision behaviour is undocumented; pick a distinct name.
- **Style MUI with `className` and `slotProps.{slot}.className`.** `sx` only for MUI internals that have no slot.
- **Icons: Heroicons** (`@heroicons/react/24/outline`) is the default. MUI icons need a documented reason, and their major must match `@mui/material`.
- **Emotion only through MUI** — not as a direct styling API.
- MUI components ship `'use client'`; keep them in leaf components under `app/ui`.
- Accessible affordances are part of styling: `focus-visible:` rings on every interactive element, `motion-reduce:` variants on animation, and no hover-only affordance without a focus/active equivalent.
- UI upgrades land in order, one PR each: drop Ionic → MUI major (no CSS layer yet) → Tailwind 4 + layer order + `enableCssLayer` together. Verify cascade changes with screenshots and computed-style checks.

Depth: `styling-mui-tailwind` (cascade model, versions, upgrade order) and `accessibility` (the patterns these components must implement).
