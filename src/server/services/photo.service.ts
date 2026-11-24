import { randomUUID } from 'node:crypto'
import { AppError } from '#/server/errors'
import type { AssetRepository } from '#/server/repositories/asset.repository'
import type { EventRepository } from '#/server/repositories/event.repository'
import { findOwnedEvent, toEventView } from '#/server/services/event.service'
import type { EventView } from '#/server/services/event.service'
import type { ProcessedPhoto } from '#/server/storage/image'
import type { PhotoStorage } from '#/server/storage/photo.storage'
import { readDesignOverrides } from '#/server/validation/design.schema'

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

type Deps = {
  events: EventRepository
  assets: AssetRepository
  photos: PhotoStorage
  // Checks the upload is a real photo and resizes it.
  processImage: (input: Buffer) => Promise<ProcessedPhoto>
}

// Deletes a stored photo: its file first, then its record.
async function discard(assetId: string | undefined, deps: Deps) {
  if (!assetId) return
  const asset = await deps.assets.findById(assetId)
  if (!asset) return
  await deps.photos.remove(asset.path)
  await deps.assets.delete(asset.id)
}

// Sets the event's background photo, replacing any earlier one.
export async function uploadBackground(
  userId: string,
  eventId: string,
  file: Buffer,
  deps: Deps,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, deps.events)
  if (file.byteLength > MAX_PHOTO_BYTES) {
    throw new AppError('VALIDATION', 'Choose a photo of 8 MB or less')
  }

  const photo = await deps.processImage(file)
  // The event id keeps each event's photos together; the random part means
  // the address cannot be guessed and a replaced photo gets a new address.
  const path = `${event.id}/${randomUUID()}.webp`
  await deps.photos.upload(path, photo.bytes)

  const asset = await deps.assets.create({
    eventId: event.id,
    kind: 'background',
    path,
    width: photo.width,
    height: photo.height,
    bytes: photo.bytes.byteLength,
  })

  const design = readDesignOverrides(event.design)
  const updated = await deps.events.update(event.id, {
    design: { ...design, backgroundAssetId: asset.id },
  })

  // Only once the new photo is in place is the old one thrown away.
  await discard(design.backgroundAssetId, deps)
  return toEventView({ ...updated, backgroundPath: path })
}

export async function removeBackground(
  userId: string,
  eventId: string,
  deps: Deps,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, deps.events)
  const { backgroundAssetId, ...rest } = readDesignOverrides(event.design)

  const updated = await deps.events.update(event.id, { design: rest })
  await discard(backgroundAssetId, deps)
  return toEventView({ ...updated, backgroundPath: null })
}
