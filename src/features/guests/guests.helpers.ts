import type { GuestView } from './guests.types'

export type ReplyFilter = 'all' | 'going' | 'not_going' | 'none'

// 'all' = every role, 'none' = guests without a role, otherwise a role id.
export type RoleFilter = string

export type GuestFilters = {
  search: string
  reply: ReplyFilter
  role: RoleFilter
}

export const NO_FILTERS: GuestFilters = {
  search: '',
  reply: 'all',
  role: 'all',
}

function replyOf(guest: GuestView): Exclude<ReplyFilter, 'all'> {
  return guest.reply ? guest.reply.answer : 'none'
}

// How many guests gave each answer, for the filter buttons.
export function countReplies(guests: GuestView[]): Record<ReplyFilter, number> {
  const counts = { all: guests.length, going: 0, not_going: 0, none: 0 }
  for (const guest of guests) counts[replyOf(guest)] += 1
  return counts
}

export function filterGuests(
  guests: GuestView[],
  filters: GuestFilters,
): GuestView[] {
  // Ignore case and accents, so "pena" finds "Peña".
  const fold = (text: string) =>
    text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const search = fold(filters.search.trim())

  return guests.filter((guest) => {
    if (search && !fold(guest.name).includes(search)) return false
    if (filters.reply !== 'all' && replyOf(guest) !== filters.reply)
      return false
    if (filters.role === 'none') return guest.roleId === null
    if (filters.role !== 'all') return guest.roleId === filters.role
    return true
  })
}
