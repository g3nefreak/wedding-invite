import { isAllowedMapUrl, LIMITS } from '#/server/validation/sections.schema'
import { ListEditor, TextField } from '../fields'
import type { FormProps } from './types'

export function WhenWhereForm({
  id,
  content,
  onChange,
}: FormProps<'whenWhere'>) {
  return (
    <ListEditor
      legend="Places"
      items={content.places}
      max={LIMITS.places}
      newItem={() => ({
        label: '',
        venue: '',
        time: '',
        address: '',
        mapUrl: '',
      })}
      addLabel="Add a place"
      itemName={(index) => content.places[index]?.label || `place ${index + 1}`}
      onChange={(places) => onChange({ places })}
    >
      {(place, change, index) => {
        const linkProblem =
          place.mapUrl.trim() !== '' && !isAllowedMapUrl(place.mapUrl.trim())
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={`${id}-place-${index}-label`}
                label="What happens here"
                value={place.label}
                maxLength={80}
                placeholder="Ceremony"
                onChange={(label) => change({ ...place, label })}
              />
              <TextField
                id={`${id}-place-${index}-time`}
                label="Time"
                hint={
                  index === 0
                    ? 'Write it like 2:00 PM so the countdown can use it.'
                    : undefined
                }
                value={place.time}
                maxLength={40}
                placeholder="2:00 PM"
                onChange={(time) => change({ ...place, time })}
              />
            </div>
            <TextField
              id={`${id}-place-${index}-venue`}
              label="Venue"
              value={place.venue}
              maxLength={120}
              placeholder="San Agustin Church"
              onChange={(venue) => change({ ...place, venue })}
            />
            <TextField
              id={`${id}-place-${index}-address`}
              label="Address"
              value={place.address}
              maxLength={120}
              onChange={(address) => change({ ...place, address })}
            />
            <TextField
              id={`${id}-place-${index}-map`}
              label="Map link"
              hint="Paste a share link from Google Maps or Waze."
              error={
                linkProblem
                  ? 'Use a link from Google Maps or Waze that starts with https://'
                  : undefined
              }
              value={place.mapUrl}
              maxLength={500}
              onChange={(mapUrl) => change({ ...place, mapUrl })}
            />
          </>
        )
      }}
    </ListEditor>
  )
}
