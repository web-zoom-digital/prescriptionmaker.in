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
  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', userId)
  formData.append('type', type)

  const res = await fetch('/api/upload-asset', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let errorMessage = 'Upload failed'
    try {
      const err = await res.json()
      errorMessage = err.error || errorMessage
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage)
  }

  const data = await res.json()
  return data.url
}

/**
 * Delete a doctor asset from storage.
 */
export async function deleteDoctorAsset(userId: string, type: UploadType) {
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg']
  const paths = extensions.map((ext) => `${userId}/${type}.${ext}`)
  await supabase.storage.from(BUCKET).remove(paths)
}
