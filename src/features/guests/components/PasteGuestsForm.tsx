'use client'

import { useId, useState } from 'react'
import { Field } from '#/components/Field'
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  ERROR_TEXT,
  FIELD,
} from '#/components/host-styles'
import { ApiError } from '#/lib/api'

const MAX_AT_ONCE = 200

// One name per line; blank lines are ignored.
function readNames(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function PasteGuestsForm({
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  isPending: boolean
  error: unknown
  onSubmit: (names: string[]) => void
  onCancel: () => void
}) {
  const id = useId()
  const [text, setText] = useState('')
  const [problem, setProblem] = useState<string>()
  const names = readNames(text)

  function check(): string | undefined {
    if (names.length === 0) return 'Paste at least one name'
    if (names.length > MAX_AT_ONCE)
      return `Paste up to ${MAX_AT_ONCE} names at a time`
    if (names.some((name) => name.length > 80))
      return 'Each name can be up to 80 characters'
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const found = check()
        setProblem(found)
        if (!found) onSubmit(names)
      }}
      className="flex flex-col gap-6"
    >
      <Field
        id={id}
        label="Guest names"
        hint="One name per line. Roles and notes can be added to each guest afterwards."
        error={problem}
      >
        {(control) => (
          <textarea
            {...control}
            rows={6}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setProblem(undefined)
            }}
            placeholder={'Ana Reyes\nMarco Dela Cruz\nBea Cruz'}
            className={`${FIELD} leading-normal`}
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={isPending} className={BUTTON_PRIMARY}>
          {isPending
            ? 'Adding…'
            : names.length > 1
              ? `Add ${names.length} guests`
              : 'Add guests'}
        </button>
        <button type="button" onClick={onCancel} className={BUTTON_QUIET}>
          Cancel
        </button>
      </div>

      {error != null && (
        <p role="alert" className={ERROR_TEXT}>
          {error instanceof ApiError
            ? error.message
            : 'Unable to add the guests. Check your connection and try again.'}
        </p>
      )}
    </form>
  )
}
