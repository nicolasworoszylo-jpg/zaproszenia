# LUZAK Pipeline - 100 klientow/tydz, ~50 min/tydz pracy Nicolasa

**Cel:** klient self-service od Stripe po LIVE URL bez Twojego dotyku.

## Stan obecny (po sesji 2026-05-18)

**MAMY:**
- ✅ OVH API w pelni dziala (16 records w zone, signed-request validated)
- ✅ Wildcard CNAME `*.zaproszeniaonline.com` -> Vercel
- ✅ Vercel `*.zaproszeniaonline.com` w project (SSL auto-generuje)
- ✅ `scripts/new-client.py` z preflight + smoke test
- ✅ `klient-start/index.html` - MVP form 4-step (TO BUILD: Edge Function)

**BRAKUJE do LUZAKA:**
- ⚠️ Supabase Edge Function `generate-from-form` (orchestrator)
- ⚠️ Supabase `briefs` table + RLS
- ⚠️ Supabase Storage bucket `client-photos` z RLS per-token
- ⚠️ GitHub Action `auto-client.yml` (workflow_dispatch)
- ⚠️ Email auto-flow rozszerzenie (welcome -> brief link -> ready notify)
- ⚠️ Subdomena root URL fix (path-based dziala, root URL serwuje main page)

## Full flow LUZAK

```
1. Klient platnosci Stripe (juz dziala)
   ↓
2. Edge Function `notify-payment-success`:
   - generate token UUID
   - INSERT do briefs table {token, email, paid=true, expires_at=now+30d}
   - SEND email "Wypelnij swoje zaproszenie: https://zaproszeniaonline.com/klient-start/?token=XYZ"
   ↓
3. Klient otwiera link, wypelnia 4-step form (~5 min):
   - Step 1: imiona, data, godzina, cytat
   - Step 2: ceremony venue + adres, reception venue + adres
   - Step 3: drag-drop 5 zdjec
   - Step 4: paleta (4 buttony) + gifts text + IBAN
   - Auto-save do localStorage co krok
   - "Wygeneruj" -> POST do /api/generate-from-form
   ↓
4. Edge Function `generate-from-form`:
   - Verify token w briefs table (paid=true, not expired)
   - Upload zdjec do Supabase Storage `client-photos/<slug>/`
   - Build brief.json
   - POST GitHub API: workflow_dispatch dla `.github/workflows/auto-client.yml`
     z inputs: { slug, brief_url, photos_zip_url }
   - UPDATE briefs SET status='generating'
   - Return: { slug, url: `https://<slug>.zaproszeniaonline.com/` }
   ↓
5. GitHub Action `auto-client.yml`:
   - checkout repo
   - install esbuild + python deps
   - download brief.json + photos.zip z Supabase
   - run python3 scripts/new-client.py briefs/<slug>.json --photos photos_input/
   - git auto-commit + push (Vercel auto-deploy)
   ↓
6. Vercel deploy (~30s) -> Edge Function webhook
   ↓
7. Edge Function `notify-invitation-ready`:
   - SEND email klientowi "Twoje zaproszenie LIVE: https://<slug>.zaproszeniaonline.com/"
   - SEND email Nicolasowi "Nowy klient <slug> ready - klik approve LUB nic nie rob (auto-approve po 24h)"
   - UPDATE briefs SET status='live'
   ↓
8. (Opcjonalne) Nicolas reviews via admin dashboard.
   24h-delete-window: jezeli klient zaskarzy w 24h, mozliwe rollback.
```

**Twoja praca:** 0 min/klient (poza ~50 min/tydz na review wyjatkow ~5% przypadkow).

## Co zostaje do zbudowania (4 sesje x ~2h kazda)

### Sesja A - Backend storage + token system (2h)

- [ ] Supabase migration: `briefs` table (token UUID PK, email, paid_at, expires_at, slug, data JSONB, status, created_at)
- [ ] RLS policy: anon INSERT/UPDATE jezeli token match + paid=true
- [ ] Supabase Storage bucket `client-photos` z RLS per-token
- [ ] Edge Function `generate-token` (wywolana po Stripe webhook)

### Sesja B - Edge Function generate-from-form (2h)

- [ ] `supabase/functions/generate-from-form/index.ts`
- [ ] Validate token + parse brief
- [ ] Upload base64 photos -> Storage
- [ ] Build brief.json + photos zip
- [ ] POST GitHub API: workflow_dispatch
- [ ] Error handling + retry

### Sesja C - GitHub Action + secrets (1.5h)

- [ ] `.github/workflows/auto-client.yml`
- [ ] GitHub Secrets: OVH_*, SUPABASE_SERVICE_KEY, etc.
- [ ] Self-test workflow
- [ ] Vercel deploy webhook -> notify-invitation-ready

### Sesja D - Email flow + admin (2h)

- [ ] Resend templates: 1) welcome+brief-link, 2) ready+url
- [ ] Edge Function `notify-invitation-ready` z webhook Vercel
- [ ] Admin dashboard `/admin?key=...` - lista briefs ze statusami
- [ ] 24h-delete-window: Edge Function on-demand delete subdomain

## Koszty (100/tydz, $/mc)

| Service | Plan | $/mc | Powod |
|---------|------|------|-------|
| Vercel | Pro | $20 | 100 deploys/dzien > hobby 100/dzien limit |
| GitHub | Pro | $4 | 3000 min/mc > free 2000 |
| Supabase | Pro | $25 | 100 GB Storage, 8M DB rows |
| Resend | Pro | $20 | 50K emails/mc |
| Stripe | - | 1.9% + 1zl | per transakcja |
| OVH | wlasna | $0 | wildcard CNAME juz jest |
| **Razem fixed** | | **$69/mc** | $0.017/klient infrastruktury |

Plus 1.9% Stripe na cene oferty (np. 700 zl x 1.9% = 13 zl).

## Timeline implementacji

| Tydz | Sesja | Co | Status |
|------|-------|-----|--------|
| Tydz 1 | Sesja A | Backend storage + token | Pending |
| Tydz 1 | Sesja B | Edge Function form -> generate | Pending |
| Tydz 1 | Sesja C | GitHub Action + secrets | Pending |
| Tydz 2 | Sesja D | Email flow + admin | Pending |
| Tydz 2 | Test | End-to-end test z prawdziwym Stripe payment | Pending |

**Realnie 2 tygodnie pracy do FULL LUZAK.**

## Czesciowy LUZAK (pomost - 1 sesja, ~2h)

Jezeli chcesz LUZAK juz teraz BEZ pelnej automatyzacji:

1. **Form dziala bez backendu** - klient wypelnia, POST do prosty endpoint Supabase Storage (anon insert).
2. **Nicolas dostaje email** "Nowy klient X submitted brief".
3. **Nicolas reka uruchamia:** `python3 scripts/new-client.py briefs/<slug>.json` (3 min/klient).
4. **100/tydz x 3 min = 5h/tydz.** Nie pelen LUZAK, ale klient nie wypelnia briefu recznie.

To jest pomost do FULL LUZAK przez ~2 tygodnie.

## Decyzje Nicolas wymagane

1. **Auto-approve czy manual review?**
   - Auto: 100% self-service, 0 min/klient, ryzyko swear words / problem content
   - Manual: 30 sek/klient review (50 min/tydz) bezpieczne
   - **Rekomendacja:** auto + 24h-delete-window + Nicolas dostaje notification ale nie wymagana akcja
2. **Czy buduje Faza A-D teraz czy etapami?**
   - Wszystko (~6-8h) - LUZAK gotowy za 2 sesje
   - Etapami - mozesz testowac w trakcie

3. **Czy nicolas-test ma byc usuniety jako "produkcyjny" przed pierwszym realnym klientem?**
   - Tak (cleanup)
   - Zachowaj jako template przykład
