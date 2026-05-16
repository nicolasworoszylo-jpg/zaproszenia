# Deployment checklist: pakiet prawny „zdjęcia + RODO + Notice & Takedown"

> Pakiet z 16 maja 2026: regulamin §4 ust. 4, §8c, §8d, §11 ust. 3-5, §12a + privacy §2.9 + email templates 11-13 + SOP odbioru zdjęć + edge function notify-payment-success.

Lista konkretnych rzeczy do zrobienia ZANIM puszczę przyjmowanie pierwszego klienta. Część automatyczna (kod), część wymaga akcji ręcznej w panelach. Łącznie ~30 minut.

---

## 1. KOD I DEPLOYMENT (zrobione w repo - wymaga deploy)

### 1a. Deploy edge function notify-payment-success

Edge function została zmodyfikowana - dodano jednolinijkowe potwierdzenie zawarcia umowy (art. 21 ust. 1 UoPK) w HTML i plain text. Deploy:

```bash
# Z katalogu repo:
supabase functions deploy notify-payment-success
```

Lub przez panel Supabase → Edge Functions → notify-payment-success → Deploy. Po deploy zweryfikuj na test leadzie (Stripe test mode + status=paid).

### 1b. Push do GitHub

Zmiany w plikach:
- `index.html` (consent_version)
- `terms.html` (§4 ust. 4, §8c, §8d, §11 ust. 3-5, §12a)
- `privacy.html` (§2.9 + retencja + środki techniczne)
- `supabase/functions/notify-payment-success/index.ts`
- `email-templates/scenarios.md` (11-13)
- `email-templates/README.md` (tabela)
- `legal-templates/sop-przyjmowanie-zdjec.md` (nowy)
- `legal-templates/DEPLOYMENT_CHECKLIST_ZDJECIA.md` (ten plik)

Vercel automatycznie wdroży landing/terms/privacy/cookies/returns po pushu.

### 1c. Wdrożenie wersjonowania zgód (opcjonalne, na razie zostawimy)

W `index.html` jest `const consentVersion = 'privacy-2026-05-16-photos'` zapisywane do tabeli `leads` w kolumnie `consent_version`. To wystarczające do dowodu „klient zaakceptował tę wersję regulaminu". Jeśli kolumna nie istnieje w schemacie - dodaj:

```sql
-- Migration (opcjonalne):
alter table public.leads
  add column if not exists consent_version text;
```

---

## 2. KONFIGURACJA EMAIL (akcja ręczna w panelu)

### 2a. Sprawdź alias `kontakt@zaproszeniaonline.com`

W regulaminie/polityce wszystkie zgłoszenia (RODO, Notice & Takedown, reklamacje) idą na **jeden adres**: `kontakt@zaproszeniaonline.com`. Musi działać dwukierunkowo:
- przychodzące (z formularzy klientów + zewnętrznych zgłoszeń) - musi być odbierane
- wychodzące (Resend) - już działa via DNS records (DKIM/SPF/DMARC potwierdzone w memory)

Test:
```bash
# Wyślij maila testowego z innego konta na kontakt@zaproszeniaonline.com
# Sprawdź czy dotarł do skrzynki Nicolas/Dominika
```

### 2b. (OPCJONALNE) Aliasy `legal@` i `rodo@` jako forwardery

W aktualnej wersji regulaminu (po kompresji) wszędzie używamy `kontakt@`. Jeśli chcesz mieć dedykowane aliasy dla obsługi Notice & Takedown / RODO osobno - skonfiguruj w Cloudflare Email Routing / OVH:
- `legal@zaproszeniaonline.com` → forward na `kontakt@`
- `rodo@zaproszeniaonline.com` → forward na `kontakt@`

To NIE jest wymagane - obecny stan (wszystko na `kontakt@`) jest w pełni legalny i operacyjnie wystarczający.

---

## 3. PRZEKAZANIE DOMINICE (akcja ręczna)

### 3a. Wyślij Dominice SOP

Plik: `legal-templates/sop-przyjmowanie-zdjec.md`

Proponowana treść maila:

> Hej Dominika,
>
> Updated nasz pakiet prawny pod kątem zdjęć (po klientowsku: jak ktoś nam prześle zdjęcie fotografa bez licencji, nie chcemy żeby nas pozwał). W regulaminie jest paragraf 8c - klient akceptuje go automatycznie przez akceptację regulaminu, czyli żadnego dodatkowego checkboxa.
>
> Twoja rola: przy każdym zamówieniu z zdjęciami przejdź checklistę z SOP (link niżej). Zajmie 30 sek/zdjęcie. Ważne dla naszego safe harboru - bez tego procesu w razie roszczenia fotografa nie obronimy się.
>
> Plik: [legal-templates/sop-przyjmowanie-zdjec.md](link do repo lub załącznik)
>
> Maile gotowe do wysyłki:
> - Scenariusz 11: prośba o licencję od fotografa (kiedy zdjęcie wygląda profesjonalnie)
> - Scenariusz 12: potwierdzenie zgłoszenia naruszenia (Notice & Takedown)
> - Scenariusz 13: decyzja po rozpatrzeniu zgłoszenia
>
> Wszystko w `email-templates/scenarios.md`.
>
> N

### 3b. Wspólny dokument logu (Google Sheets / Notion)

Stwórz arkusz/stronę „Photo verification log" gdzie Dominika zapisuje per zamówienie:
- Data odbioru zdjęć
- Liczba zdjęć
- Wynik weryfikacji (znaki wodne / EXIF / wygląd profesjonalny)
- Co zostało wyjaśnione z klientem (link do maila)
- Decyzja: opublikowano / odmówiono / czeka na licencję

Format: prosty Sheets, 6 kolumn. To dowód due diligence w razie roszczenia.

---

## 4. WERSJE OPCJONALNE (nie blokery)

### 4a. Cron auto-deletion zdjęć po 13 miesiącach

Regulamin §8c ust. 7 obiecuje: hosting 12 mc + 30 dni, potem trwałe usunięcie. Na razie nie ma automatyzacji - przy małej skali Nicolas usuwa ręcznie. Kiedy będzie >10 aktywnych zaproszeń jednocześnie, warto dodać cron:

```typescript
// supabase/functions/delete-expired-invitations/index.ts (TODO)
// Triggered: cron daily 03:00 UTC
// 1. SELECT id, urls FROM leads WHERE created_at < now() - interval '13 months' AND deleted_at IS NULL
// 2. Delete from Supabase Storage: bucket('invitations').remove([urls])
// 3. UPDATE leads SET deleted_at = now()
// 4. Audit log do tabeli `data_retention_log`
```

Wymaga:
- nowa kolumna `deleted_at` w `leads`
- Storage bucket policy: tylko service_role może usuwać
- pg_cron extension w Supabase (`select cron.schedule(...)`)

Przy obecnej skali (0-5 klientów / mc) - manualne kasowanie wystarczy. Wpisać do TODO na quartalny review.

### 4b. Gmail auto-label dla Notice & Takedown

W Gmail kontakt@zaproszeniaonline.com - reguła filtrująca:
- IF (subject contains "naruszen" OR "takedown" OR "DMCA" OR "RODO" OR "art. 17" OR "wizerunek") AND (NOT from:my-own-email)
- THEN label: „⚖ Notice & Takedown" + star + notify Dominika

Ustaw w panelu Gmail → Settings → Filters and Blocked Addresses → Create new filter.

### 4c. Coroczny przegląd polityki

Co 12 miesięcy (najlepiej w styczniu):
- Sprawdź czy art. 50 ustawy o prawie autorskim nie był nowelizowany (rzadko)
- Sprawdź DSA implementing acts (są dopiero w fazie wdrażania w Polsce do 2026)
- Zweryfikuj że Supabase + Vercel + Resend nadal mają aktualne SCC + DPA
- Update `consent_version` jeśli zmieniasz brzmienie regulaminu

---

## 5. CO MUSI BYĆ DEPLOYED PRZED PIERWSZYM KLIENTEM

Minimum wymagane:

- [ ] `terms.html` + `privacy.html` na produkcji (Vercel auto-deploy po push)
- [ ] `index.html` z `consent_version = 'privacy-2026-05-16-photos'` na produkcji
- [ ] Edge function `notify-payment-success` zdeployowana (supabase functions deploy)
- [ ] Skrzynka `kontakt@zaproszeniaonline.com` działa (test send/receive)
- [ ] Dominika potwierdziła odebranie SOP

Opcjonalne (można po pierwszym kliencie):

- [ ] Photo verification log (Sheets)
- [ ] Gmail auto-label dla N&T
- [ ] Aliasy legal@/rodo@ jako forwardery
- [ ] Cron auto-deletion
- [ ] Migration `consent_version` w tabeli leads (jeśli nie istnieje)

---

## Status pakietu na dziś (16 maja 2026)

**Kod:** ✅ gotowe w repo - wymaga `git push` + `supabase functions deploy notify-payment-success`
**Email templates:** ✅ gotowe - manualne wysyłanie przez `email-templates/send-template.sh` lub kopiowanie do Gmail
**SOP:** ✅ gotowe - wymaga wysłania Dominice
**Skrzynki:** ⚠️ `kontakt@` musi działać. `legal@`/`rodo@` opcjonalne.

Po `git push` + deploy edge function + przekazaniu SOP Dominice = **wszystko tip-top**.
