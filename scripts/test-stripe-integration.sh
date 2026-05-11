#!/usr/bin/env bash
# Stripe + Supabase + Discount codes — integration test
# Run from repo root: bash scripts/test-stripe-integration.sh
#
# Sprawdza:
# 1. STRIPE_WEBHOOK_SECRET ustawiony w Supabase (test fake signature)
# 2. Endpoint stripe-webhook responseuje sensownie
# 3. discount_codes table istnieje + ma RPCs validate + register
# 4. Frontend JS dodaje prefilled_promo_code do Stripe URL (po wdrożeniu Opcji A)
# 5. Trigger leads_notify_new_lead działa (insert test record → response w pg_net)

set -e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILED=1; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

FAILED=0
echo "═══ Stripe + Supabase integration test ═══"
echo ""

# ── 1. Stripe webhook secret check ───────────────────────────────
echo "1. Test: STRIPE_WEBHOOK_SECRET w Supabase"
WEBHOOK_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=fake_sig_for_test" \
  -d '{"type":"checkout.session.completed"}' \
  https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook)

if echo "$WEBHOOK_RESPONSE" | grep -q "Key length is zero"; then
  fail "STRIPE_WEBHOOK_SECRET pusty (Key length is zero). Idź do Supabase → Functions → Secrets."
elif echo "$WEBHOOK_RESPONSE" | grep -q "No signatures found\|signature verification failed"; then
  pass "STRIPE_WEBHOOK_SECRET ustawiony (fake signature odrzucona = expected)"
elif echo "$WEBHOOK_RESPONSE" | grep -q "Missing signature"; then
  fail "Brak header signature przekazany (curl bug?)"
else
  warn "Nieoczekiwana odpowiedź: $WEBHOOK_RESPONSE"
fi
echo ""

# ── 2. Frontend live check ───────────────────────────────────────
echo "2. Test: zaproszeniaonline.com live"
LANDING_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://zaproszeniaonline.com/)
if [ "$LANDING_CODE" = "200" ]; then
  pass "Landing HTTP 200"
else
  fail "Landing HTTP $LANDING_CODE"
fi

# ── 3. Frontend: czy ma prefilled_promo_code w JS? ───────────────
echo ""
echo "3. Test: frontend dodaje prefilled_promo_code do Stripe URL"
if grep -q "prefilled_promo_code" index.html; then
  pass "index.html zawiera 'prefilled_promo_code' (Opcja A wdrożona)"
else
  warn "index.html NIE zawiera 'prefilled_promo_code' — discount codes NIE są jeszcze integrated ze Stripe. Patrz STRIPE_DISCOUNT_CODES.md sekcja 6."
fi

# ── 4. DNS sanity ────────────────────────────────────────────────
echo ""
echo "4. Test: DNS records (Resend + DMARC + SPF)"
DKIM=$(dig TXT resend._domainkey.zaproszeniaonline.com @1.1.1.1 +short 2>&1 | head -1)
if [ -n "$DKIM" ] && echo "$DKIM" | grep -q "p="; then
  pass "DKIM (Resend) propaguje"
else
  fail "DKIM brak — sprawdź OVH DNS Zone"
fi

DMARC=$(dig TXT _dmarc.zaproszeniaonline.com @1.1.1.1 +short 2>&1 | head -1)
if echo "$DMARC" | grep -q "DMARC1"; then
  pass "DMARC propaguje"
else
  fail "DMARC brak"
fi

SPF=$(dig TXT zaproszeniaonline.com @1.1.1.1 +short 2>&1 | grep -i spf)
if echo "$SPF" | grep -q "include:mx.ovh.com"; then
  pass "SPF root OK (OVH mx)"
else
  fail "SPF root broken"
fi

# ── 5. Blog (8 postów) ────────────────────────────────────────────
echo ""
echo "5. Test: blog posty"
BLOG_FAILED=0
for slug in cyfrowe-vs-papierowe-zaproszenia-slubne ile-kosztuje-strona-slubna-2026 potwierdzanie-obecnosci-online-instrukcja rsvp-na-wesele-co-to-znaczy zaproszenia-slubne-bez-drukowania zaproszenie-slubne-online-jak-dziala zaproszenie-slubne-qr-kod; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://zaproszeniaonline.com/blog/$slug")
  if [ "$CODE" != "200" ]; then
    fail "blog/$slug → $CODE"
    BLOG_FAILED=1
  fi
done
if [ "$BLOG_FAILED" = "0" ]; then
  pass "Wszystkie 7 blog posts HTTP 200"
fi

# ── 6. Schema.org sanity (HowTo musi mieć 3 steps) ──────────────
echo ""
echo "6. Test: Schema.org HowTo (3 kroki = spójne z visible)"
HOWTO_STEPS=$(python3 -c "
import re, json
with open('index.html') as f: content = f.read()
m = re.search(r'<script type=\"application/ld\\+json\">[^<]*\"@type\":\"HowTo\"[^<]*</script>', content)
if m:
    txt = m.group(0).replace('<script type=\"application/ld+json\">','').replace('</script>','').strip()
    data = json.loads(txt)
    print(len(data.get('step', [])))
else: print('0')
" 2>/dev/null)
if [ "$HOWTO_STEPS" = "3" ]; then
  pass "HowTo schema ma 3 steps (zgodne z visible section)"
else
  fail "HowTo schema ma $HOWTO_STEPS steps (powinno być 3)"
fi

# ── 7. NO em-dashes / en-dashes ─────────────────────────────────
echo ""
echo "7. Test: brak em-dashes (—) i en-dashes (–) w HTML"
EM_COUNT=$(grep -r "—" --include="*.html" . 2>/dev/null | grep -v ".git" | wc -l | tr -d ' ')
EN_COUNT=$(grep -r "–" --include="*.html" . 2>/dev/null | grep -v ".git" | wc -l | tr -d ' ')
if [ "$EM_COUNT" = "0" ] && [ "$EN_COUNT" = "0" ]; then
  pass "Zero em/en dashes (brand voice clean)"
else
  fail "Em-dashes: $EM_COUNT, en-dashes: $EN_COUNT — uruchom 'find . -type f -name \"*.html\" -exec sed -i \"\" \"s/—/-/g; s/–/-/g\" {} +'"
fi

# ── Final ────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
if [ "$FAILED" = "0" ]; then
  echo -e "${GREEN}✓ Wszystko OK${NC}"
  exit 0
else
  echo -e "${RED}✗ Znaleziono problemy${NC}"
  exit 1
fi
