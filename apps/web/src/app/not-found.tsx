import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
        <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
        back on track.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-teal hover:bg-primary/90 transition-all"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
