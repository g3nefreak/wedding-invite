import { CARD } from '#/components/host-styles'
import type { Cover } from '#/server/validation/sections.schema'
import { TextField } from './fields'

const SWITCH =
  'flex min-h-11 cursor-pointer items-center gap-3 text-lg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-host-accent'

// The envelope a guest opens before they see the invitation.
export function CoverFields({
  cover,
  onChange,
}: {
  cover: Cover
  onChange: (cover: Cover) => void
}) {
  return (
    <section className={`${CARD} flex flex-col gap-5`}>
      <div className="flex flex-col gap-1">
        <h3 className="font-host-display text-2xl font-medium">
          Envelope cover
        </h3>
        <p className="leading-normal text-host-ink-soft">
          Guests see a sealed envelope first and tap it to open the invitation.
        </p>
      </div>

      <label className={SWITCH}>
        <input
          type="checkbox"
          role="switch"
          checked={cover.enabled}
          onChange={(event) =>
            onChange({ ...cover, enabled: event.target.checked })
          }
          className="size-5 accent-host-accent"
        />
        Show the envelope cover
      </label>

      {cover.enabled && (
        <div className="grid items-end gap-5 sm:grid-cols-[minmax(11rem,1fr)_2fr]">
          <TextField
            id="cover-monogram"
            label="Monogram"
            hint="Up to 3 characters on the seal."
            value={cover.monogram}
            maxLength={3}
            onChange={(monogram) => onChange({ ...cover, monogram })}
          />
          <TextField
            id="cover-line"
            label="Line above the envelope"
            value={cover.line}
            maxLength={120}
            placeholder="You have a letter"
            onChange={(line) => onChange({ ...cover, line })}
          />
        </div>
      )}
    </section>
  )
}
