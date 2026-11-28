import { randomUUID } from 'node:crypto'
import { AppError } from '#/server/errors'
import type { AssetRepository } from '#/server/repositories/asset.repository'
import type { EventRepository } from '#/server/repositories/event.repository'
import { findOwnedEvent, toEventView } from '#/server/services/event.service'
import type { EventView } from '#/server/services/event.service'
import type { ProcessedPhoto } from '#/server/storage/image'
import type { PhotoStorage } from '#/server/storage/photo.storage'
import { readDesignOverrides } from '#/server/validation/design.schema'
import { readSections, withoutAsset } from '#/server/validation/sections.schema'

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

// Keeps one event's photos well inside the free storage plan.
export const MAX_SECTION_PHOTOS = 30

// A photo inside a section never fills the screen the way the background
// does, and a QR code only needs to be sharp enough to scan.
const SECTION_WIDTH = { photo: 1600, qr: 1000 } as const

type Deps = {
  events: EventRepository
  assets: AssetRepository
  photos: PhotoStorage
  // Checks the upload is a real photo and resizes it.
  processImage: (input: Buffer, maxWidth?: number) => Promise<ProcessedPhoto>
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

// Adds a photo the host can then place in a section (story, hero, QR code).
export async function uploadSectionPhoto(
  userId: string,
  eventId: string,
  file: Buffer,
  use: keyof typeof SECTION_WIDTH,
  deps: Deps,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, deps.events)
  if (file.byteLength > MAX_PHOTO_BYTES) {
    throw new AppError('VALIDATION', 'Choose a photo of 8 MB or less')
  }
  // Checked before the file is opened, so a full event costs nothing.
  const count = await deps.assets.countByEvent(event.id, 'section')
  if (count >= MAX_SECTION_PHOTOS) {
    throw new AppError(
      'VALIDATION',
      `This invitation already has ${MAX_SECTION_PHOTOS} photos. Delete one to add another.`,
    )
  }

  const photo = await deps.processImage(file, SECTION_WIDTH[use])
  const path = `${event.id}/${randomUUID()}.webp`
  await deps.photos.upload(path, photo.bytes)
  await deps.assets.create({
    eventId: event.id,
    kind: 'section',
    path,
    width: photo.width,
    height: photo.height,
    bytes: photo.bytes.byteLength,
  })

  return toEventView({
    ...event,
    sectionAssets: await deps.assets.listByEvent(event.id, 'section'),
  })
}

// Deletes one section photo and takes it out of every section that used it.
export async function deleteSectionPhoto(
  userId: string,
  eventId: string,
  assetId: string,
  deps: Deps,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, deps.events)
  const asset = await deps.assets.findById(assetId)
  // Another event's photo, the background and a missing photo all look the
  // same from outside, so nobody can learn which photo ids exist.
  if (!asset || asset.eventId !== event.id || asset.kind !== 'section') {
    throw new AppError('NOT_FOUND', 'Photo not found')
  }

  // The sections stop pointing at the photo before the file goes, so a guest
  // never lands on a section whose photo has just vanished.
  const updated = await deps.events.update(event.id, {
    sections: withoutAsset(readSections(event.sections), asset.id),
  })
  await discard(asset.id, deps)

  return toEventView({
    ...updated,
    backgroundPath: event.backgroundPath,
    sectionAssets: await deps.assets.listByEvent(event.id, 'section'),
  })
}
