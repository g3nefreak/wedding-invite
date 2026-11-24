import type { Metadata } from 'next'
import { BrandMark } from '#/components/BrandMark'
import { EnvelopeArt, LoginForm } from '#/features/auth'

export const metadata: Metadata = { title: 'Log in · Online Invitation' }

export default function LoginPage() {
  return (
    <main className="grid flex-1 bg-host-ground font-host-body text-host-ink scheme-dark lg:grid-cols-[1.15fr_1fr]">
      {/* The picture side: a strip on phones, the larger half on wide screens. */}
      <section className="flex flex-col gap-4 border-host-line bg-host-panel max-lg:border-b lg:border-r p-6 sm:p-10">
        <BrandMark />

        <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6">
          <EnvelopeArt className="h-auto w-full max-w-[9rem] sm:max-w-[17rem] lg:max-w-sm" />
          <div className="flex max-w-md flex-col gap-3 text-center">
            <p className="font-host-display text-[clamp(1.875rem,4.2vw,3.75rem)] leading-[1.05] font-medium text-balance italic">
              Every guest gets their own invitation.
            </p>
            <p className="text-lg leading-normal text-pretty max-sm:hidden">
              Design it once, send each guest a personal link, and see who is
              coming.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6 sm:gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-host-display text-4xl leading-none font-medium italic sm:text-5xl">
              Welcome back
            </h1>
            <p className="text-lg leading-normal text-host-ink-soft">
              Log in to manage your event. Guests do not need an account: open
              the personal link you were sent.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
