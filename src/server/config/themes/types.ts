import type { EventTypeKey } from '#/server/config/event-types'

export type Palette = {
  ground: string
  ink: string
  inkSoft: string
  panel: string
  line: string
  accent: string
  buttonInk: string
}

export type FontPair = { display: string; body: string }

export type Theme = {
  key: string
  name: string
  category: string
  eventTypes: EventTypeKey[]
  palette: Palette
  // Ready-made accent colors a host can pick. The first is the theme's own.
  // Each must keep `palette.buttonInk` readable on top of it.
  accents: string[]
  // The first pair is the default. A host can only pick from this list.
  fontPairs: FontPair[]
  labelFont: string
  art:
    | 'photo'
    | 'leaf-arch'
    | 'orbit-sun'
    | 'deco-fan'
    | 'frame'
    | 'stars'
    | 'horizon'
    | 'petals'
    | 'waves'
    | 'clouds'
  // The shape of the flap on the envelope cover.
  envelope: 'straight' | 'pointed' | 'curved' | 'stepped'
  panelRadius: number
  heroAlign: 'left' | 'center'
  photo: { overlay: number; filter: 'none' | 'grayscale' }
}

// The only things a host may change on top of a theme.
export type DesignOverrides = {
  accent?: string
  fontPairIndex?: number
  // A heading or text font picked from the font library on its own. Each
  // wins over the pair above when set.
  displayFont?: string
  bodyFont?: string
  backgroundAssetId?: string
  overlay?: number
}

// A theme with the host's changes applied: what the invitation page draws.
export type ResolvedDesign = Omit<
  Theme,
  'fontPairs' | 'eventTypes' | 'accents'
> & {
  fonts: FontPair
  backgroundAssetId: string | null
}
