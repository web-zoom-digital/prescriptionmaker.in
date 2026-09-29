'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  Settings,
  User,
  Plus,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SIDEBAR_LINKS = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Overview',
    exact: true,
  },
  {
    href: '/dashboard/prescriptions',
    icon: FileText,
    label: 'Prescriptions',
  },
  {
    href: '/dashboard/templates',
    icon: LayoutTemplate,
    label: 'Templates',
  },
  {
    href: '/dashboard/profile',
    icon: User,
    label: 'Profile',
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings',
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className="hidden w-56 flex-shrink-0 border-r border-border bg-white lg:flex lg:flex-col xl:w-64"
        aria-label="Dashboard navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <FileText className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold">
              Prescription<span className="text-primary">Maker</span>
            </span>
          </Link>
        </div>

        {/* Create button */}
        <div className="p-4">
          <Link
            href="/editor"
            id="dashboard-create-prescription"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-teal transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Prescription
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 pb-4" aria-label="Sidebar navigation">
          {SIDEBAR_LINKS.map((link) => {
            const active = isActive(link.href, link.exact)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'sidebar-link',
                  active && 'bg-primary/10 text-primary font-medium'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <link.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{link.label}</span>
                {active && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User area */}
        <div className="border-t border-border p-3">
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/'
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white lg:hidden"
              aria-label="Mobile dashboard navigation"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
                    <FileText className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold">PrescriptionMaker</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-4">
                <Link
                  href="/editor"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-teal"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New Prescription
                </Link>
              </div>

              <nav className="flex-1 space-y-0.5 px-3">
                {SIDEBAR_LINKS.map((link) => {
                  const active = isActive(link.href, link.exact)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn('sidebar-link', active && 'bg-primary/10 text-primary font-medium')}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <link.icon className="h-4 w-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center border-b border-border bg-white px-4 lg:hidden">
          <button
            className="mr-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold">Dashboard</span>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
