# Photo Pipeline Plan — automatyzacja obróbki i publikacji zdjęć klientów

**Status:** ⚠️ Sekcje 1–9 (Faza 0/1/2 z GAS+fal.ai) — **ODŁOŻONE** decyzją Dominiki 2026-05-16. Aktualny stan w sekcji 0 poniżej.
**Autor:** Claude Code (sesja Dominiki 2026-05-14, update 2026-05-16)
**Dotyczy:** automatyzacja flow „klient wysyła zdjęcia mailem → publikacja na stronie"

---

## 0. AKTUALNY STAN — wariant (a) manual + lokalny robot (2026-05-16)

**Decyzja:** Dominika wybrała wariant (a) **manual** z `PHOTO_LIABILITY_SAFEGUARDS.md` macierzy wariantów. Reszta tego planu (Faza 0 = migracja DB + Edge Function; Faza 1 = GAS+fal.ai; Faza 2 = Sheet akceptacyjny + Supabase upload) **nie jest wdrażana w MVP**.

### Co jest zrobione

| Komponent | Co | Plik |
|---|---|---|
| Robot CLI | Skan EXIF + flagi + strip metadanych + resize + raport JSON | `scripts/photos-scan.mjs` |
| Struktura | `photos/inbox/`, `photos/processed/`, `photos/reports/` (gitignored) + `photos/README.md` | `photos/` |
| Zależności | `exifr` (EXIF reader), `sharp` (image processing) | `package.json` |
| npm script | `npm run photos:scan -- ORDER_ID` | `package.json` |
| Test sample-photos | 5 zdjęć z `test-photos/gallery-samples/` przepuszczone — brak flag (Nano Banana nie zostawia EXIF), strip działa, raport JSON OK | — |
| Test syntetycznych flag | Plik z mockowym EXIF (Midjourney + Canon R5 bez Artist + Copyright) — 3/4 flag wzbudzone | — |

### Workflow operacyjny

1. Klient wysyła zdjęcia na maila z tematem `ZDJĘCIA [ORDER_ID]` (jak w pierwotnym planie)
2. Dominika otwiera Gmail → Save attachments → folder `photos/inbox/[ORDER_ID]/`
3. Odpala `npm run photos:scan -- [ORDER_ID]`
4. Czyta console summary + flagi
5. Bierze czyste pliki z `photos/processed/[ORDER_ID]/` i wkłada do strony klienta ręcznie (jak teraz z `magda-tomek.html`)

### Co odpadło z pierwotnego planu

| Odpadło | Powód |
|---|---|
| Google Apps Script + Gmail polling | Nie potrzebne — Dominika ręcznie pobiera zdjęcia z maila |
| fal.ai NanoBanana color grading | Zrezygnowali z AI w pipeline; odpadają: DPA fal.ai, DPIA, § 8c ust. 3, § 2.9 AI, fal.ai w § 3, budget cap, 3-tier moderation |
| Sheet akceptacyjny / Claude Code as approval surface | Manual review przy okazji wkładania zdjęć w stronę klienta |
| Supabase Storage upload | Strona per klient nadal hardkodowana (compiled React) — URL Supabase nie ma gdzie czytać |
| Order ID auto-generation trigger + `photos_status` column | Dominika sama wpisuje ORDER_ID jako nazwa folderu |
| Migracja `notify-new-lead` o instrukcję mailową `ZDJĘCIA [ID]` | Może wrócić jeśli volume rośnie, ale w MVP zdjęcia idą luzem na `kontakt@` |

### Co zostaje obowiązkowe (warstwa 1+2+4 z `PHOTO_LIABILITY_SAFEGUARDS.md`)

Niezależnie od wariantu pipeline'u te rzeczy muszą zostać wdrożone przed pierwszym płacącym klientem z galerią:

- 🔴 § 8c terms — oświadczenia klienta o prawach autorskich, zgodach wizerunkowych, braku treści nielegalnych (klauzule gotowe w `memory/photo-pipeline-legal-layer.md`)
- 🔴 § 2.9 privacy o hostowaniu zdjęć z wizerunkami osób trzecich
- 🔴 Checkbox `zdjecia_oswiadczenie` w formularzu zamówienia + zapis akceptacji w DB (`photos_declaration_accepted_at`, `photos_declaration_version`)
- 🔴 `LEGAL_NOTICE_PROCEDURE.md` + kanał zgłoszeniowy + link w stopce (notice-and-action per DSA art. 16-17)
- 🟠 Manual review per batch z checklistą z `PHOTO_LIABILITY_SAFEGUARDS.md` § 3 warstwa 2 — w wariancie manual Dominika robi to przy okazji wkładania zdjęć w stronę
- 🟠 Review prawnika (~400-800 zł — tańszy bo bez AI vendora)

Robot lokalny **NIE zastępuje** żadnej z tych warstw — pełni rolę tylko warstwy 3 (technicznej): EXIF flagi + strip + hash SHA-256.

### Trigger upgrade'u na pełny pipeline

Wrócić do sekcji 3 (Faza 0/1/2) gdy:
- **>10 klientów/mc** z zamówioną galerią, ALBO
- **>3h/tydzień** czasu pracy na obróbkę zdjęć, ALBO
- Nicolas zdecyduje że strategicznie chce wycofać manualne dotykanie zdjęć klientów

### Następny logiczny krok (poza scope MVP)

Jeśli/gdy robot zacznie też uploadować do Supabase Storage — wymaga rozwiązania problemu z compiled per-klient React stron (Faza 3 z sekcji 3 — refactor data-driven). Bez tego URL z Supabase nie ma gdzie zostać podpięty automatycznie.

---

## 📜 HISTORYCZNY PLAN (sekcje 1–9 poniżej) — odłożony do upgrade'u

Wszystko poniżej tego nagłówka to oryginalny plan z 2026-05-14. Pozostawione jako referencja do przyszłego upgrade'u. **Nie wdrażać bez przeczytania sekcji 0 powyżej.**

---

## 1. Cel

Obecnie po zamówieniu klient czyta w formularzu i mailu potwierdzającym:

> *„Zdjęcia wyślijcie mailem na kontakt@zaproszeniaonline.com — JPG/PNG/HEIC w pełnej rozdzielczości. Każde zdjęcie obrabiamy pod motyw zaproszenia (kolor, kontrast, kompozycja) — wszystko w cenie 699 zł."*

(źródło: `index.html:2718-2724` + `notify-new-lead` Edge Function)

Cały etap między „mail przyszedł na kontakt@" a „obrobione zdjęcia są w gotowej stronie klienta" jest dziś **w 100% ręczny**: Dominika lub Nicolas pobiera załączniki z Gmaila, obrabia w Photoshopie/Lightroomie pod paletę zaproszenia (forest / navy-rose / bordo / terracotta), wkleja do strony przy budowaniu komponentu React per klient.

**Cel automatyzacji:** zlikwidować ręczną obróbkę i ręczne pobieranie z maila. Człowiek zostaje tylko jako akceptor („tak, ta wersja idzie do klienta") — co dla zdjęć ślubnych jest świadomą decyzją, bo stawka emocjonalna jest za wysoka na full-auto.

---

## 2. Decyzje podjęte (Dominika, 2026-05-14)

| Decyzja | Wybór |
|---|---|
| Matching zdjęć do zamówienia | **Order ID w temacie** (`ZDJĘCIA [ORDER-ID]`) |
| Zakres obróbki AI | **Tylko dopasowanie kolorystyki do motywu** (subtelny color grading pod paletę, twarze i sceny bez zmian) |
| Approval flow | **Drive `/do-akceptacji/` + powiadomienie mailem** (nie auto-deploy) |
| Storage finalny | **Supabase Storage** (`lead-attachments` bucket, już istnieje) |
| Email source dla Apps Script | **Gmail Dominiki** (`dominikakus333@`) z auto-labelką |
| Backfill order_id | **Tylko nowi leady** (stare bez ID, fallback ręczny jeśli ktoś wyśle) |

---

## 3. Architektura — 3 fazy + 1 odłożona

### Faza 0 — Fundamenty bazy danych (~30 min)

**Migracja SQL** (`supabase/migrations/20260514XXXXXX_add_photo_pipeline_columns.sql`):
- Dodać do `public.leads`:
  - `order_id TEXT UNIQUE` — krótki, czytelny slug, np. `KOW-MAZ-A1B2` (3 litery z nazwiska1 + 3 z nazwiska2 + 4-znakowy hash). Generowany przez trigger PG na INSERT.
  - `photos_status TEXT` z CHECK constraint: `awaiting / processing / ready_for_review / published / rejected`. Default: `awaiting` jeśli `photos_gallery='yes'`, else NULL.
  - `photos_processed_paths JSONB` — array URLi do obrobionych zdjęć w Supabase Storage (po akceptacji). Default `'[]'::jsonb`.
- Trigger PG: `BEFORE INSERT` generuje `order_id` z `name` (np. „Anna Kowalska i Jan Mazurek" → `KOW-MAZ-` + losowe 4 znaki hex).
- **Bez backfill** — istniejące 2 testowe leady zostają z `order_id = NULL`.

**Update Edge Function `notify-new-lead`** (`supabase/functions/notify-new-lead/index.ts`):
- W mailu potwierdzającym do klienta dodać sekcję:
  > **Wysyłanie zdjęć do galerii**
  > Wyślijcie pliki na **kontakt@zaproszeniaonline.com** z tematem:
  > **`ZDJĘCIA [KOW-MAZ-A1B2]`**
  > Bez tego ID maile mogą zaginąć w obróbce automatycznej.
- W mailu wewnętrznym (do Nicolasa+Dominiki) — dodać linijkę `Order ID: KOW-MAZ-A1B2` dla referencji.

**Deliverables Fazy 0:**
- migracja zaaplikowana w Supabase
- `notify-new-lead` v6 deployed
- 1 testowy lead INSERT-owany żeby zweryfikować że order_id się generuje i mail go zawiera

---

### Faza 1 — Gmail → Drive → AI (~2-3 h)

**Stack:** Google Apps Script (GAS) jako jedyny komponent. Free tier, time-driven trigger co 15 min, działa na infrastrukturze Google bez utrzymywania serwera.

**Setup jednorazowy:**
1. Filter Gmail w Dominika koncie: `subject:(ZDJĘCIA OR ZDJECIA) has:attachment` → auto-label `zaproszenia-zdjecia-inbox`
2. Folder Drive: `My Drive / Zaproszenia / pipeline /` z podfolderami:
   - `inbox/` — kopia raw z każdego maila (audit trail)
   - `[ORDER_ID]/raw/` — oryginalne pliki per klient
   - `[ORDER_ID]/processed/` — po obróbce AI
   - `do-akceptacji/[ORDER_ID]/` — symlinks/skróty + manifest JSON + thumbnails
   - `published/[ORDER_ID]/` — po akceptacji (już w Supabase też)
3. Apps Script project (single `.gs` file ~200 linii) z:
   - Properties: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FAL_AI_KEY` (Script Properties = encrypted at rest)
   - Time trigger: every 15 minutes

**Logika skryptu:**
```
1. Pobierz wszystkie wątki z labelką `zaproszenia-zdjecia-inbox` które NIE mają labelki `zdjecia-zrobione`
2. Dla każdej wiadomości:
   a. Wyciągnij ORDER_ID z tematu regex /ZDJ[ĘE]CIA\s*\[([A-Z0-9-]{8,16})\]/i
      → brak match: oznacz labelką `zdjecia-niezidentyfikowane`, mail alarmowy do Dominiki, skip
   b. Wyciągnij wszystkie załączniki typu image/* (filter: jpg, png, heic, webp; max 10MB każdy)
      → brak załączników: labelka `zdjecia-brak-zalacznikow`, mail alarmowy, skip
   c. Lookup w Supabase: GET /rest/v1/leads?order_id=eq.{ORDER_ID}&select=name,email,package
      → 0 wyników: labelka `zdjecia-zlej-id`, mail alarmowy do Dominiki, skip
      → wykryj `theme` z `package` field (mapping: forest/navy-rose/bordo/terracotta)
   d. PATCH /rest/v1/leads?order_id=eq.{ORDER_ID} → photos_status='processing'
   e. Zapisz raw do Drive: /Zaproszenia/pipeline/{ORDER_ID}/raw/photo-1.jpg, photo-2.jpg, ...
   f. Dla każdego zdjęcia: wywołaj fal.ai NanoBanana Edit API
      - prompt: "Apply subtle color grading to match {theme} wedding palette: {hex_codes}. 
                 Preserve faces, skin tones, and scene composition. Light adjustment only."
      - input: base64 z raw photo
      - output: enhanced JPEG/WebP
      → save do /Zaproszenia/pipeline/{ORDER_ID}/processed/photo-N.webp
   g. Wygeneruj thumbnails (300x300 max, via DriveApp Image API)
   h. Stwórz manifest.json w /do-akceptacji/{ORDER_ID}/:
      { order_id, client_name, email, theme, photos: [
        { raw_url, processed_url, thumb_url, ai_prompt, processed_at }
      ]}
   i. Wyślij mail do Dominiki+Nicolasa (przez GmailApp.sendEmail):
      Subject: "Zdjęcia gotowe do akceptacji — {client_name} [{ORDER_ID}]"
      Body: HTML z embedded thumbnailami + linkiem do folderu Drive + linkiem do Sheeta akceptacyjnego (Faza 2)
   j. PATCH /rest/v1/leads → photos_status='ready_for_review'
   k. Mark Gmail message: usuń `zaproszenia-zdjecia-inbox`, dodaj `zdjecia-zrobione`
3. Loop end. Następny trigger za 15 min.
```

**Error handling:**
- Każde wywołanie fal.ai w try/catch z retry x2 (exponential backoff: 5s, 20s).
- Jeśli fal.ai pada na wszystkich retry → fallback: zapisuje raw do `processed/` z labelką `processed_fallback_raw_only`, manifest oznacza `ai_failed: true`, mail alarmowy.
- Jeśli Supabase PATCH pada → log do Cloud Logging, nie blokuje reszty pipeline'u (DB stan można odtworzyć z Drive).
- Każdy ERROR + stack trace → mail alarmowy do Dominiki + Nicolasa.

**Limity Google Apps Script (free tier):**
- 6 min execution per trigger run → przetwarzamy max ~5-8 zdjęć per run (fal.ai latency ~3-5s/zdjęcie). Reszta poczeka 15 min. Akceptowalne przy obecnym volumie.
- 20MB attachment size limit per file (więcej niż 10MB form-imposed).
- 100 trigger executions / day (96 = co 15 min). OK.

**Deliverables Fazy 1:**
- Apps Script project deployed + trigger active
- Drive structure utworzony
- fal.ai key wygenerowany i dodany do Script Properties
- Testowy flow: Dominika wysyła do siebie maila z 2 zdjęciami + `ZDJĘCIA [TEST-A1B2]`, czeka 15 min, weryfikuje że w `/do-akceptacji/TEST-A1B2/` są obrobione pliki + dostała mail powiadomienie

---

### Faza 2 — Approval UI + Supabase upload (~2 h)

**Stack:** Google Sheet jako tani UI + ten sam Apps Script z dodatkowym `onEdit` triggerem.

**Setup:**
1. Sheet `Zdjęcia — kolejka akceptacji` z kolumnami:
   `Order ID | Klient | Theme | Data wpłynęcia | Thumbnails (formula =IMAGE(url)) | Status (dropdown) | Notatka | Action timestamp`
2. Status dropdown: `⏳ Czeka / ✅ Approve / ❌ Reject / 🔄 Re-process / 📤 Published`
3. Apps Script z Fazy 1 rozszerzony o:
   - `appendPendingBatchToSheet(orderId, ...)` — wywoływane na końcu pipeline'u Fazy 1
   - `onEdit(e)` trigger — gdy kolumna Status zmieni się na `✅ Approve`:
     a. Pobierz pliki z `Drive: /Zaproszenia/pipeline/{ORDER_ID}/processed/`
     b. Upload do Supabase Storage: `POST /storage/v1/object/lead-attachments/processed/{ORDER_ID}/photo-N.webp`
     c. Wygeneruj public/signed URLs
     d. PATCH `/rest/v1/leads?order_id=eq.{ORDER_ID}` → `photos_processed_paths = [url1, url2, ...]`, `photos_status='published'`
     e. Przenieś Drive folder z `do-akceptacji/` do `published/`
     f. GmailApp.sendEmail do klienta: „Twoje zdjęcia są obrobione i gotowe" + thumbnail preview
     g. Update sheet Status → `📤 Published`, action timestamp
   - Na `❌ Reject` → mail do Dominiki+Nicolasa „odrzucone, dlaczego?" → ręczne dosłanie z poprawkami
   - Na `🔄 Re-process` → re-run AI z mocniejszym/innym promptem (eskalacja: subtle → moderate → strong color grade)

**Notatka o storage policy:**
- Aktualny RLS bucket: `anon CAN INSERT, brak SELECT/UPDATE/DELETE`. Dla publikacji potrzebujemy:
  - `service_role` (Apps Script via service_key) — może wszystko, OK
  - `anon` lub `public` SELECT na ścieżce `processed/*` żeby strona klienta mogła wyświetlać zdjęcia
  - **TODO:** dodać policy `public_read_processed_photos` w migracji Fazy 0 albo osobnej migracji w Fazie 2

**Deliverables Fazy 2:**
- Sheet `Zdjęcia — kolejka akceptacji` utworzony
- onEdit trigger aktywny
- Migracja RLS storage rozszerzona o public SELECT na `processed/*`
- Testowy flow: zaakceptować testowy batch z Fazy 1, weryfikacja: pliki w Supabase Storage z publicznym URL, `leads.photos_processed_paths` zawiera URLe, klient dostał mail

---

### Faza 3 — Auto-rendering na stronie klienta (ODŁOŻONA)

**Problem:** Per-klienckie strony (typu `magda-tomek.html`) to dziś osobno kompilowany React: `vendor/magda-compiled.js` to ~50KB minifikowanego kodu z **hardkodowanymi treściami** (imiona, data, palette, URLe zdjęć). Każdy nowy klient = nowy compiled JS file kompilowany ręcznie z template'a.

**Co byłoby potrzebne:**
1. Refactor: jeden generyczny `vendor/invitation-app.js` (React app) który czyta URL slug (`/magda-tomek`) → fetch `/rest/v1/leads?slug=eq.magda-tomek&select=*,rsvps(*)` z Supabase → renderuje wszystko (imiona, datę, palette, galerię z `photos_processed_paths`, plan dnia, mapy).
2. Dodać `slug TEXT UNIQUE` do `leads` (generowany przy approve).
3. Static HTML per klient (`magda-tomek.html`) staje się minimalnym shellem ładującym uniwersalny JS.
4. Dane edytowalne via Supabase Studio przez Dominikę+Nicolasa (zamiast edycji compiled JS).

**Estymata:** ~1-2 dni focused work. Wpływa na **całą architekturę produktu**, nie tylko na pipeline zdjęć. Decyzja o tym jest osobna i większa niż ten plan.

**Status:** ODŁOŻONA. Po Fazach 0-2 ręczne wklejanie zdjęć do strony zostaje — ale to już tylko skopiowanie URLa z Supabase, nie ręczna obróbka w Photoshopie. Czas pracy per klient: z ~45 min → ~5 min.

---

## 4. Koszty zewnętrzne (per klient)

| Komponent | Koszt | Notatka |
|---|---|---|
| Gmail | 0 zł | free, w ramach Google account |
| Google Drive | 0 zł | free do 15 GB; 5 zdjęć/klient × ~5 MB raw + 5 MB processed = ~50MB/klient → 300 klientów zanim hit limit |
| Apps Script | 0 zł | free tier wystarcza (6 min/run, 100 runs/day) |
| Supabase Storage | 0 zł | free tier 1 GB; ~5 zdjęć × ~1 MB processed WebP = 5 MB/klient → 200 klientów do limitu |
| fal.ai NanoBanana Edit | ~$0.039 / zdjęcie | 5 zdjęć × $0.039 = **~$0.20 / klient** (~0.80 zł przy USD/PLN 4.0) |

**Total marginal cost per klient: ~0.80 zł.** Przy cenie pakietu 699 zł — pomijalne.

---

## 5. Ryzyka i mitigations

| Ryzyko | Mitigation |
|---|---|
| Klient zapomni dodać ORDER_ID do tematu | Apps Script fallback: jeśli temat zawiera „zdjęcia" + załączniki, ale brak ID → mail alarmowy do Dominiki „Niezidentyfikowane zdjęcia od X" + folder `inbox/unidentified/`. Manualny tagging do właściwego klienta. |
| fal.ai zwraca brzydki/zniszczony color grade | Approval gate: zdjęcie nie trafia na stronę bez Twojej akceptacji. Re-process button z silniejszym/słabszym promptem. Manualny fallback: użyj raw bez AI. |
| Klient wyśle 20 zdjęć (ponad limit 5) | Manifest fixed to N (z `leads.photos_count`); reszta zapisana do `extra/` z mailem do klienta: „dostaliśmy 20 — w pakiecie jest 5, wybierz które" |
| fal.ai API key wyciek | Script Properties w GAS = encrypted; nie commitujemy do repo; rotacja co 90 dni (dodać do `LEGAL_TODO.md`) |
| Wymóg RODO: data processing | fal.ai = przetwarzanie zdjęć osobowych poza UE (USA). **Wymaga DPA z fal.ai i dodania do polityki prywatności jako vendor.** Dodać do `LEGAL_TODO.md` przed go-live Fazy 1. |
| Supabase Storage public SELECT na `processed/*` = każdy z URL może zobaczyć | URL zawiera UUID-like ścieżkę (`processed/{ORDER_ID}/photo-N.webp` gdzie ORDER_ID = 12 chars losowych) → security by obscurity. Realistyczne dla zaproszeń ślubnych. Alternatywa: signed URLs z TTL 30 dni — ale komplikuje rendering strony. |

---

## 6. RODO i prawne

**Nowy vendor: fal.ai (USA, Inc.)**
- Wymaga DPA podpisanego przed produkcją
- Dodać do polityki prywatności `privacy.html` jako processor (kategorie: zdjęcia, transfer do USA)
- SCC (Standard Contractual Clauses) sprawdzić w fal.ai DPA
- Dodać wpis do `LEGAL_DATA.md` w sekcji „Vendor DPAs"

**Drive jako miejsce przechowywania zdjęć ślubnych:**
- Google Workspace ma DPA → ale Dominika używa **osobistego Gmail/Drive**, nie Workspace → osobiste konto Google ma inną politykę
- Rekomendacja: rozważyć przejście na Google Workspace (dedykowane konto `pipeline@zaproszeniaonline.com`) **JEŚLI volume klientów wzrośnie**. Przy <20 klientach/mc — osobiste konto z opcją „nie pokazuj w wynikach wyszukiwania" wystarcza, ale to gray zone.

---

## 7. Open issues do dograć z Nicolasem

1. **Czy Nicolas akceptuje fal.ai jako vendor** (USA, dodatkowy processor zdjęć osobowych)? Alternatywa: lokalny model na maszynie Nicolasa (Comfy/Automatic1111) — wolniejsze, ale dane nigdy nie opuszczają laptopa.
2. **Czy Dominika ma czas/cierpliwość codziennie patrzeć w Sheet akceptacyjny?** Jeśli nie — kto jest primary approver, jaki SLA?
3. **Co z klientami który już są w bazie (2 testowe)** — czy będą wysyłać zdjęcia? Jeśli tak, fallback ręczny.
4. **Faza 3 — kiedy** uderzamy w refactor data-driven invitation app? Po jakimś threshold klientów (np. >10/mc)?

---

## 8. Estymata sumaryczna

| Faza | Czas pracy | Wymagana akceptacja |
|---|---|---|
| Faza 0 | ~30 min | Migracja DB + Edge Function deploy (Nicolas approval do merge na main) |
| Faza 1 | ~2-3 h | fal.ai key (Nicolas), DPA fal.ai (Nicolas), Drive struktura (Dominika) |
| Faza 2 | ~2 h | RLS storage migration (Nicolas), Sheet setup (Dominika) |
| Faza 3 | ~1-2 dni | Decyzja architektoniczna o templatyzacji (Nicolas) |

**Łącznie Fazy 0-2:** ~5h pracy. Faza 3 to osobny temat.

---

## 9. Następny krok

Po przeczytaniu tego planu Dominika+Nicolas decydują:
- ⏳ Akceptujemy plan jak jest? Idziemy z Fazą 0 + 1 w jednej sesji.
- 🔄 Modyfikujemy (np. „bez fal.ai, robimy lokalnie")? Update planu, restart.
- ❌ Odkładamy do czasu pierwszego płacącego klienta z zamówioną galerią? Akceptowalne — pipeline ręczny działa, automatyzacja nie jest blokerem marketing-go.

Gdy decyzja zapadnie — kontynuujemy w nowej sesji od Fazy 0.
