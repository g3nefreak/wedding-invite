import sharp from 'sharp'
import { beforeEach, expect, it } from 'vitest'
import { makeHandlers as makeCollection } from '#/app/api/events/route'
import { makeHandlers as makeAssets } from '#/app/api/events/[eventId]/assets/route'
import { makeHandlers as makeAsset } from '#/app/api/events/[eventId]/assets/[assetId]/route'
import { AppError } from '#/server/errors'
import type { SessionUser } from '#/server/auth/session'
import { processPhoto } from '#/server/storage/image'
import {
  fakeAssetRepository,
  fakeEventRepository,
  fakeGuestRepository,
  fakeRoleRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from '../server/fakes'

let current: SessionUser | null
let assets: ReturnType<typeof makeAssets>
let asset: ReturnType<typeof makeAsset>
let eventId: string

const picture = () =>
  sharp({
    create: { width: 2400, height: 1200, channels: 3, background: '#8ec5e6' },
  })
    .png()
    .toBuffer()

async function upload(fields: Record<string, string>) {
  const form = new FormData()
  form.append('file', new File([new Uint8Array(await picture())], 'p.png'))
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return assets.POST(
    new Request('http://localhost/api/events/x/assets', {
      method: 'POST',
      body: form,
    }),
    { params: Promise.resolve({ eventId }) },
  )
}

const remove = (assetId: string) =>
  asset.DELETE(new Request('http://localhost/x', { method: 'DELETE' }), {
    params: Promise.resolve({ eventId, assetId }),
  })

beforeEach(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example'
  current = { id: OWNER, email: 'mika@example.com' }
  const host = {
    events: fakeEventRepository(),
    users: fakeUserRepository(),
    roles: fakeRoleRepository(),
    guests: fakeGuestRepository(),
    getUser: async () => {
      if (!current) throw new AppError('UNAUTHORIZED', 'Log in to continue')
      return current
    },
  }
  const photo = {
    assets: fakeAssetRepository(),
    photos: { async upload() {}, async remove() {} },
    processImage: processPhoto,
  }
  assets = makeAssets(host, photo)
  asset = makeAsset(host, photo)
  const created = await makeCollection(host).POST(
    new Request('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'wedding',
        title: 'Mika & Paolo',
        eventDate: '2027-06-12',
        replyBy: '2027-03-31',
        themeKey: 'black-and-white',
      }),
    }),
  )
  eventId = (await created.json()).data.id
})

it('uploads a section photo, resized to 1600 px', async () => {
  const res = await upload({ kind: 'section' })
  expect(res.status).toBe(201)
  const { sectionPhotos } = (await res.json()).data
  expect(sectionPhotos).toHaveLength(1)
  expect(sectionPhotos[0].width).toBe(1600)
})

it('uploads a QR photo, resized to 1000 px', async () => {
  const res = await upload({ kind: 'section', use: 'qr' })
  expect((await res.json()).data.sectionPhotos[0].width).toBe(1000)
})

it('with no kind it still sets the background, as before', async () => {
  const res = await upload({})
  expect(res.status).toBe(201)
  const { backgroundUrl, sectionPhotos } = (await res.json()).data
  expect(backgroundUrl).toBeTruthy()
  expect(sectionPhotos).toEqual([])
})

it('refuses an unknown kind or use', async () => {
  expect((await upload({ kind: 'video' })).status).toBe(400)
  expect((await upload({ kind: 'section', use: 'poster' })).status).toBe(400)
})

it('deletes a section photo for the owner only', async () => {
  const res = await upload({ kind: 'section' })
  const id = (await res.json()).data.sectionPhotos[0].id

  current = { id: STRANGER, email: 'other@example.com' }
  expect((await remove(id)).status).toBe(404)

  current = { id: OWNER, email: 'mika@example.com' }
  const gone = await remove(id)
  expect(gone.status).toBe(200)
  expect((await gone.json()).data.sectionPhotos).toEqual([])
})
