'use client'

import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '#/lib/api'
import { useSaveRsvpMutation } from '../invite.query'
import type { Reply, RsvpAnswer } from '../invite.types'

const MESSAGE_LIMIT = 300

const ANSWERS: { value: RsvpAnswer; label: string }[] = [
  { value: 'going', label: "I'll be there" },
  { value: 'not_going', label: "I can't make it" },
]

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

const QUIET_BUTTON = `min-h-11 rounded-(--inner-radius) border border-line px-5 py-2 font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-ink/5 active:scale-[0.96] ${FOCUS_RING}`

function answerLabel(answer: RsvpAnswer): string {
  return ANSWERS.find((option) => option.value === answer)!.label
}

type Props = {
  token: string
  initialReply: Reply | null
  replyOpen: boolean
}

// The reply part of an invitation. A guest who has not replied sees the form.
// Once they have, they see their reply instead, and change it in a dialog.
export function RsvpForm({ token, initialReply, replyOpen }: Props) {
  const [reply, setReply] = useState(initialReply)
  const [justSaved, setJustSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  function saved(next: Reply) {
    setReply(next)
    setJustSaved(true)
    dialog.current?.close()
  }

  if (!replyOpen) {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-medium">Replies are closed</p>
        <p className="text-sm leading-normal text-ink-soft">
          {reply
            ? `Your reply was: ${answerLabel(reply.answer)}.`
            : 'Contact the host if you still need to reply.'}
        </p>
      </div>
    )
  }

  if (!reply) {
    return (
      <ReplyFields
        token={token}
        initial={null}
        submitLabel="Send my reply"
        onSaved={saved}
      />
    )
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-medium">Your reply</h3>
        <p className="text-2xl leading-tight [font-family:var(--font-display)]">
          {/* The mark means the answer is not shown by wording alone. */}
          <span aria-hidden="true">
            {reply.answer === 'going' ? '✓ ' : '✕ '}
          </span>
          {answerLabel(reply.answer)}
        </p>
        {reply.message && (
          <p className="leading-normal wrap-anywhere text-ink-soft">
            “{reply.message}”
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setJustSaved(false)
          setEditing(true)
          dialog.current?.showModal()
        }}
        className={QUIET_BUTTON}
      >
        Change my reply
      </button>

      {/* Always in the page, so screen readers announce the text when it appears. */}
      <p role="status" className="text-sm leading-normal empty:hidden">
        {justSaved
          ? 'Reply saved. You can change it until the reply-by date.'
          : ''}
      </p>

      {/* A native dialog: it traps focus, closes on Escape and returns focus
          to the button that opened it. The form is only inside while open, so
          it always starts from the saved reply. */}
      <dialog
        ref={dialog}
        aria-labelledby="change-reply-title"
        onClose={() => setEditing(false)}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-(--panel-radius) border border-line bg-ground p-5 text-ink backdrop:bg-black/70"
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <h3
              id="change-reply-title"
              className="text-2xl leading-tight [font-family:var(--font-display)]"
            >
              Change your reply
            </h3>
            <ReplyFields
              token={token}
              initial={reply}
              submitLabel="Update my reply"
              onSaved={saved}
              onCancel={() => dialog.current?.close()}
            />
          </div>
        )}
      </dialog>
    </div>
  )
}

// The answer buttons, the message box and the send button.
function ReplyFields({
  token,
  initial,
  submitLabel,
  onSaved,
  onCancel,
}: {
  token: string
  initial: Reply | null
  submitLabel: string
  onSaved: (reply: Reply) => void
  onCancel?: () => void
}) {
  const messageId = useId()
  const [answer, setAnswer] = useState<RsvpAnswer | null>(
    initial?.answer ?? null,
  )
  const [message, setMessage] = useState(initial?.message ?? '')
  const saveRsvp = useSaveRsvpMutation(token)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!answer) return
    saveRsvp.mutate({ answer, message }, { onSuccess: onSaved })
  }

  // Our API's own messages are written for guests; anything else is most
  // likely a dropped connection.
  const errorText =
    saveRsvp.error instanceof ApiError
      ? saveRsvp.error.message
      : 'Unable to send your reply. Check your connection and try again.'

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Will you be there?</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ANSWERS.map((option) => {
            const chosen = answer === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={chosen}
                onClick={() => setAnswer(option.value)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-(--inner-radius) border px-4 py-2 transition-[background-color,border-color,scale] duration-150 ease-out active:scale-[0.96] ${FOCUS_RING} ${
                  chosen
                    ? 'border-ink bg-ink/15 font-medium'
                    : 'border-line hover:bg-ink/5'
                }`}
              >
                {/* The check mark means the choice is not shown by color alone. */}
                {chosen && <span aria-hidden="true">✓</span>}
                {option.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={messageId} className="font-medium">
          Message (optional)
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={3}
          maxLength={MESSAGE_LIMIT}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`min-h-24 w-full rounded-(--inner-radius) border border-line bg-transparent px-3 py-2 text-base leading-normal placeholder:text-ink-soft ${FOCUS_RING}`}
          placeholder="Can't wait to celebrate with you"
        />
        <p className="text-sm text-ink-soft tabular-nums">
          {message.length} of {MESSAGE_LIMIT} characters
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={!answer || saveRsvp.isPending}
          className={`min-h-11 flex-1 rounded-(--inner-radius) bg-accent px-5 py-2 font-medium text-button-ink transition-[opacity,scale] duration-150 ease-out enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
        >
          {saveRsvp.isPending ? 'Sending…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={QUIET_BUTTON}>
            Cancel
          </button>
        )}
      </div>

      {saveRsvp.isError && (
        <p role="alert" className="text-sm leading-normal">
          {errorText}
        </p>
      )}
    </form>
  )
}
