import type { Block, BlockType } from '#/server/validation/sections.schema'
import { BLOCK_TYPES } from '#/server/validation/sections.schema'

// Event types are data, not tables. Add a type here with the section blocks
// it may use and the blocks a new invitation of that type starts with.
export const EVENT_TYPE_KEYS = ['wedding', 'birthday'] as const
export type EventTypeKey = (typeof EVENT_TYPE_KEYS)[number]

export const isEventType = (type: string): type is EventTypeKey =>
  (EVENT_TYPE_KEYS as readonly string[]).includes(type)

type EventType = {
  name: string
  hasRoles: boolean
  // The block types a host of this event may use.
  blocks: readonly BlockType[]
  // What a new invitation starts with, in order. Each id is its type's name.
  defaults: Block[]
}

const emptyPlace = (label: string) => ({
  label,
  venue: '',
  time: '',
  address: '',
  mapUrl: '',
})

export const EVENT_TYPES: Record<EventTypeKey, EventType> = {
  wedding: {
    name: 'Wedding',
    hasRoles: true,
    blocks: BLOCK_TYPES,
    // Story, gifts and reminders start switched off, so a new invitation is
    // not full of empty sections.
    defaults: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        content: { kicker: 'Together with their families' },
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        content: { dayMessage: '', afterMessage: '' },
      },
      {
        id: 'story',
        type: 'story',
        enabled: false,
        content: { heading: 'Our story', intro: '', photos: [] },
      },
      {
        id: 'message',
        type: 'message',
        enabled: true,
        content: { heading: 'From us', text: '' },
      },
      {
        id: 'people',
        type: 'people',
        enabled: true,
        content: { heading: 'The entourage', intro: '', groups: [] },
      },
      {
        id: 'whenWhere',
        type: 'whenWhere',
        enabled: true,
        content: { places: [emptyPlace('Ceremony'), emptyPlace('Reception')] },
      },
      {
        id: 'dressCode',
        type: 'dressCode',
        enabled: true,
        content: { text: '', swatches: [] },
      },
      {
        id: 'gifts',
        type: 'gifts',
        enabled: false,
        content: { intro: '', ideas: [], payments: [], closing: '' },
      },
      {
        id: 'reminders',
        type: 'reminders',
        enabled: false,
        content: { heading: 'Reminders', items: [] },
      },
      { id: 'rsvp', type: 'rsvp', enabled: true, content: { intro: '' } },
      {
        id: 'closing',
        type: 'closing',
        enabled: true,
        content: { text: '', signature: '' },
      },
    ],
  },
  // A child's birthday, a christening, or both on one day. There is no
  // entourage, so no roles: godparents are simply listed by name.
  birthday: {
    name: 'Birthday and christening',
    hasRoles: false,
    blocks: BLOCK_TYPES,
    defaults: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        content: { kicker: 'Please join us to celebrate' },
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        content: { dayMessage: '', afterMessage: '' },
      },
      {
        id: 'story',
        type: 'story',
        enabled: false,
        content: { heading: 'The first year', intro: '', photos: [] },
      },
      {
        id: 'message',
        type: 'message',
        enabled: true,
        content: { heading: 'From our family', text: '' },
      },
      {
        id: 'people',
        type: 'people',
        enabled: false,
        content: {
          heading: 'Godparents',
          intro: '',
          groups: [
            { title: 'Godfathers', names: [] },
            { title: 'Godmothers', names: [] },
          ],
        },
      },
      {
        id: 'whenWhere',
        type: 'whenWhere',
        enabled: true,
        content: { places: [emptyPlace('Celebration')] },
      },
      {
        id: 'dressCode',
        type: 'dressCode',
        enabled: true,
        content: { text: '', swatches: [] },
      },
      {
        id: 'gifts',
        type: 'gifts',
        enabled: false,
        content: { intro: '', ideas: [], payments: [], closing: '' },
      },
      {
        id: 'reminders',
        type: 'reminders',
        enabled: false,
        content: { heading: 'Reminders', items: [] },
      },
      { id: 'rsvp', type: 'rsvp', enabled: true, content: { intro: '' } },
      {
        id: 'closing',
        type: 'closing',
        enabled: true,
        content: { text: '', signature: '' },
      },
    ],
  },
}
