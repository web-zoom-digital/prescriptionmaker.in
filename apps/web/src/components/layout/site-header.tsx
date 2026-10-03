'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, FileText, Stethoscope, LayoutTemplate, HelpCircle, IndianRupee, Home, LogIn, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Features', href: '/#features', icon: Stethoscope },
  {
    label: 'Templates',
    href: '/templates',
    icon: LayoutTemplate,
    children: [
      { label: 'All Templates', href: '/templates' },
      { label: 'Classic Medical', href: '/templates/classic-medical' },
      { label: 'Minimal Clinical', href: '/templates/minimal-clinical' },
      { label: 'Modern Clinic', href: '/templates/modern-clinic' },
      { label: 'Pediatric', href: '/templates/pediatric' },
    ],
  },
  { label: 'How It Works', href: '/#how-it-works', icon: HelpCircle },
  { label: 'Pricing', href: '/#pricing', icon: IndianRupee },
]

// Animated hamburger icon
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative flex h-5 w-6 flex-col justify-between">
      <motion.span
        animate={isOpen ? { rotate: 45, y: 10, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="block h-0.5 w-full rounded-full bg-current origin-left"
      />
      <motion.span
        animate={isOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="block h-0.5 w-4/5 rounded-full bg-current"
      />
      <motion.span
        animate={isOpen ? { rotate: -45, y: -10, width: '100%' } : { rotate: 0, y: 0, width: '83%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="block h-0.5 rounded-full bg-current origin-left"
      />
    </div>
  )
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
    setActiveDropdown(null)
    setMobileExpandedSection(null)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

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
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="PrescriptionMaker — Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-teal">
                <FileText className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Prescription<span className="text-primary">Maker</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden items-center gap-0.5 lg:flex"
              role="navigation"
              aria-label="Main navigation"
            >
              {NAV_LINKS.filter(l => l.href !== '/').map((link) =>
                link.children ? (
                  <div key={link.href} className="relative"
                    onMouseEnter={() => setActiveDropdown(link.href)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={cn(
                        'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        'text-muted-foreground hover:bg-accent hover:text-foreground',
                        activeDropdown === link.href && 'bg-accent text-foreground'
                      )}
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
            <div className="hidden items-center gap-2.5 lg:flex">
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
                'flex h-10 w-10 items-center justify-center rounded-lg lg:hidden',
                'text-foreground transition-all duration-200',
                isMobileOpen
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              <HamburgerIcon isOpen={isMobileOpen} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu — Full Screen Premium Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer - slides from right */}
            <motion.div
              id="mobile-menu"
              ref={menuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-sm flex-col bg-background shadow-soft-xl lg:hidden"
              role="dialog"
              aria-label="Mobile navigation"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold">
                    Prescription<span className="text-primary">Maker</span>
                  </span>
                </Link>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-4.5 w-4.5" aria-hidden="true" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon
                    const hasChildren = !!link.children
                    const isExpanded = mobileExpandedSection === link.href
                    const isActive = pathname === link.href

                    return (
                      <div key={link.href}>
                        {hasChildren ? (
                          <button
                            onClick={() => setMobileExpandedSection(isExpanded ? null : link.href)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200',
                              isExpanded
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-accent'
                            )}
                            aria-expanded={isExpanded}
                          >
                            <span className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                              isExpanded ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            )}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1">{link.label}</span>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                                isExpanded && 'rotate-180 text-primary'
                              )}
                            />
                          </button>
                        ) : (
                          <Link
                            href={link.href}
                            className={cn(
                              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-accent'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <span className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                              isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            )}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{link.label}</span>
                            {isActive && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </Link>
                        )}

                        {/* Submenu */}
                        <AnimatePresence>
                          {hasChildren && isExpanded && link.children && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="ml-11 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-4">
                                {link.children.map((child) => (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={cn(
                                      'block rounded-lg px-3 py-2.5 text-sm transition-colors',
                                      pathname === child.href
                                        ? 'text-primary font-medium'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-border/60" />

                {/* Quick info */}
                <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4">
                  <p className="text-xs font-semibold text-primary mb-1">🩺 Trusted by Doctors</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Create professional prescriptions in seconds. 15+ premium templates designed for Indian healthcare.
                  </p>
                </div>
              </nav>

              {/* Footer CTA */}
              <div className="border-t border-border/60 px-4 py-5 space-y-2.5">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:border-primary/30 active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-teal transition-all hover:bg-primary/90 hover:shadow-teal-lg active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
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
