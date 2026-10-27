import type { Metadata } from 'next'
import Link from 'next/link'
import {
  UserCircle2,
  LayoutTemplate,
  FilePenLine,
  Pill,
  Share2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Baby,
  Smile,
  HeartPulse,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works — Step-by-Step Digital Prescription Workflow for Doctors',
  description:
    'Learn how PrescriptionMaker helps doctors create and export professional digital prescriptions in under 60 seconds. Setup clinic profile, choose specialty templates, enter vitals and medicines, and share on WhatsApp.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/how-it-works',
  },
  openGraph: {
    title: 'How PrescriptionMaker Works | Digital Prescription Guide',
    description:
      'Step-by-step clinical workflow: setup doctor profile, select template, input patient vitals & Rx, and generate print-ready A4 PDF.',
    url: 'https://prescriptionmaker.in/how-it-works',
  },
}

const STEPS = [
  {
    step: '01',
    title: 'Set Up Your Clinic Profile & Letterhead',
    subtitle: 'Takes 60 seconds once — automatically applied to every prescription',
    icon: UserCircle2,
    description:
      'Enter your full name, qualifications (MBBS, MD, MS, BDS, etc.), State Medical Council Registration Number, and upload your clinic or hospital logo. Configure your clinic address, consultation hours, emergency phone number, and digital signature.',
    tips: [
      'Upload high-resolution PNG clinic logo for sharp printing',
      'Add secondary degrees, fellowships, or specializations',
      'Toggle digital header on or off if using pre-printed letterhead paper',
    ],
  },
  {
    step: '02',
    title: 'Choose a Clinically-Optimized Template',
    subtitle: '15+ structurally distinct layouts designed for your practice',
    icon: LayoutTemplate,
    description:
      'Select a template tailored to your clinical specialty. Choose Classic Letterhead for senior private practice, Vitals-First for Cardiology/Critical Care, Multi-Section Boxed for Pediatrics, SOAP Notes for academic medicine, or Bilingual Indian (English + Hindi) for regional OPD clinics.',
    tips: [
      'Switch templates at any point without retyping patient data',
      'Adjust margins, line heights, and section orders to your taste',
      'Preview real-time changes immediately in A4 portrait format',
    ],
  },
  {
    step: '03',
    title: 'Record Patient Demographics & Vitals',
    subtitle: 'Fast keyboard navigation with automatic BMI calculation',
    icon: FilePenLine,
    description:
      'Input the patient’s name, age, gender, and contact number. Record clinical vitals including Blood Pressure (Systolic / Diastolic), Pulse Rate, SpO2 %, Temperature, and Weight. The system automatically computes and flags Body Mass Index (BMI).',
    tips: [
      'Prominently mark known drug allergies (e.g. Penicillin, Sulfa drugs)',
      'Record chief complaints and duration with quick shortcuts',
      'Auto-save protects your draft against browser crashes or network drops',
    ],
  },
  {
    step: '04',
    title: 'Add Medications, Dosages & Lab Tests',
    subtitle: 'Standard Indian clinical frequencies (1-0-1, OD, BD, TDS, SOS)',
    icon: Pill,
    description:
      'Add medications with dosage form (Tab, Cap, Syrup, Injection, Drops), strength, frequency notation (1-0-1, OD, BD, TDS, SOS), relationship to meals (Before Food, After Food), and duration in days. Add diagnostic investigations (CBC, Lipid Profile, X-Ray, ECG) and personalized lifestyle advice.',
    tips: [
      'Use standard Indian frequency abbreviations with 1 click',
      'Add specific patient instructions (e.g., "Take with plenty of water")',
      'Reorder medicines logically with quick drag-and-drop handles',
    ],
  },
  {
    step: '05',
    title: 'Download Vector PDF & 1-Click WhatsApp Share',
    subtitle: 'Instant delivery to patient’s phone or high-speed clinic printer',
    icon: Share2,
    description:
      'Instantly generate a crystal-clear, print-ready A4 PDF. Send it directly to the patient’s WhatsApp number with one tap, or print directly using your standard clinic laser or inkjet printer. The prescription is permanently archived in your cloud history.',
    tips: [
      'Lightweight vector PDF ensures 100% sharp text at any zoom level',
      'Zero paper waste for remote telemedicine consultations',
      'Patients can forward digital PDF directly to local chemist shops',
    ],
  },
]

const SPECIALTY_WORKFLOWS = [
  {
    specialty: 'General Physicians & Family Doctors',
    icon: Stethoscope,
    benefit:
      'Fast-track busy morning OPDs. Prescribe common URI, fever, and acute infections in under 45 seconds using standardized dosage suggestions.',
  },
  {
    specialty: 'Pediatricians & Child Specialists',
    icon: Baby,
    benefit:
      'Track child weight, specify exact syrup doses in ml or drops, and document immunization advice with dedicated boxed pediatric templates.',
  },
  {
    specialty: 'Dental Surgeons',
    icon: Smile,
    benefit:
      'Document pre- and post-extraction medication courses (antibiotics, analgesics, antiseptic mouthwash) with clear duration indicators.',
  },
  {
    specialty: 'Cardiologists & Diabetologists',
    icon: HeartPulse,
    benefit:
      'Vitals-First layouts prioritize BP, pulse, and blood sugar tracking. Include complex multi-drug regimens with detailed meal timing notes.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org HowTo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to Create a Digital Prescription on PrescriptionMaker',
            description:
              'Step-by-step guide for healthcare professionals to create, customize, and export digital prescriptions as PDF or via WhatsApp.',
            step: STEPS.map((s, idx) => ({
              '@type': 'HowToStep',
              position: idx + 1,
              name: s.title,
              text: s.description,
            })),
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
              How It Works
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Simple, Fast & Clinical
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            From Consultation to Prescription{' '}
            <span className="gradient-text">in Under 60 Seconds</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            PrescriptionMaker is engineered around the real-world consultation speed of Indian doctors.
            No unnecessary clicks, no clunky software — just pure clinical efficiency.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all hover:bg-primary/90"
            >
              Try It Free Right Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Explore Templates
            </Link>
          </div>
        </div>

        {/* Detailed 5-Step Process */}
        <div className="mx-auto max-w-4xl space-y-12 mb-24">
          {STEPS.map((stepItem, idx) => {
            const Icon = stepItem.icon
            return (
              <div
                key={stepItem.step}
                className="relative rounded-2xl border border-border bg-white p-7 sm:p-9 shadow-soft transition-all hover:border-primary/30 hover:shadow-soft-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Step badge & icon */}
                  <div className="flex-shrink-0 flex items-center gap-4 sm:flex-col sm:items-center">
                    <span className="text-2xl font-black text-teal-600 font-mono">
                      {stepItem.step}
                    </span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-primary ring-1 ring-teal-100">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                      {stepItem.subtitle}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 mb-3">
                      {stepItem.title}
                    </h2>
                    <p className="text-sm sm:text-base leading-relaxed text-slate-600 mb-5">
                      {stepItem.description}
                    </p>

                    {/* Pro tips */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Clinical Pro Tips:
                      </span>
                      <ul className="space-y-1.5">
                        {stepItem.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Specialty Use Cases */}
        <div className="mx-auto max-w-5xl mb-24">
          <div className="text-center mb-10">
            <span className="section-label mb-2">Specialties</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Tailored for Every Medical Specialty
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              See how different medical practitioners leverage PrescriptionMaker in their daily OPD consultations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SPECIALTY_WORKFLOWS.map((sp) => {
              const Icon = sp.icon
              return (
                <div key={sp.specialty} className="rounded-xl border border-border bg-white p-6 shadow-soft">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{sp.specialty}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{sp.benefit}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">
            Ready to Experience the 60-Second Workflow?
          </h2>
          <p className="mx-auto max-w-xl text-slate-300 text-sm sm:text-base mb-8">
            Start free today with no obligations. Join thousands of physicians creating crystal-clear prescriptions.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Create Your First Prescription Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
