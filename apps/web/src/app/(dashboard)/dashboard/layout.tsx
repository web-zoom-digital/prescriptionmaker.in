import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your PrescriptionMaker dashboard — manage prescriptions, templates, and settings.',
  robots: { index: false, follow: false },
}

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
