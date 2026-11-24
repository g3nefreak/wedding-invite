import type { EventView } from '#/features/events/events.types'
import { api } from '#/lib/api'
import type { DesignInput } from '#/server/validation/design.schema'

const assetsPath = (eventId: string) =>
  `/api/events/${encodeURIComponent(eventId)}/assets`

export const DESIGN_SERVICE = {
  UPDATE: (eventId: string, input: DesignInput) =>
    api<EventView>(`/api/events/${encodeURIComponent(eventId)}/design`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  UPLOAD_PHOTO: (eventId: string, photo: Blob) => {
    const form = new FormData()
    form.append('file', photo, 'background')
    return api<EventView>(assetsPath(eventId), { method: 'POST', body: form })
  },

  REMOVE_PHOTO: (eventId: string) =>
    api<EventView>(assetsPath(eventId), { method: 'DELETE' }),
}
