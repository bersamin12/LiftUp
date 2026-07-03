import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const VALID_CATEGORIES = ['Clothing', 'Books', 'Toys', 'Electronics', 'Furniture', 'Household', 'Other'];

export async function POST(req: Request) {
  try {
    const { category, note } = await req.json();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = supabaseService();

    const { data: resident } = await (db.from('residents') as any).select('block_id').eq('id', user.id).maybeSingle();
    if (!resident?.block_id) {
      return NextResponse.json({ error: 'No block assigned to this resident yet.' }, { status: 400 });
    }

    const sanitizedCategory = VALID_CATEGORIES.includes(category) ? category : null;

    const { data: interest, error: insertErr } = await (db.from('donation_interests') as any)
      .insert({
        resident_id: user.id,
        block_id: resident.block_id,
        category: sanitizedCategory,
        note: note || null,
        status: 'open',
      })
      .select('id')
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        const { data: updated, error: updateErr } = await (db.from('donation_interests') as any)
          .update({ category: sanitizedCategory, note: note || null })
          .eq('resident_id', user.id)
          .eq('status', 'open')
          .select('id')
          .single();
        if (updateErr) throw updateErr;
        revalidatePath('/coordinator');
        revalidatePath('/coordinator/analytics');
        revalidatePath('/coordinator/run/new');
        return NextResponse.json({ success: true, interest: updated });
      }
      throw insertErr;
    }

    revalidatePath('/coordinator');
    revalidatePath('/coordinator/analytics');
    revalidatePath('/coordinator/run/new');
    return NextResponse.json({ success: true, interest });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
