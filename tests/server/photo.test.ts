import sharp from 'sharp'
import { beforeEach, expect, it } from 'vitest'
import { createEvent, getEvent } from '#/server/services/event.service'
import {
  MAX_PHOTO_BYTES,
  removeBackground,
  uploadBackground,
} from '#/server/services/photo.service'
import { processPhoto } from '#/server/storage/image'
import type { PhotoStorage } from '#/server/storage/photo.storage'
import {
  fakeAssetRepository,
  fakeEventRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'

const fakeAssets = fakeAssetRepository

function fakeStorage(): PhotoStorage & { files: Map<string, Buffer> } {
  const files = new Map<string, Buffer>()
  return {
    files,
    async upload(path, bytes) {
      files.set(path, bytes)
    },
    async remove(path) {
      files.delete(path)
    },
  }
}

const picture = (
  width: number,
  height: number,
  format: 'png' | 'jpeg' | 'webp' = 'png',
) =>
  sharp({ create: { width, height, channels: 3, background: '#8ec5e6' } })
    [format]()
    .toBuffer()

let deps: {
  events: ReturnType<typeof fakeEventRepository>
  assets: ReturnType<typeof fakeAssets>
  photos: ReturnType<typeof fakeStorage>
  processImage: typeof processPhoto
}
let eventId: string

beforeEach(async () => {
  deps = {
    events: fakeEventRepository(),
    assets: fakeAssets(),
    photos: fakeStorage(),
    processImage: processPhoto,
  }
  const event = await createEvent(
    { id: OWNER, email: 'mika@example.com' },
    {
      type: 'wedding',
      title: 'M & P',
      eventDate: '2027-06-12',
      replyBy: '2027-03-31',
      themeKey: 'black-and-white',
    },
    { events: deps.events, users: fakeUserRepository() },
  )
  eventId = event.id
})

it('shrinks a wide photo to 2000 px and turns it into WebP', async () => {
  const result = await processPhoto(await picture(3000, 1500, 'jpeg'))
  expect(result).toMatchObject({ width: 2000, height: 1000 })
  expect((await sharp(result.bytes).metadata()).format).toBe('webp')
})

it('shrinks to the width it is asked for', async () => {
  const photo = await processPhoto(await picture(2400, 1200), 1600)
  expect(photo.width).toBe(1600)
})

it('leaves a small photo at its own size', async () => {
  expect(await processPhoto(await picture(800, 600, 'webp'))).toMatchObject({
    width: 800,
    height: 600,
  })
})

it('refuses files that are not photos, whatever they are called', async () => {
  for (const bad of [
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    Buffer.from('not an image'),
    Buffer.from('GIF89a'),
  ]) {
    await expect(processPhoto(bad)).rejects.toMatchObject({
      code: 'VALIDATION',
    })
  }
})

it('stores the photo under the event and points the design at it', async () => {
  const event = await uploadBackground(
    OWNER,
    eventId,
    await picture(400, 300),
    deps,
  )
  expect(deps.assets.rows).toHaveLength(1)
  const [asset] = deps.assets.rows
  expect(asset).toMatchObject({
    eventId,
    kind: 'background',
    width: 400,
    height: 300,
  })
  expect(asset.path.startsWith(`${eventId}/`)).toBe(true)
  expect(deps.photos.files.has(asset.path)).toBe(true)
  expect(event.design.backgroundAssetId).toBe(asset.id)
  expect(
    (await getEvent(OWNER, eventId, deps.events)).design.backgroundAssetId,
  ).toBe(asset.id)
})

it('replacing a photo deletes the old one', async () => {
  await uploadBackground(OWNER, eventId, await picture(400, 300), deps)
  const oldPath = deps.assets.rows[0].path
  await uploadBackground(OWNER, eventId, await picture(500, 300), deps)
  expect(deps.assets.rows).toHaveLength(1)
  expect(deps.assets.rows[0].width).toBe(500)
  expect(deps.photos.files.has(oldPath)).toBe(false)
  expect(deps.photos.files.size).toBe(1)
})

it('removing the photo clears the design and the stored file, keeping other choices', async () => {
  await uploadBackground(OWNER, eventId, await picture(400, 300), deps)
  deps.events.rows[0].design = {
    ...(deps.events.rows[0].design as object),
    accent: '#e8c9a0',
  }
  const event = await removeBackground(OWNER, eventId, deps)
  expect(event.design).toEqual({ accent: '#e8c9a0' })
  expect(deps.assets.rows).toHaveLength(0)
  expect(deps.photos.files.size).toBe(0)
})

it('refuses a file over the size limit before looking inside it', async () => {
  await expect(
    uploadBackground(OWNER, eventId, Buffer.alloc(MAX_PHOTO_BYTES + 1), deps),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  expect(deps.photos.files.size).toBe(0)
})

it('a stranger cannot upload to or remove from the event', async () => {
  await uploadBackground(OWNER, eventId, await picture(400, 300), deps)
  await expect(
    uploadBackground(STRANGER, eventId, await picture(400, 300), deps),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  await expect(removeBackground(STRANGER, eventId, deps)).rejects.toMatchObject(
    { code: 'NOT_FOUND' },
  )
  expect(deps.assets.rows).toHaveLength(1)
})
