#!/usr/bin/env bash
# ovh-dns-add.sh - Dodaj DNS A record dla subdomeny przez OVH API
# Wymaga: ~/.claude/secrets/ovh/{app_key,app_secret,consumer_key}.txt (chmod 600)
#
# Usage:
#   bash scripts/ovh-dns-add.sh <slug>            # A record -> 76.76.21.21 (Vercel)
#   bash scripts/ovh-dns-add.sh <slug> CNAME      # CNAME -> cname.vercel-dns.com.
#
# Idempotent: jezeli record juz istnieje, skip.
# Po dodaniu refresh strefy + sprawdzenie propagacji.

set -uo pipefail

SLUG="${1:-}"
TYPE="${2:-A}"
TARGET="${3:-}"

if [ -z "$SLUG" ]; then
  echo "Usage: $0 <slug> [TYPE=A] [TARGET]"
  exit 1
fi

if [ -z "$TARGET" ]; then
  case "$TYPE" in
    A) TARGET="76.76.21.21" ;;
    CNAME) TARGET="cname.vercel-dns.com." ;;
    *) echo "Unknown TYPE: $TYPE"; exit 1 ;;
  esac
fi

ZONE="zaproszeniaonline.com"
SECRETS="$HOME/.claude/secrets/ovh"
AK=$(cat "$SECRETS/app_key.txt")
AS=$(cat "$SECRETS/app_secret.txt")
CK=$(cat "$SECRETS/consumer_key.txt")

# OVH signature: SHA1(AS + "+" + CK + "+" + METHOD + "+" + URL + "+" + BODY + "+" + TSTAMP)
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

echo "=== OVH DNS: $SLUG.$ZONE -> $TYPE $TARGET ==="

# 1. Sprawdz czy jest wildcard CNAME (* -> cname.vercel-dns.com) - jezeli tak, skip per-slug
WILDCARD=$(ovh GET "/domain/zone/$ZONE/record?fieldType=CNAME&subDomain=*")
if echo "$WILDCARD" | grep -qE '^\[[0-9]+\]'; then
  echo "Wildcard CNAME * istnieje - per-slug DNS NIE potrzebny. Subdomena $SLUG.$ZONE dziedziczy."
  exit 0
fi

# 2. Sprawdz czy record dla $SLUG juz istnieje
EXISTING=$(ovh GET "/domain/zone/$ZONE/record?fieldType=$TYPE&subDomain=$SLUG")
if echo "$EXISTING" | grep -qE '^\[[0-9]+\]'; then
  RECID=$(echo "$EXISTING" | grep -oE '[0-9]+' | head -1)
  echo "Record dla $SLUG.$ZONE juz istnieje (id=$RECID) - skip dodawanie"
  exit 0
fi

# 3. Dodaj record
BODY=$(printf '{"fieldType":"%s","subDomain":"%s","target":"%s","ttl":3600}' "$TYPE" "$SLUG" "$TARGET")
RESULT=$(ovh POST "/domain/zone/$ZONE/record" "$BODY")
echo "Add result: $RESULT"

# 4. Refresh zone (apply changes)
ovh POST "/domain/zone/$ZONE/refresh" "" >/dev/null
echo "Zone refreshed."

# 5. Verify
sleep 2
VERIFY=$(dig +short "$TYPE" "$SLUG.$ZONE" @1.1.1.1)
echo "DNS verify ($TYPE $SLUG.$ZONE): ${VERIFY:-<wait_propagation>}"
