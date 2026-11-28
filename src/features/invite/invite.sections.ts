import type { SectionView } from '#/lib/sections'

const blank = (...texts: string[]) => texts.every((text) => text.trim() === '')

// A section with nothing in it is left off the page, so a guest never sees a
// lone heading or an empty box. The opening, the countdown and the reply
// always have something to show.
export function isEmptySection(section: SectionView): boolean {
  switch (section.type) {
    case 'hero':
    case 'countdown':
    case 'rsvp':
      return false
    case 'story':
      return blank(section.content.intro) && section.content.photos.length === 0
    case 'message':
      return blank(section.content.text)
    case 'people':
      return blank(section.content.intro) && section.content.groups.length === 0
    case 'gifts': {
      const gifts = section.content
      return (
        blank(gifts.intro, gifts.closing) &&
        gifts.ideas.length === 0 &&
        gifts.payments.length === 0
      )
    }
    case 'dressCode':
      return (
        blank(section.content.text) && section.content.swatches.length === 0
      )
    case 'reminders':
      return section.content.items.length === 0
    case 'whenWhere':
      return section.content.places.length === 0
    case 'closing':
      return blank(section.content.text, section.content.signature)
    case 'custom':
      return (
        blank(section.content.heading, section.content.text) &&
        !section.content.photo
      )
  }
}
