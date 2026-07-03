#!/usr/bin/env tsx
/**
 * Reset activity data and seed a RICH, presentable demo dataset for a live
 * run-through:
 *   - 3 campaigns for MRF Donators (active w/ history, active whole-area,
 *     and an upcoming one with no runs yet)
 *   - a COMPLETED run (confirmed / declined+reason / postponed pledges) plus
 *     SCHEDULED runs with pending pledges (the live "start a run" flow)
 *   - ~18 pledges with varied category / condition / size / status and
 *     created_at spread across the last ~3 weeks (so the analytics
 *     pledges-over-time trend draws a real curve)
 *   - ~10 open donation_interests across many blocks (demand heatmap)
 *
 * Idempotent: fully purges demo accounts (phone LIKE 'DEMO-%' /
 * user_metadata.demo) before reseeding, so it can be re-run safely. Real
 * accounts (residents, organizations, org_members) are left untouched — only
 * demo + activity data is cleared.
 *
 * Usage: npx tsx scripts/reset-and-seed-demo.ts
 */

import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { POINTS_PER_PLEDGE } from '../src/lib/constants';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ORG_ID = '4cdb7798-5ca5-4a1c-8da0-e168ebe41d94'; // MRF Donators

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ─── Date helpers ───────────────────────────────────────────────
function dateIso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function tsAgoIso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

// ─── Reset ──────────────────────────────────────────────────────
async function resetActivityData() {
  console.log('Clearing activity data...');
  for (const table of ['pledges', 'donation_interests', 'badge_unlocks', 'collection_runs', 'campaigns']) {
    const { error } = await db.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Failed clearing ${table}: ${error.message}`);
    console.log(`  cleared ${table}`);
  }
  // With every pledge/badge wiped, no resident has legitimately-earned points
  // anymore — zero them so real accounts (not just demo ones) reflect the
  // reset. Demo confirmed-pledgers get their points re-awarded during seeding.
  const { error: ptsErr } = await db.from('residents').update({ total_points: 0, badge_level: 'New Giver' }).not('id', 'is', null);
  if (ptsErr) throw new Error(`Failed resetting resident points: ${ptsErr.message}`);
  console.log('  reset all resident points to 0');
}

async function purgeDemoAccounts() {
  console.log('Purging demo accounts (makes this script re-runnable)...');
  // Delete demo resident rows (activity already cleared, so no FK conflicts).
  const { data: demoRes } = await db.from('residents').select('id').like('phone', 'DEMO-%');
  for (const r of demoRes || []) {
    await db.from('residents').delete().eq('id', r.id);
    await db.auth.admin.deleteUser(r.id).catch(() => {});
  }
  // Sweep any leftover demo auth users (e.g. resident row already gone).
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 } as any);
  let swept = 0;
  for (const u of list?.users || []) {
    if ((u.user_metadata as any)?.demo === true) {
      await db.auth.admin.deleteUser(u.id).catch(() => {});
      swept++;
    }
  }
  console.log(`  removed ${demoRes?.length || 0} demo residents, swept ${swept} demo auth users`);
}

async function verifyOrg() {
  const { error } = await db.from('organizations').update({ verification_status: 'verified' }).eq('id', ORG_ID);
  if (error) console.warn('Could not verify org (non-fatal):', error.message);
  else console.log('  MRF Donators marked verified');
}

// ─── Resident registry (create-once, reuse by email) ────────────
const residentCache = new Map<string, string>();

async function getResident(email: string, displayName: string, blockId: string, unitRef?: string): Promise<string> {
  const cached = residentCache.get(email);
  if (cached) return cached;

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

  residentCache.set(email, created.user.id);
  return created.user.id;
}

const emailOf = (name: string) => `demo.${name.toLowerCase().replace(/[^a-z]/g, '')}@liftup.local`;

// ─── Seed data ──────────────────────────────────────────────────
type Pledge = {
  name: string; block: number; unit: string;
  category: string; condition: string; size: string; bulky?: boolean;
  status: 'pending' | 'confirmed' | 'declined' | 'postponed';
  declineReason?: string; daysAgo: number;
};

// R1 — completed run history (mixed outcomes)
const R1_PLEDGES: Pledge[] = [
  { name: 'Aisha Rahman',  block: 0, unit: '#08-123', category: 'Clothing',    condition: 'Well-Used',    size: 'One bag',        status: 'confirmed', daysAgo: 18 },
  { name: 'Wei Jie Tan',   block: 1, unit: '#12-045', category: 'Books',       condition: 'Like New',     size: 'Multiple bags',  status: 'confirmed', daysAgo: 17 },
  { name: 'Kumar Selvam',  block: 2, unit: '#03-210', category: 'Furniture',   condition: 'Well-Used',    size: 'Large / bulky',  bulky: true, status: 'confirmed', daysAgo: 16 },
  { name: 'Mei Ling Ong',  block: 3, unit: '#15-088', category: 'Toys',        condition: 'Like New',     size: 'One bag',        status: 'confirmed', daysAgo: 15 },
  { name: 'Siti Nurhaliza',block: 4, unit: '#06-302', category: 'Household',   condition: 'Like New',     size: 'Small item',     status: 'confirmed', daysAgo: 15 },
  { name: 'Ahmad Zaki',    block: 4, unit: '#09-410', category: 'Clothing',    condition: 'Needs Repair', size: 'One bag',        status: 'declined', declineReason: 'Poor quality',       daysAgo: 16 },
  { name: 'Ravi Chandran', block: 0, unit: '#11-202', category: 'Electronics', condition: 'Not Working',  size: 'Small item',     status: 'declined', declineReason: 'Broken / unusable', daysAgo: 14 },
  { name: 'Jason Koh',     block: 2, unit: '#04-118', category: 'Furniture',   condition: 'Well-Used',    size: 'Large / bulky',  bulky: true, status: 'declined', declineReason: 'Too heavy', daysAgo: 13 },
  { name: 'Grace Lee',     block: 1, unit: '#10-077', category: 'Clothing',    condition: 'Well-Used',    size: 'Multiple bags',  status: 'postponed', daysAgo: 14 },
];

// R2 — scheduled run (the live demo: pending items to process)
const R2_PLEDGES: Pledge[] = [
  { name: 'Aisha Rahman',  block: 0, unit: '#08-123', category: 'Clothing',    condition: 'Well-Used', size: 'One bag',       status: 'pending', daysAgo: 3 },
  { name: 'Wei Jie Tan',   block: 1, unit: '#12-045', category: 'Books',       condition: 'Like New',  size: 'One bag',       status: 'pending', daysAgo: 2 },
  { name: 'Kumar Selvam',  block: 2, unit: '#03-210', category: 'Household',   condition: 'Well-Used', size: 'Multiple bags', status: 'pending', daysAgo: 2 },
  { name: 'Mei Ling Ong',  block: 3, unit: '#15-088', category: 'Toys',        condition: 'Like New',  size: 'Small item',    status: 'pending', daysAgo: 1 },
  { name: 'Ravi Chandran', block: 0, unit: '#11-202', category: 'Clothing',    condition: 'Like New',  size: 'One bag',       status: 'pending', daysAgo: 1 },
  { name: 'Grace Lee',     block: 1, unit: '#10-077', category: 'Furniture',   condition: 'Well-Used', size: 'Large / bulky', bulky: true, status: 'pending', daysAgo: 0 },
];

// R3 — second campaign's scheduled run (pending, different blocks)
const R3_PLEDGES: Pledge[] = [
  { name: 'Nurul Huda',    block: 5, unit: '#07-133', category: 'Books',       condition: 'Like New',  size: 'Multiple bags', status: 'pending', daysAgo: 6 },
  { name: 'Daniel Teo',    block: 6, unit: '#14-201', category: 'Toys',        condition: 'Well-Used', size: 'One bag',       status: 'pending', daysAgo: 5 },
  { name: 'Priya Menon',   block: 7, unit: '#02-090', category: 'Electronics', condition: 'Like New',  size: 'Small item',    status: 'pending', daysAgo: 4 },
];

// Open donation interests (demand signals) — spread across many blocks
const INTERESTS: { name: string; block: number; category: string; note: string; daysAgo: number }[] = [
  { name: 'Farah Ismail',    block: 10, category: 'Clothing',    note: '3 bags of kids clothes, outgrown',        daysAgo: 12 },
  { name: 'Hock Seng Lim',   block: 11, category: 'Electronics', note: 'Old rice cooker + toaster, still working', daysAgo: 11 },
  { name: 'Lily Chua',       block: 12, category: 'Books',       note: 'Boxes of novels and textbooks',           daysAgo: 10 },
  { name: 'Rahim Abdullah',  block: 14, category: 'Furniture',   note: '2-seater sofa, good condition',           daysAgo: 9 },
  { name: 'Yong Hui Ng',     block: 16, category: 'Toys',        note: "Kids' toys and board games",              daysAgo: 8 },
  { name: 'Suraj Patel',     block: 18, category: 'Household',   note: 'Kitchenware and small appliances',        daysAgo: 7 },
  { name: 'Michelle Tan',    block: 20, category: 'Clothing',    note: 'Office wear, barely worn',                daysAgo: 5 },
  { name: 'Idris Osman',     block: 22, category: 'Electronics', note: 'Working laptop and monitor',              daysAgo: 4 },
  { name: 'Karen Wong',      block: 24, category: 'Books',       note: "Children's picture books",                daysAgo: 3 },
  { name: 'Gopal Krishnan',  block: 26, category: 'Furniture',   note: 'Study desk and chair',                    daysAgo: 2 },
];

async function insertPledges(list: Pledge[], runId: string, blocks: any[]) {
  for (const p of list) {
    const residentId = await getResident(emailOf(p.name), p.name, blocks[p.block].block_id, p.unit);
    const { error } = await db.from('pledges').insert({
      resident_id: residentId,
      collection_run_id: runId,
      confirmed_category: p.category,
      ai_suggested_category: p.category,
      confirmed_condition: p.condition,
      ai_suggested_condition: p.condition,
      size_bucket: p.size,
      ai_suggested_size: p.size,
      needs_two_crew: !!p.bulky,
      pickup_slot_label: '9–10am',
      status: p.status,
      decline_reason: p.declineReason || null,
      points_awarded: p.status === 'confirmed',
      created_at: tsAgoIso(p.daysAgo),
    });
    if (error) throw new Error(`Failed pledge for ${p.name}: ${error.message}`);
  }
}

async function main() {
  await resetActivityData();
  await purgeDemoAccounts();
  await verifyOrg();

  // Pull a pool of real Yishun blocks that have map coordinates.
  console.log('Loading block pool...');
  const { data: blocks, error: blocksErr } = await db
    .from('blocks')
    .select('block_id, block_number, street_name, lat, lng')
    .eq('town', 'YISHUN')
    .not('lat', 'is', null)
    .order('block_number')
    .limit(40);
  if (blocksErr || !blocks || blocks.length < 30) throw new Error(`Failed loading blocks: ${blocksErr?.message || 'too few blocks'}`);
  console.log(`  loaded ${blocks.length} blocks`);

  const clusterA = [0, 1, 2, 3, 4].map((i) => blocks[i].block_id); // C1 area
  const clusterB = [5, 6, 7].map((i) => blocks[i].block_id);        // C2 run area

  // ── Campaign 1: active, with history ──
  console.log('Creating campaigns + runs...');
  const { data: c1, error: c1e } = await db.from('campaigns').insert({
    org_id: ORG_ID,
    name: 'Yishun Spring Clean-Out',
    description: 'A community-wide donation drive for Yishun Ave 5 & Ring Road residents — clear out what you don’t need, and give it a second life.',
    accepted_categories: ['Clothing', 'Books', 'Toys', 'Furniture', 'Household'],
    area_mode: 'multi_block',
    area_blocks: clusterA,
    starts_at: dateIso(-21),
    ends_at: dateIso(21),
    status: 'active',
  }).select('id').single();
  if (c1e || !c1) throw new Error(`Failed C1: ${c1e?.message}`);

  const { data: r1, error: r1e } = await db.from('collection_runs').insert({
    campaign_id: c1.id, run_date: dateIso(-7), time_window_start: '09:00:00', time_window_end: '12:00:00',
    area_blocks: clusterA, status: 'completed',
  }).select('id').single();
  if (r1e || !r1) throw new Error(`Failed R1: ${r1e?.message}`);

  const { data: r2, error: r2e } = await db.from('collection_runs').insert({
    campaign_id: c1.id, run_date: dateIso(4), time_window_start: '09:00:00', time_window_end: '12:00:00',
    area_blocks: clusterA, status: 'scheduled',
  }).select('id').single();
  if (r2e || !r2) throw new Error(`Failed R2: ${r2e?.message}`);

  // ── Campaign 2: active, whole-area (broadens demand-map scope) ──
  const { data: c2, error: c2e } = await db.from('campaigns').insert({
    org_id: ORG_ID,
    name: 'Northpoint Book & Toy Drive',
    description: 'Collecting gently-used books and toys across Yishun for family service centres.',
    accepted_categories: ['Books', 'Toys', 'Electronics'],
    area_mode: 'whole_area',
    area_reference: 'YISHUN',
    area_blocks: null,
    starts_at: dateIso(-10),
    ends_at: dateIso(20),
    status: 'active',
  }).select('id').single();
  if (c2e || !c2) throw new Error(`Failed C2: ${c2e?.message}`);

  const { data: r3, error: r3e } = await db.from('collection_runs').insert({
    campaign_id: c2.id, run_date: dateIso(6), time_window_start: '10:00:00', time_window_end: '13:00:00',
    area_blocks: clusterB, status: 'scheduled',
  }).select('id').single();
  if (r3e || !r3) throw new Error(`Failed R3: ${r3e?.message}`);

  // ── Campaign 3: upcoming, no runs yet ──
  const { error: c3e } = await db.from('campaigns').insert({
    org_id: ORG_ID,
    name: 'CNY Reuse Festival',
    description: 'A festive reuse drive planned for the new year — sign-ups open soon.',
    accepted_categories: ['Clothing', 'Household', 'Furniture', 'Toys'],
    area_mode: 'whole_area',
    area_reference: 'YISHUN',
    area_blocks: null,
    starts_at: dateIso(10),
    ends_at: dateIso(40),
    status: 'active',
  });
  if (c3e) throw new Error(`Failed C3: ${c3e.message}`);

  console.log('Creating pledges...');
  await insertPledges(R1_PLEDGES, r1.id, blocks);
  await insertPledges(R2_PLEDGES, r2.id, blocks);
  await insertPledges(R3_PLEDGES, r3.id, blocks);

  // Award points to residents for their confirmed pledges.
  const confirmedByName: Record<string, number> = {};
  for (const p of [...R1_PLEDGES, ...R2_PLEDGES, ...R3_PLEDGES]) {
    if (p.status === 'confirmed') confirmedByName[p.name] = (confirmedByName[p.name] || 0) + 1;
  }
  for (const [name, count] of Object.entries(confirmedByName)) {
    const id = residentCache.get(emailOf(name));
    if (id) await db.from('residents').update({ total_points: count * POINTS_PER_PLEDGE, badge_level: 'Bronze Giver' }).eq('id', id);
  }

  console.log('Creating demand interests...');
  for (const i of INTERESTS) {
    const residentId = await getResident(emailOf(i.name), i.name, blocks[i.block].block_id);
    const { error } = await db.from('donation_interests').insert({
      resident_id: residentId,
      block_id: blocks[i.block].block_id,
      category: i.category,
      note: i.note,
      status: 'open',
      created_at: tsAgoIso(i.daysAgo),
    });
    if (error) throw new Error(`Failed interest for ${i.name}: ${error.message}`);
  }

  const allPledges = [...R1_PLEDGES, ...R2_PLEDGES, ...R3_PLEDGES];
  const byStatus = allPledges.reduce((a: any, p) => ((a[p.status] = (a[p.status] || 0) + 1), a), {});
  console.log('\nDone. Demo dataset ready:');
  console.log('  - 3 campaigns (2 active, 1 upcoming), 3 runs (1 completed, 2 scheduled)');
  console.log(`  - ${allPledges.length} pledges: ${JSON.stringify(byStatus)}`);
  console.log(`  - ${INTERESTS.length} open donation_interests across ${new Set(INTERESTS.map((i) => i.block)).size} blocks`);
  console.log(`  - ${residentCache.size} demo residents created`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
