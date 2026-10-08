/**
 * PrescriptionDocument — @react-pdf/renderer premium document
 * Renders premium prescription PDFs matching the template style.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 700 },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
  ],
})

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b', paddingBottom: 50 },
  // Header styles
  headerBand: { paddingHorizontal: 25, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerBandInner: { paddingHorizontal: 25, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clinicName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 0.5 },
  doctorName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  sub: { fontSize: 8, color: '#475569', marginTop: 1 },
  // Patient block
  patientStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, marginHorizontal: 20, marginVertical: 6, borderRadius: 3 },
  label: { fontSize: 7.5, color: '#64748b' },
  value: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  // Grid patient table
  gridRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  gridCell: { flex: 1, padding: 4, borderRightWidth: 0.5, borderRightColor: '#e2e8f0' },
  gridLabel: { fontSize: 7, color: '#94a3b8' },
  gridValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  // Medicine table
  tableHeader: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 5 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  tableRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 5 },
  tableCell: { fontSize: 8, color: '#1e293b' },
  // Rx list style
  rxSymbol: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  medName: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1e293b' },
  medDose: { fontSize: 7.5, color: '#475569', marginTop: 1, marginLeft: 8 },
  // Section
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 2 },
  sectionBody: { fontSize: 8, color: '#475569', lineHeight: 1.5 },
  // Footer
  footer: { position: 'absolute', bottom: 16, left: 20, right: 20, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerText: { fontSize: 7, color: '#94a3b8' },
  sigBox: { alignItems: 'flex-end' },
  sigLine: { width: 70, borderBottomWidth: 0.5, borderBottomColor: '#94a3b8', marginTop: 20 },
  sigLabel: { fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold', marginTop: 3 },
})

export interface PrescriptionDocumentProps {
  templateName: string
  templateSlug?: string
  primaryColor: string
  accentColor: string
  bgColor?: string
  layout: string
  doctor: {
    name?: string | null
    qualifications?: string | null
    specialization?: string | null
    registrationNumber?: string | null
    clinicName?: string | null
    phone?: string | null
    address?: string | null
    signatureUrl?: string | null
    logoUrl?: string | null
    stampUrl?: string | null
  }
  patient: {
    name?: string | null
    age?: string | null
    gender?: string | null
  }
  diagnosis?: string | null
  medicines: Array<{
    name?: string | null
    strength?: string | null
    form?: string | null
    frequency?: string | null
    timing?: string | null
    duration?: string | null
  }>
  labTests?: string | null
  advice?: string | null
  followUpDate?: string | null
  date?: string
  canvasImage?: string | null
  vitals?: Record<string, string>
  chiefComplaint?: string | null
}

export function PrescriptionDocument({
  templateName, templateSlug, primaryColor: pc, accentColor: ac, bgColor = '#ffffff',
  layout, doctor, patient, diagnosis, medicines, labTests, advice, followUpDate, date, canvasImage,
  vitals = {}, chiefComplaint
}: PrescriptionDocumentProps) {
  const today = date ?? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const filledMeds = medicines.filter(m => m.name?.trim())
  const slug = templateSlug || layout

  const CanvasOverlay = () => {
    if (!canvasImage) return null
    return (
      <Image 
        src={canvasImage} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, objectFit: 'contain' }} 
      />
    )
  }

  // Shared: Signature block
  const SigBlock = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
      {doctor.stampUrl && (
        <Image src={doctor.stampUrl} style={{ width: 60, height: 60, objectFit: 'contain', opacity: 0.8 }} />
      )}
      <View style={{ alignItems: 'center' }}>
        {doctor.signatureUrl
          ? <Image src={doctor.signatureUrl} style={{ width: 75, height: 35, objectFit: 'contain' }} />
          : <View style={S.sigLine} />}
        <Text style={S.sigLabel}>Doctor&apos;s Signature</Text>
        {doctor.name && <Text style={{ fontSize: 7, color: '#475569', marginTop: 1 }}>Dr. {doctor.name}</Text>}
      </View>
    </View>
  )

  // Shared: Medicine grid table
  const MedTable = () => (
    <View style={{ marginTop: 4 }}>
      <View style={[S.tableHeader, { backgroundColor: pc }]}>
        <Text style={[S.tableHeaderCell, { flex: 4 }]}>Drugs / Medicine</Text>
        <Text style={[S.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Unit (Tab/Syrup)</Text>
        <Text style={[S.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Frequency</Text>
        <Text style={[S.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Duration</Text>
      </View>
      {(filledMeds.length > 0 ? filledMeds : Array.from({ length: 7 }, () => ({} as any))).map((med: any, i: number) => (
        <View key={i} style={[S.tableRow, { backgroundColor: i % 2 === 0 ? `${pc}10` : '#ffffff', borderBottomWidth: 0.5, borderBottomColor: `${pc}30` }]}>
          <Text style={[S.tableCell, { flex: 4 }]}>
            {med.name ? `${i + 1}. ${med.name}${med.strength ? ' ' + med.strength : ''}${med.form ? ' (' + med.form + ')' : ''}` : ''}
          </Text>
          <Text style={[S.tableCell, { flex: 2, textAlign: 'center', color: '#475569' }]}>{med.form || ''}</Text>
          <Text style={[S.tableCell, { flex: 2, textAlign: 'center', color: '#475569' }]}>{med.frequency || ''}</Text>
          <Text style={[S.tableCell, { flex: 2, textAlign: 'center', color: '#475569' }]}>{med.duration || ''}</Text>
        </View>
      ))}
    </View>
  )

  // Shared: Simple Rx list
  const RxList = () => (
    <View style={{ borderLeftWidth: 2, borderLeftColor: ac, paddingLeft: 8, marginTop: 4 }}>
      {filledMeds.length === 0
        ? <Text style={{ color: '#94a3b8', fontSize: 8, fontStyle: 'italic' }}>No medicines</Text>
        : filledMeds.map((med, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={S.medName}>
              {`${i + 1}. ${med.name ?? ''}${med.strength ? ' ' + med.strength : ''}${med.form ? ' (' + med.form + ')' : ''}`}
            </Text>
            <Text style={S.medDose}>
              {[med.frequency, med.timing, med.duration].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))}
    </View>
  )

  const InfoBlock = ({ children }: { children: React.ReactNode }) => (
    <View style={{ marginHorizontal: 20, marginBottom: 10, borderWidth: 0.5, borderColor: `${pc}40`, borderRadius: 2 }}>
      {children}
    </View>
  )

  const GridRow = ({ fields }: { fields: { label: string; value?: string | null }[] }) => (
    <View style={S.gridRow}>
      {fields.map((f, i) => (
        <View key={i} style={[S.gridCell, { borderRightWidth: i < fields.length - 1 ? 0.5 : 0 }]}>
          <Text style={S.gridLabel}>{f.label}</Text>
          <Text style={S.gridValue}>{f.value || ''}</Text>
        </View>
      ))}
    </View>
  )

  const PatientStrip = () => (
    <View style={[S.patientStrip, { backgroundColor: `${pc}12` }]}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text><Text style={S.label}>Patient: </Text><Text style={S.value}>{patient.name || '_____________________'}</Text></Text>
        {(patient.age || patient.gender) && (
          <Text><Text style={S.label}>Age: </Text><Text style={S.value}>{patient.age || '—'}{patient.gender ? ' / ' + patient.gender : ''}</Text></Text>
        )}
      </View>
      <Text><Text style={S.label}>Date: </Text><Text style={S.value}>{today}</Text></Text>
    </View>
  )

  const SecTitle = ({ text, color = pc }: { text: string; color?: string }) => (
    <Text style={[S.sectionTitle, { color, marginHorizontal: 20 }]}>{text}</Text>
  )

  const Sections = () => (
    <View style={{ marginHorizontal: 20 }}>
      {diagnosis ? (
        <View style={{ marginBottom: 6 }}>
          <Text><Text style={S.label}>Diagnosis: </Text><Text style={S.value}>{diagnosis}</Text></Text>
        </View>
      ) : null}
      <Text style={[S.rxSymbol, { color: pc }]}>Rx</Text>
      <MedTable />
      {labTests ? (
        <View style={{ marginTop: 8 }}>
          <Text style={[S.sectionTitle, { color: pc }]}>INVESTIGATIONS</Text>
          <Text style={S.sectionBody}>{labTests}</Text>
        </View>
      ) : null}
      {advice ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[S.sectionTitle, { color: pc }]}>ADVICE</Text>
          <Text style={S.sectionBody}>{advice}</Text>
        </View>
      ) : null}
      {followUpDate ? (
        <View style={{ marginTop: 6 }}>
          <Text style={S.sectionBody}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Follow-up: </Text>{followUpDate}</Text>
        </View>
      ) : null}
    </View>
  )

  // ─── ROYAL INDIGO PDF ────────────────────────────────────────────────────
  if (slug === 'royal-indigo') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={[S.page, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={[S.headerBand, { backgroundColor: pc, paddingTop: 16, paddingBottom: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: pc }}>Rx</Text>
              </View>
              <View>
                <Text style={S.clinicName}>{doctor.clinicName || 'Medical Clinic'}</Text>
                {doctor.address ? <Text style={{ fontSize: 7.5, color: ac }}>{doctor.address}</Text> : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff' }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</Text>
              {doctor.qualifications ? <Text style={{ fontSize: 7.5, color: ac }}>{doctor.qualifications}</Text> : null}
              {doctor.specialization ? <Text style={{ fontSize: 7.5, color: ac }}>{doctor.specialization}</Text> : null}
              {doctor.registrationNumber ? <Text style={{ fontSize: 7, color: `${ac}cc` }}>Reg: {doctor.registrationNumber}</Text> : null}
              <Text style={{ fontSize: 7, color: ac, marginTop: 2 }}>Date: {today}</Text>
            </View>
          </View>

          {/* Patient grid */}
          <InfoBlock>
            <View style={{ backgroundColor: pc, padding: 4 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' }}>PATIENT INFORMATION</Text>
            </View>
            <GridRow fields={[{ label: "Patient Name", value: patient.name }]} />
            <GridRow fields={[
              { label: 'Date of Birth', value: '' },
              { label: 'Age', value: patient.age },
              { label: 'Sex', value: patient.gender },
              { label: 'Allergies', value: '' },
            ]} />
            <GridRow fields={[{ label: 'Address', value: '' }]} />
          </InfoBlock>

          {diagnosis ? (
            <View style={{ marginHorizontal: 20, marginBottom: 6 }}>
              <Text><Text style={S.label}>Diagnosed With: </Text><Text style={S.value}>{diagnosis}</Text></Text>
            </View>
          ) : null}

          <View style={{ marginHorizontal: 20 }}>
            <MedTable />
          </View>

          {labTests ? (
            <View style={{ marginHorizontal: 20, marginTop: 8 }}>
              <Text style={[S.sectionTitle, { color: pc }]}>INVESTIGATIONS</Text>
              <Text style={S.sectionBody}>{labTests}</Text>
            </View>
          ) : null}

          {advice ? (
            <View style={{ marginHorizontal: 20, marginTop: 6 }}>
              <Text style={[S.sectionTitle, { color: pc }]}>ADVICE & INSTRUCTIONS</Text>
              <Text style={S.sectionBody}>{advice}</Text>
            </View>
          ) : null}

          {followUpDate ? (
            <View style={{ marginHorizontal: 20, marginTop: 6 }}>
              <Text style={S.sectionBody}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Follow-up: </Text>{followUpDate}</Text>
            </View>
          ) : null}

          <View style={[S.footer, { borderTopColor: `${pc}30` }]}>
            <Text style={S.footerText}>prescriptionmaker.in · For documentation purposes only</Text>
            <SigBlock />
          </View>
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }

  // ─── EXECUTIVE GOLD PDF ──────────────────────────────────────────────────
  if (slug === 'executive-gold') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={[S.page, { backgroundColor: bgColor }]}>
          {/* Gold top border */}
          <View style={{ height: 5, backgroundColor: ac }} />

          {/* Centered header */}
          <View style={{ alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: ac, marginHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: pc, letterSpacing: 1 }}>{doctor.clinicName || 'Medical Clinic'}</Text>
            <View style={{ width: 30, height: 1, backgroundColor: ac, marginVertical: 5 }} />
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151' }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</Text>
            {doctor.qualifications ? <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 1 }}>{doctor.qualifications}{doctor.specialization ? ' | ' + doctor.specialization : ''}</Text> : null}
            {doctor.registrationNumber ? <Text style={{ fontSize: 7.5, color: ac, marginTop: 2 }}>Registration No: {doctor.registrationNumber}</Text> : null}
            {(doctor.address || doctor.phone) ? <Text style={{ fontSize: 7.5, color: '#94a3b8', marginTop: 3 }}>{[doctor.address, doctor.phone].filter(Boolean).join('  ·  ')}</Text> : null}
          </View>

          {/* Patient info block */}
          <InfoBlock>
            <View style={{ backgroundColor: `${pc}15`, borderBottomWidth: 0.5, borderBottomColor: `${ac}60`, padding: 4 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc }}>PATIENT INFORMATION</Text>
            </View>
            <GridRow fields={[{ label: "Patient's Name", value: patient.name }]} />
            <GridRow fields={[{ label: 'Date of Birth', value: '' }, { label: 'Age', value: patient.age }, { label: 'Sex', value: patient.gender }, { label: 'Occupation', value: '' }]} />
            <GridRow fields={[{ label: 'Health Insurance No.', value: patient.insuranceNo || '' }, { label: 'Health Care Provider', value: patient.careProvider || '' }]} />
            <GridRow fields={[{ label: "Patient's Address", value: '' }]} />
            <GridRow fields={[{ label: 'Diagnosed With', value: diagnosis }]} />
            <GridRow fields={[{ label: 'Blood Pressure', value: '' }, { label: 'Pulse Rate', value: '' }, { label: 'Weight', value: '' }]} />
            <GridRow fields={[{ label: 'Allergies', value: '' }, { label: 'Disabilities if any', value: '' }]} />
          </InfoBlock>

          <View style={{ marginHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: pc }}>PRESCRIPTION</Text>
            <Text style={{ fontSize: 8, color: '#94a3b8' }}>Date: {today}</Text>
          </View>

          <View style={{ marginHorizontal: 20 }}>
            <MedTable />
          </View>

          {/* Advice & History columns */}
          <View style={{ marginHorizontal: 20, flexDirection: 'row', marginTop: 10, borderWidth: 0.5, borderColor: `${ac}40`, borderRadius: 2 }}>
            <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: `${ac}40`, padding: 6 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 3 }}>Diet to Follow:</Text>
              {advice ? <Text style={{ fontSize: 7.5, color: '#475569' }}>{advice}</Text> : null}
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 3 }}>Brief History:</Text>
            </View>
          </View>

          {followUpDate ? (
            <View style={{ marginHorizontal: 20, marginTop: 6 }}>
              <Text style={S.sectionBody}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Follow-up: </Text>{followUpDate}</Text>
            </View>
          ) : null}

          <View style={S.footer}>
            <Text style={S.footerText}>{templateName} · prescriptionmaker.in</Text>
            <SigBlock />
          </View>
          <View style={{ height: 3, backgroundColor: ac, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }

  // ─── TWO COLUMN SIDEBAR PDF ──────────────────────────────────────────────
  if (slug === 'two-column-sidebar') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={[S.page, { backgroundColor: bgColor, flexDirection: 'row', paddingBottom: 0 }]}>
          {/* Left Sidebar */}
          <View style={{ width: '32%', backgroundColor: pc, padding: 16, display: 'flex', flexDirection: 'column' }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {doctor.logoUrl ? (
                <Image src={doctor.logoUrl} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 10, objectFit: 'cover' }} />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#fff' }}>Rx</Text>
                </View>
              )}
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>
                {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
              </Text>
              {doctor.qualifications ? <Text style={{ fontSize: 8, color: '#e2e8f0', marginTop: 2, textAlign: 'center' }}>{doctor.qualifications}</Text> : null}
              {doctor.specialization ? <Text style={{ fontSize: 8, color: ac, marginTop: 2, textAlign: 'center' }}>{doctor.specialization}</Text> : null}
              {doctor.registrationNumber ? <Text style={{ fontSize: 7.5, color: '#cbd5e1', marginTop: 2, textAlign: 'center' }}>Reg: {doctor.registrationNumber}</Text> : null}
            </View>

            <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 8, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 4 }}>Clinic</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff' }}>{doctor.clinicName || '—'}</Text>
              {doctor.address ? <Text style={{ fontSize: 8, color: '#e2e8f0', marginTop: 2 }}>{doctor.address}</Text> : null}
              {doctor.phone ? <Text style={{ fontSize: 8, color: '#e2e8f0', marginTop: 2 }}>{doctor.phone}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 8, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 6 }}>Recorded Vitals</Text>
              {[
                { label: 'BP', unit: 'mmHg' },
                { label: 'Pulse', unit: 'bpm' },
                { label: 'Temp', unit: '°F' },
                { label: 'SpO₂', unit: '%' },
                { label: 'Weight', unit: 'kg' },
                { label: 'Height', unit: 'cm' },
              ].map(v => (
                <View key={v.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 4 }}>
                  <Text style={{ fontSize: 8, color: '#fff' }}>{v.label} <Text style={{ fontSize: 7, color: '#cbd5e1' }}>({v.unit})</Text></Text>
                  <View style={{ width: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' }} />
                </View>
              ))}
            </View>

            <Text style={{ marginTop: 'auto', fontSize: 7, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              prescriptionmaker.in
            </Text>
          </View>

          {/* Right Content */}
          <View style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: ac, paddingBottom: 8, marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', letterSpacing: 1 }}>Medical Prescription</Text>
                <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>Date: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{today}</Text></Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: '#64748b' }}>OPD Ref: _______________</Text>
              </View>
            </View>

            <View style={{ backgroundColor: `${ac}15`, borderRadius: 4, padding: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 8, color: '#64748b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 4 }}>Patient Details</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{patient.name || '______________________________'}</Text>
              <Text style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                {[patient.age ? `Age: ${patient.age}` : '', patient.gender ? `Sex: ${patient.gender}` : ''].filter(Boolean).join('  ·  ')}
              </Text>
            </View>

            {diagnosis ? (
              <View style={{ borderWidth: 1, borderColor: `${pc}30`, borderLeftWidth: 3, borderLeftColor: pc, borderRadius: 2, padding: 6, marginBottom: 12 }}>
                <Text style={{ fontSize: 8, color: '#64748b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2 }}>Diagnosis</Text>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{diagnosis}</Text>
              </View>
            ) : null}

            <View>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 4 }}>Rx</Text>
              <View style={{ backgroundColor: pc, flexDirection: 'row', padding: 4 }}>
                <Text style={{ flex: 4, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' }}>Medicine</Text>
                <Text style={{ flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>Unit</Text>
                <Text style={{ flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>Frequency</Text>
                <Text style={{ flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>Duration</Text>
              </View>
              {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                <View key={idx} style={{ flexDirection: 'row', padding: 4, backgroundColor: idx % 2 === 0 ? `${pc}08` : '#fff', borderBottomWidth: 1, borderBottomColor: `${pc}15` }}>
                  <Text style={{ flex: 4, fontSize: 8 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{idx + 1}. {med.name}</Text>
                    {med.strength ? ` ${med.strength}` : ''}
                  </Text>
                  <Text style={{ flex: 2, fontSize: 8, textAlign: 'center' }}>{med.form || '—'}</Text>
                  <Text style={{ flex: 2, fontSize: 8, textAlign: 'center' }}>{med.frequency || '—'}</Text>
                  <Text style={{ flex: 2, fontSize: 8, textAlign: 'center' }}>{med.duration || '—'}</Text>
                </View>
              )) : Array.from({ length: 5 }, (_, idx) => (
                <View key={idx} style={{ flexDirection: 'row', padding: 4, backgroundColor: idx % 2 === 0 ? `${pc}05` : '#fff', borderBottomWidth: 1, borderBottomColor: `${pc}10` }}>
                  <Text style={{ flex: 4, fontSize: 8 }}>&nbsp;</Text>
                  <Text style={{ flex: 2, fontSize: 8 }}>&nbsp;</Text>
                  <Text style={{ flex: 2, fontSize: 8 }}>&nbsp;</Text>
                  <Text style={{ flex: 2, fontSize: 8 }}>&nbsp;</Text>
                </View>
              ))}
            </View>

            {labTests ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 8.5 }}>
                  <Text style={{ color: '#64748b', fontFamily: 'Helvetica-Bold' }}>Investigations: </Text>
                  <Text style={{ color: '#374151' }}>{labTests}</Text>
                </Text>
              </View>
            ) : null}

            {advice ? (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 8.5 }}>
                  <Text style={{ color: '#64748b', fontFamily: 'Helvetica-Bold' }}>Advice: </Text>
                  <Text style={{ color: '#374151' }}>{advice}</Text>
                </Text>
              </View>
            ) : null}

            {followUpDate ? (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 8.5, color: '#64748b' }}>
                  Next visit: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{followUpDate}</Text>
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: 'auto', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }}>
              <SigBlock />
            </View>
          </View>

          <CanvasOverlay />
        </Page>
      </Document>
    )
  }

  // ─── HOSPITAL OPD FORM PDF ───────────────────────────────────────────────
  if (slug === 'hospital-opd') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={[S.page, { backgroundColor: bgColor }]}>
          {/* Hospital banner */}
          <View style={{ backgroundColor: pc, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#fff' }}>Rx</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#fff' }}>{doctor.clinicName || 'City Hospital'}</Text>
                {doctor.address ? <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{doctor.address}</Text> : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff' }}>OPD / PRESCRIPTION</Text>
              <Text style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Date: {today}</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            {/* MRN / Ward / Bed row */}
            <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: `${pc}40`, borderRadius: 4, marginBottom: 8 }}>
              {[
                { label: 'MRN No.', value: '' },
                { label: 'Ward', value: '' },
                { label: 'Bed No.', value: '' },
                { label: 'IP/OP No.', value: '' },
              ].map((f, i) => (
                <View key={i} style={{ flex: 1, padding: 6, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: `${pc}30`, backgroundColor: i % 2 === 0 ? '#fff' : `${pc}05` }}>
                  <Text style={{ fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold' }}>{f.label}</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 }}> </Text>
                </View>
              ))}
            </View>

            {/* Attending Physician */}
            <View style={{ backgroundColor: `${ac}20`, borderWidth: 1, borderColor: `${ac}40`, borderRadius: 4, padding: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 9 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: pc }}>ATTENDING PHYSICIAN: </Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. ______________'}</Text>
                {doctor.qualifications ? <Text style={{ color: '#64748b' }}> {doctor.qualifications}</Text> : null}
              </Text>
              <Text style={{ fontSize: 9 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: pc }}>SPECIALTY: </Text>
                <Text style={{ color: '#1e293b' }}>{doctor.specialization || '________________'}</Text>
              </Text>
            </View>

            {/* Patient info table */}
            <View style={{ borderWidth: 1, borderColor: `${pc}40`, marginBottom: 8 }}>
              <View style={{ backgroundColor: `${pc}15`, padding: 6, borderBottomWidth: 1, borderBottomColor: `${pc}25` }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: pc, fontSize: 8 }}>PATIENT INFORMATION</Text>
              </View>
              <View style={{ padding: 6, borderBottomWidth: 1, borderBottomColor: `${pc}25`, flexDirection: 'row' }}>
                <Text style={{ color: '#64748b', fontSize: 9 }}>Patient Name: </Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1e293b' }}>{patient.name || '___________________________'}</Text>
              </View>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: `${pc}25` }}>
                <View style={{ flex: 1, padding: 6, borderRightWidth: 1, borderRightColor: `${pc}25`, flexDirection: 'row' }}>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>MRN: </Text>
                </View>
                <View style={{ flex: 1, padding: 6, borderRightWidth: 1, borderRightColor: `${pc}25`, flexDirection: 'row' }}>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>Age: </Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1e293b' }}>{patient.age || '____'}</Text>
                </View>
                <View style={{ flex: 1, padding: 6, borderRightWidth: 1, borderRightColor: `${pc}25`, flexDirection: 'row' }}>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>Sex: </Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1e293b' }}>{patient.gender || '____'}</Text>
                </View>
                <View style={{ flex: 1, padding: 6, flexDirection: 'row' }}>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>Ward: </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: `${pc}25` }}>
                <View style={{ flex: 2, padding: 6, borderRightWidth: 1, borderRightColor: `${pc}25`, flexDirection: 'row' }}>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>Insurance No: </Text>
                </View>
                <View style={{ flex: 2, padding: 6, flexDirection: 'row' }}>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>Care Provider: </Text>
                </View>
              </View>
              <View style={{ padding: 6, flexDirection: 'row' }}>
                <Text style={{ color: '#64748b', fontSize: 9 }}>Diagnosis: </Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1e293b' }}>{diagnosis || '___________________________'}</Text>
              </View>
            </View>

            {/* Rx + Medicine table */}
            <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 4 }}>Rx</Text>
            <View style={{ borderWidth: 1, borderColor: `${pc}40`, marginBottom: 8 }}>
              <View style={{ backgroundColor: pc, flexDirection: 'row', padding: 6 }}>
                <Text style={{ flex: 3.5, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' }}>Medication / Strength</Text>
                <Text style={{ flex: 2.5, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>Dosage / Frequency</Text>
                <Text style={{ flex: 1.5, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>Route</Text>
                <Text style={{ flex: 1.5, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' }}>Quantity</Text>
                <Text style={{ flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' }}>Duration / Notes</Text>
              </View>
              {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                <View key={idx} style={{ flexDirection: 'row', padding: 6, backgroundColor: idx % 2 === 0 ? '#fff' : `${pc}05`, borderTopWidth: 1, borderTopColor: `${pc}20` }}>
                  <Text style={{ flex: 3.5, fontSize: 8.5 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{med.name}</Text>
                    {med.strength ? <Text style={{ color: '#64748b' }}> / {med.strength}</Text> : ''}
                  </Text>
                  <Text style={{ flex: 2.5, fontSize: 8.5, textAlign: 'center', color: '#1e293b' }}>{med.frequency || '—'}</Text>
                  <Text style={{ flex: 1.5, fontSize: 8.5, textAlign: 'center', color: '#1e293b' }}>Oral</Text>
                  <Text style={{ flex: 1.5, fontSize: 8.5, textAlign: 'center', color: '#1e293b' }}> </Text>
                  <Text style={{ flex: 2, fontSize: 8.5, color: '#1e293b' }}>{med.duration || '—'}</Text>
                </View>
              )) : Array.from({ length: 5 }, (_, idx) => (
                <View key={idx} style={{ flexDirection: 'row', padding: 6, backgroundColor: idx % 2 === 0 ? '#fff' : `${pc}05`, borderTopWidth: 1, borderTopColor: `${pc}20` }}>
                  <Text style={{ flex: 3.5, fontSize: 8.5 }}> </Text>
                  <Text style={{ flex: 2.5, fontSize: 8.5 }}> </Text>
                  <Text style={{ flex: 1.5, fontSize: 8.5 }}> </Text>
                  <Text style={{ flex: 1.5, fontSize: 8.5 }}> </Text>
                  <Text style={{ flex: 2, fontSize: 8.5 }}> </Text>
                </View>
              ))}
            </View>

            {/* Investigations */}
            {labTests ? (
              <View style={{ borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', marginBottom: 4 }}>Investigations Ordered</Text>
                <Text style={{ fontSize: 9, color: '#374151' }}>{labTests}</Text>
              </View>
            ) : null}

            {/* Advice */}
            {advice ? (
              <View style={{ borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', marginBottom: 4 }}>Instructions / Advice</Text>
                <Text style={{ fontSize: 9, color: '#374151' }}>{advice}</Text>
              </View>
            ) : null}

            {followUpDate ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 9, color: '#64748b' }}>
                  Review Date: <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{followUpDate}</Text>
                </Text>
              </View>
            ) : null}

            {/* Dual signatures */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: 10 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', marginBottom: 30 }}>HOD SIGNATURE</Text>
                <View style={{ borderTopWidth: 1, borderTopColor: '#94a3b8' }} />
                <Text style={{ fontSize: 7.5, color: '#94a3b8', marginTop: 4 }}>Head of Department</Text>
              </View>
              <View style={{ flex: 1, borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: 10 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', marginBottom: 4 }}>DOCTOR SIGNATURE</Text>
                {doctor.signatureUrl
                  ? <Image src={doctor.signatureUrl} style={{ width: 70, height: 26, objectFit: 'contain' }} />
                  : <View style={{ height: 26 }} />}
                <View style={{ borderTopWidth: 1, borderTopColor: '#94a3b8' }} />
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 4 }}>Dr. {doctor.name || '____________'}</Text>
                {doctor.registrationNumber ? <Text style={{ fontSize: 7, color: '#94a3b8' }}>Reg: {doctor.registrationNumber}</Text> : null}
              </View>
            </View>
          </View>
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }

  // ─── CLASSIC LETTERHEAD ─────────────────────────────────────────────────
  if (slug === 'classic-letterhead') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 10, padding: '25mm 22mm', backgroundColor: bgColor }}>
          {/* Centered header */}
          <View style={{ alignItems: 'center', borderBottomWidth: 3, borderBottomStyle: 'solid', borderBottomColor: pc, paddingBottom: 14, marginBottom: 18 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: pc, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {doctor.clinicName || 'Medical Clinic'}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#374151', marginTop: 4 }}>
              {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
            </Text>
            {(doctor.qualifications || doctor.specialization) && (
              <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontFamily: 'Helvetica-Oblique' }}>
                {[doctor.qualifications, doctor.specialization].filter(Boolean).join(', ')}
              </Text>
            )}
            {doctor.registrationNumber && (
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                Reg. No: {doctor.registrationNumber}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              {doctor.address && <Text style={{ fontSize: 9, color: '#94a3b8' }}>{doctor.address}</Text>}
              {doctor.phone && <Text style={{ fontSize: 9, color: '#94a3b8' }}>{doctor.phone}</Text>}
            </View>
          </View>

          {/* Patient + Date row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>Patient: </Text>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>
                {patient.name || '________________________________'}
              </Text>
              {patient.age && (
                <Text style={{ marginLeft: 12, fontSize: 9, color: '#64748b' }}>
                  Age: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{patient.age}</Text>
                  {patient.gender ? ` / ${patient.gender}` : ''}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 9, color: '#64748b' }}>
              Date: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{today}</Text>
            </Text>
          </View>

          {/* Chief complaint */}
          {diagnosis && (
            <View style={{ marginBottom: 14, flexDirection: 'row' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'Helvetica-Oblique' }}>Chief Complaint / Diagnosis: </Text>
              <Text style={{ fontSize: 10, color: '#1e293b' }}>{diagnosis}</Text>
            </View>
          )}

          <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Oblique', color: pc, marginBottom: 10, marginTop: 6 }}>
            Rx
          </Text>

          {/* Numbered medicine list */}
          <View style={{ paddingLeft: 6 }}>
            {filledMeds.length === 0 ? (
              [1, 2, 3, 4].map(n => (
                <View key={n} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomStyle: 'dashed', borderBottomColor: '#cbd5e1', paddingBottom: 10 }}>
                  <Text style={{ color: '#94a3b8', fontSize: 10 }}>{n}.</Text>
                </View>
              ))
            ) : filledMeds.map((med, idx) => (
              <View key={idx} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomStyle: 'dashed', borderBottomColor: '#cbd5e1', paddingBottom: 10 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b', fontSize: 11 }}>
                  {idx + 1}.  {med.name}{med.strength ? ` — ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
                </Text>
                <Text style={{ paddingLeft: 22, marginTop: 3, fontSize: 9, color: '#475569', fontFamily: 'Helvetica-Oblique' }}>
                  {[med.frequency, med.timing, med.duration].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            ))}
          </View>

          {/* Advice */}
          {advice && (
            <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }}>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4, fontFamily: 'Helvetica-Oblique' }}>Advice & Instructions:</Text>
              <Text style={{ color: '#374151', fontSize: 9.5 }}>{advice}</Text>
            </View>
          )}

          {/* Lab tests */}
          {labTests && (
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'Helvetica-Oblique' }}>Investigations: </Text>
              <Text style={{ fontSize: 9.5, color: '#374151' }}>{labTests}</Text>
            </View>
          )}

          {followUpDate && (
            <View style={{ marginTop: 8, flexDirection: 'row' }}>
              <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'Helvetica-Oblique' }}>Follow-up on: </Text>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{followUpDate}</Text>
            </View>
          )}

          {/* Signature */}
          <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, alignItems: 'flex-end' }}>
            <SigBlock />
          </View>
          
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }

  // ─── VITALS FIRST ────────────────────────────────────────────────────────
  if (slug === 'vitals-first') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 10, backgroundColor: bgColor }}>
          {/* Header */}
          <View style={{ backgroundColor: pc, color: '#fff', padding: '16px 24px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</Text>
              {doctor.qualifications && <Text style={{ fontSize: 11, color: ac, marginTop: 4 }}>{doctor.qualifications}</Text>}
              {doctor.specialization && <Text style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{doctor.specialization}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {doctor.clinicName && <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{doctor.clinicName}</Text>}
              {doctor.phone && <Text style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{doctor.phone}</Text>}
              {doctor.registrationNumber && <Text style={{ fontSize: 10, color: ac, marginTop: 2 }}>Reg: {doctor.registrationNumber}</Text>}
            </View>
          </View>

          <View style={{ padding: '14px 24px', flex: 1 }}>
            {/* Patient Info Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: '8px 12px', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>PATIENT: </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{patient.name || '__________________________'}</Text>
                {(patient.age || patient.gender) && (
                  <Text style={{ marginLeft: 16, fontSize: 10, color: '#64748b' }}>
                    Age: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{patient.age || '___'}</Text>  Sex: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{patient.gender || '___'}</Text>
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 10, color: '#64748b' }}>Date: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{today}</Text></Text>
            </View>

            {/* Vitals Box */}
            <View style={{ borderWidth: 2, borderColor: pc, borderRadius: 6, marginBottom: 16, overflow: 'hidden' }}>
              <View style={{ backgroundColor: pc, padding: '6px 12px' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Helvetica-Bold' }}>VITALS</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {[
                  { label: 'BLOOD PRESSURE', value: vitals.bloodPressure, unit: 'mmHg' },
                  { label: 'HEART RATE', value: vitals.pulse, unit: 'bpm' },
                  { label: 'SpO2', value: vitals.spo2, unit: '%' },
                  { label: 'TEMPERATURE', value: vitals.temperature, unit: '°F' },
                  { label: 'WEIGHT', value: vitals.weight, unit: 'kg' },
                  { label: 'RR', value: vitals.respiratoryRate, unit: '/min' },
                ].map((v, i) => (
                  <View key={v.label} style={{
                    width: '33.33%',
                    padding: '10px 12px',
                    backgroundColor: i % 2 === 0 ? `${ac}25` : `${pc}10`,
                    borderRightWidth: i % 3 < 2 ? 1 : 0,
                    borderRightColor: `${pc}30`,
                    borderBottomWidth: i < 3 ? 1 : 0,
                    borderBottomColor: `${pc}30`,
                  }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: pc }}>{v.label}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>({v.unit})</Text>
                    <View style={{ marginTop: 6, borderBottomWidth: 1, borderBottomColor: `${pc}60`, minHeight: 16 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{v.value || ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Diagnosis */}
            <View style={{ borderWidth: 1, borderColor: `${ac}50`, borderLeftWidth: 4, borderLeftColor: pc, borderRadius: 4, padding: '8px 12px', marginBottom: 16, backgroundColor: `${ac}10`, flexDirection: 'row' }}>
              <Text style={{ color: pc, fontSize: 11, fontFamily: 'Helvetica-Bold' }}>DIAGNOSIS: </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginLeft: 4 }}>{diagnosis || '___________________________________'}</Text>
            </View>

            {/* Prescription Table */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: pc }}>Rx</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: pc, marginLeft: 4 }}>PRESCRIPTION MEDICINES</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: `${pc}30` }}>
              <View style={{ backgroundColor: pc, flexDirection: 'row', padding: '6px 8px' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '5%' }}>#</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '40%' }}>Medicine (Strength)</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '15%', textAlign: 'center' }}>Dosage</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '20%', textAlign: 'center' }}>Frequency</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '10%', textAlign: 'center' }}>Duration</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '10%', textAlign: 'center' }}>Qty</Text>
              </View>
              {(filledMeds.length > 0 ? filledMeds : Array.from({ length: 4 }, () => ({ name: '', strength: '', form: '', frequency: '', duration: '' }))).map((med, idx) => (
                <View key={idx} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#fff' : `${ac}10`, borderBottomWidth: 1, borderBottomColor: `${pc}15`, padding: '6px 8px', minHeight: 24 }}>
                  <Text style={{ color: pc, fontSize: 10, fontFamily: 'Helvetica-Bold', width: '5%' }}>{idx + 1}</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', width: '40%' }}>{med.name}{med.strength ? ` ${med.strength}` : ''}</Text>
                  <Text style={{ fontSize: 10, width: '15%', textAlign: 'center' }}>{med.form || ''}</Text>
                  <Text style={{ fontSize: 10, width: '20%', textAlign: 'center' }}>{med.frequency || ''}</Text>
                  <Text style={{ fontSize: 10, width: '10%', textAlign: 'center' }}>{med.duration || ''}</Text>
                  <Text style={{ fontSize: 10, width: '10%', textAlign: 'center' }}></Text>
                </View>
              ))}
            </View>

            {/* Cardiac Investigations */}
            <View style={{ borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: '8px 12px', marginTop: 16 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 8, textTransform: 'uppercase' }}>Cardiac Investigations</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {['ECG', 'ECHO (TTE)', 'TMT', 'Holter', 'Lipid Profile', 'HbA1c', 'CBC', 'LFT/KFT'].map((test, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: `${pc}60`, marginRight: 4 }} />
                    <Text style={{ fontSize: 10, color: '#374151' }}>{test}</Text>
                  </View>
                ))}
                {labTests && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: `${pc}60`, marginRight: 4 }} />
                    <Text style={{ fontSize: 10, color: '#374151' }}>{labTests}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Advice */}
            {advice && (
              <View style={{ marginTop: 12, flexDirection: 'row' }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: pc }}>Lifestyle Advice: </Text>
                <Text style={{ fontSize: 10, color: '#374151' }}>{advice}</Text>
              </View>
            )}

            {/* Footer / Signature */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
              <Text style={{ fontSize: 10, color: '#64748b' }}>Follow-up Date: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{followUpDate || '______________'}</Text></Text>
              <SigBlock />
            </View>
          </View>
          
          <View style={{ backgroundColor: pc, padding: '6px 24px', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: 9 }}>{doctor.clinicName || ''}</Text>
            <Text style={{ color: '#fff', fontSize: 9 }}>prescriptionmaker.in</Text>
          </View>

          <CanvasOverlay />
        </Page>
      </Document>
    )
  }
  // ─── 4. SOAP CLINICAL NOTES ──────────────────────────────────────────────
  if (templateSlug === 'soap-clinical') {
    const soapBlock = (letter: string, title: string, color: string, children: React.ReactNode) => (
      <View style={{ marginBottom: 12, borderWidth: 1, borderColor: `${color}30`, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ backgroundColor: color, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#ffffff20', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 11 }}>{letter}</Text>
          </View>
          <Text style={{ fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 }}>
            {title}
          </Text>
        </View>
        <View style={{ padding: 10 }}>
          {children}
        </View>
      </View>
    )

    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b', padding: 30, backgroundColor: bgColor }}>
          {/* Header */}
          <View style={{ backgroundColor: '#312e81', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {doctor.logoUrl ? (
                <Image src={doctor.logoUrl} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', padding: 2 }} />
              ) : null}
              <View>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>Dr. {doctor.name || 'Doctor Name'}</Text>
                <Text style={{ fontSize: 8, color: '#c7d2fe', marginTop: 2 }}>{doctor.qualifications} · {doctor.specialization}</Text>
                {doctor.registrationNumber ? <Text style={{ fontSize: 7, color: '#818cf8', marginTop: 1 }}>Reg: {doctor.registrationNumber}</Text> : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#818cf8' }}>{doctor.clinicName}</Text>
              {doctor.phone ? <Text style={{ fontSize: 8, color: '#c7d2fe', marginTop: 2 }}>{doctor.phone}</Text> : null}
              {doctor.address ? <Text style={{ fontSize: 7, color: '#c7d2fe', marginTop: 1 }}>{doctor.address}</Text> : null}
            </View>
          </View>

          {/* Patient Bar */}
          <View style={{ backgroundColor: '#f1f5f9', padding: 8, flexDirection: 'row', justifyContent: 'space-between', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontSize: 8, color: '#64748b' }}>Patient: <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b', fontSize: 9 }}>{patient.name || '___________'}</Text></Text>
              <Text style={{ fontSize: 8, color: '#64748b' }}>Age/Sex: <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{[patient.age, patient.gender].filter(Boolean).join(' / ') || '____'}</Text></Text>
            </View>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Date: <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{date || new Date().toLocaleDateString('en-IN')}</Text></Text>
          </View>

          {/* S - Subjective */}
          {soapBlock('S', 'Subjective — Chief Complaint & History', '#8b5cf6', 
            <Text style={{ fontSize: 9, color: '#374151' }}>{diagnosis || 'Acute presentation...'}</Text>
          )}

          {/* O - Objective */}
          {soapBlock('O', 'Objective — Vitals & Examination Findings', '#1d4ed8', 
            <View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                {[
                  { label: 'BP', value: vitals.bloodPressure },
                  { label: 'HR (bpm)', value: vitals.pulse },
                  { label: 'Temp (°F)', value: vitals.temperature },
                  { label: 'SpO₂ (%)', value: vitals.spo2 },
                  { label: 'Weight (kg)', value: vitals.weight },
                  { label: 'RR (/min)', value: vitals.respiratoryRate }
                ].map((v) => (
                  <View key={v.label} style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#eff6ff', flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 7, color: '#94a3b8', marginRight: 4 }}>{v.label}:</Text>
                    {v.value ? (
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{v.value}</Text>
                    ) : (
                      <View style={{ width: 24, borderBottomWidth: 1, borderBottomColor: '#94a3b8' }} />
                    )}
                  </View>
                ))}
              </View>
              <Text style={{ fontSize: 9, color: chiefComplaint ? '#374151' : '#d1d5db', marginTop: 4 }}>
                {chiefComplaint || 'Examination findings...'}
              </Text>
            </View>
          )}

          {/* A - Assessment */}
          {soapBlock('A', 'Assessment — Diagnosis', '#065f46', 
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' }}>{diagnosis || 'Primary Diagnosis'}</Text>
          )}

          {/* P - Plan */}
          {soapBlock('P', 'Plan — Medications, Investigations & Advice', pc, 
            <View>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 4 }}>℞ Medications</Text>
              
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4, marginBottom: 4 }}>
                <Text style={{ flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#475569' }}>Drug</Text>
                <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#475569', textAlign: 'center' }}>Dose & Freq</Text>
                <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#475569', textAlign: 'center' }}>Duration</Text>
              </View>
              
              {medicines.filter(m => m.name).length > 0 ? medicines.filter(m => m.name).map((med, idx) => (
                <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <Text style={{ flex: 2, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{med.name} {med.strength ? ` ${med.strength}` : ''}</Text>
                  <Text style={{ flex: 1, fontSize: 8.5, color: '#475569', textAlign: 'center' }}>{med.form || ''} {med.frequency ? ` ${med.frequency}` : ''}</Text>
                  <Text style={{ flex: 1, fontSize: 8.5, color: '#475569', textAlign: 'center' }}>{med.duration || '—'}</Text>
                </View>
              )) : (
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <Text style={{ flex: 2, fontSize: 8.5, color: '#1e293b' }}>-</Text><Text style={{ flex: 1, fontSize: 8.5, color: '#475569', textAlign: 'center' }}>-</Text><Text style={{ flex: 1, fontSize: 8.5, color: '#475569', textAlign: 'center' }}>-</Text>
                </View>
              )}

              {labTests ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc }}>Investigations: <Text style={{ fontFamily: 'Helvetica', color: '#374151' }}>{labTests}</Text></Text>
                </View>
              ) : null}

              {advice ? (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc }}>Advice: <Text style={{ fontFamily: 'Helvetica', color: '#374151' }}>{advice}</Text></Text>
                </View>
              ) : null}
              
              {followUpDate ? (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc }}>Follow-up: <Text style={{ fontFamily: 'Helvetica', color: '#374151' }}>{followUpDate}</Text></Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
            <SigBlock />
          </View>
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }

  // ─── DETAILED DRUG CHART ───────────────────────────────────────────────
  if (slug === 'detailed-drug-chart') {
    return (
      <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 10, backgroundColor: bgColor }}>
          {/* Header */}
          <View style={{ backgroundColor: pc, color: '#fff', padding: '16px 24px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {doctor.logoUrl && (
                <Image src={doctor.logoUrl} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 24, backgroundColor: '#fff', padding: 2, marginRight: 16 }} />
              )}
              <View>
                <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}>{doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}</Text>
                <Text style={{ fontSize: 11, color: ac, marginTop: 4 }}>{[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {doctor.clinicName && <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{doctor.clinicName}</Text>}
              {doctor.phone && <Text style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{doctor.phone}</Text>}
              {doctor.address && <Text style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{doctor.address}</Text>}
            </View>
          </View>

          <View style={{ padding: '14px 24px', flex: 1 }}>
            {/* Patient + Diagnosis row */}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 2, backgroundColor: '#fff', borderWidth: 1, borderColor: `${pc}30`, borderRadius: 4, padding: '8px 12px', marginRight: 12 }}>
                <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Patient</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{patient.name || '______________________'}</Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  {[patient.age ? `Age ${patient.age}` : '', patient.gender].filter(Boolean).join(' · ')}  · Date: {today}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: `${ac}15`, borderWidth: 1, borderColor: `${ac}40`, borderRadius: 4, padding: '8px 12px' }}>
                <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Diagnosis</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: pc }}>{diagnosis || '____________________'}</Text>
              </View>
            </View>

            {/* Rx heading */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: pc, marginRight: 8 }}>Rx</Text>
              <View style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: `${pc}30` }} />
            </View>

            {/* Individual drug cards */}
            {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
              <View key={idx} style={{ borderWidth: 1, borderColor: `${pc}30`, borderLeftWidth: 4, borderLeftColor: pc, borderRadius: 4, marginBottom: 12 }}>
                <View style={{ backgroundColor: `${pc}10`, padding: '6px 12px', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: pc, width: 24, textAlign: 'center' }}>{idx + 1}</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginLeft: 8 }}>{med.name}</Text>
                  {med.strength && (
                    <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, color: '#64748b' }}>{med.strength}</Text>
                    </View>
                  )}
                  {med.form && (
                    <View style={{ backgroundColor: `${ac}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, color: ac }}>{med.form}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: `${pc}15` }}>
                  {[
                    { label: 'Route', val: 'Oral' },
                    { label: 'Frequency', val: med.frequency || '—' },
                    { label: 'Timing', val: med.timing || '—' },
                    { label: 'Duration', val: med.duration || '—' },
                  ].map((f, i) => (
                    <View key={i} style={{ flex: 1, padding: '6px 8px', borderRightWidth: i < 3 ? 1 : 0, borderRightColor: `${pc}15` }}>
                      <Text style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' }}>{f.label}</Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151', marginTop: 4 }}>{f.val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )) : (
              <View>
                {[1, 2, 3, 4].map(n => (
                  <View key={n} style={{ borderWidth: 1, borderColor: `${pc}20`, borderLeftWidth: 4, borderLeftColor: `${pc}40`, borderRadius: 4, marginBottom: 12, height: 60, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: `${pc}40`, marginRight: 12 }}>{n}</Text>
                    <Text style={{ color: '#e2e8f0', fontSize: 12 }}>__________________________</Text>
                  </View>
                ))}
              </View>
            )}

            {labTests && (
              <View style={{ borderWidth: 1, borderColor: `${ac}40`, borderRadius: 4, padding: '8px 12px', marginBottom: 12, backgroundColor: `${ac}10` }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', marginBottom: 4 }}>Lab Investigations</Text>
                <Text style={{ color: '#374151', fontSize: 11 }}>{labTests}</Text>
              </View>
            )}

            {advice && (
              <View style={{ borderWidth: 1, borderColor: `${pc}20`, borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', marginBottom: 4 }}>Advice</Text>
                <Text style={{ color: '#374151', fontSize: 11 }}>{advice}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
              {followUpDate ? <Text style={{ fontSize: 11, color: '#64748b' }}>Follow-up: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{followUpDate}</Text></Text> : <Text />}
              <SigBlock />
            </View>
          </View>
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }
  // ─── DEFAULT PDF (for all other premium templates) ─────────────────────
  return (
    <Document title={`Prescription — ${patient.name ?? 'Patient'}`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
      <Page size="A4" style={[S.page, { backgroundColor: bgColor }]}>
        {/* Colored header band */}
        <View style={[S.headerBand, { backgroundColor: pc, paddingVertical: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {doctor.logoUrl ? (
              <Image src={doctor.logoUrl} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 16 }} />
            ) : (
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: ac }}>Rx</Text>
            )}
            <View>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>
                {doctor.name ? `Dr. ${doctor.name}` : 'Dr. [Name]'}
              </Text>
              <Text style={{ fontSize: 7.5, color: ac }}>
                {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {doctor.clinicName ? <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff' }}>{doctor.clinicName}</Text> : null}
            {doctor.registrationNumber ? <Text style={{ fontSize: 7, color: ac }}>Reg: {doctor.registrationNumber}</Text> : null}
            {doctor.phone ? <Text style={{ fontSize: 7, color: '#e2e8f0' }}>{doctor.phone}</Text> : null}
            {doctor.address ? <Text style={{ fontSize: 7, color: '#cbd5e1' }}>{doctor.address}</Text> : null}
          </View>
        </View>

        <PatientStrip />

        <Sections />

        <View style={S.footer}>
          <Text style={S.footerText}>{templateName} · prescriptionmaker.in · For documentation purposes only</Text>
          <SigBlock />
        </View>
        <CanvasOverlay />
      </Page>
    </Document>
  )
}
