import { createClient } from '@supabase/supabase-js'

// Client-side Supabase (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type UploadType = 'logo' | 'stamp' | 'signature'

const BUCKET = 'doctor-assets'

/**
 * Upload a file to Supabase Storage under doctor-assets bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadDoctorAsset(
  userId: string,
  type: UploadType,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${type}.${ext}`

  // Delete old file first to avoid orphans
  await supabase.storage.from(BUCKET).remove([path])

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete a doctor asset from storage.
 */
export async function deleteDoctorAsset(userId: string, type: UploadType) {
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg']
  const paths = extensions.map((ext) => `${userId}/${type}.${ext}`)
  await supabase.storage.from(BUCKET).remove(paths)
}
