'use client'

import { motion } from 'framer-motion'
import { UserCircle, LayoutTemplate, FilePen, Eye, Download } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: UserCircle,
    title: 'Create your account',
    description:
      'Sign up for free. Set up your doctor profile with your name, qualifications, registration number, and clinic details — used across all your prescriptions.',
  },
  {
    number: '02',
    icon: LayoutTemplate,
    title: 'Choose a template',
    description:
      'Pick from 15+ professionally designed prescription templates. Each has a different layout, information hierarchy, and style suited to different practice types.',
  },
  {
    number: '03',
    icon: FilePen,
    title: 'Fill or draw your prescription',
    description:
      'Use the structured Form Editor to fill in patient details, diagnosis, medicines, and advice. Or switch to Hand Mode to write and draw directly on a canvas.',
  },
  {
    number: '04',
    icon: Eye,
    title: 'Preview in real-time',
    description:
      'See your prescription rendered in the template as you type. Verify all details before saving or exporting.',
  },
  {
    number: '05',
    icon: Download,
    title: 'Export, print, or share',
    description:
      'Download a high-quality A4 PDF. Print directly from your browser. Your prescription is ready for the patient.',
  },
]

export function HowItWorksSection() {
  return (
    <section
      className="bg-slate-50 py-20 lg:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container-section">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="section-label mb-4">How It Works</span>
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            From blank page to PDF{' '}
            <span className="gradient-text">in under two minutes</span>
          </h2>
          <p className="mt-4 text-balance text-base text-slate-600">
            PrescriptionMaker is designed around the real workflow of a consulting doctor. No
            unnecessary steps. No complexity.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mx-auto max-w-3xl">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[22px] top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-teal-500 via-teal-300 to-transparent sm:block"
            aria-hidden="true"
          />

          <ol className="space-y-8" aria-label="How PrescriptionMaker works — step by step">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.number}
                className="relative flex gap-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              >
                {/* Step icon */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-teal ring-4 ring-white">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                {/* Step content */}
                <div className="min-w-0 flex-1 pb-2 pt-1.5">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-600">
                    Step {step.number}
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
