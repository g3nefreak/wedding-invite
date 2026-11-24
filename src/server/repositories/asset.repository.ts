import { db } from '#/server/db'

export type AssetRecord = {
  id: string
  eventId: string
  kind: 'background'
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
