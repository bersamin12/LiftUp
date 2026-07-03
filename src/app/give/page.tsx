import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { supabaseService } from '@/lib/supabase-server';

export default async function GivePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = supabaseService();
  const { data: resident } = await (db.from('residents') as any).select('block_id').eq('id', user.id).maybeSingle();

  if (!resident?.block_id) redirect('/setup');

  const { data: runs } = await (db.from('collection_runs') as any)
    .select('id')
    .eq('status', 'scheduled')
    .contains('area_blocks', [resident.block_id])
    .order('run_date', { ascending: true })
    .limit(1);

  const run = runs?.[0];

  if (run) {
    redirect(`/home?give=${run.id}`);
  }

  redirect('/pledge/interest');
}
