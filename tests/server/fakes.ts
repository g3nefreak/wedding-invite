import type {
  EventRecord,
  EventRepository,
} from '#/server/repositories/event.repository'
import type {
  RoleRecord,
  RoleRepository,
} from '#/server/repositories/role.repository'
import type { UserRepository } from '#/server/repositories/user.repository'
import type {
  GuestRecord,
  GuestRepository,
} from '#/server/repositories/guest.repository'
import type {
  InviteRecord,
  InviteRepository,
} from '#/server/repositories/invite.repository'

// Stands in for the database in tests. Records are keyed by guest token.
export function fakeInviteRepository(
  records: Record<string, InviteRecord>,
): InviteRepository {
  return {
    async findByToken(token) {
      // Object.hasOwn so a token like "toString" does not match by accident.
      return Object.hasOwn(records, token) ? records[token] : null
    },
    async upsertRsvp(guestId, answer, message) {
      const record = Object.values(records).find(
        (candidate) => candidate.guest.id === guestId,
      )
      if (!record) throw new Error(`No guest ${guestId} in the fake`)
      record.rsvp = { answer, message, updatedAt: new Date() }
      return record.rsvp
    },
  }
}

// Valid token shapes: 43 url-safe characters.
export const T1 = 'A'.repeat(43)
export const T2 = 'B'.repeat(43)
export const UNKNOWN_VALID_SHAPE = 'C'.repeat(43)

// A fresh copy per test, so a reply saved in one test cannot leak into another.
export function sampleRecords(): Record<string, InviteRecord> {
  const event = {
    type: 'wedding',
    eventDate: new Date('2027-04-24'),
    replyBy: new Date('2027-03-31'),
    timezone: 'Asia/Manila',
    details: { headline: 'We are getting married' },
    themeKey: 'black-and-white',
    design: {},
  }

  return {
    [T1]: {
      guest: {
        id: 'guest-1',
        name: 'Ana Reyes',
        personalNote: 'I cannot do it without you, Ana.',
      },
      role: {
        title: 'Maid of Honor',
        askText: 'Will you be my maid of honor?',
        note: 'You have been with me through everything.',
        attire: 'Floor-length gown',
        color: '#c9b8a6',
      },
      rsvp: null,
      event: {
        ...event,
        id: 'event-1',
        title: 'Mika & Paolo',
        status: 'published',
      },
    },
    [T2]: {
      guest: { id: 'guest-2', name: 'Bea Cruz', personalNote: null },
      role: null,
      rsvp: null,
      event: {
        ...event,
        id: 'event-2',
        title: 'Still a draft',
        status: 'draft',
      },
    },
  }
}

// ---- Events ----

export const OWNER = '11111111-1111-4111-8111-111111111111'
export const STRANGER = '22222222-2222-4222-8222-222222222222'

// Stands in for the Event table. Ids are counted up as valid UUIDs.
export function fakeEventRepository(): EventRepository & {
  rows: EventRecord[]
} {
  const rows: EventRecord[] = []
  let next = 1

  return {
    rows,
    async listByOwner(ownerId) {
      return rows.filter((row) => row.ownerId === ownerId)
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null
    },
    async create(data) {
      const id = `aaaaaaaa-aaaa-4aaa-8aaa-${String(next++).padStart(12, '0')}`
      const row: EventRecord = {
        ...data,
        id,
        timezone: 'Asia/Manila',
        status: 'draft',
        details: {},
        design: {},
      }
      rows.push(row)
      return row
    },
    async update(id, data) {
      const row = rows.find((candidate) => candidate.id === id)!
      // Like Prisma, a field left undefined is not changed.
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) Object.assign(row, { [key]: value })
      }
      return row
    },
    async delete(id) {
      rows.splice(
        rows.findIndex((row) => row.id === id),
        1,
      )
    },
  }
}

export function fakeUserRepository(): UserRepository {
  return { upsert: async (user) => user }
}

// ---- Roles ----

export function fakeRoleRepository(): RoleRepository & { rows: RoleRecord[] } {
  const rows: RoleRecord[] = []
  let next = 1

  return {
    rows,
    async listByEvent(eventId) {
      return rows.filter((row) => row.eventId === eventId)
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null
    },
    async create(eventId, data) {
      const id = `bbbbbbbb-bbbb-4bbb-8bbb-${String(next++).padStart(12, '0')}`
      const row = { id, eventId, ...data }
      rows.push(row)
      return row
    },
    async update(id, data) {
      const row = rows.find((candidate) => candidate.id === id)!
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) Object.assign(row, { [key]: value })
      }
      return row
    },
    async delete(id) {
      rows.splice(
        rows.findIndex((row) => row.id === id),
        1,
      )
    },
  }
}

// ---- Guests ----

export function fakeGuestRepository(): GuestRepository & {
  rows: GuestRecord[]
} {
  const rows: GuestRecord[] = []
  let next = 1

  return {
    rows,
    async listByEvent(eventId) {
      return rows.filter((row) => row.eventId === eventId)
    },
    async countByEvent(eventId) {
      return rows.filter((row) => row.eventId === eventId).length
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null
    },
    async createMany(eventId, guests) {
      const created = guests.map((guest) => ({
        id: `cccccccc-cccc-4ccc-8ccc-${String(next++).padStart(12, '0')}`,
        eventId,
        ...guest,
        rsvp: null,
      }))
      rows.push(...created)
      return created
    },
    async update(id, data) {
      const row = rows.find((candidate) => candidate.id === id)!
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) Object.assign(row, { [key]: value })
      }
      return row
    },
    async delete(id) {
      rows.splice(
        rows.findIndex((row) => row.id === id),
        1,
      )
    },
  }
}
