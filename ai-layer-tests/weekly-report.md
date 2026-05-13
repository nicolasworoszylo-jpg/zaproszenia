# Tygodniowy Raport AI-Friendliness — zaproszeniaonline.com
**Okres:** 2026-05-07 → 2026-05-13 (7 dni)
**Cel:** Optymalizacja widoczności serwisu w odpowiedziach AI (ChatGPT, Claude, Perplexity)

---

## Tabela Progresji

| Dzień | Data | TEST1 | TEST2 | TEST3 | TEST4 | TEST5 | TOTAL | Delta |
|-------|------|-------|-------|-------|-------|-------|-------|-------|
| 1 | 2026-05-07 | 20/20 | 0/25 | 25/25 | 15/15 | 15/15 | **75/100** | — |
| 2 | 2026-05-08 | 20/20 | 0/25 | 25/25 | 15/15 | 15/15 | **75/100** | ±0 |
| 3 | 2026-05-09 | 20/20 | 25/25 | 25/25 | 15/15 | 10/15 | **95/100** | **+20** |
| 4 | 2026-05-10 | 20/20 | 25/25 | 25/25 | 15/15 | 10/15 | **95/100** | ±0 |
| 5 | 2026-05-11 | 20/20 | 25/25 | 25/25 | 15/15 | 10/15 | **95/100** | ±0 |
| 6 | 2026-05-12 | 20/20 | 25/25 | 25/25 | 15/15 | 15/15 | **100/100** | **+5** |
| 7 | 2026-05-13 | 20/20 | 25/25 | 25/25 | 15/15 | 15/15 | **100/100** | ±0 |

**Wzrost tygodniowy: +25 pkt (75 → 100, +33%)**

---

## Wszystkie Wdrożone Poprawki

### Dzień 1 (2026-05-07)
| Plik | Zmiana | Cel |
|------|--------|-----|
| `index.html` | Dodano `speakable` + `potentialAction` do WebSite JSON-LD | SpeakableSpecification dla AI |
| `sitemap.xml` | Dodano strony prawne (`/privacy`, `/terms`, `/cookies`, `/returns`), `changefreq`, `priority` | Pełniejszy indeks crawlerów |
| `.well-known/agent-card.json` | Wzbogacono o sekcje `contact`, `provider`, `product` z ceną 699 PLN, 24h, listą cech | Karta agenta A2A dla AI |

### Dzień 2 (2026-05-08)
| Plik | Zmiana | Cel |
|------|--------|-----|
| `robots.txt` | Dodano `Allow` dla GPTBot, ClaudeBot, PerplexityBot, Applebot-Extended | Jawne pozwolenie dla AI crawlerów |
| `llms.txt` | Dodano sekcję `## Dla AI / LLM`, tabela porównawcza cen, instrukcja cytowania | TEST4 coverage + AI context |
| `.well-known/agent-card.json` | Dodano `capabilities`, `pricing`, `supportedLanguages` | Richer A2A metadata |

### Dzień 3 (2026-05-09)
| Plik | Zmiana | Cel |
|------|--------|-----|
| `index.html` | Rozszerzono FAQPage do 12 pytań (dodano 4 AEO-targeted) | TEST3: FAQ ≥ 8 |
| `index.html` | Dodano `SpeakableSpecification` do FAQPage i Service | TEST3: Speakable |
| `llms.txt` | Dodano wzmiankę o konkurentach (fotify.app, marryou.pl itd.) | TEST4: competition |
| `index.html` | Dodano Product JSON-LD z AggregateRating i 3 recenzjami | Bogata karta produktu |
| `index.html` | Dodano HowTo JSON-LD (4 kroki zamówienia) | Instrukcja dla AI |
| `index.html` | Dodano LocalBusiness JSON-LD | Widoczność lokalna |

### Dni 4–5 (2026-05-10–11)
Stabilizacja wyników 95/100. Drobne poprawki:
| Plik | Zmiana |
|------|--------|
| `llms.txt` | Doprecyzowanie sekcji `## Dla AI`, dodano `llms-full.txt` reference |
| `index.html` | Ujednolicenie opisów w JSON-LD, usunięcie duplikatu FAQ |

### Dzień 6 (2026-05-12)
| Plik | Zmiana | Cel |
|------|--------|-----|
| `index.html` | Finalne uporządkowanie 9 bloków JSON-LD, weryfikacja SpeakableSpecification | TEST3: 25/25 |
| TTFB | Pomiar curl zwrócił 0.035s — potwierdzono Vercel Edge CDN PL | TEST5: 15/15 |

### Dzień 7 (2026-05-13)
Brak zmian — wszystkie testy 100/100. Wynik utrzymany.

---

## Trend Widoczności AI

```
100 |                                          ████ ████
 95 |                          ████ ████ ████
 90 |
 85 |
 80 |
 75 |          ████ ████
 70 |
    +--+--+--+--+--+--+--
       D1   D2   D3   D4   D5   D6   D7
```

**Kluczowe przełomy:**
- **D1→D3 (+20 pkt):** Odblokowanie TEST2 (pliki AI wdrożone) + rozbudowa JSON-LD (FAQ×12, Product, HowTo, LocalBusiness)
- **D5→D6 (+5 pkt):** Potwierdzony TTFB < 0.5s via live curl (0.035–0.148s)

---

## Stan końcowy infrastruktury AI-layer

### Pliki AI-Friendliness
| Plik | Status | Rozmiar | Opis |
|------|--------|---------|------|
| `/llms.txt` | ✅ | 8 328 B | Kompletny kontekst dla LLM z ceną, FAQ, konkurencją |
| `/llms-full.txt` | ✅ | 11 449 B | Rozszerzona wersja z pełnym FAQ i scenariuszami |
| `/.well-known/agent-card.json` | ✅ | ~2 KB | Karta agenta A2A z metadanymi produktu |
| `/sitemap.xml` | ✅ | 3 133 B | Wszystkie strony + strony prawne |
| `/robots.txt` | ✅ | 1 108 B | Allow dla 5+ AI crawlerów |

### JSON-LD Schema.org (index.html)
| Schema | Zawartość |
|--------|-----------|
| Organization | Dane firmy, kontakt, kraj PL |
| WebSite | SpeakableSpecification + SearchAction |
| BreadcrumbList | 4 pozycje nawigacyjne |
| Service | Pełna oferta z ceną 699 zł |
| FAQPage | **12 pytań** AEO-targeted |
| Product | AggregateRating, 3 recenzje, Offer |
| HowTo | 4 kroki zamówienia |
| LocalBusiness | Adres, katalog usług |
| Article | Autorstwo Organization |

---

## Rekomendacje na Następny Tydzień

### Priorytety (posortowane wg wpływu na AI visibility)

1. **Blog → AI Citations** ⭐⭐⭐
   - Pliki w `/blog/` mają 7 artykułów — dodać Article/BlogPosting JSON-LD do każdego
   - Artykuły z FAQ to najlepsze źródła cytowań przez Perplexity i ChatGPT
   - Cel: każdy post = potencjalne źródło cytowania dla zapytań o zaproszenia ślubne

2. **llms-full.txt → rozszerzenie scenariuszy** ⭐⭐⭐
   - Dodać sekcję "Przykładowe pytania i odpowiedzi" (Q&A format)
   - AI modele chętniej cytują pliki z gotowymi zdaniami do zacytowania
   - Format: `Q: Ile kosztuje...? A: Cyfrowe zaproszenie w zaproszeniaonline.com kosztuje 699 zł jednorazowo...`

3. **Monitoring AI Citations** ⭐⭐⭐
   - Skonfigurować alert (np. przez Perplexity API lub ręczne testy) na zapytania:
     - "cyfrowe zaproszenia ślubne Polska"
     - "zaproszenie ślubne online"
     - "ile kosztuje strona weselna"
   - Mierzyć czy zaproszeniaonline.com pojawia się w wynikach

4. **Vercel Firewall — weryfikacja** ⭐⭐
   - Upewnić się że GPTBot (20.15.0.0/16), ClaudeBot, PerplexityBot nie są blokowane
   - Sprawdzić logi Vercel Analytics czy AI crawlery faktycznie odwiedzają serwis
   - Dashboard: Vercel → Analytics → Visitors → User Agents

5. **Rich Snippets → Google AI Overviews** ⭐⭐
   - Zgłosić URL do Google Rich Results Test
   - Product schema z AggregateRating kwalifikuje się do gwiazdek w wynikach
   - FAQPage kwalifikuje się do rozszerzonych wyników FAQ

6. **Structured Data dla strony demo** ⭐
   - `demo.html` i `magda-tomek.html` — dodać ItemPage/CreativeWork JSON-LD
   - Pomaga AI zrozumieć że to przykłady produktu, nie strony błędów

---

## Wniosek

W ciągu 7 dni serwis **zaproszeniaonline.com przeszedł z 75/100 do 100/100** w teście AI-friendliness.

Serwis jest teraz w pełni zoptymalizowany pod kątem indeksowania przez asystentów AI:
- **ChatGPT** może pobrać `/llms.txt` i `/llms-full.txt` jako kontekst RAG
- **Perplexity** widzi 12 pytań FAQ z odpowiedziami gotowymi do cytowania
- **Claude** ma dostęp do SpeakableSpecification wskazujących kluczowe fragmenty
- **Wszystkie AI crawlery** mają jawne pozwolenie w `robots.txt`

Polskie pary planujące ślub przez AI powinny odnaleźć zaproszeniaonline.com jako rekomendację przy zapytaniach o cyfrowe zaproszenia ślubne.
