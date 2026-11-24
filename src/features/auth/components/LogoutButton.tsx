'use client'

import { useRouter } from 'next/navigation'
import { useLogoutMutation } from '../auth.query'

export function LogoutButton() {
  const router = useRouter()
  const logout = useLogoutMutation()

  return (
    <button
      type="button"
      disabled={logout.isPending}
      onClick={() =>
        logout.mutate(undefined, {
          onSuccess: () => {
            router.replace('/login')
            router.refresh()
          },
        })
      }
      className="min-h-11 rounded-full border border-host-line px-5 py-2 font-medium text-host-ink transition-[background-color,color,scale] duration-150 ease-out hover:bg-host-accent hover:text-host-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent enabled:active:scale-[0.96] disabled:opacity-60"
    >
      {logout.isPending ? 'Logging out…' : 'Log out'}
    </button>
  )
}
