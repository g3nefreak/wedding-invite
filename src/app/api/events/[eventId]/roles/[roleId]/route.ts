import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import { deleteRole, updateRole } from '#/server/services/role.service'
import { updateRoleSchema } from '#/server/validation/role.schema'

type Context = { params: Promise<{ eventId: string; roleId: string }> }

export function makeHandlers({ events, roles, getUser }: HostDeps) {
  return {
    PATCH: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId, roleId } = await params
        const input = updateRoleSchema.parse(await readJson(request))
        return ok(
          await updateRole(user.id, eventId, roleId, input, { events, roles }),
        )
      }),

    DELETE: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId, roleId } = await params
        await deleteRole(user.id, eventId, roleId, { events, roles })
        return ok({ deleted: true })
      }),
  }
}

export const { PATCH, DELETE } = makeHandlers(hostDeps)
