import {
  assertWithinLimit,
  clientIp,
  createRateLimiter,
} from '#/server/auth/rate-limit'
import { handle, ok } from '#/server/http'
import { prismaInviteRepository } from '#/server/repositories/invite.repository'
import type { InviteRepository } from '#/server/repositories/invite.repository'
import { getInvite } from '#/server/services/invite.service'

type Context = { params: Promise<{ token: string }> }

// Built from a repository so tests can pass a fake one.
export function makeHandler(repo: InviteRepository) {
  const perIp = createRateLimiter({ limit: 30, windowMs: 60_000 })

  return (request: Request, { params }: Context) =>
    handle(async () => {
      assertWithinLimit(perIp, clientIp(request))
      const { token } = await params
      return ok(await getInvite(token, repo, new Date()))
    })
}

export const GET = makeHandler(prismaInviteRepository)
