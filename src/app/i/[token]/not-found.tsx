export default function InviteNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">Invitation not found</h1>
      <p className="max-w-[40ch] leading-normal">
        Check that the link matches the one you were sent, or ask the host for a
        new link.
      </p>
    </main>
  )
}
