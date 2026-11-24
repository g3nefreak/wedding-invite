import type { CSSProperties } from 'react'
import type { ResolvedDesign } from './invite.types'

// Theme files name fonts the way people do ("Bodoni Moda"). The loaded font
// lives in a CSS variable named after it (--font-bodoni-moda, see app/fonts.ts).
function fontStack(name: string, fallback: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `var(--font-${slug}), ${fallback}`
}

// Turns a resolved design into the CSS variables the invitation is drawn with.
export function designVariables(design: ResolvedDesign): CSSProperties {
  const { palette, fonts } = design

  return {
    '--ground': palette.ground,
    '--ink': palette.ink,
    '--ink-soft': palette.inkSoft,
    '--panel': palette.panel,
    '--line': palette.line,
    '--accent': palette.accent,
    '--button-ink': palette.buttonInk,
    '--font-display': fontStack(fonts.display, 'Georgia, serif'),
    '--font-body': fontStack(fonts.body, 'system-ui, sans-serif'),
    '--font-label': fontStack(design.labelFont, 'ui-monospace, monospace'),
    '--panel-radius': `${design.panelRadius}px`,
  } as CSSProperties
}

// "2027-06-12" -> "June 12, 2027". The date has no time, so it is read as UTC
// to keep it from slipping a day in the visitor's timezone.
export function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`))
}
