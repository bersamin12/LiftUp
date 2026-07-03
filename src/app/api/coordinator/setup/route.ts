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

    const { name, uen, contact_person, contact_role } = await req.json();
    if (!name || !uen) return NextResponse.json({ error: 'Missing name or uen' }, { status: 400 });

    const db = supabaseService();

    // Get org id
    const { data: orgMember } = await (db.from('org_members') as any).select('org_id').eq('user_id', user.id).single();
    if (!orgMember) return NextResponse.json({ error: 'Not an org member' }, { status: 403 });

    // Update org
    const { error } = await (db.from('organizations') as any)
      .update({ name, uen, contact_person: contact_person || null, contact_role: contact_role || null })
      .eq('id', orgMember.org_id);
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'UEN is already registered to another organisation.' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
