import type { EventView } from '#/features/events/events.types'
import { api } from '#/lib/api'
import type { SectionsInput } from '#/server/validation/sections.schema'

const eventPath = (eventId: string) =>
  `/api/events/${encodeURIComponent(eventId)}`

export const SECTIONS_SERVICE = {
  // Saves the whole invitation: every section, in order, plus the cover.
  SAVE: (eventId: string, input: SectionsInput) =>
    api<EventView>(`${eventPath(eventId)}/sections`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  UPLOAD_PHOTO: (eventId: string, photo: Blob, use: 'photo' | 'qr') => {
    const form = new FormData()
    form.append('file', photo, 'photo')
    form.append('kind', 'section')
    form.append('use', use)
    return api<EventView>(`${eventPath(eventId)}/assets`, {
      method: 'POST',
      body: form,
    })
  },

  DELETE_PHOTO: (eventId: string, assetId: string) =>
    api<EventView>(
      `${eventPath(eventId)}/assets/${encodeURIComponent(assetId)}`,
      { method: 'DELETE' },
    ),
}
