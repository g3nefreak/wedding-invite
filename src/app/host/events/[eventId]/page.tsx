import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EventEditor } from '#/features/events'

export const metadata: Metadata = { title: 'Event · Online Invitation' }

type Props = { params: Promise<{ eventId: string }> }

async function Editor({ params }: Props) {
  const { eventId } = await params
  return <EventEditor eventId={eventId} />
}

export default function EventPage({ params }: Props) {
  return (
    <Suspense fallback={<p>Loading the event…</p>}>
      <Editor params={params} />
    </Suspense>
  )
}
