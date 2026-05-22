# Dane prawne - zaproszeniaonline.com

<!-- ANTI-CORRUPTION-GOLDEN: Single source of truth dla danych biznesowych (NIP/REGON/IBAN/adres/kontakt).
     DO NOT REMOVE statusu "DZIAŁALNOŚĆ NIEEWIDENCJONOWANA" + podstawy prawnej (art. 5 ust. 1 Prawo przedsiębiorców 2018 poz. 646).
     LEGAL gate: ten plik egzekwowany lint scriptem (scripts/lint-business-data.sh - TODO faza 3.4).
     Każda zmiana wymaga sync z privacy.html (admin data), terms.html, returns.html. -->

> ⚠️ TO JEDYNE MIEJSCE GDZIE TRZYMAMY DANE BIZNESOWE. Po edycji `git commit && push`.

## Status: DZIAŁALNOŚĆ NIEEWIDENCJONOWANA

**Decyzja biznesowa (2026-05-07):** rozpoczynamy bez rejestracji działalności gospodarczej, w trybie **działalności nieewidencjonowanej** (art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. - Prawo przedsiębiorców, Dz.U. 2018 poz. 646).

### Co to znaczy

- **Bez NIP, bez REGON, bez wpisu do CEIDG** - Nicolas nie jest wpisany jako przedsiębiorca
- **Bez ZUS** - żadnych składek społecznych ani zdrowotnych z tej działalności
- **Bez VAT** - sprzedaż nie jest opodatkowana VAT, nie wystawiamy faktur VAT
- **Rachunki zamiast faktur** - klient otrzymuje rachunek (na żądanie) zgodnie z art. 87 § 1 Ordynacji podatkowej
- **PIT na koniec roku** - od dochodu (przychód minus koszty) na zasadach ogólnych w PIT-36

### Limit miesięczny

Sprzedaż w danym miesiącu **NIE MOŻE PRZEKROCZYĆ 50% kwoty minimalnego wynagrodzenia za pracę** (na 2026: 6 999 zł brutto × 50% = **3 499,50 zł brutto miesięcznie**).

W praktyce: ~5 sprzedaży po 699 zł = 3 495 zł (mieści się). 6. sprzedaż w tym samym miesiącu **automatycznie powoduje obowiązek rejestracji** działalności gospodarczej w terminie 7 dni od dnia przekroczenia.

### Kalkulator miesiąca

| Sprzedaży × 699 zł | Suma | Status |
|---|---|---|
| 1× | 699 zł | ✅ |
| 2× | 1 398 zł | ✅ |
| 3× | 2 097 zł | ✅ |
| 4× | 2 796 zł | ✅ |
| 5× | 3 495 zł | ✅ (4,50 zł zapasu) |
| 6× | 4 194 zł | ❌ PRZEKROCZONE → JDG w 7 dni |

### Plan eskalacji (gdy przekroczymy)

1. **Dzień 0** - wpłynęła 6. wpłata w danym miesiącu
2. **Dzień 1** - Nicolas rejestruje JDG przez ceidg.gov.pl (PKD 73.11.Z - działalność reklamowo-marketingowa LUB 62.01.Z - programowanie)
3. **Dzień 1-7** - rejestracja w US (formularz VAT-R: zwolnienie podmiotowe art. 113 do 200 tys. zł rocznie)
4. **Dzień 7** - rozpoczęcie wystawiania faktur (sprzed. zwolniona z VAT) zamiast rachunków

---

## Dane Administratora

### Nicolas Woroszyło (Administrator)

- Imię i nazwisko: **Nicolas Woroszyło**
- Status: **działalność nieewidencjonowana** (bez NIP, bez REGON)
- Adres do korespondencji: kontakt elektroniczny - kontakt@zaproszeniaonline.com
- E-maile robocze:
  - Główny: `nicolasworoszylo@gmail.com`
  - Marka (jedyny publiczny adres): `kontakt@zaproszeniaonline.com` (forward → Nicolas + Dominika) - obsługuje wszystkie sprawy: RODO, faktury, Notice & Takedown, reklamacje
  - Legacy inbound (nie pokazywane w UI od 2026-05-16): `rodo@`, `faktury@`, `zamowienia@` - aktywne forwardery dla DMARC raportów i starych maili od klientów

### Dominika Kuś (osoba upoważniona, art. 29 RODO)

- Imię i nazwisko: **Dominika Kuś**
- Rola: **osoba upoważniona do przetwarzania danych** (NIE współadministrator)
- Działa wyłącznie w zakresie wskazanym przez Administratora
- E-mail: `dominikakus333@gmail.com`

---

## Konto bankowe (do rachunków)

> Stripe wpłaca środki na konto powiązane ze Stripe Account. Nicolas może dodać polskie konto osobiste w Stripe Dashboard → Bank Account.

- IBAN: `[DO UZUPEŁNIENIA - konto osobiste Nicolas]`
- Nazwa odbiorcy: `Nicolas Woroszyło`
- Bank: `[bank Nicolas]`

W przypadku rachunków: standardowy rachunek wystawiany na podstawie [art. 87 § 1 Ordynacji podatkowej](https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19971370926) - zawiera dane sprzedawcy, nabywcy, opis usługi, kwotę, datę.

---

## Stripe

- Link do Payment Linka (live): `https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01`
- Stripe account email: `zamowienia@zaproszeniaonline.com`
- Stripe Tax: **NIE WŁĄCZAĆ** automatic tax (nie jesteśmy VAT-owcami)
- Stripe statement descriptor: `ZAPROSZENIA`

---

## Vercel + Supabase

- Vercel project: `zaproszenia-ddli` (`prj_0uMw2SNx6v5F0OQbgrCp1gKgug5F`)
- Vercel account email: `nicolasworoszylo@gmail.com`
- Supabase project: `kuyniyyieejvambyjnxy` (Frankfurt eu-central-1)

---

## Pliki gdzie informacja o statusie prawnym jest używana

- `privacy.html` - § 1 Administrator danych osobowych ✅ (Nicolas + Dominika art. 29)
- `terms.html` - § 1 Definicje (Usługodawca = Nicolas dział. nieewidencjonowana) ✅
- `terms.html` - § 6 Płatności (rachunek + limit miesięczny) ✅
- `index.html` - pricing card "Rachunek" zamiast "Faktura VAT" ⏳ TODO
- `STRIPE_INSTRUKCJA.md` - Tax behavior + statement descriptor ✅
- `returns.html` - § Zwroty (procedura odstąpienia od umowy)

---

## Status uzupełnień

| Pole | Status | Notatka |
|---|---|---|
| Forma działalności | ✅ | Nieewidencjonowana, art. 5 ust. 1 PrzedsU |
| Limit miesięczny | ✅ | 3 499,50 zł brutto (50% min wynagrodzenia 2026) |
| NIP / REGON | ❌ N/A | Nie potrzebne dla nieewidencjonowanej |
| IBAN | ⏳ | Wpisać konto osobiste Nicolas |
| Adres do korespondencji | ✅ | Email kontaktowy wystarczy dla nieewidencjonowanej |
| Status VAT | ✅ | Nie jest podatnikiem VAT (działalność nieewidencjonowana) |
| KSeF | ❌ N/A | Działalność nieewidencjonowana zwolniona z KSeF |

---

## Eskalacja gdy zarobimy więcej

Przy ~5 sprzedaży/mc i 12 mc roczna sprzedaż = ~42 tys. zł brutto. Daleko od progu VAT (200 tys. zł). Plan:

1. **Faza 1: Działalność nieewidencjonowana (0-3 mc, walidacja rynku)** - obecna faza
2. **Faza 2: JDG zwolniona z VAT (3-12 mc, scaling)** - gdy konsystentnie >3 sprzedaże/mc
3. **Faza 3: JDG VAT-owiec (12+ mc, dojrzała firma)** - gdy >200 tys. zł rocznie

W każdej fazie aktualizujemy `terms.html`, `privacy.html`, oraz wystawiamy odpowiedni dokument księgowy:
- Faza 1: rachunek (bez VAT)
- Faza 2: faktura zwolniona (art. 113 - bez VAT na fakturze, "ZW" w polu VAT)
- Faza 3: faktura VAT (z VAT 23%, KSeF wymagany)

---

## Co zrobić po pierwszej sprzedaży

1. Sprawdź `payment_status='paid'` w Supabase
2. Wystaw rachunek dla klienta (mogę przygotować szablon w `/templates/rachunek.html`)
3. Zapisz w `~/Desktop/Claude/Zaproszeniaonline/sprzedaz/2026-MM/` markdown z:
   - Data wpłaty
   - Klient (imię, e-mail, nazwa)
   - Kwota
   - Numer rachunku (R-2026-001, R-2026-002, ...)
4. Pod koniec roku zsumuj wszystkie sprzedaże → PIT-36 (kolumna 7: dochód z innych źródeł)
