import type { SectionView } from '#/lib/sections'
import { Prose, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'message' }>['content']

export function MessageSection({ content }: { content: Content }) {
  return (
    <SectionShell type="message" heading={content.heading}>
      <Prose text={content.text} />
    </SectionShell>
  )
}
