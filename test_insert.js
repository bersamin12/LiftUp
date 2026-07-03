const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: user } = await supabase.from('residents').select('id').limit(1).single();
  const { data: run } = await supabase.from('collection_runs').select('id').eq('status', 'scheduled').limit(1).single();
  
  console.log('User ID:', user?.id);
  console.log('Run ID:', run?.id);

  const { data, error } = await supabase.from('pledges').insert({
    resident_id: user.id,
    collection_run_id: run.id,
    photo_url: null,
    voice_note_url: null,
    voice_transcript: 'Test transcript',
    ai_suggested_category: 'Other',
    ai_suggested_condition: 'Well-Used',
    ai_suggested_size: 'Small item',
    confirmed_category: 'Other',
    confirmed_condition: 'Well-Used',
    size_bucket: 'Small item',
    needs_two_crew: false,
    pickup_slot_label: 'TBD',
    status: 'pending'
  }).select('*');
  
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}
run();
