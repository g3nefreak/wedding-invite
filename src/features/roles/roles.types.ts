// `import type` only: nothing from the backend ends up in the browser bundle.
export type { RoleView } from '#/server/services/role.service'
export type {
  RoleInput,
  UpdateRoleInput,
} from '#/server/validation/role.schema'
