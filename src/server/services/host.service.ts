import type { SessionUser } from '#/server/auth/session'
import type {
  HostRecord,
  UserRepository,
} from '#/server/repositories/user.repository'

// Accounts are created in Supabase Auth, but events belong to a row in our own
// User table. This makes sure that row exists for whoever is logged in.
export async function ensureHost(
  user: SessionUser,
  repo: UserRepository,
): Promise<HostRecord> {
  // Until the host sets a name, use the part of their email before the @.
  const name = user.email.split('@')[0]
  return repo.upsert({ id: user.id, email: user.email, name })
}
