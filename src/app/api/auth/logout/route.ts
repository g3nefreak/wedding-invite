import { createSupabaseServerClient } from '#/server/auth/supabase'
import { handle, ok } from '#/server/http'

export function POST() {
  return handle(async () => {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    return ok({ loggedIn: false })
  })
}
