#!/usr/bin/env bash
# scripts/send-as-kontakt.sh
# Wysyłka maila z From: kontakt@zaproszeniaonline.com przez Resend API.
# Fallback gdy Gmail "Send mail as" nie działa - identyczna funkcjonalność, bez Gmail UI.
#
# Użycie:
#   ./send-as-kontakt.sh <to> "<subject>" "<body>"
#   ./send-as-kontakt.sh klient@gmail.com "Re: Zaproszenie" "Cześć, dziękuję za..."
#
# Body z stdin (długie odpowiedzi):
#   cat odpowiedz.txt | ./send-as-kontakt.sh klient@gmail.com "Subject" -
#
# Wymaga: ~/.claude/secrets/resend-api-key.txt (chmod 600), curl, jq (opcjonalny do parsowania)
# Quota Resend free tier: 100 maili/dzień, 3000/mc.

set -euo pipefail

# ─── Walidacja środowiska ──────────────────────────────────────────────
KEY_FILE="$HOME/.claude/secrets/resend-api-key.txt"
if [ ! -f "$KEY_FILE" ]; then
  echo "✗ Brak klucza Resend: $KEY_FILE" >&2
  echo "  Utwórz przez Claude in Chrome (CLAUDE_IN_CHROME_GMAIL_SEND_MAIL_AS.md KROK 1)" >&2
  exit 1
fi

RESEND_KEY=$(cat "$KEY_FILE")
if [[ ! "$RESEND_KEY" =~ ^re_ ]]; then
  echo "✗ Klucz w $KEY_FILE nie zaczyna się od 're_' - prawdopodobnie błędny" >&2
  exit 1
fi

# ─── Walidacja argumentów ──────────────────────────────────────────────
if [ $# -lt 3 ]; then
  cat >&2 <<EOF
Użycie: $0 <to> "<subject>" "<body>"
       cat body.txt | $0 <to> "<subject>" -

Przykłady:
  $0 anna@example.com "Re: Zaproszenie" "Cześć Anna, dziękuję za zamówienie..."
  cat odpowiedz.md | $0 partner@example.com "Notice & Takedown - decyzja" -

From: zawsze "Zaproszenia Online <kontakt@zaproszeniaonline.com>"
Reply-To: kontakt@zaproszeniaonline.com (klient odpowiada na ten adres - forwarder dostarczy)
EOF
  exit 1
fi

TO="$1"
SUBJECT="$2"
BODY="$3"

# Body ze stdin (znak "-")
if [ "$BODY" = "-" ]; then
  BODY=$(cat)
fi

# ─── Walidacja To: ─────────────────────────────────────────────────────
if [[ ! "$TO" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "✗ Nieprawidłowy adres odbiorcy: $TO" >&2
  exit 1
fi

# ─── Konwersja body do HTML (newlines → <br>, escape HTML entities) ────
BODY_HTML=$(printf '%s' "$BODY" | sed \
  -e 's/&/\&amp;/g' \
  -e 's/</\&lt;/g' \
  -e 's/>/\&gt;/g' \
  -e 's/"/\&quot;/g')
BODY_HTML=$(printf '<p>%s</p>' "$BODY_HTML" | awk 'BEGIN{RS="\n\n"} {gsub("\n","<br>"); printf "<p>%s</p>\n", $0}')

# ─── Plain text fallback (dla klientów email bez HTML) ─────────────────
BODY_TEXT="$BODY"

# ─── JSON payload (escape przez jq jeśli dostępne, inaczej manual) ─────
if command -v jq >/dev/null 2>&1; then
  PAYLOAD=$(jq -n \
    --arg from "Zaproszenia Online <kontakt@zaproszeniaonline.com>" \
    --arg to "$TO" \
    --arg reply "kontakt@zaproszeniaonline.com" \
    --arg subj "$SUBJECT" \
    --arg html "$BODY_HTML" \
    --arg text "$BODY_TEXT" \
    '{from: $from, to: [$to], reply_to: $reply, subject: $subj, html: $html, text: $text}')
else
  # Manual JSON escape (mniej niezawodne - jq zalecane: brew install jq)
  ESC_SUBJ=$(printf '%s' "$SUBJECT" | sed 's/\\/\\\\/g; s/"/\\"/g')
  ESC_HTML=$(printf '%s' "$BODY_HTML" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\n')
  ESC_TEXT=$(printf '%s' "$BODY_TEXT" | sed 's/\\/\\\\/g; s/"/\\"/g' | awk '{printf "%s\\n", $0}')
  PAYLOAD=$(cat <<EOF
{"from":"Zaproszenia Online <kontakt@zaproszeniaonline.com>","to":["$TO"],"reply_to":"kontakt@zaproszeniaonline.com","subject":"$ESC_SUBJ","html":"$ESC_HTML","text":"$ESC_TEXT"}
EOF
)
fi

# ─── Wywołanie Resend API ──────────────────────────────────────────────
echo "→ Wysyłam: kontakt@zaproszeniaonline.com → $TO"
echo "  Temat: $SUBJECT"
echo ""

RESPONSE=$(curl -sS -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(printf '%s' "$RESPONSE" | tail -n1 | sed 's/HTTP_STATUS://')
BODY_RESP=$(printf '%s' "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✓ Wysłany. Response:"
  printf '%s\n' "$BODY_RESP" | (command -v jq >/dev/null && jq . || cat)
  echo ""
  echo "Tracking: https://resend.com/emails (pokazuje delivery status w real-time)"
  exit 0
else
  echo "✗ Błąd HTTP $HTTP_STATUS:" >&2
  printf '%s\n' "$BODY_RESP" >&2
  exit 1
fi
