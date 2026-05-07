# Stripe — kompletna instrukcja konfiguracji

**Cel:** doprowadzić Stripe do stanu, w którym po wpłacie 699 zł:
1. Klient dostaje markowany e-mail "Receipt — Zaproszenia Online" (nie generic Stripe)
2. `payment_status='paid'` w Supabase aktualizuje się automatycznie
3. Klient i operator dostają mail z naszego systemu (Resend) — krok osobny

**Czas:** ~25 min. **Co potrzebujesz:** dostęp do Stripe Dashboard (`zamowienia@zaproszeniaonline.com`).

---

## 1. Branding (5 min)

**URL:** https://dashboard.stripe.com/settings/branding

| Pole | Wartość |
|---|---|
| Icon | upload `stripe-assets/icon-stripe-512.png` |
| Logo | upload `stripe-assets/logo-stripe-512.png` |
| Brand color | `#2C3E2D` (forest green) |
| Accent color | `#C9A96E` (gold) |

→ **Save**

---

## 2. Customer emails (3 min)

**URL:** https://dashboard.stripe.com/settings/emails

Włącz wszystkie 3:
- ✅ **Successful payments** — receipt po sukcesie wpłaty
- ✅ **Refunds** — gdy zwrot pieniędzy
- ✅ **Failed payments** — gdy próba nieudana (informuje klienta że można spróbować ponownie)

**Język:** Polski (auto-detect na podstawie locale klienta — działa OK).

**Reply-to:** `kontakt@zaproszeniaonline.com`

→ **Save**

---

## 3. Webhook endpoint (10 min — KRYTYCZNE)

**URL:** https://dashboard.stripe.com/webhooks

### 3.1 Add endpoint

- Endpoint URL: `https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`
- Description: `Supabase leads sync — production`
- Events to send (zaznacz dokładnie te 3):
  - `checkout.session.completed`
  - `charge.refunded`
  - `payment_intent.payment_failed`
- API version: `2024-09-30.acacia` (najnowsza acacia, zgodna z naszym kodem)

→ **Add endpoint**

### 3.2 Skopiuj signing secret

Po utworzeniu zobaczysz kod typu `whsec_xxxxxxxxxxxxxxxx` — kliknij **Reveal** i skopiuj.

### 3.3 Wklej do Supabase

**URL:** https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/functions

Dodaj 2 secrety:
| Name | Value |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (z kroku 3.2) |
| `STRIPE_SECRET_KEY` | `sk_live_...` (z https://dashboard.stripe.com/apikeys → Secret key) |

→ **Save**

### 3.4 Test webhook

W Stripe Dashboard → Developers → Webhooks → klikinij na nasz endpoint → **Send test webhook** → wybierz `checkout.session.completed` → Send.

W zakładce "Recent events" powinieneś zobaczyć:
- HTTP 200
- Response body: `{"received":true}`

Jeśli 400 "Webhook signature verification failed" → sprawdź czy `STRIPE_WEBHOOK_SECRET` jest dokładnie taki sam jak w Stripe (bez spacji).

---

## 4. Product description (3 min)

**URL:** https://dashboard.stripe.com/products

Znajdź product (powinien być utworzony przy stworzeniu Payment Linka). Edytuj:

### Pola

| Pole | Wartość |
|---|---|
| Name | `Cyfrowe zaproszenie ślubne — pakiet kompletny` |
| Description | (skopiuj z `product-description-pl.md`) |
| Image | upload `logo-stripe-512.png` |
| Statement descriptor | `ZAPROSZENIA` (max 22 znaki — to widać na wyciągu karty klienta) |
| Metadata | `category=wedding-invitation, sku=ZO-DIGITAL-699-PL` |

### Cena
- 699 PLN — jednorazowo

→ **Save**

---

## 5. Polish receipt language

**URL:** https://dashboard.stripe.com/settings/emails — **Language preferences**

| Locale | Wartość |
|---|---|
| Default email language | `Polski (Polski)` |
| Receipt language | Auto-detect (wbazuje na language nagłówku przeglądarki klienta) |
| Receipt prefix | `R-` (np. R-2026-001) |

---

## 6. Tax settings (działalność nieewidencjonowana)

**URL:** https://dashboard.stripe.com/settings/tax

⚠️ **WAŻNE:** Nie jesteś podatnikiem VAT (działalność nieewidencjonowana).

| Pole | Wartość |
|---|---|
| Tax behavior | `Inclusive` (cena 699 zł zawiera już wszystko) |
| Tax registration status | **NIE WŁĄCZAJ** automatic tax — nie jesteś VAT-em |

Stripe NIE wyśle do klienta faktury VAT — wyślesz **rachunek** osobno (poza Stripe). Stripe receipt = potwierdzenie wpłaty, nie faktura.

---

## 7. Payment Link aktualizacja (opcjonalne)

Aktualny Payment Link: `https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01`

W Stripe Dashboard → Payment Links → edytuj ten link:

| Opcja | Włącz |
|---|---|
| Collect customer's name | ✅ |
| Collect customer's phone | ✅ |
| Collect billing address | ❌ (nie potrzebujemy do działalności nieewidencjonowanej) |
| Allow promotion codes | ✅ (przyda się przy kampaniach) |
| After payment redirect | `https://zaproszeniaonline.com/dziekujemy?session_id={CHECKOUT_SESSION_ID}` |
| Custom message after success | "Dziękujemy! W ciągu kilku minut otrzymasz e-mail potwierdzający, a w 24h link do podglądu Waszej strony." |

→ **Save**

---

## 8. Verify (5 min)

Po wszystkich krokach:

1. **Test mode payment** — w Stripe Dashboard → Developers → API keys → użyj test key. Kup test invitation przez `https://buy.stripe.com/test_xxx` (Stripe sam wygeneruje test version).

2. **Sprawdź:**
   - Otrzymujesz markowany Stripe receipt (logo, kolory, polski język)
   - Webhook zwrócił HTTP 200
   - W Supabase `leads` → najnowszy lead ma `payment_status='paid'`, `payment_id` i `payment_amount_pln`

3. **Po Resend setup:** dodatkowo sprawdź, że dostajesz `notify-new-lead` mail z naszym templatem.

---

## Troubleshooting

### Webhook zwraca 401
→ Sprawdź `verify_jwt: false` w Supabase Edge Function settings (powinno być już ustawione).

### Webhook zwraca 400 "Missing signature"
→ Brak secretu `STRIPE_WEBHOOK_SECRET` w Supabase. Wróć do kroku 3.3.

### Webhook zwraca 400 "Webhook signature verification failed"
→ `STRIPE_WEBHOOK_SECRET` w Supabase to inny secret niż w Stripe Dashboard. Wygeneruj nowy w Stripe (ten sam endpoint, "Roll secret"), wklej do Supabase.

### Klient dostaje generic Stripe receipt zamiast markowanego
→ Branding nie zapisał się. Wróć do kroku 1 i kliknij Save powtórnie.

### `payment_amount_pln` w bazie pokazuje 69900 zamiast 699
→ TO JEST PRAWIDŁOWE. Stripe trzyma kwoty w groszach (699 zł = 69900 groszy). Ten sam pattern jak Stripe API (amount field).

---

## Post-setup TODO (opcjonalne, później)

- Setup Apple Pay / Google Pay (wymaga weryfikacji domeny — 5 min)
- Setup BLIK as primary method (popularny w PL — 30% klientów wybiera)
- Subscription dla "express delivery 12h" (gdyby kiedyś dodać upsell)
- Recurring billing dla "anniversary website renewal" (1 rok po ślubie)
