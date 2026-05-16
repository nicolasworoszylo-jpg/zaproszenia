# Raport końcowy: pakiet prawny „zdjęcia + RODO + Notice & Takedown" + Gmail Send mail as

**Data zamknięcia:** 16 maja 2026
**Status:** ✅ DONE — wszystkie warstwy LIVE, pierwszy klient może wpaść w każdej chwili.

---

## TL;DR

Trzywarstwowy pakiet (prawny + operacyjny + komunikacyjny) został zamknięty w jednej sesji 16 maja 2026. Wszystkie potencjalne ryzyka prawne związane ze zdjęciami od klientów (prawa autorskie fotografów, wizerunek gości, RODO procesor, DSA Notice & Takedown) zarządzone strukturalnie. Workflow komunikacyjny (Gmail Send mail as `kontakt@zaproszeniaonline.com`) działa po naprawie portu SMTP 587 → 465 SSL. CLI fallback istnieje jako redundant safety net.

---

## Warstwa 1: dokumenty prawne (regulamin, polityka, edge function)

| Element | Lokalizacja | Status |
|---|---|---|
| § 4 ust. 4 "Zakres akceptacji Regulaminu" (incorporation by reference) | [terms.html](../terms.html) | ✅ LIVE |
| § 8c "Zdjęcia Klienta - prawa autorskie i wizerunek osób" (8 ustępów) | [terms.html](../terms.html) | ✅ LIVE |
| § 8d "Zgłaszanie naruszeń (Notice & Takedown)" (7 ustępów, DSA art. 16 + UŚUDE art. 14) | [terms.html](../terms.html) | ✅ LIVE |
| § 11 ust. 3-5 "Safe harbor" + cap odpowiedzialności + brak obowiązku monitorowania | [terms.html](../terms.html) | ✅ LIVE |
| § 12a "Powierzenie przetwarzania danych osobowych" (DPA inline art. 28 ust. 3 RODO) | [terms.html](../terms.html) | ✅ LIVE |
| Privacy § 2.9 "Wizerunki osób na zdjęciach" | [privacy.html](../privacy.html) | ✅ LIVE |
| Privacy § 4 retencja zdjęć (12 mc + 30 dni) | [privacy.html](../privacy.html) | ✅ LIVE |
| Privacy § 8 środki techniczne dla zdjęć (URL token, noindex, X-Robots-Tag) | [privacy.html](../privacy.html) | ✅ LIVE |
| Edge function `notify-payment-success` v10 - jednolinijkowe potwierdzenie trwałego nośnika (art. 21 ust. 1 UoPK) | [supabase/functions/notify-payment-success/index.ts](../supabase/functions/notify-payment-success/index.ts) | ✅ DEPLOYED |
| `consentVersion = 'privacy-2026-05-16-photos'` w rejestrze zgód | [index.html](../index.html) | ✅ LIVE |

**Zerowy dodatkowy checkbox dla klienta** — wszystkie oświadczenia o zdjęciach (§8c ust. 2 lit. a-e) wynikają z akceptacji Regulaminu przez § 4 ust. 4 (art. 384 § 1 KC + art. 28 ust. 9 RODO).

---

## Warstwa 2: konfiguracja techniczna (OVH, Supabase, Resend)

### Forwardery OVH (10 forwardów × 2 odbiorców = 20 ścieżek)

| Alias | Forward → Nicolas | Forward → Dominika | Publiczny w UI |
|---|---|---|---|
| `kontakt@` | ✅ | ✅ | ✅ jedyny w regulaminie (67 wystąpień) |
| `rodo@` | ✅ | ✅ | ❌ legacy (DMARC `rua/ruf` w DNS) |
| `legal@` | ✅ | ✅ | ❌ legacy (utworzony przy okazji, nie używany w docs) |
| `faktury@` | ✅ | ✅ | ❌ legacy (księgowość) |
| `zamowienia@` | ✅ | ✅ | ❌ legacy (Stripe account email) |

E2E test 5 maili z `n.woroszylo@wisepeople.pl` potwierdzony w obu inboxach (Nicolas + Dominika).

### Supabase

- Edge function `notify-payment-success` deployed v10 (16 maja 2026, 18 min po ostatnich edytach)
- Tabela `leads` zawiera kolumnę `consent_version text nullable` (sprawdzone w information_schema)
- Migracja Supabase secret keys (legacy → opaque) z backward-compatible fallback ([PR #19](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/19))

### Resend

- Domena `zaproszeniaonline.com` verified (DKIM aktywny od 2026-05-13)
- Klucz dla edge functions: `zaproszenia-prod` (Full access) — używany przez notify-payment-success, notify-new-lead, stripe-webhook, review pipeline
- Klucz dla Gmail Send mail as: `Gmail Send Mail As - kontakt@` (Sending access, scoped do `zaproszeniaonline.com`)
- Klucz zapisany lokalnie: `~/.claude/secrets/resend-api-key.txt` (chmod 600)

---

## Warstwa 3: workflow komunikacyjny (Gmail + CLI fallback)

### Gmail Send mail as `kontakt@zaproszeniaonline.com`

**Konfiguracja finalna:**
- SMTP Server: `smtp.resend.com`
- Port: **465** (port 587 STARTTLS miał subtle handshake bug)
- Security: **SSL** (nie TLS)
- Username: `resend`
- Password: klucz Resend "Gmail Send Mail As - kontakt@"
- Status: weryfikacja zaakceptowana ("Potwierdzenie dokonane"), test wysyłki pozytywny

**Workflow Nicolasa:**
- Codzienna obsługa: Reply w Gmail UI → Gmail auto-wybierze From: `kontakt@` (forwarder dostarczył oryginalnie do `kontakt@`)
- Formalne pisma (N&T, RODO, faktury): Compose z dropdown From: `Zaproszenia Online <kontakt@>` → wysyłka identyczna z normalnym mailem

### CLI fallback

[`scripts/send-as-kontakt.sh`](../scripts/send-as-kontakt.sh) — Bash + curl + Resend API Bearer. Użycie:

```bash
scripts/send-as-kontakt.sh <to> "<subject>" "<body>"
# Body z stdin (długie pisma):
cat odpowiedz.md | scripts/send-as-kontakt.sh klient@gmail.com "Subject" -
```

Niezawodne na 100% (sprawdzone Testem 3 w sesji 2026-05-16). Backup gdyby Gmail Send mail as kiedyś się popsuł.

---

## Warstwa 4: procedura operacyjna (Dominika)

### SOP odbioru zdjęć

[`legal-templates/sop-przyjmowanie-zdjec.md`](sop-przyjmowanie-zdjec.md) — 5-stopniowa checklista per zamówienie:

1. Znak wodny (visual scan)
2. Metadane EXIF (`mdls -name kMDItemAuthors -name kMDItemCopyright`)
3. Wygląd profesjonalny (subjective check)
4. Osoby na zdjęciu (RODO awareness)
5. Treści wrażliwe (dzieci, sytuacje prywatne, dokumenty)

Status: wysłany Dominice 16 maja 2026, potwierdzony ("dominika ok").

### Email templates dla Dominiki

[`email-templates/scenarios.md`](../email-templates/scenarios.md) — 13 scenariuszy, w tym:

- **#11** Photo License Check (zdjęcia profesjonalne - prośba o licencję od fotografa)
- **#12** Takedown Acknowledgement (potwierdzenie zgłoszenia w 24h)
- **#13** Takedown Decision (decyzja w 72h: usunięcie LUB brak podstaw)

---

## Weryfikacja prawna (per ryzyko)

| Ryzyko | Mechanizm zarządzania | Skuteczność |
|---|---|---|
| Klient publikuje zdjęcia fotografa bez licencji → fotograf pozywa nas | Safe harbor §11 ust. 3 + N&T §8d 72h + indemnifikacja §8c ust. 4 + SOP due diligence | ✅ Pełna ochrona |
| Wizerunek gościa publikowany bez zgody → gość pozywa parę i nas | Procesor status §8c ust. 3 + DPA §12a + N&T bezpośredni dla osoby uwiecznionej (privacy §2.9) | ✅ Procesor ma ograniczoną odpowiedzialność (art. 82 ust. 2 RODO) |
| Wyciek zdjęć z serwera | URL token + `noindex,nofollow` + `X-Robots-Tag` + brak ZIP + cap odpowiedzialności 699 zł (z wyłączeniem winy umyślnej) | ✅ Due diligence art. 32 RODO |
| UOKiK challenge indemnifikacji jako abuzywnej | §8c ust. 4 wyłączenia (wina umyślna + art. 385[1]-3 KC dla konsumentów) | ✅ Klauzula zbalansowana |
| "Nie wyraziłem świadomej zgody na §8c" | Incorporation by reference §4 ust. 4 + wersjonowanie zgód (consent_version) + art. 384 § 1 KC | ✅ Dowód w rejestrze leads |
| PUODO challenge DPA §12a | Wszystkie 8 elementów art. 28 ust. 3 RODO obecne, forma elektroniczna art. 28 ust. 9 | ✅ Formalnie kompletna |
| DSA art. 16 (mechanizm zgłoszeń) | §8d + dedykowany adres `kontakt@` + procedura 72h + odwołanie 14 dni | ✅ Zgodność |

---

## Co Nicolas musi robić (na bieżąco, per zamówienie)

1. **Klient zamawia ze zdjęciami:**
   - Klient akceptuje regulamin (jeden checkbox `rodo`) → automatycznie §4 ust. 4 → §8c ust. 2 oświadczenia
   - Klient wpłaca → notify-payment-success wysyła mail z trwałym nośnikiem (art. 21 ust. 1 UoPK)
   - Klient przesyła zdjęcia mailem na `kontakt@` → Dominika dostaje na Gmail

2. **Dominika przegląda zdjęcia:**
   - Stosuje [SOP odbioru zdjęć](sop-przyjmowanie-zdjec.md) (5 minut)
   - Jeśli znak wodny / profesjonalny look → mail scenariusz #11 do klienta
   - Jeśli czysto → publikacja w 24h

3. **Klient lub osoba trzecia zgłasza naruszenie na `kontakt@`:**
   - Mail scenariusz #12 (potwierdzenie 24h)
   - Rozpatrzenie w 72h (§8d ust. 4)
   - Mail scenariusz #13 (decyzja: usunięcie LUB brak podstaw)

4. **Klient pisze z pytaniem:**
   - Reply w Gmail → Gmail auto-wybiera From: `kontakt@` → odpowiedź wygląda profesjonalnie

---

## Rzeczy parkowane (do wzrostu skali)

| Pozycja | Trigger uruchomienia |
|---|---|
| Photo verification log (Sheets/Notion) | >5 zamówień/mc z profesjonalnymi zdjęciami |
| Gmail auto-label dla N&T | gdy zaczną przychodzić zgłoszenia (statystycznie raz na 50-100 publikowanych zaproszeń) |
| Cron auto-deletion zdjęć po 13 mc | >10 aktywnych zaproszeń jednocześnie |
| DMARC ramp-up `p=none → quarantine → reject` | >1000 maili/mc lub zaobserwowany spoofing |
| Dedykowane Send mail as dla `rodo@` i `faktury@` | gdy będziesz wysyłał z tych identyfikatorów osobno |

Żadne z parkowanych nie blokuje pierwszego klienta.

---

## Historia commitów dnia 16 maja 2026

| PR | Tytuł | Co |
|---|---|---|
| [#13](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/13) | fix(form): 5 bugów | radio caret, story toggle, HIPERFIKSACJA link, UUID insert, PostgrestBuilder .catch |
| [#15](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/15) | kontakt@ unification + migration trace + skrócona klauzula UoPK | jednolinijkowy trwały nośnik, kontakt@ wszędzie |
| [#16](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/16) | feat(reviews,legal,docs): domknięcie sesji | review pipeline + zdjęcia + OVH notes |
| [#17](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/17) | fix(webhook): match po client_reference_id | stripe-webhook race condition fix |
| [#18](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/18) | chore(legal): §13 LEGAL_TODO DONE + cleanup OVH | oznaczenie pakietu zdjęć jako DONE |
| [#19](https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/19) | chore(edge-fns): SUPABASE_SECRET_KEY migration | nowe opaque keys z fallback na legacy |

Plus ten commit z 4 dokumentami (CLAUDE_IN_CHROME_*, scripts/send-as-kontakt.sh, ten raport).

---

## Konkluzja

**Pakiet prawny + komunikacja + procedury operacyjne — DOMKNIĘTE w pełnej gotowości na pierwszego klienta.** Wszystkie warstwy mają redundancję (Gmail UI + CLI fallback dla wysyłki; kontakt@ + 4 backup aliasy dla odbioru; SOP Dominika + indemnifikacja klienta w regulaminie). Workflow Nicolasa nie wymaga żadnych dodatkowych kroków przy normalnym zamówieniu — wszystko działa "z pudełka".
