'use client'

import type { ReactNode } from 'react'
import { Field } from '#/components/Field'
import { BUTTON_SMALL, FIELD } from '#/components/host-styles'
import { moveItem } from '../sections.helpers'

type TextProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  hint?: string
  placeholder?: string
  error?: string
}

// One line of text in a section's form.
export function TextField({ onChange, value, ...rest }: TextProps) {
  const { id, label, hint, error, maxLength, placeholder } = rest
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {(control) => (
        <input
          {...control}
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD}
        />
      )}
    </Field>
  )
}

// A paragraph. Line breaks the host types are kept on the invitation.
export function AreaField({ onChange, value, ...rest }: TextProps) {
  const { id, label, hint, error, maxLength, placeholder } = rest
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {(control) => (
        <textarea
          {...control}
          rows={4}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${FIELD} py-3 leading-normal`}
        />
      )}
    </Field>
  )
}

// A list the host can add to, reorder and remove from: names, places,
// reminders and so on. Buttons do the moving, so it works the same with a
// finger, a mouse or a keyboard.
export function ListEditor<Item>({
  legend,
  items,
  onChange,
  max,
  newItem,
  addLabel,
  itemName,
  children,
}: {
  legend: string
  items: Item[]
  onChange: (items: Item[]) => void
  max: number
  // Left out for lists that are added to some other way (the photo story).
  newItem?: () => Item
  addLabel?: string
  // What one row is called by its buttons, such as "place 2".
  itemName: (index: number) => string
  children: (
    item: Item,
    change: (item: Item) => void,
    index: number,
  ) => ReactNode
}) {
  const full = items.length >= max

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-4 text-lg font-medium">
        {legend}
        <span className="text-sm font-normal text-host-ink-soft tabular-nums">
          {items.length} of {max}
        </span>
      </legend>

      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-2xl border border-host-line p-4"
        >
          {children(
            item,
            (next) =>
              onChange(items.map((old, at) => (at === index ? next : old))),
            index,
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON_SMALL}
              disabled={index === 0}
              onClick={() => onChange(moveItem(items, index, 'up'))}
              aria-label={`Move ${itemName(index)} up`}
            >
              Move up
            </button>
            <button
              type="button"
              className={BUTTON_SMALL}
              disabled={index === items.length - 1}
              onClick={() => onChange(moveItem(items, index, 'down'))}
              aria-label={`Move ${itemName(index)} down`}
            >
              Move down
            </button>
            <button
              type="button"
              className={BUTTON_SMALL}
              onClick={() => onChange(items.filter((_, at) => at !== index))}
              aria-label={`Remove ${itemName(index)}`}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        {newItem && (
          <button
            type="button"
            className={BUTTON_SMALL}
            disabled={full}
            onClick={() => onChange([...items, newItem()])}
          >
            {addLabel}
          </button>
        )}
        {full && (
          <p className="text-sm text-host-ink-soft">
            That is the most this section can hold.
          </p>
        )}
      </div>
    </fieldset>
  )
}
