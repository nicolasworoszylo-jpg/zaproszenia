#!/usr/bin/env bash
# Setup Multi-PC dla repo zaproszeniaonline.com
# Aktywuje Repo Guardian + ustawia git config dla 2-laptop workflow.
#
# Workflow:
#   git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git
#   cd zaproszenia
#   bash scripts/setup-multi-pc.sh
#
# Idempotent - mozna odpalic wielokrotnie. Pyta tylko gdy musi.

set -e
cd "$(dirname "$0")/.."

# ---- Kolory ------------------------------------------------------------------
if [ -t 1 ]; then
  G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; B=$'\033[34m'; D=$'\033[2m'; X=$'\033[0m'
else
  G=""; Y=""; R=""; B=""; D=""; X=""
fi

log()  { printf '%s[setup]%s %s\n' "$B" "$X" "$*"; }
ok()   { printf '%s[setup]%s %s%s%s\n' "$B" "$X" "$G" "$*" "$X"; }
warn() { printf '%s[setup]%s %s%s%s\n' "$B" "$X" "$Y" "$*" "$X"; }
err()  { printf '%s[setup]%s %s%s%s\n' "$B" "$X" "$R" "$*" "$X" >&2; }

# ---- Pre-flight --------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Nie jestes w repo gita. cd do repo zaproszenia i odpal ponownie."
  exit 1
fi

HOSTNAME_RAW=$(hostname 2>/dev/null || echo "unknown")
echo ""
printf '%s═══════════════════════════════════════════════════════════%s\n' "$B" "$X"
printf '%s  Setup Multi-PC  -  Repo Guardian dla zaproszeniaonline.com%s\n' "$B" "$X"
printf '%s═══════════════════════════════════════════════════════════%s\n' "$B" "$X"
echo ""
log "Host: $HOSTNAME_RAW"
log "Cwd:  $(pwd)"
echo ""

# ---- 1. Aktywacja hooków (KLUCZOWE) ------------------------------------------
log "1/8 Aktywuje hooki Repo Guardian (.githooks/)"
git config core.hooksPath .githooks
ok "   core.hooksPath = .githooks"

# ---- 2. Git config dla 2-laptop workflow -------------------------------------
log "2/8 Konfiguruje git dla multi-PC workflow"

# pull rebase = no merge commits = czysta historia liniowa
git config pull.rebase true

# auto-setup remote tracking branch przy push
git config push.autoSetupRemote true

# rerere = remember resolutions (przy konfliktach z drugim laptopem)
git config rerere.enabled true

# fetch wszystkie remoty bez prompt
git config fetch.prune true

# Better diff for binary
git config diff.algorithm histogram

ok "   pull.rebase=true / push.autoSetupRemote=true / rerere.enabled=true"

# ---- 3. User identity (sprawdz) ----------------------------------------------
log "3/8 Sprawdz user identity"

USER_NAME=$(git config --get user.name 2>/dev/null || echo "")
USER_EMAIL=$(git config --get user.email 2>/dev/null || echo "")

if [ -z "$USER_NAME" ] || [ -z "$USER_EMAIL" ]; then
  warn "   Brak user.name lub user.email"
  warn "   Ustaw lokalnie (per-repo):"
  warn "     git config user.name \"Nicolas (${HOSTNAME_RAW})\""
  warn "     git config user.email \"nicolasworoszylo@gmail.com\""
  warn "   LUB globalnie:"
  warn "     git config --global user.name ..."
else
  ok "   user.name  = $USER_NAME"
  ok "   user.email = $USER_EMAIL"

  # Sugeruj host-aware user.name (jak nie ma hostname w nazwie)
  if ! echo "$USER_NAME" | grep -qE "$HOSTNAME_RAW|MacBook|MacMini|Pro|Air"; then
    warn "   Tip: dodaj host do user.name dla audit-trail commitow z 2 laptopow:"
    warn "     git config user.name \"$USER_NAME ($HOSTNAME_RAW)\""
  fi
fi

# ---- 4. Test hookow ----------------------------------------------------------
log "4/8 Test hookow Repo Guardian"

if [ -x ".githooks/pre-commit" ] && [ -x ".githooks/pre-push" ] && [ -x ".githooks/_lib.sh" ]; then
  ok "   pre-commit + pre-push + commit-msg + prepare-commit-msg + post-* present"
else
  err "   Hooki nie maja +x lub brakuje plików! Sprawdz .githooks/"
  exit 1
fi

# Source lib quick test
if bash -c '. .githooks/_lib.sh && guardian_log "lib OK" 2>&1' | grep -q "lib OK"; then
  ok "   _lib.sh laduje sie poprawnie"
else
  warn "   _lib.sh moze miec problem - sprawdz"
fi

# ---- 5. .guardian/ state dir -------------------------------------------------
log "5/8 Tworze .guardian/ (state directory dla activity log)"
mkdir -p .guardian
if [ ! -f .guardian/.gitignore ]; then
  echo '*' > .guardian/.gitignore  # caly folder ignore - to local state
fi
ok "   .guardian/ + .gitignore"

# ---- 6. Sprawdzenie zaleznosci ----------------------------------------------
log "6/8 Zaleznosci systemowe"
for cmd in git curl bash python3; do
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "   $cmd OK"
  else
    warn "   $cmd BRAK - niektore funkcje moga nie dzialac"
  fi
done

# Optional but rekomendowane
for cmd in jq yq; do
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "   $cmd OK (opcjonalne)"
  else
    warn "   $cmd brak (opcjonalne dla conditional reminders YAML parse)"
    warn "     brew install $cmd  # macOS"
  fi
done

# ---- 7. Conditional Rules YAML test ------------------------------------------
log "7/8 Conditional reminders config"
if [ -f ".repo-rules.yml" ]; then
  RULE_COUNT=$(grep -c "^- match:" .repo-rules.yml 2>/dev/null || echo "0")
  ok "   .repo-rules.yml - $RULE_COUNT regul zaladowanych"
else
  warn "   .repo-rules.yml brak - conditional reminders nie zadziala lokalnie"
  warn "   (GitHub Actions nadal dziala jesli plik jest na server)"
fi

# ---- 8. Sanity ping (czy mozna fetch z origin?) ------------------------------
log "8/8 Test polaczenia z origin"
if timeout 10 git fetch origin --quiet 2>/dev/null; then
  AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
  ok "   origin reachable. Local: ahead=$AHEAD, behind=$BEHIND"
  if [ "$BEHIND" != "0" ] && [ "$BEHIND" != "?" ]; then
    warn "   Jestes $BEHIND za origin. Polecane: git pull --rebase origin main"
  fi
else
  warn "   Nie mozna fetch z origin - sprawdz internet/auth (gh auth login?)"
fi

# ---- Summary -----------------------------------------------------------------
echo ""
printf '%s═══════════════════════════════════════════════════════════%s\n' "$B" "$X"
printf '%s  ✓ Multi-PC setup zakonczony%s\n' "$G" "$X"
printf '%s═══════════════════════════════════════════════════════════%s\n' "$B" "$X"
echo ""
echo "Co teraz dziala automatycznie:"
echo ""
echo "  ${G}✓${X} ${B}pre-commit${X}   blokuje secrets, env files, >5MB, wymusza CHANGELOG"
echo "  ${G}✓${X} ${B}commit-msg${X}    waliduje Conventional Commits format"
echo "  ${G}✓${X} ${B}prepare-commit-msg${X}  wstrzykuje template Co/Czemu/Test"
echo "  ${G}✓${X} ${B}pre-push${X}     blokuje gdy lokal $D<${X} origin (forces pull)"
echo "  ${G}✓${X} ${B}post-checkout${X} pokazuje status sync z drugim laptopem"
echo "  ${G}✓${X} ${B}post-merge${X}    macOS notify gdy przyszly zmiany z 2-go laptopa"
echo "  ${G}✓${X} ${B}post-commit${X}   reminders z .repo-rules.yml (np. zmieniono terms.html -> 'update LEGAL_DATA.md')"
echo "  ${G}✓${X} ${B}GitHub Actions${X} re-validation server-side po push"
echo ""
echo "Workflow na 2 laptopach:"
echo "  ${D}# Lap A: praca${X}"
echo "  git pull --rebase origin main    ${D}# zassij zmiany z lap B${X}"
echo "  ...edit files..."
echo "  git commit -am \"feat(scope): co${X} (template Co/Czemu/Test sie wpisze automat)\""
echo "  git push                          ${D}# Repo Guardian verify + push${X}"
echo ""
echo "Bypass (emergency): ${Y}SKIP_HOOKS=1 SKIP_REASON=\"hotfix\" git commit/push${X}"
echo ""
ok "Wszystko gotowe. Pierwszy commit z hookami zadziala automatycznie."
