const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const blockId = 'b1b4fc05-c62e-4d50-b5ce-429ce2995086'; // Dummy block
  const { data, error } = await db.from('collection_runs')
    .select('*')
    .contains('area_blocks', [blockId]);
  console.log(error || data);
}
run();
