import type { Metadata } from 'next'
import Link from 'next/link'
import { Scale, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react'
import { DosageCalculatorInteractive } from '@/components/calculator/dosage-calculator-interactive'

export const metadata: Metadata = {
  title: 'Pediatric Drug Dosage Calculator India — Syrup ml & mg/kg Weight Calculator for Doctors',
  description:
    'Free online pediatric drug dosage calculator for Indian doctors and clinics. Calculate weight-based doses (mg/kg), syrup volumes (ml), drops, and adult drug regimens for Paracetamol, Amoxicillin, Azithromycin, and more.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/dosage-calculator',
  },
  openGraph: {
    title: 'Pediatric & Adult Drug Dosage Calculator India | PrescriptionMaker',
    description:
      'Fast, accurate weight-based dose calculator for pediatricians and general physicians in India. Calculate syrup ml, drop dosing, and adult regimens instantly.',
    url: 'https://prescriptionmaker.in/dosage-calculator',
  },
}

const DOSAGE_FAQS = [
  {
    q: 'How is pediatric dosage calculated by child weight in India?',
    a: 'Pediatric doses are calculated using the formula: Dose (mg) = Weight (kg) × Recommended Dosage (mg/kg/day). The total daily dose is then divided by the number of doses per day (e.g. divided into 3 doses for TDS, or 2 doses for BD). Finally, mg is converted into syrup volume (ml) based on the syrup concentration (e.g. 125 mg/5 ml or 250 mg/5 ml).',
  },
  {
    q: 'How to calculate Paracetamol syrup dose for a child?',
    a: 'The standard pediatric dose of Paracetamol is 15 mg/kg per dose, administered every 4 to 6 hours as needed (maximum 4 doses in 24 hours). For example, a 10 kg child requires: 10 kg × 15 mg/kg = 150 mg per dose. If using Paracetamol 250 mg/5 ml syrup, the volume is: (150 mg ÷ 250 mg) × 5 ml = 3.0 ml.',
  },
  {
    q: 'What is the standard pediatric Amoxicillin dosage in India?',
    a: 'Standard mild-to-moderate infections require 20 to 40 mg/kg/day divided into 3 doses (TDS). Severe infections or acute otitis media may require high-dose therapy at 80 to 90 mg/kg/day divided into 2 doses (BD).',
  },
  {
    q: 'Why is accurate weight measurement critical before prescribing for children?',
    a: 'Children metabolize medications differently from adults. Prescribing by age alone carries severe risks of under-dosing (therapeutic failure) or accidental toxicity. The National Medical Commission and Indian Academy of Pediatrics (IAP) mandate recording child body weight on every pediatric prescription.',
  },
]

export default function DosageCalculatorPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org WebApplication & MedicalWebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'PrescriptionMaker Drug Dosage Calculator',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'All',
            browserRequirements: 'Requires JavaScript. Requires HTML5.',
            url: 'https://prescriptionmaker.in/dosage-calculator',
            description:
              'Interactive clinical drug dosage calculator for pediatric weight-based dosing and adult regimens in India.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
            },
            about: {
              '@type': 'MedicalWebPage',
              name: 'Pediatric Drug Dosage Calculation India',
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
              Dosage Calculator
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Clinical Pediatric & Adult Dosing Reference
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Smart Drug Dosage{' '}
            <span className="gradient-text">Calculator for Doctors</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Calculate accurate weight-based pediatric syrup doses (mg/kg), drop volumes, and adult flat
            dosages for standard Indian pharmaceutical molecules in seconds.
          </p>
        </div>

        {/* Interactive Tool */}
        <div className="mb-20">
          <DosageCalculatorInteractive />
        </div>

        {/* Educational Reference Table */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-soft mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Cheat Sheet</span>
            <h2 className="text-2xl font-bold text-slate-900">
              Common Indian Pediatric Drug Dosing Reference
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Standard Indian Academy of Pediatrics (IAP) clinical parameters
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-slate-900 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Pediatric Dose</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Common Indian Strengths</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs sm:text-sm">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Paracetamol</td>
                  <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">15 mg/kg/dose</td>
                  <td className="py-3.5 px-4 text-slate-600">Q4-6H SOS (Max 4/day)</td>
                  <td className="py-3.5 px-4 text-slate-600">125 mg/5ml, 250 mg/5ml, 100 mg/ml drops</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Amoxicillin</td>
                  <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">20 - 40 mg/kg/day</td>
                  <td className="py-3.5 px-4 text-slate-600">Divided TDS (Every 8h)</td>
                  <td className="py-3.5 px-4 text-slate-600">125 mg/5ml, 250 mg/5ml dry syrup</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Ibuprofen</td>
                  <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">10 mg/kg/dose</td>
                  <td className="py-3.5 px-4 text-slate-600">TDS after feeds</td>
                  <td className="py-3.5 px-4 text-slate-600">100 mg/5ml suspension</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Cefixime</td>
                  <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">8 mg/kg/day</td>
                  <td className="py-3.5 px-4 text-slate-600">Divided BD (Every 12h)</td>
                  <td className="py-3.5 px-4 text-slate-600">50 mg/5ml, 100 mg/5ml suspension</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Azithromycin</td>
                  <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">10 mg/kg/day</td>
                  <td className="py-3.5 px-4 text-slate-600">Once daily (OD) for 3-5 days</td>
                  <td className="py-3.5 px-4 text-slate-600">100 mg/5ml, 200 mg/5ml suspension</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Ondansetron</td>
                  <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">0.15 mg/kg/dose</td>
                  <td className="py-3.5 px-4 text-slate-600">TDS (Before feeds)</td>
                  <td className="py-3.5 px-4 text-slate-600">2 mg/5ml syrup</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="mx-auto max-w-3xl mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Answers</span>
            <h2 className="text-2xl font-bold text-slate-900">
              Dosage Calculation Questions & Answers
            </h2>
          </div>

          <div className="space-y-4">
            {DOSAGE_FAQS.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-white p-5 shadow-soft">
                <h3 className="text-base font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Write Prescriptions with Automatic Dose Integration
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            Switch from calculating by hand to PrescriptionMaker. Auto-complete dosages, frequencies, and print professional A4 PDFs in under 60 seconds.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Create Free Doctor Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
