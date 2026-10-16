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
    logoUrl?: string
    stampUrl?: string
    signature?: string
  }
  patientInfo: {
    name: string
    age: string
    gender: string
    weight: string
    phone: string
    bp?: string
    pulse?: string
    temp?: string
    spo2?: string
    height?: string
    opdRef?: string
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
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      font-family: ${font};
      background: #f8fafc;
      color: #1e293b;
      font-size: 12px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .page {
      width: 794px;
      max-width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      background: #fff;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
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
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
      }
      .page {
        width: 210mm !important;
        max-width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  `
}

// ── LAYOUT: CLASSIC LETTERHEAD (centered, serif, elegant) ─────────
function layoutClassic(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const meds = medicines.map((m, i) => `<li style="margin-bottom:8px;"><b>${m.name}${m.strength ? ` <span style="font-weight:400;color:#64748b;">${m.strength}</span>` : ''}</b> — ${m.frequency ? t(m.frequency, data.language) : ''} × ${m.duration || ''} ${m.instructions ? `<i style="color:#64748b;">(${t(m.instructions, data.language)})</i>` : ''}</li>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { text-align:center; padding:28px 24px 16px; border-bottom:3px double ${primaryColor}; display:flex; flex-direction:column; align-items:center; }
    .logo { width:56px; height:56px; object-fit:contain; margin-bottom:12px; border-radius:28px; }
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
    .footer-content { padding:16px 28px; background:#f8fafc; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid ${primaryColor}25; }
    .stamp { width:60px; height:60px; object-fit:contain; opacity:0.8; }
    .sig { width:80px; height:35px; object-fit:contain; margin-bottom:4px; }
    .sig-line-only { width:80px; border-bottom:1px solid #cbd5e1; height:20px; margin-bottom:4px; }
  </style></head><body><div class="page">
    <div class="header">
      ${doctorInfo.logoUrl ? `<img src="${doctorInfo.logoUrl}" class="logo" />` : ''}
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
    <div class="footer-content">
      <div style="font-size:9px;color:#94a3b8;">prescriptionmaker.in — ${template.name}</div>
      <div style="display:flex; align-items:center; gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" class="stamp" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" class="sig" />` : `<div class="sig-line-only"></div>`}
          <div style="font-size:9px;color:#64748b;font-weight:600;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: TWO-COLUMN SIDEBAR ────────────────────────────────────
function layoutTwoColumn(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '08' : '#fff'}">
      <td style="padding:8px 12px;font-weight:600;color:#1e293b;border-bottom:1px solid ${primaryColor}18;">${i + 1}. ${m.name}${m.strength ? ` <span style="font-weight:400;color:#64748b;">${m.strength}</span>` : ''}</td>
      <td style="padding:8px 10px;text-align:center;border-bottom:1px solid ${primaryColor}18;">${m.form || 'Tab'}</td>
      <td style="padding:8px 10px;text-align:center;border-bottom:1px solid ${primaryColor}18;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:8px 10px;text-align:center;border-bottom:1px solid ${primaryColor}18;">${m.duration || '-'}</td>
      <td style="padding:8px 10px;text-align:center;font-style:italic;color:#64748b;border-bottom:1px solid ${primaryColor}18;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .layout { display:flex; min-height:100vh; }
    .sidebar { width:220px; min-width:220px; background:${primaryColor}; color:#fff; padding:24px 16px; display:flex; flex-direction:column; gap:12px; }
    .sidebar .rx-circle { width:52px; height:52px; border-radius:26px; background:rgba(255,255,255,0.18); border:1.5px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; margin:0 auto 6px; font-size:24px; }
    .sb-label { font-size:8px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.65; margin-bottom:2px; font-weight:700; }
    .sb-value { font-size:10.5px; font-weight:600; opacity:0.95; word-break:break-word; }
    .sb-sep { border:none; border-top:1px solid rgba(255,255,255,0.18); margin:4px 0; }
    .sb-vitals-title { font-size:8.5px; font-weight:800; color:rgba(255,255,255,0.75); letter-spacing:0.5px; text-transform:uppercase; margin-top:6px; }
    .sb-vital-row { display:flex; justify-content:space-between; align-items:baseline; padding:3px 0; border-bottom:1px dashed rgba(255,255,255,0.25); font-size:9.5px; }
    .sb-vital-name { opacity:0.9; }
    .sb-vital-unit { font-size:7.5px; opacity:0.6; }
    .sb-vital-val { font-weight:700; }
    .main { flex:1; display:flex; flex-direction:column; background:#ffffff; }
    .main-header { padding:16px 24px 10px; display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid ${accentColor}; }
    .pat-card { margin:14px 24px 8px; padding:12px 16px; background:${accentColor}15; border-radius:6px; display:flex; justify-content:space-between; align-items:center; }
    .diag-card { margin:6px 24px 14px; padding:10px 16px; background:#ffffff; border:1px solid ${primaryColor}25; border-left:4px solid ${primaryColor}; border-radius:4px; }
    .main-body { padding:0 24px 16px; flex:1; }
    .rx-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .rx-sym { font-size:28px; font-weight:900; color:${primaryColor}; font-family:Georgia,serif; }
  </style></head><body><div class="page"><div class="layout">
    <!-- SIDEBAR -->
    <div class="sidebar">
      ${doctorInfo.logoUrl ? `<img src="${doctorInfo.logoUrl}" class="rx-circle" style="background:#fff;padding:2px;" />` : `<div class="rx-circle">👨‍⚕️</div>`}
      <div style="text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#fff;">Dr. ${doctorInfo.name || 'Full Name'}</div>
        <div style="font-size:9.5px;color:rgba(255,255,255,0.85);margin-top:2px;">${doctorInfo.qualification || 'MBBS, MD'}</div>
        <div style="font-size:9px;color:${accentColor};margin-top:1px;font-weight:700;">${doctorInfo.specialization || 'General Medicine'}</div>
      </div>
      <hr class="sb-sep">
      <div>
        <div class="sb-label">Clinic</div>
        <div class="sb-value">${doctorInfo.clinicName || 'Clinic Name'}</div>
      </div>
      ${doctorInfo.address ? `<div><div class="sb-label">Address</div><div class="sb-value">${doctorInfo.address}</div></div>` : ''}
      ${doctorInfo.phone ? `<div><div class="sb-label">Phone</div><div class="sb-value">☎ ${doctorInfo.phone}</div></div>` : ''}
      ${doctorInfo.regNo ? `<div><div class="sb-label">Reg. No.</div><div class="sb-value">${doctorInfo.regNo}</div></div>` : ''}
      
      <!-- RECORDED VITALS -->
      <hr class="sb-sep">
      <div class="sb-vitals-title">Recorded Vitals</div>
      <div class="sb-vital-row"><span class="sb-vital-name">BP <span class="sb-vital-unit">(mmHg)</span></span><span class="sb-vital-val">${patientInfo.bp || (patientInfo.weight ? '120/80' : '—')}</span></div>
      <div class="sb-vital-row"><span class="sb-vital-name">Pulse <span class="sb-vital-unit">(bpm)</span></span><span class="sb-vital-val">${patientInfo.pulse || '72'}</span></div>
      <div class="sb-vital-row"><span class="sb-vital-name">Temp <span class="sb-vital-unit">(°F)</span></span><span class="sb-vital-val">${patientInfo.temp || '98.6'}</span></div>
      <div class="sb-vital-row"><span class="sb-vital-name">SpO₂ <span class="sb-vital-unit">(%)</span></span><span class="sb-vital-val">${patientInfo.spo2 || '99'}</span></div>
      <div class="sb-vital-row"><span class="sb-vital-name">Weight <span class="sb-vital-unit">(kg)</span></span><span class="sb-vital-val">${patientInfo.weight || '—'}</span></div>
      <div class="sb-vital-row"><span class="sb-vital-name">Height <span class="sb-vital-unit">(cm)</span></span><span class="sb-vital-val">${patientInfo.height || '—'}</span></div>

      <div style="margin-top:auto;font-size:8px;color:rgba(255,255,255,0.45);text-align:center;">prescriptionmaker.in</div>
    </div>
    <!-- MAIN PANEL -->
    <div class="main">
      <div class="main-header">
        <div>
          <div style="font-size:15px;font-weight:900;color:${primaryColor};letter-spacing:0.8px;">MEDICAL PRESCRIPTION</div>
          <div style="font-size:9.5px;color:#64748b;margin-top:3px;">Date: <b style="color:#1e293b;">${date}</b></div>
        </div>
        <div style="font-size:10px;color:#64748b;font-weight:600;">${patientInfo.opdRef ? `OPD Ref: ${patientInfo.opdRef}` : 'OPD Ref: _______________'}</div>
      </div>
      <!-- Patient Details Box -->
      <div class="pat-card">
        <div>
          <div style="font-size:8.5px;font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">PATIENT DETAILS</div>
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:3px;">${patientInfo.name || 'Patient Full Name'}</div>
        </div>
        <div style="font-size:11px;color:#475569;font-weight:700;">Age: ${patientInfo.age || '—'} · Sex: ${patientInfo.gender || '—'}</div>
      </div>
      <!-- Diagnosis Box -->
      <div class="diag-card">
        <div style="font-size:8px;font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">DIAGNOSIS</div>
        <div style="font-size:12px;font-weight:800;color:${primaryColor};margin-top:2px;">${diagnosis || 'Clinical Diagnosis'}</div>
      </div>
      <div class="main-body">
        <div class="rx-head">
          <div class="rx-sym">℞</div>
          <div style="font-size:12px;font-weight:800;color:${primaryColor};text-transform:uppercase;letter-spacing:0.6px;">Prescribed Medicines</div>
        </div>
        <table>
          <thead><tr style="background:${primaryColor};">
            <th style="width:38%">Medicine</th>
            <th style="width:14%;text-align:center">Unit</th>
            <th style="width:16%;text-align:center">Frequency</th>
            <th style="width:14%;text-align:center">Duration</th>
            <th style="width:18%;text-align:center">Instructions</th>
          </tr></thead>
          <tbody>${medRows}</tbody>
        </table>
        ${labTests && labTests.length > 0 ? `<div class="section-title">Investigations</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
        ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
        ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
      </div>
      <div style="padding:14px 24px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;margin-top:auto;">
        <div style="font-size:9px;color:#94a3b8;">Two-Column Sidebar · PrescriptionMaker.in</div>
        <div style="display:flex;align-items:center;gap:12px;">
          ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:50px;height:50px;object-fit:contain;opacity:0.8;" />` : ''}
          <div style="display:flex;flex-direction:column;align-items:center;">
            ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:70px;height:30px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:70px;height:16px;border-bottom:1px solid #cbd5e1;margin-bottom:4px;"></div>`}
            <div style="font-size:9px;color:#64748b;font-weight:700;">Dr. ${doctorInfo.name}</div>
            <div style="font-size:8px;color:#94a3b8;">Doctor's Signature</div>
          </div>
        </div>
      </div>
    </div>
  </div></div></body></html>`
}


// ── LAYOUT: SOAP CLINICAL NOTES ────────────────────────────────────
function layoutSOAP(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date, template } = data
  const primaryColor = '#312e81'
  const accentColor = '#6366f1'
  const bgColor = '#ffffff'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const qualSpec = [doctorInfo.qualification, doctorInfo.specialization].filter(Boolean).join(' · ') || 'MBBS, MD · General Medicine'

  const vitalsList = [
    { label: 'BP', value: patientInfo.bp },
    { label: 'HR (bpm)', value: patientInfo.pulse },
    { label: 'Temp (°F)', value: patientInfo.temp },
    { label: 'SpO₂ (%)', value: patientInfo.spo2 },
    { label: 'Weight (kg)', value: patientInfo.weight },
    { label: 'RR (/min)', value: patientInfo.height }
  ]

  const vitalsHtml = vitalsList.map(v => `
    <div style="border: 1px solid #dbeafe; border-radius: 4px; padding: 4px 8px; font-size: 10px; background: #eff6ff; display: inline-flex; align-items: center; gap: 4px;">
      <span style="color: #64748b;">${v.label}:</span>
      <span style="font-weight: 700; color: #1e293b;">${v.value || '______'}</span>
    </div>
  `).join('')

  const medTableRows = medicines.map((m, i) => `
    <tr style="border-bottom: 1px solid ${primaryColor}15;">
      <td style="padding: 6px 8px; font-weight: 600; color: #1e293b;">${m.name} ${m.strength || ''}</td>
      <td style="padding: 6px 8px; text-align: center; color: #475569;">${m.form || '—'}</td>
      <td style="padding: 6px 8px; text-align: center; color: #475569;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding: 6px 8px; text-align: center; color: #475569;">${m.duration || '—'}</td>
    </tr>
  `).join('')

  const emptyMedRows = medicines.length === 0 ? `
    <tr style="border-bottom: 1px solid ${primaryColor}10;"><td style="padding: 8px;">—</td><td style="padding: 8px; text-align: center;">—</td><td style="padding: 8px; text-align: center;">—</td><td style="padding: 8px; text-align: center;">—</td></tr>
  ` : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .soap-box { margin: 0 20px 10px; border-radius: 6px; overflow: hidden; background: #ffffff; }
    .soap-hdr { padding: 5px 12px; color: #ffffff; display: flex; align-items: center; gap: 8px; }
    .soap-letter { font-family: Georgia, serif; font-weight: 900; font-size: 14px; line-height: 1; }
    .soap-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  </style></head><body><div class="page" style="padding-bottom: 24px;">
    <!-- Header Banner (Deep Indigo) -->
    <div style="background: ${primaryColor}; color: #ffffff; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${doctorInfo.logoUrl ? `<img src="${doctorInfo.logoUrl}" style="width: 42px; height: 42px; border-radius: 21px; background: #fff; padding: 2px; object-fit: contain;" />` : ''}
        <div>
          <div style="font-size: 16px; font-weight: 800; color: #ffffff;">${doctorDisplayName}</div>
          <div style="font-size: 10px; color: #c7d2fe; margin-top: 2px;">${qualSpec}</div>
          ${doctorInfo.regNo ? `<div style="font-size: 9px; color: #a5b4fc; margin-top: 1px;">Reg: ${doctorInfo.regNo}</div>` : ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: 700; color: #c7d2fe;">${doctorInfo.clinicName || 'Clinical Care Centre'}</div>
        ${doctorInfo.phone ? `<div style="font-size: 9.5px; color: #c7d2fe; margin-top: 2px;">☎ ${doctorInfo.phone}</div>` : ''}
        ${doctorInfo.address ? `<div style="font-size: 9px; color: #c7d2fe; margin-top: 1px;">📍 ${doctorInfo.address}</div>` : ''}
      </div>
    </div>

    <!-- Patient + Date Bar (Lavender Card) -->
    <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 4px; padding: 7px 14px; margin: 12px 20px 10px; display: flex; justify-content: space-between; font-size: 10.5px;">
      <div>
        <span style="color: #64748b;">Patient: </span>
        <strong style="color: #0f172a; font-size: 11px;">${patientInfo.name || '___________________________'}</strong>
        <span style="color: #64748b; margin-left: 12px;">${[patientInfo.age ? `Age ${patientInfo.age}` : '', patientInfo.gender].filter(Boolean).join(' / ') || 'Age 34 / Male'}</span>
      </div>
      <div>
        <span style="color: #64748b;">Date: </span>
        <strong style="color: #0f172a;">${date || new Date().toLocaleDateString('en-IN')}</strong>
      </div>
    </div>

    <!-- S — SUBJECTIVE Box -->
    <div class="soap-box" style="border: 1px solid #7c3aed40;">
      <div class="soap-hdr" style="background: #7c3aed;">
        <span class="soap-letter">S</span>
        <span class="soap-label">SUBJECTIVE — CHIEF COMPLAINT &amp; HISTORY</span>
      </div>
      <div style="padding: 8px 12px; font-size: 10.5px; color: #374151;">
        ${symptoms || diagnosis || 'Acute Pharyngitis'}
      </div>
    </div>

    <!-- O — OBJECTIVE Box -->
    <div class="soap-box" style="border: 1px solid #1d4ed840;">
      <div class="soap-hdr" style="background: #1d4ed8;">
        <span class="soap-letter">O</span>
        <span class="soap-label">OBJECTIVE — VITALS &amp; EXAMINATION FINDINGS</span>
      </div>
      <div style="padding: 8px 12px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
          ${vitalsHtml}
        </div>
        <div style="font-size: 10px; color: #64748b;">
          Examination findings: Normal heart sounds, clear chest, abdomen soft.
        </div>
      </div>
    </div>

    <!-- A — ASSESSMENT Box -->
    <div class="soap-box" style="border: 1px solid #065f4640;">
      <div class="soap-hdr" style="background: #065f46;">
        <span class="soap-letter">A</span>
        <span class="soap-label">ASSESSMENT — DIAGNOSIS</span>
      </div>
      <div style="padding: 8px 12px; font-size: 11px; font-weight: 700; color: #065f46;">
        ${diagnosis || 'Acute Pharyngitis'}
      </div>
    </div>

    <!-- P — PLAN Box -->
    <div class="soap-box" style="border: 1px solid ${primaryColor}40;">
      <div class="soap-hdr" style="background: ${primaryColor};">
        <span class="soap-letter">P</span>
        <span class="soap-label">PLAN — MEDICATIONS, INVESTIGATIONS &amp; ADVICE</span>
      </div>
      <div style="padding: 8px 12px;">
        <div style="font-size: 10.5px; font-weight: 700; color: ${primaryColor}; margin-bottom: 6px;">℞ Medications</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;">
          <thead>
            <tr style="background: #e0e7ff;">
              <th style="padding: 4px 8px; text-align: left; width: 38%; color: ${primaryColor}; font-weight: 700;">Drug</th>
              <th style="padding: 4px 8px; text-align: center; width: 20%; color: ${primaryColor}; font-weight: 700;">Dose</th>
              <th style="padding: 4px 8px; text-align: center; width: 22%; color: ${primaryColor}; font-weight: 700;">Frequency</th>
              <th style="padding: 4px 8px; text-align: center; width: 20%; color: ${primaryColor}; font-weight: 700;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medTableRows}
            ${emptyMedRows}
          </tbody>
        </table>

        ${labTests && labTests.length > 0 ? `
          <div style="font-size: 10px; margin-top: 6px;">
            <strong style="color: ${primaryColor};">Investigations: </strong>
            <span style="color: #374151;">${labTests.join(', ')}</span>
          </div>
        ` : ''}
        ${advice ? `
          <div style="font-size: 10px; margin-top: 4px;">
            <strong style="color: ${primaryColor};">Advice: </strong>
            <span style="color: #374151;">${t(advice, data.language)}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Footer / Signature Area -->
    <div style="margin: 16px 20px 0; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div style="font-size: 9.5px; color: #64748b;">
        ${followUp ? `<strong style="color: ${primaryColor};">Follow-up: </strong>${followUp}` : '<span style="color:#94a3b8;">SOAP Clinical Notes · prescriptionmaker.in</span>'}
      </div>
      <div style="text-align: center; min-width: 140px;">
        ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="height: 32px; max-width: 120px; object-fit: contain; margin-bottom: 4px;" />` : ''}
        <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-size: 10px; font-weight: 700; color: #475569;">Doctor's Signature</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${doctorDisplayName}</div>
      </div>
    </div>
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
      <div style="display:flex; align-items:center; gap:12px;">
        ${doctorInfo.logoUrl ? `<img src="${doctorInfo.logoUrl}" style="width:48px;height:48px;border-radius:24px;background:#fff;padding:2px;object-fit:contain;" />` : ''}
        <div>
          <div class="clinic-name">${doctorInfo.clinicName || 'Medical Clinic'}</div>
          ${doctorInfo.address ? `<div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.address}</div>` : ''}
        </div>
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
    <div class="footer">
      <div class="footer-brand">prescriptionmaker.in — ${template.name}</div>
      <div style="display:flex; align-items:center; gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:60px;height:60px;object-fit:contain;opacity:0.8;" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:80px;height:35px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:80px;border-bottom:1px solid #cbd5e1;height:24px;margin-bottom:4px;"></div>`}
          <div style="font-size:9px;color:#94a3b8;font-weight:600;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: VITALS-FIRST ───────────────────────────────────────────
function layoutVitalsFirst(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '06' : '#fff'}">
      <td style="padding:8px 10px;font-weight:700;color:${primaryColor};">${i + 1}</td>
      <td style="padding:8px 10px;font-weight:700;color:#0f172a;">${m.name}${m.strength ? ` <span style="font-weight:400;color:#64748b;">(${m.strength})</span>` : ''}</td>
      <td style="padding:8px 10px;text-align:center;">${m.form || 'Tab'}</td>
      <td style="padding:8px 10px;text-align:center;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:8px 10px;text-align:center;">${m.duration || '-'}</td>
      <td style="padding:8px 10px;font-style:italic;color:#64748b;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .vh-header { background:${primaryColor}; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:flex-end; }
    .vitals-grid { display:grid; grid-template-columns:repeat(6, 1fr); gap:10px; margin:14px 24px; }
    .vital-card { background:#fff; border:1px solid ${primaryColor}25; border-top:3px solid ${primaryColor}; border-radius:6px; padding:8px 10px; text-align:center; }
    .vital-label { font-size:8.5px; font-weight:800; color:#64748b; text-transform:uppercase; }
    .vital-val { font-size:13px; font-weight:900; color:${primaryColor}; margin-top:2px; }
    .diag-strip { margin:0 24px 14px; padding:10px 16px; background:${primaryColor}12; border-left:4px solid ${primaryColor}; border-radius:4px; font-weight:700; color:${primaryColor}; }
  </style></head><body><div class="page">
    <div class="vh-header">
      <div>
        <div style="font-size:18px;font-weight:900;">${doctorInfo.clinicName || 'Heart & Medical Center'}</div>
        <div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.address || 'Specialty Care Clinic'}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:14px;font-weight:800;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;opacity:0.85;">${doctorInfo.qualification || 'MBBS, MD'} · Consultant Cardiologist</div>
        <div style="font-size:9.5px;color:${accentColor};">Date: ${date}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:11px;">
      <div><b>Patient:</b> ${patientInfo.name || '—'}</div>
      <div><b>Age/Sex:</b> ${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</div>
      <div><b>Date:</b> ${date}</div>
      <div><b>Phone:</b> ${patientInfo.phone || '—'}</div>
    </div>
    
    <!-- 6-CARD VITALS GRID -->
    <div class="vitals-grid">
      <div class="vital-card"><div class="vital-label">BP</div><div class="vital-val">120/80</div><div style="font-size:7px;color:#94a3b8;">mmHg</div></div>
      <div class="vital-card"><div class="vital-label">Heart Rate</div><div class="vital-val">74</div><div style="font-size:7px;color:#94a3b8;">bpm</div></div>
      <div class="vital-card"><div class="vital-label">SpO₂</div><div class="vital-val">99%</div><div style="font-size:7px;color:#94a3b8;">oxygen</div></div>
      <div class="vital-card"><div class="vital-label">Temp</div><div class="vital-val">98.6°</div><div style="font-size:7px;color:#94a3b8;">Fahrenheit</div></div>
      <div class="vital-card"><div class="vital-label">Weight</div><div class="vital-val">${patientInfo.weight || '—'}</div><div style="font-size:7px;color:#94a3b8;">kg</div></div>
      <div class="vital-card"><div class="vital-label">Resp. Rate</div><div class="vital-val">18</div><div style="font-size:7px;color:#94a3b8;">/min</div></div>
    </div>

    ${diagnosis ? `<div class="diag-strip">DIAGNOSIS: ${diagnosis}</div>` : ''}

    <div style="padding:0 24px 16px;">
      <div style="font-size:12px;font-weight:900;color:${primaryColor};margin-bottom:8px;">℞ MEDICATIONS &amp; DOSAGE</div>
      <table>
        <thead><tr style="background:${primaryColor};">
          <th style="width:5%">#</th>
          <th style="width:35%">Medicine (Strength)</th>
          <th style="width:12%;text-align:center">Form</th>
          <th style="width:16%;text-align:center">Frequency</th>
          <th style="width:14%;text-align:center">Duration</th>
          <th style="width:18%">Instructions</th>
        </tr></thead>
        <tbody>${medRows}</tbody>
      </table>

      <!-- Investigations checklist -->
      <div style="margin-top:14px;padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;">
        <div style="font-size:9px;font-weight:800;color:${primaryColor};text-transform:uppercase;margin-bottom:6px;">Cardiac &amp; Diagnostic Workup</div>
        <div style="font-size:10px;color:#475569;display:flex;gap:14px;flex-wrap:wrap;">
          <span>☑ ECG 12-Lead</span>
          <span>☐ 2D Echocardiogram</span>
          <span>☐ TMT / Stress Test</span>
          <span>☐ Holter Monitor</span>
          <span>☐ Lipid Profile</span>
          <span>☐ HbA1c</span>
        </div>
      </div>

      ${advice ? `<div class="section-title">Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
      ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>

    <div class="footer">
      <div class="footer-brand">Vitals-First · PrescriptionMaker.in</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:60px;height:60px;object-fit:contain;opacity:0.8;" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:80px;height:35px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:80px;border-bottom:1px solid #cbd5e1;height:24px;margin-bottom:4px;"></div>`}
          <div style="font-size:9px;color:#64748b;font-weight:700;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: DETAILED DRUG CHART ────────────────────────────────────
function layoutDetailedDrugChart(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '06' : '#fff'}">
      <td style="padding:9px 10px;font-weight:800;color:${primaryColor};text-align:center;">${i + 1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#0f172a;">${m.name}${m.strength ? ` <span style="font-weight:500;color:#64748b;">${m.strength}</span>` : ''}</td>
      <td style="padding:9px 10px;text-align:center;font-weight:600;">Oral</td>
      <td style="padding:9px 10px;text-align:center;">After Meals</td>
      <td style="padding:9px 10px;text-align:center;font-weight:700;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:9px 10px;text-align:center;">${m.duration || '-'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { background:${primaryColor}; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; }
    .card-row { display:flex; gap:14px; margin:14px 24px; }
    .info-card { flex:1; padding:12px 16px; border-radius:6px; }
  </style></head><body><div class="page">
    <div class="header">
      <div>
        <div style="font-size:16px;font-weight:900;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.qualification || 'MBBS, MD'} · Clinical Specialist</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px;font-weight:800;">${doctorInfo.clinicName || 'Specialty Medical Center'}</div>
        <div style="font-size:9.5px;opacity:0.85;">☎ ${doctorInfo.phone || 'Clinic Helpline'} · Reg: ${doctorInfo.regNo || 'MED-4819'}</div>
      </div>
    </div>

    <div class="card-row">
      <div class="info-card" style="background:#ffffff;border:1px solid ${primaryColor}30;">
        <div style="font-size:8px;font-weight:800;color:#94a3b8;letter-spacing:0.5px;">PATIENT</div>
        <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:2px;">${patientInfo.name || 'Patient Name'}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">Age: ${patientInfo.age || '—'} · ${patientInfo.gender || '—'} · Date: ${date}</div>
      </div>
      <div class="info-card" style="background:${accentColor}15;border:1px solid ${accentColor}40;">
        <div style="font-size:8px;font-weight:800;color:${primaryColor};letter-spacing:0.5px;">DIAGNOSIS</div>
        <div style="font-size:13px;font-weight:800;color:${primaryColor};margin-top:2px;">${diagnosis || 'Clinical Diagnosis'}</div>
      </div>
    </div>

    <div style="padding:0 24px 16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:20px;font-family:Georgia,serif;font-weight:bold;color:${primaryColor};">℞</span>
        <span style="font-size:11px;font-weight:800;color:${primaryColor};letter-spacing:0.5px;">DETAILED DRUG SCHEDULE</span>
      </div>

      <table>
        <thead><tr style="background:${primaryColor};">
          <th style="width:5%">#</th>
          <th style="width:40%">Medicine Name &amp; Strength</th>
          <th style="width:12%;text-align:center">Route</th>
          <th style="width:15%;text-align:center">Timing</th>
          <th style="width:15%;text-align:center">Frequency</th>
          <th style="width:13%;text-align:center">Duration</th>
        </tr></thead>
        <tbody>${medRows}</tbody>
      </table>

      <div style="display:flex;gap:14px;margin-top:16px;">
        <div style="flex:1;padding:12px;background:#ffffff;border:1px solid ${accentColor}40;border-radius:4px;">
          <div style="font-size:9px;font-weight:800;color:${primaryColor};">LAB INVESTIGATIONS</div>
          <div style="font-size:10.5px;color:#64748b;margin-top:4px;">${labTests && labTests.length > 0 ? labTests.join(', ') : 'CBC, LFT, KFT, Urine Routine/Microscopy'}</div>
        </div>
        <div style="flex:1;padding:12px;background:#ffffff;border:1px solid ${primaryColor}30;border-radius:4px;">
          <div style="font-size:9px;font-weight:800;color:${primaryColor};">SPECIAL INSTRUCTIONS</div>
          <div style="font-size:10.5px;color:#64748b;margin-top:4px;">${advice || 'Take medicines with plenty of water after meals'}</div>
        </div>
      </div>

      ${followUp ? `<div class="section-title">Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>

    <div class="footer">
      <div class="footer-brand">Detailed Drug Chart · PrescriptionMaker.in</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:60px;height:60px;object-fit:contain;opacity:0.8;" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:80px;height:35px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:80px;border-bottom:1px solid #cbd5e1;height:24px;margin-bottom:4px;"></div>`}
          <div style="font-size:9px;color:#64748b;font-weight:700;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: MULTI-SECTION BOXED ────────────────────────────────────
function layoutBoxed(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '05' : '#fff'}">
      <td style="padding:8px 10px;font-weight:700;">${m.name}${m.strength ? ` (${m.strength})` : ''}</td>
      <td style="padding:8px 10px;text-align:center;">${m.form || 'Tab'}</td>
      <td style="padding:8px 10px;text-align:center;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:8px 10px;text-align:center;">${m.duration || '-'}</td>
      <td style="padding:8px 10px;font-style:italic;color:#64748b;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { background:${primaryColor}; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; }
    .box-card { background:#ffffff; border:1px solid ${primaryColor}30; border-radius:6px; padding:12px 16px; margin-bottom:12px; }
    .box-title { font-size:9px; font-weight:800; color:${primaryColor}; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid ${primaryColor}15; padding-bottom:4px; margin-bottom:8px; }
  </style></head><body><div class="page">
    <div class="header">
      <div>
        <div style="font-size:18px;font-weight:900;">${doctorInfo.clinicName || 'Specialist Medical Clinic'}</div>
        <div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.address || 'Consultant Clinic'}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:14px;font-weight:800;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;opacity:0.85;">${doctorInfo.qualification || 'MBBS, MD'} · Reg: ${doctorInfo.regNo || 'DOC-REG-01'}</div>
      </div>
    </div>

    <div style="padding:14px 24px;">
      <div style="display:flex;gap:12px;">
        <div class="box-card" style="flex:2;">
          <div class="box-title">Patient Information</div>
          <div style="font-size:13px;font-weight:800;color:#0f172a;">${patientInfo.name || 'Patient Name'}</div>
          <div style="font-size:10px;color:#64748b;margin-top:3px;">Age: ${patientInfo.age || '—'} · Gender: ${patientInfo.gender || '—'} · Weight: ${patientInfo.weight || '—'} kg</div>
        </div>
        <div class="box-card" style="flex:1;">
          <div class="box-title">Date &amp; Reference</div>
          <div style="font-size:11px;font-weight:700;color:#0f172a;">Date: ${date}</div>
          <div style="font-size:10px;color:#64748b;margin-top:3px;">Ref: REF-2026-904</div>
        </div>
      </div>

      <div class="box-card">
        <div class="box-title">Clinical Diagnosis</div>
        <div style="font-size:12px;font-weight:800;color:${primaryColor};">${diagnosis || 'Clinical Diagnosis'}</div>
      </div>

      <div class="box-card">
        <div class="box-title">℞ Prescription / Medications</div>
        <table>
          <thead><tr style="background:${primaryColor};">
            <th style="width:38%">Drug</th>
            <th style="width:14%;text-align:center">Unit</th>
            <th style="width:16%;text-align:center">Frequency</th>
            <th style="width:14%;text-align:center">Duration</th>
            <th style="width:18%">Instructions</th>
          </tr></thead>
          <tbody>${medRows}</tbody>
        </table>
      </div>

      <div style="display:flex;gap:12px;">
        <div class="box-card" style="flex:1;">
          <div class="box-title">Investigations</div>
          <div style="font-size:10.5px;color:#475569;">${labTests && labTests.length > 0 ? labTests.join(', ') : 'Blood tests & diagnostics as advised'}</div>
        </div>
        <div class="box-card" style="flex:1;">
          <div class="box-title">Advice &amp; Follow-up</div>
          <div style="font-size:10.5px;color:#475569;">${advice || 'Rest, take prescribed medicines on time'}</div>
          ${followUp ? `<div style="font-size:10px;font-weight:700;color:${primaryColor};margin-top:4px;">Next Visit: ${followUp}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Multi-Section Boxed · PrescriptionMaker.in</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:60px;height:60px;object-fit:contain;opacity:0.8;" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:80px;height:35px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:80px;border-bottom:1px solid #cbd5e1;height:24px;margin-bottom:4px;"></div>`}
          <div style="font-size:9px;color:#64748b;font-weight:700;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: MINIMAL PRINT RULED ────────────────────────────────────
function layoutMinimal(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const meds = medicines.map((m, i) => `
    <tr style="border-bottom:1px dashed #cbd5e1;">
      <td style="padding:9px 6px;font-weight:700;color:#0f172a;">${i + 1}. ${m.name}${m.strength ? ` (${m.strength})` : ''}</td>
      <td style="padding:9px 6px;text-align:center;">${m.form || 'Tab'}</td>
      <td style="padding:9px 6px;text-align:center;font-weight:600;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:9px 6px;text-align:center;">${m.duration || '-'}</td>
      <td style="padding:9px 6px;color:#64748b;font-style:italic;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, 'serif')}
    .header { padding:28px 28px 14px; border-bottom:1.5px solid #1e293b; display:flex; justify-content:space-between; align-items:flex-end; }
  </style></head><body><div class="page" style="background:#ffffff;">
    <div class="header">
      <div>
        <div style="font-size:22px;font-weight:800;font-family:Georgia,serif;color:#0f172a;">${doctorInfo.clinicName || 'Medical Practice'}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">${doctorInfo.address || 'Clinic Address'} · ☎ ${doctorInfo.phone || 'Phone'}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px;font-weight:700;font-family:Georgia,serif;color:#0f172a;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;color:#64748b;">${doctorInfo.qualification || 'MBBS, MD'} · Reg: ${doctorInfo.regNo || 'DOC-REG-001'}</div>
      </div>
    </div>

    <div style="padding:14px 28px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#334155;">
      <div><b>Patient:</b> ${patientInfo.name || '______________________'}</div>
      <div><b>Age/Sex:</b> ${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</div>
      <div><b>Date:</b> ${date}</div>
    </div>

    ${diagnosis ? `<div style="padding:10px 28px;border-bottom:1px solid #e2e8f0;font-size:11px;"><b>Diagnosis:</b> ${diagnosis}</div>` : ''}

    <div style="padding:18px 28px;">
      <div style="font-size:32px;font-family:Georgia,serif;font-style:italic;color:#0f172a;margin-bottom:8px;">℞</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:1.5px solid #0f172a;background:transparent;">
          <th style="color:#0f172a;padding:6px;text-align:left;">Medicine</th>
          <th style="color:#0f172a;padding:6px;text-align:center;">Unit</th>
          <th style="color:#0f172a;padding:6px;text-align:center;">Frequency</th>
          <th style="color:#0f172a;padding:6px;text-align:center;">Duration</th>
          <th style="color:#0f172a;padding:6px;text-align:left;">Instructions</th>
        </tr></thead>
        <tbody>${meds}</tbody>
      </table>

      ${advice ? `<div style="margin-top:20px;font-size:11px;line-height:1.6;"><b>Advice:</b> ${t(advice, data.language)}</div>` : ''}
      ${followUp ? `<div style="margin-top:8px;font-size:11px;"><b>Follow-up:</b> ${followUp}</div>` : ''}
    </div>

    <div style="position:absolute;bottom:28px;left:28px;right:28px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;padding-top:14px;">
      <div style="font-size:8px;color:#94a3b8;">Minimal Print Ruled · PrescriptionMaker.in</div>
      <div style="text-align:center;">
        <div style="width:120px;border-bottom:1px solid #334155;margin-bottom:4px;"></div>
        <div style="font-size:9px;color:#64748b;">Doctor's Signature</div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: BILINGUAL INDIAN ───────────────────────────────────────
function layoutBilingual(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '08' : '#fff'}">
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:${primaryColor};">${i + 1}</td>
      <td style="padding:8px 12px;font-weight:700;color:#0f172a;">${m.name}${m.strength ? ` <span style="font-weight:500;color:#64748b;">${m.strength}</span>` : ''}</td>
      <td style="padding:8px 10px;text-align:center;">${m.form || 'Tab'}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:600;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:8px 10px;text-align:center;">${m.duration || '-'}</td>
      <td style="padding:8px 10px;font-style:italic;color:#64748b;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { background:${primaryColor}; color:#fff; padding:18px 24px; text-align:center; }
  </style></head><body><div class="page">
    <div class="header">
      <div style="font-size:20px;font-weight:900;">${doctorInfo.clinicName || 'Medical Clinic'}</div>
      <div style="font-size:13px;font-weight:700;margin-top:3px;">Dr. ${doctorInfo.name} <span style="font-size:10px;color:${accentColor};margin-left:6px;">${doctorInfo.qualification || 'MBBS, MD'}</span></div>
      <div style="font-size:9.5px;color:${accentColor};margin-top:1px;">${doctorInfo.specialization || 'General Physician'} · Reg: ${doctorInfo.regNo || 'DOC-REG-01'}</div>
      <div style="font-size:9px;opacity:0.85;margin-top:3px;">📍 ${doctorInfo.address || 'Clinic Address'} · ☎ ${doctorInfo.phone || 'Phone'}</div>
    </div>

    <div style="padding:14px 24px;">
      <!-- BILINGUAL PATIENT DETAILS -->
      <div style="border:1.5px solid ${primaryColor}40;border-radius:6px;overflow:hidden;margin-bottom:12px;">
        <div style="background:${primaryColor}15;padding:6px 12px;font-size:9.5px;font-weight:800;color:${primaryColor};">PATIENT DETAILS / रोगी विवरण</div>
        <div style="display:flex;padding:10px 14px;justify-content:space-between;font-size:11px;">
          <div><span style="color:#64748b;">मरीज का नाम / Name:</span> <b>${patientInfo.name || '—'}</b></div>
          <div><span style="color:#64748b;">उम्र / लिंग (Age/Sex):</span> <b>${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</b></div>
          <div><span style="color:#64748b;">तारीख / Date:</span> <b>${date}</b></div>
        </div>
      </div>

      <!-- BILINGUAL DIAGNOSIS -->
      <div style="border:1.5px solid ${primaryColor}30;border-radius:6px;padding:8px 14px;background:#ffffff;margin-bottom:14px;">
        <div style="font-size:8.5px;font-weight:800;color:#64748b;">रोग निदान / DIAGNOSIS</div>
        <div style="font-size:13px;font-weight:800;color:${primaryColor};margin-top:2px;">${diagnosis || 'Clinical Diagnosis'}</div>
      </div>

      <!-- BILINGUAL ℞ MEDICINES TABLE -->
      <div style="font-size:13px;font-weight:900;color:${primaryColor};margin-bottom:6px;">℞ दवाइयाँ (Medicines)</div>
      <table>
        <thead><tr style="background:${primaryColor};">
          <th style="width:5%">#</th>
          <th style="width:36%">दवाई / Medicine</th>
          <th style="width:12%;text-align:center">Unit</th>
          <th style="width:18%;text-align:center">मात्रा / Frequency</th>
          <th style="width:13%;text-align:center">समय / Duration</th>
          <th style="width:16%">निर्देश / Instructions</th>
        </tr></thead>
        <tbody>${medRows}</tbody>
      </table>

      ${advice ? `<div class="section-title">सलाह / Advice</div><div class="advice-box">${t(advice, data.language)}</div>` : ''}
      ${labTests && labTests.length > 0 ? `<div class="section-title">जाँच / Investigations</div><ul style="padding-left:20px;line-height:1.8;">${labTests.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
      ${followUp ? `<div class="section-title">अगली मुलाकात / Follow-up</div><div class="advice-box">${followUp}</div>` : ''}
    </div>

    <div class="footer">
      <div class="footer-brand">Bilingual Indian · PrescriptionMaker.in</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:60px;height:60px;object-fit:contain;opacity:0.8;" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:80px;height:35px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:80px;border-bottom:1px solid #cbd5e1;height:24px;margin-bottom:4px;"></div>`}
          <div style="font-size:9px;color:#64748b;font-weight:700;">Dr. ${doctorInfo.name}</div>
          <div style="font-size:8px;color:#94a3b8;">डॉक्टर के हस्ताक्षर / Doctor's Signature</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: COMPARTMENTALIZED GRID ─────────────────────────────────
function layoutGrid(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles
  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? primaryColor + '08' : '#fff'}">
      <td style="padding:8px 12px;font-weight:700;color:#0f172a;">${i + 1}. ${m.name}${m.strength ? ` (${m.strength})` : ''}</td>
      <td style="padding:8px 10px;text-align:center;">${m.form || 'Tab'}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;">${m.frequency ? t(m.frequency, data.language) : '-'}</td>
      <td style="padding:8px 10px;text-align:center;">${m.duration || '-'}</td>
      <td style="padding:8px 10px;font-style:italic;color:#64748b;">${m.instructions ? t(m.instructions, data.language) : '-'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .header { background:${primaryColor}; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; }
    .grid-band { display:flex; border-bottom:1px solid ${primaryColor}20; background:#f8fafc; }
    .grid-col { flex:1; padding:8px 16px; border-right:1px solid ${primaryColor}20; }
    .grid-col:last-child { border-right:none; }
  </style></head><body><div class="page">
    <div class="header">
      <div>
        <div style="font-size:16px;font-weight:900;">Dr. ${doctorInfo.name}</div>
        <div style="font-size:10px;color:${accentColor};margin-top:2px;">${doctorInfo.qualification || 'MBBS, MD'} · Specialty Consultant</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px;font-weight:800;">${doctorInfo.clinicName || 'Multi-Specialty Clinic'}</div>
        <div style="font-size:9.5px;opacity:0.85;">☎ ${doctorInfo.phone || 'Contact'} · Reg: ${doctorInfo.regNo || 'MED-REG-01'}</div>
      </div>
    </div>

    <!-- 3-COL PATIENT BAR -->
    <div class="grid-band">
      <div class="grid-col"><div style="font-size:8px;font-weight:800;color:#94a3b8;">PATIENT NAME</div><div style="font-size:12px;font-weight:800;margin-top:2px;">${patientInfo.name || 'Patient Name'}</div></div>
      <div class="grid-col"><div style="font-size:8px;font-weight:800;color:#94a3b8;">AGE / SEX</div><div style="font-size:12px;font-weight:800;margin-top:2px;">${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</div></div>
      <div class="grid-col"><div style="font-size:8px;font-weight:800;color:#94a3b8;">DATE</div><div style="font-size:12px;font-weight:800;margin-top:2px;">${date}</div></div>
    </div>

    <!-- DIAGNOSIS BAND -->
    <div style="padding:10px 24px;background:${primaryColor}12;border-bottom:2px solid ${primaryColor};">
      <div style="font-size:8.5px;font-weight:800;color:${primaryColor};">CLINICAL DIAGNOSIS</div>
      <div style="font-size:13px;font-weight:900;color:${primaryColor};margin-top:2px;">${diagnosis || 'Clinical Diagnosis'}</div>
    </div>

    <div style="padding:14px 24px;">
      <table>
        <thead><tr style="background:${primaryColor};">
          <th style="width:40%">Medicine / Drugs</th>
          <th style="width:12%;text-align:center">Unit</th>
          <th style="width:16%;text-align:center">Frequency</th>
          <th style="width:14%;text-align:center">Duration</th>
          <th style="width:18%">Instructions</th>
        </tr></thead>
        <tbody>${medRows}</tbody>
      </table>

      <div style="display:flex;gap:14px;margin-top:16px;">
        <div style="flex:1;padding:12px;border:1px solid ${primaryColor}30;border-radius:4px;">
          <div style="font-size:9px;font-weight:800;color:${primaryColor};">ADVICE &amp; TESTS</div>
          <div style="font-size:10.5px;color:#475569;margin-top:4px;">${advice || 'Take plenty of fluids and rest'}${labTests && labTests.length > 0 ? ` · Tests: ${labTests.join(', ')}` : ''}</div>
        </div>
        <div style="flex:1;padding:12px;border:1px solid ${primaryColor}30;border-radius:4px;">
          <div style="font-size:9px;font-weight:800;color:${primaryColor};">FOLLOW-UP &amp; NEXT VISIT</div>
          <div style="font-size:10.5px;color:#475569;margin-top:4px;">${followUp || 'As needed or within 5 days'}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Compartmentalized Grid · PrescriptionMaker.in</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width:60px;height:60px;object-fit:contain;opacity:0.8;" />` : ''}
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="width:80px;height:35px;object-fit:contain;margin-bottom:4px;" />` : `<div style="width:80px;border-bottom:1px solid #cbd5e1;height:24px;margin-bottom:4px;"></div>`}
          <div style="font-size:9px;color:#64748b;font-weight:700;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT 11: DENTAL & CLINIC RX ──────────────────────────────────
function layoutDentalClinic(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const { primaryColor, accentColor, bgColor } = template.styles || { primaryColor: '#111827', accentColor: '#374151', bgColor: '#ffffff' }

  const clinicName = doctorInfo.clinicName ? doctorInfo.clinicName.toUpperCase() : 'MARQUEZ DENTAL CLINIC'
  const clinicAddress = doctorInfo.address || 'Brgy. San Jose, San Nicolas, Ilocos Norte'
  const clinicPhone = doctorInfo.phone || '09178302001'
  const doctorName = doctorInfo.name ? (doctorInfo.name.startsWith('Dr') ? doctorInfo.name : `Dr. ${doctorInfo.name}`) : 'Dra. Lois Gabrielle F. Marquez'
  const qual = doctorInfo.qualification || 'DMD'
  const regNo = doctorInfo.regNo || 'PRC-0078921'
  const spec = doctorInfo.specialization || 'PTR-1234567'

  const medRows = medicines.map((m, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 8px;font-weight:700;color:#111827;font-size:12px;">
        ${i + 1}. ${m.name} ${m.strength ? `<span style="font-weight:400;color:#64748b;">${m.strength}</span>` : ''}
      </td>
      <td style="padding:10px 8px;text-align:center;color:#475569;font-size:11px;">${m.form || 'Tab'}</td>
      <td style="padding:10px 8px;text-align:center;font-weight:600;color:#111827;font-size:11px;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding:10px 8px;text-align:center;color:#475569;font-size:11px;">${m.duration || '—'}</td>
      <td style="padding:10px 8px;color:#475569;font-style:italic;font-size:11px;">${m.instructions ? t(m.instructions, data.language) : '—'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, 'serif')}
    .header-table { width:100%; border-collapse:collapse; margin-bottom:14px; }
    .header-rx { width:120px; vertical-align:middle; text-align:center; }
    .rx-large { font-size:72px; font-family:"Times New Roman", Georgia, serif; font-weight:normal; color:#111827; line-height:1; }
    .clinic-cell { vertical-align:middle; padding-left:14px; }
    .clinic-title { font-size:22px; font-weight:800; font-family:"Times New Roman", Georgia, serif; color:#111827; letter-spacing:0.5px; }
    .clinic-address { font-size:11px; font-family:"Times New Roman", Georgia, serif; color:#374151; margin-top:3px; }
    .clinic-phone { font-size:11px; font-weight:700; color:#111827; margin-top:4px; }
    .clinic-hours { font-size:10px; font-family:"Times New Roman", Georgia, serif; color:#4b5563; margin-top:4px; line-height:1.4; }
    .divider-black { height:2.5px; background:#111827; width:100%; margin:4px 0 16px; }
    .patient-grid { width:100%; margin-bottom:18px; font-family:"Times New Roman", Georgia, serif; }
    .patient-row { display:flex; align-items:flex-end; margin-bottom:10px; font-size:12px; }
    .label { color:#111827; white-space:nowrap; margin-right:6px; font-weight:600; }
    .field-underlined { border-bottom:1px solid #111827; flex:1; min-height:18px; padding:0 4px; font-weight:600; color:#111827; }
    .content-area { min-height:550px; padding:0 6px; }
    .rx-symbol-small { font-size:32px; font-family:"Times New Roman", Georgia, serif; font-weight:bold; color:#111827; margin:10px 0 6px; }
    .meds-table { width:100%; border-collapse:collapse; margin-top:12px; }
    .meds-table thead tr { background:#111827; }
    .meds-table th { color:#fff; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; padding:8px; font-family:"Times New Roman", Georgia, serif; }
    .advice-section { margin-top:20px; padding:10px 14px; background:#f8fafc; border-left:3px solid #111827; }
    .advice-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:#111827; font-family:"Times New Roman", Georgia, serif; margin-bottom:4px; }
    .footer-doctor { display:flex; justify-content:flex-end; margin-top:40px; padding-right:16px; }
    .doctor-block { text-align:left; min-width:240px; font-family:"Times New Roman", Georgia, serif; }
    .doctor-name-title { font-size:14px; font-weight:800; color:#111827; }
    .doctor-subline { font-size:11.5px; color:#111827; margin-top:6px; display:flex; align-items:flex-end; }
    .underlined-val { border-bottom:1px solid #111827; flex:1; margin-left:6px; min-height:14px; font-weight:600; }
  </style></head><body>
    <div class="page" style="padding:32px 36px 40px;">
      <!-- Header -->
      <table class="header-table">
        <tr>
          <td class="header-rx">
            <div class="rx-large">℞</div>
          </td>
          <td class="clinic-cell">
            <div class="clinic-title">${clinicName}</div>
            <div class="clinic-address">${clinicAddress}</div>
            <div class="clinic-phone">📞 ${clinicPhone}</div>
            <div class="clinic-hours">
              Clinic Hours: Monday – Saturday &nbsp;|&nbsp; 9:00 AM – 12:00 NN &nbsp; 1:00 PM – 5:00 PM<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sunday &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp; By appointment
            </div>
          </td>
        </tr>
      </table>

      <!-- Solid Divider Line -->
      <div class="divider-black"></div>

      <!-- Underlined Patient Form -->
      <div class="patient-grid">
        <div class="patient-row">
          <div class="label">Patient's Name:</div>
          <div class="field-underlined" style="flex:3;">${patientInfo.name || ''}</div>
          <div class="label" style="margin-left:18px;">Age:</div>
          <div class="field-underlined" style="flex:1;">${patientInfo.age || ''}</div>
          <div class="label" style="margin-left:18px;">Gender:</div>
          <div class="field-underlined" style="flex:1;">${patientInfo.gender || ''}</div>
        </div>
        <div class="patient-row" style="margin-top:12px;">
          <div class="label">Address:</div>
          <div class="field-underlined" style="flex:3;">${patientInfo.phone || doctorInfo.address || ''}</div>
          <div class="label" style="margin-left:18px;">Date:</div>
          <div class="field-underlined" style="flex:1.5;">${date}</div>
        </div>
        ${diagnosis ? `
          <div class="patient-row" style="margin-top:12px;">
            <div class="label">Diagnosis / Dental Condition:</div>
            <div class="field-underlined" style="flex:1;font-weight:700;">${diagnosis}</div>
          </div>
        ` : ''}
      </div>

      <!-- Prescriptions Body -->
      <div class="content-area">
        ${medicines && medicines.length > 0 ? `
          <table class="meds-table">
            <thead>
              <tr>
                <th style="width:38%;">Medicine / Drug Prescribed</th>
                <th style="width:12%;text-align:center;">Form</th>
                <th style="width:16%;text-align:center;">Frequency</th>
                <th style="width:14%;text-align:center;">Duration</th>
                <th style="width:20%;">Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medRows}
            </tbody>
          </table>
        ` : `
          <div style="min-height:360px;"></div>
        `}

        ${labTests && labTests.length > 0 ? `
          <div class="advice-section" style="margin-top:16px;">
            <div class="advice-title">Dental Investigations / Imaging</div>
            <div style="font-size:11px;color:#374151;line-height:1.6;">${labTests.join(' &nbsp;•&nbsp; ')}</div>
          </div>
        ` : ''}

        ${advice ? `
          <div class="advice-section" style="margin-top:14px;">
            <div class="advice-title">Dental Advice &amp; Post-Op Precautions</div>
            <div style="font-size:11px;color:#374151;line-height:1.6;">${t(advice, data.language)}</div>
          </div>
        ` : ''}

        ${followUp ? `
          <div class="advice-section" style="margin-top:14px;">
            <div class="advice-title">Follow-up / Next Appointment</div>
            <div style="font-size:11px;color:#374151;">${followUp}</div>
          </div>
        ` : ''}
      </div>

      <!-- Doctor Signature & Credentials -->
      <div class="footer-doctor">
        <div class="doctor-block">
          ${doctorInfo.signature ? `
            <div style="text-align:center;margin-bottom:6px;">
              <img src="${doctorInfo.signature}" style="max-height:45px;max-width:140px;object-fit:contain;" />
            </div>
          ` : ''}
          <div class="doctor-name-title">${doctorName}, ${qual}</div>
          <div class="doctor-subline">
            <span>License No.</span>
            <span class="underlined-val">${regNo}</span>
          </div>
          <div class="doctor-subline">
            <span>PTR No.</span>
            <span class="underlined-val">${spec}</span>
          </div>
        </div>
      </div>
    </div>
  </body></html>`
}

// ── LAYOUT 12: MODERN TEAL RIBBON ──────────────────────────────────
function layoutModernTealRibbon(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const tealColor = '#00C4CC'
  const navyColor = '#0f2330'

  const doctorName = doctorInfo.name || 'Doctor Name'
  const qual = (doctorInfo.qualification || 'QUALIFICATION').toUpperCase()
  const otherDetails = doctorInfo.specialization || doctorInfo.clinicName || 'Add other details'
  const clinicAddress = doctorInfo.address || '24 Dummy Street Area'
  const clinicPhone = doctorInfo.phone || '+12-345 678 9012'

  const medRows = medicines.map((m, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#ffffff' : '#f0fdfe'};">
      <td style="padding:10px 12px;font-weight:700;color:#0e3860;font-size:12px;">
        ${i + 1}. ${m.name} ${m.strength ? `<span style="font-weight:400;color:#64748b;">${m.strength}</span>` : ''}
      </td>
      <td style="padding:10px 8px;text-align:center;color:#475569;font-size:11px;">${m.form || 'Tab'}</td>
      <td style="padding:10px 8px;text-align:center;font-weight:600;color:#0f2330;font-size:11px;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding:10px 8px;text-align:center;color:#475569;font-size:11px;">${m.duration || '—'}</td>
      <td style="padding:10px 10px;color:#475569;font-style:italic;font-size:11px;">${m.instructions ? t(m.instructions, data.language) : '—'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(tealColor, navyColor, '#ffffff', 'sans-serif')}
    .top-ribbon { position:absolute; top:0; right:0; width:380px; height:160px; z-index:1; }
    .header-info { padding:36px 36px 12px; }
    .doc-title { font-size:26px; font-weight:900; color:#0e3860; }
    .doc-title span { font-weight:400; color:#1e3a5f; }
    .doc-qual { font-size:11px; font-weight:800; letter-spacing:2.5px; color:#64748b; margin-top:4px; text-transform:uppercase; }
    .doc-rule { width:110px; height:2px; background:#cbd5e1; margin:6px 0 8px; }
    .doc-other { font-size:11px; font-style:italic; color:#64748b; }
    .patient-strip { padding:14px 36px; }
    .pat-line { display:flex; align-items:flex-end; margin-bottom:12px; font-size:12px; color:#334155; }
    .pat-label { white-space:nowrap; margin-right:8px; font-weight:600; }
    .pat-underlined { border-bottom:1px solid #cbd5e1; flex:1; min-height:18px; padding:0 4px; font-weight:600; color:#0f2330; }
    .main-content { padding:8px 36px 20px; min-height:550px; }
    .meds-table { width:100%; border-collapse:collapse; margin-top:14px; border-radius:6px; overflow:hidden; }
    .meds-table thead tr { background:${navyColor}; }
    .meds-table th { color:#fff; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; padding:9px 10px; }
    .caduceus-box { position:absolute; bottom:52px; left:36px; display:flex; align-items:center; }
    .caduceus-svg { width:56px; height:56px; }
    .corner-ribbon { position:absolute; bottom:0; left:0; width:220px; height:90px; }
    .sig-area { text-align:center; min-width:180px; }
    .sig-line-teal { border-top:1px solid #cbd5e1; padding-top:6px; font-size:11px; color:#64748b; margin-top:30px; }
    .footer-bar { position:absolute; bottom:14px; left:230px; right:36px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; font-size:11px; color:#475569; }
  </style></head><body>
    <div class="page">
      <!-- Top-Right Geometric Ribbon (Clean V-shape matching Image 1) -->
      <svg class="top-ribbon" viewBox="0 0 380 160">
        <polygon points="230,0 380,0 240,160 180,80" fill="${navyColor}" />
        <polygon points="0,0 120,0 240,160 120,160" fill="${tealColor}" />
      </svg>

      <!-- Doctor Header -->
      <div class="header-info" style="display:flex;align-items:center;gap:16px;">
        ${doctorInfo.logoUrl ? `<img src="${doctorInfo.logoUrl}" style="width:52px;height:52px;border-radius:50%;object-fit:contain;border:1px solid #e2e8f0;background:#ffffff;" />` : ''}
        <div>
          <div class="doc-title">Dr. <span>${doctorName.replace(/^Dr\.?\s*/i, '')}</span></div>
          <div class="doc-qual">${qual}</div>
          <div class="doc-rule"></div>
          <div class="doc-other">${otherDetails}</div>
        </div>
      </div>

      <!-- 3-Row Underlined Patient Strip -->
      <div class="patient-strip">
        <div class="pat-line">
          <div class="pat-label">Patient Name:</div>
          <div class="pat-underlined" style="flex:2.5;">${patientInfo.name || ''}</div>
          <div class="pat-label" style="margin-left:24px;">Date:</div>
          <div class="pat-underlined" style="flex:1;">${date}</div>
        </div>
        <div class="pat-line">
          <div class="pat-label">Age:</div>
          <div class="pat-underlined" style="flex:1;">${patientInfo.age || ''}</div>
          <div class="pat-label" style="margin-left:20px;">Gender:</div>
          <div class="pat-underlined" style="flex:1;">${patientInfo.gender || ''}</div>
          <div class="pat-label" style="margin-left:20px;">Weight:</div>
          <div class="pat-underlined" style="flex:1;">${patientInfo.weight || ''}</div>
        </div>
        <div class="pat-line">
          <div class="pat-label">Diagnosis:</div>
          <div class="pat-underlined" style="flex:1;font-weight:700;">${diagnosis || ''}</div>
        </div>
      </div>

      <!-- Main Prescriptions Area -->
      <div class="main-content">
        ${medicines && medicines.length > 0 ? `
          <table class="meds-table">
            <thead>
              <tr>
                <th style="width:38%;">Medicine / Drug Prescribed</th>
                <th style="width:12%;text-align:center;">Form</th>
                <th style="width:16%;text-align:center;">Frequency</th>
                <th style="width:14%;text-align:center;">Duration</th>
                <th style="width:20%;">Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medRows}
            </tbody>
          </table>
        ` : `
          <div style="min-height:360px;"></div>
        `}

        ${labTests && labTests.length > 0 ? `
          <div style="margin-top:16px;padding:10px 14px;background:#f0fdfe;border-left:3px solid ${tealColor};border-radius:0 4px 4px 0;">
            <div style="font-size:10px;font-weight:800;color:#0e3860;text-transform:uppercase;letter-spacing:0.5px;">Recommended Investigations</div>
            <div style="font-size:11px;color:#334155;margin-top:4px;">${labTests.join(' &nbsp;•&nbsp; ')}</div>
          </div>
        ` : ''}

        ${advice ? `
          <div style="margin-top:14px;padding:10px 14px;background:#f0fdfe;border-left:3px solid ${tealColor};border-radius:0 4px 4px 0;">
            <div style="font-size:10px;font-weight:800;color:#0e3860;text-transform:uppercase;letter-spacing:0.5px;">Medical Advice &amp; Instructions</div>
            <div style="font-size:11px;color:#334155;margin-top:4px;line-height:1.5;">${t(advice, data.language)}</div>
          </div>
        ` : ''}

        ${followUp ? `
          <div style="margin-top:14px;padding:10px 14px;background:#f8fafc;border-left:3px solid ${navyColor};border-radius:0 4px 4px 0;">
            <div style="font-size:10px;font-weight:800;color:#0e3860;text-transform:uppercase;letter-spacing:0.5px;">Follow-up Visit</div>
            <div style="font-size:11px;color:#334155;margin-top:4px;">${followUp}</div>
          </div>
        ` : ''}

        <!-- Signature Block -->
        <div style="display:flex;justify-content:flex-end;margin-top:36px;padding-right:20px;">
          <div class="sig-area">
            ${doctorInfo.signature ? `<img src="${doctorInfo.signature}" style="max-height:40px;max-width:140px;object-fit:contain;margin-bottom:4px;" />` : ''}
            <div class="sig-line-teal">Signature</div>
          </div>
        </div>
      </div>

      <!-- Bottom Caduceus Emblem & Corner Ribbon (Matching Image 1) -->
      <svg class="corner-ribbon" viewBox="0 0 220 90">
        <polygon points="0,90 60,0 96,48 84,90" fill="${navyColor}" />
        <polygon points="60,0 140,0 220,90 132,90" fill="${tealColor}" />
      </svg>

      <div class="caduceus-box">
        <svg class="caduceus-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="18" r="5" fill="${tealColor}" />
          <line x1="50" y1="23" x2="50" y2="88" stroke="${tealColor}" stroke-width="3" stroke-linecap="round" />
          <circle cx="50" cy="88" r="3" fill="${tealColor}" />
          <!-- Left Wing -->
          <path d="M 48 34 C 30 18 14 18 2 28 C 14 38 20 40 18 46 C 28 46 32 50 32 54 C 42 54 46 50 48 44 Z" fill="${tealColor}" />
          <!-- Right Wing -->
          <path d="M 52 34 C 70 18 86 18 98 28 C 86 38 80 40 82 46 C 72 46 68 50 68 54 C 58 54 54 50 52 44 Z" fill="${tealColor}" />
          <!-- Serpents -->
          <path d="M 46 38 C 34 44 35 50 50 54 C 66 58 66 68 50 72 C 38 76 40 82 48 84" fill="none" stroke="${tealColor}" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 54 38 C 66 44 65 50 50 54 C 34 58 34 68 50 72 C 62 76 60 82 52 84" fill="none" stroke="${tealColor}" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="46" cy="38" r="2.5" fill="${tealColor}" />
          <circle cx="54" cy="38" r="2.5" fill="${tealColor}" />
        </svg>
      </div>

      <!-- Footer Bar -->
      <div class="footer-bar">
        <span>📍 ${clinicAddress}</span>
        <span>📞 ${clinicPhone}</span>
      </div>
    </div>
  </body></html>`
}

// ── MAIN EXPORT — routes to the correct layout ─────────────────────
export function generatePrescriptionHTML(data: PrescriptionData): string {
  const templateId = data.template?.id || ''
  switch (templateId) {
    case 'dental-clinic':
      return layoutDentalClinic(data)
    case 'modern-teal-ribbon':
      return layoutModernTealRibbon(data)
    case 'two-column-sidebar':
      return layoutTwoColumn(data)
    case 'soap-clinical':
      return layoutSOAP(data)
    case 'vitals-first':
      return layoutVitalsFirst(data)
    case 'detailed-drug-chart':
      return layoutDetailedDrugChart(data)
    case 'multi-section-boxed':
      return layoutBoxed(data)
    case 'minimal-print-ruled':
      return layoutMinimal(data)
    case 'bilingual-indian':
      return layoutBilingual(data)
    case 'compartmentalized-grid':
      return layoutGrid(data)
    case 'classic-letterhead':
      return layoutClassic(data)
    default: {
      const layout = data.template?.layout
      if (layout === 'classic') return layoutClassic(data)
      if (layout === 'two-column') return layoutTwoColumn(data)
      if (layout === 'soap') return layoutSOAP(data)
      return layoutGeneric(data)
    }
  }
}

