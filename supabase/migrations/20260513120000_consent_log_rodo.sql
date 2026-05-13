-- ============================================================
-- Rejestr zgód RODO art. 7 ust. 1 - dowód udzielenia zgody
-- Data: 2026-05-13
-- Kontekst: audyt prawnik /ultramode - rozszerzenie tabeli leads
--           o stemple czasowe i wersjonowanie treści zgód
-- ============================================================

-- Kolumny opcjonalne (nullable) - migracja idempotentna
alter table public.leads
  add column if not exists consent_rodo_at      timestamptz,
  add column if not exists consent_immediate_at timestamptz,
  add column if not exists consent_marketing    boolean default false not null,
  add column if not exists consent_marketing_at timestamptz,
  add column if not exists consent_version      text;

comment on column public.leads.consent_rodo_at is
  'Stempel czasowy zgody na przetwarzanie danych (RODO art. 6 ust. 1 lit. a/b). Required przy zamówieniu.';
comment on column public.leads.consent_immediate_at is
  'Stempel czasowy zgody na rozpoczęcie świadczenia usługi przed upływem 14-dniowego terminu odstąpienia (art. 38 pkt 3 ustawy o prawach konsumenta).';
comment on column public.leads.consent_marketing is
  'Czy klient wyraził dobrowolną zgodę marketingową (art. 6 ust. 1 lit. a + art. 10 UŚUDE + art. 172 PKE). Default false.';
comment on column public.leads.consent_marketing_at is
  'Stempel czasowy zgody marketingowej (jeśli udzielona). NULL = brak zgody.';
comment on column public.leads.consent_version is
  'Wersja treści zgód obowiązująca w momencie ich wyrażenia (np. privacy-2026-05-13). Pozwala odtworzyć dokładną treść którą widział użytkownik.';

-- Index dla wycofań zgody marketingowej (DPO/audyty)
create index if not exists leads_consent_marketing_idx
  on public.leads (consent_marketing)
  where consent_marketing = true;
