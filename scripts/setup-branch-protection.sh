#!/usr/bin/env bash
# Repo Guardian — Branch Protection (GitHub side).
# Idempotent. Configures protection on `main`:
#   - require pull request before merge
#   - require status checks (repo-guardian workflow) to pass
#   - block force-push
#   - block deletion
#   - require linear history (no merge commits) — optional, easy to undo
#   - require conversation resolution before merge
#
# Requires: gh CLI authenticated with `repo` scope.
# Usage:
#   bash scripts/setup-branch-protection.sh           # apply
#   bash scripts/setup-branch-protection.sh --check   # dry-run / inspect

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$REPO_ROOT" ] && { echo "Nie w repo git."; exit 1; }
cd "$REPO_ROOT"

if [ -t 1 ]; then
  C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_RED=$'\033[31m'
  C_BLU=$'\033[34m'; C_BLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_GRN=""; C_YEL=""; C_RED=""; C_BLU=""; C_BLD=""; C_OFF=""
fi

if ! command -v gh >/dev/null 2>&1; then
  printf '%s[branch-protection]%s gh CLI brak. Zainstaluj: brew install gh\n' "$C_BLU" "$C_OFF"
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  printf '%s[branch-protection]%s gh nie zalogowany. Uruchom: gh auth login\n' "$C_BLU" "$C_OFF"
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
  echo "Nie udało się określić repo z gh repo view."
  exit 1
fi

BRANCH="main"
MODE="${1:-apply}"

echo ""
echo "${C_BLD}╔══════════════════════════════════════════════════╗${C_OFF}"
echo "${C_BLD}║  Repo Guardian — Branch Protection               ║${C_OFF}"
echo "${C_BLD}║  Repo:   $REPO"
echo "${C_BLD}║  Branch: $BRANCH"
echo "${C_BLD}╚══════════════════════════════════════════════════╝${C_OFF}"
echo ""

if [ "$MODE" = "--check" ]; then
  echo "Aktualna konfiguracja:"
  gh api "repos/$REPO/branches/$BRANCH/protection" 2>/dev/null \
    || echo "Brak ochrony lub brak uprawnień."
  exit 0
fi

# ------------------------------------------------------------------------------
# Apply protection rules.
# Note: For *public* repos on free plan, status checks + PR required works.
# Required PR reviews requires repo permissions; we skip that to avoid blocking
# a solo workflow — Nicolas is sole reviewer.
# ------------------------------------------------------------------------------
JSON_PAYLOAD=$(cat <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Repo Guardian / validate"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF
)

echo "Aplikuję reguły ochrony na '$BRANCH'..."
RESP=$(echo "$JSON_PAYLOAD" | gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" --input - 2>&1)
RC=$?

if [ $RC -eq 0 ]; then
  echo "${C_GRN}✓${C_OFF} Branch protection aktywne na '$BRANCH'."
  echo ""
  echo "Co to oznacza:"
  echo "  ${C_BLU}•${C_OFF} Direct push do main BLOKOWANY — wszystko przez PR"
  echo "  ${C_BLU}•${C_OFF} Status check 'Repo Guardian / validate' wymagany do merge"
  echo "  ${C_BLU}•${C_OFF} Force-push do main NIEMOŻLIWY (nawet z SKIP_HOOKS=1)"
  echo "  ${C_BLU}•${C_OFF} Branch nie da się skasować"
  echo "  ${C_BLU}•${C_OFF} Wymagany linear history (rebase zamiast merge commitów)"
  echo "  ${C_BLU}•${C_OFF} Konwersacje w PR muszą być resolved przed merge"
  echo ""
  echo "Jak teraz pracować:"
  echo "  1. Stwórz branch: git checkout -b feature/cos-tam"
  echo "  2. Commit (hooki Cię prowadzą)"
  echo "  3. Push: git push -u origin feature/cos-tam"
  echo "  4. Otwórz PR (GitHub UI lub: gh pr create --fill)"
  echo "  5. Action 'Repo Guardian / validate' się odpali"
  echo "  6. Merge gdy zielone (squash lub rebase, NIE merge commit)"
else
  echo "${C_RED}✗${C_OFF} Nie udało się ustawić ochrony:"
  echo "$RESP"
  exit 1
fi

# ------------------------------------------------------------------------------
# Repo-level settings (squash merge only, delete branch on merge, auto-merge)
# ------------------------------------------------------------------------------
echo ""
echo "Konfiguruję merge settings na repo..."
gh api -X PATCH "repos/$REPO" \
  -f allow_merge_commit=false \
  -f allow_squash_merge=true \
  -f allow_rebase_merge=true \
  -f delete_branch_on_merge=true \
  -f allow_auto_merge=true \
  >/dev/null 2>&1 && echo "${C_GRN}✓${C_OFF} squash+rebase only, auto-delete branch po merge"

echo ""
echo "${C_GRN}${C_BLD}Branch protection skonfigurowane.${C_OFF}"
echo ""
echo "Sprawdzenie: bash scripts/setup-branch-protection.sh --check"
echo "Cofnięcie:  gh api -X DELETE repos/$REPO/branches/$BRANCH/protection"
