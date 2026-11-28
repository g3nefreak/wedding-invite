import type { BlockType } from '#/server/validation/sections.schema'

// What each section is called in the editor, and a line saying what it is for.
export const BLOCK_LABELS: Record<BlockType, { name: string; hint: string }> = {
  hero: {
    name: 'Opening',
    hint: 'The title and date, with a line above and an optional photo.',
  },
  countdown: {
    name: 'Countdown',
    hint: 'Counts down to the first time in When and where, then shows a message.',
  },
  story: { name: 'Photo story', hint: 'Photos with captions.' },
  message: { name: 'Message', hint: 'A few words from you to your guests.' },
  people: {
    name: 'People',
    hint: 'Lists of names, such as the entourage or godparents.',
  },
  gifts: {
    name: 'Gift guide',
    hint: 'Gift ideas, and where a monetary gift can be sent.',
  },
  dressCode: { name: 'Dress code', hint: 'What to wear, with color swatches.' },
  reminders: { name: 'Reminders', hint: 'Short notes for the day.' },
  whenWhere: {
    name: 'When and where',
    hint: 'Each place with its time and a map link.',
  },
  rsvp: {
    name: 'Reply',
    hint: 'The guest’s name, their role and the reply form.',
  },
  closing: { name: 'Closing', hint: 'A last line and a signature.' },
  custom: { name: 'Custom section', hint: 'Your own heading, text and photo.' },
}
