#!/usr/bin/env bash
# Repo Guardian - shared functions for git hooks.
# Sourced by every hook in .githooks/. Keep dependency-free (POSIX-ish bash).

set -uo pipefail

# ---- Colors (only on TTY) -----------------------------------------------------
if [ -t 1 ]; then
  C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'
  C_BLU=$'\033[34m'; C_DIM=$'\033[2m'; C_BLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_RED=""; C_GRN=""; C_YEL=""; C_BLU=""; C_DIM=""; C_BLD=""; C_OFF=""
fi

guardian_log()   { printf '%s[guardian]%s %s\n' "$C_BLU" "$C_OFF" "$*" >&2; }
guardian_ok()    { printf '%s[guardian]%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_GRN" "$*" "$C_OFF" >&2; }
guardian_warn()  { printf '%s[guardian]%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_YEL" "$*" "$C_OFF" >&2; }
guardian_error() { printf '%s[guardian]%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_RED" "$*" "$C_OFF" >&2; }

# ---- Repo paths ---------------------------------------------------------------
guardian_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null
}

guardian_state_dir() {
  local root
  root="$(guardian_repo_root)"
  echo "${root}/.guardian"
}

# ---- Skip flag handling -------------------------------------------------------
# SKIP_HOOKS=1 bypasses all gates BUT logs to .guardian/skip-hooks.log for audit.
# Use only for emergency hotfixes. Every skip is timestamped + reason-requested.
guardian_skip_active() {
  [ "${SKIP_HOOKS:-0}" = "1" ]
}

guardian_log_skip() {
  local hook="$1"
  local reason="${SKIP_REASON:-no-reason-given}"
  local state_dir
  state_dir="$(guardian_state_dir)"
  mkdir -p "$state_dir" 2>/dev/null
  local log_file="${state_dir}/skip-hooks.log"
  printf '%s | hook=%s | reason=%s | user=%s | host=%s | branch=%s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$hook" \
    "$reason" \
    "$(git config user.email 2>/dev/null || echo unknown)" \
    "$(hostname 2>/dev/null || echo unknown)" \
    "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)" \
    >> "$log_file"
  guardian_warn "SKIP_HOOKS=1 — hook '$hook' bypassed (reason: $reason). Logged to .guardian/skip-hooks.log"
}

# ---- Activity log -------------------------------------------------------------
# Every meaningful repo event lands here. Cheap audit trail across both laptops.
guardian_log_activity() {
  local event="$1"
  local detail="${2:-}"
  local state_dir
  state_dir="$(guardian_state_dir)"
  mkdir -p "$state_dir" 2>/dev/null
  printf '%s | %s | host=%s | branch=%s | %s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$event" \
    "$(hostname 2>/dev/null || echo unknown)" \
    "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)" \
    "$detail" \
    >> "${state_dir}/activity.log"
}

# ---- macOS notification (silent on Linux) ------------------------------------
guardian_notify_mac() {
  local title="$1"
  local msg="$2"
  if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"$msg\" with title \"$title\"" >/dev/null 2>&1 || true
  fi
}

# ---- Source files heuristic ---------------------------------------------------
# Anything that, when changed, materially affects production behavior.
# Used by pre-commit to decide if CHANGELOG.md update is required.
guardian_is_source_change() {
  local path="$1"
  case "$path" in
    *.html|*.jsx|*.tsx|*.js|*.ts|*.css|*.json|*.sh|*.py|*.sql) return 0 ;;
    api/*|scripts/*|supabase/*|.github/workflows/*) return 0 ;;
    vercel.json|robots.txt|sitemap.xml|site.webmanifest) return 0 ;;
    *) return 1 ;;
  esac
}

# ---- Secret-pattern guard -----------------------------------------------------
# Quick check for accidental secrets in staged content. Conservative — false
# negatives possible, but blocks the obvious foot-guns.
guardian_looks_like_secret() {
  local content="$1"
  # Stripe live keys, sk_ secrets, AWS, generic JWTs, .env-style leaks
  echo "$content" | grep -qE '(sk_live_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s]{20,}|RESEND_API_KEY\s*=\s*re_[A-Za-z0-9]{20,})'
}

# ---- Branch checks ------------------------------------------------------------
guardian_current_branch() {
  git rev-parse --abbrev-ref HEAD 2>/dev/null
}

guardian_is_protected_branch() {
  local b="$1"
  case "$b" in
    main|master|production) return 0 ;;
    *) return 1 ;;
  esac
}
