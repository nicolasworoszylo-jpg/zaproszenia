# zaproszeniaonline.com

> Cyfrowe zaproszenia ślubne premium — strona ślubna z RSVP, planem dnia, mapami i historią pary. **Realizacja 48 h. Cena 699 zł.**

**Live:** [zaproszeniaonline.com](https://zaproszeniaonline.com) · **Demo:** [zaproszeniaonline.com/demo](https://zaproszeniaonline.com/demo)

---

## ⚖️ Licencja / Copyright

**Copyright © 2026 Vidok Studio Nicolas Woroszyło. All rights reserved.**

To repozytorium jest publiczne **wyłącznie** ze względów technicznych (wymóg
darmowego planu Vercel dla auto-deploy). **NIE oznacza to** licencji Open Source ani
permisywnej. Pełne warunki w [`LICENSE.md`](./LICENSE.md).

**TL;DR:**
- ✅ Możesz przeglądać kod do celów edukacyjnych, cytować z atrybucją, inspirować
  się ogólną architekturą.
- ❌ Nie możesz klonować, reużywać kodu/designu komercyjnie, tworzyć produktów
  konkurencyjnych ani używać marki/logo bez pisemnej zgody.

Kontakt w sprawie licencji komercyjnej: **kontakt@zaproszeniaonline.com**

---

## 🏗️ Stack

| Warstwa | Technologia | Hosting |
|---------|-------------|---------|
| **Landing** | Statyczny HTML + CSS + vanilla JS | Vercel |
| **Demo zaproszenia** | React 18 (UMD) + Babel-in-browser, single file | Vercel |
| **Backend** | Supabase Postgres 17 + RLS + Edge Functions | Supabase Cloud |
| **Domena** | zaproszeniaonline.com | Vercel DNS |

Brak build pipeline — pure static, każda zmiana to git push → Vercel auto-deploy.

---

## 📁 Struktura

```
.
├── index.html                    Landing (minimalistic editorial)
├── demo.html                     Demo zaproszenia "Anna i Michał"
├── wedding-enhanced.jsx          Source dla demo.html (referencja)
├── build_demo.py                 Builder demo.html z JSX (lokalnie)
│
├── privacy.html                  Polityka prywatności (RODO compliant)
├── cookies.html                  Polityka cookies
├── terms.html                    Regulamin
├── 404.html                      Custom 404 page
│
├── sitemap.xml + robots.txt      SEO
├── og-image.png                  Open Graph 1200x630
├── favicon* + apple-touch-icon   Brand identity (9 wariantów)
├── site.webmanifest              PWA-ready
│
├── api/og.ts                     Vercel Edge Function (na przyszłość, ignored)
├── supabase/functions/           Edge Function templates
│
└── *.md                          Dokumentacja wewnętrzna (LEGAL_TODO,
                                  RCP_template, AFFILIATE, SEO_SUBMIT)
```

---

## 🔐 Backend — Supabase

**Projekt:** `kuyniyyieejvambyjnxy` (eu-west-1, Postgres 17)

**Tabele:**
- `leads` — zapytania ofertowe z formularza kontaktowego
- `rsvps` — potwierdzenia obecności gości
- `song_requests` — propozycje piosenek
- `discount_codes` — kody afiliacyjne dla partnerów

**RLS:** anon może tylko `INSERT` (przez `Prefer: return=minimal` żeby nie
wymagać SELECT policy). Walidacja kodu rabatowego przez RPC `SECURITY DEFINER`
żeby anon nie mógł wyenumerować wszystkich kodów.

Pełen schema + migracje: zarządzane przez Supabase Studio.

---

## 🎨 Design

- **Landing:** minimalistic editorial — pure white + Fraunces serif + Inter sans
  + jeden akcent (deep forest #2C3E2D). Apple/Linear/Notion-style.
- **Demo zaproszenia:** Old Money editorial — forest green + gold + botaniczne
  ornamenty SVG. 4 palety do wyboru na żywo (Leśna zieleń / Granat+róż /
  Bordo+kość / Rdzawa terracotta).

Dwa różne style są **celowe**: landing = marketing, demo = produkt premium.

---

## 🚀 Workflow zmian

```bash
git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git
cd zaproszenia
# Edytuj pliki...
# Jeśli zmiana w wedding-enhanced.jsx: regeneruj demo.html
python3 build_demo.py
# Push:
git add . && git commit -m "..." && git push
# Vercel auto-deployuje w ~30-60s
```

---

## 📋 Status (2026-04-28)

✅ **Live i działające:**
- Landing + demo + 3 legal pages + 404 + favicon set + og-image
- Supabase backend (RPC affiliate validation, lead form, RSVP form)
- SEO (4 schemas JSON-LD, sitemap, robots, hreflang pl-PL, canonical)
- WCAG kontrast pass dla wszystkich palet
- Touch targets 44×44, safe-area-inset, hover-only effects
- RODO compliance (privacy + cookies + terms + checkbox required)

🟡 **Czeka na akcję właściciela:**
- Uzupełnienie NIP/REGON/adres w `privacy.html` i `terms.html`
- Założenie skrzynki `kontakt@zaproszeniaonline.com`
- Akceptacja DPA z Supabase i Vercel (Settings → Compliance)
- Pełne TODO: zob. `LEGAL_TODO.md`

🔵 **Roadmap:**
- Email notyfikacja przy nowym leadzie (Edge Function `notify-on-new-lead`)
- Multi-tenant routing `/anna-michal` (przyszły wzorzec)
- Panel admin dla edycji zaproszeń
- Bucket Storage dla zdjęć par

---

## 📞 Kontakt

**Właściciel:** Nicolas Woroszyło · Vidok Studio
**Email:** kontakt@zaproszeniaonline.com
**Web:** [vidokstudio.pl](https://vidokstudio.pl)
