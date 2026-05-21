-- ============================================================
-- Cyfrowa funkcja odstąpienia od umowy (art. 11a CRD)
-- Dyrektywa 2023/2673 - stosowanie od 19.06.2026
-- Data migracji: 2026-05-21
-- ANTI-CORRUPTION-GOLDEN: nie usuwać tabeli withdrawals ani kolumn
--                         realization_started_at, withdrawal_token.
-- Source of truth: /Users/centrum/Desktop/Claude/Prawo/dyrektywa-2023-2673/
-- ============================================================

-- A. Rozszerz tabelę leads o stemple "okna odstąpienia"
alter table public.leads
  add column if not exists realization_started_at   timestamptz,
  add column if not exists realization_completed_at timestamptz,
  add column if not exists withdrawal_window_hours  integer not null default 24;

comment on column public.leads.realization_started_at is
  'Stempel czasowy faktycznego rozpoczęcia świadczenia (utrata prawa odstąpienia art. 38 ust. 1 pkt 1 UPK). Domyślnie ustawiany przez trigger paid_at + 24h, ale Nicolas może przyspieszyć ręcznie w admin/.';
comment on column public.leads.realization_completed_at is
  'Stempel czasowy pełnego wykonania (dostarczenia gotowego zaproszenia). Reference do §10 ust. 9 Regulaminu.';
comment on column public.leads.withdrawal_window_hours is
  'Okno odstąpienia w godzinach od paid_at. Domyślnie 24h (best practice "thinking window").';

-- B. Trigger auto-set realization_started_at = paid_at + withdrawal_window_hours
create or replace function public.set_realization_started_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tylko gdy płatność zaksięgowana i realization jeszcze nie ustawiona
  if new.payment_status = 'paid' and new.paid_at is not null and new.realization_started_at is null then
    new.realization_started_at := new.paid_at + (new.withdrawal_window_hours || ' hours')::interval;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_realization_started_at on public.leads;
create trigger trg_set_realization_started_at
  before insert or update of payment_status, paid_at, withdrawal_window_hours on public.leads
  for each row
  execute function public.set_realization_started_at();

comment on function public.set_realization_started_at() is
  'Auto-ustawia realization_started_at = paid_at + 24h gdy płatność zaksięgowana. Daje klientowi okno odstąpienia art. 11a CRD.';

-- C. Tabela withdrawals - audit trail oświadczeń o odstąpieniu
create table if not exists public.withdrawals (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references public.leads(id) on delete restrict,

  -- Dane konsumenta z formularza
  consumer_name       text not null,
  consumer_email      text not null,
  reason              text, -- opcjonalne, zgodnie z art. 11a ust. 5 CRD

  -- Stempel czasowy oświadczenia (najważniejszy element prawny)
  submitted_at        timestamptz not null default now(),
  submitted_ip        inet,
  submitted_user_agent text,

  -- Status obsługi
  status              text not null default 'received'
    check (status in ('received', 'processing', 'refunded', 'rejected_after_deadline')),

  -- Stripe refund (jeśli wykonany)
  refund_amount_pln   integer, -- w groszach
  refund_completed_at timestamptz,
  refund_stripe_id    text,

  -- Wersjonowanie i audit
  consent_version     text, -- wersja regulaminu obowiązująca w momencie oświadczenia
  audit_trail         jsonb not null default '{}'::jsonb,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists withdrawals_lead_idx on public.withdrawals(lead_id);
create index if not exists withdrawals_status_idx on public.withdrawals(status);
create index if not exists withdrawals_submitted_idx on public.withdrawals(submitted_at desc);

comment on table public.withdrawals is
  'Rejestr oświadczeń o odstąpieniu od umowy (art. 11a CRD dyrektywa 2023/2673). Audit trail przechowywany 3+ lata. Każdy wpis to dowód użycia cyfrowej funkcji odstąpienia w interfejsie internetowym.';

-- Trigger updated_at
create or replace function public.set_withdrawals_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_withdrawals_updated_at on public.withdrawals;
create trigger trg_withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_withdrawals_updated_at();

-- D. RLS - tylko service_role może czytać/pisać (bo audit ma być chroniony)
alter table public.withdrawals enable row level security;

-- Policy: service_role pełen dostęp (Edge Functions)
drop policy if exists "withdrawals_service_all" on public.withdrawals;
create policy "withdrawals_service_all" on public.withdrawals
  for all to service_role using (true) with check (true);

-- Nie ma policy dla anon - konsument NIE czyta cudzych withdrawals.
-- Konsument składa oświadczenie przez Edge Function z weryfikacją tokenu.

-- E. RPC dla strony /odstapienie - pobranie statusu zamówienia bez ekspozycji bazy
create or replace function public.get_withdrawal_status(p_token uuid)
returns table (
  lead_id             uuid,
  consumer_name       text,
  consumer_email      text,
  payment_status      text,
  paid_at             timestamptz,
  realization_started_at timestamptz,
  realization_completed_at timestamptz,
  withdrawal_window_hours integer,
  can_withdraw        boolean,
  already_withdrawn   boolean,
  amount_pln          integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    l.id,
    l.name,
    l.email,
    l.payment_status,
    l.paid_at,
    l.realization_started_at,
    l.realization_completed_at,
    l.withdrawal_window_hours,
    -- can_withdraw: opłacone + okno aktywne + brak wcześniejszego odstąpienia
    (l.payment_status = 'paid'
     and (l.realization_started_at is null or now() < l.realization_started_at)
     and not exists (
       select 1 from public.withdrawals w
       where w.lead_id = l.id and w.status in ('received', 'processing', 'refunded')
     )) as can_withdraw,
    -- already_withdrawn: jest aktywny withdrawal
    exists (
       select 1 from public.withdrawals w
       where w.lead_id = l.id and w.status in ('received', 'processing', 'refunded')
    ) as already_withdrawn,
    l.payment_amount_pln
  from public.leads l
  where l.id = p_token;
end;
$$;

comment on function public.get_withdrawal_status(uuid) is
  'Bezpieczna funkcja read-only dla strony /odstapienie?token=UUID. Zwraca tylko status zamówienia i flag can_withdraw. Nie eksponuje innych pól z leads.';

-- Anon może wywołać tę funkcję (RPC chroni przez ID jako token = security through obscurity ale UUID v4 = 122 bity entropii)
grant execute on function public.get_withdrawal_status(uuid) to anon, authenticated;
