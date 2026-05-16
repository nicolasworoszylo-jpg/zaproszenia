# Prompt dla Claude in Chrome - pozostała robota OVH (2026-05-16)

> **Stan po weryfikacji live DNS 2026-05-16:**
> - DNS wszystko skonfigurowane (MX OVH, SPF, DMARC `p=none`, DKIM Resend, send subdomain) - ZROBIONE w `CLAUDE_IN_CHROME_MASTER.md`
> - **Pozostało:** 3 skrzynki email + audyt zone + opcjonalny DMARC ramp-up
>
> **Krytyczność:** DMARC raporty `rua/ruf=mailto:rodo@zaproszeniaonline.com` bouncują (brak skrzynki). `mailto:rodo@` w privacy.html też nie działa = RODO art. 13 violation przy pierwszym kliencie.

## Jak użyć

1. Zaloguj się WCZEŚNIEJ do https://www.ovh.com/manager/ (2FA SMS) - żeby Claude in Chrome nie musiał czekać na kod
2. Miej pod ręką prywatny Gmail (do testów) i `nicolasworoszylo@gmail.com` (jako target forwarding)
3. Otwórz Claude in Chrome extension, New chat, wklej blok poniżej (od `═══` do `═══`)
4. Claude po każdym kroku robi screenshot i pyta "Kontynuujemy?"

---

```
═══════════════════════════════════════════════════════════════════════════════
ZADANIE: Dokończenie konfiguracji OVH dla zaproszeniaonline.com
═══════════════════════════════════════════════════════════════════════════════

Wykonujesz 3 zadania w kolejności. Po każdym KRÓTKO raportujesz wynik
(screenshot + 2-3 linijki tekstu co zrobione), pytasz "Kontynuujemy?".

Domena: zaproszeniaonline.com
Panel: https://www.ovh.com/manager/

Stan WEJŚCIOWY (zweryfikowany 2026-05-16 przez dig live DNS - nie ruszaj!):
- MX: mx1/2/3.mail.ovh.net (priorities 1/5/100) - LIVE
- SPF root: v=spf1 include:mx.ovh.com -all - LIVE
- DMARC: v=DMARC1; p=none; rua=mailto:rodo@zaproszeniaonline.com; ruf=mailto:rodo@... - LIVE
- DKIM Resend (resend._domainkey) - LIVE
- send.zaproszeniaonline.com (SPF amazonses + MX feedback-smtp.eu-west-1.amazonses.com) - LIVE
- NS: ns200.anycast.me / dns200.anycast.me - LIVE

KRYTYCZNE - czego NIE rób:
- NIE usuwaj ani nie edytuj istniejących rekordów DNS (A, CNAME, MX, SPF, DMARC, DKIM)
- NIE klikaj "Reset zone"
- NIE loguj się przez "Sign in with Google" - tylko OVH NIC + 2FA SMS
- NIE zmieniaj SPF root - duplikat SPF = Gmail dropuje cały mail

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 1: Audit DNS Zone - screenshot stanu (~3 min)
═══════════════════════════════════════════════════════════════════════════════

1. Otwórz https://www.ovh.com/manager/ - zaloguj się (2FA SMS).
2. W lewym menu: Web Cloud > Domains > zaproszeniaonline.com > DNS Zone
3. Zrób PEŁEN screenshot tabeli rekordów (przewiń jeśli długa - może być
   konieczne kilka screenshotów żeby pokazać wszystko).
4. Z tabeli wypisz mi:
   a) Ile jest rekordów TXT zaczynających się od "v=spf1" dla root (@) -
      MUSI być dokładnie 1. Jeśli widzisz 2, alarmuj - nie ruszaj, czekaj
      na moje decyzje.
   b) Czy istnieje rekord TXT dla `_dmarc` (subdomena _dmarc).
   c) Czy istnieje rekord TXT dla `resend._domainkey` (DKIM Resend).
   d) Czy istnieją rekordy dla subdomeny `send` (SPF + MX).
   e) Czy MX root pokazuje mx1/mx2/mx3.mail.ovh.net.

Po raporcie pytaj "Kontynuujemy do utworzenia skrzynek?".

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 2: Utworzenie 3 skrzynek email + forwarding (~10 min)
═══════════════════════════════════════════════════════════════════════════════

Domena ma MX Plan w pakiecie domeny OVH. Trzeba utworzyć 3 konta i każde
ustawić na forward do nicolasworoszylo@gmail.com.

5. W OVH manager lewe menu: Web Cloud > Emails > zaproszeniaonline.com
   (LUB MX Plan / Email Pro - zależy jak OVH nazywa Twoją usługę)

6. Sprawdź czy widzisz panel managera skrzynek. Jeśli zamiast tego widzisz
   "Order MX Plan" - STOP, alarmuj, czekaj na moje decyzje (możliwe że MX
   Plan trzeba aktywować - to inna ścieżka).

7. Utwórz 3 skrzynki - dla KAŻDEJ wykonaj te same kroki:

   A) kontakt@zaproszeniaonline.com
      - Klik "Create email account" / "Add account" / "Nowe konto"
      - Account name (local part): kontakt
      - Password: wygeneruj silne (16+ znaków, mix case + cyfry + znaki),
        ZAPISZ I POKAŻ MI w raporcie (zapiszę do password managera)
      - Quota: max dostępne (zwykle 5 GB)
      - Display name: Kontakt zaproszeniaonline.com
      - Po utworzeniu screenshot potwierdzenia.

   B) rodo@zaproszeniaonline.com (KRYTYCZNE - tu lecą raporty DMARC i wnioski RODO)
      - Identycznie jak A, tylko local part: rodo
      - Display name: RODO zaproszeniaonline.com

   C) faktury@zaproszeniaonline.com
      - Identycznie, local part: faktury
      - Display name: Faktury zaproszeniaonline.com

8. Po utworzeniu wszystkich 3 - dla KAŻDEJ skrzynki ustaw forwarding:
   - Zakładka "Redirections" / "Forwards" / "Przekierowania" w tej samej domenie
   - Klik "Create redirection" / "Add"
   - Source: kontakt@zaproszeniaonline.com (potem rodo@, potem faktury@)
   - Target: nicolasworoszylo@gmail.com
   - Tryb: "Keep copy" / "Zachowaj kopię" = NIE (privacy - kopie nie zostają
     na serwerach OVH, tylko forward do Gmail)
   - Save / Zapisz

   Po każdym forwarder screenshot.

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 3: Test end-to-end (~5 min)
═══════════════════════════════════════════════════════════════════════════════

9. Wyślij 3 testowe maile z prywatnego konta Gmail (poproś mnie o wskazanie
   konta jeśli nie wiesz którego użyć):
   - do kontakt@zaproszeniaonline.com (subject: "test kontakt 2026-05-16")
   - do rodo@zaproszeniaonline.com (subject: "test rodo 2026-05-16")
   - do faktury@zaproszeniaonline.com (subject: "test faktury 2026-05-16")

10. Po 2-3 minutach otwórz https://mail.google.com (jeśli zalogowany na
    nicolasworoszylo@gmail.com) i sprawdź czy wszystkie 3 maile dotarły.

11. Screenshot inboxu Gmail z widocznymi 3 testowymi mailami (subjects +
    from + timestamp).

12. Final raport: lista 3 skrzynek + 3 forwardingi + dowód że 3 testy dotarły.

═══════════════════════════════════════════════════════════════════════════════
EXIT
═══════════════════════════════════════════════════════════════════════════════

Po skończeniu wszystkich 3 zadań - przekazujesz mi:
- Lista 3 haseł do skrzynek (zapiszę do password managera)
- Wszystkie screenshoty (DNS audit + create email x3 + forwards x3 + test x3)
- Lista nazw plików screenshotów żeby je zapisać do repo:
  legal-templates/email-setup/
    01-dns-audit-2026-05-16.png
    02-kontakt-created.png
    03-rodo-created.png
    04-faktury-created.png
    05-forwards-overview.png
    06-gmail-3-test-mails.png

NIE robisz commit do gita - ja zrobię z linii poleceń.
═══════════════════════════════════════════════════════════════════════════════
```

---

## Po skończeniu (Nicolas, manual)

```bash
cd ~/Projekty/zaproszeniaonline.com
mkdir -p legal-templates/email-setup
# wrzuć screenshoty od Claude do legal-templates/email-setup/
git add legal-templates/email-setup/
git commit -m "legal: 3 OVH email accounts + forwards (kontakt, rodo, faktury) - 2026-05-16"
git push
```

Hasła do skrzynek - zapisz w password managerze (1Password / Bitwarden), NIE commituj do repo.

## Co dalej (opcjonalne hardening - po 2-4 tygodniach)

Po ~2-4 tygodniach skrzynka `rodo@` zbiera raporty DMARC. Sprawdź czy są
clean (no failures). Jeśli tak - można podnieść z `p=none` na `p=quarantine`:

```
_dmarc TXT: v=DMARC1; p=quarantine; pct=10; rua=mailto:rodo@zaproszeniaonline.com; ruf=mailto:rodo@zaproszeniaonline.com; adkim=r; aspf=r; fo=1
```

Potem stopniowo `pct=10` -> `pct=50` -> `pct=100`, na końcu `p=reject`.
Ale to FUTURE step, nie blocker pierwszego klienta.
