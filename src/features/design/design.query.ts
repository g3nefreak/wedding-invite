import { useMutation, useQueryClient } from '@tanstack/react-query'
// Imported from the files, not the events barrel: the events page itself
// imports this feature, and going through the barrel would form a loop.
import { EVENTS_QUERY_KEYS } from '#/features/events/events.query'
import type { DesignInput } from '#/server/validation/design.schema'
import { shrinkPhoto } from './design.helpers'
import { DESIGN_SERVICE } from './design.service'

export function useUpdateDesignMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DesignInput) => DESIGN_SERVICE.UPDATE(eventId, input),
    // The design is part of the event, so the event's data is refreshed.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
  })
}

// Uploading or removing the photo takes effect straight away, so both refresh
// the event's data like a design save does.
export function useUploadPhotoMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) =>
      DESIGN_SERVICE.UPLOAD_PHOTO(eventId, await shrinkPhoto(file)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
  })
}

export function useRemovePhotoMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => DESIGN_SERVICE.REMOVE_PHOTO(eventId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
  })
}
