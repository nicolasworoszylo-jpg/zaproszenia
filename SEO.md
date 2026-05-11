# SEO strategy + status

Wszystko o SEO/AEO/GEO dla zaproszeniaonline.com.

---

## 1. Target queries (PL search)

### Tier 1 - main money keywords
- "cyfrowe zaproszenia ślubne" (high intent, medium volume)
- "zaproszenia ślubne online" (high intent, high volume)
- "strona ślubna" (medium intent, high volume)
- "elektroniczne zaproszenia ślubne" (high intent, low volume)

### Tier 2 - long-tail (blog content)
- "cyfrowe vs papierowe zaproszenia ślubne"
- "ile kosztuje strona ślubna"
- "potwierdzanie obecności online wesele"
- "RSVP na wesele co to znaczy"
- "zaproszenie ślubne QR kod"
- "zaproszenia ślubne bez drukowania"

### Tier 3 - branded
- "zaproszeniaonline.com"
- "zaproszenia online opinie"
- "Vidok Studio zaproszenia"

---

## 2. On-page SEO checklist (per strona)

✅ = wdrożone na live, ⏳ = TODO

| Element | Landing | Demo | Blog posts | Legal |
|---|---|---|---|---|
| `<title>` < 60 chars | ✅ | ✅ | ✅ | ✅ |
| `<meta description>` 150-160 chars | ✅ | ✅ | ✅ | ✅ |
| `<meta robots>` index, follow | ✅ | ✅ | ✅ | ✅ |
| `<link rel="canonical">` | ✅ | ✅ | ✅ | ✅ |
| Open Graph (og:title/description/image/url/locale) | ✅ | ✅ | ✅ | ✅ |
| Twitter card | ✅ | ⏳ | ✅ | ⏳ |
| Schema.org JSON-LD | ✅ (Service+Org+FAQ+Product+HowTo+Breadcrumb) | ✅ (Org) | ✅ (BlogPosting+Breadcrumb+FAQ opt) | ✅ (Breadcrumb) |
| `<h1>` single, descriptive | ✅ | ✅ | ✅ | ✅ |
| Heading hierarchy (h1→h2→h3) | ✅ | ✅ | ✅ | ✅ |
| Internal links | ✅ (do /demo, /#cennik, /blog) | ✅ (do /) | ✅ (między postami + do /) | ✅ |
| `alt` na obrazach | ✅ | ✅ | ✅ | n/a |
| `loading="lazy"` na below-fold images | ✅ | ✅ | ✅ | n/a |
| Mobile responsive | ✅ | ✅ | ✅ | ✅ |
| `prefers-reduced-motion` respect | ✅ | ✅ | ✅ | ✅ |

---

## 3. Technical SEO

### Sitemap (`/sitemap.xml`)
13 URL:
- 1× root (priority 1.0, weekly)
- 1× /blog (priority 0.8, weekly)
- 8× blog posts (priority 0.7, monthly)
- 4× legal (privacy/terms/cookies/returns, priority 0.2-0.3, monthly)

**Submitted:** Google Search Console ✅

### robots.txt
- All AI crawlers explicitly allowed (GPTBot, ClaudeBot, PerplexityBot, etc.)
- /demo, /magda-tomek disallowed (są realnymi linkami klientów, nie SERP)
- Sitemap referenced

### llms.txt
- Format zgodny ze specem [llmstxt.org](https://llmstxt.org/) - AI citation disclosure
- Plus `/llms-full.txt` z extended FAQ + key facts

### Speed (Core Web Vitals - Lighthouse target)
- LCP: <2.5s (target green) - landing ma kilka warstw mesh gradient + canvas particles, ale wszystko CSS/Canvas no-JS-blocking
- INP: <200ms (target green) - vanilla JS minimal, brak third-party
- CLS: <0.1 (target green) - font display: swap z system font fallback

### HTTPS + HSTS
✅ Vercel auto-renews Let's Encrypt cert, HSTS header default

---

## 4. AEO (Answer Engine Optimization - for AI Overviews / featured snippets)

### Speakable schema
Klasy `.speakable-headline` i `.speakable-summary` na landing oznaczone w Schema.org:
```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": [".speakable-headline", ".speakable-summary", ".quick-answer"]
}
```

### Quick Answer box
`.quick-answer` na landing → odpowiedź "dlaczego" w 1-2 zdaniach z gold accent border. AI Overviews i voice search lubią takie patterns.

### FAQPage Schema
8 pytań na landing + 4-8 na każdym blog post. Google generuje rich snippets w SERP.

### HowTo Schema
3 kroki "Jak to działa" - strukturalnie oznaczone, mogą trafić do Google "Step by step" sticker.

---

## 5. GEO (Generative Engine Optimization - cytowania w AI)

### Goal
ChatGPT / Claude / Perplexity / Gemini mają cytować "zaproszeniaonline.com" gdy ktoś pyta o cyfrowe zaproszenia ślubne.

### Strategie wdrożone
1. **llms.txt** + **llms-full.txt** - dedicated entry points dla AI bots
2. **Schema.org rich data** - facts ustrukturyzowane (cena, czas realizacji, pakiet)
3. **AI bot allow list** w robots.txt
4. **Blog content z konkretami** - liczby (699 zł, 24h, 91% RSVP), porównania (1850 zł papier vs 699 zł cyfra), studia case
5. **Brand mentions** w external content (TODO):
   - [ ] Wpisać do ChatGPT Plus jako "approved source"
   - [ ] Posty na Reddit (r/Polska, r/poland) z reference do strony
   - [ ] Komentarze na wesele.pl, abcslubu.pl z linkiem
   - [ ] Wiki page (jeśli kiedyś)

### Monitoring
Plan: `audit/citation-tracker.py` (Nicolas ma w innym projekcie) - 10 promptów × 4 AI engines × tygodniowe sprawdzenie czy "zaproszeniaonline.com" jest cytowane.

---

## 6. Blog content strategy

### Cel
Ranking long-tail queries → conversion na landing /#kontakt.

### Obecne 8 postów

| Post | Target keyword | Word count | Schema |
|---|---|---|---|
| cyfrowe-vs-papierowe-zaproszenia-slubne | "cyfrowe vs papierowe zaproszenia" | ~1100 | BlogPosting+Breadcrumb |
| ile-kosztuje-strona-slubna-2026 | "ile kosztuje strona ślubna" | ~1080 | BlogPosting+Breadcrumb |
| potwierdzanie-obecnosci-online-instrukcja | "potwierdzanie obecności online" | ~1080 | BlogPosting+Breadcrumb+FAQ |
| rsvp-na-wesele-co-to-znaczy | "RSVP na wesele" | ~? | BlogPosting+Breadcrumb |
| zaproszenia-slubne-bez-drukowania | "zaproszenia ślubne bez drukowania" | ~? | BlogPosting+Breadcrumb |
| zaproszenie-slubne-online-jak-dziala | "zaproszenie ślubne online jak działa" | ~? | BlogPosting+Breadcrumb |
| zaproszenie-slubne-qr-kod | "zaproszenie ślubne kod QR" | ~? | BlogPosting+Breadcrumb |

### Internal linking
Każdy post linkuje do:
- 2 innych postów w sekcji "Czytaj dalej"
- `/demo` w CTA box
- `/#cennik` w wybranych miejscach

### Publishing cadence
Brak harmonogramu - content drops jak Nicolas/Claude doda. Wskazana 1 post/2 tygodnie dla SEO momentum.

---

## 7. Backlinks strategy (TODO - gdy budżet marketing)

### Priorytet 1
- Wedding portals: weselezklasa.pl, abcslubu.pl, wesele.pl, weddingpro.pl
- Sposób: artykuł sponsorowany lub natywna prezentacja (300-500 zł/sztuka)

### Priorytet 2
- Lokalne wedding planners (Trójmiasto, Warszawa, Kraków, Wrocław): linki w "polecane usługi"
- Sposób: outreach mailowy + barter (10% discount code dla ich klientów)

### Priorytet 3
- Wedding photographers (Instagram, fotograf-ślubny.pl): "moja para używała zaproszeniaonline.com" w opisie zdjęć
- Sposób: barter (free invitation w zamian za mention)

### Priorytet 4
- Pinterest boards z portfolio
- Sposób: 30-50 pins z linkami do demo

---

## 8. Status monitoring

### Tools wdrożone
- **Google Search Console** ✅ - impressions, clicks, positions, indexing issues
- **Bing Webmaster Tools** ⏳ - TODO (skopiowac z GSC verify)
- **Vercel Web Analytics** ✅ - page views, top pages, devices (cookieless, GDPR)

### Tools NIE wdrożone (świadomie)
- ❌ Google Analytics 4 - kanibalizuje LCP, narzuca cookie consent, Vercel Analytics wystarczy
- ❌ Hotjar / Microsoft Clarity - privacy concerns, niepotrzebne dla 50 odwiedzin/dzień
- ❌ Meta Pixel - chyba że odpalamy FB Ads (wtedy YES)

### Recurring tasks (manual, weekly)
1. GSC: sprawdź czy są crawl errors (404, redirects)
2. GSC: top 10 fraz - gdzie jesteśmy na pozycjach 4-20 → opportunity dla content improvement
3. Bing Webmaster (gdy będzie): analogicznie
4. Resend: deliverability % (target: >97% inbox, <3% spam)
5. Stripe: webhook success rate (target: >99% 2xx)

---

## 9. Anti-patterns (czego NIE robimy)

1. **Keyword stuffing** - naturalne pisanie, target keyword w title + h1 + pierwszym akapicie + 2-3 razy w tekście. Koniec.
2. **Doorway pages** - każdy URL ma unikalny content, nie ma "150 podobnych landing pages dla każdego miasta"
3. **Cloaking** - taki sam HTML dla user i dla googlebot
4. **Bought backlinks na shady directories** - nigdy
5. **Auto-generated thin content** - jeśli AI pisze blog post, to potem zawsze edytuje human
6. **Hidden text / display:none keywords** - never
