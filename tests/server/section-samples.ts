import type { Block, Cover } from '#/server/validation/sections.schema'

// One block type, so a test can spread a sample and change its content.
type BlockOf<T extends Block['type']> = Extract<Block, { type: T }>

// Small ready-made blocks shared by the section tests.
export const hero: BlockOf<'hero'> = {
  id: 'hero',
  type: 'hero',
  enabled: true,
  content: { kicker: 'Together with their families' },
}

export const rsvp: BlockOf<'rsvp'> = {
  id: 'rsvp',
  type: 'rsvp',
  enabled: true,
  content: { intro: '' },
}

export const countdown: BlockOf<'countdown'> = {
  id: 'countdown',
  type: 'countdown',
  enabled: true,
  content: { dayMessage: '', afterMessage: '' },
}

export const closing: BlockOf<'closing'> = {
  id: 'closing',
  type: 'closing',
  enabled: true,
  content: { text: 'See you there', signature: 'M & P' },
}

export function message(heading: string, text: string): Block {
  return {
    id: 'message',
    type: 'message',
    enabled: true,
    content: { heading, text },
  }
}

export function custom(id: string): Block {
  return {
    id,
    type: 'custom',
    enabled: true,
    content: { heading: 'Extra', text: 'More' },
  }
}

export function people(names: string[]): Block {
  return {
    id: 'people',
    type: 'people',
    enabled: true,
    content: {
      heading: 'The entourage',
      intro: '',
      groups: [{ title: 'Best Man', names }],
    },
  }
}

export const cover: Cover = {
  enabled: true,
  monogram: 'M&P',
  line: 'You have a letter',
}

export const input = (sections: unknown[]) => ({ sections, cover })
