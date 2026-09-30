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
  const doctor = (data['doctorInfo'] as DoctorInfo | undefined) ?? {
    name: data.doctorName as string | undefined,
    qualifications: data.doctorQualifications as string | undefined,
    specialization: data.doctorSpecialization as string | undefined,
    registrationNumber: data.doctorRegNumber as string | undefined,
    clinicName: data.clinicName as string | undefined,
    phone: data.clinicPhone as string | undefined,
    address: data.clinicAddress as string | undefined,
    signatureUrl: (data.doctorInfo as any)?.signatureUrl as string | undefined,
  }
  const patient = (data['patientInfo'] as PatientInfo | undefined) ?? (data['patient'] as PatientInfo | undefined) ?? {}
  const medicines = (data['medicines'] as Medicine[] | undefined) ?? []
  const diagnosis = (data['diagnosis'] as string | undefined) ?? ''
  const advice = (data['advice'] as string | undefined) ?? ''
  const rawTests = data['tests'] as { name: string }[] | undefined
  const labTests = Array.isArray(rawTests) ? rawTests.map(t => t.name).join(', ') : ''
  const followUpDate = (data['followUp'] as string | undefined) ?? ''
  const lang = (data['language'] as LanguageCode) || 'en'
  const slug = template.slug
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const pc = template.styles.primaryColor
  const ac = template.styles.accentColor
  const ff = template.styles.fontFamily
  const bg = (template.styles as any).bgColor || '#ffffff'

  const filledMeds = medicines.filter(m => m.name)

  // ─── Shared sub-components ────────────────────────────────────────────────

  const RxSymbol = () => (
    <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '22px', color: pc, marginRight: '6px' }}>℞</span>
  )

  const SectionTitle = ({ children, color = pc }: { children: React.ReactNode; color?: string }) => (
    <div style={{
      fontSize: '9px', fontWeight: 700, color, textTransform: 'uppercase',
      letterSpacing: '0.8px', marginBottom: '4px', marginTop: '10px',
    }}>
      {children}
    </div>
  )

  const PatientFieldRow = ({ fields }: { fields: { label: string; value?: string }[] }) => (
    <div style={{ display: 'flex', borderBottom: `1px solid ${pc}30`, marginBottom: 0 }}>
      {fields.map((f, i) => (
        <div key={i} style={{ flex: 1, padding: '4px 8px', borderRight: i < fields.length - 1 ? `1px solid ${pc}30` : 'none' }}>
          <span style={{ fontSize: '8px', color: '#64748b' }}>{f.label}: </span>
          <span style={{ fontSize: '8.5px', fontWeight: 600 }}>{f.value || ''}</span>
        </div>
      ))}
    </div>
  )

  const MedicineTable = ({ showGrid = false }: { showGrid?: boolean }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginTop: '4px' }}>
      <thead>
        <tr style={{ backgroundColor: pc, color: '#fff' }}>
          <th style={{ padding: '5px 8px', textAlign: 'left', width: '40%' }}>Drugs / Medicine</th>
          <th style={{ padding: '5px 8px', textAlign: 'center', width: '20%' }}>Unit (Tab/Syrup)</th>
          <th style={{ padding: '5px 8px', textAlign: 'center', width: '20%' }}>Frequency</th>
          <th style={{ padding: '5px 8px', textAlign: 'center', width: '20%' }}>Duration</th>
        </tr>
      </thead>
      <tbody>
        {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? `${pc}08` : '#ffffff' }}>
            <td style={{ padding: '5px 8px', borderBottom: `1px solid ${pc}20` }}>
              <strong>{idx + 1}. {med.name}</strong>
              {med.strength ? <span style={{ color: '#64748b', fontWeight: 400 }}> {med.strength}</span> : ''}
              {med.form ? <span style={{ color: '#64748b', fontWeight: 400 }}> ({med.form})</span> : ''}
            </td>
            <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: `1px solid ${pc}20` }}>{med.form || 'Tablet'}</td>
            <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: `1px solid ${pc}20` }}>{med.frequency ? t(med.frequency, lang) : '-'}</td>
            <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: `1px solid ${pc}20` }}>{med.duration || '-'}</td>
          </tr>
        )) : Array.from({ length: 7 }, (_, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? `${pc}05` : '#ffffff' }}>
            <td style={{ padding: '5px 8px', borderBottom: `1px solid ${pc}15` }}>&nbsp;</td>
            <td style={{ padding: '5px 8px', borderBottom: `1px solid ${pc}15` }}>&nbsp;</td>
            <td style={{ padding: '5px 8px', borderBottom: `1px solid ${pc}15` }}>&nbsp;</td>
            <td style={{ padding: '5px 8px', borderBottom: `1px solid ${pc}15` }}>&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const SimpleRxList = () => (
    <div style={{ paddingLeft: '8px', borderLeft: `3px solid ${ac}`, marginTop: '4px' }}>
      {filledMeds.length === 0 ? (
        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No medicines added</div>
      ) : filledMeds.map((med, idx) => (
        <div key={idx} style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>
            {idx + 1}. {med.name}{med.strength ? ` ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
          </div>
          <div style={{ color: '#475569', paddingLeft: '12px', fontSize: '8.5px' }}>
            {[med.frequency ? t(med.frequency, lang) : '', med.timing ? t(med.timing, lang) : '', med.duration].filter(Boolean).join(' · ')}
          </div>
        </div>
      ))}
    </div>
  )

  const SignatureBox = () => (
    <div style={{ textAlign: 'right' }}>
      {doctor.signatureUrl ? (
        <img src={doctor.signatureUrl} alt="Signature" style={{ width: '80px', height: '35px', objectFit: 'contain', display: 'block', marginLeft: 'auto', marginBottom: '4px' }} />
      ) : (
        <div style={{ width: '80px', borderBottom: `1px solid #94a3b8`, marginLeft: 'auto', marginBottom: '4px', height: '30px' }} />
      )}
      <div style={{ fontSize: '8px', fontWeight: 700, color: '#475569' }}>Doctor&apos;s Signature</div>
      {doctor.name && <div style={{ fontSize: '8px', color: '#64748b' }}>Dr. {doctor.name}</div>}
    </div>
  )

  // ─── ROYAL INDIGO layout (Matches user reference images exactly) ──────────
  if (slug === 'royal-indigo') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles top-right */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', border: `2px solid ${pc}`, opacity: 0.4 }} />)}
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', border: `2px solid ${pc}`, opacity: 0.3 }} />)}
        </div>
        {/* Clip art circles top-left */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '3px', flexWrap: 'wrap', width: '40px' }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1.5px solid ${pc}`, opacity: 0.35 }} />)}
        </div>

        <div style={{ padding: '20mm 16mm' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: pc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontFamily: 'Georgia, serif', fontSize: '16px' }}>℞</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: pc }}>Medical Prescription</div>
                {doctor.clinicName && <div style={{ fontSize: '9px', color: '#475569' }}>{doctor.clinicName}</div>}
                {doctor.address && <div style={{ fontSize: '8.5px', color: pc }}>{doctor.address}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ border: `1px solid ${pc}`, padding: '4px 16px', minWidth: '100px', marginBottom: '4px' }}>
                <div style={{ fontSize: '8px', color: '#475569' }}>Date</div>
                <div style={{ fontSize: '9px', fontWeight: 600 }}>{today}</div>
              </div>
              {doctor.name && <div style={{ fontSize: '8px', color: '#1e293b', fontWeight: 600 }}>Dr. {doctor.name}</div>}
              {doctor.qualifications && <div style={{ fontSize: '7.5px', color: '#64748b' }}>{doctor.qualifications}</div>}
              {doctor.registrationNumber && <div style={{ fontSize: '7.5px', color: '#64748b' }}>Reg: {doctor.registrationNumber}</div>}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: `2px solid ${pc}30`, marginBottom: '8px' }} />

          {/* Patient Information Grid */}
          <div style={{ border: `1px solid ${pc}40`, borderRadius: '2px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: pc, color: '#fff', padding: '4px 8px', fontSize: '9px', fontWeight: 700 }}>Patient Information</div>
            <PatientFieldRow fields={[{ label: 'Name', value: patient.name }]} />
            <PatientFieldRow fields={[
              { label: 'Date of Birth', value: '' },
              { label: 'Age', value: patient.age },
              { label: 'Sex', value: patient.gender },
              { label: 'Allergies', value: '' },
            ]} />
            <PatientFieldRow fields={[{ label: 'Address', value: '' }]} />
          </div>

          {/* Diagnosis */}
          {diagnosis && (
            <div style={{ marginBottom: '8px', padding: '4px 8px', backgroundColor: `${pc}08`, borderRadius: '2px' }}>
              <span style={{ fontSize: '8px', color: '#64748b' }}>Diagnosed With: </span>
              <span style={{ fontWeight: 600 }}>{diagnosis}</span>
            </div>
          )}

          {/* Drug Table */}
          <MedicineTable showGrid />

          {/* Advice */}
          {advice && (
            <div style={{ marginTop: '10px' }}>
              <SectionTitle>Advice & Instructions</SectionTitle>
              <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{t(advice, lang)}</div>
            </div>
          )}

          {labTests && (
            <div style={{ marginTop: '8px' }}>
              <SectionTitle>Investigations</SectionTitle>
              <div style={{ color: '#475569' }}>{labTests}</div>
            </div>
          )}

          {followUpDate && (
            <div style={{ marginTop: '8px', color: '#475569', fontSize: '9px' }}>
              <strong>Follow-up: </strong>{followUpDate}
            </div>
          )}

          {/* Signature */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <SignatureBox />
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', borderTop: `1px solid ${pc}30`, paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#94a3b8' }}>
            <span>{doctor.clinicName || 'prescriptionmaker.in'}</span>
            <span>prescriptionmaker.in</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── EXECUTIVE GOLD layout ─────────────────────────────────────────────────
  if (slug === 'executive-gold') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box' }}>
        {/* Gold top border */}
        <div style={{ height: '6px', background: `linear-gradient(90deg, ${ac}, ${pc}, ${ac})` }} />
        <div style={{ padding: '14mm 18mm' }}>
          {/* Centered header */}
          <div style={{ textAlign: 'center', borderBottom: `2px solid ${ac}`, paddingBottom: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: pc, letterSpacing: '1px' }}>
              {doctor.clinicName || 'Medical Clinic'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginTop: '2px' }}>
              {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
              {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' | ')}
            </div>
            {doctor.registrationNumber && (
              <div style={{ fontSize: '8px', color: ac, marginTop: '2px', fontWeight: 600 }}>
                Registration No: {doctor.registrationNumber}
              </div>
            )}
            <div style={{ fontSize: '8px', color: '#64748b', marginTop: '4px' }}>
              {[doctor.address, doctor.phone].filter(Boolean).join('  ·  ')}
            </div>
          </div>

          {/* Patient block */}
          <div style={{ border: `1px solid ${ac}60`, borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: `${pc}10`, padding: '4px 10px', borderBottom: `1px solid ${ac}40` }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: pc }}>PATIENT INFORMATION</span>
            </div>
            <div style={{ padding: '6px 10px' }}>
              <PatientFieldRow fields={[{ label: "Patient's Name", value: patient.name }]} />
              <PatientFieldRow fields={[
                { label: 'Date of Birth', value: '' },
                { label: 'Age', value: patient.age },
                { label: 'Sex', value: patient.gender },
                { label: 'Occupation', value: '' },
              ]} />
              <PatientFieldRow fields={[
                { label: 'Health Insurance Number', value: '' },
                { label: 'Health Care Provider', value: '' },
              ]} />
              <PatientFieldRow fields={[
                { label: "Patient's Address", value: '' },
              ]} />
              <PatientFieldRow fields={[{ label: 'Diagnosed With', value: diagnosis }]} />
              <PatientFieldRow fields={[
                { label: 'Blood Pressure', value: '' },
                { label: 'Pulse Rate', value: '' },
                { label: 'Weight', value: '' },
              ]} />
              <PatientFieldRow fields={[
                { label: 'Allergies', value: '' },
                { label: 'Disabilities if any', value: '' },
              ]} />
            </div>
          </div>

          {/* Date + Drug Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: pc }}>
              <RxSymbol /> PRESCRIPTION
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>Date: <strong>{today}</strong></div>
          </div>
          <MedicineTable />

          {/* Diet & History */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', border: `1px solid ${ac}40`, borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ flex: 1, borderRight: `1px solid ${ac}40`, padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', fontWeight: 700, color: pc, marginBottom: '4px' }}>Diet to Follow:</div>
              <div style={{ fontSize: '8px', color: '#475569', whiteSpace: 'pre-wrap' }}>{advice ? t(advice, lang) : ''}</div>
            </div>
            <div style={{ flex: 1, padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', fontWeight: 700, color: pc, marginBottom: '4px' }}>Brief History of Patient:</div>
              <div style={{ flex: 1 }} />
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <SignatureBox />
              </div>
            </div>
          </div>

          {followUpDate && (
            <div style={{ marginTop: '8px', fontSize: '8.5px', color: '#475569' }}>
              <strong>Follow-up: </strong>{followUpDate}
            </div>
          )}
        </div>
        <div style={{ height: '4px', background: ac }} />
      </div>
    )
  }

  // ─── EMERALD SPECIALIST layout ─────────────────────────────────────────────
  if (slug === 'emerald-specialist') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: pc, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'Georgia, serif' }}>
              {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
            </div>
            <div style={{ fontSize: '9px', color: `${ac}`, marginTop: '2px' }}>
              {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' | ')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {doctor.clinicName && <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff' }}>{doctor.clinicName}</div>}
            {doctor.registrationNumber && <div style={{ fontSize: '8px', color: ac }}>Reg: {doctor.registrationNumber}</div>}
            {doctor.phone && <div style={{ fontSize: '8px', color: '#e2e8f0' }}>{doctor.phone}</div>}
            {doctor.address && <div style={{ fontSize: '7.5px', color: '#cbd5e1' }}>{doctor.address}</div>}
          </div>
        </div>

        <div style={{ padding: '10px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: `${pc}12`, padding: '6px 10px', borderRadius: '4px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '8px', color: '#64748b' }}>Patient: </span>
              <strong style={{ fontSize: '10px' }}>{patient.name || '______________________'}</strong>
              {(patient.age || patient.gender) && (
                <span style={{ fontSize: '8.5px', color: '#475569', marginLeft: '10px' }}>
                  Age: <strong>{patient.age || '___'}</strong>{patient.gender ? ` / ${patient.gender}` : ''}
                </span>
              )}
            </div>
            <div style={{ fontSize: '8.5px', color: '#475569' }}>Date: <strong>{today}</strong></div>
          </div>

          {diagnosis && (
            <div style={{ backgroundColor: `${ac}20`, border: `1px solid ${ac}40`, borderRadius: '4px', padding: '5px 10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '8px', color: '#064e3b', fontWeight: 700 }}>DIAGNOSIS: </span>
              <span style={{ fontWeight: 600 }}>{diagnosis}</span>
            </div>
          )}

          <SectionTitle color={pc}>Prescription</SectionTitle>
          <MedicineTable />

          {labTests && (
            <div style={{ marginTop: '10px' }}>
              <SectionTitle color={pc}>Lab Investigations</SectionTitle>
              <div style={{ color: '#475569' }}>{labTests}</div>
            </div>
          )}

          {advice && (
            <div style={{ marginTop: '8px' }}>
              <SectionTitle color={pc}>Advice</SectionTitle>
              <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{t(advice, lang)}</div>
            </div>
          )}

          {followUpDate && (
            <div style={{ marginTop: '8px', color: '#064e3b', fontWeight: 600, fontSize: '9px' }}>
              Follow-up Date: {followUpDate}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <SignatureBox />
          </div>
        </div>

        <div style={{ backgroundColor: pc, color: '#fff', textAlign: 'center', padding: '4px', fontSize: '7.5px', position: 'absolute', bottom: 0, width: '100%' }}>
          prescriptionmaker.in · For medical documentation purposes only
        </div>
      </div>
    )
  }

  // ─── SAPPHIRE HOSPITAL layout ──────────────────────────────────────────────
  if (slug === 'sapphire-hospital') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box' }}>
        {/* Hospital banner */}
        <div style={{ backgroundColor: pc, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: pc, fontWeight: 900, fontFamily: 'Georgia, serif', fontSize: '18px' }}>℞</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{doctor.clinicName || 'City Hospital'}</div>
            <div style={{ fontSize: '8.5px', color: ac }}>{doctor.address}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: '#fff', fontWeight: 600 }}>OPD / PRESCRIPTION</div>
            <div style={{ fontSize: '8px', color: ac }}>Date: {today}</div>
          </div>
        </div>

        {/* Doctor strip */}
        <div style={{ backgroundColor: `${pc}18`, borderBottom: `1px solid ${pc}30`, padding: '5px 18px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '8.5px', color: '#64748b' }}>Attending Physician: </span>
            <strong>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</strong>
            {doctor.specialization && <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '8px' }}>({doctor.specialization})</span>}
          </div>
          {doctor.registrationNumber && (
            <div style={{ fontSize: '8px', color: '#64748b' }}>Reg: {doctor.registrationNumber}</div>
          )}
        </div>

        <div style={{ padding: '10px 18px' }}>
          {/* Patient grid */}
          <div style={{ border: `1px solid ${pc}40`, borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: pc, color: '#fff', padding: '3px 8px', fontSize: '8.5px', fontWeight: 700 }}>PATIENT INFORMATION</div>
            <PatientFieldRow fields={[{ label: "Patient Name", value: patient.name }]} />
            <PatientFieldRow fields={[
              { label: 'MRN', value: '' },
              { label: 'Age', value: patient.age },
              { label: 'Sex', value: patient.gender },
              { label: 'Ward', value: '' },
            ]} />
            <PatientFieldRow fields={[
              { label: 'Insurance No', value: '' },
              { label: 'Care Provider', value: '' },
            ]} />
            {diagnosis && <PatientFieldRow fields={[{ label: 'Diagnosis', value: diagnosis }]} />}
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: pc, marginBottom: '4px' }}>
            <RxSymbol /> PRESCRIBED MEDICINES
          </div>
          <MedicineTable />

          {labTests && (
            <div style={{ marginTop: '10px' }}>
              <SectionTitle color={pc}>Investigations Ordered</SectionTitle>
              <div style={{ color: '#475569' }}>{labTests}</div>
            </div>
          )}

          {advice && (
            <div style={{ marginTop: '8px' }}>
              <SectionTitle color={pc}>Discharge Advice</SectionTitle>
              <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{t(advice, lang)}</div>
            </div>
          )}

          {followUpDate && (
            <div style={{ marginTop: '8px', fontSize: '8.5px', color: '#475569' }}>
              <strong>Review Date: </strong>{followUpDate}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '90px', borderBottom: `1px solid #94a3b8`, marginBottom: '4px', height: '30px' }} />
              <div style={{ fontSize: '7.5px', color: '#64748b' }}>HOD Signature</div>
            </div>
            <SignatureBox />
          </div>
        </div>
      </div>
    )
  }

  // ─── PLATINUM MINIMAL layout ───────────────────────────────────────────────
  if (slug === 'platinum-minimal') {
    return (
      <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box', padding: '30mm 24mm' }}>
        <div style={{ borderBottom: `0.5px solid #d1d5db`, paddingBottom: '16px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: pc, fontFamily: 'Georgia, serif', letterSpacing: '2px' }}>
            {doctor.clinicName || 'Medical Practice'}
          </div>
          <div style={{ width: '40px', height: '1.5px', background: ac, margin: '8px auto' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
            {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
          </div>
          <div style={{ fontSize: '8.5px', color: '#6b7280', marginTop: '2px' }}>
            {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' | ')}
          </div>
          {doctor.registrationNumber && (
            <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '2px' }}>Reg. No: {doctor.registrationNumber}</div>
          )}
          <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '4px' }}>
            {[doctor.address, doctor.phone].filter(Boolean).join('  ·  ')}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px' }}>
            <span style={{ color: '#9ca3af' }}>Patient: </span>
            <strong>{patient.name || '______________________'}</strong>
            {patient.age && <span style={{ color: '#9ca3af', marginLeft: '8px' }}>Age: <strong>{patient.age}</strong></span>}
            {patient.gender && <span style={{ color: '#9ca3af', marginLeft: '8px' }}>Sex: <strong>{patient.gender}</strong></span>}
          </div>
          <div style={{ fontSize: '8.5px', color: '#9ca3af' }}>Date: <strong style={{ color: pc }}>{today}</strong></div>
        </div>

        {diagnosis && (
          <div style={{ marginBottom: '10px', fontSize: '9px' }}>
            <span style={{ color: '#9ca3af' }}>Diagnosis: </span><strong>{diagnosis}</strong>
          </div>
        )}

        <div style={{ fontSize: '18px', fontFamily: 'Georgia, serif', color: pc, marginBottom: '8px' }}>℞</div>

        <SimpleRxList />

        {labTests && (
          <div style={{ marginTop: '12px', borderTop: '0.5px solid #e5e7eb', paddingTop: '8px' }}>
            <div style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Investigations</div>
            <div style={{ color: '#374151', fontSize: '9px' }}>{labTests}</div>
          </div>
        )}

        {advice && (
          <div style={{ marginTop: '12px', borderTop: '0.5px solid #e5e7eb', paddingTop: '8px' }}>
            <div style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Instructions</div>
            <div style={{ color: '#374151', fontSize: '9px', whiteSpace: 'pre-wrap' }}>{t(advice, lang)}</div>
          </div>
        )}

        {followUpDate && (
          <div style={{ marginTop: '10px', fontSize: '8.5px', color: '#6b7280' }}>
            <strong>Follow-up: </strong>{followUpDate}
          </div>
        )}

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', borderTop: '0.5px solid #e5e7eb', paddingTop: '12px' }}>
          <SignatureBox />
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '7px', color: '#d1d5db', letterSpacing: '1px', textTransform: 'uppercase' }}>
          prescriptionmaker.in · Confidential Medical Record
        </div>
      </div>
    )
  }

  // ─── Default for remaining premium templates: structured with colored header + table ─
  return (
    <div style={{ width: '210mm', minHeight: '297mm', background: bg, fontFamily: ff, fontSize: '10px', boxSizing: 'border-box' }}>
      {/* Header band */}
      <div style={{ backgroundColor: pc, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '20px', color: ac }}>℞</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
              </div>
              <div style={{ fontSize: '8.5px', color: ac }}>
                {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {doctor.clinicName && <div style={{ fontSize: '9px', fontWeight: 600, color: '#fff' }}>{doctor.clinicName}</div>}
          {doctor.registrationNumber && <div style={{ fontSize: '7.5px', color: ac }}>Reg: {doctor.registrationNumber}</div>}
          {doctor.phone && <div style={{ fontSize: '7.5px', color: '#e2e8f0' }}>{doctor.phone}</div>}
          {doctor.address && <div style={{ fontSize: '7px', color: '#cbd5e1' }}>{doctor.address}</div>}
        </div>
      </div>

      <div style={{ padding: '10px 20px' }}>
        {/* Patient row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: `${pc}10`, padding: '6px 10px', borderRadius: '4px', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '8px', color: '#64748b' }}>Patient: </span>
            <strong style={{ fontSize: '10px' }}>{patient.name || '______________________'}</strong>
            {(patient.age || patient.gender) && (
              <span style={{ fontSize: '8.5px', color: '#475569', marginLeft: '10px' }}>
                Age: <strong>{patient.age || '___'}</strong>{patient.gender ? ` / ${patient.gender}` : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: '8.5px', color: '#475569' }}>Date: <strong>{today}</strong></div>
        </div>

        {diagnosis && (
          <div style={{ marginBottom: '8px', fontSize: '9px' }}>
            <span style={{ color: '#64748b' }}>Diagnosis: </span><strong>{diagnosis}</strong>
          </div>
        )}

        <div style={{ fontSize: '11px', fontWeight: 700, color: pc, marginBottom: '4px' }}>
          <RxSymbol /> PRESCRIPTION
        </div>
        <MedicineTable />

        {labTests && (
          <div style={{ marginTop: '10px' }}>
            <SectionTitle>Investigations</SectionTitle>
            <div style={{ color: '#475569' }}>{labTests}</div>
          </div>
        )}

        {advice && (
          <div style={{ marginTop: '8px' }}>
            <SectionTitle>Advice</SectionTitle>
            <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{t(advice, lang)}</div>
          </div>
        )}

        {followUpDate && (
          <div style={{ marginTop: '8px', fontSize: '8.5px', color: '#475569' }}>
            <strong>Follow-up: </strong>{followUpDate}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <SignatureBox />
        </div>

        <div style={{ marginTop: '16px', borderTop: `1px solid ${pc}20`, paddingTop: '6px', textAlign: 'center', fontSize: '7.5px', color: '#94a3b8' }}>
          {template.name} Template · prescriptionmaker.in
        </div>
      </div>
    </div>
  )
}
