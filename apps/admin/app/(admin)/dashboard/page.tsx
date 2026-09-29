import { supabaseAdmin } from '@/lib/supabase'
import { Users, FileText, CreditCard, TrendingUp, CheckCircle, Clock } from 'lucide-react'

async function getStats() {
  const [
    { count: totalUsers },
    { count: totalPrescriptions },
    { count: completedPrescriptions },
    { count: draftPrescriptions },
    { count: proUsers },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('prescriptions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('prescriptions').select('*', { count: 'exact', head: true }).eq('status', 'complete'),
    supabaseAdmin.from('prescriptions').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalPrescriptions: totalPrescriptions ?? 0,
    completedPrescriptions: completedPrescriptions ?? 0,
    draftPrescriptions: draftPrescriptions ?? 0,
    proUsers: proUsers ?? 0,
  }
}

async function getRecentUsers() {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, name, email, plan, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

async function getRecentPrescriptions() {
  const { data } = await supabaseAdmin
    .from('prescriptions')
    .select('id, title, status, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

export default async function DashboardPage() {
  const [stats, recentUsers, recentPrescriptions] = await Promise.all([
    getStats(),
    getRecentUsers(),
    getRecentPrescriptions(),
  ])

  const statCards = [
    {
      label: 'Total Doctors',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: `${stats.proUsers} Pro users`,
    },
    {
      label: 'Total Prescriptions',
      value: stats.totalPrescriptions,
      icon: FileText,
      color: 'bg-teal-500',
      change: `${stats.completedPrescriptions} completed`,
    },
    {
      label: 'Draft Prescriptions',
      value: stats.draftPrescriptions,
      icon: Clock,
      color: 'bg-amber-500',
      change: 'Awaiting completion',
    },
    {
      label: 'Pro Subscribers',
      value: stats.proUsers,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: `of ${stats.totalUsers} total users`,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, Admin. Here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Doctors</h2>
            <a href="/users" className="text-sm text-teal-600 hover:underline">View all →</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user: any) => (
                <tr key={user.id}>
                  <td>
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </td>
                  <td>
                    <span className={`badge ${user.plan === 'pro' ? 'badge-teal' : 'badge-blue'}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-slate-400">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Prescriptions</h2>
            <a href="/prescriptions" className="text-sm text-teal-600 hover:underline">View all →</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPrescriptions.map((rx: any) => (
                <tr key={rx.id}>
                  <td className="font-medium text-slate-800">{rx.title || 'Untitled'}</td>
                  <td>
                    <span className={`badge ${rx.status === 'complete' ? 'badge-green' : rx.status === 'draft' ? 'badge-amber' : 'badge-red'}`}>
                      {rx.status}
                    </span>
                  </td>
                  <td className="text-slate-400 text-xs">
                    {new Date(rx.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
              {recentPrescriptions.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-slate-400">No prescriptions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
