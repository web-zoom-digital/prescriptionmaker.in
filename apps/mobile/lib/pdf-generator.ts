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
    temperature?: string
    spo2?: string
    respiratoryRate?: string
    rr?: string
    examination?: string
    height?: string
    opdRef?: string
    address?: string
    allergies?: string
    chiefComplaint?: string
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
  const font = (fontFamily === 'serif' || fontFamily?.includes('Georgia') || fontFamily?.includes('serif')) ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif'
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

/**
 * Renders doctor signature HTML block.
 * If signature image (base64 or URL) exists, renders high-res image.
 * If not, renders elegant cursive calligraphy text of doctor's name so signature is never missing!
 */
function renderDoctorSignatureHTML(
  signature: string | undefined,
  doctorDisplayName: string,
  imgHeight: number = 36,
  imgMaxW: number = 130
): string {
  if (signature && signature.trim()) {
    return `<img src="${signature}" style="height: ${imgHeight}px; max-width: ${imgMaxW}px; object-fit: contain; margin-bottom: 4px; display: inline-block;" />`
  }
  const cleanDoc = (doctorDisplayName || 'Doctor').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const fullDoc = cleanDoc ? `Dr. ${cleanDoc}` : ''
  return `<div style="font-family: 'Brush Script MT', 'Dancing Script', 'Great Vibes', 'Segoe Script', cursive, serif; font-size: 19px; font-style: italic; font-weight: 700; color: #1e293b; line-height: 1.1; margin-bottom: 4px; letter-spacing: 0.5px;">${fullDoc}</div>`
}

// ── LAYOUT: CLASSIC LETTERHEAD (centered, serif, elegant) ─────────
function layoutClassic(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date, template } = data
  const primaryColor = template.styles?.primaryColor || '#102A56'
  const accentColor = template.styles?.accentColor || '#155EEF'
  const bgColor = '#ffffff'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const qualSpec = [doctorInfo.qualification, doctorInfo.specialization].filter(Boolean).join(', ')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, 'serif')}
    .classic-page {
      width: 794px;
      max-width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      background: #ffffff;
      box-sizing: border-box;
      padding: 48px 52px;
      font-family: Georgia, 'Times New Roman', serif;
      color: #1e293b;
      position: relative;
    }
    .classic-header {
      text-align: center;
      border-bottom: 3px double ${primaryColor};
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .classic-clinic {
      font-size: 24px;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-doc {
      font-size: 15px;
      font-weight: 700;
      color: #374151;
      margin-top: 4px;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-qual {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      font-style: italic;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-reg {
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .classic-contact {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 5px;
      display: flex;
      justify-content: center;
      gap: 18px;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-pat-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .classic-pat-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e293b;
      text-decoration: underline;
      text-decoration-style: dotted;
    }
    .classic-diag {
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .classic-rx-sym {
      font-size: 36px;
      font-family: Georgia, 'Times New Roman', serif;
      font-weight: 900;
      font-style: italic;
      color: ${primaryColor};
      margin-bottom: 12px;
      margin-top: 6px;
      line-height: 1;
    }
    .classic-med-item {
      margin-bottom: 14px;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 10px;
    }
    .classic-med-title {
      font-weight: 700;
      color: #1e293b;
      font-size: 12.5px;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-med-sub {
      padding-left: 22px;
      margin-top: 3px;
      font-size: 10.5px;
      color: #475569;
      font-style: italic;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-section {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    .classic-sec-title {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 4px;
      font-style: italic;
    }
    .classic-sec-content {
      color: #374151;
      font-size: 10.5px;
      white-space: pre-wrap;
      padding-left: 4px;
      line-height: 1.8;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .classic-sig-area {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      gap: 20px;
    }
    .classic-footer-brand {
      margin-top: 24px;
      text-align: center;
      font-size: 8.5px;
      color: #cbd5e1;
      letter-spacing: 1px;
      font-family: Georgia, 'Times New Roman', serif;
    }
  </style></head><body><div class="page classic-page" style="padding: 48px 52px; background: #ffffff; box-sizing: border-box; font-family: Georgia, 'Times New Roman', serif;">
    <!-- Centered Masthead Header -->
    <div class="classic-header">
      ${doctorInfo.logoUrl ? `<img src="${doctorInfo.logoUrl}" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 8px; border-radius: 25px;" />` : ''}
      <div class="classic-clinic">${doctorInfo.clinicName || 'Medical Clinic'}</div>
      <div class="classic-doc">${doctorDisplayName}</div>
      ${qualSpec ? `<div class="classic-qual">${qualSpec}</div>` : ''}
      ${doctorInfo.regNo ? `<div class="classic-reg">Reg. No: ${doctorInfo.regNo}</div>` : ''}
      <div class="classic-contact">
        ${doctorInfo.address ? `<span>📍 ${doctorInfo.address}</span>` : ''}
        ${doctorInfo.phone ? `<span>☎ ${doctorInfo.phone}</span>` : ''}
      </div>
    </div>

    <!-- Patient + Date Row -->
    <div class="classic-pat-row">
      <div>
        <span style="font-size: 10px; color: #94a3b8;">Patient: </span>
        <span class="classic-pat-name">${patientInfo.name || '________________________________'}</span>
        ${(patientInfo.age || patientInfo.gender) ? `
          <span style="margin-left: 14px; font-size: 10px; color: #64748b;">
            Age: <strong>${patientInfo.age || '—'}</strong>${patientInfo.gender ? ` / ${patientInfo.gender}` : ''}
          </span>
        ` : ''}
      </div>
      <div style="font-size: 10px; color: #64748b;">
        Date: <strong>${date}</strong>
      </div>
    </div>

    <!-- Chief Complaint / Diagnosis Row -->
    ${(diagnosis || symptoms) ? `
      <div class="classic-diag">
        <span style="color: #94a3b8; font-style: italic;">Chief Complaint / Diagnosis: </span>
        <span style="color: #1e293b; font-weight: 600;">${diagnosis || symptoms}</span>
      </div>
    ` : ''}

    <!-- Large Italic Serif ℞ -->
    <div class="classic-rx-sym">℞</div>

    <!-- Numbered Medicine List — NO TABLE (Clean dotted letterhead entries) -->
    <div style="padding-left: 4px; min-height: 280px;">
      ${medicines.length === 0 ? `
        <div class="classic-med-item"><span style="color: #94a3b8; font-size: 10.5px;">1.&nbsp;&nbsp;________________________________________________</span></div>
        <div class="classic-med-item"><span style="color: #94a3b8; font-size: 10.5px;">2.&nbsp;&nbsp;________________________________________________</span></div>
        <div class="classic-med-item"><span style="color: #94a3b8; font-size: 10.5px;">3.&nbsp;&nbsp;________________________________________________</span></div>
      ` : medicines.map((med, idx) => `
        <div class="classic-med-item">
          <div class="classic-med-title">
            ${idx + 1}.&nbsp;&nbsp;${med.name}${med.strength ? ` — ${med.strength}` : ''}${med.form ? ` (${med.form})` : ''}
          </div>
          <div class="classic-med-sub">
            ${[med.frequency ? t(med.frequency, data.language) : '', med.timing ? t(med.timing, data.language) : '', med.duration].filter(Boolean).join('  ·  ')}
            ${med.instructions ? ` (${t(med.instructions, data.language)})` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Advice & Instructions -->
    ${advice ? `
      <div class="classic-section">
        <div class="classic-sec-title">Advice &amp; Instructions:</div>
        <div class="classic-sec-content">${t(advice, data.language)}</div>
      </div>
    ` : ''}

    <!-- Investigations -->
    ${labTests && labTests.length > 0 ? `
      <div style="margin-top: 10px; font-size: 10.5px;">
        <span style="color: #94a3b8; font-style: italic;">Investigations: </span>
        <span style="color: #374151; font-family: Georgia, serif;">${labTests.join(', ')}</span>
      </div>
    ` : ''}

    <!-- Follow-up -->
    ${followUp ? `
      <div style="margin-top: 8px; font-size: 10px; color: #64748b;">
        <em style="font-style: italic;">Follow-up on:</em> <strong>${followUp}</strong>
      </div>
    ` : ''}

    <!-- Signature Block -->
    <div class="classic-sig-area">
      ${doctorInfo.stampUrl ? `<img src="${doctorInfo.stampUrl}" style="width: 52px; height: 52px; object-fit: contain; opacity: 0.85;" />` : ''}
      <div style="text-align: center; min-width: 160px;">
        ${renderDoctorSignatureHTML(doctorInfo.signature, doctorDisplayName, 40, 140)}
        <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-size: 10.5px; font-weight: 600; color: #475569; font-family: Georgia, serif;">Doctor's Signature</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 1px; font-family: Georgia, serif;">${doctorDisplayName}</div>
      </div>
    </div>

    <!-- Subtle Letterhead Footer -->
    <div class="classic-footer-brand">
      prescriptionmaker.in
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
            ${renderDoctorSignatureHTML(doctorInfo.signature, doctorInfo.name, 32, 100)}
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
    { label: 'Temp (°F)', value: patientInfo.temp || patientInfo.temperature },
    { label: 'SpO₂ (%)', value: patientInfo.spo2 },
    { label: 'Weight (kg)', value: patientInfo.weight },
    { label: 'RR (/min)', value: patientInfo.respiratoryRate || patientInfo.rr }
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
        <strong style="color: #0f172a; font-size: 11px;">${patientInfo.name || 'Patient Name'}</strong>
        ${[patientInfo.age ? `Age ${patientInfo.age}` : '', patientInfo.gender].filter(Boolean).length > 0 ? `
          <span style="color: #64748b; margin-left: 12px;">${[patientInfo.age ? `Age ${patientInfo.age}` : '', patientInfo.gender].filter(Boolean).join(' / ')}</span>
        ` : ''}
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
          Examination findings: ${patientInfo.examination || symptoms || 'Normal heart sounds, clear chest, abdomen soft.'}
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
        ${renderDoctorSignatureHTML(doctorInfo.signature, doctorDisplayName, 36, 130)}
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
          ${renderDoctorSignatureHTML(doctorInfo.signature, doctorInfo.name, 35, 110)}
          <div style="font-size:9px;color:#94a3b8;font-weight:600;">Dr. ${doctorInfo.name}</div>
        </div>
      </div>
    </div>
  </div></body></html>`
}

// ── LAYOUT: VITALS-FIRST (Cardiology & Specialty) ──────────────────
function layoutVitalsFirst(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const primaryColor = '#9b2335'
  const accentColor = '#e53e3e'
  const bgColor = '#fff5f5'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Full Name'
  const qual = doctorInfo.qualification || 'MBBS, MD'
  const spec = doctorInfo.specialization || 'General Medicine'
  const clinicName = doctorInfo.clinicName || 'Name of your clinic'

  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fff5f5'};">
      <td style="padding:8px 10px;font-weight:700;color:${primaryColor};text-align:center;">${i + 1}</td>
      <td style="padding:8px 12px;font-weight:700;color:#0f172a;">${m.name}${m.strength ? ` <span style="font-weight:500;color:#64748b;">(${m.strength})</span>` : ''}</td>
      <td style="padding:8px 10px;text-align:center;color:#475569;">${m.form || (m as any).dosage || '—'}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:600;color:#1e293b;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding:8px 10px;text-align:center;color:#475569;">${m.duration || '—'}</td>
      <td style="padding:8px 10px;font-style:italic;color:#64748b;">${m.instructions ? t(m.instructions, data.language) : ((m as any).qty || '—')}</td>
    </tr>`).join('')

  // Clean dynamic vitals values with robust resolution and sensible fallbacks matching template
  const rawBp = (patientInfo.bp || (patientInfo as any).bloodPressure || '').trim()
  const rawPulse = (patientInfo.pulse || (patientInfo as any).heartRate || (patientInfo as any).hr || '').trim()
  const rawSpo2 = (patientInfo.spo2 || (patientInfo as any).spO2 || '').trim()
  const rawTemp = (patientInfo.temp || patientInfo.temperature || '').trim()
  const rawWeight = (patientInfo.weight || '').trim()
  const rawRR = (patientInfo.respiratoryRate || (patientInfo as any).rr || '').trim()

  const bpVal = rawBp || '120/80'
  const hrVal = rawPulse || '72'
  const spo2Val = rawSpo2 ? (rawSpo2.includes('%') ? rawSpo2 : `${rawSpo2}%`) : '98%'
  const tempVal = rawTemp ? (rawTemp.includes('°') ? rawTemp : `${rawTemp}°F`) : '98.4°F'
  const wtVal = rawWeight ? (rawWeight.toLowerCase().includes('kg') ? rawWeight : `${rawWeight} kg`) : '70 kg'
  const rrVal = rawRR || '16'

  // Investigations checklist matching screenshot 2
  const defaultInvestigationItems = ['ECG', 'ECHO (TTE)', 'TMT', 'Holter', 'Lipid Profile', 'HbA1c', 'CBC', 'LFT/KFT']
  const userTests = (labTests && labTests.length > 0) ? labTests : []
  const combinedTests = Array.from(new Set([...defaultInvestigationItems, ...userTests]))

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .vh-header {
      background: ${primaryColor};
      color: #ffffff;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .vh-doc-name { font-size: 21px; font-weight: 900; letter-spacing: -0.2px; }
    .vh-doc-qual { font-size: 10px; color: #fca5a5; margin-top: 2px; }
    .vh-doc-spec { font-size: 10px; color: #fca5a5; margin-top: 1px; }
    .vh-clinic-name { font-size: 14px; font-weight: 700; text-align: right; letter-spacing: 0.2px; }

    .pat-card {
      margin: 10px 24px 0;
      padding: 8px 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }

    .vitals-container {
      margin: 10px 24px 10px;
      border: 1.5px solid ${primaryColor};
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }
    .vitals-header-bar {
      background: ${primaryColor};
      color: #ffffff;
      padding: 5px 12px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .vitals-table {
      width: 100%;
      border-collapse: collapse;
      background: #fdf2f2;
    }
    .vital-cell {
      width: 33.333%;
      padding: 6px 14px;
      border-right: 1px solid rgba(155, 35, 53, 0.2);
      border-top: 1px solid rgba(155, 35, 53, 0.2);
      vertical-align: top;
      box-sizing: border-box;
    }
    .vital-cell-top { border-top: none; }
    .vital-cell-rightless { border-right: none; }
    .vital-name {
      font-size: 8px;
      font-weight: 800;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .vital-unit {
      font-size: 7.5px;
      color: #b91c1c;
      margin-top: 1px;
    }
    .vital-line {
      border-bottom: 1.2px solid #f87171;
      height: 20px;
      line-height: 20px;
      margin-top: 2px;
      padding-bottom: 2px;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .diag-banner {
      margin: 0 24px 10px;
      padding: 7px 14px;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-left: 4px solid ${primaryColor};
      border-radius: 4px;
      font-size: 11.5px;
    }
    .diag-tag { font-size: 9px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; margin-right: 6px; }
    .diag-val { font-weight: 700; color: #0f172a; }

    .rx-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 24px 6px;
    }
    .rx-glyph { font-family: Georgia, serif; font-size: 20px; font-weight: 900; color: ${primaryColor}; line-height: 1; }
    .rx-heading { font-size: 10px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.6px; }

    .med-table {
      margin: 0 24px;
      width: calc(100% - 48px);
      border-collapse: collapse;
    }
    .med-table thead tr { background: ${primaryColor}; }
    .med-table th {
      color: #ffffff;
      padding: 7px 10px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .cardiac-inv-box {
      margin: 10px 24px 0;
      padding: 8px 14px;
      background: #ffffff;
      border: 1px solid #fecdd3;
      border-radius: 4px;
    }
    .cardiac-inv-title {
      font-size: 8.5px;
      font-weight: 800;
      color: ${primaryColor};
      text-transform: uppercase;
      margin-bottom: 5px;
      letter-spacing: 0.3px;
    }
    .cardiac-inv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 9.5px;
      color: #334155;
    }
    .cardiac-inv-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .checkbox-square {
      width: 11px;
      height: 11px;
      border: 1.2px solid #f87171;
      border-radius: 2px;
      display: inline-block;
      background: #ffffff;
    }
    .checkbox-square-checked {
      background: ${primaryColor};
      border-color: ${primaryColor};
    }

    .follow-sig-row {
      margin: 18px 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .follow-text {
      font-size: 11px;
      color: #64748b;
    }
    .follow-underline {
      display: inline-block;
      border-bottom: 1px solid #94a3b8;
      min-width: 110px;
      text-align: center;
      color: #0f172a;
      font-weight: 600;
      padding-bottom: 1px;
    }

    .bottom-bar {
      margin: 16px 24px 14px;
      background: ${primaryColor};
      border-radius: 6px;
      padding: 7px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 600;
    }
  </style></head><body><div class="page">

    <!-- TOP CRIMSON HEADER -->
    <div class="vh-header">
      <div>
        <div class="vh-doc-name">${doctorDisplayName}</div>
        <div class="vh-doc-qual">${qual}</div>
        <div class="vh-doc-spec">${spec}</div>
      </div>
      <div>
        <div class="vh-clinic-name">${clinicName}</div>
      </div>
    </div>

    <!-- PATIENT INFO BAR -->
    <div class="pat-card">
      <div>
        <span style="color:#94a3b8;font-size:10px;font-weight:700;">PATIENT:</span>
        <span style="font-weight:700;color:#0f172a;margin-left:4px;font-size:12px;">${patientInfo.name || 'Patient full name'}</span>
        <span style="margin-left:14px;color:#64748b;">Age: <b style="color:#0f172a;">${patientInfo.age || '—'}</b>  Sex: <b style="color:#0f172a;">${patientInfo.gender || '—'}</b></span>
      </div>
      <div style="color:#64748b;">
        Date: <b style="color:#0f172a;">${date}</b>
      </div>
    </div>

    <!-- ❤️ VITALS 2x3 GRID (Matching Screenshot 1) -->
    <div class="vitals-container">
      <div class="vitals-header-bar">❤️ VITALS</div>
      <table class="vitals-table">
        <tbody>
          <!-- Row 1 -->
          <tr>
            <td class="vital-cell vital-cell-top">
              <div class="vital-name">BLOOD PRESSURE</div>
              <div class="vital-unit">(mmHg)</div>
              <div class="vital-line">${bpVal}</div>
            </td>
            <td class="vital-cell vital-cell-top">
              <div class="vital-name">HEART RATE</div>
              <div class="vital-unit">(bpm)</div>
              <div class="vital-line">${hrVal}</div>
            </td>
            <td class="vital-cell vital-cell-top vital-cell-rightless">
              <div class="vital-name">SPO₂</div>
              <div class="vital-unit">(%)</div>
              <div class="vital-line">${spo2Val}</div>
            </td>
          </tr>
          <!-- Row 2 -->
          <tr>
            <td class="vital-cell">
              <div class="vital-name">TEMPERATURE</div>
              <div class="vital-unit">(°F)</div>
              <div class="vital-line">${tempVal}</div>
            </td>
            <td class="vital-cell">
              <div class="vital-name">WEIGHT</div>
              <div class="vital-unit">(kg)</div>
              <div class="vital-line">${wtVal}</div>
            </td>
            <td class="vital-cell vital-cell-rightless">
              <div class="vital-name">RR</div>
              <div class="vital-unit">(/min)</div>
              <div class="vital-line">${rrVal}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- DIAGNOSIS BAR -->
    <div class="diag-banner">
      <span class="diag-tag">DIAGNOSIS:</span>
      <span class="diag-val">${diagnosis || 'Acute Pharyngitis'}</span>
    </div>

    <!-- ℞ PRESCRIPTION MEDICINES -->
    <div class="rx-title-row">
      <span class="rx-glyph">℞</span>
      <span class="rx-heading">PRESCRIPTION MEDICINES</span>
    </div>
    <table class="med-table">
      <thead><tr>
        <th style="width:5%;text-align:center;">#</th>
        <th style="width:36%;">Medicine (Strength)</th>
        <th style="width:14%;text-align:center;">Dosage</th>
        <th style="width:16%;text-align:center;">Frequency</th>
        <th style="width:14%;text-align:center;">Duration</th>
        <th style="width:15%;text-align:center;">Qty</th>
      </tr></thead>
      <tbody>${medRows}</tbody>
    </table>

    <!-- CARDIAC INVESTIGATIONS (Matching Screenshot 2) -->
    <div class="cardiac-inv-box">
      <div class="cardiac-inv-title">CARDIAC INVESTIGATIONS</div>
      <div class="cardiac-inv-list">
        ${combinedTests.map(test => {
          const isChecked = userTests.includes(test)
          return `
            <div class="cardiac-inv-item">
              <span class="checkbox-square ${isChecked ? 'checkbox-square-checked' : ''}"></span>
              <span>${test}</span>
            </div>
          `
        }).join('')}
      </div>
    </div>

    ${advice ? `<div style="margin:10px 24px 0;padding:8px 14px;background:#fff5f5;border-left:3px solid ${primaryColor};border-radius:4px;font-size:11px;line-height:1.5;"><b>Advice:</b> ${t(advice, data.language)}</div>` : ''}

    <!-- FOLLOW-UP & SIGNATURE (Matching Screenshot 2) -->
    <div class="follow-sig-row">
      <div class="follow-text">
        Follow-up Date: <span class="follow-underline">${followUp || ''}</span>
      </div>

      <div style="text-align:center;min-width:140px;">
        ${renderDoctorSignatureHTML(doctorInfo.signature, doctorDisplayName, 38, 140)}
        <div style="border-top:1px solid #94a3b8;width:140px;margin-top:2px;"></div>
        <div style="font-size:10px;font-weight:700;color:#334155;margin-top:3px;">Doctor's Signature</div>
        <div style="font-size:8.5px;color:#64748b;">${doctorDisplayName}</div>
      </div>
    </div>

    <!-- BOTTOM CRIMSON BAR (Matching Screenshot 2) -->
    <div class="bottom-bar">
      <span>${clinicName}</span>
      <span>prescriptionmaker.in</span>
    </div>

  </div></body></html>`
}

// ── LAYOUT: DETAILED DRUG CHART ────────────────────────────────────
function layoutDetailedDrugChart(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, medicines, advice, followUp, labTests, date, template } = data
  const primaryColor = '#065f46' // Deep forest green
  const accentColor = '#10b981'
  const bgColor = '#f0fdf4'
  const borderColor = '#a7f3d0'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Full Name'
  const qual = doctorInfo.qualification || 'MBBS, MD'
  const spec = doctorInfo.specialization || 'General Medicine'
  const clinicName = doctorInfo.clinicName || 'Name of your clinic'

  const formatRoute = (m: Medicine) => {
    if ((m as any).route) return (m as any).route
    const form = (m.form || '').toLowerCase()
    if (form.includes('inj')) return 'IV / IM'
    if (form.includes('drop')) return 'Drops'
    if (form.includes('cream') || form.includes('oint') || form.includes('gel')) return 'Topical'
    if (form.includes('inhale')) return 'Inhalation'
    return 'Oral'
  }

  const formatTiming = (m: Medicine) => {
    if ((m as any).timing) return (m as any).timing
    const inst = (m.instructions || '').toLowerCase()
    if (inst.includes('after meal') || inst.includes('after food')) return 'After Meals'
    if (inst.includes('before meal') || inst.includes('before food') || inst.includes('empty stomach')) return 'Before Meals'
    if (inst.includes('bedtime') || inst.includes('night')) return 'At Bedtime'
    if (inst.includes('morning')) return 'Morning'
    return '—'
  }

  // Fallback to sample medicines if empty, matching template
  const medsToRender = (medicines && medicines.length > 0 && medicines.some(m => m.name.trim()))
    ? medicines.filter(m => m.name.trim())
    : [
        { id: 'sample-1', name: 'Medicine Name', strength: '', form: 'Oral', frequency: '—', duration: '5 days', instructions: '' },
        { id: 'sample-2', name: 'Second Medicine', strength: '', form: 'Oral', frequency: '—', duration: '3 days', instructions: '' },
      ]

  const drugCardsHTML = medsToRender.map((m, i) => `
    <div class="ddc-drug-card">
      <div class="ddc-drug-header">
        <span class="ddc-drug-num">${i + 1}</span>
        <span class="ddc-drug-title">${m.name}${m.strength ? ` <span style="font-weight:600;color:#475569;">(${m.strength})</span>` : ''}</span>
      </div>
      <table class="ddc-drug-fields">
        <thead>
          <tr>
            <th style="width:25%;">ROUTE</th>
            <th style="width:25%;">FREQUENCY</th>
            <th style="width:25%;">TIMING</th>
            <th style="width:25%;">DURATION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${formatRoute(m)}</td>
            <td>${m.frequency ? t(m.frequency, data.language) : '—'}</td>
            <td>${formatTiming(m)}</td>
            <td style="font-weight:700;color:${primaryColor};">${m.duration || '—'}</td>
          </tr>
        </tbody>
      </table>
      ${m.instructions ? `
        <div class="ddc-drug-notes">
          <span style="font-weight:700;color:${primaryColor};">Note:</span> ${t(m.instructions, data.language)}
        </div>
      ` : ''}
    </div>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, template.styles.fontFamily)}
    .ddc-header {
      background: ${primaryColor};
      color: #ffffff;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ddc-doc-name { font-size: 21px; font-weight: 900; letter-spacing: -0.2px; }
    .ddc-doc-qual { font-size: 10.5px; color: #a7f3d0; margin-top: 2px; }
    .ddc-clinic-name { font-size: 14.5px; font-weight: 700; text-align: right; }

    .ddc-top-cards {
      width: calc(100% - 48px);
      margin: 12px 24px 10px;
      border-collapse: separate;
      border-spacing: 12px 0;
    }
    .ddc-patient-card {
      width: 58%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px 14px;
      vertical-align: top;
    }
    .ddc-diag-card {
      width: 42%;
      background: #ecfdf5;
      border: 1px solid ${borderColor};
      border-radius: 4px;
      padding: 10px 14px;
      vertical-align: top;
    }

    .ddc-rx-row {
      margin: 4px 24px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ddc-rx-glyph {
      font-family: Georgia, serif;
      font-size: 22px;
      font-weight: 900;
      color: ${primaryColor};
      line-height: 1;
    }
    .ddc-rx-line {
      flex: 1;
      border-bottom: 1.5px solid ${borderColor};
    }

    .ddc-drug-card {
      margin: 0 24px 9px;
      background: #ffffff;
      border: 1px solid ${borderColor};
      border-left: 4px solid ${primaryColor};
      border-radius: 4px;
      overflow: hidden;
    }
    .ddc-drug-header {
      background: #f0fdf4;
      padding: 7px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .ddc-drug-num {
      font-size: 12px;
      font-weight: 800;
      color: ${primaryColor};
      min-width: 14px;
    }
    .ddc-drug-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .ddc-drug-fields {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
    }
    .ddc-drug-fields th {
      padding: 5px 12px 2px;
      font-size: 7.5px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    .ddc-drug-fields td {
      padding: 2px 12px 7px;
      font-size: 11px;
      font-weight: 600;
      color: #1e293b;
      text-align: left;
    }
    .ddc-drug-notes {
      padding: 4px 12px 6px;
      background: #f0fdf4;
      border-top: 0.5px dashed #cbd5e1;
      font-size: 9.5px;
      color: #475569;
    }

    .ddc-bottom-bar {
      margin: 18px 24px 14px;
      background: #064e3b;
      border-radius: 6px;
      padding: 7px 18px;
      text-align: center;
      color: #d1fae5;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  </style></head><body><div class="page">

    <!-- TOP FOREST GREEN HEADER -->
    <div class="ddc-header">
      <div>
        <div class="ddc-doc-name">${doctorDisplayName}</div>
        <div class="ddc-doc-qual">${qual} &middot; ${spec}</div>
      </div>
      <div>
        <div class="ddc-clinic-name">${clinicName}</div>
      </div>
    </div>

    <!-- SIDE-BY-SIDE PATIENT & DIAGNOSIS CARDS -->
    <table class="ddc-top-cards">
      <tr>
        <td class="ddc-patient-card">
          <div style="font-size:8px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">PATIENT</div>
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:2px;">${patientInfo.name || 'Patient full name'}</div>
          <div style="font-size:9.5px;color:#64748b;margin-top:2px;">Age ${patientInfo.age || '34'} &middot; ${patientInfo.gender || 'Male'} &middot; Date: ${date}</div>
        </td>
        <td class="ddc-diag-card">
          <div style="font-size:8px;font-weight:800;color:${primaryColor};text-transform:uppercase;letter-spacing:0.5px;">DIAGNOSIS</div>
          <div style="font-size:13px;font-weight:800;color:${primaryColor};margin-top:2px;">${diagnosis || 'Acute Pharyngitis'}</div>
        </td>
      </tr>
    </table>

    <!-- ℞ DIVIDER LINE -->
    <div class="ddc-rx-row">
      <span class="ddc-rx-glyph">℞</span>
      <div class="ddc-rx-line"></div>
    </div>

    <!-- DETAILED DRUG CARDS (Core Template Feature) -->
    ${drugCardsHTML}

    <!-- INVESTIGATIONS & SPECIAL INSTRUCTIONS (If present) -->
    ${((labTests && labTests.length > 0) || advice) ? `
      <div style="margin:8px 24px 0;display:flex;gap:10px;">
        ${labTests && labTests.length > 0 ? `
          <div style="flex:1;background:#ffffff;border:1px solid ${borderColor};border-radius:4px;padding:8px 12px;">
            <div style="font-size:8px;font-weight:800;color:${primaryColor};text-transform:uppercase;letter-spacing:0.4px;">LAB INVESTIGATIONS</div>
            <div style="font-size:10px;color:#334155;margin-top:3px;font-weight:500;">${labTests.join(', ')}</div>
          </div>
        ` : ''}
        ${advice ? `
          <div style="flex:1;background:#f0fdf4;border:1px solid ${borderColor};border-radius:4px;padding:8px 12px;">
            <div style="font-size:8px;font-weight:800;color:${primaryColor};text-transform:uppercase;letter-spacing:0.4px;">SPECIAL INSTRUCTIONS / ADVICE</div>
            <div style="font-size:10px;color:#334155;margin-top:3px;font-weight:500;">${advice}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- SIGNATURE & FOLLOW-UP -->
    <div style="margin:18px 24px 0;display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="min-width:125px;">
        ${renderDoctorSignatureHTML(doctorInfo.signature, doctorInfo.name, 35, 110)}
        <div style="width:120px;border-top:1px solid #cbd5e1;margin-bottom:3px;"></div>
        <div style="font-size:9px;font-weight:700;color:#475569;">Doctor's Signature</div>
        <div style="font-size:8.5px;color:#94a3b8;">${doctorDisplayName}</div>
      </div>
      ${followUp ? `
        <div style="font-size:10.5px;color:#64748b;text-align:right;">
          Follow-up: <b style="color:${primaryColor};">${followUp}</b>
        </div>
      ` : ''}
    </div>

    <!-- BOTTOM BAR (Matching Template) -->
    <div class="ddc-bottom-bar">
      Detailed Drug Chart Template &middot; prescriptionmaker.in
    </div>

  </div></body></html>`
}

// ── LAYOUT: MULTI-SECTION BOXED ────────────────────────────────────
function layoutBoxed(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date, template } = data
  const navyColor = '#0c3258'
  const skyColor = '#38bdf8'
  const accentColor = '#38bdf8'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Full Name'
  const qual = doctorInfo.qualification || 'MBBS, MD'
  const spec = doctorInfo.specialization || 'General Medicine'
  const clinicName = doctorInfo.clinicName || 'Name of your clinic'

  const chiefComplaint = symptoms || (patientInfo as any).chiefComplaint || diagnosis || 'Acute Pharyngitis'
  const diagText = diagnosis || 'Acute Pharyngitis'

  // Fallback to sample medicines if empty, matching template
  const medsToRender = (medicines && medicines.length > 0 && medicines.some(m => m.name.trim()))
    ? medicines.filter(m => m.name.trim())
    : [
        { id: 'sample-1', name: 'Medicine Name', strength: '', form: '—', frequency: '—', duration: '5 days', instructions: '' },
        { id: 'sample-2', name: 'Second Medicine', strength: '', form: '—', frequency: '—', duration: '3 days', instructions: '' },
      ]

  const medRows = medsToRender.map((m, i) => `
    <tr>
      <td style="padding:7px 12px;font-weight:700;color:#0f172a;">
        ${i + 1}. ${m.name}${m.strength ? ` (${m.strength})` : ''}
        ${m.instructions ? `<div style="font-size:9.5px;color:#64748b;font-style:italic;margin-top:1px;">${t(m.instructions, data.language)}</div>` : ''}
      </td>
      <td style="padding:7px 10px;text-align:center;color:#475569;">${m.form || (m as any).unit || '—'}</td>
      <td style="padding:7px 10px;text-align:center;font-weight:600;color:#1e293b;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding:7px 12px;text-align:center;color:#475569;">${m.duration || '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(navyColor, skyColor, '#ffffff', template.styles.fontFamily)}
    .msb-header {
      background: ${navyColor};
      color: #ffffff;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .msb-doc-name { font-size: 21px; font-weight: 900; letter-spacing: -0.2px; }
    .msb-doc-qual { font-size: 10.5px; color: #7dd3fc; margin-top: 2px; }
    .msb-clinic-name { font-size: 14.5px; font-weight: 700; text-align: right; }

    .msb-container {
      padding: 12px 24px 20px;
    }

    .msb-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 9px;
    }
    .msb-banner-sky {
      background: ${skyColor};
      color: #ffffff;
      padding: 5px 12px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .msb-banner-navy {
      background: ${navyColor};
      color: #ffffff;
      padding: 5px 12px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .msb-box-body {
      padding: 8px 12px;
      background: #ffffff;
    }

    .msb-split-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px 0;
      margin-bottom: 9px;
    }

    .msb-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
    }
    .msb-table th {
      background: #f0f9ff;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 12px;
      font-size: 8.5px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .msb-table td {
      border-bottom: 0.8px solid #f1f5f9;
      font-size: 11px;
    }

    .msb-sig-block {
      margin-top: 18px;
      min-width: 125px;
    }
    .msb-sig-line {
      width: 120px;
      border-top: 1px solid #cbd5e1;
      margin-top: 2px;
      margin-bottom: 3px;
    }
  </style></head><body><div class="page">

    <!-- TOP DEEP NAVY HEADER -->
    <div class="msb-header">
      <div>
        <div class="msb-doc-name">${doctorDisplayName}</div>
        <div class="msb-doc-qual">${qual} &middot; ${spec}</div>
      </div>
      <div>
        <div class="msb-clinic-name">${clinicName}</div>
      </div>
    </div>

    <div class="msb-container">
      <!-- ROW 1: PATIENT INFORMATION & DATE & REFERENCE -->
      <table class="msb-split-table" style="margin-left:-5px; width:calc(100% + 10px);">
        <tr>
          <!-- PATIENT INFORMATION BOX -->
          <td style="width:58%; vertical-align:top; padding:0;">
            <div class="msb-box" style="margin-bottom:0;">
              <div class="msb-banner-sky">PATIENT INFORMATION</div>
              <div class="msb-box-body">
                <div style="font-size:13.5px;font-weight:800;color:#0f172a;">${patientInfo.name || 'Patient full name'}</div>
                <div style="font-size:10px;color:#64748b;margin-top:2px;">Age: ${patientInfo.age || '34'} &middot; Sex: ${patientInfo.gender || 'Male'}${patientInfo.weight ? ` &middot; Wt: ${patientInfo.weight}` : ''}</div>
              </div>
            </div>
          </td>

          <!-- DATE & REFERENCE BOX -->
          <td style="width:42%; vertical-align:top; padding:0;">
            <div class="msb-box" style="margin-bottom:0;">
              <div class="msb-banner-sky">DATE &amp; REFERENCE</div>
              <div class="msb-box-body">
                <div style="font-size:11.5px;color:#0f172a;">Date: <b style="font-weight:700;">${date}</b></div>
                <div style="font-size:10px;color:#64748b;margin-top:2px;">Reg: ${doctorInfo.regNo || '________'}</div>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- BOX 2: CHIEF COMPLAINT (NAVY BANNER) -->
      <div class="msb-box">
        <div class="msb-banner-navy">CHIEF COMPLAINT</div>
        <div class="msb-box-body" style="font-size:11.5px;color:#1e293b;">
          ${chiefComplaint}
        </div>
      </div>

      <!-- BOX 3: DIAGNOSIS (NAVY BANNER) -->
      <div class="msb-box">
        <div class="msb-banner-navy">DIAGNOSIS</div>
        <div class="msb-box-body" style="font-size:12.5px;font-weight:800;color:#0f172a;">
          ${diagText}
        </div>
      </div>

      <!-- BOX 4: ℞ PRESCRIPTION (NAVY BANNER) -->
      <div class="msb-box">
        <div class="msb-banner-navy">℞ PRESCRIPTION</div>
        <table class="msb-table">
          <thead>
            <tr>
              <th style="width:44%;text-align:left;">Drug</th>
              <th style="width:16%;text-align:center;">Unit</th>
              <th style="width:20%;text-align:center;">Frequency</th>
              <th style="width:20%;text-align:center;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medRows}
          </tbody>
        </table>
      </div>

      <!-- ROW 5: INVESTIGATIONS & ADVICE (SKY BLUE BANNERS) -->
      <table class="msb-split-table" style="margin-left:-5px; width:calc(100% + 10px); margin-bottom:0;">
        <tr>
          <!-- INVESTIGATIONS BOX -->
          <td style="width:50%; vertical-align:top; padding:0;">
            <div class="msb-box" style="margin-bottom:0;">
              <div class="msb-banner-sky">INVESTIGATIONS</div>
              <div class="msb-box-body" style="min-height:36px; font-size:10.5px; color:${labTests && labTests.length > 0 ? '#0f172a' : '#94a3b8'};">
                ${labTests && labTests.length > 0 ? labTests.join(', ') : 'Tests ordered...'}
              </div>
            </div>
          </td>

          <!-- ADVICE BOX -->
          <td style="width:50%; vertical-align:top; padding:0;">
            <div class="msb-box" style="margin-bottom:0;">
              <div class="msb-banner-sky">ADVICE</div>
              <div class="msb-box-body" style="min-height:36px; font-size:10.5px; color:${advice ? '#0f172a' : '#94a3b8'};">
                ${advice || 'Patient advice...'}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- DOCTOR'S SIGNATURE (LEFT ALIGNED MATCHING TEMPLATE) -->
      <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div class="msb-sig-block">
          ${renderDoctorSignatureHTML(doctorInfo.signature, doctorInfo.name, 35, 110)}
          <div class="msb-sig-line"></div>
          <div style="font-size:9px;font-weight:700;color:#475569;">Doctor's Signature</div>
          <div style="font-size:8.5px;color:#94a3b8;">${doctorDisplayName}</div>
        </div>

        ${followUp ? `
          <div style="font-size:10.5px;color:#64748b;text-align:right;">
            Follow-up: <b style="color:${navyColor};">${followUp}</b>
          </div>
        ` : ''}
      </div>
    </div>

  </div></body></html>`
}

// ── LAYOUT: MINIMAL PRINT RULED ────────────────────────────────────
function layoutMinimal(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date } = data
  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const clinicName = doctorInfo.clinicName || 'Name of your clinic'
  const qualSpec = [doctorInfo.qualification, doctorInfo.specialization].filter(Boolean).join(', ')
  const ageGenderParts = [
    patientInfo.age ? `Age ${patientInfo.age}` : '',
    patientInfo.gender || '',
  ].filter(Boolean).join(' / ')
  const effectiveDate = date || new Date().toLocaleDateString('en-GB')

  const medRows = medicines.map((m, i) => {
    const sublineParts = [
      m.duration ? (m.duration.toLowerCase().includes('day') ? m.duration : `${m.duration} days`) : '',
      m.frequency ? t(m.frequency, data.language) : '',
      m.instructions ? t(m.instructions, data.language) : '',
    ].filter(Boolean)

    return `
      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
        <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-weight: 700; color: #111827; letter-spacing: 0.2px;">
          ${i + 1}. ${m.name}${m.strength ? ` (${m.strength})` : ''}
        </div>
        ${sublineParts.length > 0 ? `
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 11.5px; font-style: italic; color: #6b7280; margin-top: 3px;">
            ${sublineParts.join(' · ')}
          </div>
        ` : ''}
      </div>
    `
  }).join('')

  const emptyLineCount = Math.max(2, 5 - medicines.length)
  const emptyRuledLines = Array.from({ length: emptyLineCount }).map(() => `
    <div style="border-bottom: 1px solid #f3f4f6; height: 28px;"></div>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS('#111827', '#6b7280', '#ffffff', 'serif')}
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: Georgia, 'Times New Roman', serif;
      color: #111827;
      -webkit-print-color-adjust: exact;
    }
    .page-ruled {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      box-sizing: border-box;
      background: #ffffff;
      position: relative;
      padding: 44px 48px 56px;
    }
  </style></head><body>
    <div class="page-ruled">
      <!-- Left-Aligned Header -->
      <div style="margin-bottom: 10px;">
        <div style="font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.3px; margin-bottom: 4px;">
          ${clinicName}
        </div>
        <div style="font-size: 13px; color: #111827; margin-bottom: 4px;">
          <span style="font-weight: 700;">${doctorDisplayName}</span>
          ${qualSpec ? `<span style="font-style: italic; color: #374151;"> &nbsp;${qualSpec}</span>` : ''}
          ${doctorInfo.regNo ? `<span style="font-size: 11px; color: #6b7280;"> &nbsp;· Reg: ${doctorInfo.regNo}</span>` : ''}
        </div>
        ${doctorInfo.address || doctorInfo.phone ? `
          <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
            ${[doctorInfo.address, doctorInfo.phone].filter(Boolean).join(' · ')}
          </div>
        ` : ''}
      </div>

      <!-- Thick 2px Solid Dark Rule -->
      <div style="height: 2px; background: #111827; margin-bottom: 14px;"></div>

      <!-- Patient & Date Bar -->
      <div style="padding: 2px 0 6px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 12px;">
          <div style="display: flex; align-items: baseline; flex-wrap: wrap;">
            <span style="font-style: italic; color: #6b7280;">Patient: &nbsp;</span>
            <span style="font-weight: 600; color: #111827; border-bottom: 1px dotted #9ca3af; padding-bottom: 1px;">
              ${patientInfo.name || 'Patient full name'}
            </span>
            ${ageGenderParts ? `
              <span style="color: #6b7280; margin-left: 14px;">${ageGenderParts}</span>
            ` : ''}
          </div>
          <div style="color: #6b7280; font-size: 11px;">
            ${effectiveDate}
          </div>
        </div>

        ${diagnosis || symptoms ? `
          <div style="margin-top: 6px; font-size: 12px;">
            <span style="font-style: italic; color: #6b7280;">Diagnosis: &nbsp;</span>
            <span style="color: #111827; font-weight: 600;">${diagnosis || symptoms}</span>
          </div>
        ` : ''}
      </div>

      <!-- Hairline Divider -->
      <div style="height: 1px; background: #e5e7eb; margin-top: 10px; margin-bottom: 18px;"></div>

      <!-- Large Italic ℞ Glyph -->
      <div style="font-size: 38px; font-weight: 700; font-style: italic; color: #111827; margin-bottom: 16px; line-height: 1;">
        ℞
      </div>

      <!-- Medicines Ruled List -->
      <div style="margin-bottom: 10px;">
        ${medRows || `
          <div style="padding: 16px 0; font-style: italic; color: #9ca3af; font-size: 12px;">
            No medicines listed
          </div>
        `}
      </div>

      <!-- Blank Ruled Lines (Authentic Ruled Notepad Feel) -->
      ${emptyRuledLines}

      <!-- Advice / Lab Tests / Follow-up -->
      ${advice ? `
        <div style="margin-top: 16px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 11px; font-style: italic; color: #6b7280; margin-bottom: 3px;">Advice:</div>
          <div style="font-size: 12px; color: #1f2937; line-height: 1.6;">${t(advice, data.language)}</div>
        </div>
      ` : ''}

      ${labTests && labTests.length > 0 ? `
        <div style="margin-top: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 11px; font-style: italic; color: #6b7280; margin-bottom: 3px;">Recommended Tests:</div>
          <div style="font-size: 12px; color: #1f2937;">${labTests.join(', ')}</div>
        </div>
      ` : ''}

      ${followUp ? `
        <div style="margin-top: 12px; font-size: 12px; color: #374151;">
          <span style="font-style: italic; color: #6b7280;">Follow-up: &nbsp;</span>
          <span style="font-weight: 600; color: #111827;">${followUp}</span>
        </div>
      ` : ''}

      <!-- Right-Aligned Signature Section -->
      <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: flex-end;">
        <div style="text-align: center; width: 140px;">
          ${renderDoctorSignatureHTML(doctorInfo.signature, doctorDisplayName, 38, 130)}
          <div style="width: 140px; border-bottom: 1px solid #6b7280; margin: 3px 0 4px;"></div>
          <div style="font-size: 10px; color: #9ca3af; font-family: Georgia, serif;">Signature</div>
          <div style="font-size: 8.5px; color: #6b7280; margin-top: 2px;">${doctorDisplayName}</div>
        </div>
      </div>

      <!-- Centered Subtle Watermark -->
      <div style="position: absolute; bottom: 22px; left: 0; right: 0; text-align: center; font-size: 8px; color: #d1d5db; letter-spacing: 5px; text-transform: uppercase;">
        P R E S C R I P T I O N M A K E R . I N
      </div>
    </div>
  </body></html>`
}

// ── LAYOUT: BILINGUAL INDIAN ───────────────────────────────────────
function layoutBilingual(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date, template } = data
  const primaryColor = template.styles?.primaryColor || '#7c3aed'
  const accentColor = template.styles?.accentColor || '#a78bfa'
  const bgColor = '#ffffff'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const clinicName = doctorInfo.clinicName || 'Name of your clinic'
  const qual = doctorInfo.qualification || 'MBBS, MD'
  const spec = doctorInfo.specialization || 'General Medicine'
  const effectiveDate = date || new Date().toLocaleDateString('en-GB')

  const medRows = medicines.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf5ff'}; border-bottom: 1px solid #f3e8ff;">
      <td style="padding:9px 8px; text-align:center; font-weight:700; color:${primaryColor};">${i + 1}</td>
      <td style="padding:9px 12px; font-weight:700; color:#0f172a;">
        ${m.name}${m.strength ? ` <span style="font-weight:500; color:#64748b;">(${m.strength})</span>` : ''}
        ${m.instructions ? `<div style="font-size:10px; font-weight:normal; font-style:italic; color:#64748b; margin-top:2px;">${t(m.instructions, data.language)}</div>` : ''}
      </td>
      <td style="padding:9px 8px; text-align:center; color:#334155;">${m.form || 'Tab'}</td>
      <td style="padding:9px 8px; text-align:center; font-weight:600; color:#0f172a;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding:9px 8px; text-align:center; color:#334155;">${m.duration ? (m.duration.toLowerCase().includes('day') ? m.duration : `${m.duration} days`) : '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, 'sans-serif')}
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
    }
    .page-bilingual {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      box-sizing: border-box;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
    }
  </style></head><body>
    <div class="page-bilingual">
      <!-- Full-Width Solid Purple Header -->
      <div style="background:${primaryColor}; color:#ffffff; padding:24px 30px; text-align:center;">
        <div style="font-size:25px; font-weight:800; letter-spacing:-0.2px; margin-bottom:4px;">
          ${clinicName}
        </div>
        <div style="font-size:14px; font-weight:700; margin-bottom:2px;">
          ${doctorDisplayName}
          ${qual ? `<span style="font-weight:400; opacity:0.85; margin-left:6px;">${qual}</span>` : ''}
        </div>
        ${spec ? `
          <div style="font-size:11.5px; opacity:0.85; margin-bottom:3px;">
            ${spec}
          </div>
        ` : ''}
        ${doctorInfo.regNo || doctorInfo.address || doctorInfo.phone ? `
          <div style="font-size:9.5px; opacity:0.75; margin-top:2px;">
            ${[
              doctorInfo.regNo ? `Reg: ${doctorInfo.regNo}` : '',
              doctorInfo.address || '',
              doctorInfo.phone ? `☎ ${doctorInfo.phone}` : ''
            ].filter(Boolean).join(' · ')}
          </div>
        ` : ''}
      </div>

      <!-- Main Body Content -->
      <div style="padding:18px 30px 24px; flex:1;">
        <!-- PATIENT DETAILS / रोगी विवरण Box -->
        <div style="border:1.5px solid ${primaryColor}40; border-radius:6px; overflow:hidden; margin-bottom:12px; background:#ffffff;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 14px; background:${primaryColor}0d; border-bottom:1px solid ${primaryColor}20;">
            <div style="font-size:10px; font-weight:800; color:${primaryColor}; letter-spacing:0.3px;">
              PATIENT DETAILS / रोगी विवरण
            </div>
            <div style="font-size:10.5px; color:#64748b;">
              Date: <span style="color:#0f172a; font-weight:600;">${effectiveDate}</span>
            </div>
          </div>
          <div style="padding:10px 14px;">
            <!-- Line 1: Patient Name, Age, Sex -->
            <div style="display:flex; justify-content:space-between; align-items:baseline; font-size:11.5px; margin-bottom:8px;">
              <div>
                <span style="color:#64748b;">Patient Name / मरीज का नाम:</span>
                <span style="font-weight:700; color:#0f172a; margin-left:6px;">${patientInfo.name || 'Patient full name'}</span>
              </div>
              <div>
                <span style="color:#64748b;">Age / उम्र:</span>
                <span style="font-weight:700; color:#0f172a; margin-left:6px;">${patientInfo.age || '—'}</span>
              </div>
              <div>
                <span style="color:#64748b;">Sex / लिंग:</span>
                <span style="font-weight:700; color:#0f172a; margin-left:6px;">${patientInfo.gender || '—'}</span>
              </div>
            </div>
            <div style="height:1px; background:#f1f5f9; margin-bottom:8px;"></div>
            <!-- Line 2: Address, Allergies -->
            <div style="display:flex; justify-content:space-between; align-items:baseline; font-size:11px;">
              <div style="flex:1;">
                <span style="color:#64748b;">Address / पता:</span>
                <span style="color:#334155; margin-left:6px;">${patientInfo.address || '___________________'}</span>
              </div>
              <div style="flex:1; text-align:right;">
                <span style="color:#64748b;">Allergies / एलर्जी:</span>
                <span style="color:#ef4444; font-weight:600; margin-left:6px;">${patientInfo.allergies || '___________________'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Diagnosis Box with Thick Purple Left Accent -->
        <div style="border:1px solid #e9d5ff; border-left:4px solid ${primaryColor}; border-radius:4px; padding:10px 14px; background:#faf5ff; margin-bottom:14px; display:flex; align-items:baseline;">
          <span style="font-size:11px; color:#64748b; font-weight:600;">Diagnosis / रोग निदान:</span>
          <span style="font-size:12px; font-weight:700; color:#0f172a; margin-left:8px;">${diagnosis || symptoms || 'Acute Pharyngitis'}</span>
        </div>

        <!-- Rx Header -->
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="font-size:22px; font-weight:800; color:${primaryColor}; line-height:1;">℞</span>
          <span style="font-size:12.5px; font-weight:800; color:${primaryColor}; letter-spacing:0.3px;">PRESCRIPTION / दवाइयाँ</span>
        </div>

        <!-- 5-Column Medicine Table with Solid Purple Header -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
          <thead>
            <tr style="background:${primaryColor}; color:#ffffff; font-size:11px;">
              <th style="width:6%; padding:8px 6px; text-align:center;">#</th>
              <th style="width:40%; padding:8px 12px; text-align:left;">दवाई / Medicine</th>
              <th style="width:14%; padding:8px 8px; text-align:center;">Unit</th>
              <th style="width:20%; padding:8px 8px; text-align:center;">Frequency / मात्रा</th>
              <th style="width:20%; padding:8px 8px; text-align:center;">Duration / समय</th>
            </tr>
          </thead>
          <tbody>
            ${medRows || `
              <tr>
                <td colspan="5" style="padding:16px; text-align:center; font-style:italic; color:#94a3b8; font-size:11px;">
                  No medicines prescribed
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Advice & Investigations if present -->
        ${advice ? `
          <div style="margin-top:14px; padding:10px 14px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:10px;">
            <div style="font-size:11px; font-weight:700; color:${primaryColor}; margin-bottom:4px;">सलाह / Advice:</div>
            <div style="font-size:11.5px; color:#1e293b; line-height:1.5;">${t(advice, data.language)}</div>
          </div>
        ` : ''}

        ${labTests && labTests.length > 0 ? `
          <div style="margin-top:8px; padding:10px 14px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:10px;">
            <div style="font-size:11px; font-weight:700; color:${primaryColor}; margin-bottom:4px;">जाँच / Investigations:</div>
            <div style="font-size:11.5px; color:#1e293b;">${labTests.join(', ')}</div>
          </div>
        ` : ''}

        ${followUp ? `
          <div style="margin-top:8px; font-size:11.5px; color:#334155; margin-bottom:14px;">
            <span style="font-weight:700; color:${primaryColor};">अगली मुलाकात / Next Visit (Follow-up):</span>
            <span style="font-weight:600; color:#0f172a; margin-left:6px;">${followUp}</span>
          </div>
        ` : ''}

        <!-- Left-Aligned Doctor's Signature (Matching Template Exactly) -->
        <div style="margin-top:28px; display:flex; flex-direction:column; align-items:flex-start;">
          <div style="text-align:left; min-width:130px;">
            ${renderDoctorSignatureHTML(doctorInfo.signature, doctorDisplayName, 34, 120)}
            <div style="width:130px; border-top:1px solid #94a3b8; margin:3px 0 4px;"></div>
            <div style="font-size:9.5px; font-weight:700; color:#334155;">Doctor's Signature</div>
            <div style="font-size:8.5px; color:#64748b; margin-top:1px;">${doctorDisplayName}</div>
          </div>
        </div>
      </div>

      <!-- Bottom Solid Purple Ribbon (Matching Template Exactly) -->
      <div style="padding:0 30px 24px;">
        <div style="background:${primaryColor}; border-radius:6px; padding:7px 0; text-align:center; color:#ffffff; font-size:10.5px; font-weight:700; letter-spacing:0.5px;">
          prescriptionmaker.in
        </div>
      </div>
    </div>
  </body></html>`
}

// ── LAYOUT: COMPARTMENTALIZED GRID ─────────────────────────────────
function layoutGrid(data: PrescriptionData): string {
  const { doctorInfo, patientInfo, diagnosis, symptoms, medicines, advice, followUp, labTests, date, template } = data
  const primaryColor = template.styles?.primaryColor || '#8a3b14'
  const accentColor = template.styles?.accentColor || '#ea8a10'
  const bgColor = '#fffdf7'

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const clinicName = doctorInfo.clinicName || 'Name of your clinic'
  const qualSpec = [doctorInfo.qualification, doctorInfo.specialization].filter(Boolean).join(' ') || 'MBBS, MD General Medicine'
  const effectiveDate = date || new Date().toLocaleDateString('en-GB')
  const complaint = symptoms || patientInfo.chiefComplaint || ''

  const medRows = medicines.map((m, i) => `
    <tr style="border-bottom: 1px solid #f0e6d8;">
      <td style="padding:9px 10px; border-right: 1px solid #f0e6d8; font-weight:700; color:#0f172a;">
        ${i + 1}. ${m.name}${m.strength ? ` (${m.strength})` : ''}
        ${m.instructions ? `<div style="font-size:10px; font-weight:normal; font-style:italic; color:#64748b; margin-top:2px;">${t(m.instructions, data.language)}</div>` : ''}
      </td>
      <td style="padding:9px 8px; border-right: 1px solid #f0e6d8; text-align:center; color:#334155;">${m.form || '—'}</td>
      <td style="padding:9px 8px; border-right: 1px solid #f0e6d8; text-align:center; color:#0f172a; font-weight:600;">${m.frequency ? t(m.frequency, data.language) : '—'}</td>
      <td style="padding:9px 8px; border-right: 1px solid #f0e6d8; text-align:center; color:#334155;">${m.duration ? (m.duration.toLowerCase().includes('day') ? m.duration : `${m.duration} days`) : '—'}</td>
      <td style="padding:9px 8px; text-align:center; color:#334155;">—</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCSS(primaryColor, accentColor, bgColor, 'sans-serif')}
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
    }
    .page-grid {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      box-sizing: border-box;
      background: ${bgColor};
      position: relative;
      display: flex;
      flex-direction: column;
    }
  </style></head><body>
    <div class="page-grid">
      <!-- Split Top Header (50% solid brown / 50% cream) -->
      <div style="display:flex; width:100%; min-height:85px; border-bottom:2.5px solid ${primaryColor};">
        <div style="width:50%; background:${primaryColor}; color:#ffffff; padding:18px 24px; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:22px; font-weight:800; letter-spacing:-0.2px;">${doctorDisplayName}</div>
          <div style="font-size:11.5px; opacity:0.9; margin-top:3px;">${qualSpec}</div>
          ${doctorInfo.regNo ? `<div style="font-size:9.5px; opacity:0.8; margin-top:2px;">Reg. No: ${doctorInfo.regNo}</div>` : ''}
        </div>
        <div style="width:50%; background:${bgColor}; padding:18px 24px; display:flex; flex-direction:column; justify-content:center; align-items:flex-end; text-align:right;">
          <div style="font-size:22px; font-weight:800; color:${primaryColor}; letter-spacing:-0.2px;">${clinicName}</div>
          ${doctorInfo.address || doctorInfo.phone ? `
            <div style="font-size:10px; color:#6b7280; margin-top:3px;">
              ${[doctorInfo.address, doctorInfo.phone ? `☎ ${doctorInfo.phone}` : ''].filter(Boolean).join(' · ')}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 3-Column Patient Compartment Bar -->
      <div style="display:flex; width:100%; border-bottom:1.5px solid ${primaryColor}; background:${bgColor};">
        <div style="flex:1.2; padding:10px 24px; border-right:1px solid #dcd3c7;">
          <div style="font-size:8.5px; font-weight:800; color:#8a3b14; letter-spacing:0.5px;">PATIENT NAME</div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-top:2px;">${patientInfo.name || 'Patient full name'}</div>
        </div>
        <div style="flex:0.9; padding:10px 20px; border-right:1px solid #dcd3c7;">
          <div style="font-size:8.5px; font-weight:800; color:#8a3b14; letter-spacing:0.5px;">AGE / SEX</div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-top:2px;">${patientInfo.age || '—'} / ${patientInfo.gender || '—'}</div>
        </div>
        <div style="flex:0.9; padding:10px 20px;">
          <div style="font-size:8.5px; font-weight:800; color:#8a3b14; letter-spacing:0.5px;">DATE</div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-top:2px;">${effectiveDate}</div>
        </div>
      </div>

      <!-- Chief Complaint Strip -->
      <div style="padding:8px 24px; border-bottom:1px solid #e5dcd0; background:${bgColor}; font-size:11px;">
        <span style="font-weight:700; color:${primaryColor}; letter-spacing:0.5px;">CHIEF COMPLAINT:</span>
        <span style="color:#1e293b; margin-left:6px;">${complaint || 'General consultation & clinical symptoms'}</span>
      </div>

      <!-- Diagnosis Band (Solid Deep Brown Bar) -->
      <div style="background:${primaryColor}; color:#ffffff; padding:8px 24px; font-size:11px;">
        <span style="font-weight:700; letter-spacing:0.5px;">DIAGNOSIS:</span>
        <span style="font-weight:700; font-size:12px; margin-left:8px;">${diagnosis || 'Primary Clinical Assessment'}</span>
      </div>

      <!-- Main Body Content -->
      <div style="padding:16px 24px 20px; flex:1;">
        <!-- Rx Symbol Row with Dividing Line -->
        <div style="display:flex; align-items:center; margin-bottom:12px;">
          <div style="font-size:24px; font-weight:800; color:${primaryColor}; font-family:Georgia, serif; line-height:1; margin-right:10px;">℞</div>
          <div style="flex:1; border-bottom:1.5px solid #d8cfc4; height:12px;"></div>
        </div>

        <!-- 5-Column Grid Table with Solid Ochre Header -->
        <table style="width:100%; border-collapse:collapse; border:1px solid #e5dcd0; background:#ffffff; margin-bottom:16px;">
          <thead>
            <tr style="background:${accentColor}; color:#ffffff; font-size:11px;">
              <th style="width:40%; padding:8px 10px; text-align:left; border-right:1px solid rgba(255,255,255,0.2);">Medicine / Drugs</th>
              <th style="width:14%; padding:8px 6px; text-align:center; border-right:1px solid rgba(255,255,255,0.2);">Unit</th>
              <th style="width:18%; padding:8px 6px; text-align:center; border-right:1px solid rgba(255,255,255,0.2);">Frequency</th>
              <th style="width:14%; padding:8px 6px; text-align:center; border-right:1px solid rgba(255,255,255,0.2);">Duration</th>
              <th style="width:14%; padding:8px 6px; text-align:center;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${medRows || `
              <tr>
                <td colspan="5" style="padding:16px; text-align:center; font-style:italic; color:#94a3b8; font-size:11px;">
                  No medicines prescribed
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- 2-Column Compartments at the Bottom (Grid Boxes) -->
        <div style="display:flex; gap:16px; margin-top:14px;">
          <!-- Left Box: ADVICE -->
          <div style="flex:1; border:1.5px solid #e5dcd0; border-radius:4px; padding:12px 14px; background:#fffdf9; min-height:110px;">
            <div style="font-size:10px; font-weight:800; color:${accentColor}; letter-spacing:0.5px; margin-bottom:6px;">ADVICE</div>
            <div style="font-size:11px; color:#1e293b; line-height:1.5;">${advice ? t(advice, data.language) : 'Patient advice and dietary precautions...'}</div>
            ${labTests && labTests.length > 0 ? `
              <div style="margin-top:8px; font-size:10.5px; color:#64748b;">
                <span style="font-weight:700; color:${primaryColor};">Recommended Tests: </span>${labTests.join(', ')}
              </div>
            ` : ''}
          </div>

          <!-- Right Box: FOLLOW-UP & SIGNATURE -->
          <div style="flex:1; border:1.5px solid #e5dcd0; border-radius:4px; padding:12px 14px; background:#fffdf9; min-height:110px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-size:10px; font-weight:800; color:${accentColor}; letter-spacing:0.5px; margin-bottom:4px;">FOLLOW-UP</div>
              <div style="font-size:11px; color:#1e293b;">${followUp ? `Review: ${followUp}` : 'As advised by the doctor'}</div>
            </div>

            <!-- Signature Block Aligned Right -->
            <div style="display:flex; flex-direction:column; align-items:flex-end; margin-top:16px;">
              <div style="text-align:center; width:130px;">
                ${renderDoctorSignatureHTML(doctorInfo.signature, doctorDisplayName, 34, 120)}
                <div style="width:130px; border-top:1px solid ${primaryColor}; margin:3px 0 4px;"></div>
                <div style="font-size:9.5px; font-weight:700; color:#334155;">Doctor's Signature</div>
                <div style="font-size:8.5px; color:#64748b; margin-top:1px;">${doctorDisplayName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Solid Brown Footer Bar -->
      <div style="background:${primaryColor}; color:#ffffff; padding:6px 24px; display:flex; justify-content:space-between; align-items:center; font-size:9px; letter-spacing:0.3px;">
        <span style="opacity:0.9;">${clinicName}</span>
        <span style="opacity:0.9;">prescriptionmaker.in</span>
      </div>
    </div>
  </body></html>`
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
          <div style="text-align:center;margin-bottom:6px;">
            ${renderDoctorSignatureHTML(doctorInfo.signature, doctorName, 42, 140)}
          </div>
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
    .top-ribbon { position:absolute; top:0; right:0; width:410px; height:168px; z-index:1; }
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
    .caduceus-box { position:absolute; bottom:116px; left:88px; display:flex; align-items:center; z-index:2; }
    .caduceus-svg { width:76px; height:76px; }
    .corner-ribbon { position:absolute; bottom:0; left:0; width:236px; height:105px; z-index:1; }
    .sig-area { text-align:center; min-width:180px; }
    .sig-line-teal { border-top:1px solid #cbd5e1; padding-top:6px; font-size:11px; color:#0f2330; font-weight:500; margin-top:8px; width:150px; margin-left:auto; margin-right:auto; }
    .footer-bar { position:absolute; bottom:16px; left:260px; right:36px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; font-size:11px; color:#475569; }
  </style></head><body>
    <div class="page">
      <!-- Top-Right Geometric Ribbon (Exact Chevron V-Fold matching modern-teal-ribbon.jpg) -->
      <svg class="top-ribbon" viewBox="0 0 410 168">
        <polygon points="261,0 410,0 272,165 244,128" fill="${navyColor}" />
        <polygon points="11,0 137,0 244,128 272,165 143,165" fill="${tealColor}" />
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
            ${renderDoctorSignatureHTML(doctorInfo.signature, doctorInfo.name, 40, 140)}
            <div class="sig-line-teal">Signature</div>
          </div>
        </div>
      </div>

      <!-- Bottom Caduceus Emblem & Corner Ribbon (Exact Fold matching modern-teal-ribbon.jpg) -->
      <svg class="corner-ribbon" viewBox="0 0 236 105">
        <polygon points="0,105 78,1 145,81 113,105" fill="${navyColor}" />
        <polygon points="80,0 187,0 232,105 167,105 145,81" fill="${tealColor}" />
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
      if (layout === 'minimal') return layoutMinimal(data)
      if (layout === 'bilingual') return layoutBilingual(data)
      if (layout === 'grid') return layoutGrid(data)
      if (layout === 'modern') return layoutModernTealRibbon(data)
      return layoutGeneric(data)
    }
  }
}

