'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Edit2, Trash2, Search, Filter } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import { DownloadPdfButton } from '@/components/ui/download-pdf-button'

export function PrescriptionsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        const res = await fetch('/api/prescriptions')
        const json = await res.json()
        if (json.success) {
          setPrescriptions(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch prescriptions:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPrescriptions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return
    
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPrescriptions(prev => prev.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete prescription:', err)
    }
  }

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patient_info?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search patients or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input !pl-9"
          />
        </div>
        <button className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-soft-sm hover:bg-slate-50 transition-colors">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filter
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft-sm">
        {isLoading ? (
          <div className="flex justify-center p-8">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          </div>
        ) : filteredPrescriptions.length > 0 ? (
          <ul className="divide-y divide-border">
            {filteredPrescriptions.map((prescription) => (
              <li key={prescription.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <Link href={`/editor?id=${prescription.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors">
                      {prescription.patient_info?.name || 'Unknown Patient'}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{prescription.diagnosis || 'No diagnosis'}</span>
                      <span>&bull;</span>
                      <span>{formatDateShort(prescription.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {prescription.status === 'draft' && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      Draft
                    </span>
                  )}
                  <div className="relative" data-dropdown>
                    {/* Simplified Actions for now. Would use Radix UI DropdownMenu in real app */}
                    <div className="flex items-center gap-1">
                        <DownloadPdfButton
                          prescriptionId={prescription.id}
                          patientName={prescription.patient_info?.name}
                          variant="icon"
                        />
                       <Link href={`/editor?id=${prescription.id}`} className="p-2 text-slate-400 hover:text-primary transition-colors rounded-md hover:bg-teal-50" title="Edit">
                         <Edit2 className="h-4 w-4" />
                       </Link>
                       <button onClick={() => handleDelete(prescription.id)} className="p-2 text-slate-400 hover:text-destructive transition-colors rounded-md hover:bg-red-50" title="Delete">
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-6 w-6 text-slate-400" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating a new prescription.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
