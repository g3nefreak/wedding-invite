import type { Theme } from './types'

export const coastal: Theme = {
  key: 'coastal',
  name: 'Coastal',
  category: 'seaside',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#e6f0f2',
    ink: '#12323f',
    inkSoft: '#46626d',
    panel: 'rgba(255,255,255,0.66)',
    line: 'rgba(18,50,63,0.34)',
    accent: '#1f6f86',
    buttonInk: '#f4fbfc',
  },
  accents: ['#1f6f86', '#a3552f', '#2f6b57', '#4a5a9a'],
  fontPairs: [
    { display: 'Marcellus', body: 'Raleway' },
    { display: 'Libre Baskerville', body: 'Quicksand' },
    { display: 'Sacramento', body: 'Lato' },
  ],
  labelFont: 'Space Mono',
  art: 'waves',
  envelope: 'curved',
  panelRadius: 28,
  heroAlign: 'center',
  photo: { overlay: 0.3, filter: 'none' },
}
