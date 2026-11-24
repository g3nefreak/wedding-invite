import { api } from '#/lib/api'
import type { Reply, RsvpInput } from './invite.types'

export const INVITE_SERVICE = {
  SAVE_RSVP: (token: string, input: RsvpInput) =>
    api<Reply>(`/api/invites/${encodeURIComponent(token)}/rsvp`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
}
