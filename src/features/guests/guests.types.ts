// `import type` only: nothing from the backend ends up in the browser bundle.
export type { GuestView } from '#/server/services/guest.service'
export type {
  GuestInput,
  UpdateGuestInput,
} from '#/server/validation/guest.schema'
