import { beforeEach, expect, it } from 'vitest'
import { isTokenShape } from '#/server/auth/token'
import { createEvent } from '#/server/services/event.service'
import {
  createGuest,
  createGuests,
  deleteGuest,
  listGuests,
  MAX_GUESTS,
  updateGuest,
} from '#/server/services/guest.service'
import { createRole } from '#/server/services/role.service'
import {
  fakeEventRepository,
  fakeGuestRepository,
  fakeRoleRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'

const eventInput = {
  type: 'wedding' as const,
  title: 'Mika & Paolo',
  eventDate: '2027-06-12',
  replyBy: '2027-03-31',
  themeKey: 'black-and-white',
}
const role = { title: 'Maid of Honor', askText: '', note: '', attire: '' }
const ana = { name: 'Ana Reyes', roleId: null, personalNote: '' }
const notFound = { code: 'NOT_FOUND' }

let repos: {
  events: ReturnType<typeof fakeEventRepository>
  roles: ReturnType<typeof fakeRoleRepository>
  guests: ReturnType<typeof fakeGuestRepository>
}
let eventId: string
let otherEventId: string

beforeEach(async () => {
  repos = {
    events: fakeEventRepository(),
    roles: fakeRoleRepository(),
    guests: fakeGuestRepository(),
  }
  const users = fakeUserRepository()
  const owner = { id: OWNER, email: 'mika@example.com' }
  eventId = (
    await createEvent(owner, eventInput, { events: repos.events, users })
  ).id
  otherEventId = (
    await createEvent(owner, eventInput, { events: repos.events, users })
  ).id
})

it('adds a guest with their own random link token', async () => {
  const guest = await createGuest(OWNER, eventId, ana, repos)
  expect(guest).toMatchObject({ name: 'Ana Reyes', roleId: null, reply: null })
  expect(isTokenShape(guest.token)).toBe(true)
  expect(guest.token).not.toContain('ana')
})

it('adds a pasted list, each guest with a different token', async () => {
  const guests = await createGuests(
    OWNER,
    eventId,
    ['Ana Reyes', 'Bea Cruz', 'Carlo Santos'],
    repos,
  )
  expect(guests.map((guest) => guest.name)).toEqual([
    'Ana Reyes',
    'Bea Cruz',
    'Carlo Santos',
  ])
  expect(new Set(guests.map((guest) => guest.token)).size).toBe(3)
  expect(await listGuests(OWNER, eventId, repos)).toHaveLength(3)
  expect(await listGuests(OWNER, otherEventId, repos)).toHaveLength(0)
})

it('refuses to go past the guest limit', async () => {
  const names = Array.from(
    { length: MAX_GUESTS },
    (_, index) => `Guest ${index}`,
  )
  await createGuests(OWNER, eventId, names, repos)
  await expect(createGuest(OWNER, eventId, ana, repos)).rejects.toMatchObject({
    code: 'VALIDATION',
  })
})

it('gives a guest a role of this event, but not of another event', async () => {
  const mine = await createRole(OWNER, eventId, role, repos)
  const elsewhere = await createRole(OWNER, otherEventId, role, repos)
  expect(
    (await createGuest(OWNER, eventId, { ...ana, roleId: mine.id }, repos))
      .roleId,
  ).toBe(mine.id)
  await expect(
    createGuest(OWNER, eventId, { ...ana, roleId: elsewhere.id }, repos),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  const guest = await createGuest(OWNER, eventId, ana, repos)
  await expect(
    updateGuest(OWNER, eventId, guest.id, { roleId: elsewhere.id }, repos),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('shows the guest’s reply to the host', async () => {
  const guest = await createGuest(OWNER, eventId, ana, repos)
  repos.guests.rows[0].rsvp = {
    answer: 'going',
    message: 'See you!',
    updatedAt: new Date(),
  }
  expect((await listGuests(OWNER, eventId, repos))[0]).toMatchObject({
    id: guest.id,
    reply: { answer: 'going', message: 'See you!' },
  })
})

it('a stranger cannot list, add, edit or delete guests', async () => {
  const guest = await createGuest(OWNER, eventId, ana, repos)
  await expect(listGuests(STRANGER, eventId, repos)).rejects.toMatchObject(
    notFound,
  )
  await expect(
    createGuest(STRANGER, eventId, ana, repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    createGuests(STRANGER, eventId, ['X'], repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    updateGuest(STRANGER, eventId, guest.id, { name: 'X' }, repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    deleteGuest(STRANGER, eventId, guest.id, repos),
  ).rejects.toMatchObject(notFound)
  expect(repos.guests.rows).toHaveLength(1)
})

it('a guest cannot be reached through a different event', async () => {
  const guest = await createGuest(OWNER, eventId, ana, repos)
  await expect(
    updateGuest(OWNER, otherEventId, guest.id, { name: 'X' }, repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    deleteGuest(OWNER, otherEventId, guest.id, repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    deleteGuest(OWNER, eventId, 'not-an-id', repos),
  ).rejects.toMatchObject(notFound)
})

it('edits a guest without changing their link, and deletes them', async () => {
  const guest = await createGuest(OWNER, eventId, ana, repos)
  const edited = await updateGuest(
    OWNER,
    eventId,
    guest.id,
    { name: 'Ana R.', personalNote: 'Hi' },
    repos,
  )
  expect(edited).toMatchObject({
    name: 'Ana R.',
    personalNote: 'Hi',
    token: guest.token,
  })
  await deleteGuest(OWNER, eventId, guest.id, repos)
  expect(repos.guests.rows).toHaveLength(0)
})
