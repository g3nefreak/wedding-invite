'use client'

import { useEffect, useState } from 'react'
import type { SectionView } from '#/lib/sections'
import { LABEL } from './parts'

type Content = Extract<SectionView, { type: 'countdown' }>['content']

// What the section says once the wait is over, unless the host wrote their
// own. Exported so the editor can show the same words as placeholders.
export const COUNTDOWN_MESSAGES = {
  day: 'Today is the day',
  after: 'Thank you for celebrating with us',
} as const

const UNITS = [
  { label: 'Days', size: 86_400_000 },
  { label: 'Hours', size: 3_600_000 },
  { label: 'Minutes', size: 60_000 },
  { label: 'Seconds', size: 1000 },
] as const

// Counts down to the moment the event starts. From then until the end of the
// day it says the day has come, and afterwards it thanks the guests.
export function CountdownSection({
  content,
  startsAt,
  dayEndsAt,
}: {
  content: Content
  startsAt: string
  dayEndsAt: string
}) {
  // The clock is read only in the browser, after the first draw, so the
  // server and the browser never disagree about what the page says.
  const [left, setLeft] = useState<number | null>(null)
  const [dayOver, setDayOver] = useState(false)

  useEffect(() => {
    const target = new Date(startsAt).getTime()
    const dayEnd = new Date(dayEndsAt).getTime()
    const tick = () => {
      setLeft(target - Date.now())
      setDayOver(Date.now() >= dayEnd)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [startsAt, dayEndsAt])

  // Nothing until the browser has read the clock, and nothing at all if the
  // date could not be understood.
  if (left === null || Number.isNaN(left)) return null

  if (left <= 0) {
    const message = dayOver
      ? content.afterMessage || COUNTDOWN_MESSAGES.after
      : content.dayMessage || COUNTDOWN_MESSAGES.day
    return (
      <section
        data-testid="section-countdown"
        data-shell
        className="flex flex-col gap-4"
      >
        <p className="text-3xl leading-tight text-balance break-words [font-family:var(--font-display)] sm:text-4xl">
          {message}
        </p>
      </section>
    )
  }

  // Each unit shows what is left over after the bigger units are taken out.
  const parts = UNITS.map(({ label, size }, index) => {
    const bigger = UNITS[index - 1]?.size
    return {
      label,
      value: Math.floor((bigger ? left % bigger : left) / size),
    }
  })

  return (
    <section
      data-testid="section-countdown"
      data-shell
      aria-label="Time left until the celebration"
      className="flex flex-col gap-4"
    >
      <p className={LABEL}>Counting down</p>
      {/* Every digit keeps one width, so the numbers do not jiggle as they
          change. */}
      <dl className="grid w-full grid-cols-4 gap-2 tabular-nums">
        {parts.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col-reverse items-center gap-1 rounded-(--inner-radius) border border-line bg-panel px-1 py-4"
          >
            <dt className={LABEL}>{label}</dt>
            <dd className="text-[clamp(1.75rem,9vw,3.25rem)] leading-none [font-family:var(--font-display)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
