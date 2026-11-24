import { api } from '#/lib/api'
import type { GuestInput, GuestView, UpdateGuestInput } from './guests.types'

const guestsPath = (eventId: string) =>
  `/api/events/${encodeURIComponent(eventId)}/guests`
const guestPath = (eventId: string, guestId: string) =>
  `${guestsPath(eventId)}/${encodeURIComponent(guestId)}`

export const GUESTS_SERVICE = {
  LIST: (eventId: string) => api<GuestView[]>(guestsPath(eventId)),
  CREATE: (eventId: string, input: GuestInput) =>
    api<GuestView[]>(guestsPath(eventId), {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  CREATE_MANY: (eventId: string, names: string[]) =>
    api<GuestView[]>(guestsPath(eventId), {
      method: 'POST',
      body: JSON.stringify({ names }),
    }),
  UPDATE: (eventId: string, guestId: string, input: UpdateGuestInput) =>
    api<GuestView>(guestPath(eventId, guestId), {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  DELETE: (eventId: string, guestId: string) =>
    api<{ deleted: boolean }>(guestPath(eventId, guestId), {
      method: 'DELETE',
    }),
}
