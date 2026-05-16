# Szablon rachunku - działalność nieewidencjonowana

> Podstawa prawna: art. 87 § 1 ustawy z dnia 29 sierpnia 1997 r. - Ordynacja podatkowa
> (Dz.U. 1997 nr 137 poz. 926). Działalność nieewidencjonowana art. 5 ust. 1 ustawy
> z dnia 6 marca 2018 r. - Prawo przedsiębiorców (Dz.U. 2018 poz. 646).
>
> **NIE jest to faktura VAT.** Sprzedawca nie jest podatnikiem VAT
> (działalność nieewidencjonowana = zwolnienie podmiotowe poniżej progu).

## Sposób użycia

1. Skopiuj ten plik do `sprzedaz/2026-MM/R-2026-NNN-IMIE_NAZWISKO.md`
   (NNN = numer kolejny w roku: 001, 002, ...)
2. Wypełnij `<<placeholder>>` danymi klienta
3. Eksport do PDF: `pandoc R-2026-NNN.md -o R-2026-NNN.pdf` lub Google Docs → Export PDF
4. Wyślij klientowi mailem (`kontakt@zaproszeniaonline.com` → klient)
5. Zachowaj PDF w `sprzedaz/2026-MM/`
6. Update `sprzedaz/2026-MM/.miesiac-suma.txt` (kontrola limitu 3 499,50 zł/mc)

---

# RACHUNEK NR R-2026-<<NNN>>

**Miejsce wystawienia:** Gdańsk
**Data wystawienia:** <<RRRR-MM-DD>>
**Data sprzedaży:** <<RRRR-MM-DD>> (data wpłaty Stripe)

---

## Sprzedawca

**Nicolas Woroszyło**
prowadzący działalność nieewidencjonowaną pod marką **zaproszeniaonline.com**
(art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. - Prawo przedsiębiorców)

- **NIP:** nie dotyczy (działalność nieewidencjonowana, sprzedawca nie jest podatnikiem VAT)
- **REGON:** nie dotyczy
- **Adres do korespondencji:** kontakt@zaproszeniaonline.com
- **Adres do doręczeń:** udostępniany na żądanie

## Nabywca

- **Imię i nazwisko:** <<IMIE NAZWISKO KLIENTA>>
- **Adres:** <<ULICA, KOD MIASTO>>
- **E-mail:** <<EMAIL KLIENTA>>
- **NIP nabywcy:** <<NIP jeśli klient B2B, inaczej "nie dotyczy">>

## Przedmiot sprzedaży

| Lp. | Opis usługi | Ilość | Cena jedn. | Wartość |
|-----|-------------|-------|------------|---------|
| 1 | Cyfrowe zaproszenie ślubne - strona internetowa z formularzem RSVP, planem dnia, mapami Google, galerią zdjęć, sekcją „Nasza historia", 4 paletami kolorów, muzyką w tle. Hosting 12 miesięcy. | 1 szt. | **699,00 zł** | **699,00 zł** |

**Razem do zapłaty: 699,00 zł** (słownie: *sześćset dziewięćdziesiąt dziewięć złotych zero groszy*)

> **Bez VAT** - sprzedawca prowadzi działalność nieewidencjonowaną i nie jest podatnikiem VAT
> w rozumieniu art. 15 ustawy o VAT.

## Sposób płatności

✅ **Zapłacono w pełni dnia <<RRRR-MM-DD>>** za pośrednictwem Stripe Payments Europe Ltd.

- ID płatności Stripe: `<<pi_XXXXXXXXXXXX>>`
- Konto rozliczeniowe sprzedawcy: <<IBAN z LEGAL_DATA.md>>

## Adnotacje

1. Rachunek wystawiony na podstawie art. 87 § 1 Ordynacji podatkowej.
2. Działalność nieewidencjonowana - zwolnienie podmiotowe z VAT, nie obowiązuje KSeF.
3. Wykonanie usługi: dostarczenie linku do gotowej strony ślubnej (cyfrowa usługa).
4. Reklamacje: `kontakt@zaproszeniaonline.com`, termin 14 dni od dostarczenia
   (§ 9 Regulaminu - zaproszeniaonline.com/terms).
5. Konsument utracił prawo odstąpienia od umowy zgodnie z art. 38 pkt 3 ustawy o prawach
   konsumenta - usługa cyfrowa wykonana w pełni za jego wyraźną zgodą wyrażoną
   przy zamówieniu (checkbox „rozpoczęcie świadczenia przed 14 dniami").

---

**Sprzedawca:**

_________________________________
Nicolas Woroszyło
*(podpis nie jest wymagany dla rachunku elektronicznego - art. 87 § 4 Ord. pod.)*

---

## Wskazówki dla siebie (NIE pojawia się na rachunku klienta - usuń przed eksportem)

- Numer rachunku w roku: kolejny numer w `sprzedaz/2026-MM/`
- IBAN: podać tylko jeśli klient prosił o "skąd przyszedł przelew" - Stripe sam zarządza payout
- Jeśli klient B2B i prosi o NIP: dopisać "działalność nieewidencjonowana - brak NIP, podstawa: art. 5 ust. 1 Prawa Przedsiębiorców"
- W razie wątpliwości klienta typu „dlaczego to nie faktura VAT": odpowiedź jest w `terms.html` § 6
- **Przed eksportem PDF**: usuń sekcję „Wskazówki dla siebie" i wypełnij wszystkie `<<placeholder>>`
