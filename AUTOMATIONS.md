# Automations — co się dzieje samo

Lista wszystkich automatyzacji w projekcie. Triggers, schedules, hooks.

---

## 1. Database Webhooks (Postgres triggers)

### `leads_notify_new_lead`
- **Tabela:** `public.leads`
- **Event:** `AFTER INSERT FOR EACH ROW`
- **Action:** HTTP POST do `notify-new-lead` Edge Function
- **Payload:** `{ type: "INSERT", table: "leads", schema: "public", record: {...} }`
- **Source:** [`supabase/migrations/20260507195903_database_webhooks_for_lead_notifications.sql`](./supabase/migrations/20260507195903_database_webhooks_for_lead_notifications.sql)
- **Status:** ✅ active

### `leads_notify_payment_success`
- **Tabela:** `public.leads`
- **Event:** `AFTER UPDATE FOR EACH ROW WHEN (NEW.payment_status='paid' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status)`
- **Action:** HTTP POST do `notify-payment-success` Edge Function
- **Payload:** `{ type: "UPDATE", table: "leads", schema: "public", record: {...}, old_record: {...} }`
- **Source:** same migration as above
- **Status:** ✅ active

---

## 2. Stripe Webhooks (external → us)

### Endpoint
`https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook`

### Subscribed events
| Event | Action |
|---|---|
| `checkout.session.completed` | UPDATE leads SET payment_status='paid' (match by email) |
| `charge.refunded` | UPDATE leads SET payment_status='refunded' (match by payment_id) |
| `payment_intent.payment_failed` | UPDATE leads SET payment_status='cancelled' (match by payment_id) |

### Verification
HMAC-SHA256 via `stripe.webhooks.constructEventAsync()` z secretem `STRIPE_WEBHOOK_SECRET`.

### Source
[`supabase/functions/stripe-webhook/index.ts`](./supabase/functions/stripe-webhook/index.ts)

---

## 3. Vercel Auto-Deploy

### Trigger
`git push origin main` (lub merge PR do main)

### Action
Vercel webhook → build (zero build dla static, instant) → atomic swap → CDN propagation ~30s.

### Settings
- Production branch: `main`
- Preview branches: every other branch
- Build command: (none, static)
- Output directory: `/`
- `vercel.json` definiuje rewrites, headers, cleanUrls, trailingSlash:false

---

## 4. Edge Functions (Supabase, on-demand)

### `notify-new-lead` (auto-triggered by DB)
- Trigger: Postgres `leads_notify_new_lead`
- Action: 2 maile parallel → Resend API
- Idempotent: NO (każdy INSERT odpala raz — nie ma deduplikacji)
- Status: ✅ v5 active

### `notify-payment-success` (auto-triggered by DB)
- Trigger: Postgres `leads_notify_payment_success` (WHEN clause)
- Action: 2 maile parallel → Resend
- Idempotent: YES (WHEN clause + Edge Function double-check `OLD.payment_status='paid'` returns skipped)
- Status: ✅ v5 active

### `stripe-webhook` (external trigger from Stripe)
- Trigger: Stripe sends POST (po wpłacie / refund / fail)
- Action: verify signature → UPDATE leads (kaskada triggerów notify-payment-success)
- Status: ✅ v3 active, ale `STRIPE_WEBHOOK_SECRET` nadal pusty (placeholder)

---

## 5. SEO indexing

### Google Search Console
- Property: zaproszeniaonline.com (Domain property, pokrywa http+https+www+non-www)
- Verification: TXT record (`google-site-verification=...`) w OVH DNS
- Sitemap submitted: `/sitemap.xml` (13 URL: 1 root + 1 blog index + 8 posts + 4 legal)
- Auto-fetch interval: ~daily

### Bing Webmaster
- Status: ⏳ optional (instrukcja w `CLAUDE_IN_CHROME_MASTER.md`)
- IndexNow key file: `06025c5dee34aceed2b01743598512e4.txt` (już w repo)

### llms.txt
- Path: `/llms.txt` + `/llms-full.txt`
- Format: zgodny ze specem [llmstxt.org](https://llmstxt.org)
- Cel: AI bots (ChatGPT, Claude, Perplexity, Gemini) mogą cytować markę precyzyjnie

### robots.txt
- Allow: GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, GoogleOther, Applebot-Extended, Bytespider
- Disallow: /demo, /magda-tomek (są realnymi linkami klientów, nie chcemy ich w SERP)
- Sitemap: zaproszeniaonline.com/sitemap.xml

---

## 6. Email forwarding (OVH)

### Aktywne aliasy (8/1000 limit)
| Alias | Forward to |
|---|---|
| `kontakt@zaproszeniaonline.com` | nicolasworoszylo@gmail.com, dominikakus333@gmail.com |
| `zamowienia@zaproszeniaonline.com` | nicolasworoszylo@gmail.com, dominikakus333@gmail.com |
| `faktury@zaproszeniaonline.com` | nicolasworoszylo@gmail.com, dominikakus333@gmail.com |
| `rodo@zaproszeniaonline.com` | nicolasworoszylo@gmail.com, dominikakus333@gmail.com |

### DNS records (zweryfikowane)
- `MX root` → mx1/2/3.mail.ovh.net (priorities 1/5/100) — OVH forwarding (inbound)
- `SPF root` → `v=spf1 include:mx.ovh.com -all` — hardfail (wszystko spoza OVH = spam)
- `DMARC` → `v=DMARC1; p=none; rua=mailto:rodo@...` — monitoring tylko (na razie)
- `DKIM resend._domainkey` → Resend public key (outbound)
- `MX send.zaproszeniaonline.com` → feedback-smtp.eu-west-1.amazonses.com (Resend bounce)
- `SPF send.zaproszeniaonline.com` → `v=spf1 include:amazonses.com ~all` (Resend)

### Privacy
- "Nie zachowuj kopii" tryb w OVH → privacy-clean (maile nie zostają na OVH serverach)
- DMARC reports `rua` → trafiają na `rodo@` (forwardowane do Gmail)

---

## 7. Schema.org indexing (rich snippets)

### W index.html (landing)
- `Organization` — branding info
- `Service` — pakiet 699 zł z aggregateRating (4.9/5) i 3 reviews
- `FAQPage` — 8 pytań z odpowiedziami
- `HowTo` — 3 kroki "Jak to działa"
- `Product` — pakiet kompletny
- `BreadcrumbList`

### W blog posts (każdy)
- `BlogPosting` — autor, data, wordcount, keywords
- `BreadcrumbList` — nav trail
- Opcjonalnie `FAQPage` (4-8 pytań)

### W blog/index.html
- `Blog` — meta o całym blogu
- `ItemList` — lista postów z descriptions

---

## 8. Vercel Web Analytics (opt-in)

Skrypt `<script defer src="/_vercel/insights/script.js"></script>` w `<head>` każdej strony. Cookieless, GDPR-friendly, brak third-party.

Mierzy: page views, top pages, top referrers, top countries, top devices.

Free tier: 2500 events/mc (więcej niż wystarczy dla zaproszeniaonline).

---

## 9. Future automations (jeśli dodajemy)

### Weekly SEO report (nice-to-have)
LaunchAgent Nicolasa lokalnie → fetch GSC API → markdown raport w `~/Desktop/Claude/zaproszenia/seo-reports/`.

### Lead nurture (3-touch email sequence)
Gdyby chcielibyśmy 7-dniowy follow-up dla "abandoned cart" (formularz wypełniony ale brak płatności):
- Database webhook po INSERT do `lead_followups` table
- Resend scheduled emails (3 dni / 5 dni / 7 dni)

### Reminder przed wydarzeniem
30 dni przed `event_date` → mail "Czas na finalne sprawdzenie strony" do klienta.

### Calendar.ics dla klienta po paid
Po `payment_status='paid'` dołącz .ics z datą ślubu jako załącznik w Resend mailu.

---

## 10. Manual checks (powinno być raz w tygodniu)

```bash
# Health check
curl -s -o /dev/null -w "%{http_code}\n" https://zaproszeniaonline.com/

# Edge Functions status
# (przez Supabase Dashboard → Edge Functions → tabs Logs)

# Resend deliverability
# (Resend Dashboard → Logs — sprawdź % delivered vs bounced)

# Stripe webhook health
# (Stripe Dashboard → Webhooks → endpoint → Recent events — % 2xx)

# DNS sanity
dig MX zaproszeniaonline.com @1.1.1.1 +short
dig TXT _dmarc.zaproszeniaonline.com @1.1.1.1 +short

# Database growth
# SQL: SELECT count(*), payment_status FROM leads GROUP BY payment_status;
```
