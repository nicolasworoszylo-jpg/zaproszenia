# Submit do Google Search Console + Bing Webmaster Tools — krok po kroku

Stan początkowy: domena `zaproszeniaonline.com` jest live na Vercelu z gotowym `sitemap.xml` i `robots.txt` (oba zwracają HTTP 200 publicznie). Ten dokument prowadzi przez dodanie domeny do GSC i Bing oraz przesłanie sitemap.

**Czas: 10 minut na obie usługi.** Wystarczy raz.

---

## Co zyskujesz

- **Google Search Console (GSC)** — monitoring jak Google widzi stronę: indexed pages, queries, clicks, CTR, średnia pozycja, Core Web Vitals z prawdziwych użytkowników, błędy mobile, indexing issues, eligibility for rich results
- **Bing Webmaster Tools (BWT)** — to samo dla Bing + pośrednio dla **ChatGPT Search** (ChatGPT używa indeksu Bing przez Microsoft Copilot integration). Dla GEO to ważniejsze niż wielu myśli

---

## CZĘŚĆ A — Google Search Console

### A.1 — Dodaj domenę

1. Otwórz `https://search.google.com/search-console/welcome`
2. Zaloguj się kontem Google (najlepiej tym samym którego używasz do innych narzędzi marki)
3. Wybierz typ: **„URL prefix"** (NIE „Domain" — chyba że masz dostęp do DNS i wolisz weryfikację DNS dla wszystkich subdomen na raz)
4. Wpisz: `https://zaproszeniaonline.com`
5. Klik **Continue**

### A.2 — Weryfikacja własności (wybierz JEDNĄ z 3 metod)

#### Metoda 1: HTML meta tag (NAJSZYBSZA — rekomendowana)

GSC pokaże ekran z fragmentem typu:
```html
<meta name="google-site-verification" content="abc123XYZ_PRZYKLAD_LOSOWY_KOD" />
```

1. Skopiuj **tylko wartość atrybutu `content`** (np. `abc123XYZ_PRZYKLAD_LOSOWY_KOD`)
2. W repo edytuj `index.html`. Znajdź sekcję:
   ```html
   <!-- TODO: po dodaniu domeny w GSC, wklej tutaj kod weryfikacyjny:
        <meta name="google-site-verification" content="WKLEJ_TUTAJ_KOD_Z_GSC">
   ```
3. Odkomentuj i zastąp `WKLEJ_TUTAJ_KOD_Z_GSC` swoim kodem. Wynik:
   ```html
   <meta name="google-site-verification" content="abc123XYZ_PRZYKLAD_LOSOWY_KOD">
   ```
4. Commit i push:
   ```bash
   cd /tmp/zaproszenia
   git add index.html
   git commit -m "feat: GSC site verification meta"
   git push
   ```
5. Poczekaj ~30 s na deploy Vercel
6. W GSC kliknij **Verify**
7. ✓ Verified

#### Metoda 2: HTML file upload

GSC pokaże plik typu `google[hashlongstring].html` z zawartością:
```
google-site-verification: google[hashlongstring].html
```

1. Pobierz plik (lub stwórz lokalnie z dokładnie tą zawartością)
2. Wgraj do roota repo:
   ```bash
   mv ~/Downloads/google[hashlongstring].html /tmp/zaproszenia/
   cd /tmp/zaproszenia
   git add google[hashlongstring].html
   git commit -m "feat: GSC HTML file verification"
   git push
   ```
3. Sprawdź że plik jest publicznie dostępny:
   ```bash
   curl -s https://zaproszeniaonline.com/google[hashlongstring].html
   # Powinno zwrócić: google-site-verification: google[hashlongstring].html
   ```
4. W GSC kliknij **Verify**

#### Metoda 3: DNS TXT record

Najtrwalsza (nie znika nigdy), wymaga dostępu do panelu DNS domeny.

1. GSC pokaże TXT record typu `google-site-verification=WKLEJ_KOD`
2. W panelu rejestratora domeny (Cloudflare / OVH / Namecheap / itd.):
   - Dodaj rekord typu `TXT` na `@` (root domeny)
   - Wartość: `google-site-verification=WKLEJ_KOD`
   - TTL: domyślne (Auto)
3. W GSC kliknij **Verify** (może chwilę potrwać aż DNS się rozpropaguje — do 1 godziny)

### A.3 — Submit sitemap.xml

Po weryfikacji:

1. Lewe menu → **Sitemaps**
2. Wpisz: `sitemap.xml`
3. Klik **Submit**
4. Status powinien zmienić się na **Success** w ciągu kilku godzin (czasem dni)

### A.4 — Manualne zgłoszenie strony do indeksu (opcjonalnie, przyspiesza)

1. Górny pasek: wpisz `https://zaproszeniaonline.com/`
2. Po analizie: **Request Indexing**
3. Powtórz dla innych ważnych stron jeśli będą (np. `/cennik` jeśli zostanie odrębną podstroną)

### A.5 — Co dalej w GSC

Po 2-7 dniach pojawią się dane:
- **Performance** — queries, clicks, impressions, CTR, position
- **Pages** — które URL-e są zaindeksowane
- **Core Web Vitals** — INP/LCP/CLS field data z CrUX
- **Enhancements** — czy schema (Service, FAQPage, BreadcrumbList) jest poprawna i daje rich results
- **Manual actions** — czy Google nałożył karę (powinno być puste)

---

## CZĘŚĆ B — Bing Webmaster Tools

### B.1 — Dodaj domenę

1. Otwórz `https://www.bing.com/webmasters/`
2. Zaloguj się kontem Microsoft (lub utwórz)
3. Klik **Add a site**
4. Wpisz: `https://zaproszeniaonline.com`

**TIP — szybka droga:** jeśli masz już GSC zaweryfikowane, BWT oferuje **„Import from Google Search Console"** — jeden klik importuje stronę i sitemap. Pomija weryfikację. To najszybsze.

### B.2 — Weryfikacja własności (jeśli nie importujesz z GSC)

Bing daje 3 metody analogiczne do GSC:

#### Metoda 1: HTML meta tag (rekomendowana)

Bing pokaże:
```html
<meta name="msvalidate.01" content="ABC123XYZ" />
```

1. Skopiuj wartość `content`
2. W `index.html` odkomentuj i wklej:
   ```html
   <meta name="msvalidate.01" content="ABC123XYZ">
   ```
3. Commit + push (jak w A.2 metoda 1)
4. W BWT klik **Verify**

#### Metoda 2: XML file upload

Bing pokaże plik `BingSiteAuth.xml` z zawartością typu:
```xml
<?xml version="1.0"?>
<users>
  <user>ABC123XYZ_TWOJ_KOD</user>
</users>
```

1. Pobierz / stwórz plik z tą zawartością
2. Wgraj do roota repo:
   ```bash
   mv ~/Downloads/BingSiteAuth.xml /tmp/zaproszenia/
   cd /tmp/zaproszenia
   git add BingSiteAuth.xml
   git commit -m "feat: Bing Webmaster Tools site verification"
   git push
   ```
3. Sprawdź:
   ```bash
   curl -s https://zaproszeniaonline.com/BingSiteAuth.xml
   ```
4. W BWT klik **Verify**

#### Metoda 3: DNS TXT (jak w GSC, format `BingSiteVerification=KOD`)

### B.3 — Submit sitemap

1. Lewe menu → **Sitemaps**
2. Klik **Submit Sitemap**
3. Wpisz: `https://zaproszeniaonline.com/sitemap.xml`
4. Submit

### B.4 — IndexNow (bonus)

Bing oferuje **IndexNow API** — natychmiastowe powiadomienie o nowym/zmienionym URL-u (zamiast czekania aż crawler znajdzie). Dla małej strony to overkill, ale gdy zaczniesz blog z częstym contentem — warto.

---

## CZĘŚĆ C — Po obu submitach (sprawdzenie)

```bash
# Czy meta verification jest na produkcji?
curl -s https://zaproszeniaonline.com/ | grep -E "google-site-verification|msvalidate"

# Czy sitemap.xml dostępny?
curl -s -o /dev/null -w "%{http_code}\n" https://zaproszeniaonline.com/sitemap.xml

# Czy robots.txt poprawnie wskazuje sitemap?
curl -s https://zaproszeniaonline.com/robots.txt | grep Sitemap
```

---

## Często zadawane pytania

**Czy mogę użyć obu metod weryfikacji równocześnie?** Tak — meta tag + plik + DNS mogą koegzystować. Im więcej, tym mniejsze ryzyko że stracisz verified status (np. gdy przeniesiesz hosting).

**Co jeśli Vercel obsługuje moją domenę przez różne URL-e (z www / bez www, http / https)?** Zarejestruj **wszystkie 4 warianty** w GSC jako osobne properties. Dzięki temu zobaczysz traffic z każdego wariantu osobno. (Lub użyj typu „Domain property" w GSC z weryfikacją DNS — to obejmuje wszystkie warianty automatycznie.)

**Jak długo Google indeksuje nową stronę?** Zwykle 2-7 dni od pierwszej wizyty crawlera. Manual „Request Indexing" w GSC może to przyspieszyć do kilku godzin.

**Co z Yandex i Yandex Webmaster?** Dla rynku polskiego nieistotne. Skip.

**Co z DuckDuckGo?** DDG nie ma własnego indeksu — bierze wyniki z Bing. Dlatego BWT pokrywa też DDG.

**Czy zwiększa się ranking po dodaniu do GSC/BWT?** Nie — same dodanie nie poprawia pozycji. Ale dostarcza dane do dalszej optymalizacji. To diagnostyczne narzędzie, nie ranking signal.

---

## Co JESZCZE warto zrobić w GSC po weryfikacji

1. **Settings → Users and permissions** — dodaj wspólnika / asystenta jako Restricted user
2. **Setup email notifications** — aby dostawać alerty o crashach indexingu i karach
3. **Linki do Google Analytics** — jeśli używasz GA4, połącz z GSC dla pełnego widoku conversion path
4. **Review Core Web Vitals tab co tydzień** — mierzy field data z prawdziwych użytkowników, lab data z PageSpeed Insights to tylko podgląd

---

## Status repo (przed wykonaniem instrukcji)

- [x] `index.html` ma placeholder dla `google-site-verification` i `msvalidate.01` w sekcji `<!-- SEARCH ENGINE VERIFICATION -->`
- [x] `sitemap.xml` opublikowany na `https://zaproszeniaonline.com/sitemap.xml` (HTTP 200)
- [x] `robots.txt` wskazuje sitemap na `https://zaproszeniaonline.com/robots.txt`
- [x] `favicon.ico` + cały zestaw favicon-* + apple-touch-icon + site.webmanifest

Czas: po przejściu przez ten dokument koniec to:
- 1 commit z meta tagami GSC + Bing
- domena widoczna w obu narzędziach
- sitemap przyjęty
- monitoring on
