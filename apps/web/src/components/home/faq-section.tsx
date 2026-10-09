'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    question: 'What is PrescriptionMaker?',
    answer:
      'PrescriptionMaker is a digital prescription documentation tool for doctors, clinics, and hospitals. It lets you create, format, and export prescription documents as PDFs using professional templates — either by filling a structured form or drawing/writing on a canvas.',
  },
  {
    question: 'Is PrescriptionMaker a medical advice tool?',
    answer:
      'No. PrescriptionMaker is a documentation software. It helps healthcare professionals format and record prescriptions they have already decided upon. It does not provide medical advice, diagnoses, or treatment recommendations.',
  },

  {
    question: 'How many templates are available?',
    answer:
      'PrescriptionMaker includes 15+ distinct prescription templates — from Classic Medical and Minimal Clinical to Pediatric, Hospital, Specialist, and more. Each has a genuinely different layout, typography, section structure, and medicine table design.',
  },
  {
    question: 'What format is the exported prescription in?',
    answer:
      'Prescriptions are exported as high-quality A4 PDFs with selectable text. They are print-ready and can be downloaded, printed, or shared directly from the application.',
  },
  {
    question: 'Is my prescription data secure?',
    answer:
      'Yes. Your data is stored securely in encrypted databases. We do not share your prescription content with third parties. Authentication uses secure HTTP-only cookies and JWT tokens.',
  },
  {
    question: 'Can I use PrescriptionMaker for free?',
    answer:
      'Yes. The Free plan allows up to 10 prescriptions per month with 3 templates. Upgrade to Pro for unlimited prescriptions, all templates, and custom branding.',
  },
  {
    question: 'Does PrescriptionMaker work on mobile?',
    answer:
      'Yes. The website is fully responsive and works on smartphones and tablets. The editor has a dedicated mobile-friendly UX. A native mobile app is planned for a future release.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="bg-white py-20 lg:py-28" aria-labelledby="faq-heading">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <div className="container-section">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <span className="section-label mb-4">FAQ</span>
            <h2
              id="faq-heading"
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Frequently asked questions
            </h2>
          </div>

          {/* Accordion */}
          <dl className="divide-y divide-border">
            {FAQS.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <dt>
                  <button
                    className="flex w-full items-start justify-between gap-4 py-5 text-left"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                        openIndex === index && 'rotate-180 text-primary'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </dt>
                <dd
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={cn(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    openIndex === index ? 'max-h-96 pb-5' : 'max-h-0'
                  )}
                >
                  <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
