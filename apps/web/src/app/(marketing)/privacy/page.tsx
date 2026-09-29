import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'PrescriptionMaker Privacy Policy — how we collect, use, and protect your data.',
  alternates: { canonical: 'https://prescriptionmaker.in/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-section">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: September 2026</p>

          <div className="prose-medical">
            <p>
              PrescriptionMaker (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to
              protecting your privacy. This Privacy Policy explains what information we collect, how we use it,
              and the choices you have.
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul>
              <li><strong>Account information:</strong> Name, email address, and password when you register.</li>
              <li><strong>Profile information:</strong> Doctor name, qualifications, registration number, clinic details.</li>
              <li><strong>Prescription content:</strong> Patient details, medicines, diagnoses you enter into the editor.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, browser type, IP address.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>To provide and operate the PrescriptionMaker service.</li>
              <li>To save your prescriptions and preferences across sessions.</li>
              <li>To send account-related communications (e.g., password reset emails).</li>
              <li>To improve our product based on aggregate usage patterns.</li>
              <li>To comply with legal obligations.</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your data is stored in Supabase-hosted PostgreSQL databases in secure cloud infrastructure.
              We use industry-standard encryption (TLS/HTTPS) for all data in transit. Passwords are
              hashed using bcrypt and are never stored in plaintext. We use HTTP-only cookies for
              authentication tokens to prevent XSS attacks.
            </p>

            <h2>4. Prescription Data</h2>
            <p>
              Prescription content you create is stored securely and associated with your account.
              We do not share, sell, or use your prescription data for any purpose other than
              providing the service to you. Your prescription data is private to your account.
            </p>

            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Supabase:</strong> Database and authentication infrastructure.</li>
              <li><strong>Vercel:</strong> Hosting and deployment platform.</li>
              <li><strong>Razorpay / Stripe:</strong> Payment processing (we never store card numbers).</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>
              We use HTTP-only cookies for session management. These are strictly necessary for the
              service to function and are not used for tracking or advertising.
            </p>

            <h2>7. Your Rights</h2>
            <ul>
              <li>Access a copy of your personal data.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Export your prescription data in a portable format.</li>
            </ul>
            <p>To exercise these rights, email us at <a href="mailto:privacy@prescriptionmaker.in">privacy@prescriptionmaker.in</a>.</p>

            <h2>8. Children</h2>
            <p>
              PrescriptionMaker is intended for licensed healthcare professionals. We do not
              knowingly collect data from individuals under 18.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify registered users of
              material changes via email. Continued use of the service after changes constitutes
              acceptance.
            </p>

            <h2>10. Contact</h2>
            <p>
              For privacy-related questions, contact us at{' '}
              <a href="mailto:privacy@prescriptionmaker.in">privacy@prescriptionmaker.in</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
