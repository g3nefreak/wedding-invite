import { expect, it } from 'vitest'
import { resolveSections, sectionsForEvent } from '#/lib/sections'
import type { SectionPhoto } from '#/lib/sections'
import { EVENT_TYPES } from '#/server/config/event-types'
import type { Block } from '#/server/validation/sections.schema'
import { hero, message, rsvp } from '../server/section-samples'

const photo = (id: string): SectionPhoto => ({
  id,
  url: `https://photos.example/${id}.webp`,
  width: 800,
  height: 600,
})

it('uses saved sections when there are any', () => {
  const saved = [hero, message('Hi', 'Hello'), rsvp]
  expect(sectionsForEvent('wedding', saved, { headline: 'ignored' })).toEqual(
    saved,
  )
})

it('falls back to wedding defaults and carries the old details over', () => {
  const blocks = sectionsForEvent('wedding', [], {
    headline: 'We do',
    ceremony: { venue: 'San Agustin', time: '2:00 PM' },
    reception: { venue: 'The Garden', time: '5:00 PM' },
  })
  expect(blocks[0]).toMatchObject({
    type: 'hero',
    content: { kicker: 'We do' },
  })
  const places = blocks.flatMap((b) =>
    b.type === 'whenWhere' ? b.content.places : [],
  )
  expect(places[0]).toMatchObject({
    label: 'Ceremony',
    venue: 'San Agustin',
    time: '2:00 PM',
  })
  expect(places[1]).toMatchObject({ label: 'Reception', venue: 'The Garden' })
})

it('never changes the shared defaults', () => {
  sectionsForEvent('wedding', [], { headline: 'We do' })
  expect(EVENT_TYPES.wedding.defaults[0].content).toEqual({
    kicker: 'Together with their families',
  })
})

it('an unknown event type starts from the wedding defaults', () => {
  expect(sectionsForEvent('picnic', null, {}).map((b) => b.type)).toEqual(
    EVENT_TYPES.wedding.defaults.map((b) => b.type),
  )
})

it('leaves out switched-off blocks', () => {
  const off = { ...message('Hi', 'Hello'), enabled: false }
  expect(resolveSections([hero, off, rsvp], []).map((s) => s.type)).toEqual([
    'hero',
    'rsvp',
  ])
})

it('swaps a photo id for the photo itself', () => {
  const blocks: Block[] = [
    { ...hero, content: { kicker: '', photoAssetId: 'p1' } },
    rsvp,
  ]
  const [first] = resolveSections(blocks, [photo('p1')])
  expect(first).toEqual({
    type: 'hero',
    content: {
      kicker: '',
      photo: { url: 'https://photos.example/p1.webp', width: 800, height: 600 },
    },
  })
})

it('a hero whose photo is gone gets photo: null', () => {
  const blocks: Block[] = [
    { ...hero, content: { kicker: '', photoAssetId: 'gone' } },
    rsvp,
  ]
  const [first] = resolveSections(blocks, [])
  expect(first.type === 'hero' && first.content.photo).toBeNull()
})

it('a story photo whose file is gone is removed', () => {
  const story: Block = {
    id: 'story',
    type: 'story',
    enabled: true,
    content: {
      heading: 'Our story',
      intro: '',
      photos: [
        { assetId: 'p1', caption: 'First date' },
        { assetId: 'gone', caption: 'Lost' },
      ],
    },
  }
  const view = resolveSections([hero, story, rsvp], [photo('p1')])[1]
  expect(view.type === 'story' && view.content.photos).toEqual([
    {
      photo: { url: 'https://photos.example/p1.webp', width: 800, height: 600 },
      caption: 'First date',
    },
  ])
})

it('a payment option keeps its text when its QR photo is gone', () => {
  const gifts: Block = {
    id: 'gifts',
    type: 'gifts',
    enabled: true,
    content: {
      intro: '',
      ideas: [],
      payments: [
        {
          label: 'GCash',
          accountName: 'Mika',
          accountNumber: '0917',
          qrAssetId: 'gone',
        },
      ],
      closing: '',
    },
  }
  const view = resolveSections([hero, gifts, rsvp], [])[1]
  expect(view.type === 'gifts' && view.content.payments).toEqual([
    { label: 'GCash', accountName: 'Mika', accountNumber: '0917', qr: null },
  ])
})

it('a new birthday starts from the birthday defaults', () => {
  const blocks = sectionsForEvent('birthday', [], {})
  expect(blocks.map((b) => b.type)).toEqual([
    'hero',
    'countdown',
    'story',
    'message',
    'people',
    'whenWhere',
    'dressCode',
    'gifts',
    'reminders',
    'rsvp',
    'closing',
  ])
  expect(blocks[0]).toMatchObject({
    content: { kicker: 'Please join us to celebrate' },
  })
  expect(blocks.find((b) => b.type === 'people')).toMatchObject({
    enabled: false,
    content: {
      heading: 'Godparents',
      groups: [
        { title: 'Godfathers', names: [] },
        { title: 'Godmothers', names: [] },
      ],
    },
  })
  const places = blocks.flatMap((b) =>
    b.type === 'whenWhere' ? b.content.places : [],
  )
  expect(places.map((place) => place.label)).toEqual(['Celebration'])
})

it('every default list could be saved as it is', () => {
  for (const type of Object.values(EVENT_TYPES)) {
    // Reading keeps only blocks that fit their schema. Empty groups are
    // tidied away on reading, so compare the kinds of section.
    const kinds = type.defaults.map((block) => block.type)
    expect(
      sectionsForEvent(type.name, type.defaults, {}).map((b) => b.type),
    ).toEqual(kinds)
    expect(kinds[0]).toBe('hero')
    expect(kinds.filter((kind) => kind === 'rsvp')).toHaveLength(1)
  }
})
