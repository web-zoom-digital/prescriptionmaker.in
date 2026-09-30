import type { Template } from './templates'

export type Medicine = {
  id: string
  name: string
  strength: string
  frequency: string
  duration: string
  instructions: string
}

export type PrescriptionData = {
  template: Template
  doctorInfo: {
    name: string
    qualification: string
    specialization: string
    regNo: string
    clinicName: string
    address: string
    phone: string
    email: string
  }
  patientInfo: {
    name: string
    age: string
    gender: string
    weight: string
    phone: string
  }
  diagnosis: string
  symptoms: string
  medicines: Medicine[]
  advice: string
  followUp: string
  labTests?: string[]
  date: string
}

export function generatePrescriptionHTML(data: PrescriptionData): string {
  const { template, doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date } = data
  const { primaryColor, accentColor, bgColor } = template.styles

  const medicineRows = medicines.map((med, i) => `
    <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#fff'};">
      <td style="padding:8px 12px; font-weight:600; color:#1e293b;">${i + 1}. ${med.name}${med.strength ? ` <span style="font-weight:400; color:#64748b;">${med.strength}</span>` : ''}</td>
      <td style="padding:8px 12px; color:#475569;">${med.frequency || '-'}</td>
      <td style="padding:8px 12px; color:#475569;">${med.duration || '-'}</td>
      <td style="padding:8px 12px; color:#64748b; font-style:italic;">${med.instructions || '-'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: ${template.styles.fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif'}; background:#fff; color:#1e293b; font-size:13px; }
    .wrapper { max-width:700px; margin:0 auto; padding:20px; }
    .header { background:${primaryColor}; color:white; padding:20px 24px; border-radius:8px 8px 0 0; }
    .doctor-name { font-size:20px; font-weight:700; letter-spacing:-0.3px; }
    .doctor-details { font-size:12px; opacity:0.85; margin-top:4px; }
    .clinic-info { font-size:11px; opacity:0.75; margin-top:6px; border-top:1px solid rgba(255,255,255,0.25); padding-top:8px; }
    .body { border:1px solid #e2e8f0; border-top:3px solid ${primaryColor}; padding:20px 24px; }
    .patient-row { display:flex; gap:16px; background:${bgColor}; padding:12px 16px; border-radius:6px; margin-bottom:16px; flex-wrap:wrap; }
    .patient-field { flex:1; min-width:130px; }
    .field-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#94a3b8; font-weight:600; }
    .field-value { font-size:13px; font-weight:600; color:#1e293b; margin-top:2px; }
    .date-label { text-align:right; font-size:11px; color:#64748b; margin-bottom:8px; }
    .section-title { font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:${primaryColor}; font-weight:700; margin:16px 0 8px; border-bottom:2px solid ${accentColor}40; padding-bottom:4px; }
    .diagnosis-box { background:#fafafa; border-left:3px solid ${primaryColor}; padding:8px 14px; border-radius:0 4px 4px 0; color:#374151; }
    .rx-symbol { font-size:28px; font-weight:900; color:${primaryColor}; margin-bottom:8px; }
    table { width:100%; border-collapse:collapse; }
    th { background:${primaryColor}; color:white; padding:9px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    td { border-bottom:1px solid #f1f5f9; }
    .advice-box { background:${bgColor}; border-radius:6px; padding:12px 16px; color:#475569; line-height:1.6; }
    .footer { background:#f8fafc; padding:12px 24px; border-radius:0 0 8px 8px; border:1px solid #e2e8f0; border-top:none; display:flex; justify-content:space-between; align-items:center; }
    .signature-line { border-top:1px solid #cbd5e1; padding-top:6px; font-size:11px; color:#64748b; text-align:center; min-width:150px; }
    .stamp { font-size:10px; color:#94a3b8; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="doctor-name">Dr. ${doctorInfo.name}</div>
    <div class="doctor-details">${doctorInfo.qualification} ${doctorInfo.specialization ? '| ' + doctorInfo.specialization : ''} ${doctorInfo.regNo ? '| Reg. No: ' + doctorInfo.regNo : ''}</div>
    <div class="clinic-info">${doctorInfo.clinicName} ${doctorInfo.address ? '| ' + doctorInfo.address : ''} ${doctorInfo.phone ? '| 📞 ' + doctorInfo.phone : ''}</div>
  </div>
  <div class="body">
    <div class="date-label">Date: ${date}</div>
    <div class="patient-row">
      <div class="patient-field"><div class="field-label">Patient Name</div><div class="field-value">${patientInfo.name}</div></div>
      <div class="patient-field"><div class="field-label">Age</div><div class="field-value">${patientInfo.age}${patientInfo.gender ? ' / ' + patientInfo.gender : ''}</div></div>
      ${patientInfo.weight ? `<div class="patient-field"><div class="field-label">Weight</div><div class="field-value">${patientInfo.weight}</div></div>` : ''}
      ${patientInfo.phone ? `<div class="patient-field"><div class="field-label">Phone</div><div class="field-value">${patientInfo.phone}</div></div>` : ''}
    </div>
    
    ${diagnosis ? `<div class="section-title">Diagnosis</div><div class="diagnosis-box">${diagnosis}</div>` : ''}
    
    <div class="section-title">Rx — Prescription</div>
    <div class="rx-symbol">℞</div>
    ${medicines.length > 0 ? `
    <table>
      <thead><tr><th>Medicine</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
      <tbody>${medicineRows}</tbody>
    </table>` : '<p style="color:#94a3b8; font-style:italic;">No medicines prescribed</p>'}
    
    ${labTests && labTests.length > 0 ? `<div class="section-title">Lab Tests & Investigations</div><ul style="padding-left: 20px; line-height:1.6; color:#374151;">${labTests.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
    
    ${advice ? `<div class="section-title">Advice & Instructions</div><div class="advice-box">${advice}</div>` : ''}
    ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">Review after: ${followUp}</div>` : ''}
  </div>
  <div class="footer">
    <div class="stamp">PrescriptionMaker.in — ${template.name} Template</div>
    <div class="signature-line">Dr. ${doctorInfo.name}<br>Signature & Stamp</div>
  </div>
</div>
</body>
</html>`
}
