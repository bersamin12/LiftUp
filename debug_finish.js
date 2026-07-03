const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function run() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Find a run to test
  const { data: runs } = await db.from('collection_runs').select('id, campaign_id').limit(1);
  if (!runs || runs.length === 0) return console.log('No runs found');
  const runId = runs[0].id;
  
  console.log('Testing run:', runId);
  const { data: run, error: runErr } = await db.from('collection_runs')
    .update({ status: 'completed' })
    .eq('id', runId)
    .select('campaign_id').single();
    
  if (runErr) return console.error('Run Update Err:', runErr);
  
  const { error: campErr } = await db.from('campaigns')
    .update({ status: 'completed' })
    .eq('id', run.campaign_id);
    
  if (campErr) return console.error('Camp Update Err:', campErr);
  
  console.log('Success!');
}
run();
