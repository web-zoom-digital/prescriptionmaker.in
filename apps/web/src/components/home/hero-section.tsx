'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Download, Pen, FileText, CheckCircle2 } from 'lucide-react'

const TRUST_POINTS = [
  'No medical claims made',
  'For documentation only',
  'A4 PDF export',
  'Free to start',
]

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-32 pb-20 lg:pt-40 lg:pb-28"
      aria-label="Hero — PrescriptionMaker"
    >
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0d9488 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Teal glow — top right */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 rounded-full bg-teal-300/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-section relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Label pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="section-label mb-6 inline-flex">
              <FileText className="h-3 w-3" aria-hidden="true" />
              Digital Prescription Software
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
          >
            Create Professional{' '}
            <span className="relative">
              <span className="gradient-text">Digital Prescriptions</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 300 8"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 6 Q75 2 150 5 Q225 8 300 4"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </span>{' '}
            in Minutes
          </motion.h1>

          {/* Supporting text */}
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-slate-600"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.16 }}
          >
            PrescriptionMaker gives doctors and clinics a fast, structured way to create
            prescription documents. Choose a template, fill the form or draw by hand, and export
            a print-ready PDF — all in one place.
          </motion.p>

          {/* Trust points */}
          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.24 }}
          >
            {TRUST_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-1.5 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-500" aria-hidden="true" />
                <span>{point}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          >
            <Link
              href="/signup"
              id="hero-cta-primary"
              className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Create Prescription
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/templates"
              id="hero-cta-secondary"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-all duration-200 hover:border-primary/30 hover:bg-slate-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Explore Templates
            </Link>
          </motion.div>
        </div>

        {/* Product Preview */}
        <motion.div
          className="mt-16 lg:mt-20"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Browser chrome mockup */}
            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-soft-xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-border bg-slate-50 px-4 py-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <div className="h-3 w-3 rounded-full bg-red-400/70" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <div className="h-3 w-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 rounded-md border border-border bg-white px-3 py-1 text-center text-xs text-muted-foreground">
                  prescriptionmaker.in/editor
                </div>
              </div>

              {/* Editor preview */}
              <div className="grid min-h-80 grid-cols-1 lg:grid-cols-2">
                {/* Left: Form editor panel */}
                <div className="border-r border-border bg-slate-50/60 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 p-1" aria-hidden="true">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Form Editor</span>
                  </div>

                  <div className="space-y-3">
                    {/* Mock form fields */}
                    {[
                      { label: 'Patient Name', value: 'Rahul Sharma' },
                      { label: 'Age / Gender', value: '34 years / Male' },
                      { label: 'Diagnosis', value: 'Acute Pharyngitis' },
                    ].map((field) => (
                      <div key={field.label} className="field-group">
                        <div className="text-xs font-medium text-muted-foreground">
                          {field.label}
                        </div>
                        <div className="rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground">
                          {field.value}
                        </div>
                      </div>
                    ))}

                    {/* Mock medicine row */}
                    <div className="rounded-md border border-teal-200 bg-teal-50/40 p-3">
                      <div className="text-xs font-medium text-teal-700">Rx — Medicine 1</div>
                      <div className="mt-1.5 text-sm font-semibold text-slate-800">
                        Amoxicillin 500mg
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        1-0-1 · After food · 5 days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Prescription preview */}
                <div className="relative overflow-hidden bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Preview</span>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-teal">
                        <Download className="h-3 w-3" aria-hidden="true" />
                        Export PDF
                      </button>

                    </div>
                  </div>

                  {/* Prescription paper mockup */}
                  <div className="relative rounded border border-slate-200 bg-white p-4 shadow-inner text-xs">
                    <div className="border-b border-teal-600 pb-2 mb-2">
                      <div className="font-bold text-teal-800 text-sm">Dr. Priya Mehta</div>
                      <div className="text-slate-500">MBBS, MD — General Medicine</div>
                      <div className="text-slate-500">Reg. No: MH-2019-4821</div>
                    </div>
                    <div className="border-b border-slate-200 pb-2 mb-2">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-slate-500">Patient: </span>
                          <span className="font-medium">Rahul Sharma</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Age: </span>
                          <span className="font-medium">34M</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-1 font-semibold text-teal-700">Rx</div>
                    <div className="pl-2 border-l-2 border-teal-500">
                      <div className="font-medium">Amoxicillin 500mg</div>
                      <div className="text-slate-500">1-0-1 · After food · 5 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
