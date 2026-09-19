---
description: Scaffold a new static route — Server Component page with its own metadata, leaf client components only where interaction demands, a colocated unit test, the route added to the E2E list, an axe pass, and a green gate.
argument-hint: <route> [purpose]
---

Add a new route: **$ARGUMENTS** (first token = the route path, e.g. `/about`; the rest = its purpose).

The new route must be **static (`○`)** like every other route on this site, and it must be accessible from the moment it lands.

1. **Re-derive the repo state.** `git rev-parse --abbrev-ref HEAD`, `git status`, and read the current `app/` tree — check the route doesn't already exist on this branch, and look at a neighbouring route's page for the conventions actually in use here (never copy from memory). Note whether the Vitest and Playwright harnesses exist; if not, report **"not yet bootstrapped → run `/upgrade <step>`"** and say which of the steps below will be deferred.
2. **Design ⏸** — delegate to `feature-designer` for the page's content, the server-vs-client boundary, a11y acceptance criteria, responsive behavior, and its metadata. Present it. ⏸ **Wait for my approval** — this is where the route's name, purpose, and navigation placement get settled.
3. **Implement** — one `site-implementer` on the **`ui`** track, scoped to the new route's files plus any navigation entry the design calls for:
   - a **Server Component `page.tsx`** with its own per-page `metadata` — `"use client"` never goes on `page.tsx` or `layout.tsx` (it kills `metadata`);
   - **leaf client components only where interaction genuinely demands them**, placed under the UI component directory, with no nondeterministic values in render or in `useState` initializers;
   - images sized correctly (every `fill` image needs `sizes`), links with real semantics, and the accessible names the design specifies;
   - a **colocated Vitest test** for the page's logic/rendering;
   - the route **added to the E2E route list** so every existing route-level spec and the axe scan pick it up automatically.
   - ⏸ **Stop and ask before anything that would make the route dynamic** (`cookies()`, `headers()`, `connection()`, `force-dynamic`). There is no such thing as a "temporarily dynamic" route here.
4. **Cover it** — `test-engineer` adds or strengthens the E2E spec for the new route if the route needs more than the shared route-level coverage (interactive states, error states).
5. **Gate** — run **`/quality-gate`**. The build step's static-route assertion must show the new route as `○ (Static)` — and the assertion fails if the route table is empty or unparseable, so read it, don't skim it. Run heavy commands at low priority locally: `if [ -n "$CI" ]; then npm run build; else nice -n 19 npm run build; fi`.
6. **Test** — `e2e-a11y-tester` runs Playwright + axe against the production build for the new route and its interactive states, reporting violations, `incomplete` results, console errors, and image loads.
7. **Review** — `nextjs-reviewer` (RSC boundary, metadata, image, `○` status, App Router structure) and `a11y-ux-reviewer` (WCAG 2.2 AA by hand) in parallel; each returns `VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED`. Loop Must-fix items back to the same `site-implementer` with a change log until APPROVED (cap ~3 rounds, then ⏸ escalate to me).
8. **Report** the files added, the gate result including the `○` line for the new route, the axe result, and the verdicts. **Done = a green `/quality-gate` AND APPROVED.** If this goes to a PR, close with the `## User Test Plan` section exactly as `/feature` specifies — for a new page the genuinely-human items are usually the content's factual accuracy, how it reads on a real device via the Vercel preview, and a real screen-reader pass.
