import { createClient } from '@supabase/supabase-js'

// The Supabase Storage bucket that holds background photos. It is public:
// the page shows these photos to guests, who have no login.
export const PHOTO_BUCKET = 'event-photos'

// Where files are kept. Services use this instead of Supabase directly, so
// tests can pass an in-memory stand-in.
export interface PhotoStorage {
  upload(path: string, bytes: Buffer): Promise<void>
  remove(path: string): Promise<void>
}

// The web address of a stored photo, or null when storage is not set up.
export function publicPhotoUrl(path: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`
}

function bucket() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // The secret key can write to storage, so it is only ever read here on the
  // server and never sent to the browser.
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set to store photos',
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(PHOTO_BUCKET)
}

export const supabasePhotoStorage: PhotoStorage = {
  async upload(path, bytes) {
    const { error } = await bucket().upload(path, bytes, {
      contentType: 'image/webp',
      // Each upload has its own random name, so it can be cached for good.
      cacheControl: '31536000',
    })
    if (error) throw new Error(`Photo upload failed: ${error.message}`)
  },

  async remove(path) {
    const { error } = await bucket().remove([path])
    if (error) throw new Error(`Photo removal failed: ${error.message}`)
  },
}
