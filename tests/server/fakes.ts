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
