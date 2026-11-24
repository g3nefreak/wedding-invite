import { z } from 'zod'
import { newGuestToken } from '#/server/auth/token'
import { AppError } from '#/server/errors'
import type { EventRepository } from '#/server/repositories/event.repository'
import type {
  GuestRecord,
  GuestRepository,
} from '#/server/repositories/guest.repository'
import type { RsvpAnswer } from '#/server/repositories/invite.repository'
import type { RoleRepository } from '#/server/repositories/role.repository'
import { findOwnedEvent } from '#/server/services/event.service'
import type {
  GuestInput,
  UpdateGuestInput,
} from '#/server/validation/guest.schema'

type Repos = {
  events: EventRepository
  roles: RoleRepository
  guests: GuestRepository
}

// Keeps one event from filling the free database.
export const MAX_GUESTS = 500

// What the host sees of a guest: their link token and their reply.
export type GuestView = {
  id: string
  name: string
  token: string
  roleId: string | null
  personalNote: string
  reply: { answer: RsvpAnswer; message: string } | null
}

function toView(guest: GuestRecord): GuestView {
  return {
    id: guest.id,
    name: guest.name,
    token: guest.token,
    roleId: guest.roleId,
    personalNote: guest.personalNote ?? '',
    reply: guest.rsvp
      ? { answer: guest.rsvp.answer, message: guest.rsvp.message }
      : null,
  }
}

// Checks the host owns the event AND the guest belongs to that event.
async function findOwnedGuest(
  userId: string,
  eventId: string,
  guestId: string,
  repos: Repos,
): Promise<GuestRecord> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  const guest = z.uuid().safeParse(guestId).success
    ? await repos.guests.findById(guestId)
    : null
  if (!guest || guest.eventId !== event.id) {
    throw new AppError('NOT_FOUND', 'Guest not found')
  }
  return guest
}

// A guest may only be given a role from their own event.
async function assertRoleFits(
  eventId: string,
  roleId: string | null | undefined,
  roles: RoleRepository,
) {
  if (!roleId) return
  const role = await roles.findById(roleId)
  if (!role || role.eventId !== eventId) {
    throw new AppError('VALIDATION', "Choose one of this event's roles")
  }
}

async function assertRoomFor(
  eventId: string,
  adding: number,
  guests: GuestRepository,
) {
  if ((await guests.countByEvent(eventId)) + adding > MAX_GUESTS) {
    throw new AppError(
      'VALIDATION',
      `An event can have up to ${MAX_GUESTS} guests`,
    )
  }
}

export async function listGuests(
  userId: string,
  eventId: string,
  repos: Repos,
): Promise<GuestView[]> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  return (await repos.guests.listByEvent(event.id)).map(toView)
}

export async function createGuest(
  userId: string,
  eventId: string,
  input: GuestInput,
  repos: Repos,
): Promise<GuestView> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  await assertRoleFits(event.id, input.roleId, repos.roles)
  await assertRoomFor(event.id, 1, repos.guests)

  const [guest] = await repos.guests.createMany(event.id, [
    {
      name: input.name,
      roleId: input.roleId,
      personalNote: input.personalNote || null,
      // The personal link. Random, never built from the name.
      token: newGuestToken(),
    },
  ])
  return toView(guest)
}

// From a pasted list: ordinary guests, each with their own link.
export async function createGuests(
  userId: string,
  eventId: string,
  names: string[],
  repos: Repos,
): Promise<GuestView[]> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  await assertRoomFor(event.id, names.length, repos.guests)

  const guests = await repos.guests.createMany(
    event.id,
    names.map((name) => ({
      name,
      roleId: null,
      personalNote: null,
      token: newGuestToken(),
    })),
  )
  return guests.map(toView)
}

// The link token never changes here, so a link already sent keeps working.
export async function updateGuest(
  userId: string,
  eventId: string,
  guestId: string,
  input: UpdateGuestInput,
  repos: Repos,
): Promise<GuestView> {
  const guest = await findOwnedGuest(userId, eventId, guestId, repos)
  await assertRoleFits(guest.eventId, input.roleId, repos.roles)

  const updated = await repos.guests.update(guest.id, {
    name: input.name,
    roleId: input.roleId,
    personalNote:
      input.personalNote === undefined ? undefined : input.personalNote || null,
  })
  return toView(updated)
}

export async function deleteGuest(
  userId: string,
  eventId: string,
  guestId: string,
  repos: Repos,
): Promise<void> {
  const guest = await findOwnedGuest(userId, eventId, guestId, repos)
  await repos.guests.delete(guest.id)
}
