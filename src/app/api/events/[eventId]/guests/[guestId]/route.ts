import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import { deleteGuest, updateGuest } from '#/server/services/guest.service'
import { updateGuestSchema } from '#/server/validation/guest.schema'

type Context = { params: Promise<{ eventId: string; guestId: string }> }

export function makeHandlers({ events, roles, guests, getUser }: HostDeps) {
  const repos = { events, roles, guests }

  return {
    PATCH: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId, guestId } = await params
        const input = updateGuestSchema.parse(await readJson(request))
        return ok(await updateGuest(user.id, eventId, guestId, input, repos))
      }),

    DELETE: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId, guestId } = await params
        await deleteGuest(user.id, eventId, guestId, repos)
        return ok({ deleted: true })
      }),
  }
}

export const { PATCH, DELETE } = makeHandlers(hostDeps)
