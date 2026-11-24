// Placeholder home page until the host dashboard exists. Guests never land
// here: they open their personal /i/<token> link.
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">Online Invitation</h1>
      <p className="max-w-[40ch] leading-normal">
        Open the personal link you were sent to see your invitation.
      </p>
    </main>
  )
}
