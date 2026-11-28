import { AreaField } from '../fields'
import type { FormProps } from './types'

export function RsvpForm({ id, content, onChange }: FormProps<'rsvp'>) {
  return (
    <AreaField
      id={`${id}-intro`}
      label="A line before the reply buttons"
      hint="The guest’s name, role and the reply buttons are added for you."
      value={content.intro}
      maxLength={1200}
      onChange={(intro) => onChange({ intro })}
    />
  )
}
