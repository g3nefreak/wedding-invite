import { db } from '#/server/db'

export type RoleRecord = {
  id: string
  eventId: string
  title: string
  askText: string
  note: string
  attire: string
}

export type RoleData = Omit<RoleRecord, 'id' | 'eventId'>

// Reads and writes only. Whether the host owns the event is checked in
// role.service.ts.
export interface RoleRepository {
  listByEvent(eventId: string): Promise<RoleRecord[]>
  findById(id: string): Promise<RoleRecord | null>
  create(eventId: string, data: RoleData): Promise<RoleRecord>
  update(id: string, data: Partial<RoleData>): Promise<RoleRecord>
  delete(id: string): Promise<void>
}

// Only these columns are read, so nothing else can leave this layer.
const select = {
  id: true,
  eventId: true,
  title: true,
  askText: true,
  note: true,
  attire: true,
} as const

export const prismaRoleRepository: RoleRepository = {
  listByEvent: (eventId) =>
    db().role.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      select,
    }),

  findById: (id) => db().role.findUnique({ where: { id }, select }),

  create: (eventId, data) =>
    db().role.create({ data: { eventId, ...data }, select }),

  update: (id, data) => db().role.update({ where: { id }, data, select }),

  async delete(id) {
    // Guests who had this role stay; their role is cleared (onDelete: SetNull).
    await db().role.delete({ where: { id } })
  },
}
