import { COUNTDOWN_MESSAGES } from '#/features/invite'
import { TextField } from '../fields'
import type { FormProps } from './types'

export function CountdownForm({
  id,
  content,
  onChange,
}: FormProps<'countdown'>) {
  return (
    <>
      <p className="leading-normal text-host-ink-soft">
        The numbers count down on their own. When they reach zero, the section
        shows a message instead. Leave a box empty to use the standard words.
      </p>
      <TextField
        id={`${id}-day`}
        label="On the day"
        hint="Shown from the start time until the end of that day."
        value={content.dayMessage}
        maxLength={120}
        placeholder={COUNTDOWN_MESSAGES.day}
        onChange={(dayMessage) => onChange({ ...content, dayMessage })}
      />
      <TextField
        id={`${id}-after`}
        label="After the day"
        hint="Shown to anyone who opens the invitation later."
        value={content.afterMessage}
        maxLength={120}
        placeholder={COUNTDOWN_MESSAGES.after}
        onChange={(afterMessage) => onChange({ ...content, afterMessage })}
      />
    </>
  )
}
