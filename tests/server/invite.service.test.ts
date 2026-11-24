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
