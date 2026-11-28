import { beforeEach, expect, it } from 'vitest'
import type { InviteRepository } from '#/server/repositories/invite.repository'
import { getInvite, isReplyOpen } from '#/server/services/invite.service'
import {
  fakeInviteRepository,
  sampleRecords,
  T1,
  T2,
  UNKNOWN_VALID_SHAPE,
} from './fakes'

const now = new Date('2027-03-01T04:00:00Z')
let repo: InviteRepository

beforeEach(() => {
  repo = fakeInviteRepository(sampleRecords())
})

it('returns the guest invitation', async () => {
  const v = await getInvite(T1, repo, now)
  expect(v.guestName).toBe('Ana Reyes')
  expect(v.design.fonts.display).toBe('Bodoni Moda')
  expect(v.event.eventDate).toBe('2027-04-24')
  expect(v.event.replyBy).toBe('2027-03-31')
  expect(v.reply).toBeNull()
  expect(v.replyOpen).toBe(true)
})

it('prefers the personal note over the role note', async () => {
  expect((await getInvite(T1, repo, now)).note).toBe(
    'I cannot do it without you, Ana.',
  )
})

it('falls back to the role note, then to no note', async () => {
  const records = sampleRecords()
  records[T1].guest.personalNote = null
  const withRole = await getInvite(T1, fakeInviteRepository(records), now)
  expect(withRole.note).toBe('You have been with me through everything.')

  records[T1].role = null
  const bare = await getInvite(T1, fakeInviteRepository(records), now)
  expect(bare.note).toBeNull()
})

it('exposes nothing about other guests or internals', async () => {
  const json = JSON.stringify(await getInvite(T1, repo, now))
  for (const leak of ['Bea Cruz', T2, 'ownerId', '"id"'])
    expect(json).not.toContain(leak)
})

it('ignores saved design values a host is not allowed to set', async () => {
  const records = sampleRecords()
  records[T1].event.design = { accent: '#ff0000', ground: '#123456', art: 'x' }
  const v = await getInvite(T1, fakeInviteRepository(records), now)
  expect(v.design.palette.accent).toBe('#ff0000')
  expect(v.design.palette.ground).toBe('#0b0b0b')
  expect(v.design.art).toBe('photo')
})

it.each(['', 'ana-reyes', 'a'.repeat(5000), T2, UNKNOWN_VALID_SHAPE])(
  '404s for %s',
  async (t) => {
    await expect(getInvite(t, repo, now)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Invitation not found',
    })
  },
)

it('keeps replies open through the whole reply-by day in the event timezone', () => {
  const replyBy = new Date('2027-03-31')
  // 11:59 PM in Manila on the 31st, then 12:00 AM on April 1.
  expect(
    isReplyOpen(replyBy, 'Asia/Manila', new Date('2027-03-31T15:59:00Z')),
  ).toBe(true)
  expect(
    isReplyOpen(replyBy, 'Asia/Manila', new Date('2027-03-31T16:00:00Z')),
  ).toBe(false)
})

it('returns the cover, the enabled sections and the countdown target', async () => {
  const v = await getInvite(T1, repo, now)
  expect(v.cover).toEqual({
    enabled: true,
    monogram: 'M&P',
    line: 'You have a letter',
  })
  // Nothing saved yet, so the wedding defaults are used and the old headline
  // is carried into the opening section.
  expect(v.sections[0]).toMatchObject({
    type: 'hero',
    content: { kicker: 'We are getting married', photo: null },
  })
  expect(v.sections.map((section) => section.type)).not.toContain('story')
  // No time set: the countdown runs to the start of the day in Manila.
  expect(v.startsAt).toBe('2027-04-23T16:00:00.000Z')
  // The event day runs until the next midnight in Manila.
  expect(v.dayEndsAt).toBe('2027-04-24T16:00:00.000Z')
})

it('counts down to the first place time and shows section photos', async () => {
  const records = sampleRecords()
  records[T1].event.sections = [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      content: { kicker: '', photoAssetId: 'p1' },
    },
    {
      id: 'whenWhere',
      type: 'whenWhere',
      enabled: true,
      content: {
        places: [
          {
            label: 'Ceremony',
            venue: 'Church',
            time: '2:00 PM',
            address: '',
            mapUrl: '',
          },
        ],
      },
    },
    { id: 'rsvp', type: 'rsvp', enabled: true, content: { intro: '' } },
  ]
  records[T1].sectionPhotos = [
    { id: 'p1', path: 'event-1/p1.webp', width: 800, height: 600 },
  ]
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example'
  const v = await getInvite(T1, fakeInviteRepository(records), now)
  expect(v.startsAt).toBe('2027-04-24T06:00:00.000Z')
  expect(v.sections[0]).toMatchObject({
    content: { photo: { url: expect.stringContaining('event-1/p1.webp') } },
  })
})

it('never includes anything about other guests in the sections', async () => {
  const v = await getInvite(T1, repo, now)
  expect(JSON.stringify([v.sections, v.cover])).not.toContain('Bea Cruz')
})
