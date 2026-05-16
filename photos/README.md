# Photo pipeline — lokalna obróbka zdjęć klientów

Lokalny robot do skanowania i czyszczenia zdjęć zanim wylądują na stronie klienta.
Wariant **(a) manual** z `PHOTO_PIPELINE_PLAN.md` — bez Gmaila API, bez fal.ai, bez Supabase.

## Struktura

```
photos/
├── inbox/              ← Ty wgrywasz tutaj (Save attachments z Gmaila)
│   └── KOW-MAZ-A1B2/   ← jeden folder per zamówienie (ORDER_ID z `leads.order_id`)
│       ├── 01.jpg
│       ├── 02.jpg
│       └── ...
├── processed/          ← Robot wypluwa tutaj (czyste, gotowe na stronę)
│   └── KOW-MAZ-A1B2/
│       ├── 01.jpg      ← EXIF stripped, max 2000px, JPEG q85
│       └── ...
├── reports/            ← Robot zapisuje tutaj raport po każdym skanie
│   └── KOW-MAZ-A1B2.json
└── drafts/             ← Treść proponowanych maili do klienta (gdy flagi licencyjne)
    └── KOW-MAZ-A1B2/
        └── mail-03-greek-vacation.txt
```

`inbox/`, `processed/`, `reports/`, `drafts/` są w `.gitignore` —
zdjęcia klientów ani treści mailowe **nigdy** nie idą do gita.
W repo żyje tylko ten README + struktura folderów.

## Workflow (3 etapy: scan → wyślij ręcznie → publish → handoff)

### A. Scan + propozycje maila
1. Klient wysyła zdjęcia na maila z tematem `ZDJĘCIA [KOW-MAZ-A1B2]`
2. Otwierasz Gmail → Save attachments → folder `photos/inbox/KOW-MAZ-A1B2/`
3. Odpalasz `npm run photos:scan -- KOW-MAZ-A1B2`
4. Wynik:
   - Wszystkie pliki dostają status `pending_review` (nawet czyste — bo trzeba sprawdzić okiem znaki wodne, osoby, dokumenty)
   - Flagi 🟠 typu `PRO_CAMERA_NO_ARTIST` / `COPYRIGHT_PRESENT` / `LARGE_FILE` → robot generuje treść proponowanego maila do `photos/drafts/[ORDER_ID]/mail-[plik].txt` **i wypisuje ją w terminalu** (gotowe do `Ctrl+C`)
   - Pozostałe flagi (`GPS_PRESENT`, `AI_SOFTWARE`) → tylko informacyjne, bez maila

**Robot NIE wysyła nic sam.** Treść drafta służy tylko do skopiowania.

### B. Wyślij draft ręcznie i czekaj na odpowiedź klienta (do 72h)
Jeśli chcesz wysłać draft do klienta — kopiujesz treść z terminala (albo otwierasz `photos/drafts/[ORDER_ID]/mail-*.txt`) i wysyłasz z własnej skrzynki. Klient odpisuje na Twój email → notujesz mentalnie decyzję dla każdego pliku — wykorzystasz w kroku C.

### C. Publikacja (interactive review + upload do Supabase)
`npm run photos:publish -- KOW-MAZ-A1B2` — robot iteruje po wszystkich plikach:
- Pokazuje status, flagi, info o mailu (jeśli wysłany)
- Pyta `[a]pproved / [r]ejected / [w]ait`
- `a` → opcjonalna notatka → status `approved`
- `r` → wymagana notatka (powód) → status `rejected`
- `w` → wait, przerywa publikację, stan zostaje (możesz wrócić)

Po wszystkich rozstrzygniętych: finalne pytanie *„Upload N plików do Supabase? [y/N]"*. Po `y`:
- Pliki przechodzą do `lead-attachments/processed/[ORDER_ID]/` w Supabase Storage (bucket Nicolasa, już istnieje)
- Auto-notatka do `leads.notes` z podsumowaniem („3/5 opublikowane, 2 odrzucone, audit OK")
- Każdy plik dostaje status `published` + `upload_state` z URL-em

Re-run komendy jest bezpieczny (idempotent — pomija pliki już approved / rejected / published).

### D. Handoff do Nicolasa
Nicolas loguje się do Supabase Studio, przy leadzie (`order_id=KOW-MAZ-A1B2`) widzi:
- Notatkę w `notes` ze statusem zdjęć
- Pliki w bucket `lead-attachments/processed/KOW-MAZ-A1B2/` (download przez Studio UI)

Nicolas dalej buduje resztę strony klienta i wstawia zdjęcia.

## Wymagane klucze w `.env`

Robot potrzebuje `.env` z kluczami — patrz `.env.example` w katalogu projektu:

| Klucz | Po co | Bez klucza |
|---|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | auto-fetch emaila klienta po ORDER_ID (scan, żeby wypełnić nagłówek `DO:` w drafcie), upload do Storage + notatka w `leads.notes` (publish) | `photos:scan` wstawi placeholder `<EMAIL_KLIENTA>` w drafcie (wpisujesz email ręcznie kiedy będziesz wysyłać), `photos:publish` przejdzie przez review ale pada na uploadzie |

## Co robot sprawdza (EXIF flagi)

| Flaga | Co to znaczy | Co zrobić |
|---|---|---|
| 🟠 `AI_SOFTWARE` | EXIF `Software` zawiera `Midjourney/DALL-E/Stable Diffusion/Firefly/Flux` itp. | AI zdjęcia fikcyjnych osób są legalne i to wybór klienta — flaga jest informacyjna. Warta uwagi tylko jeśli: (a) klient w oświadczeniu pisał że to jego prawdziwe zdjęcia (sprzeczność), albo (b) od **2026-08-02** AI Act art. 50(4) wymaga disclaimer dla AI zdjęć przedstawiających istniejące osoby (deepfake) |
| 🟠 `GPS_PRESENT` | Zdjęcie zawiera współrzędne GPS | Dla bezpieczeństwa OK (robot stripuje), ale warto wiedzieć że klient nie wie co wysyła |
| 🟠 `PRO_CAMERA_NO_ARTIST` | Body zawodowe (Canon R5/R6/Sony A1/A7R/Nikon Z9/Hasselblad/Leica) ALE pole `Artist` puste lub ≠ klient | Prawdopodobnie pracował fotograf zawodowy. Sprawdź licencję (kto ma copyright?) |
| 🟠 `COPYRIGHT_PRESENT` | Pole `Copyright` w EXIF wypełnione | Często fotograf wpisuje siebie. Sprawdź czy pasuje do klienta |
| 🟠 `LARGE_FILE` | Plik >8 MB lub rozdzielczość >24 MP | Prawdopodobnie z sesji komercyjnej. Sprawdź licencję |

Robot **strippuje wszystkie metadane** niezależnie od flag — output zawsze jest czysty.
Flagi są tylko dla Ciebie żebyś wiedziała czy podpytać klienta.

> ⚠️ **Ograniczenie:** robot wykrywa AI tylko jeśli silnik AI zostawił ślad w EXIF
> (Adobe Firefly tak, Midjourney po uploadzie do hosta tak). Niektóre silniki
> (Nano Banana, surowy DALL-E API) NIE zostawiają tagów — wtedy zdjęcie wygląda
> dla robota jak czyste, mimo że jest AI. Pełne wykrywanie wymaga C2PA / Google
> Vision SafeSearch — odłożone (vide `PHOTO_LIABILITY_SAFEGUARDS.md` warstwa 3).
> Twoja manualna ocena „czy to wygląda jak prawdziwe zdjęcie pary" jest tu
> bardziej niezawodna niż EXIF scan.

## Co robot robi z plikami

1. Skan EXIF (`exifr`)
2. SHA-256 hash oryginału (audit trail z `PHOTO_LIABILITY_SAFEGUARDS.md` warstwa 3)
3. Strip wszystkich metadanych + resize max 2000px (longest side) + JPEG quality 85 (`sharp`)
4. SHA-256 hash output
5. Save do `processed/[ORDER_ID]/`
6. Append raport JSON

## Co robot NIE robi

- ❌ Upload do Supabase Storage — to dorobimy gdy zbudujemy data-driven invitation template
- ❌ Color grading AI pod paletę motywu — odłożone (vide PHOTO_PIPELINE_PLAN.md Faza 1)
- ❌ Powiadomienia mailowe — niepotrzebne, odpalasz robot ręcznie
- ❌ Auto-publikacja — Ty decydujesz co idzie do strony klienta

## Mapowanie z SOP Nicolasa

Robot uzupełnia (nie zastępuje) 5-krokowy SOP w `legal-templates/sop-przyjmowanie-zdjec.md`. SOP zostaje źródłem prawdy dla procesu — robot automatyzuje techniczne kroki.

| Krok SOP | Manual (z SOP Nicolasa) | Robot (`npm run photos:scan`) |
|---|---|---|
| 1. Znak wodny | patrzysz okiem | ❌ poza scope — robisz manualnie |
| 2. Metadane EXIF | SOP daje `mdls -name ...` (macOS only!) lub Cmd+I | ✅ **całkowicie zastępuje** — czyta Author/Copyright/Artist/Make/Model/Software/GPS, flaguje. Na Windows to **jedyny** wykonalny sposób — `mdls` nie istnieje |
| 3. Wygląd profesjonalny | patrzysz okiem | ⚠️ wspomaga — flaga `PRO_CAMERA_NO_ARTIST` na bazie EXIF body name |
| 4. Osoby na zdjęciu (poza parą) | patrzysz okiem | ❌ poza scope — robisz manualnie |
| 5. Treści wrażliwe (dzieci, dokumenty) | patrzysz okiem | ❌ poza scope — robisz manualnie |
| Strip metadanych przed publikacją | SOP tego nie wymaga | ✅ bonus — wszystkie metadane wycięte z plików w `processed/` |
| Audit log dla due diligence | SOP: "1-2 linijki w Supabase notes" | ✅ pełny JSON w `photos/reports/[ORDER_ID].json` z SHA-256 hashes |

### Workflow zintegrowany (SOP + robot)

1. Klient płaci 699 zł → dostaje mail żeby wysłać zdjęcia na `kontakt@zaproszeniaonline.com`
2. Pobierasz załączniki z Gmaila → `photos/inbox/[ORDER_ID]/`
3. **`npm run photos:scan -- [ORDER_ID]`** — robot robi krok 2 + 3 z SOP + strip metadanych
4. **Patrzysz okiem** — robisz kroki 1, 4, 5 z SOP (znaki wodne, osoby, treści wrażliwe) na czystych plikach z `photos/processed/[ORDER_ID]/`
5. Jeśli flagi z robota wymagają wyjaśnienia z klientem — używaj szablonów maili z `email-templates/scenarios.md` (sc. 11)
6. Notatka 1-2 linijki w Supabase notes leada (Nicolas chce takiego logu) — możesz copy-paste z JSON raportu
7. Pliki z `processed/` idą do strony klienta (manualnie, jak teraz z `magda-tomek.html`)

### Notatka do Supabase notes — szybki format

Z JSON raportu możesz wyciągnąć linijkę typu:
```
2026-05-XX | 5 zdj | EXIF: czysty (4 pliki) + 1 flag GPS_PRESENT | brak znaków wodnych | klient potwierdził licencję mailem
```

## Upgrade ścieżka

Jak liczba klientów przekroczy ~10/mc albo obróbka zacznie zżerać >3h/tydzień — czas na Fazę 1 z `PHOTO_PIPELINE_PLAN.md` (Apps Script + Gmail polling).
