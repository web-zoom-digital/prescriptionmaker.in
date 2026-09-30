import { Plus, FileText, LayoutTemplate, Activity, ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getDashboardStats() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  
  if (!token) return null

  // We must use admin client to verify the JWT and get the user ID robustly in app router Server Component
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) return null

  const [
    { count: totalPrescriptions },
    { count: thisMonth },
    { count: draftCount },
    { data: recentPrescriptions }
  ] = await Promise.all([
    supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    
    supabase.from('prescriptions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      
    supabase.from('prescriptions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'draft'),

    supabase.from('prescriptions').select('id, patient_info, diagnosis, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
      
    supabase.from('prescriptions').select('medicines, created_at')
      .eq('user_id', user.id)
  ])
  
  // Calculate top medicines
  const medicineCounts: Record<string, number> = {}
  let totalPatients = 0
  const allRx = (allPrescriptions as any[]) || []
  
  allRx.forEach(rx => {
    totalPatients++
    if (Array.isArray(rx.medicines)) {
      rx.medicines.forEach((med: any) => {
        if (med.name) {
          const name = med.name.trim().toUpperCase()
          medicineCounts[name] = (medicineCounts[name] || 0) + 1
        }
      })
    }
  })
  
  const topMedicines = Object.entries(medicineCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return {
    totalPrescriptions: totalPrescriptions ?? 0,
    thisMonth: thisMonth ?? 0,
    draftCount: draftCount ?? 0,
    recentPrescriptions: recentPrescriptions ?? [],
    totalPatients,
    topMedicines
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Prescriptions',
            value: stats?.totalPrescriptions ?? 0,
            icon: FileText,
            color: 'teal',
            href: '/dashboard/prescriptions',
          },
          {
            label: 'This Month',
            value: stats?.thisMonth ?? 0,
            icon: Activity,
            color: 'blue',
            href: '/dashboard/prescriptions',
          },
          {
            label: 'Drafts',
            value: stats?.draftCount ?? 0,
            icon: FileText,
            color: 'amber',
            href: '/dashboard/prescriptions',
          },
          {
            label: 'Templates Used',
            value: 1,
            icon: LayoutTemplate,
            color: 'violet',
            href: '/dashboard/templates',
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-lg border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-soft-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/editor"
            id="dashboard-quick-create"
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-soft-md group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-teal">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                New Prescription
              </div>
              <div className="text-xs text-muted-foreground">Choose template and start</div>
            </div>
          </Link>

          <Link
            href="/dashboard/patients"
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-soft-md group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                Patient Records
              </div>
              <div className="text-xs text-muted-foreground">History &amp; repeat prescriptions</div>
            </div>
          </Link>

          <Link
            href="/dashboard/prescriptions"
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-soft-md group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                View Prescriptions
              </div>
              <div className="text-xs text-muted-foreground">All drafts and completed</div>
            </div>
          </Link>

          <Link
            href="/dashboard/templates"
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-soft-md group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <LayoutTemplate className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                Browse Templates
              </div>
              <div className="text-xs text-muted-foreground">15+ professional designs</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Medicines */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-white shadow-soft-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Top Prescribed Medicines
            </h2>
          </div>
          <div className="p-4">
            {stats.topMedicines.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No data available yet</p>
            ) : (
              <div className="space-y-4">
                {stats.topMedicines.map((med, i) => (
                  <div key={med.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{med.name}</span>
                    </div>
                    <span className="text-sm font-bold text-teal-600">{med.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent prescriptions */}
        <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Prescriptions</h2>
          <Link
            href="/dashboard/prescriptions"
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {(!stats?.recentPrescriptions || stats.recentPrescriptions.length === 0) ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No prescriptions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first prescription to get started.
            </p>
            <Link
              href="/editor"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-teal hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Prescription
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft-sm">
            <ul className="divide-y divide-border">
              {stats.recentPrescriptions.map((rx: any) => (
                <li key={rx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50">
                      <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <Link href={`/editor?id=${rx.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors">
                        {rx.patient_info?.name || 'Unknown Patient'}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{rx.diagnosis || 'No diagnosis'}</span>
                        <span>&bull;</span>
                        <span>
                           {new Date(rx.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {rx.status === 'draft' && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        Draft
                      </span>
                    )}
                    {rx.status === 'complete' && (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Complete
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
