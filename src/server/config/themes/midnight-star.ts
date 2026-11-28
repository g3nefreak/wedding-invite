import type { Theme } from './types'

export const midnightStar: Theme = {
  key: 'midnight-star',
  name: 'Midnight Star',
  category: 'celestial',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#0c1330',
    ink: '#f3ecd8',
    inkSoft: '#b9b6c9',
    panel: 'rgba(20,30,70,0.6)',
    line: 'rgba(243,236,216,0.32)',
    accent: '#e2c17a',
    buttonInk: '#0c1330',
  },
  accents: ['#e2c17a', '#f0e6d2', '#a9c4ff', '#f2b6c6'],
  fontPairs: [
    { display: 'Cinzel', body: 'Jost' },
    { display: 'Cormorant Garamond', body: 'Inter' },
    { display: 'Great Vibes', body: 'Montserrat' },
  ],
  labelFont: 'Space Mono',
  art: 'stars',
  envelope: 'curved',
  panelRadius: 24,
  heroAlign: 'center',
  photo: { overlay: 0.55, filter: 'none' },
}
