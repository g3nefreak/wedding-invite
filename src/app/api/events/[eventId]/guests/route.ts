import { hostDeps } from '#/server/host-deps'
import type { HostDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import {
  createGuest,
  createGuests,
  listGuests,
} from '#/server/services/guest.service'
import { newGuestsSchema } from '#/server/validation/guest.schema'

type Context = { params: Promise<{ eventId: string }> }

export function makeHandlers({ events, roles, guests, getUser }: HostDeps) {
  const repos = { events, roles, guests }

  return {
    GET: (_request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        return ok(await listGuests(user.id, eventId, repos))
      }),

    // Takes one guest from the form, or a pasted list of names. Either way
    // the answer is the list of guests that were added.
    POST: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const input = newGuestsSchema.parse(await readJson(request))
        const added =
          'names' in input
            ? await createGuests(user.id, eventId, input.names, repos)
            : [await createGuest(user.id, eventId, input, repos)]
        return ok(added, 201)
      }),
  }
}

export const { GET, POST } = makeHandlers(hostDeps)
