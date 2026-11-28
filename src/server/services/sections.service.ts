import { EVENT_TYPES } from '#/server/config/event-types'
import type { EventTypeKey } from '#/server/config/event-types'
import { AppError } from '#/server/errors'
import type { AssetRepository } from '#/server/repositories/asset.repository'
import type { EventRepository } from '#/server/repositories/event.repository'
import { findOwnedEvent, toEventView } from '#/server/services/event.service'
import type { EventView } from '#/server/services/event.service'
import {
  assetIdsIn,
  BLOCK_TYPES,
  LIMITS,
} from '#/server/validation/sections.schema'
import type {
  Block,
  BlockType,
  SectionsInput,
} from '#/server/validation/sections.schema'

type Deps = {
  events: EventRepository
  assets: Pick<AssetRepository, 'findById' | 'listByEvent'>
}

const refuse = (message: string) => new AppError('VALIDATION', message)

// The block types an event of this kind may use. An unknown kind gets the
// full library, so an old event can never be locked out of saving.
function allowedBlocks(eventType: string): readonly BlockType[] {
  return Object.hasOwn(EVENT_TYPES, eventType)
    ? EVENT_TYPES[eventType as EventTypeKey].blocks
    : BLOCK_TYPES
}

// The rules about the list as a whole. Each block's own content was already
// checked by its schema.
function checkList(sections: Block[], eventType: string) {
  const count = (type: BlockType) =>
    sections.filter((block) => block.type === type).length

  const [first] = sections
  if (count('hero') !== 1 || first?.type !== 'hero' || !first.enabled) {
    throw refuse('The opening section must come first and stay switched on')
  }

  const rsvp = sections.filter((block) => block.type === 'rsvp')
  if (rsvp.length !== 1 || !rsvp[0].enabled) {
    throw refuse('The reply section must stay switched on')
  }

  if (new Set(sections.map((block) => block.id)).size !== sections.length) {
    throw refuse('Two sections share the same id')
  }

  const allowed = allowedBlocks(eventType)
  for (const type of BLOCK_TYPES) {
    const most = type === 'custom' ? LIMITS.customBlocks : 1
    if (count(type) > 0 && !allowed.includes(type)) {
      throw refuse('This kind of event cannot use one of these sections')
    }
    if (count(type) > most) {
      throw refuse(
        type === 'custom'
          ? `An invitation can have up to ${most} custom sections`
          : 'Each kind of section can be used only once',
      )
    }
  }
}

// Every photo a block points at must be one of this event's own section
// photos. Otherwise a host could show another event's photo by guessing ids.
async function checkPhotos(sections: Block[], eventId: string, deps: Deps) {
  for (const id of new Set(assetIdsIn(sections))) {
    const asset = await deps.assets.findById(id)
    if (!asset || asset.eventId !== eventId || asset.kind !== 'section') {
      throw refuse('One of the photos could not be found. Upload it again.')
    }
  }
}

// Replaces the invitation's sections and cover with what the host sent.
export async function updateSections(
  userId: string,
  eventId: string,
  input: SectionsInput,
  deps: Deps,
): Promise<EventView> {
  const event = await findOwnedEvent(userId, eventId, deps.events)
  checkList(input.sections, event.type)
  await checkPhotos(input.sections, event.id, deps)

  const updated = await deps.events.update(event.id, {
    sections: input.sections,
    cover: input.cover,
  })
  return toEventView({
    ...updated,
    backgroundPath: event.backgroundPath,
    sectionAssets: await deps.assets.listByEvent(event.id, 'section'),
  })
}
