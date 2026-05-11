# Architecture - zaproszeniaonline.com

End-to-end mapa systemu. Czytasz po `ONBOARDING_CLAUDE.md`.

---

## 1. High-level flow

```
USER (klient)
  │
  ├─① wchodzi na zaproszeniaonline.com (Vercel CDN, static HTML)
  │   ┌────────────────────────────────────────────┐
  │   │ Vercel Edge Network                         │
  │   │ - Static assets (HTML/CSS/JS/fonts/images) │
  │   │ - Cache headers per vercel.json             │
  │   │ - Auto-deploy on git push to main           │
  │   └────────────────────────────────────────────┘
  │
  ├─② wypełnia formularz na /#kontakt
  │   │ (6 sekcji <details> accordion: para, paleta, zdjęcia, historia, funkcje, kontakt)
  │   │
  │   ↓ JS fetch POST
  │   ┌────────────────────────────────────────────┐
  │   │ Supabase REST API                           │
  │   │ POST /rest/v1/leads                         │
  │   │ Header: Prefer: return=minimal (RLS hack)  │
  │   └────────────────────────────────────────────┘
  │
  ├─③ INSERT do public.leads
  │   │
  │   ↓ Postgres trigger
  │   ┌────────────────────────────────────────────┐
  │   │ leads_notify_new_lead trigger              │
  │   │ AFTER INSERT FOR EACH ROW                  │
  │   │ → supabase_functions.http_request()        │
  │   │ → POST /functions/v1/notify-new-lead       │
  │   └────────────────────────────────────────────┘
  │
  ├─④ Edge Function notify-new-lead
  │   │ → 2 calls do Resend API równolegle:
  │   │    a) Operator alert do Nicolas + Dominika
  │   │    b) Customer auto-confirmation do leada.email
  │   │ → status 200 (lub 207 jeśli częściowy fail)
  │
  ├─⑤ JS redirect → Stripe Payment Link
  │   │ buy.stripe.com/28E00i2UgfYsayo8XQgMw01
  │   │ ?prefilled_email=<email>&client_reference_id=<lead_id>
  │   │
  │   ↓ klient płaci BLIK/karta
  │
  ├─⑥ Stripe webhook
  │   │ POST /functions/v1/stripe-webhook
  │   │ Headers: stripe-signature (HMAC-SHA256)
  │   │
  │   ↓ Edge Function weryfikuje signature
  │   ↓ Switch po event.type:
  │   │   - checkout.session.completed → UPDATE leads SET payment_status='paid'
  │   │   - charge.refunded → UPDATE leads SET payment_status='refunded'
  │   │   - payment_intent.payment_failed → UPDATE leads SET payment_status='cancelled'
  │
  ├─⑦ UPDATE public.leads SET payment_status='paid'
  │   │
  │   ↓ Postgres trigger (WHEN clause)
  │   ┌────────────────────────────────────────────┐
  │   │ leads_notify_payment_success trigger       │
  │   │ AFTER UPDATE WHEN paid AND transition      │
  │   │ → POST /functions/v1/notify-payment-success│
  │   └────────────────────────────────────────────┘
  │
  └─⑧ Edge Function notify-payment-success
      │ → 2 maile via Resend:
      │    a) Operator OPŁACONE alert (z amount + Stripe link)
      │    b) Customer payment confirmation
      ↓
   KONIEC pipeline (klient czeka 24h na link do podglądu strony)
```

---

## 2. Component matrix

| Komponent | Tech | Hosting | Plik główny | Status |
|---|---|---|---|---|
| **Landing** | HTML+CSS+vanilla JS | Vercel | `index.html` | ✅ live |
| **Demo zaproszenia** | React UMD (self-host) | Vercel | `demo.html`, `magda-tomek.html` | ✅ live |
| **Legal pages** | static HTML | Vercel | `privacy.html`, `terms.html`, `returns.html`, `cookies.html` | ✅ live |
| **Blog** | static HTML | Vercel | `blog/*.html` (8 postów) | ✅ live |
| **OG image API** | Vercel Edge Function | Vercel | `api/og.ts` | ⏳ optional |
| **Lead capture API** | Supabase PostgREST | Supabase | `public.leads` | ✅ live |
| **Webhook trigger 1** | Postgres trigger + pg_net | Supabase | `leads_notify_new_lead` | ✅ live |
| **Webhook trigger 2** | Postgres trigger + pg_net | Supabase | `leads_notify_payment_success` | ✅ live |
| **Edge Function: stripe-webhook** | Deno (Stripe SDK + Supabase JS) | Supabase | `supabase/functions/stripe-webhook/` | ✅ deployed v3 |
| **Edge Function: notify-new-lead** | Deno (Resend) | Supabase | `supabase/functions/notify-new-lead/` | ✅ deployed v5 |
| **Edge Function: notify-payment-success** | Deno (Resend) | Supabase | `supabase/functions/notify-payment-success/` | ✅ deployed v5 |
| **Email transactional** | Resend API | Resend | (inline HTML w Edge Functions) | ✅ verified |
| **Payment processing** | Stripe Payment Link + Webhook | Stripe | buy.stripe.com/28E00i... | ✅ live, webhook czeka na secret |
| **DNS + email forwarding** | OVH DNS + OVH Email | OVH | DNS Zone Editor | ✅ MX/SPF/DMARC/DKIM all propagate |
| **SEO indexing** | Google Search Console + Bing | Google/Microsoft | sitemap.xml | ✅ GSC verified |

---

## 3. Data model

### `public.leads`

```sql
CREATE TABLE public.leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Lead capture (form fields)
  name                   TEXT NOT NULL,    -- "Anna i Michał"
  email                  TEXT NOT NULL,    -- klient
  phone                  TEXT,             -- opcjonalne
  event_type             TEXT,             -- 'wedding', 'engagement', 'other'
  event_date             DATE,             -- data ślubu
  package                TEXT,             -- nazwa palety lub pakiet
  message                TEXT,             -- wolne pole
  source                 TEXT NOT NULL DEFAULT 'landing',
  user_agent             TEXT,             -- z fetch headers
  referrer               TEXT,             -- z document.referrer
  
  -- Affiliate / discount
  affiliate_code         TEXT,             -- kod partnera (case-insensitive index)
  affiliate_discount_pct SMALLINT,         -- 0-100
  
  -- Payment tracking (UPDATE by stripe-webhook)
  payment_status         TEXT DEFAULT 'pending'  -- pending|paid|cancelled|refunded|failed
                           CHECK (payment_status IN (...)),
  payment_provider       TEXT,             -- 'stripe' (extensible)
  payment_id             TEXT,             -- Stripe pi_xxx
  payment_amount_pln     INTEGER,          -- w groszach (multiply by 100)
  paid_at                TIMESTAMPTZ
);
```

### RLS policies
```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public form (anon role) can ONLY INSERT
CREATE POLICY anon_insert_leads ON public.leads
  FOR INSERT TO anon WITH CHECK (true);

-- Service role (Edge Functions, dashboard) bypasses RLS automatically.
```

### Indexes
- `leads_pkey` (PRIMARY KEY on id)
- `leads_created_at_idx` - DESC for recent leads dashboard
- `leads_email_idx` - match leads by customer email (Stripe webhook lookup)
- `leads_affiliate_code_idx` - case-insensitive WHERE NOT NULL
- `idx_leads_payment_status` - filter paid/pending
- `idx_leads_payment_id` - webhook idempotency lookup
- `idx_leads_email_created` - compound (email, created_at DESC) for newest lead per email

---

## 4. Email pipeline detail

### From `kontakt@zaproszeniaonline.com` (Resend)
- **DKIM:** signed by Resend (`resend._domainkey` TXT)
- **SPF:** aligned via `send.zaproszeniaonline.com` (separate subdomain - NIE w konflikcie z root OVH MX)
- **DMARC:** `p=none` monitoring (rua reports do `rodo@`)

### To recipients
- **Operator:** `nicolasworoszylo@gmail.com` + `dominikakus333@gmail.com`
- **Customer:** `lead.email` z formularza

### Template structure (oba Edge Functions)
```
<emailShell(preheader, title, body)>
├─ <hero forest gradient>
│   ├─ Z monogram (cream circle dla customer / forest dla operator)
│   ├─ eyebrow (gold dot + uppercase tracking)
│   ├─ h1 (Georgia italic 2.1rem)
│   └─ subtitle
├─ <body>
│   ├─ 3 step rows (I/II/III circles) - tylko customer welcome
│   ├─ data table (operator alerts)
│   ├─ callouts (gold for "co przygotować", forest for "kolejny krok")
│   ├─ CTA buttons (Supabase / Stripe / mailto)
│   └─ signature (Z avatar gradient + "Zespół Zaproszenia Online")
└─ <footer>
    ├─ link nav (zaproszeniaonline.com / Demo / Blog / legal)
    └─ disclaimer dz. nieewidencjonowana
```

### Mobile responsive
- `<style>` `@media (max-width:600px)` w `<head>` (jedyne miejsce gdzie CSS-in-head sensowne dla email)
- Padding adapt, font-size adapt, h1 → 1.65rem, amount → 2.4rem
- `!important` na każdym media-query rule (defensive against Gmail/Outlook reset)

---

## 5. Caching strategy (vercel.json)

```
/.well-known/agent-card.json        → public, max-age=3600, s-maxage=86400
/(.*\.html)                          → max-age=0, s-maxage=300, must-revalidate
/                                    → max-age=0, s-maxage=300, must-revalidate
/(privacy|cookies|terms|returns|...) → max-age=0, s-maxage=300, must-revalidate
/(demo|magda-tomek)                  → max-age=600, s-maxage=86400, stale-while-revalidate=604800
/vendor/(.+)                         → max-age=31536000, immutable
/fonts/(.+)                          → max-age=31536000, immutable
/(.+\.png|svg|ico)                   → max-age=31536000, immutable
```

**Effective TTL:**
- Landing/legal: edge cache 5 min (s-maxage 300)
- Demo: 1 day edge cache (s-maxage 86400)
- Static assets: 1 year immutable (zmieniany hash przy każdym push)

---

## 6. Secrets / environment

### Supabase secrets (dashboard → Functions → Secrets)
| Secret | Used by | Source |
|---|---|---|
| `RESEND_API_KEY` | notify-new-lead, notify-payment-success | Resend Dashboard → API Keys |
| `STRIPE_SECRET_KEY` | stripe-webhook | Stripe Dashboard → API keys |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Stripe Dashboard → Webhooks → Reveal |
| `SUPABASE_URL` | (auto, all functions) | Supabase managed |
| `SUPABASE_SERVICE_ROLE_KEY` | (auto, all functions) | Supabase managed |

### Vercel env (Production)
| Var | Source | Required? |
|---|---|---|
| `SUPABASE_URL` | https://kuyniyyieejvambyjnxy.supabase.co | YES (used by landing fetch) |
| `SUPABASE_ANON_KEY` | Supabase publishable key | YES |
| `STRIPE_PAYMENT_LINK` | https://buy.stripe.com/28E00i... | YES |

(Note: landing używa `anon_key` po stronie klienta - to bezpieczne bo RLS pilnuje że anon może tylko INSERT.)

---

## 7. Failure modes + recovery

### "Mail nie dotarł do klienta po INSERT"
1. Sprawdź `net._http_response` w Supabase SQL editor:
   ```sql
   SELECT id, status_code, content::text FROM net._http_response 
   ORDER BY created DESC LIMIT 5;
   ```
2. Jeśli `Resend 401` → klucz `RESEND_API_KEY` niepoprawny, regeneruj w Resend Dashboard.
3. Jeśli `Resend 422` → invalid email format lub domain nie verified.
4. Jeśli `5xx` → przejściowy problem Resend, retry sam się odbędzie (no, pg_net nie retry - manualnie wstaw test record).

### "Stripe webhook zwraca 400 'Key length is zero'"
- `STRIPE_WEBHOOK_SECRET` w Supabase secrets jest pusty lub same spacje.
- Reveal w Stripe Dashboard → Webhooks → endpoint → Signing secret → wklej do Supabase.

### "Klient zapłacił, ale `payment_status` w bazie zostało `pending`"
1. Sprawdź czy Stripe webhook endpoint istnieje w Stripe Dashboard.
2. Sprawdź czy 3 events zaznaczone: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`.
3. Sprawdź `STRIPE_WEBHOOK_SECRET` w Supabase.
4. W Stripe Dashboard → Webhooks → endpoint → "Recent events" - czy widzisz event z 200 OK lub 400/500 error?

### "Vercel build fail"
- Sprawdź `vercel.json` - czy poprawny JSON.
- Sprawdź czy w repo nie ma plików `>50MB` (Vercel limit).
- Force redeploy: Vercel Dashboard → Deployments → Redeploy.

### "Domain DNS leci"
- `dig MX zaproszeniaonline.com @1.1.1.1 +short` - czy MX z OVH live?
- Jeśli puste → OVH DNS error, sprawdź panel.
- DNS propagation max 48h ale OVH typowo <5 min.

---

## 8. Local dev (jeśli kiedyś trzeba)

```bash
# Clone
git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git
cd zaproszenia

# Local serve (no build step - static site)
python3 -m http.server 8000
# lub: npx serve

# Test forma localnie wymaga proxy do Supabase
# Najszybciej: deploy na Vercel preview branch
git checkout -b dev/feature-name
git push -u origin dev/feature-name
# Vercel auto-deploys preview URL
```

**Edge Functions dev**
```bash
# Supabase CLI (jeśli zainstalowane)
supabase functions serve notify-new-lead --no-verify-jwt
# w innym terminalu:
curl -X POST http://localhost:54321/functions/v1/notify-new-lead \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"leads","record":{...}}'
```

---

## 9. Deployment

### Frontend
```
git push origin main → Vercel auto-deploy ~30s → zaproszeniaonline.com
```

### Edge Functions (Supabase)
**Via MCP w Claude Code:**
```
mcp__supabase__deploy_edge_function(
  project_id: "kuyniyyieejvambyjnxy",
  name: "notify-new-lead",
  entrypoint_path: "index.ts",
  verify_jwt: false,
  files: [{name: "index.ts", content: "..."}]
)
```

**Via Supabase CLI:**
```bash
supabase functions deploy notify-new-lead --no-verify-jwt --project-ref kuyniyyieejvambyjnxy
```

### Migrations
**Via MCP:**
```
mcp__supabase__apply_migration(
  project_id: "kuyniyyieejvambyjnxy",
  name: "snake_case_name",
  query: "ALTER TABLE..."
)
```

**Via CLI:**
```bash
supabase migration new <name>
# edit file in supabase/migrations/
supabase db push
```

---

## 10. Future considerations

### Skalowanie poza dz. nieewidencjonowaną
Plan eskalacji:
1. **Faza 1 (obecna):** dz. nieewidencjonowana, limit 3 499,50 zł/mc, rachunek
2. **Faza 2 (~50 sprzedaży):** JDG zwolniona z VAT (art. 113), faktura zwolniona
3. **Faza 3 (>200 tys. zł rocznie):** JDG VAT-owiec, KSeF mandatory

Każda faza wymaga:
- Update `terms.html`, `privacy.html`, `LEGAL_DATA.md`
- Update Stripe Tax behavior
- Update email templates footer (disclaimer)
- Update sitemap (jeśli URL/struktury się zmieniają)

### Multilang (PL → EN)
Jeśli kiedyś:
- `hreflang` w sitemap (już strukturalnie przygotowane)
- `/en/` folder z mirror'd HTML
- `vercel.json` redirect by Accept-Language header
- Edge Function `notify-new-lead` z `lead.locale` field
- Resend templates EN wersja

### CMS dla blogposts
Obecnie blog = static HTML. Jeśli skalujemy:
- Astro / Eleventy build step (markdown → HTML)
- Lub Notion API → cron build via Vercel cron job
- Lub Supabase table `blog_posts` + Edge Function serve
