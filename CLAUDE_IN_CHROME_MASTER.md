# Master prompt dla Claude in Chrome — wszystkie operacje DNS + signup w jednym fluencie

**Czas total:** ~25 min (sam siedzisz przy komputerze, odpowiadasz na 2FA SMS, reszta robi Claude)

---

## Jak to wykonać

1. Otwórz Claude in Chrome (extension w pasku, ikona w prawym górnym rogu Chrome)
2. Kliknij **New chat**
3. Skopiuj CAŁĄ poniższą sekcję (od `═══` do `═══`) i wklej do Claude in Chrome
4. Odpowiadaj na 2FA prompts gdy Claude poprosi (OVH wymaga SMS, Google wymaga authenticator)
5. Po każdym kroku Claude zapyta "Kontynuować?" — odpowiedź "tak"

---

```
═══════════════════════════════════════════════════════════════════════════════
ZADANIE: Konfiguracja DNS + zewnętrznych usług dla zaproszeniaonline.com
═══════════════════════════════════════════════════════════════════════════════

Wykonujesz 4 zadania w kolejności. Po każdym zadaniu KRÓTKO raportujesz wynik
(jakie pole ustawione, gdzie, jaki status), potem pytasz "Kontynuujemy?" zanim
przejdziesz do następnego.

Domena: zaproszeniaonline.com
Registrar: OVH
DNS Editor: https://www.ovh.com/manager/ → Web Cloud → Domains → zaproszeniaonline.com → DNS zone

KRYTYCZNE — czego NIE rób:
- NIE usuwaj rekordów A, CNAME, MX (są live, Vercel / OVH email)
- NIE zmieniaj istniejącego SPF (jest poprawny: v=spf1 include:mx.ovh.com -all)
- NIE klikaj "Reset zone" — to zniszczy całą konfigurację
- NIE loguj się przez "Sign in with Google" do OVH — używaj loginu OVH NIC
- NIE potwierdzaj akcji bez 2FA SMS z mojego telefonu

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 1: DMARC w OVH DNS Zone (~5 min)
═══════════════════════════════════════════════════════════════════════════════

Cel: dodać rekord DMARC żeby Gmail/Outlook nie klasyfikował naszych maili (gdy
Resend zacznie wysyłać) jako spam. Tryb "monitoring" — bezpieczny start.

Kroki:
1. Otwórz https://www.ovh.com/manager/ — zaloguj się (poprosi o 2FA SMS, czekaj)
2. Web Cloud → Domains → zaproszeniaonline.com → DNS zone (zakładka)
3. W tabeli rekordów wyszukaj: subdomain "_dmarc", typ TXT
   - Jeśli istnieje → SKOPIUJ obecną wartość, pokaż mi, czekaj na decyzję
   - Jeśli NIE istnieje → kontynuuj kroki 4-7

4. Kliknij "Add an entry"
5. Type: TXT
6. Subdomain: _dmarc (z podkreślnikiem)
7. Target value (wklej DOKŁADNIE, jedna linia):
   v=DMARC1; p=none; rua=mailto:rodo@zaproszeniaonline.com; ruf=mailto:rodo@zaproszeniaonline.com; adkim=r; aspf=r; fo=1
8. TTL: 3600 (default)
9. Submit → potwierdź

10. Otwórz https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3azaproszeniaonline.com
11. Sprawdź wynik (max 60s na propagację) — powinno być zielone DMARC found

Raport: pokaż screenshot mxtoolbox + powiedz mi czy DMARC propaguje. Pytaj
"Kontynuujemy z Resend?" zanim przejdziesz dalej.

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 2: Resend.com signup + verify domain (~10 min)
═══════════════════════════════════════════════════════════════════════════════

Cel: założyć konto Resend.com (3000 maili/mc free), zweryfikować domenę
(dodać DKIM TXT + SPF aktualizację w OVH), zapisać API key.

Kroki:
1. Otwórz https://resend.com/signup
2. Załóż konto przez "Sign up with email":
   - Email: nicolasworoszylo@gmail.com (NIE zaproszeniaonline ani wisepeople)
   - Password: poproszę Nicolasa o wpisanie ręcznie (privacy: nie zapisuj)
   - Workspace name: Zaproszenia Online
3. Verify email (Nicolas otworzy link w Gmail i kliknie)
4. Po wejściu do dashboard → "Add a domain" → zaproszeniaonline.com → Add
5. Resend pokaże listę rekordów DNS do dodania (3-5 rekordów: MX dla DKIM
   bouncing, 2× TXT dla DKIM klucze, 1× TXT dla SPF, opcjonalnie 1× TXT
   dla DMARC alignment)
6. UWAGA: Resend zaproponuje SPF "v=spf1 include:_spf.resend.com ~all" — to
   ZASTĄPI nasz obecny "v=spf1 include:mx.ovh.com -all". Trzeba SCALIĆ:
   v=spf1 include:mx.ovh.com include:_spf.resend.com -all
   (zachowaj OVH MX, dodaj Resend, hardfail -all). Edytuj istniejący SPF
   record w OVH zamiast dodawać drugi (Gmail dropuje 2× SPF).

7. Wróć do OVH DNS Zone i dodaj WSZYSTKIE rekordy które pokazał Resend
   (jeden po drugim, po każdym Save). Edytuj istniejący SPF zamiast dodawać.

8. W Resend dashboard kliknij "Verify DNS records" — czeka maks 5 min.
9. Gdy wszystko zielone → Resend domain status: "Verified" ✓

10. W Resend dashboard → API Keys → Create API key
    - Name: zaproszenia-edge-functions
    - Permission: Full access (potrzebny send + send-batch)
    - Key prefix: re_ (zaczyna się od re_)
11. SKOPIUJ API key (re_xxxxxxxxxxx) — pokażę go raz, zapisz w 1Password lub
    Notion (NIE wysyłaj na Slack ani Telegram, NIE wklejaj do żadnego pliku
    w repo).

Raport: pokaż jakie rekordy zostały dodane do OVH (lista) + status verify w
Resend + zapisany API key (POKAŻ TYLKO PIERWSZE 6 ZNAKÓW: re_xxxxxx...).

Pytaj "Kontynuujemy z Google Search Console?" zanim dalej.

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 3: Google Search Console verify + sitemap submit (~5 min)
═══════════════════════════════════════════════════════════════════════════════

Cel: zarejestrować zaproszeniaonline.com w Google Search Console żeby
widzieć ranking, kliknięcia, pozycje fraz, indexing issues.

Kroki:
1. Otwórz https://search.google.com/search-console
2. Zaloguj się przez nicolasworoszylo@gmail.com (lub konto które zarządza
   domeną)
3. "Add property" → wybierz "Domain" property (NIE URL prefix — Domain
   pokrywa http+https+www+non-www w jednym property)
4. Wpisz: zaproszeniaonline.com → Continue
5. Google pokaże TXT record do dodania w DNS — typ:
   "google-site-verification=xxxxxxxxxxx"
6. Wróć do OVH DNS Zone → Add an entry → TXT
   - Subdomain: (puste, root domain)
   - Target value: google-site-verification=xxxxxxxxxxx (z kroku 5)
   - TTL: 3600 → Submit
7. Wróć do Google Search Console → "Verify"
8. Po sukcesie wejdź w Sitemaps → Add a new sitemap
9. URL: sitemap.xml → Submit
10. Status powinien być "Success" w ciągu kilku minut

Raport: TXT record dodany, weryfikacja zielona, sitemap zgłoszony, ile
URL Google znalazło w sitemap (powinno być 4 URLe: /, /demo, /magda-tomek,
/blog/ — albo więcej po blog posts).

Pytaj "Kontynuujemy z Bing Webmaster?" zanim dalej.

═══════════════════════════════════════════════════════════════════════════════
ZADANIE 4: Bing Webmaster Tools verify + sitemap (~5 min, opcjonalne)
═══════════════════════════════════════════════════════════════════════════════

Cel: rejestracja w Bing (5-10% rynku w Polsce, ale ChatGPT używa Bing index
do search). Plus: przyśpiesza indexing przez ChatGPT/Copilot.

Kroki:
1. Otwórz https://www.bing.com/webmasters
2. Sign in (najlepiej tym samym kontem Google które było w GSC — Bing ma
   "Import from Google Search Console" — auto-import)
3. Add a site → zaproszeniaonline.com
4. Verification:
   - Opcja A: "Import from GSC" (najszybsze, 1 klik)
   - Opcja B: TXT record (analogiczne jak Google z poprzedniego zadania)
5. Po verify → Sitemaps → Submit sitemap → sitemap.xml

Raport: status zielony, sitemap accepted.

═══════════════════════════════════════════════════════════════════════════════
KOŃCOWY RAPORT
═══════════════════════════════════════════════════════════════════════════════

Po wszystkich 4 zadaniach pokaż mi tabelę:

| Zadanie | Status | Co zostało zapisane |
|---|---|---|
| 1. DMARC | ✓ / ✗ | wartość TXT _dmarc |
| 2. Resend | ✓ / ✗ | API key (pierwsze 6 znaków) |
| 3. GSC | ✓ / ✗ | TXT verify value |
| 4. Bing | ✓ / ✗ | metoda verify |

Plus: "Co dalej powinien zrobić Nicolas w Claude Code?" — krótkie 1-2
zdania (np. "wkleić Resend API key do Supabase secrets jako RESEND_API_KEY").
═══════════════════════════════════════════════════════════════════════════════
```

---

## Po wykonaniu przez Claude in Chrome

Wróć do Claude Code z raportem. Wkleimy Resend API key do Supabase secrets:

```bash
# W Supabase Dashboard ręcznie LUB przez CLI:
supabase secrets set RESEND_API_KEY=re_xxx --project-ref kuyniyyieejvambyjnxy
```

Potem ja:
1. Zdeployuję 2 Edge Functions (`notify-new-lead`, `notify-payment-success`)
2. Skonfiguruję Database Webhooks (INSERT + UPDATE)
3. Test → mail z testem na Twój Gmail

Wszystko w 5 minut po dostarczeniu API key.
