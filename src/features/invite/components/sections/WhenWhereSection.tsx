import type { SectionView } from '#/lib/sections'
import { CARD_HALF, CARD_ROW, LABEL, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'whenWhere' }>['content']

const LINK =
  'inline-flex min-h-11 items-center [align-self:var(--justify)] rounded-(--inner-radius) border border-line px-5 py-2 font-medium transition-[background-color] duration-150 ease-out hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

// The day, and each place with its time and a map link when the host set one.
export function WhenWhereSection({
  content,
  date,
}: {
  content: Content
  date: string
}) {
  return (
    <SectionShell type="whenWhere" heading="When and where">
      <p className="text-xl leading-normal">{date}</p>
      <ul className={CARD_ROW}>
        {content.places.map((place, index) => (
          <li
            key={index}
            className={`${CARD_HALF} flex flex-col gap-2 rounded-(--inner-radius) border border-line bg-panel px-4 py-4`}
          >
            {place.label && <h3 className={LABEL}>{place.label}</h3>}
            {place.time && (
              <p className="text-2xl leading-tight [font-family:var(--font-display)]">
                {place.time}
              </p>
            )}
            {place.venue && (
              <p className="text-lg leading-snug break-words">{place.venue}</p>
            )}
            {place.address && (
              <p className="leading-normal break-words text-ink-soft">
                {place.address}
              </p>
            )}
            {place.mapUrl && (
              <a
                href={place.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${LINK} mt-2`}
              >
                Open map
                <span className="sr-only">
                  {' '}
                  for {place.venue || place.label} (opens in a new tab)
                </span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
