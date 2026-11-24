'use client'

import { useId, useState } from 'react'
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

type Props = {
  token: string
  initialReply: Reply | null
  replyOpen: boolean
}

export function RsvpForm({ token, initialReply, replyOpen }: Props) {
  const messageId = useId()
  const [answer, setAnswer] = useState<RsvpAnswer | null>(
    initialReply?.answer ?? null,
  )
  const [message, setMessage] = useState(initialReply?.message ?? '')
  const [hasReply, setHasReply] = useState(initialReply !== null)
  const [justSaved, setJustSaved] = useState(false)
  const saveRsvp = useSaveRsvpMutation(token)

  if (!replyOpen) {
    const earlier = ANSWERS.find(
      (option) => option.value === initialReply?.answer,
    )
    return (
      <div className="flex flex-col gap-1">
        <p className="font-medium">Replies are closed</p>
        <p className="text-sm leading-normal text-ink-soft">
          {earlier
            ? `Your reply was: ${earlier.label}.`
            : 'Contact the host if you still need to reply.'}
        </p>
      </div>
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!answer) return
    saveRsvp.mutate(
      { answer, message },
      {
        onSuccess: () => {
          setHasReply(true)
          setJustSaved(true)
        },
      },
    )
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
                onClick={() => {
                  setAnswer(option.value)
                  setJustSaved(false)
                }}
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
          onChange={(event) => {
            setMessage(event.target.value)
            setJustSaved(false)
          }}
          className={`min-h-24 w-full rounded-(--inner-radius) border border-line bg-transparent px-3 py-2 text-base leading-normal placeholder:text-ink-soft ${FOCUS_RING}`}
          placeholder="Can't wait to celebrate with you"
        />
        <p className="text-sm text-ink-soft tabular-nums">
          {message.length} of {MESSAGE_LIMIT} characters
        </p>
      </div>

      <button
        type="submit"
        disabled={!answer || saveRsvp.isPending}
        className={`min-h-11 rounded-(--inner-radius) bg-accent px-5 py-2 font-medium text-button-ink transition-[opacity,scale] duration-150 ease-out enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
      >
        {saveRsvp.isPending
          ? 'Sending…'
          : hasReply
            ? 'Update my reply'
            : 'Send my reply'}
      </button>

      {/* Always in the page, so screen readers announce the text when it appears. */}
      <p role="status" className="text-sm leading-normal empty:hidden">
        {justSaved && !saveRsvp.isPending
          ? 'Reply saved. You can change it until the reply-by date.'
          : ''}
      </p>
      {saveRsvp.isError && (
        <p role="alert" className="text-sm leading-normal">
          {errorText}
        </p>
      )}
    </form>
  )
}
