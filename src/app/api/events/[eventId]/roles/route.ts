import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import { createRole, listRoles } from '#/server/services/role.service'
import { roleSchema } from '#/server/validation/role.schema'

type Context = { params: Promise<{ eventId: string }> }

export function makeHandlers({ events, roles, getUser }: HostDeps) {
  return {
    GET: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        return ok(await listRoles(user.id, eventId, { events, roles }))
      }),

    POST: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const input = roleSchema.parse(await readJson(request))
        const role = await createRole(user.id, eventId, input, {
          events,
          roles,
        })
        return ok(role, 201)
      }),
  }
}

export const { GET, POST } = makeHandlers(hostDeps)
