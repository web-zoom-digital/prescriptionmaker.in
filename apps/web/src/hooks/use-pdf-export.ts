'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { GeneratePdfRequest } from '@/app/api/prescriptions/generate-pdf/route'

interface UsePdfExportOptions {
  onSuccess?: (filename: string) => void
  onError?: (error: string) => void
}

interface UsePdfExportReturn {
  exportPdf: (data: GeneratePdfRequest) => Promise<void>
  generatePdfBlob: (data: GeneratePdfRequest) => Promise<{ blob: Blob, filename: string } | null>
  isExporting: boolean
}

/**
 * usePdfExport — client-side hook for triggering PDF generation + download
 *
 * Calls POST /api/prescriptions/generate-pdf with the prescription data,
 * receives a binary PDF blob, and triggers a browser download.
 * Shows toast notifications for success/error states.
 */
export function usePdfExport(options: UsePdfExportOptions = {}): UsePdfExportReturn {
  const [isExporting, setIsExporting] = useState(false)

  const generatePdfBlob = async (data: GeneratePdfRequest) => {
    if (isExporting) return null
    setIsExporting(true)
    const toastId = toast.loading('Generating PDF…')
    try {
      const response = await fetch('/api/prescriptions/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = (errorData as { error?: string }).error ?? 'PDF generation failed'
        toast.error(message, { id: toastId })
        options.onError?.(message)
        return null
      }
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const filenameMatch = disposition.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] ?? 'prescription.pdf'
      const blob = await response.blob()
      toast.success(`PDF generated`, { id: toastId })
      return { blob, filename }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      toast.error('Failed to generate PDF. Please try again.', { id: toastId })
      options.onError?.(message)
      return null
    } finally {
      setIsExporting(false)
    }
  }

  const exportPdf = async (data: GeneratePdfRequest) => {
    if (isExporting) return

    setIsExporting(true)
    const toastId = toast.loading('Generating PDF…')

    try {
      const response = await fetch('/api/prescriptions/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = (errorData as { error?: string }).error ?? 'PDF generation failed'
        toast.error(message, { id: toastId })
        options.onError?.(message)
        return
      }

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const filenameMatch = disposition.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] ?? 'prescription.pdf'

      // Convert to blob and trigger download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Revoke the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 10_000)

      toast.success(`PDF downloaded — ${filename}`, { id: toastId })
      options.onSuccess?.(filename)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      toast.error('Failed to generate PDF. Please try again.', { id: toastId })
      options.onError?.(message)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportPdf, generatePdfBlob, isExporting }
}
