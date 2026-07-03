const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const { data: residents } = await supabase.from('residents').select('*');
  
  console.log('Users:', users.users.map(u => ({ id: u.id, email: u.email })));
  console.log('Residents:', residents.map(r => ({ id: r.id, name: r.display_name })));
}
run();
