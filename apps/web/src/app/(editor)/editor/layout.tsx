import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prescription Editor',
  description: 'Create a new prescription using the form editor or hand-mode drawing editor.',
  robots: { index: false, follow: false },
}

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {children}
    </div>
  )
}
