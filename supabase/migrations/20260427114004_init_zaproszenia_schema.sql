-- Init schema for zaproszeniaonline.com
-- Applied: 2026-04-27 11:40:04 UTC
-- Reverse-engineered from live database (current state 2026-05-10)
--
-- This migration creates the `leads` table — main entry point for lead capture
-- from the landing page form. RLS enabled with anon INSERT policy + service-role
-- full access for Edge Functions.

CREATE TABLE IF NOT EXISTS public.leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  name                   TEXT NOT NULL,
  email                  TEXT NOT NULL,
  phone                  TEXT,
  event_type             TEXT,
  event_date             DATE,
  package                TEXT,
  message                TEXT,
  source                 TEXT NOT NULL DEFAULT 'landing',
  user_agent             TEXT,
  referrer               TEXT,
  affiliate_code         TEXT,
  affiliate_discount_pct SMALLINT
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);
CREATE INDEX IF NOT EXISTS leads_affiliate_code_idx
  ON public.leads (UPPER(affiliate_code))
  WHERE affiliate_code IS NOT NULL;

-- RLS — public form (anon role) can INSERT only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_insert_leads ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Service role (Edge Functions, dashboard) bypasses RLS automatically.
-- Note: returning rows from INSERT requires Prefer: return=minimal header
-- (RLS without SELECT policy would otherwise block PostgREST RETURNING).
COMMENT ON TABLE public.leads IS
  'Lead capture from landing form. RLS anon INSERT only — frontend posts via PostgREST with Prefer: return=minimal.';
