import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GUESTS_SERVICE } from './guests.service'
import type { GuestInput } from './guests.types'

export const GUESTS_QUERY_KEYS = {
  list: (eventId: string) => ['guests', eventId] as const,
}

export function useGuestsQuery(eventId: string) {
  return useQuery({
    queryKey: GUESTS_QUERY_KEYS.list(eventId),
    queryFn: () => GUESTS_SERVICE.LIST(eventId),
  })
}

// Every change to a guest refreshes that event's guest list.
function useGuestMutation<Input>(
  eventId: string,
  mutationFn: (input: Input) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: GUESTS_QUERY_KEYS.list(eventId),
      }),
  })
}

export function useCreateGuestMutation(eventId: string) {
  return useGuestMutation(eventId, (input: GuestInput) =>
    GUESTS_SERVICE.CREATE(eventId, input),
  )
}

export function useCreateGuestsMutation(eventId: string) {
  return useGuestMutation(eventId, (names: string[]) =>
    GUESTS_SERVICE.CREATE_MANY(eventId, names),
  )
}

export function useUpdateGuestMutation(eventId: string, guestId: string) {
  return useGuestMutation(eventId, (input: GuestInput) =>
    GUESTS_SERVICE.UPDATE(eventId, guestId, input),
  )
}

export function useDeleteGuestMutation(eventId: string, guestId: string) {
  return useGuestMutation(eventId, () =>
    GUESTS_SERVICE.DELETE(eventId, guestId),
  )
}
