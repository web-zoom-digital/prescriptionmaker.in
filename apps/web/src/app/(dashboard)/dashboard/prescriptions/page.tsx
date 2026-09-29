import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PrescriptionsList } from '@/components/dashboard/prescriptions-list'

export const metadata: Metadata = {
  title: 'My Prescriptions',
  description: 'View and manage all your saved prescriptions.',
  robots: { index: false, follow: false },
}

export default function PrescriptionsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prescriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your drafts and completed prescriptions
          </p>
        </div>
        <Link
          href="/editor"
          id="prescriptions-new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-teal transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New
        </Link>
      </div>

      <PrescriptionsList />
    </div>
  )
}
