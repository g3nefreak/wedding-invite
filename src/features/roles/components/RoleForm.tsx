'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Field } from '#/components/Field'
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  ERROR_TEXT,
  FIELD,
} from '#/components/host-styles'
import { ApiError } from '#/lib/api'
import { roleSchema } from '#/server/validation/role.schema'
import type { RoleInput } from '../roles.types'

const EMPTY: RoleInput = { title: '', askText: '', note: '', attire: '' }

// Used both to add a role and to edit one. The parent decides what saving
// does and passes in its progress.
export function RoleForm({
  initial = EMPTY,
  submitLabel,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: RoleInput
  submitLabel: string
  isPending: boolean
  error: unknown
  onSubmit: (input: RoleInput) => void
  onCancel: () => void
}) {
  // Several of these forms can be on the page, so field ids must not clash.
  const formId = useId()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleInput>({
    resolver: zodResolver(roleSchema),
    defaultValues: initial,
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <Field id={`${formId}-title`} label="Title" error={errors.title?.message}>
        {(control) => (
          <input
            {...control}
            type="text"
            placeholder="Maid of Honor"
            className={FIELD}
            {...register('title')}
          />
        )}
      </Field>

      <Field
        id={`${formId}-ask`}
        label="Ask text (optional)"
        hint="The question this guest reads on their invitation."
        error={errors.askText?.message}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            placeholder="Will you stand beside me as my maid of honor?"
            className={FIELD}
            {...register('askText')}
          />
        )}
      </Field>

      <Field
        id={`${formId}-note`}
        label="Note (optional)"
        hint="A short message under the question."
        error={errors.note?.message}
      >
        {(control) => (
          <textarea
            {...control}
            rows={2}
            placeholder="You have been with me through everything."
            className={`${FIELD} leading-normal`}
            {...register('note')}
          />
        )}
      </Field>

      <Field
        id={`${formId}-attire`}
        label="Attire (optional)"
        error={errors.attire?.message}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            placeholder="Floor-length gown in champagne"
            className={FIELD}
            {...register('attire')}
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
            : 'Unable to save the role. Check your connection and try again.'}
        </p>
      )}
    </form>
  )
}
