import type { SectionView } from '#/lib/sections'
import { LABEL, Prose, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'people' }>['content']

// Lists of names under titles: a wedding entourage, or godparents. These are
// names the host typed in to be shown; the guest list is never read here.
export function PeopleSection({ content }: { content: Content }) {
  return (
    <SectionShell type="people" heading={content.heading}>
      <Prose text={content.intro} />
      <div className="flex w-full flex-wrap gap-x-8 gap-y-6 [justify-content:var(--justify)]">
        {content.groups.map((group, index) => (
          <div
            key={index}
            className="flex w-full flex-col gap-2 sm:w-[calc(50%-1rem)]"
          >
            {group.title && <h3 className={LABEL}>{group.title}</h3>}
            <ul className="flex flex-col gap-1 text-lg leading-snug">
              {group.names.map((name, nameIndex) => (
                <li key={nameIndex} className="break-words">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
