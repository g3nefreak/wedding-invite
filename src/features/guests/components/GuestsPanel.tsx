'use client'

import { useId, useRef, useState } from 'react'
import {
  BUTTON_DANGER,
  BUTTON_QUIET,
  BUTTON_SMALL,
  CARD,
  CHIP,
  ERROR_TEXT,
  FIELD,
  SELECT,
} from '#/components/host-styles'
import { useRolesQuery } from '#/features/roles'
import type { RoleView } from '#/features/roles'
import { ApiError } from '#/lib/api'
import { countReplies, filterGuests, NO_FILTERS } from '../guests.helpers'
import type { GuestFilters, ReplyFilter } from '../guests.helpers'
import {
  useCreateGuestMutation,
  useCreateGuestsMutation,
  useDeleteGuestMutation,
  useGuestsQuery,
  useUpdateGuestMutation,
} from '../guests.query'
import type { GuestView } from '../guests.types'
import { GuestForm } from './GuestForm'
import { PasteGuestsForm } from './PasteGuestsForm'

const HEADING = 'font-host-display text-3xl leading-tight font-medium'

const REPLY_LABEL = { going: 'Going', not_going: 'Not going' } as const

const REPLY_FILTERS: { value: ReplyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'going', label: 'Going' },
  { value: 'not_going', label: 'Not going' },
  { value: 'none', label: 'No reply' },
]

// The Guests tab of an event's page: search, filter, add, paste, edit,
// delete and copy each guest's personal link.
export function GuestsPanel({
  eventId,
  published,
}: {
  eventId: string
  published: boolean
}) {
  const guests = useGuestsQuery(eventId)
  const roles = useRolesQuery(eventId)
  const [mode, setMode] = useState<'idle' | 'one' | 'paste'>('idle')
  const [filters, setFilters] = useState<GuestFilters>(NO_FILTERS)
  const createOne = useCreateGuestMutation(eventId)
  const createMany = useCreateGuestsMutation(eventId)
  const searchId = useId()
  const roleFilterId = useId()

  const roleList = roles.data ?? []
  const all = guests.data ?? []
  const counts = countReplies(all)
  const shown = filterGuests(all, filters)
  const filtering =
    filters.search.trim() !== '' ||
    filters.reply !== 'all' ||
    filters.role !== 'all'

  function close() {
    createOne.reset()
    createMany.reset()
    setMode('idle')
  }

  return (
    <section className={`${CARD} flex flex-col gap-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className={HEADING}>Guests</h2>
          <p className="max-w-[56ch] text-lg leading-normal text-host-ink-soft">
            Each guest gets their own link. Copy it and send it to them.
            {!published && ' Links start working once you publish the event.'}
          </p>
        </div>
        {mode === 'idle' && guests.data && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode('one')}
              className={BUTTON_SMALL}
            >
              Add a guest
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={BUTTON_SMALL}
            >
              Paste a list
            </button>
          </div>
        )}
      </div>

      {mode === 'one' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-host-line p-4 sm:p-6">
          <h3 className="font-host-display text-2xl">New guest</h3>
          <GuestForm
            roles={roleList}
            submitLabel="Add guest"
            isPending={createOne.isPending}
            error={createOne.error}
            onSubmit={(input) => createOne.mutate(input, { onSuccess: close })}
            onCancel={close}
          />
        </div>
      )}

      {mode === 'paste' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-host-line p-4 sm:p-6">
          <h3 className="font-host-display text-2xl">Paste a list</h3>
          <PasteGuestsForm
            isPending={createMany.isPending}
            error={createMany.error}
            onSubmit={(names) => createMany.mutate(names, { onSuccess: close })}
            onCancel={close}
          />
        </div>
      )}

      {guests.isPending && <p>Loading guests…</p>}

      {guests.isError && (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-lg leading-normal">
            Unable to load the guests. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => guests.refetch()}
            className={BUTTON_QUIET}
          >
            Try again
          </button>
        </div>
      )}

      {guests.data && all.length === 0 && mode === 'idle' && (
        <p className="text-lg leading-normal">
          No guests yet. Add them one at a time, or paste your whole list.
        </p>
      )}

      {all.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div className="flex flex-col gap-2">
                <label htmlFor={searchId} className="font-medium">
                  Search guests
                </label>
                <input
                  id={searchId}
                  type="search"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters({ ...filters, search: event.target.value })
                  }
                  placeholder="Ana Reyes"
                  className={FIELD}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor={roleFilterId} className="font-medium">
                  Role
                </label>
                <select
                  id={roleFilterId}
                  value={filters.role}
                  onChange={(event) =>
                    setFilters({ ...filters, role: event.target.value })
                  }
                  className={SELECT}
                >
                  <option value="all">All roles</option>
                  <option value="none">No role</option>
                  {roleList.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              role="group"
              aria-label="Filter by reply"
              className="flex flex-wrap gap-3"
            >
              {REPLY_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filters.reply === option.value}
                  onClick={() =>
                    setFilters({ ...filters, reply: option.value })
                  }
                  className={CHIP}
                >
                  {option.label}
                  <span className="ms-2 tabular-nums">
                    {counts[option.value]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Announced to screen readers whenever the filters change the list. */}
          <p role="status" className="text-host-ink-soft tabular-nums">
            {filtering
              ? `Showing ${shown.length} of ${all.length} guests`
              : `${all.length} ${all.length === 1 ? 'guest' : 'guests'}`}
          </p>

          {shown.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-lg leading-normal">
                No guests match these filters.
              </p>
              <button
                type="button"
                onClick={() => setFilters(NO_FILTERS)}
                className={BUTTON_SMALL}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="flex flex-col">
              {shown.map((guest) => (
                <GuestRow
                  key={guest.id}
                  eventId={eventId}
                  guest={guest}
                  roles={roleList}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

// One line per guest. Editing opens the form in place; deleting is inside
// the edit view so the row itself stays short.
function GuestRow({
  eventId,
  guest,
  roles,
}: {
  eventId: string
  guest: GuestView
  roles: RoleView[]
}) {
  const [editing, setEditing] = useState(false)
  // 'failed' shows the link as text, so it can still be copied by hand.
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')
  const dialog = useRef<HTMLDialogElement>(null)
  const update = useUpdateGuestMutation(eventId, guest.id)
  const remove = useDeleteGuestMutation(eventId, guest.id)
  const role = roles.find((candidate) => candidate.id === guest.roleId)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/i/${guest.token}`,
      )
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  if (editing) {
    return (
      <li className="my-2 flex flex-col gap-6 rounded-2xl border border-host-line p-4 sm:p-6">
        <GuestForm
          roles={roles}
          initial={{
            name: guest.name,
            roleId: guest.roleId,
            personalNote: guest.personalNote,
          }}
          submitLabel="Save guest"
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

        <div className="flex flex-col items-start gap-3 border-t border-host-line pt-6">
          <p className="leading-normal text-host-ink-soft">
            Deleting a guest stops their link and deletes their reply.
          </p>
          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            className={BUTTON_DANGER}
          >
            Delete guest
          </button>
        </div>

        <dialog
          ref={dialog}
          aria-labelledby={`delete-guest-${guest.id}`}
          className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-host-line bg-host-ground p-6 text-host-ink backdrop:bg-black/70 sm:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 id={`delete-guest-${guest.id}`} className={HEADING}>
                Delete “{guest.name}”?
              </h3>
              <p className="text-lg leading-normal text-host-ink-soft">
                Their link stops working and their reply is deleted. This cannot
                be undone.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(undefined)}
                className={BUTTON_DANGER}
              >
                {remove.isPending ? 'Deleting…' : 'Delete guest'}
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
                  : 'Unable to delete the guest. Check your connection and try again.'}
              </p>
            )}
          </div>
        </dialog>
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-2 border-t border-host-line py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 basis-40 text-lg font-medium">
          <bdi>{guest.name}</bdi>
        </p>
        <p className="basis-32 text-host-ink-soft">
          {role ? role.title : 'No role'}
        </p>
        <p className="basis-24">
          {guest.reply ? REPLY_LABEL[guest.reply.answer] : 'No reply yet'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            aria-label={`Copy link for ${guest.name}`}
            className={BUTTON_SMALL}
          >
            {copy === 'copied' ? 'Copied' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${guest.name}`}
            className={BUTTON_SMALL}
          >
            Edit
          </button>
        </div>
      </div>

      {guest.reply?.message && <ReplyMessage message={guest.reply.message} />}

      {/* Always in the page, so screen readers announce it when it fills. */}
      <p role="status" className="sr-only">
        {copy === 'copied' ? `Link for ${guest.name} copied` : ''}
      </p>
      {copy === 'failed' && (
        <label className="flex flex-col gap-2">
          <span className="leading-normal">
            Unable to copy automatically. Select this link and copy it:
          </span>
          <input
            readOnly
            value={`${window.location.origin}/i/${guest.token}`}
            onFocus={(event) => event.target.select()}
            className={FIELD}
          />
        </label>
      )}
    </li>
  )
}

// Messages longer than this are shortened until the host asks for the rest.
const LONG_MESSAGE = 90

// A guest's message under their row. A long one shows its first part with a
// button to read all of it, so one guest cannot stretch the list.
function ReplyMessage({ message }: { message: string }) {
  const [open, setOpen] = useState(false)
  const long = message.length > LONG_MESSAGE
  const shown =
    long && !open ? `${message.slice(0, LONG_MESSAGE).trimEnd()}…` : message

  return (
    <p className="leading-normal wrap-anywhere text-host-ink-soft">
      “{shown}”
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="ms-2 inline-flex min-h-6 items-center text-host-ink underline underline-offset-4 hover:text-host-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent"
        >
          {open ? 'Show less' : 'Show full message'}
        </button>
      )}
    </p>
  )
}
