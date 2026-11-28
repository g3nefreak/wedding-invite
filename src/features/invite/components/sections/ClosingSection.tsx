import type { SectionView } from '#/lib/sections'
import { Prose, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'closing' }>['content']

export function ClosingSection({ content }: { content: Content }) {
  return (
    <SectionShell type="closing">
      <Prose text={content.text} />
      {content.signature && (
        <p className="text-3xl leading-tight break-words [font-family:var(--font-display)]">
          {content.signature}
        </p>
      )}
    </SectionShell>
  )
}
