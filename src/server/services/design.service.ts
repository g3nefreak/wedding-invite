import { getTheme } from '#/server/config/themes'
import type { DesignOverrides } from '#/server/config/themes'
import { AppError } from '#/server/errors'
import type { EventRepository } from '#/server/repositories/event.repository'
import { findOwnedEvent, toEventView } from '#/server/services/event.service'
import type { EventView } from '#/server/services/event.service'
import { readDesignOverrides } from '#/server/validation/design.schema'
import type { DesignInput } from '#/server/validation/design.schema'

export { resolveDesign } from '#/lib/resolve-design'

// Changes an event's theme and the host's choices on top of it. Only what is
// sent changes; `null` puts that choice back to the theme's default.
export async function updateDesign(
  userId: string,
  eventId: string,
  input: DesignInput,
  repo: EventRepository,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, repo)
  const themeKey = input.themeKey ?? event.themeKey
  const themeChanged = themeKey !== event.themeKey

  let theme
  try {
    theme = getTheme(themeKey)
  } catch {
    throw new AppError('VALIDATION', 'Choose one of the listed themes')
  }

  // Colors and font pairs belong to a theme, so a new theme starts clean.
  const saved = readDesignOverrides(event.design)
  const design: DesignOverrides = themeChanged
    ? { backgroundAssetId: saved.backgroundAssetId, overlay: saved.overlay }
    : { ...saved }

  for (const key of ['accent', 'fontPairIndex', 'overlay'] as const) {
    const value = input[key]
    if (value === null) delete design[key]
    else if (value !== undefined) Object.assign(design, { [key]: value })
  }

  if (
    design.fontPairIndex !== undefined &&
    design.fontPairIndex >= theme.fontPairs.length
  ) {
    throw new AppError('VALIDATION', "Choose one of this theme's font pairs")
  }

  // Drop anything left undefined so only real choices are stored.
  const clean = Object.fromEntries(
    Object.entries(design).filter(([, value]) => value !== undefined),
  )
  return toEventView(await repo.update(event.id, { themeKey, design: clean }))
}
