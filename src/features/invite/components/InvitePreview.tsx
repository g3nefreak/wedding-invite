'use client'

import { useState } from 'react'
import { BUTTON_QUIET } from '#/components/host-styles'
import type { InviteView } from '../invite.types'
import { InviteScreen } from './InviteScreen'

// The host's look at their invitation, as a guest would see it. The preview
// itself cannot be clicked, so a button beside it switches between the
// envelope cover and the invitation inside.
export function InvitePreview({
  invite,
  tall = false,
}: {
  invite: InviteView
  // Fills the height of the window, for the invitation editor.
  tall?: boolean
}) {
  const [showCover, setShowCover] = useState(false)
  const hasCover = invite.cover.enabled

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">Preview</h3>
        {hasCover && (
          <button
            type="button"
            className={BUTTON_QUIET}
            aria-pressed={showCover}
            onClick={() => setShowCover((shown) => !shown)}
          >
            Show cover
          </button>
        )}
      </div>
      {/* The box itself scrolls (mouse, touch, or arrow keys once focused).
          Only what is inside is `inert`: look-only, so nothing in the
          invitation can be clicked, typed into or tabbed to. Putting `inert`
          on the box would switch off its scrolling as well. */}
      <div
        role="region"
        aria-label="Preview of the invitation"
        tabIndex={0}
        // The cover and the background photo inside fill exactly one "screen"
        // of this box, so they read its height from the same variable.
        style={{
          ['--preview-height' as string]: tall ? 'calc(100dvh - 7rem)' : '70vh',
        }}
        className="h-(--preview-height) overflow-y-auto overscroll-contain rounded-2xl border border-host-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent"
      >
        <div inert>
          <InviteScreen
            invite={invite}
            token="preview"
            preview
            coverState={hasCover && showCover ? 'closed' : 'open'}
          />
        </div>
      </div>
    </div>
  )
}
