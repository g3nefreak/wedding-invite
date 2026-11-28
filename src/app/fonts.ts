import {
  Abril_Fatface,
  Allura,
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  DM_Serif_Display,
  Dancing_Script,
  EB_Garamond,
  Fraunces,
  Great_Vibes,
  Inter,
  Italiana,
  Josefin_Sans,
  Jost,
  Lato,
  Libre_Baskerville,
  Lora,
  Marcellus,
  Montserrat,
  Nunito,
  Outfit,
  Parisienne,
  Playfair_Display,
  Poiret_One,
  Poppins,
  Prata,
  Quicksand,
  Raleway,
  Sacramento,
  Space_Grotesk,
  Space_Mono,
  Syne,
  Unbounded,
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

// The rest of the font library a host can pick from on the Design tab (see
// src/server/config/fonts.ts). None is preloaded: a page fetches only the
// fonts its own text uses.
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  preload: false,
})
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  preload: false,
})
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  preload: false,
})
const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-josefin-sans',
  preload: false,
})
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  preload: false,
})
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  preload: false,
})
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  preload: false,
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  preload: false,
})
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  preload: false,
})
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  preload: false,
})
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  preload: false,
})
const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  preload: false,
})
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  preload: false,
})
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  preload: false,
})
const eBGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  preload: false,
})
const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  preload: false,
})
const prata = Prata({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-prata',
  preload: false,
})
const dMSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif-display',
  preload: false,
})
const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-abril-fatface',
  preload: false,
})
const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-great-vibes',
  preload: false,
})
const parisienne = Parisienne({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-parisienne',
  preload: false,
})
const sacramento = Sacramento({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-sacramento',
  preload: false,
})
const allura = Allura({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-allura',
  preload: false,
})
const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre-baskerville',
  preload: false,
})
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  preload: false,
})
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
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
  playfairDisplay,
  cinzel,
  fraunces,
  josefinSans,
  syne,
  unbounded,
  dancingScript,
  inter,
  montserrat,
  nunito,
  raleway,
  quicksand,
  outfit,
  lora,
  eBGaramond,
  marcellus,
  prata,
  dMSerifDisplay,
  abrilFatface,
  greatVibes,
  parisienne,
  sacramento,
  allura,
  libreBaskerville,
  lato,
  poppins,
]
  .map((font) => font.variable)
  .join(' ')
