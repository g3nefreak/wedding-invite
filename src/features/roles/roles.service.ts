import { api } from '#/lib/api'
import type { RoleInput, RoleView, UpdateRoleInput } from './roles.types'

const rolesPath = (eventId: string) =>
  `/api/events/${encodeURIComponent(eventId)}/roles`
const rolePath = (eventId: string, roleId: string) =>
  `${rolesPath(eventId)}/${encodeURIComponent(roleId)}`

export const ROLES_SERVICE = {
  LIST: (eventId: string) => api<RoleView[]>(rolesPath(eventId)),
  CREATE: (eventId: string, input: RoleInput) =>
    api<RoleView>(rolesPath(eventId), {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  UPDATE: (eventId: string, roleId: string, input: UpdateRoleInput) =>
    api<RoleView>(rolePath(eventId, roleId), {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  DELETE: (eventId: string, roleId: string) =>
    api<{ deleted: boolean }>(rolePath(eventId, roleId), { method: 'DELETE' }),
}
