import type { ReactNode } from 'react'
import type { ResolvedDesign } from '../invite.types'

// Angles for the lines that fan out in the Art Deco drawing.
const FAN_ANGLES = Array.from({ length: 13 }, (_, index) => -90 + index * 15)

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
