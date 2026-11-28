import type { Theme } from './types'

export const blushRomance: Theme = {
  key: 'blush-romance',
  name: 'Blush Romance',
  category: 'romantic',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#f8e6e4',
    ink: '#4a2530',
    inkSoft: '#7a5560',
    panel: 'rgba(255,250,249,0.68)',
    line: 'rgba(74,37,48,0.34)',
    accent: '#a84a62',
    buttonInk: '#fff5f4',
  },
  accents: ['#a84a62', '#8c5a3c', '#7a4f86', '#56706a'],
  fontPairs: [
    { display: 'Parisienne', body: 'Lato' },
    { display: 'Playfair Display', body: 'Nunito' },
    { display: 'Cormorant Garamond', body: 'Jost' },
  ],
  labelFont: 'Space Mono',
  art: 'petals',
  envelope: 'curved',
  panelRadius: 32,
  heroAlign: 'center',
  photo: { overlay: 0.3, filter: 'none' },
}
