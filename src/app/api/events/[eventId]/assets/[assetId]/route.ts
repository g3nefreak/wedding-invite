import { hostDeps, photoDeps } from '#/server/host-deps'
import type { HostDeps, PhotoDeps } from '#/server/host-deps'
import { handle, ok } from '#/server/http'
import { deleteSectionPhoto } from '#/server/services/photo.service'

type Context = { params: Promise<{ eventId: string; assetId: string }> }

export function makeHandlers({ events, getUser }: HostDeps, photo: PhotoDeps) {
  const deps = { events, ...photo }

  return {
    // Deletes one section photo and takes it out of any section using it.
    DELETE: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId, assetId } = await params
        return ok(await deleteSectionPhoto(user.id, eventId, assetId, deps))
      }),
  }
}

export const { DELETE } = makeHandlers(hostDeps, photoDeps)
