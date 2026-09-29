import { supabaseAdmin } from '@/lib/supabase'
import { Search } from 'lucide-react'

async function getUsers(search?: string) {
  let query = supabaseAdmin
    .from('users')
    .select('id, name, email, role, plan, status, created_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const { q } = await searchParams
  const users = await getUsers(q)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors / Users</h1>
          <p className="text-slate-500 mt-1">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() ?? 'D'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-blue">{user.role}</span>
                </td>
                <td>
                  <span className={`badge ${user.plan === 'pro' ? 'badge-teal' : user.plan === 'enterprise' ? 'badge-blue' : 'badge-amber'}`}>
                    {user.plan}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.status === 'active' ? 'badge-green' : user.status === 'suspended' ? 'badge-red' : 'badge-amber'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="text-slate-400 text-xs">
                  {new Date(user.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  {q ? `No users found for "${q}"` : 'No users registered yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
