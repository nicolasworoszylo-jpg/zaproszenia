# Prompt do Claude in Chrome - Gmail "Send mail as kontakt@zaproszeniaonline.com" przez Resend SMTP

> Cel: skonfigurować Gmail żebyś mógł wysyłać maile z `kontakt@zaproszeniaonline.com` (z dropdownu "From:" w okienku Compose), zamiast tylko z `nicolasworoszylo@gmail.com`. $0, ~7 minut, jednorazowa akcja.

## Dlaczego Resend SMTP a nie OVH SMTP

OVH MX Plan dla zaproszeniaonline.com to wariant "redirect-only" (0 slotów na skrzynki). Bez prawdziwej skrzynki nie ma standardowego SMTP. Resend ma:
- Domain `zaproszeniaonline.com` już zweryfikowany (DKIM aktywny) — sprawdzone 2026-05-13
- Notify-payment-success + notify-new-lead już go używają jako Bearer API
- Resend obsługuje **klasyczny SMTP relay** na tej samej domenie z tym samym kluczem
- 100 maili/dzień + 3000/mc w free tier — wystarczy dla manualnej obsługi klientów

## Przygotowanie (manual, 2 min)

1. Zaloguj się wcześniej do:
   - `https://mail.google.com` (Gmail Nicolas)
   - `https://resend.com/api-keys` (jeśli masz konto Resend — jeśli nie, zaloguj się przez "Sign in with GitHub" lub "Sign in with email" używając konta którym założyłeś Resend)
2. Otwórz Claude in Chrome → New chat
3. Wklej blok poniżej (od `═══` do `═══`)

---

```
═══════════════════════════════════════════════════════════════════════════════
ZADANIE: Gmail Send mail as kontakt@zaproszeniaonline.com przez Resend SMTP
═══════════════════════════════════════════════════════════════════════════════

Po każdym kroku raportuj (screenshot + 2 linijki) i pytaj "Kontynuujemy?".

Domena: zaproszeniaonline.com (Resend domain verified)
Gmail: nicolasworoszylo@gmail.com (Nicolas)

KRYTYCZNE - czego NIE rób:
- NIE usuwaj żadnego istniejącego API key w Resend (są używane przez edge functions)
- NIE zmieniaj domeny w Resend
- NIE klikaj "Delete" przy żadnym istniejącym keyu
- NIE wyłączaj 2FA / nie zmieniaj password w Gmail

═══════════════════════════════════════════════════════════════════════════════
KROK 1: Pobranie klucza Resend (3 min)
═══════════════════════════════════════════════════════════════════════════════

1. Otwórz https://resend.com/api-keys
2. Powinieneś widzieć listę istniejących kluczy (np. używanych przez Supabase
   edge functions). KAŻDY KLUCZ JEST POKAZANY TYLKO RAZ przy utworzeniu - 
   nie da się ponownie zobaczyć starego klucza.

OPCJA A (preferowana - utwórz nowy klucz dedykowany dla Gmail SMTP):
1. Klik "Create API Key" (prawy górny róg)
2. Wypełnij:
   - Name: "Gmail Send Mail As - kontakt@"
   - Permission: "Sending access" (NIE "Full access" - principle of least privilege)
   - Domain: "zaproszeniaonline.com" (jeśli dropdown jest dostępny - 
     jeśli nie, zostaw default)
3. Klik "Add"
4. WAŻNE: Resend pokazuje klucz TYLKO RAZ. Skopiuj cały klucz (zaczyna się 
   od "re_") i POKAŻ MI go w raporcie (zapiszę do password managera + użyję 
   w Gmailu w KROKU 2).
5. Screenshot listy kluczy (z nowym kluczem na liście, nie pokazującym 
   pełnej wartości).

JEŚLI Resend pokazuje błąd "Domain not verified" lub "Free tier limit":
   STOP, alarmuj, czekaj na moje decyzje. Domena POWINNA być verified 
   (sprawdzone 2026-05-13).

═══════════════════════════════════════════════════════════════════════════════
KROK 2: Konfiguracja Send mail as w Gmail (4 min)
═══════════════════════════════════════════════════════════════════════════════

1. Otwórz https://mail.google.com (zaloguj się na nicolasworoszylo@gmail.com)
2. Klik na ⚙️ (settings gear, prawy górny róg) > "See all settings"
3. Przejdź do zakładki "Accounts and Import" (lub "Konta i import" jeśli 
   Gmail po polsku)
4. Znajdź sekcję "Send mail as" / "Wyślij wiadomość jako"
5. Klik link "Add another email address" / "Dodaj inny adres e-mail"

6. W pierwszym okienku pop-up wypełnij:
   - Name: "Zaproszenia Online"
   - Email address: "kontakt@zaproszeniaonline.com"
   - Checkbox "Treat as an alias" / "Traktuj jako alias": ODZNACZ 
     (nie chcemy żeby Gmail traktował to jako alias - chcemy separate identity)
   - Klik "Next Step" / "Następny krok"

7. W drugim okienku wypełnij SMTP server:
   - SMTP Server: smtp.resend.com
   - Port: 587
   - Username: resend
   - Password: [WKLEJ TUTAJ klucz z KROKU 1, zaczynający się od re_]
   - Security: "Secured connection using TLS" (lub "Połączenie zabezpieczone 
     przy użyciu TLS") - dropdown wybór
   - NIE klikaj "Secured connection using SSL" (port 465 inny)
   - Klik "Add Account" / "Dodaj konto"

8. Gmail teraz wyśle weryfikacyjny mail z linkiem + 9-cyfrowym kodem na 
   kontakt@zaproszeniaonline.com. Forwarder dostarczy go do inboxu 
   nicolasworoszylo@gmail.com w ciągu ~30 sekund.

9. Wróć do https://mail.google.com Inbox. Czekaj 30-60 sek na nowy mail 
   od "Gmail Team" z subject "Gmail Confirmation - Send Mail as ..." lub 
   po polsku "Potwierdzenie Gmail - Wyślij wiadomość jako ...".

10. Otwórz mail. Znajdź:
    - 9-cyfrowy kod weryfikacyjny (np. "123456789"), LUB
    - przycisk "Confirm the request" (link weryfikacyjny)

11. Zalecane: KOPIUJ KOD (9 cyfr) i wklej w okienku które wciąż jest otwarte 
    z poprzedniego kroku (powinno mieć pole "Enter and verify the 
    confirmation code"). Jeśli okienko zamknięte - klik link w mailu, 
    otworzy się potwierdzenie w nowej karcie.

12. Klik "Verify" / "Zweryfikuj".

13. Screenshot strony z potwierdzeniem "Verification successful" 
    (lub po polsku "Weryfikacja pomyślna").

═══════════════════════════════════════════════════════════════════════════════
KROK 3: Test wysyłki z kontakt@ (2 min)
═══════════════════════════════════════════════════════════════════════════════

1. W Gmail klik "Compose" (nowa wiadomość)
2. W polu "From:" powinien być teraz dropdown z 2 opcjami:
   - nicolasworoszylo@gmail.com (default)
   - Zaproszenia Online <kontakt@zaproszeniaonline.com> (nowy)
3. Wybierz "Zaproszenia Online <kontakt@zaproszeniaonline.com>"
4. To: nicolasworoszylo@gmail.com (sam do siebie, dla testu)
5. Subject: "Test Send mail as kontakt@ - 2026-05-16"
6. Body: "Cześć, to test wysyłki z kontakt@zaproszeniaonline.com przez 
   Resend SMTP relay. Jeśli widzisz tę wiadomość w inboxie z 
   From: kontakt@zaproszeniaonline.com - konfiguracja działa."
7. Klik "Send"

8. Wróć do Inbox, czekaj ~5 sekund. Powinien przyjść mail z 
   "Zaproszenia Online <kontakt@zaproszeniaonline.com>".

9. Otwórz mail. Sprawdź:
   - From: pokazuje kontakt@zaproszeniaonline.com (NIE 
     nicolasworoszylo@gmail.com)
   - Reply-To: kontakt@zaproszeniaonline.com (automatic)
   - Treść: identyczna z tym co napisałeś
   - Headers (3-dot menu > Show original): powinien pokazać "Return-Path: 
     <bounces+xxx@send.resend.com>" lub podobne (Resend infrastructure)

10. Screenshot maila + screenshot dropdownu "From:" w nowym Compose 
    (pokazującym 2 opcje).

═══════════════════════════════════════════════════════════════════════════════
EXIT - raport końcowy
═══════════════════════════════════════════════════════════════════════════════

Przekaż mi:
- Klucz Resend z KROKU 1 (pełen, zaczynający się od re_) - skopiuję do 
  password managera, plik ~/.claude/secrets/resend-api-key.txt
- Screenshot listy kluczy w Resend (z nowym kluczem)
- Screenshot maila weryfikacyjnego od Gmail (z 9-cyfrowym kodem)
- Screenshot strony "Verification successful"
- Screenshot testowego maila wysłanego z kontakt@ + screenshot dropdownu 
  "From:" w Compose

Lista nazw screenshotów:
  legal-templates/gmail-setup/
    01-resend-new-key.png
    02-gmail-verify-email.png
    03-gmail-verification-success.png
    04-gmail-from-dropdown.png
    05-test-mail-from-kontakt.png

NIE rób commit do gita - ja zrobię z terminala.

OPCJONALNIE (jeśli zostało czasu): powtórz całość dla 2 dodatkowych 
identyfikatorów From, używając tego samego klucza Resend:
  - rodo@zaproszeniaonline.com (z Name: "Zaproszenia Online - RODO")
  - faktury@zaproszeniaonline.com (z Name: "Zaproszenia Online - Faktury")
Każde wymaga osobnego cyklu weryfikacji (kod z forwardera).

═══════════════════════════════════════════════════════════════════════════════
```

---

## Po skończeniu (Nicolas, manual, 2 min)

```bash
cd ~/Projekty/zaproszeniaonline.com

# 1. Zapisz klucz Resend do password managera (1Password / Apple Keychain / Bitwarden)

# 2. Zapisz klucz do lokalnego pliku secrets (chmod 600 - tylko dla Ciebie)
mkdir -p ~/.claude/secrets
echo "re_TWÓJ_KLUCZ_TUTAJ" > ~/.claude/secrets/resend-api-key.txt
chmod 600 ~/.claude/secrets/resend-api-key.txt

# 3. Zapisz screenshoty
mkdir -p legal-templates/gmail-setup
# Drag & drop 5 screenshotów z Downloads do tego folderu

# 4. Commit + push
git add legal-templates/gmail-setup/
git commit -m "docs(gmail): potwierdzenie Send mail as kontakt@ przez Resend SMTP"
git push
```

---

## Co dzięki temu zyskujesz

- Klient pisze na `kontakt@zaproszeniaonline.com` → forwarder → Twój Gmail
- Klikasz "Reply" w Gmailu → Gmail automatycznie wybiera "From: kontakt@zaproszeniaonline.com" (bo to oryginalny adres odbiorcy)
- Klient otrzymuje odpowiedź **z dedykowanego adresu marki**, nie z `nicolasworoszylo@gmail.com`
- Spójność wizualna 100%, koszt 0 zł/mc (Resend free tier: 100/dzień, 3000/mc)
- Edge function notify-payment-success i notify-new-lead nadal działają niezmienione (osobny API key)

## Fallback gdy coś nie wyjdzie

| Problem | Diagnoza | Fix |
|---|---|---|
| Gmail: "Could not authenticate" | Zły klucz / zła SMTP konfiguracja | Sprawdź klucz Resend (re_xxx), port 587 (NIE 465), TLS (NIE SSL), username "resend" (małe litery) |
| Brak weryfikacyjnego maila w inboxie >2 min | Forwarder OVH nie działa lub spam | Sprawdź folder Spam w Gmail; sprawdź czy forwarder kontakt@ → Nicolas istnieje w OVH panel |
| Resend: "Domain not verified" | DKIM/SPF nie aktywne | Sprawdź `dig zaproszeniaonline.com TXT` - powinien zwrócić DKIM Resend record. Jeśli brak - re-verify domain w Resend Dashboard |
| Resend: "API key limit reached" | Free tier exhausted (100/dzień, 3000/mc) | Sprawdź usage w Resend Dashboard. Free tier wystarczy dla manualnych odpowiedzi (max 10-20/dzień). Edge functions używają osobnego klucza |
| Gmail: "Send mail as: pending" po >5 min | Weryfikacja w trakcie | Wyślij ponownie weryfikacyjny mail z Settings > Accounts and Import > Send mail as > [Add] |

Po wykonaniu = **wszystko 100% live, pakiet prawny + UX odpowiedzi mailowych zamknięty**.
