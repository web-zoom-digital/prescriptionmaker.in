'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, FileText } from 'lucide-react'

export function CtaSection() {
  return (
    <section
      className="bg-slate-900 py-20 lg:py-24"
      aria-labelledby="cta-heading"
    >
      <div className="container-section">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-teal-lg">
              <FileText className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
          </div>

          <h2
            id="cta-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Start creating professional prescriptions today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-slate-400">
            Free plan available. No credit card required. Set up your doctor profile and create
            your first prescription in under two minutes.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              id="cta-section-signup"
              className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-teal transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg hover:gap-3"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors duration-200 hover:border-slate-500 hover:text-white"
            >
              Browse Templates
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-400">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-slate-400">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  )
}
