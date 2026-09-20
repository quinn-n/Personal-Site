#!/usr/bin/env bash
# PreToolUse (matcher: Bash) — the real enforcement point for the deploy-safety
# and history-safety rules.
#
# The settings.json deny list is belt-and-braces only: permission rules are
# prefix + suffix-wildcard, so "deny `vercel promote <id>` but allow
# `vercel promote status`" cannot be expressed there. It is expressed here.
#
# Blocks with exit 2; stderr is fed back to Claude and must name the allowed
# read-only alternative. Anything not recognised as dangerous exits 0.
set -u
# No globbing: command segments are word-split with `set --`, and an unquoted
# `*` in a command must never expand to filenames.
set -f

HOOKS_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd) || exit 0
# shellcheck source=./lib.sh
. "$HOOKS_DIR/lib.sh" 2>/dev/null || exit 0

HOOK_INPUT=$(cat)
hook_json_field tool_input.command
cmd="$HOOK_JSON_VALUE"
[ -n "$cmd" ] || exit 0

# Fail OPEN on a degraded parse: the grep fallback mangles shell metacharacters
# in tool_input.command, and a hook must never block the session on a parsing
# artifact. The human sees the warning in the transcript.
if [ "$HOOK_JSON_PARSER" = "grep" ]; then
  hook_note "guard-bash: neither python3 nor node is available to parse the hook payload; the command was NOT checked. Deploy-safety rules (CLAUDE.md) still apply — review this command yourself."
  exit 0
fi

block() {
  printf 'BLOCKED by guard-bash: %s\n' "$1" >&2
  printf 'Command: %s\n' "$cmd" >&2
  exit 2
}

# strip_quoted <string> — blank out fully quoted spans, so that text inside a
# commit message or an echo is not mistaken for a flag.
strip_quoted() {
  printf '%s' "${1:-}" | sed -e 's/"[^"]*"/ /g' -e "s/'[^']*'/ /g"
}

CMD_NOQUOTES=$(strip_quoted "$cmd")
SEG_NOQUOTES=""

# --- --token, anywhere in the command ---------------------------------------
# It overrides the environment and leaks the token into the process list.
case "$CMD_NOQUOTES" in
  *--token*)
    block "'--token' is forbidden everywhere. Authenticate with 'vercel login', or export VERCEL_TOKEN in your own shell — never pass a token on a command line." ;;
esac

# ---------------------------------------------------------------------------
# vercel
# ---------------------------------------------------------------------------
check_vercel() {
  local sub="" sub2="" seen_meta=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --version|-v|--help|-h)
        seen_meta=1; shift; continue ;;
      --scope|-S|--cwd|--local-config|--global-config)
        shift 2 2>/dev/null || return 0
        continue ;;
      -*) shift; continue ;;
      *)
        if [ -z "$sub" ]; then
          sub="$1"
        elif [ -z "$sub2" ]; then
          sub2="$1"
        fi
        shift; continue ;;
    esac
  done

  if [ -z "$sub" ]; then
    if [ "$seen_meta" = "1" ]; then
      return 0
    fi
    block "a bare 'vercel' invocation DEPLOYS the current directory. Deployment is Vercel's Git integration only: push a branch for a preview, merge to master for production. For diagnosis use 'npx vercel list', 'npx vercel inspect <url> --logs' (build logs) or 'npx vercel logs <url>' (runtime logs)."
  fi

  case "$sub" in
    # read-only set
    ls|list|inspect|logs|whoami|httpstat|curl)
      return 0 ;;
    env)
      case "$sub2" in
        ls|list) return 0 ;;
        *) block "'vercel env ${sub2:-<subcommand>}' mutates project environment variables (and 'env pull' writes .env.local). Only 'npx vercel env ls' is allowed; any change is made by a human in the Vercel dashboard." ;;
      esac ;;
    promote|rollback)
      case "$sub2" in
        status) return 0 ;;
        *) block "'vercel $sub <deployment>' changes which deployment serves production, and Instant Rollback turns off auto-assignment of the production domain. This is a human action. Only 'npx vercel $sub status' is allowed. To undo a bad deploy, revert the PR and let the Git integration redeploy." ;;
      esac ;;
    project|domains|dns|alias|certs)
      case "$sub2" in
        ls|list|inspect) return 0 ;;
        *) block "'vercel $sub ${sub2:-<subcommand>}' mutates project/domain configuration. Only the read-only 'ls'/'inspect' forms are allowed; changes are made by a human in the Vercel dashboard." ;;
      esac ;;
    deploy|redeploy)
      block "the studio never deploys. Vercel's Git integration is the only deploy path: push the branch (preview) or merge to master (production). To inspect an existing deployment use 'npx vercel inspect <url> --logs'." ;;
    remove|rm)
      block "'vercel remove' deletes deployments. That is irreversible and human-only." ;;
    buy|tokens|api|integration|teams|team|cache|firewall|redirects|routes|git|link|pull|init|login|logout|switch|mcp|agent)
      block "'vercel $sub' mutates account, project or billing state (some of it costs real money). Run it yourself if you truly need it." ;;
    *)
      block "'vercel $sub' is not in the studio's read-only allowlist, so it is refused by default — a mis-guessed Vercel subcommand can deploy or delete. The allowed set is: --version, whoami, list, inspect, logs, httpstat, curl, promote status, rollback status, env ls, project ls, domains ls. Run anything else yourself." ;;
  esac
  return 0
}

# ---------------------------------------------------------------------------
# git
# ---------------------------------------------------------------------------
check_git_push() {
  local force=0 delete=0 nonflag_count=0 refs="" cur="" t="" dst=""
  while [ $# -gt 0 ]; do
    case "$1" in
      +*)
        block "a '+refs/...' refspec is a force push in disguise. Push without the leading '+', or ask a human to do the force push." ;;
      -f|--force|--force-with-lease|--force-with-lease=*|--force-if-includes)
        force=1; shift; continue ;;
      -d|--delete)
        delete=1; shift; continue ;;
      --repo|--receive-pack|--exec|-o|--push-option)
        shift 2 2>/dev/null || break
        continue ;;
      -*) shift; continue ;;
      *)
        nonflag_count=$((nonflag_count + 1))
        if [ "$nonflag_count" -ge 2 ]; then
          refs="$refs $1"
        fi
        shift; continue ;;
    esac
  done

  if [ "$force" = "0" ] && [ "$delete" = "0" ]; then
    return 0
  fi

  if [ "$nonflag_count" -le 1 ]; then
    # No refspec: the target is whatever HEAD is on.
    cur=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || cur=""
    refs="$cur"
  fi

  for t in $refs; do
    dst="${t##*:}"
    dst="${dst#+}"
    dst="${dst##*/}"
    case "$dst" in
      *'$'*|*'`'*)
        block "this rewrites or deletes a remote ref that is computed from a variable, so the target branch cannot be verified from here. Run it yourself if it is genuinely what you want." ;;
      master|main|HEAD)
        if [ "$delete" = "1" ]; then
          block "deleting the default branch ('$dst') on the remote is never an agent action."
        fi
        block "force-pushing '$dst' rewrites shared history. Push a feature branch and open a PR instead; if a force push is genuinely needed on the default branch, a human does it." ;;
    esac
  done
  return 0
}

check_git_commit() {
  # Quoted spans are stripped first: `git commit -m "document --no-verify"` is a
  # commit message, not a bypass, while `git commit -m "msg" -n` still is one.
  local t=""
  # shellcheck disable=SC2086
  set -- ${SEG_NOQUOTES:-}
  while [ $# -gt 0 ]; do
    t="$1"
    shift
    case "$t" in
      --no-verify)
        block "'git commit --no-verify' skips the pre-commit hooks that run format/lint and the secret scan. Fix what the hook reports instead of bypassing it." ;;
      -[!-]*)
        case "$t" in
          *n*) block "'git commit -n' is '--no-verify': it skips the pre-commit hooks that run format/lint and the secret scan. Fix what the hook reports instead of bypassing it." ;;
        esac ;;
    esac
  done
  return 0
}

check_git() {
  local sub=""
  while [ $# -gt 0 ]; do
    case "$1" in
      -C|-c|--git-dir|--work-tree|--namespace|--exec-path)
        shift 2 2>/dev/null || return 0
        continue ;;
      -*) shift; continue ;;
      *) sub="$1"; shift; break ;;
    esac
  done
  case "$sub" in
    push) check_git_push "$@" ;;
    commit) check_git_commit ;;
  esac
  return 0
}

# ---------------------------------------------------------------------------
# npm
# ---------------------------------------------------------------------------
check_npm() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -*) shift; continue ;;
      publish)
        block "'npm publish' publishes this repo to the npm registry. This is a private site, not a package." ;;
      *) return 0 ;;
    esac
  done
  return 0
}

# ---------------------------------------------------------------------------
# Segment walker
# ---------------------------------------------------------------------------
check_segment() {
  local seg="${1:-}" prog="" tok=""
  local -a unwrapped=()
  seg="${seg#"${seg%%[![:space:]]*}"}"
  seg="${seg%"${seg##*[![:space:]]}"}"
  [ -n "$seg" ] || return 0
  SEG_NOQUOTES=$(strip_quoted "$seg")

  # shellcheck disable=SC2086
  set -- $seg
  [ $# -gt 0 ] || return 0

  # The command arrives with its shell quoting intact, so `git push --force
  # origin "master"` word-splits to the token '"master"'. Unwrap tokens that are
  # fully quoted; anything more elaborate than that is deliberately not parsed.
  unwrapped=()
  while [ $# -gt 0 ]; do
    tok="$1"
    shift
    case "$tok" in
      \"*\") tok="${tok#\"}"; tok="${tok%\"}" ;;
      \'*\') tok="${tok#\'}"; tok="${tok%\'}" ;;
    esac
    unwrapped+=("$tok")
  done
  set -- ${unwrapped[@]+"${unwrapped[@]}"}
  [ $# -gt 0 ] || return 0

  # Strip leading env assignments and wrappers until the real program is $1.
  while [ $# -gt 0 ]; do
    case "$1" in
      *=*)
        case "${1%%=*}" in
          ''|*[!A-Za-z0-9_]*) break ;;
          *) shift; continue ;;
        esac ;;
      env|command|builtin|exec|time|if|then|else|elif|do|while|until|'!')
        shift; continue ;;
      nice)
        shift
        while [ $# -gt 0 ]; do
          case "$1" in
            -n|--adjustment) shift 2 2>/dev/null || return 0; continue ;;
            -*) shift; continue ;;
            *) break ;;
          esac
        done
        continue ;;
      npx)
        shift
        while [ $# -gt 0 ]; do
          case "$1" in
            -p|--package|-c|--call) shift 2 2>/dev/null || return 0; continue ;;
            --) shift; break ;;
            -*) shift; continue ;;
            *) break ;;
          esac
        done
        continue ;;
      npm)
        if [ "${2:-}" = "exec" ]; then
          shift 2
          while [ $# -gt 0 ]; do
            case "$1" in
              --) shift; break ;;
              -*) shift; continue ;;
              *) break ;;
            esac
          done
          continue
        fi
        break ;;
      *) break ;;
    esac
  done
  [ $# -gt 0 ] || return 0

  prog="${1##*/}"
  case "$prog" in
    vercel) shift; check_vercel "$@" ;;
    git)    shift; check_git "$@" ;;
    npm)    shift; check_npm "$@" ;;
  esac
  return 0
}

# Split the command on ; && || | & ( ) ` and newlines, then check each segment.
segments=$(printf '%s' "$cmd" | tr ';|&()`' '\n\n\n\n\n\n')
while IFS= read -r segment; do
  check_segment "$segment"
done <<< "$segments"

exit 0
