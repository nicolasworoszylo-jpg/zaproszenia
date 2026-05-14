# Kod "HIPERFIKSACJA" — końcowa konfiguracja w Stripe Dashboard

**Status w kodzie:** ✅ Frontend rozpoznaje kod `HIPERFIKSACJA` (case-insensitive), pokazuje rabat 99%, cena spada z 699 zł → 7 zł, przekierowanie do Stripe z `prefilled_promo_code=HIPERFIKSACJA`.

**Co MUSISZ zrobić w Stripe Dashboard** (bez tego klient zobaczy 7 zł na stronie ale Stripe naliczy pełne 699 zł):

## Krok 1: Coupon
1. https://dashboard.stripe.com/coupons
2. Kliknij **+ New**
3. Wypełnij:
   - Type: **Percent off**
   - Percent off: **99**
   - Duration: **Once**
   - ID: `HIPERFIKSACJA` (lub auto, nie ma znaczenia)
   - Name: `Hiperfiksacja 99%`
4. **Create coupon**

## Krok 2: Promotion Code
1. https://dashboard.stripe.com/promotion-codes
2. Kliknij **+ New**
3. Wybierz coupon utworzony w Kroku 1
4. **Code:** `HIPERFIKSACJA` (dokładnie, wielkimi literami)
5. Restrictions: zostaw puste (lub ustaw max redemptions jeśli chcesz limit)
6. **Create**

## Krok 3: Allow promotion codes na Payment Link
1. https://dashboard.stripe.com/payment-links
2. Otwórz Payment Link: `buy.stripe.com/28E00i2UgfYsayo8XQgMw01`
3. **Edit** → zjedź do "Promotion codes" → toggle **"Allow promotion codes"** ON
4. **Save**

## Test po konfiguracji
1. Wejdź na zaproszeniaonline.com
2. Wypełnij formularz, w polu "Kod rabatowy" wpisz `Hiperfiksacja`
3. Pod inputem zobaczysz: `✓ -99% → 7 zł`
4. Submit button pokaże: `Zamawiam zaproszenie - ~~699 zł~~ 7 zł`
5. Klik → Stripe Checkout pokaże: **7 zł** (99% off applied)

## Co jeśli pominiesz Stripe setup?
- Strona pokaże 7 zł
- Po kliknięciu Stripe **zignoruje** parametr i pokaże 699 zł
- Klient się wkurzy

**Czas wymagany w Stripe:** ~3 min.
