import {
  assertWithinLimit,
  clientIp,
  createRateLimiter,
} from '#/server/auth/rate-limit'
import { AppError } from '#/server/errors'
import { handle, ok } from '#/server/http'
import { prismaInviteRepository } from '#/server/repositories/invite.repository'
import type { InviteRepository } from '#/server/repositories/invite.repository'
import { saveRsvp } from '#/server/services/rsvp.service'
import { rsvpSchema } from '#/server/validation/rsvp.schema'

type Context = { params: Promise<{ token: string }> }

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new AppError('VALIDATION', 'The request body is not valid JSON')
  }
}

// Built from a repository so tests can pass a fake one.
export function makeHandler(repo: InviteRepository) {
  const perIp = createRateLimiter({ limit: 30, windowMs: 60_000 })
  // Tighter per link, so one guest's reply cannot be hammered from many addresses.
  const perToken = createRateLimiter({ limit: 10, windowMs: 60_000 })

  return (request: Request, { params }: Context) =>
    handle(async () => {
      const { token } = await params
      assertWithinLimit(perIp, clientIp(request))
      assertWithinLimit(perToken, token)

      const input = rsvpSchema.parse(await readJson(request))
      return ok(await saveRsvp(token, input, repo, new Date()))
    })
}

export const PUT = makeHandler(prismaInviteRepository)
