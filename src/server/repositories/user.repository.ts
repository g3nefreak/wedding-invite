import { db } from '#/server/db'

export type HostRecord = { id: string; email: string; name: string }

export interface UserRepository {
  // Creates the host's row if it is missing; keeps the email in step with the login.
  upsert(user: HostRecord): Promise<HostRecord>
}

export const prismaUserRepository: UserRepository = {
  async upsert(user) {
    const row = await db().user.upsert({
      where: { id: user.id },
      create: user,
      // The name is left alone so a host's own edit is not overwritten.
      update: { email: user.email },
    })
    return { id: row.id, email: row.email, name: row.name }
  },
}
