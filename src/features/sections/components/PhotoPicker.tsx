'use client'

import { useId, useRef, useState } from 'react'
import { BUTTON_SMALL, ERROR_TEXT } from '#/components/host-styles'
import { ApiError } from '#/lib/api'
import type { SectionPhoto } from '#/lib/sections'
import { useUploadSectionPhotoMutation } from '../sections.query'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_BYTES = 8 * 1024 * 1024

// Lets the host put one photo into a section: upload a new one, reuse one
// already uploaded, or take it out again. Taking it out keeps the file, which
// stays on the photo shelf until the host deletes it there.
export function PhotoPicker({
  eventId,
  photos,
  value,
  onChange,
  label,
  use = 'photo',
  addOnly = false,
}: {
  eventId: string
  photos: SectionPhoto[]
  value: string | undefined
  onChange: (assetId: string | undefined) => void
  label: string
  use?: 'photo' | 'qr'
  // For lists (the photo story): every pick adds a photo, nothing is "set".
  addOnly?: boolean
}) {
  const upload = useUploadSectionPhotoMutation(eventId)
  const input = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [problem, setProblem] = useState<string | null>(null)
  const current = photos.find((photo) => photo.id === value)

  function choose(file: File | undefined) {
    if (!file) return
    setProblem(null)
    if (file.size > MAX_BYTES) {
      setProblem('Choose a photo of 8 MB or less.')
      return
    }
    const before = new Set(photos.map((photo) => photo.id))
    upload.mutate(
      { file, use },
      {
        onSuccess: (event) => {
          // The new photo is the one that was not there before.
          const added = event.sectionPhotos.find(
            (photo) => !before.has(photo.id),
          )
          if (added) onChange(added.id)
        },
        onError: (error) =>
          setProblem(
            error instanceof ApiError
              ? error.message
              : 'Unable to upload the photo. Check your connection and try again.',
          ),
      },
    )
    // Cleared so picking the same file again still counts as a change.
    if (input.current) input.current.value = ''
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-medium">{label}</p>

      {current && !addOnly && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.url}
          alt="The photo in this section"
          width={current.width}
          height={current.height}
          className={`h-auto max-h-48 w-auto self-start rounded-xl outline-1 -outline-offset-1 outline-white/10 ${use === 'qr' ? 'bg-white p-2' : ''}`}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className={`${BUTTON_SMALL} cursor-pointer has-disabled:opacity-60`}
        >
          {upload.isPending
            ? 'Uploading…'
            : current && !addOnly
              ? 'Replace photo'
              : 'Upload a photo'}
          <input
            ref={input}
            id={inputId}
            type="file"
            accept={ACCEPT}
            disabled={upload.isPending}
            onChange={(event) => choose(event.target.files?.[0])}
            className="sr-only"
          />
        </label>
        {current && !addOnly && (
          <button
            type="button"
            className={BUTTON_SMALL}
            onClick={() => onChange(undefined)}
          >
            Take photo out
          </button>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-host-ink-soft">
            Or use one you already uploaded:
          </p>
          <ul className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <button
                  type="button"
                  onClick={() => onChange(photo.id)}
                  aria-label={`Use photo ${index + 1}`}
                  aria-pressed={!addOnly && photo.id === value}
                  className="block overflow-hidden rounded-lg border-2 border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent aria-pressed:border-host-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className="size-14 object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p role="alert" className={ERROR_TEXT}>
        {problem}
      </p>
    </div>
  )
}
