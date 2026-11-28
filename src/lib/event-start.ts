// Works out the moment an event starts, for the countdown.

const TWELVE_HOUR = /^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?$/i
const TWENTY_FOUR_HOUR = /^(\d{1,2}):(\d{2})$/

// Reads a time a host typed, such as "2:00 PM", "2pm" or "14:00".
// Anything else ("after lunch") gives null.
export function parseClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const trimmed = text.trim()

  const twelve = TWELVE_HOUR.exec(trimmed)
  if (twelve) {
    const hour = Number(twelve[1])
    const minute = Number(twelve[2] ?? 0)
    if (hour < 1 || hour > 12 || minute > 59) return null
    const afternoon = twelve[3].toLowerCase() === 'p'
    // 12 AM is midnight and 12 PM is noon.
    return { hour: (hour % 12) + (afternoon ? 12 : 0), minute }
  }

  const twentyFour = TWENTY_FOUR_HOUR.exec(trimmed)
  if (twentyFour) {
    const hour = Number(twentyFour[1])
    const minute = Number(twentyFour[2])
    return hour > 23 || minute > 59 ? null : { hour, minute }
  }

  return null
}

// How far ahead of UTC a timezone is at a given moment, in milliseconds.
// An unknown timezone counts as UTC, so a bad value can never break a page.
function offsetAt(instant: number, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).formatToParts(new Date(instant))
    const part = (type: string) =>
      Number(parts.find((candidate) => candidate.type === type)?.value)
    const shown = Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
      part('second'),
    )
    return shown - instant
  } catch {
    return 0
  }
}

// The instant an event starts: its day ("2027-06-12") and the time the host
// typed, read as clock time where the event is held. A time that cannot be
// read counts as the start of that day.
export function eventStart(
  day: string,
  timeText: string,
  timezone: string,
): string {
  const { hour, minute } = parseClockTime(timeText) ?? { hour: 0, minute: 0 }
  const [year, month, date] = day.split('-').map(Number)
  const asIfUtc = Date.UTC(year, month - 1, date, hour, minute)
  return new Date(asIfUtc - offsetAt(asIfUtc, timezone)).toISOString()
}

// The instant the event's day is over: the next midnight where it is held.
// After this the invitation stops saying "today" and looks back instead.
export function eventDayEnd(day: string, timezone: string): string {
  const [year, month, date] = day.split('-').map(Number)
  // Date.UTC rolls a day past the end of a month into the next one.
  const nextDay = new Date(Date.UTC(year, month - 1, date + 1))
    .toISOString()
    .slice(0, 10)
  return eventStart(nextDay, '', timezone)
}
