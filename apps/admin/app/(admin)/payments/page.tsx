import { supabaseAdmin } from '@/lib/supabase'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

async function getPayments() {
  const { data } = await supabaseAdmin
    .from('user_plans')
    .select(`
      id, plan, billing_cycle, status, current_period_end,
      razorpay_customer_id, razorpay_subscription_id,
      prescription_count_this_month, created_at,
      users(name, email)
    `)
    .order('created_at', { ascending: false })

  return data ?? []
}

export default async function PaymentsPage() {
  const payments = await getPayments()

  const proCount = payments.filter((p: any) => p.plan === 'pro').length
  const activeCount = payments.filter((p: any) => p.status === 'active' && p.plan !== 'free').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payments & Subscriptions</h1>
        <p className="text-slate-500 mt-1">{payments.length} total user plans</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pro Subscribers</p>
            <p className="text-2xl font-bold text-slate-900">{proCount}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Paid Plans</p>
            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-400 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Free Plan Users</p>
            <p className="text-2xl font-bold text-slate-900">{payments.length - proCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Plan</th>
              <th>Billing</th>
              <th>Status</th>
              <th>Prescriptions this month</th>
              <th>Renews</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <p className="font-medium text-slate-800">{p.users?.name ?? '—'}</p>
                  <p className="text-xs text-slate-400">{p.users?.email ?? '—'}</p>
                </td>
                <td>
                  <span className={`badge ${p.plan === 'pro' ? 'badge-teal' : 'badge-amber'}`}>
                    {p.plan}
                  </span>
                </td>
                <td className="text-slate-500 text-sm">{p.billing_cycle ?? '—'}</td>
                <td>
                  <span className={`badge ${
                    p.status === 'active' ? 'badge-green' :
                    p.status === 'cancelled' ? 'badge-red' : 'badge-amber'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="text-slate-700 font-semibold">{p.prescription_count_this_month}</td>
                <td className="text-slate-400 text-xs">
                  {p.current_period_end
                    ? new Date(p.current_period_end).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })
                    : '—'}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No payment data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
