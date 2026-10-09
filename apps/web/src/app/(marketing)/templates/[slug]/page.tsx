import type { Metadata } from 'next'
import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Check } from 'lucide-react'
import { PrescriptionPreview } from '@/components/editor/prescription-preview'

const dummyData = {
  doctorName: 'Full Name',
  doctorQualifications: 'MBBS, MD',
  doctorSpecialization: 'General Medicine',
  clinicName: 'Name of your clinic',
  patient: { name: 'Patient full name', age: '34', gender: 'Male' },
  diagnosis: 'Acute Pharyngitis',
  medicines: [
    { name: 'Medicine Name', dosage: '1-0-1', duration: '5 days' },
    { name: 'Second Medicine', dosage: '0-0-1', duration: '3 days' }
  ]
}
interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return TEMPLATES.filter((t) => t.isPublished).map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const template = TEMPLATES.find((t) => t.slug === slug)
  if (!template) return {}

  return {
    title: template.seoTitle ?? `${template.name} Prescription Template`,
    description:
      template.seoDescription ??
      `${template.description} Download as A4 PDF. Free to use with PrescriptionMaker.`,
    alternates: {
      canonical: `https://prescriptionmaker.in/templates/${template.slug}`,
    },
    openGraph: {
      title: `${template.name} — Prescription Template | PrescriptionMaker`,
      description: template.description,
      url: `https://prescriptionmaker.in/templates/${template.slug}`,
    },
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params
  const template = TEMPLATES.find((t) => t.slug === slug)

  if (!template || !template.isPublished) {
    notFound()
  }

  const otherTemplates = TEMPLATES.filter(
    (t) => t.isPublished && t.slug !== slug && t.category === template.category
  ).slice(0, 3)

  return (
    <div className="pt-24 pb-20">
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
              { '@type': 'ListItem', position: 3, name: template.name, item: `https://prescriptionmaker.in/templates/${template.slug}` },
            ],
          }),
        }}
      />

      <div className="container-section">
        {/* Back link */}
        <Link
          href="/templates"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Templates
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Template preview */}
          <div className="flex justify-center lg:justify-end xl:justify-center">
            <div className="overflow-hidden rounded-xl border shadow-soft-lg bg-white relative w-full max-w-[420px] h-[580px] flex items-start justify-center pt-8">
              <div 
                className="origin-top shadow-md bg-white pointer-events-none"
                style={{ 
                  transform: 'scale(0.5)', 
                  width: '210mm',
                  marginBottom: '-148mm' // Prevent it from pushing height
                }}
              >
                <PrescriptionPreview template={template as any} data={dummyData} />
              </div>
            </div>
          </div>

          {/* Template info */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start gap-3 mb-2">
                {template.isFeatured && (
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
                    Popular
                  </span>
                )}
                {template.isPremium && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    Pro Plan
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {template.name}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{template.description}</p>

              <dl className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Layout', value: template.layout },
                  { label: 'Category', value: template.category },
                  { label: 'Page size', value: template.printSettings.pageSize },
                  { label: 'Font style', value: template.styles.fontFamily.split(',')[0] },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-slate-50 p-3">
                    <dt className="text-xs font-medium text-muted-foreground capitalize">{item.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900 capitalize">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Sections */}
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">Included sections</h2>
                <ul className="space-y-1.5">
                  {template.sections.map((section) => (
                    <li key={section.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" aria-hidden="true" />
                      {section.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/editor?template=${template.slug}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-teal hover:bg-primary/90 hover:shadow-teal-lg transition-all duration-200"
              >
                Use This Template
              </Link>
              <Link
                href="/signup"
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-slate-700 hover:border-primary/30 hover:text-primary transition-colors"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                View All Templates
              </Link>
            </div>
          </div>
        </div>

        {/* Related templates */}
        {otherTemplates.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">
              More {template.category} templates
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {otherTemplates.map((t) => (
                <Link
                  key={t.slug}
                  href={`/templates/${t.slug}`}
                  className="group rounded-lg border border-border bg-white p-4 shadow-soft hover:border-primary/20 hover:shadow-soft-md transition-all duration-200"
                >
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                    {t.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 line-clamp-2">{t.description}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
