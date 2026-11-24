// The picture on the login page: an invitation card rising out of an open
// envelope. Decoration only, so screen readers skip it.
export function EnvelopeArt({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 440"
      className={className}
      fill="none"
    >
      <ellipse cx="240" cy="424" rx="170" ry="10" fill="#000" opacity="0.35" />

      {/* Back of the envelope and its open flap. */}
      <rect x="60" y="210" width="360" height="210" rx="10" fill="#b9a988" />
      <path d="M60 216 240 64l180 152Z" fill="#b9a988" />
      <path d="M84 216 240 86l156 130Z" fill="#c9a86a" />

      {/* The invitation card. */}
      <g className="card-rise">
        <rect x="110" y="58" width="260" height="300" rx="6" fill="#fbf6ea" />
        <rect x="121" y="69" width="238" height="278" rx="3" stroke="#c9a86a" />
        <text
          x="240"
          y="112"
          textAnchor="middle"
          fontSize="12"
          fill="#6b5a48"
          style={{ fontFamily: 'var(--font-jost), sans-serif' }}
        >
          Together with their families
        </text>
        <text
          x="240"
          y="166"
          textAnchor="middle"
          fontSize="40"
          fontStyle="italic"
          fontWeight="500"
          fill="#241b13"
          style={{ fontFamily: 'var(--font-cormorant-garamond), serif' }}
        >
          Mika &amp; Paolo
        </text>
        <path d="M210 184h60" stroke="#c9a86a" strokeWidth="2" />
        <text
          x="240"
          y="208"
          textAnchor="middle"
          fontSize="13"
          fill="#6b5a48"
          style={{ fontFamily: 'var(--font-jost), sans-serif' }}
        >
          June 12, 2027
        </text>
      </g>

      {/* Front of the envelope, drawn over the card's lower half. */}
      <path d="M60 216 240 332 60 420Z" fill="#efe4cd" />
      <path d="M420 216 240 332l180 88Z" fill="#efe4cd" />
      <path d="M68 420 240 300l172 120Z" fill="#e3d6ba" />
      <path
        d="M60 216 240 332l180-116M68 420 240 300l172 120"
        stroke="#b9a988"
      />

      {/* Wax seal with two joined rings. */}
      <circle cx="240" cy="322" r="27" fill="#c9a86a" />
      <circle cx="233" cy="322" r="9" stroke="#241b13" strokeWidth="1.5" />
      <circle cx="247" cy="322" r="9" stroke="#241b13" strokeWidth="1.5" />
    </svg>
  )
}
