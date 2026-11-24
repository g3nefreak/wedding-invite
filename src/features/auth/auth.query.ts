import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AUTH_SERVICE } from './auth.service'

export function useLoginMutation() {
  return useMutation({ mutationFn: AUTH_SERVICE.LOGIN })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AUTH_SERVICE.LOGOUT,
    // Drop everything cached for the host who just left.
    onSuccess: () => queryClient.clear(),
  })
}
