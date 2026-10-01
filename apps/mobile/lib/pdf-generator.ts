import type { Template } from './templates'
import { t, type LanguageCode } from './translations'

export type Medicine = {
  id: string
  name: string
  strength: string
  form?: string
  frequency: string
  timing?: string
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

// ── SHARED CSS BASE ────────────────────────────────────────────────
function baseCSS(primaryColor: string, accentColor: string, bgColor: string, fontFamily: string): string {
  const font = fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif'
  return `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: ${font}; background:${bgColor}; color:#1e293b; font-size:12px; }
    .page { max-width:720px; margin:0 auto; background:#fff; min-height:100vh; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:${primaryColor}; }
    th { color:#fff; padding:8px 12px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; }
    th:not(:first-child) { text-align:center; }
    td { vertical-align:middle; }
    .section-title { font-size:10px; text-transform:uppercase; letter-spacing:0.7px; color:${primaryColor}; font-weight:700; margin:14px 0 6px; border-bottom:1.5px solid ${accentColor}50; padding-bottom:3px; }
    .advice-box { background:${bgColor}; border-left:3px solid ${primaryColor}; padding:8px 14px; color:#374151; line-height:1.6; border-radius:0 4px 4px 0; }
    .footer { background:#f8fafc; padding:10px 20px; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid ${primaryColor}25; margin-top:20px; }
    .footer-brand { font-size:9px; color:#94a3b8; }
    .sig-box { text-align:center; }
    .sig-line { border-top:1px solid #cbd5e1; padding-top:5px; font-size:10px; color:#475569; font-weight:600; min-width:150px; margin-top:24px; }
    .sig-name { font-size:9px; color:#94a3b8; margin-top:2px; }
  `
}

// ── LAYOUT: CLASSIC LETTERHEAD (centered, serif, elegant) ─────────
function layoutClassic(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const meds = medicines.map((m, i) => `<li style="margin-bottom:8px;"><b>${m.name}${m.strength ? ` <span style="font-weight:400;color:#64748b;">${m.strength}</span>` : ''}</b> — ${m.frequency ? t(m.frequency, data.language) : ''} × ${m.duration || ''} ${m.instructions ? `<i style="color:#64748b;">(${t(m.instructions, data.language)})</i>` : ''}</li>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { text-align:center; padding:28px 24px 16px; border-bottom:3px double ${primaryColor}; }
    .clinic-name { font-size:26px; font-weight:800; color:${primaryColor}; font-family:Georgia,serif; letter-spacing:1px; }
    .doctor-name { font-size:16px; font-weight:700; color:#1e293b; margin-top:4px; }
    .creds { font-size:11px; color:${accentColor}; margin-top:2px; }
    .contact-bar { background:${primaryColor}10; padding:6px 20px; display:flex; justify-content:center; gap:24px; font-size:10px; color:#64748b; border-bottom:1px solid ${primaryColor}20; }
    .patient-bar { padding:10px 24px; display:flex; gap:24px; flex-wrap:wrap; border-bottom:1px solid ${primaryColor}20; background:${bgColor}; }
    .pf { display:flex; flex-direction:column; }
    .pf-label { font-size:9px; color:#94a3b8; }
    .pf-value { font-size:11px; font-weight:600; min-width:80px; min-height:14px; border-bottom:1px solid #cbd5e1; }
    .body { padding:20px 28px; }
    .rx-sym { font-size:40px; font-weight:900; color:${primaryColor}; font-family:Georgia,serif; float:left; margin-right:12px; line-height:1; }
    ol { padding-left:20px; margin-top:10px; }
  </style></head><body><div class="page">
    <div class="header">
      <div class="clinic-name">${doctorInfo.clinicName || 'Medical Clinic'}</div>
      <div class="doctor-name">Dr. ${doctorInfo.name}</div>
      <div class="creds">${doctorInfo.qualification}${doctorInfo.specialization ? ' | ' + doctorInfo.specialization : ''}${doctorInfo.regNo ? ' | Reg: ' + doctorInfo.regNo : ''}</div>
    </div>
    <div class="contact-bar">
      ${doctorInfo.address ? `<span>📍 ${doctorInfo.address}</span>` : ''}
      ${doctorInfo.phone ? `<span>📞 ${doctorInfo.phone}</span>` : ''}
      ${doctorInfo.email ? `<span>✉ ${doctorInfo.email}</span>` : ''}
    </div>
    <div class="patient-bar">
      <div class="pf"><div class="pf-label">Patient Name</div><div class="pf-value">${patientInfo.name}</div></div>
      <div class="pf"><div class="pf-label">Age</div><div class="pf-value">${patientInfo.age}</div></div>
      <div class="pf"><div class="pf-label">Sex</div><div class="pf-value">${patientInfo.gender}</div></div>
      <div class="pf"><div class="pf-label">Date</div><div class="pf-value">${date}</div></div>
      ${diagnosis ? `<div class="pf"><div class="pf-label">Diagnosis</div><div class="pf-value">${diagnosis}</div></div>` : ''}
    </div>
    <div class="body">
      <div class="rx-sym">℞</div>
      <ol style="clear:none;">${meds}</ol>
      <div style="clear:both;"></div>
      ${labTests && labTests.length > 0 ? `<div class="section-title">Investigations</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
      ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
      ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>
    <div class="footer"><div class="footer-brand">prescriptionmaker.in — ${template.name}</div><div class="sig-box"><div class="sig-line">Dr. ${doctorInfo.name}<div class="sig-name">Signature &amp; Stamp</div></div></div></div>
  </div></body></html>`
}

// ── LAYOUT: TWO-COLUMN SIDEBAR ────────────────────────────────────
function layoutTwoColumn(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '08' : '#fff'}">
      <td style="padding:7px 10px;font-weight:600;color:#1e293b;border-bottom:1px solid ${primaryColor}18;">${i + 1}. ${m.name}${m.strength ? ` <span style="font-weight:400;color:#64748b;">${m.strength}</span>` : ''}</td>
      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid ${primaryColor}18;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid ${primaryColor}18;">${m.duration || '-'}</td>
      <td style="padding:7px 10px;text-align:center;font-style:italic;color:#64748b;border-bottom:1px solid ${primaryColor}18;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .layout { display:flex; min-height:100vh; }
    .sidebar { width:200px; min-width:200px; background:${primaryColor}; color:#fff; padding:20px 14px; display:flex; flex-direction:column; gap:14px; }
    .sidebar h1 { font-size:16px; font-weight:800; letter-spacing:0.5px; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px; margin-bottom:4px; }
    .sidebar .rx-circle { width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
    .sidebar .rx-circle span { font-size:22px; font-weight:900; font-family:Georgia,serif; }
    .sb-label { font-size:8px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.6; margin-bottom:2px; }
    .sb-value { font-size:10px; font-weight:600; opacity:0.9; word-break:break-word; }
    .sb-sep { border:none; border-top:1px solid rgba(255,255,255,0.15); margin:6px 0; }
    .main { flex:1; display:flex; flex-direction:column; }
    .main-header { padding:14px 20px; border-bottom:2px solid ${primaryColor}; background:${bgColor}; }
    .patient-grid { display:flex; gap:0; flex-wrap:wrap; background:#fff; border-bottom:1px solid ${primaryColor}20; }
    .pg-cell { flex:1; min-width:100px; padding:8px 14px; border-right:1px solid ${primaryColor}15; }
    .pg-cell:last-child { border-right:none; }
    .pg-label { font-size:9px; color:#94a3b8; }
    .pg-val { font-size:11px; font-weight:600; margin-top:2px; }
    .main-body { padding:14px 20px; flex:1; }
    .rx-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .rx-sym { font-size:28px; font-weight:900; color:${primaryColor}; font-family:Georgia,serif; }
  </style></head><body><div class="page"><div class="layout">
    <!-- SIDEBAR -->
    <div class="sidebar">
      <div class="rx-circle"><span>℞</span></div>
      <div>
        <div class="sb-label">Doctor</div>
        <div class="sb-value">Dr. ${doctorInfo.name}</div>
      </div>
      <div>
        <div class="sb-label">Qualifications</div>
        <div class="sb-value">${doctorInfo.qualification || '—'}</div>
      </div>
      <div>
        <div class="sb-label">Specialization</div>
        <div class="sb-value">${doctorInfo.specialization || '—'}</div>
      </div>
      <hr class="sb-sep">
      <div>
        <div class="sb-label">Clinic</div>
        <div class="sb-value">${doctorInfo.clinicName || '—'}</div>
      </div>
      ${doctorInfo.address ? `<div><div class="sb-label">Address</div><div class="sb-value">${doctorInfo.address}</div></div>` : ''}
      ${doctorInfo.phone ? `<div><div class="sb-label">Phone</div><div class="sb-value">${doctorInfo.phone}</div></div>` : ''}
      ${doctorInfo.regNo ? `<div><div class="sb-label">Reg. No.</div><div class="sb-value">${doctorInfo.regNo}</div></div>` : ''}
      <hr class="sb-sep">
      <div>
        <div class="sb-label">Date</div>
        <div class="sb-value">${date}</div>
      </div>
    </div>
    <!-- MAIN PANEL -->
    <div class="main">
      <div class="main-header">
        <div style="font-size:18px;font-weight:800;color:${primaryColor};">${doctorInfo.clinicName || 'Prescription'}</div>
        <div style="font-size:11px;color:${accentColor};margin-top:2px;">${doctorInfo.qualification}${doctorInfo.specialization ? ' | ' + doctorInfo.specialization : ''}</div>
      </div>
      <!-- Patient Info -->
      <div class="patient-grid">
        <div class="pg-cell"><div class="pg-label">Patient Name</div><div class="pg-val">${patientInfo.name || '—'}</div></div>
        <div class="pg-cell"><div class="pg-label">Age</div><div class="pg-val">${patientInfo.age || '—'}</div></div>
        <div class="pg-cell"><div class="pg-label">Sex</div><div class="pg-val">${patientInfo.gender || '—'}</div></div>
        <div class="pg-cell"><div class="pg-label">Weight</div><div class="pg-val">${patientInfo.weight || '—'}</div></div>
      </div>
      ${diagnosis ? `<div style="padding:8px 20px;background:${primaryColor}10;border-bottom:1px solid ${primaryColor}20;font-size:11px;"><span style="color:${primaryColor};font-weight:700;">Diagnosis:</span> ${diagnosis}</div>` : ''}
      <div class="main-body">
        <div class="rx-head">
          <div class="rx-sym">℞</div>
          <div style="font-size:13px;font-weight:700;color:${primaryColor};text-transform:uppercase;letter-spacing:0.5px;">Prescription</div>
        </div>
        <table>
          <thead><tr>
            <th style="width:40%">Drugs / Medicine</th>
            <th style="width:20%;text-align:center">Frequency</th>
            <th style="width:20%;text-align:center">Duration</th>
            <th style="width:20%;text-align:center">Instructions</th>
          </tr></thead>
          <tbody>${medRows}</tbody>
        </table>
        ${labTests && labTests.length > 0 ? `<div class="section-title">Investigations</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
        ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
        ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
      </div>
      <div class="footer"><div class="footer-brand">prescriptionmaker.in — ${template.name}</div><div class="sig-box"><div class="sig-line">Dr. ${doctorInfo.name}<div class="sig-name">Signature &amp; Stamp</div></div></div></div>
    </div>
  </div></div></body></html>`
}

// ── LAYOUT: HOSPITAL OPD (institutional, tables, full-width) ───────
function layoutHospitalOPD(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr>
      <td style="padding:7px 10px;border:1px solid ${primaryColor}30;">${i + 1}</td>
      <td style="padding:7px 10px;border:1px solid ${primaryColor}30;font-weight:600;">${m.name} ${m.strength || ''}</td>
      <td style="padding:7px 10px;border:1px solid ${primaryColor}30;text-align:center;">${m.form || 'Tab'}</td>
      <td style="padding:7px 10px;border:1px solid ${primaryColor}30;text-align:center;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:7px 10px;border:1px solid ${primaryColor}30;text-align:center;">${m.duration || '-'}</td>
      <td style="padding:7px 10px;border:1px solid ${primaryColor}30;font-style:italic;color:#64748b;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .hosp-header { background:${primaryColor}; color:#fff; padding:12px 20px; display:flex; justify-content:space-between; align-items:center; }
    .hosp-name { font-size:20px; font-weight:800; }
    .hosp-sub { font-size:11px; opacity:0.8; margin-top:2px; }
    .opd-band { background:${accentColor}; color:#fff; padding:5px 20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; text-align:center; }
    .info-grid { display:flex; padding:12px 20px; gap:0; border-bottom:2px solid ${primaryColor}; }
    .info-col { flex:1; padding:0 12px; border-right:1px solid ${primaryColor}20; }
    .info-col:first-child { padding-left:0; }
    .info-col:last-child { border-right:none; }
    .irow { display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dotted #e2e8f0; font-size:11px; }
    .irow-label { color:#64748b; font-weight:600; }
    .body { padding:16px 20px; }
    .diag-box { background:${primaryColor}10; border:1px solid ${primaryColor}30; border-radius:4px; padding:8px 14px; margin-bottom:14px; font-size:12px; }
    .diag-box b { color:${primaryColor}; }
  </style></head><body><div class="page">
    <div class="hosp-header">
      <div>
        <div class="hosp-name">${doctorInfo.clinicName || 'Government Hospital'}</div>
        <div class="hosp-sub">OPD Prescription Slip</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;font-weight:700;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;opacity:0.8;">${doctorInfo.qualification}${doctorInfo.specialization ? ' | ' + doctorInfo.specialization : ''}</div>
        ${doctorInfo.regNo ? `<div style="font-size:10px;opacity:0.7;">Reg: ${doctorInfo.regNo}</div>` : ''}
      </div>
    </div>
    <div class="opd-band">Out-Patient Department (OPD)</div>
    <div class="info-grid">
      <div class="info-col">
        <div class="irow"><span class="irow-label">Patient Name:</span><span>${patientInfo.name || '—'}</span></div>
        <div class="irow"><span class="irow-label">Age / Sex:</span><span>${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</span></div>
        <div class="irow"><span class="irow-label">Weight:</span><span>${patientInfo.weight || '—'}</span></div>
      </div>
      <div class="info-col">
        <div class="irow"><span class="irow-label">Date:</span><span>${date}</span></div>
        <div class="irow"><span class="irow-label">Phone:</span><span>${patientInfo.phone || '—'}</span></div>
        <div class="irow"><span class="irow-label">Address:</span><span>${doctorInfo.address || '—'}</span></div>
      </div>
    </div>
    <div class="body">
      ${diagnosis ? `<div class="diag-box"><b>Diagnosis:</b> ${diagnosis}</div>` : ''}
      <div class="section-title">Rx — Medicines Prescribed</div>
      <table>
        <thead><tr>
          <th style="width:5%;text-align:center">S.No</th>
          <th style="width:30%">Medicine Name</th>
          <th style="width:10%;text-align:center">Form</th>
          <th style="width:18%;text-align:center">Frequency</th>
          <th style="width:12%;text-align:center">Duration</th>
          <th style="width:25%">Instructions</th>
        </tr></thead>
        <tbody>${medRows}</tbody>
      </table>
      ${labTests && labTests.length > 0 ? `<div class="section-title">Investigations Advised</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
      ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
      ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>
    <div class="footer"><div class="footer-brand">prescriptionmaker.in — ${template.name}</div><div class="sig-box"><div class="sig-line">Dr. ${doctorInfo.name}<div class="sig-name">Signature &amp; Stamp</div></div></div></div>
  </div></body></html>`
}

// ── LAYOUT: SOAP CLINICAL NOTES ────────────────────────────────────
function layoutSOAP(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medList = medicines.map((m, i) => `<div style="padding:6px 0;border-bottom:1px solid ${primaryColor}15;display:flex;gap:12px;align-items:flex-start;">
    <span style="font-weight:700;color:${primaryColor};min-width:22px;">${i + 1}.</span>
    <div><b>${m.name} ${m.strength || ''}</b><br><span style="color:#64748b;font-size:11px;">${m.frequency ? t(m.frequency, data.language) : ''} × ${m.duration || ''} ${m.instructions ? '| ' + t(m.instructions, data.language) : ''}</span></div>
  </div>`).join('')
  const soapSection = (letter: string, title: string, content: string) =>
    `<div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:26px;height:26px;border-radius:50%;background:${primaryColor};color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;">${letter}</div><div style="font-size:12px;font-weight:700;color:${primaryColor};text-transform:uppercase;letter-spacing:0.5px;">${title}</div></div><div style="padding:8px 14px;background:${primaryColor}06;border-radius:4px;border-left:3px solid ${accentColor};font-size:12px;line-height:1.6;">${content}</div></div>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .soap-header { padding:18px 24px; border-bottom:3px solid ${primaryColor}; display:flex; justify-content:space-between; }
    .soap-title { font-size:11px; font-weight:700; color:${primaryColor}; text-transform:uppercase; letter-spacing:1px; }
    .patient-band { background:${primaryColor}; color:#fff; padding:8px 24px; display:flex; gap:20px; font-size:11px; }
    .body { padding:18px 24px; }
  </style></head><body><div class="page">
    <div class="soap-header">
      <div>
        <div style="font-size:20px;font-weight:800;color:${primaryColor};">${doctorInfo.clinicName || 'Clinical Notes'}</div>
        <div class="soap-title">SOAP Clinical Note</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;color:${accentColor};">${doctorInfo.qualification}${doctorInfo.specialization ? ' | ' + doctorInfo.specialization : ''}</div>
        <div style="font-size:10px;color:#64748b;">${date}</div>
      </div>
    </div>
    <div class="patient-band">
      <span><b>Patient:</b> ${patientInfo.name || '—'}</span>
      <span><b>Age/Sex:</b> ${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</span>
      ${patientInfo.weight ? `<span><b>Wt:</b> ${patientInfo.weight}</span>` : ''}
      ${patientInfo.phone ? `<span><b>Ph:</b> ${patientInfo.phone}</span>` : ''}
    </div>
    <div class="body">
      ${soapSection('S', 'Subjective (Chief Complaint)', symptoms || diagnosis || '—')}
      ${soapSection('O', 'Objective / Findings', `Diagnosis: <b>${diagnosis || '—'}</b>`)}
      ${soapSection('A', 'Assessment (Diagnosis)', diagnosis || '—')}
      <div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:26px;height:26px;border-radius:50%;background:${primaryColor};color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;">P</div><div style="font-size:12px;font-weight:700;color:${primaryColor};text-transform:uppercase;letter-spacing:0.5px;">Plan (Rx — Medicines)</div></div><div style="padding:8px 14px;background:${primaryColor}06;border-radius:4px;border-left:3px solid ${accentColor};">${medList}</div></div>
      ${labTests && labTests.length > 0 ? `<div class="section-title">Investigations</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
      ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
      ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>
    <div class="footer"><div class="footer-brand">prescriptionmaker.in — ${template.name}</div><div class="sig-box"><div class="sig-line">Dr. ${doctorInfo.name}<div class="sig-name">Signature &amp; Stamp</div></div></div></div>
  </div></body></html>`
}

// ── LAYOUT: GENERIC (detailed drug table, used for all other layouts) ─
function layoutGeneric(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medTableRows = medicines.map((med, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '08' : '#fff'};">
      <td style="padding:8px 12px; font-weight:600; color:#1e293b; border-bottom:1px solid ${primaryColor}20;">${i + 1}. ${med.name}${med.strength ? ` <span style="font-weight:400; color:#64748b;">${med.strength}</span>` : ''}${med.form ? ` (${med.form})` : ''}</td>
      <td style="padding:8px 12px; color:#475569; text-align:center; border-bottom:1px solid ${primaryColor}20;">${med.form || 'Tab'}</td>
      <td style="padding:8px 12px; color:#475569; text-align:center; border-bottom:1px solid ${primaryColor}20;">${med.frequency ? t(med.frequency, data.language) : '-'}</td>
      <td style="padding:8px 12px; color:#475569; text-align:center; border-bottom:1px solid ${primaryColor}20;">${med.duration || '-'}</td>
      <td style="padding:8px 12px; color:#64748b; font-style:italic; border-bottom:1px solid ${primaryColor}20;">${med.instructions ? t(med.instructions, data.language) : '-'}</td>
    </tr>`).join('')
  const emptyRows = medicines.length < 5 ? Array.from({ length: 5 - medicines.length }, (_, i) => `
    <tr style="background:${(medicines.length + i) % 2 === 0 ? primaryColor + '04' : '#fff'};">
      <td style="padding:10px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:10px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:10px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:10px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
      <td style="padding:10px 12px; border-bottom:1px solid ${primaryColor}15;">&nbsp;</td>
    </tr>`).join('') : ''
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { background:${primaryColor}; color:white; padding:18px 24px; display:flex; justify-content:space-between; align-items:flex-end; }
    .clinic-name { font-size:18px; font-weight:800; letter-spacing:0.5px; }
    .doctor-name-h { font-size:13px; font-weight:700; opacity:0.95; margin-top:2px; }
    .doctor-creds { font-size:10px; color:${accentColor}; margin-top:1px; }
    .date-box { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); padding:4px 14px; text-align:center; margin-top:4px; border-radius:3px; }
    .patient-grid { border:1px solid ${primaryColor}40; border-radius:3px; margin:14px 20px; overflow:hidden; }
    .patient-grid-title { background:${primaryColor}; color:#fff; padding:5px 10px; font-size:10px; font-weight:700; text-transform:uppercase; }
    .grid-row { display:flex; border-bottom:1px solid ${primaryColor}20; }
    .grid-cell { flex:1; padding:5px 10px; border-right:1px solid ${primaryColor}20; }
    .grid-label { font-size:9px; color:#94a3b8; }
    .grid-value { font-size:11px; font-weight:600; }
    .rx-header { display:flex; align-items:center; gap:8px; margin:0 20px 8px; }
    .rx-sym { font-size:24px; font-weight:900; color:${primaryColor}; font-family:Georgia,serif; }
    .body { padding:0 20px; }
  </style></head><body><div class="page">
    <div class="header">
      <div>
        <div class="clinic-name">${doctorInfo.clinicName || 'Medical Clinic'}</div>
        ${doctorInfo.address ? `<div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.address}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div class="doctor-name-h">Dr. ${doctorInfo.name}</div>
        ${doctorInfo.qualification ? `<div class="doctor-creds">${doctorInfo.qualification}${doctorInfo.specialization ? ' | ' + doctorInfo.specialization : ''}</div>` : ''}
        ${doctorInfo.regNo ? `<div style="font-size:10px;color:${accentColor};">Reg: ${doctorInfo.regNo}</div>` : ''}
        <div class="date-box" style="margin-top:6px;"><div style="font-size:9px;opacity:0.8;">Date</div><div style="font-size:11px;font-weight:600;">${date}</div></div>
      </div>
    </div>
    <div class="patient-grid">
      <div class="patient-grid-title">Patient Information</div>
      <div class="grid-row"><div class="grid-cell" style="flex:4;"><div class="grid-label">Patient Name</div><div class="grid-value">${patientInfo.name}</div></div></div>
      <div class="grid-row">
        <div class="grid-cell"><div class="grid-label">Age</div><div class="grid-value">${patientInfo.age || '—'}</div></div>
        <div class="grid-cell"><div class="grid-label">Sex</div><div class="grid-value">${patientInfo.gender || '—'}</div></div>
        <div class="grid-cell"><div class="grid-label">Weight</div><div class="grid-value">${patientInfo.weight || '—'}</div></div>
        <div class="grid-cell"><div class="grid-label">Phone</div><div class="grid-value">${patientInfo.phone || '—'}</div></div>
      </div>
      ${diagnosis ? `<div class="grid-row"><div class="grid-cell" style="flex:4;"><div class="grid-label">Diagnosed With</div><div class="grid-value">${diagnosis}</div></div></div>` : ''}
    </div>
    <div class="rx-header"><div class="rx-sym">℞</div><div style="font-size:13px;font-weight:700;color:${primaryColor};text-transform:uppercase;letter-spacing:0.5px;">Prescription</div></div>
    <div class="body">
    <table>
      <thead><tr>
        <th style="width:35%">Drugs / Medicine</th>
        <th style="width:12%;text-align:center">Unit</th>
        <th style="width:18%;text-align:center">Frequency</th>
        <th style="width:15%;text-align:center">Duration</th>
        <th style="width:20%">Instructions</th>
      </tr></thead>
      <tbody>${medTableRows}${emptyRows}</tbody>
    </table>
    ${labTests && labTests.length > 0 ? `<div class="section-title">Investigations</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
    ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
    ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>
    <div class="footer"><div class="footer-brand">prescriptionmaker.in — ${template.name}</div><div class="sig-box"><div class="sig-line">Dr. ${doctorInfo.name}<div class="sig-name">Signature &amp; Stamp</div></div></div></div>
  </div></body></html>`
}

// ── MAIN EXPORT — routes to the correct layout ─────────────────────
export function generatePrescriptionHTML(data: PrescriptionData): string {
  const { layout } = data.template
  switch (layout) {
    case 'classic':
      return layoutClassic(data)
    case 'two-column':
      return layoutTwoColumn(data)
    case 'soap':
      return layoutSOAP(data)
    case 'modern': // Hospital OPD
      return layoutHospitalOPD(data)
    default:
      return layoutGeneric(data)
  }
}
