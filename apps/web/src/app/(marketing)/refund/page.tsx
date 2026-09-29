import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'PrescriptionMaker Refund and Cancellation Policy.',
  alternates: { canonical: 'https://prescriptionmaker.in/refund' },
}

export default function RefundPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-section">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: September 2026</p>

          <div className="prose-medical">
            <p>
              Thank you for subscribing to PrescriptionMaker. We want you to be completely satisfied
              with our service. If you are not entirely satisfied with your purchase, we're here to help.
            </p>

            <h2>1. Subscription Cancellations</h2>
            <p>
              You can cancel your subscription at any time. Your subscription will remain active until the
              end of the current billing cycle, after which you will not be charged again. We do not provide
              pro-rated refunds for the remainder of the billing cycle.
            </p>

            <h2>2. Refund Eligibility</h2>
            <p>
              We offer a 7-day money-back guarantee for all new subscriptions. If you are not satisfied with
              the Service within the first 7 days of your initial purchase, you may request a full refund.
            </p>
            <p>
              Refunds are not available for renewal payments unless you requested cancellation before the
              renewal date.
            </p>

            <h2>3. How to Request a Refund</h2>
            <p>
              To request a refund within the eligible 7-day period, please email our support team at
              <a href="mailto:support@prescriptionmaker.in">support@prescriptionmaker.in</a> with your
              account email and the reason for the refund request. We process requests within 3-5 business days.
            </p>

            <h2>4. Processing Refunds</h2>
            <p>
              Approved refunds will be credited back to your original method of payment. Depending on your
              bank or payment provider, it may take 5-10 business days for the refund to reflect in your account.
            </p>

            <h2>5. Contact Us</h2>
            <p>
              If you have any questions about our Refund Policy, please contact us at <a href="mailto:support@prescriptionmaker.in">support@prescriptionmaker.in</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
