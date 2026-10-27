import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Sparkles, ArrowRight, HelpCircle, Pill, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prescription Abbreviations List India — 1-0-1, OD, BD, TDS, SOS Meaning',
  description:
    'Complete guide to medical prescription abbreviations in India: 1-0-1, OD, BD, TDS, QID, SOS, AC, PC, HS, STAT, and drug forms (Tab, Syp, Cap, Inj). Explanations for doctors, students, and patients.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/abbreviations',
  },
  openGraph: {
    title: 'Medical Prescription Abbreviations Meaning | PrescriptionMaker',
    description:
      'Complete list of doctor prescription abbreviations used in India: frequency notations (1-0-1, OD, BD, TDS, SOS), timings (AC, PC, HS), and formulations.',
    url: 'https://prescriptionmaker.in/abbreviations',
  },
}

const FREQUENCY_ABBREVIATIONS = [
  { abbr: '1 - 0 - 1', latin: 'Subah - Shaam', meaning: 'One in Morning, None in Afternoon, One at Night', timing: 'Twice daily with meals' },
  { abbr: '1 - 0 - 0', latin: 'Subah Only', meaning: 'One in Morning only', timing: 'Once daily in the morning' },
  { abbr: '0 - 0 - 1', latin: 'Raat Only (HS)', meaning: 'One at Night only (before bed)', timing: 'Once daily at bedtime' },
  { abbr: '1 - 1 - 1', latin: 'Subah - Dopehar - Shaam', meaning: 'One in Morning, One in Afternoon, One at Night', timing: 'Three times daily' },
  { abbr: 'OD', latin: 'Omni Die', meaning: 'Once every day', timing: 'Same time every 24 hours' },
  { abbr: 'BD / BID', latin: 'Bis in Die', meaning: 'Twice a day', timing: 'Every 12 hours' },
  { abbr: 'TDS / TID', latin: 'Ter in Die', meaning: 'Three times a day', timing: 'Every 8 hours' },
  { abbr: 'QID', latin: 'Quater in Die', meaning: 'Four times a day', timing: 'Every 6 hours' },
  { abbr: 'SOS', latin: 'Si Opus Sit', meaning: 'Take only when needed / in emergency', timing: 'As required (e.g. for pain, fever)' },
  { abbr: 'HS', latin: 'Hora Somni', meaning: 'At bedtime', timing: 'Just before going to sleep' },
  { abbr: 'STAT', latin: 'Statim', meaning: 'Immediately / Right now', timing: 'Single urgent initial dose' },
  { abbr: 'Q4H / Q6H', latin: 'Quaque 4 / 6 Hora', meaning: 'Every 4 or 6 hours', timing: 'Scheduled interval dosing' },
  { abbr: 'PRN', latin: 'Pro Re Nata', meaning: 'As the occasion arises / As needed', timing: 'Symptom-dependent' },
]

const TIMING_ABBREVIATIONS = [
  { abbr: 'AC', latin: 'Ante Cibum', meaning: 'Before food / on an empty stomach', explanation: 'Take 30 to 60 minutes before meals (common for antacids, thyroid hormone).' },
  { abbr: 'PC', latin: 'Post Cibum', meaning: 'After food / after meals', explanation: 'Take after eating food to avoid gastric irritation (common for painkillers, antibiotics).' },
  { abbr: 'Intra-cibum', latin: 'With meals', meaning: 'Take during or mid-meal', explanation: 'Swallow with the meal or immediately after the first bite.' },
  { abbr: 'OM', latin: 'Omni Mane', meaning: 'Every morning', explanation: 'Take first thing in the morning.' },
  { abbr: 'ON', latin: 'Omni Nocte', meaning: 'Every night', explanation: 'Take every night at bedtime.' },
]

const FORM_ABBREVIATIONS = [
  { abbr: 'Tab.', full: 'Tablet', description: 'Solid compressed oral dosage form' },
  { abbr: 'Cap.', full: 'Capsule', description: 'Gelatin shell containing powder, liquid, or pellets' },
  { abbr: 'Syp.', full: 'Syrup / Suspension', description: 'Liquid oral medication (commonly for pediatric or geriatric patients)' },
  { abbr: 'Inj.', full: 'Injection', description: 'Intramuscular (IM), Intravenous (IV), or Subcutaneous (SC) solution' },
  { abbr: 'Oint. / Gel', full: 'Ointment / Gel', description: 'Topical semi-solid preparation for external skin application' },
  { abbr: 'Gtt.', full: 'Guttae (Drops)', description: 'Liquid dropper solution for Eyes (Eye drops), Ears (Ear drops), or Nose' },
  { abbr: 'Inh. / Resp.', full: 'Inhaler / Respule', description: 'Aerosolized respiratory medication for asthma/COPD' },
  { abbr: 'PDR / Sachet', full: 'Powder / Granules', description: 'To be reconstituted in water, milk, or oral rehydration solution' },
]

export default function AbbreviationsPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: 'Medical Prescription Abbreviations Meaning in India',
            description:
              'Complete dictionary of prescription frequency, timing, and formulation abbreviations used by doctors in India.',
            url: 'https://prescriptionmaker.in/abbreviations',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prescriptionmaker.in' },
                { '@type': 'ListItem', position: 2, name: 'Abbreviations', item: 'https://prescriptionmaker.in/abbreviations' },
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
              Prescription Abbreviations
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <BookOpen className="h-3.5 w-3.5 text-teal-600" />
            Clinical Reference Dictionary
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Medical Prescription <span className="gradient-text">Abbreviations List</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Understand standard dosage frequencies (1-0-1, OD, BD, TDS, SOS), food timings (AC, PC, HS),
            and pharmaceutical forms used in doctor prescriptions across India.
          </p>
        </div>

        {/* Frequency Table */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">1. Frequency Abbreviations & Notations</h2>
              <p className="text-xs text-slate-500">How often to take the prescribed medicine</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-slate-900 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Abbreviation</th>
                  <th className="py-3 px-4">Latin / Indian Origin</th>
                  <th className="py-3 px-4">Clinical Meaning</th>
                  <th className="py-3 px-4">Dosage Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {FREQUENCY_ABBREVIATIONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-teal-800 font-mono text-sm sm:text-base">
                      {row.abbr}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs italic">{row.latin}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{row.meaning}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{row.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timing Table */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">2. Meal & Timing Abbreviations</h2>
              <p className="text-xs text-slate-500">Relationship of medication intake to food</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-slate-900 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Abbreviation</th>
                  <th className="py-3 px-4">Latin Phrase</th>
                  <th className="py-3 px-4">Meaning</th>
                  <th className="py-3 px-4">Clinical Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {TIMING_ABBREVIATIONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-teal-800 font-mono">{row.abbr}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs italic">{row.latin}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{row.meaning}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{row.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulations Table */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">3. Dosage Form Abbreviations</h2>
              <p className="text-xs text-slate-500">Pharmaceutical forms of prescribed drugs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FORM_ABBREVIATIONS.map((form, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-teal-800 font-mono text-base">{form.abbr}</span>
                  <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {form.full}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{form.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Auto-Format Dosages with PrescriptionMaker
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            No need to type abbreviations manually. PrescriptionMaker provides 1-click dosage buttons for 1-0-1, OD, BD, TDS, SOS, before food, and after food.
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Try the Prescription Editor Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
