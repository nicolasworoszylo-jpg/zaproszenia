#!/usr/bin/env bash
# Verify Dominika's local setup — odpal na drugim laptopie
# Sprawdza: git sync, Stripe webhook secret, Resend domain, pipeline e2e
#
# Run from repo root:  bash scripts/verify-dominika.sh

set +e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILED=$((FAILED+1)); }
warn() { echo -e "${YELLOW}⚠${NC} $1"; WARNED=$((WARNED+1)); }
info() { echo -e "${CYAN}ℹ${NC} $1"; }

FAILED=0
WARNED=0

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " Verify Dominika's setup — zaproszeniaonline.com"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. Git status — czy lokalnie jest najnowszy main? ──────────
echo "[1/8] Git sync z origin/main"
git fetch origin --quiet 2>&1
LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
if [ "$LOCAL" = "$REMOTE" ]; then
  pass "Local main = origin/main ($LOCAL)"
else
  AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null)
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null)
  warn "Local: $LOCAL"
  warn "Remote: $REMOTE"
  warn "Ahead: $AHEAD commits, Behind: $BEHIND commits"
  info "Uruchom: git pull origin main"
fi

# ── 2. Czy najnowsze commity są lokalnie? ──────────────────────
echo ""
echo "[2/8] Ostatnie 3 commity (lokalnie)"
git log --oneline -3 2>/dev/null | sed 's/^/    /'

# ── 3. Stripe webhook secret check ─────────────────────────────
echo ""
echo "[3/8] Stripe webhook secret w Supabase"
WEBHOOK_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=fake_sig_for_test" \
  -d '{"type":"checkout.session.completed"}' \
  https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook 2>&1)

if echo "$WEBHOOK_RESPONSE" | grep -q "Key length is zero"; then
  fail "STRIPE_WEBHOOK_SECRET PUSTY (Key length is zero)"
  info "Akcja: Stripe Dashboard → Webhooks → Reveal signing secret → wklej do Supabase Functions secrets"
elif echo "$WEBHOOK_RESPONSE" | grep -qE "No signatures found|signature verification failed"; then
  pass "STRIPE_WEBHOOK_SECRET ustawiony (fake sig odrzucona = expected)"
else
  warn "Nietypowa odpowiedź: $(echo "$WEBHOOK_RESPONSE" | head -c 150)"
fi

# ── 4. STRIPE_SECRET_KEY — sprawdzamy pośrednio ─────────────────
echo ""
echo "[4/8] STRIPE_SECRET_KEY w Supabase (nie da się sprawdzić bez prawdziwej Stripe wpłaty)"
info "Manualne potwierdzenie: secret musi być ustawiony w Supabase Dashboard → Functions → Secrets"
info "Powinien zaczynać się od 'sk_live_' (lub 'sk_test_' jeśli używasz test mode)"
info "URL: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/functions/secrets"

# ── 5. Frontend live ────────────────────────────────────────────
echo ""
echo "[5/8] Frontend live (zaproszeniaonline.com)"
for url in "/" "/demo" "/blog" "/privacy" "/terms" "/one-pager.html"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://zaproszeniaonline.com$url")
  if [ "$CODE" = "200" ]; then
    pass "https://zaproszeniaonline.com$url → 200"
  else
    fail "https://zaproszeniaonline.com$url → $CODE"
  fi
done

# ── 6. DNS Resend ──────────────────────────────────────────────
echo ""
echo "[6/8] DNS records (Resend + DMARC)"
DKIM=$(dig TXT resend._domainkey.zaproszeniaonline.com @1.1.1.1 +short 2>&1 | head -1)
[ -n "$DKIM" ] && pass "DKIM Resend propaguje" || fail "DKIM brak"

DMARC=$(dig TXT _dmarc.zaproszeniaonline.com @1.1.1.1 +short 2>&1 | head -1)
echo "$DMARC" | grep -q "DMARC1" && pass "DMARC propaguje" || fail "DMARC brak"

SEND_MX=$(dig MX send.zaproszeniaonline.com @1.1.1.1 +short 2>&1 | head -1)
echo "$SEND_MX" | grep -q "amazonses" && pass "Resend MX send. propaguje" || fail "Resend MX brak"

# ── 7. Email pipeline (poprzez Edge Function log endpoint) ─────
echo ""
echo "[7/8] Edge Functions stale (Supabase API)"
NEW_LEAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-new-lead 2>&1)
[ "$NEW_LEAD" = "200" ] || [ "$NEW_LEAD" = "207" ] && pass "notify-new-lead reachable ($NEW_LEAD)" || warn "notify-new-lead returned $NEW_LEAD"

PAID=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-payment-success 2>&1)
[ "$PAID" = "200" ] || [ "$PAID" = "207" ] && pass "notify-payment-success reachable ($PAID)" || warn "notify-payment-success returned $PAID"

# ── 8. Stripe Dashboard checks (manualne) ──────────────────────
echo ""
echo "[8/8] Manualne sprawdzenie Stripe Dashboard (przez przeglądarkę):"
echo ""
echo "    □ https://dashboard.stripe.com/settings/branding"
echo "      • Logo wgrane: ✓ ?"
echo "      • Icon wgrany: ✓ ?"
echo "      • Brand color #2C3E2D: ✓ ?"
echo "      • Accent color #C9A96E: ✓ ?"
echo ""
echo "    □ https://dashboard.stripe.com/settings/emails"
echo "      • Successful payments ON: ✓ ?"
echo "      • Refunds ON: ✓ ?"
echo "      • Failed payments ON: ✓ ?"
echo ""
echo "    □ https://dashboard.stripe.com/webhooks"
echo "      • Endpoint istnieje: ✓ ?"
echo "        URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook"
echo "      • Events (DOKŁADNIE 3):"
echo "        ☑ checkout.session.completed"
echo "        ☑ charge.refunded"
echo "        ☑ payment_intent.payment_failed"
echo "      • Recent events: zakładka 'Events' powinna pokazać próbne (status 2xx)"
echo ""

# ── Final ──────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
if [ "$FAILED" = "0" ]; then
  echo -e "${GREEN}✓ AUTOMATED TESTS PASSED${NC}  (warnings: $WARNED)"
  echo ""
  echo "Następny krok: zerknij na 4 manualne checki w Stripe Dashboard (sekcja [8/8] wyżej)"
  echo "i prześlij Nicolasowi raport TAK/NIE."
  exit 0
else
  echo -e "${RED}✗ $FAILED automated test(s) failed${NC}  (warnings: $WARNED)"
  echo ""
  echo "Sprawdź sekcje wyżej oznaczone ✗ — w komentarzu jest sugerowana akcja."
  exit 1
fi
