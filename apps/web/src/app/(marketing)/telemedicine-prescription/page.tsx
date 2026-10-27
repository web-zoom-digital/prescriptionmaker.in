import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Smartphone,
  Share2,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Telemedicine Prescription Format & Guidelines India — WhatsApp PDF Generator for Doctors',
  description:
    'Generate legally compliant telemedicine prescriptions in India under MoHFW & NITI Aayog 2020 guidelines. Instant 1-click WhatsApp PDF sharing, digital signature, and List A/B drug verification.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/telemedicine-prescription',
  },
  openGraph: {
    title: 'Telemedicine Prescription Format & WhatsApp Sharing India | PrescriptionMaker',
    description:
      'Everything Indian doctors need for legal telemedicine consultations: compliant digital prescription pad format, 1-click WhatsApp delivery, and MoHFW guidelines.',
    url: 'https://prescriptionmaker.in/telemedicine-prescription',
  },
}

const TELEMED_RULES = [
  {
    title: 'List A (First Consult Medications)',
    badge: 'Permitted',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description:
      'Safe first-line medications for common conditions (e.g. Paracetamol, ORS, antacids, cough syrups, topical ointments) and renewal of medications for previously diagnosed chronic illnesses (Hypertension, Diabetes, Hypothyroidism).',
  },
  {
    title: 'List B (Follow-up Add-on Medications)',
    badge: 'Permitted on Follow-up',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description:
      'Medications prescribed as add-ons to optimize an existing treatment regimen following a face-to-face consultation within the last 6 months.',
  },
  {
    title: 'List O (Strictly Prohibited Medications)',
    badge: 'Strictly Prohibited',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
    description:
      'Schedule X drugs of the Drugs & Cosmetics Rules 1945 and habit-forming narcotics/psychotropics under the NDPS Act 1985 cannot be prescribed via telemedicine under any circumstances.',
  },
]

export default function TelemedicinePrescriptionPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: 'Telemedicine Prescription Format and Guidelines in India',
            description:
              'Complete statutory guide and online software for Indian doctors issuing digital prescriptions via WhatsApp and telemedicine.',
            url: 'https://prescriptionmaker.in/telemedicine-prescription',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prescriptionmaker.in' },
                { '@type': 'ListItem', position: 2, name: 'Telemedicine Prescription', item: 'https://prescriptionmaker.in/telemedicine-prescription' },
              ],
            },
          }),
        }}
      />

      <div className="container-section">
        {/* Breadcrumb nav */}
        <nav className="mb-6 flex text-xs text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              Telemedicine Prescription
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            MoHFW & NITI Aayog Telemedicine Practice Guidelines
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Telemedicine Prescription{' '}
            <span className="gradient-text">Format & WhatsApp Sharing</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Issue 100% legally compliant digital prescriptions for remote video, audio, and WhatsApp
            consultations. Formatted to official Indian telemedicine standards with instant PDF delivery.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all hover:bg-primary/90"
            >
              Create Telemedicine Prescription Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compliance"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Read Legal Compliance
            </Link>
          </div>
        </div>

        {/* 3 Pillars of Telemedicine Legality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100 mb-4">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">1-Click WhatsApp Delivery</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No need to take camera photos of paper slips. Send clean, crystal-clear vector PDFs directly to the patient’s WhatsApp with one tap.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">IT Act 2000 Legal Validity</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Section 5 of the Information Technology Act confirms digital signatures and electronic records have identical legal standing to wet-ink paper documents.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Chemist Shop Acceptance</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pharmacies across India accept PrescriptionMaker PDFs because doctor registration numbers and credentials are clearly legible with zero handwriting ambiguity.
            </p>
          </div>
        </div>

        {/* Medication Classification Boxes */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-soft mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Drug Lists</span>
            <h2 className="text-2xl font-bold text-slate-900">
              Prescribing Guidelines for Telemedicine Consultations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Statutory categorization under the Telemedicine Practice Guidelines 2020
            </p>
          </div>

          <div className="space-y-4">
            {TELEMED_RULES.map((rule, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-slate-900">{rule.title}</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${rule.badgeColor}`}>
                    {rule.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start Your Telemedicine Practice Today
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            Create professional, legally compliant prescriptions for your online patients. Free to start with zero setup fees.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Sign Up Free for Telemedicine
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
