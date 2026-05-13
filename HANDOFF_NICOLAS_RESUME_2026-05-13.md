# HANDOFF dla Nicolasa — Resume RODO compliance (2026-05-13)

> **Hasło aktywujące dla Twojego Claude Code:** `ZADANIE OD ROBOTA`
>
> Po zalogowaniu na laptopie 1 otwórz Claude Code w `C:\Users\Nicolas\Desktop\zaproszenia\` (lub gdzie masz repo) i powiedz:
>
> > *ZADANIE OD ROBOTA*
>
> Twój Claude wygrepuje to hasło, znajdzie ten plik, przeczyta status i poprowadzi Cię dalej.

---

**Od:** Dominika + Claude Code (laptop 2), 2026-05-13 ~20:30
**Do:** Nicolas + jego Claude Code (laptop 1)
**Stan:** PR otwarty, 3 z 4 procesorów DPA done, Twoja interwencja potrzebna w 3 miejscach

---

## Co już zrobione 2026-05-13

### ✅ Pull Request gotowy do merge

Branch: `legal/stripe-dpa-vercel-decision-2026-05-13`
Link do utworzenia PR: <https://github.com/nicolasworoszylo-jpg/zaproszenia/pull/new/legal/stripe-dpa-vercel-decision-2026-05-13>

Branch zawiera 4 commity:
1. `docs(marketing): brand assets registry + listing logo cross-ref` (sync z siostrzanego projektu Dominiki)
2. `docs(legal): archive Stripe DPA + flag Vercel decision for Nicolas`
3. `docs(legal): archive Resend DPA (executed version)`
4. *(ten commit)* `docs(legal): handoff dla Nicolasa + Supabase DPA pending`

Dominika nie ma `gh` CLI, więc PR otwórz Ty (jedno kliknięcie linku wyżej). Po merge: `git checkout main && git pull --ff-only`.

### Status 4 procesorów DPA

| Procesor | Status | Plik / akcja |
|---|---|---|
| **Stripe** | ✅ done | `legal-templates/dpa-signed/stripe-dpa-2025-11-18.pdf` (auto-binding, archived) |
| **Resend** | ✅ done | `legal-templates/dpa-signed/resend-dpa-2025-12-31.pdf` (executed version z dashboardu, archived) |
| **Supabase** | 🟡 **TY** — DPA podpisałeś, brakuje PDF w repo | patrz **A** poniżej |
| **Vercel** | 🟠 **TY** — decyzja A/B/C/D | patrz [`DECISION_VERCEL_DPA.md`](DECISION_VERCEL_DPA.md) |

### Co jeszcze odkryte przy okazji

3 pliki w repo (`CLAUDE_IN_CHROME_PROMPTS.md`, `FIRST_CLIENT_CHECKLIST.md`, `LEGAL_TODO.md`) miały **błędne instrukcje** zakładające istnienie przycisku "Accept DPA" w panelach Vercel/Stripe/Resend. Manualnie zweryfikowane: Stripe i Resend są **auto-binding** (brak przycisku), Vercel Hobby plan **nie jest pokryty** przez Vercel DPA wcale (sekcja 1: tylko Pro/Enterprise). Wszystkie 3 pliki poprawione w tym PR.

---

## Co zostało dla Ciebie (Nicolas)

Numeracja zachowana z Twojego pierwotnego promptu, żeby było czytelnie. **Punkty 1-4 dotyczą DPA**, **5+6** to OVH skrzynki i verification — których Dominika nie zrobiła, bo nie ma loginu do OVH.

---

### A. (= Punkt 1️⃣ z Twojego promptu) Supabase DPA — wrzuć podpisany PDF (2 min)

**Dominika notuje że 2026-05-13 podpisałeś DPA Supabase w panelu.** Brakuje tylko pliku w repo.

1. Otwórz <https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/general>
2. Tab **Compliance** lub **Legal** → znajdź **"View signed DPA"** / **"Download executed DPA"**
3. Pobierz PDF do `Downloads\`
4. Powiedz swojemu Claude: *"pobierz Supabase DPA z Downloads i wrzuć do repo"* — on:
   - przeniesie do `legal-templates/dpa-signed/supabase-dpa-YYYY-MM-DD.pdf` (data Z DOKUMENTU, nie dzisiejsza)
   - zaktualizuje `legal-templates/dpa-signed/README.md` (Supabase z TODO na ✅)
   - zaktualizuje `PROJECT_STATUS.md` (Vendor DPA — Supabase: ⏳ → 🟢)
   - zaktualizuje `LEGAL_TODO.md` § 3
   - zacommituje na branch `legal/stripe-dpa-vercel-decision-2026-05-13` (ten sam co reszta)

---

### B. (= Punkt 2️⃣ z Twojego promptu) Vercel DPA — DECYZJA, nie akcja

> **UWAGA**: Twoja pierwotna instrukcja "Klik Accept" jest **nieaktualna** — manualna weryfikacja 2026-05-13: taki przycisk nie istnieje. Vercel DPA pokrywa tylko plany Pro/Enterprise. My jesteśmy na Hobby.

Pełna analiza i 4 opcje: **[`DECISION_VERCEL_DPA.md`](DECISION_VERCEL_DPA.md)**

TL;DR opcji:
- **A) Upgrade Pro $20/mc** ⭐ — Dominika rekomenduje, DPA auto-active, +1TB bandwidth, break-even 0.11 zamówienia/mc
- **B) Zostań Hobby, off Web Analytics + Speed Insights** — częściowe zmniejszenie ryzyka
- **C) Migracja Cloudflare Pages** — DPA free, pół dnia roboty
- **D) Hobby + przyjmij ryzyko** — luka RODO otwarta świadomie

Po Twojej decyzji powiedz Claude'owi: *"decyzja Vercel: [A/B/C/D], realizuj"* — on wykona kroki dla danej opcji (są wypisane w decision docu).

---

### C. (= Punkt 3️⃣ z Twojego promptu) Stripe DPA

✅ **Done przez Dominikę.** Archived w `legal-templates/dpa-signed/stripe-dpa-2025-11-18.pdf`. Auto-binding przez Stripe Services Agreement (manualnie zweryfikowane), brak przycisku Accept w panelu — Twoja pierwotna instrukcja "może być auto-aktywne" trafiła.

---

### D. (= Punkt 4️⃣ z Twojego promptu) Resend DPA

✅ **Done przez Dominikę.** Archived w `legal-templates/dpa-signed/resend-dpa-2025-12-31.pdf` (executed version pobrana z dashboardu Resend). Auto-binding przez ToS — Twoja pierwotna instrukcja "Klik Sign DPA" była nieaktualna, manualnie poprawione. Bonus: Resend ma certyfikację **EU-U.S. Data Privacy Framework** (mocniejsza podstawa transferu obok SCC).

---

### E. (= Punkt 5️⃣ z Twojego promptu) Skrzynki OVH — Dominika nie weszła w login

> Dominika nie zalogowała się do OVH Manager (hasło nie pasowało albo coś z 2FA). To Twoja akcja.

**Twój pierwotny prompt — zachowany verbatim do podania Twojemu Claude'owi w Chrome:**

> *Otwórz:* https://www.ovh.com/manager
>
> *Prompt:*
>
> W OVH Manager:
> 1. Lewe menu → "Web Cloud" → "Emails" lub "Email Pro"
> 2. Wybierz domenę "zaproszeniaonline.com"
> 3. Powinien być aktywny MX Plan (w pakiecie domeny)
>
> Utwórz 3 skrzynki, każda z password (zapisz i pokaż mi) + forward
> do nicolasworoszylo@gmail.com:
>
> A) kontakt@zaproszeniaonline.com
> B) rodo@zaproszeniaonline.com
> C) faktury@zaproszeniaonline.com
>
> Dla każdej:
> - Create account → nazwa + password silny
> - Zakładka "Redirections" → Create → Source: \<skrzynka\> → Target: nicolasworoszylo@gmail.com
> - Screenshot potwierdzenia
>
> Test końcowy:
> - Wyślij testowy email z innego konta (np. Twój prywatny Gmail) na każdy z 3 adresów
> - Sprawdź czy wpadł do nicolasworoszylo@gmail.com w 1-2 minuty
> - Screenshot inboxu Gmail z 3 testowymi mailami
>
> Kontekst: domena ma MX OVH (mx1/2/3.mail.ovh.net) + DNS OVH (dns200.anycast.me).

Po wykonaniu — screenshoty do `Downloads\`, Twój Claude wrzuci do `legal-templates/email-setup/`.

---

### F. (= Punkt 6️⃣ z Twojego promptu) Verification stack — 5 min

> Też nie wykonane przez Dominikę. Twoja akcja.

**Twój pierwotny prompt — verbatim:**

> *Otwórz:* https://zaproszeniaonline.com/ (tryb incognito)
>
> *Prompt:*
>
> Test pełnego flow RODO na live:
>
> 1. Otwórz https://zaproszeniaonline.com/ w incognito
> 2. Sprawdź banner cookies - czy są 3 PRZYCISKI RÓWNORZĘDNE:
>    "Odrzuć" | "Tylko niezbędne" | "Akceptuję wszystko"
>    (ten sam styl, border #2C3E2D, bez gradientu na żadnym)
> 3. Klik "Akceptuję wszystko" - banner znika z animacją
> 4. DevTools (F12) → Application → Local Storage → "cookie_consent"
>    Spodziewane: {"v":"all","t":\<timestamp\>,"ver":"2026-05-13"}
> 5. Sekcja "Zamów" - sprawdź 3 CHECKBOXY:
>    - RODO (required \*)
>    - 14-day waiver (required \*)
>    - Marketing (opcjonalny, bez \*)
> 6. Footer linkuje: Polityka prywatności | Cookies | Regulamin | Zwroty
> 7. Klik "Polityka prywatności" - sprawdź:
>    - Data "13 maja 2026"
>    - Sekcja 2.8 "Wiadomości transakcyjne"
>    - Brak "Funkcjonalność jeszcze nieuruchomiona" (stara fraza)
> 8. Response headers: Content-Security-Policy obecny?
>
> Screenshoty:
> - Banner z 3 przyciskami
> - Lead form z 3 checkboxami
> - DevTools Local Storage
> - Privacy data + sekcja 2.8
>
> Jeśli któryś krok zwraca błąd - pokaż mi.

---

## Końcowy commit (po A+E+F)

Twój Claude zna ścieżkę — po wykonaniu A (Supabase) + E (OVH) + F (verification):

```bash
git checkout legal/stripe-dpa-vercel-decision-2026-05-13
# (Claude porozkłada pliki: supabase pdf, screenshoty OVH, screenshoty verification)
git add legal-templates/
git commit -m "docs(legal): DPA Supabase + OVH skrzynki + verification (2026-05-13)"
git push
```

Decyzja B (Vercel) zależy od Ciebie — wykonaj według wybranej opcji A/B/C/D.

Po wszystkim **otwórz PR na linku z góry i zmerge'uj** (`gh` jest zainstalowane na Twoim laptopie 1, więc możesz też `gh pr create` + `gh pr merge`).

---

## Kontekst do MEMORY (zapisuje się automatycznie po przeczytaniu tego pliku)

- Hasło: `ZADANIE OD ROBOTA` (jednorazowe, zużyte po wykonaniu zadań)
- Wzorzec: handoff plik + hasło — zapisać do pamięci jako `feedback` żeby kolejne sesje też tak robiły

Dominika dziękuje, dobranoc 🌙
