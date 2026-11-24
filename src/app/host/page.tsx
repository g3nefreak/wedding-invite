import type { Metadata } from 'next'
import { EventList } from '#/features/events'

export const metadata: Metadata = { title: 'Your events · Online Invitation' }

export default function HostPage() {
  return (
    <>
      <h1 className="font-host-display text-5xl leading-none font-medium italic sm:text-6xl">
        Your events
      </h1>
      <EventList />
    </>
  )
}
