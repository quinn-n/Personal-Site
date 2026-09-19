#!/usr/bin/env bash
# lib.sh — shared helpers for the hooks in this directory.
# Sourced by the hook scripts; it is never wired to a hook event itself.
#
# House contract for every hook here:
#   * bash, `set -u`, NEVER `set -e` — a hook must never break the session.
#   * Unknown / degraded state => exit 0 with a note, never a hard failure.
#   * PreToolUse blockers: exit 2 with the explanation on stderr (stderr is fed
#     back to Claude, so the message must say what to do instead).
#   * PostToolUse: ALWAYS exit 0 — it cannot block. Feedback goes through
#     emit_context() (`hookSpecificOutput.additionalContext`).

set -u

# ---------------------------------------------------------------------------
# Hook payload
# ---------------------------------------------------------------------------
# stdin can only be read once, so every hook does `HOOK_INPUT=$(cat)` once at
# the top and hook_json_field parses that variable rather than stdin.
: "${HOOK_INPUT:=}"
# Extractor that produced the last value: python3 | node | grep | none.
: "${HOOK_JSON_PARSER:=none}"
# The last extracted value. hook_json_field sets globals instead of printing,
# because a command substitution would run it in a subshell and throw away the
# parser provenance that guard-bash.sh depends on.
: "${HOOK_JSON_VALUE:=}"

_HOOK_PY_EXTRACT='
import json, sys
try:
    data = json.loads(sys.stdin.read())
except Exception:
    sys.exit(1)
cur = data
for part in sys.argv[1].split("."):
    if isinstance(cur, dict) and part in cur:
        cur = cur[part]
    else:
        sys.exit(0)
if cur is None:
    sys.exit(0)
sys.stdout.write(cur if isinstance(cur, str) else json.dumps(cur))
'

_HOOK_NODE_EXTRACT='
let s = "";
process.stdin.on("data", (d) => { s += d; }).on("end", () => {
  let o;
  try { o = JSON.parse(s); } catch (e) { process.exit(1); }
  let c = o;
  for (const p of process.argv[1].split(".")) {
    if (c && typeof c === "object" && p in c) { c = c[p]; } else { process.exit(0); }
  }
  if (c === null || c === undefined) { process.exit(0); }
  process.stdout.write(typeof c === "string" ? c : JSON.stringify(c));
});
'

# hook_json_field <dotted.field.path>
# Sets HOOK_JSON_VALUE (the value, empty if absent) and HOOK_JSON_PARSER.
# Order: python3 -> node -e -> grep. The grep fallback mangles values that
# contain JSON escapes or newlines (notably tool_input.command), so a caller
# that needs an exact value must check HOOK_JSON_PARSER and degrade safely.
hook_json_field() {
  local field="${1:-}" out=""
  HOOK_JSON_VALUE=""
  HOOK_JSON_PARSER="none"
  [ -n "$field" ] || return 0
  [ -n "$HOOK_INPUT" ] || return 0

  if command -v python3 >/dev/null 2>&1; then
    if out=$(printf '%s' "$HOOK_INPUT" | python3 -c "$_HOOK_PY_EXTRACT" "$field" 2>/dev/null); then
      HOOK_JSON_PARSER="python3"
      HOOK_JSON_VALUE="$out"
      return 0
    fi
  fi

  if command -v node >/dev/null 2>&1; then
    if out=$(printf '%s' "$HOOK_INPUT" | node -e "$_HOOK_NODE_EXTRACT" "$field" 2>/dev/null); then
      HOOK_JSON_PARSER="node"
      HOOK_JSON_VALUE="$out"
      return 0
    fi
  fi

  local key="${field##*.}"
  out=$(printf '%s' "$HOOK_INPUT" \
        | grep -oE "\"${key}\"[[:space:]]*:[[:space:]]*\"([^\"\\\\]|\\\\.)*\"" \
        | head -1 \
        | sed -e "s/^\"${key}\"[[:space:]]*:[[:space:]]*\"//" -e 's/"$//')
  HOOK_JSON_PARSER="grep"
  HOOK_JSON_VALUE="$out"
  return 0
}

# ---------------------------------------------------------------------------
# Low-priority execution
# ---------------------------------------------------------------------------
# low_prio <cmd> [args...] — run a compute-heavy command at low OS priority
# locally, plain in CI. `nice` forks and waits, returning the child's exit code
# unchanged, so the caller still sees the real result.
# Deliberately NO `ionice` and NO `taskpolicy`.
low_prio() {
  if [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${GITLAB_CI:-}" ]; then
    "$@"
    return $?
  fi
  if command -v nice >/dev/null 2>&1; then
    nice -n 19 "$@"
    return $?
  fi
  "$@"
  return $?
}

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# hook_repo_root — the project root ($CLAUDE_PROJECT_DIR, else the git
# toplevel, else $PWD), without a trailing slash.
hook_repo_root() {
  local root="${CLAUDE_PROJECT_DIR:-}"
  if [ -z "$root" ]; then
    root=$(git rev-parse --show-toplevel 2>/dev/null) || root=""
  fi
  [ -n "$root" ] || root="$PWD"
  printf '%s' "${root%/}"
}

# repo_rel_path <path> — absolute path -> repo-root-relative. Paths that are
# already relative are returned as-is (minus a leading "./"); absolute paths
# outside the repo are returned unchanged (still absolute — callers treat a
# leading "/" as "outside the project").
repo_rel_path() {
  local p="${1:-}" root
  root=$(hook_repo_root)
  case "$p" in
    "$root"/*) p="${p#"$root"/}" ;;
    "$root") p="." ;;
    ./*) p="${p#./}" ;;
  esac
  printf '%s' "$p"
}

# ---------------------------------------------------------------------------
# PostToolUse output
# ---------------------------------------------------------------------------
# json_escape <string> — emit a JSON string literal (quotes included).
json_escape() {
  local s="${1:-}" esc=""
  if command -v python3 >/dev/null 2>&1; then
    esc=$(printf '%s' "$s" | python3 -c 'import json,sys; sys.stdout.write(json.dumps(sys.stdin.read()))' 2>/dev/null) || esc=""
    if [ -n "$esc" ]; then
      printf '%s' "$esc"
      return 0
    fi
  fi
  if command -v node >/dev/null 2>&1; then
    esc=$(printf '%s' "$s" | node -e 'let d="";process.stdin.on("data",(c)=>{d+=c;}).on("end",()=>process.stdout.write(JSON.stringify(d)))' 2>/dev/null) || esc=""
    if [ -n "$esc" ]; then
      printf '%s' "$esc"
      return 0
    fi
  fi
  # Last resort: hand-escape. Control characters are flattened to spaces.
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\t'/ }
  s=${s//$'\r'/ }
  s=${s//$'\n'/\\n}
  printf '"%s"' "$s"
}

# emit_context <message> — the only channel a PostToolUse hook has for talking
# to Claude. Always followed by `exit 0`.
emit_context() {
  local msg="${1:-}"
  [ -n "$msg" ] || return 0
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":%s}}\n' "$(json_escape "$msg")"
  return 0
}

# hook_note <message> — a one-line note on stderr for the human transcript.
hook_note() {
  printf '%s\n' "${1:-}" >&2
  return 0
}
