// The product's small mark and name. Colors come from the text color around
// it, so it works on both the dark login panel and the light dashboard.
export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </svg>
      Online Invitation
    </span>
  )
}
