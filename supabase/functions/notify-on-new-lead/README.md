# Edge Function: notify-on-new-lead

Wysyła powiadomienie e-mail do Nicolasa za każdym razem gdy ktoś wypełni formularz kontaktowy na landingu.

## Wymagania

1. Konto Resend (https://resend.com) — 3000 maili/m-c gratis (wystarczy na pierwszy rok)
2. Zweryfikowana domena `zaproszeniaonline.com` w Resend (3 rekordy DNS, ~10 minut)
3. Supabase CLI lokalnie: `npm install -g supabase` lub `brew install supabase/tap/supabase`

## Setup (~15 minut)

```bash
# 1. Login do Supabase CLI
supabase login

# 2. Link projektu (z folderu /tmp/zaproszenia)
supabase link --project-ref kuyniyyieejvambyjnxy

# 3. Ustaw sekrety (NIE commit-uj API key!)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set NOTIFY_EMAIL_TO=nicolasworoszylo@gmail.com

# 4. Deploy funkcji
supabase functions deploy notify-on-new-lead --no-verify-jwt

# 5. W Supabase Dashboard → Database → Webhooks → Create new webhook:
#    - Name: notify-new-lead
#    - Table: public.leads
#    - Events: ✓ Insert
#    - Type: HTTP Request
#    - URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-on-new-lead
#    - Method: POST
#    - Headers: pusty
```

## Test

```bash
# Symuluj nowy lead — wysyła test maila
curl -X POST "https://kuyniyyieejvambyjnxy.supabase.co/rest/v1/leads" \
  -H "apikey: sb_publishable_3XC8esfEtBvOOr78DgdRiA_wgzKEJJL" \
  -H "Authorization: Bearer sb_publishable_3XC8esfEtBvOOr78DgdRiA_wgzKEJJL" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"name":"Test Email","email":"test@example.com","event_type":"wesele","source":"test-email"}'

# Sprawdź skrzynkę — powinieneś dostać maila w 1-2s
# Logi funkcji: supabase functions logs notify-on-new-lead
```

## Co wysyła

Pełen szczegół leadu w eleganckim e-mailu z brand-em zaproszeniaonline.com:
- Imię, e-mail (klikalne mailto), telefon (klikalne tel:), data wydarzenia
- Typ wydarzenia, kod afiliacji (jeśli użyty), wiadomość, źródło
- Reply-To: e-mail leadu (możesz odpowiedzieć bezpośrednio z Gmail)
- Link do pełnego rekordu w Supabase Studio

## Troubleshooting

**"config_missing"** — nie ustawione `RESEND_API_KEY` lub `NOTIFY_EMAIL_TO`. Sprawdź:
```bash
supabase secrets list
```

**"send_failed"** — Resend odrzucił mail. Najczęstsze przyczyny:
- Domena `zaproszeniaonline.com` nieskonfigurowana w Resend (musisz dodać DNS)
- API key wygasł / unieważniony
- Limit free tier (3000/m-c) wyczerpany

**Brak maila po INSERT do leads** — webhook nie został aktywowany. Sprawdź w Dashboard → Database → Webhooks czy webhook istnieje i ma status Active.
