import { createSupabaseServerClient } from '#/server/auth/supabase'
import { AppError } from '#/server/errors'

export type SessionUser = { id: string; email: string }

// Who is logged in, or null. getClaims checks the login token's signature,
// so a cookie someone edited by hand is not trusted.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub || typeof claims.email !== 'string') return null
  return { id: claims.sub, email: claims.email }
}

// For host API routes: every one starts with this.
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new AppError('UNAUTHORIZED', 'Log in to continue')
  return user
}
