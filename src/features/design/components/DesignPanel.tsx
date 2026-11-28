'use client'

import { useRef, useState } from 'react'
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  BUTTON_SMALL,
  CARD,
  ERROR_TEXT,
  LABEL,
  SELECT,
} from '#/components/host-styles'
import { useThemesQuery } from '#/features/events/events.query'
import type { EventView, ThemeOption } from '#/features/events/events.types'
import { ApiError } from '#/lib/api'
import { contrastRatio, READABLE_CONTRAST } from '#/lib/contrast'
import { MAX_OVERLAY } from '#/lib/resolve-design'
import { BODY_FONTS, DISPLAY_FONTS } from '#/server/config/fonts'
import {
  useRemovePhotoMutation,
  useUpdateDesignMutation,
  useUploadPhotoMutation,
} from '../design.query'
import { DesignPreview } from './DesignPreview'

const HEADING = 'font-host-display text-3xl leading-tight font-medium'
const LEGEND = 'mb-3 text-lg font-medium'

// A choice shown as a card. The real control is the radio input inside, so
// keyboard and screen readers get normal radio-group behavior.
const CHOICE =
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-host-line px-4 py-2 has-checked:border-host-accent has-checked:bg-host-ground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-host-accent'

// Turns "Bodoni Moda" into the CSS variable its font is loaded under.
function fontFamily(name: string): string {
  return `var(--font-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}), serif`
}

// The Design tab of an event's page.
export function DesignPanel({ event }: { event: EventView }) {
  const themes = useThemesQuery(event.type)

  if (themes.isPending) return <p>Loading the design options…</p>

  if (themes.isError) {
    return (
      <div role="alert" className={`${CARD} flex flex-col items-start gap-4`}>
        <p className="text-lg leading-normal">
          Unable to load the design options. Check your connection and try
          again.
        </p>
        <button
          type="button"
          onClick={() => themes.refetch()}
          className={BUTTON_QUIET}
        >
          Try again
        </button>
      </div>
    )
  }

  return <DesignEditor event={event} themes={themes.data} />
}

function DesignEditor({
  event,
  themes,
}: {
  event: EventView
  themes: ThemeOption[]
}) {
  // What is being tried out. Nothing reaches guests until it is saved.
  const [themeKey, setThemeKey] = useState(event.themeKey)
  const [accent, setAccent] = useState<string | null>(
    event.design.accent ?? null,
  )
  // The fonts in use: picked on their own, or the saved suggested pair.
  const [fonts, setFonts] = useState(() => {
    const saved =
      themes.find((item) => item.key === event.themeKey) ?? themes[0]
    const pair =
      saved.fontPairs[event.design.fontPairIndex ?? 0] ?? saved.fontPairs[0]
    return {
      display: event.design.displayFont ?? pair.display,
      body: event.design.bodyFont ?? pair.body,
    }
  })
  const [overlay, setOverlay] = useState<number | null>(
    event.design.overlay ?? null,
  )
  const [justSaved, setJustSaved] = useState(false)
  const save = useUpdateDesignMutation(event.id)

  const theme = themes.find((item) => item.key === themeKey) ?? themes[0]
  const shownAccent = accent ?? theme.palette.accent
  const custom = !theme.accents.includes(shownAccent)
  const readable =
    contrastRatio(shownAccent, theme.palette.buttonInk) >= READABLE_CONTRAST

  function change(apply: () => void) {
    setJustSaved(false)
    save.reset()
    apply()
  }

  function pickTheme(key: string) {
    change(() => {
      setThemeKey(key)
      // Colors and font pairs belong to a theme, so start from its defaults.
      setAccent(null)
      const next = themes.find((item) => item.key === key) ?? themes[0]
      setFonts({ ...next.fontPairs[0] })
    })
  }

  // Which of the theme's suggested pairs is in use, if any.
  const pairIndex = theme.fontPairs.findIndex(
    (pair) => pair.display === fonts.display && pair.body === fonts.body,
  )

  function submit() {
    const suggested = pairIndex !== -1
    save.mutate(
      {
        themeKey,
        // null means "use the theme's own".
        accent: accent === theme.palette.accent ? null : accent,
        // A suggested pair is saved by its place in the theme's list; fonts
        // mixed by hand are saved by name.
        fontPairIndex: suggested && pairIndex !== 0 ? pairIndex : null,
        displayFont: suggested ? null : fonts.display,
        bodyFont: suggested ? null : fonts.body,
        overlay,
      },
      { onSuccess: () => setJustSaved(true) },
    )
  }

  return (
    <section className={`${CARD} flex flex-col gap-6`}>
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>Design</h2>
        <p className="max-w-[56ch] text-lg leading-normal text-host-ink-soft">
          Try out a look in the preview. Guests see it once you save.
        </p>
      </div>

      {/* `data-wide` lets this tab use the whole window, like the Invitation
          tab: the choices keep a reading width, the preview takes the rest. */}
      <div
        data-wide
        className="grid items-start gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] xl:gap-12"
      >
        <form
          onSubmit={(formEvent) => {
            formEvent.preventDefault()
            submit()
          }}
          className="flex flex-col gap-8"
        >
          <fieldset>
            <legend className={LEGEND}>Theme</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {themes.map((item) => (
                <label key={item.key} className={CHOICE}>
                  <input
                    type="radio"
                    name="theme"
                    checked={item.key === themeKey}
                    onChange={() => pickTheme(item.key)}
                    className="sr-only"
                  />
                  {/* A small sample of the theme's background and accent. */}
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-host-line"
                    style={{ backgroundColor: item.palette.ground }}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: item.palette.accent }}
                    />
                  </span>
                  {item.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={LEGEND}>Accent color</legend>
            <div className="flex flex-wrap items-center gap-3">
              {theme.accents.map((swatch, index) => (
                <label
                  key={swatch}
                  className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-host-line has-checked:border-2 has-checked:border-host-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-host-accent"
                >
                  <input
                    type="radio"
                    name="accent"
                    checked={shownAccent === swatch}
                    onChange={() => change(() => setAccent(swatch))}
                    aria-label={
                      index === 0 ? `Theme color ${swatch}` : `Color ${swatch}`
                    }
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="size-8 rounded-full"
                    style={{ backgroundColor: swatch }}
                  />
                </label>
              ))}

              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-full border border-host-line py-1 ps-2 pe-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-host-accent">
                <input
                  type="color"
                  value={shownAccent}
                  onChange={(inputEvent) =>
                    change(() => setAccent(inputEvent.target.value))
                  }
                  className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
                {custom ? `Custom ${shownAccent}` : 'Custom color'}
              </label>
            </div>
            {!readable && (
              <p className="mt-3 max-w-[56ch] leading-normal">
                The button text will be hard to read on this color. Pick a{' '}
                {contrastRatio(theme.palette.buttonInk, '#ffffff') > 4.5
                  ? 'lighter'
                  : 'darker'}{' '}
                color, or use one of the swatches.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className={LEGEND}>Fonts</legend>
            <p className="mb-3 text-host-ink-soft">Suggested for this theme</p>
            <div className="flex flex-col gap-3">
              {theme.fontPairs.map((pair, index) => (
                <label key={pair.display + pair.body} className={CHOICE}>
                  <input
                    type="radio"
                    name="fonts"
                    checked={index === pairIndex}
                    onChange={() => change(() => setFonts({ ...pair }))}
                    className="sr-only"
                  />
                  <span className="flex flex-col">
                    <span
                      className="text-2xl leading-tight"
                      style={{ fontFamily: fontFamily(pair.display) }}
                    >
                      {pair.display}
                    </span>
                    <span
                      className="text-host-ink-soft"
                      style={{ fontFamily: fontFamily(pair.body) }}
                    >
                      with {pair.body} for text
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-6 mb-3 text-host-ink-soft">
              Or mix your own from {DISPLAY_FONTS.length} heading fonts and{' '}
              {BODY_FONTS.length} text fonts
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="display-font" className={LABEL}>
                  Heading font
                </label>
                <select
                  id="display-font"
                  value={fonts.display}
                  onChange={(event) =>
                    change(() =>
                      setFonts({ ...fonts, display: event.target.value }),
                    )
                  }
                  className={SELECT}
                >
                  {DISPLAY_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                {/* A sample, since a dropdown cannot show each font itself. */}
                <p
                  aria-hidden="true"
                  className="text-3xl leading-tight break-words"
                  style={{ fontFamily: fontFamily(fonts.display) }}
                >
                  {event.title}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="body-font" className={LABEL}>
                  Text font
                </label>
                <select
                  id="body-font"
                  value={fonts.body}
                  onChange={(event) =>
                    change(() =>
                      setFonts({ ...fonts, body: event.target.value }),
                    )
                  }
                  className={SELECT}
                >
                  {BODY_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <p
                  aria-hidden="true"
                  className="leading-normal text-host-ink-soft"
                  style={{ fontFamily: fontFamily(fonts.body) }}
                >
                  We would love for you to join us on our special day.
                </p>
              </div>
            </div>
          </fieldset>

          <PhotoField event={event} />

          {event.backgroundUrl && (
            <div className="flex flex-col gap-3">
              <label htmlFor="overlay" className="text-lg font-medium">
                Photo darkness
              </label>
              <p id="overlay-hint" className="text-host-ink-soft">
                How strongly the theme color covers the photo. Higher keeps the
                text easier to read.
              </p>
              <input
                id="overlay"
                type="range"
                min={0}
                max={MAX_OVERLAY}
                step={0.05}
                value={overlay ?? theme.photo.overlay}
                onChange={(inputEvent) =>
                  change(() => setOverlay(Number(inputEvent.target.value)))
                }
                aria-describedby="overlay-hint"
                className="min-h-11 w-full accent-host-accent"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={save.isPending}
              className={BUTTON_PRIMARY}
            >
              {save.isPending ? 'Saving…' : 'Save design'}
            </button>
            {/* Always in the page, so screen readers announce it when it fills. */}
            <p role="status" className="text-lg empty:hidden">
              {justSaved && !save.isPending ? 'Design saved' : ''}
            </p>
          </div>

          {save.isError && (
            <p role="alert" className={ERROR_TEXT}>
              {save.error instanceof ApiError
                ? save.error.message
                : 'Unable to save the design. Check your connection and try again.'}
            </p>
          )}
        </form>

        <DesignPreview
          event={event}
          theme={theme}
          accent={accent}
          fonts={fonts}
          overlay={overlay}
        />
      </div>
    </section>
  )
}

// Upload, replace or remove the background photo. Unlike the other choices,
// a photo change is saved the moment it happens.
function PhotoField({ event }: { event: EventView }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadPhotoMutation(event.id)
  const remove = useRemovePhotoMutation(event.id)
  const busy = upload.isPending || remove.isPending
  const failed = upload.error ?? remove.error

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-medium">Background photo</h3>
      <p id="photo-hint" className="max-w-[56ch] text-host-ink-soft">
        Your own picture behind the invitation. JPEG, PNG or WebP. A photo is
        saved as soon as it is uploaded or removed.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        {event.backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.backgroundUrl}
            alt="Current background photo"
            className="h-20 w-32 rounded-xl border border-host-line object-cover"
          />
        )}

        {/* The file input is hidden; the button below opens it, so it looks
            like the other buttons and still works with the keyboard. */}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(inputEvent) => {
            const file = inputEvent.target.files?.[0]
            // Cleared so picking the same file again still counts as a change.
            inputEvent.target.value = ''
            if (!file) return
            remove.reset()
            upload.mutate(file)
          }}
        />
        <button
          type="button"
          disabled={busy}
          aria-describedby="photo-hint"
          onClick={() => input.current?.click()}
          className={BUTTON_SMALL}
        >
          {upload.isPending
            ? 'Uploading…'
            : event.backgroundUrl
              ? 'Replace photo'
              : 'Upload a photo'}
        </button>
        {event.backgroundUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              upload.reset()
              remove.mutate()
            }}
            className={BUTTON_SMALL}
          >
            {remove.isPending ? 'Removing…' : 'Remove photo'}
          </button>
        )}
      </div>

      {/* Always in the page, so screen readers announce it when it fills. */}
      <p role="status" className="empty:hidden">
        {upload.isSuccess && !busy ? 'Photo uploaded' : ''}
        {remove.isSuccess && !busy ? 'Photo removed' : ''}
      </p>

      {failed != null && !busy && (
        <p role="alert" className={ERROR_TEXT}>
          {failed instanceof ApiError
            ? failed.message
            : 'Unable to change the photo. Check your connection and try again.'}
        </p>
      )}
    </div>
  )
}
