import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { name, phone, block, unit } = await req.json();
    const cookieStore = await cookies();
    
    // Auth context for the current user (which is the newly authenticated dependent)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error('Not authenticated');

    const db = supabaseService();

    // The user logging in right now is the dependent (elderly).
    // The caregiver_id is supposed to be the ID of the person who initiated this,
    // but since they signed out to do this OTP on the elderly's phone, we might not have it.
    // For this prototype, we just create the resident profile for the dependent.
    
    // Resolve block ID from block string
    let blockId = null;
    if (block) {
      // Find block by number
      const { data: blockData } = await (db.from('blocks') as any).select('block_id').eq('block_number', block.replace('Blk ', '').trim()).limit(1).single();
      if (blockData) {
        blockId = blockData.block_id;
      }
    }

    const inviteCode = `ELD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await (db.from('residents') as any).insert({
      id: user.id,
      display_name: name || 'Resident',
      phone: phone,
      block_id: blockId,
      unit_ref: unit || null,
      invite_code: inviteCode,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
