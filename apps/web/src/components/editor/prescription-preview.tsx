import type { Template } from '@prescriptionmaker/types'
import { t, type LanguageCode } from '@/lib/translations'

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
  signatureUrl?: string
  logoUrl?: string
  stampUrl?: string
}

type PatientInfo = {
  name?: string
  age?: string
  gender?: string
  address?: string
  allergies?: string
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
  const docInfo = data['doctorInfo'] as DoctorInfo | undefined
  const doctor = {
    name: docInfo?.name || (data.doctorName as string | undefined),
    qualifications: docInfo?.qualifications || (data.doctorQualifications as string | undefined),
    specialization: docInfo?.specialization || (data.doctorSpecialization as string | undefined),
    registrationNumber: docInfo?.registrationNumber || (data.doctorRegNumber as string | undefined),
    clinicName: docInfo?.clinicName || (data.clinicName as string | undefined),
    phone: docInfo?.phone || (data.clinicPhone as string | undefined),
    address: docInfo?.address || (data.clinicAddress as string | undefined),
    signatureUrl: docInfo?.signatureUrl || (data.signatureDataUrl as string | undefined),
    logoUrl: docInfo?.logoUrl || (data.clinicLogoUrl as string | undefined),
    stampUrl: docInfo?.stampUrl || (data.stampUrl as string | undefined),
  }
  const patient = (data['patientInfo'] as PatientInfo | undefined) ?? (data['patient'] as PatientInfo | undefined) ?? {}
  const medicines = (data['medicines'] as Medicine[] | undefined) ?? []
  const diagnosis = (data['diagnosis'] as string | undefined) ?? ''
  const advice = (data['advice'] as string | undefined) ?? ''
  const rawTests = data['tests'] as { name: string }[] | undefined
  const labTests = Array.isArray(rawTests) ? rawTests.map(t => t.name).join(', ') : ''
  const followUpDate = (data['followUp'] as string | undefined) ?? ''
  const vitals = (data['vitals'] as Record<string, string>) || {}
  const chiefComplaint = (data['chiefComplaint'] as string | undefined) ?? ''
  const lang = (data['language'] as LanguageCode) || 'en'
  const slug = template.slug
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const pc = template.styles.primaryColor
  const ac = template.styles.accentColor
  const ff = template.styles.fontFamily
  const bg = (template.styles as any).bgColor || '#ffffff'

  const filledMeds = medicines.filter(m => m.name)

  const SignatureArea = ({ right = true }: { right?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: right ? 'flex-end' : 'center', gap: '16px', marginTop: '8px' }}>
      {doctor.stampUrl && (
        <img src={doctor.stampUrl} alt="Stamp" style={{ width: '60px', height: '60px', objectFit: 'contain', opacity: 0.8 }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {doctor.signatureUrl ? (
          <img src={doctor.signatureUrl} alt="Signature" style={{ width: '90px', height: '38px', objectFit: 'contain', marginBottom: '4px' }} />
        ) : (
          <div style={{ width: '90px', borderBottom: `1.5px solid #94a3b8`, height: '32px', marginBottom: '4px' }} />
        )}
        <div style={{ fontSize: '8px', fontWeight: 700, color: '#475569' }}>Doctor&apos;s Signature</div>
        {doctor.name && <div style={{ fontSize: '7.5px', color: '#64748b' }}>Dr. {doctor.name}</div>}
      </div>
    </div>
  )

  // ─── 1. CLASSIC LETTERHEAD ─────────────────────────────────────────────────
  // Centered clinic name as masthead, simple numbered Rx list (no table), serif font
  if (slug === 'classic-letterhead') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box', padding: '25mm 22mm' }}>
        {/* Centered header — like a printed letterhead */}
        <div style={{ textAlign: 'center', borderBottom: `3px double ${pc}`, paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: pc, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {doctor.clinicName || 'Medical Clinic'}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginTop: '4px' }}>
            {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
          </div>
          {(doctor.qualifications || doctor.specialization) && (
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
              {[doctor.qualifications, doctor.specialization].filter(Boolean).join(', ')}
            </div>
          )}
          {doctor.registrationNumber && (
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
              Reg. No: {doctor.registrationNumber}
            </div>
          )}
          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {doctor.address && <span>{doctor.address}</span>}
            {doctor.phone && <span>☎ {doctor.phone}</span>}
          </div>
        </div>

        {/* Patient + Date row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', borderBottom: `1px solid #e2e8f0`, paddingBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '9px', color: '#94a3b8' }}>Patient: </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
              {patient.name || '________________________________'}
            </span>
            {patient.age && (
              <span style={{ marginLeft: '12px', fontSize: '9px', color: '#64748b' }}>
                Age: <strong>{patient.age}</strong>
                {patient.gender ? ` / ${patient.gender}` : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>
            Date: <strong>{today}</strong>
          </div>
        </div>

        {/* Chief complaint */}
        {diagnosis && (
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic' }}>Chief Complaint / Diagnosis: </span>
            <span style={{ fontSize: '10px', color: '#1e293b' }}>{diagnosis}</span>
          </div>
        )}

        {/* Large italic Rx symbol */}
        <div style={{ fontSize: '32px', fontFamily: 'Georgia, serif', fontWeight: 900, fontStyle: 'italic', color: pc, marginBottom: '10px', marginTop: '6px', lineHeight: 1 }}>
          ℞
        </div>

        {/* Numbered medicine list — no table */}
        <div style={{ paddingLeft: '6px' }}>
          {filledMeds.length === 0 ? (
            <>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} style={{ marginBottom: '12px', borderBottom: '1px dotted #cbd5e1', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>{n}.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  <div style={{ marginTop: '4px', paddingLeft: '12px', color: '#cbd5e1', fontSize: '8.5px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                </div>
              ))}
            </>
          ) : filledMeds.map((med, idx) => (
            <div key={idx} style={{ marginBottom: '12px', borderBottom: '1px dotted #cbd5e1', paddingBottom: '10px' }}>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '11px' }}>
                {idx + 1}.&nbsp;&nbsp;{med.name}{med.strength ? ` — ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
              </div>
              <div style={{ paddingLeft: '22px', marginTop: '3px', fontSize: '9px', color: '#475569', fontStyle: 'italic' }}>
                {[med.frequency ? t(med.frequency, lang) : '', med.timing ? t(med.timing, lang) : '', med.duration].filter(Boolean).join('  ·  ')}
              </div>
            </div>
          ))}
        </div>

        {/* Advice */}
        {advice && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px', fontStyle: 'italic' }}>Advice & Instructions:</div>
            <div style={{ color: '#374151', fontSize: '9.5px', whiteSpace: 'pre-wrap', paddingLeft: '4px', lineHeight: 1.8 }}>{t(advice, lang)}</div>
          </div>
        )}

        {/* Lab tests */}
        {labTests && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic' }}>Investigations: </span>
            <span style={{ fontSize: '9.5px', color: '#374151' }}>{labTests}</span>
          </div>
        )}

        {followUpDate && (
          <div style={{ marginTop: '8px', fontSize: '9px', color: '#64748b' }}>
            <em>Follow-up on:</em> <strong>{followUpDate}</strong>
          </div>
        )}

        {/* Signature */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <SignatureArea />
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '7px', color: '#d1d5db', letterSpacing: '1px' }}>
          prescriptionmaker.in
        </div>
      </div>
    )
  }

  // ─── 2. TWO-COLUMN SIDEBAR ─────────────────────────────────────────────────
  // Left sidebar: doctor info + vitals recorded space, Right: Rx content
  if (slug === 'two-column-sidebar') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box', display: 'flex' }}>
        {/* Left Sidebar */}
        <div style={{ width: '68mm', background: pc, color: '#fff', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
          {/* Doctor photo placeholder / Logo */}
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto', overflow: 'hidden' }}>
            {doctor.logoUrl ? (
              <img src={doctor.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '👨‍⚕️'
            )}
          </div>

          <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
            {(doctor.qualifications) && <div style={{ fontSize: '8px', opacity: 0.8, marginTop: '2px' }}>{doctor.qualifications}</div>}
            {doctor.specialization && <div style={{ fontSize: '8px', color: ac, marginTop: '2px' }}>{doctor.specialization}</div>}
            {doctor.registrationNumber && <div style={{ fontSize: '7.5px', opacity: 0.6, marginTop: '2px' }}>Reg: {doctor.registrationNumber}</div>}
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>
            <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinic</div>
            <div style={{ fontSize: '9px', fontWeight: 600 }}>{doctor.clinicName || '—'}</div>
            {doctor.address && <div style={{ fontSize: '7.5px', opacity: 0.8, marginTop: '2px' }}>{doctor.address}</div>}
            {doctor.phone && <div style={{ fontSize: '7.5px', opacity: 0.8 }}>☎ {doctor.phone}</div>}
          </div>

          {/* Recorded Vitals section */}
          <div>
            <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recorded Vitals</div>
            {[
              { label: 'BP', unit: 'mmHg' },
              { label: 'Pulse', unit: 'bpm' },
              { label: 'Temp', unit: '°F' },
              { label: 'SpO₂', unit: '%' },
              { label: 'Weight', unit: 'kg' },
              { label: 'Height', unit: 'cm' },
            ].map(v => (
              <div key={v.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '3px' }}>
                <span style={{ fontSize: '8px' }}>{v.label} <span style={{ opacity: 0.6, fontSize: '7px' }}>({v.unit})</span></span>
                <div style={{ width: '40px', borderBottom: '1px solid rgba(255,255,255,0.5)', height: '10px' }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', fontSize: '7.5px', opacity: 0.5, textAlign: 'center' }}>
            prescriptionmaker.in
          </div>
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${ac}`, paddingBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: pc, textTransform: 'uppercase', letterSpacing: '1px' }}>Medical Prescription</div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>Date: <strong>{today}</strong></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '8px', color: '#64748b' }}>
              <div>OPD Ref: ___________</div>
            </div>
          </div>

          {/* Patient info */}
          <div style={{ background: `${ac}15`, borderRadius: '4px', padding: '8px 10px' }}>
            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Patient Details</div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1e293b' }}>{patient.name || '______________________________'}</div>
            <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
              {[patient.age ? `Age: ${patient.age}` : '', patient.gender ? `Sex: ${patient.gender}` : ''].filter(Boolean).join('  ·  ')}
            </div>
          </div>

          {/* Diagnosis */}
          {diagnosis && (
            <div style={{ border: `1px solid ${pc}30`, borderLeft: `3px solid ${pc}`, borderRadius: '2px', padding: '6px 8px' }}>
              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Diagnosis</div>
              <div style={{ fontSize: '10px', color: '#1e293b', fontWeight: 600 }}>{diagnosis}</div>
            </div>
          )}

          {/* Rx */}
          <div>
            <div style={{ fontSize: '16px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc, marginBottom: '4px' }}>℞</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
              <thead>
                <tr style={{ backgroundColor: pc, color: '#fff' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left', width: '40%' }}>Medicine</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', width: '18%' }}>Unit</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', width: '22%' }}>Frequency</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', width: '20%' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? `${pc}08` : '#fff', borderBottom: `1px solid ${pc}15` }}>
                    <td style={{ padding: '4px 6px' }}><strong>{idx + 1}. {med.name}</strong>{med.strength ? ` ${med.strength}` : ''}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.form || '—'}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.frequency ? t(med.frequency, lang) : '—'}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.duration || '—'}</td>
                  </tr>
                )) : Array.from({ length: 5 }, (_, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? `${pc}05` : '#fff' }}>
                    <td style={{ padding: '4px 6px', borderBottom: `1px solid ${pc}10` }}>&nbsp;</td>
                    <td style={{ padding: '4px 6px', borderBottom: `1px solid ${pc}10` }}>&nbsp;</td>
                    <td style={{ padding: '4px 6px', borderBottom: `1px solid ${pc}10` }}>&nbsp;</td>
                    <td style={{ padding: '4px 6px', borderBottom: `1px solid ${pc}10` }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {labTests && (
            <div style={{ fontSize: '8.5px' }}>
              <span style={{ color: '#64748b', fontWeight: 700 }}>Investigations: </span>
              <span style={{ color: '#374151' }}>{labTests}</span>
            </div>
          )}

          {advice && (
            <div style={{ fontSize: '8.5px' }}>
              <span style={{ color: '#64748b', fontWeight: 700 }}>Advice: </span>
              <span style={{ color: '#374151' }}>{t(advice, lang)}</span>
            </div>
          )}

          {followUpDate && (
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>
              Next visit: <strong>{followUpDate}</strong>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
            <SignatureArea />
          </div>
        </div>
      </div>
    )
  }

  // ─── 3. HOSPITAL OPD FORM ──────────────────────────────────────────────────
  // Full institutional format: MRN, Ward, Bed, HOD signature
  if (slug === 'hospital-opd') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9px', boxSizing: 'border-box' }}>
        {/* Hospital banner */}
        <div style={{ background: pc, color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontFamily: 'Georgia, serif', fontWeight: 900 }}>℞</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>{doctor.clinicName || 'City Hospital'}</div>
              {doctor.address && <div style={{ fontSize: '8px', opacity: 0.8 }}>{doctor.address}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9 }}>OPD / PRESCRIPTION</div>
            <div style={{ fontSize: '8.5px', opacity: 0.7, marginTop: '2px' }}>Date: {today}</div>
          </div>
        </div>

        <div style={{ padding: '10px 14px' }}>
          {/* MRN / Ward / Bed row */}
          <div style={{ display: 'flex', border: `1px solid ${pc}40`, borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            {[
              { label: 'MRN No.', value: patient.mrn },
              { label: 'Ward', value: patient.ward },
              { label: 'Bed No.', value: patient.bedNo },
              { label: 'IP/OP No.', value: patient.ipOpNo },
            ].map((f, i) => (
              <div key={i} style={{ flex: 1, padding: '5px 8px', borderRight: i < 3 ? `1px solid ${pc}30` : 'none', background: i % 2 === 0 ? '#fff' : `${pc}05` }}>
                <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{f.label}</div>
                <div style={{ fontSize: '9px', fontWeight: 600, marginTop: '2px' }}>{f.value || '\u00A0'}</div>
              </div>
            ))}
          </div>

          {/* Attending Physician */}
          <div style={{ background: `${ac}20`, border: `1px solid ${ac}40`, borderRadius: '4px', padding: '5px 10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>
              <strong style={{ color: pc }}>ATTENDING PHYSICIAN:</strong>
              <span style={{ marginLeft: '8px', fontWeight: 700 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. ______________'}</span>
              {doctor.qualifications && <span style={{ color: '#64748b', marginLeft: '6px' }}>{doctor.qualifications}</span>}
            </span>
            <span>
              <strong style={{ color: pc }}>SPECIALTY:</strong>
              <span style={{ marginLeft: '6px' }}>{doctor.specialization || '________________'}</span>
            </span>
          </div>

          {/* Patient info table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${pc}40`, marginBottom: '8px', fontSize: '9px' }}>
            <tbody>
              <tr style={{ backgroundColor: `${pc}15` }}>
                <td colSpan={4} style={{ padding: '4px 8px', fontWeight: 700, color: pc, textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.5px' }}>Patient Information</td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${pc}25` }}>
                <td colSpan={4} style={{ padding: '5px 8px' }}>
                  <span style={{ color: '#64748b' }}>Patient Name: </span>
                  <strong style={{ fontSize: '11px' }}>{patient.name || '___________________________'}</strong>
                </td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${pc}25` }}>
                <td style={{ padding: '5px 8px', borderRight: `1px solid ${pc}25`, width: '25%' }}><span style={{ color: '#64748b' }}>MRN: </span><strong>{patient.mrn || '\u00A0'}</strong></td>
                <td style={{ padding: '5px 8px', borderRight: `1px solid ${pc}25`, width: '25%' }}><span style={{ color: '#64748b' }}>Age: </span><strong>{patient.age || '____'}</strong></td>
                <td style={{ padding: '5px 8px', borderRight: `1px solid ${pc}25`, width: '25%' }}><span style={{ color: '#64748b' }}>Sex: </span><strong>{patient.gender || '____'}</strong></td>
                <td style={{ padding: '5px 8px', width: '25%' }}><span style={{ color: '#64748b' }}>Ward: </span><strong>{patient.ward || '\u00A0'}</strong></td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${pc}25` }}>
                <td colSpan={2} style={{ padding: '5px 8px', borderRight: `1px solid ${pc}25` }}><span style={{ color: '#64748b' }}>Insurance No: </span><strong>{patient.insuranceNo || '\u00A0'}</strong></td>
                <td colSpan={2} style={{ padding: '5px 8px' }}><span style={{ color: '#64748b' }}>Care Provider: </span><strong>{patient.careProvider || '\u00A0'}</strong></td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '5px 8px' }}>
                  <span style={{ color: '#64748b' }}>Diagnosis: </span>
                  <strong>{diagnosis || '___________________________'}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Rx + Medicine table */}
          <div style={{ fontSize: '14px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc, marginBottom: '4px' }}>℞</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${pc}40`, fontSize: '8.5px', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: pc, color: '#fff' }}>
                <th style={{ padding: '5px 6px', textAlign: 'left', width: '32%' }}>Medication / Strength</th>
                <th style={{ padding: '5px 6px', textAlign: 'center', width: '20%' }}>Dosage / Frequency</th>
                <th style={{ padding: '5px 6px', textAlign: 'center', width: '13%' }}>Route</th>
                <th style={{ padding: '5px 6px', textAlign: 'center', width: '13%' }}>Quantity</th>
                <th style={{ padding: '5px 6px', textAlign: 'left', width: '22%' }}>Duration / Notes</th>
              </tr>
            </thead>
            <tbody>
              {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${pc}20`, backgroundColor: idx % 2 === 0 ? '#fff' : `${pc}05` }}>
                  <td style={{ padding: '5px 6px' }}><strong>{med.name}</strong>{med.strength ? <span style={{ color: '#64748b' }}> / {med.strength}</span> : ''}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>{med.frequency ? t(med.frequency, lang) : '—'}</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>Oral</td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>&nbsp;</td>
                  <td style={{ padding: '5px 6px' }}>{med.duration || '—'}</td>
                </tr>
              )) : Array.from({ length: 5 }, (_, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${pc}15` }}>
                  <td style={{ padding: '6px' }}>&nbsp;</td>
                  <td style={{ padding: '6px' }}>&nbsp;</td>
                  <td style={{ padding: '6px' }}>&nbsp;</td>
                  <td style={{ padding: '6px' }}>&nbsp;</td>
                  <td style={{ padding: '6px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Investigations */}
          <div style={{ border: `1px solid ${pc}30`, borderRadius: '4px', padding: '6px 10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', marginBottom: '4px' }}>Investigations Ordered</div>
            <div style={{ color: '#374151', minHeight: '20px' }}>{labTests || '\u00a0'}</div>
          </div>

          {/* Advice */}
          {advice && (
            <div style={{ border: `1px solid ${pc}30`, borderRadius: '4px', padding: '6px 10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', marginBottom: '4px' }}>Instructions / Advice</div>
              <div style={{ color: '#374151' }}>{t(advice, lang)}</div>
            </div>
          )}

          {followUpDate && (
            <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '8px' }}>
              Review Date: <strong>{followUpDate}</strong>
            </div>
          )}

          {/* Dual signatures */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <div style={{ flex: 1, border: `1px solid ${pc}30`, borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, marginBottom: '20px' }}>HOD SIGNATURE</div>
              <div style={{ borderTop: '1px solid #94a3b8' }}></div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '3px' }}>Head of Department</div>
            </div>
            <div style={{ flex: 1, border: `1px solid ${pc}30`, borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>DOCTOR SIGNATURE</div>
              {doctor.signatureUrl
                ? <img src={doctor.signatureUrl} alt="Sig" style={{ width: '70px', height: '28px', objectFit: 'contain' }} />
                : <div style={{ height: '24px' }} />}
              <div style={{ borderTop: '1px solid #94a3b8' }}></div>
              <div style={{ fontSize: '7.5px', color: '#1e293b', fontWeight: 600, marginTop: '3px' }}>Dr. {doctor.name || '____________'}</div>
              {doctor.registrationNumber && <div style={{ fontSize: '7px', color: '#94a3b8' }}>Reg: {doctor.registrationNumber}</div>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── 4. SOAP CLINICAL NOTES ────────────────────────────────────────────────
  // S/O/A/P format used by western-trained/academic doctors
  if (slug === 'soap-clinical') {
    const soapBoxStyle = (letter: string, color: string) => ({
      marginBottom: '8px',
      border: `1px solid ${color}40`,
      borderRadius: '6px',
      overflow: 'hidden' as const,
    })
    const soapHeader = (letter: string, label: string, color: string) => (
      <div style={{ background: color, color: '#fff', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{letter}</span>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{label}</span>
      </div>
    )
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9.5px', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ background: pc, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {doctor.logoUrl && (
              <img src={doctor.logoUrl} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: '2px' }} />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
              <div style={{ fontSize: '8.5px', opacity: 0.8 }}>{[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}</div>
              {doctor.registrationNumber && <div style={{ fontSize: '8px', opacity: 0.6 }}>Reg: {doctor.registrationNumber}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: ac }}>{doctor.clinicName || 'Medical Centre'}</div>
            {doctor.phone && <div style={{ fontSize: '8px', opacity: 0.7 }}>☎ {doctor.phone}</div>}
          </div>
        </div>

        <div style={{ padding: '10px 14px' }}>
          {/* Patient + date bar */}
          <div style={{ background: `${ac}20`, border: `1px solid ${ac}40`, borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '8px' }}>Patient: </span>
              <strong style={{ fontSize: '11px' }}>{patient.name || '______________________'}</strong>
              <span style={{ marginLeft: '12px', fontSize: '8.5px', color: '#64748b' }}>
                {[patient.age ? `Age ${patient.age}` : '', patient.gender].filter(Boolean).join(' / ')}
              </span>
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>Date: <strong>{today}</strong></div>
          </div>

          {/* S — Subjective */}
          <div style={soapBoxStyle('S', '#7c3aed')}>
            {soapHeader('S', 'Subjective — Chief Complaint & History', '#7c3aed')}
            <div style={{ padding: '8px 10px', minHeight: '36px', color: '#374151', fontSize: '9.5px' }}>
              {diagnosis || <span style={{ color: '#d1d5db' }}>Patient&apos;s reported symptoms, history of present illness...</span>}
            </div>
          </div>

          {/* O — Objective */}
          <div style={soapBoxStyle('O', '#1d4ed8')}>
            {soapHeader('O', 'Objective — Vitals & Examination Findings', '#1d4ed8')}
            <div style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                {[
                  { label: 'BP', value: vitals.bloodPressure },
                  { label: 'HR (bpm)', value: vitals.pulse },
                  { label: 'Temp (°F)', value: vitals.temperature },
                  { label: 'SpO₂ (%)', value: vitals.spo2 },
                  { label: 'Weight (kg)', value: vitals.weight },
                  { label: 'RR (/min)', value: vitals.respiratoryRate }
                ].map(v => (
                  <div key={v.label} style={{ border: '1px solid #dbeafe', borderRadius: '4px', padding: '3px 8px', fontSize: '8px', background: '#eff6ff' }}>
                    <span style={{ color: '#94a3b8' }}>{v.label}: </span>
                    {v.value ? (
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{v.value}</span>
                    ) : (
                      <span style={{ display: 'inline-block', width: '28px', borderBottom: '1px solid #94a3b8' }}>&nbsp;</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ color: chiefComplaint ? '#374151' : '#d1d5db', fontSize: '8.5px', minHeight: '16px' }}>
                {chiefComplaint || 'Examination findings...'}
              </div>
            </div>
          </div>

          {/* A — Assessment */}
          <div style={soapBoxStyle('A', '#065f46')}>
            {soapHeader('A', 'Assessment — Diagnosis', '#065f46')}
            <div style={{ padding: '8px 10px', minHeight: '28px', color: '#374151', fontSize: '9.5px', fontWeight: 600 }}>
              {diagnosis || <span style={{ color: '#d1d5db', fontWeight: 400 }}>Primary diagnosis, differential diagnoses, ICD-10 code...</span>}
            </div>
          </div>

          {/* P — Plan */}
          <div style={soapBoxStyle('P', pc)}>
            {soapHeader('P', 'Plan — Medications, Investigations & Advice', pc)}
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: '8.5px', fontWeight: 700, color: pc, marginBottom: '4px' }}>℞ Medications</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ background: `${pc}20` }}>
                    <th style={{ padding: '3px 6px', textAlign: 'left', width: '38%', color: pc }}>Drug</th>
                    <th style={{ padding: '3px 6px', textAlign: 'center', width: '20%', color: pc }}>Dose</th>
                    <th style={{ padding: '3px 6px', textAlign: 'center', width: '22%', color: pc }}>Frequency</th>
                    <th style={{ padding: '3px 6px', textAlign: 'center', width: '20%', color: pc }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${pc}15` }}>
                      <td style={{ padding: '4px 6px' }}><strong>{med.name}</strong>{med.strength ? ` ${med.strength}` : ''}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.form || '—'}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.frequency ? t(med.frequency, lang) : '—'}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.duration || '—'}</td>
                    </tr>
                  )) : Array.from({ length: 3 }, (_, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${pc}10` }}>
                      <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                      <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                      <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                      <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {labTests && (
                <div style={{ marginBottom: '6px', fontSize: '8.5px' }}>
                  <span style={{ fontWeight: 700, color: pc }}>Investigations: </span>
                  <span style={{ color: '#374151' }}>{labTests}</span>
                </div>
              )}

              {advice && (
                <div style={{ fontSize: '8.5px' }}>
                  <span style={{ fontWeight: 700, color: pc }}>Patient Education / Advice: </span>
                  <span style={{ color: '#374151' }}>{t(advice, lang)}</span>
                </div>
              )}

              {followUpDate && (
                <div style={{ marginTop: '4px', fontSize: '8.5px' }}>
                  <span style={{ fontWeight: 700, color: pc }}>Follow-up: </span>
                  <span>{followUpDate}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <SignatureArea />
          </div>
        </div>
      </div>
    )
  }

  // ─── 5. VITALS-FIRST ───────────────────────────────────────────────────────
  // Prominent vitals grid BEFORE the Rx — used by cardiologists
  if (slug === 'vitals-first') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9.5px', boxSizing: 'border-box' }}>
        {/* Dark red header */}
        <div style={{ background: pc, color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
            {doctor.qualifications && <div style={{ fontSize: '8.5px', color: ac, marginTop: '2px' }}>{doctor.qualifications}</div>}
            {doctor.specialization && <div style={{ fontSize: '8px', opacity: 0.7 }}>{doctor.specialization}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            {doctor.clinicName && <div style={{ fontSize: '10px', fontWeight: 700 }}>{doctor.clinicName}</div>}
            {doctor.phone && <div style={{ fontSize: '8px', opacity: 0.7 }}>{doctor.phone}</div>}
            {doctor.registrationNumber && <div style={{ fontSize: '8px', color: ac }}>Reg: {doctor.registrationNumber}</div>}
          </div>
        </div>

        <div style={{ padding: '10px 14px' }}>
          {/* Patient info + date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', border: `1px solid ${pc}30`, borderRadius: '4px', padding: '6px 10px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '8px', color: '#94a3b8' }}>PATIENT: </span>
              <strong style={{ fontSize: '11px' }}>{patient.name || '__________________________'}</strong>
              {(patient.age || patient.gender) && (
                <span style={{ marginLeft: '10px', fontSize: '8.5px', color: '#64748b' }}>
                  Age: <strong>{patient.age || '___'}</strong>  Sex: <strong>{patient.gender || '___'}</strong>
                </span>
              )}
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>Date: <strong>{today}</strong></div>
          </div>

          {/* Prominent VITALS box */}
          <div style={{ border: `2px solid ${pc}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ background: pc, color: '#fff', padding: '5px 10px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              ❤️  VITALS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
              {[
                { label: 'BLOOD PRESSURE', value: vitals?.bloodPressure, unit: 'mmHg' },
                { label: 'HEART RATE', value: vitals?.pulse, unit: 'bpm' },
                { label: 'SpO₂', value: vitals?.spo2, unit: '%' },
                { label: 'TEMPERATURE', value: vitals?.temperature, unit: '°F' },
                { label: 'WEIGHT', value: vitals?.weight, unit: 'kg' },
                { label: 'RR', value: vitals?.respiratoryRate, unit: '/min' },
              ].map((v, i) => (
                <div key={i} style={{
                  padding: '8px 10px',
                  background: i % 2 === 0 ? `${ac}25` : `${pc}10`,
                  borderRight: i % 3 < 2 ? `1px solid ${pc}30` : 'none',
                  borderBottom: i < 3 ? `1px solid ${pc}30` : 'none',
                }}>
                  <div style={{ fontSize: '7px', fontWeight: 700, color: pc, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{v.label}</div>
                  <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '1px' }}>({v.unit})</div>
                  <div style={{ marginTop: '4px', borderBottom: `1px solid ${pc}60`, minHeight: '14px', fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                    {v.value || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cardiac Diagnosis */}
          <div style={{ border: `1px solid ${ac}50`, borderLeft: `4px solid ${pc}`, borderRadius: '0 4px 4px 0', padding: '6px 10px', marginBottom: '10px', background: `${ac}10` }}>
            <strong style={{ color: pc, fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnosis: </strong>
            <span style={{ fontSize: '10px', fontWeight: 700 }}>{diagnosis || '___________________________________'}</span>
          </div>

          {/* Prescription */}
          <div style={{ fontSize: '13px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc, marginBottom: '4px' }}>℞&nbsp;<span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px' }}>PRESCRIPTION MEDICINES</span></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '8px', border: `1px solid ${pc}30` }}>
            <thead>
              <tr style={{ background: pc, color: '#fff' }}>
                <th style={{ padding: '5px 8px', textAlign: 'left', width: '3%' }}>#</th>
                <th style={{ padding: '5px 8px', textAlign: 'left', width: '34%' }}>Medicine (Strength)</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', width: '15%' }}>Dosage</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', width: '20%' }}>Frequency</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', width: '13%' }}>Duration</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', width: '15%' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : `${ac}10`, borderBottom: `1px solid ${pc}15` }}>
                  <td style={{ padding: '5px 8px', color: pc, fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '5px 8px' }}><strong>{med.name}</strong>{med.strength ? ` ${med.strength}` : ''}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>{med.form || '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>{med.frequency ? t(med.frequency, lang) : '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>{med.duration || '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>&nbsp;</td>
                </tr>
              )) : Array.from({ length: 5 }, (_, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${pc}15` }}>
                  <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 8px' }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px' }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px' }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px' }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cardiac Investigations checklist */}
          <div style={{ border: `1px solid ${pc}30`, borderRadius: '4px', padding: '6px 10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', marginBottom: '6px' }}>Cardiac Investigations</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['ECG', 'ECHO (TTE)', 'TMT', 'Holter', 'Lipid Profile', 'HbA1c', 'CBC', 'LFT/KFT', labTests].filter(Boolean).map((test, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8.5px', color: '#374151' }}>
                  <span style={{ width: '10px', height: '10px', border: `1px solid ${pc}60`, display: 'inline-block', flexShrink: 0 }}></span>
                  {test}
                </label>
              ))}
            </div>
          </div>

          {advice && (
            <div style={{ marginBottom: '8px', fontSize: '8.5px' }}>
              <strong style={{ color: pc }}>Lifestyle Advice: </strong>
              <span style={{ color: '#374151' }}>{t(advice, lang)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>
              Follow-up Date: <strong>{followUpDate || '______________'}</strong>
            </div>
            <SignatureArea />
          </div>

          {/* Footer band */}
          <div style={{ marginTop: '12px', background: pc, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '7.5px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{doctor.clinicName || ''}</span>
            <span>prescriptionmaker.in</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── 6. DETAILED DRUG CHART ────────────────────────────────────────────────
  // Each medicine gets its own structured card with route, timing, instructions
  if (slug === 'detailed-drug-chart') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9.5px', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ background: pc, color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {doctor.logoUrl && (
              <img src={doctor.logoUrl} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: '2px' }} />
            )}
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
              <div style={{ fontSize: '8.5px', color: ac, marginTop: '2px' }}>{[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {doctor.clinicName && <div style={{ fontSize: '10px', fontWeight: 700 }}>{doctor.clinicName}</div>}
            {doctor.phone && <div style={{ fontSize: '8px', opacity: 0.7 }}>{doctor.phone}</div>}
            {doctor.address && <div style={{ fontSize: '8px', opacity: 0.6 }}>{doctor.address}</div>}
          </div>
        </div>

        <div style={{ padding: '10px 14px' }}>
          {/* Patient + Diagnosis row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 2, background: '#fff', border: `1px solid ${pc}30`, borderRadius: '4px', padding: '6px 10px' }}>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Patient</div>
              <div style={{ fontWeight: 700, fontSize: '11px' }}>{patient.name || '______________________'}</div>
              <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                {[patient.age ? `Age ${patient.age}` : '', patient.gender].filter(Boolean).join(' · ')}  · Date: {today}
              </div>
            </div>
            <div style={{ flex: 1, background: `${ac}15`, border: `1px solid ${ac}40`, borderRadius: '4px', padding: '6px 10px' }}>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Diagnosis</div>
              <div style={{ fontWeight: 700, fontSize: '10px', color: pc }}>{diagnosis || '____________________'}</div>
            </div>
          </div>

          {/* Rx heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc }}>℞</span>
            <div style={{ flex: 1, borderBottom: `2px solid ${pc}30` }}></div>
          </div>

          {/* Individual drug cards */}
          {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
            <div key={idx} style={{ border: `1px solid ${pc}30`, borderLeft: `4px solid ${pc}`, borderRadius: '0 4px 4px 0', marginBottom: '8px', overflow: 'hidden' }}>
              <div style={{ background: `${pc}08`, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: pc, width: '18px', textAlign: 'center' }}>{idx + 1}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{med.name}</span>
                {med.strength && <span style={{ fontSize: '9px', color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: '3px' }}>{med.strength}</span>}
                {med.form && <span style={{ fontSize: '9px', color: ac, background: `${ac}20`, padding: '1px 6px', borderRadius: '3px' }}>{med.form}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', borderTop: `1px solid ${pc}15` }}>
                {[
                  { label: 'Route', val: 'Oral' },
                  { label: 'Frequency', val: med.frequency ? t(med.frequency, lang) : '—' },
                  { label: 'Timing', val: med.timing ? t(med.timing, lang) : '—' },
                  { label: 'Duration', val: med.duration || '—' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '5px 8px', borderRight: i < 3 ? `1px solid ${pc}15` : 'none' }}>
                    <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</div>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>{f.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{ border: `1px solid ${pc}20`, borderLeft: `4px solid ${pc}40`, borderRadius: '0 4px 4px 0', marginBottom: '8px', height: '48px', display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: `${pc}40`, marginRight: '8px' }}>{n}</span>
                  <span style={{ color: '#e2e8f0', fontSize: '9px' }}>__________________________</span>
                </div>
              ))}
            </>
          )}

          {labTests && (
            <div style={{ border: `1px solid ${ac}40`, borderRadius: '4px', padding: '6px 10px', marginBottom: '8px', background: `${ac}10` }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', marginBottom: '3px' }}>Lab Investigations</div>
              <div style={{ color: '#374151' }}>{labTests}</div>
            </div>
          )}

          {advice && (
            <div style={{ border: `1px solid ${pc}20`, borderRadius: '4px', padding: '6px 10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', marginBottom: '3px' }}>Advice</div>
              <div style={{ color: '#374151' }}>{t(advice, lang)}</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
            {followUpDate && <div style={{ fontSize: '8.5px', color: '#64748b' }}>Follow-up: <strong>{followUpDate}</strong></div>}
            <SignatureArea />
          </div>

          <div style={{ marginTop: '10px', background: pc, color: ac, padding: '4px 10px', borderRadius: '4px', textAlign: 'center', fontSize: '7.5px' }}>
            {template.name} Template · prescriptionmaker.in
          </div>
        </div>
      </div>
    )
  }

  // ─── 7. MULTI-SECTION BOXED ────────────────────────────────────────────────
  // Multiple bordered boxes — systematic documentation
  if (slug === 'multi-section-boxed') {
    const Box = ({ title, children, color = pc }: { title: string; children: React.ReactNode; color?: string }) => (
      <div style={{ border: `1.5px solid ${color}35`, borderRadius: '5px', overflow: 'hidden', marginBottom: '7px' }}>
        <div style={{ background: color, color: '#fff', padding: '4px 10px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {title}
        </div>
        <div style={{ padding: '6px 10px', background: '#fff', minHeight: '22px' }}>
          {children}
        </div>
      </div>
    )

    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9.5px', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ background: pc, color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {doctor.logoUrl && (
              <img src={doctor.logoUrl} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: '2px' }} />
            )}
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
              <div style={{ fontSize: '8.5px', color: ac }}>{[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {doctor.clinicName && <div style={{ fontSize: '9.5px', fontWeight: 700 }}>{doctor.clinicName}</div>}
            {doctor.phone && <div style={{ fontSize: '8px', opacity: 0.7 }}>{doctor.phone}</div>}
            {doctor.address && <div style={{ fontSize: '7.5px', opacity: 0.6 }}>{doctor.address}</div>}
          </div>
        </div>

        <div style={{ padding: '10px 14px' }}>
          {/* Patient info + date side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '7px' }}>
            <Box title="Patient Information" color={ac}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#1e293b' }}>{patient.name || '___________________'}</div>
              <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                {[patient.age ? `Age: ${patient.age}` : '', patient.gender ? `Sex: ${patient.gender}` : ''].filter(Boolean).join('  ·  ')}
              </div>
            </Box>
            <Box title="Date & Reference" color={ac}>
              <div style={{ fontSize: '10px' }}>Date: <strong>{today}</strong></div>
              <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>Reg: {doctor.registrationNumber || '___________'}</div>
            </Box>
          </div>

          {/* Chief Complaint */}
          <Box title="Chief Complaint" color={pc}>
            <div style={{ color: '#374151', minHeight: '20px' }}>{diagnosis || <span style={{ color: '#d1d5db' }}>Patient&apos;s chief complaint and history...</span>}</div>
          </Box>

          {/* Diagnosis */}
          <Box title="Diagnosis" color={pc}>
            <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '10.5px' }}>{diagnosis || <span style={{ color: '#d1d5db', fontWeight: 400 }}>Clinical diagnosis...</span>}</div>
          </Box>

          {/* Prescription box */}
          <Box title="℞ Prescription" color={pc}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
              <thead>
                <tr style={{ background: `${pc}15` }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left', width: '40%', color: pc }}>Drug</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', width: '18%', color: pc }}>Unit</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', width: '22%', color: pc }}>Frequency</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', width: '20%', color: pc }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${pc}10` }}>
                    <td style={{ padding: '4px 6px' }}><strong>{idx + 1}. {med.name}</strong>{med.strength ? ` ${med.strength}` : ''}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.form || '—'}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.frequency ? t(med.frequency, lang) : '—'}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{med.duration || '—'}</td>
                  </tr>
                )) : Array.from({ length: 4 }, (_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${pc}10` }}>
                    <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                    <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                    <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                    <td style={{ padding: '5px 6px' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Investigations + Advice */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
            <Box title="Investigations" color={ac}>
              <div style={{ color: '#374151', minHeight: '20px' }}>{labTests || <span style={{ color: '#d1d5db' }}>Tests ordered...</span>}</div>
            </Box>
            <Box title="Advice" color={ac}>
              <div style={{ color: '#374151', minHeight: '20px' }}>{advice ? t(advice, lang) : <span style={{ color: '#d1d5db' }}>Patient advice...</span>}</div>
            </Box>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
            {followUpDate && <div style={{ fontSize: '8.5px', color: '#64748b' }}>Next visit: <strong>{followUpDate}</strong></div>}
            <SignatureArea />
          </div>
        </div>
      </div>
    )
  }

  // ─── 8. MINIMAL PRINT RULED ────────────────────────────────────────────────
  // Like a premium printed notepad — no colors, hairline rules, serif elegance
  if (slug === 'minimal-print-ruled') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: '#ffffff', fontFamily: 'Georgia, serif', fontSize: '10px', boxSizing: 'border-box', padding: '28mm 26mm' }}>
        {/* Clinic name — large, left aligned */}
        <div style={{ borderBottom: '2px solid #1a202c', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a202c', letterSpacing: '0.5px' }}>
            {doctor.clinicName || 'Medical Clinic'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2d3748' }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</span>
              {(doctor.qualifications || doctor.specialization) && (
                <span style={{ fontSize: '9px', color: '#718096', fontStyle: 'italic', marginLeft: '8px' }}>
                  {[doctor.qualifications, doctor.specialization].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            {doctor.registrationNumber && (
              <span style={{ fontSize: '8.5px', color: '#a0aec0' }}>Reg. No. {doctor.registrationNumber}</span>
            )}
          </div>
          {(doctor.address || doctor.phone) && (
            <div style={{ marginTop: '2px', fontSize: '8.5px', color: '#a0aec0', display: 'flex', gap: '16px' }}>
              {doctor.address && <span>{doctor.address}</span>}
              {doctor.phone && <span>☎ {doctor.phone}</span>}
            </div>
          )}
        </div>

        {/* Patient + date on single line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <div>
            <span style={{ fontSize: '9px', color: '#a0aec0' }}>Patient: </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2d3748', borderBottom: '1px dotted #a0aec0', paddingBottom: '1px' }}>
              {patient.name || '____________________________________'}
            </span>
            {patient.age && <span style={{ marginLeft: '14px', fontSize: '9px', color: '#718096' }}>Age {patient.age}{patient.gender ? ` / ${patient.gender}` : ''}</span>}
          </div>
          <span style={{ fontSize: '9px', color: '#718096' }}>{today}</span>
        </div>

        {/* Chief complaint — subtle line */}
        {diagnosis && (
          <div style={{ marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            <span style={{ fontSize: '8.5px', fontStyle: 'italic', color: '#a0aec0' }}>Diagnosis: </span>
            <span style={{ color: '#2d3748' }}>{diagnosis}</span>
          </div>
        )}

        {/* Big italic Rx */}
        <div style={{ fontSize: '48px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1a202c', lineHeight: 1, marginBottom: '10px', marginTop: '8px' }}>
          ℞
        </div>

        {/* Ruled medicine lines */}
        <div style={{ paddingLeft: '8px' }}>
          {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
            <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2d3748' }}>
                {idx + 1}.&nbsp;&nbsp;{med.name}{med.strength ? ` ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
              </div>
              <div style={{ paddingLeft: '22px', marginTop: '3px', color: '#718096', fontSize: '9px', fontStyle: 'italic' }}>
                {[med.frequency ? t(med.frequency, lang) : '', med.timing ? t(med.timing, lang) : '', med.duration].filter(Boolean).join('  ·  ')}
              </div>
            </div>
          )) : [1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{n}.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <span style={{ color: '#e2e8f0', fontSize: '9px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            </div>
          ))}
        </div>

        {labTests && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px', marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', fontStyle: 'italic', color: '#a0aec0' }}>Investigations: </span>
            <span style={{ color: '#2d3748', fontSize: '9.5px' }}>{labTests}</span>
          </div>
        )}

        {advice && (
          <div style={{ borderTop: labTests ? 'none' : '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
            <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#a0aec0', marginBottom: '4px' }}>Advice:</div>
            <div style={{ color: '#2d3748', fontSize: '9.5px', paddingLeft: '4px', lineHeight: 1.8 }}>{t(advice, lang)}</div>
          </div>
        )}

        {followUpDate && (
          <div style={{ marginTop: '10px', fontSize: '9px', fontStyle: 'italic', color: '#718096' }}>
            Review on: <em>{followUpDate}</em>
          </div>
        )}

        {/* Signature */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            {doctor.signatureUrl
              ? <img src={doctor.signatureUrl} alt="Signature" style={{ width: '80px', height: '32px', objectFit: 'contain', display: 'block', marginLeft: 'auto', marginBottom: '4px' }} />
              : <div style={{ width: '100px', borderBottom: '1px solid #718096', marginLeft: 'auto', marginBottom: '4px', height: '28px' }} />}
            <div style={{ fontSize: '8px', color: '#a0aec0' }}>Signature</div>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '7px', color: '#e2e8f0', letterSpacing: '2px', textTransform: 'uppercase' }}>
          prescriptionmaker.in
        </div>
      </div>
    )
  }

  // ─── 9. BILINGUAL INDIAN ───────────────────────────────────────────────────
  // English + Hindi labels side by side
  if (slug === 'bilingual-indian') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9.5px', boxSizing: 'border-box' }}>
        {/* Purple header */}
        <div style={{ background: pc, padding: '14px 16px', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>{doctor.clinicName || 'Medical Clinic'}</div>
          {doctor.name && (
            <div style={{ marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Dr. {doctor.name}</span>
              {doctor.qualifications && <span style={{ fontSize: '9px', color: ac, marginLeft: '8px' }}>{doctor.qualifications}</span>}
            </div>
          )}
          {doctor.specialization && <div style={{ fontSize: '9px', color: ac, marginTop: '2px' }}>{doctor.specialization}</div>}
          {doctor.registrationNumber && <div style={{ fontSize: '8px', opacity: 0.7, marginTop: '2px' }}>Reg. No.: {doctor.registrationNumber}</div>}
          {(doctor.address || doctor.phone) && (
            <div style={{ marginTop: '4px', fontSize: '8px', opacity: 0.7, display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {doctor.address && <span>📍 {doctor.address}</span>}
              {doctor.phone && <span>📞 {doctor.phone}</span>}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 14px' }}>
          {/* Bilingual patient info */}
          <div style={{ border: `1.5px solid ${pc}40`, borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ background: `${pc}15`, padding: '3px 8px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${pc}30` }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: pc }}>PATIENT DETAILS / रोगी विवरण</span>
              <span style={{ fontSize: '8px', color: '#64748b' }}>Date: {today}</span>
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${pc}15`, paddingBottom: '5px', marginBottom: '5px' }}>
                <div style={{ flex: 3 }}>
                  <span style={{ fontSize: '8px', color: '#94a3b8' }}>Patient Name / मरीज का नाम: </span>
                  <strong style={{ fontSize: '11px' }}>{patient.name || '____________________________'}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '8px', color: '#94a3b8' }}>Age / उम्र: </span>
                  <strong>{patient.age || '______'}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '8px', color: '#94a3b8' }}>Sex / लिंग: </span>
                  <strong>{patient.gender || '______'}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '8px', color: '#94a3b8' }}>Address / पता: </span>
                  <span style={{ fontSize: '9px' }}>{patient.address || '___________________________'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '8px', color: '#94a3b8' }}>Allergies / एलर्जी: </span>
                  <span style={{ fontSize: '9px' }}>{patient.allergies || '_________________'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bilingual Diagnosis */}
          {diagnosis && (
            <div style={{ border: `1px solid ${pc}30`, borderLeft: `4px solid ${pc}`, padding: '5px 10px', marginBottom: '10px', background: `${pc}08` }}>
              <span style={{ fontSize: '8px', color: '#64748b' }}>Diagnosis / रोग निदान: </span>
              <strong style={{ fontSize: '10px' }}>{diagnosis}</strong>
            </div>
          )}

          {/* Rx with bilingual header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc }}>℞</span>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: pc }}>PRESCRIPTION </span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>/ दवाइयाँ</span>
            </div>
          </div>

          {/* Numbered bilingual medicine list */}
          <div style={{ border: `1px solid ${pc}30`, borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ background: pc, color: '#fff', display: 'grid', gridTemplateColumns: '4% 36% 16% 22% 22%', fontSize: '8px', fontWeight: 700 }}>
              {['#', 'दवाई / Medicine', 'Unit', 'Frequency / मात्रा', 'Duration / समय'].map((h, i) => (
                <div key={i} style={{ padding: '5px 6px', borderRight: i < 4 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>{h}</div>
              ))}
            </div>
            {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '4% 36% 16% 22% 22%', borderBottom: `1px solid ${pc}15`, background: idx % 2 === 0 ? '#fff' : `${pc}06`, fontSize: '8.5px' }}>
                <div style={{ padding: '5px 6px', fontWeight: 700, color: pc }}>{idx + 1}</div>
                <div style={{ padding: '5px 6px' }}><strong>{med.name}</strong>{med.strength ? ` ${med.strength}` : ''}</div>
                <div style={{ padding: '5px 6px', textAlign: 'center' }}>{med.form || '—'}</div>
                <div style={{ padding: '5px 6px', textAlign: 'center' }}>{med.frequency ? t(med.frequency, lang) : '—'}</div>
                <div style={{ padding: '5px 6px', textAlign: 'center' }}>{med.duration || '—'}</div>
              </div>
            )) : Array.from({ length: 6 }, (_, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '4% 36% 16% 22% 22%', borderBottom: `1px solid ${pc}10`, background: idx % 2 === 0 ? '#fff' : `${pc}06` }}>
                <div style={{ padding: '6px' }}>{idx + 1}</div>
                <div style={{ padding: '6px' }}>&nbsp;</div>
                <div style={{ padding: '6px' }}>&nbsp;</div>
                <div style={{ padding: '6px' }}>&nbsp;</div>
                <div style={{ padding: '6px' }}>&nbsp;</div>
              </div>
            ))}
          </div>

          {labTests && (
            <div style={{ marginBottom: '8px', fontSize: '8.5px' }}>
              <strong style={{ color: pc }}>जाँच / Investigations: </strong>
              <span style={{ color: '#374151' }}>{labTests}</span>
            </div>
          )}

          {advice && (
            <div style={{ marginBottom: '8px', fontSize: '8.5px' }}>
              <strong style={{ color: pc }}>सलाह / Advice: </strong>
              <span style={{ color: '#374151' }}>{t(advice, lang)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '14px' }}>
            {followUpDate && <div style={{ fontSize: '8.5px', color: '#64748b' }}>Next Visit / अगली मुलाकात: <strong>{followUpDate}</strong></div>}
            <SignatureArea />
          </div>

          {/* Footer band */}
          <div style={{ marginTop: '12px', background: pc, color: ac, padding: '4px 10px', borderRadius: '4px', textAlign: 'center', fontSize: '7.5px', letterSpacing: '0.5px' }}>
            prescriptionmaker.in
          </div>
        </div>
      </div>
    )
  }

  // ─── 10. COMPARTMENTALIZED GRID ────────────────────────────────────────────
  // 3-column patient bar, full-width bands, 2-col footer
  if (slug === 'compartmentalized-grid') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '9.5px', boxSizing: 'border-box' }}>
        {/* Doctor header with corporate split */}
        <div style={{ display: 'flex', borderBottom: `3px solid ${pc}` }}>
          <div style={{ flex: 1, background: pc, color: '#fff', padding: '12px 16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
            <div style={{ fontSize: '8.5px', color: ac, marginTop: '2px' }}>{doctor.qualifications || ''} {doctor.specialization || ''}</div>
            {doctor.registrationNumber && <div style={{ fontSize: '8px', opacity: 0.7, marginTop: '2px' }}>Reg: {doctor.registrationNumber}</div>}
          </div>
          <div style={{ flex: 1, padding: '12px 16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: pc }}>{doctor.clinicName || 'Medical Centre'}</div>
              {doctor.address && <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>{doctor.address}</div>}
              {doctor.phone && <div style={{ fontSize: '8px', color: '#64748b' }}>☎ {doctor.phone}</div>}
            </div>
          </div>
        </div>

        {/* 3-column patient bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `2px solid ${pc}` }}>
          {[
            { label: 'Patient Name', value: patient.name || '____________________', bold: true },
            { label: 'Age / Sex', value: [patient.age, patient.gender].filter(Boolean).join(' / ') || '______' },
            { label: 'Date', value: today },
          ].map((col, i) => (
            <div key={i} style={{
              padding: '7px 12px',
              background: i === 0 ? `${pc}10` : i === 1 ? `${ac}10` : '#fff',
              borderRight: i < 2 ? `1px solid ${pc}30` : 'none',
            }}>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{col.label}</div>
              <div style={{ fontSize: col.bold ? '11px' : '10px', fontWeight: col.bold ? 700 : 600, color: '#1e293b', marginTop: '2px' }}>{col.value}</div>
            </div>
          ))}
        </div>

        {/* Chief Complaint band */}
        <div style={{ borderBottom: `1px solid ${pc}30`, padding: '6px 14px', background: `${pc}07`, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Chief Complaint:</span>
          <span style={{ fontSize: '9.5px', color: '#374151' }}>{diagnosis || '_______________________________________________'}</span>
        </div>

        {/* Diagnosis band */}
        <div style={{ background: pc, color: '#fff', padding: '5px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8, whiteSpace: 'nowrap' }}>Diagnosis:</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>{diagnosis || '___________________________________'}</span>
        </div>

        {/* Rx grid table */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
            <span style={{ fontSize: '18px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc }}>℞</span>
            <div style={{ flex: 1, height: '2px', background: `${pc}30` }}></div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', border: `1px solid ${pc}30` }}>
            <thead>
              <tr style={{ background: `${ac}` }}>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: '#fff', width: '38%' }}>Medicine / Drugs</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', color: '#fff', width: '15%', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>Unit</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', color: '#fff', width: '22%', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>Frequency</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', color: '#fff', width: '13%', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>Duration</th>
                <th style={{ padding: '5px 8px', textAlign: 'center', color: '#fff', width: '12%', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : `${ac}12`, borderBottom: `1px solid ${pc}15` }}>
                  <td style={{ padding: '5px 8px' }}><strong>{idx + 1}. {med.name}</strong>{med.strength ? ` — ${med.strength}` : ''}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderLeft: `1px solid ${pc}12` }}>{med.form || '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderLeft: `1px solid ${pc}12` }}>{med.frequency ? t(med.frequency, lang) : '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderLeft: `1px solid ${pc}12` }}>{med.duration || '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderLeft: `1px solid ${pc}12` }}>&nbsp;</td>
                </tr>
              )) : Array.from({ length: 6 }, (_, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : `${ac}08`, borderBottom: `1px solid ${pc}10` }}>
                  <td style={{ padding: '6px 8px' }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px', borderLeft: `1px solid ${pc}10` }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px', borderLeft: `1px solid ${pc}10` }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px', borderLeft: `1px solid ${pc}10` }}>&nbsp;</td>
                  <td style={{ padding: '6px 8px', borderLeft: `1px solid ${pc}10` }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 2-column footer: Advice | Follow-up + Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div style={{ border: `1px solid ${ac}40`, borderRadius: '4px', padding: '6px 10px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: ac, textTransform: 'uppercase', marginBottom: '3px' }}>Advice</div>
              <div style={{ color: '#374151', fontSize: '8.5px', minHeight: '18px' }}>{advice ? t(advice, lang) : ''}</div>
              {labTests && (
                <div style={{ marginTop: '4px', fontSize: '8.5px' }}>
                  <span style={{ fontWeight: 700, color: '#64748b' }}>Tests: </span>{labTests}
                </div>
              )}
            </div>
            <div style={{ border: `1px solid ${pc}30`, borderRadius: '4px', padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: pc, textTransform: 'uppercase', marginBottom: '3px' }}>Follow-up</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>{followUpDate || '_______________'}</div>
              </div>
              <SignatureArea />
            </div>
          </div>
        </div>

        {/* Footer band */}
        <div style={{ background: pc, color: ac, padding: '4px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', marginTop: '4px' }}>
          <span>{doctor.clinicName || ''}</span>
          <span>prescriptionmaker.in</span>
        </div>
      </div>
    )
  }

  // ─── 11. EYE SPECIALIST LETTERHEAD ────────────────────────────────────────
  // Pixel-perfect match of the reference design
  if (slug === 'eye-specialist-letterhead') {
    // SVG eye illustration (realistic eye matching reference image)
    const EyeSVG = ({ size = 80, opacity = 1 }: { size?: number; opacity?: number }) => (
      <svg width={size} height={size * 0.55} viewBox="0 0 120 66" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        {/* Eyelashes top */}
        <path d="M20 28 Q30 8 60 6 Q90 8 100 28" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        {/* Upper eyelid fill */}
        <path d="M12 32 Q30 4 60 3 Q90 4 108 32 Q90 56 60 58 Q30 56 12 32Z" fill="white" stroke="#888" strokeWidth="0.5"/>
        {/* Iris */}
        <circle cx="60" cy="32" r="18" fill="#1e90ff"/>
        <circle cx="60" cy="32" r="18" fill="url(#irisGrad)" />
        {/* Pupil */}
        <circle cx="60" cy="32" r="9" fill="#111"/>
        {/* Iris detail rings */}
        <circle cx="60" cy="32" r="14" stroke="#0066cc" strokeWidth="0.8" fill="none" opacity="0.6"/>
        <circle cx="60" cy="32" r="17" stroke="#1a7adb" strokeWidth="0.5" fill="none" opacity="0.4"/>
        {/* Highlight */}
        <ellipse cx="53" cy="26" rx="4" ry="3" fill="white" opacity="0.7"/>
        <circle cx="67" cy="28" r="1.5" fill="white" opacity="0.5"/>
        {/* Lower eyelid */}
        <path d="M12 32 Q30 58 60 60 Q90 58 108 32" stroke="#aaa" strokeWidth="1" fill="none"/>
        {/* Eyelashes — lower few */}
        <line x1="28" y1="52" x2="22" y2="58" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="42" y1="58" x2="38" y2="64" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="78" y1="58" x2="82" y2="64" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="92" y1="52" x2="98" y2="58" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Eyelashes — upper few */}
        <line x1="30" y1="14" x2="26" y2="6" stroke="#222" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="45" y1="8" x2="43" y2="0" stroke="#222" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="60" y1="6" x2="60" y2="0" stroke="#222" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="75" y1="8" x2="77" y2="0" stroke="#222" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="90" y1="14" x2="94" y2="6" stroke="#222" strokeWidth="1.8" strokeLinecap="round"/>
        <defs>
          <radialGradient id="irisGrad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#4eb8ff"/>
            <stop offset="60%" stopColor="#1e80ff"/>
            <stop offset="100%" stopColor="#0050cc"/>
          </radialGradient>
        </defs>
      </svg>
    )

    // Stacked chevron/diamond logo shapes (teal stacked triangles like in reference)
    const ChevronLogo = () => (
      <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 3 stacked chevron/diamond shapes */}
        <path d="M16 0 L28 9 L16 14 L4 9 Z" fill="#0e7490" opacity="0.9"/>
        <path d="M16 13 L28 22 L16 27 L4 22 Z" fill="#0891b2" opacity="0.9"/>
        <path d="M16 26 L28 35 L16 38 L4 35 Z" fill="#06b6d4" opacity="0.9"/>
      </svg>
    )

    return (
      <div style={{
        width: '210mm', minHeight: '297mm', background: '#ffffff',
        fontFamily: 'Inter, sans-serif', fontSize: '9.5px',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '26mm' }}>

          {/* LEFT: Stacked chevron logo + arrow name banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
            {/* Chevron logo column */}
            <div style={{
              background: 'linear-gradient(180deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)',
              width: '14mm',
              minHeight: '26mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {doctor.logoUrl ? (
                <img src={doctor.logoUrl} alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
              ) : (
                <ChevronLogo />
              )}
            </div>

            {/* Hospital name in arrow/parallelogram banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              minHeight: '26mm',
              padding: '0 18px 0 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flexShrink: 0,
              clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)',
              minWidth: '44mm',
            }}>
              <div style={{ fontSize: '6px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
                LOGO HERE
              </div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.4px', lineHeight: 1.25 }}>
                {doctor.clinicName || 'NAME OF THE\nHOSPITAL'}
              </div>
            </div>
          </div>

          {/* CENTER: Doctor name + specialty */}
          <div style={{ flex: 1, padding: '10px 12px 10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                {doctor.name ? `DR. ${doctor.name}` : 'DR. Petter Devin'}
              </span>
              {doctor.qualifications ? (
                <span style={{ fontSize: '9px', color: '#0891b2', fontWeight: 600, textDecoration: 'underline', cursor: 'default' }}>
                  {doctor.qualifications}
                </span>
              ) : (
                <span style={{ fontSize: '9px', color: '#0891b2', fontWeight: 600, textDecoration: 'underline' }}>M.B.B.S</span>
              )}
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '3px', fontStyle: 'italic' }}>
              {doctor.specialization || 'Specialist Eyes Surgen'}
            </div>
            {doctor.address && (
              <div style={{ fontSize: '7.5px', color: '#9ca3af', marginTop: '4px' }}>{doctor.address}</div>
            )}
          </div>

          {/* RIGHT: DEA No + Eye illustration */}
          <div style={{
            width: '38mm', padding: '8px 10px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'flex-end', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '7.5px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
              DEA NO//: &nbsp;.............................
            </div>
            {/* Realistic eye illustration */}
            <div style={{ marginTop: '4px' }}>
              <EyeSVG size={75} />
            </div>
          </div>
        </div>

        {/* Teal separator line */}
        <div style={{ height: '2.5px', background: 'linear-gradient(90deg, #0e7490, #0891b2, #06b6d4)' }} />

        {/* ═══ PATIENT INFO SECTION ═══ */}
        <div style={{ display: 'flex', padding: '8px 14px 4px', gap: '0', alignItems: 'stretch' }}>
          {/* Left: Patient Name + Address fields */}
          <div style={{ flex: 1, paddingRight: '10px' }}>
            {/* Patient Name row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '7px' }}>
              <span style={{ fontSize: '8.5px', color: '#374151', whiteSpace: 'nowrap', minWidth: '68px' }}>Patient Name :</span>
              <div style={{
                flex: 1,
                borderBottom: '1px dotted #9ca3af',
                marginLeft: '4px',
                height: '14px',
                display: 'flex', alignItems: 'flex-end',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#111827', paddingBottom: '1px' }}>
                  {patient.name || ''}
                </span>
              </div>
            </div>
            {/* Address row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '8.5px', color: '#374151', whiteSpace: 'nowrap', minWidth: '68px' }}>Address :</span>
              <div style={{
                flex: 1,
                borderBottom: '1px dotted #9ca3af',
                marginLeft: '4px',
                height: '14px',
                display: 'flex', alignItems: 'flex-end',
              }}>
                <span style={{ fontSize: '8.5px', color: '#374151', paddingBottom: '1px' }}>
                  {patient.address || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right: S.No + Age with teal right border */}
          <div style={{
            width: '36mm', flexShrink: 0,
            borderLeft: '2px solid #0891b2',
            paddingLeft: '10px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px',
          }}>
            <div style={{ fontSize: '8px', color: '#374151' }}>
              S. No:&nbsp;&nbsp;.............................
            </div>
            <div style={{ fontSize: '8px', color: '#374151' }}>
              Age:&nbsp;&nbsp;...............
            </div>
          </div>
        </div>

        {/* Thin separator */}
        <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 14px 0' }} />

        {/* FAX line */}
        <div style={{ padding: '5px 14px 2px', fontSize: '8px', color: '#6b7280' }}>
          FAX: {doctor.phone ? `(${doctor.phone})` : '(207) 808 2015 2202'}
        </div>

        {/* ═══ Rx + Date ROW ═══ */}
        <div style={{ padding: '4px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontSize: '40px', fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontWeight: 900, color: '#111827', lineHeight: 1,
          }}>
            Rx
          </div>
          <div style={{ fontSize: '10px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Date</span>
            <span>___/___/______</span>
          </div>
        </div>

        {/* ═══ MAIN WRITING AREA ═══ */}
        <div style={{ flex: 1, position: 'relative', margin: '0 14px', minHeight: '100mm', borderTop: '1px solid #e5e7eb' }}>
          {/* Watermark Eye SVG — large, centered, very faint */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', userSelect: 'none',
            opacity: 0.07,
          }}>
            <EyeSVG size={220} />
          </div>

          {/* Medicine prescription content */}
          <div style={{ paddingTop: '10px', paddingLeft: '6px', position: 'relative', zIndex: 1 }}>
            {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
              <div key={idx} style={{ marginBottom: '14px', borderBottom: '1px dotted #d1d5db', paddingBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#111827' }}>
                  {idx + 1}.&nbsp;&nbsp;{med.name}{med.strength ? ` ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
                </div>
                <div style={{ paddingLeft: '22px', marginTop: '3px', fontSize: '9px', color: '#4b5563' }}>
                  {[med.frequency ? t(med.frequency, lang) : '', med.timing ? t(med.timing, lang) : '', med.duration].filter(Boolean).join('  ·  ')}
                </div>
              </div>
            )) : [1, 2, 3, 4, 5, 6, 7].map(n => (
              <div key={n} style={{ marginBottom: '16px', borderBottom: '1px dotted #e5e7eb', paddingBottom: '12px' }}>
                <span style={{ color: 'transparent', fontSize: '10px' }}>&nbsp;</span>
              </div>
            ))}
          </div>

          {/* Advice / investigations if present */}
          {(advice || labTests) && (
            <div style={{ padding: '4px 0', fontSize: '8.5px', color: '#374151', borderTop: '1px solid #e5e7eb', marginTop: '8px', position: 'relative', zIndex: 1 }}>
              {advice && <div><strong style={{ color: '#0891b2' }}>Advice:</strong> {t(advice, lang)}</div>}
              {labTests && <div style={{ marginTop: '2px' }}><strong style={{ color: '#0891b2' }}>Tests:</strong> {labTests}</div>}
            </div>
          )}
        </div>

        {/* ═══ DOCTOR SIGNATURE LINE ═══ */}
        <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {doctor.signatureUrl && (
              <img src={doctor.signatureUrl} alt="Signature" style={{ width: '70px', height: '28px', objectFit: 'contain' }} />
            )}
            <span style={{ fontSize: '8.5px', color: '#374151' }}>
              Doctor Signature :&nbsp;&nbsp;......................................
            </span>
          </div>
        </div>

        {/* ═══ FOOTER BAND ═══ */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          background: '#f0f9ff',
          borderTop: '2px solid #0891b2',
          minHeight: '12mm',
        }}>
          {/* Left teal section: clinic name + address */}
          <div style={{
            background: 'linear-gradient(135deg, #0e7490, #0891b2)',
            padding: '6px 14px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            minWidth: '52mm', flexShrink: 0,
          }}>
            <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {doctor.clinicName || 'NAME OF THE HOSPITAL'}
            </div>
            <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
              {doctor.address || '751 Victoria 0053 street, South Statue 20440'}
            </div>
          </div>

          {/* Right: Book appointment + phone */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', gap: '10px', padding: '6px 10px',
            background: '#f0f9ff',
          }}>
            <div style={{
              background: '#0f172a', color: '#ffffff',
              borderRadius: '3px', padding: '4px 10px',
              fontSize: '7.5px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
            }}>
              BOOK YOUR APPOINTMENT
            </div>
            <div style={{ fontSize: '8px', color: '#0891b2', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {doctor.phone
                ? `${doctor.phone}  ${doctor.phone}`
                : '091-099-099-008  091-099-099-000'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── 12. SIMPLE RX PAD ─────────────────────────────────────────────────────
  // Classic minimalist B&W Rx pad
  if (slug === 'simple-rx-pad') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: '#f8f8f8', fontFamily: 'Georgia, serif', fontSize: '10px', boxSizing: 'border-box', padding: '22mm 22mm' }}>
        {/* Top section: Large Rx symbol + Patient fields */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>
          {/* Big Rx */}
          <div style={{ fontSize: '72px', fontFamily: 'Georgia, serif', fontWeight: 900, color: '#111', lineHeight: 1, flexShrink: 0, marginTop: '-8px' }}>
            Rx
          </div>
          {/* Patient fields */}
          <div style={{ flex: 1, paddingTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', color: '#555', whiteSpace: 'nowrap' }}>Patient</span>
              <div style={{ flex: 1, borderBottom: '1px solid #888' }}>
                <span style={{ fontSize: '10px', color: '#111', fontWeight: 600, display: 'block', paddingBottom: '2px' }}>{patient.name || ''}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <div style={{ flex: 1, borderBottom: '1px solid #aaa' }}>
                <span style={{ fontSize: '9px', color: '#555' }}>{patient.age ? `Age: ${patient.age}` : ''}</span>
              </div>
              <div style={{ flex: 1, borderBottom: '1px solid #aaa', textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: '#555' }}>{patient.gender || ''}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', color: '#555', whiteSpace: 'nowrap' }}>Address</span>
              <div style={{ flex: 1, borderBottom: '1px solid #aaa' }}>
                <span style={{ fontSize: '9.5px', color: '#111', display: 'block', paddingBottom: '2px' }}>{patient.address || ''}</span>
              </div>
            </div>
            <div style={{ flex: 1, borderBottom: '1px solid #aaa', minHeight: '16px', marginTop: '4px' }}></div>
          </div>
        </div>

        {/* Bold divider */}
        <div style={{ borderTop: '2.5px solid #111', marginBottom: '20px' }}></div>

        {/* Diagnosis if present */}
        {diagnosis && (
          <div style={{ marginBottom: '12px', fontSize: '9.5px', color: '#444', fontStyle: 'italic' }}>
            Diagnosis: {diagnosis}
          </div>
        )}

        {/* Writing / medicine area */}
        <div style={{ paddingLeft: '4px', minHeight: '130mm' }}>
          {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
            <div key={idx} style={{ marginBottom: '18px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#111' }}>
                {idx + 1}.&nbsp;&nbsp;{med.name}{med.strength ? ` ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
              </div>
              <div style={{ paddingLeft: '24px', marginTop: '4px', fontSize: '9.5px', color: '#555', fontStyle: 'italic' }}>
                {[med.frequency ? t(med.frequency, lang) : '', med.timing ? t(med.timing, lang) : '', med.duration].filter(Boolean).join('  ·  ')}
              </div>
            </div>
          )) : [1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ marginBottom: '18px', borderBottom: '1px solid #ddd', paddingBottom: '12px', minHeight: '32px' }}></div>
          ))}
        </div>

        {/* Advice / investigations */}
        {(advice || labTests) && (
          <div style={{ marginTop: '8px', borderTop: '1px solid #ddd', paddingTop: '8px', fontSize: '9px', color: '#444' }}>
            {advice && <div>Advice: {t(advice, lang)}</div>}
            {labTests && <div style={{ marginTop: '3px' }}>Investigations: {labTests}</div>}
          </div>
        )}

        {/* Bottom: Date + Signature */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ borderBottom: '1px solid #888', width: '100px', marginBottom: '4px', minHeight: '20px' }}></div>
            <div style={{ fontSize: '9px', color: '#555' }}>Date</div>
          </div>
          <div>
            {doctor.signatureUrl
              ? <img src={doctor.signatureUrl} alt="Signature" style={{ width: '90px', height: '36px', objectFit: 'contain', display: 'block', marginBottom: '4px' }} />
              : <div style={{ borderBottom: '1px solid #888', width: '130px', marginBottom: '4px', minHeight: '24px' }}></div>}
            <div style={{ fontSize: '9px', color: '#555', textAlign: 'right' }}>Signature</div>
          </div>
        </div>

        {/* Prescriber info at bottom if present */}
        {doctor.name && (
          <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px dotted #ccc', paddingTop: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#333' }}>Dr. {doctor.name}</div>
            {doctor.clinicName && <div style={{ fontSize: '8px', color: '#777' }}>{doctor.clinicName}</div>}
            {doctor.registrationNumber && <div style={{ fontSize: '7.5px', color: '#aaa' }}>Reg. {doctor.registrationNumber}</div>}
          </div>
        )}
      </div>
    )
  }

  // ─── 13. MEDICAL PRESCRIPTION FORM ────────────────────────────────────────
  // Comprehensive form with drug table, patient info grid, diet & history
  if (slug === 'medical-prescription-form') {
    const borderColor = `${pc}60`
    const cellStyle = { padding: '4px 8px', borderRight: `1px solid ${borderColor}`, fontSize: '8.5px' }
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: '#f4f4f8', fontFamily: 'Inter, sans-serif', fontSize: '9px', boxSizing: 'border-box', padding: '8mm', position: 'relative' }}>

        {/* Decorative circles — top right */}
        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {[20, 14, 20].map((s, i) => (
            <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', border: `2px solid ${pc}40`, alignSelf: i === 1 ? 'flex-start' : 'flex-end' }}></div>
          ))}
        </div>
        {/* Decorative circles — bottom left */}
        <div style={{ position: 'absolute', bottom: '6px', left: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {[20, 14, 20].map((s, i) => (
            <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', border: `2px solid ${pc}40`, alignSelf: i === 1 ? 'flex-end' : 'flex-start' }}></div>
          ))}
        </div>

        {/* ── Header row: Rx + Title + Date box ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Bullet circles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '2px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1.5px solid ${pc}`, background: i === 0 ? pc : 'transparent' }}></div>
              ))}
            </div>
            <div style={{ fontSize: '24px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc, lineHeight: 1 }}>Rx</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: pc, letterSpacing: '-0.5px' }}>Medical Prescription</div>
          </div>
          <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: '4px', padding: '4px 14px', fontSize: '9px', background: '#fff', minWidth: '80px' }}>
            <span style={{ color: '#64748b' }}>Date:</span>
            <span style={{ marginLeft: '4px', fontWeight: 700 }}>{today}</span>
          </div>
        </div>

        {/* ── Patient Info Table ── */}
        <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: '4px', overflow: 'hidden', marginBottom: '6px', background: '#fff' }}>
          {/* Row 1: Patient's Name */}
          <div style={{ ...cellStyle as any, borderBottom: `1px solid ${borderColor}`, borderRight: 'none', padding: '5px 8px' }}>
            <span style={{ color: '#64748b' }}>Patient&apos;s Name:</span>
            <strong style={{ marginLeft: '8px', fontSize: '10px' }}>{patient.name || ' '}</strong>
          </div>
          {/* Row 2: DOB | Age | Sex | Occupation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto 1fr', borderBottom: `1px solid ${borderColor}` }}>
            {[
              { label: 'Date of Birth:', value: (patient as any).dob || '' },
              { label: 'Age:', value: patient.age || '' },
              { label: 'Sex:', value: patient.gender || '' },
              { label: 'Occupation:', value: (patient as any).occupation || '' },
            ].map((f, i) => (
              <div key={i} style={{ ...cellStyle as any, borderRight: i < 3 ? `1px solid ${borderColor}` : 'none', borderBottom: 'none' }}>
                <span style={{ color: '#64748b' }}>{f.label}</span>
                <span style={{ marginLeft: '4px', fontWeight: 600 }}>{f.value}</span>
              </div>
            ))}
          </div>
          {/* Row 3: Insurance | Care Provider */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ ...cellStyle as any, borderRight: `1px solid ${borderColor}`, borderBottom: 'none' }}>
              <span style={{ color: '#64748b' }}>Health Insurance Number:</span>
              <span style={{ marginLeft: '4px', fontWeight: 600 }}>{(patient as any).insuranceNo || ''}</span>
            </div>
            <div style={{ ...cellStyle as any, borderRight: 'none', borderBottom: 'none' }}>
              <span style={{ color: '#64748b' }}>Health Care Provider:</span>
              <span style={{ marginLeft: '4px', fontWeight: 600 }}>{(patient as any).careProvider || ''}</span>
            </div>
          </div>
          {/* Row 4: Health Card | Patient ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ ...cellStyle as any, borderRight: `1px solid ${borderColor}`, borderBottom: 'none' }}>
              <span style={{ color: '#64748b' }}>Health Card Number:</span>
              <span style={{ marginLeft: '4px', fontWeight: 600 }}>{(patient as any).healthCardNo || ''}</span>
            </div>
            <div style={{ ...cellStyle as any, borderRight: 'none', borderBottom: 'none' }}>
              <span style={{ color: '#64748b' }}>Patient ID Number:</span>
              <span style={{ marginLeft: '4px', fontWeight: 600 }}>{(patient as any).patientIdNo || ''}</span>
            </div>
          </div>
        </div>

        {/* ── Address + Diagnosis + Vitals + Allergies ── */}
        <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: '4px', overflow: 'hidden', marginBottom: '6px', background: '#fff' }}>
          <div style={{ ...cellStyle as any, borderRight: 'none', borderBottom: `1px solid ${borderColor}` }}>
            <span style={{ color: '#64748b' }}>Patient&apos;s Address:</span>
            <span style={{ marginLeft: '8px' }}>{patient.address || ''}</span>
          </div>
          <div style={{ ...cellStyle as any, borderRight: 'none', borderBottom: `1px solid ${borderColor}`, minHeight: '24px' }}>
            <span style={{ color: '#64748b' }}>Diagnosed With:</span>
            <strong style={{ marginLeft: '8px' }}>{diagnosis || ''}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${borderColor}` }}>
            {[
              { label: 'Blood Pressure:', value: vitals?.bloodPressure || '' },
              { label: 'Pulse Rate:', value: vitals?.pulse || '' },
              { label: 'Weight:', value: vitals?.weight || '' },
            ].map((f, i) => (
              <div key={i} style={{ ...cellStyle as any, borderRight: i < 2 ? `1px solid ${borderColor}` : 'none', borderBottom: 'none' }}>
                <span style={{ color: '#64748b' }}>{f.label}</span>
                <span style={{ marginLeft: '4px', fontWeight: 600 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ ...cellStyle as any, borderRight: `1px solid ${borderColor}`, borderBottom: 'none' }}>
              <span style={{ color: '#64748b' }}>Allergies:</span>
              <span style={{ marginLeft: '4px' }}>{patient.allergies || ''}</span>
            </div>
            <div style={{ ...cellStyle as any, borderRight: 'none', borderBottom: 'none' }}>
              <span style={{ color: '#64748b' }}>Disabilities if any:</span>
              <span style={{ marginLeft: '4px' }}>{(patient as any).disabilities || ''}</span>
            </div>
          </div>
        </div>

        {/* ── Drug Table ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1.5px solid ${borderColor}`, borderRadius: '4px', overflow: 'hidden', marginBottom: '6px', background: '#fff', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ background: `${pc}15` }}>
              <th style={{ padding: '5px', textAlign: 'left', borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, width: '5%', color: '#64748b' }}>#</th>
              <th colSpan={2} style={{ padding: '5px', textAlign: 'center', borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, color: pc, fontWeight: 700 }}>DRUGS</th>
              <th style={{ padding: '5px', textAlign: 'center', borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, color: pc, fontWeight: 700, width: '26%' }}>Unit (Tablet/Syrup)</th>
              <th style={{ padding: '5px', textAlign: 'center', borderBottom: `1px solid ${borderColor}`, color: pc, fontWeight: 700, width: '26%' }}>Dosage (Per day)</th>
            </tr>
          </thead>
          <tbody>
            {(filledMeds.length > 0 ? filledMeds : Array.from({ length: 6 }, () => ({} as Medicine))).map((med, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                <td style={{ padding: '5px', textAlign: 'center', borderRight: `1px solid ${borderColor}`, color: pc, fontWeight: 700 }}>{idx + 1}</td>
                <td colSpan={2} style={{ padding: '5px', borderRight: `1px solid ${borderColor}` }}>
                  {med.name && <strong>{med.name}</strong>}
                  {med.strength && <span style={{ color: '#64748b', marginLeft: '4px', fontSize: '8px' }}>{med.strength}</span>}
                </td>
                <td style={{ padding: '5px', textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>
                  {med.form || ''}
                </td>
                <td style={{ padding: '5px', textAlign: 'center' }}>
                  {med.frequency ? t(med.frequency, lang) : (med.duration || '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Bottom: Diet + History + Signature ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', border: `1.5px solid ${borderColor}`, borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
          <div style={{ borderRight: `1px solid ${borderColor}` }}>
            <div style={{ padding: '5px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: '8.5px', color: '#64748b', fontWeight: 600 }}>Diet to Follow:</div>
            <div style={{ padding: '6px 8px', minHeight: '30px', fontSize: '8.5px', color: '#374141' }}>
              {advice ? t(advice, lang) : ''}
            </div>
            <div style={{ padding: '5px 8px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, fontSize: '8.5px', color: '#64748b', fontWeight: 600 }}>Brief History of Patient:</div>
            <div style={{ padding: '6px 8px', minHeight: '28px' }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ padding: '6px 8px', minHeight: '40px' }}></div>
            {/* Signature at bottom-right of bottom section */}
            <div style={{ borderTop: `1px solid ${borderColor}`, padding: '5px 8px', textAlign: 'center' }}>
              {doctor.signatureUrl
                ? <img src={doctor.signatureUrl} alt="Sig" style={{ width: '70px', height: '28px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                : <div style={{ height: '28px' }}></div>}
              <div style={{ fontSize: '8px', color: '#64748b' }}>Doctor&apos;s Signature</div>
              {doctor.name && <div style={{ fontSize: '7.5px', fontWeight: 700, color: pc, marginTop: '1px' }}>Dr. {doctor.name}</div>}
              {doctor.registrationNumber && <div style={{ fontSize: '7px', color: '#94a3b8' }}>Reg: {doctor.registrationNumber}</div>}
            </div>
          </div>
        </div>

        {/* Prescriptionmaker watermark */}
        <div style={{ marginTop: '6px', textAlign: 'center', fontSize: '6.5px', color: `${pc}50`, letterSpacing: '1px' }}>
          prescriptionmaker.in
        </div>
      </div>
    )
  }

  // ─── Default fallback ─────────────────────────────────────────────────────
  return (
    <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box', padding: '16px 20px' }}>
      <div style={{ background: pc, color: '#fff', padding: '12px 16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800 }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</div>
        <div style={{ fontSize: '8px', opacity: 0.8 }}>{[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}</div>
      </div>
      <div style={{ padding: '6px 0', borderBottom: `1px solid ${pc}20`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '8.5px' }}>
        <span>Patient: <strong>{patient.name || '___________'}</strong></span>
        <span>Date: {today}</span>
      </div>
      <div style={{ fontSize: '18px', fontFamily: 'Georgia, serif', fontWeight: 900, color: pc, marginBottom: '6px' }}>℞</div>
      {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
        <div key={idx} style={{ borderBottom: `1px solid ${pc}15`, padding: '5px 0', fontSize: '9px' }}>
          {idx + 1}. <strong>{med.name}</strong>{med.strength ? ` ${med.strength}` : ''} — {med.frequency ? t(med.frequency, lang) : ''} {med.duration ? `· ${med.duration}` : ''}
        </div>
      )) : null}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <SignatureArea />
      </div>
    </div>
  )
}
