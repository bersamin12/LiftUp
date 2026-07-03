const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase.from('collection_runs').select('*').eq('id', '2e756568-8eba-4bac-9764-325a8c70fc36');
  console.log('Exists:', data);
}
run();
