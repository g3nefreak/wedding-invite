import { expect, it } from 'vitest'
import {
  addCustomBlock,
  canAddCustom,
  fillPeopleFromRoles,
  isPhotoUsed,
  moveBlock,
  moveItem,
  previewBlocks,
  removeBlock,
  splitNames,
} from '#/features/sections'
import type { GuestView } from '#/features/guests'
import type { RoleView } from '#/features/roles'
import { closing, custom, hero, message, rsvp } from '../server/section-samples'

const msg = message('From us', 'Hello')
const types = (blocks: { type: string }[]) => blocks.map((b) => b.type)

const role = (id: string, title: string): RoleView => ({
  id,
  title,
  askText: '',
  note: '',
  attire: '',
})
const guest = (name: string, roleId: string | null): GuestView => ({
  id: name,
  name,
  token: 't',
  roleId,
  personalNote: '',
  reply: null,
})

it('moves a block down and back up', () => {
  const down = moveBlock([hero, msg, rsvp], 'message', 'down')
  expect(types(down)).toEqual(['hero', 'rsvp', 'message'])
  expect(types(moveBlock(down, 'message', 'up'))).toEqual([
    'hero',
    'message',
    'rsvp',
  ])
})

it('never moves a block above the hero, and never moves the hero', () => {
  const blocks = [hero, msg, rsvp]
  expect(moveBlock(blocks, 'message', 'up')).toBe(blocks)
  expect(moveBlock(blocks, 'hero', 'down')).toBe(blocks)
})

it('leaves the last block where it is when moved down', () => {
  const blocks = [hero, msg, rsvp]
  expect(moveBlock(blocks, 'rsvp', 'down')).toBe(blocks)
})

it('adds a custom block just before the rsvp', () => {
  const added = addCustomBlock([hero, rsvp, closing])
  expect(types(added)).toEqual(['hero', 'custom', 'rsvp', 'closing'])
  expect(added[1]).toMatchObject({
    enabled: true,
    content: { heading: '', text: '' },
  })
  expect(added[1].id).toMatch(/^custom-[A-Za-z0-9]+$/)
})

it('gives each new custom block its own id', () => {
  const twice = addCustomBlock(addCustomBlock([hero, rsvp]))
  expect(new Set(twice.map((b) => b.id)).size).toBe(4)
})

it('cannot add a sixth custom block', () => {
  const five = [hero, ...['a', 'b', 'c', 'd', 'e'].map(custom), rsvp]
  expect(canAddCustom(five)).toBe(false)
  expect(addCustomBlock(five)).toBe(five)
  expect(canAddCustom([hero, rsvp])).toBe(true)
})

it('removes only custom blocks', () => {
  const blocks = [hero, custom('a'), rsvp]
  expect(types(removeBlock(blocks, 'a'))).toEqual(['hero', 'rsvp'])
  expect(removeBlock(blocks, 'rsvp')).toBe(blocks)
})

it('builds groups from roles, skipping roles with no guests', () => {
  const bestMan = role('r1', 'Best Man')
  const flowerGirl = role('r2', 'Flower Girl')
  expect(
    fillPeopleFromRoles(
      [bestMan, flowerGirl],
      [guest('Zed', 'r1'), guest('Abe', 'r1'), guest('Solo', null)],
    ),
  ).toEqual([{ title: 'Best Man', names: ['Abe', 'Zed'] }])
})

it('moves an item inside a list', () => {
  expect(moveItem(['a', 'b', 'c'], 0, 'down')).toEqual(['b', 'a', 'c'])
  expect(moveItem(['a', 'b', 'c'], 0, 'up')).toEqual(['a', 'b', 'c'])
  expect(moveItem(['a', 'b', 'c'], 2, 'down')).toEqual(['a', 'b', 'c'])
})

it('splits pasted names, one per line, dropping blanks', () => {
  expect(splitNames('Ana Reyes\n\n  Bea Cruz  \r\nCarl')).toEqual([
    'Ana Reyes',
    'Bea Cruz',
    'Carl',
  ])
})

it('knows whether a photo is used by any section', () => {
  const blocks = [
    { ...hero, content: { kicker: '', photoAssetId: 'p1' } },
    rsvp,
  ]
  expect(isPhotoUsed(blocks, 'p1')).toBe(true)
  expect(isPhotoUsed(blocks, 'p2')).toBe(false)
})

it('the preview tidies blank rows the way saving does', () => {
  const people = {
    id: 'people',
    type: 'people' as const,
    enabled: true,
    content: {
      heading: 'The entourage',
      intro: '',
      groups: [{ title: 'Best Man', names: ['Abe', '', '  '] }],
    },
  }
  const [shown] = previewBlocks([people])
  expect(shown.content).toMatchObject({ groups: [{ names: ['Abe'] }] })
})

it('a half-typed map link keeps the section in the preview, without the link', () => {
  const place = {
    label: 'Ceremony',
    venue: 'Church',
    time: '',
    address: '',
    mapUrl: 'https://maps.app',
  }
  const block = {
    id: 'whenWhere',
    type: 'whenWhere' as const,
    enabled: true,
    content: { places: [place] },
  }
  const [shown] = previewBlocks([block])
  expect(shown.content).toEqual({ places: [{ ...place, mapUrl: '' }] })
})
