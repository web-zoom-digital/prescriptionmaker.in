export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Platform configuration and environment info.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Config */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Supabase Connection</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Project URL</p>
              <code className="text-sm bg-slate-50 px-3 py-2 rounded-lg block text-teal-700 border border-slate-100">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'Not configured'}
              </code>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Anon Key</p>
              <code className="text-sm bg-slate-50 px-3 py-2 rounded-lg block text-slate-500 border border-slate-100 truncate">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 24) + '...'
                  : 'Not configured'}
              </code>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Platform Info</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Product', value: 'PrescriptionMaker.in' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
              { label: 'Framework', value: 'Next.js 15 + Turborepo' },
              { label: 'Database', value: 'Supabase (PostgreSQL)' },
              { label: 'Payments', value: 'Razorpay' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: '🏠 Main Website', href: 'https://prescriptionmaker.in' },
              { label: '🗄️ Supabase Dashboard', href: 'https://supabase.com/dashboard' },
              { label: '💳 Razorpay Dashboard', href: 'https://dashboard.razorpay.com' },
              { label: '🚀 Vercel Deployments', href: 'https://vercel.com' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 hover:border-teal-300 hover:text-teal-700 transition-all"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
