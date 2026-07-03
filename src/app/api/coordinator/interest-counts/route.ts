import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = supabaseService();

  const { data: orgMember } = await (db.from('org_members') as any).select('org_id').eq('user_id', user.id).maybeSingle();
  if (!orgMember) return NextResponse.json({ error: 'Not an organization member' }, { status: 403 });

  const { data: rows } = await (db.from('donation_interests') as any)
    .select('block_id, category')
    .eq('status', 'open');

  const counts: Record<string, number> = {};
  const categories: Record<string, Record<string, number>> = {};
  for (const row of rows || []) {
    counts[row.block_id] = (counts[row.block_id] || 0) + 1;
    const cat = row.category || 'Other';
    categories[row.block_id] = categories[row.block_id] || {};
    categories[row.block_id][cat] = (categories[row.block_id][cat] || 0) + 1;
  }

  return NextResponse.json({ counts, categories });
}
