const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('residents')
    .update({ block_id: '01d42535-fab5-401d-ae5b-0cc202b1325a' }) // 166 YISHUN RING RD
    .eq('id', 'e7378e28-becc-4723-9810-3b7775a1bb19');
    
  console.log('Update Data:', data);
  console.log('Update Error:', error);
}
run();
