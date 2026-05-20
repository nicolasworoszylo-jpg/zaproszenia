# Template klienta zaproszeniaonline.com

Ten folder NIE jest serwowany publicznie (jest w `.vercelignore`).

## Workflow nowego klienta

```bash
# 1. Skopiuj brief.example.json i wypelnij dla klienta
cp _template_klient/brief.example.json briefs/anna-michal.json
nano briefs/anna-michal.json  # edytuj dane

# 2. Polozenie zdjec klienta w folderze
mkdir -p photos_input/
# Wrzuc 5+ zdjec .jpg do photos_input/ (5 sample = 1 heart + 4 side)

# 3. Generuj
python3 scripts/new-client.py briefs/anna-michal.json --photos photos_input/

# 4. Co skrypt zrobi automatycznie:
#    - cp _template_klient/ -> <slug>/
#    - sed-replace CONFIG, paleta, meta, INVITATION_SLUG
#    - cp photos_input/* -> <slug>/photos/
#    - update vercel.json (dodaje rewrite host-based)
#    - git add + commit + push (Vercel auto-deploy w 30s)
#    - wyswietla URL + DNS instrukcje
```

## Palety (4 opcje)

W brief: `"palette": "forest|navy|bordo|terracotta"`

- `forest` - lesna zielen (PALETTES[0]) - klasyczny rustic
- `navy` - granat + roz (PALETTES[1]) - elegancko nowoczesny
- `bordo` - bordo + kosc (PALETTES[2]) - winny luksus
- `terracotta` - rdzawa terracotta (PALETTES[3]) - sielski plener

## URL klienta

**Natychmiast (path-based, bez DNS):**
`https://zaproszeniaonline.com/<slug>/`

**Docelowo (subdomena, wymaga DNS w OVH):**
`https://<slug>.zaproszeniaonline.com/`

## DNS - 2 opcje

**A. Wildcard (RAZ NA ZAWSZE, dla wszystkich klientow):**
1. OVH Manager -> Web Cloud -> Domeny -> zaproszeniaonline.com -> DNS Zone
2. Add CNAME: subdomena `*` -> cel `cname.vercel-dns.com.`
3. Vercel CLI: `vercel domains add '*.zaproszeniaonline.com'`

Po tym - kazdy nowy klient = tylko git push, subdomena dziala bez dotykania OVH.

**B. Per klient (jesli nie chcesz wildcard):**
1. OVH: Add A record `<slug>` -> `76.76.21.21`
2. Vercel CLI: `vercel domains add '<slug>.zaproszeniaonline.com'`
3. Czekaj 15-60 min na propagacje

## Bezpieczenstwo

- Vercel.json rewrite host-based izoluje kazdego klienta (cross-tenant cache poison NIE mozliwe)
- Kazdy folder klienta ma `<meta robots="noindex,nofollow">` (private demo)
- INVITATION_SLUG unikalny per klient -> Supabase RLS izoluje RSVP per klient
