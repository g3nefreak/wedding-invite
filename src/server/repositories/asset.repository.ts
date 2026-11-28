import { db } from '#/server/db'

export type AssetRecord = {
  id: string
  eventId: string
  kind: 'background' | 'section'
  path: string
  width: number
  height: number
  bytes: number
}

// The record of a stored photo. The file itself lives in storage.
export interface AssetRepository {
  create(data: Omit<AssetRecord, 'id'>): Promise<AssetRecord>
  findById(id: string): Promise<AssetRecord | null>
  delete(id: string): Promise<void>
  // Every section photo of an event, oldest first.
  listByEvent(eventId: string, kind: 'section'): Promise<AssetRecord[]>
  countByEvent(eventId: string, kind: 'section'): Promise<number>
}

const select = {
  id: true,
  eventId: true,
  kind: true,
  path: true,
  width: true,
  height: true,
  bytes: true,
} as const

export const prismaAssetRepository: AssetRepository = {
  create: (data) => db().asset.create({ data, select }),

  findById: (id) => db().asset.findUnique({ where: { id }, select }),

  async delete(id) {
    await db().asset.delete({ where: { id } })
  },

  listByEvent: (eventId, kind) =>
    db().asset.findMany({
      where: { eventId, kind },
      orderBy: { createdAt: 'asc' },
      select,
    }),

  countByEvent: (eventId, kind) =>
    db().asset.count({ where: { eventId, kind } }),
}

// The stored path of the background photo a saved design points at.
// `design` is the raw saved value, so it is read defensively.
export async function findBackgroundPath(
  design: unknown,
): Promise<string | null> {
  const id =
    typeof design === 'object' && design !== null
      ? (design as { backgroundAssetId?: unknown }).backgroundAssetId
      : undefined
  if (typeof id !== 'string') return null

  // findFirst with a plain filter: a value that is not a valid id simply
  // finds nothing instead of raising an error.
  const asset = await db()
    .asset.findFirst({ where: { id }, select: { path: true } })
    .catch(() => null)
  return asset?.path ?? null
}
