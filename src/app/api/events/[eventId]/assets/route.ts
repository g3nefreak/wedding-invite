import { AppError } from '#/server/errors'
import { hostDeps, photoDeps } from '#/server/host-deps'
import type { HostDeps, PhotoDeps } from '#/server/host-deps'
import { handle, ok } from '#/server/http'
import {
  MAX_PHOTO_BYTES,
  removeBackground,
  uploadBackground,
} from '#/server/services/photo.service'

type Context = { params: Promise<{ eventId: string }> }

async function readPhoto(request: Request): Promise<Buffer> {
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    throw new AppError('VALIDATION', 'Choose a photo to upload')
  }
  // Checked before the file is read into memory.
  if (file.size > MAX_PHOTO_BYTES) {
    throw new AppError('VALIDATION', 'Choose a photo of 8 MB or less')
  }
  return Buffer.from(await file.arrayBuffer())
}

export function makeHandlers({ events, getUser }: HostDeps, photo: PhotoDeps) {
  const deps = { events, ...photo }

  return {
    // Uploads the event's background photo, replacing any earlier one.
    POST: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const file = await readPhoto(request)
        return ok(await uploadBackground(user.id, eventId, file, deps), 201)
      }),

    DELETE: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        return ok(await removeBackground(user.id, eventId, deps))
      }),
  }
}

export const { POST, DELETE } = makeHandlers(hostDeps, photoDeps)
