import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrandMark } from '#/components/BrandMark'
import { LogoutButton } from '#/features/auth'
import { getSessionUser } from '#/server/auth/session'
import { prismaUserRepository } from '#/server/repositories/user.repository'
import { ensureHost } from '#/server/services/host.service'

// Shows who is logged in. Also makes sure the host's own row exists.
async function HostIdentity() {
  // Depends on who is logged in, so it is built fresh on every visit.
  await connection()
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const host = await ensureHost(user, prismaUserRepository)

  return (
    <p className="text-sm">
      Logged in as <bdi>{host.email}</bdi>
    </p>
  )
}

// The frame around every host page: dark background, brand and log out.
export default function HostLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-host-ground font-host-body text-host-ink scheme-dark">
      <header className="border-b border-host-line bg-host-panel">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-4">
            <Suspense fallback={null}>
              <HostIdentity />
            </Suspense>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
        {children}
      </main>
    </div>
  )
}
