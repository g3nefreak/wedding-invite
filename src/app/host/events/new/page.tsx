import type { Metadata } from 'next'
import { CreateEventForm } from '#/features/events'

export const metadata: Metadata = { title: 'New event · Online Invitation' }

export default function NewEventPage() {
  return (
    <>
      <h1 className="font-host-display text-5xl leading-none font-medium italic sm:text-6xl">
        New event
      </h1>
      <CreateEventForm />
    </>
  )
}
