'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, CheckCircle } from 'lucide-react'
import { uploadDoctorAsset, type UploadType } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'

interface AssetUploaderProps {
  userId: string
  type: UploadType
  label: string
  description: string
  currentUrl?: string | null
  onUploadComplete?: (url: string) => void
  accept?: string
}

export function AssetUploader({
  userId,
  type,
  label,
  description,
  currentUrl,
  onUploadComplete,
  accept = 'image/png,image/jpeg,image/webp',
}: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.')
      return
    }

    setError('')
    setSuccess(false)
    setUploading(true)

    // Local preview
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const url = await uploadDoctorAsset(userId, type, file)
      onUploadComplete?.(url)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'Upload failed')
      setPreviewUrl(currentUrl ?? null)
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>

      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
          dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50',
          uploading && 'pointer-events-none opacity-70'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />

        {previewUrl ? (
          /* Has preview */
          <div className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {success ? '✅ Uploaded successfully' : 'Current file'}
              </p>
              <p className="text-xs text-teal-600 mt-1">Click to change</p>
            </div>
            {uploading && <Loader2 className="w-5 h-5 text-teal-500 animate-spin flex-shrink-0" />}
            {success && !uploading && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
            )}
            <p className="text-sm font-medium text-slate-600">
              {uploading ? 'Uploading...' : 'Drop file here or click to upload'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP — max 5 MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}
