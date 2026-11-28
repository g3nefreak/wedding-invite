import { expect, it } from 'vitest'
import { createEventSchema } from '#/server/validation/event.schema'
import {
  assetIdsIn,
  isAllowedMapUrl,
  monogramFor,
  readCover,
  readSections,
  sectionsInputSchema,
} from '#/server/validation/sections.schema'
import { hero, input, people, rsvp } from './section-samples'

const story = (count: number) => ({
  id: 'story',
  type: 'story',
  enabled: true,
  content: {
    heading: '',
    intro: '',
    photos: Array.from({ length: count }, (_, i) => ({
      assetId: `a${i}`,
      caption: '',
    })),
  },
})

const dressCode = (swatches: { name: string; color: string }[]) => ({
  id: 'dressCode',
  type: 'dressCode',
  enabled: true,
  content: { text: '', swatches },
})

it('accepts a plain valid list', () => {
  expect(sectionsInputSchema.safeParse(input([hero, rsvp])).success).toBe(true)
})

it('refuses an unknown block type', () => {
  const video = { id: 'x', type: 'video', enabled: true, content: {} }
  expect(sectionsInputSchema.safeParse(input([video])).success).toBe(false)
})

it('refuses an unknown field inside a block', () => {
  const sneaky = { ...hero, content: { kicker: '', html: '<b>' } }
  expect(sectionsInputSchema.safeParse(input([sneaky])).success).toBe(false)
})

it.each([
  ['https://maps.app.goo.gl/abc', true],
  ['https://www.google.com/maps/place/x', true],
  ['https://maps.google.com/maps?q=x', true],
  ['https://goo.gl/maps/abc', true],
  ['https://waze.com/ul?ll=1,2', true],
  ['http://www.google.com/maps', false],
  ['https://google.com.evil.example/maps', false],
  ['https://www.google.com/search?q=x', false],
  ['javascript:alert(1)', false],
  ['not a link', false],
])('map link %s allowed: %s', (url, allowed) => {
  expect(isAllowedMapUrl(url)).toBe(allowed)
})

it('refuses a place whose map link is not allowed', () => {
  const place = {
    label: 'Ceremony',
    venue: 'Church',
    time: '',
    address: '',
    mapUrl: 'https://evil.example',
  }
  const block = {
    id: 'whenWhere',
    type: 'whenWhere',
    enabled: true,
    content: { places: [place] },
  }
  expect(
    sectionsInputSchema.safeParse(input([hero, block, rsvp])).success,
  ).toBe(false)
})

it('drops blank names before counting', () => {
  const parsed = sectionsInputSchema.parse(
    input([hero, people(['Ana', '  ', '']), rsvp]),
  )
  const block = parsed.sections[1]
  expect(block.type === 'people' && block.content.groups[0].names).toEqual([
    'Ana',
  ])
})

it('trims text', () => {
  const parsed = sectionsInputSchema.parse(
    input([{ ...hero, content: { kicker: '  Hello  ' } }, rsvp]),
  )
  expect(parsed.sections[0].content).toEqual({ kicker: 'Hello' })
})

it('refuses a 13th story photo', () => {
  expect(
    sectionsInputSchema.safeParse(input([hero, story(12), rsvp])).success,
  ).toBe(true)
  expect(
    sectionsInputSchema.safeParse(input([hero, story(13), rsvp])).success,
  ).toBe(false)
})

it('refuses a 7th swatch and a swatch color that is not hex', () => {
  const six = Array.from({ length: 6 }, (_, i) => ({
    name: `Shade ${i}`,
    color: '#aabbcc',
  }))
  const ok = (swatches: { name: string; color: string }[]) =>
    sectionsInputSchema.safeParse(input([hero, dressCode(swatches), rsvp]))
      .success
  expect(ok(six)).toBe(true)
  expect(ok([...six, { name: 'One more', color: '#aabbcc' }])).toBe(false)
  expect(ok([{ name: 'Red', color: 'red; background:url(x)' }])).toBe(false)
})

it('refuses text over its limit', () => {
  const long = { ...hero, content: { kicker: 'a'.repeat(121) } }
  expect(sectionsInputSchema.safeParse(input([long, rsvp])).success).toBe(false)
})

it('readSections skips a broken block and keeps the rest', () => {
  const broken = { id: 'bad', type: 'story', enabled: true, content: 7 }
  expect(readSections([hero, broken, rsvp]).map((b) => b.type)).toEqual([
    'hero',
    'rsvp',
  ])
})

it('readSections returns [] for anything that is not a list', () => {
  expect(readSections(null)).toEqual([])
  expect(readSections({ sections: [] })).toEqual([])
  expect(readSections('hero')).toEqual([])
})

it('monogramFor takes initials', () => {
  expect(monogramFor('Mika & Paolo')).toBe('M&P')
  expect(monogramFor('Mark gil & Camille')).toBe('M&C')
  expect(monogramFor('M&P')).toBe('M&P')
  expect(monogramFor('Rock & Roll & Soul')).toBe('RRS')
  expect(monogramFor('Zian Elandre')).toBe('ZE')
  expect(monogramFor('one two three four')).toBe('OTT')
  expect(monogramFor('')).toBe('')
})

it('readCover fills in defaults and keeps saved choices', () => {
  expect(readCover({}, 'Mika & Paolo')).toEqual({
    enabled: true,
    monogram: 'M&P',
    line: 'You have a letter',
  })
  expect(
    readCover({ enabled: false, monogram: 'MP', line: 'Hi' }, 'x'),
  ).toEqual({
    enabled: false,
    monogram: 'MP',
    line: 'Hi',
  })
})

it('assetIdsIn finds every photo a list of blocks uses', () => {
  const blocks = readSections([
    { ...hero, content: { kicker: '', photoAssetId: 'h1' } },
    story(2),
    {
      id: 'gifts',
      type: 'gifts',
      enabled: true,
      content: {
        intro: '',
        ideas: [],
        payments: [
          {
            label: 'GCash',
            accountName: '',
            accountNumber: '',
            qrAssetId: 'q1',
          },
        ],
        closing: '',
      },
    },
    {
      id: 'c1',
      type: 'custom',
      enabled: true,
      content: { heading: 'x', text: '', photoAssetId: 'c1p' },
    },
  ])
  expect(assetIdsIn(blocks).sort()).toEqual(['a0', 'a1', 'c1p', 'h1', 'q1'])
})

it('a countdown saved before it had messages still reads, with blank messages', () => {
  const old = { id: 'countdown', type: 'countdown', enabled: true, content: {} }
  expect(readSections([old])[0].content).toEqual({
    dayMessage: '',
    afterMessage: '',
  })
})

it('keeps the countdown messages a host writes', () => {
  const block = {
    id: 'countdown',
    type: 'countdown',
    enabled: true,
    content: {
      dayMessage: '  Today we say I do  ',
      afterMessage: 'We are married!',
    },
  }
  const parsed = sectionsInputSchema.parse(input([hero, block, rsvp]))
  expect(parsed.sections[1].content).toEqual({
    dayMessage: 'Today we say I do',
    afterMessage: 'We are married!',
  })
})

it('an event is a wedding or a birthday, nothing else', () => {
  const event = {
    title: 'Zian',
    eventDate: '2027-06-12',
    replyBy: '2027-03-31',
    themeKey: 'sky-blue',
  }
  expect(
    createEventSchema.safeParse({ ...event, type: 'birthday' }).success,
  ).toBe(true)
  expect(
    createEventSchema.safeParse({ ...event, type: 'wedding' }).success,
  ).toBe(true)
  expect(
    createEventSchema.safeParse({ ...event, type: 'funeral' }).success,
  ).toBe(false)
})
