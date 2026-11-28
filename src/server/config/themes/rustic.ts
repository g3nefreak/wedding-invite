import type { Theme } from './types'

export const rustic: Theme = {
  key: 'rustic',
  name: 'Rustic',
  category: 'warm-natural',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#e9dcc6',
    ink: '#3a2a1c',
    inkSoft: '#6b5340',
    panel: 'rgba(255,249,238,0.66)',
    line: 'rgba(58,42,28,0.38)',
    accent: '#7b4a2a',
    buttonInk: '#fff6e8',
  },
  accents: ['#7b4a2a', '#5f6b3c', '#8a3b2e', '#4f5d6e'],
  fontPairs: [
    { display: 'Playfair Display', body: 'Lora' },
    { display: 'Marcellus', body: 'Jost' },
    { display: 'Dancing Script', body: 'Nunito' },
  ],
  labelFont: 'Space Mono',
  art: 'frame',
  envelope: 'pointed',
  panelRadius: 16,
  heroAlign: 'center',
  photo: { overlay: 0.35, filter: 'none' },
}
