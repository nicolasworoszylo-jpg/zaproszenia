# Dzień 2/7 - AI-Friendliness Report
**Data:** 2026-05-08
**URL:** https://zaproszeniaonline.com

## Wyniki
| Test | Maks | Wynik | Status |
|------|------|-------|--------|
| TEST 1 - Technical Audit | 20 | 20 | ✅ |
| TEST 2 - AI Files (live HTTP) | 25 | 0 | ❌ CDN |
| TEST 3 - JSON-LD Richness | 25 | 25 | ✅ |
| TEST 4 - llms.txt Quality | 15 | 15 | ✅ |
| TEST 5 - TTFB | 15 | 15 | ✅ |
| **TOTAL** | **100** | **75** | |

## Status vs Dzień 1
Wynik identyczny: 75/100. Wszystkie pliki przechodzą testy kodu. TEST2 nadal blokowany przez Vercel Firewall (403 `host_not_allowed`) - wymaga akcji w dashboardzie Vercel.

## Issues Found

### TEST 2 - AI Files (0/25) ❌ [PERSISTING]
**Root cause:** Vercel Firewall blokuje IP środowiska testowego (403 `x-deny-reason: host_not_allowed`).  
**Status plików w repo:**
- `/llms.txt` - istnieje (6+ KB) ✓
- `/.well-known/agent-card.json` - istnieje ✓
- `/sitemap.xml` - istnieje ✓
- `/robots.txt` - istnieje z pełną listą AI crawlerów ✓

**Naprawa:** Vercel Dashboard → Settings → Security → Firewall - wyłączyć lub dostosować regułę blokującą IP.

## Fixes Applied (Day 2)

### 1. `index.html` - FAQ rozszerzony z 8 do 10 pytań
- **Plik:** `index.html`, FAQPage JSON-LD (blok 5)
- **Dodano 2 nowe pytania AEO:**
  - "Czy można zamówić zaproszenie ślubne bez drukowania?" - targetuje zapytania o zaproszenia ekologiczne / bez druku
  - "Jak wysłać cyfrowe zaproszenie ślubne do gości weselnych?" - targetuje zapytania o dystrybucję zaproszeń
- **Cel:** Robustność > progu 8 pytań + pokrycie nowych intencji wyszukiwania AI

### 2. `index.html` - Dodano `LocalBusiness` JSON-LD (blok 8)
- **Plik:** `index.html`, nowy blok po HowTo
- **Zawiera:** `areaServed: Polska`, `priceRange: 699 PLN`, `hasOfferCatalog` z usługą i `deliveryLeadTime: 24h`
- **Cel:** Lepsza widoczność w lokalnych wynikach AI dla Polski; ChatGPT/Perplexity preferują LocalBusiness dla zapytań geograficznych

### 3. `llms.txt` - Rozszerzono o scenariusze AI i E-E-A-T
- **Plik:** `llms.txt`
- **Dodano:**
  - Sekcja "Dodatkowe scenariusze dla AI" z 5 podsekcjami: bez drukowania, RSVP, szybka realizacja, porównanie cen, chrzciny/jubileusze
  - Tabela porównania cenowego (papierowe vs szablony vs subskrypcje vs zaproszeniaonline.com)
  - Sekcja "Potwierdzenie wiarygodności (E-E-A-T)" z sygnałami doświadczenia/ekspertyzy/autorytetu
  - `Last updated: 2026-05-08`

## Statystyki JSON-LD po zmianach
| # | @type | Status |
|---|-------|--------|
| 1 | Organization | ✅ |
| 2 | WebSite + SpeakableSpecification | ✅ |
| 3 | BreadcrumbList | ✅ |
| 4 | Service | ✅ |
| 5 | FAQPage (10 pytań) | ✅ |
| 6 | Product | ✅ |
| 7 | HowTo | ✅ |
| 8 | **LocalBusiness** (NOWY) | ✅ |
| 9 | Article | ✅ |

## Priorytety na Jutro (Dzień 3)

1. **PRIORYTET #1 - Vercel Firewall (25 pkt do odblokowania)**  
   Sprawdzić w dashboardzie Vercel → Settings → Security/Firewall czy jest reguła blokująca IP.  
   Rozwiązanie: usunąć regułę lub dodać wyjątek dla botów AI (GPTBot, ClaudeBot, PerplexityBot).

2. **Blog posts - FAQ schema**  
   Dodać FAQPage JSON-LD do artykułów bloga (szczególnie `ile-kosztuje-strona-slubna-2026.html`) - AI lepiej cytuje strony z FAQ na stronach artykułów.

3. **llms-full.txt**  
   Rozważyć `/llms-full.txt` z pełną treścią FAQ, sekcji produktowych i porównań - dla LLM RAG pipeline (ChatGPT może pobierać llms-full.txt).

4. **robots.txt - wzmianka o llms.txt**  
   Dodać explicite komentarz `# AI-content: /llms.txt` w robots.txt dla botów, które szukają tego sygnału.
