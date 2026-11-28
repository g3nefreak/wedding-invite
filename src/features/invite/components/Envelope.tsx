import type { ResolvedDesign } from '../invite.types'

// The outline of the flap for each theme, drawn from the envelope's top edge.
const FLAPS: Record<ResolvedDesign['envelope'], string> = {
  straight: 'M0 0H320V92H0Z',
  pointed: 'M0 0H320L160 124Z',
  curved: 'M0 0H320Q160 200 0 0Z',
  stepped: 'M0 0H320V34H264V62H208V92H112V62H56V34H0Z',
}

// Where the seal sits: on the lowest point of each flap.
const SEAL_Y: Record<ResolvedDesign['envelope'], number> = {
  straight: 92,
  pointed: 112,
  curved: 96,
  stepped: 92,
}

// The envelope on the cover, drawn only with the theme's own colors. It is a
// picture, so screen readers skip it; the button beside it does the talking.
export function Envelope({
  shape,
  monogram,
}: {
  shape: ResolvedDesign['envelope']
  monogram: string
}) {
  const sealY = SEAL_Y[shape]

  return (
    <svg
      aria-hidden="true"
      viewBox="-4 -4 328 228"
      className="h-auto w-full max-w-sm"
      fill="none"
    >
      {/* The body, with the two folds that meet in the middle. */}
      <rect width="320" height="220" rx="6" fill="var(--ground)" />
      <rect
        width="320"
        height="220"
        rx="6"
        fill="var(--panel)"
        stroke="var(--line)"
        strokeWidth="1.5"
      />
      <path d="M0 220 160 118 320 220" stroke="var(--line)" strokeWidth="1.5" />

      {/* The flap lifts when the envelope is opened (see globals.css). */}
      <g className="envelope-flap">
        <path data-flap d={FLAPS[shape]} fill="var(--ground)" />
        <path
          d={FLAPS[shape]}
          fill="var(--panel)"
          stroke="var(--line)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>

      {/* The seal, with the monogram on it. */}
      <g className="envelope-seal">
        <circle cx="160" cy={sealY} r="30" fill="var(--accent)" />
        <circle
          cx="160"
          cy={sealY}
          r="25"
          stroke="var(--button-ink)"
          strokeOpacity="0.35"
        />
        <text
          x="160"
          y={sealY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={monogram.length > 2 ? 17 : 22}
          fill="var(--button-ink)"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {monogram}
        </text>
      </g>
    </svg>
  )
}
