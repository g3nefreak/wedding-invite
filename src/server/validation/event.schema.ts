import { z } from 'zod'
import { EVENT_TYPE_KEYS } from '#/server/config/event-types'

// A calendar day written as YYYY-MM-DD, which is what a date input sends.
const day = z.iso.date('Enter a date')

const placeSchema = z.strictObject({
  venue: z.string().trim().max(120),
  time: z.string().trim().max(40),
})

// Type-specific content, stored in Event.details.
export const eventDetailsSchema = z.strictObject({
  headline: z.string().trim().max(200).optional(),
  ceremony: placeSchema.optional(),
  reception: placeSchema.optional(),
})

const title = z.string().trim().min(1, 'Enter a title').max(80)
const themeKey = z.string().min(1, 'Choose a theme').max(60)

export const REPLY_BY_MESSAGE =
  'Choose a reply-by date on or before the event date'

export const createEventSchema = z
  .strictObject({
    type: z.enum(EVENT_TYPE_KEYS),
    title,
    eventDate: day,
    replyBy: day,
    themeKey,
  })
  .refine((value) => value.replyBy <= value.eventDate, {
    path: ['replyBy'],
    message: REPLY_BY_MESSAGE,
  })

// Every field is optional: only what is sent is changed. The two dates are
// compared in the service, where the saved values are known.
export const updateEventSchema = z.strictObject({
  title: title.optional(),
  eventDate: day.optional(),
  replyBy: day.optional(),
  themeKey: themeKey.optional(),
  details: eventDetailsSchema.optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventDetails = z.infer<typeof eventDetailsSchema>
