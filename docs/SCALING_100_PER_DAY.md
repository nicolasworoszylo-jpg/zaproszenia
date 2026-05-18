# Scaling: 100 klientow / dziennie

**Cel:** workflow ktory obsluzy 100 nowych klientow dziennie bez bottlenecks.

## Aktualne capacity

| Element | Free tier | Pro | Bottleneck przy 100/dzien? |
|---------|-----------|-----|---------------------------|
| Vercel builds | 100/dzien hobby | 6000/m Pro ($20) | TAK na hobby, NIE na Pro |
| Vercel bandwidth | 100 GB/mc | 1 TB/mc Pro | NIE (1.9 MB/client x 100/dzien x 30 = 5.7 GB) |
| GitHub Actions | 2000 min/mc free | 3000 min/mc Pro ($4) | TAK na free (100/dzien x 1 min = 3000/mc), NIE na Pro |
| Git repo size | unlimited | unlimited | TAK po 6 mc (100 x 1.9MB x 30 x 6 = 34 GB - git LFS needed) |
| Supabase rows | 500K free | 8M Pro ($25) | NIE (RSVP/song_requests << 8M) |
| Supabase Storage | 1 GB free | 100 GB Pro | TAK po 6 dni (1 GB/180 MB), NIE na Pro |
| OVH API rate | "fair use" | tak samo | NIE (100 requests << limits) |
| Domain renewals | manual | manual | TAK (auto-renewal script needed) |

**Koszt 100 klientow/dziennie:** Vercel Pro $20 + GH Pro $4 + Supabase Pro $25 = **$49/mc** = $0.016/klient infrastruktura.

## Bottleneck strategies

### 1. Git repo size -> Git LFS lub Supabase Storage

**Problem:** 100 klientow x 1.9 MB binary (zdjecia) x 30 dni x 12 mc = **70 GB git repo** = clone time >5 min = dev experience destroyed.

**Strategia A (zalecana):** zdjecia w **Supabase Storage**, git tylko trzyma referencje (URLs).
- Zmiana w new-client.py: zamiast `cp photos_input/* nicolas-test/photos/`, upload do `supabase.storage.from('clients').upload('nicolas-test/01.jpg', file)`
- CONFIG.ourStoryHeartPhoto = `https://<supabase>.supabase.co/storage/v1/object/public/clients/nicolas-test/01.jpg`
- Git repo: 100 KB HTML + scripts per klient = 10 MB/dzien rocznie 3.5 GB - acceptable.

**Strategia B (alternatywna):** Git LFS dla `*.jpg` w klientach.
- `.gitattributes`: `<slug>/photos/*.jpg filter=lfs`
- Lokalnie git clone szybki (lazy fetch LFS).
- LFS storage: 1 GB free na repo, $5/mc za 50 GB Pro.

Rekomendacja: **A** (Supabase Storage) - juz uzywamy, jeden bill, RLS izolacja per slug.

### 2. Vercel build time

**Problem:** kazdy nowy klient = 30s Vercel build. 100/dzien = 50 min build/dzien. Wciaz OK ale wolno.

**Strategia:** vercel.json `ignoreCommand` - skip build jezeli zmiany tylko w `<inny-slug>/`. Vercel umie:
```json
{
  "git": {
    "deploymentEnabled": { "main": true }
  },
  "ignoreCommand": "git diff --name-only HEAD HEAD^ | grep -qE '^(_template_klient|docs|scripts)/' && exit 1 || exit 0"
}
```
To skip deploy jezeli zmiany tylko w template/docs/scripts (nie wpływaja na publicznie serwowane pliki).

### 3. OVH API rate

**Problem:** "fair use" - nieformalnie ~600 requests/godz. Przy wildcard CNAME ZERO requests na klient. Bez wildcard = 1 request POST + 1 refresh = 2 per klient. 100/dzien = 200 = OK.

**Strategia:** ZAWSZE wildcard CNAME (1x setup) - eliminuje API calls per klient.

### 4. Stripe webhook reliability

**Problem:** Webhook ze Stripe moze padac (rate limit, network). Brak = klient nie dostaje brief tokenu.

**Strategia:** Stripe ma auto-retry (exponential backoff 5x). Plus monitorowanie:
- Supabase `payments` table: status='paid', updated_at
- Cron daily (Vercel cron) checks: rows ze status='paid' AND brief_token IS NULL -> retry token generation.

### 5. Email deliverability

**Problem:** Resend free = 100 emails/dzien. 100 klientow x 3 maile (welcome + brief invite + ready) = 300 emails/dzien.

**Strategia:** Resend Pro $20/mc = 50K emails/mc = OK. Plus monitor bounce rate.

### 6. Domain SSL cert generation

**Problem:** Vercel LetsEncrypt cert per subdomain (CNAME wildcard).
**Strategia:** Wildcard DNS + wildcard SSL cert (juz dodane `*.zaproszeniaonline.com` do Vercel) - jeden cert dla wszystkich subdomen, generowany RAZ.

## Capacity per faza

### Faza 1 (do 5 klientow/tydz, MANUAL workflow)

- Nicolas manualnie wypelnia brief.json
- `python3 scripts/new-client.py briefs/<slug>.json --photos photos_input/`
- Skrypt: preflight -> commit/push -> OVH DNS -> smoke test
- Czas Nicolasa: 2-5 min/klient
- **STAN OBECNY** (2026-05-18)

### Faza 2 (5-50 klientow/tydz, BRIEF WIZARD)

- Brief Wizard self-service (RFC w `docs/BRIEF_WIZARD_RFC.md`)
- Supabase Storage dla zdjec
- GitHub Action workflow_dispatch trigger
- Czas Nicolasa: 0 min/klient
- **AKTYWACJA:** ~10-ty klient

### Faza 3 (50-500 klientow/tydz, PRO infra)

- Vercel Pro ($20/mc)
- GitHub Pro ($4/mc)
- Supabase Pro ($25/mc)
- Stripe ~$0.30/transakcja
- Storage migration zdjec do Supabase Storage (jezeli wciaz w git)
- Admin dashboard `/admin` (lista klientow, search, statusy)
- **AKTYWACJA:** ~30-50 klientow/tydz

### Faza 4 (500+ klientow/tydz, ENTERPRISE)

- Cloudflare CDN przed Vercel (cache failover)
- Backup strategy (daily git + storage snapshot)
- White-label dla agencji (subdomen subdomen?)
- Multi-region deployment
- 24/7 monitoring (Sentry, Datadog)
- **AKTYWACJA:** gdy biznes daje >$10K/mc

## Kluczowe metryki monitoring (gdy >10 klientow)

Vercel Analytics + Supabase Logs sledza:
- p95 deployment time (target <60s)
- 5xx error rate (target <0.5%)
- RSVP success rate (target >95%)
- Photo upload failure rate (target <1%)
- Subdomena SSL cert gen time (target <300s)
- Email deliverability (target >97%)
- New client end-to-end time (Stripe -> URL ready, target <90s)

## TL;DR

**Aktualnie 100/dzien moze obsluzyc Faza 1**, ale Nicolas spedzi 5h/dzien na recznym wypelnianiu briefow. **Realnie sustainable to ~10 klientow/dzien w Fazie 1**, potem trzeba Fazy 2.

Infrastrukturalnie do 500 klientow/dzien wszystko mozliwe za $49/mc Pro tier. Wymaga jedynie Pro plans + scripts/new-client.py + brief wizard (RFC).
