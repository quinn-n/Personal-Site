#!/usr/bin/env bash
# PostToolUse (matcher: Edit|Write) — format the single file that was just
# written, with Biome.
#
# PostToolUse cannot block, so this hook ALWAYS exits 0. Everything it has to
# say (including Biome's parse errors) goes back through additionalContext.
# ESLint is not run per edit — it belongs to /quality-gate.
set -u

HOOKS_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd) || exit 0
# shellcheck source=./lib.sh
. "$HOOKS_DIR/lib.sh" 2>/dev/null || exit 0

HOOK_INPUT=$(cat)
hook_json_field tool_input.file_path
file="$HOOK_JSON_VALUE"
[ -n "$file" ] || exit 0

rel=$(repo_rel_path "$file")
# Still absolute after normalisation => outside the project.
case "$rel" in
  /*) exit 0 ;;
esac

case "$rel" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.jsonc|*.css) ;;
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

# Which Biome is installed? (--no-install => never fetch a version from the
# network; a missing node_modules is a no-op, not an error.)
version_out=$(cd "$root" 2>/dev/null && npx --no-install biome --version 2>/dev/null) || version_out=""
if [ -z "$version_out" ]; then
  emit_context "format-on-edit: Biome is not available via 'npx --no-install' (run 'npm ci' first?). $rel was left unformatted — /quality-gate will catch it."
  exit 0
fi

major=$(printf '%s' "$version_out" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 | cut -d. -f1)
case "$major" in
  ''|*[!0-9]*)
    emit_context "format-on-edit: could not parse the Biome version from '$version_out'; $rel was left unformatted. Run the formatter through /quality-gate."
    exit 0 ;;
esac

if [ "$major" -lt 2 ]; then
  emit_context "format-on-edit: Biome ${major}.x detected; per-edit formatting is deferred to /quality-gate (the confirmed flag set is Biome 2+). Do not hand-format $rel — the repo-wide run will."
  exit 0
fi

out=$(cd "$root" 2>/dev/null && npx --no-install biome format --write --no-errors-on-unmatched --files-ignore-unknown=true -- "$target" 2>&1)
rc=$?

if [ "$rc" -ne 0 ]; then
  # Biome exits non-zero on a parse/syntax error. That is a real finding about
  # the file that was just written, not a hook failure.
  emit_context "format-on-edit: Biome could not format $rel (exit $rc) — usually a syntax/parse error in the file you just wrote. Fix it, then re-save. Biome said:
$(printf '%s' "$out" | head -c 2000)"
fi

exit 0
