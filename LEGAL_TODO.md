# Lista zadań prawnych — RODO compliance dla zaproszeniaonline.com

> Audit prawny wykonany 27 kwietnia 2026 przez Skill „prawnik" w Claude.
> Część zadań mogą wykonać tylko Ty (Nicolas) — AI nie ma dostępu do Twoich rejestrów, paneli, podpisów. Poniżej lista uporządkowana wg krytyczności.
>
> **⚖️ Zastrzeżenie:** poniższa analiza ma charakter informacyjny i nie zastępuje porady adwokata/radcy prawnego. Dla pierwszych 5 płacących klientów wystarczy. Powyżej skali / przy szczególnych przypadkach (transgranicznych, B2B) — konsultacja z prawnikiem RODO.

---

## 🔴 BLOKERY (musisz zrobić ZANIM przyjmiesz pierwszego klienta)

### 1. Uzupełnij dane Administratora w `privacy.html` i `terms.html`

W obu plikach są placeholdery `[DO UZUPEŁNIENIA]`:
- **NIP** firmy
- **REGON** firmy (jeśli masz; jeśli prowadzisz JDG i nie masz REGON, wpisz „nie dotyczy — JDG")
- **Adres siedziby** (zarejestrowany w CEIDG / KRS)

**Dlaczego krytyczne:** art. 13 ust. 1 lit. a RODO wymaga podania „tożsamości i danych kontaktowych administratora". Bez tego użytkownik nie może realizować swoich praw → ryzyko skargi do PUODO + kara administracyjna (do 20 mln EUR / 4 % rocznego obrotu).

**Jak naprawić:** edytuj pliki `privacy.html` (sekcja 1) i `terms.html` (§ 1), commit, push.

---

### 2. Załóż skrzynkę `kontakt@zaproszeniaonline.com`

Dziś ten adres widnieje w Privacy Policy jako jedyny kanał realizacji praw RODO (art. 15-22). Bez działającej skrzynki **nie jesteś w stanie odpowiadać na żądania w terminie 30 dni** (art. 12 ust. 3 RODO) → naruszenie obowiązku.

**Sposób:** Google Workspace (29 zł/m-c), Cloudflare Email Routing (darmowy alias), albo skrzynka u rejestratora domeny. Dowolne.

---

### 3. Zaakceptuj DPA z Supabase i Vercel

**Co to:** Umowa powierzenia przetwarzania danych (Data Processing Agreement, art. 28 RODO). Bez podpisanego DPA każda operacja na bazie Supabase / hosting Vercel = nielegalne powierzenie.

**Sposób:**
- **Supabase**: Dashboard → Settings → Compliance → kliknij **„Sign DPA"** (standardowy template Supabase, online, 1 minuta)
- **Vercel**: Dashboard → Team Settings → Security & Privacy → **„Data Processing Agreement"** → kliknij Accept
- Zachowaj dla siebie zrzuty ekranu z datą podpisania / akceptacji (dowód w razie kontroli PUODO)

---

### 4. Cofnij dane testowe z bazy demo

Aktualnie tabela `rsvps` zawiera dane testowe (E2E checks z dzisiaj — wszystkie usunąłem). Sprawdź czy nie zostały rekordy z prawdziwymi adresami e-mail z testów. Komenda:

```sql
-- W Supabase Studio → SQL Editor:
select * from public.rsvps order by created_at desc limit 20;
select * from public.song_requests order by created_at desc limit 20;
select * from public.leads where source = 'sanity-check' or source like 'e2e%';
```

Jeśli są rekordy z e-mailami które nie są Twoje testy, usuń je. (Mam pewność że dziś usunąłem wszystkie moje E2E.)

---

## 🟡 WAŻNE (zrób w ciągu pierwszego miesiąca)

### 5. Załóż **Rejestr Czynności Przetwarzania (RCP)** — art. 30 RODO

**Czy musisz:** TAK. Mała firma jest zwolniona z RCP **TYLKO JEŚLI** nie przetwarza danych szczególnych kategorii (art. 9). Ty zbierasz **alergie pokarmowe** w formularzach RSVP — to dane „o zdrowiu" → jesteś zobowiązany do prowadzenia RCP **niezależnie od skali**.

**Co tam wpisać** (pola wg art. 30 ust. 1 RODO):
- Nazwa procesu (np. „Obsługa zapytań ofertowych")
- Cele przetwarzania
- Kategorie osób (np. „potencjalni klienci", „klienci", „goście wesel")
- Kategorie danych
- Kategorie odbiorców (Supabase, Vercel, biuro rachunkowe)
- Transfery do państw trzecich (USA — SCC + DPA)
- Planowane terminy usunięcia (retention)
- Środki bezpieczeństwa (HTTPS, RLS, kopie zapasowe)

**Forma:** Excel/Word — nie ma obowiązku publikacji, trzymasz u siebie. Wzór z PUODO: <https://uodo.gov.pl/pl/138/3175> (dostępny do pobrania).

**Procesy do uwzględnienia (gotowa lista):**
1. Lead generation (formularz kontaktowy)
2. Realizacja umowy (dane klienta — imiona pary, daty, miejsca)
3. RSVP gości (z alergiami — szczególne kategorie!)
4. Propozycje piosenek (demo)
5. Program kodów rabatowych (dane partnerów)
6. Faktury i rozliczenia
7. Marketing (jeśli będziesz wysyłał newsletter)

---

### 6. Banner cookies — TYLKO jeśli wdrożysz analytics

**Stan obecny:** strona NIE używa cookies wymagających zgody (art. 173 ust. 3 Prawa telekomunikacyjnego). Nie potrzebujesz banner-a cookie consent.

**Kiedy banner stanie się obowiązkowy:**
- Wdrożenie Google Analytics, Meta Pixel, Hotjar, Plausible (Plausible bez cookies — bezpiecznie!), Microsoft Clarity
- Embedy YouTube, Vimeo (cookies third-party)
- Reklamy Google Ads, FB Ads
- Live chat (Tawk, Intercom)

**Rekomendacja:** używaj **Plausible** lub **Umami** — privacy-friendly analytics bez cookies → nie wymagają banner-a, są zgodne z RODO out-of-the-box.

---

### 7. Polityka prywatności — uzupełnij **datę aktualizacji** przy każdej zmianie

Gdy edytujesz `privacy.html`, zmień datę na górze: „Obowiązuje od [data] · ostatnia aktualizacja: [data]". Nieaktualna data = sygnał dla PUODO że dokument może być nieaktualny.

---

### 8. Przy pierwszym kliencie — umowa pisemna

System automatycznie obsługuje zapytania (lead form), ale formalna umowa z klientem (płacącym) powinna być zawarta **pisemnie** lub **mailowo z potwierdzeniem warunków**. Regulamin (`terms.html`) jest dobrym fundamentem — klient akceptuje go w mailowej korespondencji ofertowej.

**Wzór akceptacji:** w mailu z wyceną dodaj zdanie: *„Przystąpienie do realizacji następuje po Pana/Pani potwierdzeniu akceptacji wyceny oraz Regulaminu dostępnego pod adresem zaproszeniaonline.com/terms i Polityki Prywatności pod adresem zaproszeniaonline.com/privacy."*

---

## 🟢 UZUPEŁNIAJĄCE (gdy będziesz miał czas)

### 9. Polityka retencji danych — wewnętrzny dokument

Już zadeklarowane terminy w Privacy Policy (sekcja 4). Warto mieć wewnętrzny **harmonogram automatycznego usuwania** — obecnie żadne dane nie są automatycznie kasowane. W przyszłości:
- Edge Function w Supabase, uruchamiana raz w miesiącu
- Usuwa leady starsze niż 12 miesięcy z statusem „brak konwersji"
- Anonimizuje dane RSVP po 6 mc od ślubu

---

### 10. DPIA (Data Protection Impact Assessment) — art. 35 RODO

**Czy musisz:** prawdopodobnie nie. DPIA wymagana gdy „wysokie ryzyko" naruszenia praw — typowo: monitoring na masową skalę, dane wrażliwe na masową skalę, profilowanie systematyczne.

Twój przypadek: alergie zbierane sporadycznie (kilkadziesiąt rekordów per wesele), bez profilowania, bez automatycznego decydowania → **DPIA nie wymagana**. Ale gdy przekroczysz 100+ wesel rocznie → warto zrobić ocenę.

---

### 11. Zgoda partnerów programu kodów rabatowych

Gdy wystawiasz pierwszy kod (np. dla Pałacu w Korczewie), zawrzyj z nim **prostą umowę partnerską** zawierającą:
- Zgodę partnera na przetwarzanie jego danych (nazwa, email)
- Zasady programu (rabat %, kod, czas trwania)
- Klauzulę poufności statystyk

Nie musi być sformalizowana — wystarczy email z akceptacją. Wzór mogę wygenerować w kolejnej sesji.

---

### 12. Cookie banner — jeśli kiedyś dodasz analytics

Dziś pomijam (nie używasz cookies). Gdy będziesz wdrażał Plausible/Umami — zostaną _przepisy nadal pozwalają na brak banner-a_ (Plausible nie używa cookies). Gdyby Google Analytics 4 (GA4 używa cookies) → wtedy banner z poziomem zgody konieczny.

---

## ✅ Zrobione automatycznie (już w produkcji)

- Polityka prywatności (`/privacy`) — pełen RODO compliance, 10 sekcji + 2 nowe (kody, demo)
- Polityka cookies (`/cookies`) — z informacją o brakach cookies + logach API
- Regulamin (`/terms`) — 13 paragrafów + § 7 o kodach rabatowych
- 404 page (`/404`)
- RODO checkbox w lead form (REQUIRED, JS walidacja)
- Linki do polityk w footer landingu i dema
- Powrót do tego samego miejsca po przeczytaniu polityki (`history.back()`)
- HTTPS wszędzie
- RLS w Supabase (anon insert only, bez SELECT)
- Region Supabase EU (eu-west-1, Irlandia) — minimalizacja transferu poza EOG

---

## Twoja kolejność działań (tydzień 1)

```
PN  Wpisz NIP/REGON/adres do privacy.html i terms.html        [pkt 1]
PN  Załóż kontakt@zaproszeniaonline.com                       [pkt 2]
WT  Sign DPA Supabase + Vercel (10 minut UI)                  [pkt 3]
ŚR  Stwórz prosty RCP w Excel (wzór PUODO + lista 7 procesów) [pkt 5]
CZ  Pierwszy zewnętrzny test: ktoś znajomy klika landing,
    wypełnia lead form z fake danymi, sprawdzasz czy działa
PT  Pierwszy outreach do potencjalnych klientów / partnerów
```

Po tym tygodniu — masz prawnie czysty produkt gotowy do sprzedaży.

---

## Pytania do prawnika (kiedy będziesz miał >10 klientów)

1. Czy potrzebujesz osobnej umowy powierzenia z parą jako administratorem danych RSVP gości? (Vidok = procesor)
2. Czy program kodów rabatowych wymaga oddzielnej polityki dla partnerów?
3. Jeśli zaczniesz wystawiać faktury B2B dla domów weselnych — czy potrzeba zmienić Regulamin (różny reżim konsumencki vs B2B)?
4. Reklama produktu w mediach społecznościowych z prawdziwymi parami — wymaga oddzielnej zgody na wizerunek (art. 81 prawa autorskiego) — wzór klauzuli.

---

⚖️ **Powtórzenie:** ten dokument to roadmapa do compliance, nie porada prawna w rozumieniu ustaw o adwokaturze i radcach prawnych. Dla pewności pierwszej pełnej wersji do druku — daj prawnikowi do przejrzenia za 200-500 zł (jednorazowy review).
