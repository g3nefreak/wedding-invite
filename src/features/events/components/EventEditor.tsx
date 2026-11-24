'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  BUTTON_DANGER,
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  CARD,
  ERROR_TEXT,
  FIELD,
  TAB,
} from '#/components/host-styles'
import { DesignPanel } from '#/features/design'
import { GuestsPanel } from '#/features/guests'
import { formatDay } from '#/features/invite'
import { RolesPanel } from '#/features/roles'
import { ApiError } from '#/lib/api'
import {
  useDeleteEventMutation,
  useEventQuery,
  usePublishEventMutation,
  useUpdateEventMutation,
} from '../events.query'
import { eventFormSchema, toFormValues, toUpdateInput } from '../events.schema'
import type { EventFormValues } from '../events.schema'
import type { EventView } from '../events.types'
import { Field } from '#/components/Field'

const CONNECTION_HINT = 'Check your connection and try again.'

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiError
    ? error.message
    : `${fallback} ${CONNECTION_HINT}`
}

const HEADING = 'font-host-display text-3xl leading-tight font-medium'

export function EventEditor({ eventId }: { eventId: string }) {
  const event = useEventQuery(eventId)

  if (event.isPending) return <p>Loading the event…</p>

  if (event.isError) {
    return (
      <div role="alert" className={`${CARD} flex flex-col items-start gap-4`}>
        <p className="text-lg leading-normal">
          {errorText(event.error, 'Unable to load this event.')}
        </p>
        <Link href="/host" className={BUTTON_QUIET}>
          Back to your events
        </Link>
      </div>
    )
  }

  // Keyed by id so the form starts fresh if another event is opened.
  return <LoadedEvent key={event.data.id} event={event.data} />
}

const TABS = [
  { key: 'guests', label: 'Guests' },
  { key: 'roles', label: 'Roles' },
  { key: 'details', label: 'Details' },
  { key: 'design', label: 'Design' },
  { key: 'settings', label: 'Settings' },
] as const

type TabKey = (typeof TABS)[number]['key']

function LoadedEvent({ event }: { event: EventView }) {
  // The open tab lives in the address (?tab=roles), so it survives a reload
  // and the browser's back button moves between tabs.
  const requested = useSearchParams().get('tab')
  const tab: TabKey =
    TABS.find((candidate) => candidate.key === requested)?.key ?? 'guests'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/host"
          className="text-host-ink-soft underline underline-offset-4 hover:text-host-ink"
        >
          Back to your events
        </Link>
        <h1 className="font-host-display text-5xl leading-none font-medium italic sm:text-6xl">
          {event.title}
        </h1>
        <p className="text-lg text-host-ink-soft">
          {formatDay(event.eventDate)}
          {' · '}
          {event.status === 'published' ? 'Published' : 'Draft'}
        </p>
      </div>

      <nav
        aria-label="Event sections"
        className="flex flex-wrap gap-x-6 gap-y-2 border-b border-host-line"
      >
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/host/events/${event.id}?tab=${item.key}`}
            aria-current={item.key === tab ? 'page' : undefined}
            className={`${TAB} -mb-px`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === 'guests' && (
        <GuestsPanel
          eventId={event.id}
          published={event.status === 'published'}
        />
      )}
      {tab === 'roles' && <RolesPanel eventId={event.id} />}
      {tab === 'details' && <DetailsForm event={event} />}
      {tab === 'design' && <DesignPanel event={event} />}
      {tab === 'settings' && (
        <>
          <PublishPanel event={event} />
          <DeletePanel event={event} />
        </>
      )}
    </div>
  )
}

function PublishPanel({ event }: { event: EventView }) {
  const publish = usePublishEventMutation(event.id)

  if (event.status === 'published') {
    return (
      <section className={`${CARD} flex flex-col gap-2`}>
        <h2 className={HEADING}>Published</h2>
        <p className="text-lg leading-normal text-host-ink-soft">
          Guest links for this event are working.
        </p>
      </section>
    )
  }

  return (
    <section className={`${CARD} flex flex-col items-start gap-4`}>
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>Draft</h2>
        <p className="max-w-[56ch] text-lg leading-normal text-host-ink-soft">
          Guest links do not work until you publish. You can keep editing after
          publishing.
        </p>
      </div>
      <button
        type="button"
        disabled={publish.isPending}
        onClick={() => publish.mutate(undefined)}
        className={BUTTON_PRIMARY}
      >
        {publish.isPending ? 'Publishing…' : 'Publish event'}
      </button>
      {publish.isError && (
        <p role="alert" className={ERROR_TEXT}>
          {errorText(publish.error, 'Unable to publish.')}
        </p>
      )}
    </section>
  )
}

function DetailsForm({ event }: { event: EventView }) {
  const update = useUpdateEventMutation(event.id)
  const [justSaved, setJustSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: toFormValues(event),
  })

  function submit(values: EventFormValues) {
    setJustSaved(false)
    update.mutate(toUpdateInput(values), {
      onSuccess: () => setJustSaved(true),
    })
  }

  // A plain text input bound to one form field.
  const text = (name: keyof EventFormValues, placeholder?: string) =>
    function TextInput(control: object) {
      return (
        <input
          {...control}
          type="text"
          placeholder={placeholder}
          className={FIELD}
          {...register(name)}
        />
      )
    }

  return (
    <section className={`${CARD} flex flex-col gap-6`}>
      <h2 className={HEADING}>Details</h2>
      <form
        onSubmit={handleSubmit(submit)}
        onChange={() => setJustSaved(false)}
        noValidate
        className="flex flex-col gap-6"
      >
        <Field id="title" label="Title" error={errors.title?.message}>
          {text('title')}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="eventDate"
            label="Event date"
            error={errors.eventDate?.message}
          >
            {(control) => (
              <input
                {...control}
                type="date"
                className={FIELD}
                {...register('eventDate')}
              />
            )}
          </Field>
          <Field id="replyBy" label="Reply by" error={errors.replyBy?.message}>
            {(control) => (
              <input
                {...control}
                type="date"
                className={FIELD}
                {...register('replyBy')}
              />
            )}
          </Field>
        </div>

        <Field
          id="headline"
          label="Headline"
          hint="A line under the title on the invitation."
          error={errors.headline?.message}
        >
          {text(
            'headline',
            'Together with their families, they invite you to their wedding',
          )}
        </Field>

        <fieldset className="grid gap-6 sm:grid-cols-[2fr_1fr]">
          <legend className="mb-4 font-host-display text-2xl">Ceremony</legend>
          <Field
            id="ceremonyVenue"
            label="Venue"
            error={errors.ceremonyVenue?.message}
          >
            {text('ceremonyVenue', 'San Agustin Church, Manila')}
          </Field>
          <Field
            id="ceremonyTime"
            label="Time"
            error={errors.ceremonyTime?.message}
          >
            {text('ceremonyTime', '3:00 PM')}
          </Field>
        </fieldset>

        <fieldset className="grid gap-6 sm:grid-cols-[2fr_1fr]">
          <legend className="mb-4 font-host-display text-2xl">Reception</legend>
          <Field
            id="receptionVenue"
            label="Venue"
            error={errors.receptionVenue?.message}
          >
            {text('receptionVenue', 'The Glass Garden, Pasig')}
          </Field>
          <Field
            id="receptionTime"
            label="Time"
            error={errors.receptionTime?.message}
          >
            {text('receptionTime', '6:00 PM')}
          </Field>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={update.isPending}
            className={BUTTON_QUIET}
          >
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
          {/* Always in the page, so screen readers announce it when it fills. */}
          <p role="status" className="text-lg empty:hidden">
            {justSaved && !update.isPending ? 'Changes saved' : ''}
          </p>
        </div>

        {update.isError && (
          <p role="alert" className={ERROR_TEXT}>
            {errorText(update.error, 'Unable to save.')}
          </p>
        )}
      </form>
    </section>
  )
}

function DeletePanel({ event }: { event: EventView }) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const remove = useDeleteEventMutation(event.id)

  return (
    <section className={`${CARD} flex flex-col items-start gap-4`}>
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>Delete this event</h2>
        <p className="max-w-[56ch] text-lg leading-normal text-host-ink-soft">
          Removes the event with its roles, guests and replies. Guest links stop
          working.
        </p>
      </div>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={BUTTON_DANGER}
      >
        Delete event
      </button>

      {/* A native dialog: it traps focus, closes on Escape and returns focus
          to the button that opened it. */}
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-host-line bg-host-ground p-6 text-host-ink backdrop:bg-black/70 sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 id="delete-title" className={HEADING}>
              Delete “{event.title}”?
            </h3>
            <p className="text-lg leading-normal text-host-ink-soft">
              Its roles, guests and replies are deleted with it. This cannot be
              undone.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => router.replace('/host'),
                })
              }
              className={BUTTON_DANGER}
            >
              {remove.isPending ? 'Deleting…' : 'Delete event'}
            </button>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={BUTTON_QUIET}
            >
              Cancel
            </button>
          </div>
          {remove.isError && (
            <p role="alert" className={ERROR_TEXT}>
              {errorText(remove.error, 'Unable to delete.')}
            </p>
          )}
        </div>
      </dialog>
    </section>
  )
}
