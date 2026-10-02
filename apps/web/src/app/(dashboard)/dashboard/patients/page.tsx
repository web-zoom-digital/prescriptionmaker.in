import { Users, Phone, Calendar, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import { verifyJWT } from '@/lib/auth/jwt'

export const metadata: Metadata = {
  title: 'Patient Records | PrescriptionMaker',
  description: 'View all your patients and their prescription history.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type PatientSummary = {
  name: string
  phone: string
  lastDiagnosis: string
  lastDate: string
  rxCount: number
}

async function getPatients(): Promise<PatientSummary[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return []

  const payload = await verifyJWT(token)
  if (!payload || !payload.sub) return []
  
  const userId = payload.sub

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('prescriptions')
    .select('patient_info, diagnosis, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Group by patient phone
  const patientMap = new Map<string, PatientSummary>()
  for (const rx of data) {
    const name = rx.patient_info?.name?.trim()
    const phone = rx.patient_info?.phone?.trim()
    if (!name) continue
    const key = phone || name
    if (!patientMap.has(key)) {
      patientMap.set(key, {
        name,
        phone: phone || '',
        lastDiagnosis: rx.diagnosis || '',
        lastDate: rx.created_at,
        rxCount: 1,
      })
    } else {
      const existing = patientMap.get(key)!
      existing.rxCount += 1
    }
  }

  return Array.from(patientMap.values())
}

export default async function PatientsPage() {
  const patients = await getPatients()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patients.length} unique patient{patients.length !== 1 ? 's' : ''} from your prescription history
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-teal hover:bg-primary/90 transition-colors"
        >
          + New Prescription
        </Link>
      </div>

      {/* Patient list */}
      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No patients yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Patients appear here automatically once you create prescriptions with their details.
          </p>
          <Link
            href="/editor"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-teal hover:bg-primary/90"
          >
            Create First Prescription
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient) => {
            const historyHref = patient.phone
              ? `/dashboard/patients/${encodeURIComponent(patient.phone)}?name=${encodeURIComponent(patient.name)}`
              : `/dashboard/patients/${encodeURIComponent(patient.name)}?name=${encodeURIComponent(patient.name)}&byname=1`

            return (
              <Link
                key={patient.phone || patient.name}
                href={historyHref}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:border-primary/30 hover:shadow-soft-md"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-lg font-bold">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {patient.name}
                    </div>
                    {patient.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>

                {/* Last diagnosis */}
                {patient.lastDiagnosis && (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Last: </span>
                    {patient.lastDiagnosis}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(patient.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                    {patient.rxCount} Rx
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
