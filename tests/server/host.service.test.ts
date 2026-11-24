import { expect, it } from 'vitest'
import type { UserRepository } from '#/server/repositories/user.repository'
import { ensureHost } from '#/server/services/host.service'

function fakeUsers() {
  const saved: { id: string; email: string; name: string }[] = []
  const repo: UserRepository = {
    async upsert(user) {
      const existing = saved.find((row) => row.id === user.id)
      // Like the real one: an existing host keeps their name, the email follows the login.
      if (existing) existing.email = user.email
      else saved.push({ ...user })
      return saved.find((row) => row.id === user.id)!
    },
  }
  return { repo, saved }
}

it('creates the host row on first login, named after the email', async () => {
  const { repo, saved } = fakeUsers()
  const host = await ensureHost({ id: 'u1', email: 'mika@example.com' }, repo)
  expect(host).toEqual({ id: 'u1', email: 'mika@example.com', name: 'mika' })
  expect(saved).toHaveLength(1)
})

it('does not create a second row on the next login', async () => {
  const { repo, saved } = fakeUsers()
  await ensureHost({ id: 'u1', email: 'mika@example.com' }, repo)
  await ensureHost({ id: 'u1', email: 'mika@example.com' }, repo)
  expect(saved).toHaveLength(1)
})
