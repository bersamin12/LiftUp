import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { block_id } = await req.json();
    if (!block_id) return NextResponse.json({ error: 'Missing block_id' }, { status: 400 });

    const db = supabaseService();
    const floor = Math.floor(Math.random() * 12) + 1;
    const unit = Math.floor(Math.random() * 100) + 10;
    const unit_ref = `#${String(floor).padStart(2, '0')}-${unit}`;

    const { error } = await (db.from('residents') as any).update({ 
      block_id, 
      unit_ref 
    }).eq('id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
