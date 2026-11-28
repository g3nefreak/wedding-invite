import type { SectionView } from '#/lib/sections'
import { Prose, SectionPhoto, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'custom' }>['content']

// A section the host made up themselves: a heading, some text and a photo.
export function CustomSection({ content }: { content: Content }) {
  return (
    <SectionShell type="custom" heading={content.heading}>
      <Prose text={content.text} />
      {content.photo && (
        <SectionPhoto photo={content.photo} className="max-h-[70vh]" />
      )}
    </SectionShell>
  )
}
