-- 2026-05-16: Per-code dedicated Stripe Payment Link routing.
--
-- Cel: po wpisaniu kodu rabatowego frontend od razu kieruje na DEDYKOWANY
-- Stripe Payment Link z juz zaaplikowanym discount (klient widzi obnizona
-- cene od razu, bez wpisywania kodu w checkout). Default link 699 zl
-- uzywany jako fallback gdy kod nie ma mapped URL.
--
-- Zmiany:
--   1. ADD COLUMN discount_codes.stripe_payment_link_url
--   2. Podniesienie check constraint na discount_pct z <=50 do <=99
--      (test coupon HIPERFIKSACJA = 99% off)
--   3. RPC validate_discount_code zwraca dodatkowo stripe_payment_link_url

-- 1. Nowa kolumna
ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS stripe_payment_link_url text;

COMMENT ON COLUMN public.discount_codes.stripe_payment_link_url IS
  'Pelny URL https://buy.stripe.com/... dedykowany dla tego kodu (z applied price). NULL = fallback do default Payment Link + prefilled_promo_code.';

-- 2. Update constraint
ALTER TABLE public.discount_codes DROP CONSTRAINT IF EXISTS discount_codes_discount_pct_check;
ALTER TABLE public.discount_codes
  ADD CONSTRAINT discount_codes_discount_pct_check CHECK (discount_pct >= 0 AND discount_pct <= 99);

-- 3. RPC update (DROP + CREATE bo zmienia typ zwracany)
DROP FUNCTION IF EXISTS public.validate_discount_code(text);

CREATE FUNCTION public.validate_discount_code(p_code text)
 RETURNS TABLE(valid boolean, discount_pct smallint, owner_name text, reason text, stripe_payment_link_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rec record;
  normalized text := upper(trim(coalesce(p_code, '')));
begin
  if normalized = '' then
    return query select false, 0::smallint, null::text, 'empty'::text, null::text;
    return;
  end if;

  select dc.discount_pct, dc.owner_name, dc.active, dc.max_uses, dc.uses_count, dc.expires_at, dc.stripe_payment_link_url
    into rec
  from public.discount_codes dc
  where upper(dc.code) = normalized;

  if not found then
    return query select false, 0::smallint, null::text, 'not_found'::text, null::text;
  elsif not rec.active then
    return query select false, 0::smallint, null::text, 'inactive'::text, null::text;
  elsif rec.expires_at is not null and rec.expires_at < now() then
    return query select false, 0::smallint, null::text, 'expired'::text, null::text;
  elsif rec.max_uses is not null and rec.uses_count >= rec.max_uses then
    return query select false, 0::smallint, null::text, 'max_uses_reached'::text, null::text;
  else
    return query select true, rec.discount_pct, rec.owner_name, 'ok'::text, rec.stripe_payment_link_url;
  end if;
end $function$;

GRANT EXECUTE ON FUNCTION public.validate_discount_code(text) TO anon, authenticated;
