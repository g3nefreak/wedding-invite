import type { Theme } from './types'

export const gardenBotanical: Theme = {
  key: 'garden-botanical',
  name: 'Garden Botanical',
  category: 'nature',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#0b1a13',
    ink: '#effff3',
    inkSoft: '#b9d6c2',
    panel: 'rgba(10,30,20,0.6)',
    line: 'rgba(159,227,176,0.45)',
    accent: '#9fe3b0',
    buttonInk: '#0b1a13',
  },
  accents: ['#9fe3b0', '#f2d08a', '#f4b6a6', '#b8e0f2'],
  fontPairs: [
    { display: 'Cormorant Garamond', body: 'Space Grotesk' },
    { display: 'Italiana', body: 'Jost' },
    { display: 'Bodoni Moda', body: 'Jost' },
  ],
  labelFont: 'Space Mono',
  art: 'leaf-arch',
  envelope: 'curved',
  panelRadius: 28,
  heroAlign: 'center',
  photo: { overlay: 0.5, filter: 'none' },
}
