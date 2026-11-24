import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EVENTS_SERVICE } from './events.service'
import type { CreateEventInput, UpdateEventInput } from './events.types'

export const EVENTS_QUERY_KEYS = {
  all: ['events'] as const,
  list: () => ['events', 'list'] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
  themes: (eventType: string) => ['themes', eventType] as const,
}

export function useEventsQuery() {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.list(),
    queryFn: EVENTS_SERVICE.LIST,
  })
}

export function useEventQuery(id: string) {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.detail(id),
    queryFn: () => EVENTS_SERVICE.GET(id),
    // "Not found" will not fix itself, so do not keep asking.
    retry: false,
  })
}

export function useThemesQuery(eventType: string) {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.themes(eventType),
    queryFn: () => EVENTS_SERVICE.THEMES(eventType),
    // Themes are files in the app; they do not change while it is open.
    staleTime: Infinity,
  })
}

// Every change to an event refreshes both the list and that event's page.
function useEventMutation<Input>(
  mutationFn: (input: Input) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
  })
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEventInput) => EVENTS_SERVICE.CREATE(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
  })
}

export function useUpdateEventMutation(id: string) {
  return useEventMutation((input: UpdateEventInput) =>
    EVENTS_SERVICE.UPDATE(id, input),
  )
}

export function usePublishEventMutation(id: string) {
  return useEventMutation(() => EVENTS_SERVICE.PUBLISH(id))
}

export function useDeleteEventMutation(id: string) {
  return useEventMutation(() => EVENTS_SERVICE.DELETE(id))
}
