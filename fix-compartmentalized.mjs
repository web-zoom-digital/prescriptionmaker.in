import fs from 'fs'

const code = `
  // ─── COMPARTMENTALIZED GRID ──────────────────────────────────────────────
  if (slug === 'compartmentalized-grid') {
    return (
      <Document title={\`Prescription — \${patient.name ?? 'Patient'}\`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 9.5, backgroundColor: bgColor }}>
          {/* Doctor header with corporate split */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 3, borderBottomColor: pc }}>
            <View style={{ flex: 1, backgroundColor: pc, color: '#fff', padding: '12px 16px' }}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold' }}>{doctor.name ? \`Dr. \${doctor.name}\` : 'Dr. [Name]'}</Text>
              <Text style={{ fontSize: 8.5, color: ac, marginTop: 2 }}>{doctor.qualifications || ''} {doctor.specialization || ''}</Text>
              {doctor.registrationNumber ? <Text style={{ fontSize: 8, opacity: 0.7, marginTop: 2 }}>Reg: {doctor.registrationNumber}</Text> : null}
            </View>
            <View style={{ flex: 1, padding: '12px 16px', backgroundColor: '#fff', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: pc, textAlign: 'right' }}>{doctor.clinicName || 'Medical Centre'}</Text>
              {doctor.address ? <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2, textAlign: 'right' }}>{doctor.address}</Text> : null}
              {doctor.phone ? <Text style={{ fontSize: 8, color: '#64748b', textAlign: 'right' }}>{doctor.phone}</Text> : null}
            </View>
          </View>

          {/* 3-column patient bar */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: pc }}>
            <View style={{ flex: 1, padding: '7px 12px', backgroundColor: \`\${pc}10\`, borderRightWidth: 1, borderRightColor: \`\${pc}30\` }}>
              <Text style={{ fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>Patient Name</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 }}>{patient.name || '____________________'}</Text>
            </View>
            <View style={{ flex: 1, padding: '7px 12px', backgroundColor: \`\${ac}10\`, borderRightWidth: 1, borderRightColor: \`\${pc}30\` }}>
              <Text style={{ fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>Age / Sex</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 }}>{[patient.age, patient.gender].filter(Boolean).join(' / ') || '______'}</Text>
            </View>
            <View style={{ flex: 1, padding: '7px 12px', backgroundColor: '#fff' }}>
              <Text style={{ fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>Date</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 }}>{today}</Text>
            </View>
          </View>

          {/* Chief Complaint band */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: \`\${pc}30\`, padding: '6px 14px', backgroundColor: \`\${pc}07\`, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', letterSpacing: 0.5 }}>Chief Complaint: </Text>
            <Text style={{ fontSize: 9.5, color: '#374151' }}>{chiefComplaint || '_______________________________________________'}</Text>
          </View>

          {/* Diagnosis band */}
          <View style={{ backgroundColor: pc, color: '#fff', padding: '5px 14px', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8 }}>Diagnosis: </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{diagnosis || '___________________________________'}</Text>
          </View>

          {/* Rx grid table */}
          <View style={{ padding: '10px 14px' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: pc }}>Rx</Text>
              <View style={{ flex: 1, height: 2, backgroundColor: \`\${pc}30\`, marginLeft: 6 }}></View>
            </View>

            <View style={{ width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: \`\${pc}30\` }}>
              {/* Table Header */}
              <View style={{ flexDirection: 'row', backgroundColor: ac }}>
                <Text style={{ padding: '5px 8px', color: '#fff', width: '38%', fontSize: 8.5 }}>Medicine / Drugs</Text>
                <Text style={{ padding: '5px 8px', color: '#fff', width: '15%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' }}>Unit</Text>
                <Text style={{ padding: '5px 8px', color: '#fff', width: '22%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' }}>Frequency</Text>
                <Text style={{ padding: '5px 8px', color: '#fff', width: '13%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' }}>Duration</Text>
                <Text style={{ padding: '5px 8px', color: '#fff', width: '12%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' }}>Qty</Text>
              </View>
              {/* Table Body */}
              {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
                <View key={idx} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#fff' : \`\${ac}12\`, borderBottomWidth: 1, borderBottomColor: \`\${pc}15\` }}>
                  <Text style={{ padding: '5px 8px', width: '38%', fontSize: 8.5 }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{idx + 1}. {med.name}</Text>{med.strength ? \` — \${med.strength}\` : null}</Text>
                  <Text style={{ padding: '5px 8px', width: '15%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: \`\${pc}12\` }}>{med.form || '—'}</Text>
                  <Text style={{ padding: '5px 8px', width: '22%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: \`\${pc}12\` }}>{med.frequency ? med.frequency : '—'}</Text>
                  <Text style={{ padding: '5px 8px', width: '13%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: \`\${pc}12\` }}>{med.duration || '—'}</Text>
                  <Text style={{ padding: '5px 8px', width: '12%', fontSize: 8.5, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: \`\${pc}12\` }}> </Text>
                </View>
              )) : Array.from({ length: 6 }).map((_, idx) => (
                <View key={idx} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#fff' : \`\${ac}08\`, borderBottomWidth: 1, borderBottomColor: \`\${pc}10\` }}>
                  <Text style={{ padding: '6px 8px', width: '38%', fontSize: 8.5 }}> </Text>
                  <Text style={{ padding: '6px 8px', width: '15%', fontSize: 8.5, borderLeftWidth: 1, borderLeftColor: \`\${pc}10\` }}> </Text>
                  <Text style={{ padding: '6px 8px', width: '22%', fontSize: 8.5, borderLeftWidth: 1, borderLeftColor: \`\${pc}10\` }}> </Text>
                  <Text style={{ padding: '6px 8px', width: '13%', fontSize: 8.5, borderLeftWidth: 1, borderLeftColor: \`\${pc}10\` }}> </Text>
                  <Text style={{ padding: '6px 8px', width: '12%', fontSize: 8.5, borderLeftWidth: 1, borderLeftColor: \`\${pc}10\` }}> </Text>
                </View>
              ))}
            </View>

            {/* 2-column footer: Advice | Follow-up + Signature */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: \`\${ac}40\`, borderRadius: 4, padding: '6px 10px' }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: ac, textTransform: 'uppercase', marginBottom: 3 }}>Advice</Text>
                <Text style={{ color: '#374151', fontSize: 8.5, minHeight: 18 }}>{advice || ''}</Text>
                {labTests ? (
                  <Text style={{ marginTop: 4, fontSize: 8.5 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: '#64748b' }}>Tests: </Text>{labTests}
                  </Text>
                ) : null}
              </View>
              <View style={{ flex: 1, borderWidth: 1, borderColor: \`\${pc}30\`, borderRadius: 4, padding: '6px 10px', flexDirection: 'column', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', marginBottom: 3 }}>Follow-up</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151' }}>{followUpDate || '_______________'}</Text>
                </View>
                <SigBlock />
              </View>
            </View>
          </View>

          {/* Footer band */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: pc, padding: '4px 14px', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: ac, fontSize: 7.5 }}>{doctor.clinicName || ''}</Text>
            <Text style={{ color: ac, fontSize: 7.5 }}>prescriptionmaker.in</Text>
          </View>
          <CanvasOverlay />
        </Page>
      </Document>
    )
  }
`

const targetFile = 'apps/web/src/lib/pdf/prescription-document.tsx'
const fileContent = fs.readFileSync(targetFile, 'utf8')
const splitToken = '// ─── DEFAULT PDF (for all other premium templates) ─────────────────────'

if (fileContent.includes(splitToken)) {
  const newContent = fileContent.replace(splitToken, code + '\n  ' + splitToken)
  fs.writeFileSync(targetFile, newContent)
  console.log('Successfully inserted compartmentalized-grid into pdf engine')
} else {
  console.error('split token not found')
}
