import type { Theme } from './types'

export const modernMinimal: Theme = {
  key: 'modern-minimal',
  name: 'Modern Minimal',
  category: 'modern',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#f6f4ef',
    ink: '#16161a',
    inkSoft: '#5b5b63',
    panel: 'rgba(255,255,255,0.72)',
    line: 'rgba(22,22,26,0.3)',
    accent: '#16161a',
    buttonInk: '#f6f4ef',
  },
  accents: ['#16161a', '#8a3b2e', '#2f4f4a', '#3d3f8f'],
  fontPairs: [
    { display: 'Syne', body: 'Inter' },
    { display: 'Fraunces', body: 'Outfit' },
    { display: 'DM Serif Display', body: 'Jost' },
  ],
  labelFont: 'Space Mono',
  art: 'photo',
  envelope: 'straight',
  panelRadius: 8,
  heroAlign: 'left',
  photo: { overlay: 0.3, filter: 'none' },
}
