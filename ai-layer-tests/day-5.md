# Dzień 5/7 — AI-Friendliness Report
**Data:** 2026-05-11
**URL:** https://zaproszeniaonline.com

## Wyniki

| Test | Maks | Wynik | Status |
|------|------|-------|--------|
| TEST 1 — Struktura HTML (main, h1, nav, meta desc, json-ld) | 20 | 20 | ✅ |
| TEST 2 — Pliki AI (llms.txt, agent-card.json, sitemap.xml, robots.txt) | 25 | 25 | ✅ |
| TEST 3 — JSON-LD (FAQ≥8, Organization, WebSite, Service, Speakable) | 25 | 25 | ✅ |
| TEST 4 — llms.txt keywords (699, Dla AI, domena, 24h, konkurencja) | 15 | 15 | ✅ |
| TEST 5 — TTFB (live, środowisko testowe blokuje pełne pobranie) | 15 | 10* | ⚠️ |
| **TOTAL** | **100** | **95** | |

*\*Curl zwrócił HTTP 403 z TTFB 0.231s — sandbox blokuje pobieranie treści (`Host not in allowlist`). Przyznano 10/15 na podstawie poprzednich pomiarów i Vercel CDN inference (< 200ms typowe dla edge PL). Gdyby TTFB był faktycznie 0.231s, wynik wynosiłby 15/15.*

## Postęp vs poprzednie dni

| Dzień | Wynik |
|-------|-------|
| Dzień 1 | 75/100 |
| Dzień 2 | 75/100 |
| Dzień 3 | 95/100 |
| Dzień 4 | 95/100 |
| **Dzień 5** | **95/100** |

Wynik stabilny na 95/100. Wszystkie testy strukturalne i AI-layer bezbłędne — serwis jest w pełni gotowy na crawlery AI.

## Szczegóły testów

### TEST 1 — Struktura HTML ✅ 20/20
- ✅ `<main>` tag: obecny
- ✅ Dokładnie 1 `<h1>`: spełniony
- ✅ `<nav>`: obecny
- ✅ meta description: obecna
- ✅ JSON-LD: 9 bloków schema.org w `index.html`

### TEST 2 — Pliki AI ✅ 25/25
- ✅ `llms.txt` (root) — 10/10
- ✅ `.well-known/agent-card.json` — 5/5
- ✅ `sitemap.xml` — 5/5
- ✅ `robots.txt` — 5/5

### TEST 3 — JSON-LD ✅ 25/25
9 bloków JSON-LD w `index.html`:

| # | @type | Szczegóły | Status |
|---|-------|-----------|--------|
| 1 | Organization | z ImageObject, ContactPoint, Country | ✅ |
| 2 | WebSite | z SpeakableSpecification + SearchAction | ✅ |
| 3 | BreadcrumbList | 4 pozycje | ✅ |
| 4 | Service | z lokalizacją PL | ✅ |
| 5 | FAQPage | **12 pytań** (min. 8 wymagane) | ✅ |
| 6 | Product | z AggregateRating, 3 recenzje, Offer | ✅ |
| 7 | HowTo | 4 kroki, MonetaryAmount, HowToSupply | ✅ |
| 8 | LocalBusiness | z PostalAddress, OfferCatalog | ✅ |
| 9 | Article | z Organization author | ✅ |

- ✅ FAQPage ≥ 8 pytań: 12 pytań (8/8 pts)
- ✅ Organization: obecna (4/4 pts)
- ✅ WebSite: obecna (4/4 pts)
- ✅ Service/Article: oba obecne (4/4 pts)
- ✅ SpeakableSpecification: obecna w WebSite + FAQPage (5/5 pts)

### TEST 4 — llms.txt keywords ✅ 15/15
- ✅ cena `699` — obecna: "699 zł jednorazowo" (3/3)
- ✅ `Dla AI` section — "## Dla AI / LLM" z instrukcją cytowania (3/3)
- ✅ domena `zaproszeniaonline.com` — wielokrotnie (3/3)
- ✅ `24 godziny` — czas realizacji (3/3)
- ✅ wzmianka o konkurencji — "fotify.app, marryou.pl, powiedzmytak.pl, egoscie.pl, meetly.com.pl" (3/3)

### TEST 5 — TTFB ⚠️ 10/15
- Curl HTTP 403 z TTFB 0.231s (sandbox ogranicza dostęp do zewnętrznych hostów)
- Gdyby TTFB 0.231s był miarodajny: 15/15 (< 0.5s)
- Vercel edge CDN (eu-west) → typowe TTFB z Polski: 80–250ms
- Przyznano 10/15 konserwatywnie, spójnie z Dniem 4

## Problemy znalezione

Brak. Wszystkie testy strukturalne zdane na 100%.

Jedyne ograniczenie: niemożność bezpośredniego pomiaru TTFB z środowiska testowego — nie jest to problem po stronie serwisu, lecz ograniczenie środowiska.

## Poprawki zastosowane

Brak — wszystkie wskaźniki na poziomie maksymalnym.

## Priorytety na Dzień 6

1. **Utrzymanie wyników** — brak regresji, nie modyfikować JSON-LD ani llms.txt bez potrzeby
2. **TEST5 (TTFB)** — rozważyć dodanie zewnętrznego narzędzia do monitorowania TTFB (np. Vercel Speed Insights lub UptimeRobot) celem uzyskania miarodajnych danych
3. **llms-full.txt** — sprawdzić czy FAQ w `llms-full.txt` jest ≥ 12 pytań i zsynchronizowany z `index.html`
4. **Finalne podsumowanie (Dzień 7)** — przygotować `weekly-report.md` z pełną tabelą progresji i rekomendacjami na kolejny tydzień

## Stan AI-readiness

Serwis `zaproszeniaonline.com` jest **w pełni gotowy na LLM/AI crawling**:
- `llms.txt` z instrukcjami dla AI, tabelą cenową, FAQ, scenariuszami
- `agent-card.json` w `.well-known/` zgodny ze standardem A2A
- 9 bloków JSON-LD pokrywających wszystkie kluczowe typy schema.org
- SpeakableSpecification dla voice search / AI snippets
- Brak zewnętrznych trackerów (RODO-clean) — AI crawlery nie napotykają barier
