-- Database Webhooks via PostgreSQL triggers + pg_net
-- Applied: 2026-05-07 19:59:03 UTC
--
-- Two triggers fire HTTP POST to Supabase Edge Functions:
--   1. leads_notify_new_lead     → AFTER INSERT  → notify-new-lead
--   2. leads_notify_payment_success → AFTER UPDATE → notify-payment-success
--
-- Edge Functions then send branded emails via Resend (operator + customer).
-- See /supabase/functions/notify-new-lead/ and /notify-payment-success/.
--
-- supabase_functions.http_request is built-in helper that auto-builds the
-- standard Supabase Webhook payload: { type, table, schema, record, old_record }.
--
-- Prerequisite: pg_net extension must be enabled (default on Supabase).

-- Webhook 1: every INSERT into leads
DROP TRIGGER IF EXISTS leads_notify_new_lead ON public.leads;
CREATE TRIGGER leads_notify_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-new-lead',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);

-- Webhook 2: UPDATE where payment_status transitions to 'paid'
-- WHEN clause prevents firing on every UPDATE — only on the transition.
-- Edge Function additionally guards against duplicates (idempotent).
DROP TRIGGER IF EXISTS leads_notify_payment_success ON public.leads;
CREATE TRIGGER leads_notify_payment_success
AFTER UPDATE ON public.leads
FOR EACH ROW
WHEN (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status))
EXECUTE FUNCTION supabase_functions.http_request(
  'https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-payment-success',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);

COMMENT ON TRIGGER leads_notify_new_lead ON public.leads IS
  'INSERT → notify-new-lead Edge Function → 2 emails via Resend (operator alert + customer auto-confirmation). Requires RESEND_API_KEY in Supabase secrets.';

COMMENT ON TRIGGER leads_notify_payment_success ON public.leads IS
  'UPDATE WHEN paid → notify-payment-success Edge Function → 2 emails via Resend (operator OPŁACONE + customer payment confirmation).';
