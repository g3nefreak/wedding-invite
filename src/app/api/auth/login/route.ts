import {
  assertWithinLimit,
  clientIp,
  createRateLimiter,
} from '#/server/auth/rate-limit'
import { createSupabaseServerClient } from '#/server/auth/supabase'
import { AppError } from '#/server/errors'
import { handle, ok, readJson } from '#/server/http'
import { loginSchema } from '#/server/validation/login.schema'

// Returns true when the email and password are right. On success the real
// one also sets the login cookies.
type SignIn = (email: string, password: string) => Promise<boolean>

// Built from a sign-in function so tests can pass a fake one.
export function makeHandler(signIn: SignIn) {
  // Slows down password guessing from one address.
  const perIp = createRateLimiter({ limit: 10, windowMs: 60_000 })

  return (request: Request) =>
    handle(async () => {
      assertWithinLimit(perIp, clientIp(request))
      const { email, password } = loginSchema.parse(await readJson(request))

      if (!(await signIn(email, password))) {
        // One message for both cases, so nobody can learn which emails exist.
        throw new AppError('UNAUTHORIZED', 'Email or password is incorrect')
      }
      return ok({ loggedIn: true })
    })
}

export const POST = makeHandler(async (email, password) => {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return !error
})
