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
    name?: string
    qualifications?: string
    specialization?: string
    registrationNumber?: string
    clinicName?: string
    phone?: string
    address?: string
    signatureUrl?: string
  }
  patient: {
    name?: string
    age?: string
    gender?: string
  }
  diagnosis?: string
  medicines: Array<{
    name?: string
    strength?: string
    form?: string
    frequency?: string
    timing?: string
    duration?: string
  }>
  labTests?: string
  advice?: string
  followUpDate?: string
  date?: string
}

export function PrescriptionDocument({
  templateName, templateSlug, primaryColor: pc, accentColor: ac, bgColor = '#ffffff',
  layout, doctor, patient, diagnosis, medicines, labTests, advice, followUpDate, date,
}: PrescriptionDocumentProps) {
  const today = date ?? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const filledMeds = medicines.filter(m => m.name?.trim())
  const slug = templateSlug || layout

  // Shared: Signature block
  const SigBlock = () => (
    <View style={S.sigBox}>
      {doctor.signatureUrl
        ? <Image src={doctor.signatureUrl} style={{ width: 75, height: 35, objectFit: 'contain' }} />
        : <View style={S.sigLine} />}
      <Text style={S.sigLabel}>Doctor&apos;s Signature</Text>
      {doctor.name && <Text style={{ fontSize: 7, color: '#475569', marginTop: 1 }}>Dr. {doctor.name}</Text>}
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

  const GridRow = ({ fields }: { fields: { label: string; value?: string }[] }) => (
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
            <GridRow fields={[{ label: 'Health Insurance No.', value: '' }, { label: 'Health Care Provider', value: '' }]} />
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
            <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: ac }}>Rx</Text>
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
      </Page>
    </Document>
  )
}
