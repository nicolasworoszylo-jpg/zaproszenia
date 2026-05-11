# Stripe + Kody Rabatowe — integracja

**Status:** ❌ NIE wdrożone. Frontend zbiera kod, baza zapisuje, ale **Stripe pobiera pełną cenę 699 zł** niezależnie od kodu.

**Wpływ biznesowy:** Klient z `KORCZEW10` (np. od Hotelu Korczew) przekonany że płaci 629 zł — zapłaci 699 zł. Domy weselne / fotografowie nie dostaną feedbacku że "ich kod działa".

---

## 1. Obecny stan (audyt)

### Frontend (`index.html`)

| Element | Stan |
|---|---|
| Input "Kod rabatowy" (linia 2702-2704) | ✅ jest |
| Live validation via RPC `validate_discount_code` | ✅ działa |
| Status display "✓ -10% (Owner)" | ✅ działa |
| Zapis `affiliate_code` + `affiliate_discount_pct` do bazy | ✅ działa |
| `register_discount_code_use` po sukcesie | ✅ działa |
| **Modyfikacja Stripe URL z discount** | ❌ **BRAK** |

### Stripe URL build (linia 3288-3298)

```js
const baseStripeUrl = 'https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01';
const params = new URLSearchParams({
  prefilled_email: email,
  client_reference_id: leadRow.id,
});
window.location.href = `${baseStripeUrl}?${params.toString()}`;
```

**Problem:** `params` nie zawiera kodu promocyjnego.

### Baza (`public.discount_codes`)

| Kolumna | Typ |
|---|---|
| `id` | uuid |
| `code` | text (UPPER, np. KORCZEW10) |
| `owner_name` | text (np. "Hotel Korczew") |
| `owner_email` | text |
| `discount_pct` | smallint (0-100) |
| `active` | boolean |
| `max_uses` | integer |
| `uses_count` | integer |
| `notes` | text |
| `expires_at` | timestamptz |

### Stripe Dashboard

- Payment Link: `https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01` (fixed 699 PLN)
- Coupons / Promotion Codes: ❓ nieznane (nie sprawdzimy bez Stripe API key)
- "Allow promotion codes" toggle na Payment Link: ❓ nieznane

---

## 2. Trzy ścieżki naprawy

### Opcja A: Stripe Promotion Codes + `prefilled_promo_code` (NAJSZYBSZE)

**Workflow:**
1. W Stripe Dashboard utwórz **Coupon** np. `KORCZEW10` = 10% off
2. Utwórz **Promotion Code** z tym samym kodem `KORCZEW10`
3. Na Payment Link włącz toggle "**Allow promotion codes**"
4. Frontend doda do URL: `?prefilled_promo_code=KORCZEW10`
5. Stripe checkout pokaże klientowi pre-filled kod i obniżoną cenę

**Pros:**
- Zero backend changes
- Wszystko po stronie Stripe (single source of truth dla rabatów)
- Klient widzi rabat w Stripe checkout

**Cons:**
- Musisz każdy kod utworzyć ręcznie w Stripe (dla 50+ partnerów = upierdliwe)
- Sync z `discount_codes` w Supabase — manualnie lub przez Stripe API

**Implementacja JS (do index.html ~linia 3294):**

```js
const params = new URLSearchParams({
  prefilled_email: email,
  client_reference_id: leadRow.id,
});

// NEW: jeśli kod ważny, dodaj prefilled_promo_code
if (affValidated && affValidated.valid && affRaw) {
  params.set('prefilled_promo_code', affRaw.toUpperCase());
}

window.location.href = `${baseStripeUrl}?${params.toString()}`;
```

**Czas wdrożenia:** 30 min Claude + 5 min Nicolas w Stripe Dashboard per coupon.

---

### Opcja B: Edge Function `create-checkout-session` (NAJBARDZIEJ ELASTYCZNE)

**Workflow:**
1. Frontend wysyła lead do Supabase + jednocześnie wywołuje Edge Function
2. Edge Function tworzy Stripe Checkout Session (server-side) z applied coupon
3. Edge Function zwraca `session.url`
4. Frontend redirect do tego URL

**Architecture:**

```
Frontend → POST /functions/v1/create-checkout-session
          ├─ body: { lead_id, email, affiliate_code }
          ↓
Edge Function:
  ├─ if affiliate_code → resolve coupon_id w Stripe (lub utwórz on-the-fly)
  ├─ stripe.checkout.sessions.create({
  │     line_items: [{ price: '699_PLN_PRICE_ID', quantity: 1 }],
  │     customer_email: email,
  │     client_reference_id: lead_id,
  │     discounts: [{ coupon: coupon_id }] || promotion_codes
  │     mode: 'payment',
  │     success_url: '...dziekujemy?session_id={CHECKOUT_SESSION_ID}',
  │     cancel_url: '...platnosc-anulowana',
  │   })
  ├─ return { url: session.url }
  ↓
Frontend → window.location.href = session.url
```

**Pros:**
- Pełna kontrola nad logiką cen
- Można dynamicznie tworzyć coupon w Stripe API per affiliate
- Łatwo dodać upsell ("Express 12h za 199 zł")

**Cons:**
- Więcej kodu (~100 linii Edge Function)
- Wymaga `STRIPE_SECRET_KEY` (już mamy)
- Wymaga utworzenia **Stripe Price object** (jednorazowo, np. `price_1Q...` za 699 PLN)

**Czas wdrożenia:** 2-3h Claude (Edge Function + frontend + test).

---

### Opcja C: Pre-discount na cenę + Stripe Custom Amount (NIE polecam)

**Workflow:**
- JS oblicza `final_amount = 699 - (699 * discount_pct / 100)`
- Stripe Payment Link w "Customer chooses amount" mode
- Klient widzi pre-filled amount

**Cons:**
- Stripe nie pokaże klientowi rabatu jako % off (tylko net price)
- Brak audit trail discount w Stripe
- "Customer chooses amount" mode = klient może zmienić amount (security hole)

**Werdykt:** Opcja A (najszybsze) lub B (najsolidniejsze). Skip C.

---

## 3. Rekomendacja

**Faza 1 (NOW):** Opcja A.

**Workflow:**
1. Nicolas/Dominika utworzą w Stripe Dashboard **5 coupons** dla pierwszych partnerów (5 × 10% off)
2. Dla każdego coupon utworzą Promotion Code z tym samym kodem
3. Wpiszą te kody do `public.discount_codes` w Supabase (z tym samym `code`, `discount_pct`, `owner_name`)
4. Włączą "Allow promotion codes" na Payment Link
5. Ja zmienię JS (1 commit, 4 linie kodu)

**Po Fazie 1:** klient z `KORCZEW10`:
1. Wpisuje kod w formularzu zaproszeniaonline.com
2. Widzi "✓ -10% (Hotel Korczew)" obok inputu
3. Submit form → Stripe URL z `?prefilled_promo_code=KORCZEW10`
4. Stripe checkout pokazuje pre-filled kod, cenę 629 zł, dyskaunt info
5. Klient płaci → Stripe webhook → Supabase UPDATE `payment_status='paid'` + `payment_amount_pln=62900`
6. Auto-email "Płatność potwierdzona 629 zł"

**Faza 2 (potem):** Opcja B jeśli będziemy mieli 20+ partnerów (każdy coupon manualnie = upierdliwe).

---

## 4. Test scenarios

### T1: Klient bez kodu
```
1. Wypełnij formularz bez affiliate_code
2. Submit → redirect na Stripe Payment Link bez ?prefilled_promo_code
3. Stripe Checkout pokazuje pełną cenę 699 zł
4. Klient płaci → webhook → leads.payment_amount_pln = 69900
```

### T2: Klient z ważnym kodem
```
1. Wypełnij formularz, wpisz KORCZEW10
2. Inline validation pokazuje "✓ -10% (Hotel Korczew)"
3. Submit → redirect na Stripe z ?prefilled_promo_code=KORCZEW10
4. Stripe Checkout pokazuje 629 zł (10% off applied)
5. Klient płaci → webhook → leads.payment_amount_pln = 62900
6. leads.affiliate_code = 'KORCZEW10'
7. discount_codes.uses_count += 1
```

### T3: Klient z nieważnym kodem
```
1. Wpisuje FAKE_CODE
2. Inline validation: "✗ Nieprawidłowy kod"
3. Submit dalej dopuszczalny (kod opcjonalny), ale form clears affiliate_code
4. Redirect na Stripe bez discount param
5. Klient płaci 699 zł
```

### T4: Klient ze ważnym ale wygasłym kodem
```
RPC validate_discount_code zwraca {valid: false, reason: 'expired'}
→ Frontend pokazuje "✗ Kod wygasł"
→ Reszta jak T3
```

---

## 5. Co Nicolas/Dominika muszą zrobić w Stripe Dashboard

### Krok 1: Utwórz Coupons (per partner)
1. https://dashboard.stripe.com/coupons
2. **+ New** → Type: "Percent off" → Discount: 10% → Duration: "Once"
3. Name: `KORCZEW10` (lub `FOTO_KOWALSKI_15`, etc.)
4. **Create coupon**

### Krok 2: Utwórz Promotion Code z tym samym kodem
1. https://dashboard.stripe.com/promotion-codes
2. **+ New** → wybierz coupon utworzony w Kroku 1
3. **Code:** `KORCZEW10` (taki sam jak code w `discount_codes` table)
4. (Optional) Customer email restriction, expiration, max redemptions
5. **Create**

### Krok 3: Włącz Promotion Codes na Payment Link
1. https://dashboard.stripe.com/payment-links
2. Otwórz nasz Payment Link (`buy.stripe.com/28E00i2UgfYsayo8XQgMw01`)
3. Edit → Toggle **"Allow promotion codes"** → ON
4. Save

### Krok 4: Sync do `discount_codes` w Supabase
W Supabase SQL editor:
```sql
INSERT INTO public.discount_codes (code, owner_name, owner_email, discount_pct, active, max_uses, notes)
VALUES 
  ('KORCZEW10', 'Hotel Korczew', 'kontakt@hotelkorczew.pl', 10, true, 50, 'Wprowadzony 2026-05-XX, partner od Q2 2026'),
  ('FOTO_KOWALSKI_15', 'Fotograf Kowalski', 'jan@kowalski.pl', 15, true, 30, 'Wedding photographer');
```

---

## 6. Implementacja JS (kiedy Stripe gotowy)

Plik: `index.html` ~linia 3294

```diff
       // Buduj Stripe URL z prefilled email + leadId i przekieruj OD RAZU
       submitBtn.textContent = 'Przekierowuję do płatności…';
       const baseStripeUrl = 'https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01';
       const params = new URLSearchParams({
         prefilled_email: email,
         client_reference_id: leadRow.id,
       });
+      // Jeśli kod rabatowy ważny, prefill go w Stripe Checkout
+      if (affValidated && affValidated.valid && affRaw) {
+        params.set('prefilled_promo_code', affRaw.toUpperCase());
+      }
       // Krótkie opóźnienie żeby user zobaczył komunikat
       setTimeout(() => {
         window.location.href = `${baseStripeUrl}?${params.toString()}`;
       }, 400);
```
