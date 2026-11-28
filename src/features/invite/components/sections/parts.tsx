import type { ReactNode } from 'react'
import type { Photo } from '#/lib/sections'

export const LABEL =
  '[font-family:var(--font-label)] text-xs uppercase tracking-[0.14em] text-ink-soft'

// A row of cards (places, gift ideas, payment options). It wraps, and a row
// that is not full follows the theme: centered in a centered theme, at the
// start otherwise. `--justify` is set once on the section list.
export const CARD_ROW =
  'flex w-full flex-wrap gap-3 [justify-content:var(--justify)]'
// One card in such a row: full width on a phone, half on a wider screen.
export const CARD_HALF = 'w-full sm:w-[calc(50%-0.375rem)]'

// The frame every section shares: its heading and the space around it. The
// heading is left out when the host gave none.
export function SectionShell({
  type,
  heading,
  children,
}: {
  type: string
  heading?: string
  children: ReactNode
}) {
  return (
    <section
      data-testid={`section-${type}`}
      // Marks the sections whose contents are centered in a centered theme.
      data-shell
      className="flex flex-col gap-5"
    >
      {heading && (
        <h2 className="text-3xl leading-tight font-normal text-balance break-words [font-family:var(--font-display)] sm:text-4xl">
          {heading}
        </h2>
      )}
      {children}
    </section>
  )
}

// A paragraph the host wrote. Line breaks they typed are kept, and a long
// word with no spaces wraps instead of pushing the page sideways.
export function Prose({ text, soft }: { text: string; soft?: boolean }) {
  if (text.trim() === '') return null
  return (
    <p
      className={`max-w-[62ch] text-lg leading-relaxed break-words whitespace-pre-line text-pretty ${soft ? 'text-ink-soft' : ''}`}
    >
      {text}
    </p>
  )
}

// One of the host's photos. The box takes the photo's own shape before the
// file arrives, so the page does not jump while it loads.
export function SectionPhoto({
  photo,
  alt = '',
  className = '',
  contain,
}: {
  photo: Photo
  alt?: string
  className?: string
  // Show the whole picture, never cut (used for QR codes).
  contain?: boolean
}) {
  return (
    // A plain <img>: the photo was already resized on our server.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt={alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      className={`h-auto w-full rounded-(--inner-radius) ${contain ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}
