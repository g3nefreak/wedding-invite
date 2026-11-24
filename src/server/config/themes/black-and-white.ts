import type { Theme } from './types'

export const blackAndWhite: Theme = {
  key: 'black-and-white',
  name: 'Black and White',
  category: 'classic-formal',
  eventTypes: ['wedding'],
  palette: {
    ground: '#0b0b0b',
    ink: '#ffffff',
    inkSoft: '#e2e2e2',
    panel: 'rgba(12,12,12,0.55)',
    line: 'rgba(255,255,255,0.45)',
    accent: '#ffffff',
    buttonInk: '#0b0b0b',
  },
  accents: ['#ffffff', '#e8c9a0', '#b9d6f2', '#f2b8c6'],
  fontPairs: [
    { display: 'Bodoni Moda', body: 'Space Grotesk' },
    { display: 'Cormorant Garamond', body: 'Jost' },
    { display: 'Italiana', body: 'Jost' },
  ],
  labelFont: 'Space Mono',
  art: 'photo',
  panelRadius: 28,
  heroAlign: 'left',
  photo: { overlay: 0.62, filter: 'grayscale' },
}
