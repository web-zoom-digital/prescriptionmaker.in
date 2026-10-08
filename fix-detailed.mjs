import fs from 'fs';
const file = 'apps/web/src/lib/pdf/prescription-document.tsx';
let content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

const newCode = `  // ─── DETAILED DRUG CHART ───────────────────────────────────────────────
  if (slug === 'detailed-drug-chart') {
    return (
      <Document title={\`Prescription — \${patient.name ?? 'Patient'}\`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 10, backgroundColor: bgColor }}>
          {/* Header */}
          <View style={{ backgroundColor: pc, color: '#fff', padding: '16px 24px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {doctor.logoUrl && (
                <Image src={doctor.logoUrl} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 24, backgroundColor: '#fff', padding: 2, marginRight: 16 }} />
              )}
              <View>
                <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}>{doctor.name ? \`Dr. \${doctor.name}\` : 'Dr. [Name]'}</Text>
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
              <View style={{ flex: 2, backgroundColor: '#fff', borderWidth: 1, borderColor: \`\${pc}30\`, borderRadius: 4, padding: '8px 12px', marginRight: 12 }}>
                <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Patient</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{patient.name || '______________________'}</Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  {[patient.age ? \`Age \${patient.age}\` : '', patient.gender].filter(Boolean).join(' · ')}  · Date: {today}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: \`\${ac}15\`, borderWidth: 1, borderColor: \`\${ac}40\`, borderRadius: 4, padding: '8px 12px' }}>
                <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Diagnosis</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: pc }}>{diagnosis || '____________________'}</Text>
              </View>
            </View>

            {/* Rx heading */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 24, fontFamily: 'Georgia-Bold', color: pc, marginRight: 8 }}>Rx</Text>
              <View style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: \`\${pc}30\` }} />
            </View>

            {/* Individual drug cards */}
            {filledMeds.length > 0 ? filledMeds.map((med, idx) => (
              <View key={idx} style={{ borderWidth: 1, borderColor: \`\${pc}30\`, borderLeftWidth: 4, borderLeftColor: pc, borderRadius: 4, marginBottom: 12 }}>
                <View style={{ backgroundColor: \`\${pc}10\`, padding: '6px 12px', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: pc, width: 24, textAlign: 'center' }}>{idx + 1}</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginLeft: 8 }}>{med.name}</Text>
                  {med.strength && (
                    <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, color: '#64748b' }}>{med.strength}</Text>
                    </View>
                  )}
                  {med.form && (
                    <View style={{ backgroundColor: \`\${ac}20\`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, color: ac }}>{med.form}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: \`\${pc}15\` }}>
                  {[
                    { label: 'Route', val: 'Oral' },
                    { label: 'Frequency', val: med.frequency || '—' },
                    { label: 'Timing', val: med.timing || '—' },
                    { label: 'Duration', val: med.duration || '—' },
                  ].map((f, i) => (
                    <View key={i} style={{ flex: 1, padding: '6px 8px', borderRightWidth: i < 3 ? 1 : 0, borderRightColor: \`\${pc}15\` }}>
                      <Text style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' }}>{f.label}</Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151', marginTop: 4 }}>{f.val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )) : (
              <View>
                {[1, 2, 3, 4].map(n => (
                  <View key={n} style={{ borderWidth: 1, borderColor: \`\${pc}20\`, borderLeftWidth: 4, borderLeftColor: \`\${pc}40\`, borderRadius: 4, marginBottom: 12, height: 60, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: \`\${pc}40\`, marginRight: 12 }}>{n}</Text>
                    <Text style={{ color: '#e2e8f0', fontSize: 12 }}>__________________________</Text>
                  </View>
                ))}
              </View>
            )}

            {labTests && (
              <View style={{ borderWidth: 1, borderColor: \`\${ac}40\`, borderRadius: 4, padding: '8px 12px', marginBottom: 12, backgroundColor: \`\${ac}10\` }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: pc, textTransform: 'uppercase', marginBottom: 4 }}>Lab Investigations</Text>
                <Text style={{ color: '#374151', fontSize: 11 }}>{labTests}</Text>
              </View>
            )}

            {advice && (
              <View style={{ borderWidth: 1, borderColor: \`\${pc}20\`, borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
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
  }`;

// Find where "DEFAULT PDF" starts
const defaultIndex = lines.findIndex(line => line.includes('DEFAULT PDF'));
lines.splice(defaultIndex, 0, newCode);
fs.writeFileSync(file, lines.join('\n'));
