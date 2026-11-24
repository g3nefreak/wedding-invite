'use client'

import { useRef, useState } from 'react'
import {
  BUTTON_DANGER,
  BUTTON_QUIET,
  CARD,
  ERROR_TEXT,
} from '#/components/host-styles'
import { ApiError } from '#/lib/api'
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useRolesQuery,
  useUpdateRoleMutation,
} from '../roles.query'
import type { RoleView } from '../roles.types'
import { RoleForm } from './RoleForm'

const HEADING = 'font-host-display text-3xl leading-tight font-medium'

// The Roles section of an event's page: list, add, edit and delete.
export function RolesPanel({ eventId }: { eventId: string }) {
  const roles = useRolesQuery(eventId)
  const [adding, setAdding] = useState(false)
  const create = useCreateRoleMutation(eventId)

  return (
    <section className={`${CARD} flex flex-col gap-6`}>
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>Roles</h2>
        <p className="max-w-[56ch] text-lg leading-normal text-host-ink-soft">
          Special parts in your event, such as Maid of Honor or Best Man. A
          guest with a role sees its wording on their invitation.
        </p>
      </div>

      {roles.isPending && <p>Loading roles…</p>}

      {roles.isError && (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-lg leading-normal">
            Unable to load the roles. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => roles.refetch()}
            className={BUTTON_QUIET}
          >
            Try again
          </button>
        </div>
      )}

      {roles.data?.length === 0 && !adding && (
        <p className="text-lg leading-normal">
          No roles yet. Add one, or skip this if every guest is an ordinary
          guest.
        </p>
      )}

      {roles.data && roles.data.length > 0 && (
        <ul className="flex flex-col gap-4">
          {roles.data.map((role) => (
            <RoleRow key={role.id} eventId={eventId} role={role} />
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-4 border-t border-host-line pt-6">
          <h3 className="font-host-display text-2xl">New role</h3>
          <RoleForm
            submitLabel="Add role"
            isPending={create.isPending}
            error={create.error}
            onSubmit={(input) =>
              create.mutate(input, { onSuccess: () => setAdding(false) })
            }
            onCancel={() => {
              create.reset()
              setAdding(false)
            }}
          />
        </div>
      ) : (
        roles.data && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`${BUTTON_QUIET} self-start`}
          >
            Add a role
          </button>
        )
      )}
    </section>
  )
}

function RoleRow({ eventId, role }: { eventId: string; role: RoleView }) {
  const [editing, setEditing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const update = useUpdateRoleMutation(eventId, role.id)
  const remove = useDeleteRoleMutation(eventId, role.id)

  if (editing) {
    return (
      <li className="rounded-2xl border border-host-line p-4 sm:p-6">
        <RoleForm
          initial={{
            title: role.title,
            askText: role.askText,
            note: role.note,
            attire: role.attire,
          }}
          submitLabel="Save role"
          isPending={update.isPending}
          error={update.error}
          onSubmit={(input) =>
            update.mutate(input, { onSuccess: () => setEditing(false) })
          }
          onCancel={() => {
            update.reset()
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-host-line p-4 sm:p-6">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <h3 className="font-host-display text-2xl leading-tight">
          {role.title}
        </h3>
        {role.askText && <p className="leading-normal">{role.askText}</p>}
        {role.note && (
          <p className="leading-normal text-host-ink-soft">{role.note}</p>
        )}
        {role.attire && (
          <p className="leading-normal text-host-ink-soft">
            Attire: {role.attire}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${role.title}`}
          className={BUTTON_QUIET}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          aria-label={`Delete ${role.title}`}
          className={BUTTON_DANGER}
        >
          Delete
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby={`delete-role-${role.id}`}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-host-line bg-host-ground p-6 text-host-ink backdrop:bg-black/70 sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 id={`delete-role-${role.id}`} className={HEADING}>
              Delete “{role.title}”?
            </h3>
            <p className="text-lg leading-normal text-host-ink-soft">
              Guests with this role stay on your list as ordinary guests. This
              cannot be undone.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(undefined)}
              className={BUTTON_DANGER}
            >
              {remove.isPending ? 'Deleting…' : 'Delete role'}
            </button>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={BUTTON_QUIET}
            >
              Cancel
            </button>
          </div>
          {remove.isError && (
            <p role="alert" className={ERROR_TEXT}>
              {remove.error instanceof ApiError
                ? remove.error.message
                : 'Unable to delete the role. Check your connection and try again.'}
            </p>
          )}
        </div>
      </dialog>
    </li>
  )
}
