import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { contrastRatio } from '#/lib/contrast'
import { resolveDesign } from '#/lib/resolve-design'
import { BODY_FONTS, DISPLAY_FONTS } from '#/server/config/fonts'
import { getTheme, listThemes } from '#/server/config/themes'
import { createEvent } from '#/server/services/event.service'
import { updateDesign } from '#/server/services/design.service'
import { designInputSchema } from '#/server/validation/design.schema'
import { fakeEventRepository, fakeUserRepository, OWNER } from './fakes'

const themes = listThemes('wedding')
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

it('offers twelve themes, each with its own key and name', () => {
  expect(themes).toHaveLength(12)
  expect(new Set(themes.map((theme) => theme.key)).size).toBe(12)
  expect(new Set(themes.map((theme) => theme.name)).size).toBe(12)
})

it('every theme keeps its text readable on its own background', () => {
  for (const { key, palette } of themes) {
    expect(
      contrastRatio(palette.ink, palette.ground),
      `${key} ink`,
    ).toBeGreaterThanOrEqual(7)
    expect(
      contrastRatio(palette.inkSoft, palette.ground),
      `${key} soft ink`,
    ).toBeGreaterThanOrEqual(4.5)
  }
})

it('offers plenty of fonts, with no font in a list twice', () => {
  expect(DISPLAY_FONTS.length).toBeGreaterThanOrEqual(18)
  expect(BODY_FONTS.length).toBeGreaterThanOrEqual(10)
  expect(new Set(DISPLAY_FONTS).size).toBe(DISPLAY_FONTS.length)
  expect(new Set(BODY_FONTS).size).toBe(BODY_FONTS.length)
})

it('every font a theme or the library names is loaded by the app', () => {
  const loaded = readFileSync('src/app/fonts.ts', 'utf8')
  const named = new Set([
    ...DISPLAY_FONTS,
    ...BODY_FONTS,
    ...themes.flatMap((theme) => [
      theme.labelFont,
      ...theme.fontPairs.flatMap((pair) => [pair.display, pair.body]),
    ]),
  ])
  for (const font of named) {
    expect(loaded, font).toContain(`'--font-${slug(font)}'`)
  }
})

it("every theme's suggested fonts are in the library", () => {
  for (const theme of themes) {
    for (const pair of theme.fontPairs) {
      expect(DISPLAY_FONTS, `${theme.key} ${pair.display}`).toContain(
        pair.display,
      )
      expect(BODY_FONTS, `${theme.key} ${pair.body}`).toContain(pair.body)
    }
  }
})

it('a host can pick the heading and text fonts separately', () => {
  const theme = getTheme('black-and-white')
  const design = resolveDesign(theme, {
    displayFont: 'Great Vibes',
    bodyFont: 'Lato',
  })
  expect(design.fonts).toEqual({ display: 'Great Vibes', body: 'Lato' })
  // Picking only one keeps the theme's own font for the other.
  expect(resolveDesign(theme, { bodyFont: 'Lato' }).fonts).toEqual({
    display: theme.fontPairs[0].display,
    body: 'Lato',
  })
})

it('a font that is not in the library falls back to the theme', () => {
  const theme = getTheme('black-and-white')
  const design = resolveDesign(theme, { displayFont: 'Comic Sans MS; x' })
  expect(design.fonts).toEqual(theme.fontPairs[0])
})

async function newEvent() {
  const events = fakeEventRepository()
  const event = await createEvent(
    { id: OWNER, email: 'mika@example.com' },
    {
      type: 'wedding',
      title: 'M & P',
      eventDate: '2027-06-12',
      replyBy: '2027-03-31',
      themeKey: 'black-and-white',
    },
    { events, users: fakeUserRepository() },
  )
  return { events, id: event.id }
}

it('saves picked fonts, and null puts the theme’s own back', async () => {
  const { events, id } = await newEvent()
  const saved = await updateDesign(
    OWNER,
    id,
    { displayFont: 'Cinzel', bodyFont: 'Inter' },
    events,
  )
  expect(saved.design).toMatchObject({
    displayFont: 'Cinzel',
    bodyFont: 'Inter',
  })

  const reset = await updateDesign(
    OWNER,
    id,
    { displayFont: null, bodyFont: null },
    events,
  )
  expect(reset.design).toEqual({})
})

it('refuses a font outside the library', async () => {
  const { events, id } = await newEvent()
  await expect(
    updateDesign(OWNER, id, { displayFont: 'Papyrus' }, events),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
  // A text font cannot be used as a heading font's stand-in for raw CSS.
  expect(
    designInputSchema.safeParse({ bodyFont: 'x'.repeat(41) }).success,
  ).toBe(false)
})

it('switching theme starts from the new theme’s own fonts', async () => {
  const { events, id } = await newEvent()
  await updateDesign(OWNER, id, { displayFont: 'Cinzel' }, events)
  const switched = await updateDesign(OWNER, id, { themeKey: 'rustic' }, events)
  expect(switched.design).toEqual({})
})

it('every theme can be used for a birthday too', () => {
  expect(listThemes('birthday')).toHaveLength(12)
})
