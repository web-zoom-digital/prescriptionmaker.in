import Link from 'next/link'
import { FileText, Mail } from 'lucide-react'

const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
  support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="border-t border-border bg-slate-50"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container-section py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5" aria-label="PrescriptionMaker home">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <FileText className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-base font-semibold">
                Prescription<span className="text-primary">Maker</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Professional digital prescription software for doctors and clinics across India.
              Create, manage, and export prescriptions as PDF.
            </p>
            <div className="mt-5 flex gap-3">

              <a
                href="mailto:support@prescriptionmaker.in"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                aria-label="Email us"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <nav aria-label="Product navigation">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support links */}
          <nav aria-label="Support navigation">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Support</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal links */}
          <nav aria-label="Legal navigation">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} PrescriptionMaker. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with care for Indian healthcare professionals.
          </p>
        </div>
      </div>
    </footer>
  )
}
