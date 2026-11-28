import { AppError } from '#/server/errors'
import { hostDeps, photoDeps } from '#/server/host-deps'
import type { HostDeps, PhotoDeps } from '#/server/host-deps'
import { handle, ok } from '#/server/http'
import {
  MAX_PHOTO_BYTES,
  removeBackground,
  uploadBackground,
  uploadSectionPhoto,
} from '#/server/services/photo.service'

type Context = { params: Promise<{ eventId: string }> }

// The form may say what the photo is for. Anything it does not recognise is
// refused instead of being guessed at.
function choice<T extends string>(
  form: FormData,
  name: string,
  allowed: readonly T[],
): T {
  const value = form.get(name) ?? allowed[0]
  if (!allowed.includes(value as T)) {
    throw new AppError('VALIDATION', 'That kind of upload is not supported')
  }
  return value as T
}

async function readPhoto(form: FormData | null): Promise<Buffer> {
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
    // Uploads a photo. With no kind it is the event's background photo,
    // replacing any earlier one; `kind=section` adds a photo for the sections.
    POST: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const form = await request.formData().catch(() => null)
        const kind = form
          ? choice(form, 'kind', ['background', 'section'] as const)
          : 'background'
        const use = form
          ? choice(form, 'use', ['photo', 'qr'] as const)
          : 'photo'
        const file = await readPhoto(form)

        const event =
          kind === 'section'
            ? await uploadSectionPhoto(user.id, eventId, file, use, deps)
            : await uploadBackground(user.id, eventId, file, deps)
        return ok(event, 201)
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
