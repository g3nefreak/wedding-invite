import { beforeEach, expect, it } from 'vitest'
import { updateDesign } from '#/server/services/design.service'
import { createEvent, getEvent } from '#/server/services/event.service'
import {
  fakeEventRepository,
  fakeUserRepository,
  OWNER,
  STRANGER,
} from './fakes'

let events: ReturnType<typeof fakeEventRepository>
let eventId: string

beforeEach(async () => {
  events = fakeEventRepository()
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

it('saves an accent and a font pair', async () => {
  const event = await updateDesign(
    OWNER,
    eventId,
    { accent: '#e8c9a0', fontPairIndex: 1 },
    events,
  )
  expect(event.design).toEqual({ accent: '#e8c9a0', fontPairIndex: 1 })
  // And it is still there when the event is read again.
  expect((await getEvent(OWNER, eventId, events)).design).toEqual({
    accent: '#e8c9a0',
    fontPairIndex: 1,
  })
})

it('changes one thing without losing the others', async () => {
  await updateDesign(
    OWNER,
    eventId,
    { accent: '#e8c9a0', fontPairIndex: 1 },
    events,
  )
  const event = await updateDesign(OWNER, eventId, { fontPairIndex: 2 }, events)
  expect(event.design).toEqual({ accent: '#e8c9a0', fontPairIndex: 2 })
})

it('null puts a choice back to the theme default', async () => {
  await updateDesign(
    OWNER,
    eventId,
    { accent: '#e8c9a0', fontPairIndex: 1 },
    events,
  )
  const event = await updateDesign(OWNER, eventId, { accent: null }, events)
  expect(event.design).toEqual({ fontPairIndex: 1 })
})

it('switching theme clears the old theme’s color and font choices', async () => {
  await updateDesign(
    OWNER,
    eventId,
    { accent: '#e8c9a0', fontPairIndex: 2 },
    events,
  )
  const event = await updateDesign(
    OWNER,
    eventId,
    { themeKey: 'bohemian' },
    events,
  )
  expect(event.themeKey).toBe('bohemian')
  expect(event.design).toEqual({})
})

it('a theme switch can carry new choices in the same save', async () => {
  const event = await updateDesign(
    OWNER,
    eventId,
    { themeKey: 'art-deco', accent: '#9fc7c2', fontPairIndex: 1 },
    events,
  )
  expect(event).toMatchObject({
    themeKey: 'art-deco',
    design: { accent: '#9fc7c2', fontPairIndex: 1 },
  })
})

it('refuses an unknown theme and a font pair the theme does not have', async () => {
  await expect(
    updateDesign(OWNER, eventId, { themeKey: 'nope' }, events),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  await expect(
    updateDesign(OWNER, eventId, { fontPairIndex: 9 }, events),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})

it('a stranger cannot change the design', async () => {
  await expect(
    updateDesign(STRANGER, eventId, { accent: '#ff0000' }, events),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  expect(events.rows[0].design).toEqual({})
})
