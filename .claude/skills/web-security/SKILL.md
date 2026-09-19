---
name: web-security
description: Security practices for this static site — response headers and CSP in next.config.mjs (Report-Only first, no nonce), environment-variable rules, dependency supply chain (npm ci, audit, install-script checks, new-dep justification), secret scanning with gitleaks and its grep fallback, and link/markup hygiene. Use when changing headers or CSP, adding or upgrading dependencies, touching env vars, or before any commit that is secret-adjacent.
when_to_use: Changing response headers or CSP, adding or upgrading dependencies, touching environment variables, or before any commit that is secret-adjacent. This skill owns headers, supply chain, and secret hygiene; the encryption scheme itself — algorithms, blob schema, key handling — lives in `client-crypto`.
---

# Web security

This site has no server code, no environment variables, and no user input beyond a password box. That removes most classic web vulnerabilities and concentrates the risk in three places: **what the browser is allowed to do (headers)**, **what we install (supply chain)**, and **what we accidentally commit (secrets)**.

**Crypto note:** this project's encrypted content will hold real secrets, so the crypto items in the review checklist are **blocking (Must-fix)**. No real content goes behind encryption until the WebCrypto v2 scheme has shipped and the content is encrypted with a generated high-entropy passphrase; any v1 ciphertext already published is compromised and must be re-encrypted with **new** passwords. Details in `client-crypto`.

## Response headers live in `next.config.mjs`

Headers belong in the framework config: portable, reviewable in the diff, and testable from Playwright. **Never duplicate them in a hosting-platform config file** — the precedence between the two is undocumented, and a duplicated header is a silent, unresolvable conflict.

```js
// next.config.mjs — REFERENCE SNIPPET (lands with the headers/CSP upgrade PR)
const isDev = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
export default {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // Optional, verify no embed breaks: { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        // Report-Only FIRST. Switch the key to 'Content-Security-Policy' only after a clean run.
        { key: 'Content-Security-Policy-Report-Only', value: csp },
      ],
    }];
  },
};
```

Rules:

- **CSP ships Report-Only first.** Watch a real deployment (and the E2E run) for violations, then flip to enforcing in a follow-up commit.
- **`'unsafe-eval'` is development-only.** It must never appear in a production policy.
- **No nonce-based CSP.** A nonce forces per-request rendering, which would turn every route dynamic and break the static-route assertion (`quality-gate`).
- `style-src 'unsafe-inline'` stays as long as the UI library injects runtime `<style>` tags. Subresource-integrity for scripts is an experimental Next option that can remove `script-src 'unsafe-inline'`; it **cannot** cover the runtime style injection. Treat it as an optional, separately-tested PR.
- **HSTS comes from the host** on custom domains; adding `includeSubDomains; preload` is a deliberate, hard-to-reverse decision — never a drive-by header addition.
- Assert the shipped headers in a Playwright spec so a config regression fails the gate.

## Environment variables

- There are none today. Keep it that way unless there is a real need.
- **`NEXT_PUBLIC_*` is inlined into the client bundle at build time — it can never hold a secret.** Anything prefixed that way is published.
- Server-only modules import `server-only` so a wrong import becomes a build error.
- Environment changes apply to **new deployments only**; changing a value does not affect what is already live.
- Absolute URLs in metadata come from `metadataBase` (`nextjs-app-router-conventions`), not from a hand-built origin string; if a platform-provided URL variable is used, confirm the project actually exposes system environment variables (`verify-at-use-time`).

## Supply chain

- **`npm ci` everywhere** — CI, worktrees, and any reproduction. `npm install` mutates the lockfile.
- `npm audit --audit-level=high` (add `--omit=dev` when triaging only what ships) and `npm audit signatures` are part of the security gate.
- **Install scripts: check `npm -v` before asserting anything.** npm 12 blocks dependency install scripts by default, but the Node 24 line has been shipping npm 11.x — on stock Node 24 the blocking is **not** active. Pinning npm is a dedicated PR, not a side effect. The packages in this tree that legitimately run install scripts are the formatter binary, `fsevents`, `sharp`, and the resolver native package — anything else appearing there is a review finding.
- **Every new dependency needs a justification in the PR**: what it does, why the platform/standard library cannot, its maintenance status, and its transitive weight. Single-maintainer packages in a security path are a Must-fix discussion (the broken encryption library is exactly that lesson).
- Automated dependency updates: npm + GitHub Actions ecosystems, weekly, minor/patch grouped, majors as separate PRs. Majors go through `/upgrade`, never auto-merge.

## Secret scanning

The studio's own Stop hook scans the working diff. For deeper scans:

```sh
command -v gitleaks || echo "not installed — the diff hook falls back to grep"
gitleaks git --staged --redact --no-banner     # staged changes
gitleaks dir .                                  # a tree
gitleaks stdin --redact --no-banner             # a piped diff
```

- gitleaks **8.30.1** as of 2026-09-17 (re-verify); **not installed on this machine** as of that date.
- Exit codes: **0** clean, **1** leaks found, **126** unknown flag (that is the signal to fall back).
- `detect` and `protect` are deprecated — use `git` / `dir` / `stdin`. `--pre-commit` is unconfirmed: run `gitleaks git --help` before using any flag.

```toml
# .gitleaks.toml — REFERENCE SNIPPET (ships with the security upgrade PR)
[extend]
useDefault = true

[allowlist]
paths = [
  '''public/encrypted-content/.*''',   # ciphertext by design
  '''package-lock\.json''',
  '''\.gitleaks\.toml''',
  '''app/encryption-test/page\.tsx''', # intentionally public test passwords
]
```

Grep fallback patterns (what the hook looks for on added lines when gitleaks is absent):

```
-----BEGIN [A-Z ]*PRIVATE KEY-----
AKIA[0-9A-Z]{16}
gh[pousr]_[A-Za-z0-9]{36,}
github_pat_[A-Za-z0-9_]{22,}
sk-[A-Za-z0-9_-]{20,}
xox[baprs]-
AIza[0-9A-Za-z_-]{35}
NEXT_PUBLIC_[A-Z_]*(SECRET|TOKEN|KEY|PASSWORD)
(password|passwd|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}
VERCEL_TOKEN=
VERCEL_AUTOMATION_BYPASS_SECRET=
```

Never hand-edit `.env*`, `.vercel/**`, or `content-private/**`; never put a password, token, bypass secret, or private URL in a PR body, a test fixture, or a commit message. A deployment bypass secret belongs in CI secrets only.

## Markup and link hygiene

- Every `target="_blank"` link carries `rel="noopener noreferrer"`.
- No `javascript:` hrefs and no user-controlled `href`/`src`.
- No `dangerouslySetInnerHTML` without a reviewed sanitizer — including for decrypted content.

## The security gate

Runs before any commit touching crypto, headers/CSP, dependencies, environment variables, or anything secret-adjacent. Items 1–7 (the crypto checklist in `client-crypto`) are **blocking**. The remaining items:

8. Headers/CSP present and correct; no nonce, no proxy layer, no production `'unsafe-eval'`; **every route still `○`**.
9. `_blank` links carry `rel="noopener noreferrer"`; no `javascript:`/user-controlled hrefs; no unsanitized HTML injection.
10. Lockfile consistent, `npm ci` used, `npm audit --audit-level=high` and `npm audit signatures` clean (or triaged with a reason), install-script check performed with `npm -v` in hand, every new dependency justified.
11. Round-trip and tamper tests for the crypto path pass in both the unit suite and the browser.
12. No `NEXT_PUBLIC_` secrets and no `process.env` reads in client files.

## Sibling skills
- `client-crypto` — the encryption scheme and checklist items 1–7.
- `vercel-deploy` — platform-sent headers, preview protection, and what is only observable in production.
- `code-quality` — where the lint/CI hygiene rules (pinned actions, minimal workflow permissions) live.
