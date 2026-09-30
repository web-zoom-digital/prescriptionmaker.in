import type { Template } from './templates'
import { t, type LanguageCode } from './translations'

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
  language?: LanguageCode
}

export function generatePrescriptionHTML(data: PrescriptionData): string {
  const { template, doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date } = data
  const { primaryColor, accentColor, bgColor } = template.styles

  const medicineRows = medicines.map((med, i) => `
    <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#fff'};">
      <td style="padding:8px 12px; font-weight:600; color:#1e293b;">${i + 1}. ${med.name}${med.strength ? ` <span style="font-weight:400; color:#64748b;">${med.strength}</span>` : ''}</td>
      <td style="padding:8px 12px; color:#475569;">${med.frequency ? t(med.frequency, data.language) : '-'}</td>
      <td style="padding:8px 12px; color:#475569;">${med.duration || '-'}</td>
      <td style="padding:8px 12px; color:#64748b; font-style:italic;">${med.instructions ? t(med.instructions, data.language) : '-'}</td>
    </tr>
  `).join('')

  const medTableRows = medicines.map((med, i) => `
    <tr style="background:${i % 2 === 0 ? `${primaryColor}08` : '#fff'};">
      <td style="padding:8px 12px; font-weight:600; color:#1e293b; border-bottom:1px solid ${primaryColor}20;">
        ${i + 1}. ${med.name}${med.strength ? ` <span style="font-weight:400; color:#64748b;">${med.strength}</span>` : ''}${med.form ? ` (${med.form})` : ''}
      </td>
      <td style="padding:8px 12px; color:#475569; text-align:center; border-bottom:1px solid ${primaryColor}20;">${med.form || 'Tablet'}</td>
      <td style="padding:8px 12px; color:#475569; text-align:center; border-bottom:1px solid ${primaryColor}20;">${med.frequency ? t(med.frequency, data.language) : '-'}</td>
      <td style="padding:8px 12px; color:#475569; text-align:center; border-bottom:1px solid ${primaryColor}20;">${med.duration || '-'}</td>
    </tr>
  `).join('')

  // Add empty rows if fewer than 7 meds
  const emptyRows = medicines.length < 7 ? Array.from({ length: 7 - medicines.length }, (_, i) => `
    <tr style="background:${(medicines.length + i) % 2 === 0 ? `${primaryColor}04` : '#fff'};">
      <td style="padding:8px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:8px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:8px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:8px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
    </tr>
  `).join('') : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: ${template.styles.fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif'}; background:${bgColor}; color:#1e293b; font-size:12px; }
    .page { max-width:700px; margin:0 auto; background:#fff; min-height:100vh; }
    /* Header band */
    .header { background:${primaryColor}; color:white; padding:18px 24px; display:flex; justify-content:space-between; align-items:flex-end; }
    .header-left { }
    .rx-logo { display:flex; align-items:center; gap:10px; margin-bottom:4px; }
    .rx-circle { width:42px; height:42px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; }
    .rx-circle span { font-size:20px; font-weight:900; color:${primaryColor}; font-family:Georgia,serif; }
    .clinic-name { font-size:18px; font-weight:800; letter-spacing:0.5px; }
    .doctor-name-h { font-size:13px; font-weight:700; opacity:0.95; margin-top:2px; }
    .doctor-creds { font-size:10px; color:${accentColor}; margin-top:1px; }
    .header-right { text-align:right; }
    .reg-no { font-size:10px; color:${accentColor}; }
    .date-box { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); padding:4px 14px; text-align:center; margin-top:4px; border-radius:3px; }
    .date-box-label { font-size:9px; opacity:0.8; }
    .date-box-val { font-size:11px; font-weight:600; }
    /* Body */
    .body { padding:16px 20px; }
    /* Patient grid */
    .patient-grid { border:1px solid ${primaryColor}40; border-radius:3px; margin-bottom:14px; overflow:hidden; }
    .patient-grid-title { background:${primaryColor}; color:#fff; padding:5px 10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
    .grid-row { display:flex; border-bottom:1px solid ${primaryColor}20; }
    .grid-row:last-child { border-bottom:none; }
    .grid-cell { flex:1; padding:5px 10px; border-right:1px solid ${primaryColor}20; }
    .grid-cell:last-child { border-right:none; }
    .grid-label { font-size:9px; color:#94a3b8; }
    .grid-value { font-size:11px; font-weight:600; color:#1e293b; min-height:14px; }
    /* Prescription */
    .rx-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .rx-sym { font-size:24px; font-weight:900; color:${primaryColor}; font-family:Georgia,serif; line-height:1; }
    .rx-label { font-size:13px; font-weight:700; color:${primaryColor}; text-transform:uppercase; letter-spacing:0.5px; }
    /* Drug table */
    table { width:100%; border-collapse:collapse; }
    thead tr { background:${primaryColor}; }
    th { color:#fff; padding:8px 12px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; }
    th:not(:first-child) { text-align:center; }
    td { vertical-align:middle; }
    /* Sections */
    .section-title { font-size:10px; text-transform:uppercase; letter-spacing:0.7px; color:${primaryColor}; font-weight:700; margin:14px 0 6px; border-bottom:1.5px solid ${accentColor}50; padding-bottom:3px; }
    .advice-box { background:${bgColor}; border-left:3px solid ${primaryColor}; padding:8px 14px; color:#374151; line-height:1.6; border-radius:0 4px 4px 0; }
    /* Footer */
    .footer { background:#f8fafc; padding:10px 20px; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid ${primaryColor}25; margin-top:20px; }
    .footer-brand { font-size:9px; color:#94a3b8; }
    .sig-box { text-align:center; }
    .sig-line { border-top:1px solid #cbd5e1; padding-top:5px; font-size:10px; color:#475569; font-weight:600; min-width:150px; margin-top:24px; }
    .sig-name { font-size:9px; color:#94a3b8; margin-top:2px; }
  </style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="rx-logo">
        <div class="rx-circle"><span>℞</span></div>
        <div>
          <div class="clinic-name">${doctorInfo.clinicName || 'Medical Clinic'}</div>
          ${doctorInfo.address ? `<div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.address}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="doctor-name-h">Dr. ${doctorInfo.name}</div>
      ${doctorInfo.qualification ? `<div class="doctor-creds">${doctorInfo.qualification}${doctorInfo.specialization ? ' | ' + doctorInfo.specialization : ''}</div>` : ''}
      ${doctorInfo.regNo ? `<div class="reg-no">Reg: ${doctorInfo.regNo}</div>` : ''}
      ${doctorInfo.phone ? `<div style="font-size:10px;color:#e2e8f0;margin-top:2px;">${doctorInfo.phone}</div>` : ''}
      <div class="date-box" style="margin-top:6px;">
        <div class="date-box-label">Date</div>
        <div class="date-box-val">${date}</div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">
    <!-- Patient Grid -->
    <div class="patient-grid">
      <div class="patient-grid-title">Patient Information</div>
      <div class="grid-row">
        <div class="grid-cell" style="flex:4;"><div class="grid-label">Patient Name</div><div class="grid-value">${patientInfo.name}</div></div>
      </div>
      <div class="grid-row">
        <div class="grid-cell"><div class="grid-label">Age</div><div class="grid-value">${patientInfo.age || ''}</div></div>
        <div class="grid-cell"><div class="grid-label">Sex</div><div class="grid-value">${patientInfo.gender || ''}</div></div>
        <div class="grid-cell"><div class="grid-label">Weight</div><div class="grid-value">${patientInfo.weight || ''}</div></div>
        <div class="grid-cell"><div class="grid-label">Phone</div><div class="grid-value">${patientInfo.phone || ''}</div></div>
      </div>
      ${diagnosis ? `<div class="grid-row"><div class="grid-cell" style="flex:4;"><div class="grid-label">Diagnosed With</div><div class="grid-value">${diagnosis}</div></div></div>` : ''}
    </div>

    <!-- Rx Drug Table -->
    <div class="rx-header">
      <div class="rx-sym">℞</div>
      <div class="rx-label">Prescription</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40%">Drugs / Medicine</th>
          <th style="width:20%;text-align:center">Unit (Tab/Syrup)</th>
          <th style="width:20%;text-align:center">Frequency</th>
          <th style="width:20%;text-align:center">Duration</th>
        </tr>
      </thead>
      <tbody>${medTableRows}${emptyRows}</tbody>
    </table>

    ${labTests && labTests.length > 0 ? `<div class="section-title">${t('investigations', data.language)}</div><ul style="padding-left:20px;line-height:1.8;color:#374151;">${labTests.map(lt => `<li>${lt}</li>`).join('')}</ul>` : ''}

    ${advice ? `<div class="section-title">${t('advice', data.language)}</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
    ${followUp ? `<div class="section-title">${t('follow_up', data.language)}</div><div class="advice-box">${followUp}</div>` : ''}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">prescriptionmaker.in — ${template.name} Template</div>
    <div class="sig-box">
      <div class="sig-line">Dr. ${doctorInfo.name}<div class="sig-name">Signature &amp; Stamp</div></div>
    </div>
  </div>
</div>
</body>
</html>`
}
ml>`
}
