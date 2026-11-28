import { LIMITS } from '#/server/validation/sections.schema'
import { PhotoPicker } from '../PhotoPicker'
import { AreaField, ListEditor, TextField } from '../fields'
import type { FormProps } from './types'

export function StoryForm({
  id,
  content,
  onChange,
  eventId,
  photos,
}: FormProps<'story'>) {
  const full = content.photos.length >= LIMITS.storyPhotos
  const urlOf = (assetId: string) =>
    photos.find((photo) => photo.id === assetId)?.url

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
        id={`${id}-intro`}
        label="Introduction"
        value={content.intro}
        maxLength={1200}
        onChange={(intro) => onChange({ ...content, intro })}
      />

      <ListEditor
        legend="Photos"
        items={content.photos}
        max={LIMITS.storyPhotos}
        itemName={(index) => `photo ${index + 1}`}
        onChange={(next) => onChange({ ...content, photos: next })}
      >
        {(photo, change, index) => (
          <div className="flex flex-wrap items-start gap-4">
            {urlOf(photo.assetId) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlOf(photo.assetId)}
                alt={`Photo ${index + 1}`}
                className="size-20 rounded-lg object-cover outline-1 -outline-offset-1 outline-white/10"
              />
            )}
            <div className="min-w-48 flex-1">
              <TextField
                id={`${id}-caption-${index}`}
                label="Caption"
                value={photo.caption}
                maxLength={120}
                onChange={(caption) => change({ ...photo, caption })}
              />
            </div>
          </div>
        )}
      </ListEditor>

      {!full && (
        <PhotoPicker
          eventId={eventId}
          photos={photos}
          label="Add a photo to the story"
          value={undefined}
          addOnly
          onChange={(assetId) =>
            assetId &&
            onChange({
              ...content,
              photos: [...content.photos, { assetId, caption: '' }],
            })
          }
        />
      )}
    </>
  )
}
