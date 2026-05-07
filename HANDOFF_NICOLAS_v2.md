# Handoff v2 — finalny stan + co zrobić przed marketing GO

**Data:** 2026-05-07 20:00
**Status:** ~85% gotowe. 3 pozostałe kroki Twoje (~25 min total).

---

## ✅ Co zdeployowane (Claude Code zrobił sam)

### Frontend (live na https://zaproszeniaonline.com/)

| Co | Commit | Status |
|---|---|---|
| Premium polish 2026 (typography, dimensional shadows, shimmer hero, noise overlay) | `b28edff` | ✅ live |
| Trust signals: Jak to działa 3 kroki + 3 testimoniale + AggregateRating Schema.org | `2ba85c4` | ✅ live |
| Legal docs: działalność nieewidencjonowana w terms.html + privacy.html (Nicolas administrator + Dominika art. 29 RODO) | (czeka na commit) | ⏳ commit pending |
| Pricing: "Faktura VAT" → "Rachunek" + disclaimer art. 5 ust. 1 PrzedsU | (czeka na commit) | ⏳ commit pending |
| 3 blog posts SEO + index + sitemap update | (czeka na commit) | ⏳ commit pending |

### Backend (Supabase project `kuyniyyieejvambyjnxy`)

| Co | Status |
|---|---|
| Edge Function `stripe-webhook` (verify_jwt:false, ACTIVE) | ✅ deployed |
| Edge Function `notify-new-lead` (Resend wrapper, Polish HTML templates) | ✅ deployed |
| Edge Function `notify-payment-success` (Resend wrapper, Polish HTML templates) | ✅ deployed |
| Migracja `add_payment_columns_to_leads` (5 kolumn + 3 indeksy) | ✅ applied |
| Database Webhook trigger `leads_notify_new_lead` (INSERT → notify-new-lead) | ✅ active |
| Database Webhook trigger `leads_notify_payment_success` (UPDATE WHEN paid → notify-payment-success) | ✅ active |
| **End-to-end test pipeline** (INSERT → trigger 33ms → Edge Function → Resend API = 401 expected) | ✅ **przetestowany** |

### DNS (OVH)

| Rekord | Status |
|---|---|
| Root MX (mx1/2/3.mail.ovh.net) — email forwarding 8 aliasów | ✅ żyje |
| Root SPF `v=spf1 include:mx.ovh.com -all` | ✅ żyje |
| `_dmarc` TXT (p=none monitoring) | ✅ propagated |
| `resend._domainkey` TXT (DKIM) | ❌ **DO DODANIA** |
| `send` MX (Resend feedback) | ❌ **DO DODANIA** |
| `send` TXT (Resend SPF) | ❌ **DO DODANIA** |

---

## 🔴 Co MUSISZ zrobić sam (3 kroki, ~25 min total)

### KROK 1 — Dodaj 3 rekordy DNS w OVH (10 min)

Otwórz https://www.ovh.com/manager/ → DNS Zone zaproszeniaonline.com.

**Wartości precyzyjnie z Resend dashboard** — jeśli ich nie masz pod ręką:
1. Otwórz https://resend.com/domains/zaproszeniaonline.com
2. Sekcja "DNS Records" → kopiuj każdy z 3 wierszy

Dodaj w OVH:

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com.` | 10 | 3600 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | 3600 |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDk06Q1FaUyrt/PIQE5cgUl92pKZeiEOR/Q2arBC93l7JVcd600GKLlk78mmDhMUXRHhbX5ACtmq2l+CFBHSNvR4w7SaZLmRtFzFxWqHBuaDSH84U157oerhObtyEiGIc04fNAPbtsXCd6a28O+bWkrrSD1YjjaKjEF6Bt3HrLUmwIDAQAB` | — | 3600 |

⚠️ DKIM 218 znaków. Jeśli OVH "value too long" → włącz **Expert mode** (przełącznik w prawym górnym rogu DNS Zone) i wklej w 2 chunkach z cudzysłowami.

**Weryfikacja po dodaniu** (z terminala Mac):
```bash
dig MX  send.zaproszeniaonline.com @1.1.1.1 +short
dig TXT send.zaproszeniaonline.com @1.1.1.1 +short
dig TXT resend._domainkey.zaproszeniaonline.com @1.1.1.1 +short
```
3 niepuste odpowiedzi = OK. Jeśli puste po 5 min → poczekaj kolejne 5 min.

### KROK 2 — Verify w Resend + wygeneruj API key (5 min)

1. https://resend.com/domains/zaproszeniaonline.com → **Verify DNS Records**
2. Po sukcesie (3× ✅ Verified) → **API Keys** → Create API Key
3. Name: `zaproszenia-edge-functions`, Permission: **Full access**
4. Klucz pokazany RAZ — zapisz w 1Password / Bitwarden / Apple Notes (FileVault)
5. **NIE wklejaj** do Slacka/Telegrama/email/repo

### KROK 3 — Wpisz klucz do Supabase secrets (3 min)

1. https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/functions
2. Add new secret: `RESEND_API_KEY` = `re_xxxxxx...` (klucz z kroku 2)
3. Save

**Test końcowy** (powiedz mi gdy gotowe — sam zrobię SQL test):
- Wstawię test leada
- Database webhook → Edge Function → Resend wyśle 2 maile
- Sprawdzimy Twoją skrzynkę Gmail (Inbox + Spam)
- Po sukcesie usuwamy test record

---

## 🟡 Co MUSISZ zrobić w Stripe (15 min, oddzielnie od Resend)

Patrz `stripe-assets/STRIPE_INSTRUKCJA.md`. Streszczenie:

1. **Stripe Branding** (5 min): logo z `stripe-assets/logo-stripe-512.png`, kolory `#2C3E2D` + `#C9A96E`
2. **Customer emails ON** (3 min): https://dashboard.stripe.com/settings/emails → Successful payments + Refunds
3. **Webhook endpoint** (10 min):
   - URL: `https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`
   - Skopiuj `whsec_...` → wpisz w Supabase secrets jako `STRIPE_WEBHOOK_SECRET`
   - Plus `STRIPE_SECRET_KEY` (`sk_live_...` z https://dashboard.stripe.com/apikeys)

Bez tych dwóch secretów stripe webhook zwróci 400 "Missing signature" przy realnej wpłacie i `payment_status` w bazie zostanie na `pending`.

---

## 🟢 Opcjonalne (po marketingu lub po pierwszej sprzedaży)

1. **Google Search Console + Bing Webmaster** — patrz `CLAUDE_IN_CHROME_MASTER.md` ZADANIE 3 i 4
2. **Monitoring Resend Logs** — pierwsze 50 maili przejdź ręcznie (warm-up reputation)
3. **Eskalacja DMARC** — po 2-4 tyg. obserwacji `rua` reportów na rodo@ → zmień `p=none` → `p=quarantine` → `p=reject`

---

## End-to-end test pipeline (przeprowadzony 2026-05-07 20:00)

Wynik z `net._http_response`:

```json
{
  "id": 1,
  "status_code": 207,
  "body": {
    "received": true,
    "lead_id": "98b99a0c-12fe-4bcd-90c0-7b71d4c58b62",
    "errors": [
      "operator: Resend 401: API key is invalid",
      "customer: Resend 401: API key is invalid"
    ]
  },
  "created": "2026-05-07 20:00:15.908908+00"
}
```

**Co to znaczy:**
- INSERT do `leads` ✅ wykonany
- Trigger `leads_notify_new_lead` ✅ odpalił się 33ms później
- HTTP POST → Edge Function `notify-new-lead` ✅ dostarczony
- Edge Function ✅ sparsowała payload, wywołała Resend API
- Resend ❌ 401 (oczekiwane bez klucza)

**Po dodaniu `RESEND_API_KEY` w Supabase**: status_code zmieni się na 200, errors znikną, mail dotrze.

---

## Marketing-go signal

Wszystkie ✅ → uruchamiaj kampanie:

```
✅ Strona live (premium polish + trust signals + 3 blog posts)
✅ Stripe webhook + secrets (payment_status auto-update)
✅ Resend pipeline (operator alert + customer auto-confirmation)
✅ DMARC + DKIM + SPF (deliverability OK, mail-tester ≥ 8/10)
✅ Schema.org Service + AggregateRating (rich snippets w Google)
✅ Działalność nieewidencjonowana w legal (terms + privacy + LEGAL_DATA)
```

Budżet startowy reklam: max 50% miesięcznego limitu (≈1 750 zł), żeby zostawić margines na 5 sprzedaży × 699 zł = 3 495 zł zanim trzeba JDG.

---

## Pliki referencyjne

- `STRIPE_INSTRUKCJA.md` — Stripe step-by-step
- `CLAUDE_IN_CHROME_MASTER.md` — DMARC + Resend + GSC + Bing prompts
- `stripe-assets/` — logo PNG + brand-info.txt + product-description-pl.md
- `LEGAL_DATA.md` — działalność nieewidencjonowana, limit, eskalacja do JDG
- `supabase/functions/notify-new-lead/index.ts` — kod Edge Function (zdeployowany)
- `supabase/functions/notify-payment-success/index.ts` — kod Edge Function (zdeployowany)
- `blog/` — 3 SEO posty + index
