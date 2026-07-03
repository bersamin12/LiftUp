'use server';

import { supabaseService } from '@/lib/supabase-server';
import { supabaseClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function ensureProfile(role: 'resident' | 'organization', email: string) {
  const cookieStore = await cookies();
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

  const db = supabaseService(); // service role to insert into public tables if RLS prevents it

  if (role === 'resident') {
    const { data: existing } = await (db.from('residents') as any).select('id').eq('id', user.id).single();
    if (!existing) {
      const inviteCode = `USER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await (db.from('residents') as any).insert({
        id: user.id,
        display_name: email.split('@')[0] || 'Resident',
        phone: `GOOGLE-${user.id.substring(0, 8)}`,
        invite_code: inviteCode,
      });
    }
  } else if (role === 'organization') {
    const { data: existingOrgMember } = await (db.from('org_members') as any).select('org_id').eq('user_id', user.id).single();
    if (!existingOrgMember) {
      // Create a pending organization
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newOrg, error: orgErr } = await (db.from('organizations') as any).insert({
        name: 'Pending Org',
        uen: `PENDING-${user.id.substring(0,4)}-${randomId}`,
      }).select('id').single();

      if (orgErr) {
        console.error('Failed to create org:', orgErr);
      } else if (newOrg) {
        const { error: memberErr } = await (db.from('org_members') as any).insert({
          org_id: newOrg.id,
          user_id: user.id,
          role: 'coordinator',
        });
        if (memberErr) {
          console.error('Failed to add org member:', memberErr);
        }
      }
    }
  }

  return { success: true };
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.signOut();
  
  // Dynamic import of redirect to avoid cycle issues if needed, or just import it at top
  const { redirect } = await import('next/navigation');
  redirect('/login');
}
