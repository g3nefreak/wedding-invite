import { db } from '#/server/db'
import type { SavedRsvp } from '#/server/repositories/invite.repository'

export type GuestRecord = {
  id: string
  eventId: string
  name: string
  token: string
  roleId: string | null
  personalNote: string | null
  rsvp: SavedRsvp | null
}

export type NewGuest = Pick<
  GuestRecord,
  'name' | 'token' | 'roleId' | 'personalNote'
>

export type GuestChanges = Partial<
  Pick<GuestRecord, 'name' | 'roleId' | 'personalNote'>
>

// Reads and writes only. Ownership and limits are in guest.service.ts.
export interface GuestRepository {
  listByEvent(eventId: string): Promise<GuestRecord[]>
  countByEvent(eventId: string): Promise<number>
  findById(id: string): Promise<GuestRecord | null>
  createMany(eventId: string, guests: NewGuest[]): Promise<GuestRecord[]>
  update(id: string, data: GuestChanges): Promise<GuestRecord>
  delete(id: string): Promise<void>
}

// Only these columns are read, so nothing else can leave this layer.
const columns = {
  id: true,
  eventId: true,
  name: true,
  token: true,
  roleId: true,
  personalNote: true,
} as const

const select = {
  ...columns,
  rsvp: { select: { answer: true, message: true, updatedAt: true } },
} as const

export const prismaGuestRepository: GuestRepository = {
  listByEvent: (eventId) =>
    db().guest.findMany({
      where: { eventId },
      orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
      select,
    }),

  countByEvent: (eventId) => db().guest.count({ where: { eventId } }),

  findById: (id) => db().guest.findUnique({ where: { id }, select }),

  async createMany(eventId, guests) {
    // Prisma cannot return the reply when creating many rows at once, and a
    // guest who was just added has no reply anyway.
    const created = await db().guest.createManyAndReturn({
      data: guests.map((guest) => ({ eventId, ...guest })),
      select: columns,
    })
    return created.map((guest) => ({ ...guest, rsvp: null }))
  },

  update: (id, data) => db().guest.update({ where: { id }, data, select }),

  async delete(id) {
    // Their reply goes with them (onDelete: Cascade).
    await db().guest.delete({ where: { id } })
  },
}
