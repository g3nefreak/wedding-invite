import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Italiana,
  Jost,
  Poiret_One,
  Space_Grotesk,
  Space_Mono,
} from 'next/font/google'

// Every font a theme can name. The browser downloads a font file only when
// text on the page uses it, so an invitation loads just its own theme's fonts.
// When a theme names a new font, add it here and to FONT_VARIABLES below.
const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni-moda',
  preload: false,
})
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  // Italic is used for headings on the host side.
  style: ['normal', 'italic'],
  variable: '--font-cormorant-garamond',
  preload: false,
})
const italiana = Italiana({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-italiana',
  preload: false,
})
// The host side (login and dashboard) uses Jost for text and Cormorant
// Garamond for headings.
const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
})
const poiretOne = Poiret_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-poiret-one',
  preload: false,
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  preload: false,
})

// Put on <html> so every page can reach the font variables.
export const fontClassNames = [
  bodoniModa,
  cormorantGaramond,
  italiana,
  jost,
  poiretOne,
  spaceGrotesk,
  spaceMono,
]
  .map((font) => font.variable)
  .join(' ')
