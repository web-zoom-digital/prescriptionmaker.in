import fs from 'fs';
const file = 'apps/web/src/lib/pdf/prescription-document.tsx';
let content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

const newVitalsFirst = `  if (slug === 'vitals-first') {
    return (
      <Document title={\`Prescription — \${patient.name ?? 'Patient'}\`} author={doctor.name ?? 'PrescriptionMaker'} creator="PrescriptionMaker" producer="PrescriptionMaker">
        <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 10, backgroundColor: bgColor }}>
          {/* Header */}
          <View style={{ backgroundColor: pc, color: '#fff', padding: '16px 24px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}>{doctor.name ? \`Dr. \${doctor.name}\` : 'Dr. [Name]'}</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: \`\${pc}30\`, borderRadius: 4, padding: '8px 12px', marginBottom: 16 }}>
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
                    backgroundColor: i % 2 === 0 ? \`\${ac}25\` : \`\${pc}10\`,
                    borderRightWidth: i % 3 < 2 ? 1 : 0,
                    borderRightColor: \`\${pc}30\`,
                    borderBottomWidth: i < 3 ? 1 : 0,
                    borderBottomColor: \`\${pc}30\`,
                  }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: pc }}>{v.label}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>({v.unit})</Text>
                    <View style={{ marginTop: 6, borderBottomWidth: 1, borderBottomColor: \`\${pc}60\`, minHeight: 16 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{v.value || ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Diagnosis */}
            <View style={{ borderWidth: 1, borderColor: \`\${ac}50\`, borderLeftWidth: 4, borderLeftColor: pc, borderRadius: 4, padding: '8px 12px', marginBottom: 16, backgroundColor: \`\${ac}10\`, flexDirection: 'row' }}>
              <Text style={{ color: pc, fontSize: 11, fontFamily: 'Helvetica-Bold' }}>DIAGNOSIS: </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginLeft: 4 }}>{diagnosis || '___________________________________'}</Text>
            </View>

            {/* Prescription Table */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: pc }}>Rx</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: pc, marginLeft: 4 }}>PRESCRIPTION MEDICINES</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: \`\${pc}30\` }}>
              <View style={{ backgroundColor: pc, flexDirection: 'row', padding: '6px 8px' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '5%' }}>#</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '40%' }}>Medicine (Strength)</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '15%', textAlign: 'center' }}>Dosage</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '20%', textAlign: 'center' }}>Frequency</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '10%', textAlign: 'center' }}>Duration</Text>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', width: '10%', textAlign: 'center' }}>Qty</Text>
              </View>
              {(filledMeds.length > 0 ? filledMeds : Array.from({ length: 4 }, () => ({ name: '', strength: '', form: '', frequency: '', duration: '' }))).map((med, idx) => (
                <View key={idx} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#fff' : \`\${ac}10\`, borderBottomWidth: 1, borderBottomColor: \`\${pc}15\`, padding: '6px 8px', minHeight: 24 }}>
                  <Text style={{ color: pc, fontSize: 10, fontFamily: 'Helvetica-Bold', width: '5%' }}>{idx + 1}</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', width: '40%' }}>{med.name}{med.strength ? \` \${med.strength}\` : ''}</Text>
                  <Text style={{ fontSize: 10, width: '15%', textAlign: 'center' }}>{med.form || ''}</Text>
                  <Text style={{ fontSize: 10, width: '20%', textAlign: 'center' }}>{med.frequency || ''}</Text>
                  <Text style={{ fontSize: 10, width: '10%', textAlign: 'center' }}>{med.duration || ''}</Text>
                  <Text style={{ fontSize: 10, width: '10%', textAlign: 'center' }}></Text>
                </View>
              ))}
            </View>

            {/* Cardiac Investigations */}
            <View style={{ borderWidth: 1, borderColor: \`\${pc}30\`, borderRadius: 4, padding: '8px 12px', marginTop: 16 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: pc, marginBottom: 8, textTransform: 'uppercase' }}>Cardiac Investigations</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {['ECG', 'ECHO (TTE)', 'TMT', 'Holter', 'Lipid Profile', 'HbA1c', 'CBC', 'LFT/KFT'].map((test, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: \`\${pc}60\`, marginRight: 4 }} />
                    <Text style={{ fontSize: 10, color: '#374151' }}>{test}</Text>
                  </View>
                ))}
                {labTests && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: \`\${pc}60\`, marginRight: 4 }} />
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
  }`;

lines.splice(818, 922 - 818 + 1, newVitalsFirst);
fs.writeFileSync(file, lines.join('\n'));
