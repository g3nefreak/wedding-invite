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
  accents: ['#a4502d', '#7a5c2e', '#5b6b3a', '#8a3f55'],
  fontPairs: [
    { display: 'Italiana', body: 'Space Grotesk' },
    { display: 'Cormorant Garamond', body: 'Jost' },
    { display: 'Poiret One', body: 'Jost' },
  ],
  labelFont: 'Space Mono',
  art: 'orbit-sun',
  panelRadius: 28,
  heroAlign: 'center',
  photo: { overlay: 0.3, filter: 'none' },
}
