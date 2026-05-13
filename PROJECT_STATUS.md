# Project Status - zaproszeniaonline.com

**Ostatnia weryfikacja:** 2026-05-13 (Nicolas + Claude Code, full 10-warstwowy work-verifier audit)
**Owner:** Nicolas Woroszyło (działalność nieewidencjonowana, art. 5 ust. 1 PrzedsU)
**Partner biznesowy:** Dominika Kuś (osoba upoważniona art. 29 RODO)

## 🎉 MILESTONE 2026-05-13: WSZYSTKO DZIAŁA, WSZYSTKO ZWERYFIKOWANE

Po pełnej sesji (~30 commits od 2026-05-11) Nicolas potwierdził: **"wszystko działa wszystko zrobione"**.

**Verified w tej iteracji:**
- ✅ Krytyka Dominiki 11/11 punktów wdrożona (copy + legal + mobile)
- ✅ Sekcja 05 formularza redesign (toggle "wpisz teraz / mailowo" per feature)
- ✅ Audio system (palette-aware v4 z aria-pressed target + linear-gradient parsing)
- ✅ Vercel "Verifying your browser..." rozwiązane (Vercel Authentication wyłączone)
- ✅ 7 pre-emptive fixes (security headers, defer, mobile UX, PWA, a11y, robots.txt)
- ✅ Repo Guardian Multi-PC system + 19 Conditional Reminders (LIVE, GitHub Actions ZIELONE)
- ✅ Demo działa na koncie Nicolasa + palette sync v4 zmienia kolory audio buttona

## Workflow zabezpieczone (od 2026-05-13)
- `core.hooksPath = .githooks` aktywowane lokalnie
- 8 git hooks (pre-commit, commit-msg, post-commit reminders, pre-push, post-merge, etc.)
- 2 GitHub Actions workflows: Repo Guardian + Conditional Reminders
- `.repo-rules.yml` (19 reguł deklaratywnych: jeśli zmiana X → przypomnij Y)
- `scripts/setup-multi-pc.sh` (1-klik installer dla drugiego laptopa)
- `MULTI_PC_SYSTEM.md` (pełna dokumentacja)

---

---

## 🚦 GO / NO-GO

| Komponent | Status | Notatka |
|---|---|---|
| Strona live | 🟢 GO | https://zaproszeniaonline.com/ HTTP 200 |
| Blog (8 artykułów) | 🟢 GO | wszystkie 200 OK |
| DNS email infrastructure | 🟢 GO | MX + SPF + DMARC + DKIM Resend wszystko propaguje |
| Resend domain | 🟢 GO | Verified, API key działa |
| Edge Functions (4) | 🟢 GO | wszystkie ACTIVE, latest version |
| Database Webhooks (2) | 🟢 GO | INSERT + UPDATE→paid triggery aktywne |
| Email pipeline (notify-new-lead) | 🟢 GO | test 200 OK, brand-aligned v4 |
| Email pipeline (notify-payment-success) | 🟢 GO | test 200 OK, brand-aligned v4 |
| Stripe webhook deployed | 🟢 GO | endpoint odpowiada |
| **Stripe webhook secret** | 🟢 **GO** | ustawiony 2026-05-11, weryfikacja signature działa |
| **Stripe secret key** | 🟢 **GO** | ustawiony 2026-05-11, SDK inicjalizuje się poprawnie |
| **Stripe Branding + Customer emails** | 🟢 GO | skonfigurowane przez Dominikę 2026-05-11 |
| Google Search Console | 🟢 GO | property verified via TXT, sitemap submitted |
| Legal docs (terms + privacy) | 🟢 GO | działalność nieewidencjonowana wstawiona |

**Marketing-go:** 🚀 **READY** — wszystkie blokery rozwiązane 2026-05-11.

---

## 🌐 Infrastructure

### Frontend (Vercel)
- **Project ID:** `prj_0uMw2SNx6v5F0OQbgrCp1gKgug5F`
- **Project name:** `zaproszenia-ddli`
- **Production URL:** https://zaproszeniaonline.com
- **Auto-deploy:** main branch push → ~30s
- **Files:** 29 root + 8 blog HTML + 5 stripe-assets + 2 legal-templates

### Backend (Supabase)
- **Project ref:** `kuyniyyieejvambyjnxy`
- **Region:** eu-central-1 (Frankfurt, RODO compliant)
- **Dashboard:** https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy
- **Tables:** `leads` (19 kolumn - original 14 + 5 payment columns)
- **Total leads:** 2 (oba testowe, sprzed marketingu)

### Domain (OVH)
- **Registrar:** OVH
- **Domain:** zaproszeniaonline.com
- **Email forwarding:** 8 aliasów (kontakt/zamowienia/faktury/rodo × Nicolas/Dominika)

---

## 📧 Email Infrastructure

### DNS records (zweryfikowane na żywo @1.1.1.1)

| Record | Value | Status |
|---|---|---|
| MX root | mx1/2/3.mail.ovh.net (priorities 1/5/100) | ✅ |
| SPF root | `v=spf1 include:mx.ovh.com -all` | ✅ |
| DMARC | `v=DMARC1; p=none; rua=mailto:rodo@...; adkim=r; aspf=r; fo=1` | ✅ |
| DKIM Resend (`resend._domainkey`) | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4...` (218 chars) | ✅ |
| MX send (Resend) | `feedback-smtp.eu-west-1.amazonses.com.` | ✅ |
| SPF send (Resend) | `v=spf1 include:amazonses.com ~all` | ✅ |

### Resend (transactional email)
- **Domain status:** Verified ✓
- **API key:** active (`re_NYVcGsWh...`)
- **Region:** eu-west-1 (Ireland)
- **Quota:** 3000 maili/mc (free tier)

---

## ⚙️ Backend (Supabase Edge Functions)

| Function | Version | verify_jwt | Status |
|---|---|---|---|
| `stripe-webhook` | v3 | false | ACTIVE ✅ sekrety ustawione, signature weryfikacja działa |
| `notify-new-lead` | v5 | false | ACTIVE (brand templates) |
| `notify-payment-success` | v5 | false | ACTIVE (brand templates) |
| `helpwave-scan-tx` | v3 | true | ACTIVE (inny projekt - helpwave) |

### Database Webhooks (PG triggers)

```sql
-- INSERT trigger (active)
leads_notify_new_lead
  AFTER INSERT ON public.leads
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-new-lead',
    'POST', '{"Content-Type":"application/json"}', '{}', '5000'
  )

-- UPDATE trigger (active, with WHEN clause)
leads_notify_payment_success
  AFTER UPDATE ON public.leads
  WHEN (NEW.payment_status='paid' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-payment-success',
    'POST', '{"Content-Type":"application/json"}', '{}', '5000'
  )
```

### Required Supabase secrets

| Secret | Status | Source |
|---|---|---|
| `RESEND_API_KEY` | ✅ set, działa | Resend Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | ✅ set 2026-05-11, działa | Stripe Dashboard → Webhooks → Reveal signing secret |
| `STRIPE_SECRET_KEY` | ✅ set 2026-05-11, działa | Stripe Dashboard → API keys → Reveal live key |
| `SUPABASE_URL` | ✅ auto | Supabase managed |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ auto | Supabase managed |

---

## 💳 Stripe

- **Account email:** `zamowienia@zaproszeniaonline.com` (lub konto Dominiki)
- **Payment Link (live):** `https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01`
- **Webhook URL:** `https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`
- **Required events:**
  - `checkout.session.completed`
  - `charge.refunded`
  - `payment_intent.payment_failed`
- **Tax behavior:** NIE jest podatnikiem VAT (działalność nieewidencjonowana)
- **Statement descriptor:** `ZAPROSZENIA`

---

## 📁 Repository structure

```
/
├── index.html                    ← landing (premium polish 2026 + trust signals)
├── demo.html                     ← demo zaproszenia (Anna i Michał)
├── magda-tomek.html              ← drugie demo
├── dziekujemy.html               ← Stripe success page
├── platnosc-anulowana.html       ← Stripe cancel page
├── 404.html                      ← error page
├── privacy.html                  ← polityka prywatności (administrator: Nicolas)
├── terms.html                    ← regulamin (działalność nieewidencjonowana)
├── returns.html                  ← polityka zwrotów
├── cookies.html                  ← polityka cookies
├── sitemap.xml                   ← 13 URL (1 root + 1 blog + 8 posts + 4 legal)
├── robots.txt                    ← AI bots allowed (GPTBot, Claude, etc.)
├── llms.txt                      ← AI citation disclosure
├── vercel.json                   ← cache headers + clean URLs
├── README.md                     ← public-facing repo intro
├── LICENSE.md                    ← copyright Vidok Studio (no OSS license)
├── LEGAL_DATA.md                 ← business data (działalność nieewidencjonowana)
├── HANDOFF_NICOLAS_v2.md         ← stan projektu (per session handoff)
├── STRIPE_SETUP.md               ← Stripe setup guide
├── DOMINIKA_STRIPE_INSTRUKCJA.md ← Stripe configuration tutorial (Dominika side)
├── CLAUDE_IN_CHROME_MASTER.md    ← DMARC + Resend + GSC prompt (Claude in Chrome)
├── PROJECT_STATUS.md             ← TEN PLIK (ostatnia weryfikacja stanu)
│
├── blog/                         ← 8 SEO articles + index
│   ├── index.html
│   ├── cyfrowe-vs-papierowe-zaproszenia-slubne.html
│   ├── ile-kosztuje-strona-slubna-2026.html
│   ├── potwierdzanie-obecnosci-online-instrukcja.html
│   ├── rsvp-na-wesele-co-to-znaczy.html
│   ├── zaproszenia-slubne-bez-drukowania.html
│   ├── zaproszenie-slubne-online-jak-dziala.html
│   └── zaproszenie-slubne-qr-kod.html
│
├── stripe-assets/                ← Stripe Branding assets
│   ├── STRIPE_INSTRUKCJA.md
│   ├── brand-info.txt
│   ├── product-description-pl.md
│   ├── logo-stripe-512.png
│   └── icon-stripe-512.png
│
├── supabase/                     ← Edge Functions + migrations
│   ├── functions/
│   │   ├── notify-new-lead/index.ts            (v5 ACTIVE)
│   │   ├── notify-payment-success/index.ts     (v5 ACTIVE)
│   │   ├── notify-on-new-lead/                 (legacy, można usunąć)
│   │   └── stripe-webhook/index.ts             (v3 ACTIVE)
│   └── migrations/
│       └── 2026-04-30-add-payment-cols.sql
│
├── legal-templates/              ← art. 26 / art. 28 RODO templates
│   ├── 01-porozumienie-wspoladministratorow.md
│   └── 02-umowa-powierzenia-klient.md
│
├── api/
│   └── .well-known/agent-card.json
│
├── fonts/                        ← self-hosted Fraunces + Inter (RODO clean)
└── vendor/                       ← self-hosted React UMD (demo)
```

---

## 🔐 Secrets / credentials referenced (NIE w repo)

Wszystkie wrażliwe dane są **TYLKO** w:
- Supabase Functions Secrets (dashboard)
- 1Password / Apple Notes (Nicolas + Dominika osobno)
- Stripe Dashboard (po stronie Stripe)
- Resend Dashboard (po stronie Resend)
- OVH DNS Zone (po stronie OVH)

**W repo NIE MA:**
- Stripe Secret Key (`sk_live_...` / `sk_test_...`)
- Stripe Webhook Secret (`whsec_...`)
- Resend API Key (`re_...`)
- Supabase Service Role Key
- Hasła do żadnych kont

GitHub Secret Scanning push protection włączone - testowane (zablokowało wcześniejszy placeholder w docs).

---

## 📊 Live verification log

Ostatnie sprawdzenie (zaktualizowane przy każdym commit do tego pliku):

```
✅ https://zaproszeniaonline.com/                                    HTTP 200
✅ https://zaproszeniaonline.com/demo                                HTTP 200
✅ https://zaproszeniaonline.com/blog                                HTTP 200
✅ https://zaproszeniaonline.com/blog/cyfrowe-vs-papierowe-...       HTTP 200
✅ https://zaproszeniaonline.com/blog/ile-kosztuje-...               HTTP 200
✅ https://zaproszeniaonline.com/blog/potwierdzanie-...              HTTP 200
✅ https://zaproszeniaonline.com/blog/rsvp-na-wesele-co-to-znaczy   HTTP 200
✅ https://zaproszeniaonline.com/blog/zaproszenia-slubne-bez-...     HTTP 200
✅ https://zaproszeniaonline.com/blog/zaproszenie-slubne-online-...  HTTP 200
✅ https://zaproszeniaonline.com/blog/zaproszenie-slubne-qr-kod      HTTP 200
✅ https://zaproszeniaonline.com/sitemap.xml                         HTTP 200 (13 URL)
✅ https://zaproszeniaonline.com/robots.txt                          HTTP 200
✅ https://zaproszeniaonline.com/llms.txt                            HTTP 200
✅ Stripe webhook endpoint (POST bez signature):                     HTTP 400 "Missing signature" (oczekiwane)
✅ Stripe webhook endpoint (POST z fake signature):                  HTTP 400 "No signatures found matching..." (oczekiwane — sekrety OK)
```

---

## 🎯 Outstanding tasks (otwarte)

### KRYTYCZNE (przed marketing GO)
✅ Wszystko zamknięte 2026-05-11. Marketing-go odblokowane.

### NICE-TO-HAVE (po marketing start)
- Bing Webmaster Tools verify
- Plausible Analytics (jeśli chcemy detalu poza Vercel)
- Trademark UPRP (~800 zł, po pierwszych ~20 sprzedażach)
- KSeF setup (gdy przekroczymy próg działalności nieewidencjonowanej)

---

## 📜 Git log (ostatnie 10)

```
8ccceca feat: IndexNow key file dla Bing
fb7d1df Blog FAZA 2: 4 nowe artykuły SEO dla Google long-tail
ac7129b fix(schema): GSC warnings - Service review usunięte
c5e7fcd fix(schema): Product aggregateRating + review
8166583 ai-layer: day-5/7 tests + fixes
ddddd8f docs: instrukcja Stripe dla Dominiki (v1)
ffb386f docs: instrukcja Stripe v2 - Dominika kopiuje klucze
ba206bf feat(emails): signature 'Zespół Zaproszenia Online'
9a55b93 feat(emails): brand-aligned HTML templates v2
f4bf562 fix(seo): /blog trailing slash + #paragraf-6 anchor
```

---

## 🛡️ Status legal

- **Forma:** działalność nieewidencjonowana (art. 5 ust. 1 ustawy z 6.03.2018 - Prawo przedsiębiorców)
- **Limit miesięczny:** 3 499,50 zł brutto (50% min wynagrodzenia 2026)
- **VAT:** zwolniony (nie jest podatnikiem)
- **Dokument:** rachunek (nie faktura VAT), na żądanie klienta
- **Plan eskalacji:** przy przekroczeniu limitu → JDG w 7 dni → przejście na fakturę VAT z zwolnieniem podmiotowym (art. 113)
