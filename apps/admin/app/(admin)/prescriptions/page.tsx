import { supabaseAdmin } from '@/lib/supabase'
import { Search } from 'lucide-react'

async function getPrescriptions(search?: string, status?: string) {
  let query = supabaseAdmin
    .from('prescriptions')
    .select('id, title, status, mode, template_slug, diagnosis, created_at, user_id')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,diagnosis.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const { q, status } = await searchParams
  const prescriptions = await getPrescriptions(q, status)

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Complete', value: 'complete' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
        <p className="text-slate-500 mt-1">{prescriptions.length} prescriptions found</p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <form className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by title or diagnosis..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </div>
        </form>

        {/* Status tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={`?status=${tab.value}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                (status ?? 'all') === tab.value
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table>
          <thead>
            <tr>
              <th>Prescription</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((rx: any) => (
              <tr key={rx.id}>
                <td>
                  <p className="font-medium text-slate-800">{rx.title || 'Untitled'}</p>
                  <p className="text-xs text-slate-400">{rx.diagnosis || 'No diagnosis'}</p>
                </td>
                <td>
                  <span className={`badge ${rx.mode === 'hand' ? 'badge-blue' : 'badge-teal'}`}>
                    {rx.mode === 'hand' ? '✏️ Hand' : '📝 Form'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    rx.status === 'complete' ? 'badge-green' :
                    rx.status === 'draft' ? 'badge-amber' : 'badge-red'
                  }`}>
                    {rx.status}
                  </span>
                </td>
                <td className="text-slate-400 text-xs">
                  {new Date(rx.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
              </tr>
            ))}
            {prescriptions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400">
                  No prescriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
