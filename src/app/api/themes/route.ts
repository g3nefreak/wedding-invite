import { requireSessionUser } from '#/server/auth/session'
import { listThemes } from '#/server/config/themes'
import { AppError } from '#/server/errors'
import { handle, ok } from '#/server/http'

// Lists the themes a host can pick for an event type.
export function GET(request: Request) {
  return handle(async () => {
    await requireSessionUser()
    const eventType = new URL(request.url).searchParams.get('eventType')
    if (eventType !== 'wedding') {
      throw new AppError('VALIDATION', 'Unknown event type')
    }
    // Themes are plain design data with nothing private in them.
    return ok(listThemes(eventType))
  })
}
