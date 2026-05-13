# Brand Asset Registry - zaproszeniaonline.com

> **CEL DOKUMENTU**: tracking jakie informacje o ofercie są ZAHARDKODOWANE w
> grafice. Jeśli zmieniasz cokolwiek w ofercie (cena, czas realizacji,
> funkcje, URL), TUTAJ sprawdź które assety wymagają re-renderu.

**Ostatnia aktualizacja**: 2026-05-13 (real QR + Fraunces URL + cream/gold variants)
**Lokalizacja źródeł**: `C:/Projekty/dyrektor-marketingu/clients/zaproszenia/fanpage-fb/`
**Lokalizacja deliverables**: `C:/Users/domin/Desktop/dysk/brand-zaproszenia-2026-05-12/`

---

## 1. FB Cover banner z info — DWA WARIANTY

**Status**: PRODUKCJA - używany na fanpage'u Facebook
**Wymiary**: 1640×720 px (FB cover standard)
**AI source**: `assets/ai-generated/banner-envelope-qr-base.png` (2688×1152, Higgsfield gpt_image_2)

### 1a. GOLD variant (PRIMARY / canonical per "Old Money editorial")

- Plik na dysku: `dysk/02-baner-fb/fb-cover-1640x720-z-info-gold.png`
- Plik źródłowy: `assets/fb-cover-1640x720-branded-gold.png`
- Template: `templates/fb-cover-branded-gold.html`
- Kolor tekstu: `#C9A96E` (champagne gold, matches wax seal)

### 1b. CREAM variant (ALTERNATIVE)

- Plik na dysku: `dysk/02-baner-fb/fb-cover-1640x720-z-info-cream.png`
- Plik źródłowy: `assets/fb-cover-1640x720-branded.png`
- Template: `templates/fb-cover-branded.html`
- Kolor tekstu: `#FAF8F3` (cream)

### Wspólna specyfikacja

**Typografia**: URL "zaproszeniaonline.com" w Fraunces italic 500 (48px, match logo monogramu); pozostałe linie Inter 700/800 uppercase z trackingiem 0.38-0.42em. 3-warstwowy dark drop shadow zamiast cream halo.

**QR kod**: PRAWDZIWY scannable, linkujący do `https://zaproszeniaonline.com/demo`. Pozycja w AI source 2688×1152: top-left (1271, 303), size 186×186. Generated przez `qrcode` lib (`build-fb-cover.js`), pozycja zmierzona pixel-perfect via `detect-qr.js`.

**ZAWARTE INFORMACJE Z OFERTY** (re-render needed if zmienisz):
| Informacja | Wartość w obrazku | Źródło canonical |
|---|---|---|
| Kategoria produktu | "Cyfrowe zaproszenia ślubne" | brand.json USP |
| URL strony | "zaproszeniaonline.com" | brand.json live_url |
| Cena | "699 zł" | brand.json products[0].price_pln |
| Format ceny | "stała cena" | feedback_zaproszenia_voice_polish_forms |
| Czas realizacji | "24 godziny" | reference_zaproszenia_canonical_facts (NIE 48h) |
| Funkcje | "Strona ślubna · RSVP · Plan dnia · Mapy" | products[0].includes (skrót) |
| Wizualne: QR | linkujący do `/demo` (PRAWDZIWY scannable) | demo_urls |
| Wizualne: eukaliptus | brand-aesthetic | brand.json visual.imagery_mood |
| Wizualne: wax seal | brand-aesthetic | brand.json visual |

**Backups (poprzednie wersje z fake AI QR)**: `dysk/02-baner-fb/_archive-fake-qr/`

**Regeneracja wymaga**:
- Rebuild base z prawdziwym QR: `node build-fb-cover.js`
- Re-render brand layers (oba warianty): `node render-branded-banners.js`
- Jeśli zmiana AI source: regenerate w Higgsfield + zapisz do `ai-generated/` + zmierz nową pozycję QR via `detect-qr.js`

---

## 2. Google Business Cover (banner)

**Plik**: `assets/google-cover-1080x608-branded.png`
**Lokalizacja na dysku**: `dysk/03-google-business/cover-1080x608-z-info.png`
**Wymiary**: 1080×608 px (Google Business cover 16:9)
**Status**: PRODUKCJA - dla Google Business Profile

**AI source**: same as FB - `banner-envelope-qr-base.png` (cropped 16:9 z 21:9)

**ZAWARTE INFORMACJE Z OFERTY**:
| Informacja | Wartość w obrazku | Źródło canonical |
|---|---|---|
| Kategoria produktu | "Cyfrowe zaproszenia ślubne" | brand.json USP |
| URL strony | "zaproszeniaonline.com" | brand.json live_url |
| Cena | "699 zł" | brand.json products[0].price_pln |
| Format ceny | "stała cena" | feedback voice rules |
| Czas realizacji | "24 godziny" | canonical facts |
| Funkcje | "Strona ślubna · RSVP · Plan dnia · Mapy" | products[0].includes |
| Wizualne: ten sam co FB | same composition | - |

---

## 3. Google Business Hero (square, główne zdjęcie profilu)

**Plik**: `assets/google-hero-1080-branded.png`
**Lokalizacja na dysku**: `dysk/03-google-business/hero-1080-z-info-z-prawdziwym-QR.png`
**Wymiary**: 1080×1080 px (Google Business primary photo)
**Hi-res**: `google-hero-2048.png` (2048×2048 backup)
**Status**: PRODUKCJA - główny obraz Google Business Profile

**AI source**: `assets/ai-generated/google-hero-square-base.png` (2048×2048, Higgsfield gpt_image_2)

**KRYTYCZNE**: QR kod NA TYM OBRAZKU JEST PRAWDZIWY I SKANOWALNY.
- Źródło QR: real QR overlay przez sharp composite
- QR target URL: `https://zaproszeniaonline.com/demo`
- Generator: `qrcode` npm package (errorCorrectionLevel: M)
- Kolor QR: forest #2C3E2D na cream #EAE0C8
- **Jeśli zmienisz demo URL** → regeneruj QR przez `node build-google-hero.js`

**ZAWARTE INFORMACJE Z OFERTY**:
| Informacja | Wartość w obrazku | Źródło canonical |
|---|---|---|
| Kategoria produktu | "Cyfrowe zaproszenia ślubne" | brand.json USP |
| URL strony | "zaproszeniaonline.com" | brand.json live_url |
| Cena | "699 zł" | products[0].price_pln |
| Format ceny | "stała cena" | voice rules |
| Czas realizacji | "24 godziny" | canonical facts |
| Funkcje | "Strona ślubna · RSVP · Plan dnia · Mapy" | products[0].includes |
| **QR target** | `https://zaproszeniaonline.com/demo` | brand.json demo_urls[0] |
| Wizualne: koperta+karta+QR | brand-aesthetic | visual |
| Wizualne: eukaliptus + wax seal | brand-aesthetic | visual |

---

## 4. Profile picture (FB + Instagram avatar)

**Plik**: `assets/profile-1080.png`
**Lokalizacja na dysku**: `dysk/01-profilowe-fb-ig/profile-1080.png`
**Hi-res**: `profile-2048.png` (2048×2048)
**Status**: PRODUKCJA - avatar dla Facebook, Instagram, ewent. innych

**AI source**: `assets/ai-generated/profile-base.png` (2048×2048, Higgsfield gpt_image_2)

**ZAWARTE INFORMACJE Z OFERTY**: BRAK
- Czysty brand mark (botaniczny wieniec + monogram Z)
- Brak ceny, URL, funkcji
- Stabilny long-term: NIE wymaga re-renderu przy zmianach oferty

**Regeneracja wymaga**:
- Zmiana brand identity (kolory, monogram) - co byłoby decyzją strategiczną
- NIE wymaga zmian przy korekcie ceny/czasu/funkcji

---

## 5. Wizytówka (front + back)

**Pliki**:
- `assets/business-card-front.png/.pdf`
- `assets/business-card-back.png/.pdf`
**Lokalizacja na dysku**: `dysk/04-wizytowka/`
**Wymiary**: 85×55mm (1004×650 px @ 300dpi)
**Status**: PRODUKCJA - do druku i digital

**Templates**:
- `templates/business-card-front.html` (forest tło, monogram Z, wieniec)
- `templates/business-card-back.html` (cream tło, info kontaktowe, QR)

**ZAWARTE INFORMACJE Z OFERTY** (back side):
| Informacja | Wartość w obrazku | Źródło canonical |
|---|---|---|
| Eyebrow | "Cyfrowe zaproszenia ślubne" | brand USP |
| URL | "zaproszeniaonline.com" | live_url |
| Email | "kontakt@zaproszeniaonline.com" | reference_zaproszenia_emails |
| QR target | `https://zaproszeniaonline.com/demo` | demo_urls[0] |
| Footer left | "699 zł · realizacja 24h" | price + time |
| Footer right | "RSVP · plan dnia · mapy" | features |

**Regeneracja wymaga**: `node render-card.js`

---

## 6. Wallet assets (vCard + Apple Wallet scaffold)

**Lokalizacja**: `assets/wallet/` → `dysk/05-wallet/`

### 6a. vCard (`.vcf`)
**Plik**: `zaproszenia-online.vcf`
**ZAWARTE INFO**: ORG nazwa, TITLE "Cyfrowe zaproszenia ślubne", EMAIL, URL, NOTE
**Aktualizacja**: edit `render-wallet.js` → re-run

### 6b. Apple Wallet pass.json (scaffold)
**Plik**: `pkpass-bundle/pass.json`
**ZAWARTE INFO**:
- primaryFields: "699 zł · 24h"
- secondaryFields: "zaproszeniaonline.com"
- auxiliaryFields: "kontakt@zaproszeniaonline.com"
- backFields: pełny opis co zawiera oferta (15 funkcji)
- barcode: QR → demo URL

**Aktualizacja**: edit pass.json directly + re-sign (wymaga Apple Developer cert)

---

## 7. Bio fanpage (PDF)

**Plik**: `bio-fanpage-fb.pdf` → `dysk/06-bio-fanpage/`

**ZAWARTE INFORMACJE**:
- Page name z keyword
- Username @zaproszeniaonline
- Tagline "Cyfrowe zaproszenia ślubne online. 699 zł, 24 godziny"
- Short bio z behavioralnym hookiem
- About: pełna lista funkcji + "Co zawiera" + cena + Q&A AEO format
- CTA: "Wyślij wiadomość" / "Dowiedz się więcej"

**Aktualizacja**: edit `generate_pdf.py` → `python generate_pdf.py`

---

## 🚨 GDY ZMIENIASZ COŚ W OFERCIE - CHECKLIST

### Zmiana CENY (np. 699 → 799)
Re-render assets z embedded ceną:
- ✅ FB Cover branded → `node render-branded-banners.js`
- ✅ Google Cover branded → ten sam skrypt
- ✅ Google Hero branded → `node render-google-hero-branded.js`
- ✅ Wizytówka back → `node render-card.js`
- ✅ Bio fanpage PDF → `python generate_pdf.py`
- ✅ Apple Wallet pass.json → edit primaryFields + manifest re-hash
- ✅ vCard NOTE field → edit `render-wallet.js`
- ✅ Brand profile `brand.json` products[0].price_pln
- ✅ Source landing page `Desktop/zaproszenia/` (jeśli istnieje)

### Zmiana CZASU REALIZACJI (np. 24h → 48h)
- Same lista co cena
- Plus: memory `reference_zaproszenia_canonical_facts.md` UPDATE

### Zmiana FUNKCJI (np. dodanie "song requests" do features overlay)
- Edit template HTMLs (`.features` content)
- Re-render banners + cover + hero
- Wizytówka footer text update

### Zmiana URL DOMENY (mało prawdopodobne, ale)
- WSZYSTKIE assety z URL overlay → re-render
- Plus: QR kody w hero square + wizytówka back → re-generate (link inny)
- Brand profile + source project

### Zmiana DEMO URL
- Tylko QR-bearing assety: `google-hero-1080.png` i wizytówka back
- `node build-google-hero.js` + `node build-qr.js && node render-card.js`

### Zmiana EMAILA KONTAKTOWEGO
- Wizytówka back
- vCard
- Bio fanpage PDF (sekcja kontakt)
- pass.json

### Zmiana BRAND IDENTITY (kolory, monogram, paleta)
- WSZYSTKIE assety (full regeneration)
- Re-AI generate jeśli zmienia się visual style
- Update brand.json visual section first

---

## Workflow re-renderu (kolejność)

```bash
cd C:/Projekty/dyrektor-marketingu/clients/zaproszenia/fanpage-fb

# 1. Update brand.json jeśli dotyczy
# 2. Update HTML templates jeśli content się zmienił
# 3. Re-render w odpowiedniej kolejności:

node finalize-banner.js          # Banner crops (z AI source)
node render-branded-banners.js   # FB + Google cover branded
node build-google-hero.js        # Square hero z prawdziwym QR
node render-google-hero-branded.js  # Square branded
node render-card.js              # Wizytówka front + back (PNG + PDF)
node render-wallet.js            # Wallet assets (vcard + pkpass)
python generate_pdf.py           # Bio fanpage PDF

# 4. Sync do dysk folder
# (manual cp commands per plik, lub zbiorczy skrypt sync)
```

---

## Cross-references

- Master canonical facts: `memory/reference_zaproszenia_canonical_facts.md`
- Voice rules: `memory/feedback_zaproszenia_voice_polish_forms.md`
- Brand profile: `brand-profiles/zaproszenia/brand.json`
- Source project: `Desktop/zaproszenia/marketing/`
