import { isTokenShape } from '#/server/auth/token'
import { EVENT_TYPES } from '#/server/config/event-types'
import type { EventTypeKey } from '#/server/config/event-types'
import { getTheme } from '#/server/config/themes'
import type { ResolvedDesign } from '#/server/config/themes'
import { AppError } from '#/server/errors'
import type {
  InviteRecord,
  InviteRepository,
  RsvpAnswer,
} from '#/server/repositories/invite.repository'
import { resolveDesign } from '#/server/services/design.service'
import { publicPhotoUrl } from '#/server/storage/photo.storage'
import { readDesignOverrides } from '#/server/validation/design.schema'

// What one guest is allowed to see. No ids, nothing about other guests.
export type InviteView = {
  guestName: string
  role: InviteRecord['role']
  note: string | null
  event: {
    type: string
    // The type's display name, such as "Wedding".
    typeName: string
    title: string
    eventDate: string
    replyBy: string
    details: unknown
  }
  design: ResolvedDesign
  // The host's background photo, when they uploaded one.
  backgroundUrl: string | null
  reply: { answer: RsvpAnswer; message: string } | null
  replyOpen: boolean
}

function eventTypeName(type: string): string {
  return Object.hasOwn(EVENT_TYPES, type)
    ? EVENT_TYPES[type as EventTypeKey].name
    : 'Event'
}

// Date-only columns come back as midnight UTC, so the UTC date is the day.
function toDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Today's calendar date (YYYY-MM-DD) as people in that timezone see it.
function dayInTimezone(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

// Replies stay open until the reply-by day ends where the event is held.
export function isReplyOpen(
  replyBy: Date,
  timezone: string,
  now: Date,
): boolean {
  return dayInTimezone(now, timezone) <= toDay(replyBy)
}

// A badly shaped token, an unknown token and a draft event all get the same
// answer, so nobody can learn which links exist by trying them.
export async function findPublishedInvite(
  token: string,
  repo: InviteRepository,
): Promise<InviteRecord> {
  const record = isTokenShape(token) ? await repo.findByToken(token) : null
  if (!record || record.event.status !== 'published') {
    throw new AppError('NOT_FOUND', 'Invitation not found')
  }
  return record
}

export async function getInvite(
  token: string,
  repo: InviteRepository,
  now: Date,
): Promise<InviteView> {
  const record = await findPublishedInvite(token, repo)
  const { guest, role, rsvp, event } = record

  return {
    guestName: guest.name,
    role,
    note: guest.personalNote ?? role?.note ?? null,
    event: {
      type: event.type,
      typeName: eventTypeName(event.type),
      title: event.title,
      eventDate: toDay(event.eventDate),
      replyBy: toDay(event.replyBy),
      details: event.details,
    },
    design: resolveDesign(
      getTheme(event.themeKey),
      readDesignOverrides(event.design),
    ),
    backgroundUrl: publicPhotoUrl(record.backgroundPath),
    reply: rsvp ? { answer: rsvp.answer, message: rsvp.message } : null,
    replyOpen: isReplyOpen(event.replyBy, event.timezone, now),
  }
}
