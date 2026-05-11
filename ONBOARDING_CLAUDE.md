# Onboarding - dla każdego Claude Code podejmującego ten projekt

**Cześć Claude.** Jeśli Cię tu wywołano - znaczy że pracujesz nad **zaproszeniaonline.com**. Ta strona ma 60 sekund Twojego czasu i potem wiesz wszystko.

---

## 1. Co to jest

**zaproszeniaonline.com** - premium polskie cyfrowe zaproszenia ślubne. **699 zł flat, 24h realizacji.** Statyczna strona (HTML+CSS+vanilla JS) + Supabase backend (lead capture + payment tracking + email automation) + Stripe (płatności) + Resend (transactional email).

**Owner:** Nicolas Woroszyło (Vidok Studio). **Status prawny:** działalność nieewidencjonowana (art. 5 ust. 1 PrzedsU) do limitu 3 499,50 zł/mc.

**Partner biznesowy:** Dominika Kuś (osoba upoważniona art. 29 RODO, nie współadministrator).

---

## 2. Stack - 60-sekundowy obraz

```
┌──────────────────────────────────────────────────────────────┐
│  KLIENT                                                       │
│     │                                                         │
│     ↓ wypełnia formularz                                      │
│  zaproszeniaonline.com  (Vercel, static HTML+CSS+vanilla JS)  │
│     │                                                         │
│     ↓ POST + Prefer: return=minimal                           │
│  Supabase REST API → INSERT public.leads                      │
│     │                                                         │
│     ├──► trigger leads_notify_new_lead                        │
│     │       → supabase_functions.http_request                 │
│     │       → Edge Function notify-new-lead                   │
│     │       → Resend API (RESEND_API_KEY)                     │
│     │       → 2 maile: operator alert + customer confirm      │
│     │                                                         │
│     ↓ redirect po INSERT                                      │
│  Stripe Payment Link (buy.stripe.com/28E00i2UgfYsayo8XQgMw01) │
│     │                                                         │
│     ↓ klient płaci                                            │
│  Stripe webhook → /functions/v1/stripe-webhook                │
│     │                                                         │
│     ↓ UPDATE leads SET payment_status='paid'                  │
│  trigger leads_notify_payment_success                         │
│     → Edge Function notify-payment-success                    │
│     → Resend: operator OPŁACONE + customer payment confirm    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Kluczowe URL - zapamiętaj na zawsze

| Co | URL |
|---|---|
| Live landing | https://zaproszeniaonline.com |
| Demo zaproszenia | https://zaproszeniaonline.com/demo |
| Drugie demo | https://zaproszeniaonline.com/magda-tomek |
| Repo | https://github.com/nicolasworoszylo-jpg/zaproszenia |
| Supabase Dashboard | https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy |
| Supabase project ref | `kuyniyyieejvambyjnxy` |
| Vercel project | `zaproszenia-ddli` (prj_0uMw2SNx6v5F0OQbgrCp1gKgug5F) |
| Stripe Payment Link | https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01 |
| Stripe webhook URL | https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook |
| Resend domain | zaproszeniaonline.com (Verified, eu-west-1) |

---

## 4. Brand tokens (NIGDY nie odchodź)

```css
--accent:   #2C3E2D;    /* forest green (jedyny prawdziwy akcent) */
--accent-h: #1E2B1F;    /* hover deeper */
--gold:     #C9A96E;    /* używany tylko w 1-2 miejscach (favicon, og, sub-accent) */
--bg:       #FFFFFF;
--ink:      #0A0A0A;
--ink-soft: #4A4A4A;
--ink-mute: #999999;
--line:     #EBEBEB;

--serif:    'Fraunces', Georgia, 'Times New Roman', serif;
--sans:     'Inter', system-ui, -apple-system, sans-serif;

--ease:     cubic-bezier(0.16, 1, 0.3, 1);
--spring:   linear(...) /* Apple spring physics curve */
```

**Logo:** monogramowy "Z" w italic Fraunces, ciemny forest na cream lub odwrotnie.
**OG image:** `/og-square.png` (53 KB).
**Favicon:** `/favicon.svg` + PNG fallbacki.

---

## 5. Struktura repo - co gdzie

```
/                                  ← static site (Vercel deploy główny)
├── index.html                     ← landing
├── demo.html, magda-tomek.html    ← demo zaproszeń
├── dziekujemy.html                ← Stripe success
├── platnosc-anulowana.html        ← Stripe cancel
├── privacy.html, terms.html, returns.html, cookies.html  ← legal
├── sitemap.xml, robots.txt, llms.txt
├── vercel.json                    ← cache headers + clean URLs + trailingSlash:false
│
├── blog/                          ← 8 SEO articles + index
├── api/og.ts                      ← Vercel Edge Function dla og:image
├── fonts/                         ← self-hosted Fraunces + Inter (RODO clean)
├── vendor/                        ← self-hosted React UMD dla demo
│
├── supabase/
│   ├── functions/                 ← Edge Functions (Deno)
│   │   ├── stripe-webhook/        ← Stripe events → UPDATE leads
│   │   ├── notify-new-lead/       ← INSERT trigger → Resend
│   │   ├── notify-payment-success/ ← UPDATE→paid → Resend
│   │   └── notify-on-new-lead/    ← LEGACY (do usunięcia, zastąpione przez notify-new-lead)
│   └── migrations/                ← SQL migrations
│       ├── 20260427114004_init_zaproszenia_schema.sql
│       ├── 20260507120336_add_payment_columns_to_leads.sql
│       └── 20260507195903_database_webhooks_for_lead_notifications.sql
│
├── stripe-assets/                 ← logo + brand info + setup docs (do Stripe Dashboard upload)
├── legal-templates/               ← art. 26/28 RODO templates
│
├── README.md                      ← public-facing intro (open source NIE - copyright Vidok)
├── LICENSE.md                     ← All Rights Reserved
├── LEGAL_DATA.md                  ← business data (działalność nieewidencjonowana)
├── PROJECT_STATUS.md              ← live snapshot stanu projektu
├── ARCHITECTURE.md                ← end-to-end system flow
├── ONBOARDING_CLAUDE.md           ← TEN PLIK
├── HANDOFF_NICOLAS_v2.md          ← per-session handoff
├── STRIPE_SETUP.md                ← Stripe setup ref
├── DOMINIKA_STRIPE_INSTRUKCJA.md  ← tutorial Stripe dla Dominiki
├── CLAUDE_IN_CHROME_MASTER.md     ← DMARC + Resend + GSC prompts dla Claude in Chrome
└── ai-layer-tests/                ← test runs dla ai-layer (Day 1-5)
```

---

## 6. Zasady "święte" - nigdy nie łam

### Filozofia kodu
1. **Chirurgia > rebuild.** <30% zmian = surgical edit. Nie przepisuj od zera tego co działa.
2. **Vanilla JS na landing.** Bez React/Vue/Svelte na index.html. Demo używa React UMD self-hosted.
3. **Self-hosted everything** - fonty (/fonts/), JS (/vendor/), zero CDN third-party (RODO clean).
4. **Schema.org wszędzie.** Service + AggregateRating + Review + FAQPage + BlogPosting + BreadcrumbList.
5. **WCAG 2.2.** Focus visible, prefers-reduced-motion, 44px touch targets, semantic HTML.

### Filozofia brand
1. **Polski only** (ani angielski na landing).
2. **Forest green + gold accent.** Żadnych innych kolorów. Gold tylko w 1-2 miejscach.
3. **Bez emoji w tekście.** Wyjątek: trust signals (★), success badges (✓), preheader (rare).
4. **Profesjonalny ale luźny** - Vidok Studio voice. Bez korpomowy.
5. **Bez em-dashy** (-) ani półpauz (-). Zwykły dywiz `-`.

### Legal
1. **Działalność nieewidencjonowana** - bez NIP, bez VAT, rachunek zamiast faktury, limit 3 499,50 zł/mc.
2. **Pojedynczy administrator danych** (Nicolas) + Dominika jako osoba upoważniona art. 29 RODO. **Nie współadministrator.**
3. **Stripe DPA + Vercel DPA + Supabase DPA** są wpięte automatycznie przy używaniu usług.

---

## 7. Co zrobić jak coś dodajesz

### Dodawanie blog post
1. Stwórz `blog/slug-postu.html` (template: skopiuj `blog/cyfrowe-vs-papierowe-zaproszenia-slubne.html` i podmień)
2. Dodaj wpis do `blog/index.html` (sekcja `.posts`)
3. Dodaj URL do `sitemap.xml` (priority 0.7, monthly)
4. Sprawdź Schema.org BlogPosting + BreadcrumbList + opcjonalnie FAQPage
5. Commit + push (Vercel auto-deploy)

### Modyfikacja landing (index.html)
1. **NAJPIERW** sprawdź czy zmiana <30% - jeśli tak, chirurgia (Edit tool, nie Write).
2. **NIGDY** nie zmieniaj brand colors bez wyraźnej zgody Nicolasa.
3. **NIGDY** nie usuwaj `prefers-reduced-motion` fallbacks.
4. **NIGDY** nie dodawaj third-party JS bez self-host.
5. Test responsywności na 540px (mobile breakpoint).

### Edge Function changes
1. Edytuj `supabase/functions/<name>/index.ts`.
2. Deploy via MCP: `mcp__supabase__deploy_edge_function` (project_id: `kuyniyyieejvambyjnxy`).
3. `verify_jwt: false` dla webhooks (stripe-webhook, notify-*). `true` dla user-facing.
4. Commit po deploy żeby repo był sync.

### Database changes
1. Stwórz `supabase/migrations/YYYYMMDDHHMMSS_nazwa.sql`.
2. Apply via MCP: `mcp__supabase__apply_migration`.
3. Commit po sukcesie.
4. Sprawdź czy nie psujesz RLS policies.

### Email template changes
1. Edytuj inline HTML w `notify-new-lead/index.ts` lub `notify-payment-success/index.ts`.
2. Brand-aligned: forest gradient hero, Z monogram, gold accents, Georgia italic, max-width 600.
3. Mobile-responsive `@media (max-width:600px)` inline `<style>` w `<head>`.
4. Preheader (display:none) z preview text.
5. Deploy + test (insert lead → sprawdź `net._http_response`).

---

## 8. Czego NIE zrobisz nigdy

| Zakaz | Powód |
|---|---|
| Nie zmieniaj brand colors (forest #2C3E2D + gold #C9A96E) | Brand consistency |
| Nie dodawaj NIP/REGON do legal docs | Działalność nieewidencjonowana = bez NIP |
| Nie wprowadzaj "współadministrator" Nicolas+Dominika | Tylko Nicolas = administrator, Dominika = art. 29 RODO |
| Nie commituj prawdziwych Stripe / Resend / Supabase kluczy | GitHub Secret Scanning blokuje + ryzyko leak |
| Nie usuwaj `prefers-reduced-motion` | A11y wymóg |
| Nie dodawaj reklam Google Analytics / GTM | RODO + Vercel Analytics wystarczy |
| Nie pisz em-dashy `-` ani półpauz `-` | Brand voice (typowy AI tell) |
| Nie używaj `git push --force` na main | Bez wyraźnej zgody Nicolasa |
| Nie dodawaj zewnętrznych fontów z Google Fonts CDN | Self-host w /fonts/ (RODO) |
| Nie wprowadzaj "Faktura VAT" w copy | "Rachunek" - działalność nieewidencjonowana |

---

## 9. Test scenarios (przed każdym dużym commit)

### Smoke test (zawsze)
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://zaproszeniaonline.com/      # 200
curl -s -o /dev/null -w "%{http_code}\n" https://zaproszeniaonline.com/demo  # 200
curl -s -o /dev/null -w "%{http_code}\n" https://zaproszeniaonline.com/blog  # 200
curl -s -o /dev/null -w "%{http_code}\n" https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook  # 200 lub 405
```

### Email pipeline test (po zmianach w Edge Functions)
```sql
-- Test 1: INSERT trigger
INSERT INTO public.leads (name, email, source) 
VALUES ('Test Para', 'nicolasworoszylo@gmail.com', 'verifier-test') 
RETURNING id;

-- Wait 5s, then check response
SELECT id, status_code, content::text FROM net._http_response 
WHERE created > now() - interval '20 seconds' ORDER BY created DESC LIMIT 3;

-- Test 2: UPDATE trigger (payment_status='paid')
UPDATE public.leads SET payment_status='paid', payment_amount_pln=69900 
WHERE id='<test-uuid>';

-- Cleanup
DELETE FROM public.leads WHERE source='verifier-test';
```

Oczekiwane: `status_code: 200`, `body: {"received":true,"lead_id":"..."}`. 
Jeśli `Resend 401` → klucz w Supabase secrets niepoprawny.

---

## 10. Co masz pod ręką (tooling)

### MCPs które używasz
- `mcp__supabase__*` - list/apply migrations, deploy edge functions, execute SQL
- `mcp__zapier__gmail_send_email` - emaile do klienta z załącznikami
- `mcp__comet__*` - Comet browser (Perplexity) automation
- `mcp__Claude_in_Chrome__*` - sterowanie Chrome (gdy potrzebny login z 2FA)
- `WebFetch`, `WebSearch` - research

### Skille Nicolasa (`~/.claude/skills/`)
Aktywuj automatycznie wg auto-routera w `~/.claude/CLAUDE.md`:
- `chirurg-kodu` - chirurgiczne edycje HTML/CSS
- `taste-skill` - premium UI/UX guard (anti-AI-slop)
- `seo-aeo-geo-master` - SEO/AEO/GEO
- `prawnik` - prawne (zwłaszcza RODO)
- `work-verifier` - weryfikacja jakości (10 warstw)
- `ultramode` - modyfikator jakości (na sygnał "dla klienta")
- `dyrygentura` / `umysl-ula` - meta-orkiestratory

---

## 11. Outstanding (sprawdź zawsze `PROJECT_STATUS.md` - single source of truth dla bieżącego stanu)

W skrócie (na czas pisania tego pliku, 2026-05-10):
- 🟢 Wszystko działa poza Stripe webhook secret
- 🔴 `STRIPE_WEBHOOK_SECRET` w Supabase nadal pusty (czeka na Dominikę)
- 🔴 Stripe Branding + Customer emails TODO Dominika

---

## 12. Jak zacząć - pierwsze 5 minut

```bash
# 1. Clone
git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git
cd zaproszenia

# 2. Live status check
curl -s https://zaproszeniaonline.com/                  # 200
curl -s https://zaproszeniaonline.com/sitemap.xml | grep -c '<loc>'  # 13

# 3. Sprawdź ostatni stan
cat PROJECT_STATUS.md

# 4. Sprawdź co miałeś robić
cat HANDOFF_NICOLAS_v2.md   # ostatni handoff per session

# 5. Jeśli zmieniasz coś - przeczytaj zasady
cat ONBOARDING_CLAUDE.md    # TEN PLIK (sekcja 6 + 8)
```

**Powodzenia.** Jak coś niejasne - pytaj Nicolasa, nie improwizuj.
