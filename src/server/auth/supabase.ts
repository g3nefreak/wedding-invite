import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Both values are public by design (they are also sent to the browser).
// The login itself is protected by the host's password, not by these.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set',
    )
  }
  return { url, key }
}

// A Supabase client for one request. The host's login lives in cookies,
// so the client reads and writes them through Next.js.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, key } = supabaseEnv()

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Pages cannot write cookies, only API routes can. That is fine:
          // src/proxy.ts refreshes the login cookies on every host request.
        }
      },
    },
  })
}
