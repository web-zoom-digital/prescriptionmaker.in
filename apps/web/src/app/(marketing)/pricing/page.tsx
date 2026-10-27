import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Zap, Shield, HelpCircle, ArrowRight, Sparkles } from 'lucide-react'
import { PricingSection } from '@/components/home/pricing-section'

export const metadata: Metadata = {
  title: 'Pricing Plans — Free to Start, Pro at ₹299/month | PrescriptionMaker',
  description:
    'Simple, transparent pricing for doctors and clinics. Free plan includes 10 prescriptions/month. Pro plan at ₹299/month includes unlimited prescriptions, 15+ templates, and WhatsApp sharing. 7-day money-back guarantee.',
  alternates: {
    canonical: 'https://prescriptionmaker.in/pricing',
  },
  openGraph: {
    title: 'PrescriptionMaker Pricing — Free & Pro Plans for Indian Doctors',
    description:
      'Affordable digital prescription software starting at ₹0. Upgrade to Pro for ₹299/mo with unlimited prescriptions and WhatsApp sharing.',
    url: 'https://prescriptionmaker.in/pricing',
  },
}

const COMPARISON_DETAILS = [
  {
    category: 'Prescriptions & Usage',
    items: [
      { name: 'Monthly Prescriptions', free: '10 / month', pro: 'Unlimited', clinic: 'Unlimited' },
      { name: 'Patient History & Cloud Storage', free: '30 Days', pro: 'Lifetime', clinic: 'Lifetime' },
      { name: 'Autosave & Draft Recovery', free: 'Yes', pro: 'Yes', clinic: 'Yes' },
    ],
  },
  {
    category: 'Templates & Formatting',
    items: [
      { name: 'Specialty Templates Available', free: '3 Standard', pro: 'All 15+ Templates', clinic: 'All 15+ Templates' },
      { name: 'Bilingual (Hindi + English) Layout', free: 'Yes', pro: 'Yes', clinic: 'Yes' },
      { name: 'Custom Margin & Letterhead Calibration', free: 'Basic', pro: 'Advanced', clinic: 'Full Customization' },
    ],
  },
  {
    category: 'Input Modes & Drawing',
    items: [
      { name: 'Standard Form Editor', free: 'Yes', pro: 'Yes', clinic: 'Yes' },
      { name: 'Hand-Drawing Mode (Apple Pencil / Stylus)', free: 'Preview Only', pro: 'Unlimited', clinic: 'Unlimited' },
      { name: 'Anatomical Diagrams & Lesion Sketches', free: 'No', pro: 'Yes', clinic: 'Yes' },
    ],
  },
  {
    category: 'Export & Patient Sharing',
    items: [
      { name: 'Vector A4 PDF Download', free: 'Yes', pro: 'Yes', clinic: 'Yes' },
      { name: 'Direct WhatsApp 1-Click Dispatch', free: 'Manual', pro: '1-Click Direct', clinic: '1-Click Direct' },
      { name: 'Print on Pre-Printed Letterhead Paper', free: 'Yes', pro: 'Yes', clinic: 'Yes' },
    ],
  },
  {
    category: 'Branding & Practice Identity',
    items: [
      { name: 'Clinic Logo Upload', free: 'Basic', pro: 'High-Res Vector', clinic: 'High-Res Vector' },
      { name: 'Doctor Digital Signature', free: 'Basic', pro: 'Encrypted Signature', clinic: 'Encrypted Signature' },
      { name: 'Remove PrescriptionMaker Watermark', free: 'No', pro: 'Yes (100% Whitelabel)', clinic: 'Yes (100% Whitelabel)' },
    ],
  },
  {
    category: 'Team & Support',
    items: [
      { name: 'Doctor Accounts Included', free: '1 Doctor', pro: '1 Doctor', clinic: 'Up to 5 Doctors' },
      { name: 'Receptionist / Assistant Access', free: 'No', pro: 'No', clinic: 'Included' },
      { name: 'Support Channels', free: 'Community / Email', pro: 'Priority Email', clinic: 'Dedicated WhatsApp & Phone' },
    ],
  },
]

const PRICING_FAQS = [
  {
    q: 'Can I use PrescriptionMaker completely free?',
    a: 'Yes! Our Free plan provides up to 10 prescriptions every month with standard templates, high-quality A4 PDF generation, and patient vitals. You never have to enter credit card details to start.',
  },
  {
    q: 'What is your refund policy?',
    a: 'We offer an unconditional 7-day money-back guarantee on all paid plans. If you are not completely satisfied for any reason, email support@prescriptionmaker.in and we will issue a full refund within 3-5 business days.',
  },
  {
    q: 'Can I switch between monthly and annual billing?',
    a: 'Yes, you can switch between monthly and annual billing at any time from your account settings. Annual subscriptions come with a 30% discount (equal to over 3 months free).',
  },
  {
    q: 'How does payment work for doctors in India?',
    a: 'We support all popular Indian payment options via Razorpay, including UPI (Google Pay, PhonePe, Paytm), Debit and Credit Cards (Visa, Mastercard, RuPay), NetBanking, and EMI.',
  },
  {
    q: 'Can I print prescriptions on my existing physical clinic letterhead?',
    a: 'Yes! Both Free and Pro plans allow you to toggle the header section off during PDF generation, allowing you to feed your existing pre-printed clinic letterhead paper directly into your printer.',
  },
]

export default function PricingPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Schema.org Product & Pricing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'PrescriptionMaker Subscription Plans',
            description: 'Digital prescription writing software for doctors and clinics in India.',
            url: 'https://prescriptionmaker.in/pricing',
            brand: {
              '@type': 'Brand',
              name: 'PrescriptionMaker',
            },
            offers: [
              {
                '@type': 'Offer',
                name: 'Free Plan',
                price: '0',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                description: '10 prescriptions per month with standard templates and PDF export.',
              },
              {
                '@type': 'Offer',
                name: 'Doctor Pro Plan',
                price: '299',
                priceCurrency: 'INR',
                priceValidUntil: '2027-12-31',
                availability: 'https://schema.org/InStock',
                description: 'Unlimited prescriptions, 15+ templates, WhatsApp sharing, and hand-mode drawing.',
              },
              {
                '@type': 'Offer',
                name: 'Clinic & Hospital Plan',
                price: '999',
                priceCurrency: 'INR',
                priceValidUntil: '2027-12-31',
                availability: 'https://schema.org/InStock',
                description: 'Multi-doctor clinic access, assistant role, and dedicated WhatsApp support.',
              },
            ],
          }),
        }}
      />

      <div className="container-section">
        {/* Breadcrumb nav */}
        <nav className="mb-6 flex text-xs text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              Pricing
            </li>
          </ol>
        </nav>

        {/* Pricing Cards Section */}
        <PricingSection />

        {/* Trust Badges */}
        <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 my-16 text-center">
          <div className="rounded-xl border border-border bg-white p-6 shadow-soft">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 mb-3">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">7-Day Refund Guarantee</h3>
            <p className="mt-1 text-xs text-slate-600">Full refund if you are not 100% satisfied. No questions asked.</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-soft">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Instant Plan Activation</h3>
            <p className="mt-1 text-xs text-slate-600">Upgrade unlocks all premium features and templates in real-time.</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-soft">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 mb-3">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Cancel Anytime</h3>
            <p className="mt-1 text-xs text-slate-600">No long-term contracts. Pause or cancel whenever you choose.</p>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-soft mb-20">
          <div className="text-center mb-10">
            <span className="section-label mb-2">Matrix</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Detailed Plan Feature Comparison
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Compare all capabilities to choose the right plan for your individual practice or hospital.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="py-3 px-4 font-semibold text-slate-900 w-2/5">Plan Feature</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 text-center w-1/5">Free (₹0)</th>
                  <th className="py-3 px-4 font-bold text-teal-800 bg-teal-50 text-center w-1/5">
                    Doctor Pro (₹299)
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-900 text-center w-1/5">
                    Clinic (₹999)
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DETAILS.map((cat, catIdx) => (
                  <tr key={catIdx} className="contents">
                    <td
                      colSpan={4}
                      className="bg-slate-100/70 py-2.5 px-4 font-semibold text-xs uppercase tracking-wider text-slate-700"
                    >
                      {cat.category}
                    </td>
                    {cat.items.map((item, itemIdx) => (
                      <tr key={itemIdx} className="border-b border-border/50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-800 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-center text-slate-600 text-xs sm:text-sm">{item.free}</td>
                        <td className="py-3 px-4 text-center font-semibold text-teal-800 bg-teal-50/40 text-xs sm:text-sm">
                          {item.pro}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-800 text-xs sm:text-sm">{item.clinic}</td>
                      </tr>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="mx-auto max-w-3xl mb-20">
          <div className="text-center mb-8">
            <span className="section-label mb-2">Answers</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Pricing Questions & Answers
            </h2>
          </div>

          <div className="space-y-4">
            {PRICING_FAQS.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-white p-5 shadow-soft">
                <h3 className="text-base font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 p-8 sm:p-12 text-center text-white shadow-soft-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start Free Today — Upgrade When You Love It
          </h2>
          <p className="mx-auto max-w-xl text-slate-300 text-sm mb-6">
            Join medical practitioners across Delhi, Mumbai, Bengaluru, Hyderabad, and Tier 2-3 cities creating clear digital prescriptions.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:shadow-teal"
          >
            Create Your Free Account Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
