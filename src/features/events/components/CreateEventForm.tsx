'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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

export function CreateEventForm() {
  const router = useRouter()
  const themes = useThemesQuery('wedding')
  const createEvent = useCreateEventMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { type: 'wedding', themeKey: 'black-and-white' },
  })

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
      <Field
        id="title"
        label="Title"
        hint="Shown in large type on the invitation, such as the couple's names."
        error={errors.title?.message}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            placeholder="Mika & Paolo"
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
