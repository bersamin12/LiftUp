const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: pledges, error } = await supabase
    .from('pledges')
    .select('id, residents!inner(block_id)')
    .eq('status', 'confirmed');
    
  console.log('Pledges:', JSON.stringify(pledges, null, 2));
  console.log('Error:', error);
}
run();
