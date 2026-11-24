import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { InviteScreen } from '#/features/invite'
import { AppError } from '#/server/errors'
import { prismaInviteRepository } from '#/server/repositories/invite.repository'
import { getInvite } from '#/server/services/invite.service'

type Props = { params: Promise<{ token: string }> }

async function Invitation({ params }: Props) {
  const { token } = await params

  const invite = await getInvite(
    token,
    prismaInviteRepository,
    new Date(),
  ).catch((error: unknown) => {
    if (error instanceof AppError && error.code === 'NOT_FOUND') notFound()
    throw error
  })

  return <InviteScreen invite={invite} token={token} />
}

// A guest's personal page. Each one is different, so it is built per request.
export default function InvitePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-6">
          <p>Opening your invitation…</p>
        </main>
      }
    >
      <Invitation params={params} />
    </Suspense>
  )
}
