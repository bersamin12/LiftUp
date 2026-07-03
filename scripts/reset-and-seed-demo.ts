#!/usr/bin/env tsx
/**
 * Reset activity data (campaigns/runs/pledges/interests) and seed a
 * presentable demo dataset: one active campaign + scheduled run across
 * 4 real Yishun blocks, 4 mock residents pledging real items against it,
 * and 2 more mock residents registering donation interest in separate
 * blocks (demand-signal / heatmap data).
 *
 * Keeps existing real accounts (residents, organizations, org_members)
 * untouched — only clears activity tables.
 *
 * Usage: npx tsx scripts/reset-and-seed-demo.ts
 */

import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ORG_ID = '4cdb7798-5ca5-4a1c-8da0-e168ebe41d94'; // MRF Donators

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 4 real, geographically-clustered Yishun blocks for the campaign/run
const CAMPAIGN_BLOCKS = [
  'cdd1fa68-47e8-42a4-b18d-c32fa17aab8d', // 101 Yishun Ave 5
  'eb44db7c-4aa8-4098-816e-c5ad28b32f8b', // 103 Yishun Ring Rd
  '8b852b0a-bb0c-4414-a37e-6d354b72adb7', // 104 Yishun Ring Rd
  'e323eab4-23b3-44fe-9fab-8863aeb5e1f1', // 105 Yishun Ring Rd
];

// 2 separate blocks for demand-signal-only interest (no scheduled run covers these)
const INTEREST_BLOCKS = [
  'e143fedd-3cdf-43d6-b73f-2c8dd7de4e2b', // 110 Yishun Ring Rd
  '434df44b-86c9-4ca5-9bfb-0208f897c97c', // 112 Yishun Ring Rd
];

const PLEDGERS = [
  { name: 'Aisha Rahman', email: 'demo.aisha@liftup.local', unit: '#08-123', block: CAMPAIGN_BLOCKS[0], category: 'Clothing', condition: 'Well-Used', size: 'One bag', bulky: false, status: 'pending' },
  { name: 'Wei Jie Tan', email: 'demo.weijie@liftup.local', unit: '#12-045', block: CAMPAIGN_BLOCKS[1], category: 'Books', condition: 'Like New', size: 'Multiple bags', bulky: false, status: 'pending' },
  { name: 'Kumar Selvam', email: 'demo.kumar@liftup.local', unit: '#03-210', block: CAMPAIGN_BLOCKS[2], category: 'Furniture', condition: 'Well-Used', size: 'Large / bulky', bulky: true, status: 'pending' },
  { name: 'Mei Ling Ong', email: 'demo.meiling@liftup.local', unit: '#15-088', block: CAMPAIGN_BLOCKS[3], category: 'Toys', condition: 'Like New', size: 'One bag', bulky: false, status: 'confirmed' },
];

const INTERESTED = [
  { name: 'Farah Ismail', email: 'demo.farah@liftup.local', block: INTEREST_BLOCKS[0], category: 'Clothing', note: '3 bags of kids clothes, outgrown' },
  { name: 'Hock Seng Lim', email: 'demo.hockseng@liftup.local', block: INTEREST_BLOCKS[1], category: 'Electronics', note: 'Old rice cooker + toaster, still working' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function resetActivityData() {
  console.log('Clearing existing activity data...');
  for (const table of ['pledges', 'donation_interests', 'badge_unlocks', 'collection_runs', 'campaigns']) {
    const { error } = await db.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Failed clearing ${table}: ${error.message}`);
    console.log(`  cleared ${table}`);
  }
}

async function verifyOrg() {
  const { error } = await db.from('organizations').update({ verification_status: 'verified' }).eq('id', ORG_ID);
  if (error) console.warn('Could not verify org (non-fatal):', error.message);
  else console.log('  MRF Donators marked verified');
}

async function createMockResident(email: string, displayName: string, blockId: string, unitRef?: string) {
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName, demo: true },
  });
  if (createErr || !created.user) throw new Error(`Failed creating auth user ${email}: ${createErr?.message}`);

  const inviteCode = `DEMO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const { error: residentErr } = await db.from('residents').insert({
    id: created.user.id,
    display_name: displayName,
    phone: `DEMO-${created.user.id.substring(0, 8)}`,
    block_id: blockId,
    unit_ref: unitRef || null,
    invite_code: inviteCode,
  });
  if (residentErr) throw new Error(`Failed creating resident row for ${email}: ${residentErr.message}`);

  return created.user.id;
}

async function main() {
  await resetActivityData();
  await verifyOrg();

  console.log('Creating campaign...');
  const { data: campaign, error: campErr } = await db
    .from('campaigns')
    .insert({
      org_id: ORG_ID,
      name: 'Yishun Spring Clean-Out',
      description: 'A community-wide donation drive for Yishun Ave 5 & Ring Road residents — clear out what you don’t need, and give it a second life.',
      accepted_categories: ['Clothing', 'Books', 'Toys', 'Furniture', 'Household'],
      area_mode: 'multi_block',
      area_blocks: CAMPAIGN_BLOCKS,
      starts_at: todayIso(),
      ends_at: plusDaysIso(30),
      status: 'active',
    })
    .select('id')
    .single();
  if (campErr || !campaign) throw new Error(`Failed creating campaign: ${campErr?.message}`);
  console.log(`  campaign ${campaign.id}`);

  console.log('Creating collection run...');
  const { data: run, error: runErr } = await db
    .from('collection_runs')
    .insert({
      campaign_id: campaign.id,
      run_date: plusDaysIso(4),
      time_window_start: '09:00:00',
      time_window_end: '12:00:00',
      area_blocks: CAMPAIGN_BLOCKS,
      status: 'scheduled',
    })
    .select('id')
    .single();
  if (runErr || !run) throw new Error(`Failed creating run: ${runErr?.message}`);
  console.log(`  run ${run.id}`);

  console.log('Creating mock pledgers + pledges...');
  for (const p of PLEDGERS) {
    const residentId = await createMockResident(p.email, p.name, p.block, p.unit);
    const { error: pledgeErr } = await db.from('pledges').insert({
      resident_id: residentId,
      collection_run_id: run.id,
      confirmed_category: p.category,
      confirmed_condition: p.condition,
      size_bucket: p.size,
      needs_two_crew: p.bulky,
      pickup_slot_label: '9–10am',
      status: p.status,
    });
    if (pledgeErr) throw new Error(`Failed creating pledge for ${p.name}: ${pledgeErr.message}`);
    console.log(`  ${p.name} -> ${p.category} (${p.status})`);
  }

  console.log('Creating demand-signal interest residents...');
  for (const i of INTERESTED) {
    const residentId = await createMockResident(i.email, i.name, i.block);
    const { error: interestErr } = await db.from('donation_interests').insert({
      resident_id: residentId,
      block_id: i.block,
      category: i.category,
      note: i.note,
      status: 'open',
    });
    if (interestErr) throw new Error(`Failed creating interest for ${i.name}: ${interestErr.message}`);
    console.log(`  ${i.name} -> ${i.category} (open interest)`);
  }

  console.log('\nDone. Demo dataset ready:');
  console.log(`  - Campaign "Yishun Spring Clean-Out" (${campaign.id}), 4 blocks, 1 scheduled run in ${plusDaysIso(4)}`);
  console.log(`  - 4 pledges (3 pending, 1 confirmed, 1 bulky/needs-2-crew)`);
  console.log(`  - 2 open donation_interests in separate blocks for the demand heatmap`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
