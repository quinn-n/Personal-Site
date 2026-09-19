---
paths:
  - "app/lib/crypto/**"
  - "app/ui/encrypted-content.tsx"
  - "scripts/encrypt-content.*"
  - "public/encrypted-content/**"
  - "content-private/**"
---

# Client-crypto rules

**Whether this content holds real secrets is set in `CLAUDE.md` → Project specifics (`Encrypted content holds real secrets:`). Read that line before treating any item here as advisory — it currently reads `yes`, which makes every item below blocking (Must-fix).**

- **WebCrypto only.** No JavaScript crypto libraries. Randomness comes from `crypto.getRandomValues` — **never `Math.random`**.
- **v2 blob invariants**: PBKDF2-HMAC-SHA256 at the stored iteration count (floor 600,000), random salt ≥ 16 bytes, AES-256-GCM with a **fresh random 12-byte IV per blob**, 128-bit tag, **no verifier field**. The reader rejects an unknown `v`, a low iteration count, a non-12-byte IV, or a short salt.
- **A wrong password is detected by the GCM decrypt rejection**, not by a checkable verifier.
- **Derived keys are `extractable: false`** with usages `["decrypt"]`, cached in memory only.
- **Nothing sensitive in React state, storage, the URL, or logs** — not passwords, not keys, not plaintext.
- **Crypto runs in effects and event handlers, never during render.** Feature-detect `crypto.subtle` (secure contexts only).
- **No Node globals** here — this is client code. `Uint8Array`, `TextEncoder`, `atob`/`btoa`.
- **Plaintext stays in gitignored `content-private/`.** Passwords come from the environment or a prompt — never a CLI argument, never a `NEXT_PUBLIC_*` variable, never a commit.
- Decrypted content is rendered as **text** unless a reviewed sanitizer is in the path.
- No real content is published behind encryption until the v2 scheme ships with a generated high-entropy passphrase; any already-published v1 ciphertext is compromised and is re-encrypted with **new** passwords.

Depth: `client-crypto` (scheme, schema, migration) and `web-security` (headers, supply chain, secret scanning).
