import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturesSection } from '@/components/home/features-section'
import { HowItWorksSection } from '@/components/home/how-it-works-section'
import { TemplatesPreviewSection } from '@/components/home/templates-preview-section'
import { PricingSection } from '@/components/home/pricing-section'
import { FaqSection } from '@/components/home/faq-section'
import { CtaSection } from '@/components/home/cta-section'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: 'PrescriptionMaker — Digital Prescription Software for Doctors',
  description:
    'Create professional digital prescriptions in minutes. Choose from 15+ templates, use the form editor or hand-mode drawing editor. Download as PDF. Free to start.',
  alternates: {
    canonical: 'https://prescriptionmaker.in',
  },
  openGraph: {
    title: 'PrescriptionMaker — Digital Prescription Software for Doctors',
    description:
      'Create professional digital prescriptions in minutes. 15+ templates, form editor, PDF export. Built for Indian doctors and clinics.',
    url: 'https://prescriptionmaker.in',
  },
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TemplatesPreviewSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
