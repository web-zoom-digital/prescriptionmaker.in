import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ShieldCheck, HeartHandshake, Zap, Stethoscope, ArrowRight, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About PrescriptionMaker — Dedicated Digital Prescription Platform for Indian Healthcare',
  description:
    'PrescriptionMaker was built to eliminate medication errors from illegible handwriting and empower 1.3+ million Indian doctors with fast, legally compliant, beautiful digital prescriptions.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/about',
  },
  openGraph: {
    title: 'About PrescriptionMaker | Modernizing Healthcare in India',
    description:
      'Our mission is to help doctors create legible, NMC-compliant digital prescriptions in seconds. Trusted across clinics and hospitals in India.',
    url: 'https://prescriptionmaker.in/about',
  },
}

const VALUES = [
  {
    icon: Stethoscope,
    title: 'Built For Clinical Speed',
    description:
      'Doctors consult dozens of patients in high-pressure OPD sessions. Our software is designed to save time with zero clutter, rapid keyboard shortcuts, and instant PDF generation.',
  },
  {
    icon: ShieldCheck,
    title: 'Uncompromising Patient Privacy',
    description:
      'We believe doctor-patient confidentiality is sacred. We never sell patient data, scrape medical histories for third-party advertisers, or compromise on cloud data security.',
  },
  {
    icon: Award,
    title: 'Strict Regulatory Adherence',
    description:
      'We design strictly in accordance with National Medical Commission (NMC) 2023 regulations, Telemedicine Practice Guidelines 2020, and the Information Technology Act 2000.',
  },
  {
    icon: HeartHandshake,
    title: 'Doctor-Centric Empowerment',
    description:
      'We give healthcare practitioners full control over their clinical identity, custom letterheads, digital signatures, and workflow — without locking them into rigid, expensive hospital software.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org AboutPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About PrescriptionMaker',
            description:
              'PrescriptionMaker is an Indian healthcare technology initiative dedicated to modernizing prescription writing and eliminating dispensing errors.',
            url: 'https://prescriptionmaker.in/about',
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
              About
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="section-label mb-3">Our Mission</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Modernizing Prescription Writing for{' '}
            <span className="gradient-text">1.3+ Million Indian Doctors</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Every day in India, millions of prescriptions are written on paper pads. Many are difficult
            to decipher, leading to pharmacy dispensing mistakes, medication non-adherence, and
            preventable clinical complications. PrescriptionMaker was created to solve this problem permanently.
          </p>
        </div>

        {/* Story Section */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-8 sm:p-12 shadow-soft mb-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Why We Built PrescriptionMaker</h2>
          <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              In busy Indian outpatient departments (OPDs), doctors examine 40 to 100+ patients in a single morning session. Traditional paper prescription pads have remained largely unchanged for a century. While convenient, paper pads cannot be backed up, cannot be read clearly on phone screens, and frequently cause pharmacist confusion between similar-sounding drug names (such as Metformin vs Metronidazole, or Celebrex vs Celexa).
            </p>
            <p>
              On the other end of the spectrum, existing hospital Electronic Medical Record (EMR) systems are bloated, slow, expensive, and require dozens of clicks just to write a simple antibiotic prescription.
            </p>
            <p>
              <strong>PrescriptionMaker bridges this gap:</strong> It provides the elegance, speed, and simplicity of writing on a notepad, combined with the power of high-resolution vector A4 PDF export, instant 1-click WhatsApp delivery, and statutory NMC 2023 compliance.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="section-label mb-2">Values</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The Principles That Guide Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((val) => {
              const Icon = val.icon
              return (
                <div key={val.title} className="rounded-2xl border border-border bg-white p-7 shadow-soft">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{val.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{val.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Facts */}
        <div className="rounded-2xl bg-slate-50 border border-border p-8 sm:p-10 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-600">15+</div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Specialty Templates</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-600">&lt; 60s</div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Average Rx Time</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-600">100%</div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">NMC Compliant</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-600">₹0</div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Free Plan Forever</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Join the Digital Prescription Revolution
          </h2>
          <p className="mx-auto max-w-xl text-slate-300 text-sm mb-6">
            Help build a safer, faster healthcare future for your patients. Start creating prescriptions today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
