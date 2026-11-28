import type { ReactNode } from 'react'
import type { ResolvedDesign } from '../invite.types'

// Angles for the lines that fan out in the Art Deco drawing.
const FAN_ANGLES = Array.from({ length: 13 }, (_, index) => -90 + index * 15)

// Where the stars sit in the night-sky drawing: x, y and size.
const STARS: [number, number, number][] = [
  [90, 110, 9],
  [230, 60, 5],
  [330, 190, 12],
  [520, 90, 7],
  [690, 150, 10],
  [740, 320, 5],
  [60, 360, 6],
  [180, 470, 9],
  [610, 430, 6],
  [430, 560, 5],
  [720, 640, 8],
  [100, 720, 5],
]

// A four-pointed star: two thin diamonds crossing at its center.
function star(x: number, y: number, size: number): string {
  const thin = size / 5
  return `M${x} ${y - size}L${x + thin} ${y - thin}L${x + size} ${y}L${x + thin} ${y + thin}L${x} ${y + size}L${x - thin} ${y + thin}L${x - size} ${y}L${x - thin} ${y - thin}Z`
}

// One cloud, drawn as a row of bumps over a flat base.
function cloud(x: number, y: number, scale: number): string {
  const s = (value: number) => value * scale
  return `M${x} ${y}a${s(34)} ${s(34)} 0 0 1 ${s(40)} ${s(-30)}a${s(46)} ${s(46)} 0 0 1 ${s(84)} ${s(-12)}a${s(38)} ${s(38)} 0 0 1 ${s(66)} ${s(22)}a${s(26)} ${s(26)} 0 0 1 ${s(10)} ${s(20)}z`
}

// One line drawing per theme. Each is drawn with the theme's accent color.
const DRAWINGS: Record<ResolvedDesign['art'], ReactNode> = {
  // Shown until the host uploads a background photo: rings over a fine grid.
  photo: (
    <>
      {[140, 230, 320, 410, 500].map((radius) => (
        <circle key={radius} cx="620" cy="260" r={radius} />
      ))}
      {[150, 300, 450, 600, 750, 900, 1050].map((y) => (
        <line key={y} x1="0" y1={y} x2="800" y2={y} opacity="0.35" />
      ))}
      <circle cx="620" cy="260" r="6" fill="currentColor" stroke="none" />
    </>
  ),
  'leaf-arch': (
    <>
      <path d="M140 1200V470a260 260 0 0 1 520 0v730" />
      <path d="M190 1200V470a210 210 0 0 1 420 0v730" opacity="0.5" />
      {[560, 680, 800, 920].map((y) => (
        <g key={y}>
          <path d={`M140 ${y}c-50 -10 -80 -50 -90 -100c50 10 80 50 90 100z`} />
          <path d={`M660 ${y}c50 -10 80 -50 90 -100c-50 10 -80 50 -90 100z`} />
        </g>
      ))}
      <circle cx="400" cy="150" r="4" fill="currentColor" stroke="none" />
    </>
  ),
  'orbit-sun': (
    <>
      <circle
        cx="400"
        cy="300"
        r="110"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <circle cx="400" cy="300" r="110" />
      <ellipse
        cx="400"
        cy="300"
        rx="330"
        ry="120"
        transform="rotate(-18 400 300)"
      />
      <ellipse
        cx="400"
        cy="300"
        rx="420"
        ry="170"
        transform="rotate(12 400 300)"
        opacity="0.5"
      />
      <circle cx="712" cy="198" r="9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="388" r="5" fill="currentColor" stroke="none" />
    </>
  ),
  'deco-fan': (
    <>
      {FAN_ANGLES.map((angle) => (
        <line
          key={angle}
          x1="400"
          y1="520"
          x2="400"
          y2="20"
          transform={`rotate(${angle} 400 520)`}
        />
      ))}
      {[180, 300, 420, 500].map((radius) => (
        <path
          key={radius}
          d={`M${400 - radius} 520a${radius} ${radius} 0 0 1 ${radius * 2} 0`}
          opacity="0.6"
        />
      ))}
    </>
  ),
  // A plain double border with small arcs in the corners.
  frame: (
    <>
      <rect x="36" y="36" width="728" height="1128" />
      <rect x="56" y="56" width="688" height="1088" opacity="0.5" />
      {[
        [56, 56, 0],
        [744, 56, 90],
        [744, 1144, 180],
        [56, 1144, 270],
      ].map(([x, y, turn]) => (
        <path
          key={turn}
          d="M0 70a70 70 0 0 0 70 -70M0 110a110 110 0 0 0 110 -110"
          transform={`translate(${x} ${y}) rotate(${turn})`}
          opacity="0.7"
        />
      ))}
    </>
  ),
  // A night sky: scattered stars and a thin crescent moon.
  stars: (
    <>
      {STARS.map(([x, y, size]) => (
        <path
          key={`${x}-${y}`}
          d={star(x, y, size)}
          fill="currentColor"
          fillOpacity="0.5"
        />
      ))}
      <path d="M640 250a90 90 0 1 0 60 150a70 70 0 1 1 -60 -150z" />
      {[
        [150, 240],
        [470, 300],
        [300, 640],
        [560, 720],
        [660, 560],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="currentColor" />
      ))}
    </>
  ),
  // A sun setting over a grid that runs to the horizon.
  horizon: (
    <>
      <path d="M250 420a150 150 0 0 1 300 0" />
      {[300, 340, 380].map((y) => (
        <line key={y} x1="262" y1={y} x2="538" y2={y} opacity="0.5" />
      ))}
      <line x1="0" y1="420" x2="800" y2="420" />
      {[-900, -500, -260, -110, 0, 110, 260, 500, 900].map((reach) => (
        <line key={reach} x1="400" y1="420" x2={400 + reach * 2} y2="1200" />
      ))}
      {[450, 500, 570, 670, 810, 1000].map((y) => (
        <line key={y} x1="0" y1={y} x2="800" y2={y} opacity="0.6" />
      ))}
    </>
  ),
  // A ring of petals, like a wreath, with a second faint ring inside.
  petals: (
    <>
      {Array.from({ length: 16 }, (_, index) => index * 22.5).map((angle) => (
        <path
          key={angle}
          d="M400 80c26 30 26 66 0 96c-26 -30 -26 -66 0 -96z"
          transform={`rotate(${angle} 400 320)`}
        />
      ))}
      <circle cx="400" cy="320" r="130" opacity="0.5" />
      <circle cx="400" cy="320" r="250" opacity="0.35" />
    </>
  ),
  // Rows of gentle waves, with a low sun above them.
  waves: (
    <>
      <circle cx="600" cy="210" r="80" />
      <circle cx="600" cy="210" r="110" opacity="0.4" />
      {[360, 420, 480, 560, 660, 780, 920].map((y, row) => (
        <path
          key={y}
          d={`M-40 ${y}q50 -${22 + row * 3} 100 0t100 0t100 0t100 0t100 0t100 0t100 0t100 0t100 0`}
          opacity={row % 2 ? 0.55 : 1}
        />
      ))}
    </>
  ),
  // A few soft clouds drifting across the sky.
  clouds: (
    <>
      <path d={cloud(60, 220, 1.3)} />
      <path d={cloud(470, 150, 1)} opacity="0.7" />
      <path d={cloud(520, 430, 1.5)} />
      <path d={cloud(40, 560, 1.1)} opacity="0.7" />
      <path d={cloud(330, 800, 1.4)} opacity="0.55" />
      {[
        [300, 110],
        [720, 330],
        [200, 420],
        [660, 700],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={star(x, y, 8)} fill="currentColor" />
      ))}
    </>
  ),
}

// Decoration only, so it is hidden from screen readers and never takes a tap.
export function ThemeArt({ art }: { art: ResolvedDesign['art'] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-accent opacity-40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      vectorEffect="non-scaling-stroke"
    >
      {DRAWINGS[art]}
    </svg>
  )
}
