import type { SectionView } from '#/lib/sections'
import { SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'reminders' }>['content']

export function RemindersSection({ content }: { content: Content }) {
  return (
    <SectionShell type="reminders" heading={content.heading}>
      <ul className="flex w-full flex-col gap-2 text-lg leading-normal">
        {content.items.map((item, index) => (
          <li
            key={index}
            className="rounded-(--inner-radius) border border-line px-4 py-3 break-words"
          >
            {item}
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
