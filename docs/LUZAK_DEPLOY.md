# LUZAK Deploy - krok po kroku (do czwartku 22-go test ze Stripe)

**Stan po sesji 2026-05-18:** Wszystkie pliki gotowe w repo. Wymaga 6 deploy steps przez Ciebie.

## Pliki dostarczone (commit po tej sesji)

| Plik | Rola | Status |
|------|------|--------|
| `supabase/migrations/20260518180000_briefs_self_service.sql` | DB schema + RLS | Apply via Supabase CLI |
| `supabase/functions/generate-from-form/index.ts` | Edge Function orchestrator | Deploy via Supabase CLI |
| `supabase/functions/notify-brief-ready/index.ts` | Email do klienta po payment | Deploy via Supabase CLI |
| `.github/workflows/auto-client.yml` | Auto-deploy klienta przez GH Action | Auto-active po push |
| `klient-start/index.html` | Wizard klienta (4-step form) | Vercel auto-deploy |
| `admin/index.html` | Twój admin dashboard | Vercel auto-deploy |

## DEPLOY STEPS (Twoja praca, ~30 min total)

### Step 1 - Apply migration Supabase (2 min)

**Opcja A** - via Supabase CLI:
```bash
cd ~/Projekty/zaproszeniaonline.com
supabase db push  # apply migration 20260518180000_briefs_self_service.sql
```

**Opcja B** - via Dashboard:
1. Otwórz https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/sql/new
2. Wklej zawartość `supabase/migrations/20260518180000_briefs_self_service.sql`
3. RUN

**Verify:** w Table Editor powinna pojawić się tabela `briefs`.

### Step 2 - Storage bucket `invitation-photos` (JUŻ ISTNIEJE - Dominika setup)

**UWAGA: BUCKET JUŻ JEST UTWORZONY przez Dominikę w OPCJA B pipeline.**
- Nazwa: `invitation-photos`
- Path convention: `processed/<slug>/`
- Public: YES, 10 MB limit
- MIME: jpeg/png/webp/avif

**Verify że istnieje:**
```bash
cd ~/Projekty/zaproszeniaonline.com
node scripts/_supabase-check.mjs
# Powinien pokazać "Bucket invitation-photos: ✓ istnieje"
```

**Jeśli nie istnieje** (mało prawdopodobne, ale dla pewności): tworzy się to przez `scripts/_supabase-check.mjs` lub manual w Dashboard. Spytaj Dominikę o `npm run photos:scan` jeśli problem.

**Storage RLS policy** - powinno już być (Dominika), ale dla pewności sprawdź w SQL Editor:
```sql
-- Verify czy istnieje policy "service_role full access" dla bucket invitation-photos
select policyname, definition from pg_policies
where schemaname='storage' and tablename='objects' and definition like '%invitation-photos%';

-- Jeśli pusty wynik:
create policy "service_role insert invitation-photos"
  on storage.objects for insert to service_role
  with check (bucket_id = 'invitation-photos');

create policy "anon read invitation-photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'invitation-photos');
```

### Step 3 - GitHub Secrets (5 min)

https://github.com/nicolasworoszylo-jpg/zaproszenia/settings/secrets/actions/new

Dodaj 2 sekrety:

```
SUPABASE_URL = https://kuyniyyieejvambyjnxy.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGc... (z Supabase Settings → API → service_role secret)
```

⚠️ **service_role** key - NIE commit do gita.

### Step 4 - Supabase Edge Function secrets (5 min)

```bash
cd ~/Projekty/zaproszeniaonline.com
# GITHUB_TOKEN - z https://github.com/settings/tokens/new
#   Scope: workflow (jedyny)
#   Expiration: 1 year (lub no expiration)
supabase secrets set GITHUB_TOKEN=ghp_xxxxx

# GITHUB_REPO już ma default w kodzie (nicolasworoszylo-jpg/zaproszenia)
# RESEND_API_KEY już ustawiony (z poprzednich Edge Functions)
```

### Step 5 - Deploy Edge Functions (3 min)

```bash
cd ~/Projekty/zaproszeniaonline.com
supabase functions deploy generate-from-form
supabase functions deploy notify-brief-ready
```

### Step 6 - Modify `notify-payment-success` (call notify-brief-ready) (5 min)

Edytuj `supabase/functions/notify-payment-success/index.ts` - po wysłaniu maila do klienta, wywołaj `notify-brief-ready`:

**Znajdź miejsce** gdzie wysyłany jest mail do klienta (`await sendResend(lead.email, ...)`) **PO TYM dodaj:**

```typescript
// LUZAK: wyślij token + link do brief wizarda
try {
  await fetch(`${SUPABASE_URL}/functions/v1/notify-brief-ready`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: lead.email,
      payment_id: lead.payment_id,
      name: lead.name,
    }),
  });
  console.log('[LUZAK] notify-brief-ready called for', lead.email);
} catch (e) {
  console.error('[LUZAK] notify-brief-ready failed:', e);
}
```

Potem `supabase functions deploy notify-payment-success`.

### Step 7 - End-to-end test (10 min)

```bash
# 1. Sprawdz czy URLs sa LIVE
curl -I https://zaproszeniaonline.com/klient-start/  # 200
curl -I https://zaproszeniaonline.com/admin/         # 200

# 2. Manual test brief creation (bez Stripe):
# W Supabase Dashboard SQL Editor:
INSERT INTO public.briefs (email, payment_id, status)
VALUES ('test@example.com', 'test_payment', 'awaiting_brief')
RETURNING token;
# -> dostajesz token UUID

# 3. Otworz https://zaproszeniaonline.com/klient-start/?token=<UUID>
#    Wypelnij 4-step form, wgraj 5 zdjec, submit
#    Powinien zwrocic: { slug, url }

# 4. GitHub Actions sprawdz: https://github.com/nicolasworoszylo-jpg/zaproszenia/actions
#    Workflow "Auto-client" powinien sie odpalic z slugiem

# 5. Po 60-90s sprawdz https://<slug>.zaproszeniaonline.com/
```

## Test w czwartek 22-go (Twój workflow)

1. Klient kupuje przez Stripe (700 zł)
2. Stripe webhook -> notify-payment-success -> notify-brief-ready
3. Klient dostaje email "Wypełnij swoje zaproszenie"
4. Klient klika -> wizard -> submit
5. GH Action runs ~60s
6. Klient dostaje email "Twoje zaproszenie LIVE: ..."
7. **Ty:** dostajesz powiadomienie + zaglądasz na `/admin/?key=...` raz dziennie

**Twoja praca:** 0 min/klient (poza occasional review).

## Troubleshooting

### Klient submituje ale `404 generate-from-form`
- Edge Function nie zdeployowana. `supabase functions deploy generate-from-form`

### GH Action `Permission denied`
- Brak `SUPABASE_SERVICE_KEY` w GH Secrets (Step 3)

### Klient dostał mail ale link `Invalid token`
- Token nie utworzony - sprawdź czy notify-brief-ready wywołane (Step 6)
- LUB token wygasł (>30 dni)

### `Storage upload failed: row violates policy`
- Bucket policy nie dodana (Step 2 SQL)

### Klient submituje ale GH Action nie startuje
- GITHUB_TOKEN nie ustawiony w Supabase secrets (Step 4)
- Token bez `workflow` scope

## Monitoring (po wdrozeniu)

- **Daily check `/admin/?key=`** - widzisz wszystkich klientów + statusy
- **Supabase Logs Edge Functions** - https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/functions
- **GitHub Actions runs** - https://github.com/nicolasworoszylo-jpg/zaproszenia/actions

## Co nie jest jeszcze w LUZAK (do dorobienia kiedyś)

- [ ] **Vercel deploy webhook** -> notify-invitation-ready (klient dostaje mail z URL gdy LIVE) - obecnie GH Action sam updateuje status, klient widzi URL na ekranie po submit
- [ ] **Hard-delete client** workflow (klient zmienia zdanie po LIVE) - obecnie soft delete (status='failed') + manual `git revert`
- [ ] **Subdomain root URL rewrite** fix - obecnie path-based działa, subdomain root URL pokazuje stronę główną (nice-to-have)
- [ ] **Rate limit** na `/klient-start/?token=...` (zapobieganie spam)
- [ ] **Auto-renewal hosting** (12 mc → email do klienta z opcją przedłużenia)
