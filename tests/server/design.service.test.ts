import { expect, it } from 'vitest'
import { getTheme, listThemes } from '#/server/config/themes'
import { AppError } from '#/server/errors'
import { resolveDesign } from '#/server/services/design.service'

it('uses the first font pair by default', () => {
  expect(resolveDesign(getTheme('bohemian'), {}).fonts.display).toBe('Italiana')
})

it('applies an accent override and nothing else', () => {
  const d = resolveDesign(getTheme('art-deco'), { accent: '#ff0000' })
  expect(d.palette.accent).toBe('#ff0000')
  expect(d.palette.ground).toBe('#0b0c10')
})

it('does not change the theme itself when overriding', () => {
  resolveDesign(getTheme('art-deco'), { accent: '#ff0000', overlay: 0.1 })
  expect(getTheme('art-deco').palette.accent).toBe('#d9b86c')
  expect(getTheme('art-deco').photo.overlay).toBe(0.6)
})

it('ignores a font pair index the theme does not have', () => {
  expect(
    resolveDesign(getTheme('bohemian'), { fontPairIndex: 9 }).fonts.display,
  ).toBe('Italiana')
})

it('clamps overlay to 0..0.9', () => {
  expect(
    resolveDesign(getTheme('black-and-white'), { overlay: 5 }).photo.overlay,
  ).toBe(0.9)
  expect(
    resolveDesign(getTheme('black-and-white'), { overlay: -1 }).photo.overlay,
  ).toBe(0)
})

it('lists twelve wedding themes', () => {
  expect(listThemes('wedding')).toHaveLength(12)
})

it('rejects an unknown theme', () => {
  expect(() => getTheme('nope')).toThrow(AppError)
  // Names every object has must not be mistaken for themes.
  expect(() => getTheme('toString')).toThrow(AppError)
})
