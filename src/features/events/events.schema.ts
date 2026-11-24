import { z } from 'zod'
import { REPLY_BY_MESSAGE } from '#/server/validation/event.schema'
import type { UpdateEventInput } from '#/server/validation/event.schema'
import type { EventView } from './events.types'

// The edit form keeps every field as plain text. It is turned into the shape
// the API expects by `toUpdateInput` below; the server checks it again.
export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title').max(80),
    eventDate: z.iso.date('Enter the event date'),
    replyBy: z.iso.date('Enter the reply-by date'),
    headline: z.string().trim().max(200),
    ceremonyVenue: z.string().trim().max(120),
    ceremonyTime: z.string().trim().max(40),
    receptionVenue: z.string().trim().max(120),
    receptionTime: z.string().trim().max(40),
  })
  .refine((value) => value.replyBy <= value.eventDate, {
    path: ['replyBy'],
    message: REPLY_BY_MESSAGE,
  })

export type EventFormValues = z.infer<typeof eventFormSchema>

export function toFormValues(event: EventView): EventFormValues {
  return {
    title: event.title,
    eventDate: event.eventDate,
    replyBy: event.replyBy,
    headline: event.details.headline ?? '',
    ceremonyVenue: event.details.ceremony?.venue ?? '',
    ceremonyTime: event.details.ceremony?.time ?? '',
    receptionVenue: event.details.reception?.venue ?? '',
    receptionTime: event.details.reception?.time ?? '',
  }
}

// A place is only saved when the host typed something for it.
function place(venue: string, time: string) {
  return venue || time ? { venue, time } : undefined
}

export function toUpdateInput(values: EventFormValues): UpdateEventInput {
  return {
    title: values.title,
    eventDate: values.eventDate,
    replyBy: values.replyBy,
    details: {
      headline: values.headline || undefined,
      ceremony: place(values.ceremonyVenue, values.ceremonyTime),
      reception: place(values.receptionVenue, values.receptionTime),
    },
  }
}
