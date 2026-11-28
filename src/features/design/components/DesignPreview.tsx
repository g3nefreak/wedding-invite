'use client'

import type { EventView, ThemeOption } from '#/features/events/events.types'
import { InvitePreview, previewInvite } from '#/features/invite'
import { resolveDesign } from '#/lib/resolve-design'

// Shows the invitation as a guest would see it, with the choices being made
// right now. It uses a made-up guest so the role wording is visible too.
export function DesignPreview({
  event,
  theme,
  accent,
  fonts,
  overlay,
}: {
  event: EventView
  theme: ThemeOption
  accent: string | null
  // The heading and text fonts being tried out.
  fonts: { display: string; body: string }
  overlay: number | null
}) {
  const design = resolveDesign(theme, {
    ...event.design,
    accent: accent ?? undefined,
    displayFont: fonts.display,
    bodyFont: fonts.body,
    overlay: overlay ?? undefined,
  })
  const invite = previewInvite(event, design, event.sectionPhotos)

  return (
    // Stays in view while the host scrolls through the choices beside it.
    <div className="min-w-0 lg:sticky lg:top-4">
      <InvitePreview invite={invite} tall />
    </div>
  )
}
