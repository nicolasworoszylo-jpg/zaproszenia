#!/usr/bin/env bash
# Repo Guardian — one-shot installer.
# After `git clone`, run: bash scripts/setup-hooks.sh
# Idempotent — safe to re-run.
#
# What it does:
#   1. Sets core.hooksPath -> .githooks (so the in-repo hooks take effect)
#   2. chmod +x on every hook file
#   3. Sets commit.template -> .gitmessage (template for `git commit` w/o -m)
#   4. Creates .guardian/ state dir + .gitignore-d activity logs
#   5. Optionally: configures user.email default per host if unset
#   6. Sanity-checks toolchain (git, gh, curl, osascript)
#   7. Prints a summary

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "[setup-hooks] FATAL: nie w repo git." >&2
  exit 1
fi
cd "$REPO_ROOT"

# Colors
if [ -t 1 ]; then
  C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_RED=$'\033[31m'
  C_BLU=$'\033[34m'; C_BLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_GRN=""; C_YEL=""; C_RED=""; C_BLU=""; C_BLD=""; C_OFF=""
fi

step()  { printf '%s[setup]%s %s\n' "$C_BLU" "$C_OFF" "$*"; }
ok()    { printf '%s[setup]%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_GRN" "$*" "$C_OFF"; }
warn()  { printf '%s[setup]%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_YEL" "$*" "$C_OFF"; }
fail()  { printf '%s[setup]%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_RED" "$*" "$C_OFF"; }

echo ""
echo "${C_BLD}╔══════════════════════════════════════════════════╗${C_OFF}"
echo "${C_BLD}║  Repo Guardian — Setup                           ║${C_OFF}"
echo "${C_BLD}║  github.com/nicolasworoszylo-jpg/zaproszenia     ║${C_OFF}"
echo "${C_BLD}╚══════════════════════════════════════════════════╝${C_OFF}"
echo ""

# ------------------------------------------------------------------------------
# 1. core.hooksPath
# ------------------------------------------------------------------------------
step "Konfiguruję core.hooksPath → .githooks"
git config core.hooksPath .githooks
CURRENT=$(git config core.hooksPath)
if [ "$CURRENT" = ".githooks" ]; then
  ok "core.hooksPath = .githooks ✓"
else
  fail "Nie udało się ustawić core.hooksPath (got: $CURRENT)"
  exit 1
fi

# ------------------------------------------------------------------------------
# 2. chmod +x na wszystkie hooki
# ------------------------------------------------------------------------------
step "Nadaję uprawnienia wykonywania na .githooks/*"
HOOKS_FOUND=0
for h in .githooks/*; do
  [ -f "$h" ] || continue
  case "$(basename "$h")" in
    _*|*.md|README*) continue ;;
  esac
  chmod +x "$h"
  HOOKS_FOUND=$((HOOKS_FOUND + 1))
done
ok "$HOOKS_FOUND hooków uzbrojonych"

# ------------------------------------------------------------------------------
# 3. commit.template
# ------------------------------------------------------------------------------
if [ -f ".gitmessage" ]; then
  step "Konfiguruję commit.template → .gitmessage"
  git config commit.template .gitmessage
  ok "commit.template ustawiony"
else
  warn ".gitmessage nie istnieje — pomijam commit.template"
fi

# ------------------------------------------------------------------------------
# 4. State dir + gitignore
# ------------------------------------------------------------------------------
step "Tworzę .guardian/ (state + audit logs)"
mkdir -p .guardian
if [ ! -f ".guardian/.gitignore" ]; then
  cat > .guardian/.gitignore <<'EOF'
# Repo Guardian — state files. Don't commit, but keep the directory.
*
!.gitignore
EOF
  ok ".guardian/.gitignore utworzony"
else
  ok ".guardian/.gitignore już istnieje"
fi

# ------------------------------------------------------------------------------
# 5. Sanity-check toolchainu
# ------------------------------------------------------------------------------
echo ""
step "Sanity check toolchainu..."

check_tool() {
  local name="$1"
  local cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "  $name ✓"
    return 0
  else
    warn "  $name BRAK ($cmd nie znaleziony)"
    return 1
  fi
}

check_tool "git"        "git"
check_tool "gh CLI"     "gh"
check_tool "curl"       "curl"
check_tool "osascript"  "osascript"

# Gh auth status (only if gh present)
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    ok "  gh auth ✓"
  else
    warn "  gh auth: nie zalogowany. Uruchom 'gh auth login' żeby działały branch-protection scripts."
  fi
fi

# ------------------------------------------------------------------------------
# 6. Identity hint
# ------------------------------------------------------------------------------
echo ""
EMAIL=$(git config user.email 2>/dev/null)
NAME=$(git config user.name 2>/dev/null)
if [ -z "$EMAIL" ]; then
  warn "git user.email nie ustawione. Polecane: git config user.email 'twoj@email'"
else
  ok "git user.email = $EMAIL"
fi
if [ -z "$NAME" ]; then
  warn "git user.name nie ustawione."
else
  ok "git user.name = $NAME"
fi

# ------------------------------------------------------------------------------
# 7. Summary
# ------------------------------------------------------------------------------
echo ""
echo "${C_GRN}${C_BLD}══════════════════════════════════════════════════${C_OFF}"
echo "${C_GRN}${C_BLD}  Repo Guardian aktywny.${C_OFF}"
echo "${C_GRN}${C_BLD}══════════════════════════════════════════════════${C_OFF}"
echo ""
echo "Następne kroki:"
echo "  ${C_BLU}•${C_OFF} bash scripts/preflight.sh         — pre-action sync check"
echo "  ${C_BLU}•${C_OFF} npm run report                    — interaktywny wpis do CHANGELOG"
echo "  ${C_BLU}•${C_OFF} bash scripts/setup-branch-protection.sh  — włącz GitHub branch protection (raz)"
echo ""
echo "Bypass (emergency only):"
echo "  ${C_YEL}SKIP_HOOKS=1 SKIP_REASON=\"czemu\" git commit/push ...${C_OFF}"
echo "  Każdy bypass jest logowany do .guardian/skip-hooks.log."
echo ""
echo "Dokumentacja: REPO_GUARDIAN.md"
echo ""
