import { LIMITS } from '#/server/validation/sections.schema'
import { PhotoPicker } from '../PhotoPicker'
import { AreaField, ListEditor, TextField } from '../fields'
import type { FormProps } from './types'

type Payment = FormProps<'gifts'>['content']['payments'][number]

export function GiftsForm({
  id,
  content,
  onChange,
  eventId,
  photos,
}: FormProps<'gifts'>) {
  return (
    <>
      <AreaField
        id={`${id}-intro`}
        label="Introduction"
        value={content.intro}
        maxLength={1200}
        onChange={(intro) => onChange({ ...content, intro })}
      />

      <ListEditor
        legend="Gift ideas"
        items={content.ideas}
        max={LIMITS.giftIdeas}
        newItem={() => ({ title: '', note: '' })}
        addLabel="Add a gift idea"
        itemName={(index) =>
          content.ideas[index]?.title || `gift idea ${index + 1}`
        }
        onChange={(ideas) => onChange({ ...content, ideas })}
      >
        {(idea, change, index) => (
          <>
            <TextField
              id={`${id}-idea-${index}-title`}
              label="Gift idea"
              value={idea.title}
              maxLength={80}
              onChange={(title) => change({ ...idea, title })}
            />
            <TextField
              id={`${id}-idea-${index}-note`}
              label="Note"
              value={idea.note}
              maxLength={120}
              onChange={(note) => change({ ...idea, note })}
            />
          </>
        )}
      </ListEditor>

      <ListEditor
        legend="Where to send a monetary gift"
        items={content.payments}
        max={LIMITS.payments}
        newItem={(): Payment => ({
          label: '',
          accountName: '',
          accountNumber: '',
        })}
        addLabel="Add a payment option"
        itemName={(index) =>
          content.payments[index]?.label || `payment option ${index + 1}`
        }
        onChange={(payments) => onChange({ ...content, payments })}
      >
        {(payment, change, index) => (
          <>
            <TextField
              id={`${id}-pay-${index}-label`}
              label="Name of the service"
              value={payment.label}
              maxLength={80}
              placeholder="GCash"
              onChange={(label) => change({ ...payment, label })}
            />
            <TextField
              id={`${id}-pay-${index}-name`}
              label="Account name"
              value={payment.accountName}
              maxLength={120}
              onChange={(accountName) => change({ ...payment, accountName })}
            />
            <TextField
              id={`${id}-pay-${index}-number`}
              label="Account or mobile number"
              hint="Shown to every guest who opens the invitation."
              value={payment.accountNumber}
              maxLength={40}
              onChange={(accountNumber) =>
                change({ ...payment, accountNumber })
              }
            />
            <PhotoPicker
              eventId={eventId}
              photos={photos}
              label="QR code"
              use="qr"
              value={payment.qrAssetId}
              onChange={(qrAssetId) => change({ ...payment, qrAssetId })}
            />
          </>
        )}
      </ListEditor>

      <AreaField
        id={`${id}-closing`}
        label="Closing line"
        value={content.closing}
        maxLength={1200}
        onChange={(closing) => onChange({ ...content, closing })}
      />
    </>
  )
}
