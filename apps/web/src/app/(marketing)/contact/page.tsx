import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail, Phone, MapPin } from 'lucide-react'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact PrescriptionMaker support. We\'re here to help with questions about our digital prescription software.',
  alternates: { canonical: 'https://prescriptionmaker.in/contact' },
}

export default function ContactPage() {
  return (
    <div className="pt-32 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact PrescriptionMaker',
            url: 'https://prescriptionmaker.in/contact',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'support@prescriptionmaker.in',
              availableLanguage: ['English', 'Hindi'],
            },
          }),
        }}
      />

      <div className="container-section">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="section-label mb-4">Contact</span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Get in touch
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Have a question or need help? We&apos;re here for you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Contact info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: 'Email', value: 'support@prescriptionmaker.in', href: 'mailto:support@prescriptionmaker.in' },
                    { icon: Phone, label: 'Response time', value: 'Within 24 hours on business days', href: null },
                    { icon: MapPin, label: 'Based in', value: 'India', href: null },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50">
                        <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                        {item.href ? (
                          <a href={item.href} className="text-sm font-medium text-slate-900 hover:text-primary">
                            {item.value}
                          </a>
                        ) : (
                          <div className="text-sm font-medium text-slate-900">{item.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-slate-50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-slate-900">Quick links</span>
                </div>
                <ul className="space-y-2">
                  {[
                    { label: 'FAQ', href: '/faq' },
                    { label: 'Features', href: '/features' },
                    { label: 'Pricing', href: '/pricing' },
                    { label: 'Privacy Policy', href: '/privacy' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-primary hover:text-primary/80">
                        → {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
