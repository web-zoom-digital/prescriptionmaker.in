'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DownloadPdfButtonProps {
  prescriptionId: string
  patientName?: string
  className?: string
  variant?: 'default' | 'compact' | 'icon'
}

export function DownloadPdfButton({
  prescriptionId,
  patientName,
  className,
  variant = 'default',
}: DownloadPdfButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleDownload = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}/pdf`)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to generate PDF')
      }

      // Trigger browser download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = patientName
        ? `prescription-${patientName.toLowerCase().replace(/\s+/g, '-')}.pdf`
        : `prescription-${prescriptionId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      console.error('PDF download failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const icons = {
    idle: <Download className="w-4 h-4" />,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  }

  const labels = {
    idle: 'Download PDF',
    loading: 'Generating...',
    success: 'Downloaded!',
    error: 'Failed — Retry',
  }

  const colors = {
    idle: 'bg-teal-600 hover:bg-teal-700 text-white',
    loading: 'bg-teal-500 text-white cursor-wait',
    success: 'bg-green-600 text-white',
    error: 'bg-red-500 hover:bg-red-600 text-white',
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={status === 'loading'}
        title={labels[status]}
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all disabled:cursor-wait',
          colors[status],
          className
        )}
      >
        {icons[status]}
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleDownload}
        disabled={status === 'loading'}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:cursor-wait',
          colors[status],
          className
        )}
      >
        {icons[status]}
        {labels[status]}
      </button>
    )
  }

  // Default variant
  return (
    <button
      onClick={handleDownload}
      disabled={status === 'loading'}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-wait shadow-sm',
        colors[status],
        status === 'idle' && 'shadow-teal-500/20 hover:shadow-teal-500/30 hover:shadow-md',
        className
      )}
    >
      {icons[status]}
      {labels[status]}
    </button>
  )
}
