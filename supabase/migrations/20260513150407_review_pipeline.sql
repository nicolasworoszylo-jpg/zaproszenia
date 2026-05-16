-- Review Pipeline: token w leads + tabela reviews + DB webhook trigger
-- Applied: 2026-05-13
--
-- Pipeline:
--   1. send-review-request (Edge Function, manual lub batch cron)
--      → generuje token UUID v4
--      → UPDATE leads SET review_request_token=..., review_requested_at=now()
--      → Resend mail do klienta z CTA https://zaproszeniaonline.com/opinia?t=<token>
--
--   2. Klient klika CTA → /opinia?t=<token>
--      → JS POST do submit-review Edge Function
--      → INSERT INTO reviews (lead_id, rating, comment, consent_publish, ...)
--      → UPDATE leads SET review_submitted_at=now()
--      → DB trigger reviews_notify_submitted → Edge Function notify-review-submitted
--      → 2 maile: operator ("Nowa opinia 5★") + klient ("Dziękujemy za opinię")
--
-- Idempotencja:
--   - Token jest jednorazowy; po review_submitted_at IS NOT NULL submit-review odrzuca.
--   - send-review-request pomija leady gdzie review_requested_at IS NOT NULL (chyba że force=true).

-- ─── 1. Kolumny w tabeli leads ─────────────────────────────────────────────

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS review_request_token UUID,
  ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_reminder_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_review_token
  ON public.leads (review_request_token)
  WHERE review_request_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_review_pending
  ON public.leads (paid_at)
  WHERE payment_status = 'paid'
    AND review_requested_at IS NULL;

COMMENT ON COLUMN public.leads.review_request_token IS
  'UUID jednorazowy do formularza /opinia?t=<token>. NULL = nie wysłano prośby.';
COMMENT ON COLUMN public.leads.review_requested_at IS
  'Kiedy wysłano maila z prośbą o opinię (manual lub batch).';
COMMENT ON COLUMN public.leads.review_submitted_at IS
  'Kiedy klient wypełnił formularz. NOT NULL = token zużyty.';
COMMENT ON COLUMN public.leads.review_reminder_sent_at IS
  'Kiedy wysłano przypomnienie (7 dni po prośbie, jeśli brak submit).';

-- ─── 2. Tabela reviews ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,

  -- treść opinii
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  recommend_to_others BOOLEAN,                    -- "Czy poleciliby?"
  best_part TEXT,                                 -- "Co najbardziej zaskoczyło"

  -- moderacja / publikacja
  consent_publish BOOLEAN NOT NULL DEFAULT false, -- klient zgadza się na publikację
  display_name TEXT,                              -- jak podpisać (default = leads.name pierwsze imię)
  is_published BOOLEAN NOT NULL DEFAULT false,    -- po moderacji = true
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,

  -- meta (anti-spam / debugging)
  ip_hash TEXT,                                   -- SHA256(ip || salt) - bez retencji RODO
  user_agent TEXT,
  referrer TEXT,
  honeypot_triggered BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT reviews_one_per_lead UNIQUE (lead_id)  -- klient = 1 opinia
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.reviews (is_published, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews (rating);

COMMENT ON TABLE public.reviews IS
  'Opinie klientów po zakończonej współpracy. Jedna opinia na lead_id.';
COMMENT ON COLUMN public.reviews.consent_publish IS
  'TRUE = klient pozwala publikować na stronie (jako social proof).';
COMMENT ON COLUMN public.reviews.is_published IS
  'TRUE = po ręcznej moderacji widoczne w sekcji "Co mówią pary".';
COMMENT ON COLUMN public.reviews.ip_hash IS
  'SHA256(ip||salt) - anti-spam tracking, brak osobowych danych.';

-- ─── 3. RLS - anon-insert-only via Edge Function (service_role) ────────────

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- INSERT: nie pozwalamy bezpośrednio z anon - tylko service_role (Edge Function po walidacji tokenu)
-- Anon NIE MA żadnej policy = automatycznie DENY przez RLS.

-- Publiczne SELECT tylko opublikowanych (do landingu - "Co mówią pary")
DROP POLICY IF EXISTS "anon select published reviews" ON public.reviews;
CREATE POLICY "anon select published reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- ─── 4. DB trigger: po INSERT do reviews → notify-review-submitted ─────────

DROP TRIGGER IF EXISTS reviews_notify_submitted ON public.reviews;
CREATE TRIGGER reviews_notify_submitted
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-review-submitted',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);

COMMENT ON TRIGGER reviews_notify_submitted ON public.reviews IS
  'INSERT → notify-review-submitted Edge Function → 2 maile (operator + klient).';

-- ─── 5. Helper view: kandydaci do prośby o opinię (cron-friendly) ──────────

CREATE OR REPLACE VIEW public.v_review_candidates AS
SELECT
  l.id,
  l.name,
  l.email,
  l.event_date,
  l.package,
  l.paid_at,
  EXTRACT(DAY FROM (now() - l.paid_at))::int AS days_since_paid
FROM public.leads l
WHERE l.payment_status = 'paid'
  AND l.review_requested_at IS NULL
  AND l.paid_at IS NOT NULL
  -- Jeśli event_date ustawione: czekaj 7 dni PO wydarzeniu
  -- Jeśli brak event_date: czekaj 14 dni po paid_at
  AND (
    (l.event_date IS NOT NULL AND l.event_date < (now() - interval '7 days')::date)
    OR
    (l.event_date IS NULL AND l.paid_at < (now() - interval '14 days'))
  )
ORDER BY l.paid_at ASC;

COMMENT ON VIEW public.v_review_candidates IS
  'Leady kwalifikujące się do prośby o opinię. Reguła: paid + 7 dni po wydarzeniu (lub +14d od paid jeśli brak event_date).';

-- ─── 6. Helper view: kandydaci do przypomnienia (7 dni po prośbie, brak submit) ──

CREATE OR REPLACE VIEW public.v_review_reminder_candidates AS
SELECT
  l.id,
  l.name,
  l.email,
  l.review_request_token,
  l.review_requested_at,
  EXTRACT(DAY FROM (now() - l.review_requested_at))::int AS days_since_request
FROM public.leads l
WHERE l.review_requested_at IS NOT NULL
  AND l.review_submitted_at IS NULL
  AND l.review_reminder_sent_at IS NULL
  AND l.review_requested_at < (now() - interval '7 days')
ORDER BY l.review_requested_at ASC;

COMMENT ON VIEW public.v_review_reminder_candidates IS
  'Leady które dostały prośbę 7+ dni temu ale jeszcze nie wysłały opinii. Do delikatnego przypomnienia.';

-- ─── 7. Public read view: opublikowane opinie do landingu ──────────────────

CREATE OR REPLACE VIEW public.v_published_reviews AS
SELECT
  r.id,
  r.created_at,
  r.rating,
  r.comment,
  r.best_part,
  COALESCE(r.display_name, split_part(l.name, ' ', 1)) AS display_name,
  l.event_type,
  TO_CHAR(l.event_date, 'Mon YYYY') AS event_period
FROM public.reviews r
JOIN public.leads l ON l.id = r.lead_id
WHERE r.is_published = true
ORDER BY r.created_at DESC;

COMMENT ON VIEW public.v_published_reviews IS
  'Opublikowane opinie do sekcji "Co mówią pary" na landingu - bez emaila/imienia pełnego.';

GRANT SELECT ON public.v_published_reviews TO anon, authenticated;
