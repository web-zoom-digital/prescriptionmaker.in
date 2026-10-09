'use client'

import { motion } from 'framer-motion'
import {
  LayoutTemplate,
  Pen,
  FileDown,
  ClipboardList,
  Pill,
  ShieldCheck,
  Smartphone,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: '15+ Professional Templates',
    description:
      'Choose from Classic Medical, Minimal Clinical, Pediatric, Hospital, and more. Each template has a distinct layout, typography, and structure — not just color variations.',
    accent: 'teal',
  },
  {
    icon: ClipboardList,
    title: 'Structured Form Editor',
    description:
      'Fill patient info, diagnosis, vitals, medicines with dosage/frequency/duration, lab tests, advice, and follow-up — all in a clean, guided interface.',
    accent: 'teal',
  },

  {
    icon: Pill,
    title: 'Medicine Builder',
    description:
      'Add medicines with name, strength, form, dose, frequency (1-0-1, BD, TDS etc.), timing, duration, and route. Reorder and remove with ease.',
    accent: 'teal',
  },
  {
    icon: FileDown,
    title: 'High-Quality PDF Export',
    description:
      'Generate print-ready A4 PDFs with selectable text. Consistent typography, accurate spacing, and professional output every time.',
    accent: 'teal',
  },
  {
    icon: Zap,
    title: 'Autosave & Drafts',
    description:
      'Your work is automatically saved as you type. Recover drafts after accidental browser refresh. Last-saved indicator keeps you informed.',
    accent: 'teal',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    description:
      'Your prescription data is never shared. Secure authentication, encrypted storage, and no third-party access to your clinical content.',
    accent: 'teal',
  },
  {
    icon: Smartphone,
    title: 'Works on Any Device',
    description:
      'Fully responsive design optimized for desktop, tablet, and mobile. The editor adapts to your screen — not just shrinks.',
    accent: 'teal',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 lg:py-28" aria-labelledby="features-heading">
      <div className="container-section">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="section-label mb-4">Features</span>
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Everything you need to create{' '}
            <span className="gradient-text">professional prescriptions</span>
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-slate-600">
            PrescriptionMaker is a documentation tool. It gives healthcare professionals a
            structured, efficient way to create prescription documents — not medical advice.
          </p>
        </div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {FEATURES.map((feature) => (
            <motion.article
              key={feature.title}
              variants={itemVariants}
              className="group rounded-lg border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-primary/20 hover:shadow-soft-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-primary ring-1 ring-teal-100 transition-colors duration-200 group-hover:bg-primary group-hover:text-white group-hover:ring-0">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
