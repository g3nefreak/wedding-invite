import { EVENT_TYPES } from '#/server/config/event-types'
import type { EventTypeKey } from '#/server/config/event-types'
import { readWeddingDetails } from '#/server/validation/details.schema'
import { readSections } from '#/server/validation/sections.schema'
import type {
  Block,
  BlockContent,
  BlockType,
} from '#/server/validation/sections.schema'

// These helpers live in lib because both the server (the guest page) and the
// browser (the host's live preview) must turn saved blocks into exactly the
// same invitation.

export type Photo = { url: string; width: number; height: number }
export type SectionPhoto = Photo & { id: string }

// The block types whose content points at photos.
type WithPhotos = 'hero' | 'story' | 'gifts' | 'custom'

type ViewContent = {
  hero: { kicker: string; photo: Photo | null }
  story: {
    heading: string
    intro: string
    photos: { photo: Photo; caption: string }[]
  }
  gifts: Omit<BlockContent['gifts'], 'payments'> & {
    payments: {
      label: string
      accountName: string
      accountNumber: string
      qr: Photo | null
    }[]
  }
  custom: { heading: string; text: string; photo: Photo | null }
} & { [T in Exclude<BlockType, WithPhotos>]: BlockContent[T] }

// One section as the page draws it: a switched-on block with every photo id
// swapped for the photo itself. Block ids stay behind: a guest's page carries
// no ids at all.
export type SectionView = {
  [T in BlockType]: { type: T; content: ViewContent[T] }
}[BlockType]

// The blocks an invitation shows. An event saved before sections existed has
// none, so it starts from its type's defaults with its old details carried
// over: nothing the host already wrote is lost.
export function sectionsForEvent(
  type: string,
  saved: unknown,
  details: unknown,
): Block[] {
  const blocks = readSections(saved)
  if (blocks.length > 0) return blocks

  const eventType = Object.hasOwn(EVENT_TYPES, type)
    ? EVENT_TYPES[type as EventTypeKey]
    : EVENT_TYPES.wedding
  const { headline, ceremony, reception } = readWeddingDetails(details)
  const oldPlaces: Record<string, typeof ceremony> = {
    Ceremony: ceremony,
    Reception: reception,
  }

  // Copied, so the shared defaults are never changed by one event.
  return structuredClone(eventType.defaults).map((block): Block => {
    if (block.type === 'hero' && headline) {
      return { ...block, content: { ...block.content, kicker: headline } }
    }
    if (block.type === 'whenWhere') {
      const places = block.content.places.map((place) => ({
        ...place,
        ...oldPlaces[place.label],
      }))
      return { ...block, content: { places } }
    }
    return block
  })
}

// Turns saved blocks into what the page draws. A photo that no longer exists
// simply is not shown; it never leaves a broken image behind.
export function resolveSections(
  blocks: Block[],
  photos: SectionPhoto[],
): SectionView[] {
  const find = (id: string | undefined): Photo | null => {
    const photo = photos.find((candidate) => candidate.id === id)
    return photo
      ? { url: photo.url, width: photo.width, height: photo.height }
      : null
  }

  return blocks
    .filter((block) => block.enabled)
    .map((block): SectionView => {
      switch (block.type) {
        case 'hero': {
          const { photoAssetId, ...rest } = block.content
          return {
            type: 'hero',
            content: { ...rest, photo: find(photoAssetId) },
          }
        }
        case 'custom': {
          const { photoAssetId, ...rest } = block.content
          return {
            type: 'custom',
            content: { ...rest, photo: find(photoAssetId) },
          }
        }
        case 'story':
          return {
            type: 'story',
            content: {
              ...block.content,
              photos: block.content.photos.flatMap(({ assetId, caption }) => {
                const photo = find(assetId)
                return photo ? [{ photo, caption }] : []
              }),
            },
          }
        case 'gifts':
          return {
            type: 'gifts',
            content: {
              ...block.content,
              payments: block.content.payments.map(
                ({ qrAssetId, ...payment }) => ({
                  ...payment,
                  qr: find(qrAssetId),
                }),
              ),
            },
          }
        default:
          return { type: block.type, content: block.content } as SectionView
      }
    })
}

// The time the countdown runs to: the first place's time in "when and where".
export function firstPlaceTime(blocks: Block[]): string {
  for (const block of blocks) {
    if (block.type === 'whenWhere' && block.enabled) {
      return block.content.places[0]?.time ?? ''
    }
  }
  return ''
}
