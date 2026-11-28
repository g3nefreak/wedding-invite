import { AreaField, TextField } from '../fields'
import type { FormProps } from './types'

export function ClosingForm({ id, content, onChange }: FormProps<'closing'>) {
  return (
    <>
      <AreaField
        id={`${id}-text`}
        label="Closing message"
        value={content.text}
        maxLength={1200}
        onChange={(text) => onChange({ ...content, text })}
      />
      <TextField
        id={`${id}-signature`}
        label="Signature"
        value={content.signature}
        maxLength={120}
        placeholder="Mika & Paolo"
        onChange={(signature) => onChange({ ...content, signature })}
      />
    </>
  )
}
