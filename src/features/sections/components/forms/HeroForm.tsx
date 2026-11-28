import { PhotoPicker } from '../PhotoPicker'
import { TextField } from '../fields'
import type { FormProps } from './types'

export function HeroForm({
  id,
  content,
  onChange,
  eventId,
  photos,
}: FormProps<'hero'>) {
  return (
    <>
      <TextField
        id={`${id}-kicker`}
        label="Line above the title"
        hint="The title and date come from the Details tab."
        value={content.kicker}
        maxLength={120}
        placeholder="Together with their families"
        onChange={(kicker) => onChange({ ...content, kicker })}
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
