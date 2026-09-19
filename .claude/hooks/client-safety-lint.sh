#!/usr/bin/env bash
# PostToolUse (matcher: Edit|Write) — advisory grep for the defect classes this
# codebase actually ships: hydration mismatches, RSC-boundary violations,
# invalid HTML nesting, unsized fill images, unsafe link targets, crypto slips.
#
# ADVISORY ONLY. It always exits 0 and never blocks; findings come back as
# additionalContext. It is a fast heuristic, not a linter — every finding names
# the skill that holds the real rule, and a false positive is expected now and
# then. The authoritative checks are ESLint + /quality-gate + the review board.
set -u

HOOKS_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd) || exit 0
# shellcheck source=./lib.sh
. "$HOOKS_DIR/lib.sh" 2>/dev/null || exit 0

HOOK_INPUT=$(cat)
hook_json_field tool_input.file_path
file="$HOOK_JSON_VALUE"
[ -n "$file" ] || exit 0

rel=$(repo_rel_path "$file")
# Anything under app/, at any depth. ("app/*" cannot cross a "/", so the depth
# is matched by the prefix test and the extension by the second test.)
case "$rel" in
  app/*) ;;
  *) exit 0 ;;
esac
case "$rel" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

root=$(hook_repo_root)
if [ -f "$root/$rel" ]; then
  target="$root/$rel"
elif [ -f "$file" ]; then
  target="$file"
else
  exit 0
fi

findings=""
add() {
  findings="${findings}
- $1"
}

base=${rel##*/}
is_client=0
if grep -qE "^[[:space:]]*['\"]use client['\"]" "$target" 2>/dev/null; then
  is_client=1
fi

# --- hydration: nondeterminism in render / useState initializers ------------
if grep -qE 'useState\([^)]*(Math\.random\(|Date\.now\(|new Date\()' "$target" 2>/dev/null; then
  add "HYDRATION: a useState initializer calls Math.random()/Date.now()/new Date() — the server and client values differ, which is the exact defect class this repo already has. Fix order: mount-effect two-pass -> dynamic(..., {ssr:false}) -> a build-time constant. suppressHydrationWarning is never the fix. See the hydration-safety skill."
elif grep -qE '(Math\.random\(|Date\.now\(|new Date\()' "$target" 2>/dev/null; then
  add "HYDRATION (check): this file calls Math.random()/Date.now()/new Date(). That is fine inside an effect or an event handler, and a hydration mismatch anywhere it is evaluated during render. Confirm which one it is. See the hydration-safety skill."
fi

# --- RSC boundary ----------------------------------------------------------
if [ "$is_client" = "1" ]; then
  if grep -qE '(^|[^A-Za-z0-9_.])(globalThis\.Buffer|Buffer)[.(\[]' "$target" 2>/dev/null; then
    add "CLIENT BOUNDARY: Buffer is a Node global and is not available in the browser. Use Uint8Array / TextEncoder / atob / btoa instead. See the nextjs-app-router-conventions and client-crypto skills."
  fi
  if grep -q 'process\.env' "$target" 2>/dev/null; then
    add "CLIENT BOUNDARY: process.env in a client component. Only NEXT_PUBLIC_* values exist in the browser, and they are inlined into the bundle at build time — so they may never hold a secret. See the nextjs-app-router-conventions skill."
  fi
  if grep -qE '(^|[^A-Za-z0-9_.])require\(' "$target" 2>/dev/null; then
    add "CLIENT BOUNDARY: require() in a client component — use ESM import (or a dynamic import()). See the nextjs-app-router-conventions skill."
  fi
fi

case "$base" in
  page.tsx|page.ts|layout.tsx|layout.ts)
    if [ "$is_client" = "1" ]; then
      add "RSC: \"use client\" in $base removes the ability to export metadata and pulls the whole subtree into the client bundle. Keep pages and layouts as Server Components and push \"use client\" down to the leaf under app/ui. See the nextjs-app-router-conventions skill."
    fi ;;
esac

# --- invalid HTML nesting (hydration error + a11y) --------------------------
if grep -qE '<p[[:space:]>][^<]*<(div|p|ul|ol|li|section|article|h[1-6]|table|figure|blockquote|pre)[[:space:]>/]' "$target" 2>/dev/null; then
  add "INVALID NESTING: a block-level element appears inside <p>. The browser closes the <p> early, which React reports as a hydration error. Use <div> (or a fragment) as the wrapper. See the hydration-safety skill."
fi

# --- images ----------------------------------------------------------------
if grep -q '<Image' "$target" 2>/dev/null \
   && grep -qE '(^|[[:space:]])fill([[:space:]}/>]|$)' "$target" 2>/dev/null \
   && ! grep -q 'sizes=' "$target" 2>/dev/null; then
  add "IMAGES: next/image with 'fill' and no 'sizes' makes the browser download the largest candidate on every viewport. Add a sizes prop that matches the layout. See the nextjs-app-router-conventions skill."
fi

# --- links -----------------------------------------------------------------
if grep -q 'target="_blank"' "$target" 2>/dev/null && ! grep -q 'rel="noopener' "$target" 2>/dev/null; then
  add "LINKS: target=\"_blank\" without rel=\"noopener noreferrer\" hands the opened page a window.opener reference. See the nextjs-app-router-conventions skill."
fi

if grep -q 'dangerouslySetInnerHTML' "$target" 2>/dev/null; then
  add "XSS: dangerouslySetInnerHTML — decrypted or fetched content must be rendered as text unless it is sanitized, and the security review must sign this off. See the client-crypto skill."
fi

# --- crypto ----------------------------------------------------------------
case "$rel" in
  app/lib/crypto/*)
    if grep -q 'Math\.random' "$target" 2>/dev/null; then
      add "CRYPTO: Math.random() under app/lib/crypto/ is never acceptable for an IV, a salt or a key — use crypto.getRandomValues(). See the client-crypto skill."
    fi ;;
esac

[ -n "$findings" ] || exit 0

emit_context "client-safety-lint (advisory) on $rel:$findings"
exit 0
