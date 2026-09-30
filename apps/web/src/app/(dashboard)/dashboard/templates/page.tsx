import { TemplatesGrid } from '@/components/templates/templates-grid'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@prescriptionmaker/config/templates'
import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Templates | Dashboard',
  description: 'Choose a template for your prescriptions.',
}

export default function DashboardTemplatesPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prescription Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a professional template for your digital prescriptions.
          </p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-white p-6 shadow-soft-sm">
        <TemplatesGrid templates={TEMPLATES} categories={TEMPLATE_CATEGORIES} />
      </div>
    </div>
  )
}
