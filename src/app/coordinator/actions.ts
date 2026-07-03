'use server';

import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { POINTS_PER_PLEDGE } from '@/lib/constants';

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

async function getOrgId(userId: string) {
  const db = supabaseService();
  const { data } = await (db.from('org_members') as any).select('org_id').eq('user_id', userId).single();
  if (!data) throw new Error('Not an organization member');
  return data.org_id;
}

export async function createCampaign(formData: FormData) {
  const user = await getAuthUser();
  const orgId = await getOrgId(user.id);
  const db = supabaseService();

  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const starts_at = formData.get('starts_at') as string;
  const ends_at = formData.get('ends_at') as string;
  const categories_json = formData.get('accepted_categories') as string;
  const accepted_categories = categories_json ? JSON.parse(categories_json) : [];
  const area_mode = formData.get('area_mode') as 'whole_area' | 'multi_block' | 'single_block';
  const area_reference = formData.get('area_reference') as string | null;
  const area_blocks_json = formData.get('area_blocks') as string;
  const area_blocks = area_blocks_json ? JSON.parse(area_blocks_json) : null;

  const { data, error } = await (db.from('campaigns') as any).insert({
    org_id: orgId,
    name,
    description,
    starts_at,
    ends_at,
    accepted_categories,
    area_mode,
    area_reference: area_mode === 'whole_area' ? area_reference : null,
    area_blocks: area_mode !== 'whole_area' ? area_blocks : null,
    status: 'active'
  }).select('id').single();

  if (error) throw new Error(error.message);
  
  revalidatePath('/coordinator');
  redirect('/coordinator');
}

export async function createRun(campaignId: string, formData: FormData) {
  const user = await getAuthUser();
  const orgId = await getOrgId(user.id); // Verification
  const db = supabaseService();

  const run_date = formData.get('run_date') as string;
  const time_window_start = formData.get('time_window_start') as string; // ISO String
  const time_window_end = formData.get('time_window_end') as string; // ISO String
  const area_blocks_json = formData.get('area_blocks') as string;
  const area_blocks = area_blocks_json ? JSON.parse(area_blocks_json) : [];

  if (area_blocks.length === 0) throw new Error('Run must include at least one block');

  const { data, error } = await (db.from('collection_runs') as any).insert({
    campaign_id: campaignId,
    run_date,
    time_window_start,
    time_window_end,
    area_blocks,
    status: 'scheduled'
  }).select('id').single();

  if (error) throw new Error(error.message);

  revalidatePath(`/coordinator/campaign/${campaignId}`);
  redirect(`/coordinator/campaign/${campaignId}`);
}

export async function processPledge(pledgeId: string, action: 'pickup' | 'decline' | 'postpone', reason?: string) {
  const db = supabaseService();

  let updatePayload: any = {};
  if (action === 'pickup') {
    updatePayload = { status: 'confirmed' };
  } else if (action === 'decline') {
    updatePayload = { status: 'declined', decline_reason: reason };
  } else if (action === 'postpone') {
    updatePayload = { status: 'postponed' };
    // In a real app, find the next active run for this campaign and block and set postponed_to_run_id
  }

  const { error: updateErr } = await (db.from('pledges') as any)
    .update(updatePayload)
    .eq('id', pledgeId);

  if (updateErr) throw new Error(updateErr.message);

  const { data: updatedPledge, error: fetchErr } = await (db.from('pledges') as any)
    .select('*, residents(id, total_points)')
    .eq('id', pledgeId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);

  if (action === 'pickup' && updatedPledge) {
    const residentId = updatedPledge.residents.id;
    
    // Award standard points
    await (db.from('residents') as any)
      .update({ total_points: updatedPledge.residents.total_points + POINTS_PER_PLEDGE })
      .eq('id', residentId);
    
    // Naive badge unlock check (e.g. unlock "First Give" if they have 1 confirmed pledge)
    const { count } = await (db.from('pledges') as any)
      .select('id', { count: 'exact', head: true })
      .eq('resident_id', residentId)
      .eq('status', 'confirmed');
      
    if (count === 1) {
      const { data: firstGiveBadge } = await (db.from('badges') as any).select('id').eq('slug', 'first_give').single();
      if (firstGiveBadge) {
        // Ignore unique constraint error if already unlocked
        const { error: unlockErr } = await (db.from('badge_unlocks') as any).insert({
          resident_id: residentId,
          badge_id: firstGiveBadge.id,
          shown: false
        });
        if (unlockErr) console.log('Badge unlock error (likely duplicate):', unlockErr.message);
      }
    }
  }

  revalidatePath('/coordinator', 'layout');
  return { success: true };
}

export async function finishRun(runId: string) {
  const db = supabaseService();
  const { data: run, error: runErr } = await (db.from('collection_runs') as any)
    .update({ status: 'completed' })
    .eq('id', runId)
    .select('campaign_id').single();

  if (runErr || !run) throw new Error('Failed to finish run');

  // If this run is completed, we just complete the campaign for demo purposes
  const { error: campErr } = await (db.from('campaigns') as any)
    .update({ status: 'completed' })
    .eq('id', run.campaign_id);

  if (campErr) throw new Error('Failed to finish campaign');

  revalidatePath('/coordinator', 'layout');
  return { success: true };
}

export async function getRunPledges(runId: string) {
  const db = supabaseService();
  const { data, error } = await (db.from('pledges') as any)
    .select('*, residents(*, blocks(*))')
    .eq('collection_run_id', runId);
    
  if (error) {
    console.error('Failed to get pledges:', error);
    return [];
  }
  return data || [];
}
