import type { Theme } from './types'

export const skyBlue: Theme = {
  key: 'sky-blue',
  name: 'Sky Blue',
  category: 'soft-playful',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#dcefff',
    ink: '#1d2f66',
    inkSoft: '#4a5d8f',
    panel: 'rgba(255,248,236,0.78)',
    line: 'rgba(29,47,102,0.34)',
    accent: '#2a5fc4',
    buttonInk: '#fffaf0',
  },
  accents: ['#2a5fc4', '#8a5a12', '#2f7a66', '#b24a6a'],
  fontPairs: [
    { display: 'Abril Fatface', body: 'Nunito' },
    { display: 'DM Serif Display', body: 'Quicksand' },
    { display: 'Dancing Script', body: 'Poppins' },
  ],
  labelFont: 'Space Mono',
  art: 'clouds',
  envelope: 'pointed',
  panelRadius: 36,
  heroAlign: 'center',
  photo: { overlay: 0.3, filter: 'none' },
}
