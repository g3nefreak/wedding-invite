import type { GuestView } from '#/features/guests'
import type { RoleView } from '#/features/roles'
import {
  assetIdsIn,
  isAllowedMapUrl,
  LIMITS,
  readSections,
} from '#/server/validation/sections.schema'
import type { Block, BlockContent } from '#/server/validation/sections.schema'

type Direction = 'up' | 'down'

// Swaps one item of a list with its neighbor. A move that cannot happen
// (the first item up, the last one down) gives the same list back.
export function moveItem<T>(
  items: T[],
  index: number,
  direction: Direction,
): T[] {
  const target = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= items.length) return items
  const moved = [...items]
  ;[moved[index], moved[target]] = [moved[target], moved[index]]
  return moved
}

// Moves a section up or down. The opening always stays first, so nothing
// moves above it and it never moves itself.
export function moveBlock(
  blocks: Block[],
  id: string,
  direction: Direction,
): Block[] {
  const index = blocks.findIndex((block) => block.id === id)
  if (index <= 0) return blocks
  if (direction === 'up' && index === 1) return blocks
  return moveItem(blocks, index, direction)
}

export function canAddCustom(blocks: Block[]): boolean {
  const count = blocks.filter((block) => block.type === 'custom').length
  return count < LIMITS.customBlocks
}

// A short random id made only of letters and digits.
function randomId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 10)
}

// Adds an empty custom section just before the reply, where a host most often
// wants one more thing to say.
export function addCustomBlock(blocks: Block[]): Block[] {
  if (!canAddCustom(blocks)) return blocks
  const block: Block = {
    id: `custom-${randomId()}`,
    type: 'custom',
    enabled: true,
    content: { heading: '', text: '' },
  }
  const reply = blocks.findIndex((candidate) => candidate.type === 'rsvp')
  const at = reply === -1 ? blocks.length : reply
  return [...blocks.slice(0, at), block, ...blocks.slice(at)]
}

// Only custom sections can be removed; the others are switched off instead.
export function removeBlock(blocks: Block[], id: string): Block[] {
  const block = blocks.find((candidate) => candidate.id === id)
  if (block?.type !== 'custom') return blocks
  return blocks.filter((candidate) => candidate.id !== id)
}

// Turns the host's roles into name lists: one group per role that has guests,
// in the roles' own order, names A to Z. The result is plain text the host
// can then edit; the guest list itself is never shown to guests.
export function fillPeopleFromRoles(
  roles: RoleView[],
  guests: GuestView[],
): BlockContent['people']['groups'] {
  return roles.flatMap((role) => {
    const names = guests
      .filter((guest) => guest.roleId === role.id)
      .map((guest) => guest.name)
      .sort((a, b) => a.localeCompare(b))
    return names.length > 0 ? [{ title: role.title, names }] : []
  })
}

// Names pasted from somewhere else, one per line.
export function splitNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter((name) => name !== '')
}

export function isPhotoUsed(blocks: Block[], assetId: string): boolean {
  return assetIdsIn(blocks).includes(assetId)
}

// The working copy as the preview should draw it. A section that would save
// cleanly is tidied the way saving tidies it (blank rows gone, text trimmed).
// One that would not, such as a half-typed map link, is still shown as it
// is, minus the link, so it does not vanish from the preview mid-typing.
export function previewBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const [tidy] = readSections([block])
    if (tidy) return tidy
    if (block.type !== 'whenWhere') return block
    const places = block.content.places.map((place) =>
      isAllowedMapUrl(place.mapUrl) ? place : { ...place, mapUrl: '' },
    )
    return { ...block, content: { places } }
  })
}
