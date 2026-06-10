import { supabase } from '@/lib/supabase'

/**
 * Avatar image storage. Files live in the public `avatars` bucket under a
 * per-user folder (`<auth.uid>/<timestamp>.<ext>`) so RLS can scope writes to
 * the owner. Public read means the returned URL can be dropped straight onto an
 * <img>. See `supabase/schema.sql` for the bucket + policies.
 */
const BUCKET = 'avatars'

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** `accept` attribute for the file <input>. */
export const AVATAR_ACCEPT = ACCEPTED_TYPES.join(',')

/** Returns a human-readable error if the file is the wrong type/size, else null. */
export function validateAvatarFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, WebP, or GIF image.'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Image is too large — please keep it under 5 MB.'
  }
  return null
}

/** Recover the storage object path from a public URL so we can delete it. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

/**
 * Upload `file` as the signed-in user's avatar and return its public URL.
 * Best-effort removes the previous avatar so storage doesn't accumulate.
 */
export async function uploadAvatar(file: File, previousUrl?: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) throw new Error('You must be signed in to upload an avatar.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${uid}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const prevPath = previousUrl ? pathFromPublicUrl(previousUrl) : null
  if (prevPath && prevPath !== path) {
    await supabase.storage.from(BUCKET).remove([prevPath]).catch(() => {})
  }

  return data.publicUrl
}
