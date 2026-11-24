import { z } from 'zod'
import { AppError } from '#/server/errors'
import type { EventRepository } from '#/server/repositories/event.repository'
import type {
  RoleRecord,
  RoleRepository,
} from '#/server/repositories/role.repository'
import { findOwnedEvent } from '#/server/services/event.service'
import type {
  RoleInput,
  UpdateRoleInput,
} from '#/server/validation/role.schema'

type Repos = { events: EventRepository; roles: RoleRepository }

export type RoleView = Omit<RoleRecord, 'eventId'>

function toView(role: RoleRecord): RoleView {
  return {
    id: role.id,
    title: role.title,
    askText: role.askText,
    note: role.note,
    attire: role.attire,
  }
}

// Checks the host owns the event AND the role belongs to that event, so a
// role can never be reached through someone else's event or the wrong one.
async function findOwnedRole(
  userId: string,
  eventId: string,
  roleId: string,
  repos: Repos,
): Promise<RoleRecord> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  const role = z.uuid().safeParse(roleId).success
    ? await repos.roles.findById(roleId)
    : null
  if (!role || role.eventId !== event.id) {
    throw new AppError('NOT_FOUND', 'Role not found')
  }
  return role
}

export async function listRoles(
  userId: string,
  eventId: string,
  repos: Repos,
): Promise<RoleView[]> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  return (await repos.roles.listByEvent(event.id)).map(toView)
}

export async function createRole(
  userId: string,
  eventId: string,
  input: RoleInput,
  repos: Repos,
): Promise<RoleView> {
  const event = await findOwnedEvent(userId, eventId, repos.events)
  return toView(await repos.roles.create(event.id, input))
}

export async function updateRole(
  userId: string,
  eventId: string,
  roleId: string,
  input: UpdateRoleInput,
  repos: Repos,
): Promise<RoleView> {
  const role = await findOwnedRole(userId, eventId, roleId, repos)
  return toView(await repos.roles.update(role.id, input))
}

export async function deleteRole(
  userId: string,
  eventId: string,
  roleId: string,
  repos: Repos,
): Promise<void> {
  const role = await findOwnedRole(userId, eventId, roleId, repos)
  await repos.roles.delete(role.id)
}
