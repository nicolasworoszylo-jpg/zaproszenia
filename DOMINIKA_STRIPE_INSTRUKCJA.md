# Stripe konfiguracja — instrukcja dla Dominiki

**Czas:** ~20 minut. Wszystko robisz w przeglądarce.
**Co potrzebujesz przed startem:**
- Dane do logowania na **Stripe Dashboard** (`zamowienia@zaproszeniaonline.com` lub `nicolasworoszylo@gmail.com` — zapytaj Nicolasa którym kontem)
- Dane do logowania do **Supabase Dashboard** (`nicolasworoszylo@gmail.com`)
- Telefon Nicolasa pod ręką (do 2FA SMS)

---

## CZĘŚĆ A — Logo i kolory na Stripe (5 minut)

### A.1 Pobierz logo

Otwórz w przeglądarce **kliknij prawym przyciskiem → Zapisz obraz jako…** i pobierz na pulpit:

1. **Logo** (większe, 512×512 PNG): https://zaproszeniaonline.com/og-square.png
2. **Icon** (kwadratowe, 512×512 PNG): https://zaproszeniaonline.com/favicon-512.png

Powinieneś teraz mieć na pulpicie 2 pliki PNG: `og-square.png` i `favicon-512.png`.

### A.2 Wejdź na Stripe Branding

1. Otwórz: **https://dashboard.stripe.com/settings/branding**
2. Zaloguj się (jeśli prosi o 2FA → SMS na telefon Nicolasa)

### A.3 Wpisz pola

Na stronie znajdziesz pola — wypełnij dokładnie:

| Pole | Co zrobić |
|---|---|
| **Icon** | Kliknij obszar uploadu → wybierz **`favicon-512.png`** z pulpitu |
| **Logo** | Kliknij obszar uploadu → wybierz **`og-square.png`** z pulpitu |
| **Brand color** | Wpisz dokładnie: `#2C3E2D` (forest green, ciemna zieleń) |
| **Accent color** | Wpisz dokładnie: `#C9A96E` (gold, ciepły złoty) |

Kliknij **Save** na dole strony.

### A.4 Sprawdź podgląd

Po Save Stripe pokaże podgląd jak będzie wyglądać Twoja strona checkout. Powinno być:
- Forest green (#2C3E2D) jako główny kolor (nagłówek, przyciski)
- Logo "Z" widoczne na górze
- Złote akcenty

Jeśli wygląda dobrze — gotowe. Jeśli kolory nie pasują — wróć i poprawnie wpisz hex (z `#`).

---

## CZĘŚĆ B — Maile do klientów (3 minuty)

### B.1 Wejdź na Customer emails

Otwórz: **https://dashboard.stripe.com/settings/emails**

### B.2 Włącz 3 opcje (suwaki ON)

W sekcji **Customer emails** znajdziesz 3 przełączniki — **wszystkie 3 muszą być ON (zielone)**:

- ☑ **Successful payments** — klient dostanie potwierdzenie wpłaty
- ☑ **Refunds** — klient dostanie info o zwrocie
- ☑ **Failed payments** — klient dostanie info o nieudanej płatności (może spróbować ponownie)

Jeśli któryś jest OFF (szary) → kliknij i włącz.

### B.3 Język

W sekcji **Email language** lub **Localization**:
- **Default language**: `Polish (Polski)` (jeśli można wybrać)
- **Locale**: `pl-PL` lub auto-detect

Save.

---

## CZĘŚĆ C — Webhook (10 minut, NAJWAŻNIEJSZE)

To jest kluczowy krok. Bez tego mail "OPŁACONE" do nas nie pójdzie po wpłacie klienta.

### C.1 Wejdź na Webhooks

Otwórz: **https://dashboard.stripe.com/webhooks**

### C.2 Sprawdź czy endpoint już istnieje

Spójrz na listę endpoints. Szukasz wpisu z URL:

```
https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
```

**JEŚLI ISTNIEJE** → kliknij na niego, przejdź do **C.5** (Reveal signing secret)

**JEŚLI NIE ISTNIEJE** → kontynuuj od C.3

### C.3 Add endpoint

1. Kliknij niebieski przycisk **Add endpoint** (góra prawa strona)
2. **Endpoint URL** — wklej DOKŁADNIE (bez spacji na początku/końcu):

```
https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
```

3. **Description** (opcjonalne): `Supabase leads sync — production`

4. **API version** — zostaw default lub wybierz najnowszą (powinna być `2024-09-30.acacia` lub późniejsza)

### C.4 Wybierz events

Pod URL znajdziesz **Listen to events**. Kliknij **Select events** (lub podobne) i zaznacz **DOKŁADNIE 3 events**:

W polu wyszukiwania wpisz każdy po kolei i zaznacz checkbox:

- ☑ `checkout.session.completed`
- ☑ `charge.refunded`
- ☑ `payment_intent.payment_failed`

(NIE zaznaczaj nic więcej — tylko te 3)

Kliknij **Add events** (lub Done).

Następnie na dole strony kliknij **Add endpoint** (zielony przycisk).

### C.5 Reveal signing secret

Po utworzeniu (lub po wejściu w istniejący endpoint) zobaczysz stronę z detalami webhook. Po prawej stronie znajdziesz pole **Signing secret**:

1. Kliknij **Reveal** (lub **Click to reveal**)
2. Pojawi się klucz zaczynający się od `whsec_` — będzie miał ok. **70-80 znaków**, np. `whsec_a1b2c3d4e5f6...`
3. Zaznacz CAŁY klucz (Cmd+A jak jesteś w polu, lub myszką od `w` do końca)
4. Skopiuj (Cmd+C)

### C.6 Pobierz Stripe Secret Key

Otwórz: **https://dashboard.stripe.com/apikeys**

Znajdź sekcję **Standard keys** → wiersz **Secret key**:
1. Kliknij **Reveal live key** (lub Reveal test key jeśli jeszcze testujesz)
2. Skopiuj klucz zaczynający się od `sk_live_` (lub `sk_test_`)

⚠️ Otwórz **Apple Notes z FileVault** lub **1Password** i ZAPISZ oba klucze tymczasowo. Za chwilę wkleisz je do Supabase.

---

## CZĘŚĆ D — Wklej klucze do Supabase (3 minuty)

### D.1 Wejdź na Supabase Functions secrets

Otwórz: **https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/functions**

(Jeśli widzisz inną stronę, w lewej belce: **Project Settings** → **Edge Functions** → zakładka **Secrets**)

### D.2 Sprawdź obecne secrety

Powinieneś widzieć listę secretów. Szukaj:

- `RESEND_API_KEY` — powinien być (zostawiamy jak jest, **nie ruszamy**)
- `STRIPE_WEBHOOK_SECRET` — może być, ale **PUSTY** (gwiazdki = wartość, brak gwiazdek = pusty)
- `STRIPE_SECRET_KEY` — może być lub nie

### D.3 Ustaw STRIPE_WEBHOOK_SECRET

**Jeśli istnieje:**
1. Najedź na wiersz `STRIPE_WEBHOOK_SECRET` → kliknij **Edit** (ikona ołówka) lub **Delete** + Add new
2. Wklej w pole `whsec_xxxxxxxxx...` (klucz z kroku C.5)
3. **WAŻNE:** sprawdź że nie ma spacji na początku ani końcu (Cmd+A → Cmd+C → Cmd+V dwukrotnie żeby się upewnić)
4. **Save**

**Jeśli nie istnieje:**
1. Kliknij **Add new secret** (lub **+ New secret**)
2. **Name:** `STRIPE_WEBHOOK_SECRET` (dokładnie tak, case-sensitive, z podkreślnikami)
3. **Value:** `whsec_xxxxxxxxx...` (klucz z C.5)
4. **Save**

### D.4 Ustaw STRIPE_SECRET_KEY

Analogicznie:
1. Add new secret (lub Edit)
2. **Name:** `STRIPE_SECRET_KEY`
3. **Value:** `sk_live_xxxxxxxxx...` (lub `sk_test_xxx` z C.6)
4. **Save**

### D.5 Sprawdź listę

Po zapisaniu lista powinna pokazywać 3 secrety:

```
RESEND_API_KEY            ●●●●●●●●●●●●●●●●●●●
STRIPE_WEBHOOK_SECRET     ●●●●●●●●●●●●●●●●●●●
STRIPE_SECRET_KEY         ●●●●●●●●●●●●●●●●●●●
```

Wszystkie 3 z gwiazdkami (=wartość zapisana) — gotowe.

---

## CZĘŚĆ E — Co przesłać Nicolasowi (1 minuta)

⚠️ **NIE WYSYŁAJ samych kluczy w plain text** (Slack/Telegram/email — bezpieczne tylko 1Password lub przy spotkaniu).

Wyślij Nicolasowi tylko **status sprawdzenia** w formie zgłoszenia:

```
STRIPE STATUS:

A. Branding:
   - Logo og-square.png uploaded: TAK / NIE
   - Icon favicon-512.png uploaded: TAK / NIE
   - Brand color #2C3E2D wpisany: TAK / NIE
   - Accent color #C9A96E wpisany: TAK / NIE
   - Save kliknięte: TAK / NIE

B. Customer emails:
   - Successful payments ON: TAK / NIE
   - Refunds ON: TAK / NIE
   - Failed payments ON: TAK / NIE

C. Webhook endpoint:
   - URL https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook utworzony: TAK / NIE
   - 3 events zaznaczone (checkout.session.completed, charge.refunded, payment_intent.payment_failed): TAK / NIE
   - Signing secret skopiowany: TAK / NIE
   - Pierwsze 10 znaków klucza (do weryfikacji że to ten sam): whsec_xxxx (np. whsec_a7b3c9)

D. Stripe Secret Key:
   - sk_live_ albo sk_test_ skopiowany: TAK / NIE
   - Pierwsze 10 znaków: sk_live_xxx (np. sk_live_51JqW)

E. Supabase secrets:
   - STRIPE_WEBHOOK_SECRET zapisany (gwiazdki widoczne): TAK / NIE
   - STRIPE_SECRET_KEY zapisany: TAK / NIE
   - RESEND_API_KEY nie ruszony: TAK / NIE
```

**Szczególnie ważne:** napisz Nicolasowi **TYLKO PIERWSZE 10 znaków** klucza signing secret (`whsec_` + 4 znaki). Reszta klucza zostaje tylko w Supabase i 1Password — nigdy w plain wiadomościach.

---

## Co Nicolas zrobi po otrzymaniu raportu od Ciebie

Nicolas (przez Claude Code, którego ma na swoim Macu) zrobi test live:

1. Wstawi w Supabase test wpłaty (symulacja Stripe webhook)
2. Sprawdzi czy mail "OPŁACONE 699 zł" przyjdzie na Wasze Gmaile
3. Sprawdzi czy klient dostanie mail "Płatność potwierdzona"
4. Jeśli wszystko działa → MARKETING GO 🚀

Test trwa ~30 sekund. Nicolas da Ci znać że wszystko działa.

---

## Co zrobić jeśli coś idzie nie tak

### "Nie mogę się zalogować do Stripe"
- Spróbuj `zamowienia@zaproszeniaonline.com` (główny adres Stripe)
- Jeśli nie działa → `nicolasworoszylo@gmail.com`
- Jeśli prosi o 2FA SMS → kod idzie na telefon Nicolasa

### "Nie widzę przycisku Reveal signing secret"
- Sprawdź czy klikasz w endpoint (rozwija się szczegół)
- Signing secret jest po prawej stronie, nie na górze
- Jeśli widzisz tylko `whsec_•••••` = już został odsłonięty wcześniej, kliknij tekst lub button "Reveal" obok

### "Stripe nie pozwala dodać webhook"
- Może być potrzebne **Activate account** (jeśli to nowe konto Stripe i nie aktywowane) — kliknij góra ekranu **Activate account** i przejdź setup
- Test mode vs Live mode — przełącznik góra prawa, "Test mode" toggle. Webhook działa w obu, ale klucz jest inny

### "Pomyłka — wkleiłam zły klucz"
- W Supabase: kliknij Edit przy secret, popraw, Save (nadpisuje)
- W Stripe: nie da się "popsuć" — wszystko jest read-only po stronie klienta

---

## Po wszystkim

Po wysłaniu raportu Nicolasowi (Część E), Twoja praca skończona. Czas total ~20 minut. Stripe jest skonfigurowany, klucze są w Supabase, system gotowy do przyjmowania wpłat.

Dziękujemy! 💚
