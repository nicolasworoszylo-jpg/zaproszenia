# Checklist: pierwszy klient — co zrobić ZANIM przyjmiesz pierwszą wpłatę

> **Trigger:** otworzyć ten plik kiedy zobaczysz `payment_status='paid'` na pierwszym leadzie w Supabase, ALBO kiedy dostaniesz wstępne potwierdzenie zamówienia mailem.
>
> **Czas:** ~30 minut wszystko klikalne (DPA × 4) + ~15 minut setup skrzynek + ~5 minut wpisanie IBAN.
>
> **Tu w repo:** `CLAUDE_IN_CHROME_PROMPTS.md` ma gotowe prompty dla Claude-in-Chrome żeby zrobił to za Ciebie.

## 🔴 BLOKERY (PRZED przyjęciem wpłaty)

### 1. ☐ Zaakceptuj DPA u 4 procesorów (~15 min razem)

Bez DPA każde powierzenie danych = art. 28 RODO violation = ryzyko skargi PUODO.

| Procesor | Link | Co robisz | Dowód |
|----------|------|-----------|-------|
| Supabase | https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/general | Tab Compliance → Sign DPA | Screenshot → `legal-templates/dpa-signed/supabase-YYYY-MM-DD.png` |
| Vercel | https://vercel.com/account/teams → Team Settings → Security & Privacy | Klik "Accept DPA" | Screenshot → `legal-templates/dpa-signed/vercel-YYYY-MM-DD.png` |
| Stripe | https://dashboard.stripe.com/settings/account | Sekcja "Data Processing Addendum" | Screenshot → `legal-templates/dpa-signed/stripe-YYYY-MM-DD.png` |
| Resend | https://resend.com/settings | Tab Legal/DPA | Screenshot → `legal-templates/dpa-signed/resend-YYYY-MM-DD.png` |

Po wszystkich 4 screenshotach commit:
```bash
git add legal-templates/dpa-signed/
git commit -m "legal: DPA signed - Supabase + Vercel + Stripe + Resend (YYYY-MM-DD)"
```

### 2. ✅ Skrzynki email w OVH (zweryfikowane 2026-05-16)

OVH MX Plan ma 8 forwarderów (4 aliasy × 2 osoby Nicolas+Dominika). **Publicznie używamy tylko `kontakt@`** (decyzja 2026-05-16) - pozostałe (rodo@, faktury@, zamowienia@) zostają jako legacy inbound dla DMARC raportów i starych maili.

| Alias | Status | Użycie |
|---|---|---|
| `kontakt@zaproszeniaonline.com` | ✅ aktywny | jedyny publiczny adres - klienci, RODO, faktury, N&T, reklamacje |
| `rodo@zaproszeniaonline.com` | ✅ legacy inbound | tylko DMARC raporty (rua=mailto:rodo@... w DNS) |
| `faktury@zaproszeniaonline.com` | ✅ legacy inbound | stare maile od klientów (przed 2026-05-16) |
| `zamowienia@zaproszeniaonline.com` | ✅ legacy inbound | stare maile (mail post-payment używał tego adresu) |

Test E2E: `bash` `dig MX zaproszeniaonline.com @1.1.1.1` zwraca live MX OVH. Test inboxu zweryfikowany przez Claude in Chrome (screenshot legal-templates/email-setup/).

### 3. ☐ Wpisz IBAN do `LEGAL_DATA.md` (~2 min)

Otwórz `LEGAL_DATA.md`, sekcja "Konto bankowe (do rachunków)" — wpisz numer konta osobistego (do Stripe payout + na rachunkach klientom).

```bash
# Otwórz w edytorze
code LEGAL_DATA.md  # lub: nano, vim
# Podmień: IBAN: [DO UZUPEŁNIENIA - konto osobiste Nicolas]
# Na:      IBAN: PL00 1234 5678 9012 3456 7890 1234
git add LEGAL_DATA.md
git commit -m "legal: dodaj IBAN do payout Stripe"
```

### 4. ☐ Sprawdź w Supabase czy lead ma wszystkie consent fields

Po wpłacie pierwszego klienta — w Supabase Studio:

```sql
select id, name, email, payment_status,
       consent_rodo_at, consent_immediate_at,
       consent_marketing, consent_marketing_at, consent_version
from public.leads
where payment_status = 'paid'
order by paid_at desc limit 5;
```

Spodziewane: wszystkie `consent_*` pola wypełnione (poza `consent_marketing_at` które jest NULL gdy klient nie wyraził zgody marketingowej).

Jeśli któreś NULL przy `consent_marketing=true` — bug, do zgłoszenia.

## 🟡 WAŻNE (W CIĄGU TYGODNIA OD PIERWSZEJ SPRZEDAŻY)

### 5. ☐ Wystaw rachunek dla klienta (działalność nieewidencjonowana — bez VAT)

Szablon: `legal-templates/rachunek-template.md` (jeśli istnieje, jeśli nie — utwórz).

Format pliku: `sprzedaz/2026-MM/R-2026-001-IMIE_NAZWISKO.pdf`

Numeracja: `R-2026-001`, `R-2026-002`, ...

Zawiera (art. 87 § 1 Ordynacji podatkowej):
- Dane sprzedawcy: Nicolas Woroszyło, brak NIP (działalność nieewidencjonowana art. 5 ust. 1 Pr.Pp.)
- Dane nabywcy: imię, nazwisko, adres (z formularza Stripe)
- Opis usługi: "Cyfrowe zaproszenie ślubne — strona internetowa z formularzem RSVP"
- Kwota: 699 zł (brutto, **bez VAT** — działalność nieewidencjonowana)
- Data sprzedaży: data wpłaty Stripe
- Numer rachunku: R-2026-NNN

### 6. ☐ Aktualizuj RCP po pierwszym kliencie

Otwórz `RCP_metadata.md` + `RCP_template.csv`. Sprawdź:
- Czy procesy nadal odpowiadają rzeczywistości (kolejność operacji)
- Czy nie pojawił się nowy procesor (np. biuro rachunkowe — wpisz dane)
- Czy retention nadal aktualny (5 lat od końca roku podatkowego)

### 7. ☐ Sprawdź licznik sprzedaży w miesiącu (limit działalności nieewidencjonowanej)

**LIMIT 2026:** 3 499,50 zł brutto miesięcznie (50% min wynagrodzenia 6 999 zł × 50%).

Przy 6. sprzedaży po 699 zł = 4 194 zł → **PRZEKROCZENIE → JDG w 7 dni** (CEIDG).

Trzymaj rejestr w `sprzedaz/2026-MM/.miesiac-suma.txt` (lub w arkuszu Excel/Sheets).

## 🟢 UZUPEŁNIAJĄCE (KIEDY BĘDZIE CZAS)

### 8. ☐ Rejestr Czynności Przetwarzania (RCP) — kompletny audyt

Mała firma jest zwolniona z RCP TYLKO gdy **nie** przetwarza danych szczególnych kategorii (art. 9 RODO). Demo zbiera **alergie pokarmowe** = dane o zdrowiu = **RCP obowiązkowy** niezależnie od skali.

Otwórz `RCP_template.csv` + `RCP_metadata.md`, przejrzyj 8 procesów, zapisz jako `RCP_zaproszeniaonline_2026.xlsx` (nie publikuj, dokument wewnętrzny).

Wzór: https://uodo.gov.pl/pl/138/3175

### 9. ☐ Jeśli klient wyraził zgodę portfolio — udokumentuj

Jeśli planujesz pokazać tę stronę na portfolio: zdobądź osobną zgodę (mailowo lub formalnym mailem). Wzór tekstu:

> Wyrażam zgodę na publikację mojej strony ślubnej (URL: zaproszeniaonline.com/ana-michal) w portfolio Vidok Studio oraz w materiałach promocyjnych marki zaproszeniaonline.com, w tym w mediach społecznościowych (Instagram, Facebook, TikTok). Mogę wycofać zgodę w dowolnym momencie pisząc na kontakt@zaproszeniaonline.com.

Klient odpowiada "Wyrażam zgodę" → zapisujesz mail jako PDF do `legal-templates/portfolio-consents/<imie-nazwisko>-YYYY-MM-DD.pdf`.

### 10. ☐ Pierwsze faktury — kontrola księgowa

Po końcu miesiąca: suma wpłat ze Stripe (Dashboard → Reports → Balance) musi się zgadzać z rachunkami wystawionymi w `sprzedaz/2026-MM/`. Różnica = nieprawidłowa numeracja albo nieujęty rachunek.

---

## Co robi automat (już skonfigurowane)

- ✅ Email transakcyjne (Resend): potwierdzenie zapytania, potwierdzenie wpłaty, link do strony, status (4 maile per zamówienie)
- ✅ Privacy policy / Cookies / Terms / Returns — live, RODO-compliant
- ✅ Lead form: rejestr zgód (consent_rodo_at, consent_immediate_at, consent_marketing_at, consent_version) zapisuje się do Supabase
- ✅ Cookie banner: 3 przyciski (Odrzuć / Niezbędne / Akceptuję) + TTL 12 mc + content_version
- ✅ CSP header w odpowiedzi (Stripe + Supabase whitelist)
- ✅ Self-hosted fonts (zero transferu IP do Google)
- ✅ Stripe Tax: WYŁĄCZONY (nie jesteśmy VAT-owcami)
- ✅ Stripe statement descriptor: ZAPROSZENIA
- ✅ Region Supabase: eu-west-1 (Irlandia)
- ✅ DPA SCC: deklarowane w privacy.html dla wszystkich 4 procesorów

## Eskalacja: gdy zarobimy więcej

| Faza | Kiedy | Akcja |
|------|-------|-------|
| Nieewidencjonowana | 0-3 sprzedaży/mc | Stan obecny |
| JDG zwolniona z VAT | przekroczenie 3 499,50/mc | CEIDG w 7 dni, VAT-R art. 113 (zwolnienie do 200k zł rocznie) |
| JDG VAT-owiec | >200 000 zł / rok | Faktura VAT 23%, KSeF obowiązkowy |

Każda faza: update `terms.html`, `privacy.html`, `LEGAL_DATA.md`.
