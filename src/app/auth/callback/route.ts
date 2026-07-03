import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureProfile } from '@/app/actions/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = await cookies();

  // Prefer the cookie set right before the OAuth redirect — query params on
  // `redirectTo` only survive if that exact URL is allow-listed in Supabase's
  // Redirect URLs setting, so they can silently drop. The cookie doesn't
  // depend on that allow-list at all.
  const role = (cookieStore.get('oauth_role')?.value || searchParams.get('role') || 'resident') as 'resident' | 'organization';
  const rawNext = cookieStore.get('oauth_next')?.value
    ? decodeURIComponent(cookieStore.get('oauth_next')!.value)
    : searchParams.get('next');
  const next = rawNext ?? (role === 'organization' ? '/coordinator' : '/home');

  cookieStore.delete('oauth_role');
  cookieStore.delete('oauth_next');

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session?.user) {
      // Create profile based on requested role
      await ensureProfile(role, session.user.email || '');
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth-callback-failed`);
}
