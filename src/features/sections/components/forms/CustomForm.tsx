import { PhotoPicker } from '../PhotoPicker'
import { AreaField, TextField } from '../fields'
import type { FormProps } from './types'

export function CustomForm({
  id,
  content,
  onChange,
  eventId,
  photos,
}: FormProps<'custom'>) {
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
        label="Text"
        value={content.text}
        maxLength={1200}
        onChange={(text) => onChange({ ...content, text })}
      />
      <PhotoPicker
        eventId={eventId}
        photos={photos}
        label="Photo"
        value={content.photoAssetId}
        onChange={(photoAssetId) => onChange({ ...content, photoAssetId })}
      />
    </>
  )
}
