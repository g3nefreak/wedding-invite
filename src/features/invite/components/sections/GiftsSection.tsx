import type { SectionView } from '#/lib/sections'
import {
  CARD_HALF,
  CARD_ROW,
  LABEL,
  Prose,
  SectionPhoto,
  SectionShell,
} from './parts'

type Content = Extract<SectionView, { type: 'gifts' }>['content']

// Gift ideas and, when the host wants, where a monetary gift can be sent.
// It only shows details; nothing is paid through the invitation.
export function GiftsSection({ content }: { content: Content }) {
  return (
    <SectionShell type="gifts" heading="Gift guide">
      <Prose text={content.intro} />

      {content.ideas.length > 0 && (
        <ul className={CARD_ROW}>
          {content.ideas.map((idea, index) => (
            <li
              key={index}
              className={`${CARD_HALF} flex flex-col gap-1 rounded-(--inner-radius) border border-line px-4 py-3`}
            >
              <span className="text-lg leading-snug break-words">
                {idea.title}
              </span>
              {idea.note && (
                <span className="leading-normal break-words text-ink-soft">
                  {idea.note}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {content.payments.length > 0 && (
        <ul className={CARD_ROW}>
          {content.payments.map((payment, index) => (
            <li
              key={index}
              className={`${CARD_HALF} flex flex-col gap-2 rounded-(--inner-radius) border border-line bg-panel px-4 py-4`}
            >
              {payment.label && <span className={LABEL}>{payment.label}</span>}
              {payment.qr && (
                // White behind the code, so a phone camera can always read it.
                <div className="rounded-(--inner-radius) bg-white p-2 [align-self:var(--justify)]">
                  <SectionPhoto
                    photo={payment.qr}
                    alt={`QR code for ${payment.label || 'sending a gift'}`}
                    className="max-w-48"
                    contain
                  />
                </div>
              )}
              {payment.accountName && (
                <span className="leading-snug break-words">
                  {payment.accountName}
                </span>
              )}
              {payment.accountNumber && (
                <span className="text-lg leading-snug break-words tabular-nums">
                  {payment.accountNumber}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Prose text={content.closing} soft />
    </SectionShell>
  )
}
