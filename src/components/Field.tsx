import type { ReactNode } from 'react'
import { ERROR_TEXT, LABEL } from '#/components/host-styles'

// A label, its control and the error under it, wired together for screen
// readers. `children` receives the props the control must carry.
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: (control: {
    id: string
    'aria-invalid': true | undefined
    'aria-describedby': string | undefined
  }) => ReactNode
}) {
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-host-ink-soft">
          {hint}
        </p>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {error && (
        <p id={`${id}-error`} className={ERROR_TEXT}>
          {error}
        </p>
      )}
    </div>
  )
}
