import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { TemplatesGrid } from '@/components/templates/templates-grid'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@prescriptionmaker/config/templates'

export const metadata: Metadata = {
  title: 'Prescription Templates — 15+ Professional Designs',
  description:
    'Browse 15+ professional prescription templates. Classic Medical, Minimal Clinical, Pediatric, Hospital, Specialist, and more. Each has a distinct layout — not just color variations.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/templates',
  },
  openGraph: {
    title: 'Prescription Templates — PrescriptionMaker',
    description: '15+ distinct prescription templates for doctors and clinics. Download as PDF.',
    url: 'https://prescriptionmaker.in/templates',
  },
}

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prescriptionmaker.in' },
                { '@type': 'ListItem', position: 2, name: 'Templates', item: 'https://prescriptionmaker.in/templates' },
              ],
            }),
          }}
        />

        {/* Page header */}
        <section className="bg-gradient-to-b from-slate-50 to-white pt-32 pb-12">
          <div className="container-section">
            <nav className="mb-4 flex text-xs text-muted-foreground" aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5">
                <li><a href="/" className="hover:text-primary">Home</a></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground">Templates</li>
              </ol>
            </nav>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Prescription Templates
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Choose from {TEMPLATES.length}+ professionally designed prescription templates. Each
              template has a distinct layout, typography, section structure, and medicine table
              design — built for different practice types.
            </p>
          </div>
        </section>

        {/* Templates grid with filters */}
        <section className="py-10 pb-20">
          <div className="container-section">
            <TemplatesGrid templates={TEMPLATES} categories={TEMPLATE_CATEGORIES} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
