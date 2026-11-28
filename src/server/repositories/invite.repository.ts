import { db } from '#/server/db'
import {
  findBackgroundPath,
  prismaAssetRepository,
} from '#/server/repositories/asset.repository'

export type RsvpAnswer = 'going' | 'not_going'

export type SavedRsvp = { answer: RsvpAnswer; message: string; updatedAt: Date }

// Everything the database holds about one guest's invitation.
export type InviteRecord = {
  guest: { id: string; name: string; personalNote: string | null }
  role: {
    title: string
    askText: string
    note: string
    attire: string
    color: string
  } | null
  rsvp: SavedRsvp | null
  event: {
    id: string
    type: string
    title: string
    status: 'draft' | 'published'
    eventDate: Date
    replyBy: Date
    timezone: string
    details: unknown
    themeKey: string
    design: unknown
    sections: unknown
    cover: unknown
  }
  // Where the event's background photo is stored, if it has one.
  backgroundPath?: string | null
  // The photos the event's sections may show.
  sectionPhotos: { id: string; path: string; width: number; height: number }[]
}

// Services receive this instead of touching the database themselves, so
// tests can hand them an in-memory fake (tests/server/fakes.ts).
export interface InviteRepository {
  findByToken(token: string): Promise<InviteRecord | null>
  upsertRsvp(
    guestId: string,
    answer: RsvpAnswer,
    message: string,
  ): Promise<SavedRsvp>
}

// The real repository. Only files in this folder may talk to the database.
export const prismaInviteRepository: InviteRepository = {
  async findByToken(token) {
    // One query: the guest with their role, reply and event.
    const guest = await db().guest.findUnique({
      where: { token },
      include: { role: true, rsvp: true, event: true },
    })
    if (!guest) return null

    const { role, rsvp, event } = guest
    // Fields are picked one by one so nothing extra (owner id, other ids,
    // timestamps) can leave this layer by accident.
    return {
      backgroundPath: await findBackgroundPath(event.design),
      sectionPhotos: (
        await prismaAssetRepository.listByEvent(event.id, 'section')
      ).map(({ id, path, width, height }) => ({ id, path, width, height })),
      guest: {
        id: guest.id,
        name: guest.name,
        personalNote: guest.personalNote,
      },
      role: role && {
        title: role.title,
        askText: role.askText,
        note: role.note,
        attire: role.attire,
        color: role.color,
      },
      rsvp: rsvp && {
        answer: rsvp.answer,
        message: rsvp.message,
        updatedAt: rsvp.updatedAt,
      },
      event: {
        id: event.id,
        type: event.type,
        title: event.title,
        status: event.status,
        eventDate: event.eventDate,
        replyBy: event.replyBy,
        timezone: event.timezone,
        details: event.details,
        themeKey: event.themeKey,
        design: event.design,
        sections: event.sections,
        cover: event.cover,
      },
    }
  },

  async upsertRsvp(guestId, answer, message) {
    // guestId is unique on Rsvp, so a second reply updates the same row.
    const rsvp = await db().rsvp.upsert({
      where: { guestId },
      create: { guestId, answer, message },
      update: { answer, message },
    })
    return {
      answer: rsvp.answer,
      message: rsvp.message,
      updatedAt: rsvp.updatedAt,
    }
  },
}
