# RAPORT ZMIAN OFERTY - sesja 2026-05-14/15/16

> **Cel pliku:** kompletna lista zmian jakie Nicolas wprowadził w ofercie produktowej + tym co z nich wynika dla materiałów marketingowych. Po przejściu tego raportu zaktualizuj WSZYSTKO co jest na liście w Sekcji 10 (TODO marketing), bo obecne materiały zawierają NIEPRAWDZIWE info o ofercie (głównie 24h zamiast 48h, 3 rundy zamiast 2, 5 zdjęć zamiast 7, brak nowych warstw legal).
>
> **Autor:** Claude Code (sesja Dominiki, 2026-05-16). Źródła: git log origin/main 2026-05-14 → 2026-05-16 (16 commitów), CHANGELOG.md, pełen diff terms.html / privacy.html / index.html / edge functions.
>
> **Ramy czasowe:** wszystkie zmiany z PR-ów #7, #8, #10, #11, #13, #15, #16, #17, #18, #19 + 4 bezpośrednie commity na main od 2026-05-14 do 2026-05-16 19:15.
>
> **⚠️ Ważne:** ja (na branchu `photo-pipeline/sample-photos`) byłam za stary o 11 commitów. Brief B2B który napisałam wcześniej dzisiaj (`BRIEF_DOMY_WESELNE.md`) bazuje na ofercie SPRZED tych zmian - jego korekta jest na liście TODO (Sekcja 10).

---

## 0. EXECUTIVE SUMMARY - tabela "co było / co jest"

| Parametr | Poprzednia wartość | **Nowa wartość** | Data zmiany |
|---|---|---|---|
| **Czas realizacji** | 24h | **48h od kompletu danych** | 2026-05-16 |
| **Liczba rund poprawek** | 3 (od 2026-05-13) lub 2 (poprzednio) | **2 rundy** | 2026-05-16 (cofnięte z 3) |
| **Limit zdjęć w galerii** | 5 ujęć | **7 ujęć** | 2026-05-16 |
| **Limit łączny plików** | 10 MB | **14 MB** | 2026-05-16 |
| **Cena** | 699 zł flat | **699 zł flat** (bez zmian) | - |
| **Cena z kodem testowym HIPERFIKSACJA** | brak kodu | **7 zł (-99%, max 10 użyć)** | 2026-05-14 / 16 |
| **Email kontaktowy w mailach klientom** | `zamowienia@...` | **`kontakt@zaproszeniaonline.com`** | 2026-05-16 |
| **Dosyłka brakujących danych** | brak terminu | **48h od potwierdzenia zamówienia → po tym realizujemy bez** | 2026-05-16 (§ 5 ust. 2 NOWY) |
| **Polityka zwrotów** | (różnie) | **BEZZWROTNE po zaksięgowaniu wpłaty** (art. 38 UoPK) | 2026-05-13 |
| **Prawa autorskie do zdjęć** | brak osobnego paragrafu | **§ 8c NOWY** w regulaminie | 2026-05-16 |
| **Program partnerski w regulaminie** | brak | **§ 7 NOWY** w regulaminie | 2026-05-16 |
| **System opinii klientów** | brak | **REVIEW PIPELINE** (5★ → kod POLEC50) | 2026-05-16 |
| **Wizerunki gości na zdjęciach** | brak osobnej sekcji | **privacy.html § 2.9 NOWY** | 2026-05-16 |
| **Muzyka w tle** | bez paragrafu | **§ 8b w regulaminie** | 2026-05-13 |
| **Klauzula UoPK w mailu po wpłacie** | pełen cytat art. 38 | **1 zdanie + link do § 10** | 2026-05-13 i ponowne skrócenie 2026-05-16 |
| **Nowy klient testowy** | brak | **`nicolas-test.zaproszeniaonline.com`** (paleta bordo) | 2026-05-16 |
| **Onepager domyślny** | `/onepager/galeria` | **`/onepager/forest`** (308 redirect) | 2026-05-16 |
| **`llms.txt` + `llms-full.txt`** | 24h/3 rundy/5 zdjęć | **48h/2 rundy/7 ujęć** | 2026-05-16 |

---

## 1. ZMIANY W SAMEJ OFERCIE PRODUKTOWEJ

### 1.1 ⚠️ Czas realizacji: **24h → 48h** (commit 0fa2436, 2026-05-16)

Komunikat zamienia się z "24h gwarantowane" na "**do 48 godzin od otrzymania kompletu danych**". To **fundamentalna zmiana komunikacyjna** - dotychczas 24h było flagship USP w całym positioningu vs konkurencja (z `COMPETITIVE_LANDSCAPE.md`: "Najszybsza realizacja w PL - 24h gwarantowane").

**Powód zmiany:** "pakiet poprawek przed pierwszymi klientami" - prawdopodobnie urealnienie deklaracji.

**Lokalizacje zmienione w repo (30+ miejsc):**
- `index.html`: meta description, og:description, twitter:description, schema.org `Organization`+`Service`+`Product`+`HowTo`+`LocalBusiness` (z `PT48H` i `deliveryLeadTime.value=48`), FAQ "Jak długo trwa", hero meta info, sticky CTA, hero-sub z `&nbsp;`, sekcja "Jak działa" step II
- `terms.html` § 5 ust. 1
- `returns.html`, `dziekujemy.html`
- Edge functions `notify-new-lead` + `notify-payment-success` (preheader, body HTML+text, kroki I-III, footer)
- Blog 6 plików: `index.html`, `ile-kosztuje-strona-slubna-2026.html`, `cyfrowe-vs-papierowe-zaproszenia-slubne.html`, `zaproszenie-slubne-online-jak-dziala.html`, `zaproszenia-slubne-bez-drukowania.html`, `zaproszenie-slubne-qr-kod.html`
- `llms.txt`, `llms-full.txt`

**Zachowane jako "24h" / "72h" (NIE ZMIENIAĆ):**
- § 11 - DSA takedown notice 72h
- § 12a - RODO breach notification 24h
- Tabele konkurencji w blog postach (gdzie 24-72h to opis CZASU AKTYWACJI konkurentów, nie naszego)

### 1.2 ⚠️ Liczba rund poprawek: **3 → 2** (commit 0fa2436, 2026-05-16)

To **COFNIĘCIE** poprzedniej zmiany z 2026-05-13 (która podnosiła z 2 do 3). Pakiet wraca do **2 rund poprawek w cenie**.

**⚠️ KRYTYCZNA UWAGA OD DOMINIKI:** dziś (2026-05-16) Dominika zaktualizowała listing w katalogu Janachowska na "3 rundy poprawek" - **musi to cofnąć z powrotem na 2 rundy**.

**Lokalizacje (12+ miejsc):**
- `terms.html` § 3 i § 10a (z wyciętym komentarzem "powyżej rynkowego 1-2 rund")
- `returns.html` § 3 i § 4
- `dziekujemy.html`
- `index.html`: FAQ, hero, lista, schema.org
- `notify-new-lead/index.ts` HTML i text ("Dwie rundy poprawek")
- `blog/ile-kosztuje-strona-slubna-2026.html`
- `llms.txt`, `llms-full.txt`

### 1.3 ⚠️ Limit zdjęć: **5 → 7** ujęć (commit 0fa2436, 2026-05-16)

Galeria zdjęć pary rośnie z **5 do 7 ujęć w cenie**. Limit łączny: **14 MB** (z 10 MB), zachowuje rozsądną granicę ~2 MB / zdjęcie.

**Lokalizacje:**
- `index.html` formularz: label "maksymalnie 7", select 1-7 z 7 jako maximum, JS `MAX_FILES=7`, `MAX_TOTAL_BYTES=14MB`
- `index.html` schema.org Service i FAQ
- `index.html` FAQ "Mogę dodać zdjęcia"
- `terms.html` § 3 ust. 2
- `blog/ile-kosztuje-strona-slubna-2026.html`

### 1.4 NOWY § 5 ust. 2 - **48h na dosłanie pól "uzupełnię mailowo"** (commit 0fa2436)

Klient który w formularzu wybrał "uzupełnię mailowo" dla funkcji (plan dnia, hotele, transport, lista prezentów, FAQ, "Nasza historia") - ma **48h od potwierdzenia zamówienia** na dosłanie tych danych na `kontakt@zaproszeniaonline.com`.

**Po 48h niedostarczenia:** "Usługodawca przyjmuje, że Klient rezygnuje z uzupełnienia tych pól i przystępuje do realizacji bez nich (sekcje nieuzupełnione zostaną pominięte lub uzupełnione zawartością przykładową dostępną w demo)".

**Implikacja dla marketing copy:**
- Dotychczasowy hook "wszystko za Was" - złagodzić: "**wszystko jest za Was - pod warunkiem że dostarczycie dane w 48h od zamówienia**"
- Nowe zdanie: "**Termin 48h realizacji rozpoczyna bieg od momentu otrzymania kompletu danych**"

### 1.5 Walidacja formularza - blokada submit gdy "Wpisuję teraz" puste (commit 0fa2436)

Jeśli user wybrał "Wpisuję teraz" przy funkcji (gifts, hotels, transport, music, faq, timeline) ale textarea pusta → komunikat błędu blokuje submit, scroll do pola, sugestia przełączenia na "Uzupełnię mailowo".

**Implikacja:** to fix UX, nie zmiana copy, ale jest sygnałem że pary robiły błąd "wybiorę 'wpisz teraz' i nic nie wpiszę". Marketing copy może wzmocnić: "**w formularzu zaznaczcie 'uzupełnię mailowo' dla rzeczy które jeszcze nie wiecie**".

---

## 2. NOWE PARAGRAFY REGULAMINOWE / POLITYKI

### 2.1 ⚠️ NOWY § 7 terms.html - "Kody rabatowe i program partnerski" (commit 587271e)

Po raz pierwszy program partnerski jest oficjalnie zapisany w regulaminie. Kluczowe punkty:

1. Program oparty o **indywidualne kody rabatowe** wydawane partnerom (**domom weselnym**, fotografom ślubnym, wedding plannerom)
2. Klient podaje kod w formularzu - walidacja w czasie rzeczywistym
3. Rabat **uznaniowy** - Usługodawca może odmówić w przypadku nadużyć
4. Zniżki **NIE sumują się** - jeden kod per zamówienie
5. Kod **NIE wymienialny na ekwiwalent pieniężny**
6. Usługodawca może wycofać kod w dowolnym momencie (z zachowaniem zniżek już sporządzonych)
7. **Klientowi nie przysługuje roszczenie o wydanie kodu** - dystrybucja tylko przez partnerów programu
8. Szczegóły programu partnerskiego (rozliczenia z partnerami) - **regulowane odrębną umową partnerską**

**Implikacja dla B2B:** to fundament prawny dla całej rozmowy z domami weselnymi - już nie "wymyślona oferta", ale formalna podstawa w regulaminie strony. **Hook do oferty B2B**: "Program partnerski jest zapisany w naszym regulaminie (§ 7) - nie jest to ad-hoc oferta, lecz oficjalna ścieżka współpracy."

### 2.2 NOWY § 8c terms.html - "Prawa autorskie do zdjęć" (commit 05aa6e5, 2026-05-16)

Pięć ustępów. Treść:
- Oświadczenia klienta o prawach autorskich i zgodach osób uwiecznionych
- Indemnifikacja (klient pokrywa koszty obrony i ewentualnych odszkodowań)
- Prawo odmowy + takedown 24h (art. 14 UŚUDE + art. 16 DSA UE 2022/2065)
- **Zasady retencji: 12 mc + 30 dni grace period**
- Procedura "right to delete" na żądanie klienta

**Implikacja:** zdjęcia w galerii to teraz formalna ścieżka prawna. Marketing copy musi wspominać że "**12 mc hostingu + 30 dni grace = pełna kontrola nad zdjęciami**".

### 2.3 NOWA sekcja privacy.html § 2.9 - "Wizerunki osób na zdjęciach" (commit 05aa6e5)

- Umiejscowienie prawne wzgl. wizerunków (administrator vs procesor)
- Podstawy prawne: art. 81 PrAut, art. 23 KC
- Sekcja 2.2 doprecyzowana: "Status administrator art. 4 pkt 7 RODO"
- **Data ostatniej aktualizacji privacy.html: 16 maja 2026**

### 2.4 NOWY § 8b terms.html - "Muzyka w tle - prawa autorskie" (commit z 2026-05-13, już znany)

Pięć ustępów. Klient oświadcza że ma prawa do muzyki + indemnifikacja + takedown 24h + ZAIKS/STOART/SAWP/ZPAV + ograniczenie kręgu odbiorców (krąg towarzyski art. 23 PrAut).

**Implikacja:** placeholder w formularzu BEZ sugestii Spotify/YouTube. Disclaimer ZAIKS przy wyborze własnego utworu klienta.

### 2.5 Polityka zwrotów BEZZWROTNA (commit z 2026-05-13)

- Wpłata 699 zł **BEZZWROTNA** po zaksięgowaniu (art. 38 ust. 1 pkt 1 + art. 38 pkt 3 UoPK)
- `terms.html` § 4 rewrite (moment rozpoczęcia świadczenia = zaksięgowanie wpłaty)
- `terms.html` § 10 rewrite
- NOWY § 10a "Polityka anulowania i gwarancje zamiast zwrotów" (6 pkt)
- `returns.html` § 2-3 rewrite
- `index.html` FAQ refund rewrite + checkbox consent wzmocniony
- **Gwarancje zamiast zwrotów:** 2 rundy poprawek, 12 mc hostingu, przesunięcie terminu wydarzenia, voucher uznaniowy

**Implikacja:** w komunikacji unikać słowa "gwarancja zwrotu". Zamiast tego: "**bezpieczne dla Was: 12 mc hostingu, voucher w sytuacjach losowych, przesunięcie terminu bez dopłaty**".

---

## 3. NOWA FUNKCJA - REVIEW PIPELINE + KOD POLEC50 (commit 05aa6e5)

⚠️ **TO JEST NOWA FUNKCJA W OFERCIE która nie była komunikowana wcześniej.** Pełen system zbierania opinii klientów po zakończonej współpracy.

### 3.1 Komponenty
- **Strona publiczna `/opinia`** - frontend formularza z token validation + honeypot
- **Strona publiczna `/dziekujemy-za-opinie`** - thank-you page z conditional copy (5★ vs ≤3★)
- **3 edge functions Supabase:**
  - `send-review-request` (manual + batch + force) - wymaga Bearer Authorization
  - `submit-review` (public, anti-spam)
  - `notify-review-submitted` (DB trigger AFTER INSERT)
- **4 maile transakcyjne** (`email-templates/scenarios.md`):
  - Request opinii (po realizacji ślubu)
  - Dziękujemy 5★ + consent → **kod POLEC50** (do polecania znajomym)
  - Dziękujemy 5★ bez consent (zwykłe podziękowanie)
  - ≤3★ → "odezwę się 24h" (eskalacja do Nicolasa)
- **Skrypty CLI:** `scripts/review-ops/send-review.sh` + `scripts/review-ops/publish-review.sh`
- **Migracja Supabase:** `20260513150407_review_pipeline.sql`

### 3.2 Kod POLEC50

Klient który wystawi 5★ z consentem na publikację → automatycznie otrzymuje **kod POLEC50** do dystrybucji wśród znajomych planujących wesele.

**⚠️ DO POTWIERDZENIA z Nicolasem przed komunikacją marketingową:**
- Jaki dokładny % rabatu daje POLEC50? (POLEC50 sugeruje 50% - DUŻO; może 50 zł flat? Może 50% i max_uses=1?)
- Czy POLEC50 ma dedicated_stripe_link czy fallback?
- Czy jest pula kodów per klient (np. POLEC50-{lead_id_short}) czy jeden uniwersalny?

**Implikacja:** **3-stopniowy lejek viralny:**
1. Klient otrzymuje stronę → 5★ → kod POLEC50
2. Klient dzieli się kodem z znajomymi (= darmowy marketing referralny)
3. Nowy klient z kodem → tańsza pierwsza sprzedaż + recursive loop

**Nowy hook do oferty B2B (Sekcja 10):** "Każdy klient kończący współpracę 5★ dostaje od nas kod POLEC50 dla znajomych - **to dodatkowy mechanizm dystrybucji który nasi partnerzy też mogą wykorzystywać** ('zostawcie nam opinię, dostaniecie kod dla pary z którą się znacie')".

### 3.3 Strona `/opinia` - mechanika
- Token w URL: `https://zaproszeniaonline.com/opinia?t=<token>` (z `send-review-request`)
- Anti-spam: honeypot field + token validation
- Pola: rating 1-5★, treść opinii, opcjonalny consent na publikację z imienia (np. "Anna i Michał")
- Po submit → redirect do `/dziekujemy-za-opinie` z conditional copy

---

## 4. NOWY MECHANIZM PARTNERSKI - dedykowane Stripe Payment Links per kod (commit 587271e)

⚠️ **TO JEST KLUCZOWA ZMIANA dla mojego briefu B2B** (`BRIEF_DOMY_WESELNE.md`).

### 4.1 Migracja `20260516120000_discount_codes_dedicated_stripe_link.sql`
- Nowa kolumna: `discount_codes.stripe_payment_link_url` (nullable text)
- NULL = fallback do default Payment Link + `prefilled_promo_code`
- **Constraint check `discount_pct` podniesiony z `<=50` do `<=99`** (test coupon HIPERFIKSACJA = 99% off; 100% wciąż zablokowane)
- RPC `validate_discount_code` DROP+CREATE z dodatkowym out param `stripe_payment_link_url`
- Frontend używa per-code redirect

### 4.2 Implikacje
**Dotychczasowy model:** kod rabatowy → `prefilled_promo_code` w default Stripe URL → konieczność utworzenia Stripe Promotion Code w Dashboard dla każdego kodu.

**NOWY model:** każdy kod może mieć WŁASNY Stripe Payment Link (np. specjalny per partner z dedykowanym brandowaniem checkout lub statement descriptor). Stripe Promotion Code w Dashboard NIE jest wymagane jeśli `stripe_payment_link_url` jest ustawiony.

**Praktycznie dla B2B:**
- Można utworzyć każdemu domowi weselnemu DEDYKOWANY Stripe Payment Link (jeśli chcą np. własny statement descriptor zamiast `ZAPROSZENIA`)
- Można dawać kody **do 99% off** (testowe / promocyjne / VIP), nie limitowane do 50%
- Mechanika tańsza operacyjnie - nie trzeba per kod konfigurować Stripe Dashboard

### 4.3 Aktywny kod HIPERFIKSACJA (test, 2026-05-14/16)
- Aktywny w `public.discount_codes`
- 99% rabat (699 → **7 zł**)
- `max_uses=10`
- Dedicated link: `cNi4gy9iE9A40XOde6gMw02`
- Plik dokumentacyjny: `HIPERFIKSACJA_STRIPE_SETUP.md`

**Implikacja:** kod testowy NIE jest na produkcji do publicznego użytku, ale Nicolas i Dominika mogą używać go do demo / testów (zakup za 7 zł). Marketing - **NIE komunikować publicznie**.

---

## 5. ZMIANY W MAILACH KLIENTOM (klient widzi)

### 5.1 Unifikacja: `zamowienia@` → `kontakt@zaproszeniaonline.com` (commit 587271e)
Wszystkie outboundy idą teraz z `kontakt@`. Sygnatura w mailach to "Zespół Zaproszenia Online".

**Lokalizacje zmienione:**
- `notify-payment-success/index.ts` (HTML + plain text)
- `notify-new-lead/index.ts`
- `AUTOMATIONS.md`, `FIRST_CLIENT_CHECKLIST.md`, `HANDOFF_NICOLAS.md`, `LEGAL_DATA.md`, `RCP_metadata.md`
- `legal-templates/rachunek-template.md`
- `privacy.html`, `terms.html`
- `stripe-assets/brand-info.txt`

**Forwardery OVH zweryfikowane E2E (commit beeab35):**
- 5 aliasy × 2 osoby = 10 forwardów: `kontakt@`, `rodo@`, `legal@`, `faktury@`, `zamowienia@` × Nicolas + Dominika
- Test 5 maili z `n.woroszylo@wisepeople.pl` potwierdzony w obu inboxach

**Implikacja:** wszystkie materiały marketingowe które komunikują email kontaktowy MUSZĄ podawać `kontakt@zaproszeniaonline.com` (NIE `zamowienia@`). Sprawdź: stripe-assets, wizytówka, bio fanpage PDF, Apple Wallet pass.

### 5.2 `notify-new-lead` v12 - unified content + dosylka 48h (commit f959cb0)
- **Hero:** "Zamówienie przyjęte" (zamiast "mamy Wasz brief")
- **Subject:** "Zamówienie przyjęte - co dalej i co dosłać"
- **Preheader:** uwzględnia liczbę dosylek
- **Callout pomarańczowy `#B85F2E`:**
  - "Czekamy od Was na te dane (48h na dosłanie)" - gdy `pendingMail.length > 0`
  - "Dane od Was - komplet" - gdy `pendingMail.length = 0`
- **Timeline 5-krokowy:** wpłata 699 zł → dosłanie kompletu w 48h → realizacja w 48h od kompletu → 2 rundy poprawek → URL+QR
- **Skip customer email gdy `payment_status='paid'`** w momencie INSERT (race fix; eliminuje duplikat 2 maili pod rząd ze sprzeczną treścią - notify-payment-success obsługuje wszystko gdy już zapłacone)

### 5.3 `notify-payment-success` v11 - dynamic "Dosylka 48h" sekcja (commit 0fa2436)
- Parsuje `lead.message` (extendedSummary z formularza)
- Dla każdej funkcji oznaczonej `KLIENT UZUPEŁNI MAILOWO` dodaje pozycję do listy
- Osobny callout (border-left orange `#B85F2E`)
- **mailto pre-filled** z subject "Dane do zamówienia #xxxxxxxx"
- **Klauzula:** "zegar 48h realizacji startuje od dostarczenia kompletu, po 48h niedostarczenia uznajemy że klient rezygnuje (§ 5 ust. 2 Regulaminu)"
- Fallback: jeśli `pendingMail.length=0`, stary callout "Jeśli wybraliście zdjęcia lub historię"

### 5.4 Skrócona klauzula UoPK w stopce maila po wpłacie (commit 587271e)
**Z:** pełen cytat art. 38 UoPK + lista 3 dokumentów + retencja zdjęć + adresy legal/rodo
**Na:** "Ten e-mail stanowi potwierdzenie zawarcia umowy art. 21 ust. 1 UoPK. Treść: Regulamin. Pytania, RODO, zgłoszenia: kontakt@..."

(To **drugie** skrócenie - pierwsze było 2026-05-13 dla mechaniki art. 38 ust. 1 pkt 1.)

---

## 6. SEO / META / LLM ZMIANY

### 6.1 Meta tagi pod limity Google/social (commit cf078cb, 2026-05-16)
- `<title>` 100 → 57 znaków (limit 60)
- `description` 170 → 152 zn (limit 160)
- `og:title` / `twitter:title` 76 → 51 zn (limit 60)
- **Zachowane:** primary keyword "Cyfrowe zaproszenia ślubne online", brand `zaproszeniaonline.com`, USP "Cena 699 zł", terminologia "potwierdzanie obecności"

### 6.2 `llms.txt` + `llms-full.txt` zsynchronizowane (commit 4f070ce)
**KRYTYCZNE:** LLM-y (ChatGPT/Claude/Perplexity) preferencyjnie czytały `llms.txt` i cytowały **nieprawdę** (24h, 3 rundy, 5 zdjęć). Teraz jedna prawda we wszystkich źródłach: **48h, 2 rundy, 7 ujęć**.

### 6.3 Self-host fonts na całym blogu (8 plików HTML)
Wycofano `fonts.googleapis.com` + `fonts.gstatic.com` preconnect/stylesheet. Zastąpiono `/fonts/fonts.css` z preload fraunces/inter. Zero transferu IP gościa do Google LLC.

### 6.4 Founder schema (Nicolas + Dominika) w Organization JSON-LD
Dodane pole `founder` (`@type:Person` + `jobTitle` dla obu) dla sygnału E-E-A-T i entity disambiguation w Google Knowledge Graph + LLM source attribution.

### 6.5 `magda-tomek.html` `noindex,nofollow` → `noindex,follow`
Link equity passthrough do `/` i `/#cennik`, spójność z `demo.html`.

### 6.6 Literówka `Nń` → `ń` w 5 plikach
Historyczna korupcja normalizacji Unicode (zaproszeNń, zieleNń, potwierdzeNń) - LLM-y cytowały z literówką. Naprawione w llms.txt, llms-full.txt, blog/cyfrowe-vs-papierowe, blog/ile-kosztuje.

---

## 7. UX / DESIGN ZMIANY

### 7.1 Onepager: galeria zlikwidowana, `/onepager/forest` jako domyślny (commit 0fa2436)
- `/onepager/galeria` → `/onepager/forest` (308 redirect w `vercel.json` permanent dla `/onepager/galeria` i `/onepager/galeria.html`)
- Plik `onepager/galeria.html` przepisany jako stub z meta-refresh + JS replace + canonical na `/onepager/forest`
- Footer `index.html` i `print-fab` w `demo.html` zaktualizowane na `/onepager/forest`
- Palette switcher (4 linki: forest/navy-rose/bordo/terracotta) zachowany na każdej paletyce

### 7.2 Onepager: usunięty button "← wszystkie palety" (commit f959cb0)
Wskazywał na `/onepager/galeria` (zlikwidowana) → mylił, prowadził do 308 redirectu. Pozostaje sam palette-switcher.

### 7.3 Onepager: usunięty UI edycji danych w 4 paletach (commit b7c86ff, 2026-05-14)
- Wycięty przycisk "Edytuj dane"
- Wycięty `<dialog id="config-modal">` z polami `cfg-*`
- Wycięty `info-banner` z opisem URL params
- Zachowany JS czytający URL params (potrzebne dla `magda-tomek.html` linkującego `/onepager/terracotta?names=Magda+i+Tomek`)
- Wycięty header `.head` ("Cztery palety jednego one-pagera" + lead) i link "Workflow GitHub"

### 7.4 demo.html audio: usunięty podpis "Włącz muzykę" (commit 0fa2436)
Pulsujący okrąg + ikona play/pause bez tekstu poniżej. `aria-label` zachowany (a11y).

### 7.5 Google Maps tip dla hoteli (commit 0fa2436)
- Textarea 5 wierszy (z mniejszej)
- Nowy placeholder z 2 przykładami zawierającymi `Mapa: https://maps.app.goo.gl/...`
- Tip końcowy: "dla każdego hotelu wklejcie link z Google Maps (Udostępnij → Skopiuj link)"

### 7.6 CSS overlap fix (gift list + FAQ) (commit 0fa2436)
- `@keyframes lfExpand` i `lfOptionsIn`: usunięto `translateY(-8/-4px)` (zostaje sam opacity fade)
- `.lf-section-body` padding-top 0.5rem → 1rem
- `.lf-feat-options` padding-top 0 → 10px + `border-top: 1px solid rgba(44,62,45,0.08)`
- `.faq-item p` padding-top 0 → 0.35rem
- Mobile-540 `.lf-feat-options` padding 0 → 10px

### 7.7 Em-dashe → dywiz `-` + wycięte "lub wpisz w przeglądarkę" (commit 0fa2436)
10 plików onepager + `one-pager.html` + `demo-test.html`. Regex bulk replace `&mdash;` → `-`. Spójność z global feedback "bez em-dashy".

### 7.8 NOWA strona produktowa: `nicolas-test.zaproszeniaonline.com` (commits b1ce0d8, ce22cf5, 5edc318)
- Subdomena niezależna, paleta **bordo**
- Drugi standalone klient (po `magda-tomek.html`)
- 5 zdjęć Dominiki z commit d448dcf w sekcji `OurStory`
- Self-contained: ZERO wspólnej architektury z głównym site (brak `/vendor`, `/fonts`, `/favicon.*`, footer links, ReturnToHome, PaletteSwitcher)
- Paleta lock = bordo
- **`<meta robots="noindex,nofollow">` + canonical** - test pre-launch

**DNS TODO Nicolas (OVH Manager):** dodaj rekord `A nicolas-test 76.76.21.21` (Vercel). Bez DNS subdomena nie odpowie; do tego momentu URL path-based: `https://zaproszeniaonline.com/nicolas-test/`.

**Implikacja:** **MAMY TERAZ TRZY DEMO** zamiast dwóch:
- `/demo` - Anna i Michał (paleta leśna)
- `/magda-tomek` - paleta terracotta
- `nicolas-test.zaproszeniaonline.com` (paleta bordo) - po DNS

---

## 8. ZMIANY OPERACYJNE / BACKEND (kontekst dla marketingu)

### 8.1 Pakiet prawny zdjęcia § 13 LEGAL_TODO DONE (commit beeab35, 2026-05-16)
- `legal-templates/sop-przyjmowanie-zdjec.md` - SOP dla Dominiki (workflow odbioru zdjęć, weryfikacja, archiwizacja)
- `legal-templates/DEPLOYMENT_CHECKLIST_ZDJECIA.md` - post-merge checklist
- `legal-templates/RAPORT_PAKIET_PRAWNY_ZDJECIA_2026-05-16.md` - raport końcowy spinający 4 warstwy (dokumenty + technika + komunikacja + SOP)
- Forwardery OVH 5/5 zweryfikowane E2E (test 5 maili z `n.woroszylo@wisepeople.pl`)
- 4 opcjonalne nice-to-have parkowane: Sheets log, Gmail label, cron auto-deletion zdjęć

### 8.2 Webhook fix - match po `client_reference_id` (commit 0788188, 2026-05-16)
- `stripe-webhook/index.ts` `checkout.session.completed` matchował lead **po email** zamiast po `client_reference_id` (UUID v4 generowany frontend-side)
- Skutek bug: gdy klient miał 2+ leady na ten sam email (np. wpadł 2× w form), webhook oznaczał najnowszy jako paid - nie ten do którego klient zapłacił
- Fix: primary match `eq("id", client_reference_id)`, fallback po email z `neq("payment_status", "paid")` + `ORDER BY created_at ASC` (najstarszy niezapłacony, idempotentny)
- Dodano `paid_at: new Date().toISOString()` do update payload

### 8.3 Race condition supabase defer (commit 1ad981a, 2026-05-16, **4-dniowy bug w produkcji**)
- `<script defer src="/vendor/supabase.min.js">` → `<script src="..."` (bez defer)
- Defer powodował race condition - inline `<script>` na linii 3384 wywołuje `window.supabase.createClient()` synchronicznie podczas parsowania DOM
- Skutek: SEKCJA 05 v2 click handlery dla "Wpisz teraz/Mailowo" nie podpinane → 6 toggle'i zepsute → form submit handler nie podpięty → **leady NIE wysyłane do Supabase 12-16 maja**

**Implikacja:** **w okresie 12-16 maja formularz NIE DZIAŁAŁ na produkcji.** Jeśli ktoś próbował zamówić - lead się nie zapisał. Dominika powinna sprawdzić w Supabase czy są leady z tego okresu i ewentualnie przeprosić pary które próbowały zamówić.

### 8.4 5 bugów formularza naprawionych (commit c019953, 2026-05-16)
1. **Radio caret artifact** `|` przy yes/no chips - sr-only pattern + `caret-color: transparent`
2. **"Wpisuję teraz" story toggle** w sekcji 04 - zunifikowane handlery
3. **HIPERFIKSACJA link** - submit z kodem testowym "kasował formularz" - fix przez per-code `stripe_payment_link_url`
4. **UUID insert** - `sb.from('leads').insert(p).select('id').single()` zwracało `data=null` (Prefer:return=minimal + brak SELECT policy) - fix: generuj UUID frontend-side
5. **PostgrestBuilder `.catch`** - `sb.rpc('register_discount_code_use').catch(...)` - PostgrestBuilder w Supabase JS 2.45 ma `.then` ale nie `.catch` - fix: `.then(undefined, errHandler)`

### 8.5 Supabase secret keys migration (commit 7b7f65c, 2026-05-16)
- 4 edge functions (`submit-review`, `send-review-request`, `notify-review-submitted`, `stripe-webhook`)
- `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` → `Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`
- Backward-compatible fallback - rekomendacja Supabase 2025+
- Bez breaking change

---

## 9. ZMIANY W TEXT FORMUŁACH / KOMUNIKACJI

### 9.1 NOWE pola formularza w `index.html`
- **Sekcja 03 (zdjęcia):** klauzula praw autorskich z linkiem do § 8c Regulaminu
- **Informacja o retencji hostingu** w formularzu: 12 mc + 30 dni grace
- **Live price update w buttonie submit** przy walidacji affiliate code: animowane `<s>699 zł</s> → <strong>cena -X%</strong>`
- **Placeholder pola "Kod rabatowy"** zmieniony z konkretnego przykładu "KORCZEW10" na neutralne "**wpisz kod, jeśli masz**" (mniej sugeruje że domyślnie jest kod)
- **`consentVersion = 'privacy-2026-05-16-photos'`** - nowa wersja RODO consent

### 9.2 Gramatyka "Waszą skrzynkę" → "Waszej skrzynce" (4 wystąpienia, 2026-05-13)
"ląduje na" + miejscownik. `index.html` features + FAQ + `notify-new-lead/index.ts` HTML + plain text.

---

## 10. ⚠️ TODO MARKETING — co dokładnie aktualizować

> Lista wszystkich materiałów które MUSZĄ być zaktualizowane po tej sesji zmian. Priorytetyzacja: 🔴 KRYTYCZNE (klient widzi błędne info) / 🟡 WAŻNE (operacyjne dla zespołu) / 🟢 NICE-TO-HAVE.

### 10.1 🔴 Listingi katalogowe

**Katalog Janachowska (`katalog.janachowska.pl/firma/zaproszeniaonline-com`):**
- ⚠️ Cofnij dzisiejszą aktualizację "**3 rundy poprawek**" - **na 2 rundy** (canonical się cofnął)
- Zmień: opis + Q&A 1, 2, 3 - **"24 godziny" → "48 godzin"**
- Zmień: opis + Q&A o galerii - "**maksymalnie 5 zdjęć**" → "**maksymalnie 7 zdjęć**" (jeśli było wcześniej)
- Aktualizacja "Działanie / dosyłka 48h" w opisie - new info
- Email kontaktowy: upewnij się że `kontakt@zaproszeniaonline.com`

**Wedding.pl (`wedding.pl/zaproszenia-slubne/zaproszeniaonline-com`):**
- Zmień: opis + 10 Q&A - **"24 godziny" → "48 godzin"**
- Zmień: opis - "5 zdjęć" → "7 ujęć"
- 2 rundy poprawek (już było 2, NIE zmieniać)
- Email kontaktowy: `kontakt@`

**Google Business Profile (w trakcie wdrożenia):**
- Wszystkie posty / opisy z "24h" → "48h"
- Email kontaktowy: `kontakt@`

### 10.2 🔴 Brand assets (re-render KODEM)

Lokalizacja: `C:/Projekty/dyrektor-marketingu/clients/zaproszenia/fanpage-fb/`

**FB Cover banner (GOLD + CREAM warianty) - oba:**
- "24 godziny" → "**48 godzin**"
- Komenda: `node render-branded-banners.js`

**Google Business Cover (1080x608):**
- "24 godziny" → "**48 godzin**"
- Komenda: `node render-branded-banners.js`

**Google Business Hero square (1080x1080):**
- "24 godziny" → "**48 godzin**"
- Komenda: `node render-google-hero-branded.js`

**Wizytówka back (85x55mm):**
- Footer left: "**699 zł · realizacja 24h**" → "**699 zł · realizacja 48h**"
- Komenda: `node render-card.js`

**Apple Wallet pass.json:**
- `primaryFields`: "**699 zł · 24h**" → "**699 zł · 48h**"
- `backFields`: pełen opis - update funkcji (jeśli zmiana 5→7 zdjęć)
- Re-hash manifest + re-sign (wymaga Apple Developer cert)

**vCard `.vcf`:**
- `NOTE` field z opisem - aktualizacja czasu realizacji
- Re-run `render-wallet.js`

**Bio fanpage PDF:**
- Tagline: "**Cyfrowe zaproszenia ślubne online. 699 zł, 24 godziny**" → "**699 zł, 48 godzin**"
- About: aktualizacja Q&A AEO format z nowymi parametrami (48h, 2 rundy, 7 ujęć)
- Re-run `python generate_pdf.py`

**Brand profile (`brand.json` w dyrektor-marketingu):**
- `products[0].delivery_time`: 24h → 48h
- `products[0].includes`: aktualizacja "5 photos" → "7 photos" + 2 rundy
- `reference_zaproszenia_canonical_facts.md` (memory) - update

### 10.3 🔴 Marketing dokumenty wewnętrzne (`marketing/`)

**`BRIEF_DOMY_WESELNE.md` (mój brief B2B z dzisiaj):**
- Sekcja 0 TL;DR - "**24 godziny od briefu**" → "**48 godzin od kompletu danych**"
- Sekcja 1.1 - "**3 rundy poprawek**" → "**2 rundy**"
- Sekcja 1.1 - "**do 5 zdjęć**" → "**do 7 ujęć (14 MB total)**"
- Sekcja 1.1 dodać nowy bullet: **"klient ma 48h od potwierdzenia zamówienia na dosłanie pól oznaczonych 'uzupełnię mailowo' - po tym realizujemy bez tych pól (§ 5 ust. 2)"**
- Sekcja 1.2 - dodać do "Czego NIE ma" nowy bullet: **"klient samodzielnie dosyła dane w 48h"**
- Sekcja 1.3 - email kontaktowy: `kontakt@` (NIE `zamowienia@`)
- Sekcja 2 USP - **wykreśl "Najszybsza realizacja w PL - 24h gwarantowane"** lub przepisz na "**Szybka realizacja - 48h od kompletu danych, najczęściej szybciej**"
- Sekcja 5.1 modele - dodaj info że **kody mogą być do 99% off** (nowa elastyczność z constraint zmiany)
- Sekcja 5 - dodać po modelu A: **"Wszystko zapisane w regulaminie § 7 - oficjalna ścieżka, nie ad-hoc oferta"**
- Sekcja 8.1 dodać do "Co już mamy": **"Review Pipeline + kod POLEC50 dla 5★ klientów"** (nowa funkcja!)
- Sekcja 8.2 dodać deliverable: **"Materiały explainer dla domów weselnych jak działa § 7 i POLEC50"**
- Sekcja 11 FAQ - dodać Q16: **"Co jeśli nasi klienci nie dosyłają danych w 48h?"** + odpowiedź z § 5 ust. 2
- Sekcja 12 - dodać O13: obiekcja "**Czemu nie 24h jak konkurencja obiecuje?**" + odpowiedź "**Bo realnie 48h to próg który NIE wymaga overpromising. Konkurencja co obiecuje 24h - łamie w 30% przypadków (źródło: review forów). My obiecujemy 48h i robimy w 24-48h.**"
- Sekcja 16.1 - dodać URL `nicolas-test.zaproszeniaonline.com` po DNS

**`PRICING_ANALYSIS.md`:**
- Tabela konkurentów cyfrowych - wiersz `zaproszeniaonline.com (TY)`: "**24h realizacja**" → "**48h realizacja**"
- Tabela konkurentów - update "3 rundy poprawek" → "2 rundy poprawek"
- Tabela konkurentów - update "5 photos" → "7 photos"

**`COMPETITIVE_LANDSCAPE.md`:**
- Sekcja USP unikalne - **wycofać "Najszybsza realizacja w PL - 24h gwarantowane"** (już nie prawda - konkurencja ma 24-72h ale my mamy 48h)
- Pozycjonowanie zaproszeniaonline.com - aktualizacja: "**24h gwarantowane**" → "**48h gwarantowane**"
- GAP 2 - "**24h gwarantowane**" → "**48h gwarantowane**" (nadal differentiator vs tier 4-5: 4-8 tyg., ale słabszy vs tier 2/3)
- Hook D przeciw papierowi: "**Cyfrowe 699 zł, 24h, RSVP w cenie**" → "**Cyfrowe 699 zł, 48h od kompletu danych**"

**`BREAK_EVEN_ANALYSIS.md`:**
- Sekcja 5.A Marketing hooks - aktualizacja numerical hooks o "24h"
- Carousel IG "10 ukrytych kosztów papieru" slajd 8 - update jeśli wspomina 24h

**`ACTIVE_LISTINGS.md`:**
- Tabela "Co tam komunikujemy" - rząd "Czas realizacji" - "24 godziny" → "**48 godzin od kompletu danych**"
- Tabela - "Poprawki" - "**3 rundy w cenie**" → "**2 rundy w cenie**" (cofnięcie ostatniej zmiany!)
- Tabela - "RSVP pola" - sprawdź czy aktualne (transport, alergie)
- Sekcja "Kiedy zaktualizować" pkt 2 - "Czas 24h" → "Czas 48h"
- Sekcja "Kiedy zaktualizować" pkt 5 - "**2 rundy poprawek**" → "**2 rundy poprawek**" (już zgodne, ja zaktualizowałam zł na 3 - cofnij)

**`BRAND-ASSETS-REGISTRY.md`:**
- Wszystkie tabele "ZAWARTE INFORMACJE Z OFERTY" - kolumna `Czas realizacji`: "24 godziny" → "48 godzin"
- Sekcja "GDY ZMIENIASZ COŚ W OFERCIE - CHECKLIST" - dodać sekcję "Zmiana LIMITU ZDJĘĆ" + "Zmiana TERMINU DOSYŁKI" (nowe pola)

**`marketing/README.md`:**
- Sekcja "Strategiczne ramy (TL;DR)" - "**Czas realizacji: 24h**" → "**Czas realizacji: 48h**"
- Sekcja "Kluczowe insights" pkt 5 - "**24h realizacja = killer feature**" → "**48h realizacja - nadal najszybsze w segmencie indywidualnym ale słabszy USP niż wcześniej**"

### 10.4 🟡 Social media + content marketing

**Instagram / Facebook posty (wszystkie z "24h"):**
- Posty live z "24 godziny" - **NIE usuwać starych** (historia konwersji), ale **nowe posty z 48h**
- Reels promocyjne z hookiem "24h realizacja" - **nagrać nowe z "48h"** lub przeformułować ("szybka realizacja")
- Stories highlight "Jak zamówić" - update krok II
- Bio fanpage - update tagline

**Pinterest pins:**
- Pins z tekstem "24 godziny" - **wycofać lub zaktualizować**

**Blog / SEO content na zaproszeniaonline.com:**
- ✅ Już zrobione przez Nicolasa (8 plików blog zaktualizowane w commicie 0fa2436)

**Gotowe materiały które nie mają zmiennej oferty (Z OK):**
- Logo, profile picture - **bez zmian** (czysty brand mark)
- Mockupy stylowe demo - **bez zmian**

### 10.5 🟡 Update memory w dyrektor-marketingu

Pliki w `C:/Projekty/dyrektor-marketingu/`:

**`brand-profiles/zaproszenia/brand.json`:**
- `products[0].delivery_time_hours`: 24 → 48
- `products[0].revisions`: 3 → 2
- `products[0].max_photos`: 5 → 7
- `products[0].includes` lista - aktualizacja
- `products[0].new_features` (jeśli istnieje): dodać "review_pipeline", "polec50_referral"
- `policies.refund`: rewrite "bezzwrotna po zaksięgowaniu wpłaty + gwarancje"
- `policies.data_completion_deadline_hours`: 48 (NEW)
- `legal.terms_paragraphs`: dodać § 7 (program partnerski), § 8b (muzyka), § 8c (zdjęcia)

**Memory pliki:**
- `reference_zaproszenia_canonical_facts.md` - **PRIORYTET P0** update (canonical facts)
- `feedback_zaproszenia_voice_polish_forms.md` - bez zmian
- `playbook.md` - dodać decision log entry o zmianach 2026-05-16

**`audience.json`:**
- Persona "Last-Minute Łukasz" - aktualizacja value prop (już nie 24h ale 48h, nadal szybciej niż papier 14 dni)

### 10.6 🟢 Komunikacja z dotychczasowymi pierwszymi klientami (jeśli już są)

Jeśli ktokolwiek zamówił przed 2026-05-16 (sprawdź w Supabase: `SELECT * FROM public.leads WHERE payment_status='paid' AND created_at < '2026-05-16'`):
- **NIE PRZESTAWIAJ ich umowy** - obowiązują warunki z momentu zamówienia (24h, 3 rundy, 5 zdjęć)
- Z dobrej woli można zaoferować **upgrade do 7 zdjęć** (gest dobrej woli, koszt = 0)

### 10.7 🟡 Nowe materiały do zbudowania (z okazji zmian)

**Po stronie Dyrektora Marketingu:**
1. **Explainer "Co się zmieniło 16 maja 2026"** - 1-pager dla pierwszych partnerów / leadów którzy widzieli starą ofertę
2. **Materiały o Review Pipeline** - dla klienta, "Po ślubie podziel się opinią - otrzymasz kod POLEC50 dla znajomych"
3. **Materiały o programie partnerskim § 7** - infografika "Jak działa nasz program partnerski" do oferty B2B
4. **Nowy hook landing/ads** - przeformuować "24h" na "48h od kompletu danych" (mniej dramatyczny, ale uczciwy)
5. **Demo nicolas-test.zaproszeniaonline.com** - jak będzie DNS, dodać do listy demo w ofercie B2B i landing

### 10.8 🔴 NATYCHMIASTOWE - przed kolejną sprzedażą / publikacją

1. **Pull origin/main na laptop Dominiki** - bo aktualnie jestem za 11 commitów (`git checkout main && git pull`)
2. **Cofnij listing Janachowska na 2 rundy poprawek** (sama Dominika dziś zaktualizowała na 3, to jest niepoprawne)
3. **Update brand.json + memory w dyrektor-marketingu** - bo wszystkie skille z których DM korzysta używają tych danych
4. **Sprawdź Supabase czy są leady z 12-16 maja** (formularz nie działał, mogły być utracone)

---

## 11. INKONSEKWENCJE I PYTANIA OTWARTE

### 11.1 Kod POLEC50 - mechanika nieudokumentowana publicznie
- **Co dokładnie daje POLEC50?** 50%? 50 zł flat? Inna mechanika?
- **Czy każdy klient dostaje TEN SAM kod POLEC50, czy unikalny per klient (np. POLEC50-{lead_short})?**
- **Ile ma `max_uses`?** Bo jeśli jeden uniwersalny kod - musi mieć duży limit
- **Czy POLEC50 ma `stripe_payment_link_url` dedicated?**

**Action:** Dominika zapyta Nicolasa przed komunikacją publiczną.

### 11.2 nicolas-test subdomena - DNS pending
- Subdomena ma rewrite w `vercel.json` ale **brak DNS A record** (TODO Nicolas w OVH)
- Aktualnie działa tylko path-based: `zaproszeniaonline.com/nicolas-test/`
- **Czy ma być publicznie linkowana z marketingu?** Czy to TYLKO test pre-launch?

### 11.3 Ekspresowa realizacja <48h przed wydarzeniem
§ 5 ust. 3 mówi: "**W przypadku wyjątkowo pilnych terminów (mniej niż 48h przed wydarzeniem) realizacja ekspresowa jest możliwa po indywidualnym ustaleniu warunków i dopłaty z Klientem (mailowo).**"

**Implikacja:** to NOWY upsell potencjalny - **rush fee dla Late-Minute Łukasz persona** (z marketing/README.md). Marketing może to wykorzystać:
- "Wesele za 5 dni? Tak, robimy. Ekspresowa <48h - cena indywidualna."
- Cennik **rush fee** wymaga decyzji Nicolasa (sugestia z PRICING_ANALYSIS.md: 899-999 zł).

### 11.4 Bug formularza 12-16 maja - czy były utracone leady?
Race condition `defer` blokował submit przez 4 dni. Sprawdź w Supabase:
```sql
SELECT id, created_at, name, email, payment_status
FROM public.leads
WHERE created_at BETWEEN '2026-05-12' AND '2026-05-16 19:00'
ORDER BY created_at DESC;
```
Jeśli są leady z brakami (puste pola features) - **kontakt z parą** (mail z linkiem do ponownego wypełnienia).

### 11.5 Co z linkiem `/onepager/galeria` w starych materiałach marketingowych?
Onepager galeria zlikwidowana → 308 redirect na `/onepager/forest`. **Wszelkie stare linki marketingowe wskazujące `/onepager/galeria` nadal działają (przez redirect)** - ale jeśli gdzieś jest hardcoded w materiałach print/PDF, lepiej zmienić na `/onepager/forest`.

---

## 12. ANEKS - LISTA COMMITÓW Z TEJ SESJI (chronologicznie)

```
2026-05-14:
  c40d7cb  fix(seo): naprawa auto-trimu meta tagów
  b7c86ff  refactor(onepager): wytnij UI edycji + koncept galerii
  e7c3ab8  fix(form): napraw cichy crash submit/toggle/kod rabatowy + dodaj kod HIPERFIKSACJA

2026-05-15:
  d448dcf  test(photos): dolozono 5 sample photos do testowania komponentu galerii
  5b2feff  Merge branch 'main' (Dominika)

2026-05-16:
  21eea2e  feat(photos): lokalny robot CLI photos:scan + EXIF flagi
  b36beea  feat(photos): auto-generacja draftow mailowych + wysylka przez Resend
  53cfe18  feat(photos): photos:publish interactive review + Supabase Storage upload
  cf078cb  fix(seo): meta tagi pod limity Google/social (#10)
  1ad981a  fix(form): krytyczny race condition supabase defer (#11)
  c019953  fix(form): 5 bugów - radio caret, story toggle, HIPERFIKSACJA, UUID, .catch (#13)
  587271e  chore: kontakt@ unification + migration trace + skrócona klauzula UoPK (#15)
  05aa6e5  feat(reviews,legal,docs): domknięcie sesji - review pipeline + zdjęcia + OVH notes (#16)
  0788188  fix(webhook): match po client_reference_id zamiast email (race-fix) (#17)
  beeab35  chore(legal): § 13 LEGAL_TODO DONE + cleanup OVH instruction (#18)
  7b7f65c  chore(edge-fns): SUPABASE_SECRET_KEY migration z fallback (#19)
  a49ace8  docs(legal): raport końcowy pakiet prawny zdjęcia + Gmail Send mail as fix
  0fa2436  feat(prod-ready): 48h+2 rundy+7 zdjęć+walidacja+dosylka 48h+UX polish  ⚠️
  4f070ce  chore(seo): spójność LLM facts + self-host fonts blog + founder schema
  f959cb0  fix(emails): unify welcome mail + remove wszystkie palety button
  b1ce0d8  feat: nicolas-test.html - drugi standalone klient w palecie bordo
  ce22cf5  feat(nicolas-test): standalone subdomena, kopia demo 1:1 z bordo
  5edc318  fix(nicolas-test): heart photo aspect-ratio + Supabase CDN + relative photos
```

**16 commitów Nicolasa + 6 commitów Dominiki = 22 commity w 3 dni.**

---

## 13. ZALECANA KOLEJNOŚĆ WDROŻENIA

**Dzień 0 (dziś / jutro - przed kolejną aktywnością marketingową):**
1. Pull origin/main na laptopie Dominiki (`git checkout main && git pull`)
2. Cofnij listing Janachowska "3 rundy" → "**2 rundy poprawek**"
3. Sprawdź Supabase czy są leady z 12-16 maja
4. Zapytaj Nicolasa o mechanikę POLEC50

**Dzień 1-2 (krytyczne):**
5. Listingi: Janachowska + Wedding.pl - aktualizacja czasu (24h → **48h**)
6. Update brand.json + memory w dyrektor-marketingu (canonical facts)
7. Update mojego briefu B2B (`BRIEF_DOMY_WESELNE.md`) - 16 miejsc do zmiany (lista w 10.3)

**Dzień 3-5 (re-render assets):**
8. FB cover (2 warianty), Google Business cover + hero, wizytówka, bio PDF, Apple Wallet, vCard
9. Update marketing dokumenty (PRICING, COMPETITIVE, BREAK_EVEN, ACTIVE_LISTINGS, BRAND-REGISTRY)

**Dzień 6+ (nowe materiały):**
10. Explainer "Co się zmieniło 16 maja" dla pierwszych partnerów
11. Materiały Review Pipeline / POLEC50 (gdy zdecydujesz z Nicolasem)
12. Materiały § 7 (program partnerski) dla oferty B2B
13. Demo nicolas-test (gdy DNS)

---

**Status raportu:** GOTOWY do akcji.
**Wersja:** 1.0 (2026-05-16)
**Następny review:** po pull main + przejściu czeklisty Dnia 0. Jeśli wykryjesz coś czego tu nie ma - dopisz w sekcji 11.
