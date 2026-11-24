import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseEnv } from '#/server/auth/supabase'

// Runs before host pages. It keeps the login cookies fresh and sends people
// who are not logged in to the login page. It is a first check only: every
// host API route still checks the login and who owns the event.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = supabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const loggedIn = Boolean(data?.claims)
  const onLogin = request.nextUrl.pathname === '/login'

  if (!loggedIn && !onLogin) return redirectTo('/login', request, response)
  if (loggedIn && onLogin) return redirectTo('/host', request, response)
  return response
}

// Keeps any refreshed login cookies on the redirect.
function redirectTo(path: string, request: NextRequest, from: NextResponse) {
  const redirect = NextResponse.redirect(new URL(path, request.url))
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}

// Guest pages (/i/...) are left out on purpose: guests have no login.
export const config = { matcher: ['/host/:path*', '/login'] }
