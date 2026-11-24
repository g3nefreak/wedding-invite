import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import {
  deleteEvent,
  getEvent,
  updateEvent,
} from '#/server/services/event.service'
import { updateEventSchema } from '#/server/validation/event.schema'

type Context = { params: Promise<{ eventId: string }> }

export function makeHandlers({ events, getUser }: HostDeps) {
  return {
    GET: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        return ok(await getEvent(user.id, eventId, events))
      }),

    PATCH: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const input = updateEventSchema.parse(await readJson(request))
        return ok(await updateEvent(user.id, eventId, input, events))
      }),

    DELETE: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        await deleteEvent(user.id, eventId, events)
        return ok({ deleted: true })
      }),
  }
}

export const { GET, PATCH, DELETE } = makeHandlers(hostDeps)
