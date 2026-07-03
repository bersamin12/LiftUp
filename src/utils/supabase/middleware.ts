import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes. For now, we redirect to login (/login) if not authenticated
  // and trying to access protected routes.
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/home') || request.nextUrl.pathname.startsWith('/coordinator');
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to home if already logged in and visiting the login page.
  // Note: '/' is the public landing/pitch page and intentionally does NOT
  // redirect away from an existing session, so it can always be shown first.
  if (request.nextUrl.pathname === '/login' && user) {
     const url = request.nextUrl.clone()
     url.pathname = '/home' // We will handle role-based routing inside /home or via a separate endpoint
     return NextResponse.redirect(url)
  }

  return supabaseResponse
}
