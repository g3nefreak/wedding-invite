'use client'

import { useState } from 'react'
import { BUTTON_SMALL, CARD, ERROR_TEXT } from '#/components/host-styles'
import { ApiError } from '#/lib/api'
import type { SectionPhoto } from '#/lib/sections'
import { useDeleteSectionPhotoMutation } from '../sections.query'

const MAX_PHOTOS = 30

// Every photo uploaded for this invitation, used or not. A photo that no
// section uses still counts toward the limit, so this is where the host
// clears them out.
export function PhotoShelf({
  eventId,
  photos,
  isUsed,
  onDeleted,
}: {
  eventId: string
  photos: SectionPhoto[]
  isUsed: (assetId: string) => boolean
  onDeleted: (assetId: string) => void
}) {
  const remove = useDeleteSectionPhotoMutation(eventId)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  function deletePhoto(id: string) {
    setProblem(null)
    remove.mutate(id, {
      onSuccess: () => {
        setConfirming(null)
        onDeleted(id)
      },
      onError: (error) =>
        setProblem(
          error instanceof ApiError
            ? error.message
            : 'Unable to delete the photo. Check your connection and try again.',
        ),
    })
  }

  return (
    <section className={`${CARD} flex flex-col gap-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-host-display text-2xl font-medium">Your photos</h3>
        <p className="text-host-ink-soft tabular-nums">
          {photos.length} of {MAX_PHOTOS}
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="leading-normal text-host-ink-soft">
          No photos yet. Upload one from any section that takes a photo.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover outline-1 -outline-offset-1 outline-white/10"
              />
              <p className="text-sm text-host-ink-soft">
                {isUsed(photo.id) ? 'Used' : 'Not used'}
              </p>
              {confirming === photo.id ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm leading-normal">
                    Delete this photo for good?
                    {isUsed(photo.id) &&
                      ' It will leave the sections using it.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={BUTTON_SMALL}
                      disabled={remove.isPending}
                      onClick={() => deletePhoto(photo.id)}
                    >
                      {remove.isPending ? 'Deleting…' : 'Delete photo'}
                    </button>
                    <button
                      type="button"
                      className={BUTTON_SMALL}
                      onClick={() => setConfirming(null)}
                    >
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${BUTTON_SMALL} self-start`}
                  onClick={() => setConfirming(photo.id)}
                  aria-label={`Delete photo ${index + 1}`}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p role="alert" className={ERROR_TEXT}>
        {problem}
      </p>
    </section>
  )
}
