import { AppError } from '#/server/errors'
import type {
  InviteRepository,
  RsvpAnswer,
} from '#/server/repositories/invite.repository'
import {
  findPublishedInvite,
  isReplyOpen,
} from '#/server/services/invite.service'
import type { RsvpInput } from '#/server/validation/rsvp.schema'

// Saves a guest's reply. Replying again replaces the earlier answer.
export async function saveRsvp(
  token: string,
  input: RsvpInput,
  repo: InviteRepository,
  now: Date,
): Promise<{ answer: RsvpAnswer; message: string }> {
  const { guest, event } = await findPublishedInvite(token, repo)

  if (!isReplyOpen(event.replyBy, event.timezone, now)) {
    throw new AppError('REPLY_CLOSED', 'Replies are closed for this event')
  }

  const saved = await repo.upsertRsvp(guest.id, input.answer, input.message)
  return { answer: saved.answer, message: saved.message }
}
