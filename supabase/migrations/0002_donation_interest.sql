-- =============================================================
-- DoorDrive Schema — Migration 0002
-- Donation Interest (demand signal when no run is scheduled yet)
-- Run this manually in the Supabase SQL editor.
-- =============================================================

create table if not exists public.donation_interests (
  id             uuid primary key default gen_random_uuid(),
  resident_id    uuid not null references public.residents on delete cascade,
  block_id       uuid not null references public.blocks(block_id),
  category       text
                   check (category in (
                     'Clothing','Books','Toys','Electronics',
                     'Furniture','Household','Other'
                   )),
  note           text,
  status         text not null default 'open'
                   check (status in ('open','matched','withdrawn')),
  matched_run_id uuid references public.collection_runs(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger donation_interests_updated_at
  before update on public.donation_interests
  for each row execute function public.set_updated_at();

create index if not exists idx_interests_block    on public.donation_interests (block_id);
create index if not exists idx_interests_status   on public.donation_interests (status);
create index if not exists idx_interests_resident on public.donation_interests (resident_id);

-- one open interest row per resident at a time
create unique index if not exists uq_interests_resident_open
  on public.donation_interests (resident_id)
  where (status = 'open');

alter table public.donation_interests enable row level security;

-- Residents: full CRUD on their own rows (submit, withdraw)
create policy "interests_resident_own"
  on public.donation_interests for all
  using (resident_id = auth.uid());

-- Org members (any verified org's coordinators): read-only visibility
-- across all interest rows, needed to gauge demand before scheduling a
-- run in an area. The coordinator UI aggregates via a service-role API
-- route, so this policy mainly documents/permits direct anon-key reads.
create policy "interests_org_member_read"
  on public.donation_interests for select
  using (exists (select 1 from public.org_members m where m.user_id = auth.uid()));
