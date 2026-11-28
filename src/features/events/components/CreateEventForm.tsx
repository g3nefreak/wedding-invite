'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  ERROR_TEXT,
  FIELD,
  SELECT,
} from '#/components/host-styles'
import { ApiError } from '#/lib/api'
import { createEventSchema } from '#/server/validation/event.schema'
import { useCreateEventMutation, useThemesQuery } from '../events.query'
import type { CreateEventInput } from '../events.types'
import { Field } from '#/components/Field'

// The kinds of event a host can make, with the wording and starting theme
// that suit each.
const EVENT_KINDS = [
  {
    key: 'wedding',
    label: 'Wedding',
    theme: 'black-and-white',
    titleHint:
      "Shown in large type on the invitation, such as the couple's names.",
    titleExample: 'Mika & Paolo',
  },
  {
    key: 'birthday',
    label: 'Birthday and christening',
    theme: 'sky-blue',
    titleHint:
      "Shown in large type on the invitation, such as the child's name.",
    titleExample: 'Zian Elandre',
  },
] as const

export function CreateEventForm() {
  const router = useRouter()
  const createEvent = useCreateEventMutation()
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { type: 'wedding', themeKey: EVENT_KINDS[0].theme },
  })
  const type = useWatch({ control, name: 'type' })
  const kind = EVENT_KINDS.find((item) => item.key === type) ?? EVENT_KINDS[0]
  const themes = useThemesQuery(type)

  // Each kind of event starts on a theme that suits it. The host can still
  // pick any other theme below, or change it later on the Design tab.
  function pickKind(key: CreateEventInput['type']) {
    setValue('type', key)
    setValue('themeKey', EVENT_KINDS.find((item) => item.key === key)!.theme)
  }

  function submit(input: CreateEventInput) {
    createEvent.mutate(input, {
      onSuccess: (event) => router.push(`/host/events/${event.id}`),
    })
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex max-w-xl flex-col gap-6"
    >
      <fieldset>
        <legend className="mb-3 text-lg font-medium">Kind of event</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {EVENT_KINDS.map((item) => (
            <label
              key={item.key}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-host-line bg-host-panel px-4 py-3 has-checked:border-host-accent has-checked:bg-host-panel-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-host-accent"
            >
              <input
                type="radio"
                name="type"
                value={item.key}
                checked={type === item.key}
                onChange={() => pickKind(item.key)}
                className="size-5 accent-host-accent"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="title"
        label="Title"
        hint={kind.titleHint}
        error={errors.title?.message}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            placeholder={kind.titleExample}
            className={FIELD}
            {...register('title')}
          />
        )}
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
        <Field
          id="replyBy"
          label="Reply by"
          hint="Guests can reply until the end of this day."
          error={errors.replyBy?.message}
        >
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

      <Field id="themeKey" label="Theme" error={errors.themeKey?.message}>
        {(control) => (
          <select {...control} className={SELECT} {...register('themeKey')}>
            {(
              themes.data ?? [
                { key: 'black-and-white', name: 'Black and White' },
              ]
            ).map((theme) => (
              <option key={theme.key} value={theme.key}>
                {theme.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={createEvent.isPending}
          className={BUTTON_PRIMARY}
        >
          {createEvent.isPending ? 'Creating…' : 'Create event'}
        </button>
        <Link href="/host" className={BUTTON_QUIET}>
          Cancel
        </Link>
      </div>

      {createEvent.isError && (
        <p role="alert" className={ERROR_TEXT}>
          {createEvent.error instanceof ApiError
            ? createEvent.error.message
            : 'Unable to create the event. Check your connection and try again.'}
        </p>
      )}
    </form>
  )
}
