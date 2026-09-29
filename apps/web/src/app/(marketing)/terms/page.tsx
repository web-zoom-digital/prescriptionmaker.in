import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'PrescriptionMaker Terms of Service.',
  alternates: { canonical: 'https://prescriptionmaker.in/terms' },
}

export default function TermsPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-section">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: September 2026</p>

          <div className="prose-medical">
            <p>
              By using PrescriptionMaker, you agree to these Terms of Service. Please read them carefully.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using PrescriptionMaker (the "Service"), you agree to be bound by these Terms.
              If you do not agree to these Terms, do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              PrescriptionMaker provides a software tool for licensed healthcare professionals to create,
              format, and generate digital prescription documents. It is a documentation tool only and does
              not provide medical advice or clinical decision support.
            </p>

            <h2>3. Eligibility and Professional Responsibility</h2>
            <p>
              You must be a licensed healthcare professional to use this Service for patient care. You are
              solely responsible for:
            </p>
            <ul>
              <li>Ensuring you have the legal right and appropriate licensure to prescribe medicines.</li>
              <li>The accuracy of all diagnoses, treatments, and medicines entered.</li>
              <li>Compliance with all applicable medical and privacy regulations (e.g., MCI guidelines).</li>
            </ul>

            <h2>4. Accounts and Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activities that occur under your account. You must notify us immediately of any unauthorized
              use of your account.
            </p>

            <h2>5. Fees and Payments</h2>
            <p>
              Certain features of the Service may require payment ("Pro Plan"). All fees are stated in INR
              and are non-refundable except as required by law or as stated in our Refund Policy.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PrescriptionMaker and its affiliates shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits
              or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or
              other intangible losses, resulting from your access to or use of or inability to access or use
              the Service.
            </p>

            <h2>7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without
              regard to its conflict of law provisions.
            </p>

            <h2>8. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:support@prescriptionmaker.in">support@prescriptionmaker.in</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
