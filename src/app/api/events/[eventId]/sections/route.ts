import { hostDeps, photoDeps } from '#/server/host-deps'
import type { HostDeps, PhotoDeps } from '#/server/host-deps'
import { handle, ok, readJson } from '#/server/http'
import { updateSections } from '#/server/services/sections.service'
import { sectionsInputSchema } from '#/server/validation/sections.schema'

type Context = { params: Promise<{ eventId: string }> }

export function makeHandlers(
  { events, getUser }: HostDeps,
  { assets }: Pick<PhotoDeps, 'assets'>,
) {
  return {
    // Saves the whole invitation: every section, in order, plus the cover.
    PATCH: (request: Request, { params }: Context) =>
      handle(async () => {
        const user = await getUser()
        const { eventId } = await params
        const input = sectionsInputSchema.parse(await readJson(request))
        return ok(
          await updateSections(user.id, eventId, input, { events, assets }),
        )
      }),
  }
}

export const { PATCH } = makeHandlers(hostDeps, photoDeps)
