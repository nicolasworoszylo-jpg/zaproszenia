# Handoff — co Nicolas musi zrobić sam

**Data:** 2026-05-07
**Sesja:** /nicolas-superpower — visual upgrade 2026 + Stripe webhook deploy

## Co już zrobione (przez Claude Code)

### Visual polish 2026 (chirurgia)
Bazuje na researchu trendów Awwwards SOTD wedding 2025-26 + Figma Resource Library.

- **Typography**: `text-wrap: balance` na nagłówkach, `text-wrap: pretty` na akapitach, tabular-nums na cenach i counterach, refined kerning + ligatures (`liga`, `dlig`, `kern`, `calt`)
- **Pricing card**: 3-warstwowy dimensional shadow (1px + 8px + 32px stack), badge "Najczęściej wybierany" floating above, lift -3px + intensified shadow on hover
- **Form palette grid**: animowany check badge ::after z spring `badge-pop`, `:user-invalid` native form validation styling
- **Hero h1 em**: shimmer-once gradient (1× run, 3.6s, fade settled) — gold accent płynie przez kursywne słowo
- **Body**: subtle SVG noise overlay (2.2% opacity, fractal turbulence) — premium tactile feel jak Linear/Stripe
- **Buttons primary**: inset highlight + 3-warstwowy shadow stack (Apple-grade depth)
- **Trust counters**: tabular-nums + lift on hover + accent color shift on number
- **Form sections**: pulse-once ring on opening section number badge (1.6s, gold color)
- **Scrollbar**: thin + accent color (modern 2026)
- **Section eyebrows**: gold dot prefix dla visual rhythm
- **All transitions**: cubic-bezier(0.32, 0.72, 0, 1) — Apple-grade timing curve
- **Scroll-driven reveal**: extended to .price-card, .lf-section, .faq-item, .trust-item

Zachowane: forest green (#2C3E2D) + gold (#C9A96E), Fraunces + Inter, prefers-reduced-motion, WCAG 2.2 focus rings, all existing JSON-LD/SEO/AEO.

**Pushed:** commit `b28edff` → `44147aa` na GitHub `nicolasworoszylo-jpg/zaproszenia`. Vercel auto-deploy w ~30 sekund.

### Backend infra
- ✅ Edge Function `stripe-webhook` deployed na Supabase (project `kuyniyyieejvambyjnxy`) — `verify_jwt: false` (correct for Stripe webhook)
  URL: `https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`
- ✅ Migracja `add_payment_columns_to_leads` zastosowana — kolumny `payment_status`, `payment_provider`, `payment_id`, `payment_amount_pln`, `paid_at` + indeksy
- ✅ Webhook obsługuje: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`

---

## Co MUSISZ zrobić sam (kolejność wg priorytetu)

### KRYTYCZNE (bez tego webhook nie działa) — 15 minut

#### 1. Stripe Dashboard → Developers → Webhooks
1. Wejdź: https://dashboard.stripe.com/webhooks
2. Kliknij **Add endpoint**
3. **Endpoint URL**: `https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`
4. **Events to send** (zaznacz dokładnie te 3):
   - `checkout.session.completed`
   - `charge.refunded`
   - `payment_intent.payment_failed`
5. Kliknij **Add endpoint**
6. Po utworzeniu → **Reveal signing secret** (zaczyna się od `whsec_...`) → skopiuj

#### 2. Supabase → Settings → Edge Functions → Secrets
1. Wejdź: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/settings/functions
2. Dodaj 2 secrety:
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (z kroku 1.6)
   - `STRIPE_SECRET_KEY` = `sk_live_...` (lub `sk_test_...` dla test mode) — z https://dashboard.stripe.com/apikeys
3. Save

**Test:** Wykonaj test wpłatę w Stripe → sprawdź Supabase `leads` table → kolumna `payment_status` powinna być `paid`.

---

### WAŻNE — DMARC dla email forwarding (10 minut przez Claude in Chrome)

Skopiuj prompt z pliku `CLAUDE_IN_CHROME_DMARC.md` do Claude in Chrome — sam zaloguje się do OVH, doda rekord DMARC, zweryfikuje.

**Po co:** Bez DMARC mail-tester pokazuje warning. Dla outbound emails (gdy Resend będzie skonfigurowany) DKIM+DMARC są obowiązkowe od lutego 2024 (Google/Yahoo bulk sender requirements).

---

### WAŻNE — Stripe Branding (5 minut)

1. https://dashboard.stripe.com/settings/branding
2. Logo: upload `og-square.png` z `/tmp/zaproszenia/`
3. Brand color: `#2C3E2D` (forest green)
4. Accent color: `#C9A96E` (gold)
5. Settings → Customer emails → **Enable** "Successful payments" + "Refunds"

---

### NORMALNE — LEGAL_DATA.md placeholders (15 minut)

Edytuj `/tmp/zaproszenia/LEGAL_DATA.md` — uzupełnij:
- NIP / REGON dla Nicolas + Dominika (lub współnej działalności)
- Adres do korespondencji (do regulaminu, polityki prywatności, faktur)
- Email do RODO requests (`rodo@zaproszeniaonline.com` jest gotowy w OVH)

Po uzupełnieniu — przeszukaj `git grep -r "PLACEHOLDER\|XXX-XXX-XX-XX\|<NIP>"` w repo i podmień ręcznie wszystkie miejsca.

---

### OPCJONALNE — Google Search Console (10 minut)

1. https://search.google.com/search-console
2. Add property: `https://zaproszeniaonline.com/`
3. Verify via DNS TXT record (przez OVH DNS Zone) lub HTML file upload
4. Submit sitemap: `https://zaproszeniaonline.com/sitemap.xml`
5. Po 24-48h zobaczysz pierwsze wyniki w Performance tab.

---

### OPCJONALNE — Resend.com setup (45 min, można odłożyć)

To krok 4 z planu — automatyczne maile do klientów + alerty dla Was. Zostawiam na później bo:
- Wymaga założenia konta Resend.com
- DNS records w OVH (DKIM, SPF update, DMARC alignment)
- Edge Function `notify-on-new-lead` (mogę zdeployować jak będziesz gotowy)

---

## Verification po Twoich krokach

```
✓ Stripe webhook test → Supabase leads.payment_status = 'paid' automat.
✓ mail-tester.com score ≥ 8/10 (po DMARC)
✓ Stripe Customer email "Payment received" przychodzi na test mail
✓ Google Search Console pokazuje impressions w 48h
```

Wszystko działa? Daj znać `nicolas-superpower → kontynuujemy` to przejdę do Resend + automatyczne maile.
