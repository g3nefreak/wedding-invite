'use client'

import type { EventView, ThemeOption } from '#/features/events/events.types'
import { InviteScreen } from '#/features/invite'
import type { InviteView } from '#/features/invite'
import { resolveDesign } from '#/lib/resolve-design'

// Shows the invitation as a guest would see it, with the choices being made
// right now. It uses a made-up guest so the role wording is visible too.
export function DesignPreview({
  event,
  theme,
  accent,
  fontPairIndex,
  overlay,
}: {
  event: EventView
  theme: ThemeOption
  accent: string | null
  fontPairIndex: number
  overlay: number | null
}) {
  const invite: InviteView = {
    guestName: 'Guest name',
    role: {
      title: 'Maid of Honor',
      askText: 'Will you stand beside me as my maid of honor?',
      note: 'A note for this guest shows here.',
      attire: 'Floor-length gown',
      color: '',
    },
    note: 'A note for this guest shows here.',
    event: {
      type: event.type,
      typeName: 'Wedding',
      title: event.title,
      eventDate: event.eventDate,
      replyBy: event.replyBy,
      details: event.details,
    },
    design: resolveDesign(theme, {
      ...event.design,
      accent: accent ?? undefined,
      fontPairIndex,
      overlay: overlay ?? undefined,
    }),
    backgroundUrl: event.backgroundUrl,
    reply: null,
    replyOpen: true,
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">Preview</h3>
      {/* The box itself scrolls (mouse, touch, or arrow keys once focused).
          Only what is inside is `inert`: look-only, so nothing in the
          invitation can be clicked, typed into or tabbed to. Putting `inert`
          on the box would switch off its scrolling as well. */}
      <div
        role="region"
        aria-label="Preview of the invitation"
        tabIndex={0}
        className="max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl border border-host-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent"
      >
        <div inert>
          <InviteScreen invite={invite} token="preview" preview />
        </div>
      </div>
    </div>
  )
}
