# UMOWA POWIERZENIA PRZETWARZANIA DANYCH OSOBOWYCH

**dla pary młodej (Klienta) zamawiającej zaproszenie ślubne**

---

**zawarta w dniu** ___________ pomiędzy:

**Administratorem (Klient — para młoda):**
[IMIONA_PARY], adres: [ADRES_KLIENTA], e-mail: [EMAIL_KLIENTA]
(dalej: "Administrator")

a

**Podmiotem przetwarzającym (Procesor):**
**Nicolas Woroszyło i Dominika Kuś** — współadministratorzy prowadzący działalność pod marką **zaproszeniaonline.com** (dalej: "Procesor"), kontakt: kontakt@zaproszeniaonline.com

---

## Preambuła

Administrator zamówił u Procesora wykonanie cyfrowego zaproszenia ślubnego — strony internetowej zawierającej formularz potwierdzania obecności (RSVP) dla gości Administratora.

W ramach realizacji umowy Procesor przetwarza dane osobowe gości Administratora. Administrator pozostaje **administratorem** tych danych w rozumieniu RODO; Procesor działa wyłącznie na podstawie i w granicach niniejszej umowy.

Niniejsza umowa stanowi **umowę powierzenia przetwarzania** w rozumieniu **art. 28 ust. 3 RODO** i jest zawierana w wykonaniu obowiązku Administratora do udokumentowania przetwarzania.

---

## § 1. Przedmiot powierzenia

1. **Cel powierzenia:** umożliwienie Administratorowi zebrania potwierdzeń obecności (RSVP) od gości na wydarzenie [TYP_WYDARZENIA] w dniu [DATA_WYDARZENIA].

2. **Charakter przetwarzania:** zbieranie, przechowywanie, udostępnianie Administratorowi (przez panel administracyjny lub eksport CSV).

3. **Czas trwania:** od dnia podpisania umowy do dnia wydarzenia + 6 miesięcy, następnie usunięcie lub anonimizacja danych zgodnie z § 7.

4. **Rodzaj danych osobowych:**
   - imię i nazwisko gościa
   - deklaracja obecności (tak/nie)
   - liczba osób towarzyszących
   - preferencje menu (np. wegetariańskie, bezglutenowe)
   - **alergie pokarmowe** — dane szczególnej kategorii w rozumieniu art. 9 RODO (dane dotyczące zdrowia)
   - potrzeba transportu
   - potrzeba noclegu
   - dodatkowe uwagi
   - opcjonalnie: propozycje piosenek

5. **Kategorie osób, których dane dotyczą:** goście wydarzenia Administratora.

---

## § 2. Obowiązki Procesora (art. 28 ust. 3 RODO)

Procesor zobowiązuje się:

1. **Przetwarzać dane wyłącznie na udokumentowane polecenie Administratora** — w szczególności w zakresie celu i sposobu wskazanego w § 1. Polecenia mogą być przekazywane przez Administratora w formie elektronicznej (e-mail).

2. **Zapewnić poufność** — osoby uprawnione do przetwarzania (Nicolas Woroszyło, Dominika Kuś) zobowiązują się do zachowania poufności bezterminowo.

3. **Stosować środki techniczne i organizacyjne** zapewniające bezpieczeństwo przetwarzania (art. 32 RODO):
   - Szyfrowanie at-rest (AES-256) i in-transit (TLS 1.3)
   - Backup codzienny
   - Kontrola dostępu (MFA, hasła)
   - Hosting Supabase (eu-west-1, Irlandia)

4. **Udostępniać Administratorowi wszelkie informacje** niezbędne do wykazania zgodności (audyty, kontrole UODO).

5. **Pomagać Administratorowi** w wykonywaniu obowiązków:
   - odpowiadanie na żądania osób (art. 15-22 RODO)
   - zgłaszanie naruszeń (art. 33-34 RODO) — Procesor zgłasza Administratorowi w ciągu **24 godzin** od wykrycia
   - oceny skutków (DPIA, art. 35 RODO)
   - konsultacje z UODO (art. 36 RODO)

6. **Po zakończeniu świadczenia usługi** (po terminie z § 1 ust. 3) — usunąć lub zwrócić Administratorowi wszystkie dane osobowe oraz usunąć kopie, chyba że prawo Unii lub państwa członkowskiego wymaga ich przechowywania.

---

## § 3. Podpowierzenie (sub-procesorzy)

1. Administrator wyraża **zgodę ogólną** na korzystanie przez Procesora z następujących sub-procesorów:

| Sub-procesor | Funkcja | Lokalizacja | DPA |
|---|---|---|---|
| **Supabase Inc.** | hosting bazy danych RSVP | eu-west-1 (Irlandia), siedziba USA | https://supabase.com/legal/dpa |
| **Vercel Inc.** | hosting strony internetowej | EU edge + USA | https://vercel.com/legal/dpa |

2. Procesor poinformuje Administratora o **zamiarze zmiany sub-procesorów** z wyprzedzeniem **30 dni**, dając Administratorowi możliwość sprzeciwu.

3. Procesor zawiera z każdym sub-procesorem umowę powierzenia o treści zapewniającej co najmniej taki sam poziom ochrony jak niniejsza umowa.

---

## § 4. Transfer poza EOG

Sub-procesorzy ze Stanów Zjednoczonych (Supabase, Vercel) przetwarzają dane na podstawie:
- **standardowych klauzul umownych (SCC)** zatwierdzonych decyzją wykonawczą Komisji Europejskiej 2021/914
- **DPA** podpisanych przez Procesora z każdym sub-procesorem

---

## § 5. Bezpieczeństwo i zgłaszanie naruszeń

1. W przypadku **naruszenia ochrony danych osobowych** Procesor zgłasza Administratorowi w ciągu **24 godzin** od wykrycia, podając:
   - charakter naruszenia
   - kategorie i przybliżoną liczbę osób
   - prawdopodobne konsekwencje
   - środki podjęte lub proponowane do zaradzenia

2. Administrator jest odpowiedzialny za zgłoszenie naruszenia do **PUODO** w ciągu 72 godzin (art. 33 ust. 1 RODO) — Procesor pomaga w zakresie technicznym.

---

## § 6. Audyt

Administrator ma prawo do audytu Procesora w zakresie wykonywania niniejszej umowy:
- audyty dokonywane są na koszt Administratora
- z **30-dniowym wyprzedzeniem**
- nie częściej niż **raz na 12 miesięcy** (chyba że nastąpiło naruszenie)
- Procesor udostępnia audyty stron trzecich (np. SOC 2 Supabase, Vercel) — w pierwszej kolejności rekomendowane

---

## § 7. Zakończenie umowy i los danych

1. Po dniu **wydarzenia + 6 miesięcy** (np. galeria zdjęć dostępna 6 miesięcy po ślubie):
   - Procesor **usuwa dane RSVP gości**, lub
   - na wyraźne pisemne polecenie Administratora — przekazuje pełen eksport CSV i usuwa po przekazaniu

2. Hosting strony zaproszenia: **12 miesięcy** od dnia realizacji (zgodnie z regulaminem). Po tym terminie strona przestaje być dostępna pod URL i jest usuwana z infrastruktury Procesora.

---

## § 8. Odpowiedzialność

1. Strony ponoszą odpowiedzialność za szkody wyrządzone osobom, których dane dotyczą, na zasadach art. 82 RODO.

2. **Roszczenia regresowe** — Procesor może domagać się od Administratora zwrotu odszkodowań wypłaconych z winy Administratora (np. niezgodnego z prawem polecenia przetwarzania).

---

## § 9. Postanowienia końcowe

1. Zmiany umowy wymagają formy pisemnej (e-mail wystarczający) pod rygorem nieważności.

2. W sprawach nieuregulowanych: RODO + Kodeks cywilny + ustawa o ochronie danych osobowych z 10 maja 2018 r.

3. Sądem właściwym jest sąd właściwy dla siedziby Procesora.

---

**Administrator (Klient):**
______________________________
[IMIONA_PARY]
Data: ___________

**Procesor:**
______________________________
Nicolas Woroszyło / Dominika Kuś (zaproszeniaonline.com)
Data: ___________

---

## ⚙️ Workflow operacyjny (instrukcja dla Was)

1. Po otrzymaniu zamówienia — automatyczny e-mail do Klienta z linkiem do tego dokumentu (PDF generowany z tego MD lub jako Google Doc share-link)
2. Klient akceptuje przez kliknięcie linka "Zgadzam się" w mailu (timestamped) — to jest dowód zawarcia umowy w formie elektronicznej (art. 60 KC)
3. Procesor przechowuje kopię akceptacji + dane Klienta w `~/Desktop/Claude/Zaproszeniaonline/legal/dpa-clients/[KLIENT]/` przez 5 lat od zakończenia umowy (Ordynacja podatkowa)
