#!/usr/bin/env bash
# smoke-test-client.sh - Live test produkcji PO deploy
# Sprawdza ze URL klienta zwraca prawidlowa odpowiedz + assets.
#
# Usage: bash scripts/smoke-test-client.sh <slug>
# Exit 0 = LIVE OK, exit 1 = something broken

set -uo pipefail

SLUG="${1:-}"
if [ -z "$SLUG" ]; then echo "Usage: $0 <slug>"; exit 1; fi

PATH_URL="https://zaproszeniaonline.com/$SLUG"
SUB_URL="https://$SLUG.zaproszeniaonline.com"

FAIL=0

check_http() {
  local desc="$1"; local url="$2"; local expect_min_size="${3:-500}"
  local result=$(curl -sL "$url" -w "HTTP:%{http_code} SIZE:%{size_download}" -o /tmp/smoke.html 2>&1)
  local code=$(echo "$result" | grep -oE 'HTTP:[0-9]+' | cut -d: -f2)
  local size=$(echo "$result" | grep -oE 'SIZE:[0-9]+' | cut -d: -f2)
  if [ "$code" = "200" ] && [ "${size:-0}" -ge "$expect_min_size" ]; then
    echo "  PASS: $desc ($code, ${size}B)"
  else
    echo "  FAIL: $desc ($code, ${size}B)"
    FAIL=$((FAIL+1))
  fi
}

check_in() {
  local desc="$1"; local needle="$2"; local file="$3"
  if grep -q "$needle" "$file" 2>/dev/null; then
    echo "  PASS: $desc"
  else
    echo "  FAIL: $desc (brak '$needle' w $file)"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Smoke test path-based: $PATH_URL ==="
check_http "HTML 200" "$PATH_URL" 1000
check_in "Title personalizowany" "<title>" /tmp/smoke.html
check_in "Scripts: vendor/app.js z absolute slug" "/$SLUG/vendor/app.js" /tmp/smoke.html
check_in "Self-host fonts" "/$SLUG/fonts/fonts.css" /tmp/smoke.html
check_in "Brak unpkg.com" "" /tmp/smoke.html  # invert below
if grep -q "unpkg.com" /tmp/smoke.html; then echo "  FAIL: zawiera unpkg.com (CSP block)"; FAIL=$((FAIL+1)); fi

echo ""
echo "=== Smoke test assets ==="
check_http "app.js" "$PATH_URL/vendor/app.js" 30000
check_http "react.min.js" "$PATH_URL/vendor/react.min.js" 5000
check_http "react-dom.min.js" "$PATH_URL/vendor/react-dom.min.js" 100000
check_http "supabase.min.js" "$PATH_URL/vendor/supabase.min.js" 100000
check_http "fonts.css" "$PATH_URL/fonts/fonts.css" 500
check_http "playfair.woff2" "$PATH_URL/fonts/playfair.woff2" 30000

echo ""
echo "=== Smoke test subdomena: $SUB_URL ==="
# Subdomena moze nie miec SSL ready przez 1-5 min - tylko warn
SUB_CODE=$(curl -sI --connect-timeout 8 "$SUB_URL/vendor/app.js" 2>/dev/null | head -1 | grep -oE '[0-9]{3}')
if [ "$SUB_CODE" = "200" ]; then
  echo "  PASS: subdomena live ($SUB_URL)"
else
  echo "  WARN: subdomena ($SUB_CODE) - SSL cert moze sie jeszcze generowac (5-15 min)"
fi

echo ""
if [ $FAIL -gt 0 ]; then
  echo "SMOKE FAIL: $FAIL problemow"
  exit 1
else
  echo "SMOKE OK - klient $SLUG LIVE"
  exit 0
fi
