import { beforeEach, expect, it } from 'vitest'
import { makeHandlers as makeEvents } from '#/app/api/events/route'
import { makeHandlers as makeGuests } from '#/app/api/events/[eventId]/guests/route'
import { makeHandlers as makeGuest } from '#/app/api/events/[eventId]/guests/[guestId]/route'
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

const req = (method: string, body?: unknown) =>
  new Request('http://localhost/api', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

let current: SessionUser | null
let guests: ReturnType<typeof makeGuests>
let guest: ReturnType<typeof makeGuest>
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
  guests = makeGuests(deps)
  guest = makeGuest(deps)
  const created = await makeEvents(deps).POST(
    req('POST', {
      type: 'wedding',
      title: 'M & P',
      eventDate: '2027-06-12',
      replyBy: '2027-03-31',
      themeKey: 'bohemian',
    }),
  )
  eventId = (await created.json()).data.id
})

const ctx = (guestId = '') => ({
  params: Promise.resolve({ eventId, guestId }),
})

it('adds one guest, then a pasted list, and lists them', async () => {
  const one = await guests.POST(
    req('POST', { name: 'Ana Reyes', roleId: null, personalNote: '' }),
    ctx(),
  )
  expect(one.status).toBe(201)
  expect((await one.json()).data).toHaveLength(1)

  const many = await guests.POST(
    req('POST', { names: ['Bea Cruz', 'Carlo Santos'] }),
    ctx(),
  )
  expect((await many.json()).data).toHaveLength(2)
  expect(
    (await (await guests.GET(req('GET'), ctx())).json()).data,
  ).toHaveLength(3)
})

it('edits and deletes a guest', async () => {
  const created = await guests.POST(
    req('POST', { names: ['Ana Reyes'] }),
    ctx(),
  )
  const { id } = (await created.json()).data[0]
  const patched = await guest.PATCH(req('PATCH', { name: 'Ana R.' }), ctx(id))
  expect((await patched.json()).data.name).toBe('Ana R.')
  expect((await guest.DELETE(req('DELETE'), ctx(id))).status).toBe(200)
})

it('rejects empty names, an empty list, extra fields and a token sent by the client', async () => {
  for (const bad of [
    { name: ' ', roleId: null, personalNote: '' },
    { names: [] },
    { names: ['Ana', ''] },
    { names: ['Ana'], name: 'Ana' },
    { name: 'Ana', roleId: null, personalNote: '', token: 'my-own-token' },
  ]) {
    expect((await guests.POST(req('POST', bad), ctx())).status).toBe(400)
  }
})

it('answers 401 with no login and 404 to another host', async () => {
  current = null
  expect((await guests.GET(req('GET'), ctx())).status).toBe(401)
  current = { id: STRANGER, email: 's@example.com' }
  expect((await guests.GET(req('GET'), ctx())).status).toBe(404)
  expect((await guests.POST(req('POST', { names: ['X'] }), ctx())).status).toBe(
    404,
  )
})
