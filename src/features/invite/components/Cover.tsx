'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Cover as CoverSettings } from '#/server/validation/sections.schema'
import type { ResolvedDesign } from '../invite.types'
import { Envelope } from './Envelope'

// How long the opening takes: the flap lifts, then the cover fades away.
// Kept in step with the keyframes in globals.css.
const OPENING_MS = 850

type State = 'closed' | 'opening' | 'open'

const LABEL =
  '[font-family:var(--font-label)] text-xs uppercase tracking-[0.14em] text-ink-soft'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// The first thing a guest sees: a sealed envelope. Opening it reveals the
// invitation, which is already on the page behind it.
export function Cover({
  cover,
  title,
  date,
  design,
  preview = false,
  forced,
  children,
}: {
  cover: CoverSettings
  title: string
  date: string
  design: ResolvedDesign
  // True inside the host's preview: the cover fills the preview box.
  preview?: boolean
  // The host's preview cannot be clicked, so it sets the state from outside.
  forced?: 'closed' | 'open'
  children: ReactNode
}) {
  const [own, setOwn] = useState<State>('closed')
  const invitation = useRef<HTMLDivElement>(null)
  const state: State = forced ?? own

  // Once open, keyboard and screen reader users are taken to the invitation's
  // title instead of being left where the button used to be.
  useEffect(() => {
    if (own === 'open') invitation.current?.querySelector('h1')?.focus()
  }, [own])

  // Finishes the opening even if the animation never reports its end.
  useEffect(() => {
    if (own !== 'opening') return
    const timer = setTimeout(() => setOwn('open'), OPENING_MS)
    return () => clearTimeout(timer)
  }, [own])

  if (!cover.enabled) return <>{children}</>

  const closed = state !== 'open'

  return (
    <>
      {/* Without JavaScript the button cannot work, so the cover steps aside
          and the invitation is simply shown. */}
      <noscript>
        <style>{`.invite-cover{display:none}.invite-behind{visibility:visible;height:auto;overflow:visible}`}</style>
      </noscript>

      {closed && (
        <div
          data-state={state}
          className={`invite-cover relative z-10 flex flex-col items-center justify-center gap-6 px-5 py-10 text-center ${preview ? 'min-h-(--preview-height)' : 'min-h-dvh'}`}
        >
          {cover.line && <p className={LABEL}>{cover.line}</p>}
          <Envelope shape={design.envelope} monogram={cover.monogram} />
          <div className="flex flex-col gap-2">
            <p className="text-4xl leading-tight text-balance break-words [font-family:var(--font-display)]">
              {title}
            </p>
            <p className="text-lg leading-normal text-ink-soft">{date}</p>
          </div>
          <button
            type="button"
            disabled={state === 'opening'}
            onClick={() => setOwn(prefersReducedMotion() ? 'open' : 'opening')}
            className="min-h-11 rounded-(--inner-radius) bg-accent px-8 py-3 font-medium text-button-ink transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.96]"
          >
            Tap to open
          </button>
        </div>
      )}

      {/* While the cover is up the invitation is on the page but out of reach
          and out of sight, so it is ready the moment the envelope opens. */}
      <div
        ref={invitation}
        inert={closed}
        className={
          closed
            ? 'invite-behind invisible h-0 overflow-hidden'
            : 'flex flex-1 flex-col'
        }
      >
        {children}
      </div>
    </>
  )
}
