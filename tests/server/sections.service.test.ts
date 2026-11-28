import { beforeEach, expect, it } from 'vitest'
import { createEvent, getEvent } from '#/server/services/event.service'
import { updateSections } from '#/server/services/sections.service'
import type { Block } from '#/server/validation/sections.schema'
import {
  fakeAssetRepository,
  fakeEventRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'
import {
  countdown,
  cover,
  custom,
  hero,
  message,
  rsvp,
} from './section-samples'

let events: ReturnType<typeof fakeEventRepository>
let assets: ReturnType<typeof fakeAssetRepository>
let deps: { events: typeof events; assets: typeof assets }
let eventId: string

beforeEach(async () => {
  events = fakeEventRepository()
  assets = fakeAssetRepository()
  deps = { events, assets }
  const created = await createEvent(
    { id: OWNER, email: 'mika@example.com' },
    {
      type: 'wedding',
      title: 'M & P',
      eventDate: '2027-06-12',
      replyBy: '2027-03-31',
      themeKey: 'black-and-white',
    },
    { events, users: fakeUserRepository() },
  )
  eventId = created.id
})

const photo = (id: string, forEvent: string, kind: 'section' | 'background') =>
  assets.rows.push({
    id,
    eventId: forEvent,
    kind,
    path: `${forEvent}/${id}.webp`,
    width: 800,
    height: 600,
    bytes: 1000,
  })

const withHeroPhoto = (photoAssetId: string): Block[] => [
  { ...hero, content: { kicker: '', photoAssetId } },
  rsvp,
]

it('saves sections and the cover and reads them back', async () => {
  const sections = [hero, message('From us', 'Hello'), rsvp]
  const saved = await updateSections(OWNER, eventId, { sections, cover }, deps)
  expect(saved.sections).toEqual(sections)
  expect(saved.cover).toEqual(cover)
  expect((await getEvent(OWNER, eventId, events)).sections).toEqual(sections)
})

it('gives a stranger NOT_FOUND', async () => {
  await expect(
    updateSections(STRANGER, eventId, { sections: [hero, rsvp], cover }, deps),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
})

it.each<[string, Block[]]>([
  ['no hero', [rsvp]],
  ['hero not first', [rsvp, hero]],
  ['hero switched off', [{ ...hero, enabled: false }, rsvp]],
  ['no rsvp', [hero]],
  ['rsvp switched off', [hero, { ...rsvp, enabled: false }]],
  ['two countdowns', [hero, countdown, { ...countdown, id: 'c2' }, rsvp]],
  [
    'six custom sections',
    [hero, ...['a', 'b', 'c', 'd', 'e', 'f'].map(custom), rsvp],
  ],
  ['a repeated id', [hero, { ...rsvp, id: hero.id }]],
])('refuses %s', async (_name, sections) => {
  await expect(
    updateSections(OWNER, eventId, { sections, cover }, deps),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('allows five custom sections', async () => {
  const sections = [hero, ...['a', 'b', 'c', 'd', 'e'].map(custom), rsvp]
  const saved = await updateSections(OWNER, eventId, { sections, cover }, deps)
  expect(saved.sections).toHaveLength(7)
})

it('accepts a section photo of this event', async () => {
  photo('p1', eventId, 'section')
  const saved = await updateSections(
    OWNER,
    eventId,
    { sections: withHeroPhoto('p1'), cover },
    deps,
  )
  expect(saved.sections[0].content).toMatchObject({ photoAssetId: 'p1' })
})

it('refuses a photo that belongs to another event', async () => {
  photo('p1', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000009', 'section')
  await expect(
    updateSections(
      OWNER,
      eventId,
      { sections: withHeroPhoto('p1'), cover },
      deps,
    ),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('refuses a photo that does not exist', async () => {
  await expect(
    updateSections(
      OWNER,
      eventId,
      { sections: withHeroPhoto('nope'), cover },
      deps,
    ),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('refuses a background photo used as a section photo', async () => {
  photo('bg', eventId, 'background')
  await expect(
    updateSections(
      OWNER,
      eventId,
      { sections: withHeroPhoto('bg'), cover },
      deps,
    ),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('stores text with angle brackets unchanged, as text', async () => {
  const saved = await updateSections(
    OWNER,
    eventId,
    { sections: [hero, message('Hi', '<script>x</script>'), rsvp], cover },
    deps,
  )
  const block = saved.sections.find((b) => b.type === 'message')
  expect(block?.content).toMatchObject({ text: '<script>x</script>' })
})
