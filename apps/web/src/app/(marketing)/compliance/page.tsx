import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Medical Legal & NMC Compliance — Digital Prescription Guidelines India',
  description:
    'Complete guide to digital prescription legality in India: NMC 2023 Regulations, Telemedicine Practice Guidelines 2020, IT Act 2000 Section 4 & 5 digital signature validity, and Drugs & Cosmetics Rules.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/compliance',
  },
  openGraph: {
    title: 'Medical Legal & NMC Compliance Guide | PrescriptionMaker',
    description:
      'Understanding Indian legal standards for electronic prescriptions, NMC Registered Medical Practitioner regulations, and telemedicine compliance.',
    url: 'https://prescriptionmaker.in/compliance',
  },
}

const MANDATORY_PRESCRIPTION_ELEMENTS = [
  {
    element: 'Doctor Identity & Registration',
    legalBasis: 'NMC RMP Regulations 2023 & IMC Act',
    details:
      'Doctor full name, recognized medical degrees (MBBS, MD, MS, BDS, etc.), and State Medical Council / NMC Registration Number must be clearly stated on every prescription.',
  },
  {
    element: 'Patient Identification',
    legalBasis: 'Telemedicine Guidelines 2020 & Good Clinical Practice',
    details:
      'Full patient name, age, gender, date of consultation, and patient contact or residential address.',
  },
  {
    element: 'Clinical Details',
    legalBasis: 'Standard Medical Practice',
    details:
      'Provisional or final clinical diagnosis, chief complaints, recorded vital signs (BP, Pulse, Weight), and any known drug allergies.',
  },
  {
    element: 'Drug Inscription & Generic Name',
    legalBasis: 'Drugs & Cosmetics Act 1940 / NMC Mandate',
    details:
      'Legible drug name (generic name recommended or brand with clear generic molecule), formulation (Tab, Syp, Inj), dosage strength, administration route, frequency, and total course duration.',
  },
  {
    element: 'Special Instructions & Advice',
    legalBasis: 'Patient Safety Protocols',
    details:
      'Clear meal relationships (e.g., "Take after food"), precautions, lifestyle advice, and review / follow-up return date.',
  },
  {
    element: 'Doctor Signature / Digital Authentication',
    legalBasis: 'Information Technology Act 2000 (Section 4 & 5)',
    details:
      'Handwritten signature or authenticated digital / electronic signature verifying issuance by the registered medical practitioner.',
  },
]

const STATUTORY_FRAMEWORKS = [
  {
    title: 'National Medical Commission (NMC) Regulations 2023',
    icon: Scale,
    description:
      'The National Medical Commission Registered Medical Practitioner (Professional Conduct) Regulations mandate that prescriptions written by doctors must be legible, preferably printed or typed in uppercase, with clearly defined generic names where applicable. PrescriptionMaker is structured to satisfy every requirement of the NMC code of conduct.',
  },
  {
    title: 'Telemedicine Practice Guidelines 2020 (MoHFW & NITI Aayog)',
    icon: FileCheck2,
    description:
      'Under the official Telemedicine Practice Guidelines issued on 25 March 2020, registered medical practitioners are authorized to prescribe medications remotely using digital prescriptions, provided they follow List A (safe first-line medications), List B (add-on medications), and strictly abstain from prescribing prohibited List O medications (narcotics and Schedule X drugs).',
  },
  {
    title: 'Information Technology Act 2000 (Section 4 & 5)',
    icon: ShieldCheck,
    description:
      'Section 4 of the IT Act confers legal recognition upon electronic records, providing that any requirement for documents in writing is satisfied if available in electronic form. Section 5 provides that electronic/digital signatures carry the identical legal force of traditional ink signatures in Indian law.',
  },
  {
    title: 'Drugs and Cosmetics Act, 1940 & Rules, 1945',
    icon: BookOpen,
    description:
      'Governs the sale and dispensing of medications by retail pharmacists across India. Under Rule 65, pharmacists must dispense Schedule H, H1, and G medications only upon a valid prescription containing the doctor’s qualifications, registration number, patient name, and signature.',
  },
]

export default function CompliancePage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Medical Legal and Regulatory Compliance for Digital Prescriptions in India',
            description:
              'Comprehensive guidance on NMC 2023 Regulations, Telemedicine Practice Guidelines, and the legal validity of digital prescriptions under Indian law.',
            url: 'https://prescriptionmaker.in/compliance',
            about: {
              '@type': 'MedicalWebPage',
              name: 'Digital Prescription Legal Compliance India',
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
              Compliance
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            Statutory & Medical Regulatory Adherence
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Medical Legal & <span className="gradient-text">NMC Compliance</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            How PrescriptionMaker ensures full statutory adherence with the National Medical Commission (NMC)
            Regulations, Telemedicine Guidelines, and the Information Technology Act 2000.
          </p>
        </div>

        {/* Statutory Framework Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {STATUTORY_FRAMEWORKS.map((framework) => {
            const Icon = framework.icon
            return (
              <div
                key={framework.title}
                className="rounded-2xl border border-border bg-white p-7 shadow-soft hover:shadow-soft-md transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-primary ring-1 ring-teal-100 mb-5">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">{framework.title}</h2>
                <p className="text-sm leading-relaxed text-slate-600">{framework.description}</p>
              </div>
            )
          })}
        </div>

        {/* Mandatory Prescription Elements */}
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-soft mb-20">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <span className="section-label mb-2">Checklist</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Mandatory Elements of a Valid Medical Prescription in India
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Every prescription generated on PrescriptionMaker automatically prompts and validates these
              essential statutory fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MANDATORY_PRESCRIPTION_ELEMENTS.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
                  <h3 className="text-base font-semibold text-slate-900">{item.element}</h3>
                </div>
                <span className="inline-block text-[11px] font-semibold text-teal-700 bg-teal-100/70 rounded px-2 py-0.5 mb-2">
                  {item.legalBasis}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Telemedicine Prescribing Rules */}
        <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-6 sm:p-8 mb-20">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-950 mb-2">
                Telemedicine Medication Categorization Under Indian Law
              </h3>
              <p className="text-sm text-amber-900/80 leading-relaxed mb-4">
                When consulting patients remotely via telemedicine, Registered Medical Practitioners must
                adhere strictly to the three medication lists prescribed in the 2020 Telemedicine Guidelines:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/90 p-4 rounded-lg border border-amber-200">
                  <strong className="block text-slate-900 font-semibold mb-1">List A (First Consult)</strong>
                  Safe first-line medications for common ailments, ORS, paracetamol, common skin ointments, and refills for chronic conditions previously prescribed in person.
                </div>
                <div className="bg-white/90 p-4 rounded-lg border border-amber-200">
                  <strong className="block text-slate-900 font-semibold mb-1">List B (Follow-up)</strong>
                  Add-on medications to optimize existing therapy (e.g. altering hypertension, diabetes, or asthma drug doses during follow-up reviews).
                </div>
                <div className="bg-white/90 p-4 rounded-lg border border-amber-200">
                  <strong className="block text-red-900 font-semibold mb-1">List O (Strictly Prohibited)</strong>
                  Psychotropic medications, narcotics under NDPS Act, and Schedule X drugs cannot be prescribed via telemedicine under any circumstances.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Protection & Patient Confidentiality */}
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-soft mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Digital Personal Data Protection (DPDP) Act 2023 & Confidentiality
              </h2>
              <p className="text-xs text-muted-foreground">Compliance with healthcare data fiduciary standards</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              Under Indian medical ethics and the DPDP Act 2023, patient medical information is deemed sensitive personal data. PrescriptionMaker employs stringent architectural safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>End-to-End Encryption in Transit:</strong> All data transmissions between your browser and our servers are encrypted using TLS 1.3 / HTTPS.
              </li>
              <li>
                <strong>PostgreSQL Row Level Security (RLS):</strong> Every prescription record is isolated to the authenticated doctor’s unique cryptographic user ID. No cross-tenant access is possible.
              </li>
              <li>
                <strong>Zero Commercial Monetization:</strong> We do not sell, scrape, or provide anonymized patient data to pharmaceutical marketing firms, insurance companies, or third parties.
              </li>
              <li>
                <strong>Doctor Data Portability:</strong> Doctors maintain perpetual ownership of their data and may export or purge records upon demand.
              </li>
            </ul>
          </div>
        </div>

        {/* Action CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Prescribe with 100% Legal Confidence
          </h2>
          <p className="mx-auto max-w-xl text-slate-300 text-sm mb-6">
            Experience standard-compliant, legally robust prescription documentation built by healthcare technologists.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Create Compliant Prescription Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
