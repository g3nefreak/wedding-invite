import type { Theme } from './types'

export const bohemian: Theme = {
  key: 'bohemian',
  name: 'Bohemian',
  category: 'free-spirited',
  eventTypes: ['wedding'],
  palette: {
    ground: '#ead5ba',
    ink: '#3f2114',
    inkSoft: '#6a4332',
    panel: 'rgba(255,250,242,0.62)',
    line: 'rgba(63,33,20,0.4)',
    accent: '#a4502d',
    buttonInk: '#fff7ec',
  },
  fontPairs: [{ display: 'Italiana', body: 'Space Grotesk' }],
  labelFont: 'Space Mono',
  art: 'orbit-sun',
  panelRadius: 28,
  heroAlign: 'center',
  photo: { overlay: 0.3, filter: 'none' },
}
