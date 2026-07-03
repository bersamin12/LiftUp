const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: user } = await supabase.from('residents').select('id').limit(1).single();

  const VALID_CATEGORIES = ['Clothing','Books','Toys','Electronics','Furniture','Household','Other'];
  const VALID_CONDITIONS = ['Like New','Well-Used','Needs Repair','Not Working'];
  const VALID_SIZES = ['One bag','Multiple bags','Small item','Large / bulky'];

  const sanitizeCat = (val) => VALID_CATEGORIES.includes(val) ? val : 'Other';
  const sanitizeCond = (val) => VALID_CONDITIONS.includes(val) ? val : 'Well-Used';
  const sanitizeSize = (val) => VALID_SIZES.includes(val) ? val : 'Small item';

  const body = {
    ai_suggested_category: "clothes",
    ai_suggested_condition: "Like New",
    ai_suggested_size: "Small",
    confirmed_category: "clothes",
    confirmed_condition: "Like New",
    size_bucket: "Small",
    needs_two_crew: false,
  };

  const { data: pledge, error: insertErr } = await supabase.from('pledges').insert({
    resident_id: user.id,
    collection_run_id: 'd686137d-e869-480a-90c3-9e98a969de5d',
    photo_url: null,
    voice_note_url: null,
    voice_transcript: 'i want to donate clotehs',
    ai_suggested_category: body.ai_suggested_category ? sanitizeCat(body.ai_suggested_category) : null,
    ai_suggested_condition: body.ai_suggested_condition ? sanitizeCond(body.ai_suggested_condition) : null,
    ai_suggested_size: body.ai_suggested_size ? sanitizeSize(body.ai_suggested_size) : null,
    confirmed_category: body.confirmed_category ? sanitizeCat(body.confirmed_category) : null,
    confirmed_condition: body.confirmed_condition ? sanitizeCond(body.confirmed_condition) : null,
    size_bucket: body.size_bucket ? sanitizeSize(body.size_bucket) : null,
    needs_two_crew: !!body.needs_two_crew,
    pickup_slot_label: '10am–11am',
    status: 'pending'
  }).select('id').single();

  if (insertErr) console.error('Insert error:', insertErr);
  else console.log('Insert success:', pledge);
}
run();
