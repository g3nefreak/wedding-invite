import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok } from '#/server/http'
import { publishEvent } from '#/server/services/event.service'

type Context = { params: Promise<{ eventId: string }> }

export function makeHandlers({ events, getUser }: HostDeps) {
  return {
    POST: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        return ok(await publishEvent(user.id, eventId, events))
      }),
  }
}

export const { POST } = makeHandlers(hostDeps)
