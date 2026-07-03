const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await supabase.from('collection_runs').select('id').eq('id', 'null');
  console.log('Error:', error);
}
run();
