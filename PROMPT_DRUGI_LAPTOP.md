# Prompt dla Claude Code na drugim laptopie

**Kopiuj WSZYSTKO niżej (między `═══`) i wklej w Claude Code na drugim laptopie.**

---

```
═══════════════════════════════════════════════════════════════════
ZADANIE: Weryfikacja Stripe + Kody rabatowe — zaproszeniaonline.com
═══════════════════════════════════════════════════════════════════

Pracujesz nad projektem zaproszeniaonline.com. Sklonuj/zaktualizuj repo
i wykonaj weryfikację jak niżej.

KROK 1 — Sklonuj/zaktualizuj repo
─────────────────────────────────
git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git ~/Projekty/zaproszenia 2>/dev/null \
  || (cd ~/Projekty/zaproszenia && git pull origin main)
cd ~/Projekty/zaproszenia

KROK 2 — Przeczytaj kontekst (5 min)
─────────────────────────────────
cat ONBOARDING_CLAUDE.md       # zasady + stack
cat PROJECT_STATUS.md          # live snapshot stanu
cat STRIPE_DISCOUNT_CODES.md   # status integracji kodów rabatowych
cat AUTOMATIONS.md             # webhooki + triggery

KROK 3 — Odpal automated test
─────────────────────────────────
bash scripts/test-stripe-integration.sh

Oczekiwane wyniki (po moim ostatnim commicie 87513c8 + nowym z prefilled_promo_code):
  ✓ STRIPE_WEBHOOK_SECRET ustawiony
  ✓ Landing HTTP 200
  ✓ index.html zawiera 'prefilled_promo_code' (po wdrożeniu Opcji A)
  ✓ DKIM/DMARC/SPF propagują
  ✓ Blog posts 200
  ✓ HowTo schema 3 steps
  ✓ Zero em-dashes

KROK 4 — Weryfikacja Stripe Dashboard (manualne, użyj Comet/Chrome)
─────────────────────────────────
A. https://dashboard.stripe.com/webhooks
   Sprawdź endpoint:
     URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
     Events (DOKŁADNIE te 3):
       ☑ checkout.session.completed
       ☑ charge.refunded
       ☑ payment_intent.payment_failed
   Zakładka "Recent events" → sprawdź czy są ostatnie events z 200 (sukces).
   Status zgłoś: ✅/❌

B. https://dashboard.stripe.com/payment-links
   Otwórz nasz Payment Link (URL kończy się na ...28E00i2UgfYsayo8XQgMw01).
   Edit → sprawdź:
     Allow promotion codes: ☑ ON ?
     Jeśli NIE — włącz i Save.
   Status zgłoś: ✅/❌

C. https://dashboard.stripe.com/coupons
   Sprawdź czy są coupons. Jeśli pusta lista — patrz KROK 5.
   Lista codes: zgłoś (np. KORCZEW10, FOTO_KOWALSKI_15, ...)

D. https://dashboard.stripe.com/settings/branding
   Sprawdź:
     Icon: jest ?
     Logo: jest ?
     Brand color: #2C3E2D ?
     Accent color: #C9A96E ?
   Status zgłoś: ✅/❌

E. https://dashboard.stripe.com/settings/emails
   Sprawdź "Customer emails" — wszystkie 3 toggle ON:
     ☑ Successful payments
     ☑ Refunds
     ☑ Failed payments
   Status zgłoś: ✅/❌

KROK 5 — Utwórz przykładowe coupon-y (jeśli nie ma)
─────────────────────────────────
Dla pierwszych partnerów wykonaj per coupon:

A. https://dashboard.stripe.com/coupons → "+ New"
   - Type: "Percent off"
   - Discount: np. 10% (lub inne wg umowy)
   - Duration: "Once"
   - Name (admin): np. KORCZEW10
   - Create

B. https://dashboard.stripe.com/promotion-codes → "+ New"
   - Select coupon (utworzony powyżej)
   - Code: KORCZEW10 (taki sam — to ważne)
   - (Optional) max redemptions, expires_at
   - Create

C. Wpisz kod do Supabase (SQL editor):
   https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/sql/new

   INSERT INTO public.discount_codes (code, owner_name, owner_email, discount_pct, active, max_uses, notes)
   VALUES ('KORCZEW10', 'Hotel Korczew', 'kontakt@hotelkorczew.pl', 10, true, 50, 'Partner od Q2 2026');

   (Powtórz dla każdego partnera, dostosuj parametry.)

KROK 6 — End-to-end test flow z kodem
─────────────────────────────────
W terminalu (Supabase MCP albo SQL editor):

  -- TEST 1: Insert lead z kodem rabatowym
  INSERT INTO public.leads (name, email, phone, event_date, package, source, message, affiliate_code, affiliate_discount_pct)
  VALUES ('Test Para', 'TWOJ-EMAIL@gmail.com', '+48000000000',
          '2026-12-31', 'leśna zieleń', 'verifier-test-discount',
          'Test integracji kodów rabatowych', 'KORCZEW10', 10)
  RETURNING id;

  -- TEST 2: Sprawdź czy trigger odpalił
  SELECT pg_sleep(5);
  SELECT id, status_code, content::text FROM net._http_response
  WHERE created > now() - interval '20 seconds'
  ORDER BY created DESC LIMIT 3;

  -- Oczekiwane: status_code 200, body {"received":true,...}

  -- TEST 3: Manual test prefilled_promo_code w Stripe
  -- Otwórz w przeglądarce (replace TEST-LEAD-ID z RETURNING wyżej):
  -- https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01?prefilled_email=TWOJ-EMAIL@gmail.com&client_reference_id=TEST-LEAD-ID&prefilled_promo_code=KORCZEW10
  -- Stripe Checkout powinien pokazać:
  --   - Email pre-filled
  --   - Promo code pre-filled
  --   - Cena 629 zł (zamiast 699 zł, jeśli 10%)
  --
  -- NIE PŁAĆ — zamknij. To test UI.

  -- TEST 4: Cleanup
  DELETE FROM public.leads WHERE source = 'verifier-test-discount';

KROK 7 — Raport dla Nicolas
─────────────────────────────────
Wyślij na Telegram/Signal raport TAK/NIE:

  A. Webhook endpoint istnieje + 3 events: TAK/NIE
  B. Allow promotion codes ON: TAK/NIE
  C. Coupons w Stripe (nazwij ile): N
  D. Branding (logo + kolory): TAK/NIE
  E. Customer emails (3 toggle ON): TAK/NIE
  F. Test trigger leads → status 200: TAK/NIE
  G. Stripe Checkout pokazuje prefilled discount: TAK/NIE
  H. Anything unexpected?

═══════════════════════════════════════════════════════════════════
```

---

## Podsumowanie tego co już zrobione (kontekst dla drugiego Claude Code)

Te rzeczy ja właśnie wykonałem na tym laptopie (zacommitowane):

1. ✅ JS fix w `index.html` — dodaje `prefilled_promo_code` do Stripe URL jeśli kod ważny
2. ✅ `STRIPE_DISCOUNT_CODES.md` — pełna architektura + 3 opcje + step-by-step Stripe setup
3. ✅ `scripts/test-stripe-integration.sh` — automated test, 7 kategorii sprawdzenia
4. ✅ Em-dashy globalnie usunięte (855 wystąpień)
5. ✅ Price badge "Najczęściej wybierany" usunięty
6. ✅ HowTo schema sync z visible section (3 kroki zamiast 4)

Co zostało po stronie Stripe Dashboard (na drugim laptopie):
- Utworzenie coupons + promotion codes per partner
- Toggle "Allow promotion codes" na Payment Link
- Wpisanie kodów do `discount_codes` table w Supabase
- Walidacja przez `scripts/test-stripe-integration.sh`
