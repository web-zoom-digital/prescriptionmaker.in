import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Stethoscope,
  Baby,
  Smile,
  HeartPulse,
  Bone,
  Eye,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prescription Templates by Medical Specialty — Pediatric, Dental, Cardiology & More',
  description:
    'Tailored digital prescription templates for every medical specialty in India: General Medicine, Pediatrics, Dental Surgery, Cardiology, Orthopedics, Dermatology, Gynecology, and Ophthalmology.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/specialties',
  },
  openGraph: {
    title: 'Medical Specialty Prescription Solutions | PrescriptionMaker',
    description:
      'Explore prescription writing formats designed for your clinical specialty: pediatric dosing, dental pain protocols, cardiology vitals grids, and ophthalmology refraction formats.',
    url: 'https://prescriptionmaker.in/specialties',
  },
}

const SPECIALTIES = [
  {
    name: 'General Medicine & Family Practice',
    icon: Stethoscope,
    badge: 'High-Volume OPD',
    templateSlug: 'classic-letterhead',
    description:
      'Optimized for fast-paced morning OPD clinics seeing 40-100 patients daily. Rapidly document acute viral fevers, respiratory infections, gastrointestinal illnesses, and chronic hypertension/diabetes titrations.',
    features: [
      'Standard 1-0-1, OD, BD, TDS dosage shortcuts',
      'Common lab panels (CBC, LFT, KFT, Lipid Profile, HbA1c)',
      'Automated BMI calculation from height and weight',
      'Bilingual patient directions (English + Hindi)',
    ],
  },
  {
    name: 'Pediatrics & Neonatology',
    icon: Baby,
    badge: 'Child Care',
    templateSlug: 'multi-section-boxed',
    description:
      'Designed around the unique demands of child health: strict weight-based milliliter (ml) and drop dosing, pediatric syrup formulations, and vaccine immunization record tracking.',
    features: [
      'Precise body weight (kg) recording for accurate mg/kg dosing',
      'Syrup and drop volume notations (e.g. 2.5 ml TDS, 5 drops BD)',
      'Boxed multi-section layout separating complaints from exam findings',
      'Child immunization and developmental milestone notes',
    ],
  },
  {
    name: 'Dental Surgery & Periodontics',
    icon: Smile,
    badge: 'Dentistry',
    templateSlug: 'simple-rx-pad',
    description:
      'Engineered for BDS & MDS dental surgeons managing pre- and post-operative extraction care, endodontic pulpitis pain protocols, and periodontal antiseptic washes.',
    features: [
      'Pre-configured dental antibiotic regimens (Amoxicillin, Clavulanate)',
      'Analgesic pain protocols (Ibuprofen, Paracetamol, Ketorolac)',
      'Antiseptic chlorhexidine mouthwash and warm saline rinse instructions',
      'Stylus drawing support for tooth quadrant numbering charts',
    ],
  },
  {
    name: 'Cardiology & Diabetology',
    icon: HeartPulse,
    badge: 'Critical Care',
    templateSlug: 'vitals-first',
    description:
      'Prominently positions the vital signs matrix (BP, Pulse, SpO2, Temp, RR) at the top of the prescription. Ideal for cardiologists and diabetologists tracking longitudinal hemodynamics.',
    features: [
      'Dedicated vitals grid with abnormal value highlighting',
      'Complex multi-drug regimen support with detailed meal relationships',
      'Antiplatelet, statin, and antihypertensive safety notes',
      'Follow-up return date and SOS emergency advisory indicators',
    ],
  },
  {
    name: 'Orthopedics & Sports Medicine',
    icon: Bone,
    badge: 'Surgical & MSK',
    templateSlug: 'two-column-sidebar',
    description:
      'Tailored for orthopedic surgeons, spine specialists, and rheumatologists managing fractures, osteoarthritis, and musculoskeletal injuries.',
    features: [
      'NSAID gastro-protective co-prescription guidelines (PPI / H2 blocker)',
      'Physical therapy, icing, limb elevation, and rehabilitation directives',
      'Calcium, Vitamin D3, and joint supplement titration schedules',
      'Diagnostic imaging order fields (X-Ray, MRI, CT Scan)',
    ],
  },
  {
    name: 'Ophthalmology & Eye Care',
    icon: Eye,
    badge: 'Eye Specialist',
    templateSlug: 'eye-specialist-letterhead',
    description:
      'Includes specialized ocular notation for Left Eye (OS), Right Eye (OD), or Both Eyes (OU), refraction values, intraocular pressure (IOP), and tapering steroid drop regimens.',
    features: [
      'Teal specialty clinic letterhead with ocular watermark',
      'Eye drop dosage tapering schedules (e.g., 4x/day for 3 days, then 3x/day)',
      'Visual acuity and refraction measurement records',
      'Follow-up appointment booking block in footer',
    ],
  },
  {
    name: 'Obstetrics & Gynecology (OB-GYN)',
    icon: Activity,
    badge: 'Women Health',
    templateSlug: 'detailed-drug-chart',
    description:
      'Supports antenatal care (ANC) visits, gestational age (LMP, EDD), trimester-safe antibiotic and analgesic selection, and folic acid/iron supplementation.',
    features: [
      'Last Menstrual Period (LMP) and Expected Date of Delivery (EDD)',
      'Antenatal ultrasound (USG) and maternal screening orders',
      'Trimester-safe medicine verification warnings',
      'Detailed dietary advice for maternal nutrition',
    ],
  },
]

export default function SpecialtiesPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Prescription Solutions by Medical Specialty — PrescriptionMaker',
            description:
              'Dedicated digital prescription workflows and templates tailored for General Physicians, Pediatricians, Dentists, Cardiologists, and Surgeons.',
            url: 'https://prescriptionmaker.in/specialties',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prescriptionmaker.in' },
                { '@type': 'ListItem', position: 2, name: 'Specialties', item: 'https://prescriptionmaker.in/specialties' },
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
              Medical Specialties
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Designed For Your Medical Discipline
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Prescription Software Tailored to{' '}
            <span className="gradient-text">Your Clinical Specialty</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            One size does not fit all in healthcare. Explore specialized digital prescription workflows,
            templates, and clinical notations crafted for your practice.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all hover:bg-primary/90"
            >
              Browse All 15+ Templates
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Try Prescription Editor Free
            </Link>
          </div>
        </div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {SPECIALTIES.map((spec) => {
            const Icon = spec.icon
            return (
              <div
                key={spec.name}
                className="rounded-2xl border border-border bg-white p-7 sm:p-8 shadow-soft flex flex-col justify-between hover:border-primary/30 hover:shadow-soft-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {spec.badge}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-2">{spec.name}</h2>
                  <p className="text-sm leading-relaxed text-slate-600 mb-6">{spec.description}</p>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Specialized Capabilities
                  </h3>
                  <ul className="space-y-2 mb-6">
                    {spec.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/templates/${spec.templateSlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    View Recommended Template Layout
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start Writing Prescriptions for Your Practice
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            Join thousands of pediatricians, cardiologists, dental surgeons, and general physicians across India using PrescriptionMaker.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Create Your Free Doctor Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
