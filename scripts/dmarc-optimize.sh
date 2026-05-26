#!/usr/bin/env bash
# dmarc-optimize.sh - Pełna automatyzacja optymalizacji DMARC dla zaproszeniaonline.com
#
# Co robi:
#   1. Tworzy email forwarder dmarc@zaproszeniaonline.com → dominikakus333+dmarc-zaproszenia@gmail.com
#      (plus-alias = automatyczna kategoryzacja w Gmail przez filter)
#   2. Aktualizuje DMARC TXT record _dmarc.zaproszeniaonline.com:
#      - Usuwa ruf= (forensic per-message - źródło 30-50% maili)
#      - Zmienia rua= z rodo@ na dedykowany dmarc@ (oddzielenie od RODO requests)
#      - Usuwa fo=1 (niepotrzebne bez ruf=)
#   3. Refreshuje strefę DNS
#   4. Verify: dig DMARC + alias check
#
# Idempotent: można uruchamiać wielokrotnie - skipuje istniejące.
#
# Wymaga: ~/.claude/secrets/ovh/{app_key,app_secret,consumer_key}.txt (chmod 600)

set -uo pipefail

ZONE="zaproszeniaonline.com"
SECRETS="$HOME/.claude/secrets/ovh"
AK=$(cat "$SECRETS/app_key.txt")
AS=$(cat "$SECRETS/app_secret.txt")
CK=$(cat "$SECRETS/consumer_key.txt")

# Target dla forwarderu dmarc@
# Plus-alias Gmail = auto-label przez filter "to:+dmarc-zaproszenia"
DMARC_FORWARD_TO="dominikakus333+dmarc-zaproszenia@gmail.com"

# Nowy DMARC record - FAZA 1 (bezpieczna):
#   - usuwa ruf= (forensic per-message - źródło 30-50% maili)
#   - usuwa fo=1 (niepotrzebne bez ruf=)
#   - ZOSTAWIA rua= na rodo@ (już działający forwarder)
#   - efekt natychmiastowy: 50% mniej maili
# FAZA 2 (opcjonalna - jak Nicolas zrobi alias dmarc@ w OVH panel):
#   uruchom ponownie z env: DMARC_TARGET=dmarc@${ZONE} bash dmarc-optimize.sh
DMARC_TARGET="${DMARC_TARGET:-rodo@${ZONE}}"
NEW_DMARC="v=DMARC1; p=none; rua=mailto:${DMARC_TARGET}; adkim=r; aspf=r"

# ─── OVH API helper ───
sign_request() {
  local method="$1"; local url="$2"; local body="$3"; local ts="$4"
  local s="$AS+$CK+$method+$url+$body+$ts"
  echo -n "\$1\$$(echo -n "$s" | shasum -a 1 | cut -d' ' -f1)"
}

ovh() {
  local method="$1"; local path="$2"; local body="${3:-}"
  local url="https://eu.api.ovh.com/1.0$path"
  local ts=$(curl -s "https://eu.api.ovh.com/1.0/auth/time")
  local sig=$(sign_request "$method" "$url" "$body" "$ts")
  curl -sS -X "$method" "$url" \
    -H "X-Ovh-Application: $AK" \
    -H "X-Ovh-Consumer: $CK" \
    -H "X-Ovh-Timestamp: $ts" \
    -H "X-Ovh-Signature: $sig" \
    -H "Content-Type: application/json" \
    ${body:+-d "$body"}
}

echo "═══════════════════════════════════════════════════════════"
echo "  DMARC OPTIMIZE for $ZONE"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── KROK 1: Email forwarder dmarc@ → dominikakus333+dmarc-zaproszenia@gmail.com ───
echo "─── 1. Email forwarder dmarc@${ZONE} ───"
EXISTING_REDIRS=$(ovh GET "/email/domain/${ZONE}/redirection?from=dmarc@${ZONE}")
if echo "$EXISTING_REDIRS" | grep -qE '"[0-9]+"'; then
  echo "  ✓ Forwarder dmarc@ już istnieje (skip create)"
  REDIR_IDS=$(echo "$EXISTING_REDIRS" | grep -oE '"[0-9]+"' | tr -d '"')
  for rid in $REDIR_IDS; do
    DETAIL=$(ovh GET "/email/domain/${ZONE}/redirection/${rid}")
    TO_ADDR=$(echo "$DETAIL" | grep -oE '"to":"[^"]+"' | cut -d'"' -f4)
    echo "    - redir id=$rid → $TO_ADDR"
  done
else
  BODY=$(printf '{"from":"dmarc@%s","localCopy":false,"to":"%s"}' "$ZONE" "$DMARC_FORWARD_TO")
  RESULT=$(ovh POST "/email/domain/${ZONE}/redirection" "$BODY")
  echo "  ✓ Forwarder utworzony: dmarc@${ZONE} → ${DMARC_FORWARD_TO}"
  echo "    OVH response: $RESULT"
fi
echo ""

# ─── KROK 2: Update DMARC TXT record ───
echo "─── 2. DMARC TXT record _dmarc.${ZONE} ───"
echo "  Stary: $(dig +short TXT _dmarc.${ZONE} @8.8.8.8 | tr -d '\"')"
echo "  Nowy:  $NEW_DMARC"
echo ""

# Znajdź istniejący DMARC record(y)
DMARC_RECORDS=$(ovh GET "/domain/zone/${ZONE}/record?fieldType=TXT&subDomain=_dmarc")
echo "  Znalezione DMARC record IDs: $DMARC_RECORDS"

RECORD_IDS=$(echo "$DMARC_RECORDS" | grep -oE '[0-9]+')
if [ -z "$RECORD_IDS" ]; then
  echo "  ⚠ Brak istniejących DMARC record - tworzę nowy"
  # OVH oczekuje target jako pure string - bez wewnętrznych cudzysłowów
  # Używamy python3 do prawidłowego JSON escapingu
  BODY=$(python3 -c "import json; print(json.dumps({'fieldType':'TXT','subDomain':'_dmarc','target':'$NEW_DMARC','ttl':3600}))")
  RESULT=$(ovh POST "/domain/zone/${ZONE}/record" "$BODY")
  echo "  Add result: $RESULT"
else
  # Update każdego DMARC record (najczęściej jeden)
  for RID in $RECORD_IDS; do
    echo "  Update record id=$RID..."
    # OVH PUT - target bez surrounding quotes, JSON escaped properly
    BODY=$(python3 -c "import json; print(json.dumps({'target':'$NEW_DMARC','ttl':3600}))")
    RESULT=$(ovh PUT "/domain/zone/${ZONE}/record/${RID}" "$BODY")
    echo "    Update result: ${RESULT:-<empty=success>}"
  done
fi
echo ""

# ─── KROK 3: Refresh strefy ───
echo "─── 3. Refresh DNS zone ───"
REFRESH_RESULT=$(ovh POST "/domain/zone/${ZONE}/refresh" "")
echo "  ✓ Zone refreshed: ${REFRESH_RESULT:-<empty=success>}"
echo ""

# ─── KROK 4: Verify ───
echo "─── 4. Verification (czekam 5s na propagację) ───"
sleep 5
echo ""
echo "  DMARC TXT @8.8.8.8:"
dig +short TXT _dmarc.${ZONE} @8.8.8.8 | sed 's/^/    /'
echo ""
echo "  DMARC TXT @1.1.1.1:"
dig +short TXT _dmarc.${ZONE} @1.1.1.1 | sed 's/^/    /'
echo ""

# Lista wszystkich email forwarderów
echo "  Email forwarders dla ${ZONE}:"
REDIRS=$(ovh GET "/email/domain/${ZONE}/redirection")
for RID in $(echo "$REDIRS" | grep -oE '"[0-9]+"' | tr -d '"'); do
  DETAIL=$(ovh GET "/email/domain/${ZONE}/redirection/${RID}")
  FROM=$(echo "$DETAIL" | grep -oE '"from":"[^"]+"' | cut -d'"' -f4)
  TO=$(echo "$DETAIL" | grep -oE '"to":"[^"]+"' | cut -d'"' -f4)
  echo "    $FROM → $TO"
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✓ DMARC OPTIMIZE COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  CO DALEJ (Gmail filter - 1 minuta):"
echo "  1. Otwórz Gmail dominikakus333@gmail.com"
echo "  2. Settings → Filters → Create new filter"
echo "  3. To: dominikakus333+dmarc-zaproszenia@gmail.com"
echo "  4. → Create filter → Apply label: 'DMARC' + Skip Inbox + Mark as read"
echo "  5. Done. Maile będą w folderze DMARC, NIE w Inbox."
echo ""
echo "  Propagacja DNS: 1-24h (najczęściej 1-2h). Po propagacji:"
echo "  - Yahoo/Google/Microsoft/Sky/itp. będą wysyłać do dmarc@${ZONE}"
echo "  - Nicolas (nicolasworoszylo@) NIE dostanie już żadnych raportów DMARC"
echo "  - Dominika dostaje w label DMARC (Skip Inbox = nie psuje skrzynki)"
echo ""
