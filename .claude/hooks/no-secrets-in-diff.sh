#!/usr/bin/env bash
# Stop / SubagentStop — scan everything that changed in the working tree for
# likely secrets before the work is folded back.
#
# Exit 2 prevents stopping and returns stderr as feedback, so the report names
# the FILE and the RULE only: no candidate value is ever printed.
#
# Scope: tracked changes vs HEAD plus untracked (non-ignored) files, minus an
# allowlist of paths that legitimately contain secret-shaped strings.
set -u

HOOKS_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd) || exit 0
# shellcheck source=./lib.sh
. "$HOOKS_DIR/lib.sh" 2>/dev/null || exit 0

command -v git >/dev/null 2>&1 || exit 0
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -n "$root" ] || exit 0
cd "$root" 2>/dev/null || exit 0

HAS_HEAD=0
if git rev-parse --verify -q HEAD >/dev/null 2>&1; then
  HAS_HEAD=1
fi

# Paths that legitimately hold secret-shaped strings. Without the studio's own
# files in here, this hook flags its own installation (these documents describe
# the very patterns it looks for) and gets switched off on day one.
is_allowlisted() {
  case "$1" in
    public/encrypted-content/*) return 0 ;;
    package-lock.json)          return 0 ;;
    app/encryption-test/page.tsx) return 0 ;;
    .gitleaks.toml)             return 0 ;;
    .env.example)               return 0 ;;
    .claude/*)                  return 0 ;;
    CLAUDE.md|README.md|BLUEPRINT.md) return 0 ;;
  esac
  return 1
}

# The project's fallback secret patterns, used when gitleaks is unavailable and
# as the project-specific layer when it is present.
# Sets SCAN_HITS to a comma-separated list of rule names (never values).
SCAN_HITS=""
scan_added_lines() {
  local f="$1"
  SCAN_HITS=""
  [ -s "$f" ] || return 0
  if grep -qE -- '-----BEGIN [A-Z ]*PRIVATE KEY-----' "$f"; then SCAN_HITS="$SCAN_HITS private-key-block,"; fi
  if grep -qE -- 'AKIA[0-9A-Z]{16}' "$f"; then SCAN_HITS="$SCAN_HITS aws-access-key-id,"; fi
  if grep -qE -- 'gh[pousr]_[A-Za-z0-9]{36,}' "$f"; then SCAN_HITS="$SCAN_HITS github-token,"; fi
  if grep -qE -- 'github_pat_[A-Za-z0-9_]{22,}' "$f"; then SCAN_HITS="$SCAN_HITS github-fine-grained-pat,"; fi
  if grep -qE -- 'sk-[A-Za-z0-9_-]{20,}' "$f"; then SCAN_HITS="$SCAN_HITS provider-secret-key,"; fi
  if grep -qE -- 'xox[baprs]-' "$f"; then SCAN_HITS="$SCAN_HITS slack-token,"; fi
  if grep -qE -- 'AIza[0-9A-Za-z_-]{35}' "$f"; then SCAN_HITS="$SCAN_HITS google-api-key,"; fi
  if grep -qE -- 'NEXT_PUBLIC_[A-Z_]*(SECRET|TOKEN|KEY|PASSWORD)' "$f"; then SCAN_HITS="$SCAN_HITS next-public-secret-name,"; fi
  if grep -qE -- 'VERCEL_TOKEN=' "$f"; then SCAN_HITS="$SCAN_HITS vercel-token,"; fi
  if grep -qE -- 'VERCEL_AUTOMATION_BYPASS_SECRET=' "$f"; then SCAN_HITS="$SCAN_HITS vercel-bypass-secret,"; fi
  if grep -qiE -- $'(password|passwd|secret|api[_-]?key)[[:space:]]*[:=][[:space:]]*[\'"][^\'"]{8,}' "$f"; then SCAN_HITS="$SCAN_HITS hardcoded-credential,"; fi
  SCAN_HITS="${SCAN_HITS# }"
  SCAN_HITS="${SCAN_HITS%,}"
  return 0
}

tmpdir=$(mktemp -d 2>/dev/null) || exit 0
trap 'rm -rf "$tmpdir"' EXIT

paths=()
npaths=0
while IFS= read -r -d '' p; do
  [ -n "$p" ] || continue
  is_allowlisted "$p" && continue
  paths+=("$p")
  npaths=$((npaths + 1))
done < <(
  {
    if [ "$HAS_HEAD" = "1" ]; then git diff --name-only -z HEAD 2>/dev/null; fi
    git ls-files --others --exclude-standard -z 2>/dev/null
  } | sort -z -u
)

[ "$npaths" -gt 0 ] || exit 0

# Render every change as a diff so a single "added lines" code path covers both
# modified files and brand-new untracked ones.
all="$tmpdir/all.diff"
: > "$all"
idx=0
for p in ${paths[@]+"${paths[@]}"}; do
  out="$tmpdir/d$idx"
  : > "$out"
  if git ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then
    if [ "$HAS_HEAD" = "1" ]; then
      git diff HEAD -- "$p" > "$out" 2>/dev/null
    fi
  elif [ -f "$p" ]; then
    size=$(wc -c < "$p" 2>/dev/null) || size=0
    case "$size" in ''|*[!0-9]*) size=0 ;; esac
    if [ "$size" -le 2000000 ]; then
      # Exit 1 just means "they differ", which is always true against /dev/null.
      git diff --no-index -- /dev/null "$p" > "$out" 2>/dev/null
    fi
  fi
  cat "$out" >> "$all"
  idx=$((idx + 1))
done

report=""
gl_report=""

# gitleaks, when present, covers the broad public-provider rule set. It does NOT
# know this project's rules (NEXT_PUBLIC_* naming, VERCEL_TOKEN=,
# VERCEL_AUTOMATION_BYPASS_SECRET=, loose credential assignments), so the
# pattern pass below runs either way: a clean gitleaks is not a clean bill.
if command -v gitleaks >/dev/null 2>&1 && [ -s "$all" ]; then
  gl_out=$(low_prio gitleaks stdin --redact --no-banner < "$all" 2>&1)
  gl_rc=$?
  case "$gl_rc" in
    0) : ;;
    1) gl_report="$gl_out" ;;
    *)
      hook_note "no-secrets-in-diff: gitleaks exited $gl_rc (unusable — wrong version or unknown flags); the built-in pattern scan is the only coverage for this run." ;;
  esac
else
  hook_note "no-secrets-in-diff: gitleaks is not installed; using the built-in pattern scan (narrower coverage). Install the gitleaks release binary for the full rule set."
fi

idx=0
for p in ${paths[@]+"${paths[@]}"}; do
  added="$tmpdir/a$idx"
  grep -E '^\+' "$tmpdir/d$idx" 2>/dev/null | grep -vE '^\+\+\+ ' > "$added" 2>/dev/null
  scan_added_lines "$added"
  if [ -n "$SCAN_HITS" ]; then
    report="${report}
  $p: $SCAN_HITS"
  fi
  idx=$((idx + 1))
done

if [ -n "$report" ] || [ -n "$gl_report" ]; then
  printf 'Possible secret in the uncommitted changes. Do not stop yet.\n' >&2
  if [ -n "$gl_report" ]; then
    printf 'gitleaks (redacted):\n' >&2
    printf '%s\n' "$gl_report" | head -n 60 >&2
  fi
  if [ -n "$report" ]; then
    printf 'Project patterns — file: rule (values deliberately not printed)%s\n' "$report" >&2
  fi
  printf 'Remove the value from the working tree, rotate it if it was ever real, and keep it out of the repo (env var, or the Vercel dashboard). Encrypted content belongs in public/encrypted-content/ via the encryption script; plaintext belongs in the gitignored content-private/. If this is a false positive, say so explicitly in your summary rather than silently ignoring it.\n' >&2
  exit 2
fi

exit 0
