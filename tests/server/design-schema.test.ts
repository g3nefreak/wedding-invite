import { expect, it } from 'vitest'
import { contrastRatio } from '#/lib/contrast'
import { listThemes } from '#/server/config/themes'
import { designInputSchema } from '#/server/validation/design.schema'

it('accepts only a plain hex color as the accent', () => {
  expect(designInputSchema.safeParse({ accent: '#A1b2C3' }).success).toBe(true)
  for (const bad of [
    'red',
    '#fff',
    'url(javascript:alert(1))',
    '#12345g',
    '#123456; background: red',
  ]) {
    expect(designInputSchema.safeParse({ accent: bad }).success).toBe(false)
  }
})

it('rejects raw CSS, HTML and unknown fields', () => {
  for (const bad of [
    { css: 'body{display:none}' },
    { html: '<b>x</b>' },
    { ground: '#000000' },
    { fontPairIndex: 1.5 },
    { fontPairIndex: -1 },
  ]) {
    expect(designInputSchema.safeParse(bad).success).toBe(false)
  }
})

it('measures contrast the standard way', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  expect(contrastRatio('#ffffff', '#ffffff')).toBe(1)
})

it('every theme offers three font pairs and readable accent swatches', () => {
  for (const theme of listThemes('wedding')) {
    expect(theme.fontPairs).toHaveLength(3)
    expect(theme.accents[0]).toBe(theme.palette.accent)
    expect(theme.accents.length).toBeGreaterThanOrEqual(4)
    // Button text sits on the accent, so each swatch must keep it readable.
    for (const accent of theme.accents) {
      expect(
        contrastRatio(accent, theme.palette.buttonInk),
        `${theme.key} ${accent}`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  }
})
