import { expect, it } from 'vitest'
import { eventDayEnd, eventStart, parseClockTime } from '#/lib/event-start'

it.each([
  ['2:00 PM', 14, 0],
  ['2:00PM', 14, 0],
  ['2pm', 14, 0],
  ['2 PM', 14, 0],
  ['12 AM', 0, 0],
  ['12:30 pm', 12, 30],
  ['14:05', 14, 5],
  ['  9:15 a.m. ', 9, 15],
])('reads %s', (text, hour, minute) => {
  expect(parseClockTime(text)).toEqual({ hour, minute })
})

it.each(['after lunch', '', '25:00', '2:75 PM', '13 PM', '0 AM'])(
  'gives null for %j',
  (text) => {
    expect(parseClockTime(text)).toBeNull()
  },
)

it('2 PM in Manila is 06:00 UTC', () => {
  expect(eventStart('2027-06-12', '2:00 PM', 'Asia/Manila')).toBe(
    '2027-06-12T06:00:00.000Z',
  )
})

it('an unreadable time counts to the start of the day', () => {
  expect(eventStart('2027-06-12', 'after lunch', 'Asia/Manila')).toBe(
    '2027-06-11T16:00:00.000Z',
  )
})

it('works west of UTC too', () => {
  expect(eventStart('2027-01-15', '6 PM', 'America/New_York')).toBe(
    '2027-01-15T23:00:00.000Z',
  )
})

it('an unknown timezone is read as UTC instead of failing', () => {
  expect(eventStart('2027-06-12', '2:00 PM', 'Not/AZone')).toBe(
    '2027-06-12T14:00:00.000Z',
  )
})

it('the event day ends at the next midnight where the event is held', () => {
  expect(eventDayEnd('2027-06-12', 'Asia/Manila')).toBe(
    '2027-06-12T16:00:00.000Z',
  )
  // Month and year ends roll over.
  expect(eventDayEnd('2027-12-31', 'Asia/Manila')).toBe(
    '2027-12-31T16:00:00.000Z',
  )
  expect(eventDayEnd('2027-02-28', 'UTC')).toBe('2027-03-01T00:00:00.000Z')
})
