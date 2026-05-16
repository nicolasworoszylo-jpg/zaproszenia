#!/usr/bin/env bash
# email-templates/send-template.sh
# Wysłanie maila ze scenariusza (01-10) przez Resend API.
#
# Użycie:
#   ./send-template.sh --to ola@example.com --scenario 01 \
#       --var ImiePary=Anna --var ImionaPelne="Anna i Michał" \
#       --var LinkPodgladu="https://..."
#
# Wymaga: RESEND_API_KEY (env albo ~/.claude/secrets/resend-api-key.txt)
# Wymaga: jq, awk, sed
#
# Co robi:
#   1. Wczytuje scenarios.md, wycina sekcję ## NN
#   2. Parsuje SUBJECT, PREHEADER, plain text, HTML body
#   3. Wkleja HTML body do _shell.html (template engine)
#   4. Replace wszystkich {{VarName}} z --var (HTML + text + subject + preheader)
#   5. POST do Resend API
#   6. Dry-run opcjonalnie (--dry) → wypisuje preview do stdout zamiast wysyłać

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIOS="${SCRIPT_DIR}/scenarios.md"
SHELL_TPL="${SCRIPT_DIR}/_shell.html"
RESEND_SECRET="${HOME}/.claude/secrets/resend-api-key.txt"
FROM="Zaproszenia Online <kontakt@zaproszeniaonline.com>"
REPLY_TO="kontakt@zaproszeniaonline.com"

# ─── Args ──────────────────────────────────────────────────────────────────
TO=""
SCENARIO=""
DRY="false"
VARS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)         TO="$2"; shift 2 ;;
    --scenario)   SCENARIO="$2"; shift 2 ;;
    --var)        VARS+=("$2"); shift 2 ;;
    --dry|--dry-run) DRY="true"; shift ;;
    --help|-h)
      sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Nieznany arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$TO" || -z "$SCENARIO" ]]; then
  echo "Wymaga: --to email@... --scenario NN [--var Key=Value ...] [--dry]" >&2
  echo "Dostępne scenariusze: 01-10. Lista w $SCENARIOS." >&2
  exit 2
fi

# ─── Resend key ────────────────────────────────────────────────────────────
if [[ "$DRY" != "true" ]]; then
  if [[ -z "${RESEND_API_KEY:-}" ]]; then
    [[ -r "$RESEND_SECRET" ]] && RESEND_API_KEY=$(tr -d '[:space:]' < "$RESEND_SECRET") || {
      echo "BŁĄD: brak RESEND_API_KEY (env albo $RESEND_SECRET)" >&2; exit 1; }
  fi
fi

# ─── Parse scenariusza ─────────────────────────────────────────────────────
# Sekcja zaczyna się od "## NN — " a kończy przed kolejnym "## ".
SECTION=$(awk -v num="$SCENARIO" '
  BEGIN { in_section = 0 }
  /^## '"$SCENARIO"' —/ { in_section = 1; print; next }
  /^## [0-9]/ { if (in_section) exit }
  in_section { print }
' "$SCENARIOS")

if [[ -z "$SECTION" ]]; then
  echo "BŁĄD: scenariusz $SCENARIO nie znaleziony w $SCENARIOS" >&2
  exit 3
fi

SUBJECT=$(echo "$SECTION" | grep -m1 '^\*\*SUBJECT:\*\*' | sed -E 's/^\*\*SUBJECT:\*\* ?`(.*)`$/\1/')
PREHEADER=$(echo "$SECTION" | grep -m1 '^\*\*PREHEADER:\*\*' | sed -E 's/^\*\*PREHEADER:\*\* ?`(.*)`$/\1/')

# Plain text: między "### Plain text" i "### HTML body"
PLAIN=$(echo "$SECTION" | awk '/^### Plain text/{flag=1; next} /^### HTML body/{flag=0} /^```$/{next} /^```/{next} flag')

# HTML body: między "### HTML body" i końcem sekcji (ostatni ``` przed ##)
HTML_BODY=$(echo "$SECTION" | awk '/^### HTML body/{flag=1; next} /^```html$/{capture=1; next} /^```$/{capture=0} capture && flag')

if [[ -z "$SUBJECT" || -z "$HTML_BODY" ]]; then
  echo "BŁĄD: nie udało się sparsować scenariusza $SCENARIO (SUBJECT='$SUBJECT' HTML_LEN=${#HTML_BODY})" >&2
  exit 4
fi

# Wstaw HTML_BODY do shella
SHELL_CONTENT=$(cat "$SHELL_TPL")
# Title = subject (po replace)
HTML=$(echo "$SHELL_CONTENT" | awk -v body="$HTML_BODY" '
  { sub(/\{\{BODY\}\}/, body) } 1
')
HTML=$(echo "$HTML" | awk -v title="$SUBJECT" -v preheader="$PREHEADER" '
  { sub(/\{\{TITLE\}\}/, title); sub(/\{\{PREHEADER\}\}/, preheader) } 1
')

# ─── Replace vars ──────────────────────────────────────────────────────────
for kv in "${VARS[@]:-}"; do
  [[ -z "$kv" ]] && continue
  KEY="${kv%%=*}"
  VAL="${kv#*=}"
  # Escape do sed (slash i ampersand)
  ESC_VAL=$(echo "$VAL" | sed -e 's/[\/&]/\\&/g')
  SUBJECT=$(echo "$SUBJECT" | sed "s/{{${KEY}}}/${ESC_VAL}/g")
  PREHEADER=$(echo "$PREHEADER" | sed "s/{{${KEY}}}/${ESC_VAL}/g")
  PLAIN=$(echo "$PLAIN" | sed "s/{{${KEY}}}/${ESC_VAL}/g")
  HTML=$(echo "$HTML" | sed "s/{{${KEY}}}/${ESC_VAL}/g")
done

# Sprawdź czy zostały niewypełnione placeholdery
REMAINING=$(echo "$HTML$PLAIN$SUBJECT$PREHEADER" | grep -oE '\{\{[A-Za-z]+\}\}' | sort -u || true)
if [[ -n "$REMAINING" ]]; then
  echo "UWAGA: niewypełnione placeholdery:" >&2
  echo "$REMAINING" | sed 's/^/  /' >&2
  echo "(podaj przez --var Key=Value)" >&2
fi

# ─── Output ────────────────────────────────────────────────────────────────
if [[ "$DRY" == "true" ]]; then
  echo "═══════════════════════════════════════════════════════"
  echo "DRY RUN - scenariusz $SCENARIO → $TO"
  echo "═══════════════════════════════════════════════════════"
  echo "SUBJECT:   $SUBJECT"
  echo "PREHEADER: $PREHEADER"
  echo "───────────────────────────────────────────────────────"
  echo "PLAIN:"
  echo "$PLAIN"
  echo "───────────────────────────────────────────────────────"
  echo "HTML (length: ${#HTML} chars) - zapisuję do /tmp/scenariusz-$SCENARIO.html"
  echo "$HTML" > "/tmp/scenariusz-$SCENARIO.html"
  echo "Otwórz: open /tmp/scenariusz-$SCENARIO.html"
  exit 0
fi

# ─── Send via Resend ───────────────────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  echo "BŁĄD: jq nie zainstalowane (brew install jq)" >&2; exit 1
fi

PAYLOAD=$(jq -n \
  --arg from "$FROM" \
  --arg to "$TO" \
  --arg subject "$SUBJECT" \
  --arg html "$HTML" \
  --arg text "$PLAIN" \
  --arg reply_to "$REPLY_TO" \
  '{from: $from, to: [$to], subject: $subject, html: $html, text: $text, reply_to: $reply_to}')

echo "Wysyłam scenariusz $SCENARIO → $TO ..."
RESPONSE=$(curl -sS -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo "$RESPONSE" | jq -e '.id' >/dev/null 2>&1 && exit 0 || exit 1
