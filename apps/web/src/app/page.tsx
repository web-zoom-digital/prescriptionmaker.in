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
  title: 'PrescriptionMaker — Free Online Prescription Maker for Doctors in India (PDF & WhatsApp)',
  description:
    'India\'s #1 free digital prescription software for doctors & clinics. Create professional NMC-compliant e-prescriptions in 60s with 15+ templates, Form & Stylus modes, vector PDF export, and 1-click WhatsApp sharing.',
  alternates: {
    canonical: 'https://prescriptionmaker.in',
  },
  openGraph: {
    title: 'Free Digital Prescription Maker for Indian Doctors | PrescriptionMaker.in',
    description:
      'Fast, modern, and legally compliant e-prescription software for doctors in India. 15+ templates, PDF download, and WhatsApp sharing.',
    url: 'https://prescriptionmaker.in',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        {/* Schema.org MedicalWebPage on Home */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MedicalWebPage',
              name: 'PrescriptionMaker — Free Online Prescription Software for Doctors in India',
              url: 'https://prescriptionmaker.in',
              description:
                'Digital prescription maker and OPD clinical documentation system for registered medical practitioners and clinics across India.',
              medicalAudience: {
                '@type': 'MedicalAudience',
                audienceType: 'Doctors, Physicians, Pediatricians, Dentists, Surgeons, Healthcare Practitioners',
              },
            }),
          }}
        />

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
