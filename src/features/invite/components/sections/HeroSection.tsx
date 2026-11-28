import type { SectionView } from '#/lib/sections'
import { LABEL, SectionPhoto } from './parts'

type Content = Extract<SectionView, { type: 'hero' }>['content']

// The opening of the invitation: who it is for and when.
export function HeroSection({
  content,
  title,
  date,
  typeName,
  centered,
}: {
  content: Content
  title: string
  date: string
  typeName: string
  centered: boolean
}) {
  return (
    <header
      data-testid="section-hero"
      className={`flex flex-col gap-5 pt-[10vh] ${centered ? 'items-center text-center' : ''}`}
    >
      <p className={LABEL}>{typeName} invitation</p>
      {content.kicker && (
        <p className="max-w-[40ch] text-lg leading-normal break-words text-pretty text-ink-soft">
          {content.kicker}
        </p>
      )}
      <h1
        tabIndex={-1}
        className="text-[clamp(2.75rem,13vw,5.5rem)] leading-[1.05] font-normal text-balance break-words [font-family:var(--font-display)] focus:outline-none"
      >
        {title}
      </h1>
      <p className="text-xl leading-normal">{date}</p>
      {content.photo && (
        <SectionPhoto
          photo={content.photo}
          className="mt-4 max-h-[70vh] object-[center_30%]"
        />
      )}
    </header>
  )
}
