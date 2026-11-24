import { expect, it } from 'vitest'
import {
  countReplies,
  filterGuests,
  NO_FILTERS,
} from '#/features/guests/guests.helpers'
import type { GuestView } from '#/features/guests'

function guest(
  name: string,
  roleId: string | null,
  answer?: 'going' | 'not_going',
): GuestView {
  return {
    id: name,
    name,
    token: 't',
    roleId,
    personalNote: '',
    reply: answer ? { answer, message: '' } : null,
  }
}

const guests = [
  guest('Ana Reyes', 'r1', 'going'),
  guest('Bea Cruz', null, 'not_going'),
  guest('Carlo Peña', 'r2'),
  guest('Dana Lim', null, 'going'),
]

it('counts each kind of reply', () => {
  expect(countReplies(guests)).toEqual({
    all: 4,
    going: 2,
    not_going: 1,
    none: 1,
  })
})

it('searches by name, ignoring case and accents', () => {
  expect(
    filterGuests(guests, { ...NO_FILTERS, search: ' ANA ' }).map((g) => g.name),
  ).toEqual(['Ana Reyes', 'Dana Lim'])
  expect(filterGuests(guests, { ...NO_FILTERS, search: 'pena' })).toHaveLength(
    1,
  )
})

it('filters by reply and by role, and combines them', () => {
  expect(
    filterGuests(guests, { ...NO_FILTERS, reply: 'none' }).map((g) => g.name),
  ).toEqual(['Carlo Peña'])
  expect(filterGuests(guests, { ...NO_FILTERS, role: 'none' })).toHaveLength(2)
  expect(
    filterGuests(guests, { ...NO_FILTERS, role: 'r1' }).map((g) => g.name),
  ).toEqual(['Ana Reyes'])
  expect(
    filterGuests(guests, { search: 'a', reply: 'going', role: 'none' }).map(
      (g) => g.name,
    ),
  ).toEqual(['Dana Lim'])
  expect(filterGuests(guests, NO_FILTERS)).toHaveLength(4)
})
