import type { SectionView } from '#/lib/sections'
import { Prose, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'dressCode' }>['content']

export function DressCodeSection({ content }: { content: Content }) {
  return (
    <SectionShell type="dressCode" heading="Dress code">
      <Prose text={content.text} />
      {content.swatches.length > 0 && (
        <ul className="flex w-full flex-wrap gap-x-6 gap-y-3 [justify-content:var(--justify)]">
          {/* Each color has its name beside it, so nobody has to tell the
              shades apart by eye alone. */}
          {content.swatches.map((swatch, index) => (
            <li key={index} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-9 shrink-0 rounded-full border border-line"
                style={{ backgroundColor: swatch.color }}
              />
              <span className="leading-snug break-words">{swatch.name}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  )
}
