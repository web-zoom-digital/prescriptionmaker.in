'use client'

import type { Template } from '@prescriptionmaker/types'

interface PrescriptionPreviewProps {
  template: Template
  data: Record<string, unknown>
}

type DoctorInfo = {
  name?: string
  qualifications?: string
  specialization?: string
  registrationNumber?: string
  clinicName?: string
  phone?: string
  address?: string
}

type PatientInfo = {
  name?: string
  age?: string
  gender?: string
}

type Medicine = {
  name?: string
  strength?: string
  form?: string
  frequency?: string
  timing?: string
  duration?: string
}

export function PrescriptionPreview({ template, data }: PrescriptionPreviewProps) {
  const doctor = (data['doctorInfo'] as DoctorInfo | undefined) ?? {}
  const patient = (data['patientInfo'] as PatientInfo | undefined) ?? {}
  const medicines = (data['medicines'] as Medicine[] | undefined) ?? []
  const diagnosis = (data['diagnosis'] as string | undefined) ?? ''
  const advice = (data['advice'] as string | undefined) ?? ''
  
  // Extract tests which are stored as an array of objects
  const rawTests = data['tests'] as { name: string }[] | undefined
  const labTests = Array.isArray(rawTests) ? rawTests.map(t => t.name).join(', ') : ''
  
  const followUpDate = (data['followUp'] as string | undefined) ?? ''

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const primaryColor = template.styles.primaryColor
  const accentColor = template.styles.accentColor
  const fontFamily = template.styles.fontFamily

  return (
    <div
      className="mx-auto bg-white shadow-soft-xl"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm',
        fontFamily,
        fontSize: '10px',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
      aria-label="Prescription preview"
      role="document"
    >
      {/* Doctor Header */}
      <header
        style={{
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        {template.layout === 'two-column' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: primaryColor }}>
                {doctor.name || 'Dr. [Name]'}
              </div>
              <div style={{ color: '#475569', marginTop: '1px' }}>
                {doctor.qualifications || '[Qualifications]'}
                {doctor.specialization ? ` · ${doctor.specialization}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#475569' }}>
              {doctor.registrationNumber && <div>Reg. No: {doctor.registrationNumber}</div>}
              {doctor.phone && <div>{doctor.phone}</div>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '14px', fontWeight: 700, color: primaryColor }}>
              {doctor.name || 'Dr. [Name]'}
            </div>
            <div style={{ color: '#475569', marginTop: '1px' }}>
              {doctor.qualifications || '[Qualifications]'}
              {doctor.specialization ? ` · ${doctor.specialization}` : ''}
            </div>
            {doctor.registrationNumber && (
              <div style={{ color: '#64748b', fontSize: '9px' }}>
                Reg. No: {doctor.registrationNumber}
              </div>
            )}
            {(doctor.clinicName || doctor.phone || doctor.address) && (
              <div style={{ color: '#64748b', fontSize: '9px', marginTop: '2px' }}>
                {[doctor.clinicName, doctor.address, doctor.phone].filter(Boolean).join(' · ')}
              </div>
            )}
          </>
        )}
      </header>

      {/* Patient & Date */}
      <div
        style={{
          borderBottom: `1px solid #e2e8f0`,
          paddingBottom: '6px',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '4px',
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>Patient: </span>
          <strong>{patient.name || '_____________________'}</strong>
          {(patient.age || patient.gender) && (
            <span style={{ marginLeft: '8px', color: '#64748b' }}>
              Age: <strong>
                {patient.age ? `${patient.age}Y` : '___'}
                {patient.gender ? ` / ${patient.gender.charAt(0).toUpperCase()}` : ''}
              </strong>
            </span>
          )}
        </div>
        <div style={{ color: '#64748b' }}>
          Date: <strong>{today}</strong>
        </div>
      </div>

      {/* Diagnosis */}
      {diagnosis && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#64748b' }}>Diagnosis: </span>
          <strong>{diagnosis}</strong>
        </div>
      )}

      {/* Rx */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: primaryColor, marginBottom: '6px' }}>
          Rx
        </div>

        {medicines.length === 0 || !medicines.some((m) => m.name) ? (
          <div style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: '12px' }}>
            No medicines added yet
          </div>
        ) : (
          <div style={{ paddingLeft: '8px', borderLeft: `3px solid ${accentColor}` }}>
            {medicines
              .filter((m) => m.name)
              .map((med, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {idx + 1}. {med.name}
                    {med.strength ? ` ${med.strength}` : ''}
                    {med.form ? ` (${med.form})` : ''}
                  </div>
                  <div style={{ color: '#475569', paddingLeft: '12px' }}>
                    {[med.frequency, med.timing, med.duration].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Lab Tests */}
      {labTests && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 600, color: primaryColor, marginBottom: '3px' }}>
            Investigations:
          </div>
          <div style={{ color: '#475569' }}>{labTests}</div>
        </div>
      )}

      {/* Advice */}
      {advice && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 600, color: primaryColor, marginBottom: '3px' }}>Advice:</div>
          <div style={{ color: '#475569' }}>{advice}</div>
        </div>
      )}

      {/* Follow-up */}
      {followUpDate && (
        <div style={{ marginTop: '8px', color: '#475569' }}>
          <strong>Follow-up: </strong>
          {followUpDate}
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid #e2e8f0`,
          paddingTop: '8px',
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '8px',
          color: '#94a3b8',
        }}
      >
        <div>
          {template.name} · prescriptionmaker.in
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: '#475569', fontSize: '9px' }}>Signature</div>
          <div style={{ marginTop: '12px', borderTop: '1px solid #cbd5e1', width: '60px' }} />
        </div>
      </footer>
    </div>
  )
}
