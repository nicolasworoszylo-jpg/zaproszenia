# Prompt dla Dominiki - weryfikacja Stripe na jej laptopie

**Co robi:** sprawdza czy wszystko co zostalo zrobione na Stripe rzeczywiscie dziala lokalnie + czy repo zaproszen jest aktualne na jej laptopie.

**Czas:** 3-5 minut (1 min skrypt + 2-3 min checklist Stripe Dashboard).

---

## Wariant A - Claude Code na laptopie Dominiki

Skopiuj WSZYSTKO ponizej (miedzy `═══`) i wklej w Claude Code na jej laptopie.

```
═══════════════════════════════════════════════════════════════════
ZADANIE: Weryfikacja setupu Stripe + repo zaproszeniaonline.com
═══════════════════════════════════════════════════════════════════

Hej Dominika, robisz weryfikacje czy wszystko co skonfigurowalas na
Stripe dziala lokalnie + czy repo jest aktualne. Krok po kroku:

KROK 1 - Zaktualizuj repo
─────────────────────────
cd ~/Projekty/zaproszenia 2>/dev/null || cd ~/zaproszenia 2>/dev/null \
  || git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git ~/Projekty/zaproszenia
cd "$(find ~ -name zaproszenia -type d -maxdepth 4 2>/dev/null | head -1)"
git pull origin main

KROK 2 - Odpal automated test (1 minuta)
─────────────────────────
bash scripts/verify-dominika.sh

Skrypt pokaze 8 sekcji ✓/✗/⚠. Zrob screenshot wyniku.

KROK 3 - Manualnie sprawdz w przegladarce 3 rzeczy w Stripe
─────────────────────────
Sekcja [8/8] skryptu wyswietli 3 checklisty do recznego potwierdzenia:

A. https://dashboard.stripe.com/settings/branding
   ☐ Logo wgrane (forest green Z monogramowy)
   ☐ Icon wgrany
   ☐ Brand color: #2C3E2D
   ☐ Accent color: #C9A96E

B. https://dashboard.stripe.com/settings/emails
   ☐ Successful payments: ON
   ☐ Refunds: ON
   ☐ Failed payments: ON

C. https://dashboard.stripe.com/webhooks
   ☐ Endpoint URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
   ☐ Events (DOKLADNIE 3):
       ☐ checkout.session.completed
       ☐ charge.refunded
       ☐ payment_intent.payment_failed
   ☐ Zakladka "Recent events" - czy sa 2xx (zielone)?

KROK 4 - Wyslij raport do Nicolasa (Signal/iMessage)
─────────────────────────
Screenshot z [2/8] + odpowiedzi TAK/NIE:

   A. Stripe Branding (logo + kolory): TAK / NIE
   B. Customer emails (3 toggle ON): TAK / NIE
   C. Webhook endpoint + 3 events + Recent events 2xx: TAK / NIE
   D. Skrypt verify-dominika.sh: WSZYSTKIE ✓ czy sa jakies ✗?

Jezeli wszystko TAK + skrypt 0 ✗ -> jestesmy gotowi do marketingu.
═══════════════════════════════════════════════════════════════════
```

---

## Wariant B - Bez Claude Code (Terminal + przegladarka)

Jezeli na laptopie Dominiki nie ma Claude Code, ten sam workflow recznie:

### 1. Otworz Terminal i wklej:

```bash
# Update repo
cd ~/Projekty/zaproszenia 2>/dev/null || cd ~/zaproszenia 2>/dev/null \
  || git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git ~/Projekty/zaproszenia \
  && cd ~/Projekty/zaproszenia

git pull origin main

# Run verification
bash scripts/verify-dominika.sh
```

### 2. Zrob screenshot wyniku (Cmd+Shift+5 -> zaznacz Terminal)

### 3. Otworz w przegladarce (3 zakladki):

1. https://dashboard.stripe.com/settings/branding
2. https://dashboard.stripe.com/settings/emails
3. https://dashboard.stripe.com/webhooks

### 4. Sprawdz checklisty (sekcja [8/8] skryptu) i odpisz Nicolasowi

---

## Co robi skrypt `verify-dominika.sh`

Osiem sekcji:

| # | Co sprawdza | Dlaczego |
|---|-------------|----------|
| 1 | git sync z origin/main | Czy lokalnie masz najnowsze commity |
| 2 | Ostatnie 3 commity | Widac co przyszlo z repo |
| 3 | STRIPE_WEBHOOK_SECRET w Supabase | Czy webhook secret jest ustawiony (fake signature test) |
| 4 | STRIPE_SECRET_KEY | Manualne potwierdzenie ze jest w Supabase Functions Secrets |
| 5 | Frontend live (6 URL) | Czy zaproszeniaonline.com odpowiada 200 |
| 6 | DNS records (DKIM/DMARC/MX) | Czy maile beda dochodzic (Resend + DMARC) |
| 7 | Edge Functions reachability | Czy notify-new-lead i notify-payment-success odpowiadaja |
| 8 | Manual Stripe Dashboard | 3 checklisty do oka |

Wynik = liczba `✓` / `✗` / `⚠`. Jezeli wszystko ✓ -> setup gotowy.

---

## Co dalej

Jezeli raport od Dominiki = same TAK + skrypt 0 ✗:
- Mozemy uruchamiac kampanie (Meta Ads, Google Ads)
- Pierwsze 5 testowych leadow -> obserwujemy pipeline mailowy

Jezeli sa ✗ lub NIE:
- Skrypt w sekcji oznaczonej ✗ ma podpowiedz co poprawic
- Nicolas pomoze rozwiazac
