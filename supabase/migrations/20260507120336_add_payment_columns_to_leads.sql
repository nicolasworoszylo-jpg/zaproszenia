-- Add Stripe payment tracking columns to leads
-- Applied: 2026-05-07 12:03:36 UTC
--
-- These columns track Stripe payment state for each lead. Updated by the
-- `stripe-webhook` Edge Function when Stripe sends checkout.session.completed,
-- charge.refunded, or payment_intent.payment_failed events.
--
-- Status flow: pending → paid (success) → refunded / cancelled (alternate paths)
-- Amount stored in groszy (multiply by 100, Stripe convention).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded', 'failed')),
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount_pln INTEGER,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON public.leads (payment_status);
CREATE INDEX IF NOT EXISTS idx_leads_payment_id
  ON public.leads (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email_created
  ON public.leads (email, created_at DESC);

COMMENT ON COLUMN public.leads.payment_status IS
  'pending|paid|cancelled|refunded|failed (managed by stripe-webhook Edge Function)';
COMMENT ON COLUMN public.leads.payment_provider IS
  'stripe (extensible: paypal, p24, blik)';
COMMENT ON COLUMN public.leads.payment_id IS
  'Stripe payment_intent_id (pi_xxx)';
COMMENT ON COLUMN public.leads.payment_amount_pln IS
  'Amount in groszy (multiply by 100, Stripe convention)';
