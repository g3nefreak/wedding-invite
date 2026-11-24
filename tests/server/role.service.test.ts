import { beforeEach, expect, it } from 'vitest'
import { createEvent } from '#/server/services/event.service'
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
} from '#/server/services/role.service'
import {
  fakeEventRepository,
  fakeRoleRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'

const eventInput = {
  type: 'wedding' as const,
  title: 'Mika & Paolo',
  eventDate: '2027-06-12',
  replyBy: '2027-03-31',
  themeKey: 'black-and-white',
}
const roleInput = {
  title: 'Maid of Honor',
  askText: 'Will you stand beside me?',
  note: '',
  attire: 'Champagne gown',
}

let repos: {
  events: ReturnType<typeof fakeEventRepository>
  roles: ReturnType<typeof fakeRoleRepository>
}
let eventId: string
let otherEventId: string

beforeEach(async () => {
  repos = { events: fakeEventRepository(), roles: fakeRoleRepository() }
  const users = fakeUserRepository()
  const owner = { id: OWNER, email: 'mika@example.com' }
  eventId = (
    await createEvent(owner, eventInput, { events: repos.events, users })
  ).id
  otherEventId = (
    await createEvent(owner, eventInput, { events: repos.events, users })
  ).id
})

it('adds a role and lists it', async () => {
  const role = await createRole(OWNER, eventId, roleInput, repos)
  expect(role).toMatchObject(roleInput)
  expect(await listRoles(OWNER, eventId, repos)).toEqual([role])
  expect(await listRoles(OWNER, otherEventId, repos)).toEqual([])
})

it('a stranger cannot list, add, edit or delete roles', async () => {
  const role = await createRole(OWNER, eventId, roleInput, repos)
  const notFound = { code: 'NOT_FOUND' }
  await expect(listRoles(STRANGER, eventId, repos)).rejects.toMatchObject(
    notFound,
  )
  await expect(
    createRole(STRANGER, eventId, roleInput, repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    updateRole(STRANGER, eventId, role.id, { title: 'X' }, repos),
  ).rejects.toMatchObject(notFound)
  await expect(
    deleteRole(STRANGER, eventId, role.id, repos),
  ).rejects.toMatchObject(notFound)
  expect(repos.roles.rows).toHaveLength(1)
})

it('a role cannot be reached through a different event', async () => {
  const role = await createRole(OWNER, eventId, roleInput, repos)
  for (const id of [
    role.id,
    'not-an-id',
    'bbbbbbbb-bbbb-4bbb-8bbb-999999999999',
  ]) {
    const through = id === role.id ? otherEventId : eventId
    await expect(
      updateRole(OWNER, through, id, { title: 'X' }, repos),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(deleteRole(OWNER, through, id, repos)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  }
  expect(repos.roles.rows[0].title).toBe('Maid of Honor')
})

it('edits and deletes a role', async () => {
  const role = await createRole(OWNER, eventId, roleInput, repos)
  const edited = await updateRole(
    OWNER,
    eventId,
    role.id,
    { attire: 'Sage gown' },
    repos,
  )
  expect(edited).toMatchObject({ title: 'Maid of Honor', attire: 'Sage gown' })
  await deleteRole(OWNER, eventId, role.id, repos)
  expect(repos.roles.rows).toHaveLength(0)
})
