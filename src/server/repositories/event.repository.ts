import type { Prisma } from '#/generated/prisma/client'
import { db } from '#/server/db'
import {
  findBackgroundPath,
  prismaAssetRepository,
} from '#/server/repositories/asset.repository'
import type { AssetRecord } from '#/server/repositories/asset.repository'

export type EventRecord = {
  id: string
  ownerId: string
  type: string
  title: string
  eventDate: Date
  replyBy: Date
  timezone: string
  status: 'draft' | 'published'
  details: unknown
  themeKey: string
  design: unknown
  sections: unknown
  cover: unknown
  // Where the background photo is stored. Filled in when one event is read.
  backgroundPath?: string | null
  // The event's section photos. Filled in when one event is read.
  sectionAssets?: AssetRecord[]
}

export type NewEvent = Pick<
  EventRecord,
  'ownerId' | 'type' | 'title' | 'eventDate' | 'replyBy' | 'themeKey'
>

export type EventChanges = Partial<
  Pick<
    EventRecord,
    | 'title'
    | 'eventDate'
    | 'replyBy'
    | 'themeKey'
    | 'status'
    | 'details'
    | 'design'
    | 'sections'
    | 'cover'
  >
>

// No rules here, only reads and writes. Who may touch which event is decided
// in event.service.ts.
export interface EventRepository {
  listByOwner(ownerId: string): Promise<EventRecord[]>
  findById(id: string): Promise<EventRecord | null>
  create(data: NewEvent): Promise<EventRecord>
  update(id: string, data: EventChanges): Promise<EventRecord>
  delete(id: string): Promise<void>
}

export const prismaEventRepository: EventRepository = {
  listByOwner: (ownerId) =>
    db().event.findMany({ where: { ownerId }, orderBy: { eventDate: 'asc' } }),

  async findById(id) {
    const event = await db().event.findUnique({ where: { id } })
    if (!event) return null
    return {
      ...event,
      backgroundPath: await findBackgroundPath(event.design),
      sectionAssets: await prismaAssetRepository.listByEvent(id, 'section'),
    }
  },

  create: (data) => db().event.create({ data }),

  update: (id, { details, design, sections, cover, ...rest }) =>
    db().event.update({
      where: { id },
      data: {
        ...rest,
        // All four are checked by their zod schemas before they get here.
        ...(details === undefined
          ? {}
          : { details: details as Prisma.InputJsonValue }),
        ...(design === undefined
          ? {}
          : { design: design as Prisma.InputJsonValue }),
        ...(sections === undefined
          ? {}
          : { sections: sections as Prisma.InputJsonValue }),
        ...(cover === undefined
          ? {}
          : { cover: cover as Prisma.InputJsonValue }),
      },
    }),

  async delete(id) {
    // Roles, guests, replies and photos go with it (onDelete: Cascade).
    await db().event.delete({ where: { id } })
  },
}
