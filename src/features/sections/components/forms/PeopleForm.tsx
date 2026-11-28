'use client'

import { useState } from 'react'
import { Field } from '#/components/Field'
import { BUTTON_SMALL, FIELD } from '#/components/host-styles'
import { useGuestsQuery } from '#/features/guests'
import { useRolesQuery } from '#/features/roles'
import { LIMITS } from '#/server/validation/sections.schema'
import { fillPeopleFromRoles } from '../../sections.helpers'
import { AreaField, ListEditor, TextField } from '../fields'
import type { FormProps } from './types'

export function PeopleForm({
  id,
  content,
  onChange,
  eventId,
  hasRoles,
}: FormProps<'people'>) {
  return (
    <>
      <TextField
        id={`${id}-heading`}
        label="Heading"
        value={content.heading}
        maxLength={80}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <AreaField
        id={`${id}-intro`}
        label="Introduction"
        value={content.intro}
        maxLength={1200}
        onChange={(intro) => onChange({ ...content, intro })}
      />

      {hasRoles && (
        <FillFromRoles
          eventId={eventId}
          hasGroups={content.groups.length > 0}
          onFill={(groups) => onChange({ ...content, groups })}
        />
      )}

      <ListEditor
        legend="Groups"
        items={content.groups}
        max={LIMITS.groups}
        newItem={() => ({ title: '', names: [] })}
        addLabel="Add a group"
        itemName={(index) =>
          content.groups[index]?.title || `group ${index + 1}`
        }
        onChange={(groups) => onChange({ ...content, groups })}
      >
        {(group, change, index) => (
          <>
            <TextField
              id={`${id}-group-${index}-title`}
              label="Group title"
              value={group.title}
              maxLength={80}
              placeholder="Principal sponsors"
              onChange={(title) => change({ ...group, title })}
            />
            <Field
              id={`${id}-group-${index}-names`}
              label="Names"
              hint={`One name per line, up to ${LIMITS.namesPerGroup}. These names are shown to every guest.`}
            >
              {(control) => (
                <textarea
                  {...control}
                  rows={Math.min(Math.max(group.names.length + 1, 3), 10)}
                  // Kept exactly as typed while editing, blank lines and
                  // all; they are tidied away when the invitation is saved.
                  value={group.names.join('\n')}
                  onChange={(event) =>
                    change({ ...group, names: event.target.value.split('\n') })
                  }
                  className={`${FIELD} py-3 leading-normal`}
                />
              )}
            </Field>
          </>
        )}
      </ListEditor>
    </>
  )
}

// Copies the host's roles and the guests in them into the name lists, once.
// After that the lists are ordinary text.
function FillFromRoles({
  eventId,
  hasGroups,
  onFill,
}: {
  eventId: string
  hasGroups: boolean
  onFill: (groups: FormProps<'people'>['content']['groups']) => void
}) {
  const roles = useRolesQuery(eventId)
  const guests = useGuestsQuery(eventId)
  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState('')
  const ready = roles.isSuccess && guests.isSuccess

  function fill() {
    if (!ready) return
    const groups = fillPeopleFromRoles(roles.data, guests.data)
    setConfirming(false)
    if (groups.length === 0) {
      setNote(
        'No guests have a role yet. Give guests a role on the Guests tab first.',
      )
      return
    }
    setNote('')
    onFill(groups)
  }

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="leading-normal">
            Replace the groups below with your roles and their guests?
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={BUTTON_SMALL} onClick={fill}>
              Replace groups
            </button>
            <button
              type="button"
              className={BUTTON_SMALL}
              onClick={() => setConfirming(false)}
            >
              Keep what I have
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`${BUTTON_SMALL} self-start`}
          disabled={!ready}
          onClick={() => (hasGroups ? setConfirming(true) : fill())}
        >
          Fill from my roles
        </button>
      )}
      <p role="status" className="text-sm leading-normal text-host-ink-soft">
        {note}
      </p>
    </div>
  )
}
