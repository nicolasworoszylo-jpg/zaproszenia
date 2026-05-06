# POROZUMIENIE O WSPÓŁADMINISTROWANIU DANYMI OSOBOWYMI

**zawarte w dniu** ___________ **w** ___________

## Strony

**Współadministrator I:**
**Nicolas Woroszyło**, prowadzący jednoosobową działalność gospodarczą pod firmą "[FIRMA_NICOLAS]", z siedzibą w [ADRES_NICOLAS], NIP: [NIP_NICOLAS], REGON: [REGON_NICOLAS]
(dalej: "Współadministrator I" lub "Nicolas")

**Współadministrator II:**
**Dominika Kuś**, prowadząca jednoosobową działalność gospodarczą pod firmą "[FIRMA_DOMINIKA]", z siedzibą w [ADRES_DOMINIKA], NIP: [NIP_DOMINIKA], REGON: [REGON_DOMINIKA]
(dalej: "Współadministrator II" lub "Dominika")

— łącznie zwani "Współadministratorami" lub "Stronami"

---

## Preambuła

Strony wspólnie prowadzą działalność pod marką **zaproszeniaonline.com** polegającą na projektowaniu i wdrażaniu cyfrowych zaproszeń ślubnych jako stron internetowych z formularzem RSVP, planem dnia, mapami i galerią.

W ramach tej działalności Strony wspólnie ustalają cele i sposoby przetwarzania danych osobowych osób kontaktujących się przez formularz, klientów oraz gości w zaproszeniach klientów.

W związku z powyższym Strony są **współadministratorami** w rozumieniu **art. 26 ust. 1 RODO** (rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z 27 kwietnia 2016 r. — RODO).

Niniejsze Porozumienie określa **przejrzysty podział obowiązków** między Stronami zgodnie z art. 26 ust. 1 RODO, którego zasadnicza treść jest udostępniona osobom, których dane dotyczą.

---

## § 1. Przedmiot przetwarzania

1. Strony wspólnie przetwarzają dane osobowe w zakresie:
   - **a) Zapytania ofertowe (lead form)** — imię, e-mail, telefon, data wydarzenia, rodzaj wydarzenia, treść wiadomości
   - **b) Klienci po zawarciu umowy** — dane do faktury, dane projektowe (imiona pary, daty, miejsca, zdjęcia)
   - **c) Goście w zaproszeniach klientów (RSVP)** — imię, deklaracja obecności, menu, alergie (art. 9 RODO), transport, nocleg
   - **d) Partnerzy programu kodów rabatowych** — nazwa, e-mail, kod, statystyki użycia
   - **e) Korzystający z formularzy demonstracyjnych** — imiona, deklaracje, alergie

2. Cele przetwarzania:
   - Obsługa zapytań ofertowych
   - Wykonanie umowy projektowej
   - Wystawianie faktur i dokumentów księgowych
   - Marketing własnych usług (uzasadniony interes)
   - Rozliczenia z partnerami afiliacyjnymi
   - Testowanie i rozwój produktu

3. Podstawy prawne — szczegółowo wskazane w polityce prywatności pod adresem https://zaproszeniaonline.com/privacy

---

## § 2. Punkt kontaktowy

1. Punktem kontaktowym dla osób, których dane dotyczą, w celu wykonywania ich praw jest:

   **e-mail:** kontakt@zaproszeniaonline.com

2. Każda ze Stron jest uprawniona do udzielania odpowiedzi na żądania osób, których dane dotyczą.

3. Niezależnie od tego, do której ze Stron osoba skieruje swoje żądanie, otrzyma odpowiedź w terminie określonym w art. 12 RODO (1 miesiąc, z możliwością przedłużenia o 2 miesiące).

---

## § 3. Podział obowiązków

| Obowiązek | Odpowiedzialny |
|---|---|
| **Realizacja obowiązku informacyjnego** (art. 13 i 14 RODO) — utrzymanie polityki prywatności | **Nicolas** |
| **Realizacja praw osób** (art. 15-22 RODO) — dostęp, sprostowanie, usunięcie, sprzeciw, ograniczenie, przeniesienie | **Dominika** (pierwszy kontakt) → konsultacja z Nicolas (techniczna realizacja) |
| **Zgłaszanie naruszeń do UODO** (art. 33 RODO, 72 godziny) | **Nicolas** |
| **Powiadamianie osób o naruszeniu** (art. 34 RODO) | **Dominika** |
| **Rejestr czynności przetwarzania** (art. 30 RODO) | **Nicolas** (prowadzi rejestr w `~/Desktop/Claude/Zaproszeniaonline/legal/registry.md`) |
| **Ocena skutków dla ochrony danych** (DPIA, art. 35 RODO) | **Wspólnie** — gdy zachodzi przesłanka |
| **Kontakty z organami państwowymi** (UODO, sądy) | **Nicolas** (z konsultacją Dominiki) |
| **Wybór procesorów** (Vercel, Supabase, Stripe) i podpisanie DPA | **Nicolas** |
| **Polityki bezpieczeństwa technicznego** (hasła, MFA, backup) | **Nicolas** |
| **Marketing i komunikacja z klientami** | **Dominika** |

---

## § 4. Środki bezpieczeństwa

1. Strony stosują wspólnie następujące środki techniczne i organizacyjne (art. 32 RODO):
   - Backend Supabase (szyfrowanie at-rest AES-256, in-transit TLS 1.3)
   - Hosting Vercel (DDoS protection, edge encryption)
   - Stripe Payments (PCI DSS Level 1) — Strony nie przechowują danych kart
   - Self-host fonts/JS (zero transferu danych do podmiotów trzecich poza zadeklarowanymi)
   - Backup bazy danych — codziennie
   - Hasła i MFA dla każdego z paneli administracyjnych

2. Każda ze Stron zobowiązuje się do zachowania poufności danych po zakończeniu współpracy (klauzula trwałości — bezterminowo).

---

## § 5. Procesory (umowy powierzenia)

Procesorzy wykorzystywani wspólnie przez Strony:

- **Supabase Inc.** (USA) — DPA: https://supabase.com/legal/dpa
- **Vercel Inc.** (USA) — DPA: https://vercel.com/legal/dpa
- **Stripe Payments Europe Ltd.** (Irlandia) — DPA: https://stripe.com/legal/dpa
- **Resend Inc.** (USA) — DPA: https://resend.com/legal/dpa (po wdrożeniu)

Każdy procesor ma podpisaną umowę powierzenia z **Nicolasem** (jako reprezentantem Stron). Dominika wyraża zgodę na działanie Nicolasa w tym zakresie.

---

## § 6. Odpowiedzialność i koszty

1. Strony ponoszą wspólną odpowiedzialność wobec osób, których dane dotyczą (art. 26 ust. 3 RODO). Osoba może wykonywać swoje prawa wobec każdego ze Współadministratorów.

2. Koszty związane z hostingiem (Vercel, Supabase, fonty), narzędziami marketingowymi, eventualnymi karami UODO, opłatami sądowymi w sprawach ochrony danych:
   - **Pokrywane wspólnie** w proporcji **50/50**, chyba że konkretne zdarzenie wynika z winy jednej Strony — wtedy ta Strona pokrywa koszty samodzielnie.

3. Roszczenia regresowe między Stronami: na zasadach ogólnych KC.

---

## § 7. Mechanizm decyzyjny

1. Zmiany w polityce prywatności, regulaminie, polityce cookies wymagają **zgody obu Stron** (e-mail wystarczający).

2. Bieżące decyzje (odpowiedzi na żądania osób, kontakty z procesorami) — każda Strona samodzielnie w zakresie swoich obowiązków z § 3.

3. W przypadku sporu — Strony podejmują próbę rozstrzygnięcia mediacyjnego przed wystąpieniem na drogę sądową.

---

## § 8. Czas obowiązywania i wypowiedzenie

1. Porozumienie zawarte na czas nieokreślony.

2. Każda ze Stron może je wypowiedzieć z zachowaniem **3-miesięcznego okresu wypowiedzenia** złożonego na piśmie.

3. Po wypowiedzeniu Strony ustalają osobno tryb dalszego przetwarzania danych — w szczególności kto przejmuje funkcję samodzielnego administratora oraz jak zostaną poinformowane osoby, których dane dotyczą.

---

## § 9. Postanowienia końcowe

1. Wszelkie zmiany Porozumienia wymagają formy pisemnej pod rygorem nieważności.

2. **Zasadnicza treść Porozumienia jest udostępniana osobom, których dane dotyczą**, poprzez publikację w polityce prywatności pod adresem https://zaproszeniaonline.com/privacy (zgodnie z art. 26 ust. 2 zdanie drugie RODO).

3. W sprawach nieuregulowanych zastosowanie mają przepisy RODO, ustawy o ochronie danych osobowych z 10 maja 2018 r. oraz Kodeksu cywilnego.

4. Sądem właściwym dla rozstrzygania sporów jest sąd właściwy dla siedziby Współadministratora I.

5. Porozumienie sporządzono w **2 jednobrzmiących egzemplarzach**, po jednym dla każdej Strony.

---

**Współadministrator I:**
______________________________
Nicolas Woroszyło
Data: ___________

**Współadministrator II:**
______________________________
Dominika Kuś
Data: ___________

---

## Załącznik 1 — Wyciąg dla osób, których dane dotyczą (do publikacji w polityce prywatności)

> **Współadministratorzy danych osobowych** prowadzący zaproszeniaonline.com — Nicolas Woroszyło i Dominika Kuś — zawarli porozumienie zgodnie z art. 26 RODO określające podział obowiązków:
>
> - **Nicolas Woroszyło** odpowiada za: politykę prywatności, rejestr czynności przetwarzania, zgłoszenia naruszeń do UODO, kontakty z procesorami (Vercel, Supabase, Stripe), środki bezpieczeństwa technicznego.
> - **Dominika Kuś** odpowiada za: realizację praw osób (dostęp, sprostowanie, usunięcie, sprzeciw), powiadamianie osób o naruszeniach, marketing.
>
> **Punkt kontaktowy:** kontakt@zaproszeniaonline.com — zgłoszenie do tego adresu jest skuteczne wobec obu Współadministratorów.
>
> Niezależnie od podziału obowiązków, **każda osoba, której dane dotyczą, może wykonywać swoje prawa wobec każdego z Współadministratorów** (art. 26 ust. 3 RODO).
