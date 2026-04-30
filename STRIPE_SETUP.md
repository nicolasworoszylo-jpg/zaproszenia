# Stripe Setup — zaproszeniaonline.com

> Od zera do działającej płatności online w **~15 minut**. Bez API keys w kodzie, bez webhook'ów (na start). Po prostu Payment Link.

---

## Co już jest gotowe

W `index.html` przy cenniku jest text:
> Płatność online (Stripe / BLIK / przelew) **po wycenie**

W `landing` masz lead form z polem `affiliate_code` (rabat) i submit do Supabase. Po stronie Supabase tabela `leads` ma już 4 nowe kolumny przygotowane pod płatność (patrz §3 niżej).

Twoje zadanie: wpiąć **Stripe Payment Link** który Klient klika po dostaniu od Ciebie e-mailowej wyceny.

---

## Krok 1: Załóż konto Stripe (5 min)

1. Idź na **[stripe.com/pl](https://stripe.com/pl)** → "Zarejestruj się"
2. E-mail służbowy: `kontakt@zaproszeniaonline.com` (jak go założysz) lub Twój prywatny
3. Hasło + 2FA (recommended: Authy / Google Authenticator)
4. Aktywacja konta — Stripe spyta o:
   - Forma działalności: **Jednoosobowa działalność gospodarcza** (lub spółka jeśli inaczej)
   - NIP/REGON
   - Adres firmy
   - Numer konta bankowego (do wypłat — wypłata co tydzień, automatycznie)
   - Skan dowodu osobistego (KYC)
5. Po aktywacji: trwa **0–48 h** weryfikacja. Możesz tworzyć Payment Linki od razu (test mode), real payments po weryfikacji.

**Stripe pobiera prowizję:** 1.5% + 1 zł od każdej polskiej karty (BLIK podobnie). Czyli z 699 zł → ~688 zł netto Tobie. Brak abonamentu, brak miesięcznego setup fee.

---

## Krok 2: Stwórz Payment Link (3 min)

W panelu Stripe (po lewej menu):

1. **Products** → **+ Add product**
2. Nazwa: `Cyfrowe zaproszenie ślubne — pakiet kompletny`
3. Opis: `Strona ślubna pod własnym URL z RSVP, planem dnia, mapami, galerią. Realizacja w 24h.`
4. Image: wgraj `og-image.png` z repo (`/tmp/zaproszenia/og-image.png`) lub własne zdjęcie
5. Pricing model: **One-time**
6. Cena: **699.00 PLN**
7. Save product → automatycznie tworzy się Price ID

Następnie:

1. **Payment Links** (lewe menu) → **+ Create payment link**
2. Wybierz produkt: "Cyfrowe zaproszenie ślubne…"
3. Quantity: locked, 1
4. **Confirmation page**:
   - "Show a confirmation page" (built-in) — domyślne, najprostsze
   - LUB "Don't show a confirmation page" + "Redirect customers to a URL after payment" → wpisz `https://zaproszeniaonline.com/dziekujemy` (możesz dodać tę stronę później; placeholder)
5. **Advanced**:
   - ✅ Collect customer info (email — automatyczne)
   - ✅ Collect billing address (do faktury VAT)
   - ✅ Allow promotion codes (jeśli chcesz dawać klientom kody zniżkowe Stripe-side oprócz Twoich affiliate codes)
6. Tax: jeśli jesteś VAT-owcem, włącz **Stripe Tax** (auto-collect). Jeśli korzystasz ze zwolnienia art. 113 — zostaw OFF.
7. **Create link**

Skopiuj URL — wygląda tak: `https://buy.stripe.com/abc123XYZ`.

---

## Krok 3: Wklej URL w landing (1 min)

Otwórz `index.html`, znajdź:

```html
<p class="price-pay-note">Płatność online (Stripe / BLIK / przelew) <strong>po wycenie</strong> — najpierw poznajmy się i ustalmy szczegóły.</p>
```

Zamień ten paragraf na:

```html
<p class="price-pay-note">
  Płatność online (Stripe / BLIK / karta) <strong>po wycenie</strong>.<br>
  <a href="WKLEJ_TUTAJ_TWÓJ_STRIPE_PAYMENT_LINK" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: underline;">Zapłać teraz 699 zł →</a>
</p>
```

> **Czemu po wycenie a nie od razu?** Bo niektóre wesela mają specyficzne wymagania (multi-language, custom domena, więcej rund poprawek). Najpierw chcesz dogadać szczegóły e-mailem, dopiero potem wysyłasz Klientowi link do zapłaty (ten sam Payment Link działa bez limitu) — albo dasz w landingu „od razu" jak chcesz.

Po zmianie:
```bash
git add index.html
git commit -m "feat: live Stripe Payment Link"
git push
```

Vercel auto-deployuje w ~30s.

---

## Krok 4 (opcjonalny): Workflow obsługi zapłaty

Po dokonaniu płatności przez klienta:

### A. Stripe wysyła Ci e-mail
Notyfikacja "Payment received: 699 PLN from anna@gmail.com". Tam masz email klienta + ID transakcji.

### B. W Twojej skrzynce zapytań (Supabase)
Lead z odpowiednim e-mailem już istnieje. Zaktualizuj go ręcznie:

```sql
UPDATE public.leads
SET payment_status = 'paid',
    payment_provider = 'stripe',
    payment_id = 'pi_3Abc...',  -- Stripe Payment Intent ID z e-maila
    payment_amount_pln = 69900   -- w groszy (699 PLN = 69900)
WHERE email = 'anna@gmail.com'
ORDER BY created_at DESC LIMIT 1;
```

Albo w UI Supabase Studio → tabela `leads` → kliknij wiersz → edit.

### C. (Advanced — później) Webhook
Jeśli chcesz auto-update Supabase:
1. W Stripe: Developers → Webhooks → +Add endpoint
2. URL: `https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`
4. Stripe da Ci `STRIPE_WEBHOOK_SECRET` — wstawisz do Supabase Edge Function env vars
5. Edge Function (deploy z `supabase/functions/stripe-webhook/index.ts`) verify signature + update `leads`

Czas implementacji webhooka: ~1h. Pokaż mi gdy będziesz gotowy.

---

## Krok 5: Tax invoice (VAT-FV)

Jeśli jesteś VAT-owcem, Stripe może automatycznie wystawić fakturę VAT z poprawnym NIP klienta i wysłać PDF na e-mail. Ustawienie:

1. Stripe → **Settings** → **Tax**
2. Kraj: Polska
3. NIP (sprzedawcy): wpisz swój
4. Stripe Tax: **Enable** (włącza auto-VAT 23% albo OFF jeśli jesteś zwolniony)
5. Settings → **Invoicing** → "Automatic invoicing" ON

Wtedy każda płatność = automatyczna FV PDF do klienta + Twoje archiwum.

Jeśli nie jesteś VAT-em (zwolnienie art. 113): Stripe wystawia rachunek (proforma), VAT nie nalicza, Ty wystawiasz rachunek ręcznie.

---

## Co masz w Supabase

Migracja SQL jest gotowa w pliku `supabase/migrations/2026-04-30-add-payment-cols.sql`. Apply przez Supabase Studio lub MCP:

```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_provider    TEXT,
  ADD COLUMN IF NOT EXISTS payment_id          TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount_pln  INTEGER;

COMMENT ON COLUMN public.leads.payment_status IS 'pending | paid | refunded | cancelled';
COMMENT ON COLUMN public.leads.payment_provider IS 'stripe | manual | other';
COMMENT ON COLUMN public.leads.payment_id IS 'Stripe Payment Intent ID lub external reference';
COMMENT ON COLUMN public.leads.payment_amount_pln IS 'Cena finalna w groszach (699 PLN = 69900)';
```

To wszystko. Reszta Twojej pracy = założyć konto Stripe + wkleić link.

---

## FAQ

**Q: Czy muszę być VAT-owcem żeby brać Stripe?**
A: Nie. Niezarejestrowany VAT-owiec = przychód na zwolnieniu, Stripe pobiera prowizję netto, Ty wystawiasz rachunek (lub fakturę bez VAT) ręcznie.

**Q: BLIK działa?**
A: Tak. Stripe BLIK aktywuje się automatycznie dla polskich klientów (Stripe wykrywa lokalizację). Klient widzi BLIK + karty + Apple/Google Pay.

**Q: A jak klient woli przelew?**
A: Stripe ma "Manual payment" / "SEPA Credit Transfer" — wolniejszy (1-3 dni do zaksięgowania), ale dostępny. Albo klient płaci tradycyjnie na Twój numer konta — Ty ręcznie aktualizujesz `payment_status='paid'` w Supabase.

**Q: Dlaczego nie PayU/Tpay/imoje?**
A: Ich provizja 2.5–3.5% wyższa niż Stripe (1.5%). Stripe = lepsza dokumentacja + global ready (jeśli kiedyś chcesz B2C w UE).

**Q: Co z RODO?**
A: Stripe ma DPA — w Twojej `privacy.html` sekcja "Odbiorcy danych" już wymienia "operator płatności online". Po implementacji upewnij się że specifically wymieniasz "Stripe Inc., USA" (DPA + transfer poza EOG na podstawie SCC).

---

**Ostatnia aktualizacja:** 30 kwietnia 2026
