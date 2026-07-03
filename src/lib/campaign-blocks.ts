/**
 * Campaign block resolver — server-side only
 *
 * Given a campaign ID, returns the concrete array of block records
 * eligible for that campaign. Handles all three area_mode values:
 *
 *   single_block → returns the one block from area_blocks
 *   multi_block  → returns all blocks from area_blocks
 *   whole_area   → queries the blocks table for all rows matching
 *                  the campaign's area_reference (town or GRC name)
 *
 * Use this function everywhere you need to know "is this resident's block
 * covered by this campaign" — pledge validation, notification eligibility,
 * run block picker constraint, etc.
 */

import { supabaseService } from './supabase-server';

export interface BlockRecord {
  block_id: string;
  block_number: string;
  street_name: string;
  town: string;
  grc: string;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Resolve the full set of eligible blocks for a campaign.
 * Returns empty array if campaign not found or has no blocks.
 */
export async function resolveCampaignBlocks(
  campaignId: string
): Promise<BlockRecord[]> {
  const db = supabaseService();

  // Step 1: Fetch campaign area config
  const { data: campaign, error: campaignErr } = await db
    .from('campaigns')
    .select('area_mode, area_reference, area_blocks')
    .eq('id', campaignId)
    .single();

  if (campaignErr || !campaign) {
    console.error('[resolveCampaignBlocks] Campaign fetch error:', campaignErr);
    return [];
  }

  // Cast to known shape (avoids TS 'never' inference on complex Supabase generics)
  const campaignData = campaign as {
    area_mode: 'single_block' | 'multi_block' | 'whole_area';
    area_reference: string | null;
    area_blocks: string[] | null;
  };

  // Step 2: Build query based on area_mode
  let query = db.from('blocks').select('*');

  if (campaignData.area_mode === 'whole_area') {
    if (!campaignData.area_reference) return [];
    if (campaignData.area_reference.toLowerCase().includes('grc')) {
      query = query.eq('grc', campaignData.area_reference);
    } else {
      query = query.eq('town', campaignData.area_reference);
    }
  } else {
    const blockIds = campaignData.area_blocks;
    if (!blockIds || blockIds.length === 0) return [];
    query = query.in('block_id', blockIds);
  }

  const { data: blocks, error: blockErr } = await query.order('block_number');

  if (blockErr) {
    console.error('[resolveCampaignBlocks] Blocks fetch error:', blockErr);
    return [];
  }

  return (blocks ?? []) as BlockRecord[];
}

/**
 * Check whether a specific block_id is within a campaign's eligible set.
 * Used for pledge validation and notification eligibility checks.
 */
export async function isBlockEligibleForCampaign(
  campaignId: string,
  blockId: string
): Promise<boolean> {
  const eligible = await resolveCampaignBlocks(campaignId);
  return eligible.some((b) => b.block_id === blockId);
}

/**
 * Get available area_reference values for the whole_area mode dropdown.
 * Returns distinct towns and GRCs from the blocks table.
 */
export async function getAreaReferenceOptions(): Promise<{
  towns: string[];
  grcs: string[];
}> {
  const db = supabaseService();

  const [townsRes, grcsRes] = await Promise.all([
    db.from('blocks').select('town').order('town'),
    db.from('blocks').select('grc').order('grc'),
  ]);

  const towns = [...new Set((townsRes.data ?? []).map((r) => (r as { town: string }).town))];
  const grcs  = [...new Set((grcsRes.data  ?? []).map((r) => (r as { grc: string }).grc))];

  return { towns, grcs };
}
