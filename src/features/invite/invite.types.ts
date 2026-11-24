import type { RsvpAnswer } from '#/server/repositories/invite.repository'

// `import type` only: nothing from the backend ends up in the browser bundle.
export type { ResolvedDesign } from '#/server/config/themes'
export type { InviteView } from '#/server/services/invite.service'
export type { RsvpInput } from '#/server/validation/rsvp.schema'
export type { RsvpAnswer }

export type Reply = { answer: RsvpAnswer; message: string }
