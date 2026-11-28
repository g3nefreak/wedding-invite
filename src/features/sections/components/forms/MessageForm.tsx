import { AreaField, TextField } from '../fields'
import type { FormProps } from './types'

export function MessageForm({ id, content, onChange }: FormProps<'message'>) {
  return (
    <>
      <TextField
        id={`${id}-heading`}
        label="Heading"
        value={content.heading}
        maxLength={80}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <AreaField
        id={`${id}-text`}
        label="Message"
        value={content.text}
        maxLength={1200}
        onChange={(text) => onChange({ ...content, text })}
      />
    </>
  )
}
