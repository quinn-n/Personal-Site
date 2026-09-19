---
name: client-crypto
description: The password-protected content scheme for this site — why the current scheme is broken, the WebCrypto v2 design (PBKDF2-HMAC-SHA256 600k, AES-256-GCM, fresh 12-byte IV, no verifier), the v2 blob schema and reader rejection rules, the build-time encryption script, the hard-cut migration plan, and the blocking review checklist. Use for any change to the crypto module, the encrypted-content component, the encryption script, or the encrypted content files.
when_to_use: Any change under `app/lib/crypto/**`, `app/ui/encrypted-content.tsx`, `scripts/encrypt-content.*`, `public/encrypted-content/**`, or `content-private/**`. This skill owns the encryption scheme, its schema, and its migration; headers/CSP, dependency supply chain, and secret hygiene live in `web-security`.
---

# Client-side crypto (password-protected content)

**This project's encrypted content will hold real secrets. The checklist at the bottom is BLOCKING: every item is a Must-fix, and a review with an open item is `VERDICT: CHANGES REQUESTED`.**

Two consequences that are not negotiable:

1. **No real content may be published behind encryption until the WebCrypto v2 scheme below has shipped and the content is encrypted with a *generated high-entropy passphrase*.** Until then, only public test fixtures may be encrypted.
2. **Any v1 ciphertext that has already been published must be treated as compromised.** It was produced by the broken scheme below, and public ciphertext is public forever. Re-encrypt that content under v2 with **new** passwords — re-encrypting with the same password does not undo the exposure.

## Why the current scheme is broken

The existing implementation (a third-party single-maintainer library, `encryption-for-node`) fails on every axis:

- **No key derivation and no salt** — the password is padded to 32 bytes and used as the raw key. Passwords longer than 32 bytes or containing non-ASCII throw.
- **AES-CBC without authentication** — ciphertext can be tampered with undetectably.
- **A single IV is reused** for the content *and* for a 16-byte "Password correct" verifier, which hands an attacker an offline password-checking oracle.
- **Library defects**: a padding bug truncates block-aligned plaintext, and the library silently falls back to ECB when an instance is reused.
- **Raw key bytes are held in React state**, and **decryption happens during render**.

None of this is fixable in place. The replacement is a hard cut.

## Target: WebCrypto only

No JavaScript crypto libraries. `crypto.subtle` and nothing else.

| Parameter | Value | Why |
|---|---|---|
| KDF | **PBKDF2-HMAC-SHA256, 600,000 iterations** | Current OWASP guidance for SHA-256 (as of 2026-09-17 — re-verify). Store the iteration count **per blob** so it can be raised later without breaking old content. |
| Salt | **random, ≥ 16 bytes (128 bits)**, per blob | May be shared within a password group; never reused across different passwords. |
| Cipher | **AES-256-GCM**, 128-bit tag | Authenticated — tampering fails loudly. |
| IV | **fresh random 12 bytes per blob** | Never reuse an IV with the same key. Generate with `crypto.getRandomValues` — **never `Math.random`**. |
| Password check | **the GCM decrypt rejection itself** (a `DOMException` with `name === 'OperationError'`) | **No verifier blob.** A verifier is an offline oracle. |
| Derived key | `extractable: false`, usages `["decrypt"]` | The key cannot be read back out of the browser. |
| Key caching | in memory only, keyed by (salt, iterations, hash) | Never in state you serialize, never in storage. |

Additional rules:

- **Nothing sensitive in React state, `localStorage`/`sessionStorage`, the URL, or logs** — not the password, not the derived key, not the raw key bytes.
- **Crypto runs in effects and event handlers, never during render** (see `hydration-safety`).
- **Feature-detect `crypto.subtle`** and fail with a clear message. It exists only in a **secure context**: `https`, `localhost`, `127.0.0.0/8`, `::1`, `*.localhost`. **A plain-http LAN IP is not a secure context** — that is the usual "it works on my machine but not on my phone" cause.
- **Base64 via `atob`/`btoa` helpers.** `Uint8Array.fromBase64` is newer than this project's browser floor — do not use it.
- **Render decrypted content as text.** If it must be HTML, it is sanitized first, and that is a security review item.
- **Errors are uniform** — "wrong password" reveals nothing about which part failed.
- **No Node globals** (`Buffer`, `globalThis.Buffer`, `process.env`) in this code — it is client code. Use `Uint8Array`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`.

## The v2 blob schema

```json
{
  "v": 2,
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 600000, "salt": "<base64>" },
  "cipher": { "name": "AES-GCM", "iv": "<base64, 12 bytes>", "tagBits": 128 },
  "ct": "<base64 ciphertext||tag>"
}
```

**The reader rejects, loudly and before attempting decryption:**

- an unknown or missing `v`
- `kdf.iterations` below the floor (600,000 as of 2026-09-17 — re-verify against current guidance)
- an IV that is not exactly 12 bytes
- a salt shorter than 16 bytes
- any `cipher.name` other than `AES-GCM`

Optionally bind the header to the ciphertext with AAD over its canonical serialization — if you do, the reader must verify it.

Mobile unlock latency at 600k iterations must be **measured on a real mid-range phone**, not assumed (`verify-at-use-time`). If it is unacceptable, that is a product conversation, not a licence to quietly lower the iteration count.

## Build-time encryption script (sketch)

```ts
// scripts/encrypt-content.mts — REFERENCE SNIPPET (created by the crypto migration PR).
// Node 24: use globalThis.crypto.subtle — the same WebCrypto API the browser reader uses.
// Plaintext lives in content-private/ (gitignored, never committed, never in a PR).
// Passwords come from the environment or an interactive prompt — NEVER from a CLI argument
// (they land in shell history and the process list) and NEVER from a NEXT_PUBLIC_* variable.

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();

const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
const iv   = globalThis.crypto.getRandomValues(new Uint8Array(12));
const iterations = 600_000;

const baseKey = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,                       // non-extractable
  ['encrypt'],                 // the browser reader derives with ['decrypt']
);
const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, enc.encode(plaintext)));

// Write { v: 2, kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: b64(salt) },
//         cipher: { name: 'AES-GCM', iv: b64(iv), tagBits: 128 }, ct: b64(ct) }
// to public/encrypted-content/<name>.json
```

Verify the exact argument shapes against the installed Node's WebCrypto documentation before committing — do not copy this sketch blind.

## The migration (hard cut, one PR)

1. Write the new module under `app/lib/crypto/` with round-trip, tamper-detection, and rejection-rule tests (`testing-unit-vitest`), plus an in-browser decrypt spec on `/encryption-test` (`testing-e2e-playwright`).
2. **Re-encrypt the fixtures.** The fixtures are deliberately public test data with public passwords; they are re-generated under v2, not migrated.
3. **Re-encrypt real content with NEW passwords**, generated high-entropy passphrases — see the opening rule.
4. Remove `encryption-for-node`, every `Buffer` use in the client path, and all verifier fields from both the blobs and the reader.
5. No dual-path reader. There is no v1 support after this PR; old blobs must be regenerated.

Characterization tests against the legacy library are acceptable **before** the migration, to pin current behaviour. They are deleted with the library.

## Blocking review checklist (every item Must-fix)

1. **No JavaScript crypto library; no `Math.random`** anywhere in IV, salt, or key generation.
2. **Blob invariants hold**: correct `v`, a unique fresh IV per blob, salt ≥ 16 bytes, iterations ≥ the floor, **no verifier field**.
3. **Keys are non-extractable**, and no password, key, or plaintext appears in state, storage, the URL, or any log.
4. **Uniform failure message** and a `crypto.subtle` feature check with a clear unsupported-context message.
5. **No crypto during render**, and **no Node globals in client code**.
6. **Decrypted content is rendered as text** (or sanitized, with the sanitizer reviewed).
7. **Plaintext and secrets stay out of the repo**: `content-private/` is gitignored, no passwords in fixtures beyond the deliberately-public test ones, and the secret scan passes.

Items 8–12 of the security gate (headers/CSP, link hygiene, supply chain, round-trip tests, no `NEXT_PUBLIC_` secrets) are in `web-security`.

## Alternatives (not the default)

Argon2id is the stronger KDF but **no browser ships it** in WebCrypto today; the browser route is a WASM implementation that requires `'wasm-unsafe-eval'` in the CSP — not adopted. Whole-page tools and passphrase-based file encryption formats exist, as does platform-level password protection on the hosting side; each is a different threat model and a separate decision.

**Password entropy is the ceiling.** The KDF only buys time against a guessing attack, and the ciphertext is public forever. A memorable password protects nothing that matters.

## Sibling skills
- `web-security` — headers, supply chain, secret scanning, and the rest of the security gate.
- `hydration-safety` — why Node globals in client code fail only in the browser.
- `testing-unit-vitest` — WebCrypto works under both the node and jsdom test environments; what a crypto test must assert.
