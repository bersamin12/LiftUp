-- =============================================================
-- DoorDrive Schema — Migration 0001
-- Run this in Supabase SQL editor or via supabase db push
-- =============================================================

-- Enable pgcrypto for gen_random_uuid() (already enabled in Supabase)
-- Enable moddatetime for updated_at triggers

-- =============================================================
-- UTILITY: updated_at trigger function
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- BLOCKS — Singapore HDB block reference table
-- Seeded by scripts/seed-yishun-blocks.ts via OneMap geocoding
-- =============================================================
create table if not exists public.blocks (
  block_id     uuid primary key default gen_random_uuid(),
  block_number text not null,       -- e.g. '118'
  street_name  text not null,       -- e.g. 'ANG MO KIO AVENUE 4'
  town         text not null,       -- e.g. 'YISHUN'
  grc          text not null,       -- e.g. 'Nee Soon GRC'
  postal_code  text unique,         -- 6-digit SG postal
  lat          numeric(11, 7),      -- WGS84 latitude
  lng          numeric(11, 7),      -- WGS84 longitude
  created_at   timestamptz not null default now()
);

create index if not exists idx_blocks_town on public.blocks (town);
create index if not exists idx_blocks_grc  on public.blocks (grc);

-- RLS: blocks are publicly readable (no sensitive data)
alter table public.blocks enable row level security;
create policy "blocks_read_all"
  on public.blocks for select using (true);

-- =============================================================
-- RESIDENTS
-- =============================================================
create table if not exists public.residents (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null,
  phone         text unique,                  -- E.164 e.g. +6591234567, nullable for Google auth
  block_id      uuid references public.blocks(block_id),
  unit_ref      text,                         -- e.g. '#12-114', nullable (elderly)
  caregiver_id  uuid references public.residents(id),
  is_caregiver  boolean not null default false,
  invite_code   text unique,                  -- e.g. 'SITI-118'
  total_points  integer not null default 0,
  badge_level   text not null default 'New Giver',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger residents_updated_at
  before update on public.residents
  for each row execute function public.set_updated_at();

alter table public.residents enable row level security;

create policy "residents_read_own"
  on public.residents for select
  using (auth.uid() = id);

create policy "residents_update_own"
  on public.residents for update
  using (auth.uid() = id);

create policy "residents_insert_own"
  on public.residents for insert
  with check (auth.uid() = id);

-- =============================================================
-- ORGANIZATIONS
-- =============================================================
create table if not exists public.organizations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  uen                 text unique not null,
  contact_person      text,
  contact_role        text,
  logo_url            text,
  verification_status text not null default 'pending'
                        check (verification_status in ('pending','verified','rejected')),
  admin_approved      boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;

-- Any authenticated user can read verified orgs (for the resident campaign feed)
create policy "orgs_read_verified"
  on public.organizations for select
  using (verification_status = 'verified' or auth.uid() in (
    select user_id from public.org_members where org_id = organizations.id
  ));

-- =============================================================
-- ORG MEMBERS (coordinators/collectors)
-- =============================================================
create table if not exists public.org_members (
  id       uuid primary key default gen_random_uuid(),
  org_id   uuid not null references public.organizations on delete cascade,
  user_id  uuid not null references auth.users on delete cascade,
  role     text not null default 'coordinator'
             check (role in ('coordinator','collector','admin')),
  unique   (org_id, user_id)
);

alter table public.org_members enable row level security;

create policy "org_members_read_own"
  on public.org_members for select
  using (auth.uid() = user_id);

-- =============================================================
-- CAMPAIGNS
-- area_mode:
--   'single_block'  → area_blocks is array of 1 block_id, area_reference null
--   'multi_block'   → area_blocks is array of block_ids, area_reference null
--   'whole_area'    → area_blocks is null, area_reference = town or GRC string
--                     resolver expands this dynamically against blocks table
-- =============================================================
create table if not exists public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations on delete cascade,
  name             text not null,
  description      text,
  starts_at        date not null,
  ends_at          date not null,
  accepted_categories  text[] not null default '{}',
  area_mode        text not null default 'multi_block'
                     check (area_mode in ('single_block','multi_block','whole_area')),
  area_reference   text,            -- e.g. 'Nee Soon GRC' or 'YISHUN' — used only for whole_area
  area_blocks      uuid[],          -- block_id[] — null when area_mode='whole_area'
  status           text not null default 'draft'
                     check (status in ('draft','active','completed','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Constraints
  constraint area_whole_no_blocks
    check (area_mode != 'whole_area' or area_blocks is null),
  constraint area_specific_has_blocks
    check (area_mode = 'whole_area' or (area_blocks is not null and cardinality(area_blocks) > 0))
);

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create index if not exists idx_campaigns_org on public.campaigns (org_id);
create index if not exists idx_campaigns_status on public.campaigns (status);

alter table public.campaigns enable row level security;

-- Residents: read active campaigns
create policy "campaigns_read_active"
  on public.campaigns for select
  using (status in ('active','completed'));

-- Org members: full CRUD on own org's campaigns
create policy "campaigns_org_member_all"
  on public.campaigns for all
  using (org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  ));

-- =============================================================
-- COLLECTION RUNS
-- area_blocks: always a concrete block_id[] (never null),
--   even if the parent campaign is whole_area — coordinator picks
--   the explicit subset for this run.
-- route_plan: JSONB ordered stop list computed by route planner
--   e.g. [{"stop":1,"block_id":"...","label":"Blk 118 #12–#03",
--           "floor_start":12,"floor_end":3,
--           "pledge_count":6,"est_distance_m":420,"est_time_s":310}]
-- pickup_slots: JSONB array of 1-hour slots derived from time window
--   e.g. [{"label":"9–10am","start":"09:00","end":"10:00"},...]
-- =============================================================
create table if not exists public.collection_runs (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references public.campaigns on delete cascade,
  run_date           date not null,
  time_window_start  time not null,
  time_window_end    time not null,
  area_blocks        uuid[] not null,   -- concrete set, always populated
  route_plan         jsonb,
  pickup_slots       jsonb,             -- computed from time_window, cached here
  status             text not null default 'scheduled'
                       check (status in ('scheduled','ready','active','completed','cancelled')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger collection_runs_updated_at
  before update on public.collection_runs
  for each row execute function public.set_updated_at();

create index if not exists idx_runs_campaign on public.collection_runs (campaign_id);
create index if not exists idx_runs_date     on public.collection_runs (run_date);

alter table public.collection_runs enable row level security;

create policy "runs_read_active"
  on public.collection_runs for select
  using (campaign_id in (
    select id from public.campaigns where status in ('active','completed')
  ));

create policy "runs_org_member_all"
  on public.collection_runs for all
  using (campaign_id in (
    select c.id from public.campaigns c
    join public.org_members m on m.org_id = c.org_id
    where m.user_id = auth.uid()
  ));

-- =============================================================
-- PLEDGES
-- =============================================================
create table if not exists public.pledges (
  id                      uuid primary key default gen_random_uuid(),
  resident_id             uuid not null references public.residents on delete cascade,
  collection_run_id       uuid not null references public.collection_runs on delete cascade,
  photo_url               text,
  voice_note_url          text,
  voice_transcript        text,
  -- AI-suggested (from VLM/STT, returned before resident confirms)
  ai_suggested_category   text,
  ai_suggested_condition  text,
  ai_suggested_size       text,
  -- Resident-confirmed values
  confirmed_category      text
                            check (confirmed_category in (
                              'Clothing','Books','Toys','Electronics',
                              'Furniture','Household','Other'
                            )),
  confirmed_condition     text
                            check (confirmed_condition in (
                              'Like New','Well-Used','Needs Repair','Not Working'
                            )),
  size_bucket             text
                            check (size_bucket in (
                              'One bag','Multiple bags','Small item','Large / bulky'
                            )),
  needs_two_crew          boolean not null default false,
  pickup_slot_label       text,         -- e.g. '10–11am'
  -- Lifecycle
  status                  text not null default 'pending'
                            check (status in ('pending','confirmed','declined','postponed')),
  decline_reason          text,
  postponed_to_run_id     uuid references public.collection_runs(id),
  points_awarded          boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger pledges_updated_at
  before update on public.pledges
  for each row execute function public.set_updated_at();

create index if not exists idx_pledges_resident on public.pledges (resident_id);
create index if not exists idx_pledges_run      on public.pledges (collection_run_id);
create index if not exists idx_pledges_status   on public.pledges (status);

alter table public.pledges enable row level security;

create policy "pledges_resident_own"
  on public.pledges for all
  using (resident_id = auth.uid());

create policy "pledges_org_read"
  on public.pledges for select
  using (collection_run_id in (
    select r.id from public.collection_runs r
    join public.campaigns c on c.id = r.campaign_id
    join public.org_members m on m.org_id = c.org_id
    where m.user_id = auth.uid()
  ));

create policy "pledges_org_update"
  on public.pledges for update
  using (collection_run_id in (
    select r.id from public.collection_runs r
    join public.campaigns c on c.id = r.campaign_id
    join public.org_members m on m.org_id = c.org_id
    where m.user_id = auth.uid()
  ));

-- =============================================================
-- BADGES
-- =============================================================
create table if not exists public.badges (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  description    text,
  icon_key       text,             -- maps to SVG component in front-end
  accent_color   text,             -- hex
  criteria_type  text not null
                   check (criteria_type in (
                     'pledge_count','category_count','referral_confirmed',
                     'campaign_streak','seasonal','special'
                   )),
  criteria_value jsonb,            -- e.g. {"count":5} or {"category":"Electronics","count":1}
  points_value   integer not null default 50,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.badges enable row level security;
create policy "badges_read_all"
  on public.badges for select using (true);

create table if not exists public.badge_unlocks (
  id           uuid primary key default gen_random_uuid(),
  resident_id  uuid not null references public.residents on delete cascade,
  badge_id     uuid not null references public.badges on delete cascade,
  unlocked_at  timestamptz not null default now(),
  shown        boolean not null default false,
  unique       (resident_id, badge_id)
);

alter table public.badge_unlocks enable row level security;
create policy "badge_unlocks_read_own"
  on public.badge_unlocks for select
  using (resident_id = auth.uid());

-- =============================================================
-- REFERRALS
-- =============================================================
create table if not exists public.referrals (
  id          uuid primary key default gen_random_uuid(),
  inviter_id  uuid not null references public.residents on delete cascade,
  invitee_id  uuid not null references public.residents on delete cascade,
  vested      boolean not null default false,
  vested_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique      (inviter_id, invitee_id)
);

alter table public.referrals enable row level security;
create policy "referrals_read_own"
  on public.referrals for select
  using (inviter_id = auth.uid() or invitee_id = auth.uid());

-- =============================================================
-- LEADERBOARD VIEW — floor-level aggregates only, no identity
-- =============================================================
create or replace view public.leaderboard_by_floor as
select
  b.block_number,
  b.street_name,
  b.town,
  -- Extract floor number: '#12-114' → 12
  split_part(replace(r.unit_ref, '#', ''), '-', 1)::integer as floor_number,
  count(distinct p.id)::integer as confirmed_pledges
from public.residents r
join public.blocks b on b.block_id = r.block_id
join public.pledges p on p.resident_id = r.id
where p.status = 'confirmed'
  and r.unit_ref is not null
  and split_part(replace(r.unit_ref, '#', ''), '-', 1) ~ '^\d+$'
group by b.block_number, b.street_name, b.town, floor_number
order by b.block_number, floor_number;

-- =============================================================
-- RESOLVER FUNCTION: get eligible block_ids for a campaign
-- Returns concrete block_ids from area_blocks or whole-area expansion
-- =============================================================
create or replace function public.resolve_campaign_blocks(p_campaign_id uuid)
returns uuid[] language plpgsql security definer as $$
declare
  v_area_mode      text;
  v_area_reference text;
  v_area_blocks    uuid[];
  v_resolved       uuid[];
begin
  select area_mode, area_reference, area_blocks
  into v_area_mode, v_area_reference, v_area_blocks
  from public.campaigns
  where id = p_campaign_id;

  if v_area_mode = 'whole_area' then
    -- Expand by town OR grc depending on the reference value
    -- If area_reference contains 'GRC', match by grc column; else by town
    if v_area_reference ilike '%GRC%' then
      select array_agg(block_id) into v_resolved
      from public.blocks
      where grc = v_area_reference;
    else
      select array_agg(block_id) into v_resolved
      from public.blocks
      where town = v_area_reference;
    end if;
    return coalesce(v_resolved, '{}');
  else
    return coalesce(v_area_blocks, '{}');
  end if;
end;
$$;

-- =============================================================
-- BADGE SEED DATA
-- =============================================================
insert into public.badges (slug, name, description, icon_key, accent_color, criteria_type, criteria_value, points_value)
values
  ('first_give',        'First Give',           'Your very first donation is on its way to a neighbour.',         'heart',       '#c65a34', 'pledge_count',        '{"count":1}',                            50),
  ('5x_giver',          '5 Times a Giver',      'Five confirmed donations and counting.',                         'five',        '#14746f', 'pledge_count',        '{"count":5}',                            75),
  ('closet_clean_out',  'Closet Clean-Out Hero', 'Ten donations — you''ve cleared out a whole wardrobe.',         'shirt',       '#d98a3d', 'pledge_count',        '{"count":10}',                          100),
  ('block_legend',      'Block Legend',          'Twenty-five donations — a true pillar of the block.',           'star',        '#0f5651', 'pledge_count',        '{"count":25}',                          200),
  ('gadget_rehomer',    'Gadget Rehomer',        'Gave electronics a second life.',                               'cpu',         '#0f766e', 'category_count',      '{"category":"Electronics","count":1}',   75),
  ('book_nook',         'Book Nook',             'Donated 3 rounds of books — a budding librarian.',              'book',        '#14746f', 'category_count',      '{"category":"Books","count":3}',          75),
  ('kampung_connector', 'Kampung Connector',     'Your first referral completed their donation. Together!',       'neighbours',  '#b8562f', 'referral_confirmed',  '{"count":1}',                            50),
  ('3_campaign_streak', '3-Campaign Streak',     'Donated in 3 different campaigns. The spirit is strong.',       'fire',        '#e0912f', 'campaign_streak',     '{"count":3}',                           100),
  ('hari_raya_giver',   'Hari Raya Giver',       'Gave during the Hari Raya season.',                            'lantern',     '#c65a34', 'seasonal',            '{"season":"hari_raya"}',                  50)
on conflict (slug) do nothing;
