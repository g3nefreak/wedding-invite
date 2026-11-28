import type { Theme } from './types'

export const royalEmerald: Theme = {
  key: 'royal-emerald',
  name: 'Royal Emerald',
  category: 'classic-formal',
  eventTypes: ['wedding', 'birthday'],
  palette: {
    ground: '#0f2b23',
    ink: '#f4ecd6',
    inkSoft: '#b9c4b4',
    panel: 'rgba(18,56,45,0.6)',
    line: 'rgba(244,236,214,0.32)',
    accent: '#d9b86c',
    buttonInk: '#0f2b23',
  },
  accents: ['#d9b86c', '#f1e7cf', '#e8a9a0', '#a8d5c2'],
  fontPairs: [
    { display: 'Cinzel', body: 'Lora' },
    { display: 'Prata', body: 'Jost' },
    { display: 'Bodoni Moda', body: 'Montserrat' },
  ],
  labelFont: 'Space Mono',
  art: 'frame',
  envelope: 'stepped',
  panelRadius: 6,
  heroAlign: 'center',
  photo: { overlay: 0.55, filter: 'none' },
}
