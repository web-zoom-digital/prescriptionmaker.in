import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Medical Disclaimer',
  description:
    'PrescriptionMaker is a documentation tool for healthcare professionals — not a medical advice, diagnosis, or treatment recommendation system.',
  alternates: { canonical: 'https://prescriptionmaker.in/disclaimer' },
}

export default function DisclaimerPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-section">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Medical Disclaimer</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: September 2026</p>

          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              PrescriptionMaker is a prescription documentation tool for licensed healthcare professionals.
              It does NOT provide medical advice, diagnoses, treatment recommendations, or clinical
              decision support.
            </p>
          </div>

          <div className="prose-medical">
            <h2>Documentation Tool Only</h2>
            <p>
              PrescriptionMaker is designed to help licensed doctors and healthcare professionals
              create, format, and export prescription documents. All clinical decisions — including
              diagnoses, treatment plans, and medicine choices — are made entirely by the treating
              healthcare professional using their own clinical judgment and training.
            </p>

            <h2>No Medical Advice</h2>
            <p>
              The templates, fields, and suggestions within PrescriptionMaker do not constitute
              medical advice. Any information entered into the tool reflects the judgment of the
              treating healthcare professional, not a recommendation from PrescriptionMaker or
              its operators.
            </p>

            <h2>Professional Responsibility</h2>
            <p>
              Healthcare professionals using PrescriptionMaker remain solely responsible for:
            </p>
            <ul>
              <li>The accuracy and appropriateness of diagnoses and treatment decisions.</li>
              <li>Medicine selection, dosing, and patient safety.</li>
              <li>Compliance with applicable medical regulations and standards of care.</li>
              <li>Patient consent and communication.</li>
            </ul>

            <h2>Not a Healthcare Provider</h2>
            <p>
              PrescriptionMaker is a software product, not a healthcare provider, medical practice,
              or clinical service. Use of PrescriptionMaker does not create a doctor-patient
              relationship between the user and PrescriptionMaker or its operators.
            </p>

            <h2>Regulatory Compliance</h2>
            <p>
              Users are responsible for ensuring their use of PrescriptionMaker complies with
              applicable medical regulations, including those of the Medical Council of India (MCI),
              Pharmacy Act, and relevant state regulations.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about this disclaimer, contact us at{' '}
              <a href="mailto:support@prescriptionmaker.in">support@prescriptionmaker.in</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
