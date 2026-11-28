import type { Theme } from './types'

export const artDeco: Theme = {
  key: 'art-deco',
  name: 'Art Deco',
  category: 'glamorous',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#0b0c10',
    ink: '#f6eed9',
    inkSoft: '#cfc6b0',
    panel: 'rgba(20,20,24,0.7)',
    line: 'rgba(217,184,108,0.6)',
    accent: '#d9b86c',
    buttonInk: '#0b0c10',
  },
  accents: ['#d9b86c', '#e9e2cf', '#9fc7c2', '#e3a08a'],
  fontPairs: [
    { display: 'Poiret One', body: 'Space Grotesk' },
    { display: 'Italiana', body: 'Jost' },
    { display: 'Bodoni Moda', body: 'Jost' },
  ],
  labelFont: 'Space Mono',
  art: 'deco-fan',
  envelope: 'stepped',
  panelRadius: 6,
  heroAlign: 'center',
  photo: { overlay: 0.6, filter: 'none' },
}
