import { beforeEach, expect, it } from 'vitest'
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  publishEvent,
  updateEvent,
} from '#/server/services/event.service'
import {
  fakeEventRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'

const owner = { id: OWNER, email: 'mika@example.com' }
const input = {
  type: 'wedding' as const,
  title: 'Mika & Paolo',
  eventDate: '2027-06-12',
  replyBy: '2027-03-31',
  themeKey: 'black-and-white',
}

let events: ReturnType<typeof fakeEventRepository>
const users = fakeUserRepository()

beforeEach(() => {
  events = fakeEventRepository()
})

it('creates a draft event owned by the host', async () => {
  const event = await createEvent(owner, input, { events, users })
  expect(event).toMatchObject({
    title: 'Mika & Paolo',
    eventDate: '2027-06-12',
    replyBy: '2027-03-31',
    status: 'draft',
    themeKey: 'black-and-white',
  })
  expect(events.rows[0].ownerId).toBe(OWNER)
  // The owner id never leaves the server.
  expect(JSON.stringify(event)).not.toContain(OWNER)
})

it('refuses a theme that does not exist', async () => {
  await expect(
    createEvent(owner, { ...input, themeKey: 'nope' }, { events, users }),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('lists only the host’s own events', async () => {
  await createEvent(owner, input, { events, users })
  await createEvent({ id: STRANGER, email: 's@example.com' }, input, {
    events,
    users,
  })
  expect(await listEvents(OWNER, events)).toHaveLength(1)
})

it('treats another host’s event, a missing event and a malformed id as not found', async () => {
  const mine = await createEvent(owner, input, { events, users })
  for (const [user, id] of [
    [STRANGER, mine.id],
    [OWNER, 'aaaaaaaa-aaaa-4aaa-8aaa-999999999999'],
    [OWNER, 'not-an-id'],
  ] as const) {
    await expect(getEvent(user, id, events)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  }
})

it('a stranger cannot update, publish or delete it', async () => {
  const mine = await createEvent(owner, input, { events, users })
  await expect(
    updateEvent(STRANGER, mine.id, { title: 'Hacked' }, events),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  await expect(publishEvent(STRANGER, mine.id, events)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  })
  await expect(deleteEvent(STRANGER, mine.id, events)).rejects.toMatchObject({
    code: 'NOT_FOUND',
  })
  expect(events.rows[0]).toMatchObject({
    title: 'Mika & Paolo',
    status: 'draft',
  })
})

it('updates the title and details', async () => {
  const mine = await createEvent(owner, input, { events, users })
  const updated = await updateEvent(
    OWNER,
    mine.id,
    {
      title: 'M & P',
      details: {
        headline: 'Join us',
        ceremony: { venue: 'San Agustin', time: '3:00 PM' },
      },
    },
    events,
  )
  expect(updated.title).toBe('M & P')
  expect(updated.details).toEqual({
    headline: 'Join us',
    ceremony: { venue: 'San Agustin', time: '3:00 PM' },
  })
})

it('refuses a reply-by date after the event date, also when only one of them changes', async () => {
  const mine = await createEvent(owner, input, { events, users })
  await expect(
    updateEvent(OWNER, mine.id, { replyBy: '2027-07-01' }, events),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  await expect(
    updateEvent(OWNER, mine.id, { eventDate: '2027-01-01' }, events),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('publishes and deletes', async () => {
  const mine = await createEvent(owner, input, { events, users })
  expect((await publishEvent(OWNER, mine.id, events)).status).toBe('published')
  await deleteEvent(OWNER, mine.id, events)
  expect(events.rows).toHaveLength(0)
})
