# Review Pipeline - dokumentacja

System zbierania i publikacji opinii klientów po zakończonej współpracy. Dwie ścieżki wywołania (manual + batch), zero infrastruktury własnej (wszystko na Supabase + Resend), full RLS, anti-spam, idempotent.

---

## Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PROŚBA O OPINIĘ (wysyłana na sygnał Nicolasa albo cronem)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  bash scripts/review-ops/send-review.sh <email>                 │
│       │                                                          │
│       ▼                                                          │
│  Edge Function: send-review-request                             │
│       │                                                          │
│       ├─→ generuje token (UUID v4)                              │
│       ├─→ UPDATE leads SET review_request_token=...,            │
│       │                       review_requested_at=now()         │
│       └─→ Resend → klient: "Macie 2 minuty?" + CTA              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (klient klika w mailu)
┌─────────────────────────────────────────────────────────────────┐
│  2. FORMULARZ /opinia?t=<token>                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Static HTML (Vercel): /opinia.html                             │
│       │                                                          │
│       ├─ 5-star rating (interactive)                            │
│       ├─ Textarea (max 2000 chars)                              │
│       ├─ Best part input (max 500 chars)                        │
│       ├─ Recommend toggle (Tak/Nie/Pominę)                      │
│       ├─ Display name (jak podpisać)                            │
│       ├─ Consent publish checkbox (→ 50 zł rabat)               │
│       └─ Honeypot field "website" (anti-bot)                    │
│                                                                  │
│       ▼ submit                                                   │
│  Edge Function: submit-review                                   │
│       │                                                          │
│       ├─ Validate token (UUID regex)                            │
│       ├─ Lookup leads by token (must exist)                     │
│       ├─ Check review_submitted_at IS NULL                      │
│       ├─ Honeypot check → silent insert + skip notification     │
│       ├─ INSERT INTO reviews (lead_id, rating, comment, ...)    │
│       └─ UPDATE leads SET review_submitted_at=now()             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (DB trigger reviews_notify_submitted)
┌─────────────────────────────────────────────────────────────────┐
│  3. NOTYFIKACJE                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Edge Function: notify-review-submitted                         │
│       │                                                          │
│       ├─→ Mail do operatora: "Nowa opinia ★★★★★ · Anna i M."   │
│       │   + jeśli rating ≤ 3: hero red + AKCJA 24h              │
│       │   + jeśli consent_publish=true: CTA "publikuj + 50zł"   │
│       │                                                          │
│       └─→ Mail do klienta:                                      │
│           ├─ rating ≥ 4 + consent: "Dziękujemy + kod POLEC50"   │
│           ├─ rating ≥ 4 + no consent: "Dziękujemy, każde słowo" │
│           └─ rating ≤ 3: "Dzięki za szczerość, odezwę się 24h"  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (operator po przeczytaniu - manual)
┌─────────────────────────────────────────────────────────────────┐
│  4. MODERACJA & PUBLIKACJA                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  bash scripts/review-ops/publish-review.sh                      │
│       │                                                          │
│       ├─ no args → POKAŻ pending (consent=true, published=false)│
│       ├─ --id <uuid> → SET is_published=true                    │
│       └─ --reject <uuid> "powód" → moderation_notes             │
│                                                                  │
│  Po is_published=true → v_published_reviews view → landing      │
│  (sekcja "Co mówią pary" widoczna dla anon przez RLS SELECT)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Komendy operacyjne (cheat-sheet)

### Wysłać prośbę o opinię - "na mój znak"

```bash
cd ~/Projekty/zaproszeniaonline.com

# Po e-mailu klienta (najszybsze)
./scripts/review-ops/send-review.sh anna.kowalska@example.com

# Po lead_id (jeśli klient ma kilka leadów na ten sam mail)
./scripts/review-ops/send-review.sh --id <uuid>

# Force (jeśli pierwszy mail nie dotarł, generuj nowy token)
./scripts/review-ops/send-review.sh --force --id <uuid>

# Pokaż kandydatów (paid + 7d po wydarzeniu / 14d po paid, brak request)
./scripts/review-ops/send-review.sh --candidates

# Batch (do 50 maili naraz - kandydaci automatycznie)
./scripts/review-ops/send-review.sh --batch --limit 20
```

### Zobaczyć i opublikować opinie

```bash
# Lista pending (klient zgodził się, czeka na moderację)
./scripts/review-ops/publish-review.sh

# Opublikuj konkretną opinię
./scripts/review-ops/publish-review.sh --id <review_uuid>

# Odrzuć (z powodem do moderation_notes)
./scripts/review-ops/publish-review.sh --reject <review_uuid> "wulgaryzm"
```

### Sprawdzić bazę bezpośrednio

```sql
-- Wszystkie opinie ostatnich 30 dni
SELECT r.id, r.created_at, r.rating, l.name, l.email,
       r.consent_publish, r.is_published, left(r.comment, 80) as preview
FROM reviews r JOIN leads l ON l.id = r.lead_id
WHERE r.created_at > now() - interval '30 days'
ORDER BY r.created_at DESC;

-- Kandydaci do prośby
SELECT * FROM v_review_candidates;

-- Kandydaci do reminderów (7+ dni po prośbie, brak submit)
SELECT * FROM v_review_reminder_candidates;

-- Co publikujemy (dla landingu)
SELECT * FROM v_published_reviews;

-- Statystyki
SELECT
  COUNT(*) FILTER (WHERE review_requested_at IS NOT NULL) AS asked,
  COUNT(*) FILTER (WHERE review_submitted_at IS NOT NULL) AS submitted,
  COUNT(*) FILTER (WHERE payment_status='paid') AS paid_total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE review_submitted_at IS NOT NULL)
        / NULLIF(COUNT(*) FILTER (WHERE review_requested_at IS NOT NULL), 0), 1) AS response_rate_pct
FROM leads;
```

---

## Setup (one-time)

### 1. Klucz service_role (już macie w Supabase Dashboard)

```bash
# Pobierz: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/api
# Zapisz lokalnie (chmod 600):
mkdir -p ~/.claude/secrets
echo "eyJhbGciOiJIUzI1NiIs..." > ~/.claude/secrets/zaproszenia-service-role.txt
chmod 600 ~/.claude/secrets/zaproszenia-service-role.txt
```

### 2. Klucz Resend (juz macie - wspolny dla wszystkich Edge Functions)

```bash
# Resend Dashboard → API Keys (już aktywne)
echo "re_NYVcGsWh..." > ~/.claude/secrets/resend-api-key.txt
chmod 600 ~/.claude/secrets/resend-api-key.txt
```

### 3. Aplikuj migrację Supabase

```bash
# Lokalnie przez Supabase CLI (jeśli linked):
supabase db push

# Albo przez Dashboard:
# https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/sql/new
# Wklej zawartość: supabase/migrations/20260513150407_review_pipeline.sql
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy send-review-request
supabase functions deploy submit-review
supabase functions deploy notify-review-submitted
```

W settings Edge Functions: wszystkie 3 ustaw `verify_jwt: false` (publiczny endpoint dla submit-review, DB-only dla notify, własny auth w send-review).

### 5. Test end-to-end

```bash
# 1. Wyślij sobie maila (na siebie):
./scripts/review-ops/send-review.sh nicolasworoszylo@gmail.com --force

# 2. Otwórz mail, kliknij CTA → otwiera /opinia?t=...
# 3. Wypełnij formularz, submit → /dziekujemy-za-opinie

# 4. Sprawdź w DB:
psql "..." -c "SELECT * FROM reviews ORDER BY created_at DESC LIMIT 1;"

# 5. Sprawdź skrzynki (operator + klient powinny dostać 2 maile)
```

---

## Brand tokens (synchroniczne z notify-* i landingiem)

```
--bg: #FAFAF8       background warm cream
--card: #FFFFFF     card pure
--ink: #0A0A0A      text primary
--ink-soft: #4A4A4A text secondary
--ink-mute: #999999 text tertiary
--accent: #2C3E2D   forest green
--accent-h: #1E2B1F forest darker
--gold: #C9A96E     accent gold
--cream: #FAF6EF    inverse text
--line: #EBEBEB     borders
fonts: Georgia/Fraunces italic (display) + Inter/-apple-system (body)
```

---

## Anti-spam & RLS

**Anti-spam (4 warstwy):**
1. Token jest UUID v4 - 122 bity entropii, nie da się zgadnąć
2. Token jest jednorazowy - INSERT do reviews + UPDATE leads.review_submitted_at zużywa
3. Honeypot field `website` w formularzu - bot wypełnia → submit OK ale flagged + no email
4. Unique constraint `reviews_one_per_lead` - DB-level
5. IP hash w `reviews.ip_hash` (SHA256+salt) do forensyki, bez retencji PII

**RLS (`reviews` table):**
- INSERT/UPDATE/DELETE: **denied dla anon** (tylko service_role przez Edge Function)
- SELECT: tylko `is_published=true` dla anon (czyli sekcja "Co mówią pary" działa)

**RODO:**
- `ip_hash` zamiast raw IP (jednokierunkowe, nie da się odtworzyć)
- `user_agent` truncated do 500 chars
- `referrer` truncated do 500 chars
- Brak retencji nieprzyklejonych logów (wszystko w 1 rzędzie reviews)
- Klient ma `email` i `name` w `leads` (już istniejące, nie kopiujemy)

---

## Edge cases obsłużone

| Sytuacja | Zachowanie |
|---|---|
| Klient klika 2× w mailu | drugi raz: "Opinia już wysłana" state |
| Token wygasł / zły | "Link nieaktywny" state |
| Brak tokenu w URL | "Brakuje linku" state |
| Bot wypełnia honeypot | INSERT z `honeypot_triggered=true`, brak emaila do operatora |
| Klient bez payment_status=paid | candidates view pomija (batch nie wyśle) |
| Rating ≤ 3 (negatywna opinia) | Operator dostaje czerwony hero + AKCJA 24h, klient dostaje empatyczny "odezwę się" zamiast generic "dzięki" |
| `force=true` w send-review-request | Generuje nowy token nawet jeśli już był - dla "resend" przy bounces |
| Resend zwraca 5xx | Edge Function zwraca 207 z error message w response |

---

## Future enhancements (jeśli kiedyś)

- **Reminder mail** (7 dni po prośbie, brak submit) - już mamy `v_review_reminder_candidates` view + `review_reminder_sent_at` column, brakuje tylko `send-review-reminder` Edge Function (4 godz pracy)
- **Photo upload** w formularzu - Supabase Storage bucket już jest, dodać `<input type="file">` + presigned URL
- **Auto-publish dla 5★** z text length > 50 - dodać `auto_publish_threshold` config
- **Slack notification** zamiast/oprócz emaila operatora - dodać webhook w `notify-review-submitted`
- **Schema.org `Review`** na landingu używając `v_published_reviews` - SEO win
