const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const { data: residents } = await supabase.from('residents').select('*');
  
  console.log('Auth Users:');
  users.users.forEach(u => console.log(`- ${u.email} (${u.id})`));
  
  console.log('\nResidents:');
  residents.forEach(r => console.log(`- ${r.display_name} (${r.id})`));
}
run();
