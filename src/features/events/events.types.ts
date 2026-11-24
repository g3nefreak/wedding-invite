// `import type` only: nothing from the backend ends up in the browser bundle.
export type { EventView } from '#/server/services/event.service'
export type {
  CreateEventInput,
  UpdateEventInput,
} from '#/server/validation/event.schema'

// The full theme, as the design screen needs its colors and font pairs.
export type { Theme as ThemeOption } from '#/server/config/themes'
