/**
 * PrescriptionDocument — @react-pdf/renderer document
 *
 * This renders the prescription as a proper PDF using React PDF primitives.
 * It is used in the server-side API route to generate a PDF buffer.
 *
 * Key decisions:
 * - Uses built-in Helvetica font for compatibility (no custom font download needed at runtime)
 * - Inline styles only (React PDF doesn't support CSS classes)
 * - Template colors are passed as props from the template config
 * - Designed to produce an exact A4 layout matching the browser preview
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

// Use built-in PDF fonts — avoids network font loading issues on server
// Helvetica is the closest built-in to Inter for medical documents
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 700 },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  doctorSub: {
    fontSize: 8,
    color: '#475569',
    marginTop: 1,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
    marginBottom: 6,
  },
  label: {
    color: '#64748b',
    fontSize: 8,
  },
  value: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  rxHeader: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 2,
  },
  medicinesContainer: {
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
    paddingLeft: 8,
    marginBottom: 8,
  },
  medicineItem: {
    marginBottom: 7,
  },
  medicineName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#1e293b',
  },
  medicineDosage: {
    fontSize: 8,
    color: '#475569',
    marginTop: 1,
    paddingLeft: 8,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 2,
    marginTop: 8,
  },
  sectionBody: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
  signatureBox: {
    alignItems: 'flex-end',
  },
  signatureLabel: {
    fontSize: 7,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 14,
  },
  signatureLine: {
    width: 70,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#cbd5e1',
  },
})

export interface PrescriptionDocumentProps {
  templateName: string
  primaryColor: string
  accentColor: string
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
  templateName,
  primaryColor,
  accentColor,
  layout,
  doctor,
  patient,
  diagnosis,
  medicines,
  labTests,
  advice,
  followUpDate,
  date,
}: PrescriptionDocumentProps) {
  const today =
    date ??
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const filledMedicines = medicines.filter((m) => m.name?.trim())

  return (
    <Document
      title={`Prescription — ${patient.name ?? 'Patient'} — ${today}`}
      author={doctor.name ?? 'PrescriptionMaker'}
      creator="PrescriptionMaker (prescriptionmaker.in)"
      producer="PrescriptionMaker"
      subject="Medical Prescription"
      keywords="prescription, medical, doctor"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Doctor Header ── */}
        <View style={[styles.header, { borderBottomColor: primaryColor }]}>
          {layout === 'two-column' ? (
            <View style={styles.headerTwoCol}>
              <View>
                <Text style={[styles.doctorName, { color: primaryColor }]}>
                  {doctor.name || 'Dr. [Name]'}
                </Text>
                <Text style={styles.doctorSub}>
                  {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {doctor.registrationNumber ? (
                  <Text style={styles.doctorSub}>Reg. No: {doctor.registrationNumber}</Text>
                ) : null}
                {doctor.phone ? <Text style={styles.doctorSub}>{doctor.phone}</Text> : null}
              </View>
            </View>
          ) : (
            <View>
              <Text style={[styles.doctorName, { color: primaryColor }]}>
                {doctor.name || 'Dr. [Name]'}
              </Text>
              <Text style={styles.doctorSub}>
                {[doctor.qualifications, doctor.specialization].filter(Boolean).join(' · ')}
              </Text>
              {doctor.registrationNumber ? (
                <Text style={[styles.doctorSub, { fontSize: 7 }]}>
                  Reg. No: {doctor.registrationNumber}
                </Text>
              ) : null}
              {doctor.clinicName || doctor.address || doctor.phone ? (
                <Text style={[styles.doctorSub, { fontSize: 7, marginTop: 1 }]}>
                  {[doctor.clinicName, doctor.address, doctor.phone].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* ── Patient & Date ── */}
        <View style={styles.patientRow}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Text>
              <Text style={styles.label}>Patient: </Text>
              <Text style={styles.value}>{patient.name || '_____________________'}</Text>
            </Text>
            {(patient.age || patient.gender) ? (
              <Text>
                <Text style={styles.label}>Age: </Text>
                <Text style={styles.value}>
                  {patient.age ? `${patient.age}Y` : '___'}
                  {patient.gender ? ` / ${patient.gender.charAt(0).toUpperCase()}` : ''}
                </Text>
              </Text>
            ) : null}
          </View>
          <Text>
            <Text style={styles.label}>Date: </Text>
            <Text style={styles.value}>{today}</Text>
          </Text>
        </View>

        {/* ── Diagnosis ── */}
        {diagnosis ? (
          <View style={{ marginBottom: 6 }}>
            <Text>
              <Text style={styles.label}>Diagnosis: </Text>
              <Text style={styles.value}>{diagnosis}</Text>
            </Text>
          </View>
        ) : null}

        {/* ── Rx ── */}
        <Text style={[styles.rxHeader, { color: primaryColor }]}>Rx</Text>

        {filledMedicines.length > 0 ? (
          <View style={[styles.medicinesContainer, { borderLeftColor: accentColor }]}>
            {filledMedicines.map((med, idx) => (
              <View key={idx} style={styles.medicineItem}>
                <Text style={styles.medicineName}>
                  {`${idx + 1}. ${med.name ?? ''}${med.strength ? ' ' + med.strength : ''}${med.form ? ` (${med.form})` : ''}`}
                </Text>
                <Text style={styles.medicineDosage}>
                  {[med.frequency, med.timing, med.duration].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 8, paddingLeft: 8 }}>
            No medicines
          </Text>
        )}

        {/* ── Lab Tests ── */}
        {labTests ? (
          <View style={{ marginTop: 4 }}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>Investigations:</Text>
            <Text style={styles.sectionBody}>{labTests}</Text>
          </View>
        ) : null}

        {/* ── Advice ── */}
        {advice ? (
          <View style={{ marginTop: 4 }}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>Advice:</Text>
            <Text style={styles.sectionBody}>{advice}</Text>
          </View>
        ) : null}

        {/* ── Follow-up ── */}
        {followUpDate ? (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.sectionBody}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Follow-up: </Text>
              {followUpDate}
            </Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {templateName} · prescriptionmaker.in · For documentation purposes only
          </Text>
          <View style={styles.signatureBox}>
            {doctor.signatureUrl ? (
              <Image src={doctor.signatureUrl} style={{ width: 80, height: 40, objectFit: 'contain' }} />
            ) : null}
            <Text style={[styles.signatureLabel, doctor.signatureUrl ? { marginTop: 4 } : {}]}>Doctor&apos;s Signature</Text>
            {!doctor.signatureUrl && <View style={styles.signatureLine} />}
          </View>
        </View>
      </Page>
    </Document>
  )
}
