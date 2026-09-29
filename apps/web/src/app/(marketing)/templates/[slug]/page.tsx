import type { Metadata } from 'next'
import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Check } from 'lucide-react'

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
          <div>
            <div
              className="overflow-hidden rounded-xl border shadow-soft-lg bg-white"
              style={{ borderTop: `4px solid ${template.styles.primaryColor}` }}
            >
              {/* Mock prescription */}
              <div className="p-8 min-h-96">
                <div
                  className="border-b-2 pb-4 mb-4"
                  style={{ borderColor: template.styles.primaryColor }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: template.styles.primaryColor, fontFamily: template.styles.fontFamily }}
                  >
                    Dr. [Your Name]
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    [Qualifications] · [Specialization]
                  </div>
                  <div className="text-sm text-slate-500">Reg. No: [Your MCI Number]</div>
                </div>

                <div className="text-sm text-slate-600 mb-4">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-400">Patient:</span> Sample Name</div>
                    <div><span className="text-slate-400">Age:</span> 35Y / M</div>
                    <div><span className="text-slate-400">Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                <div
                  className="text-xl font-bold mb-3"
                  style={{ color: template.styles.primaryColor }}
                >
                  Rx
                </div>

                <div
                  className="pl-4 border-l-4 space-y-3"
                  style={{ borderColor: template.styles.accentColor }}
                >
                  {['Amoxicillin 500mg — 1-0-1 · After food · 5 days', 'Paracetamol 650mg — SOS · After food'].map((med) => (
                    <div key={med} className="text-sm">
                      <div className="font-semibold text-slate-800">{med.split(' — ')[0]}</div>
                      <div className="text-slate-500 text-xs">{med.split(' — ')[1]}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-xs text-slate-500 border-t pt-4">
                  <div className="font-medium text-slate-700 mb-1">Advice:</div>
                  <div>Rest, plenty of fluids. Return if symptoms worsen.</div>
                  <div className="mt-2"><span className="font-medium">Follow-up:</span> After 5 days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Template info */}
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
