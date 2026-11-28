import type { CSSProperties } from 'react'
import { eventDayEnd, eventStart } from '#/lib/event-start'
import {
  firstPlaceTime,
  resolveSections,
  sectionsForEvent,
} from '#/lib/sections'
import type { SectionPhoto } from '#/lib/sections'
import type { EventView } from '#/server/services/event.service'
import type { Block } from '#/server/validation/sections.schema'
import type { InviteView, ResolvedDesign } from './invite.types'

// Theme files name fonts the way people do ("Bodoni Moda"). The loaded font
// lives in a CSS variable named after it (--font-bodoni-moda, see app/fonts.ts).
function fontStack(name: string, fallback: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `var(--font-${slug}), ${fallback}`
}

// Turns a resolved design into the CSS variables the invitation is drawn with.
export function designVariables(design: ResolvedDesign): CSSProperties {
  const { palette, fonts } = design

  return {
    '--ground': palette.ground,
    '--ink': palette.ink,
    '--ink-soft': palette.inkSoft,
    '--panel': palette.panel,
    '--line': palette.line,
    '--accent': palette.accent,
    '--button-ink': palette.buttonInk,
    '--font-display': fontStack(fonts.display, 'Georgia, serif'),
    '--font-body': fontStack(fonts.body, 'system-ui, sans-serif'),
    '--font-label': fontStack(design.labelFont, 'ui-monospace, monospace'),
    '--panel-radius': `${design.panelRadius}px`,
  } as CSSProperties
}

// "2027-06-12" -> "June 12, 2027". The date has no time, so it is read as UTC
// to keep it from slipping a day in the visitor's timezone.
export function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`))
}

// The invitation as a made-up guest would see it, for the host's previews.
// It is built the same way the real guest page is, so what the host sees is
// what their guests will get.
export function previewInvite(
  event: EventView,
  design: ResolvedDesign,
  photos: SectionPhoto[],
  // The editor passes its working copy, which may not be saved yet.
  working?: Block[],
): InviteView {
  const blocks =
    working ?? sectionsForEvent(event.type, event.sections, event.details)
  // Only events with roles show the role wording.
  const role = event.hasRoles
    ? {
        title: 'Maid of Honor',
        askText: 'Will you stand beside me as my maid of honor?',
        note: 'A note for this guest shows here.',
        attire: 'Floor-length gown',
        color: '',
      }
    : null

  return {
    guestName: 'Guest name',
    role,
    note: 'A note for this guest shows here.',
    event: {
      type: event.type,
      typeName: event.typeName,
      title: event.title,
      eventDate: event.eventDate,
      replyBy: event.replyBy,
      details: event.details,
    },
    design,
    backgroundUrl: event.backgroundUrl,
    cover: event.cover,
    sections: resolveSections(blocks, photos),
    startsAt: eventStart(
      event.eventDate,
      firstPlaceTime(blocks),
      event.timezone,
    ),
    dayEndsAt: eventDayEnd(event.eventDate, event.timezone),
    reply: null,
    replyOpen: true,
  }
}
