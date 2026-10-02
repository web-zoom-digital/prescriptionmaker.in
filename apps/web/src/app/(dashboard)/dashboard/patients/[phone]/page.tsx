import { ArrowLeft, Plus, FileText, Copy, Trash2, Stethoscope, Pill, Calendar, Activity, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ phone: string }> }): Promise<Metadata> {
  const { phone } = await params
  const name = decodeURIComponent(phone)
  return {
    title: `${name} — Patient History | PrescriptionMaker`,
    robots: { index: false, follow: false },
  }
}

async function getPatientHistory(phone: string, byName: boolean) {
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
    .select('id, patient_info, doctor_info, diagnosis, medicines, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  const decoded = decodeURIComponent(phone)
  return data.filter((rx: any) => {
    if (byName) return rx.patient_info?.name?.trim() === decoded
    return rx.patient_info?.phone?.trim() === decoded
  })
}

export default async function PatientHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>
  searchParams: Promise<{ name?: string; byname?: string }>
}) {
  const { phone } = await params
  const { name, byname } = await searchParams
  const byName = byname === '1'
  const prescriptions = await getPatientHistory(phone, byName)
  const patientName = name ? decodeURIComponent(name) : decodeURIComponent(phone)
  const patientPhone = byName ? '' : decodeURIComponent(phone)

  const newRxHref = `/editor?prefill_name=${encodeURIComponent(patientName)}&prefill_phone=${encodeURIComponent(patientPhone)}`

  // Extract vitals data (latest age, gender, and weight history)
  const latestInfo = prescriptions[0]?.patient_info || {}
  const weightHistory = prescriptions
    .map(rx => ({
      weight: parseFloat(rx.patient_info?.weight),
      date: new Date(rx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    }))
    .filter(x => !isNaN(x.weight))
    .reverse()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/patients"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-soft-sm hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white text-xl font-bold">
            {patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{patientName}</h1>
            <p className="text-sm text-muted-foreground">
              {patientPhone && <span>{patientPhone} · </span>}
              {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href={newRxHref}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-teal hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Prescription
        </Link>
      </div>

      {/* Vitals Overview */}
      {prescriptions.length > 0 && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-soft-sm">
            <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" /> Patient Age / Gender
            </div>
            <div className="text-lg font-bold text-slate-900">
              {latestInfo.age ? `${latestInfo.age} Y` : 'N/A'} {latestInfo.gender ? `/ ${latestInfo.gender}` : ''}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-soft-sm">
            <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4" /> Latest Weight
            </div>
            <div className="text-lg font-bold text-slate-900">
              {latestInfo.weight ? `${latestInfo.weight} kg` : 'N/A'}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-soft-sm">
            <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" /> Total Visits
            </div>
            <div className="text-lg font-bold text-slate-900">
              {prescriptions.length}
            </div>
          </div>
        </div>
      )}

      {prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white py-20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No prescriptions found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create the first prescription for this patient.</p>
          <Link href={newRxHref} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-teal hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Create Prescription
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx: any) => {
            const meds = (rx.medicines ?? []).filter((m: any) => m.name)
            const date = new Date(rx.created_at).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'long', year: 'numeric'
            })
            const repeatHref = `/editor?clone_id=${rx.id}`

            return (
              <div
                key={rx.id}
                className="rounded-xl border border-border bg-white shadow-soft overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-border bg-slate-50/50 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-teal-500" />
                    <span className="text-sm font-semibold text-slate-700">{date}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    rx.status === 'complete'
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                  }`}>
                    {rx.status === 'complete' ? '✓ Complete' : '✎ Draft'}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-3">
                  {rx.diagnosis && (
                    <div className="flex items-start gap-2 text-sm">
                      <Stethoscope className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                      <div>
                        <span className="font-medium text-slate-500 text-xs uppercase tracking-wide">Diagnosis</span>
                        <p className="text-slate-800 font-medium">{rx.diagnosis}</p>
                      </div>
                    </div>
                  )}

                  {meds.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Pill className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-500 text-xs uppercase tracking-wide">Medicines ({meds.length})</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {meds.slice(0, 5).map((m: any, i: number) => (
                            <span key={i} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {m.name}{m.strength ? ` ${m.strength}` : ''}
                            </span>
                          ))}
                          {meds.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{meds.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {rx.doctor_info?.name && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>Dr. {rx.doctor_info.name}</span>
                      {rx.doctor_info.clinicName && <span>· {rx.doctor_info.clinicName}</span>}
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="flex items-center gap-2 border-t border-border px-5 py-3 bg-slate-50/30">
                  <Link
                    href={repeatHref}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-teal hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Repeat Prescription
                  </Link>
                  <Link
                    href={`/editor?id=${rx.id}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}

          {/* New prescription footer CTA */}
          <Link
            href={newRxHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-white py-4 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create New Prescription for {patientName}
          </Link>
        </div>
      )}
    </div>
  )
}
