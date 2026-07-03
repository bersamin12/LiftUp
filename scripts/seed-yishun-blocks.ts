#!/usr/bin/env tsx
/**
 * Seed script: Yishun / Nee Soon GRC demo blocks (Rate-Limit Safe)
 *
 * Usage:
 *   1. Place the HDB property information CSV in this directory as
 *      scripts/HDBPropertyInformation.csv
 *   2. Copy .env.local.example → .env.local and fill in SUPABASE_SERVICE_ROLE_KEY
 *   3. Run: npx tsx scripts/seed-yishun-blocks.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { oneMapSearch } from '../src/lib/onemap';

// Load .env.local manually
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CSV_PATH           = path.join(__dirname, 'HDBPropertyInformation.csv');
const GRC_NAME           = 'Nee Soon GRC';
const TARGET_TOWN        = 'YISHUN';
const TARGET_TOWN_CODE   = 'YS';

// Throttling configuration
const SLEEP_MS           = 1500; // Increased to 1.5s to play nice with OneMap
const MAX_RETRIES        = 3;    // Number of times to retry a failed geocode

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse CSV safely handling potential window line endings */
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']));
  });
}

/** Deduplicate blocks */
function deduplicateBlocks(rows: Record<string, string>[]): Array<{
  block_number: string;
  street_name: string;
}> {
  const seen = new Set<string>();
  const result: Array<{ block_number: string; street_name: string }> = [];
  for (const row of rows) {
    const blk    = (row['blk_no']  || row['block_no'] || row['block'] || '').toUpperCase().trim();
    const street = (row['street']  || row['street_name'] || '').toUpperCase().trim();
    if (!blk || !street) continue;
    const key = `${blk}|${street}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ block_number: blk, street_name: street });
    }
  }
  return result;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw  = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCsv(raw);

  const yishunRows = rows.filter((r) => {
    const townCode = (r['bldg_contract_town'] || '').toUpperCase();
    return townCode === TARGET_TOWN_CODE;
  });

  const blocks = deduplicateBlocks(yishunRows);
  console.log(`📋  Found ${blocks.length} unique blocks matching town code "${TARGET_TOWN_CODE}" (${TARGET_TOWN})`);

  let inserted = 0;
  let failed   = 0;

  for (const block of blocks) {
    const query = `${block.block_number} ${block.street_name} SINGAPORE`;
    console.log(`🔍  Geocoding: ${query}`);

    let lat: number | null = null;
    let lng: number | null = null;
    let postalCode: string | null = null;
    let success = false;

    // Retry loop with exponential backoff for OneMap
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const results = await oneMapSearch(query);
        const best = results[0];
        
        if (best) {
          lat        = parseFloat(best.LATITUDE);
          lng        = parseFloat(best.LONGITUDE || best.LONGTITUDE);
          postalCode = best.POSTAL || null;
          
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`   ✅  ${lat.toFixed(6)}, ${lng.toFixed(6)}  (postal: ${postalCode ?? 'n/a'})`);
          } else {
            console.warn(`   ⚠️   Invalid coordinates returned for ${query}`);
            lat = null;
            lng = null;
          }
        } else {
          console.warn(`   ⚠️   No result found for ${query}`);
        }
        
        success = true;
        break; // Break the retry loop on success
      } catch (err) {
        console.warn(`   ⚠️   [Attempt ${attempt}/${MAX_RETRIES}] OneMap error for ${query}.`);
        if (attempt < MAX_RETRIES) {
          const backoffTime = SLEEP_MS * attempt * 2;
          console.log(`       Rate limit suspected. Backing off for ${backoffTime}ms...`);
          await sleep(backoffTime);
        } else {
          console.error(`   ❌  Failed after ${MAX_RETRIES} attempts.`);
        }
      }
    }

    if (!success) {
      failed++;
      continue; 
    }

    // Upsert into blocks table
    const { error } = await db.from('blocks').upsert(
      {
        block_number: block.block_number,
        street_name:  block.street_name,
        town:         TARGET_TOWN,
        grc:          GRC_NAME,
        postal_code:  postalCode,
        lat:          lat,
        lng:          lng,
      },
      { onConflict: 'postal_code', ignoreDuplicates: false }
    );

    if (error) {
      console.error(`   ❌  DB upsert failed:`, error.message);
      failed++;
    } else {
      inserted++;
    }

    // Standard baseline sleep between iterations
    await sleep(SLEEP_MS);
  }

  console.log(`\n✅  Done — inserted/updated: ${inserted}, failed: ${failed}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});