// How readable one color is on another, by the WCAG formula: 1 (same color)
// up to 21 (black on white). Body text needs at least 4.5.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

// Both colors must be written as #rrggbb.
export function contrastRatio(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  )
  return (light + 0.05) / (dark + 0.05)
}

export const READABLE_CONTRAST = 4.5
