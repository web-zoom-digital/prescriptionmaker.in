'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { cn } from '@/lib/utils'

// Show 6 featured templates
const FEATURED_TEMPLATES = TEMPLATES.filter((t) => t.isFeatured).slice(0, 6)

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-teal-50 text-teal-700 ring-teal-200',
  minimal: 'bg-slate-50 text-slate-600 ring-slate-200',
  clinic: 'bg-blue-50 text-blue-700 ring-blue-200',
  hospital: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  pediatric: 'bg-sky-50 text-sky-700 ring-sky-200',
  specialty: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export function TemplatesPreviewSection() {
  return (
    <section className="bg-white py-20 lg:py-28" aria-labelledby="templates-heading">
      <div className="container-section">
        {/* Header */}
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
          <span className="section-label mb-4">Templates</span>
          <h2
            id="templates-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            15+ prescription templates,{' '}
            <span className="gradient-text">each genuinely different</span>
          </h2>
          <p className="mt-4 text-balance text-base text-slate-600">
            Not just color variations. Each template has a distinct layout, information hierarchy,
            typography, and section structure designed for different practice types.
          </p>
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
            >
              <Link
                href={`/templates/${template.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-white shadow-soft transition-all duration-200 hover:border-primary/25 hover:shadow-teal"
                aria-label={`${template.name} prescription template`}
              >
                {/* Template preview image */}
                <div
                  className="relative h-48 overflow-hidden bg-slate-100"
                  style={{ borderBottom: `3px solid ${template.styles.primaryColor}` }}
                  aria-hidden="true"
                >
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Premium badge */}
                  {template.isPremium && (
                    <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm z-10">
                      Pro
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {template.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {template.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset capitalize',
                        CATEGORY_COLORS[template.category] ?? 'bg-gray-50 text-gray-600 ring-gray-200'
                      )}
                    >
                      {template.category}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200 capitalize">
                      {template.layout}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/templates"
            className="group inline-flex items-center gap-2 rounded-md border border-border bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-soft-sm transition-all duration-200 hover:border-primary/30 hover:text-primary"
          >
            View all 15 templates
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
