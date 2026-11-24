import { beforeEach, expect, it } from 'vitest'
import type { InviteRepository } from '#/server/repositories/invite.repository'
import { getInvite } from '#/server/services/invite.service'
import { saveRsvp } from '#/server/services/rsvp.service'
import { rsvpSchema } from '#/server/validation/rsvp.schema'
import type { RsvpInput } from '#/server/validation/rsvp.schema'
import {
  fakeInviteRepository,
  sampleRecords,
  T1,
  T2,
  UNKNOWN_VALID_SHAPE,
} from './fakes'

const now = new Date('2027-03-01T04:00:00Z')
const going: RsvpInput = { answer: 'going', message: '' }
let repo: InviteRepository

beforeEach(() => {
  repo = fakeInviteRepository(sampleRecords())
})

it('saves a reply', async () => {
  expect(
    await saveRsvp(T1, { answer: 'going', message: 'See you!' }, repo, now),
  ).toEqual({ answer: 'going', message: 'See you!' })
})

it('a second reply replaces the first', async () => {
  await saveRsvp(T1, { answer: 'going', message: '' }, repo, now)
  await saveRsvp(T1, { answer: 'not_going', message: 'Sorry' }, repo, now)
  expect((await getInvite(T1, repo, now)).reply).toEqual({
    answer: 'not_going',
    message: 'Sorry',
  })
})

it('accepts 11:30 PM Manila on the reply-by date', async () => {
  await expect(
    saveRsvp(T1, going, repo, new Date('2027-03-31T15:30:00Z')),
  ).resolves.toBeTruthy()
})

it('refuses 12:01 AM Manila the next day', async () => {
  await expect(
    saveRsvp(T1, going, repo, new Date('2027-03-31T16:01:00Z')),
  ).rejects.toMatchObject({ code: 'REPLY_CLOSED' })
})

it.each(['', 'ana-reyes', T2, UNKNOWN_VALID_SHAPE])(
  'refuses a reply for %s',
  async (t) => {
    await expect(saveRsvp(t, going, repo, now)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  },
)

it('schema rejects extra fields, long messages and other answers', () => {
  expect(rsvpSchema.safeParse({ answer: 'going', guestId: 'x' }).success).toBe(
    false,
  )
  expect(
    rsvpSchema.safeParse({ answer: 'going', message: 'a'.repeat(301) }).success,
  ).toBe(false)
  expect(rsvpSchema.safeParse({ answer: 'maybe' }).success).toBe(false)
})

it('schema trims the message and defaults it to empty', () => {
  expect(rsvpSchema.parse({ answer: 'going' })).toEqual(going)
  expect(rsvpSchema.parse({ answer: 'going', message: '  hi  ' }).message).toBe(
    'hi',
  )
})
