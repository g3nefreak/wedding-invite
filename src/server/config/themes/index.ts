import type { EventTypeKey } from '#/server/config/event-types'
import { AppError } from '#/server/errors'
import { artDeco } from './art-deco'
import { blackAndWhite } from './black-and-white'
import { bohemian } from './bohemian'
import { gardenBotanical } from './garden-botanical'
import { rustic } from './rustic'
import { midnightStar } from './midnight-star'
import { neonFuture } from './neon-future'
import { modernMinimal } from './modern-minimal'
import { blushRomance } from './blush-romance'
import { royalEmerald } from './royal-emerald'
import { coastal } from './coastal'
import { skyBlue } from './sky-blue'
import type { Theme } from './types'

export type {
  DesignOverrides,
  FontPair,
  Palette,
  ResolvedDesign,
  Theme,
} from './types'

// To add a theme: create its file beside this one and add it to this list.
const THEMES: Theme[] = [
  blackAndWhite,
  gardenBotanical,
  bohemian,
  artDeco,
  rustic,
  midnightStar,
  neonFuture,
  modernMinimal,
  blushRomance,
  royalEmerald,
  coastal,
  skyBlue,
]

export function getTheme(key: string): Theme {
  const theme = THEMES.find((candidate) => candidate.key === key)
  if (!theme) throw new AppError('NOT_FOUND', 'Theme not found')
  return theme
}

export function listThemes(eventType: EventTypeKey): Theme[] {
  return THEMES.filter((theme) => theme.eventTypes.includes(eventType))
}
