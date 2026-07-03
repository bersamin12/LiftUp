const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await db.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error(error);
  else console.log('Campaigns cleared.');
}
run();
