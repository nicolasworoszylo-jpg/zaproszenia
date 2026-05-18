# Bugi z sesji nicolas-test (2026-05-16 -> 2026-05-18) + prevention

**Cel:** Lista WSZYSTKICH bugow napotkanych przy budowie pierwszego standalone klienta + prevention check w `scripts/preflight-client.sh`.
**Zasada:** kazdy bug ma swoja linijke w preflight - nie wpadamy w to po raz drugi.

## Lista 8 bugow + ich prevention

### Bug 1 (KRYTYCZNY) - CSP blokuje unpkg.com

**Symptom:** "ladowanie zaproszenia..." nieskonczone na produkcji. Lokalnie dziala.
**Root cause:** `vercel.json` CSP `script-src 'self' ...` BEZ `unpkg.com`. CDN scripts (react/react-dom/supabase/babel) blokowane przez browser.
**Prevention check:** `! grep -q 'unpkg.com' <slug>/index.html` w preflight.
**Fix architectural:** self-host vendor lokalnie (`<slug>/vendor/react.min.js` etc) + pre-compile JSX przez esbuild.

### Bug 2 (KRYTYCZNY) - CSP blokuje fonts.googleapis.com

**Symptom:** fonty padaja do Georgia fallback.
**Root cause:** CSP `style-src 'self' 'unsafe-inline'` BEZ googleapis. `@import url('https://fonts.googleapis.com/...')` zablokowany.
**Prevention check:** `! grep -q 'fonts.googleapis' <slug>/index.html` + `! grep -q 'fonts.googleapis' <slug>/vendor/app.js`.
**Fix architectural:** self-host fonty w `<slug>/fonts/*.woff2` + `fonts/fonts.css` z `@font-face url('playfair.woff2')`.

### Bug 3 - Supabase CDN path 404

**Symptom:** `unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js` zwraca 404.
**Root cause:** path zmieniony w nowych wersjach (jest `.js`, nie `.min.js`).
**Prevention:** self-host wyklucza problem (uzywamy `<slug>/vendor/supabase.min.js` z naszego cache).
**Check:** `grep -q globalThis <slug>/vendor/supabase.min.js` (poprawny build eksponuje global).

### Bug 4 - Heart photo `left:98px`

**Symptom:** Heart-shape photo przesuniete o ~50% w prawo, czesc zdjecia poza widoczna ramka.
**Root cause:** Demo padding-bottom:100% aspect-ratio hack failuje gdy mobile CSS `.heart-ph{width:200px!important}` zmusza wrapper na 200x200. `position:absolute; width:100%; height:100%` z height:0 content area dawalo computed `left:98px`.
**Prevention:** w demo template `<div style={{aspectRatio:"1/1", margin:"0 auto", ...}}><img style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}}/></div>` - juz w `_template_klient/index.html`.

### Bug 5 - Photo paths absolutne `/photos/...` (relatywne tez source bugu)

**Symptom:** zdjecia 404 na produkcji.
**Root cause:** Relatywne `photos/01.jpg` na URL `/nicolas-test` (bez `/`) rozwijaly sie do `/photos/01.jpg` (root domain) zamiast `/nicolas-test/photos/01.jpg`.
**Prevention check:** w `<slug>/index.html` wszystkie scripts/links/photos absolute z slug prefix (`src="/<slug>/vendor/..."`, `href="/<slug>/photos/..."`).
**Fix architectural:** `scripts/new-client.py` po sed-replace robi `html.replace('src="vendor/', f'src="/{slug}/vendor/')` itd.

### Bug 6 - Gallery render z pustymi URL

**Symptom:** Przyciski "Dodaj zdjecia"/"Zobacz galerie" linkujace do "" (pusty href).
**Root cause:** Brief `gallery=no` ale `<Gallery/>` dalej renderuje w App + `guestPhotosUrl=""`.
**Prevention:** `_template_klient/index.html` ma `<Gallery/>` wyciety z App render (brief opcjonalny). Jezeli klient PROSI o gallery, dodaj wlasnie powrotem + wypelnij URLs.

### Bug 7 - V1 wspolna architektura (filozoficzny)

**Symptom:** Pierwsza wersja uzywala glownego `/vendor/`, `/fonts/`, `/favicon.*` shared. Nicolas zazadal ZERO shared.
**Prevention:** kazdy klient ma WLASNY `<slug>/vendor/`, `<slug>/fonts/`, `<slug>/photos/`. Favicon jako data URI inline w HTML. Footer bez linkow `/privacy /cookies /terms` (zero linkow do main site).

### Bug 8 - Commit message format (Repo Guardian)

**Symptom:** `git commit` rejected przez pre-commit hook.
**Root cause:** `commit-msg` wymaga `type(scope): subject` + body >=30 chars non-whitespace dla source changes.
**Prevention:** `scripts/new-client.py` commit z body szablonem `Co: ... Czemu: ... Test: ...`.

### Bug 9 (CRITICAL) - URL bez trailing slash bug

**Symptom:** "ladowanie..." stuck mimo wszystkich powyzszych fixow.
**Root cause:** URL `https://zaproszeniaonline.com/nicolas-test` (bez koncowego `/`) - browser interpretowal base URL jako root domeny. Relatywne `src="vendor/react.min.js"` rozwijaly sie do `https://zaproszeniaonline.com/vendor/react.min.js` (glowny /vendor/, nie `/nicolas-test/vendor/`). React/React-DOM/Supabase byly tam (200 z main vendor), ale `vendor/app.js` w glownym `/vendor/` NIE istnieje -> 404 -> React nigdy nie mountuje.
**Why nie zauwazone:** curl zwracal poprawny HTML i wszystkie assety 200 (sprawdzal absolute URLe). Symptom widoczny tylko w real browser ktory wykonuje JS i rozwija relative paths.
**Prevention check:** w preflight `grep -q 'src="/<slug>/vendor/app.js"' <slug>/index.html` (absolute path z slug).
**Fix architectural:** new-client.py po esbuild robi:
```python
html = html.replace('src="vendor/', f'src="/{slug}/vendor/')
html = html.replace('href="fonts/', f'href="/{slug}/fonts/')
html = html.replace('href="photos/', f'href="/{slug}/photos/')
```
Plus w `replace_config` photo paths auto-prefix z slugiem.

## Bonus problemy infrastrukturalne

### Vercel rewrite dla root URL subdomeny

**Status:** OPEN (path-based dziala, subdomena root URL `/` zwraca strone glowna).
**Workaround:** uzywaj path-based URL klienta `https://zaproszeniaonline.com/<slug>/`.
**Fix przyszly:** middleware function (Next.js) lub edge function ktora rewrite root path host-based.
**Non-blocking:** path-based jest "wystarczajace" dla pierwszych klientow.

### Vercel cache HIT po deploy

**Symptom:** `age: 2025` (>30 min) mimo nowego deploy.
**Workaround:** `vercel redeploy --target=production` lub force `vercel --prod`.
**Permanent fix:** Vercel cache-control headers immutable na vendor/fonts (juz jest), revalidate na index.html (juz jest).

## Smoke test (post-deploy)

Po `git push` zawsze: `bash scripts/smoke-test-client.sh <slug>` ktore sprawdza:
- HTML 200 i zawiera tytul personalizowany
- Wszystkie 6 assets (4 vendor + fonts.css + woff2) 200
- Brak unpkg w response
- Subdomena (warn jezeli SSL not ready)

## Refleksja na 100 klientow/dziennie

8 z 9 bugow to **architekturalne** decyzje. Po dziś (2026-05-18) `_template_klient/` + `scripts/new-client.py` ma WSZYSTKIE prevention wbudowane:
- Self-host vendor + fonts
- Pre-compile JSX (esbuild)
- Absolute paths z slug prefix
- Preflight checks PRZED commit (12 sprawdzen)
- Smoke test PO deploy (10 sprawdzen)
- OVH DNS auto (jezeli wildcard nie istnieje)

100 klientow/dziennie = mozliwe TYLKO bo new-client.py jest **idempotent + verifiable + auto-rollback friendly**.
