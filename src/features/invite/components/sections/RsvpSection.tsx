import { formatDay } from '../../invite.helpers'
import type { InviteView } from '../../invite.types'
import { RsvpForm } from '../RsvpForm'
import { LABEL, Prose } from './parts'

// It is not marked `data-shell`: even in a centered theme this panel reads
// from the left like a form, with everything on one edge.
// The personal part of the invitation: this guest's name, the role they are
// asked to take, a note for them, and their reply.
export function RsvpSection({
  intro,
  invite,
  token,
}: {
  intro: string
  invite: InviteView
  token: string
}) {
  const { role, event } = invite

  const facts = [
    role?.attire && { label: 'Attire', value: role.attire },
    { label: 'Reply by', value: formatDay(event.replyBy) },
  ].filter((fact) => !!fact)

  return (
    <section
      data-testid="section-rsvp"
      aria-labelledby="guest-name"
      className="flex flex-col gap-6 rounded-(--panel-radius) border border-line bg-panel p-5 text-start backdrop-blur-md"
    >
      <div className="flex flex-col gap-2">
        <p className={LABEL}>{role ? role.title : 'You are invited'}</p>
        <h2
          id="guest-name"
          className="text-3xl leading-tight font-normal break-words [font-family:var(--font-display)]"
        >
          {invite.guestName}
        </h2>
        {role?.askText && (
          <p className="text-lg leading-normal break-words text-pretty">
            {role.askText}
          </p>
        )}
        {invite.note && (
          <p className="leading-normal break-words text-pretty text-ink-soft">
            {invite.note}
          </p>
        )}
      </div>

      <Prose text={intro} />

      {/* One fact takes the whole row; two share it. */}
      <dl className="flex flex-wrap gap-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex min-w-40 flex-1 flex-col gap-1 rounded-(--inner-radius) border border-line px-3 py-2"
          >
            <dt className={LABEL}>{fact.label}</dt>
            <dd className="leading-normal break-words">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <RsvpForm
        token={token}
        initialReply={invite.reply}
        replyOpen={invite.replyOpen}
      />
    </section>
  )
}
