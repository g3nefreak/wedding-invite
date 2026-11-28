import { useMutation, useQueryClient } from '@tanstack/react-query'
// Imported from the files, not the barrels: the events page imports this
// feature, and going through the barrels would form a loop.
import { shrinkPhoto } from '#/features/design/design.helpers'
import { EVENTS_QUERY_KEYS } from '#/features/events/events.query'
import type { SectionsInput } from '#/server/validation/sections.schema'
import { SECTIONS_SERVICE } from './sections.service'

// Sections and photos are part of the event, so each change refreshes it.
function useRefreshEvent() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all })
}

export function useSaveSectionsMutation(eventId: string) {
  const refresh = useRefreshEvent()
  return useMutation({
    mutationFn: (input: SectionsInput) => SECTIONS_SERVICE.SAVE(eventId, input),
    onSuccess: refresh,
  })
}

export function useUploadSectionPhotoMutation(eventId: string) {
  const refresh = useRefreshEvent()
  return useMutation({
    // Big photos are shrunk in the browser first: the host refuses request
    // bodies over about 4.5 MB.
    mutationFn: async ({ file, use }: { file: File; use: 'photo' | 'qr' }) =>
      SECTIONS_SERVICE.UPLOAD_PHOTO(eventId, await shrinkPhoto(file), use),
    onSuccess: refresh,
  })
}

export function useDeleteSectionPhotoMutation(eventId: string) {
  const refresh = useRefreshEvent()
  return useMutation({
    mutationFn: (assetId: string) =>
      SECTIONS_SERVICE.DELETE_PHOTO(eventId, assetId),
    onSuccess: refresh,
  })
}
