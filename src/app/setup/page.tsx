import { cookies } from 'next/headers';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import BlockSelect from './BlockSelect';
import AppScreen from '@/components/layout/AppScreen';

export default async function SetupPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = supabaseService();
  const { data: resident } = await (db.from('residents') as any).select('*').eq('id', user.id).single();
  
  if (resident?.block_id) {
    redirect('/home');
  }

  const { data: blocks, error: blocksErr } = await (db.from('blocks') as any).select('*').order('street_name');

  if (blocksErr) {
    console.error('Failed to fetch blocks:', blocksErr.message);
  }

  return (
    <AppScreen style={{ padding: '40px 22px' }}>
      <h1 style={{ font: '700 24px var(--font-serif)', color: 'var(--text-dark)', marginBottom: 8 }}>
        Welcome to LiftUp!
      </h1>
      <p style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 24 }}>
        Let&apos;s get you set up. Which block do you live in?
      </p>

      {blocksErr && (
        <div style={{ background: '#fee', border: '1px solid #f99', borderRadius: 12, padding: 14, marginBottom: 16, font: '700 13px var(--font-ui)', color: '#900' }}>
          Couldn&apos;t load blocks: {blocksErr.message}
        </div>
      )}

      <BlockSelect blocks={blocks || []} residentId={user.id} />
    </AppScreen>
  );
}
