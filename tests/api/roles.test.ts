import { beforeEach, expect, it } from 'vitest'
import { makeHandlers as makeEvents } from '#/app/api/events/route'
import { makeHandlers as makeRoles } from '#/app/api/events/[eventId]/roles/route'
import { makeHandlers as makeRole } from '#/app/api/events/[eventId]/roles/[roleId]/route'
import type { SessionUser } from '#/server/auth/session'
import { AppError } from '#/server/errors'
import {
  fakeEventRepository,
  fakeGuestRepository,
  fakeRoleRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from '../server/fakes'

const ROLE = JSON.stringify({
  title: 'Best Man',
  askText: '',
  note: '',
  attire: '',
})
const req = (method: string, body?: string) =>
  new Request('http://localhost/api', { method, body })

let current: SessionUser | null
let roles: ReturnType<typeof makeRoles>
let role: ReturnType<typeof makeRole>
let eventId: string

beforeEach(async () => {
  current = { id: OWNER, email: 'mika@example.com' }
  const deps = {
    events: fakeEventRepository(),
    users: fakeUserRepository(),
    roles: fakeRoleRepository(),
    guests: fakeGuestRepository(),
    getUser: async () => {
      if (!current) throw new AppError('UNAUTHORIZED', 'Log in to continue')
      return current
    },
  }
  roles = makeRoles(deps)
  role = makeRole(deps)
  const created = await makeEvents(deps).POST(
    req(
      'POST',
      JSON.stringify({
        type: 'wedding',
        title: 'M & P',
        eventDate: '2027-06-12',
        replyBy: '2027-03-31',
        themeKey: 'bohemian',
      }),
    ),
  )
  eventId = (await created.json()).data.id
})

const ctx = (roleId?: string) => ({
  params: Promise.resolve({ eventId, roleId: roleId ?? '' }),
})

it('adds, lists, edits and deletes a role', async () => {
  const created = await roles.POST(req('POST', ROLE), ctx())
  expect(created.status).toBe(201)
  const { id } = (await created.json()).data
  expect((await (await roles.GET(req('GET'), ctx())).json()).data).toHaveLength(
    1,
  )

  const patched = await role.PATCH(
    req('PATCH', JSON.stringify({ attire: 'Black suit' })),
    ctx(id),
  )
  expect((await patched.json()).data.attire).toBe('Black suit')

  expect((await role.DELETE(req('DELETE'), ctx(id))).status).toBe(200)
  expect((await (await roles.GET(req('GET'), ctx())).json()).data).toHaveLength(
    0,
  )
})

it('rejects a role without a title or with extra fields', async () => {
  for (const bad of [
    JSON.stringify({ title: '  ', askText: '', note: '', attire: '' }),
    JSON.stringify({ ...JSON.parse(ROLE), eventId: 'x' }),
  ]) {
    expect((await roles.POST(req('POST', bad), ctx())).status).toBe(400)
  }
})

it('answers 401 with no login and 404 to another host', async () => {
  current = null
  expect((await roles.GET(req('GET'), ctx())).status).toBe(401)
  current = { id: STRANGER, email: 's@example.com' }
  expect((await roles.GET(req('GET'), ctx())).status).toBe(404)
  expect((await roles.POST(req('POST', ROLE), ctx())).status).toBe(404)
})
