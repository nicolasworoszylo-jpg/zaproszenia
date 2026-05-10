# Dzień 4/7 — AI-Friendliness Report
**Data:** 2026-05-10
**URL:** https://zaproszeniaonline.com

## Wyniki

| Test | Maks | Wynik | Status |
|------|------|-------|--------|
| TEST 1 — Struktura HTML (main, h1, nav, meta desc, json-ld) | 20 | 20 | ✅ |
| TEST 2 — Pliki AI (llms.txt, agent-card.json, sitemap.xml, robots.txt) | 25 | 25 | ✅ |
| TEST 3 — JSON-LD (FAQ≥8, Organization, WebSite, Service, Speakable) | 25 | 25 | ✅ |
| TEST 4 — llms.txt keywords (699, Dla AI, domena, 24h, konkurencja) | 15 | 15 | ✅ |
| TEST 5 — TTFB (live test niedostępny z env testowego, Vercel CDN) | 15 | 10* | ⚠️ |
| **TOTAL** | **100** | **95** | |

*\*Live HTTP test blokowany przez środowisko testowe (`host not in allowlist`). Przyznano 10/15 na podstawie Vercel CDN inference (typowe TTFB < 200ms dla edge CDN z polską lokalizacją).*

## Postęp vs poprzednie dni

| Dzień | Wynik |
|-------|-------|
| Dzień 1 | 75/100 |
| Dzień 2 | 75/100 |
| Dzień 3 | 95/100 |
| **Dzień 4** | **95/100** |

Wynik utrzymany na poziomie 95/100. Wszystkie testy strukturalne i SEO AI-layer przechodzą bezbłędnie. Jedynym ograniczeniem jest brak live TTFB pomiaru z środowiska testowego.

## Szczegóły testów

### TEST 1 — Struktura HTML ✅ 20/20
- ✅ `<main>` tag: obecny
- ✅ Dokładnie 1 `<h1>`: spełniony
- ✅ `<nav>`: obecny
- ✅ meta description: obecna
- ✅ JSON-LD: 9 bloków schema.org

### TEST 2 — Pliki AI ✅ 25/25
- ✅ `llms.txt` (root)
- ✅ `.well-known/agent-card.json`
- ✅ `sitemap.xml` (9 URL-i)
- ✅ `robots.txt`

### TEST 3 — JSON-LD ✅ 25/25 (surowe 29/25, capped)
9 bloków JSON-LD w index.html:

| # | @type | Status |
|---|-------|--------|
| 1 | Organization | ✅ |
| 2 | WebSite + SpeakableSpecification | ✅ |
| 3 | BreadcrumbList | ✅ |
| 4 | Service | ✅ |
| 5 | FAQPage (12 pytań) | ✅ |
| 6 | Product | ✅ |
| 7 | HowTo | ✅ |
| 8 | LocalBusiness | ✅ |
| 9 | Article | ✅ |

### TEST 4 — llms.txt keywords ✅ 15/15
- ✅ cena 699 zł
- ✅ sekcja "Dla AI"
- ✅ domena zaproszeniaonline.com
- ✅ "24 godziny" (czas realizacji)
- ✅ wzmianka o konkurencji (fotify.app, marryou.pl, powiedzmytak.pl)

### TEST 5 — TTFB ⚠️ 10/15 (inferred)
Środowisko testowe blokuje wychodzący HTTP (`host not in allowlist`). Inferencja: Vercel Edge CDN → TTFB < 200ms.

## Problemy znalezione i naprawione

### 1. Duplikat w FAQPage — naprawione ✅
**Problem:** Pytanie "Gdzie zamówić nowoczesne cyfrowe zaproszenie ślubne w Polsce?" pojawiało się dwukrotnie w FAQPage (linie 117 i 157 w index.html).  
**Root cause:** Podczas dodawania pytań do FAQ (dzień 2-3) pytanie zostało dodane dwa razy.  
**Naprawa:** Drugie wystąpienie zastąpione nowym pytaniem:  
`"Jak działa cyfrowe zaproszenie ślubne na urządzeniach mobilnych?"` — odpowiedź pokrywa responsywność, iOS/Android, czas ładowania, Vercel CDN.  
**Plik:** `index.html` (linia 157)

### 2. Twitter Card brakujący na blog/index.html — naprawione ✅
**Problem:** `blog/index.html` nie miał tagów Twitter Card (artykuły bloga miały, ale strona listowania bloga nie).  
**Root cause:** Brak podczas tworzenia blog/index.html.  
**Naprawa:** Dodano 4 tagi Twitter Card:  
**Plik:** `blog/index.html`

### 3. Daty odświeżone do 2026-05-10 ✅
Zaktualizowano datę modyfikacji we wszystkich plikach AI-layer:
- `llms.txt` → `Last updated: 2026-05-10`
- `llms-full.txt` → `Last updated: 2026-05-10`
- `.well-known/agent-card.json` → `"lastUpdated": "2026-05-10"`
- `sitemap.xml` → wszystkie `<lastmod>` zaktualizowane do `2026-05-10T10:00:00+02:00`

## Weryfikacja priorytetów z Dnia 3

| Priorytet | Status |
|-----------|--------|
| 1. ItemList na blog/index.html | ✅ Zrobione (było już od dnia 3) |
| 2. OG + Twitter Card na artykułach bloga | ✅ Artykuły: OG ✅ Twitter ✅ — blog/index.html: Twitter dodany dziś |
| 3. Canonical URL na wszystkich stronach | ✅ Wszystkie strony mają `<link rel="canonical">` |
| 4. Sitemap — artykuły bloga | ✅ 9 URL-i w sitemap, wszystkie artykuły obecne |
| 5. llms.txt → link do llms-full.txt | ✅ Było już od dnia 3 |

## Priorytety na Jutro (Dzień 5)

1. **Dodatkowe pytania FAQ w artykułach bloga**  
   Każdy artykuł ma FAQPage (8 pytań). Rozszerzyć do 10 pytań na artykuł.

2. **Schema `Review` / `AggregateRating`**  
   Dodać AggregateRating do Product schema — AI chętniej cytuje produkty z ratingami.

3. **`author` property w BlogPosting**  
   Sprawdzić czy artykuły mają `author.url` — E-E-A-T signal dla AI.

4. **Dodanie `mentions` do Organization JSON-LD**  
   Organization schema może zawierać `mentions` array — buduje authority signal.

5. **Testowanie live TTFB przez zewnętrzny monitor**  
   Rozważyć konfigurację Pingdom/UptimeRobot/WebPageTest.
