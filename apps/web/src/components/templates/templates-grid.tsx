'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Template } from '@prescriptionmaker/types'

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
              {/* Preview Image */}
              <div
                className="relative h-44 overflow-hidden"
                style={{ borderBottom: `2.5px solid ${template.styles.primaryColor}` }}
                aria-hidden="true"
              >
                {/* Actual template preview image */}
                <img
                  src={template.preview}
                  alt={`${template.name} prescription template preview`}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  onError={(e) => {
                    // fallback: hide broken image and show gradient
                    const target = e.currentTarget as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement | null
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                {/* Fallback gradient (hidden by default) */}
                <div
                  className="absolute inset-0 items-center justify-center"
                  style={{
                    display: 'none',
                    background: `linear-gradient(135deg, ${template.styles.primaryColor}18, ${template.styles.accentColor}30)`,
                  }}
                >
                  <span style={{ fontSize: '36px', fontFamily: 'Georgia, serif', fontWeight: 900, color: template.styles.primaryColor, opacity: 0.5 }}>℞</span>
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
