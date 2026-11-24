import { useMutation, useQueryClient } from '@tanstack/react-query'
import { INVITE_SERVICE } from './invite.service'
import type { RsvpInput } from './invite.types'

export const INVITE_QUERY_KEYS = {
  all: ['invite'] as const,
  detail: (token: string) => ['invite', token] as const,
}

export function useSaveRsvpMutation(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RsvpInput) => INVITE_SERVICE.SAVE_RSVP(token, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: INVITE_QUERY_KEYS.detail(token),
      }),
  })
}
