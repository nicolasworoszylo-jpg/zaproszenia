-- 2026-04-30: payment columns na tabeli leads (Stripe placeholder)
-- Apply: Supabase Studio → SQL Editor → paste + Run
-- Albo: supabase db push (jeśli używasz CLI)

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_provider    TEXT,
  ADD COLUMN IF NOT EXISTS payment_id          TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount_pln  INTEGER;

COMMENT ON COLUMN public.leads.payment_status     IS 'pending | paid | refunded | cancelled';
COMMENT ON COLUMN public.leads.payment_provider   IS 'stripe | manual | other';
COMMENT ON COLUMN public.leads.payment_id         IS 'Stripe Payment Intent ID lub zewnętrzna referencja';
COMMENT ON COLUMN public.leads.payment_amount_pln IS 'Finalna cena w groszach (699 PLN = 69900)';

-- Index dla fast lookup po payment_status (np. dashboard "ile niezapłaconych")
CREATE INDEX IF NOT EXISTS leads_payment_status_idx ON public.leads (payment_status);
