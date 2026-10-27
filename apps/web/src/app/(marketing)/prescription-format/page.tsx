import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Download,
  Share2,
  Printer,
  ShieldCheck,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Doctor Prescription Pad Format PDF — Standard Medical Format in India (NMC 2023)',
  description:
    'Download and customize the standard doctor prescription format in India. Complete guide to mandatory NMC 2023 guidelines, prescription writing sections, and free PDF template generator.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/prescription-format',
  },
  openGraph: {
    title: 'Standard Doctor Prescription Pad Format India | PrescriptionMaker',
    description:
      'The complete guide to medical prescription format in India according to NMC guidelines. Customize doctor letterhead and export A4 PDF in seconds.',
    url: 'https://prescriptionmaker.in/prescription-format',
  },
}

const SECTIONS = [
  {
    part: 'Part 1: The Superscription',
    title: 'Doctor Credentials & Clinic Letterhead',
    content:
      'The topmost section containing the physician’s professional identity and the clinic/hospital branding. Under NMC Regulations 2023, this must display the doctor’s full registered name, medical qualifications recognized by the NMC (e.g. MBBS, MD), State Medical Council Registration Number, clinic address, phone number, and the traditional Rx symbol.',
    checklist: [
      'Doctor full name (as per State Medical Register)',
      'Degrees & Fellowships (MBBS, MD, MS, BDS, etc.)',
      'NMC or State Medical Council Reg. No. (Mandatory)',
      'Clinic / Hospital name, physical address & phone number',
      'The Latin symbol "Rx" (meaning "recipe" or "take thou")',
    ],
  },
  {
    part: 'Part 2: Patient Demographics & Vitals',
    title: 'Patient Identification & Clinical Examination',
    content:
      'Essential for drug dosage calculations, patient verification, and medical-legal records. Records the patient’s full name, age, gender, date of consultation, serial OPD number, and vital signs.',
    checklist: [
      'Patient full name, age (years/months), and gender',
      'Date of consultation and OPD slip/patient ID number',
      'Recorded vitals: BP, Pulse, SpO2, Temperature, Weight (kg)',
      'Automatic Body Mass Index (BMI) calculation',
      'Known drug allergies (highlighted in red/amber banner)',
    ],
  },
  {
    part: 'Part 3: The Inscription',
    title: 'The Medication Specification (Rx)',
    content:
      'The core medicinal directive. Specifies the pharmaceutical formulation, generic/brand drug molecule name, strength, and route of administration. NMC guidelines strongly recommend writing generic names clearly in capital letters.',
    checklist: [
      'Dosage form: Tab. (Tablet), Syp. (Syrup), Cap. (Capsule), Inj. (Injection)',
      'Clear drug name with strength (e.g., Tab. Paracetamol 650 mg)',
      'Route of administration (Oral, Topical, Sublingual, IV, IM)',
      'Avoid dangerous abbreviations that cause pharmacist confusion',
    ],
  },
  {
    part: 'Part 4: The Subscription & Directions',
    title: 'Dosage Frequency & Patient Instructions',
    content:
      'Instructions for the dispensing pharmacist and the patient regarding dosage frequency, relationship to food, and course duration.',
    checklist: [
      'Frequency notation: 1-0-1, OD, BD, TDS, QID, or SOS',
      'Meal relationship: Before Food (AC) / After Food (PC)',
      'Total duration of treatment (e.g., "For 5 Days")',
      'Specific warnings (e.g., "Complete full antibiotic course")',
    ],
  },
  {
    part: 'Part 5: Sign-Off & Follow-Up',
    title: 'Doctor Signature, Stamp & Return Review Date',
    content:
      'Validates the legal authority of the prescription. Under Section 5 of the IT Act 2000, a digital signature or encrypted digital stamp on an electronic PDF has identical legal validity to a physical pen signature.',
    checklist: [
      'Registered Medical Practitioner’s handwritten or digital signature',
      'Official clinic/hospital rubber stamp or digital verification badge',
      'Return follow-up review date or emergency SOS advisory',
      'Statutory prescription expiry or review notice',
    ],
  },
]

export default function PrescriptionFormatPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org WebPage & MedicalWebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: 'Standard Doctor Prescription Pad Format in India',
            description:
              'Comprehensive guide and free template generator for doctor prescription pad formats conforming to NMC 2023 guidelines.',
            url: 'https://prescriptionmaker.in/prescription-format',
            about: {
              '@type': 'MedicalProcedure',
              name: 'Medical Prescription Writing',
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prescriptionmaker.in' },
                { '@type': 'ListItem', position: 2, name: 'Prescription Format', item: 'https://prescriptionmaker.in/prescription-format' },
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
              Prescription Format
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            NMC 2023 & Indian Medical Council Guidelines
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Doctor Prescription Pad{' '}
            <span className="gradient-text">Format & Guidelines (PDF)</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            The complete medical and legal anatomy of a valid prescription in India. Learn the 5
            mandatory sections, statutory NMC guidelines, and create your custom branded PDF letterhead online.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all hover:bg-primary/90"
            >
              Generate This Format Online Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Browse 15+ Format Templates
            </Link>
          </div>
        </div>

        {/* Visual Anatomy Diagram */}
        <div className="mx-auto max-w-4xl rounded-2xl border-2 border-teal-100 bg-white p-6 sm:p-10 shadow-soft-lg mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Visual Breakdown</span>
            <h2 className="text-2xl font-bold text-slate-900">
              Anatomy of a Standard Indian Medical Prescription
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Based on the National Medical Commission Registered Medical Practitioner Regulations 2023
            </p>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm font-sans bg-slate-50/50">
            {/* Header / Superscription */}
            <div className="p-4 sm:p-6 bg-teal-50/60 border-l-4 border-l-teal-600">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-teal-800">
                    1. Superscription (Doctor & Clinic Letterhead)
                  </div>
                  <div className="font-bold text-base text-slate-900">
                    DR. ADITYA VERMA, MBBS, MD (Medicine)
                  </div>
                  <div className="text-slate-600 text-xs">
                    Reg No: DMC/R/12458 | Consultant Physician & Diabetologist
                  </div>
                  <div className="text-slate-500 text-xs">
                    City Care Clinic, Greater Kailash 1, New Delhi - 110048 | Ph: +91 98765 43210
                  </div>
                </div>
                <div className="text-2xl font-black text-teal-800 font-serif">Rx</div>
              </div>
            </div>

            {/* Patient Demographics */}
            <div className="p-4 sm:p-6 bg-white border-l-4 border-l-blue-600">
              <div className="text-xs uppercase font-bold tracking-wider text-blue-800 mb-2">
                2. Patient Demographics, Vitals & Allergies
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
                <div><strong>Patient:</strong> Rahul Sharma</div>
                <div><strong>Age/Gender:</strong> 38 Y / Male</div>
                <div><strong>Date:</strong> 27 Oct 2026</div>
                <div><strong>OPD No:</strong> #2026-8812</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="bg-slate-100 rounded px-2 py-0.5">BP: 128/84 mmHg</span>
                <span className="bg-slate-100 rounded px-2 py-0.5">Pulse: 74 bpm</span>
                <span className="bg-slate-100 rounded px-2 py-0.5">SpO2: 98%</span>
                <span className="bg-slate-100 rounded px-2 py-0.5">Weight: 72 kg</span>
                <span className="bg-red-50 text-red-700 font-semibold rounded px-2 py-0.5 border border-red-200">
                  ⚠️ ALLERGY: Penicillin
                </span>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="p-3 sm:p-4 bg-slate-100/50">
              <span className="font-semibold text-slate-900">Provisional Diagnosis: </span>
              <span className="text-slate-700">Acute Viral Pharyngitis with Mild Dehydration</span>
            </div>

            {/* Inscription & Subscription */}
            <div className="p-4 sm:p-6 bg-white border-l-4 border-l-emerald-600">
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-800 mb-3">
                3 & 4. Inscription & Subscription (Medications & Dosages)
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-bold text-slate-900">1. TAB. PARACETAMOL 650 MG</div>
                    <div className="text-xs text-slate-500">Route: Oral | Take with a glass of water</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded">1 - 0 - 1</span>
                    <div className="text-xs text-slate-500 mt-0.5">After Food • For 5 Days</div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-bold text-slate-900">2. TAB. LEVOCETIRIZINE 5 MG</div>
                    <div className="text-xs text-slate-500">Route: Oral</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded">0 - 0 - 1 (HS)</span>
                    <div className="text-xs text-slate-500 mt-0.5">At Bedtime • For 5 Days</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">3. SYP. AMBROXOL + GUAIFENESIN</div>
                    <div className="text-xs text-slate-500">Route: Oral | Shake well before use</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded">10 ml TDS</span>
                    <div className="text-xs text-slate-500 mt-0.5">After Food • For 5 Days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advice & Tests */}
            <div className="p-4 sm:p-6 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1">General Advice & Investigations:</div>
              <ul className="list-disc pl-5 text-slate-600 text-xs sm:text-sm space-y-1">
                <li>Warm saline gargles 3-4 times daily</li>
                <li>Adequate hydration (minimum 2.5 to 3 liters daily)</li>
                <li>If fever persists beyond 3 days, investigate: CBC, CRP</li>
              </ul>
            </div>

            {/* Signature & Stamp */}
            <div className="p-4 sm:p-6 bg-white border-l-4 border-l-purple-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-500">
                <div><strong>Follow-up:</strong> Review after 5 days or SOS</div>
                <div className="mt-1">Generated via PrescriptionMaker.in • Legally Valid Electronic Record</div>
              </div>
              <div className="text-right">
                <div className="font-serif italic text-lg text-slate-800">Dr. Aditya Verma</div>
                <div className="text-[11px] text-slate-500 font-semibold">Digitally Signed & Authenticated</div>
                <div className="text-[10px] text-teal-700">Reg No: DMC/R/12458</div>
              </div>
            </div>
          </div>
        </div>

        {/* The 5 Pillars Detailed */}
        <div className="mx-auto max-w-4xl space-y-8 mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Statutory Analysis</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Detailed Breakdown of the 5 Mandatory Sections
            </h2>
          </div>

          {SECTIONS.map((sec, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-white p-7 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                {sec.part}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">{sec.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{sec.content}</p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Required Checklist Items:
                </span>
                <ul className="space-y-1.5">
                  {sec.checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Create Your Custom Prescription Pad Online
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            Input your clinic logo, doctor registration number, choose from 15+ templates, and download print-ready A4 PDFs instantly.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Start Free — No Credit Card Needed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
