#!/usr/bin/env bash
# Lint: sprawdza spójność danych biznesowych pomiędzy BUSINESS_DATA.json (single source) a kluczowymi plikami.
# Egzekwuje DELEGATE-52 mitigation #9 (single source of truth zamiast rozsianych danych).
# Exit 1 jeśli krytyczna niespójność. Exit 0 jeśli OK (lub tylko WARN).
set -u
cd "$(dirname "$0")/.."

if ! command -v jq >/dev/null 2>&1; then
  echo "ERR: jq required"; exit 2
fi
if [ ! -f BUSINESS_DATA.json ]; then
  echo "ERR: BUSINESS_DATA.json missing"; exit 2
fi

PRICE=$(jq -r '.pricing.base_price_pln' BUSINESS_DATA.json)
PRICE_UNTIL=$(jq -r '.pricing.valid_until' BUSINESS_DATA.json)
EMAIL_PUB=$(jq -r '.contact.public_email' BUSINESS_DATA.json)
DOMAIN=$(jq -r '.brand.domain' BUSINESS_DATA.json)
RODO_COMMIT=$(jq -r '.legal_compliance.rodo_audit_commit' BUSINESS_DATA.json)

FAIL=0
WARN=0

echo "=== Lint Business Data Consistency ==="

# Check 1: cena 699 w index.html schema.org + Stripe docs
if ! grep -q "\"price\":\"${PRICE}\"" index.html; then
  echo "FAIL: index.html schema.org Product nie zawiera 'price':'${PRICE}'"
  FAIL=$((FAIL+1))
fi
if ! grep -q "\"priceValidUntil\":\"${PRICE_UNTIL}\"" index.html; then
  echo "FAIL: index.html schema.org priceValidUntil != ${PRICE_UNTIL}"
  FAIL=$((FAIL+1))
fi

# Check 2: email publiczny w privacy.html + terms.html
for f in privacy.html terms.html returns.html; do
  if [ -f "$f" ] && ! grep -q "$EMAIL_PUB" "$f"; then
    echo "WARN: $f nie zawiera publicznego emaila $EMAIL_PUB"
    WARN=$((WARN+1))
  fi
done

# Check 3: domena w canonical
for f in privacy.html terms.html returns.html; do
  if [ -f "$f" ] && ! grep -q "https://${DOMAIN}/" "$f"; then
    echo "WARN: $f canonical nie zawiera https://${DOMAIN}/"
    WARN=$((WARN+1))
  fi
done

# Check 4: golden markers w plikach prawnych
for f in privacy.html terms.html returns.html index.html LEGAL_DATA.md LEGAL_TODO.md; do
  if [ -f "$f" ]; then
    COUNT=$(grep -cE 'ANTI-CORRUPTION-GOLDEN|<!-- *LEGAL *-->|DO[- ]NOT[- ]REMOVE' "$f" 2>/dev/null | head -n1 | tr -d '[:space:]')
    COUNT=${COUNT:-0}
    if [ "$COUNT" -eq 0 ]; then
      echo "FAIL: $f nie ma golden markers (ANTI-CORRUPTION-GOLDEN / LEGAL / DO NOT REMOVE)"
      FAIL=$((FAIL+1))
    fi
  fi
done

# Check 5: ostrzeżenie jeśli email nicolasworoszylo@gmail.com pokazany publicznie zamiast kontakt@
PUB_LEAK=$(grep -l "nicolasworoszylo@gmail.com" privacy.html terms.html returns.html index.html 2>/dev/null | head -5)
if [ -n "$PUB_LEAK" ]; then
  echo "WARN: nicolasworoszylo@gmail.com znaleziony w publicznych plikach (powinien być kontakt@):"
  echo "$PUB_LEAK" | sed 's/^/  - /'
  WARN=$((WARN+1))
fi

# Check 6: limit miesięczny
MAX_SALES=$(jq -r '.pricing.max_sales_per_month' BUSINESS_DATA.json)
ESCAL=$(jq -r '.pricing.escalation_at' BUSINESS_DATA.json)
echo "INFO: monthly cap $MAX_SALES sales (escalation at $ESCAL)"
echo "INFO: RODO audit commit: $RODO_COMMIT"

echo "=== Wynik: $FAIL FAIL, $WARN WARN ==="
[ "$FAIL" -gt 0 ] && exit 1
exit 0
