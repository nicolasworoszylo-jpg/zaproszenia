# One-pager - karta drukowalna z QR

**Plik:** `one-pager.html` (1 plik, self-contained)
**Cel:** Minimalistyczna karta A4 do druku - imiona pary, data, kod QR do strony zaproszenia.

---

## Kiedy używać

Para wybiera "kod QR do druku" przy zamówieniu (już istnieje w formularzu). Po realizacji strony Wy generujecie one-pager z imionami, datą i QR kodem prowadzącym do JEJ wersji zaproszenia. Para drukuje 10-50 sztuk i:
- wkłada do kopert papierowych zaproszeń tradycyjnych (dla starszego pokolenia)
- daje fotografowi do zdjęć decor
- używa jako save-the-date wysłany pocztą

---

## Jak używać (workflow operacyjny)

### 1. Wygeneruj QR PNG dla URL strony zaproszenia

**Opcja A - CLI (macOS po `brew install qrencode`):**
```bash
qrencode -s 12 -m 4 -o anna-michal-qr.png "https://zaproszeniaonline.com/anna-michal"
```
- `-s 12` = scale 12px per module (~480x480 px - super ostre)
- `-m 4` = quiet zone (margin) 4 modules
- Output: `anna-michal-qr.png` (ok 6-8 KB)

**Opcja B - online (free):**
- https://www.qr-code-generator.com lub https://qrcode-monkey.com
- Wpisz URL → Download PNG (transparent background opcjonalnie)
- Zapisz lokalnie

**Opcja C - Python:**
```bash
pip install qrcode[pil]
python3 -c "import qrcode; qrcode.make('https://zaproszeniaonline.com/anna-michal').save('anna-michal-qr.png')"
```

### 2. Wgraj QR PNG do repo (lub na zewnętrzny hosting)

**Najlepsze:** dodaj plik do `/qr-codes/anna-michal-qr.png`, push do GitHub, Vercel auto-serwuje. URL: `https://zaproszeniaonline.com/qr-codes/anna-michal-qr.png`

**Alternatywa data URI:** dla testów / one-shot
```bash
echo "data:image/png;base64,$(base64 -i anna-michal-qr.png)"
```

### 3. Otwórz one-pager z parametrami

```
https://zaproszeniaonline.com/one-pager?names=Anna+i+Michał&date=20+czerwca+2026&venue=Wrocław&url=https://zaproszeniaonline.com/anna-michal&qr=/qr-codes/anna-michal-qr.png
```

**Parametry:**
| Param | Opis | Przykład |
|---|---|---|
| `?names` | imiona pary | `Anna+i+Michał` |
| `?date` | data ślubu po polsku | `20+czerwca+2026` |
| `?venue` | miasto/lokalizacja | `Wrocław` lub `Pałac+Brunów` |
| `?url` | URL strony zaproszenia | `https://zaproszeniaonline.com/anna-michal` |
| `?qr` | URL lub data URI do PNG QR | `/qr-codes/anna-michal-qr.png` |
| `?rsvp` | data deadline RSVP (opcjonalne, auto = 5 tygodni przed) | `15+maja+2026` |

### 4. Drukuj

W przeglądarce: Cmd+P → Save as PDF lub bezpośrednio do drukarki.
- Format: A4 portrait
- Margins: brak (page-level margins w `@page` w CSS)
- Print quality: best (300 DPI dla wektorowego SVG QR)

---

## Co jest w one-pagerze

**Layout A4 (210×297mm):**
- Eyebrow: "Zaproszenie ślubne" z gold dividers
- Monogram: 2 pierwsze litery imion w kółku z forest border
- Names: Anna&Michał (italic Fraunces, gold ampersand)
- Divider: kropka gold z forest linią
- Data + miejsce
- Quote: zapraszamy + info "wszystkie szczegóły pod QR"
- QR frame: 200×200px, white card, forest border subtle
- URL pod QR (alternatywa dla skanowania)
- Footer: deadline RSVP

**Brand voice:**
- Forest green (#2C3E2D) + gold (#C9A96E) na cream (#FAF6EF)
- Fraunces italic dla nazw, Inter sans dla meta
- Subtle ornamenty (okręgi w rogach jak na zaproszeniu)

---

## Edycja interaktywna

Na ekranie (NIE druku) jest toolbar:
- **Drukuj / zapisz PDF** - browser print
- **Edytuj dane** - modal z polami, wpisujesz dane, klika "Zastosuj", strona przeładowuje się z nowymi URL params

Toolbar i banner instrukcji **znikają przy druku** (CSS `@media print { display: none }`).

---

## Przyszłe ulepszenia (TODO)

1. **Edge Function `/api/qr?text=URL`** - server-side QR generation jedną z bibliotek (`qrcode` npm). Pozwoli skipować ręczne generowanie QR PNG dla każdego klienta.
2. **Multi-tenant routing** - po wdrożeniu `/anna-michal` jako URL, one-pager automatycznie używa `?url=/anna-michal` bez konieczności hostowania QR PNG osobno.
3. **Edge Function `/api/one-pager?lead_id=...`** - dynamiczny PDF rendered server-side z `@vercel/og` + paragony.
4. **Print bleed marks** - dla profesjonalnego druku w drukarni (CMYK + 3mm bleed).

---

## Nie indeksować w Google

- `robots.txt` ma `Disallow: /one-pager`
- `<meta name="robots" content="noindex, nofollow">` w head
- Sitemap NIE zawiera one-pager

Powód: one-pager z imionami konkretnej pary nie powinien trafić do SERP (privacy + nie jest content marketingowy).
