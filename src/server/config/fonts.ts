// The fonts a host can choose from. Two lists, because a heading font can be
// fancy but text has to stay easy to read: the text list holds only plain,
// readable faces. Every name here must also be loaded in src/app/fonts.ts.

// For the title and section headings.
export const DISPLAY_FONTS = [
  // Classic serifs
  'Bodoni Moda',
  'Cormorant Garamond',
  'Playfair Display',
  'Cinzel',
  'Marcellus',
  'Prata',
  'DM Serif Display',
  'Fraunces',
  'Libre Baskerville',
  'Abril Fatface',
  'Italiana',
  // Handwriting
  'Great Vibes',
  'Parisienne',
  'Dancing Script',
  'Sacramento',
  'Allura',
  // Modern
  'Poiret One',
  'Josefin Sans',
  'Syne',
  'Unbounded',
] as const

// For paragraphs, names and details.
export const BODY_FONTS = [
  'Jost',
  'Space Grotesk',
  'Inter',
  'Lato',
  'Montserrat',
  'Nunito',
  'Raleway',
  'Quicksand',
  'Outfit',
  'Poppins',
  'Lora',
  'EB Garamond',
] as const

export const isDisplayFont = (name: string) =>
  (DISPLAY_FONTS as readonly string[]).includes(name)

export const isBodyFont = (name: string) =>
  (BODY_FONTS as readonly string[]).includes(name)
