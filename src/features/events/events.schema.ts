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
  }
}

// The invitation's wording and places are edited on the Invitation tab, so
// this form sends only the title and dates and leaves the rest untouched.
export function toUpdateInput(values: EventFormValues): UpdateEventInput {
  return {
    title: values.title,
    eventDate: values.eventDate,
    replyBy: values.replyBy,
  }
}
