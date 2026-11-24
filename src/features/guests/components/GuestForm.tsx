'use client'

import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Field } from '#/components/Field'
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  ERROR_TEXT,
  FIELD,
  SELECT,
} from '#/components/host-styles'
import type { RoleView } from '#/features/roles'
import { ApiError } from '#/lib/api'
import type { GuestInput } from '../guests.types'

// A <select> can only hold text, so "no role" is an empty string in the form
// and becomes null when it is sent.
type FormValues = { name: string; roleId: string; personalNote: string }

// Used both to add a guest and to edit one.
export function GuestForm({
  roles,
  initial,
  submitLabel,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  roles: RoleView[]
  initial?: GuestInput
  submitLabel: string
  isPending: boolean
  error: unknown
  onSubmit: (input: GuestInput) => void
  onCancel: () => void
}) {
  const formId = useId()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      roleId: initial?.roleId ?? '',
      personalNote: initial?.personalNote ?? '',
    },
  })

  function submit(values: FormValues) {
    onSubmit({
      name: values.name.trim(),
      roleId: values.roleId || null,
      personalNote: values.personalNote.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${formId}-name`} label="Name" error={errors.name?.message}>
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="off"
              placeholder="Ana Reyes"
              className={FIELD}
              {...register('name', {
                validate: (value) =>
                  value.trim() ? true : "Enter the guest's name",
                maxLength: { value: 80, message: 'Use 80 characters or fewer' },
              })}
            />
          )}
        </Field>

        <Field id={`${formId}-role`} label="Role">
          {(control) => (
            <select {...control} className={SELECT} {...register('roleId')}>
              <option value="">No role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field
        id={`${formId}-note`}
        label="Personal note (optional)"
        hint="Shown only on this guest's invitation, in place of the role's note."
        error={errors.personalNote?.message}
      >
        {(control) => (
          <textarea
            {...control}
            rows={2}
            placeholder="I cannot do it without you, Ana."
            className={`${FIELD} leading-normal`}
            {...register('personalNote', {
              maxLength: { value: 300, message: 'Use 300 characters or fewer' },
            })}
          />
        )}
      </Field>

      <div className="flex flex-wrap gap-4">
        <button type="submit" disabled={isPending} className={BUTTON_PRIMARY}>
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={BUTTON_QUIET}>
          Cancel
        </button>
      </div>

      {error != null && (
        <p role="alert" className={ERROR_TEXT}>
          {error instanceof ApiError
            ? error.message
            : 'Unable to save the guest. Check your connection and try again.'}
        </p>
      )}
    </form>
  )
}
