# Stripe Setup — zaproszeniaonline.com

> Od zera do działającej płatności online w **~15 minut** (bez webhook'a) lub **~45 min** (z webhookiem auto-update Supabase).

---

## Co już jest gotowe (od 2026-05-05)

Cała infrastruktura przygotowana — wystarczy wkleić jedno URL po stworzeniu Payment Link:

- ✅ Tabela `leads` ma 4 kolumny: `payment_status`, `payment_provider`, `payment_id`, `payment_amount_pln` (migration: `supabase/migrations/2026-04-30-add-payment-cols.sql`)
- ✅ **Strona sukcesu**: `/dziekujemy` (HTML z animowanym checkiem + next steps)
- ✅ **Strona anulowania**: `/platnosc-anulowana` (HTML z opcją "spróbuj ponownie")
- ✅ **Stripe button placeholder** w cenniku — ukryty (`hidden` attribute) dopóki nie wkleisz `data-stripe-link`
- ✅ **Edge Function** `supabase/functions/stripe-webhook/index.ts` — gotowa do deploy, obsługuje `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`
- ✅ **vercel.json** routing: `/dziekujemy` i `/platnosc-anulowana` dostępne (cleanUrls)

Twoje zadanie: 3 kroki.

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

W Stripe Payment Link Settings ustaw:
- **Success URL:** `https://zaproszeniaonline.com/dziekujemy`
- **Cancel URL:** `https://zaproszeniaonline.com/platnosc-anulowana`

Otwórz `index.html`, znajdź:

```html
<a href="#" data-stripe-link="" class="btn btn-stripe price-pay-cta" hidden>
```

Zamień na (wklej swój URL i USUŃ `hidden`):

```html
<a href="https://buy.stripe.com/abc123XYZ" data-stripe-link="https://buy.stripe.com/abc123XYZ" class="btn btn-stripe price-pay-cta">
```

(Albo nawet prościej: wystarczy wkleić URL w `data-stripe-link` — JS sam usunie `hidden` i ustawi `href + target=_blank` przy load.)

Po zmianie:
```bash
git add index.html && git commit -m "feat: live Stripe Payment Link" && git push
```

Vercel auto-deployuje w ~30s. Stripe button "Zapłać teraz 699 zł" pojawi się pod CTA "Chcę takie zaproszenie" w cenniku.

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

### C. Auto-update przez webhook (zalecane, ~30 min)

Edge Function jest już napisana w `supabase/functions/stripe-webhook/index.ts` — gotowa do deploy. Obsługuje:
- `checkout.session.completed` → automatycznie aktualizuje lead jako `paid` po e-mailu klienta
- `charge.refunded` → oznacza jako `refunded`
- `payment_intent.payment_failed` → oznacza jako `cancelled`
- Orphan handling: jeśli klient zapłaci bez wcześniejszego leada (np. forwarded link) → tworzy nowy wpis z `source='stripe-direct'`

**Deploy w 5 krokach:**

```bash
# 1. Zaloguj się do Supabase CLI (jeśli pierwszy raz)
npx supabase login

# 2. Link do projektu
cd /tmp/zaproszenia
npx supabase link --project-ref kuyniyyieejvambyjnxy

# 3. Set secrets (Stripe keys + Supabase service role)
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
# SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY są ustawione automatycznie

# 4. Deploy function
npx supabase functions deploy stripe-webhook --no-verify-jwt

# 5. W Stripe Dashboard → Developers → Webhooks → Add endpoint:
#    URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
#    Events: checkout.session.completed, charge.refunded, payment_intent.payment_failed
#    → Stripe wygeneruje signing secret (whsec_...) → wklej do STRIPE_WEBHOOK_SECRET (powtórz krok 3)
```

Po tym webhook działa 24/7. Każda płatność automatycznie aktualizuje status w Supabase, zero manual work.

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
