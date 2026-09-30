'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Template } from '@prescriptionmaker/types'
import { PrescriptionPreview } from '@/components/editor/prescription-preview'

const dummyData = {
  doctorName: 'Full Name',
  doctorQualifications: 'MBBS, MD',
  doctorSpecialization: 'General Medicine',
  clinicName: 'Name of your clinic',
  patient: { name: 'Patient full name', age: '34', gender: 'Male' },
  diagnosis: 'Acute Pharyngitis',
  medicines: [
    { name: 'Medicine Name', dosage: '1-0-1', duration: '5 days' },
    { name: 'Second Medicine', dosage: '0-0-1', duration: '3 days' }
  ]
}

interface TemplatesGridProps {
  templates: Omit<Template, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[]
  categories: readonly { id: string; name: string; slug: string }[]
}

export function TemplatesGrid({ templates, categories }: TemplatesGridProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered =
    activeCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === activeCategory)

  return (
    <div>
      {/* Category filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter templates by category">
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory === cat.slug}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
              activeCategory === cat.slug
                ? 'bg-primary text-white shadow-teal'
                : 'border border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary'
            )}
            onClick={() => setActiveCategory(cat.slug)}
          >
            {cat.name}
            {cat.slug !== 'all' && (
              <span className={cn(
                'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                activeCategory === cat.slug ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}>
                {templates.filter((t) => t.category === cat.slug).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        layout
      >
        {filtered.map((template, index) => (
          <motion.div
            key={template.slug}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
          >
            <Link
              href={`/templates/${template.slug}`}
              className="group block overflow-hidden rounded-xl border border-border bg-white shadow-soft transition-all duration-200 hover:border-primary/25 hover:shadow-teal"
              aria-label={`Use ${template.name} template`}
            >
              {/* Preview Image using Actual Component */}
              <div
                className="relative h-56 overflow-hidden bg-slate-50 flex justify-center items-start pt-4 border-b"
                style={{ borderBottomColor: template.styles.primaryColor, borderBottomWidth: '2.5px' }}
                aria-hidden="true"
              >
                <div 
                  className="origin-top shadow-md bg-white pointer-events-none"
                  style={{ 
                    transform: 'scale(0.35)', 
                    width: '210mm',
                    marginBottom: '-200mm' // Prevent it from pushing height
                  }}
                >
                  <PrescriptionPreview template={template} data={dummyData} />
                </div>

                {template.isPremium && (
                  <div className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    Pro
                  </div>
                )}
                {template.isFeatured && !template.isPremium && (
                  <div className="absolute right-2 top-2 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    Popular
                  </div>
                )}
              </div>


              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                    {template.category}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                    {template.layout}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No templates in this category yet.
        </div>
      )}
    </div>
  )
}
