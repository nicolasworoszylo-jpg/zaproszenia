# 🟠 DECYZJA WYMAGANA: Vercel plan vs. RODO compliance

**Status:** ⏸️ oczekuje na decyzję Nicolasa
**Data wykrycia:** 2026-05-13 (Dominika + Claude Code, weryfikacja manualna)
**Blokuje:** zamknięcie luki RODO art. 28 + Rozdział V (transfer do USA)
**Pilność:** średnia — nie blokuje pierwszego klienta, ale każdy dzień to ekspozycja PUODO

---

## TL;DR

Vercel hostuje `zaproszeniaonline.com` na planie **Hobby (free)**. Vercel DPA z 18 listopada 2025 (sekcja 1 Introduction) wprost mówi:

> *"This Addendum applies to Vercel's Processing of Personal Data as a Processor under the Agreement for Customers who are on **Enterprise and Pro plans**."*

Czyli na Hobby **żadne DPA nie obowiązuje**. A Vercel realnie procesuje dane osobowe gości naszej strony (IP, user-agent, geo z Web Analytics + Speed Insights, logi edge) i transferuje je do USA. Bez DPA + SCC = luka RODO.

**Trzeba wybrać jedną z 4 opcji poniżej.**

---

## Co dokładnie procesuje Vercel na naszej stronie

| Komponent | Dane | Kategoria |
|---|---|---|
| Edge Network logi | IP gościa, user-agent, URL, timestamp, referrer | dane osobowe (motyw 30 RODO) |
| Web Analytics | IP (anonimizowane), user-agent, geo, ścieżki kliknięć | dane osobowe |
| Speed Insights | Core Web Vitals per-user, identyfikator sesji | dane osobowe |
| Build/deploy | nasz kod (bez PII gości) | poza RODO |

Vercel = Vercel Inc. (USA, Delaware). Każde żądanie HTTP idzie przez ich edge → transfer do USA.

---

## 4 opcje

### A) Upgrade do Vercel Pro — REKOMENDACJA ⭐

| | |
|---|---|
| **Koszt** | $20/mc (~80 PLN) |
| **Co dostajemy poza DPA** | 1 TB bandwidth (Hobby: 100 GB), Edge Functions z dłuższym timeout, password-protected previews, prawdziwe Web Analytics z eksportem, większy team |
| **RODO** | ✅ DPA + SCC + UK IDTA wszystko auto-binding od momentu upgradu |
| **Wysiłek** | 5 min (1 klik w panelu billing) |
| **Break-even** | 0,11 zamówienia/mc (przy Payment Link 699 zł) |
| **Ryzyko** | brak |

### B) Zostań na Hobby + wyłącz Web Analytics + Speed Insights

| | |
|---|---|
| **Koszt** | 0 zł |
| **RODO** | 🟡 częściowo — Vercel dalej widzi IP w logach edge (cache, routing), ale przestaje aktywnie profilować zachowanie. Logi edge są technicznie konieczne do działania CDN i można argumentować "uzasadniony interes" (art. 6 ust. 1 lit. f RODO), ale dalej brak DPA i SCC dla transferu do USA |
| **Wysiłek** | 5 min + utrata Web Analytics + Speed Insights danych |
| **Co tracimy** | wgląd w ruch (skąd przychodzą goście, które blog posty działają, Core Web Vitals w produkcji) |
| **Ryzyko** | średnie — w razie skargi gościa do PUODO trzeba bronić logów edge jako "necessary processing" |
| **Uwaga** | Aktualne `privacy.html` § 3 wspomina o "Vercel Inc. — Web Analytics i Speed Insights" z opt-in cookie banner. Część zgodności już jest (zgoda gościa przed uruchomieniem analytics), ale **brak DPA dalej jest luką** dla samego transferu HTTP do edge USA. |

### C) Migracja na Cloudflare Pages

| | |
|---|---|
| **Koszt** | 0 zł (free plan ma DPA) |
| **RODO** | ✅ Cloudflare DPA + SCC działa już na free plan |
| **Wysiłek** | ~pół dnia — przeniesienie repo, ustawienie domeny, redirect DNS w OVH, retest blog/forms/Stripe webhook, ryzyko regresji w SEO (sitemap, Search Console) |
| **Ryzyko** | trade-off: zyskujemy DPA, tracimy łatwy preview-deploy z Vercela; ekosystem Cloudflare Workers ≠ Vercel Edge Functions, ale tu i tak nie używamy Edge Functions |

### D) Zostań na Hobby + przyjmij ryzyko

| | |
|---|---|
| **Koszt** | 0 zł |
| **RODO** | 🔴 luka otwarta |
| **Konsekwencje** | skarga gościa → PUODO → postępowanie wyjaśniające → potencjalna kara administracyjna do 20 mln EUR / 4% obrotu. W praktyce dla mikro-skali (kilkadziesiąt zamówień/rok) ryzyko niskie, ale niezerowe. Większy problem: gdy klient (para młoda) zapyta o DPA do swojego rejestru — nie będziemy mieli czym pokryć |

---

## Co się zmienia po decyzji

Gdy Nicolas podejmie decyzję, Dominika + Claude robią:

**Jeśli A (Pro):**
1. Pobranie publicznego PDF DPA z `vercel.com/legal/dpa` → `legal-templates/dpa-signed/vercel-dpa-2025-11-18.pdf`
2. Update `privacy.html` § 3 — usunięcie nieprawdziwego *"(do akceptacji w ustawieniach projektu Vercel)"*
3. Update `LEGAL_TODO.md` § 3 — wykreślenie Vercel z blokerów
4. Wpis do RCP (art. 30 RODO): Vercel jako procesor, podstawa transferu = SCC zgodnie z DPA Pro

**Jeśli B (Hobby + off analytics):**
1. Wyłączenie Web Analytics i Speed Insights w panelu Vercel (Settings → Web Analytics → Disable; Settings → Speed Insights → Disable) — Nicolas lub Dominika
2. Usunięcie skryptów `@vercel/analytics` i `@vercel/speed-insights` ze strony jeśli są wpięte
3. Update `privacy.html` § 3 — Vercel jako procesor tylko dla niezbędnych logów edge, podstawa = art. 6 ust. 1 lit. f, brak DPA bo Hobby; usunięcie wpisu o "Vercel Web Analytics" jeśli wyłączone
4. Disclosure ryzyka w `LEGAL_TODO.md`

**Jeśli C (migracja):**
- Osobna sesja, nie robimy ad hoc

**Jeśli D (status quo):**
1. Update `privacy.html` § 3 — usunięcie nieprawdziwego *"(do akceptacji w ustawieniach projektu Vercel)"* i wstawienie szczerego *"hosting na planie Hobby, DPA niedostępne dla tego planu, ryzyko przyjęte świadomie"*
2. Wpis do `LEGAL_TODO.md` o świadomym przyjęciu ryzyka z datą decyzji

---

## Co już zostało poprawione 2026-05-13 (niezależnie od decyzji)

Następujące pliki miały błędne instrukcje o nieistniejącym przycisku "Accept DPA w panelu Vercel" — zostały poprawione w jednym commicie:

- `LEGAL_TODO.md` § 3
- `CLAUDE_IN_CHROME_PROMPTS.md` § 2️⃣
- `FIRST_CLIENT_CHECKLIST.md` § 1
- `legal-templates/dpa-signed/README.md`

**Co nie zostało jeszcze poprawione** (czeka na decyzję Nicolasa, bo wymaga znajomości wybranej ścieżki):
- `privacy.html` § 3 — fragment *"DPA Vercel (do akceptacji w ustawieniach projektu Vercel)"* dalej jest tam zapisany. Treść poprawki zależy od A/B/C/D.

---

## Źródła

- Vercel DPA pełny tekst: <https://vercel.com/legal/dpa>
- Analiza zakresu zastosowania DPA: sekcja 1 (Introduction), Schedule 3 (SCC EU/UK), Schedule 5 (UK IDTA)
- Plan Hobby vs Pro feature comparison: <https://vercel.com/pricing>
- RODO art. 28 (umowa powierzenia), Rozdział V (transfery międzynarodowe), motyw 30 (IP jako dane osobowe)

---

## Czekam na decyzję od:

**Nicolas Woroszyło** (Owner, działalność nieewidencjonowana)

Sposób odpowiedzi: edytuj ten plik dopisując na dole sekcję **DECYZJA:** z wybraną literą i datą, albo przekaż Dominice słownie/Slackem.
