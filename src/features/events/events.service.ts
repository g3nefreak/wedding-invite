import { api } from '#/lib/api'
import type {
  CreateEventInput,
  EventView,
  ThemeOption,
  UpdateEventInput,
} from './events.types'

const eventPath = (id: string) => `/api/events/${encodeURIComponent(id)}`

export const EVENTS_SERVICE = {
  LIST: () => api<EventView[]>('/api/events'),
  GET: (id: string) => api<EventView>(eventPath(id)),
  CREATE: (input: CreateEventInput) =>
    api<EventView>('/api/events', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  UPDATE: (id: string, input: UpdateEventInput) =>
    api<EventView>(eventPath(id), {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  PUBLISH: (id: string) =>
    api<EventView>(`${eventPath(id)}/publish`, { method: 'POST' }),
  DELETE: (id: string) =>
    api<{ deleted: boolean }>(eventPath(id), { method: 'DELETE' }),
  THEMES: (eventType: string) =>
    api<ThemeOption[]>(
      `/api/themes?eventType=${encodeURIComponent(eventType)}`,
    ),
}
