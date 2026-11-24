import { EVENT_TYPES } from '#/server/config/event-types'
import type { EventTypeKey } from '#/server/config/event-types'
import { readWeddingDetails } from '#/server/validation/details.schema'
import { designVariables, formatDay } from '../invite.helpers'
import type { InviteView } from '../invite.types'
import { RsvpForm } from './RsvpForm'
import { ThemeArt } from './ThemeArt'

const LABEL =
  '[font-family:var(--font-label)] text-xs uppercase tracking-[0.14em] text-ink-soft'

function eventTypeName(type: string): string {
  return Object.hasOwn(EVENT_TYPES, type)
    ? EVENT_TYPES[type as EventTypeKey].name
    : 'Event'
}

// One guest's invitation. All names, notes and messages are rendered as plain
// text; nothing here is ever inserted as HTML.
export function InviteScreen({
  invite,
  token,
}: {
  invite: InviteView
  token: string
}) {
  const { design, event, role } = invite
  const details = readWeddingDetails(event.details)
  const centered = design.heroAlign === 'center'

  // Only the facts this event actually has are listed.
  const facts = [
    { label: 'When', value: formatDay(event.eventDate) },
    details.ceremony && {
      label: 'Ceremony',
      value: `${details.ceremony.time}, ${details.ceremony.venue}`,
    },
    details.reception && {
      label: 'Reception',
      value: `${details.reception.time}, ${details.reception.venue}`,
    },
    role?.attire && { label: 'Attire', value: role.attire },
    { label: 'Reply by', value: formatDay(event.replyBy) },
  ].filter((fact) => !!fact)

  return (
    <main
      style={{
        ...designVariables(design),
        // Corners inside the panel follow its curve: outer radius minus padding.
        ['--inner-radius' as string]: `${Math.max(design.panelRadius - 20, 4)}px`,
      }}
      className="relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden bg-ground text-ink [font-family:var(--font-body)]"
    >
      <ThemeArt art={design.art} />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-6 sm:px-8 sm:py-10">
        <p
          className={`${LABEL} flex flex-wrap justify-between gap-x-6 gap-y-1`}
        >
          <span>{eventTypeName(event.type)} invitation</span>
          <span>{formatDay(event.eventDate)}</span>
        </p>

        <header
          className={`flex flex-col gap-4 pt-[12vh] ${centered ? 'items-center text-center' : ''}`}
        >
          <h1 className="text-[clamp(2.75rem,13vw,5.5rem)] leading-[1.05] font-normal text-balance [font-family:var(--font-display)]">
            {event.title}
          </h1>
          {details.headline && (
            <p className="max-w-[40ch] text-lg leading-normal text-pretty text-ink-soft">
              {details.headline}
            </p>
          )}
        </header>

        <section
          aria-labelledby="guest-name"
          className="mt-auto flex flex-col gap-6 rounded-(--panel-radius) border border-line bg-panel p-5 backdrop-blur-md"
        >
          <div className="flex flex-col gap-2">
            <p className={LABEL}>{role ? role.title : 'You are invited'}</p>
            <h2
              id="guest-name"
              className="text-3xl leading-tight font-normal [font-family:var(--font-display)]"
            >
              {invite.guestName}
            </h2>
            {role?.askText && (
              <p className="text-lg leading-normal text-pretty">
                {role.askText}
              </p>
            )}
            {invite.note && (
              <p className="leading-normal text-pretty text-ink-soft">
                {invite.note}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col gap-1 rounded-(--inner-radius) border border-line px-3 py-2"
              >
                <dt className={LABEL}>{fact.label}</dt>
                <dd className="leading-normal">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <RsvpForm
            token={token}
            initialReply={invite.reply}
            replyOpen={invite.replyOpen}
          />
        </section>
      </div>
    </main>
  )
}
