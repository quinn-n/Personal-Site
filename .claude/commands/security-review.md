---
description: Run the security review — the crypto/headers/supply-chain/secret-hygiene checklist, npm audit, the install-script check, and a secret scan — over the current diff or a named scope.
argument-hint: "[--scope diff | <paths or area to review>]"
---

Security-review: **$ARGUMENTS** (default: the current diff — `git diff HEAD` plus staged and untracked changes).

**Read-only. No ⏸ gate and no `/quality-gate` run** — this command changes nothing. Run it **before any commit** touching crypto, headers/CSP, dependencies, environment variables, or anything secret-adjacent.

## 0. Read the project flag first — at use-time, not from memory

Read **`Encrypted content holds real secrets`** from **CLAUDE.md → Project specifics** in this repo, right now, and state the value you found in the report:

- **`yes` → the crypto checklist items (1–7 below) are BLOCKING Must-fix.** Any failure is `VERDICT: CHANGES REQUESTED`; the work does not ship until it's fixed. The User Test Plan for such work also requires confirming the content is protected by a **generated high-entropy passphrase** — password entropy is the ceiling, and published ciphertext is forever.
- **`no` → the crypto items are advisory Should-fix**, still reported in full, but not blocking.
- If the line is missing or still a placeholder, **stop and ask me** rather than guessing; do not default silently.

Items 8–12 are Must-fix regardless of the flag.

## 1. Delegate to `security-reviewer` against the full checklist

1. No JavaScript crypto libraries and no `Math.random` for an IV, salt, or key.
2. Encrypted-blob invariants: declared version, a **fresh random IV per blob** of the exact required length, salt at or above the minimum length, KDF iterations at or above the floor, **no verifier field** (a verifier is an offline oracle).
3. Derived keys **non-extractable**, decrypt-only usage; no raw keys, passwords, or plaintext in React state, storage, URLs, or logs.
4. Uniform failure handling (a wrong password is an authentication-tag rejection, nothing more informative) and a `crypto.subtle` feature detection with the secure-context caveat.
5. No crypto during render — effects and event handlers only; **no Node globals or modules in client code** (`Buffer`, `globalThis.Buffer`, `process.env`, `require`).
6. Decrypted content rendered as **text**; anything rendered as HTML is sanitized.
7. Plaintext sources and env files stay gitignored, and the secret scan is clean.
8. Security headers present and **defined in one place only**; no nonce-based CSP and no proxy layer unless explicitly decided (both would make routes dynamic); no production `'unsafe-eval'`; **every route still `○ (Static)`**.
9. `target="_blank"` links carry `rel="noopener noreferrer"`; no `javascript:` or user-controlled `href`; no `dangerouslySetInnerHTML` without sanitization.
10. Supply chain: `npm ci` (never `npm install`) in CI and in fresh checkouts; `npm audit --audit-level=high`; `npm audit signatures`; **check `npm -v` before asserting anything about install-script blocking** — the behavior depends on the npm major actually in use, so verify it rather than assuming — and review which packages run install scripts; every new dependency justified (what it does, why nothing already present does it, its maintenance state).
11. Round-trip and tamper tests exist and pass for any crypto change (tampered ciphertext, tampered tag, wrong password, malformed blob).
12. No `NEXT_PUBLIC_*` secret of any kind (those values are inlined into the client bundle at build time) and no `process.env` access in client files.

## 2. Run the checks

- `npm audit --audit-level=high` and `npm audit signatures`.
- `npm -v`, then the install-script review appropriate to that version.
- **Secret scan** of the changed content: use `gitleaks` if it's installed (`command -v gitleaks`; confirm the subcommand's flags with `--help` before relying on one), otherwise fall back to a pattern grep over the added lines. Report findings as **path + rule name only, values redacted** — never echo a candidate secret into the transcript or a PR body.
- Fan out a `fact-checker` for any version-, flag-, or CVE-specific claim the review rests on, rather than asserting it from memory.

## 3. Report

`VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED`, opening with the flag value you read and the resulting blocking/advisory mapping, then **Must-fix / Should-fix / Nit** with file:line and a concrete fix for each. Route Must-fix items to `/fix` or `/implement`; dependency remediation goes to `/upgrade` as its own PR. **Never weaken a check to clear the review**, and never put a password, token, bypass secret, or private URL in any output — PR bodies are public and the diff secret-scan hook does not scan them.
