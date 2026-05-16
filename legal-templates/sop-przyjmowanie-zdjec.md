# SOP: Przyjmowanie zdjęć od klienta

**Cel:** zachowanie safe harbor z art. 14 UŚUDE + art. 6 DSA. Jeśli klient prześle zdjęcia, do których nie ma praw, my odpowiadamy TYLKO gdy "wiemy o bezprawnym charakterze". Ten dokument opisuje, jak prowadzić proces tak, żeby nie mieć takiej wiedzy w sposób zarzucalny.

**Odpowiedzialny:** Dominika Kuś (osoba upoważniona do przetwarzania danych, privacy.html §1).
**Dotyczy:** każdego zamówienia, w którym klient prześle zdjęcia (mailem lub Google Drive).
**Podstawa prawna:** Regulamin §8c, §8d, §11 ust. 3-5.

---

## Checklista odbioru zdjęć (per zamówienie)

Przejrzyj **każde zdjęcie** zanim trafi do projektu. Zajmuje to <30 sekund na zdjęcie.

### 1. Znak wodny

- [ ] Czy zdjęcie ma widoczny znak wodny fotografa lub agencji (logo, podpis, "©", "DO NOT COPY")?
  - **TAK** → nie używaj. Napisz do klienta z prośbą o:
    - wersję bez znaku wodnego (jeśli ma licencję),
    - albo skan/zdjęcie fragmentu umowy z fotografem potwierdzającego prawo do publikacji online.
  - **NIE** → przejdź do kroku 2.

### 2. Metadane EXIF

- [ ] Otwórz właściwości pliku (Cmd+I w Finder na Macu) lub użyj komendy:
  ```bash
  mdls -name kMDItemAuthors -name kMDItemCopyright -name kMDItemContentCreator <plik.jpg>
  ```
  Sprawdź pola: `Author`, `Copyright`, `Creator`, `Artist`, `Owner`.

- [ ] Czy w polach jest nazwisko / firma INNA niż klient?
  - **TAK** → to prawdopodobnie profesjonalny fotograf. Napisz do klienta:
    > "Cześć, na zdjęciu [nazwa pliku] widzę w metadanych autora [X]. Wygląda na zdjęcie od fotografa zawodowego. Możecie potwierdzić, że Wasza umowa z fotografem obejmuje publikację online na stronie ślubnej? Wystarczy fragment umowy / regulaminu sesji / email od fotografa z potwierdzeniem. Bez tego nie mogę umieścić tego zdjęcia w zaproszeniu (paragraf 8c Regulaminu)."
  - **NIE** lub puste → przejdź do kroku 3.

### 3. Wygląd profesjonalny

- [ ] Czy zdjęcie wygląda na profesjonalne (studio, sesja zaręczynowa, ślubna, retoucher)?
  - **TAK** + brak innych sygnałów → wyślij krótkiego maila do klienta:
    > "Cześć, te zdjęcia wyglądają fenomenalnie - profesjonalne. Dla porządku potwierdźcie tylko, że Wasza umowa z fotografem obejmuje publikację w zaproszeniu cyfrowym (strona www). Zazwyczaj fotografowie dają taką licencję, ale wolimy mieć to potwierdzone na piśmie - jedno zdanie w odpowiedzi wystarczy."
  - **NIE** (zdjęcia smartfonowe, selfie, instagramowe) → zwykle nie ma ryzyka. Przejdź do kroku 4.

### 4. Osoby na zdjęciu

- [ ] Czy poza parą widać inne osoby (rodzice, świadkowie, dzieci, znajomi)?
  - **TAK** → przypomnienie w odpowiedzi do klienta:
    > "Świetne zdjęcia! Pamiętajcie żeby uprzedzić osoby widoczne na zdjęciach, że wezmą udział w cyfrowym zaproszeniu - to wymóg RODO (paragraf 8c.2.c Regulaminu, art. 81 prawa autorskiego). Standardowo wystarczy jedno zdanie w rozmowie z gośćmi."
  - **NIE** (tylko para lub osoby anonimowe/krajobraz) → ok bez dodatkowych kroków.

### 5. Treści wrażliwe

- [ ] Czy zdjęcie zawiera:
  - dzieci (małoletnich) → potrzebna zgoda rodzica/opiekuna prawnego (paragraf 8c.2.d),
  - osoby trzecie w sytuacji prywatnej (basen, plaża, łazienka) → zgoda explicit,
  - widoczne dokumenty z danymi (paszport, dowód, nr karty) → ODMÓW, paragraf 8c.2.e,
  - logo / produkty firmowe na widoku → ok dla zaproszenia ślubnego (incydentalne).

---

## Co dokumentować

Dla każdego zamówienia z zdjęciami zapisz krótką notatkę (1-2 linijki) w komentarzu do leada w Supabase (kolumna `notes` lub w panelu Productive jeśli klient WP):

```
2026-05-XX | 8 zdjęć, brak znaków wodnych, EXIF czysty, 2 zdjęcia profesjonalne - klient potwierdził licencję od fotografa Kowalski Studio mailem z 2026-05-XX.
```

Ta notatka jest dowodem due diligence gdyby później pojawiło się roszczenie. W razie sporu pokazujemy: "stosowaliśmy procedurę, klient potwierdził posiadanie praw, nie mieliśmy wiedzy o bezprawnym charakterze" → safe harbor utrzymany.

## Co zrobić gdy klient zignoruje pytania

Klient otrzymał maila o brakującą informację (krok 2 albo 3), nie odpowiada od 48h:

1. Wyślij przypomnienie z deadlinem 24h.
2. Po 72h bez odpowiedzi - **odmów umieszczenia kwestionowanego zdjęcia** (paragraf 8c.5.a).
3. Realizuj zaproszenie bez tego zdjęcia, w komunikacji do klienta: "Z braku potwierdzenia licencji nie mogliśmy umieścić zdjęcia [nazwa], reszta projektu gotowa. Jeśli prześlecie później potwierdzenie - dodamy w ramach jednej z 3 rund poprawek."

Nie przerywamy realizacji całej Usługi - tylko pomijamy ryzykowne zdjęcie. To zgodne z gwarancjami z paragraf 10a (3 rundy poprawek).

## Co zrobić gdy fotograf się odezwie po publikacji (Notice & Takedown)

Procedura w Regulaminie paragraf 8d. W skrócie:

1. Otrzymujesz maila na kontakt@zaproszeniaonline.com (z dopiskiem „Notice & Takedown" lub „DSA" w tytule, zgodnie z procedurą § 8d Regulaminu).
2. Sprawdź czy zgłoszenie zawiera 5 wymaganych elementów (paragraf 8d ust. 3 a-e). Jeśli brakuje - poproś o uzupełnienie (24h).
3. Jeśli zgłoszenie oczywiście zasadne (znak wodny widoczny, plik z wyraźnym credit) → usuń zdjęcie w ciągu **24 godzin**, powiadom klienta i zgłaszającego.
4. Jeśli nieoczywiste → zbierz odpowiedź klienta (24h deadline), podejmij decyzję w ciągu 72h od zgłoszenia.
5. Każde działanie zapisz w logu - kto, kiedy, jaka decyzja, jakie dowody.

Adresy:
- `kontakt@zaproszeniaonline.com` - jedyny publiczny adres (od 2026-05-16), obsługuje N&T, RODO i wszystkie inne sprawy. W tytule prosimy dopisać "Notice & Takedown" lub "RODO" dla szybszej obsługi.

## Dlaczego to ważne

Bez tego procesu safe harbor pada, gdy ktoś udowodni że "wiedzieliśmy". Z tym procesem mamy dowód że stosowaliśmy realne kroki weryfikacji - co przewiduje art. 14 ust. 1 UŚUDE i art. 6 DSA. To nasza tarcza prawna.

Czas trwania procesu: ~5 minut per zamówienie. Wartość prawna: nieskończenie większa.
