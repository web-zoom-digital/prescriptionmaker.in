'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  {
    label: 'Templates',
    href: '/templates',
    children: [
      { label: 'All Templates', href: '/templates' },
      { label: 'Classic Medical', href: '/templates/classic-medical' },
      { label: 'Minimal Clinical', href: '/templates/minimal-clinical' },
      { label: 'Modern Clinic', href: '/templates/modern-clinic' },
      { label: 'Pediatric', href: '/templates/pediatric' },
    ],
  },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
]

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          isScrolled
            ? 'border-b border-border/60 bg-background/95 shadow-soft-sm backdrop-blur-md'
            : 'bg-transparent'
        )}
        role="banner"
      >
        <div className="container-section">
          <div className="flex h-16 items-center justify-between lg:h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="PrescriptionMaker — Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-teal">
                <FileText className="h-4.5 w-4.5 text-white" aria-hidden="true" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Prescription<span className="text-primary">Maker</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden items-center gap-1 lg:flex"
              role="navigation"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <div key={link.href} className="relative">
                    <button
                      className={cn(
                        'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        'text-muted-foreground hover:bg-accent hover:text-foreground',
                        activeDropdown === link.href && 'bg-accent text-foreground'
                      )}
                      onMouseEnter={() => setActiveDropdown(link.href)}
                      onMouseLeave={() => setActiveDropdown(null)}
                      onClick={() =>
                        setActiveDropdown(activeDropdown === link.href ? null : link.href)
                      }
                      aria-expanded={activeDropdown === link.href}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          activeDropdown === link.href && 'rotate-180'
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === link.href && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute left-0 top-full mt-1 min-w-52 rounded-lg border border-border bg-popover p-1.5 shadow-soft-md"
                          onMouseEnter={() => setActiveDropdown(link.href)}
                          onMouseLeave={() => setActiveDropdown(null)}
                          role="menu"
                          aria-label={`${link.label} submenu`}
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              role="menuitem"
                              className={cn(
                                'block rounded-md px-3 py-2 text-sm text-muted-foreground',
                                'transition-colors hover:bg-accent hover:text-foreground',
                                pathname === child.href && 'bg-accent/60 text-foreground'
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'text-muted-foreground hover:bg-accent hover:text-foreground',
                      pathname === link.href && 'bg-accent/60 text-foreground'
                    )}
                    aria-current={pathname === link.href ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground',
                  'transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  'inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground',
                  'shadow-teal transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                )}
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md lg:hidden',
                'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              id="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-background shadow-soft-xl lg:hidden"
              role="dialog"
              aria-label="Mobile navigation"
              aria-modal="true"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <span className="text-base font-semibold">Menu</span>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 pb-6" aria-label="Mobile navigation">
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => (
                    <div key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2.5 text-sm font-medium',
                          'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                          pathname === link.href && 'bg-accent text-foreground'
                        )}
                        aria-current={pathname === link.href ? 'page' : undefined}
                      >
                        {link.label}
                      </Link>
                      {link.children && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-4">
                          {link.children.slice(1).map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </nav>

              <div className="border-t border-border px-4 py-5 space-y-3">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-teal hover:bg-primary/90"
                >
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
