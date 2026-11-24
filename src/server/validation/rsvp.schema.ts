import { z } from 'zod'

// Strict: a body with any extra field (like someone else's guestId) is refused.
export const rsvpSchema = z.strictObject({
  answer: z.enum(['going', 'not_going']),
  message: z.string().trim().max(300).default(''),
})

export type RsvpInput = z.infer<typeof rsvpSchema>
