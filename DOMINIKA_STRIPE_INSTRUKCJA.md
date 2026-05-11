# Stripe konfiguracja - instrukcja dla Dominiki

**Czas:** ~15 minut. Wszystko w przeglądarce.
**Zakres:** Konfigurujesz tylko Stripe (logo + maile + webhook). Klucze przesyłasz Nicolasowi - on wpisze je do Supabase.

**Co potrzebujesz przed startem:**
- Login do **Stripe Dashboard** (Nicolas wyśle Ci osobno)
- Dostęp do telefonu Nicolasa (na 2FA SMS, jeśli zapyta)

---

## CZĘŚĆ A - Logo i kolory na Stripe (5 minut)

### A.1 Pobierz logo

Otwórz w przeglądarce **kliknij prawym przyciskiem → Zapisz obraz jako…** i pobierz na pulpit:

1. **Logo** (512×512 PNG): https://zaproszeniaonline.com/og-square.png
2. **Icon** (512×512 PNG): https://zaproszeniaonline.com/favicon-512.png

Powinieneś teraz mieć na pulpicie 2 pliki PNG.

### A.2 Wejdź na Stripe Branding

1. Otwórz: **https://dashboard.stripe.com/settings/branding**
2. Zaloguj się (jeśli prosi o 2FA SMS → kod idzie na telefon Nicolasa)

### A.3 Wpisz pola

| Pole | Wartość |
|---|---|
| **Icon** | upload `favicon-512.png` z pulpitu |
| **Logo** | upload `og-square.png` z pulpitu |
| **Brand color** | `#2C3E2D` (forest green) |
| **Accent color** | `#C9A96E` (gold) |

Save.

---

## CZĘŚĆ B - Maile do klientów (3 minuty)

Otwórz: **https://dashboard.stripe.com/settings/emails**

W sekcji Customer emails włącz **wszystkie 3 toggle (zielone)**:

- ☑ **Successful payments**
- ☑ **Refunds**
- ☑ **Failed payments**

Język: **Polish (Polski)** jeśli można wybrać.

Save.

---

## CZĘŚĆ C - Webhook (7 minut, NAJWAŻNIEJSZE)

### C.1 Wejdź na Webhooks

Otwórz: **https://dashboard.stripe.com/webhooks**

### C.2 Sprawdź czy endpoint już istnieje

Szukaj wpisu z URL:
```
https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
```

**JEŚLI ISTNIEJE** → kliknij na niego, przeskocz do C.5
**JEŚLI NIE ISTNIEJE** → kontynuuj C.3

### C.3 Add endpoint

1. Niebieski przycisk **Add endpoint** (góra prawa)
2. **Endpoint URL** - wklej DOKŁADNIE (bez spacji):
```
https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
```
3. **Description** (opcjonalne): `Supabase leads sync`
4. **API version** - zostaw default

### C.4 Wybierz events

Pod URL → **Select events** → wpisz każdy w wyszukiwarce i zaznacz checkbox:

- ☑ `checkout.session.completed`
- ☑ `charge.refunded`
- ☑ `payment_intent.payment_failed`

(Tylko te 3 - nic więcej.)

Add events → na dole **Add endpoint**.

### C.5 Reveal signing secret

Po utworzeniu endpoint zobaczysz stronę z detalami. Po prawej **Signing secret**:

1. Kliknij **Reveal**
2. Pojawi się klucz `whsec_xxxxxx...` (~70-80 znaków)
3. Skopiuj CAŁY (Cmd+A → Cmd+C w polu)
4. **Zapisz w Apple Notes na razie** - za chwilę wyślesz Nicolasowi

### C.6 Pobierz Stripe Secret Key

Otwórz: **https://dashboard.stripe.com/apikeys**

Sekcja **Standard keys** → wiersz **Secret key**:
1. Kliknij **Reveal live key**
2. Skopiuj klucz `sk_live_xxxxx...`
3. **Zapisz obok pierwszego klucza w Apple Notes**

---

## CZĘŚĆ D - Wyślij klucze Nicolasowi (1 minuta)

⚠️ **WAŻNE: NIE wysyłaj na zwykły SMS, Slack ani publiczny czat.**

**Bezpieczne kanały (wybierz jeden):**
- **Signal** ← najlepsze (e2e encryption, znikające wiadomości)
- **iMessage** ← OK (e2e encryption Apple)
- **WhatsApp** ← OK (e2e encryption)
- **1Password Shared Vault** ← najlepsze jeśli macie

**NIE używaj:**
- ❌ SMS (plain text, operator widzi)
- ❌ Email (zostaje na serwerach Gmail)
- ❌ Slack publiczny / kanały firmy
- ❌ Telegram bez Secret Chat

### Format wiadomości do Nicolasa

```
Stripe gotowe ✓

A. Branding (logo + kolory): TAK / NIE
B. Customer emails (3 toggle ON): TAK / NIE
C. Webhook endpoint utworzony: TAK / NIE

KLUCZE (wklej pełne wartości, te z whsec_... i sk_... które masz w Apple Notes):

STRIPE_WEBHOOK_SECRET = [tutaj wklej klucz zaczynający się od whsec_]

STRIPE_SECRET_KEY = [tutaj wklej klucz zaczynający się od sk_live_ lub sk_test_]
```

(Wklej PEŁNE klucze - Nicolas wpisze je do Supabase z mojego końca.)

Po wysłaniu - możesz usunąć klucze z Apple Notes (Nicolas już je ma).

---

## Co zrobi Nicolas

1. Wpisze oba klucze do Supabase secrets (30 sekund)
2. Zrobi test pipeline'u (1 minuta)
3. Da Ci znać że wszystko działa → marketing GO

---

## Troubleshooting

### "Nie mogę się zalogować do Stripe"
Spróbuj `zamowienia@zaproszeniaonline.com` lub `nicolasworoszylo@gmail.com` - Nicolas Ci powie którego.

### "Nie widzę przycisku Reveal signing secret"
Kliknij w endpoint (rozwija szczegóły). Signing secret jest po prawej, nie na górze. Jeśli widzisz `whsec_•••••` → już odsłonięty wcześniej, kliknij tekst.

### "Stripe nie pozwala dodać webhook - Activate account"
Może być potrzebne aktywowanie konta Stripe. Kliknij górę ekranu **Activate account** i przejdź setup. Po aktywacji wróć do C.3.

### "Pomyłka z kluczem"
Bez problemu - klucze można w każdej chwili wygenerować ponownie. W Stripe → Webhooks → Roll secret (nowa wartość). Nicolas zaktualizuje po stronie Supabase.
