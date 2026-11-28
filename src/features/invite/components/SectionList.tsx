import type { SectionView } from '#/lib/sections'
import { formatDay } from '../invite.helpers'
import { isEmptySection } from '../invite.sections'
import type { InviteView } from '../invite.types'
import { ClosingSection } from './sections/ClosingSection'
import { CountdownSection } from './sections/CountdownSection'
import { CustomSection } from './sections/CustomSection'
import { DressCodeSection } from './sections/DressCodeSection'
import { GiftsSection } from './sections/GiftsSection'
import { Reveal } from './Reveal'
import { HeroSection } from './sections/HeroSection'
import { MessageSection } from './sections/MessageSection'
import { PeopleSection } from './sections/PeopleSection'
import { RemindersSection } from './sections/RemindersSection'
import { RsvpSection } from './sections/RsvpSection'
import { StorySection } from './sections/StorySection'
import { WhenWhereSection } from './sections/WhenWhereSection'

type Props = {
  invite: InviteView
  token: string
  // True inside the host's preview. Kept so sections can tell the two apart.
  preview: boolean
}

// The invitation itself: the host's sections, in the host's order.
export function SectionList({ invite, token }: Props) {
  const { design, event } = invite
  const centered = design.heroAlign === 'center'
  const date = formatDay(event.eventDate)

  function draw(section: SectionView) {
    switch (section.type) {
      case 'hero':
        return (
          <HeroSection
            content={section.content}
            title={event.title}
            date={date}
            typeName={event.typeName}
            centered={centered}
          />
        )
      case 'countdown':
        return (
          <CountdownSection
            content={section.content}
            startsAt={invite.startsAt}
            dayEndsAt={invite.dayEndsAt}
          />
        )
      case 'story':
        return <StorySection content={section.content} />
      case 'message':
        return <MessageSection content={section.content} />
      case 'people':
        return <PeopleSection content={section.content} />
      case 'gifts':
        return <GiftsSection content={section.content} />
      case 'dressCode':
        return <DressCodeSection content={section.content} />
      case 'reminders':
        return <RemindersSection content={section.content} />
      case 'whenWhere':
        return <WhenWhereSection content={section.content} date={date} />
      case 'rsvp':
        return (
          <RsvpSection
            intro={section.content.intro}
            invite={invite}
            token={token}
          />
        )
      case 'closing':
        return <ClosingSection content={section.content} />
      case 'custom':
        return <CustomSection content={section.content} />
    }
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-2xl flex-1 flex-col gap-16 px-5 py-6 sm:px-8 sm:py-10 ${centered ? 'text-center [--justify:center] [&_[data-shell]]:items-center' : '[--justify:flex-start]'}`}
    >
      {invite.sections
        .filter((section) => !isEmptySection(section))
        // The list never changes while the page is open, so its position is
        // a safe key. A guest's page carries no ids.
        .map((section, index) =>
          // The opening is on screen from the start, so it does not animate.
          section.type === 'hero' ? (
            <div key={index} className="contents">
              {draw(section)}
            </div>
          ) : (
            <Reveal key={index}>{draw(section)}</Reveal>
          ),
        )}
    </div>
  )
}
