# Marketing - zaproszeniaonline.com

> Analizy marketingowe, pricing research, competitive landscape, audience insights dla projektu zaproszeniaonline.com.

**Last updated:** 2026-05-12
**Owner:** Dominika Kuś (osoba upoważniona art. 29 RODO) + Nicolas Woroszyło (Administrator)
**Master source:** `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/` (canonical brand-profile + RAG chunks + decisions log)
**Ten folder:** snapshot operacyjny dla deweloperów / Claude Code pracujących nad zaproszeniaonline.com

---

## 📚 Co tu znajdziesz

| Dokument | Zawartość | Kiedy czytać |
|---|---|---|
| **[PRICING_ANALYSIS.md](./PRICING_ANALYSIS.md)** | Comprehensive analiza cen PL wedding invitations 2025-2026 - papier vs digital, willingness to pay, % budget wesela, 7 rekomendacji pricingowych | Przed zmianą ceny, przed wdrożeniem pakietów, przed Meta Ads pricing test |
| **[BREAK_EVEN_ANALYSIS.md](./BREAK_EVEN_ANALYSIS.md)** | Ile gości żeby digital wygrał z papierem - tier-by-tier breakdown, numerical hooks library, TCO calculator spec | Przed pisaniem copy landing/ads, przed implementacją calculator widget |
| **[COMPETITIVE_LANDSCAPE.md](./COMPETITIVE_LANDSCAPE.md)** | Pełna mapa rynku PL (13 marek tier-by-tier) + 6 hooków konkurencyjnych A-F + gaps w rynku | Przed kampanią competitive copy, przed pozycjonowaniem |

> **Note - persony / target audience:** Robocze persony (Premium Pinterest Pola, Last-Minute Łukasz, Eco-Modern Ewa & Eryk) są w `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/audience.json` jako wewnętrzny tool AI. Confidence: medium (hipotezy bez customer data). Refresh po pierwszych 5 sprzedażach na podstawie realnych klientów.

---

## 🎯 Strategiczne ramy (TL;DR)

**Pozycja produktu:** Premium mid-market w PL wedding niche.
- Cena: 699 zł flat one-time (= bottom-end tier-3 indywidualny, mediana tier-3 PL = 800-900 zł)
- Czas realizacji: 24h (unikatowe w segmencie 699-1199 zł)
- USP combo: indywidualny + 24h + 4 palety + RSVP+plan+mapy all-in
- Cel: scale beyond limitu działalności nieewidencjonowanej (JDG to natural next step)

**North Star:** Maksymalizacja sprzedaży miesięcznie (brak strategic cap).

**Hipoteza ambitne goals:**
- D-30: 3-5 sales, 80+ leads
- D-60: 10-15 sales/mc, JDG decision point
- D-90: 20-30 sales/mc, top-3 SERP
- D-180 stretch: 40-60 sales/mc

**Phased budget marketingowy:** 1500 zł (D-1 do 30) → 3500 zł (D-31 do 60) → 6000 zł (D-61 do 90).

---

## 🔑 Kluczowe insights z analiz (top 5)

### 1. Cena nie skaluje z gośćmi (z BREAK_EVEN)

Digital = **fixed 699 zł niezależnie czy 30 czy 300 gości**. Papier = liniowo. Im więcej gości, tym większa przewaga.

> **"22 zł/osoba papier vs 7 zł/osoba digital (przy 100 gości). I hosting + RSVP + mapy w cenie."**

### 2. 699 zł = mid-market, NIE premium (z PRICING)

Mediana tier-3 PL = 800-900 zł. Możliwy upside cenowy do 799-899 zł.

> **A/B test rekomendowany: 699 / 799 / 899 zł przez 4-8 tyg.**

### 3. Realny TCO papieru = 2000-2500 zł (z BREAK_EVEN)

Pary porównują źle: 699 zł vs 5 zł × 80 = 400 zł. Realne = papier+koperty+adresowanie+menu+winietki+podziękowania+plan+mapa.

> **Krytyczne wdrożenie: TCO Calculator widget na landing.**

### 4. 3 dokumentowanych konkurentów może już nie istnieć (z COMPETITIVE)

- Wesele.online (ECONNREFUSED)
- eGoscie.pl (HTTP 403)
- Maleparyklub (brak indexu)

> **Action: walidacja ręczna social media tych marek przed update brand.json.**

### 5. Underserved segment: Late-planning couples

15-25% par planuje <6 mc przed ślubem (panic-driven research-heavy). 24h realizacja = killer feature niedostępny u konkurencji w tym tierze.

> **Rush fee model 899-999 zł jako add-on - potencjał +15-25% revenue/sale.**

---

## 📋 Recommended actions (cross-document priority)

### 🔴 HIGH PRIORITY (D-1 do D-30)

1. **TCO Calculator widget na landing** (slider 30-300 gości → kalkulacja real-time papier vs digital)
2. **Hook nadrzędny copy "Cena nie skaluje z gośćmi"** - primary w Meta Ads creatives
3. **A/B test pricing 699 / 799 / 899 zł** - 4-8 tygodni
4. **Carousel IG "10 ukrytych kosztów papieru"** (gotowy spec w BREAK_EVEN)

### 🟡 MEDIUM (D-30 do D-60)

5. **Rush fee premium model** 899-999 zł z gwarancją 24h jako add-on
6. **Hybrid card add-on** 199-299 zł dla seniorów (drukowana karta z QR)
7. **Per-persona landing variants** (60-90 gości | 130-180 gości | <50 gości)
8. **Blog post** "Od ilu gości digital staje się tańszy od papieru"

### 🟢 LOW (D-60+)

9. **Premium tier "Sygnatura Studio"** 1499-1999 zł (custom illustration, animations)
10. **B2B white-label** dla wedding plannerów (2500-4000 zł/rok)

---

## 🔄 Maintenance

**Refresh cycle:**
- **Co kwartał:** Pełny rescan konkurencji (pricing, USP, design changes)
- **Co miesiąc:** SEO position check Tier 1 keywords
- **Co tydzień:** Meta Ads Library check (czy konkurenci uruchomili nowe kampanie)
- **Po każdej kampanii:** weryfikacja czy konkurencja nie skopiowała naszego positioningu

**Triggery do natychmiastowego update:**
- Konkurencja zmienia pricing
- Nowy gracz wchodzi w segment 699-1199 zł
- Sezonowa zmiana (Q2/Q4 wedding seasons)
- Po pierwszych 5 sprzedażach: customer interviews + update persony

**Update master copy first:** zmiany robić najpierw w `dyrektor-marketingu/brand-profiles/zaproszenia/`, potem mirror tutaj.

---

## 🔗 Cross-references

**W projekcie zaproszenia (kontekst techniczny):**
- [ARCHITECTURE.md](../ARCHITECTURE.md) - stack + data flow
- [SEO.md](../SEO.md) - SEO/AEO/GEO strategia
- [AFFILIATE_INSTRUCTIONS.md](../AFFILIATE_INSTRUCTIONS.md) - system kodów partnerskich
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - live snapshot stanu
- [ONBOARDING_CLAUDE.md](../ONBOARDING_CLAUDE.md) - brand tokens + święte zasady

**W projekcie dyrektor-marketingu (kontekst strategiczny):**
- `brand-profiles/zaproszenia/brand.json` - canonical brand source
- `brand-profiles/zaproszenia/audience.json` - pełna baza persony + ICP
- `brand-profiles/zaproszenia/playbook.md` - decisions log narracyjny
- `brand-profiles/zaproszenia/AGENT_INSTRUCTIONS.md` - routing skilli + lazy-loading
- `_logs/decisions.jsonl` - machine-readable decisions log (D-001 do D-010)

---

## 📞 Kontakt

- **Marketing operator:** Dominika Kuś - dominikakus333@gmail.com
- **Brand owner:** Nicolas Woroszyło (Vidok Studio) - nicolasworoszylo@gmail.com
- **Marketing AI system:** `C:/Projekty/dyrektor-marketingu/` (Claude Code dyrektor + 18 skilli)
