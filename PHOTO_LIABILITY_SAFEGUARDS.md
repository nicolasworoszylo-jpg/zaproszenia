# Photo Liability Safeguards — 5-warstwowa architektura zabezpieczeń przy hostingu zdjęć klientów

**Status:** 📝 PLAN — czeka na decyzję Nicolasa+Dominiki kiedy startujemy wdrożenie
**Autor:** Claude Code (sesja Dominiki 2026-05-15)
**Dotyczy:** prawne i operacyjne zabezpieczenie hostingu zdjęć klientów na stronach `zaproszeniaonline.com/{slug}`, **niezależnie od metody obróbki** (manual/hybryda/AI)

**⚖️ Zastrzeżenie:** dokument ma charakter informacyjny i NIE zastępuje porady adwokata/radcy prawnego. Przed go-live wymagana konsultacja z prawnikiem RODO+IT (estymata: 400-1500 zł jednorazowo, patrz `LEGAL_TODO.md`).

---

## 1. Po co osobny dokument

`PHOTO_PIPELINE_PLAN.md` opisuje **JAK** zdjęcia trafiają z maila na stronę. Ten dokument opisuje **JAK SIĘ CHRONIĆ** niezależnie od metody. Większość warstw zabezpieczeń obowiązuje przy każdym z 4 wariantów pipeline'u:

- (a) Manual całkowity — bez nawet ręcznej edycji
- (b) Hybryda bez AI — ręczny color grading w Photoshopie
- (c) Pełna automacja z AI — fal.ai color grading
- (d) Manual review → boty publikują — sprawdzanie ręczne, upload automatyczny (decyzja Dominiki z 2026-05-15)

Ten plik jest pipeline-agnostyczny. Wybór wariantu modyfikuje tylko **warstwę 3** (techniczną) — pozostałe 4 warstwy stosują się zawsze.

---

## 2. Centralny paradoks: aktywny vs bierny host

Hostingowa nieodpowiedzialność (safe harbor) z **art. 14 UŚUDE** i **DSA art. 6** chroni Was, dopóki:
1. Nie macie „rzeczywistej wiedzy" o nielegalnym charakterze konkretnej treści
2. Po uzyskaniu wiedzy działacie niezwłocznie (notice-and-action)

**Manual review = świadoma kontrola treści przed publikacją = „rzeczywista wiedza".** Wasza rola prawna przesuwa się z „biernego hosta" na „kuratora/wydawcę". Po wpadce nie powiecie sądowi „nie wiedzieliśmy" — wiedzieliście i zaakceptowaliście.

To NIE znaczy, że nie warto sprawdzać. Znaczy, że **strategia obrony się zmienia**:
- Z: „art. 14 UŚUDE — bierny host, brak wiedzy"
- Na: „należyta staranność (due diligence) — sprawdziliśmy wszystko co rozsądny operator może sprawdzić, oto audit log"

Operacyjnie manual review świetnie tnie ryzyka „widoczne na pierwszy rzut oka" (CSAM, NSFW, symbole nielegalne, wodoznaki). NIE pomaga przy ryzykach niewidocznych (copyright fotografa bez wodoznaku, brak zgody gościa na publikację). Dlatego potrzebne są inne warstwy.

Podstawa orzecznicza paradoksu: TSUE C-324/09 (L'Oréal v eBay), TSUE C-682/18 (YouTube/Cyando).

---

## 3. Pięć warstw architektury

### Warstwa 1 — Kontraktowa (regres wobec klienta)

**Cel:** żeby po wpadce można było żądać zwrotu kosztów od klienta, który skłamał w oświadczeniu.

**Co wdrożyć:**

| Element | Plik / miejsce | Status |
|---|---|---|
| § 8c regulaminu — oświadczenia klienta o prawach autorskich, zgodach wizerunkowych osób trzecich, braku treści nielegalnych | `terms.html` po obecnym § 8b | ❌ |
| § 2.9 polityki prywatności — informacja o hostowaniu zdjęć z wizerunkami osób trzecich | `privacy.html` po § 2.8 | ❌ |
| Obowiązkowy checkbox `zdjecia_oswiadczenie` przy zamówieniu z linkiem do § 8c | `index.html` formularz | ❌ |
| Kolumny w DB: `photos_declaration_accepted_at TIMESTAMP`, `photos_declaration_version TEXT` (np. `'2026-05-15-v1'`) | migracja Supabase | ❌ |
| **Druga deklaracja przed publikacją** — automatyczny mail do klienta po review: *„Sprawdziliśmy N zdjęć. Potwierdź jeszcze raz, że masz prawa autorskie i zgody wszystkich rozpoznawalnych osób → KLIK"* | nowy email template + endpoint | ❌ |

**Druga deklaracja to nowość względem analizy z 2026-05-15** — krytyczna dla wariantu (d). Ratio: pierwsza deklaracja (przy zamówieniu) jest abstrakcyjna („wyślę zdjęcia"), druga (przed publikacją) jest konkretna („oto te 5 zdjęć, wszystkie OK"). Sąd uzna drugą za mocniejszą podstawę regresu.

**Wzory klauzul:** gotowe w transkrypcie sesji 2026-05-15 (zobacz `memory/photo-pipeline-legal-layer.md`). Przed wklejeniem zweryfikować strukturę numeracji w obecnym `terms.html` / `privacy.html`.

---

### Warstwa 2 — Operacyjna (manual review z protokołem)

**Cel:** wykrycie i odrzucenie nielegalnego / problematycznego contentu PRZED publikacją + udokumentowanie procesu (dowód należytej staranności).

**Strukturyzowany checklist per batch** — nie „rzuciłam okiem", tylko:

```
☐ Brak osób nieletnich w kontekście niewłaściwym (nagość, używki, broń)
☐ Brak nagości, treści seksualnych, sugestywnych
☐ Brak widocznych wodoznaków / podpisów fotografa („© Studio Foto Anna")
☐ Brak logo / brandów osób trzecich w eksponowanej pozycji (poza marką klienta)
☐ Brak symboli nielegalnych (swastyka, runy SS, symbole terrorystyczne)
☐ Brak treści przemocowych / krwawych
☐ Jakość techniczna OK (ostrość, ekspozycja)
☐ EXIF: pole „Copyright" / „Artist" zgadza się z klientem (lub puste)
☐ Próbka 1-2 zdjęć przez Google Lens (reverse search) — nie znajduje się w sieci jako cudza praca
```

**Każda decyzja w audit logu** w Supabase:

```sql
CREATE TABLE photo_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES leads(order_id),
  reviewed_by TEXT NOT NULL,           -- 'Dominika' / 'Nicolas'
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  checklist_json JSONB NOT NULL,        -- {csam: false, nudity: false, watermark: false, ...}
  decision TEXT CHECK (decision IN ('approved', 'rejected', 'reprocess')),
  rejection_reason TEXT,
  notes TEXT,
  photo_count INT,
  photo_hashes JSONB                    -- SHA-256 zaakceptowanych plików (immutability proof)
);
```

To Wasz dowód „dochowaliśmy należytej staranności" w razie sporu. Wymóg DSA art. 17 (statement of reasons dla moderation decisions).

**Pisemny SOP** (Standard Operating Procedure) w `legal-templates/PHOTO_REVIEW_SOP.md`:
- Definicja każdego punktu checklisty (co to jest „symbol nielegalny", co to jest „eksponowana pozycja")
- Procedura w przypadku wątpliwości (default: odrzucenie + kontakt z klientem)
- Procedura przy podejrzeniu CSAM (NIE oglądać dalej, NIE kopiować, NIE usuwać — zgłosić do organów per DSA art. 18, kontakt: Dyżurnet.pl)
- Kto może być reviewerem (Dominika, Nicolas — z imienia)
- SLA review (np. 5 dni roboczych od otrzymania kompletu)

---

### Warstwa 3 — Techniczna (automatyka która wspomaga człowieka)

**Cel:** zmniejszyć obciążenie reviewera + uchronić go przed traumatyzującym contentem (CSAM) + dostarczyć sygnały trudne do dostrzeżenia okiem.

**Komponenty (do wdrożenia w pipeline'u niezależnie od wariantu a/b/c/d):**

| Komponent | Co robi | Koszt | Priorytet |
|---|---|---|---|
| **Google Cloud Vision SafeSearch** pre-screening | Klasyfikacja: adult/violence/racy/spoof/medical (5 poziomów). Hit „adult: VERY_LIKELY" → nigdy nie pokazujemy reviewerowi, do `quarantine/`, alert | ~$0.0015/zdjęcie | 🔴 KRYTYCZNY |
| **EXIF auto-ekstrakcja** | Model aparatu, pole Copyright, pole Artist, software, GPS. Auto-flag jeśli body pro (Canon R5/R6, Sony A7R/A1, Nikon Z9, Hasselblad, Leica) ORAZ pole Artist ≠ klient → „prawdopodobnie pracował fotograf, sprawdź licencję" | 0 zł (lokalnie) | 🟠 WYSOKI |
| **Auto-flag wagi/rozdzielczości** | Plik >8 MB LUB rozdzielczość >24 MP → prawdopodobnie z sesji komercyjnej, podwójnie sprawdź | 0 zł | 🟠 WYSOKI |
| **Wsadowe reverse search** | Tylko dla zdjęć flagowanych przez powyższe — Google Lens / TinEye API | ~$0.01/zdjęcie | 🟡 ŚREDNI |
| **Token akceptacji w DB** | Bot publikujący NIE działa na podstawie kliku w UI, tylko sprawdza `photo_review_log.decision='approved'` AND `checklist_json` ma wszystkie pola `false` (poza `quality_ok: true`). Brak rekordu → odmowa | 0 zł | 🔴 KRYTYCZNY |
| **Hash zaakceptowanych plików** | SHA-256 każdego pliku zapisany przy akceptacji. Bot przed publikacją weryfikuje że hash plików z Drive zgadza się z zatwierdzonymi → ochrona przed podmianą po review | 0 zł | 🟠 WYSOKI |

**Krytyczna zasada architektoniczna:** bot publikujący jest „głupi" — nie podejmuje żadnych decyzji content-related, tylko wykonuje zatwierdzone akcje. Cała inteligencja decyzyjna jest po stronie reviewera. To prawnie ważne (decyzja = człowiek) i bezpieczeństwo (nie da się oszukać bota promptem ukrytym w EXIF).

---

### Warstwa 4 — Post-publication (notice-and-action)

**Cel:** szybka reakcja gdy ktoś z zewnątrz zgłosi że opublikowane zdjęcie narusza jego prawa. Utrzymanie safe harbor wymaga niezwłocznego działania (art. 14 UŚUDE / DSA art. 16-17).

**Co wdrożyć:**

| Element | Co | Status |
|---|---|---|
| **`LEGAL_NOTICE_PROCEDURE.md`** w repo | Pełna procedura: kanał zgłoszenia, formularz, weryfikacja zgłaszającego, SLA ≤14 dni (DSA art. 16 ust. 6), statement of reasons (DSA art. 17), prawo odwołania | ❌ |
| **Dostępny kanał zgłoszeniowy** | Mail `legal@zaproszeniaonline.com` LUB formularz na stronie. Widoczny link w stopce każdej strony klienta | ❌ |
| **Procedura zgłoszenia CSAM organom** | Jasna ścieżka eskalacji do Dyżurnet.pl (zespół CERT Polska) + Policja, art. 304 KPK | ❌ |
| **Trusted flaggers** (DSA art. 22) | Mechanizm priorytetowego traktowania zgłoszeń od zweryfikowanych podmiotów (NASK, Dyżurnet, organizacje walczące z CSAM) | ❌ (low priority dla małego B2C) |
| **Coroczny raport transparency** (DSA art. 24) | NIE dotyczy mikroprzedsiębiorstw <50 osób + <10 mln EUR obrotu. **Wy jesteście wyłączeni.** | ✅ wyłączenie |

**Krytyczne:** notice-and-action obowiązuje **niezależnie od pre-publication review**. Nawet jeśli review przepuścił legalny content, później może wpłynąć zgłoszenie (np. „ten gość na zdjęciu to ja, nie dałem zgody"). Pre i post to dwie osobne warstwy.

---

### Warstwa 5 — Ubezpieczenie

**Cel:** absorbcja finansowa wpadek, których żaden proces operacyjny nie zatrzyma 100%.

**Krytyczny kontekst:** Nicolas jako działalność nieewidencjonowana = **odpowiada całym majątkiem osobistym**. Brak osobnej osobowości prawnej (vs sp. z o.o.). Jedna sprawa sądowa z gruchnięciem na 50-100 tys. zł → realny problem osobisty.

**Polisa do rozważenia: OC zawodowa / cyber liability** dla działalności content-publishing.

| Parametr | Wartość |
|---|---|
| Estymata kosztu | 1500-3500 zł/rok dla małego B2C (~50-100 klientów/rok) |
| Suma ubezpieczenia | 100-500 tys. zł (zależnie od wariantu) |
| Co pokrywa | Roszczenia z tytułu naruszenia praw autorskich, wizerunkowych, RODO, defamation; koszty obrony prawnej; kary administracyjne (część polis) |
| Czego NIE pokrywa | Rażące niedbalstwo, czyny umyślne, naruszenia znane przy zawarciu polisy |
| Próg opłacalności | ~5 klientów rocznie pokrywa polisę przy stawce 699 zł/klient |

**Vendorzy do query:**
- Hiscox Polska (content liability, IT)
- Allianz (Cyber Plus)
- PZU (OC zawodowa IT)
- Warta (cyber)

**Działanie:** zlecić Nicolasowi pozyskanie 3 ofert przed go-live Fazy 1 pipeline'u. Polisa może być warunkiem koniecznym dla compliance z due diligence rozsądnego operatora.

---

## 4. Macierz: która warstwa konieczna przy którym wariancie

| Warstwa | Wariant (a) Manual | Wariant (b) Hybryda PS | Wariant (c) AI fal.ai | Wariant (d) Review→bot |
|---|---|---|---|---|
| 1. Kontraktowa | ✅ Konieczna | ✅ Konieczna | ✅ Konieczna (+ § 8c ust. 3 AI) | ✅ Konieczna |
| 2. Operacyjna (checklist+log) | ✅ Konieczna | ✅ Konieczna | ✅ Konieczna | ✅ KRYTYCZNA |
| 3. Techniczna |  |  |  |  |
| — SafeSearch pre-screening | 🟡 Zalecana | 🟡 Zalecana | ✅ Konieczna | ✅ Konieczna |
| — EXIF auto-flag | 🟡 Zalecana | 🟡 Zalecana | 🟡 Zalecana | ✅ Konieczna |
| — Token akceptacji + hash | n/d | n/d | ✅ Konieczna | ✅ Konieczna |
| 4. Notice-and-action | ✅ Konieczna | ✅ Konieczna | ✅ Konieczna | ✅ Konieczna |
| 5. Ubezpieczenie | 🟠 Zalecane | 🟠 Zalecane | 🔴 Mocno zalecane | 🟠 Zalecane |

Wniosek: różnica między wariantami w zakresie zabezpieczeń jest mniejsza niż w zakresie procesu obróbki. **Warstwa 1, 2, 4 są bezwarunkowe.** Warstwa 3 skaluje się z automatyzacją. Warstwa 5 zawsze warta rozważenia.

---

## 5. Kolejność wdrożenia (kiedy zrobić co)

### Przed pierwszym płacącym klientem z zamówioną galerią

🔴 **Blokery:**
1. Warstwa 1 — § 8c, § 2.9, checkbox, kolumny DB (1 PR, ~3h pracy)
2. Warstwa 2 — `PHOTO_REVIEW_SOP.md` + tabela `photo_review_log` + UI (Claude Code w sesji, jak w wariancie d) (~2-3h pracy)
3. Warstwa 4 — `LEGAL_NOTICE_PROCEDURE.md` + kanał `legal@` + link w stopce (~2h pracy)
4. Review prawnika (~400-1500 zł, 1-2 tygodnie kalendarzowe)

🟠 **Mocno zalecane przed go-live:**
5. Warstwa 3 — SafeSearch pre-screening (kilka godzin kodu Apps Script)
6. Warstwa 5 — minimum 1 oferta polisy OC zawodowej do rozważenia

### Po pierwszych 5 klientach

7. Warstwa 3 — pełna implementacja (EXIF, token akceptacji, hash)
8. Warstwa 5 — wykupienie polisy

### Skala >10 klientów/mc

9. Rewiziować całą architekturę z prawnikiem (czy procedury skalują się)
10. Faza 3 z `PHOTO_PIPELINE_PLAN.md` (refactor data-driven)

---

## 6. Otwarte decyzje wymagające Nicolasa+Dominiki

1. **Wariant pipeline'u (a/b/c/d)** — wciąż nie ostateczna, blokuje rozpoczęcie warstwy 3
2. **Druga deklaracja przed publikacją** — czy wdrażamy? (rekomendacja Claude: tak, mocny dowód regresu, ~3h pracy)
3. **Kto reviewer + SLA** — Dominika sama, Nicolas sam, czy redundancja? Dominika ma cierpliwość do codziennego patrzenia?
4. **Budget na prawnika** — 400-1500 zł, w którym tygodniu szukamy?
5. **Polisa OC zawodowa** — czy zlecamy Nicolasowi pozyskanie ofert teraz, czy po pierwszych klientach?
6. **Konto `legal@zaproszeniaonline.com`** — czy zakładamy osobne, czy alias do `kontakt@`?
7. **Próg upgrade'u do sp. z o.o.** — przy jakim volumenie wartości aktywów osobistych Nicolasa warto wydzielić podmiot? (oddzielny temat, ale powiązany — w sp. z o.o. odpowiedzialność osobista znika)

---

## 7. Co świadomie NIE jest w tym dokumencie

- **Zgody RODO klienta na przetwarzanie jego własnych danych** — pokryte przez obecne `privacy.html` + formularz. Ten plik dotyczy ZDJĘĆ, nie danych zamówieniowych.
- **DPA z procesorami** — pokryte przez `LEGAL_TODO.md` punkt 3. Status DPA z Supabase/Stripe/Vercel/Resend/fal.ai jest tam (nie tutaj).
- **DPIA dla wariantu (c)** — pokryta przez `memory/photo-pipeline-legal-layer.md`. Tu nie powtarzamy.
- **Klauzule muzyczne § 8b ust. 3** — osobny temat indemnifikacji, pokryty w transkrypcie 2026-05-15.

---

## 8. Powiązane dokumenty

- `PHOTO_PIPELINE_PLAN.md` — architektura techniczna (JAK), niezależna od tego pliku (JAK SIĘ CHRONIĆ)
- `LEGAL_TODO.md` — szersza lista compliance (RODO, DPA, podstawy działalności)
- `LEGAL_DATA.md` — dane administratora, vendorzy
- `memory/photo-pipeline-plan-pending.md` — kontekst decyzji architektonicznych z sesji 2026-05-14 i 2026-05-15
- `memory/photo-pipeline-legal-layer.md` — szczegółowa analiza prawna 3 warstw obrony (źródło dla części niniejszego dokumentu)

---

## 9. Changelog

- **2026-05-15** — Pierwsza wersja dokumentu. Stworzona po decyzji Dominiki o eksploracji wariantu (d) „manual review → boty publikują" jako alternatywy dla wariantów (a/b/c). Wprowadza pojęcie 5-warstwowej architektury i rozróżnia ją od decyzji o wariancie pipeline'u.
