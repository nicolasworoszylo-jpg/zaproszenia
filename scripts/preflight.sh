#!/usr/bin/env bash
# Repo Guardian — preflight
# Manual pre-action verifier. Run BEFORE you start working.
# Useful when switching laptops: "czy ten komputer jest sync, czy zaraz wpadnę
# w konflikt".
#
# Output: dashboard with:
#   - aktualna gałąź, last commit, host
#   - sync state (ahead/behind origin)
#   - dirty tree (uncommitted)
#   - stashes (zapomniana praca?)
#   - top 5 plików zmodyfikowanych ostatnio w remote
#   - status hooków (czy .githooks aktywne?)
#   - skip-log (ile bypass-ów ostatnio)
#
# Exit codes:
#   0 = OK
#   2 = warnings (behind, dirty, stash present)
#   3 = critical (hooks off, remote unreachable)

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$REPO_ROOT" ] && { echo "Nie w repo git."; exit 1; }
cd "$REPO_ROOT"

if [ -t 1 ]; then
  C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_RED=$'\033[31m'
  C_BLU=$'\033[34m'; C_DIM=$'\033[2m'; C_BLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_GRN=""; C_YEL=""; C_RED=""; C_BLU=""; C_DIM=""; C_BLD=""; C_OFF=""
fi

EXIT_CODE=0

bar() { printf '%s%s%s\n' "$C_DIM" "──────────────────────────────────────────────────" "$C_OFF"; }
hdr() { printf '\n%s%s%s\n' "$C_BLD" "$1" "$C_OFF"; bar; }

# ------------------------------------------------------------------------------
echo ""
echo "${C_BLD}╔══════════════════════════════════════════════════╗${C_OFF}"
echo "${C_BLD}║  Repo Guardian — Preflight                       ║${C_OFF}"
echo "${C_BLD}╚══════════════════════════════════════════════════╝${C_OFF}"

# ---- Identity ---------------------------------------------------------------
hdr "Identyfikacja"
echo "Host:     $(hostname)"
echo "User:     $(git config user.name 2>/dev/null) <$(git config user.email 2>/dev/null)>"
echo "CWD:      $REPO_ROOT"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
echo "Branch:   $BRANCH"
LAST=$(git log -1 --pretty=format:'%h %s (%cr, %an)' 2>/dev/null)
echo "HEAD:     $LAST"

# ---- Hooks status -----------------------------------------------------------
hdr "Status hooków"
HOOKS_PATH=$(git config core.hooksPath 2>/dev/null)
if [ "$HOOKS_PATH" = ".githooks" ]; then
  echo "${C_GRN}✓${C_OFF} core.hooksPath = .githooks"
else
  echo "${C_RED}✗${C_OFF} core.hooksPath = '$HOOKS_PATH' (oczekiwane: .githooks)"
  echo "  → Uruchom: bash scripts/setup-hooks.sh"
  EXIT_CODE=3
fi

INSTALLED=0
for h in pre-commit prepare-commit-msg commit-msg pre-push post-merge post-checkout; do
  if [ -x ".githooks/$h" ]; then
    INSTALLED=$((INSTALLED + 1))
  fi
done
echo "Hooki w .githooks/: $INSTALLED/6 wykonywalnych"

# ---- Sync state -------------------------------------------------------------
hdr "Sync z origin"
if timeout 15 git fetch --quiet origin 2>/dev/null; then
  echo "${C_GRN}✓${C_OFF} origin osiągalny"
  REMOTE_BRANCH="origin/$BRANCH"
  if git rev-parse --verify --quiet "$REMOTE_BRANCH" >/dev/null; then
    AHEAD=$(git rev-list --count "${REMOTE_BRANCH}..HEAD" 2>/dev/null)
    BEHIND=$(git rev-list --count "HEAD..${REMOTE_BRANCH}" 2>/dev/null)
    AHEAD=${AHEAD:-0}; BEHIND=${BEHIND:-0}
    if [ "$BEHIND" = "0" ] && [ "$AHEAD" = "0" ]; then
      echo "${C_GRN}✓${C_OFF} Branch '$BRANCH' jest sync z origin"
    elif [ "$BEHIND" -gt 0 ]; then
      echo "${C_RED}!${C_OFF} '$BRANCH' jest $BEHIND za origin (a $AHEAD przed)"
      echo "  → Wykonaj: git pull --rebase origin $BRANCH"
      [ "$EXIT_CODE" -lt 2 ] && EXIT_CODE=2
    else
      echo "${C_YEL}↑${C_OFF} '$BRANCH' jest $AHEAD przed origin (gotowe do push)"
    fi

    # Pokaż recent remote activity
    echo ""
    echo "${C_DIM}Ostatnie 3 commity na origin/$BRANCH:${C_OFF}"
    git log -3 --pretty=format:"  %h %s (%cr, %an)" "$REMOTE_BRANCH" 2>/dev/null || true
    echo ""
  else
    echo "${C_YEL}!${C_OFF} Brak '$REMOTE_BRANCH' — nowy branch, nie wypchnięty jeszcze"
  fi
else
  echo "${C_YEL}!${C_OFF} origin nieosiągalny (offline?)"
  [ "$EXIT_CODE" -lt 2 ] && EXIT_CODE=2
fi

# ---- Dirty tree -------------------------------------------------------------
hdr "Stan working tree"
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "${C_GRN}✓${C_OFF} Brak niezacommittowanych zmian"
else
  echo "${C_YEL}!${C_OFF} Są niezacommittowane zmiany:"
  git status --short | head -20 | sed 's/^/  /'
  N=$(git status --porcelain | wc -l | tr -d ' ')
  if [ "$N" -gt 20 ]; then echo "  ... ($N total)"; fi
  [ "$EXIT_CODE" -lt 2 ] && EXIT_CODE=2
fi

# Stashes
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
if [ "$STASH_COUNT" -gt 0 ]; then
  echo ""
  echo "${C_YEL}!${C_OFF} $STASH_COUNT stash(es) — niezakończona praca?"
  git stash list | head -3 | sed 's/^/  /'
  [ "$EXIT_CODE" -lt 2 ] && EXIT_CODE=2
fi

# ---- Audit log peek ---------------------------------------------------------
if [ -f ".guardian/skip-hooks.log" ]; then
  SKIPS_24H=$(awk -v d="$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)" '$1 > d' .guardian/skip-hooks.log 2>/dev/null | wc -l | tr -d ' ')
  if [ "${SKIPS_24H:-0}" -gt 0 ]; then
    hdr "Audit"
    echo "${C_YEL}!${C_OFF} $SKIPS_24H bypass(ów) hooków w ostatnich 24h:"
    tail -5 .guardian/skip-hooks.log | sed 's/^/  /'
  fi
fi

# ---- Summary ----------------------------------------------------------------
echo ""
bar
case $EXIT_CODE in
  0) echo "${C_GRN}${C_BLD}OK — możesz spokojnie pracować.${C_OFF}" ;;
  2) echo "${C_YEL}${C_BLD}OSTRZEŻENIA — przejrzyj powyżej zanim ruszysz.${C_OFF}" ;;
  3) echo "${C_RED}${C_BLD}KRYTYCZNE — hooki nieaktywne. Uruchom: bash scripts/setup-hooks.sh${C_OFF}" ;;
esac
echo ""

exit $EXIT_CODE
