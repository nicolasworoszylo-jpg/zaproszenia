# Prompty dla Claude in Chrome — pierwszy klient setup

> **Jak używać:** otwórz panel/URL, włącz Claude in Chrome (extension), wklej odpowiedni prompt do chatu Claude, kliknij Send. Claude w extension klika za Ciebie.

## ⚠️ Zasada bezpieczeństwa

Po wykonaniu każdego prompta Claude **pokaże screenshot** zamiast od razu klikać "Accept" / "Sign". **Zweryfikuj** treść dokumentu (czy nazwa firmy, dane, scope się zgadzają) → wtedy potwierdź "OK kliknij Accept". Nigdy nie autoryzuj "klikaj wszystko sam".

---

## 1️⃣ DPA Supabase

**Otwórz w Chrome:** https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/general

**Prompt do Claude in Chrome:**

```
Na tej stronie Supabase Dashboard znajdź sekcję "Compliance" lub zakładkę "Compliance"
(jeśli nie widzisz - sprawdź lewe menu w settings). Tam jest opcja "Data Processing
Agreement" / "Sign DPA" / "Accept Standard Contractual Clauses".

Twoje zadanie:
1. Znajdź sekcję DPA i zrób screenshot tego widoku
2. NIE klikaj "Sign" ani "Accept" jeszcze
3. Pokaż mi treść umowy (preview) lub zlokalizuj link do pełnego dokumentu PDF
4. Czekam na moje "OK kliknij Accept" przed wykonaniem akcji

Po mojej akceptacji:
5. Kliknij "Sign DPA" / "Accept"
6. Zrób screenshot strony potwierdzenia (z datą i statusem "Signed")
7. Zapisz screenshot jako "supabase-dpa-2026-MM-DD.png" (do pobrania)

Kontekst: jestem Nicolas Woroszyło, prowadzę działalność nieewidencjonowaną
zaproszeniaonline.com (bez NIP). Akceptuję DPA jako Administrator danych w rozumieniu
RODO art. 28. Supabase to procesor danych zgłoszeń (leads, rsvps) - region eu-west-1.
```

---

## 2️⃣ DPA Vercel

> ⚠️ **Zaktualizowane 2026-05-13** — wcześniejsza instrukcja "kliknij Accept w panelu" była błędna. Manualnie zweryfikowane: **taki przycisk nie istnieje**. Vercel DPA (sekcja 1 Introduction) stosuje się tylko do planów **Pro i Enterprise** — auto-binding przez akceptację Terms of Service, bez osobnego przycisku. Plan **Hobby** (na którym jest `zaproszenia-ddli`) **nie jest pokryty** przez Vercel DPA w ogóle.
>
> **Akcja w przeglądarce nie jest potrzebna.** Decyzja leży po stronie Nicolasa — patrz [`DECISION_VERCEL_DPA.md`](DECISION_VERCEL_DPA.md):
> - Opcja A: upgrade do Pro ($20/mc) → DPA auto-active → pobierz PDF z `vercel.com/legal/dpa` → archive w `legal-templates/dpa-signed/vercel-dpa-[data].pdf`
> - Opcje B/C/D — bez akcji DPA, inna ścieżka compliance

**Jeśli Nicolas wybierze Pro i potrzebny będzie zapis PDF DPA:**

```
Otwórz https://vercel.com/legal/dpa w Chrome. Zadanie:
1. Print → Save as PDF (Ctrl+P → Save as PDF → Destination)
2. Zapisz do Downloads jako vercel-dpa-2025-11-18.pdf (data z dokumentu)
3. Daj mi znać, przeniosę do legal-templates/dpa-signed/
```

---

## 3️⃣ DPA Stripe

**Otwórz w Chrome:** https://dashboard.stripe.com/settings/account

**Prompt do Claude in Chrome:**

```
Na ustawieniach Stripe Dashboard:
1. Przewiń stronę szukając sekcji "Data Processing Addendum" / "DPA" / "Compliance" /
   "Legal agreements"
2. Jeśli nie znajdziesz na tym URL - spróbuj: https://dashboard.stripe.com/account/legal
3. Powinien być link "View DPA" lub status czy DPA jest aktywne

Twoje zadanie:
- Sprawdź AKTUALNY status DPA - prawdopodobnie Stripe automatycznie aktywuje DPA przy
  zakładaniu konta (art. 28 GDPR) i wtedy widać tylko link do PDF
- Jeśli DPA jest aktywne automatycznie: zrób screenshot tego potwierdzenia
- Jeśli wymaga Accept: pokaż mi treść PRZED kliknięciem, czekaj na moje "OK"

Po akceptacji lub w przypadku auto-DPA:
- Pobierz lub zrób screenshot pełnego dokumentu DPA (PDF) - https://stripe.com/legal/dpa
- Zapisz "stripe-dpa-2026-MM-DD.png" lub "stripe-dpa-2026-MM-DD.pdf"

Kontekst: jestem Nicolas Woroszyło, użytkownik Stripe (account email zamowienia@zaproszeniaonline.com),
korzystam ze Stripe Payment Links do zaproszeniaonline.com (699 zł / zamówienie).
```

> ✅ **Status 2026-05-13:** Stripe DPA z 18 listopada 2025 zostało zarchiwizowane jako `legal-templates/dpa-signed/stripe-dpa-2025-11-18.pdf`. Auto-binding potwierdzone — żadnego przycisku w panelu nie ma, dokument działa od momentu założenia konta.

---

## 4️⃣ DPA Resend

> ⚠️ **Zaktualizowane 2026-05-13** — wcześniejsza instrukcja "kliknij Sign DPA" była błędna. Resend DPA (sekcja 12 Signatures) wprost mówi: *"This DPA becomes legally binding upon Customer's acceptance of the Agreement"* — **auto-binding, brak przycisku Sign w panelu**. Bonus: Resend ma certyfikację **EU-U.S. Data Privacy Framework** (sekcja 11) — dodatkowa podstawa transferu obok SCC.
>
> **Co jest w panelu zamiast Accept button:** Resend Dashboard udostępnia **executed version** DPA do pobrania (sekcja 12: *"The executed version of this DPA may be accessed by Customer through the Resend dashboard at any time following execution"*). To wystarczy jako dowód.

**Otwórz w Chrome (zalogowana):** https://resend.com/settings (szukaj sekcji Legal / Compliance / DPA)

**Co zrobić:**

```
1. Znajdź w panelu link "View executed DPA" / "Download DPA" / "DPA copy"
2. Pobierz PDF do Downloads (Resend serwuje go jako resend-dpa-signed.pdf lub podobnie)
3. Daj znać - ja przeniose do legal-templates/dpa-signed/resend-dpa-YYYY-MM-DD.pdf
   (data z dokumentu, nie z dnia pobrania)
```

> ✅ **Status 2026-05-13:** Resend DPA (data dokumentu 2025-12-31) zostało zarchiwizowane jako `legal-templates/dpa-signed/resend-dpa-2025-12-31.pdf` (executed version pobrana z dashboardu Resend).

---

## 5️⃣ Skrzynki email w OVH Manager

**Otwórz w Chrome:** https://www.ovh.com/manager (zaloguj się)

**Prompt do Claude in Chrome:**

```
W OVH Manager (https://www.ovh.com/manager):
1. W lewym menu wybierz "Web Cloud" → "Emails" lub "Email Pro"
2. Znajdź domenę "zaproszeniaonline.com" na liście
3. Wejdź w nią - powinieneś zobaczyć MX Plan / Email Pro / mailbox manager

Twoje zadanie (utworzenie 3 skrzynek):

A) Skrzynka "kontakt@zaproszeniaonline.com"
   - Klik "Create email account" / "Add account"
   - Account name: kontakt
   - Password: wygeneruj silne, ZAPISZ I POKAŻ MI
   - Quota: max dostępne (zwykle 5 GB w MX Plan)
   - Po utworzeniu: ustaw forwarding/redirect do nicolasworoszylo@gmail.com
     (W OVH: zakładka "Redirections" → Create → Source: kontakt@... → Target: nicolasworoszylo@gmail.com)

B) Powtórz dla "rodo@zaproszeniaonline.com" (z forwardem do tego samego Gmail)
C) Powtórz dla "faktury@zaproszeniaonline.com" (z forwardem)

Po każdej skrzynce zrób screenshot - chcę widzieć potwierdzenie utworzenia.

Test końcowy:
- Wyślij testowy email z innego konta (np. Twojego osobistego Gmail) na każdy z 3 adresów
- Sprawdź czy wpadł do nicolasworoszylo@gmail.com w ciągu 1-2 minut
- Pokaż mi screenshoty inboxu Gmail z 3 testowymi mailami

Kontekst: zaproszeniaonline.com ma MX rekordy OVH (mx1/2/3.mail.ovh.net),
domena jest na OVH DNS (dns200.anycast.me / ns200.anycast.me).
Powinien być aktywny MX Plan w pakiecie domeny.
```

---

## 6️⃣ Bonus: weryfikacja działania całego stacku po wszystkim

**Otwórz w Chrome:** https://zaproszeniaonline.com/

**Prompt do Claude in Chrome:**

```
Test pełnego flow RODO:

1. Otwórz https://zaproszeniaonline.com/ w trybie incognito
2. Banner cookies - sprawdź czy są **3 przyciski równorzędne**: "Odrzuć", "Tylko niezbędne",
   "Akceptuję wszystko". Wszystkie powinny mieć ten sam styl (border #2C3E2D, brak gradient).
3. Kliknij "Akceptuję wszystko" - banner powinien zniknąć z animacją
4. Otwórz DevTools (F12) → Application → Local Storage → "cookie_consent" - sprawdź wartość:
   powinno być JSON {"v":"all","t":<timestamp>,"ver":"2026-05-13"}
5. Wróć na stronę, znajdź formularz zamówienia (sekcja "Zamów"), sprawdź czy są
   **3 checkboxy zgód**: RODO (required), 14-day waiver (required), Marketing (opcjonalny)
6. Zjedź na sam dół - footer powinien linkować: Polityka prywatności, Cookies, Regulamin, Zwroty
7. Klik "Polityka prywatności" - otwiera się modal lub /privacy
8. Sprawdź czy jest **data "13 maja 2026"** i **sekcja 2.8** o wiadomościach transakcyjnych

Po wszystkim - zrób 1 screenshot pełnej strony + 1 screenshot otwartego DevTools Local Storage.

Jeśli któryś krok zwróci błąd lub niezgodność - pokaż mi to.
```

---

## Po wszystkim — commit screenshotów

Zapisz wszystkie screenshoty (5 DPA + 3 test maili + verification stack) do:

```
legal-templates/dpa-signed/
  supabase-dpa-YYYY-MM-DD.png
  vercel-dpa-YYYY-MM-DD.png
  stripe-dpa-YYYY-MM-DD.png
  resend-dpa-YYYY-MM-DD.png
legal-templates/email-setup/
  ovh-kontakt-created.png
  ovh-rodo-created.png
  ovh-faktury-created.png
  gmail-test-3-mails.png
legal-templates/verification/
  rodo-stack-test.png
  rodo-stack-localstorage.png
```

Commit:
```bash
git add legal-templates/
git commit -m "legal: DPA signed + email setup + RODO stack verified (YYYY-MM-DD)"
git push
```
