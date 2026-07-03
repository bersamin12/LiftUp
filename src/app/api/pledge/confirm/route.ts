import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      collection_run_id, 
      photo_url, 
      voice_note_url, 
      voice_transcript, 
      ai_suggested_category, 
      ai_suggested_condition, 
      ai_suggested_size, 
      confirmed_category, 
      confirmed_condition, 
      size_bucket, 
      needs_two_crew 
    } = body;

    // Verify auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = supabaseService();

    const activeRunId = collection_run_id;

    const isValidUUID = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUUID(activeRunId)) {
      return NextResponse.json({ error: 'A valid collection run is required to confirm a pledge.' }, { status: 400 });
    }

    // Fetch the run to generate a pickup slot
    const { data: run } = await (db.from('collection_runs') as any)
      .select('time_window_start, time_window_end')
      .eq('id', activeRunId)
      .single();

    let slotLabel = 'TBD';
    if (run && run.time_window_start && run.time_window_end) {
      // Basic 1-hour slot generation from the start time string 'HH:MM:SS'
      const startHourStr = run.time_window_start.split(':')[0];
      const hours = parseInt(startHourStr, 10) || 10;
      
      const ampm1 = hours >= 12 ? 'pm' : 'am';
      const h1 = hours % 12 || 12;
      const h2 = (hours + 1) % 12 || 12;
      const ampm2 = (hours + 1) >= 12 && (hours + 1) < 24 ? 'pm' : 'am';
      
      slotLabel = `${h1}${ampm1 === ampm2 ? '' : ampm1}–${h2}${ampm2}`;
    }

    // Sanitize inputs to respect Postgres constraints
    const VALID_CATEGORIES = ['Clothing','Books','Toys','Electronics','Furniture','Household','Other'];
    const VALID_CONDITIONS = ['Like New','Well-Used','Needs Repair','Not Working'];
    const VALID_SIZES = ['One bag','Multiple bags','Small item','Large / bulky'];

    const sanitizeCat = (val: string) => {
      if (!val) return 'Other';
      const v = val.toLowerCase();
      if (v.includes('cloth')) return 'Clothing';
      if (v.includes('book')) return 'Books';
      if (v.includes('toy')) return 'Toys';
      if (v.includes('electronic') || v.includes('tech')) return 'Electronics';
      if (v.includes('furn')) return 'Furniture';
      if (v.includes('house')) return 'Household';
      const exact = VALID_CATEGORIES.find(c => c.toLowerCase() === v);
      return exact || 'Other';
    };
    
    const sanitizeCond = (val: string) => VALID_CONDITIONS.includes(val) ? val : 'Well-Used';
    const sanitizeSize = (val: string) => VALID_SIZES.includes(val) ? val : 'Small item';

    // Insert pledge
    const { data: pledge, error: insertErr } = await (db.from('pledges') as any).insert({
      resident_id: user.id,
      collection_run_id: activeRunId,
      photo_url,
      voice_note_url,
      voice_transcript,
      ai_suggested_category: ai_suggested_category ? sanitizeCat(ai_suggested_category) : null,
      ai_suggested_condition: ai_suggested_condition ? sanitizeCond(ai_suggested_condition) : null,
      ai_suggested_size: ai_suggested_size ? sanitizeSize(ai_suggested_size) : null,
      confirmed_category: confirmed_category ? sanitizeCat(confirmed_category) : null,
      confirmed_condition: confirmed_condition ? sanitizeCond(confirmed_condition) : null,
      size_bucket: size_bucket ? sanitizeSize(size_bucket) : null,
      needs_two_crew: !!needs_two_crew,
      pickup_slot_label: slotLabel,
      status: 'pending'
    }).select('id, pickup_slot_label').single();

    if (insertErr) {
      throw new Error(insertErr.message);
    }

    return NextResponse.json({ success: true, pledge });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Confirm API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
