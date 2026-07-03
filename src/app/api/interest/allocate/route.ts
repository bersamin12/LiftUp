import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { interestId, runId } = await req.json();
    if (!interestId || !runId) return NextResponse.json({ error: 'Missing interestId or runId' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = supabaseService();

    const { data: interest } = await (db.from('donation_interests') as any)
      .select('*')
      .eq('id', interestId)
      .eq('resident_id', user.id)
      .eq('status', 'open')
      .maybeSingle();

    if (!interest) {
      return NextResponse.json({ error: 'Pending donation not found' }, { status: 404 });
    }

    const { data: run } = await (db.from('collection_runs') as any)
      .select('time_window_start, time_window_end')
      .eq('id', runId)
      .maybeSingle();

    let slotLabel = 'TBD';
    if (run?.time_window_start && run?.time_window_end) {
      const startHourStr = run.time_window_start.split(':')[0];
      const hours = parseInt(startHourStr, 10) || 10;

      const ampm1 = hours >= 12 ? 'pm' : 'am';
      const h1 = hours % 12 || 12;
      const h2 = (hours + 1) % 12 || 12;
      const ampm2 = (hours + 1) >= 12 && (hours + 1) < 24 ? 'pm' : 'am';

      slotLabel = `${h1}${ampm1 === ampm2 ? '' : ampm1}–${h2}${ampm2}`;
    }

    const conditionMatch = interest.note?.match(/^Condition: (.+)$/);
    const confirmedCondition = conditionMatch ? conditionMatch[1] : null;

    const { data: pledge, error: insertErr } = await (db.from('pledges') as any)
      .insert({
        resident_id: user.id,
        collection_run_id: runId,
        confirmed_category: interest.category,
        confirmed_condition: confirmedCondition,
        pickup_slot_label: slotLabel,
        status: 'pending',
      })
      .select('id, pickup_slot_label')
      .single();

    if (insertErr) throw insertErr;

    const { error: updateErr } = await (db.from('donation_interests') as any)
      .update({ status: 'matched', matched_run_id: runId })
      .eq('id', interestId);

    if (updateErr) throw updateErr;

    revalidatePath('/home');
    revalidatePath('/profile');
    revalidatePath('/coordinator');
    revalidatePath('/coordinator/analytics');

    return NextResponse.json({ success: true, pledge });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
