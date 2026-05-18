-- ============================================================
-- Briefs - klient self-service po Stripe payment
-- Data: 2026-05-18
-- Kontekst: LUZAK pipeline 100/tydz (docs/LUZAK_PIPELINE.md)
-- Workflow:
--   1. Stripe webhook -> INSERT briefs {token, email, paid_at, expires_at}
--   2. Email do klienta: /klient-start/?token=<UUID>
--   3. Klient wypelnia form -> UPDATE briefs SET data=..., status='generating'
--   4. Edge Function trigger GitHub Action
--   5. GH Action runs new-client.py -> Vercel deploy
--   6. UPDATE briefs SET status='live'
-- ============================================================

-- Enable pgcrypto dla gen_random_uuid (jeśli nie aktywne)
create extension if not exists pgcrypto;

-- Tabela briefs (idempotentna)
create table if not exists public.briefs (
  id bigserial primary key,
  token uuid not null default gen_random_uuid() unique,
  email text not null,
  -- Stripe payment connection
  payment_id text,                 -- Stripe payment_intent id
  paid_at timestamptz not null default now(),
  -- Lifecycle
  expires_at timestamptz not null default (now() + interval '30 days'),
  status text not null default 'awaiting_brief'
    check (status in ('awaiting_brief','generating','live','failed','expired')),
  slug text unique,                -- generated after submit
  -- Form data + photos (JSONB)
  data jsonb,                      -- brief fields (bride, groom, date, palette etc.)
  photos jsonb,                    -- array of Supabase Storage URLs after upload
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  deployed_at timestamptz,
  -- GitHub Action run id (debug)
  github_run_id text
);

comment on table public.briefs is
  'Self-service brief klienta. Token unikalny per klient (z mail po Stripe), wymaga validacji przed update.';
comment on column public.briefs.token is
  'UUID unikalny per klient. Wysyłany w mailu po payment, klient wpisuje w URL /klient-start/?token=...';
comment on column public.briefs.status is
  'awaiting_brief (po payment) -> generating (po form submit) -> live (po deploy) / failed / expired';

-- Indeksy
create index if not exists briefs_token_idx on public.briefs (token);
create index if not exists briefs_status_idx on public.briefs (status) where status in ('awaiting_brief','generating');
create index if not exists briefs_slug_idx on public.briefs (slug) where slug is not null;
create index if not exists briefs_email_idx on public.briefs (email);

-- Updated_at auto-trigger
create or replace function public.briefs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists briefs_updated_at on public.briefs;
create trigger briefs_updated_at
  before update on public.briefs
  for each row execute function public.briefs_set_updated_at();

-- ============================================================
-- RLS - ANON access only by valid token + status check
-- ============================================================

alter table public.briefs enable row level security;

-- SELECT - klient moze zobaczyc swoj brief jezeli ma token (nie wygasły)
drop policy if exists "anon read by token" on public.briefs;
create policy "anon read by token" on public.briefs
  for select to anon, authenticated
  using (
    -- W praktyce check przez Edge Function (header) lub query param
    -- Bezposrednio anon nie ma dostepu - tylko przez service_role w Edge Function
    false
  );

-- INSERT - tylko service_role (Edge Function notify-payment-success)
-- Anon NIE moze tworzyc briefs - tylko po prawomocnej platnosci
drop policy if exists "service_role insert" on public.briefs;
-- (brak policy = service_role bypasses RLS, anon = denied)

-- UPDATE - tylko przez Edge Function generate-from-form (service_role)
-- Anon przeszedlby fail RLS
drop policy if exists "service_role update" on public.briefs;
-- (brak policy = service_role bypasses RLS, anon = denied)

-- ============================================================
-- View pomocnicza: aktywne briefs (do admin dashboard)
-- ============================================================
create or replace view public.briefs_active as
select id, token, email, paid_at, expires_at, status, slug,
  (data->>'bride') as bride,
  (data->>'groom') as groom,
  (data->>'palette') as palette,
  created_at, updated_at, submitted_at, deployed_at
from public.briefs
where status in ('awaiting_brief','generating','live')
  and expires_at > now()
order by created_at desc;

comment on view public.briefs_active is
  'Admin dashboard list - non-expired briefs z lifecycle status.';

-- ============================================================
-- Cleanup function: oznacz wygasle briefs (cron job mozna dodac pozniej)
-- ============================================================
create or replace function public.briefs_mark_expired()
returns int language plpgsql security definer as $$
declare
  n int;
begin
  update public.briefs set status = 'expired'
    where expires_at < now() and status = 'awaiting_brief'
  returning 1 into n;
  return coalesce(n, 0);
end;
$$;
