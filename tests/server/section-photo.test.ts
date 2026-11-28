import { beforeEach, expect, it, vi } from 'vitest'
import { createEvent, getEvent } from '#/server/services/event.service'
import {
  deleteSectionPhoto,
  MAX_SECTION_PHOTOS,
  uploadSectionPhoto,
} from '#/server/services/photo.service'
import { updateSections } from '#/server/services/sections.service'
import type { PhotoStorage } from '#/server/storage/photo.storage'
import type { Block } from '#/server/validation/sections.schema'
import {
  fakeAssetRepository,
  fakeEventRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'
import { cover, hero, rsvp } from './section-samples'

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

const file = Buffer.from('a photo')
const OTHER_EVENT = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000009'

let events: ReturnType<typeof fakeEventRepository>
let assets: ReturnType<typeof fakeAssetRepository>
let photos: ReturnType<typeof fakeStorage>
let processImage: ReturnType<
  typeof vi.fn<
    (
      input: Buffer,
      maxWidth?: number,
    ) => Promise<{ bytes: Buffer; width: number; height: number }>
  >
>
let deps: {
  events: typeof events
  assets: typeof assets
  photos: typeof photos
  processImage: typeof processImage
}
let eventId: string

beforeEach(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example'
  events = fakeEventRepository()
  assets = fakeAssetRepository()
  photos = fakeStorage()
  processImage = vi.fn(async (_input: Buffer, maxWidth?: number) => ({
    bytes: Buffer.from('webp'),
    width: maxWidth ?? 2000,
    height: 900,
  }))
  deps = { events, assets, photos, processImage }
  const created = await createEvent(
    { id: OWNER, email: 'mika@example.com' },
    {
      type: 'wedding',
      title: 'M & P',
      eventDate: '2027-06-12',
      replyBy: '2027-03-31',
      themeKey: 'black-and-white',
    },
    { events, users: fakeUserRepository() },
  )
  eventId = created.id
})

it('stores a section photo at 1600 px and lists it on the event', async () => {
  const event = await uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)
  expect(processImage).toHaveBeenCalledWith(file, 1600)
  expect(event.sectionPhotos).toHaveLength(1)
  expect(event.sectionPhotos[0].url).toContain(`${eventId}/`)
  expect(assets.rows[0]).toMatchObject({ eventId, kind: 'section' })
  expect(photos.files.size).toBe(1)
})

it('stores a QR photo at 1000 px', async () => {
  await uploadSectionPhoto(OWNER, eventId, file, 'qr', deps)
  expect(processImage).toHaveBeenCalledWith(file, 1000)
})

it('lists a photo that no section uses yet', async () => {
  await uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)
  // Read fresh, the way the editor does after a reload.
  events.rows[0].sectionAssets = await assets.listByEvent(eventId, 'section')
  const event = await getEvent(OWNER, eventId, events)
  expect(event.sections).toEqual([])
  expect(event.sectionPhotos).toHaveLength(1)
})

it('saving sections keeps the photo list in the answer', async () => {
  const uploaded = await uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)
  const saved = await updateSections(
    OWNER,
    eventId,
    { sections: [hero, rsvp], cover },
    deps,
  )
  expect(saved.sectionPhotos).toEqual(uploaded.sectionPhotos)
})

it('refuses the 31st photo before reading the file', async () => {
  for (let i = 0; i < MAX_SECTION_PHOTOS; i++) {
    await uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)
  }
  processImage.mockClear()
  await expect(
    uploadSectionPhoto(OWNER, eventId, file, 'photo', deps),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  expect(processImage).not.toHaveBeenCalled()
  expect(assets.rows).toHaveLength(30)
})

it('refuses a file over the size limit', async () => {
  const huge = Buffer.alloc(8 * 1024 * 1024 + 1)
  await expect(
    uploadSectionPhoto(OWNER, eventId, huge, 'photo', deps),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  expect(processImage).not.toHaveBeenCalled()
})

it('gives a stranger NOT_FOUND on upload and on delete', async () => {
  await expect(
    uploadSectionPhoto(STRANGER, eventId, file, 'photo', deps),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  const event = await uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)
  await expect(
    deleteSectionPhoto(STRANGER, eventId, event.sectionPhotos[0].id, deps),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  expect(assets.rows).toHaveLength(1)
})

it('deleting a photo takes it out of the hero, the story and a payment option', async () => {
  const { sectionPhotos } = await uploadSectionPhoto(
    OWNER,
    eventId,
    file,
    'photo',
    deps,
  )
  const id = sectionPhotos[0].id
  const sections: Block[] = [
    { ...hero, content: { kicker: 'Hi', photoAssetId: id } },
    {
      id: 'story',
      type: 'story',
      enabled: true,
      content: {
        heading: '',
        intro: '',
        photos: [{ assetId: id, caption: 'Us' }],
      },
    },
    {
      id: 'gifts',
      type: 'gifts',
      enabled: true,
      content: {
        intro: '',
        ideas: [],
        payments: [
          {
            label: 'GCash',
            accountName: '',
            accountNumber: '0917',
            qrAssetId: id,
          },
        ],
        closing: '',
      },
    },
    {
      id: 'c1',
      type: 'custom',
      enabled: true,
      content: { heading: 'x', text: '', photoAssetId: id },
    },
    rsvp,
  ]
  await updateSections(OWNER, eventId, { sections, cover }, deps)

  const after = await deleteSectionPhoto(OWNER, eventId, id, deps)
  expect(JSON.stringify(after.sections)).not.toContain(id)
  // The text around the photo is kept.
  expect(after.sections[0].content).toEqual({ kicker: 'Hi' })
  expect(after.sections[2].content).toMatchObject({
    payments: [{ label: 'GCash', accountNumber: '0917' }],
  })
  expect(after.sectionPhotos).toEqual([])
  expect(assets.rows).toHaveLength(0)
  expect(photos.files.size).toBe(0)
})

it('cannot delete the background through this path', async () => {
  assets.rows.push({
    id: 'bg',
    eventId,
    kind: 'background',
    path: `${eventId}/bg.webp`,
    width: 2000,
    height: 900,
    bytes: 10,
  })
  await expect(
    deleteSectionPhoto(OWNER, eventId, 'bg', deps),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  expect(assets.rows).toHaveLength(1)
})

it('cannot delete a photo of another event', async () => {
  assets.rows.push({
    id: 'theirs',
    eventId: OTHER_EVENT,
    kind: 'section',
    path: `${OTHER_EVENT}/x.webp`,
    width: 800,
    height: 600,
    bytes: 10,
  })
  await expect(
    deleteSectionPhoto(OWNER, eventId, 'theirs', deps),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  expect(assets.rows).toHaveLength(1)
})
