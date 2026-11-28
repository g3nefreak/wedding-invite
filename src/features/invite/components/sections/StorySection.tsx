import type { SectionView } from '#/lib/sections'
import { Prose, SectionPhoto, SectionShell } from './parts'

type Content = Extract<SectionView, { type: 'story' }>['content']

// Photos with captions: how a couple met, or a child's first year.
export function StorySection({ content }: { content: Content }) {
  return (
    <SectionShell type="story" heading={content.heading}>
      <Prose text={content.intro} />
      {content.photos.length > 0 && (
        <ul className="flex w-full flex-wrap gap-3 [justify-content:var(--justify)]">
          {content.photos.map(({ photo, caption }) => (
            <li
              key={photo.url}
              className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)]"
            >
              <figure className="flex flex-col gap-2">
                <SectionPhoto
                  photo={photo}
                  alt={caption}
                  className="aspect-[4/5]"
                />
                {caption && (
                  <figcaption className="text-sm leading-normal break-words text-ink-soft">
                    {caption}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  )
}
