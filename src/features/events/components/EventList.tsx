'use client'

import Link from 'next/link'
import { BUTTON_PRIMARY, BUTTON_QUIET, CARD } from '#/components/host-styles'
import { EnvelopeArt } from '#/features/auth'
import { formatDay } from '#/features/invite'
import { useEventsQuery } from '../events.query'

export function EventList() {
  const events = useEventsQuery()

  if (events.isPending) return <p>Loading your events…</p>

  if (events.isError) {
    return (
      <div role="alert" className={`${CARD} flex flex-col items-start gap-4`}>
        <p className="text-lg leading-normal">
          Unable to load your events. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => events.refetch()}
          className={BUTTON_QUIET}
        >
          Try again
        </button>
      </div>
    )
  }

  if (events.data.length === 0) {
    return (
      <section
        className={`${CARD} flex flex-col items-start gap-6 sm:flex-row sm:items-center`}
      >
        <EnvelopeArt className="h-auto w-36 shrink-0" />
        <div className="flex flex-col items-start gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-host-display text-3xl leading-tight font-medium">
              No events yet
            </h2>
            <p className="max-w-[48ch] text-lg leading-normal text-pretty text-host-ink-soft">
              An event holds your invitation, your guest list and their replies.
            </p>
          </div>
          <Link href="/host/events/new" className={BUTTON_PRIMARY}>
            Create an event
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <ul className="flex w-full flex-col gap-4">
        {events.data.map((event) => (
          <li key={event.id}>
            <Link
              href={`/host/events/${event.id}`}
              className={`${CARD} flex flex-wrap items-center justify-between gap-4 transition-[border-color] duration-150 hover:border-host-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent`}
            >
              <span className="flex flex-col gap-1">
                <span className="font-host-display text-3xl leading-tight font-medium">
                  {event.title}
                </span>
                <span className="text-host-ink-soft">
                  {formatDay(event.eventDate)}
                </span>
              </span>
              <span className="rounded-full border border-host-line px-4 py-1 text-sm">
                {event.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/host/events/new" className={BUTTON_PRIMARY}>
        Create an event
      </Link>
    </div>
  )
}
