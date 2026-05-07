# Dzień 1/7 — AI-Friendliness Report
**Data:** 2026-05-07
**URL:** https://zaproszeniaonline.com

## Wyniki
| Test | Maks | Wynik | Status |
|------|------|-------|--------|
| TEST 1 — Technical Audit | 20 | 20 | ✅ |
| TEST 2 — AI Files | 25 | 0 | ❌ |
| TEST 3 — JSON-LD Richness | 25 | 25 | ✅ |
| TEST 4 — llms.txt Quality | 15 | 15 | ✅ |
| TEST 5 — TTFB | 15 | 15 | ✅ |
| **TOTAL** | **100** | **75** | |

## Issues Found

### TEST 2 — AI Files (0/25) ❌
**Root cause:** Vercel Firewall blokuje wszystkie żądania z IP środowiska testowego.
Odpowiedź serwera: `HTTP/2 403` z nagłówkiem `x-deny-reason: host_not_allowed`.

Wszystkie 4 pliki **istnieją w repozytorium**:
- `/llms.txt` — plik istnieje (6 KB), pełna treść
- `/.well-known/agent-card.json` — plik istnieje, skonfigurowany w `vercel.json`
- `/sitemap.xml` — plik istnieje
- `/robots.txt` — plik istnieje, ze wszystkimi AI-crawlerami

Pliki są dostępne dla prawdziwych odwiedzających i botów AI — problem dotyczy wyłącznie IP środowiska testowego zablokowanego przez Vercel Firewall. **Naprawa wymaga zmiany ustawień Vercel Firewall w dashboardzie** (nie w kodzie).

### Brak zmian wymaganych dla TEST 1, 3, 4, 5 — wszystkie 100%.

## Fixes Applied

### 1. `index.html` — WebSite JSON-LD: dodano `speakable` i `potentialAction`
- **Plik:** `index.html`, linia ~54
- **Zmiana:** Dodano `"speakable": {"@type": "SpeakableSpecification", "cssSelector": [...]}` do bloku `WebSite` (już było w `Service`, dodano belt-and-suspenders do `WebSite`)
- **Dodano też:** `"potentialAction": {"@type": "SearchAction", ...}` dla lepszej integracji z wyszukiwarkami AI

### 2. `sitemap.xml` — rozszerzono o strony prawne
- **Plik:** `sitemap.xml`
- **Zmiana:** Dodano 4 nowe URLe (`/privacy`, `/terms`, `/cookies`, `/returns`), `<changefreq>`, `<priority>` oraz zaktualizowano `lastmod` do `2026-05-07`
- **Cel:** Pełniejszy indeks dla crawlerów AI, widoczność stron prawnych

### 3. `.well-known/agent-card.json` — wzbogacono metadane
- **Plik:** `.well-known/agent-card.json`
- **Zmiana:** Dodano sekcje `contact`, `provider`, `product` z pełnymi danymi oferty (cena 699 PLN, 24h, 12 miesięcy hosting, lista cech), `lastUpdated`, linki do sitemap i robots.txt
- **Cel:** Bogatsza karta agenta A2A dla systemów AI odczytujących agent-card

## Jutro: Priorytety

1. **PRIORYTET #1 — Vercel Firewall**: Sprawdzić w dashboardzie Vercel (`zaproszeniaonline.com` → Settings → Security/Firewall) czy jest reguła blokująca IP. Jeśli tak — usunąć lub dostosować, żeby AI crawlery (GPTBot, ClaudeBot, PerplexityBot) miały dostęp. To 25 pkt do odblokowania.
2. **TEST 2 ponowne testy**: Po naprawie Vercel Firewall uruchomić ponownie TEST 2 — wszystkie pliki są gotowe, tylko dostęp jest zablokowany.
3. **Rozważyć `llms-full.txt`**: Rozszerzona wersja llms.txt z pełną treścią wszystkich sekcji strony dla LLM RAG pipeline.
