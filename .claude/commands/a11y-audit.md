---
description: Audit accessibility — automated axe scans over routes and interactive states plus a manual WCAG 2.2 AA review — and produce a prioritized findings report. Audits, never fixes.
argument-hint: "[route ...] (default: every public route)"
---

Audit the accessibility of: **$ARGUMENTS** (default: **every public route** — derive the list from the app's route tree and the E2E route list at use-time; never work from a remembered list of pages).

**Read-only. No ⏸ gate, and this command does not fix anything and does not run `/quality-gate`** — it changes nothing. Hand its findings to `/feature` (planned work) or `/fix` (defects).

1. **Derive the scope.** Read the routes that actually exist on the current branch (`git rev-parse --abbrev-ref HEAD`, then the `app/` tree) and the E2E route list if it exists. If the Playwright/axe harness isn't installed yet, report **"not yet bootstrapped → run `/upgrade <step>`"** and continue with the manual review only, saying clearly that the automated half was skipped.
2. **Automated pass — `e2e-a11y-tester`.** Against the **production build** on port 3100 (or a deployed preview via the base-URL override), one tag-based axe scan per route **and per interactive state** — sidenav/drawer open, disclosures expanded, error states shown. It must report `violations` **and** surface `incomplete` results (axe couldn't decide — a human must), plus console errors and failed image loads. Run at low priority locally: `if [ -n "$CI" ]; then npm run test:e2e; else nice -n 19 npm run test:e2e; fi`.
3. **Manual pass — `a11y-ux-reviewer`**, in parallel, against the WCAG 2.2 AA checklist axe cannot reach: full keyboard path and tab order, focus visible and not obscured, focus management and restoration (drawer/disclosure open and close, Esc), accessible names and roles, status messages announced, information not conveyed by color alone, reflow at 320px and 200% zoom, reduced-motion behavior, target size 24×24, and whether landmark structure actually makes sense to a screen-reader user.
4. **Consolidate into one prioritized report:**
   - **Must fix** (a WCAG 2.2 AA failure), **Should fix**, **Nit** — each with route + interactive state, element (selector or file:line), the rule or success criterion, why it fails, and a concrete suggested fix.
   - A separate **needs a human** list: axe `incomplete` results and anything only a real screen-reader pass or a real device can settle.
   - A coverage note: which routes and states were scanned, and which were not and why.
5. **Never silence a finding to clean the report.** An axe exclusion needs a stated reason and an issue link; **never disable the color-contrast rule site-wide**. Automated scanning catches a minority of real accessibility problems — say so in the report so the manual list isn't mistaken for optional.

Close by naming the follow-up route for each Must-fix item: `/fix` for isolated defects, `/feature` for anything that needs a spec and a plan.
