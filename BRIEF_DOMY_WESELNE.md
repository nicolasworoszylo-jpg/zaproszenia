# BRIEF: Oferta B2B dla domów weselnych - zaproszeniaonline.com

> **Cel pliku:** kompletny pakiet wiedzy dla projektu **Dyrektor Marketingu**, żeby mógł napisać świetną ofertę dla domów weselnych BEZ dopytywania o cokolwiek. Plus wskazówki do rozmów telefonicznych z managerami sal.
>
> **Autor briefu:** Claude Code (sesja Dominiki, 2026-05-16) - `umysl-ula` orchestration z weryfikacją `work-verifier` + `nicolas-superpower`.
>
> **Source of truth:** pliki w `C:\Users\domin\Desktop\zaproszenia\` (oznaczone w cytatach). Master brand profile: `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/`.

---

## 0. TL;DR dla Dyrektora Marketingu

| Co | W skrócie |
|---|---|
| **Produkt** | Cyfrowe zaproszenia ślubne online jako pełna strona internetowa z RSVP, planem dnia, mapami, galerią, historią pary |
| **Cena B2C** | **699 zł** flat, jednorazowo (bez abonamentu) |
| **Czas realizacji** | **48 godzin** od kompletu danych (zegar startuje gdy klient dosłał wszystko co zaznaczył jako "uzupełnię mailowo") |
| **Owner** | Nicolas Woroszyło (Vidok Studio), działalność nieewidencjonowana, limit 3 499,50 zł/mc → po przekroczeniu JDG w 7 dni |
| **Marketing operator** | Dominika Kuś |
| **Stan techniczny** | LIVE: `https://zaproszeniaonline.com`. Backend (Supabase) + Stripe + Resend wszystko działa. Email automation 4 maile per zamówienie |
| **System partnerski** | **GOTOWY infrastrukturalnie** - tabela `discount_codes` + RPC walidacji + tracking leadów per kod. Trzeba tylko wdrożyć biznesowo |
| **Cel briefu** | Oferta + cold call script do pozyskania **pierwszych 5-10 domów weselnych** jako partnerów dystrybucji |
| **Sprzedanych klientów dziś** | 0 (2 leady testowe, sprzed marketing-go). Marketing-go odblokowane 2026-05-11 |

**Jeden hook nadrzędny do oferty B2B:**
> "Dajcie parom rzecz, której nie da im żaden inny dom weselny: gotową stronę ślubną w cenie sali. Cyfrowa rzecz, którą można pochwalić się w 30 sekund, kosztuje Was 0 zł cash flow (model affiliate) lub 350-450 zł wholesale (model bundle) - a podnosi konwersję rezerwacji o segment par 25-35, dla których to jest dziś dealbreaker."

---

## 1. ANATOMIA PRODUKTU (co dokładnie dostaje para)

### 1.1 Co jest w cenie 699 zł

Źródło: `stripe-assets/product-description-pl.md` + `index.html` (Schema.org Service)

- Strona pod **indywidualnym URL** (np. `zaproszeniaonline.com/anna-michal`)
- **Indywidualnie projektowana** pod motyw wesela (NIE szablon)
- **4 palety kolorów** do wyboru:
  - Leśna zieleń (forest + gold + botaniczne ornamenty)
  - Granat + róż
  - Bordo + kość
  - Rdzawa terracotta
- **RSVP online** - formularz potwierdzania obecności z polami:
  - Imię i nazwisko gościa
  - Liczba osób (+1, dzieci)
  - Menu (4 opcje: tradycyjne / vegetariańskie / wegańskie / dla dzieci)
  - Alergie i nietolerancje pokarmowe
  - Transport (autobus tak/nie)
  - Nocleg (potrzebny tak/nie)
  - Życzenia od gościa
- **Plan dnia** z godzinami, opisami, ikonami (ceremonia, kokteil, kolacja, oczepiny, etc.)
- **Interaktywne mapy** Google: ceremonia, przyjęcie, hotele
- **Galeria** zdjęć pary (do 7 ujęć w cenie, łącznie 14 MB, pipeline obróbki działa; pełna ścieżka prawna § 8c regulaminu - prawa autorskie, indemnifikacja, takedown 24h, retencja 12 mc + 30 dni grace)
- Sekcja **"Nasza historia"** z chronologią/osią czasu
- **Muzyka w tle** opcjonalna (§ 8b regulaminu - klient oświadcza prawa autorskie, placeholder bez sugestii Spotify/YouTube, krąg towarzyski art. 23 PrAut)
- **Animowane przejścia** (Apple-style spring physics)
- **Kod QR do druku** - dla papierowych save-the-date lub starszych gości
- **Eksport CSV** listy gości (catering, lista do drukarki winietek)
- **Propozycje piosenek** od gości (osobny formularz)
- **2 rundy poprawek** w cenie (teksty, kolory, układ, zdjęcia)
- **Klient ma 48h od potwierdzenia zamówienia** na dosłanie pól oznaczonych w formularzu jako "uzupełnię mailowo" (plan dnia, hotele, transport, lista prezentów, FAQ, "Nasza historia"). Po 48h niedostarczenia realizujemy bez tych pól (§ 5 ust. 2 regulaminu). **To regulamentuje "zegar 48h realizacji"** - startuje od dostarczenia kompletu.
- **Hosting + URL na 12 miesięcy** po ślubie
- **Kopia HTML** do archiwizacji (para zostaje z plikiem na zawsze)
- **Wsparcie do dnia ślubu** mailowe
- **Rachunek** (działalność nieewidencjonowana, bez VAT)

### 1.2 Czego NIE ma w cenie (świadomie, do potencjalnego upsellu)

- Custom illustration pary (rysunek), oś czasu animowana - to **tier "Sygnatura Studio" 1499-1999 zł** (planowany, jeszcze nie wdrożony)
- Drukowane karty z QR - to **add-on hybrid 199-299 zł** dla seniorów (planowany)
- **Pełna papeteria** (winietki, menu drukowane, podziękowania) - to świadoma luka, opportunity dla bundle z drukarnią
- **Realizacja ekspresowa <48h** przed wydarzeniem (rush fee, cena indywidualna - § 5 ust. 3 regulaminu; do ustalenia mailowo z Nicolasem)

**Czego oczekujemy OD PARY (samodzielne deliverables - nie my robimy za nich):**
- Dosłanie pól "uzupełnię mailowo" w **48h od potwierdzenia zamówienia** (sekcja 1.1, § 5 ust. 2). Po terminie - realizujemy bez tych pól.
- Oświadczenie o prawach autorskich do zdjęć i muzyki (formularz + § 8b/§ 8c regulaminu).
- Zgody RODO osób uwiecznionych na zdjęciach (privacy.html § 2.9).

### 1.3 Operacje pod maską (dla wiarygodności w rozmowach)

- **Stack:** statyczny HTML/CSS/vanilla JS (Vercel) + Supabase Postgres 17 (Frankfurt, RODO-clean) + Edge Functions + Stripe + Resend (eu-west-1, transactional email)
- **RODO compliance:** self-hosted fonts (zero transferu do Google), DPA z 3/4 vendorów signed (Supabase pending Nicolas, Vercel decision otwarte), privacy/terms/cookies/returns pages - wszystkie aktualne dla działalności nieewidencjonowanej
- **Email automation:** 4 maile per zamówienie (lead alert + customer confirm + payment alert + payment confirm), brand-aligned templates v5
- **Bezpieczeństwo:** GitHub Secret Scanning, RLS na Supabase, anon ma tylko INSERT, walidacja kodu rabatowego przez SECURITY DEFINER RPC (anon nie wyenumeruje kodów)
- **Stripe:** Payment Link, statement descriptor `ZAPROSZENIA`, webhook signature verification działa od 2026-05-11

### 1.4 Materiały gotowe (assets do oferty B2B)

Lokalizacja: `C:/Users/domin/Desktop/dysk/brand-zaproszenia-2026-05-12/`

- **Demo live:** `https://zaproszeniaonline.com/demo` (Anna i Michał) i `https://zaproszeniaonline.com/magda-tomek`
- **Landing live:** `https://zaproszeniaonline.com`
- **Blog 8 artykułów SEO** już zaindeksowanych (long-tail keywords)
- **Profile avatar** (1080x1080 monogram Z)
- **Banner FB cover** 1640x720 (GOLD + CREAM warianty)
- **Google Business** cover 1080x608 + hero square 1080x1080 z prawdziwym scannable QR do `/demo`
- **Wizytówka** 85x55mm front+back PNG+PDF
- **vCard + Apple Wallet pass** scaffold
- **Bio fanpage PDF**
- **One-pager A4 do druku** (parametryzowany URL - dla pary, ale przedyskutować jako materiał B2B sample)

### 1.5 Aktywne listingi (gdzie firma już istnieje publicznie)

Źródło: `marketing/ACTIVE_LISTINGS.md`

- ✅ **Katalog Izabeli Janachowskiej** (Wedding & Party Dream) - `katalog.janachowska.pl/firma/zaproszeniaonline-com`
- ✅ **Wedding.pl** - `wedding.pl/zaproszenia-slubne/zaproszeniaonline-com`
- ⏳ Google Business Profile - w trakcie

To **trust signal** dla domów weselnych: "jesteśmy w katalogu Janachowskiej, branżowy wedding planner know-how".

---

## 2. USP - DLACZEGO PARA KUPUJE (do reframing'u na argumenty B2B)

Źródła: `marketing/COMPETITIVE_LANDSCAPE.md`, `marketing/PRICING_ANALYSIS.md`, `marketing/BREAK_EVEN_ANALYSIS.md`

### 2.1 USP unikalne w tierze 599-999 zł
1. **Szybka realizacja - 48h od kompletu danych** (konkurenci tier 3: 7-21 dni; tier 4-5: 4-8 tyg.). Często robimy w 24-48h, ale obiecujemy 48h żeby NIE łamać deklaracji - to świadomy wybór "uczciwy SLA" vs "konkurencja co obiecuje 24h i łamie w 30% przypadków".
2. **Jedyna domena PL z keyword "zaproszenia" + "online"** w nazwie - SEO moat
3. **Indywidualny projekt, NIE szablon** (vs SaaS templated)
4. **Jednorazowa cena, NIE abonament** (vs fotify.app, marryou.pl, Wix, Squarespace)
5. **Polska firma z rachunkiem/fakturą** (vs Zola, Joy, Withjoy - US, brak PL VAT)
6. **RODO clean** (self-hosted fonty, EU host Frankfurt, brak third-party) - argument trust
7. **4 palety design do wyboru** - jak studio (tier 4) ale w cenie tier 3
8. **8 blog postów long-tail już zaindeksowanych** - content moat
9. **Pełna ścieżka prawna** zdjęć (§ 8c), muzyki (§ 8b), programu partnerskiego (§ 7), polityki bezzwrotnej z gwarancjami (§ 4 + § 10a) - **zapisane w regulaminie, nie ad-hoc** (różnica od freelancerów i większości konkurencji)

### 2.2 Numerical hooks (gotowe do copy)
- "Wesele 100 gości? Papier z dodatkami = 2200 zł. Digital = 699 zł. Zawsze."
- "Od 30 gości w górę digital jest tańszy od papieru - zawsze, bez wyjątku."
- "22 zł/osoba papier vs 7 zł/osoba digital (przy 100 gości)."
- "Każdy dodatkowy gość papierowy: +25 zł. Cyfrowy: 0 zł."
- "699 zł niezależnie czy 30 czy 300 gości."

### 2.3 Reframing na argumenty B2B (dla domu weselnego)
Tego DM ma użyć w ofercie B2B - przekuwamy USP konsumenckie na value prop dla sali:
- "Wasi goście (pary) szukają tej rzeczy SAMI. Ale szukają w panice 6-12 tyg. przed ślubem. Jeśli to Wy im to dacie - kojarzą Was z 'kompleksową obsługą', nie tylko ścianami i jedzeniem."
- "RSVP online = catering dostaje finalną listę 3 dni przed ślubem zamiast w Excelu z błędami. Mniej Waszych telefonów do par 'a ilu ostatecznie?'"
- "Mapy + plan dnia w jednym linku = mniej Waszych pytań od gości 'jak dojechać', 'o której zaczynamy'."
- "QR kod gości skanują na sali = mniej drukowanego programu."

---

## 3. CENNIK B2C (canonical reference)

| Parametr | Wartość |
|---|---|
| **Cena flat** | **699 zł** brutto, jednorazowo (bez VAT, działalność nieewidencjonowana) |
| Walidacja A/B test | Rekomendowana 699 / 799 / 899 zł przez 4-8 tyg. (jeszcze nie odpalona - D-30 priorytet) |
| Mediana tier-3 PL Q1 2026 | 800-900 zł - czyli **699 zł = bottom-end** mid-market |
| Konkurencja bezpośrednia | Ślubny Moment 699 zł (template z customization, NIE indywidualny); Design Your Wedding 800 zł; Weddingcard 800 zł; Marryou Premium 1199 zł lifetime |
| Realizacja | **48h od kompletu danych** (klient ma 48h od potwierdzenia zamówienia na dosłanie pól "uzupełnię mailowo" - po tym realizujemy bez nich) |
| Poprawki | **2 rundy w cenie** (decyzja 2026-05-16, cofnięte z chwilowego "3 rundy" z 2026-05-13) |
| Limit zdjęć | **7 ujęć, łącznie 14 MB** |
| Hosting | 12 mc po ślubie w cenie (§ 8c regulaminu - 30 dni grace period po wygaśnięciu) |
| Zwroty | **BEZZWROTNA** wpłata po zaksięgowaniu (art. 38 ust. 1 pkt 1 + art. 38 pkt 3 UoPK). Gwarancje zamiast zwrotów: 2 rundy poprawek, 12 mc hostingu, przesunięcie terminu wydarzenia bez dopłaty, voucher uznaniowy w sytuacjach losowych |
| Płatność | Stripe Payment Link (BLIK / karta / przelew) |
| Document | Rachunek (bez VAT) |

### 3.1 Limit operacyjny (KLUCZOWE dla skali B2B)

Działalność nieewidencjonowana ma sufit **3 499,50 zł brutto/mc** = **5 sprzedaży/mc max**. 6. sprzedaż w miesiącu → obowiązek JDG w 7 dni.

**Implikacja dla rozmowy B2B:** w pierwszych 60 dniach po podpisaniu pierwszego partnera, jeśli przyniesie więcej niż 5 leadów/mc → Nicolas musi zarejestrować JDG. To **DOBRA wiadomość** (rynek waliduje), ale w komunikacji z domami trzeba uważać żeby nie obiecać "365 par/rok" bez infrastruktury kapitałowej. Realistyczne pasmo dla MVP B2B: **5-15 par/mc** (po JDG do 200k zł/rok = ~285 par/rok bez VAT).

---

## 4. SEGMENT B2B - DLACZEGO DOM WESELNY MA SIĘ ZGODZIĆ

Pięć rzeczywistych motywacji decydenta po stronie domu weselnego (kolejność = priorytet do rozmowy):

### 4.1 Differentiator vs lokalna konkurencja
W typowym powiecie jest 5-15 domów weselnych w podobnym tierze cenowym (talerzyk 250-500 zł). Wszystkie mają: sala + parking + nocleg + barman + tor do tańca. **Nikt nie ma "strona ślubna w cenie sali" w ofercie.** To 0,5-1 strona w follow-up po wizytacji która może przeważyć między "biorę tę salę" a "myślę".

### 4.2 Konkretne zmniejszenie operacji
- **RSVP rozproszenie:** dziś pary przesyłają sali listę gości w Excelu z błędami → catering improwizuje → koszty. Z naszą stroną - para eksportuje CSV, sala dostaje finalną listę 3 dni przed.
- **"O której zaczynamy?":** dziś gości dzwonią do sali bo pomylili godzinę → recepcja traci czas. Z planem dnia w linku - gość ma w telefonie.
- **"Jak dojechać?":** dziś sala dostaje kilkadziesiąt SMSów po adres → integracja z Google Maps w naszej stronie eliminuje.

### 4.3 Upsell / cross-sell własnych usług
Strona ślubna ma sekcje typu "Dla gości" / "Logistyka" gdzie dom weselny **może być prezentowany jako preferowany partner** (sugerowane noclegi, transport, dodatkowe atrakcje). To **organiczna reklama** wewnątrz personal experience pary.

### 4.4 Marketing organiczny
Każda strona ślubna ma stopkę typu "Strona zbudowana przez zaproszeniaonline.com - polecane przez [Nazwa Domu]". To **link in bio** dla domu w każdej wysyłanej parze. **180 wesel/rok × średnio 80 gości otwierających = 14 400 ekspozycji marki domu/rok** na grupie zainteresowanej weselami.

### 4.5 Trend cyfryzacji / pokoleniowy
Pary 25-35 (89% pierwszych ślubów PL) **oczekują** cyfrowych rozwiązań. Dom weselny który tego nie ma w 2026 - wygląda jak ten z faksem. To pierwszy sygnał "ci ludzie nie żyją w tej dekadzie", który kasuje rozmowę z premium parą.

---

## 5. CZTERY MODELE PARTNERSTWA - OPCJE DO OFERTY

> **Status techniczny:** Model 1 (affiliate kod) jest **w pełni działający infrastrukturalnie**. Tabela `discount_codes`, RPC walidacji, tracking leadów, dashboard SQL - gotowe. Pozostałe modele wymagają minimalnej dodatkowej operacjonalizacji.
>
> **Rekomendacja Claude:** Zaoferować wszystkie 4 z różną wagą - model 1 jako default ("zacznijmy od tego, jeśli zadziała przejdziemy na bundle"), model 2 jako aspirational ("docelowo chcielibyśmy z Wami tak"), modele 3-4 dla większych graczy.

### 5.1 Model A - Affiliate (kod rabatowy + revshare)

**Mechanika:** Dom weselny dostaje unikalny kod (np. `KORCZEW10`). Przekazuje go parom rezerwującym salę (mail po podpisaniu umowy, drukowana ulotka w sali, strona internetowa domu w sekcji "Nasi partnerzy"). Para wpisuje kod w formularzu na zaproszeniaonline.com → -10% rabat. Para płaci nam 629 zł zamiast 699. My płacimy domowi revshare.

**Ekonomika (rekomendowana):**

| Wariant | Rabat dla pary | Marża po naszej stronie | Revshare dla domu | Wartość dla domu per sprzedaż |
|---|---|---|---|---|
| **A1 - soft** | 10% (= -70 zł) | 629 zł | 0 zł (tylko PR / wartość dodana) | wartość PR + 0 zł cash |
| **A2 - standard** | 10% (= -70 zł) | 629 zł | 50 zł flat | 50 zł cash + value-add |
| **A3 - pro** | 15% (= -105 zł) | 594 zł | 100 zł flat | 100 zł cash + value-add |
| **A4 - premium** | 15% (= -105 zł) | 594 zł | 20% z 594 = 119 zł | 119 zł cash + value-add |

**Co już działa:**
- Walidacja kodu na żywo (300ms debounce) z komunikatem "Kod aktywny: -10% (Pałac w Korczewie)"
- Tracking leadów per kod w `discount_codes.uses_count` + relacja z `leads.affiliate_code`
- Wzór SQL do dodania nowego partnera w `AFFILIATE_INSTRUCTIONS.md`
- Kod `TEST10` w bazie (do testów, do usunięcia w prod)
- **Dedykowany Stripe Payment Link per kod** (migracja `20260516120000_discount_codes_dedicated_stripe_link.sql`) - każdy kod może mieć własny URL checkout (np. z dedicated statement descriptor per partner). NULL = fallback do default + `prefilled_promo_code`.
- **Kody do 99% off** (constraint `discount_pct <= 99` po podniesieniu z 50) - daje elastyczność dla testów / VIP / kampanii sezonowych. 100% wciąż zablokowane regulaminowo.

**Fundament prawny (KLUCZOWE w rozmowie B2B):**
Program partnerski jest **zapisany w regulaminie § 7 terms.html** (commit 587271e, 2026-05-16). To nie jest "wymyślona oferta ad-hoc" - to formalna ścieżka współpracy z 8 ustępami:
1. Indywidualne kody dla partnerów (domy weselne, fotografowie, wedding plannerzy)
2. Walidacja real-time + tracking
3. Rabat uznaniowy (możemy odmówić w przypadku nadużyć)
4. Zniżki NIE sumują się (jeden kod per zamówienie)
5. Kod NIE wymienialny na ekwiwalent pieniężny
6. Możemy wycofać kod (z zachowaniem już sporządzonych)
7. Klient sam nie może żądać kodu (dystrybucja tylko przez partnerów)
8. Rozliczenia partner ↔ my - regulowane odrębną umową partnerską

**Hook do rozmowy B2B:** "Program partnerski jest zapisany w naszym regulaminie § 7 - oficjalna ścieżka, nie ad-hoc oferta. Dla Was to znaczy: macie pełną ochronę prawną, my mamy obowiązek dotrzymać warunków, klient ma jasność jak działa rabat."

**Wskazówki do rozmowy:** dla MAŁYCH sal - wariant A1 (PR-only, wszyscy oszczędzają). Dla ŚREDNICH - A2 (50 zł = stała opłata = łatwa do zaksięgowania). Dla DUŻYCH/premium - A3-A4.

**Plusy modelu A:**
- Zero risk i zero cash flow dla domu
- Działa od jutra - tylko wpisać kod w bazę (5 minut)
- Tracking pełen automat
- Możliwy A/B test różnych % rabatów

**Minusy:**
- Dom musi aktywnie polecać (a nie zawsze polecają nawet płatnie)
- Mała widoczność marki domu na samej stronie ślubnej

---

### 5.2 Model B - Bundle (strona w cenie sali)

**Mechanika:** Dom kupuje stronę ślubną wholesale i daje parze gratis jako element pakietu rezerwacji sali. Para nie wie ile dom za to zapłacił - widzi tylko "wartość 699 zł, dla Państwa w cenie".

**Ekonomika (do negocjacji):**

| Wolumen / rok | Wholesale cena za stronę | Marża dla nas | Wartość dla domu |
|---|---|---|---|
| 1-10 stron/rok | **450 zł netto** | 450 zł | "value-add wart 699" = +0,3-0,5% conversion na rezerwacji sali |
| 11-30 stron/rok | **400 zł netto** | 400 zł | jak wyżej + amortyzacja w cenie sali (3-6 zł/gość na 80-os. wesele) |
| 31+ stron/rok | **350 zł netto** | 350 zł | jak wyżej + brand co-existence (stopka "by [Dom Weselny]") |

> ⚠️ **Cennik B robocza propozycja** - nie ma jeszcze validacji "ile dom realnie zapłaci". W rozmowie z 5 pierwszymi domami sprawdzić willingness to pay. Memory z umysl-ula sugerowało 450/350/280 zł netto w wariancie bardziej agresywnym - wymaga decyzji Nicolasa+Dominiki.

**Plusy modelu B:**
- Stabilny revenue dla nas (prepaid lub kontraktowy)
- Dom ma "wow" element w prezentacji (pokazuje demo na spotkaniach z parami)
- Łatwiej skalować - dom robi sprzedaż za nas
- Wyższy AOV dla nas niż A4 (350-450 vs 119)

**Minusy:**
- Dom musi zapłacić nawet jeśli para potem nie skorzysta (lub renegocjować retencję)
- Trzeba zrobić proces operacyjny: kto kontaktuje parę, kiedy, jak para zamawia ("kod aktywacyjny" wbudowany w pakiet sali?)
- Dom musi mieć cash flow na 10-30 stron upfront

**Wariant B-light:** Dom płaci NAM tylko za zrealizowane (para faktycznie wypełniła brief), nie za zakupione vouchery. Dla nas ryzykowne (cash flow), ale dla domu zerowy risk.

---

### 5.3 Model C - White-label / Co-brand

**Mechanika:** Strona ślubna ma branding domu weselnego (logo w stopce, sekcja "Z dumą prezentujemy salę…"), URL może być pod subdomeną domu (`anna-michal.salakorczew.pl`) lub naszą (`zaproszeniaonline.com/anna-michal-korczew`). Dom sprzedaje to parom jako swoją usługę z markupem.

**Ekonomika (do negocjacji):**

| Co dom dostaje | Co dom płaci (rocznie lub per sale) |
|---|---|
| Branding na stopce wszystkich stron par | 1500-2500 zł/rok (setup + maintenance) + 250 zł netto per zrealizowana strona |
| Custom subdomena pod brandem domu | jak wyżej + 500 zł/rok za DNS routing + ssl |
| Co-brand bio fanpage + materiały reklamowe | jak wyżej + 1000 zł/rok content |

**Plusy:**
- Premium positioning dla domu ("nasza strona ślubna" w ich ofercie)
- Wyższa wartość per partner (kontrakt roczny)
- Lojalność (raz wdrożona biało-marka się nie przełącza łatwo)

**Minusy:**
- Wymaga zbudowania feature white-label (subdomain routing, dynamic branding) - ~1-2 tygodnie pracy
- Operationalna złożoność większa (kto odpowiada na pytania pary - dom czy my?)
- Realne tylko dla domów z 30+ weselami/rok i własną marką

> **Rekomendacja:** Nie oferować modelu C w pierwszej rundzie outreachu. Zachować jako "premium upsell" dla domów które zrobią ≥15 stron w modelu A/B w pierwsze 6 mc.

---

### 5.4 Model D - Reseller / Reverse markup

**Mechanika:** Dom kupuje od nas hurtowo (np. paczka 20 stron za 6000 zł = 300 zł/szt netto) i sprzedaje parom jako swoją usługę w cenie 999-1199 zł, biorąc marżę 700-900 zł.

**Ekonomika:**

| Paczka | Cena hurtowa | Cena rynkowa dla pary | Marża domu na sztukę |
|---|---|---|---|
| 10 stron | 3500 zł (350 zł/szt) | 999 zł | 649 zł |
| 20 stron | 6000 zł (300 zł/szt) | 1199 zł | 899 zł |
| 50 stron | 12500 zł (250 zł/szt) | 1199 zł | 949 zł |

**Plusy:**
- Bardzo wysoka wartość per partner (3500-12500 zł upfront)
- Dom ma istotny stake w sukcesie (nie odda 6000 zł)
- Premium positioning ich oferty

**Minusy:**
- Wymaga kapitału / cash flow po stronie domu
- Po naszej stronie: 5 takich umów = 30 000-60 000 zł upfront → **przekroczenie progu działalności nieewidencjonowanej w 1 dzień** → konieczność JDG natychmiast (decyzja Nicolasa)
- Dom konkuruje cenowo z naszym B2C - albo musimy ich blokować geograficznie (oni mają monopol w swoim mieście), albo akceptujemy kanibalizację

> **Rekomendacja:** Model D **NIE w pierwszej rundzie**. Wymaga rozstrzygnięcia spraw prawnych (JDG, terytorialność) i strategicznych (kanibalizacja). Wspomnieć jako "docelowo, dla strategicznych partnerów".

---

### 5.5 Matryca rekomendacji modeli per typ domu

| Typ domu weselnego | Model rekomendowany | Argument otwierający |
|---|---|---|
| **Małe sale 50-150 osób, 20-40 wesel/rok, rodzinne** | A1 (kod 10%, bez kasy) | "Zero ryzyka, zero pracy. Tylko polecacie, my obsługujemy parę. Wasza prowizja = wdzięczność pary i opinia online." |
| **Średnie sale 150-300 osób, 50-100 wesel/rok** | A2-A3 (kod 10-15%, revshare 50-100 zł) | "50 zł per polecona para. Przy 50 weselach/rok = 2 500 zł czystego revenue za 0 godzin pracy. Plus value-add dla par którego nikt w okolicy nie ma." |
| **Premium sale 200-400 osób, 80+ wesel/rok, branded** | B (bundle 400-450 zł wholesale) lub A4 (revshare 20%) | "Wasi klienci platynowi oczekują wszystkiego w cenie. Strona ślubna gratis = jeszcze jeden "wow". Wholesale 400 zł, sprzedajecie jako "wartość 699 zł, dla Państwa w pakiecie"." |
| **Sieci / duże grupy hotelarskie** | B+C (bundle + co-brand) | "Stałą cenę dla całej Waszej grupy, plus każda strona ma Waszą markę. 30+ stron/rok = 350 zł netto/szt + co-brand za 1500 zł/rok setup. Total: ~12 000 zł rocznie za pełną feature differentiation." |

---

## 6. PERSONA DECYDENTA - Z KIM ROZMAWIASZ

### 6.1 Trzy typowe persony

**P1 - Właściciel/Założyciel (małe-średnie sale, family-owned)**
- Wiek: 45-65, często para właścicieli
- Mówi językiem cash flow, nie strategii
- Boi się ryzyka, ufa rekomendacjom z lokalnej branży
- Decyduje sam, ale konsultuje się z managerką/synową która "ogarnia social media"
- **Argument otwierający:** "Zero ryzyka, zero pracy. Polecacie, dostajecie 50 zł, koniec."
- **Czego nie mówić:** "scaling", "B2B funnel", "customer journey" - przerywa rozmowę

**P2 - Manager / Koordynator wesel (średnie-duże sale, profesjonalne)**
- Wiek: 28-42
- Często kobieta z doświadczeniem 5-10 lat, wedding planner intern lub event manager
- Operacyjnie nadzoruje 40-100 wesel/rok
- Decyduje samodzielnie do ~3000 zł, większe konsultuje z właścicielem/dyrektorem
- **Argument otwierający:** "RSVP rozproszenia, gości pytających o adres, list w Excelu - ten ból jest realny. To rozwiązujemy."
- **Czego nie mówić:** generyki marketing-speak. Mów konkretami: "3 godziny tygodniowo mniej odpowiadania na maile od gości."

**P3 - Dyrektor Marketingu / PR (duże grupy hotelarskie, sieci)**
- Wiek: 30-45
- Patrzy na portfolio partnerstw, brand consistency, KPI quartalne
- Wymaga umowy z SLA, branded materials, monitoring
- Decyduje w komitecie (zazwyczaj 2-4 osoby)
- **Argument otwierający:** "Konkurencja regionalna (wymień 2 nazwiska) tego nie ma. Wy macie szansę być pierwszymi z tym w segmencie 4-gwiazdkowym."
- **Czego nie mówić:** "spróbujemy", "zobaczymy" - wymaga pewności i danych. Pokazuj numbers.

### 6.2 Decision-making timeline

- **P1 (Właściciel):** 1-2 rozmowy + email follow-up, decyzja w 1-7 dni
- **P2 (Manager):** 1-3 rozmowy + email + materiały, decyzja 7-21 dni, czasem czeka na zgodę właściciela
- **P3 (Dyrektor):** prezentacja → propozycja umowy → review prawny → komitet decyzyjny - cykl 30-90 dni

---

## 7. ICP - JAKIE DOMY WESELNE PRIORYTETOWAĆ

### 7.1 Tier A (priorytet 1 - pierwsze 5 partnerów do końca lipca 2026)

**Kryteria:**
- 30-100 wesel/rok (sweet spot dla wolumenu)
- Lokalizacja: Mazowsze, Małopolska, Wielkopolska, Dolny Śląsk (większa konkurencja → większy apetyt na differentiator)
- Strona internetowa świeża (max 3 lata) - sygnał że właściciel inwestuje
- Aktywne social media (Instagram, FB) - sygnał że rozumie marketing cyfrowy
- Cena/talerzyk: 280-450 zł (mid-premium - pary tej klasy oczekują wszystkiego digital)
- Brak własnego "wedding website builder" w ofercie (bo wtedy konkurujemy)
- Otwarte na współpracę: mają już co najmniej 2-3 widoczne partnerstwa (fotograf, DJ, florysta) na stronie

**Jak znaleźć:**
- Google Maps "dom weselny [miasto]" → filter 4+ stars
- Katalog Janachowskiej (`katalog.janachowska.pl`) - kategoria "Sale weselne"
- Wedding.pl (gdzie my jesteśmy) - domy w tej samej okolicy
- Instagram hashtag `#salaweselna` + lokalizacja

### 7.2 Tier B (priorytet 2 - po pierwszych 5 partnerach)

- Mniejsze regiony (Lubelskie, Podlaskie, Świętokrzyskie)
- 15-30 wesel/rok (małe ale lojalne)
- Cena/talerzyk 200-280 zł (segment "smart middle")

### 7.3 Anti-ICP (NIE pisać do nich w pierwszej rundzie)

- Wielkie kompleksy ślubne (>200 wesel/rok) - wymagają sieciowych umów, długi cykl
- Sale w pełni budget (talerzyk <200 zł) - pary płacące 100 zł/talerzyk nie kupią 699 zł zaproszeń
- Domy z własną platformą cyfrową (mojaslubna.pl, fotify integracje) - konkurujemy
- Domy bez aktywnej strony www - sygnał że właściciel "starej szkoły", trudna konwersja

---

## 8. MATERIAŁY GOTOWE vs DO ZBUDOWANIA (TODO dla DM)

### 8.1 Co już mamy (input dla DM)

**Infrastruktura techniczna:**
- ✅ Tabela `discount_codes` + RPC walidacji + tracking + **dedicated Stripe Payment Link per kod** (migracja 2026-05-16)
- ✅ Edge functions (email automation - 4 maile per zamówienie + 4 maile review pipeline)
- ✅ Stripe Payment Link live
- ✅ Landing live + 2 demo + 8 blog postów
- ✅ **Review Pipeline** (commit 05aa6e5, 2026-05-16): strona `/opinia` + `/dziekujemy-za-opinie`, 3 edge functions (`send-review-request` / `submit-review` / `notify-review-submitted`), 4 maile transakcyjne, migracja `20260513150407_review_pipeline.sql`, skrypty CLI `scripts/review-ops/`
- ✅ **Kod POLEC50** - klient który wystawi 5★ z consentem na publikację automatycznie otrzymuje kod do dystrybucji wśród znajomych planujących wesele (mechanika dokładna - % rabatu / unikalny vs uniwersalny / max_uses - **PENDING decyzja Nicolasa** przed komunikacją publiczną)
- ✅ **Subdomena testowa** `nicolas-test.zaproszeniaonline.com` (paleta bordo) - trzeci standalone demo po `/demo` i `/magda-tomek` (DNS A record pending Nicolas w OVH)

**Materiały marketingowe brandowe:**
- ✅ Logo (monogram Z, 1080x1080, 2048x2048)
- ✅ Profile picture (FB/IG)
- ✅ FB cover banner (GOLD + CREAM)
- ✅ Google Business cover + hero
- ✅ Wizytówka PNG + PDF
- ✅ Bio fanpage PDF
- ✅ Apple Wallet pass + vCard

**Materiały informacyjne:**
- ✅ `marketing/COMPETITIVE_LANDSCAPE.md` (mapa rynku, 13 marek, 6 hooków A-F)
- ✅ `marketing/PRICING_ANALYSIS.md` (pełna analiza cenowa PL 2025-2026)
- ✅ `marketing/BREAK_EVEN_ANALYSIS.md` (kalkulator papier vs digital)
- ✅ `AFFILIATE_INSTRUCTIONS.md` (instrukcja systemu kodów)
- ✅ `stripe-assets/product-description-pl.md` (gotowy copy produktu)

### 8.2 Co musi zbudować Dyrektor Marketingu

> **Lista deliverables które oczekujemy z projektu Dyrektor Marketingu po wprowadzeniu tego briefu:**

**Priorytet P0 (potrzebne PRZED pierwszym telefonem):**
1. **One-pager B2B PDF** (A4) - branded, do wysłania mailem po telefonie ("dziękuję za rozmowę, oto czego nie powiedziałem")
   - Hero: "Strona ślubna gratis dla par rezerwujących Państwa salę"
   - 3 modele partnerstwa side-by-side (A/B/C) z ekonomiką
   - Demo screenshots + linki do live
   - Sekcja "Jak to wygląda dla Was operacyjnie"
   - 1 referencja (Janachowska katalog / Wedding.pl listing screenshots - jako trust signal że jesteśmy realnym podmiotem)
   - CTA: "Odbierz testowy kod na 30 dni"
2. **Cold call script** (pełna wersja - Sekcja 9 niżej tylko szkic)
3. **Cold email template** (3 warianty per persona P1/P2/P3)
4. **FAQ - Top 15 pytań** od domu weselnego (Sekcja 11 - pełna wersja do dopracowania przez DM)
5. **Obiekcje + odpowiedzi** (Sekcja 12 - j.w.)

**Priorytet P1 (potrzebne w 1. miesiącu outreach):**
6. **Email follow-up sequence** (5 maili: D+1 / D+3 / D+7 / D+14 / D+30)
7. **Landing page B2B** (osobny URL np. `zaproszeniaonline.com/partnerzy` lub `/dla-sal`) z formularzem "Chcę kod testowy"
8. **Slide deck PDF** (dla persony P3 - sieci) - 10 slajdów, do prezentacji wideo lub na żywo
9. **Sample contract / list intencyjny** (dla modelu B - bundle, z prawnikiem RODO+IT, ~400 zł review)

**Priorytet P2 (po pierwszych 3 podpisanych partnerach):**
10. **Case study z pierwszym partnerem** - wywiad, screenshots, liczby
11. **Wideo demo 60s** dla domów weselnych (one shot, sketch)
12. **Referral program partner-do-partnera** ("polecił nas inny dom, dostaniecie bonus")

**Priorytet P0 dodatkowy (po decyzji Nicolasa o POLEC50):**
13. **Explainer infografika "§ 7 program partnerski"** dla oferty B2B (1-pager wizualny) - prawnie udokumentowana ścieżka współpracy zamiast handshake deal
14. **Explainer "Review Pipeline + POLEC50"** dla domu weselnego - mechanika 3-stopniowego lejka viralnego: para 5★ → kod POLEC50 → dystrybucja wśród znajomych. **Hook dla partnera:** "Wasz polecony klient kończy współpracę 5★ → dostaje kod POLEC50 → Wy też możecie z niego korzystać ('zostawcie nam opinię, dostaniecie kod dla pary z którą się znacie') - dodatkowy mechanizm dystrybucji nakładający się na Wasz kod partnerski."

### 8.3 Co technicznie musi zrobić Nicolas/Claude (NIE Dyrektor Marketingu) - zanim ruszy outreach

- ⏳ Usunąć kod testowy `TEST10` z produkcji (`AFFILIATE_INSTRUCTIONS.md` line 76)
- ⏳ Stworzyć stronę docelową `/partnerzy` lub `/dla-sal` (osobny landing B2B)
- ⏳ Dodać sekcję "Polecane przez [logo domu weselnego]" w stopce strony ślubnej (wymagane dla modelu A2+) - jeśli dom dał kod, w stopce strony pary widnieje "polecane przez Pałac w Korczewie"
- ⏳ Zweryfikować z prawnikiem RODO klauzulę co-marketingu (czy dom może wyświetlać URL strony swojej pary jako portfolio - wymaga zgody pary)
- ⏳ Decyzja Nicolasa: który model proponujemy domyślnie (A2 = 50 zł flat? A3 = 100 zł flat? A4 = % revshare?)

---

## 9. SKRYPT COLD CALL - pełny scenariusz rozmowy z domem weselnym

> **Zasada nadrzędna:** Rozmowa = **trzy etapy** (Hook → Demo → Close). Średnia długość: 6-10 minut. Jeśli rozmówca chce więcej - przechodzimy do "umówmy spotkanie/wideo demo", NIE robimy 30-minutowej rozmowy.

### 9.1 Przygotowanie (30 sek przed wybraniem numeru)

- Sprawdź ich stronę: ile mają wesel/rok (kalendarz dostępności?), jaki segment cenowy, jakie partnerstwa już widoczne
- Sprawdź ich Instagram: kiedy ostatni post, jakie pary, ton komunikacji
- Znajdź imię osoby decyzyjnej (Google "[nazwa] kontakt manager wesel" lub LinkedIn)
- **Otwórz przed sobą:** demo `https://zaproszeniaonline.com/demo`, ten plik (cennik!), notatki o tej konkretnej sali

### 9.2 Etap 1 - Hook (pierwsze 30-60 sekund)

**Otwarcie (do recepcji / sekretariatu):**
> "Dzień dobry, [imię z reception?]. Tu Dominika Kuś z zaproszeniaonline.com. Chciałabym krótko porozmawiać z osobą, która odpowiada za współprace marketingowe i obsługę par - to będzie 5 minut, mam konkretną propozycję która was nic nie kosztuje. Z kim mogę porozmawiać?"

**Otwarcie (do P1/P2/P3 bezpośrednio):**
> "Dzień dobry, pan/pani [imię]? Tu Dominika z zaproszeniaonline.com. Czy ma pan/pani 4 minuty? Mam propozycję która zwiększa Waszą konwersję na rezerwacje sali i nic Was nie kosztuje. Jeśli to nie pasuje - sam się zrelacjonuję w cztery minuty i jeśli nie chcecie - żegnamy się."

**Po "tak":**
> "Świetnie. Krótko: jestem z firmy która robi cyfrowe zaproszenia ślubne - strony internetowe dla par. Wzięłam państwa numer bo zauważyłam, że [tu konkretna obserwacja z ich strony: 'piękne realizacje na Instagramie', 'widziałam Państwa w katalogu Janachowskiej', 'sala 200 osób z parkiem, robi wrażenie']. Z tego co widziałam, obsługujecie pary w segmencie ślubów premium - i właśnie do tej grupy jest moja propozycja."

> "W skrócie: dziś para która rezerwuje u Was salę, zaprasza gości papierowymi zaproszeniami, robi RSVP w Excelu, drukuje program. My to wszystko **robimy za nich w 48 godzin od dosłania kompletu danych, za 699 zł** - strona internetowa z RSVP, mapami, planem dnia, galerią. Pełna obsługa cyfrowa. **Propozycja dla Państwa**: my dajemy parze 10% rabat z polecenia od Was, a Wam płacimy 50 zł za każdą parę która zamówi. Zero kosztów dla Was, zero pracy. Czy mogę pokazać jak to dokładnie wygląda?"

### 9.3 Etap 2 - Demo (3-5 minut)

**Jeśli rozmowa telefonem:**
> "Wejdźcie proszę na zaproszeniaonline.com/demo - to nasza wersja przykładowa, Anna i Michał. Otworzy się strona ślubna pary. Macie? Zobaczcie: na górze imiona, data, miejsce. Niżej - historia pary. Niżej - plan dnia z ikonami. Niżej - mapy: ceremonia, sala. Niżej - formularz potwierdzania obecności - gość klika, wpisuje imię, wybiera menu, mówi o alergiach, zaznacza transport. Wszystkie potwierdzenia spływają w czasie rzeczywistym do pary i - co kluczowe dla Was - możecie też do Was. Catering dostaje finalną listę 3 dni przed weselem, zero Excela, zero chaosu."

> "Para płaci 699 zł raz, dostaje stronę gotową w **48 godzin od dosłania kompletu danych** (zwykle szybciej, ale nie obiecujemy 24h - bo realnie konkurencja co obiecuje 24h, łamie w 30% przypadków), i hosting przez 12 miesięcy. Konkurencja papierowych zaproszeń dla 100 gości to 2000-2500 zł - więc dla pary to bardzo łatwy wybór."

**Jeśli rozmowa wideo (Zoom/Meet):**
> Pokazujesz share screen - `zaproszeniaonline.com/demo` na żywo. Klikasz przez sekcje powolnie. Pokazujesz formularz RSVP - wypełniasz testowo.

### 9.4 Etap 3 - Close (2-3 minuty)

**Propozycja konkretna:**
> "Co proponuję: dostajecie unikalny kod, np. **[NAZWA-DOMU]10**. Para wpisuje go w formularzu na naszej stronie - otrzymuje 10% rabat (-70 zł), płaci 629 zł zamiast 699. Z każdej takiej pary płacimy Wam 50 zł na koniec miesiąca. Wy nic nie wydajecie, nic nie ryzykujecie - tylko polecacie. W mailu potwierdzającym rezerwację sali wstawiacie zdanie: 'Polecamy też zaproszeniaonline.com - Wasza strona ślubna w 24h za 629 zł z kodem [DOM]10'. Plus opcjonalnie A4 ulotka w sali na recepcji."

**Wezwanie do akcji:**
> "Proponuję start: dam Wam kod testowy na 30 dni. Możecie go puścić w mailu do najbliższych zarezerwowanych par. Po 30 dniach widzimy ile leadów przyszło i decydujemy - przedłużamy, modyfikujemy procent, albo kończymy bez zobowiązań. Co Wy na to?"

**Jeśli "tak/zaciekawione":**
> "Świetnie. Daj mi imię, adres email, nazwę sali jaką wpisać do bazy i preferowany kod (sugeruję pierwsze 7 liter nazwy sali). Wysyłam Wam wszystko mailem dziś jeszcze - w jednym pliku PDF: kod, jak go używać, propozycja maila do par, link do panelu gdzie widzicie ile leadów już przyszło."

**Jeśli "muszę pomyśleć":**
> "Rozumiem. Czy mogę wysłać Wam jednostronicowy PDF z całą tą propozycją i 3 pytaniami które się najczęściej pojawiają? To 5 minut lektury, nic nie zobowiązuje. Po tygodniu odzwonię - sprawdzimy czy macie pytania."

**Jeśli "nie":**
> "Rozumiem, dziękuję za czas. Czy mogę zapytać co konkretnie nie pasuje - żebym wiedziała jak ulepszyć propozycję dla kolejnych domów?"
> (Notuj odpowiedź - to złoto dla iteracji oferty.)

### 9.5 Co NIE robić w rozmowie

- **NIE mówić "platforma", "SaaS", "MVP", "skalować"** - to nie język małych-średnich sal weselnych
- **NIE obiecywać "100 par/rok"** - nie wiemy ile dom zrobi, plus my mamy limit operacyjny
- **NIE wchodzić w długą historię firmy** ("zaczęliśmy w 2026 jako działalność nieewidencjonowana…") - interesuje ich rozwiązanie, nie nasze life story
- **NIE pokazywać na żywo formularzy admin/Supabase** - wygląda jak demo dla developerów, nie jak gotowy produkt
- **NIE wchodzić w polemiki cenowe** ("a u konkurencji jest 99 zł/mc") - przekierowuj do "u nas raz, jednorazowo"
- **NIE umawiać na 30-minutowe spotkanie w pierwszym kontakcie** - koszt psychologiczny zbyt duży, sale weselne są zarobione

---

## 10. COLD EMAIL TEMPLATES (3 warianty per persona)

> **DM rozwija te szkice w pełne maile zgodnie z brand voice zaproszeniaonline (forest green, Inter/Fraunces, profesjonalny ale luźny, BEZ em-dashy, polski only).**

### 10.1 Email do P1 (Właściciel, family-owned, 20-40 wesel/rok)

**Temat:** Propozycja bez ryzyka - strony ślubne dla Państwa par

**Hook:** Konkret + zero risk + zero pracy
**Demo link:** `/demo`
**CTA:** "Mogę zadzwonić w czwartek 16:00 i opowiedzieć w 4 minuty?"

### 10.2 Email do P2 (Manager / Koordynator, 50-100 wesel/rok)

**Temat:** RSVP w Excelu - koniec końców

**Hook:** Konkretny operacyjny ból + 1 metric (np. "3 godziny tygodniowo")
**Demo link:** `/demo` + screenshot formularza RSVP
**CTA:** "Czy mogę pokazać 5 minut wideo demo + 10 min Q&A w przyszłym tygodniu?"

### 10.3 Email do P3 (Dyrektor marketing, sieć/grupa hotelarska)

**Temat:** Cyfrowa differentiation dla pakietów ślubnych [Marka sieci]

**Hook:** Konkurencja regionalna + KPI (conversion uplift) + trend pokoleniowy
**Demo link:** `/demo` + slide deck PDF
**CTA:** "Prezentacja 20 minut na call w komitecie - proponuję 3 terminy w przyszłym tygodniu"

---

## 11. FAQ - TOP 15 PYTAŃ OD DOMU WESELNEGO (do dopracowania przez DM)

### O produkcie
1. **"A jeśli para już ma zaproszenia papierowe?"**
   → Strona internetowa nie konkuruje z papierem dla starszych gości. Można dać oba - papier dla babci, link dla młodszych gości. Plus QR kod do druku na papierowych save-the-date.
2. **"Czy starsi goście to ogarną?"**
   → Strona otwiera się w przeglądarce po kliknięciu w link, bez instalacji, bez rejestracji. Wszystko czytelne, mobile-first. Statystycznie 65+ otwiera 90% wysłanych im linków (rates Resend).
3. **"Czy mogę zobaczyć inne realizacje?"**
   → Demo Anna&Michał + Magda&Tomek na stronie. Pełne portfolio realnych par budujemy obecnie (pierwsza sprzedaż jeszcze nie dawno) - dorzucamy w D+30/60.
4. **"Jakie palety oferujecie?"**
   → 4 wbudowane (leśna zieleń, granat+róż, bordo+kość, terracotta) + custom palety dla par premium. Zazwyczaj para wybiera w briefie.

### O modelu współpracy
5. **"Jak technicznie działa kod rabatowy?"**
   → Wpisujemy kod do bazy → para wpisuje go w formularzu na naszej stronie → walidacja na żywo (300ms) → -10% (lub inny ustalony %) → tracking automatyczny. Mamy panel SQL gdzie widać ile leadów przyszło z każdego kodu.
6. **"Kiedy dostajemy nasze 50 zł / 100 zł / % revshare?"**
   → Po zakończeniu miesiąca rozliczeniowego, do 15. dnia następnego miesiąca, przelewem na konto firmy. Zestawienie po mailu z listą par + kwotami.
7. **"Czy musimy podpisywać umowę?"**
   → Dla modelu A (affiliate kod) - wystarczy list intencyjny mailem (akceptujemy zasady na 1 stronie). Dla modelu B (bundle wholesale) - pełna umowa z prawnikiem.
8. **"Co jeśli zmieniacie ceny?"**
   → Gwarantujemy ceny dla par z kodem na minimum 90 dni od pierwszej rozmowy. Zmiana z minimum 30-dniowym wyprzedzeniem mailowym.
9. **"Czy mogę zobaczyć ile leadów przyszło z mojego kodu?"**
   → Tak. Raz na miesiąc dostajecie raport mailem. Docelowo (Q3 2026) - własny dashboard online.

### O technologii / RODO
10. **"Gdzie są dane gości - w UE czy USA?"**
    → Postgres EU Frankfurt (Supabase, eu-central-1). Wszystkie procesory (Supabase, Stripe, Resend, Vercel) - w UE lub z SCC. DPA podpisane lub auto-binding.
11. **"Co jeśli wypadnie strona w dniu ślubu?"**
    → Vercel + Supabase mają SLA 99.99%. Plus para dostaje kopię HTML do archiwizacji - w skrajnym wypadku można odpalić z laptopa offline.
12. **"Co jeśli para chce coś nietypowego (np. tłumaczenie EN dla zagranicznych gości)?"**
    → Robimy. **2 rundy poprawek** w cenie 699 zł. Większe rzeczy (multi-language, custom illustration) - wycena dodatkowa 200-500 zł, do uzgodnienia.

### O sytuacji prawnej / dokumentach
13. **"Czy wystawiacie fakturę VAT?"**
    → Obecnie rachunek (działalność nieewidencjonowana, art. 5 ust. 1 Prawa przedsiębiorców). Po przekroczeniu progu - JDG zwolnione z VAT, faktura "zw" z art. 113. Z perspektywy partnera B2B (Wy jako sala): rachunek od nas Wam też wystarczy, jeśli rozliczacie kosztami nieewidencjonowanymi.
14. **"Czy macie ubezpieczenie OC?"**
    → W trakcie pozyskiwania (vendor query Hiscox/Allianz/PZU). Status: zalecane przed 5. klientem. Do daty otrzymania polisy - model affiliate (kod rabatowy) nie ma znaczącego ryzyka, bo to Wy nic nie produkujecie i nic nie ryzykujecie.
15. **"Co jeśli para się nie wywiąże (nie zapłaci)?"**
    → Para płaci nam ZANIM ruszamy z realizacją (Stripe Payment Link). Brak zapłaty = brak strony. Wy dostajecie commission tylko za zapłacone realizacje. Zero ryzyka po Waszej stronie.

### O nowych warstwach (zmiany 2026-05-16)

16. **"Co jeśli nasi klienci nie dosyłają danych w 48h?"**
    → Klient ma 48h od potwierdzenia zamówienia na dosłanie pól oznaczonych jako "uzupełnię mailowo" (plan dnia, hotele, transport, historia pary, FAQ). Po 48h niedostarczenia - § 5 ust. 2 regulaminu: realizujemy bez tych pól (sekcje nieuzupełnione pomijamy lub uzupełniamy zawartością z demo). **To NIE jest "kara" dla pary** - to mechanizm który chroni nasze SLA 48h realizacji. Zwykle pary dosyłają w 24h, mając już komplet planowania. Dla domu weselnego: **nie ma wpływu na Waszą prowizję** - liczy się moment zapłaty, nie kompletności danych.

17. **"Czy macie program partnerski zapisany formalnie?"**
    → Tak. § 7 regulaminu terms.html opisuje program partnerski w 8 ustępach (commit 587271e, 2026-05-16). Mechanika kodów, walidacja, prawo odmowy w przypadku nadużyć, rozliczenia odrębną umową partnerską - wszystko regulaminowo. To różnica vs ad-hoc handshake deals u freelancerów.

18. **"Co to jest kod POLEC50? Słyszeliśmy że dajecie kody dla par."**
    → Klient który po realizacji wystawi 5-gwiazdkową opinię z consentem na publikację - automatycznie dostaje od nas **kod POLEC50** do podzielenia się ze znajomymi planującymi wesele. Dla Waszego programu partnerskiego to dodatkowy mechanizm dystrybucji: **Wasi polecone pary, gdy zostawią 5★, też dostają POLEC50 dla swoich znajomych** = lejek viralny nakładający się na Wasz kod. (UWAGA: dokładna mechanika POLEC50 - % rabatu, unikalny per klient czy uniwersalny - jest jeszcze do potwierdzenia przez Nicolasa przed publiczną komunikacją.)

19. **"Jaka jest polityka zwrotów?"**
    → Wpłata 699 zł jest **BEZZWROTNA po zaksięgowaniu** (art. 38 ust. 1 pkt 1 + art. 38 pkt 3 UoPK - usługa cyfrowa, treść nieskonalizowana). Zamiast zwrotów dajemy gwarancje: 2 rundy poprawek, 12 mc hostingu, przesunięcie terminu wydarzenia bez dopłaty, voucher uznaniowy w sytuacjach losowych. § 10a regulaminu. Para płaci → my dostajemy "skok startowy" → realizujemy w 48h. Dla Waszych klientów: jasna, transparentna umowa zamiast "może coś się da odwołać".

---

## 12. OBIEKCJE + ODPOWIEDZI

### O1: "Mamy już naszą stronę z formularzem rezerwacji" / "Już mamy partnera od zaproszeń"
**Odpowiedź:** "Świetnie. My nie zastępujemy Waszej strony ani Waszej obsługi rezerwacji. My obsługujemy parę - robimy jej osobistą stronę ślubną pod jej własnym adresem. Jest komplementarne, nie konkurencyjne. Wasz formularz rezerwacji sali dalej działa swoim torem. Nasza propozycja: jeśli para już rezerwuje u Was, dajcie jej dodatkowy benefit (strona w cenie z 10% rabatem)."

### O2: "Pary same sobie poradzą z zaproszeniami"
**Odpowiedź:** "Statystycznie tak. Ale 15-25% par planuje w panice 3-6 mc przed ślubem - i wtedy szukają rozwiązań szybkich. Plus dla 25-35-latków 'wszystko online' to oczekiwanie, nie luksus. Dając im to w pakiecie z salą - wygrywacie konkurencyjnie z sąsiednim domem który nie daje nic. Plus marża cash dla Was."

### O3: "699 zł to dużo za stronę internetową"
**Odpowiedź:** "Para porównuje 699 zł do papierowych zaproszeń dla 100 gości - które realnie kosztują 2000-2500 zł z dodatkami (menu, winietki, podziękowania, druk, wysyłka). Z perspektywy budżetu wesela 60-100 tys. zł - to 0,5-1%. Plus RSVP w cenie, mapy w cenie, hosting w cenie. Większość par tej klasy uznaje 699 zł za bardzo rozsądne."

### O4: "Skąd mam wiedzieć, że jesteście firmą, nie chłopakiem-freelancerem?"
**Odpowiedź:** "Jesteśmy w katalogu Izabeli Janachowskiej (link), w Wedding.pl (link), live strona z 8 zaindeksowanymi artykułami SEO, pełna infrastruktura prawna (terms/privacy/RODO), Stripe live payments. Nie ukrywamy że jesteśmy małym podmiotem na starcie - ale 100% transparentnie. Mogę przesłać Wam:
- Dane biznesowe (Nicolas Woroszyło, działalność nieewidencjonowana, plan eskalacji do JDG)
- Realne demo z RSVP i mapami
- Referencję z katalogu Janachowskiej
- Kontakt do prawnika RODO (review oferty)"

### O5: "Co z RODO?"
**Odpowiedź:** "Dom weselny otrzymuje od nas kod rabatowy - nie przekazujecie nam żadnych danych pary. Para sama wchodzi na naszą stronę i wpisuje swoje dane (już z naszą zgodą RODO). Wy nie jesteście administratorem ani procesorem tych danych. Czysty model affiliate. Dla modelu bundle (gdybyście kupowali wholesale) - wtedy podpisujemy umowę powierzenia art. 28 RODO (mamy gotowy template w legal-templates)."

### O6: "Co jeśli para będzie miała problem - zadzwoni do nas, nie do Was"
**Odpowiedź:** "Dlatego dajemy parze pełen kontakt mailowy (kontakt@zaproszeniaonline.com) + telefon w razie kryzysu (24h przed ślubem). Wasi koordynatorzy nie powinni odpowiadać na pytania o stronę. Plus na każdej stronie ślubnej jest dyskretna stopka 'Strona przygotowana przez zaproszeniaonline.com' z linkiem do nas. Jeśli para zadzwoni do Was - przekazujecie nas: 'Nasza firma robi tylko salę, ale dajemy Wam telefon do firmy, która zrobiła stronę'."

### O7: "Nie chcę żeby u nas wisiała Wasza reklama" (= obawa o brand)
**Odpowiedź:** "Rozumiem. Na stronie pary jest tylko dyskretna stopka z naszym URL. W modelu A (affiliate kod) wymagamy tylko żeby para wiedziała że to my, dla uniknięcia nieporozumień. W modelu B (bundle) i C (white-label) - możemy całkowicie ukryć naszą markę i strona wygląda jakby była Waszej produkcji. Każdy model wybieracie sami."

### O8: "Zobaczę i powiem za 2 tygodnie" (= soft no)
**Odpowiedź:** "Rozumiem. Czy mogę wysłać Wam jednostronicowy PDF - to co teraz powiedziałam zebrane na 1 stronie + 3 FAQ. Plus odzwonię w czwartek 23. maja o 11:00 - sprawdzimy czy macie pytania. Pasuje?" (Notujesz datę → fizycznie dzwonisz.)

### O9: "Najpierw poproście o spotkanie z naszym dyrektorem ds. partnerstw" (= przekierowanie u dużych sieci)
**Odpowiedź:** "Z przyjemnością. Czy może mi Pan/Pani dać kontakt - imię, mail, ewentualnie telefon? Jeśli ma Pan/Pani sugestię z czyjej strony powinien przyjść mail (np. przedstawienie od Państwa) - to bardzo by pomogło. Czy mogę powołać się na Pana/Panią?"

### O10: "Nie wierzę że pary płacą 700 zł za stronę kiedy mogą zrobić za darmo na Wix"
**Odpowiedź:** "Statystycznie zgadzamy się - kto chce, robi sam. Ale Wix to 8-15 godzin pracy własnej, w obcym języku UI (English) i z reklamą 'Created with Wix' w stopce. Pary które wybierają nas to grupa która ceni czas i jakość - segment 25-35 z budżetem wesela 60-100 tys. zł, dla których 699 zł = mniej niż 1 talerzyk gościa. To nie konkurencja masowa, to świadomy wybór segmentu mid-premium."

### O11: "Nie mam czasu na nowe partnerstwa"
**Odpowiedź:** "Czas: 5 minut na zatwierdzenie kodu, 1 minuta na wklejenie zdania do maila do par. Potem nic. Wszystko robi automat. Jeśli po 30 dniach nie ma żadnego leada - zapominamy. Jeśli jest - dostajecie 50 zł + zero pracy. Jaką inną propozycję partnerską ma Pan/Pani na podobnych warunkach?"

### O12: "Co jak się rozwiniecie i podniesiecie ceny? Co z naszymi parami które już zarezerwowały?"
**Odpowiedź:** "Gwarantujemy 90 dni od pierwszej rozmowy + każda para która już zarezerwowała ma swoje warunki zamrożone. Plus mamy 30-dniowy notice o zmianach. To w pierwszym mailu po zatwierdzeniu Waszego kodu - będzie pisemnie."

### O13: "Czemu 48h, nie 24h? Konkurencja obiecuje 24h."
**Odpowiedź:** "Bo realnie 48h to próg który **NIE wymaga overpromising**. Konkurencja co obiecuje 24h - łamie deklarację w 30% przypadków (źródło: review forów ślubnych typu Forum Wedding, recenzje Google domów które się tym chwalą). My obiecujemy 48h i zwykle robimy w 24-48h - ale nie chcemy ryzykować że klient ma w ręku obietnicę 24h, my potrzebujemy 36h, i konflikt urodzony. To kwestia **uczciwego SLA** vs marketingowego overpromise. Dla Was jako partnera B2B to lepiej: Wasi polecone pary nigdy nie wracają z 'oni mi obiecali a nie zrobili w terminie'. Dodatkowo: zegar 48h startuje od **dosłania kompletu danych**, nie od zamówienia - to jest świadomy mechanizm żeby chronić jakość. Para która dosyła w 24h ma stronę gotową w 72h od zamówienia. Para która dosyła w 48h - w 96h. Wszystko transparentnie."

### O14: "Co jeśli para chce zwrot?"
**Odpowiedź:** "Wpłata jest bezzwrotna po zaksięgowaniu (art. 38 UoPK, usługa cyfrowa). Ale dajemy gwarancje: 2 rundy poprawek w cenie, 12 mc hostingu, **przesunięcie terminu wydarzenia bez dopłaty** (np. przełożone wesele), voucher uznaniowy w sytuacjach losowych (zdrowie). Dla Was to znaczy: para która rezygnuje z wesela u Was nie wraca z 'a strona to przepada' - mają vouchera lub przesuwają termin. Pełna ochrona po obu stronach, § 10a regulaminu."

---

## 13. EMAIL FOLLOW-UP SEQUENCE (do dopracowania przez DM)

Po pierwszej rozmowie / pierwszym emailu - sekwencja 5 maili:

| Dzień | Treść | Cel |
|---|---|---|
| **D+0** | "Dzięki za rozmowę - oto co obiecałam" + 1-pager PDF + 3 FAQ | Materializacja, deliverable wartości |
| **D+3** | "Czy jest coś o co chcielibyście dopytać?" + screenshot najlepszego demo | Reminder + value-add |
| **D+7** | Mini-case: "Inny dom weselny rozważa modal X - co Wy o tym myślicie?" | Social proof + dialogue opener |
| **D+14** | "Mogłabym pokazać na żywo demo wideo 10 min - pasuje czwartek 16:00?" | Concrete CTA |
| **D+30** | "Zamykamy temat - czy chcecie spróbować przez 30 dni, czy odkładamy?" | Hard close (lub clean rejection dla CRM) |

---

## 14. METRYKI SUKCESU dla outreachu (KPI dla pierwszych 90 dni)

| Metryka | D-30 cel | D-60 cel | D-90 cel |
|---|---|---|---|
| Domów skontaktowanych (cold call/email) | 30 | 80 | 150 |
| Odpowiedzi pozytywne ("chętnie posłucham") | 12 (40%) | 28 (35%) | 48 (32%) |
| Rozmów demo / spotkań | 8 | 18 | 30 |
| Kodów aktywowanych | **3** | **8** | **15** |
| Pierwszy lead z kodu partnerskiego | tak | tak | tak |
| Pierwsza sprzedaż z kodu partnerskiego | nie | tak | min. 3 |
| % conversion lead z kodu → sprzedaż | n/d | 30-40% | 35-45% |
| Średnia liczba leadów per partner per mc | n/d | 0,5-1 | 1-2 |

**Risk flag:** jeśli D-30 = 0 aktywnych kodów → re-evaluation oferty (cena? model? targeting?). Jeśli D-60 = >20 aktywnych kodów → **infrastruktura technicznie unsustainable** w działalności nieewidencjonowanej, Nicolas musi natychmiast JDG.

---

## 15. RISK REGISTER (co może pójść nie tak)

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|---|---|---|---|
| Dom weselny prowadzi własną stronę dla par (mojaslubna.pl/fotify partnerships) → konkurencja | Średnie | Wysokie | Pre-screening ICP (Sekcja 7), nie targetować Anti-ICP |
| Dom przyjmuje propozycję ale nie poleca → 0 leadów | **Wysokie** | Niskie | Standard affiliate problem; mitygacja: model B (bundle = dom musi sprzedać żeby odzyskać kasę) |
| Pojawienie się skargi pary do domu ("Strona nie działała w dniu ślubu") → utrata reputacji partnera | Niskie | **Bardzo wysokie** | Vercel SLA 99.99% + HTML backup do archiwizacji + 24h support; ubezpieczenie OC w pipeline |
| Dom zażąda umowy z rygorystycznymi SLA których jeszcze nie umiemy spełnić | Średnie | Średnie | Standardowe SLA: 24h response, 7d resolution. Większe wymagania = model C/D = osobna umowa z prawnikiem |
| Wykrycie że konkurencja (mojaslubna, fotify) ma już programy affiliate i lepsze warunki | Niskie | Średnie | Validacja przez `competitor-scanner` skill w Q3 2026 (na razie nie ma evidence) |
| Pierwsza para z partnera ma traumę z RODO / wizerunku gości na zdjęciach → spór | Niskie | **Wysokie** | Pełna implementacja PHOTO_LIABILITY_SAFEGUARDS.md przed publikacją galerii (warstwa 1-4 deployed, warstwa 5 ubezpieczenie pending) |
| Nicolas przekroczy limit działalności nieewidencjonowanej szybciej niż JDG zarejestrowane | Średnie | Wysokie | Reminder przy 4. sprzedaży w mc → przygotowane formularze JDG, plan eskalacji w LEGAL_DATA.md |
| Dom będzie chciał ekskluzywności terytorialnej | Średnie | Niskie | W modelu A - nie dajemy. W modelu B/C - możliwe dla domów >50 wesel/rok |

---

## 16. ANEKS - KLUCZOWE LINKI I DANE

### 16.1 Linki publiczne (do wysyłania domom weselnym)
- **Landing:** https://zaproszeniaonline.com
- **Demo 1:** https://zaproszeniaonline.com/demo (Anna i Michał - paleta leśna zieleń)
- **Demo 2:** https://zaproszeniaonline.com/magda-tomek (paleta terracotta - **UWAGA**: w briefie 1.0 wpisano "granat+róż" - do potwierdzenia z Nicolasem, bo raport zmian 2026-05-16 mówi terracotta)
- **Demo 3 (pending DNS):** https://nicolas-test.zaproszeniaonline.com (paleta bordo) - standalone klient, paleta lock = bordo. Aktywne po dodaniu rekordu DNS A `nicolas-test 76.76.21.21` w OVH (TODO Nicolas). Do tego momentu URL fallback path-based: `https://zaproszeniaonline.com/nicolas-test/`. **`<meta robots="noindex,nofollow">`** - test pre-launch, NIE komunikować publicznie do czasu odindeksowania flagi.
- **Blog:** https://zaproszeniaonline.com/blog (8 artykułów SEO)
- **Cennik:** https://zaproszeniaonline.com/#cennik
- **FAQ:** https://zaproszeniaonline.com/#faq
- **Katalog Janachowska:** https://katalog.janachowska.pl/firma/zaproszeniaonline-com
- **Wedding.pl listing:** https://wedding.pl/zaproszenia-slubne/zaproszeniaonline-com

### 16.2 Kontakty
- **Marketing operator:** Dominika Kuś - `dominikakus333@gmail.com`, tel. 510 789 445
- **Brand owner:** Nicolas Woroszyło (Vidok Studio) - `nicolasworoszylo@gmail.com`
- **Mail brand:** `kontakt@zaproszeniaonline.com` (forward do Nicolas+Dominika)
- **Mail RODO:** `rodo@zaproszeniaonline.com`
- **Mail faktury/rachunki:** `faktury@zaproszeniaonline.com`

### 16.3 Pliki źródłowe w tym repo (dla DM do pogłębienia)
- `marketing/COMPETITIVE_LANDSCAPE.md` - pełna mapa rynku (13 marek, 6 hooków)
- `marketing/PRICING_ANALYSIS.md` - analiza cen PL 2025-2026 (449 linii)
- `marketing/BREAK_EVEN_ANALYSIS.md` - kalkulator papier vs digital + numerical hooks
- `marketing/ACTIVE_LISTINGS.md` - gdzie firma jest publicznie zarejestrowana
- `marketing/BRAND-ASSETS-REGISTRY.md` - rejestr wszystkich grafik produkcyjnych
- `AFFILIATE_INSTRUCTIONS.md` - instrukcja systemu kodów rabatowych (SQL + flow)
- `stripe-assets/product-description-pl.md` - gotowy copy produktu (B2C)
- `ONBOARDING_CLAUDE.md` - brand tokens (forest #2C3E2D + gold #C9A96E + Fraunces+Inter)
- `LEGAL_DATA.md` - dane biznesowe, plan eskalacji JDG
- `PROJECT_STATUS.md` - live snapshot stanu projektu (2026-05-13)
- `PHOTO_LIABILITY_SAFEGUARDS.md` - 5-warstwowa architektura zabezpieczeń przy galerii

### 16.4 Master brand profile (poza tym repo)
- `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/brand.json` - canonical brand source
- `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/audience.json` - pełna baza persony + ICP
- `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/playbook.md` - decisions log
- `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/AGENT_INSTRUCTIONS.md` - routing skilli

### 16.5 Voice rules (od Dominiki - brand voice)
Źródło: `ONBOARDING_CLAUDE.md` + `marketing/README.md`

- **Polski only** (na materiałach do domów weselnych - bez angielskich terminów typu "scale", "partnership")
- **Forest green + gold accent.** Inne kolory tylko w wyjątkach
- **Bez emoji** w body tekstu (wyjątek: ✓ ★ w trust signals)
- **Bez em-dashy** (znak długi mdash) ani półpauz (znak ndash). Zwykły dywiz `-`
- **Bez korpomowy.** "Zwiększa konwersję" → "więcej par mówi tak". "Synergia" → "razem działa lepiej"
- **Profesjonalnie ale luźno** - voice Vidok Studio
- **Konkretami, nie marketing-speakiem.** "+15% konwersji" lepsze niż "podnosi efektywność"

---

## 17. CHECKLIST PRZED ROZMOWĄ Z PIERWSZYM DOMEM WESELNYM

Przed tym jak Dominika wybierze pierwszy numer, ten check musi przejść 100%:

- [ ] Decyzja Nicolasa: który model proponujemy domyślnie (A2/A3/A4)?
- [ ] Decyzja Nicolasa: usunięcie testowego kodu `TEST10` z bazy
- [ ] Decyzja Nicolasa: mechanika POLEC50 (% rabatu, unikalny per klient czy uniwersalny, max_uses, dedicated stripe link) - **PRZED komunikacją publiczną materiałów Review Pipeline**
- [ ] Nicolas: dodanie rekordu DNS A `nicolas-test 76.76.21.21` w OVH dla subdomeny demo (jeśli ma być publicznie linkowana w ofercie B2B)
- [ ] Decyzja Nicolasa: czy `nicolas-test` ma być publicznie demo (zdjąć `noindex,nofollow`) czy zostaje tylko jako sandbox testowy
- [ ] Decyzja Nicolasa: rush fee dla realizacji ekspresowych <48h przed wydarzeniem (§ 5 ust. 3 regulaminu) - cena indywidualna domyślna do komunikacji (sugestia PRICING_ANALYSIS.md: 899-999 zł)
- [ ] 1-pager PDF dla domów weselnych gotowy (P0 deliverable z Sekcji 8)
- [ ] Cold call script (Sekcja 9) zinternalizowany - Dominika może go opowiedzieć bez ściągi
- [ ] FAQ Top 15 + obiekcje (Sekcje 11-12) gotowe - Dominika ma na drugim ekranie podczas rozmowy
- [ ] Lista 10 pierwszych domów weselnych do kontaktu (z ICP Tier A - Sekcja 7)
- [ ] Numer telefonu z którego dzwonimy (recommend: 510 789 445 - Dominiki, ten sam co w Wedding.pl listing - spójność)
- [ ] Wstępna treść pierwszego maila follow-up (D+0 z Sekcji 13)
- [ ] CRM lub spreadsheet do trackingu kontaktów (recommend: Google Sheets z kolumnami: dom / kontakt / data / status / next-step)
- [ ] Decyzja czy chcemy nagrywać rozmowy (do nauki - wymaga zgody rozmówcy + RODO)

---

## 18. NOTES OD CLAUDE (do Dyrektora Marketingu)

**Co JEST w tym briefie:**
- Wszystkie fakty produktowe (cena, czas, USP, stack) potwierdzone z plików projektu
- Cztery modele partnerstwa z ekonomiką (model A = w pełni gotowy, B-D = wymaga decyzji)
- ICP segmentacja w 3 tierach z konkretnymi kryteriami
- Pełny scenariusz cold call + 15 FAQ + 12 obiekcji + sequence follow-up
- KPI dla pierwszych 90 dni + risk register

**Co NIE jest w tym briefie (świadomie):**
- Konkretne nazwy 10 pierwszych domów weselnych do kontaktu - zostawione DM do researchu na bazie kryteriów ICP (Sekcja 7). Reason: lista wymaga aktualnego scrapingu Google Maps/katalogu Janachowskiej.
- Treść 1-pager PDF - to deliverable DM (Sekcja 8.2 P0), nie ma sensu pisać tutaj w MD.
- Gotowe maile w 100% (są szkice + struktura, DM dopracowuje w brand voice z dostępem do `brand-profiles/zaproszenia/`).
- Konkretne polskie zdjęcia / wizualizacje do oferty - to znów deliverable DM (z dostępu do `brand-assets-registry`).

**Czego DM POWINIEN dopytać Dominikę / Nicolasa PRZED rozpoczęciem pisania oferty:**
1. Który model jest defaultnym (A2 50zł flat / A3 100zł flat / A4 revshare 20%)?
2. Czy uruchamiamy outreach przed czy po podpisaniu Supabase DPA (status: ⏳ TODO w PROJECT_STATUS.md)?
3. Czy istnieje deadline biznesowy (np. "pierwszy partner do końca lipca")?
4. Budget marketingowy na materiały (1-pager druk? slide deck design? landing B2B coding)?
5. Decyzja: oferta tylko PDF/email czy też cold call DIY przez Dominikę vs zatrudnienie sales freelancera?
6. **Mechanika POLEC50** (% rabatu, unikalny per klient czy uniwersalny, max_uses, dedicated Stripe link) - blokuje deliverable P0.14 (explainer "Review Pipeline + POLEC50")
7. **Czy `nicolas-test` to publiczne demo czy sandbox?** - jeśli publiczne, dodać do materiałów (slide deck, 1-pager) jako trzeci demo
8. **Rush fee <48h** - czy jest cennik domyślny (sugestia 899-999 zł) czy zawsze "indywidualnie mailowo"?

---

## 19. CHANGELOG BRIEFU

**Wersja 1.1 (2026-05-16, sesja popołudniowa):**
Aktualizacja po zmianach oferty wprowadzonych przez Nicolasa 2026-05-13/14/15/16 (16 commitów main, opisanych w `RAPORT_ZMIAN_OFERTY_2026-05-16.md` w root repo).

**Zmiany faktów produktowych:**
- Czas realizacji: **24h od briefu → 48h od kompletu danych** (sekcja 0, 1.1, 1.2, 2.1, 3, 9.2, 9.3, FAQ Q16, O13)
- Rundy poprawek: **3 → 2** (sekcja 1.1, 3, FAQ Q12 + cofnięcie zmiany z 2026-05-13)
- Limit zdjęć: **5 → 7 ujęć** (sekcja 1.1, 3) + **14 MB łącznie**
- Polityka zwrotów: **BEZZWROTNA + gwarancje** (sekcja 3, FAQ Q19, O14)

**Nowe sekcje dodane:**
- 1.1: bullet o 48h dosylce danych przez klienta (§ 5 ust. 2)
- 1.1: info o § 8b muzyka + § 8c zdjęcia (regulacja prawna)
- 1.2: NOWA sekcja "Czego oczekujemy OD PARY" (dosylka 48h, oświadczenia o prawach autorskich, zgody RODO osób na zdjęciach)
- 2.1 USP 9: pełna ścieżka prawna (§ 7, § 8b, § 8c, § 10a) jako differentiator vs freelancerzy
- 3: rozszerzona tabela canonical (limit zdjęć, polityka zwrotów)
- 5.1: dedicated Stripe Payment Link per kod + kody do 99% off
- 5.1: NOWA sekcja "Fundament prawny" - § 7 program partnerski jako oficjalna ścieżka
- 8.1: Review Pipeline + kod POLEC50 + subdomena nicolas-test
- 8.2 deliverable P0.13: explainer infografika § 7
- 8.2 deliverable P0.14: explainer Review Pipeline + POLEC50
- 11 FAQ Q16: dosylka 48h
- 11 FAQ Q17: program partnerski § 7
- 11 FAQ Q18: POLEC50
- 11 FAQ Q19: polityka zwrotów bezzwrotna
- 12 O13: "Czemu 48h, nie 24h?" (rebut "konkurencja obiecuje 24h")
- 12 O14: "Co jeśli para chce zwrot?"
- 16.1: link do demo 3 (`nicolas-test.zaproszeniaonline.com`)
- 17 checklist: 4 nowe pendingi (POLEC50 mechanika, DNS, status publiczności nicolas-test, rush fee cennik)
- 18 dopytania: 6 → 8 (POLEC50, nicolas-test, rush fee)

**Co BLOKUJE DM przed pełnym wykonaniem briefu:**
- Mechanika POLEC50 (Nicolas decyzja) - blokuje materiały Review Pipeline
- Status DNS nicolas-test (Nicolas operacja) - blokuje slide deck z 3 demo
- Default model A2/A3/A4 (Nicolas decyzja) - blokuje 1-pager z konkretnym CTA

**Co DM MOŻE robić bez tych pendingów (na "pełen gaz"):**
- Listingi katalogowe (Janachowska, Wedding.pl, GBP) - find/replace 24h→48h, 3→2 rundy, 5→7 zdjęć
- Re-render brand assetów (FB cover, GB cover/hero, wizytówka, Apple Wallet, vCard, bio PDF) - update tekstów
- Update `brand.json` + memory canonical facts w `C:/Projekty/dyrektor-marketingu/brand-profiles/zaproszenia/`
- Cold email templates (3 persony) - bazując na sekcji 10 briefu i nowych voice rules
- Cold call script internalizacja
- 1-pager B2B PDF (placeholder dla modelu - "A2 vs A3 vs A4 - decyzja Nicolasa")

---

**Status briefu:** GOTOWY do wprowadzenia do projektu Dyrektor Marketingu.
**Wersja:** 1.1 (2026-05-16, sesja popołudniowa Dominiki)
**Poprzednia wersja:** 1.0 (2026-05-16, sesja poranna - zdezaktualizowała się po 11 commitach Nicolasa tego samego dnia)
**Source of truth dla zmian:** `RAPORT_ZMIAN_OFERTY_2026-05-16.md` (683 linie, sekcja 10.3 lista miejsc do update)
**Następny review:** po pierwszych 10 rozmowach z domami weselnymi - update FAQ + obiekcje na podstawie realnych pytań.
