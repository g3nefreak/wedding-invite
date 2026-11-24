import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import { updateDesign } from '#/server/services/design.service'
import { designInputSchema } from '#/server/validation/design.schema'

type Context = { params: Promise<{ eventId: string }> }

export function makeHandlers({ events, getUser }: HostDeps) {
  return {
    PATCH: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const input = designInputSchema.parse(await readJson(request))
        return ok(await updateDesign(user.id, eventId, input, events))
      }),
  }
}

export const { PATCH } = makeHandlers(hostDeps)
