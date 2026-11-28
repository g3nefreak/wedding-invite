import type { Theme } from './types'

export const neonFuture: Theme = {
  key: 'neon-future',
  name: 'Neon Future',
  category: 'futuristic',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#07080d',
    ink: '#f2f4ff',
    inkSoft: '#a3a8c2',
    panel: 'rgba(18,20,34,0.7)',
    line: 'rgba(242,244,255,0.28)',
    accent: '#5cf2d6',
    buttonInk: '#07080d',
  },
  accents: ['#5cf2d6', '#b69cff', '#ff8fd0', '#ffe66b'],
  fontPairs: [
    { display: 'Unbounded', body: 'Space Grotesk' },
    { display: 'Syne', body: 'Inter' },
    { display: 'Josefin Sans', body: 'Outfit' },
  ],
  labelFont: 'Space Mono',
  art: 'horizon',
  envelope: 'straight',
  panelRadius: 12,
  heroAlign: 'left',
  photo: { overlay: 0.6, filter: 'none' },
}
