import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileText,
  PenTool,
  LayoutTemplate,
  Pill,
  Share2,
  ShieldCheck,
  Smartphone,
  Zap,
  Printer,
  HeartPulse,
  Languages,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Digital Prescription Features — Form Editor, Stylus Mode, 15+ Templates & WhatsApp Share',
  description:
    'Explore PrescriptionMaker features: structured Form Editor, Stylus Hand Drawing Mode, 15+ specialty templates, smart drug dosage auto-complete, clinic letterhead branding, vector A4 PDF export, and instant WhatsApp dispatch.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/features',
  },
  openGraph: {
    title: 'Digital Prescription Features | PrescriptionMaker.in',
    description:
      'Fast, modern, and legally compliant prescription maker for Indian doctors. Form mode, Apple Pencil stylus mode, 15+ templates, and WhatsApp sharing.',
    url: 'https://prescriptionmaker.in/features',
  },
}

const DETAILED_FEATURES = [
  {
    icon: LayoutTemplate,
    badge: 'Design & Layouts',
    title: '15+ Specialty-Specific Prescription Templates',
    description:
      'Every clinical specialty has unique documentation needs. PrescriptionMaker offers genuinely distinct structural layouts — not just different color schemes. Choose from Classic Letterhead, Two-Column Sidebar, SOAP Clinical Notes, Vitals-First, Detailed Drug Chart, Multi-Section Boxed, Minimal Ruled, Bilingual Indian (English + Hindi), and Eye Specialist formats.',
    highlights: [
      'Genuinely different section arrangements and typography',
      'Specialized formats for Pediatricians, Cardiologists, Dentists, and General Physicians',
      'Configurable margins, letterhead spacing, and optional watermarks',
      'Switch between templates in 1 click without re-entering patient data',
    ],
  },
  {
    icon: PenTool,
    badge: 'Dual Input Modes',
    title: 'Form Editor & Hand-Drawing Canvas Mode',
    description:
      'PrescriptionMaker adapts to your consultation speed. Use our lightning-fast structured Form Editor with keyboard shortcuts and auto-suggestions, or switch to Hand-Drawing Mode to write and sketch directly on your tablet, iPad (Apple Pencil), or touch device.',
    highlights: [
      'Keyboard-optimized form inputs with instant auto-save',
      'Pressure-sensitive digital pen canvas for touchscreens and styluses',
      'Draw anatomical diagrams (dental charts, eye refraction grids, skin lesions)',
      'Retains handwritten warmth with professional digital letterhead structure',
    ],
  },
  {
    icon: Pill,
    badge: 'Clinical Accuracy',
    title: 'Smart Drug Dosage & Frequency Builder',
    description:
      'Eliminate handwriting confusion and dispensing errors. Add medications with standardized clinical formulations (Tab, Cap, Syrup, Injection, Drops, Inhaler, Ointment), clinical strengths, standard frequencies (1-0-1, 1-0-0, OD, BD, TDS, QID, SOS, HS), meal relationships (Before Food, After Food, Empty Stomach), and duration in days or weeks.',
    highlights: [
      'Standard Indian prescription dosage notations (1-0-1, OD, BD, TDS, SOS)',
      'Pre-configured route options (Oral, Topical, Sublingual, IV, IM, Inhalation)',
      'Dedicated special instructions field per drug (e.g., "Mix with warm water")',
      'Reorder medications or adjust course durations with single-click buttons',
    ],
  },
  {
    icon: HeartPulse,
    badge: 'Patient Vitals',
    title: 'Comprehensive Vitals & Clinical Examination Grid',
    description:
      'Track vital parameters cleanly on every prescription. Record Blood Pressure (Systolic / Diastolic), Pulse Rate (bpm), Body Temperature (°F / °C), Oxygen Saturation (SpO2 %), Respiratory Rate, Body Weight (kg), Height (cm), and automated BMI calculation.',
    highlights: [
      'Visual indicator cards for vital abnormalities',
      'Automatic Body Mass Index (BMI) calculator from height & weight',
      'Chief complaints, clinical findings, and provisional diagnosis fields',
      'Known drug allergies alert banner prominently printed at top',
    ],
  },
  {
    icon: FileText,
    badge: 'Clinic Branding',
    title: 'Custom Clinic Letterhead & Digital Watermarks',
    description:
      'Turn every prescription into a professional clinic brand ambassador. Upload your clinic logo, doctor degrees (MBBS, MD, MS, DNB), State Medical Council Registration Number, clinic address, phone numbers, consultation timings, and custom footer notices.',
    highlights: [
      'Upload high-resolution clinic or hospital logo',
      'Automatic inclusion of NMC/State Medical Council registration number',
      'Customizable clinic header banner and emergency contact numbers',
      'Support for pre-printed letterhead paper (hide digital header when printing)',
    ],
  },
  {
    icon: Share2,
    badge: 'Patient Experience',
    title: '1-Click WhatsApp Sharing & Vector PDF Download',
    description:
      'Save paper and delight patients. With one click, send the finalized prescription directly to the patient’s WhatsApp number as a crystal-clear PDF. Patients receive a lightweight, searchable document that pharmacies can read effortlessly without illegible handwriting issues.',
    highlights: [
      'Direct WhatsApp dispatch with pre-filled professional message',
      'High-resolution vector A4 PDF export (100% sharp on zoom and print)',
      'Direct browser printing with custom page margin calibration',
      'Cloud storage of generated prescriptions for easy retrieval',
    ],
  },
  {
    icon: Languages,
    badge: 'Patient Adherence',
    title: 'Bilingual & Vernacular Patient Instructions',
    description:
      'Language barriers frequently cause medication non-compliance in India. PrescriptionMaker supports bilingual prescription layouts with English and Hindi labels, as well as customized dietary instructions and precautions in local languages.',
    highlights: [
      'Bilingual template with Hindi & English field labels (मरीज का नाम / खुराक)',
      'Dietary advice bullets (Low sodium, diabetic diet, high fiber, hydration)',
      'Precautions, follow-up return dates, and emergency SOS warnings',
      'Prevents pharmacy misinterpretation and dosage confusion',
    ],
  },
  {
    icon: ShieldCheck,
    badge: 'Legal & Medical Compliance',
    title: 'NMC 2023 & Telemedicine Guidelines Ready',
    description:
      'Designed to strictly comply with the National Medical Commission (NMC) Registered Medical Practitioner Regulations 2023, the MoHFW Telemedicine Practice Guidelines 2020, and the Information Technology Act 2000 for electronic medical records.',
    highlights: [
      'Complies with mandatory prescription elements prescribed by the NMC',
      'Section 5 IT Act 2000 electronic signature readiness',
      'Schedule H / H1 / X drug regulatory caution formatting',
      'Full data confidentiality with TLS 1.3 encryption and secure storage',
    ],
  },
]

const COMPARISON_ROWS = [
  {
    feature: 'Prescription Creation Time',
    traditional: '3 - 5 mins (handwritten)',
    wordProcessor: '5 - 8 mins (formatting hassle)',
    prescriptionMaker: '30 - 60 seconds',
  },
  {
    feature: 'Legibility & Dispensing Accuracy',
    traditional: 'Poor (leading cause of Rx errors)',
    wordProcessor: 'Moderate',
    prescriptionMaker: '100% Clear & Legible',
  },
  {
    feature: 'Specialty Templates',
    traditional: 'None (blank paper)',
    wordProcessor: 'Manual tables only',
    prescriptionMaker: '15+ Clinical Layouts',
  },
  {
    feature: 'Direct WhatsApp Sharing',
    traditional: 'Requires camera photo of pad',
    wordProcessor: 'Export, save, manually attach',
    prescriptionMaker: '1-Click Direct WhatsApp Share',
  },
  {
    feature: 'Hand-Drawing / Stylus Support',
    traditional: 'Pen only, no digital archive',
    wordProcessor: 'Not supported',
    prescriptionMaker: 'Apple Pencil & Stylus Canvas',
  },
  {
    feature: 'Dosage Notation (1-0-1, OD, BD)',
    traditional: 'Unstructured scribble',
    wordProcessor: 'Manual typing',
    prescriptionMaker: 'Built-in Indian clinical standards',
  },
  {
    feature: 'Compliance (NMC 2023 & IT Act)',
    traditional: 'Variable, often missing details',
    wordProcessor: 'No built-in validation',
    prescriptionMaker: 'Mandatory clinical fields verified',
  },
]

export default function FeaturesPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org Breadcrumb and SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'PrescriptionMaker Features — Digital Prescription Software',
            description:
              'Complete feature breakdown of PrescriptionMaker digital prescription platform for doctors and clinics in India.',
            url: 'https://prescriptionmaker.in/features',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prescriptionmaker.in' },
                { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://prescriptionmaker.in/features' },
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
              Features
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Built Exclusively for Doctors & Clinics in India
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Every Feature You Need for{' '}
            <span className="gradient-text">Flawless Digital Prescriptions</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminate illegible handwriting, streamline fast OPD consultations, and delight your
            patients with high-resolution digital prescriptions in compliance with National Medical
            Commission guidelines.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all hover:bg-primary/90 hover:shadow-teal-lg"
            >
              Start Creating Prescriptions Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
            >
              Browse 15+ Templates
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {DETAILED_FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="rounded-2xl border border-border bg-white p-7 sm:p-8 shadow-soft transition-all duration-300 hover:border-primary/30 hover:shadow-soft-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {feat.badge}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-600 mb-6">{feat.description}</p>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Key Highlights
                  </h3>
                  <ul className="space-y-2">
                    {feat.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comparison Section */}
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-slate-50 p-6 sm:p-10 shadow-soft mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Comparison</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Doctors Choose PrescriptionMaker
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              See how digital prescriptions transform your clinical workflow compared to paper or generic software.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-white/70">
                  <th className="py-3 px-4 font-semibold text-slate-900">Feature</th>
                  <th className="py-3 px-4 font-semibold text-slate-500">Handwritten Pad</th>
                  <th className="py-3 px-4 font-semibold text-slate-500">Word / Docs</th>
                  <th className="py-3 px-4 font-bold text-teal-800 bg-teal-50/80 rounded-t-lg">
                    PrescriptionMaker
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">{row.feature}</td>
                    <td className="py-3.5 px-4 text-slate-600">{row.traditional}</td>
                    <td className="py-3.5 px-4 text-slate-600">{row.wordProcessor}</td>
                    <td className="py-3.5 px-4 font-semibold text-teal-800 bg-teal-50/50">
                      {row.prescriptionMaker}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">
            Transform Your Clinical Practice in Minutes
          </h2>
          <p className="mx-auto max-w-2xl text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Join thousands of doctors across India who have modernized their OPD consultations.
            No credit card required. Free plan available forever.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
            >
              Get Started Free Today
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View Transparent Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
