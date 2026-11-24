// Shared looks for the host side (login and dashboard), so every form field
// and button matches. Colors come from the host tokens in app/globals.css.
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent'

export const FIELD = `min-h-12 w-full rounded-xl border border-host-line bg-host-panel px-4 py-2 text-lg text-host-ink placeholder:text-host-ink-soft aria-invalid:border-red-300 ${FOCUS}`

// A dropdown: a field with the custom chevron from app/globals.css.
export const SELECT = `${FIELD} host-select`

export const LABEL = 'text-lg font-medium'

export const ERROR_TEXT = 'text-sm leading-normal text-red-300'

const BUTTON = `inline-flex min-h-12 items-center justify-center rounded-full px-6 py-2 text-lg font-medium transition-[background-color,color,opacity,scale] duration-150 ease-out enabled:active:scale-[0.96] disabled:opacity-60 ${FOCUS}`

// One per screen: the main thing to do there.
export const BUTTON_PRIMARY = `${BUTTON} bg-host-accent text-host-accent-ink hover:bg-host-ink`

export const BUTTON_QUIET = `${BUTTON} border border-host-line text-host-ink hover:bg-host-ink hover:text-host-accent-ink`

// For actions that destroy something. Outlined in red and labelled with what
// it deletes, so it is not marked by color alone.
export const BUTTON_DANGER = `${BUTTON} border border-red-300 text-red-300 hover:bg-red-300 hover:text-host-accent-ink`

export const CARD =
  'rounded-3xl border border-host-line bg-host-panel p-6 sm:p-8'

// Smaller buttons for rows in a long list.
const SMALL = `inline-flex min-h-11 items-center justify-center rounded-full px-4 py-1 font-medium transition-[background-color,color,opacity,scale] duration-150 ease-out enabled:active:scale-[0.96] disabled:opacity-60 ${FOCUS}`

export const BUTTON_SMALL = `${SMALL} border border-host-line text-host-ink hover:bg-host-ink hover:text-host-accent-ink`

// A filter that is on or off. The pressed one is filled and also carries
// aria-pressed, so it is not marked by color alone.
export const CHIP = `${SMALL} border border-host-line text-host-ink hover:border-host-accent aria-pressed:border-host-accent aria-pressed:bg-host-accent aria-pressed:text-host-accent-ink`

// One of the tabs on an event's page; the current one is underlined in gold.
export const TAB = `inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-lg font-medium text-host-ink-soft hover:text-host-ink aria-[current=page]:border-host-accent aria-[current=page]:text-host-ink ${FOCUS}`
