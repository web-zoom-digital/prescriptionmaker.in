'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { PLANS } from '@prescriptionmaker/config/plans'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { RazorpayButton } from '@/components/payments/razorpay-button'

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section className="bg-slate-50 py-20 lg:py-28" aria-labelledby="pricing-heading">
      <div className="container-section">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="section-label mb-4">Pricing</span>
          <h2
            id="pricing-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-balance text-base text-slate-600">
            Start for free. Upgrade when you need more. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="mt-7 inline-flex items-center rounded-lg border border-border bg-white p-1 shadow-soft-sm">
            <button
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200',
                billing === 'monthly'
                  ? 'bg-primary text-white shadow-teal'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setBilling('monthly')}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200',
                billing === 'yearly'
                  ? 'bg-primary text-white shadow-teal'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setBilling('yearly')}
              aria-pressed={billing === 'yearly'}
            >
              Yearly
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'
              )}>
                Save 30%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              className={cn(
                'relative flex flex-col rounded-xl border bg-white shadow-soft',
                plan.isPopular
                  ? 'border-primary shadow-teal ring-1 ring-primary'
                  : 'border-border'
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-teal">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(
                      billing === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly
                    )}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>

                {billing === 'yearly' && plan.priceYearly > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Billed {formatCurrency(plan.priceYearly)}/year
                  </p>
                )}

                {plan.slug === 'free' ? (
                  <Link
                    href="/signup"
                    className="mt-5 flex w-full items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-primary/30 hover:text-primary"
                  >
                    Get started free
                  </Link>
                ) : (
                  <RazorpayButton
                    planId={plan.slug}
                    amount={billing === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                    billing={billing}
                    className={cn(
                      'mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                      plan.isPopular
                        ? 'bg-primary text-white shadow-teal hover:bg-primary/90 hover:shadow-teal-lg'
                        : 'border border-border text-slate-700 hover:border-primary/30 hover:text-primary bg-white hover:bg-slate-50'
                    )}
                  >
                    Choose {plan.name}
                  </RazorpayButton>
                )}
              </div>

              <div className="border-t border-border px-6 pb-6 pt-4">
                <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  What&apos;s included
                </p>
                <ul className="space-y-2.5" aria-label={`${plan.name} plan features`}>
                  <PlanFeature>
                    {plan.features.maxPrescriptionsPerMonth === 'unlimited'
                      ? 'Unlimited prescriptions'
                      : `${plan.features.maxPrescriptionsPerMonth} prescriptions/month`}
                  </PlanFeature>
                  <PlanFeature>
                    {plan.features.maxTemplates === 'unlimited'
                      ? 'All 15+ templates'
                      : `${plan.features.maxTemplates} templates`}
                  </PlanFeature>
                  <PlanFeature>PDF export</PlanFeature>
                  {plan.features.handModeEnabled && (
                    <PlanFeature>Hand Mode editor</PlanFeature>
                  )}
                  {plan.features.customBranding && (
                    <PlanFeature>Custom clinic branding</PlanFeature>
                  )}
                  {plan.features.prioritySupport && (
                    <PlanFeature>Priority support</PlanFeature>
                  )}
                  {plan.features.teamMembers > 1 && (
                    <PlanFeature>Up to {plan.features.teamMembers} team members</PlanFeature>
                  )}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All prices in Indian Rupees (INR). GST applicable where required.
        </p>
      </div>
    </section>
  )
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-slate-600">
      <Check className="h-4 w-4 flex-shrink-0 text-teal-500" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}
