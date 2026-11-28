import { z } from 'zod'

// An invitation is an ordered list of section blocks. Each block type has one
// strict schema here: there is no field for raw HTML or CSS, and anything
// unknown is refused, so a host can only ever store plain text and choices.

export const BLOCK_TYPES = [
  'hero',
  'countdown',
  'story',
  'message',
  'people',
  'gifts',
  'dressCode',
  'reminders',
  'whenWhere',
  'rsvp',
  'closing',
  'custom',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

// How many of each thing one invitation may hold.
export const LIMITS = {
  blocks: 30,
  storyPhotos: 12,
  groups: 8,
  namesPerGroup: 40,
  giftIdeas: 8,
  payments: 3,
  swatches: 6,
  reminders: 8,
  places: 4,
  customBlocks: 5,
} as const

const heading = z.string().trim().max(80)
const line = z.string().trim().max(120)
const paragraph = z.string().trim().max(1200)
const assetId = z.string().min(1).max(60)

// Swatch colors end up in the page's CSS, so only a plain hex color is
// allowed, the same rule as the accent color.
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const MAP_HOSTS_ANY_PATH = ['maps.app.goo.gl', 'waze.com', 'www.waze.com']
const MAP_HOSTS_MAPS_PATH = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'goo.gl',
]

// Map links are the only links an invitation may carry, so they are limited
// to the two map services guests actually use.
export function isAllowedMapUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (MAP_HOSTS_ANY_PATH.includes(parsed.hostname)) return true
  return (
    MAP_HOSTS_MAPS_PATH.includes(parsed.hostname) &&
    parsed.pathname.startsWith('/maps')
  )
}

const mapUrl = z
  .string()
  .trim()
  .max(500)
  .refine((url) => url === '' || isAllowedMapUrl(url), {
    message: 'Use a Google Maps or Waze link',
  })

// A list where rows left blank are thrown away before the limit is checked,
// so a half-filled form saves cleanly.
function list<Item extends z.ZodType>(
  item: Item,
  isBlank: (value: z.output<Item>) => boolean,
  max: number,
) {
  return (
    z
      .array(item)
      // A hard stop well above any real limit, before any work is done.
      .max(200)
      .transform((rows) => rows.filter((row) => !isBlank(row)))
      .refine((rows) => rows.length <= max, {
        message: `No more than ${max} allowed`,
      })
  )
}

const contentSchemas = {
  hero: z.strictObject({ kicker: line, photoAssetId: assetId.optional() }),
  // What the countdown says once it reaches zero. A blank message uses the
  // standard wording. Both default to blank, so a countdown saved before
  // these existed still reads.
  countdown: z.strictObject({
    dayMessage: line.default(''),
    afterMessage: line.default(''),
  }),
  story: z.strictObject({
    heading,
    intro: paragraph,
    photos: list(
      z.strictObject({ assetId, caption: line }),
      () => false,
      LIMITS.storyPhotos,
    ),
  }),
  message: z.strictObject({ heading, text: paragraph }),
  people: z.strictObject({
    heading,
    intro: paragraph,
    groups: list(
      z.strictObject({
        title: heading,
        names: list(line, (name) => name === '', LIMITS.namesPerGroup),
      }),
      (group) => group.title === '' && group.names.length === 0,
      LIMITS.groups,
    ),
  }),
  gifts: z.strictObject({
    intro: paragraph,
    ideas: list(
      z.strictObject({ title: heading, note: line }),
      (idea) => idea.title === '',
      LIMITS.giftIdeas,
    ),
    payments: list(
      z.strictObject({
        label: heading,
        accountName: line,
        accountNumber: z.string().trim().max(40),
        qrAssetId: assetId.optional(),
      }),
      (payment) =>
        payment.label === '' &&
        payment.accountNumber === '' &&
        !payment.qrAssetId,
      LIMITS.payments,
    ),
    closing: paragraph,
  }),
  dressCode: z.strictObject({
    text: paragraph,
    swatches: list(
      z.strictObject({ name: heading, color: hexColor }),
      (swatch) => swatch.name === '',
      LIMITS.swatches,
    ),
  }),
  reminders: z.strictObject({
    heading,
    items: list(line, (item) => item === '', LIMITS.reminders),
  }),
  whenWhere: z.strictObject({
    places: list(
      z.strictObject({
        label: heading,
        venue: line,
        time: z.string().trim().max(40),
        address: line,
        mapUrl,
      }),
      (place) => place.label === '' && place.venue === '',
      LIMITS.places,
    ),
  }),
  rsvp: z.strictObject({ intro: paragraph }),
  closing: z.strictObject({ text: paragraph, signature: line }),
  custom: z.strictObject({
    heading,
    text: paragraph,
    photoAssetId: assetId.optional(),
  }),
}

const blockId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/)

function blockOf<T extends BlockType>(type: T) {
  return z.strictObject({
    id: blockId,
    type: z.literal(type),
    enabled: z.boolean(),
    content: contentSchemas[type],
  })
}

const blockSchema = z.discriminatedUnion('type', [
  blockOf('hero'),
  blockOf('countdown'),
  blockOf('story'),
  blockOf('message'),
  blockOf('people'),
  blockOf('gifts'),
  blockOf('dressCode'),
  blockOf('reminders'),
  blockOf('whenWhere'),
  blockOf('rsvp'),
  blockOf('closing'),
  blockOf('custom'),
])

export type Block = z.infer<typeof blockSchema>

export type BlockContent = {
  [T in BlockType]: Extract<Block, { type: T }>['content']
}

const coverSchema = z.strictObject({
  enabled: z.boolean(),
  monogram: z.string().trim().max(3),
  line,
})

export type Cover = z.infer<typeof coverSchema>

// What a host sends when saving the invitation: the whole list, in order.
export const sectionsInputSchema = z.strictObject({
  sections: z.array(blockSchema).max(LIMITS.blocks),
  cover: coverSchema,
})

export type SectionsInput = z.infer<typeof sectionsInputSchema>

// Reads the blocks saved on an event. A block that no longer fits its schema
// is skipped, so one bad block cannot break the whole invitation.
export function readSections(saved: unknown): Block[] {
  if (!Array.isArray(saved)) return []
  return saved.flatMap((block) => {
    const result = blockSchema.safeParse(block)
    return result.success ? [result.data] : []
  })
}

// The first letter or digit of a word, in capitals.
function initial(word: string): string {
  const first = Array.from(word.trim())[0] ?? ''
  return /[\p{L}\p{N}]/u.test(first) ? first.toUpperCase() : ''
}

// Up to three characters for the envelope's seal. Two names joined by "&"
// give one initial each ("Mark Gil & Camille" -> "M&C"); anything else gives
// the initials of its first words ("Zian Elandre" -> "ZE").
export function monogramFor(title: string): string {
  const [left, right, ...more] = title.split('&')
  if (right !== undefined && more.length === 0) {
    const pair = [initial(left), initial(right)]
    if (pair.every(Boolean)) return pair.join('&')
  }
  return title.split(/\s+/).map(initial).join('').slice(0, 3)
}

export const DEFAULT_COVER_LINE = 'You have a letter'

const savedCoverSchema = z.object({
  enabled: z.boolean().optional().catch(undefined),
  monogram: z.string().trim().max(3).optional().catch(undefined),
  line: line.optional().catch(undefined),
})

// Reads the cover saved on an event, filling anything missing with defaults.
export function readCover(saved: unknown, title: string): Cover {
  const result = savedCoverSchema.safeParse(saved)
  const cover = result.success ? result.data : {}
  return {
    enabled: cover.enabled ?? true,
    monogram: cover.monogram ?? monogramFor(title),
    line: cover.line ?? DEFAULT_COVER_LINE,
  }
}

// Every photo a list of blocks points at.
export function assetIdsIn(blocks: Block[]): string[] {
  return blocks
    .flatMap((block): (string | undefined)[] => {
      switch (block.type) {
        case 'hero':
        case 'custom':
          return [block.content.photoAssetId]
        case 'story':
          return block.content.photos.map((photo) => photo.assetId)
        case 'gifts':
          return block.content.payments.map((payment) => payment.qrAssetId)
        default:
          return []
      }
    })
    .filter((id): id is string => !!id)
}

// Takes one photo out of every block that uses it, keeping the text around
// it. Used when a host deletes a photo.
export function withoutAsset(blocks: Block[], assetId: string): Block[] {
  return blocks.map((block): Block => {
    switch (block.type) {
      case 'hero':
      case 'custom': {
        if (block.content.photoAssetId !== assetId) return block
        return {
          ...block,
          content: { ...block.content, photoAssetId: undefined },
        } as Block
      }
      case 'story': {
        const photos = block.content.photos.filter(
          (photo) => photo.assetId !== assetId,
        )
        return { ...block, content: { ...block.content, photos } }
      }
      case 'gifts': {
        const payments = block.content.payments.map((payment) => {
          if (payment.qrAssetId !== assetId) return payment
          return { ...payment, qrAssetId: undefined }
        })
        return { ...block, content: { ...block.content, payments } }
      }
      default:
        return block
    }
  })
}
