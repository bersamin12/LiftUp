const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get an actual user to pretend to be
  const { data: user } = await supabase.from('residents').select('id').limit(1).single();
  const { data: runObj } = await supabase.from('collection_runs').select('id').eq('status', 'scheduled').limit(1).single();

  // Create a JWT for this user to pass the auth check
  // Actually it's easier to just call the Supabase JS insert directly, but we want to test the ROUTE.
  // We can just simulate the exact logic in the route...
  
  // Wait, let's just use the Supabase JS to insert and see if it fails.
  const payload = {
    resident_id: user.id,
    collection_run_id: runObj.id,
    photo_url: null,
    voice_note_url: null,
    voice_transcript: null,
    ai_suggested_category: 'Clothing',
    ai_suggested_condition: 'Like New',
    ai_suggested_size: 'Small item',
    confirmed_category: 'Clothing',
    confirmed_condition: 'Like New',
    size_bucket: 'Small item',
    needs_two_crew: false,
    pickup_slot_label: '9am-1pm',
    status: 'pending'
  };

  const { data, error } = await supabase.from('pledges').insert(payload);
  console.log('Supabase JS Insert Result:', { data, error });
}
run();
