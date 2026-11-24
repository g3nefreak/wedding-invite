import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import { createEvent, listEvents } from '#/server/services/event.service'
import { createEventSchema } from '#/server/validation/event.schema'

export function makeHandlers({ events, users, getUser }: HostDeps) {
  return {
    GET: () =>
      handle(async () => {
        const user = await getUser()
        return ok(await listEvents(user.id, events))
      }),

    POST: (request: Request) =>
      handle(async () => {
        const user = await getUser()
        const input = createEventSchema.parse(await readJson(request))
        return ok(await createEvent(user, input, { events, users }), 201)
      }),
  }
}

export const { GET, POST } = makeHandlers(hostDeps)
