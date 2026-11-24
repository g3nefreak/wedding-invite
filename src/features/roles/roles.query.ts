import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ROLES_SERVICE } from './roles.service'
import type { RoleInput } from './roles.types'

export const ROLES_QUERY_KEYS = {
  list: (eventId: string) => ['roles', eventId] as const,
}

export function useRolesQuery(eventId: string) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.list(eventId),
    queryFn: () => ROLES_SERVICE.LIST(eventId),
  })
}

// Every change to a role refreshes that event's list of roles.
function useRoleMutation<Input>(
  eventId: string,
  mutationFn: (input: Input) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ROLES_QUERY_KEYS.list(eventId),
      }),
  })
}

export function useCreateRoleMutation(eventId: string) {
  return useRoleMutation(eventId, (input: RoleInput) =>
    ROLES_SERVICE.CREATE(eventId, input),
  )
}

export function useUpdateRoleMutation(eventId: string, roleId: string) {
  return useRoleMutation(eventId, (input: RoleInput) =>
    ROLES_SERVICE.UPDATE(eventId, roleId, input),
  )
}

export function useDeleteRoleMutation(eventId: string, roleId: string) {
  return useRoleMutation(eventId, () => ROLES_SERVICE.DELETE(eventId, roleId))
}
