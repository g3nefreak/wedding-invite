import { z } from 'zod'
import type { SessionUser } from '#/server/auth/session'
import { EVENT_TYPES, isEventType } from '#/server/config/event-types'
import { listThemes } from '#/server/config/themes'
import type { SectionPhoto } from '#/lib/sections'
import type { DesignOverrides } from '#/server/config/themes'
import { AppError } from '#/server/errors'
import type {
  EventRecord,
  EventRepository,
} from '#/server/repositories/event.repository'
import type { UserRepository } from '#/server/repositories/user.repository'
import { ensureHost } from '#/server/services/host.service'
import { publicPhotoUrl } from '#/server/storage/photo.storage'
import { readDesignOverrides } from '#/server/validation/design.schema'
import { readWeddingDetails } from '#/server/validation/details.schema'
import { readCover, readSections } from '#/server/validation/sections.schema'
import type { Block, Cover } from '#/server/validation/sections.schema'
import { REPLY_BY_MESSAGE } from '#/server/validation/event.schema'
import type {
  CreateEventInput,
  EventDetails,
  UpdateEventInput,
} from '#/server/validation/event.schema'

// What a host sees of their event. The owner id stays on the server.
export type EventView = {
  id: string
  type: string
  title: string
  eventDate: string
  replyBy: string
  status: 'draft' | 'published'
  themeKey: string
  details: EventDetails
  // The host's saved choices on top of the theme.
  design: DesignOverrides
  // The background photo's address, when the host uploaded one.
  backgroundUrl: string | null
  // Every photo uploaded for the sections, whether a section uses it or not.
  sectionPhotos: SectionPhoto[]
  // The section blocks exactly as saved. Empty until the host first saves.
  sections: Block[]
  cover: Cover
  // Whether this kind of event has roles, such as a wedding entourage.
  hasRoles: boolean
  // The event type's display name, such as "Wedding".
  typeName: string
  timezone: string
}

const toDay = (date: Date) => date.toISOString().slice(0, 10)
const toDate = (day: string) => new Date(`${day}T00:00:00Z`)

export function toEventView(event: EventRecord): EventView {
  const eventType = isEventType(event.type)
    ? EVENT_TYPES[event.type]
    : undefined

  return {
    id: event.id,
    type: event.type,
    title: event.title,
    eventDate: toDay(event.eventDate),
    replyBy: toDay(event.replyBy),
    status: event.status,
    themeKey: event.themeKey,
    details: readWeddingDetails(event.details),
    design: readDesignOverrides(event.design),
    backgroundUrl: publicPhotoUrl(event.backgroundPath),
    sectionPhotos: (event.sectionAssets ?? []).flatMap((asset) => {
      const url = publicPhotoUrl(asset.path)
      return url
        ? [{ id: asset.id, url, width: asset.width, height: asset.height }]
        : []
    }),
    sections: readSections(event.sections),
    cover: readCover(event.cover, event.title),
    hasRoles: eventType?.hasRoles ?? false,
    typeName: eventType?.name ?? 'Event',
    timezone: event.timezone,
  }
}

function assertThemeFits(type: string, themeKey: string) {
  if (
    !isEventType(type) ||
    !listThemes(type).some((theme) => theme.key === themeKey)
  ) {
    throw new AppError('VALIDATION', 'Choose one of the listed themes')
  }
}

// The one ownership check every host action goes through. Someone else's
// event, a missing one and a malformed id all look the same from outside,
// so nobody can find out which event ids exist.
export async function findOwnedEvent(
  userId: string,
  eventId: string,
  repo: EventRepository,
): Promise<EventRecord> {
  const event = z.uuid().safeParse(eventId).success
    ? await repo.findById(eventId)
    : null
  if (!event || event.ownerId !== userId) {
    throw new AppError('NOT_FOUND', 'Event not found')
  }
  return event
}

export async function listEvents(
  userId: string,
  repo: EventRepository,
): Promise<EventView[]> {
  return (await repo.listByOwner(userId)).map(toEventView)
}

export async function createEvent(
  user: SessionUser,
  input: CreateEventInput,
  repos: { events: EventRepository; users: UserRepository },
): Promise<EventView> {
  assertThemeFits(input.type, input.themeKey)
  // An event needs its owner's row to exist first.
  await ensureHost(user, repos.users)

  const event = await repos.events.create({
    ownerId: user.id,
    type: input.type,
    title: input.title,
    eventDate: toDate(input.eventDate),
    replyBy: toDate(input.replyBy),
    themeKey: input.themeKey,
  })
  return toEventView(event)
}

export async function getEvent(
  userId: string,
  eventId: string,
  repo: EventRepository,
): Promise<EventView> {
  return toEventView(await findOwnedEvent(userId, eventId, repo))
}

export async function updateEvent(
  userId: string,
  eventId: string,
  input: UpdateEventInput,
  repo: EventRepository,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, repo)

  // Compare the dates as they will be after this change, so moving only one
  // of them cannot leave replies open past the event.
  const eventDate = input.eventDate ?? toDay(event.eventDate)
  const replyBy = input.replyBy ?? toDay(event.replyBy)
  if (replyBy > eventDate) throw new AppError('VALIDATION', REPLY_BY_MESSAGE)
  if (input.themeKey) assertThemeFits(event.type, input.themeKey)

  const updated = await repo.update(event.id, {
    title: input.title,
    themeKey: input.themeKey,
    details: input.details,
    eventDate: input.eventDate ? toDate(input.eventDate) : undefined,
    replyBy: input.replyBy ? toDate(input.replyBy) : undefined,
  })
  return toEventView(updated)
}

// Guest links only work for a published event.
export async function publishEvent(
  userId: string,
  eventId: string,
  repo: EventRepository,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, repo)
  return toEventView(await repo.update(event.id, { status: 'published' }))
}

export async function deleteEvent(
  userId: string,
  eventId: string,
  repo: EventRepository,
): Promise<void> {
  const event = await findOwnedEvent(userId, eventId, repo)
  await repo.delete(event.id)
}
