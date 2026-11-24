import { beforeEach, expect, it } from 'vitest'
import { makeHandlers as makeCollection } from '#/app/api/events/route'
import { makeHandlers as makeItem } from '#/app/api/events/[eventId]/route'
import { AppError } from '#/server/errors'
import type { SessionUser } from '#/server/auth/session'
import {
  fakeEventRepository,
  fakeGuestRepository,
  fakeRoleRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from '../server/fakes'

const BODY = JSON.stringify({
  type: 'wedding',
  title: 'Mika & Paolo',
  eventDate: '2027-06-12',
  replyBy: '2027-03-31',
  themeKey: 'black-and-white',
})

function req(method: string, body?: string) {
  return new Request('http://localhost/api/events', { method, body })
}
const ctx = (eventId: string) => ({ params: Promise.resolve({ eventId }) })

let current: SessionUser | null
let collection: ReturnType<typeof makeCollection>
let item: ReturnType<typeof makeItem>

beforeEach(() => {
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
  collection = makeCollection(deps)
  item = makeItem(deps)
})

it('every route answers 401 when nobody is logged in', async () => {
  current = null
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'
  const results = await Promise.all([
    collection.GET(),
    collection.POST(req('POST', BODY)),
    item.GET(req('GET'), ctx(id)),
    item.PATCH(req('PATCH', '{}'), ctx(id)),
    item.DELETE(req('DELETE'), ctx(id)),
  ])
  expect(results.map((res) => res.status)).toEqual([401, 401, 401, 401, 401])
})

it('creates, lists, reads, edits and deletes an event', async () => {
  const created = await collection.POST(req('POST', BODY))
  expect(created.status).toBe(201)
  const { id } = (await created.json()).data

  expect((await (await collection.GET()).json()).data).toHaveLength(1)
  expect((await (await item.GET(req('GET'), ctx(id))).json()).data.title).toBe(
    'Mika & Paolo',
  )

  const patched = await item.PATCH(
    req('PATCH', JSON.stringify({ title: 'M & P' })),
    ctx(id),
  )
  expect((await patched.json()).data.title).toBe('M & P')

  expect((await item.DELETE(req('DELETE'), ctx(id))).status).toBe(200)
  expect((await (await collection.GET()).json()).data).toHaveLength(0)
})

it('rejects a body with missing or extra fields', async () => {
  for (const bad of [
    '{not json',
    '{}',
    JSON.stringify({ ...JSON.parse(BODY), ownerId: STRANGER }),
  ]) {
    expect((await collection.POST(req('POST', bad))).status).toBe(400)
  }
})

it('another host gets 404 for an event that is not theirs', async () => {
  const { id } = (await (await collection.POST(req('POST', BODY))).json()).data
  current = { id: STRANGER, email: 's@example.com' }
  expect((await item.GET(req('GET'), ctx(id))).status).toBe(404)
  expect((await item.DELETE(req('DELETE'), ctx(id))).status).toBe(404)
})
