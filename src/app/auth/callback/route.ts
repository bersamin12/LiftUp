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

  // If Google/Supabase returned an OAuth error, surface it instead of a code.
  const oauthError = searchParams.get('error_description') || searchParams.get('error');

  cookieStore.delete('oauth_role');
  cookieStore.delete('oauth_next');

  // Short reason code carried in the redirect URL so a failure is diagnosable
  // from the address bar (no server-log access needed).
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/?error=auth-callback-failed&reason=${encodeURIComponent(reason)}`);

  if (oauthError) {
    console.error('[auth-callback] oauth provider error:', oauthError);
    return fail(`oauth:${oauthError}`.slice(0, 80));
  }
  if (!code) return fail('no-code');

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
  if (error || !session?.user) {
    console.error('[auth-callback] exchange failed:', error?.message);
    return fail(`exchange:${error?.message || 'no-session'}`.slice(0, 80));
  }

  try {
    await ensureProfile(role, session.user.email || '');
  } catch (e) {
    console.error('[auth-callback] ensureProfile threw', e);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
