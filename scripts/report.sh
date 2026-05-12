#!/usr/bin/env bash
# Repo Guardian — report
# Interactive helper: append entry to CHANGELOG.md under [Unreleased].
# Usage:
#   bash scripts/report.sh
#   bash scripts/report.sh "Fixed" "demo audio — palette mapping"   # non-interactive

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$REPO_ROOT" ] && { echo "Nie w repo git."; exit 1; }
cd "$REPO_ROOT"

CHANGELOG="CHANGELOG.md"
if [ ! -f "$CHANGELOG" ]; then
  echo "Brak $CHANGELOG — tworzę szkielet."
  cat > "$CHANGELOG" <<'EOF'
# Changelog

Wszystkie istotne zmiany w projekcie.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
wersjonowanie: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

EOF
fi

# ----- Get category ----------------------------------------------------------
CATEGORY="${1:-}"
if [ -z "$CATEGORY" ]; then
  echo ""
  echo "Wybierz typ zmiany:"
  echo "  1) Added       — nowa funkcjonalność"
  echo "  2) Changed     — zmiana istniejącej"
  echo "  3) Fixed       — naprawa buga"
  echo "  4) Removed     — usunięte"
  echo "  5) Deprecated  — wycofywane"
  echo "  6) Security    — bezpieczeństwo"
  echo ""
  printf "Numer [1-6]: "
  read -r choice
  case "$choice" in
    1) CATEGORY="Added" ;;
    2) CATEGORY="Changed" ;;
    3) CATEGORY="Fixed" ;;
    4) CATEGORY="Removed" ;;
    5) CATEGORY="Deprecated" ;;
    6) CATEGORY="Security" ;;
    *) echo "Nieprawidłowy wybór."; exit 1 ;;
  esac
fi

# ----- Get description -------------------------------------------------------
DESC="${2:-}"
if [ -z "$DESC" ]; then
  printf "Opis (jedno zdanie): "
  read -r DESC
fi
if [ -z "$DESC" ]; then
  echo "Pusty opis — anulowanie."
  exit 1
fi

# ----- Insert under [Unreleased] --------------------------------------------
DATE=$(date -u +%Y-%m-%d)
ENTRY="- **${CATEGORY}**: ${DESC} _(${DATE})_"

# Insert right after "## [Unreleased]" line
TMP="$(mktemp)"
awk -v entry="$ENTRY" '
  /^## \[Unreleased\]/ {
    print
    # Skip the blank line if present
    getline next_line
    if (next_line ~ /^[[:space:]]*$/) {
      print ""
      print entry
    } else {
      print entry
      print ""
      print next_line
    }
    next
  }
  { print }
' "$CHANGELOG" > "$TMP" && mv "$TMP" "$CHANGELOG"

echo ""
echo "Dodano do CHANGELOG.md → [Unreleased]:"
echo "  $ENTRY"
echo ""
echo "Pamiętaj: 'git add CHANGELOG.md' żeby uwzględnić w commicie."
