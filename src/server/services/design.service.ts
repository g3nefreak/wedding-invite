import type {
  DesignOverrides,
  ResolvedDesign,
  Theme,
} from '#/server/config/themes'

// A photo fully covered by the overlay would be invisible, so stop at 0.9.
const MAX_OVERLAY = 0.9

function clampOverlay(value: number): number {
  return Math.min(Math.max(value, 0), MAX_OVERLAY)
}

// Lays the host's few allowed changes over the theme. Builds new objects,
// so the shared theme data is never changed by one event's choices.
export function resolveDesign(
  theme: Theme,
  overrides: DesignOverrides,
): ResolvedDesign {
  const { fontPairs } = theme
  // An index the theme does not have falls back to its default pair.
  const fonts = fontPairs[overrides.fontPairIndex ?? 0] ?? fontPairs[0]

  // Listed one by one so `eventTypes` and `fontPairs` stay out of the result:
  // the page needs only the one chosen pair.
  return {
    key: theme.key,
    name: theme.name,
    category: theme.category,
    labelFont: theme.labelFont,
    art: theme.art,
    panelRadius: theme.panelRadius,
    heroAlign: theme.heroAlign,
    palette: {
      ...theme.palette,
      accent: overrides.accent ?? theme.palette.accent,
    },
    photo: {
      ...theme.photo,
      overlay: clampOverlay(overrides.overlay ?? theme.photo.overlay),
    },
    fonts: { ...fonts },
    backgroundAssetId: overrides.backgroundAssetId ?? null,
  }
}
