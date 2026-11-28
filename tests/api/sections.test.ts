import { beforeEach, expect, it } from 'vitest'
import { makeHandlers as makeCollection } from '#/app/api/events/route'
import { makeHandlers } from '#/app/api/events/[eventId]/sections/route'
import { AppError } from '#/server/errors'
import type { SessionUser } from '#/server/auth/session'
import {
  fakeAssetRepository,
  fakeEventRepository,
  fakeGuestRepository,
  fakeRoleRepository,
  fakeUserRepository,
  OWNER,
} from '../server/fakes'
import { cover, hero, rsvp } from '../server/section-samples'

let current: SessionUser | null
let route: ReturnType<typeof makeHandlers>
let eventId: string

const ctx = () => ({ params: Promise.resolve({ eventId }) })
const patch = (body: unknown) =>
  route.PATCH(
    new Request('http://localhost/api/events/x/sections', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    ctx(),
  )

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
  route = makeHandlers(deps, { assets: fakeAssetRepository() })
  const created = await makeCollection(deps).POST(
    new Request('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'wedding',
        title: 'Mika & Paolo',
        eventDate: '2027-06-12',
        replyBy: '2027-03-31',
        themeKey: 'black-and-white',
      }),
    }),
  )
  eventId = (await created.json()).data.id
})

it('saves for the owner', async () => {
  const res = await patch({ sections: [hero, rsvp], cover })
  expect(res.status).toBe(200)
  expect((await res.json()).data.sections).toHaveLength(2)
})

it('answers 401 when nobody is logged in', async () => {
  current = null
  expect((await patch({ sections: [hero, rsvp], cover })).status).toBe(401)
})

it('answers 400 for an unknown field', async () => {
  const res = await patch({ sections: [hero, rsvp], cover, css: 'x' })
  expect(res.status).toBe(400)
})

it('answers 400 with the rule in plain words', async () => {
  const res = await patch({ sections: [rsvp], cover })
  expect(res.status).toBe(400)
  expect((await res.json()).error.message).toMatch(/opening section/i)
})
