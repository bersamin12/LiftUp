
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: user } = await supabase.from('residents').select('id').limit(1).single();

  // Let's copy the EXACT logic of route.ts here to catch the exact line it throws
  const db = supabase;
  
  let activeRunId = '2e756568-8eba-4bac-9764-325a8c70fc36';
  
  try {
    const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUUID(activeRunId)) {
      console.log('Not valid UUID, using fallback');
    }
    
    // Fetch the run to generate a pickup slot
    const { data: run, error: runErr } = await db.from('collection_runs')
      .select('time_window_start, time_window_end')
      .eq('id', activeRunId)
      .single();

    if (runErr) throw new Error('Run Query Error: ' + runErr.message);

    let slotLabel = 'TBD';
    if (run && run.time_window_start && run.time_window_end) {
      const startHourStr = run.time_window_start.split(':')[0];
      const hours = parseInt(startHourStr, 10) || 10;
      
      const ampm1 = hours >= 12 ? 'pm' : 'am';
      const h1 = hours % 12 || 12;
      const h2 = (hours + 1) % 12 || 12;
      const ampm2 = (hours + 1) >= 12 && (hours + 1) < 24 ? 'pm' : 'am';
      
      slotLabel = `${h1}${ampm1 === ampm2 ? '' : ampm1}–${h2}${ampm2}`;
    }

    const VALID_CATEGORIES = ['Clothing','Books','Toys','Electronics','Furniture','Household','Other'];
    const VALID_CONDITIONS = ['Like New','Well-Used','Needs Repair','Not Working'];
    const VALID_SIZES = ['One bag','Multiple bags','Small item','Large / bulky'];

    const sanitizeCat = (val) => {
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
    const sanitizeCond = (val) => VALID_CONDITIONS.includes(val) ? val : 'Well-Used';
    const sanitizeSize = (val) => VALID_SIZES.includes(val) ? val : 'Small item';

    const body = {
      ai_suggested_category: undefined,
      ai_suggested_condition: undefined,
      ai_suggested_size: undefined,
      confirmed_category: 'Clothing',
      confirmed_condition: 'Like New',
      size_bucket: undefined,
      needs_two_crew: undefined,
    };

    const { data: pledge, error: insertErr } = await db.from('pledges').insert({
      resident_id: user.id,
      collection_run_id: activeRunId,
      photo_url: null,
      voice_note_url: null,
      voice_transcript: null,
      ai_suggested_category: body.ai_suggested_category ? sanitizeCat(body.ai_suggested_category) : null,
      ai_suggested_condition: body.ai_suggested_condition ? sanitizeCond(body.ai_suggested_condition) : null,
      ai_suggested_size: body.ai_suggested_size ? sanitizeSize(body.ai_suggested_size) : null,
      confirmed_category: body.confirmed_category ? sanitizeCat(body.confirmed_category) : null,
      confirmed_condition: body.confirmed_condition ? sanitizeCond(body.confirmed_condition) : null,
      size_bucket: body.size_bucket ? sanitizeSize(body.size_bucket) : null,
      needs_two_crew: !!body.needs_two_crew,
      pickup_slot_label: slotLabel,
      status: 'pending'
    }).select('id, pickup_slot_label').single();

    if (insertErr) {
      throw new Error('Insert Error: ' + insertErr.message);
    }
    
    console.log('Success:', pledge);
  } catch(e) {
    console.error('Caught:', e.message);
  }
}
run();
