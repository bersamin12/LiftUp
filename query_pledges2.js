const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: pledges, error } = await supabase
    .from('pledges')
    .select('*, collection_runs(run_date, campaigns(name))')
    .eq('resident_id', 'e7378e28-becc-4723-9810-3b7775a1bb19')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });
    
  console.log('Pledges:', JSON.stringify(pledges, null, 2));
  console.log('Error:', error);
}
run();
