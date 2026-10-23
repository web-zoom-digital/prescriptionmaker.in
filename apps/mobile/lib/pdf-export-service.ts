import { Platform, Alert } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import type { Template } from './templates'
import { MOBILE_TEMPLATES } from './templates'

export interface TabletExportData {
  w: number
  h: number
  doctor: {
    clinicName: string
    doctorName: string
    qualification?: string
    phone?: string
    clinicAddress?: string
    specialization?: string
    registrationNumber?: string
    signature?: string
    stampUrl?: string
    logoUrl?: string
  }
  patient: {
    patientName: string
    age?: string
    sex?: string
    date?: string
    chiefComplaint?: string
    diagnosis?: string
    advice?: string
    investigations?: string
    followUp?: string
    address?: string
    allergies?: string
    bp?: string
    pulse?: string
    temp?: string
    spo2?: string
    weight?: string
    height?: string
    opdRef?: string
    examination?: string
    symptoms?: string
    respiratoryRate?: string
    rr?: string
  }
  template?: Template
  paths: Array<{ d: string; color: string; width: number }>
}

function safeTruncate(text: string | undefined | null, maxLen: number): string {
  if (!text) return ''
  const trimmed = text.trim()
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen - 1) + '…' : trimmed
}

function escapeXml(unsafe: string | undefined | null): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Renders doctor signature onto SVG canvas.
 * If signature image (data URL or URI) exists, renders high-res image.
 * If not, renders flowing calligraphy cursive signature text of the doctor's name!
 */
function renderSvgDoctorSignature(
  doctor: { doctorName?: string; signature?: string },
  sigCenterX: number,
  sigBaselineY: number,
  maxW: number = 85,
  maxH: number = 24,
  fontFam: string = 'serif'
): string {
  if (doctor.signature && doctor.signature.trim()) {
    const x = Math.round(sigCenterX - maxW / 2)
    const y = Math.round(sigBaselineY - maxH - 2)
    return `<image href="${escapeXml(doctor.signature)}" x="${x}" y="${y}" width="${maxW}" height="${maxH}" preserveAspectRatio="xMidYMid meet" />`
  }
  if (doctor.doctorName && doctor.doctorName.trim()) {
    const cleanDoc = doctor.doctorName.trim().replace(/^(Dr|Dra)\.?\s*/i, '')
    const fullDoc = cleanDoc ? `Dr. ${cleanDoc}` : ''
    const fs = fullDoc.length > 22 ? 10 : fullDoc.length > 17 ? 11 : 12.5
    return `<text x="${sigCenterX}" y="${sigBaselineY - 3}" text-anchor="middle" font-size="${fs}" font-family="'Brush Script MT', 'Dancing Script', 'Great Vibes', 'Segoe Script', cursive, ${fontFam}" font-style="italic" font-weight="bold" fill="#0f172a">${escapeXml(fullDoc)}</text>`
  }
  return ''
}

/**
 * Helper to render clinic/hospital logo or doctor avatar on SVG templates.
 */
function renderSvgClinicLogo(
  logoUrl: string | undefined,
  centerX: number,
  centerY: number,
  radius: number = 22
): string {
  if (logoUrl && logoUrl.trim()) {
    const size = Math.round((radius - 1.5) * 2)
    const x = Math.round(centerX - size / 2)
    const y = Math.round(centerY - size / 2)
    return `
  <!-- Clinic / Hospital Logo -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#ffffff" stroke="rgba(255,255,255,0.85)" stroke-width="1.5" />
  <image href="${escapeXml(logoUrl)}" xlink:href="${escapeXml(logoUrl)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />`
  }
  return `
  <!-- Avatar Circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
  <circle cx="${centerX}" cy="${centerY}" r="${Math.round(radius * 0.8)}" fill="rgba(255,255,255,0.22)" />
  <text x="${centerX}" y="${centerY + 6}" text-anchor="middle" font-size="${Math.round(radius * 0.72)}">👨‍⚕️</text>`
}

/**
 * Dynamically loads html2pdf on web from local vendor or CDN.
 * Safe for React Native Web without crashing native bundlers.
 */
async function loadHtml2Pdf(): Promise<any> {
  if (typeof window === 'undefined') return null
  const win = window as any
  if (win.html2pdf) return win.html2pdf

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('html2pdf-script')
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).html2pdf))
      return
    }

    const script = document.createElement('script')
    script.id = 'html2pdf-script'
    script.src = '/vendor/html2pdf.bundle.min.js'
    script.onload = () => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf)
      } else {
        fallbackToCDN(resolve, reject)
      }
    }
    script.onerror = () => {
      fallbackToCDN(resolve, reject)
    }
    document.head.appendChild(script)
  })
}

function fallbackToCDN(resolve: (val: any) => void, reject: (err: any) => void) {
  const cdnScript = document.createElement('script')
  cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
  cdnScript.onload = () => resolve((window as any).html2pdf)
  cdnScript.onerror = () => reject(new Error('Failed to load html2pdf from CDN'))
  document.head.appendChild(cdnScript)
}

/**
 * Helper to generate ruled writing lines
 */
function generateWritingLines(startY: number, endY: number, lineCount: number, x1: number, x2: number): string {
  const lineSpacing = (endY - startY) / lineCount
  return Array.from({ length: lineCount })
    .map((_, i) => {
      const y = Math.round(startY + (i + 1) * lineSpacing)
      return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#e2e8f0" stroke-width="0.9" />`
    })
    .join('\n')
}

// ── 1. Two-Column Sidebar SVG Layout ──────────────────────────────────────────
function generateTwoColumnSidebarSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'two-column-sidebar') || MOBILE_TEMPLATES[1]
  const primaryColor = tpl.styles?.primaryColor || '#102A56'
  const accentColor = tpl.styles?.accentColor || '#155EEF'
  const bgColor = tpl.styles?.bgColor || '#F4F7FF'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const sbW = Math.round(w * 0.31)
  const mainX = sbW
  const mainW = w - sbW
  const headerH = 40
  const patBoxY = headerH + 6
  const patBoxH = 46
  const diagBoxY = patBoxY + patBoxH + 6
  const diagBoxH = 34
  const rxY = diagBoxY + diagBoxH + 12
  const thH = 20
  const tableY = rxY + 12
  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const lineCount = Math.max(14, Math.round(14 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || 'Patient full name'
  const diagnosisClean = safeTruncate(patient.diagnosis, 32) || 'Acute Pharyngitis / Clinical Assessment'
  const clinicClean = safeTruncate(doctor.clinicName, 24) || 'Name of your clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Full Name', 22)
  const qualClean = safeTruncate(doctor.qualification || 'MBBS, MD', 24)

  const writingLines = generateWritingLines(tableY + thH + 6, h - 45, lineCount, mainX + 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- ── Left Sidebar (Doctor & Clinic Info) ── -->
  <rect x="0" y="0" width="${sbW}" height="${h}" fill="${primaryColor}" />

  <!-- Clinic Logo or Avatar Circle -->
  ${renderSvgClinicLogo(doctor.logoUrl, sbW / 2, 42, 22)}

  <!-- Doctor Name & Credentials -->
  <text x="${sbW / 2}" y="78" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="${sbW / 2}" y="92" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">${escapeXml(qualClean)}</text>
  <text x="${sbW / 2}" y="104" text-anchor="middle" font-size="7.5" fill="${accentColor}" font-family="${fontFam}">General Medicine</text>

  <line x1="12" y1="114" x2="${sbW - 12}" y2="114" stroke="rgba(255,255,255,0.18)" stroke-width="0.8" />

  <!-- Clinic Section -->
  <text x="12" y="127" font-size="6.5" font-weight="bold" fill="rgba(255,255,255,0.55)" font-family="${fontFam}">CLINIC</text>
  <text x="12" y="139" font-size="8.5" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  ${doctor.phone ? `<text x="12" y="151" font-size="7" fill="rgba(255,255,255,0.8)" font-family="${fontFam}">📞 ${escapeXml(doctor.phone)}</text>` : ''}
  ${doctor.clinicAddress ? `<text x="12" y="161" font-size="6.5" fill="rgba(255,255,255,0.7)" font-family="${fontFam}">📍 ${escapeXml(safeTruncate(doctor.clinicAddress, 24))}</text>` : ''}

  <line x1="12" y1="170" x2="${sbW - 12}" y2="170" stroke="rgba(255,255,255,0.18)" stroke-width="0.8" />

  <!-- Complete RECORDED VITALS -->
  <text x="12" y="184" font-size="6.5" font-weight="bold" fill="rgba(255,255,255,0.55)" letter-spacing="0.5" font-family="${fontFam}">RECORDED VITALS</text>

  <text x="12" y="200" font-size="7" fill="#ffffff" font-family="${fontFam}">BP <tspan font-size="6" fill="rgba(255,255,255,0.5)">(mmHg)</tspan></text>
  <line x1="${sbW - 46}" y1="200" x2="${sbW - 10}" y2="200" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
  ${patient.bp ? `<text x="${sbW - 12}" y="198" text-anchor="end" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(patient.bp)}</text>` : ''}

  <text x="12" y="217" font-size="7" fill="#ffffff" font-family="${fontFam}">Pulse <tspan font-size="6" fill="rgba(255,255,255,0.5)">(bpm)</tspan></text>
  <line x1="${sbW - 46}" y1="217" x2="${sbW - 10}" y2="217" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
  ${patient.pulse ? `<text x="${sbW - 12}" y="215" text-anchor="end" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(patient.pulse)}</text>` : ''}

  <text x="12" y="234" font-size="7" fill="#ffffff" font-family="${fontFam}">Temp <tspan font-size="6" fill="rgba(255,255,255,0.5)">(°F)</tspan></text>
  <line x1="${sbW - 46}" y1="234" x2="${sbW - 10}" y2="234" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
  ${patient.temp ? `<text x="${sbW - 12}" y="232" text-anchor="end" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(patient.temp)}</text>` : ''}

  <text x="12" y="251" font-size="7" fill="#ffffff" font-family="${fontFam}">SpO₂ <tspan font-size="6" fill="rgba(255,255,255,0.5)">(%)</tspan></text>
  <line x1="${sbW - 46}" y1="251" x2="${sbW - 10}" y2="251" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
  ${patient.spo2 ? `<text x="${sbW - 12}" y="249" text-anchor="end" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(patient.spo2)}</text>` : ''}

  <text x="12" y="268" font-size="7" fill="#ffffff" font-family="${fontFam}">Weight <tspan font-size="6" fill="rgba(255,255,255,0.5)">(kg)</tspan></text>
  <line x1="${sbW - 46}" y1="268" x2="${sbW - 10}" y2="268" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
  ${patient.weight ? `<text x="${sbW - 12}" y="266" text-anchor="end" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(patient.weight)}</text>` : ''}

  <text x="12" y="285" font-size="7" fill="#ffffff" font-family="${fontFam}">Height <tspan font-size="6" fill="rgba(255,255,255,0.5)">(cm)</tspan></text>
  <line x1="${sbW - 46}" y1="285" x2="${sbW - 10}" y2="285" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
  ${patient.height ? `<text x="${sbW - 12}" y="283" text-anchor="end" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(patient.height)}</text>` : ''}

  <!-- ── Right Main Section ── -->
  <!-- Header: MEDICAL PRESCRIPTION + OPD Ref -->
  <text x="${mainX + 12}" y="18" font-size="8.5" font-weight="bold" fill="${primaryColor}" letter-spacing="1" font-family="${fontFam}">MEDICAL PRESCRIPTION</text>
  <text x="${w - 12}" y="16" text-anchor="end" font-size="7" fill="#64748b" font-family="${fontFam}">${patient.opdRef ? `OPD Ref: ${escapeXml(patient.opdRef)}` : 'OPD Ref: ___________'}</text>
  <text x="${mainX + 12}" y="30" font-size="7" fill="#64748b" font-family="${fontFam}">Date: <tspan font-weight="bold" fill="#0f172a">${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</tspan></text>
  <line x1="${mainX + 10}" y1="${headerH}" x2="${w - 10}" y2="${headerH}" stroke="${primaryColor}" stroke-width="1.8" />

  <!-- Patient Details Box -->
  <rect x="${mainX + 10}" y="${patBoxY}" width="${mainW - 20}" height="${patBoxH}" fill="${bgColor}" rx="4" />
  <text x="${mainX + 16}" y="${patBoxY + 13}" font-size="6.5" font-weight="bold" fill="#64748b" letter-spacing="0.5" font-family="${fontFam}">PATIENT DETAILS</text>
  <text x="${mainX + 16}" y="${patBoxY + 27}" font-size="10.5" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <text x="${mainX + 16}" y="${patBoxY + 39}" font-size="7.5" fill="#64748b" font-family="${fontFam}">${escapeXml(patient.age ? `Age: ${patient.age}` : 'Age: 34')} · ${escapeXml(patient.sex ? `Sex: ${patient.sex}` : 'Sex: Male')}</text>

  <!-- Diagnosis Box -->
  <rect x="${mainX + 10}" y="${diagBoxY}" width="${mainW - 20}" height="${diagBoxH}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" rx="4" />
  <rect x="${mainX + 10}" y="${diagBoxY}" width="4" height="${diagBoxH}" fill="${primaryColor}" rx="1" />
  <text x="${mainX + 18}" y="${diagBoxY + 12}" font-size="6.5" font-weight="bold" fill="#64748b" letter-spacing="0.5" font-family="${fontFam}">DIAGNOSIS</text>
  <text x="${mainX + 18}" y="${diagBoxY + 26}" font-size="8.5" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Rx symbol -->
  <text x="${mainX + 12}" y="${rxY + 6}" font-size="18" font-family="Georgia,serif" font-weight="bold" fill="${primaryColor}">℞</text>

  <!-- Medicine Table Header -->
  <rect x="${mainX + 10}" y="${tableY}" width="${mainW - 20}" height="${thH}" fill="${primaryColor}" rx="2" />
  <text x="${mainX + 16}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Medicine</text>
  <text x="${mainX + (mainW - 20) * 0.48}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Unit</text>
  <text x="${mainX + (mainW - 20) * 0.65}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${mainX + (mainW - 20) * 0.84}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Footer -->
  <line x1="${mainX + 10}" y1="${h - 32}" x2="${w - 10}" y2="${h - 32}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="${mainX + 14}" y="${h - 16}" font-size="7" font-weight="${patient.followUp ? 'bold' : 'normal'}" fill="${patient.followUp ? '#1e293b' : '#64748b'}" font-family="${fontFam}">Follow-up: ${patient.followUp ? escapeXml(patient.followUp) : '____________'}</text>
  ${renderSvgDoctorSignature(doctor, w - 60, h - 18, 80, 22, fontFam)}
  <line x1="${w - 105}" y1="${h - 16}" x2="${w - 14}" y2="${h - 16}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="${w - 60}" y="${h - 7}" text-anchor="middle" font-size="6.5" fill="#64748b" font-family="${fontFam}">Doctor's Signature</text>
</svg>`
}


// ── 3. SOAP Clinical Notes SVG Layout ─────────────────────────────────────────
function generateSOAPSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'soap-clinical') || MOBILE_TEMPLATES[3]
  const primaryColor = tpl.styles?.primaryColor || '#312e81' // Deep Indigo
  const accentColor = tpl.styles?.accentColor || '#6366f1'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.10)
  const contentW = w - 20

  // Sanitize Doctor Name to prevent duplicate "Dr. Dr."
  const rawDoc = (doctor.doctorName || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const qualSpec = [doctor.qualification, doctor.specialization].filter(Boolean).join(' · ') || 'MBBS, MD · General Medicine'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Name of your clinic'

  const patientNameClean = safeTruncate(patient.patientName, 26) || 'Patient Name'
  const complaintClean = safeTruncate(patient.chiefComplaint, 45) || 'Acute Pharyngitis'
  const diagnosisClean = safeTruncate(patient.diagnosis, 40) || 'Acute Pharyngitis'
  const examClean = safeTruncate(patient.examination || patient.symptoms, 60) || 'Examination findings...'
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = [patient.age ? `Age ${patient.age}` : '', patient.sex].filter(Boolean).join(' / ')

  // Proportional font sizing
  const fDoc = Math.max(12, Math.round(w * 0.034))
  const fSub = Math.max(7.5, Math.round(w * 0.020))
  const fClinic = Math.max(9.5, Math.round(w * 0.024))
  const fHdrLetter = Math.max(12, Math.round(w * 0.032))
  const fHdrTitle = Math.max(7.2, Math.round(w * 0.019))
  const fText = Math.max(7.5, Math.round(w * 0.020))
  const fPill = Math.max(6.5, Math.round(w * 0.017))
  const fTh = Math.max(7, Math.round(w * 0.018))

  // Section Heights & Vertical Positions
  const patCardY = headH + 8
  const patCardH = Math.max(22, Math.round(baseH * 0.038))

  const hdrH = Math.max(16, Math.round(baseH * 0.028))

  // S — Subjective Box
  const sBoxY = patCardY + patCardH + 8
  const sBodyH = Math.max(26, Math.round(baseH * 0.046))
  const sBoxH = hdrH + sBodyH

  // O — Objective Box (contains 6 vitals badges + examination findings)
  const oBoxY = sBoxY + sBoxH + 8
  const pillH = Math.max(16, Math.round(baseH * 0.028))
  const oBodyH = pillH + 22
  const oBoxH = hdrH + oBodyH

  // A — Assessment Box
  const aBoxY = oBoxY + oBoxH + 8
  const aBodyH = Math.max(24, Math.round(baseH * 0.042))
  const aBoxH = hdrH + aBodyH

  // P — Plan Box (fills down to signature area)
  const pBoxY = aBoxY + aBoxH + 8
  const pBoxH = Math.max(140, (h - 48) - pBoxY)
  const medTitleY = pBoxY + hdrH + 13
  const thY = medTitleY + 5
  const thH = Math.max(15, Math.round(baseH * 0.026))

  // 6 Vitals Badges Calculation
  const vitalsPills = [
    { label: 'BP', val: patient.bp || '______' },
    { label: 'HR (bpm)', val: patient.pulse ? `${patient.pulse}` : '______' },
    { label: 'Temp (°F)', val: patient.temp ? `${patient.temp}` : '______' },
    { label: 'SpO₂ (%)', val: patient.spo2 ? `${patient.spo2}` : '______' },
    { label: 'Weight (kg)', val: patient.weight ? `${patient.weight}` : '______' },
    { label: 'RR (/min)', val: patient.respiratoryRate || (patient as any).rr || '______' },
  ]
  const pillsAvailableW = contentW - 16
  const pillGap = 5
  const pillW = Math.floor((pillsAvailableW - 5 * pillGap) / 6)
  const pillsY = oBoxY + hdrH + 5
  const pillsSvg = vitalsPills.map((vp, idx) => {
    const px = 18 + idx * (pillW + pillGap)
    return `
    <rect x="${px}" y="${pillsY}" width="${pillW}" height="${pillH}" fill="#eff6ff" stroke="#dbeafe" stroke-width="0.8" rx="3" />
    <text x="${px + pillW / 2}" y="${pillsY + pillH * 0.68}" text-anchor="middle" font-size="${fPill}" font-family="${fontFam}">
      <tspan fill="#64748b">${escapeXml(vp.label)}: </tspan><tspan font-weight="bold" fill="#1e293b">${escapeXml(vp.val)}</tspan>
    </text>`
  }).join('')

  // 4-Column Table Header in Plan Box
  const pTableW = contentW - 12
  const colDrugX = 22
  const colDoseX = 16 + pTableW * 0.44
  const colFreqX = 16 + pTableW * 0.68
  const colDurX = 16 + pTableW * 0.88

  // Ruled writing lines inside Plan box
  const linesStartY = thY + thH + 6
  const linesEndY = pBoxY + pBoxH - 8
  const lineCount = Math.max(9, Math.round((linesEndY - linesStartY) / 20))
  const writingLines = generateWritingLines(linesStartY, linesEndY, lineCount, 16, w - 16)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  const sigCenterY = h - 24

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Header Banner (Deep Indigo) -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="14" y="${headH * 0.42}" font-size="${fDoc}" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorDisplayName)}</text>
  <text x="14" y="${headH * 0.72}" font-size="${fSub}" fill="#c7d2fe" font-family="${fontFam}">${escapeXml(qualSpec)}</text>
  <text x="${w - 14}" y="${headH * 0.42}" text-anchor="end" font-size="${fClinic}" font-weight="bold" fill="#c7d2fe" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  ${doctor.phone ? `<text x="${w - 14}" y="${headH * 0.72}" text-anchor="end" font-size="${fSub}" fill="#c7d2fe" font-family="${fontFam}">☎ ${escapeXml(doctor.phone)}</text>` : (doctor.registrationNumber ? `<text x="${w - 14}" y="${headH * 0.72}" text-anchor="end" font-size="${fSub}" fill="#a5b4fc" font-family="${fontFam}">Reg: ${escapeXml(doctor.registrationNumber)}</text>` : '')}

  <!-- Patient + Date Bar (Lavender Card) -->
  <rect x="10" y="${patCardY}" width="${contentW}" height="${patCardH}" fill="#eef2ff" stroke="#c7d2fe" stroke-width="0.8" rx="4" />
  <text x="18" y="${patCardY + patCardH * 0.65}" font-size="${fText}" font-family="${fontFam}">
    <tspan fill="#64748b">Patient: </tspan><tspan font-weight="bold" fill="#0f172a">${escapeXml(patientNameClean)}</tspan>${patientAgeSex ? `<tspan fill="#64748b">   ${escapeXml(patientAgeSex)}</tspan>` : ''}
  </text>
  <text x="${w - 18}" y="${patCardY + patCardH * 0.65}" text-anchor="end" font-size="${fText}" font-family="${fontFam}">
    <tspan fill="#64748b">Date: </tspan><tspan font-weight="bold" fill="#0f172a">${escapeXml(dateStr)}</tspan>
  </text>

  <!-- S — SUBJECTIVE Box (Purple) -->
  <rect x="10" y="${sBoxY}" width="${contentW}" height="${sBoxH}" fill="#ffffff" stroke="#7c3aed40" stroke-width="0.8" rx="5" />
  <rect x="10" y="${sBoxY}" width="${contentW}" height="${hdrH}" fill="#7c3aed" rx="4" />
  <text x="18" y="${sBoxY + hdrH * 0.75}" font-size="${fHdrLetter}" font-family="Georgia, serif" font-weight="900" fill="#ffffff">S</text>
  <text x="34" y="${sBoxY + hdrH * 0.70}" font-size="${fHdrTitle}" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">SUBJECTIVE — CHIEF COMPLAINT &amp; HISTORY</text>
  <text x="18" y="${sBoxY + hdrH + sBodyH * 0.58}" font-size="${fText}" fill="#334155" font-family="${fontFam}">${escapeXml(complaintClean)}</text>

  <!-- O — OBJECTIVE Box (Royal Blue + 6 Vitals Badges) -->
  <rect x="10" y="${oBoxY}" width="${contentW}" height="${oBoxH}" fill="#ffffff" stroke="#1d4ed840" stroke-width="0.8" rx="5" />
  <rect x="10" y="${oBoxY}" width="${contentW}" height="${hdrH}" fill="#1d4ed8" rx="4" />
  <text x="18" y="${oBoxY + hdrH * 0.75}" font-size="${fHdrLetter}" font-family="Georgia, serif" font-weight="900" fill="#ffffff">O</text>
  <text x="34" y="${oBoxY + hdrH * 0.70}" font-size="${fHdrTitle}" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">OBJECTIVE — VITALS &amp; EXAMINATION FINDINGS</text>
  ${pillsSvg}
  <text x="18" y="${pillsY + pillH + 13}" font-size="${fText}" fill="${patient.examination || patient.symptoms ? '#334155' : '#94a3b8'}" font-family="${fontFam}">${escapeXml(examClean)}</text>

  <!-- A — ASSESSMENT Box (Emerald Green) -->
  <rect x="10" y="${aBoxY}" width="${contentW}" height="${aBoxH}" fill="#ffffff" stroke="#065f4640" stroke-width="0.8" rx="5" />
  <rect x="10" y="${aBoxY}" width="${contentW}" height="${hdrH}" fill="#065f46" rx="4" />
  <text x="18" y="${aBoxY + hdrH * 0.75}" font-size="${fHdrLetter}" font-family="Georgia, serif" font-weight="900" fill="#ffffff">A</text>
  <text x="34" y="${aBoxY + hdrH * 0.70}" font-size="${fHdrTitle}" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">ASSESSMENT — DIAGNOSIS</text>
  <text x="18" y="${aBoxY + hdrH + aBodyH * 0.58}" font-size="${fText}" font-weight="bold" fill="#065f46" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- P — PLAN Box (Deep Indigo + Medications Sub-table) -->
  <rect x="10" y="${pBoxY}" width="${contentW}" height="${pBoxH}" fill="#ffffff" stroke="${primaryColor}40" stroke-width="0.8" rx="5" />
  <rect x="10" y="${pBoxY}" width="${contentW}" height="${hdrH}" fill="${primaryColor}" rx="4" />
  <text x="18" y="${pBoxY + hdrH * 0.75}" font-size="${fHdrLetter}" font-family="Georgia, serif" font-weight="900" fill="#ffffff">P</text>
  <text x="34" y="${pBoxY + hdrH * 0.70}" font-size="${fHdrTitle}" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">PLAN — MEDICATIONS, INVESTIGATIONS &amp; ADVICE</text>
  <text x="18" y="${medTitleY}" font-size="${fText}" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">℞ Medications</text>

  <!-- 4-Column Table Header -->
  <rect x="16" y="${thY}" width="${pTableW}" height="${thH}" fill="#e0e7ff" rx="3" />
  <text x="${colDrugX}" y="${thY + thH * 0.68}" font-size="${fTh}" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Drug</text>
  <text x="${colDoseX}" y="${thY + thH * 0.68}" text-anchor="middle" font-size="${fTh}" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Dose</text>
  <text x="${colFreqX}" y="${thY + thH * 0.68}" text-anchor="middle" font-size="${fTh}" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Frequency</text>
  <text x="${colDurX}" y="${thY + thH * 0.68}" text-anchor="middle" font-size="${fTh}" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Duration</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Footer / Doctor Signature Area (Exact match to Screenshot 1) -->
  ${renderSvgDoctorSignature(doctor, w - 68, sigCenterY, 85, 22, fontFam)}
  <line x1="${w - 120}" y1="${sigCenterY}" x2="${w - 16}" y2="${sigCenterY}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 68}" y="${sigCenterY + 10}" text-anchor="middle" font-size="${fSub}" font-weight="bold" fill="#475569" font-family="${fontFam}">Doctor's Signature</text>
  <text x="${w - 68}" y="${sigCenterY + 19}" text-anchor="middle" font-size="${fSub * 0.9}" fill="#64748b" font-family="${fontFam}">${escapeXml(doctorDisplayName)}</text>

  <!-- Footer Left: Follow-up -->
  ${patient.followUp ? `<text x="16" y="${sigCenterY + 10}" font-size="${fSub}" fill="#64748b" font-family="${fontFam}"><tspan font-weight="bold" fill="${primaryColor}">Follow-up: </tspan>${escapeXml(patient.followUp)}</text>` : `<text x="16" y="${sigCenterY + 10}" font-size="${fSub * 0.9}" fill="#94a3b8" font-family="${fontFam}">SOAP Clinical Notes · prescriptionmaker.in</text>`}
</svg>`
}

// ── 4. Minimal Print Ruled SVG Layout ─────────────────────────────────────────
function generateMinimalSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'minimal-print-ruled') || MOBILE_TEMPLATES[7]
  const primaryColor = tpl.styles?.primaryColor || '#1a202c'
  const fontFam = 'Georgia, serif'

  const headH = 50
  const patY = headH + 12
  const patH = 24
  const diagY = patY + patH + 4
  const diagH = 20
  const rxY = diagY + diagH + 10
  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const lineCount = Math.max(14, Math.round(14 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Clinical Assessment'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Name of your clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Doctor Name', 28)

  const writingLines = generateWritingLines(rxY + 28, h - 45, lineCount, 12, w - 12)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Dark Solid Rule -->
  <line x1="12" y1="${headH}" x2="${w - 12}" y2="${headH}" stroke="#111827" stroke-width="2" />
  <text x="12" y="24" font-size="14" font-weight="bold" fill="#111827" letter-spacing="-0.2" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="12" y="38" font-size="9" font-weight="bold" fill="#111827" font-family="${fontFam}">${escapeXml(doctorClean)} <tspan font-style="italic" font-weight="normal" fill="#374151">· ${escapeXml(doctor.qualification || 'MBBS, MD, General Medicine')}</tspan></text>
  <text x="${w - 12}" y="38" text-anchor="end" font-size="7.5" fill="#6b7280" font-family="${fontFam}">Reg. No. ${escapeXml(doctor.registrationNumber || 'DOC-REG-8812')}</text>

  <!-- Patient + Date -->
  <text x="12" y="${patY + 14}" font-size="8" font-style="italic" fill="#6b7280" font-family="${fontFam}">Patient: </text>
  <text x="56" y="${patY + 14}" font-size="10.5" font-weight="bold" fill="#111827" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <line x1="56" y1="${patY + 17}" x2="${Math.min(w * 0.6, 56 + 140)}" y2="${patY + 17}" stroke="#9ca3af" stroke-width="0.8" stroke-dasharray="2,2" />
  <text x="${w * 0.62}" y="${patY + 14}" font-size="8" fill="#6b7280" font-family="${fontFam}">${escapeXml(patient.age ? `Age ${patient.age}` : 'Age —')}${escapeXml(patient.sex ? ` / ${patient.sex}` : '')}</text>
  <text x="${w - 12}" y="${patY + 14}" text-anchor="end" font-size="8" fill="#6b7280" font-family="${fontFam}">${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <!-- Diagnosis -->
  <text x="12" y="${diagY + 14}" font-size="7.5" font-style="italic" fill="#6b7280" font-family="${fontFam}">Diagnosis: </text>
  <text x="64" y="${diagY + 14}" font-size="8.5" font-weight="bold" fill="#111827" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>
  <line x1="12" y1="${diagY + diagH}" x2="${w - 12}" y2="${diagY + diagH}" stroke="#e5e7eb" stroke-width="0.8" />

  <!-- Big Italic ℞ -->
  <text x="12" y="${rxY + 20}" font-size="34" font-family="${fontFam}" font-style="italic" font-weight="bold" fill="#111827">℞</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Footer -->
  ${renderSvgDoctorSignature(doctor, w - 52, h - 28, 80, 22, fontFam)}
  <line x1="${w - 95}" y1="${h - 26}" x2="${w - 12}" y2="${h - 26}" stroke="#6b7280" stroke-width="0.8" />
  <text x="${w - 52}" y="${h - 14}" text-anchor="middle" font-size="7" fill="#9ca3af" font-family="${fontFam}">Signature</text>
  <text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="6.5" fill="#cbd5e1" letter-spacing="3" font-family="${fontFam}">P R E S C R I P T I O N M A K E R . I N</text>
</svg>`
}

// ── 5. Bilingual Indian SVG Layout ───────────────────────────────────────────
function generateBilingualSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'bilingual-indian') || MOBILE_TEMPLATES[8]
  const primaryColor = tpl.styles?.primaryColor || '#7c3aed'
  const accentColor = tpl.styles?.accentColor || '#a78bfa'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.13)
  const patBoxY = headH + 8
  const patBoxH = Math.round(baseH * 0.12)
  const diagY = patBoxY + patBoxH + 6
  const diagH = 24
  const rxY = diagY + diagH + 10
  const thH = 20
  const tableY = rxY + 16
  const lineCount = Math.max(13, Math.round(13 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || '_________________________'
  const clinicClean = safeTruncate(doctor.clinicName, 36) || 'City Medical Clinic / क्लीनिक'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 30)

  const writingLines = generateWritingLines(tableY + thH + 6, h - 55, lineCount, 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Purple Header -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="${w / 2}" y="${headH * 0.32}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="${w / 2}" y="${headH * 0.58}" text-anchor="middle" font-size="10" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}${doctor.qualification ? ` · ${escapeXml(doctor.qualification)}` : ''}</text>
  <text x="${w / 2}" y="${headH * 0.82}" text-anchor="middle" font-size="7" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">परामर्श पर्ची / PRESCRIPTION SLIP${doctor.registrationNumber ? ` · Reg: ${escapeXml(doctor.registrationNumber)}` : ''}</text>

  <!-- Bilingual Patient Details Box -->
  <rect x="10" y="${patBoxY}" width="${w - 20}" height="${patBoxH}" fill="#ffffff" stroke="${primaryColor}40" stroke-width="1.2" rx="4" />
  <rect x="10" y="${patBoxY}" width="${w - 20}" height="18" fill="${primaryColor}18" rx="4" />
  <text x="16" y="${patBoxY + 12}" font-size="7" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">PATIENT DETAILS / रोगी विवरण</text>
  <text x="${w - 16}" y="${patBoxY + 12}" text-anchor="end" font-size="7" fill="#64748b" font-family="${fontFam}">तारीख / Date: ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <!-- Row 1: Name, Age, Sex -->
  <text x="16" y="${patBoxY + 30}" font-size="7" fill="#94a3b8" font-family="${fontFam}">मरीज का नाम / Name</text>
  <text x="16" y="${patBoxY + 42}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>

  <text x="${w * 0.56}" y="${patBoxY + 30}" font-size="7" fill="#94a3b8" font-family="${fontFam}">उम्र / Age</text>
  <text x="${w * 0.56}" y="${patBoxY + 42}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.age ? `${patient.age} वर्ष` : '—')}</text>

  <text x="${w * 0.78}" y="${patBoxY + 30}" font-size="7" fill="#94a3b8" font-family="${fontFam}">लिंग / Sex</text>
  <text x="${w * 0.78}" y="${patBoxY + 42}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.sex || '—')}</text>

  <line x1="14" y1="${patBoxY + 48}" x2="${w - 14}" y2="${patBoxY + 48}" stroke="${primaryColor}20" stroke-width="0.8" />

  <!-- Row 2: Address & Allergies -->
  <text x="16" y="${patBoxY + 59}" font-size="7" fill="#94a3b8" font-family="${fontFam}">पता / Address:</text>
  <text x="75" y="${patBoxY + 59}" font-size="7" fill="#334155" font-family="${fontFam}">${escapeXml(patient.address ? safeTruncate(patient.address, 28) : '_______________________')}</text>

  <text x="${w * 0.56}" y="${patBoxY + 59}" font-size="7" fill="#94a3b8" font-family="${fontFam}">एलर्जी / Allergies:</text>
  <text x="${w * 0.56 + 72}" y="${patBoxY + 59}" font-size="7" fill="#ef4444" font-family="${fontFam}">${escapeXml(patient.allergies ? safeTruncate(patient.allergies, 18) : 'None / कोई नहीं')}</text>

  <!-- Bilingual Diagnosis Box -->
  <rect x="10" y="${diagY}" width="${w - 20}" height="${diagH}" fill="${primaryColor}08" stroke="${primaryColor}30" stroke-width="1" rx="3" />
  <rect x="10" y="${diagY}" width="4" height="${diagH}" fill="${primaryColor}" rx="1" />
  <text x="18" y="${diagY + 15}" font-size="8" fill="#64748b" font-family="${fontFam}">रोग निदान / Diagnosis:</text>
  <text x="125" y="${diagY + 15}" font-size="10" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Rx Header -->
  <text x="12" y="${rxY + 8}" font-size="18" font-family="Georgia,serif" font-weight="bold" fill="${primaryColor}">℞</text>
  <text x="36" y="${rxY + 4}" font-size="8" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">PRESCRIPTION / दवाइयाँ</text>

  <!-- Bilingual 5-Column Table Header -->
  <rect x="10" y="${tableY}" width="${w - 20}" height="${thH}" fill="${primaryColor}" rx="3" />
  <text x="16" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">#</text>
  <text x="34" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">दवाई / Medicine</text>
  <text x="${w * 0.45}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Unit</text>
  <text x="${w * 0.60}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency / मात्रा</text>
  <text x="${w * 0.82}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration / समय</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Investigations / Advice notice -->
  <text x="14" y="${h - 40}" font-size="7" font-weight="${patient.investigations ? 'bold' : 'normal'}" fill="${patient.investigations ? '#0f172a' : '#64748b'}" font-family="${fontFam}">जाँच / Investigations: ${escapeXml(patient.investigations ? safeTruncate(patient.investigations, 24) : '___________________')}</text>
  <text x="${w * 0.52}" y="${h - 40}" font-size="7" font-weight="${patient.advice ? 'bold' : 'normal'}" fill="${patient.advice ? '#0f172a' : '#64748b'}" font-family="${fontFam}">सलाह / Advice: ${escapeXml(patient.advice ? safeTruncate(patient.advice, 28) : '________________________')}</text>

  <!-- Footer & Left-Aligned Signature -->
  ${renderSvgDoctorSignature(doctor, 55, h - 32, 80, 20, fontFam)}
  <line x1="14" y1="${h - 30}" x2="114" y2="${h - 30}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="14" y="${h - 20}" font-size="7" font-weight="bold" fill="#334155" font-family="${fontFam}">Doctor's Signature</text>
  <text x="14" y="${h - 12}" font-size="6.5" fill="#64748b" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="${w - 14}" y="${h - 20}" text-anchor="end" font-size="6.5" font-weight="${patient.followUp ? 'bold' : 'normal'}" fill="${patient.followUp ? '#0f172a' : '#64748b'}" font-family="${fontFam}">Next Visit / अगली मुलाकात: ${escapeXml(patient.followUp ? patient.followUp : '____________')}</text>

  <!-- Bottom Solid Purple Ribbon -->
  <rect x="10" y="${h - 10}" width="${w - 20}" height="8" fill="${primaryColor}" rx="2.5" />
  <text x="${w / 2}" y="${h - 4}" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#ffffff" font-family="${fontFam}">prescriptionmaker.in</text>
</svg>`
}

// ── 6. Vitals-First SVG Layout ────────────────────────────────────────────────
function generateVitalsFirstSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'vitals-first') || MOBILE_TEMPLATES[4]
  const primaryColor = tpl.styles?.primaryColor || '#9b2335'
  const accentColor = tpl.styles?.accentColor || '#e53e3e'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const patBoxY = headH + 6
  const patBoxH = 26
  const vitalsBoxY = patBoxY + patBoxH + 6
  const vitalsH = 68
  const diagY = vitalsBoxY + vitalsH + 6
  const diagH = 22
  const rxY = diagY + diagH + 10
  const thH = 18
  const tableY = rxY + 14
  const lineCount = Math.max(11, Math.round(11 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Cardiovascular Assessment / Hypertension'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Cardiology & Heart Care'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const cardW = (w - 20) / 3
  const cardH = 24

  const writingLines = generateWritingLines(tableY + thH + 5, h - 55, lineCount, 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Crimson Header -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="14" y="${headH * 0.38}" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="14" y="${headH * 0.68}" font-size="7" fill="${accentColor}dd" font-family="${fontFam}">${escapeXml(doctor.qualification || 'MBBS, MD (Cardiology)')} · Cardiologist</text>
  <text x="${w - 14}" y="${headH * 0.38}" text-anchor="end" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="${w - 14}" y="${headH * 0.68}" text-anchor="end" font-size="7" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">Reg: ${escapeXml(doctor.registrationNumber || 'MCI-18492')}</text>

  <!-- Patient info bar -->
  <rect x="10" y="${patBoxY}" width="${w - 20}" height="${patBoxH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1" rx="4" />
  <text x="16" y="${patBoxY + 17}" font-size="7" fill="#94a3b8" font-family="${fontFam}">PATIENT:</text>
  <text x="60" y="${patBoxY + 17}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <text x="${w * 0.55}" y="${patBoxY + 17}" font-size="8" fill="#64748b" font-family="${fontFam}">Age: ${escapeXml(patient.age || '—')}  Sex: ${escapeXml(patient.sex || '—')}</text>
  <text x="${w - 16}" y="${patBoxY + 17}" text-anchor="end" font-size="7" fill="#64748b" font-family="${fontFam}">Date: ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <!-- Prominent 6-card VITALS Box -->
  <rect x="10" y="${vitalsBoxY}" width="${w - 20}" height="${vitalsH}" fill="#ffffff" stroke="${primaryColor}" stroke-width="1.5" rx="4" />
  <rect x="10" y="${vitalsBoxY}" width="${w - 20}" height="16" fill="${primaryColor}" rx="3" />
  <text x="16" y="${vitalsBoxY + 11}" font-size="8" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">❤️ VITALS</text>

  <!-- Row 1 of Vitals: BP, HR, SpO2 -->
  <rect x="10" y="${vitalsBoxY + 16}" width="${cardW}" height="${cardH}" fill="${accentColor}10" stroke="${primaryColor}20" stroke-width="0.5" />
  <text x="14" y="${vitalsBoxY + 25}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">BLOOD PRESSURE (mmHg)</text>
  <text x="14" y="${vitalsBoxY + 36}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.bp || '120/80')}</text>

  <rect x="${10 + cardW}" y="${vitalsBoxY + 16}" width="${cardW}" height="${cardH}" fill="${primaryColor}08" stroke="${primaryColor}20" stroke-width="0.5" />
  <text x="${14 + cardW}" y="${vitalsBoxY + 25}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">HEART RATE (bpm)</text>
  <text x="${14 + cardW}" y="${vitalsBoxY + 36}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.pulse || '74')}</text>

  <rect x="${10 + cardW * 2}" y="${vitalsBoxY + 16}" width="${cardW}" height="${cardH}" fill="${accentColor}10" stroke="${primaryColor}20" stroke-width="0.5" />
  <text x="${14 + cardW * 2}" y="${vitalsBoxY + 25}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">SpO₂ (%)</text>
  <text x="${14 + cardW * 2}" y="${vitalsBoxY + 36}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.spo2 ? (patient.spo2.includes('%') ? patient.spo2 : `${patient.spo2}%`) : '99%')}</text>

  <!-- Row 2 of Vitals: Temp, Weight, RR -->
  <rect x="10" y="${vitalsBoxY + 16 + cardH}" width="${cardW}" height="${cardH}" fill="${primaryColor}08" stroke="${primaryColor}20" stroke-width="0.5" />
  <text x="14" y="${vitalsBoxY + 25 + cardH}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">TEMPERATURE (°F)</text>
  <text x="14" y="${vitalsBoxY + 36 + cardH}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.temp ? (patient.temp.includes('°') ? patient.temp : `${patient.temp}°F`) : '98.4°F')}</text>

  <rect x="${10 + cardW}" y="${vitalsBoxY + 16 + cardH}" width="${cardW}" height="${cardH}" fill="${accentColor}10" stroke="${primaryColor}20" stroke-width="0.5" />
  <text x="${14 + cardW}" y="${vitalsBoxY + 25 + cardH}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">WEIGHT (kg)</text>
  <text x="${14 + cardW}" y="${vitalsBoxY + 36 + cardH}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.weight ? (patient.weight.includes('kg') ? patient.weight : `${patient.weight} kg`) : '68 kg')}</text>

  <rect x="${10 + cardW * 2}" y="${vitalsBoxY + 16 + cardH}" width="${cardW}" height="${cardH}" fill="${primaryColor}08" stroke="${primaryColor}20" stroke-width="0.5" />
  <text x="${14 + cardW * 2}" y="${vitalsBoxY + 25 + cardH}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">RESP. RATE (/min)</text>
  <text x="${14 + cardW * 2}" y="${vitalsBoxY + 36 + cardH}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">16</text>

  <!-- Cardiac Diagnosis Bar -->
  <rect x="10" y="${diagY}" width="${w - 20}" height="${diagH}" fill="${accentColor}12" stroke="${accentColor}40" stroke-width="1" rx="3" />
  <rect x="10" y="${diagY}" width="4" height="${diagH}" fill="${primaryColor}" rx="1" />
  <text x="18" y="${diagY + 14}" font-size="7" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">DIAGNOSIS:</text>
  <text x="75" y="${diagY + 14}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Rx Header -->
  <text x="12" y="${rxY + 8}" font-size="18" font-family="Georgia,serif" font-weight="bold" fill="${primaryColor}">℞</text>
  <text x="36" y="${rxY + 5}" font-size="8" font-weight="bold" fill="${primaryColor}" letter-spacing="0.5" font-family="${fontFam}">PRESCRIPTION MEDICINES</text>

  <!-- 6-Column Table Header -->
  <rect x="10" y="${tableY}" width="${w - 20}" height="${thH}" fill="${primaryColor}" rx="3" />
  <text x="15" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">#</text>
  <text x="30" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Medicine (Strength)</text>
  <text x="${w * 0.44}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Dosage</text>
  <text x="${w * 0.58}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${w * 0.74}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>
  <text x="${w * 0.88}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Qty</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Cardiac Investigations checklist -->
  <rect x="10" y="${h - 48}" width="${w - 20}" height="20" fill="#ffffff" stroke="${primaryColor}25" stroke-width="0.8" rx="3" />
  <text x="14" y="${h - 35}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">INVESTIGATIONS:</text>
  <text x="90" y="${h - 35}" font-size="6" fill="#475569" font-family="${fontFam}">☐ ECG   ☐ ECHO   ☐ TMT   ☐ Holter   ☐ Lipid Profile   ☐ HbA1c</text>

  <!-- Footer -->
  <line x1="10" y1="${h - 24}" x2="${w - 10}" y2="${h - 24}" stroke="#e2e8f0" stroke-width="0.8" />
  <text x="14" y="${h - 10}" font-size="6" font-weight="${patient.followUp ? 'bold' : 'normal'}" fill="${patient.followUp ? '#0f172a' : '#94a3b8'}" font-family="${fontFam}">Follow-up: ${patient.followUp ? escapeXml(patient.followUp) : '_________________'}</text>
  ${renderSvgDoctorSignature(doctor, w - 62, h - 16, 85, 20, fontFam)}
  <line x1="${w - 110}" y1="${h - 14}" x2="${w - 14}" y2="${h - 14}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 62}" y="${h - 6}" text-anchor="middle" font-size="6" fill="#94a3b8" font-family="${fontFam}">Cardiologist Signature</text>
</svg>`
}

// ── 7. Multi-Section Boxed SVG Layout ─────────────────────────────────────────
function generateBoxedSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'multi-section-boxed') || MOBILE_TEMPLATES[7]
  const primaryColor = tpl.styles?.primaryColor || '#0c4a6e'
  const accentColor = tpl.styles?.accentColor || '#38bdf8'
  const bgColor = tpl.styles?.bgColor || '#f0f9ff'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.065)
  const pad = 12
  const boxW2 = (w - pad * 2 - 8) / 2
  const stripH = 16

  // Row 1: Patient Information & Date/Reference
  const row1Y = headH + 8
  const row1H = 46

  // Box 2: Chief Complaint
  const ccY = row1Y + row1H + 6
  const ccH = 34

  // Box 3: Diagnosis
  const diagY = ccY + ccH + 6
  const diagH = 34

  // Box 5: Investigations & Advice (anchored to bottom with proper footer clearance)
  const invH = 36
  const invY = h - 90

  // Box 4: ℞ Prescription (stretches between Diagnosis and Investigations)
  const rxY = diagY + diagH + 6
  const rxBoxH = invY - rxY - 6
  const subThY = rxY + stripH
  const subThH = 16
  const lineCount = Math.max(10, Math.round(10 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || 'Patient full name'
  const complaintClean = safeTruncate(patient.chiefComplaint, 45) || 'Acute Pharyngitis'
  const diagnosisClean = safeTruncate(patient.diagnosis, 45) || 'Acute Pharyngitis'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Name of your clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? (doctor.doctorName.startsWith('Dr.') ? doctor.doctorName : `Dr. ${doctor.doctorName}`) : 'Dr. Full Name', 28)
  const docSub = [doctor.qualification, doctor.specialization].filter(Boolean).join(' · ') || 'MBBS, MD · General Medicine'
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = [patient.age ? `Age: ${patient.age}` : 'Age: 34', patient.sex ? `Sex: ${patient.sex}` : 'Sex: Male'].filter(Boolean).join(' · ')
  const patientReg = doctor.registrationNumber ? `Reg: ${doctor.registrationNumber}` : 'Reg: ___________'

  const sigLineY = h - 24
  const sigLineW = Math.min(115, Math.round(boxW2 * 0.95))
  const sigX2 = w - pad
  const sigX1 = sigX2 - sigLineW
  const sigCenterX = sigX1 + sigLineW / 2

  const writingLines = generateWritingLines(subThY + subThH + 12, rxY + rxBoxH - 10, lineCount, pad + 6, w - pad - 6)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:${bgColor};display:block;">
  <!-- Light Blue Background -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="${bgColor}" />

  <!-- Deep Blue Header Bar -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="16" y="${Math.round(headH * 0.44)}" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="16" y="${Math.round(headH * 0.76)}" font-size="7.5" fill="${accentColor}" font-family="${fontFam}">${escapeXml(docSub)}</text>
  <text x="${w - 16}" y="${Math.round(headH * 0.54)}" text-anchor="end" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>

  <!-- Row 1 Left: PATIENT INFORMATION -->
  <rect x="${pad}" y="${row1Y}" width="${boxW2}" height="${row1H}" fill="#ffffff" stroke="${accentColor}40" stroke-width="1.2" rx="4" />
  <rect x="${pad}" y="${row1Y}" width="${boxW2}" height="${stripH}" fill="${accentColor}" rx="3" />
  <text x="${pad + 8}" y="${row1Y + 11}" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">PATIENT INFORMATION</text>
  <text x="${pad + 8}" y="${row1Y + 28}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <text x="${pad + 8}" y="${row1Y + 39}" font-size="7" fill="#64748b" font-family="${fontFam}">${escapeXml(patientAgeSex)}</text>

  <!-- Row 1 Right: DATE & REFERENCE -->
  <rect x="${pad + boxW2 + 8}" y="${row1Y}" width="${boxW2}" height="${row1H}" fill="#ffffff" stroke="${accentColor}40" stroke-width="1.2" rx="4" />
  <rect x="${pad + boxW2 + 8}" y="${row1Y}" width="${boxW2}" height="${stripH}" fill="${accentColor}" rx="3" />
  <text x="${pad + boxW2 + 16}" y="${row1Y + 11}" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">DATE &amp; REFERENCE</text>
  <text x="${pad + boxW2 + 16}" y="${row1Y + 28}" font-size="7.5" fill="#64748b" font-family="${fontFam}">Date: <tspan font-weight="bold" fill="#0f172a">${escapeXml(dateStr)}</tspan></text>
  <text x="${pad + boxW2 + 16}" y="${row1Y + 39}" font-size="7" fill="#64748b" font-family="${fontFam}">${escapeXml(patientReg)}</text>

  <!-- Box 2: CHIEF COMPLAINT -->
  <rect x="${pad}" y="${ccY}" width="${w - pad * 2}" height="${ccH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1.2" rx="4" />
  <rect x="${pad}" y="${ccY}" width="${w - pad * 2}" height="${stripH}" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${ccY + 11}" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">CHIEF COMPLAINT</text>
  <text x="${pad + 8}" y="${ccY + 26}" font-size="7.5" fill="#334155" font-family="${fontFam}">${escapeXml(complaintClean)}</text>

  <!-- Box 3: DIAGNOSIS -->
  <rect x="${pad}" y="${diagY}" width="${w - pad * 2}" height="${diagH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1.2" rx="4" />
  <rect x="${pad}" y="${diagY}" width="${w - pad * 2}" height="${stripH}" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${diagY + 11}" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">DIAGNOSIS</text>
  <text x="${pad + 8}" y="${diagY + 26}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Box 4: ℞ PRESCRIPTION (Contains header, sub-table header, and writing area) -->
  <rect x="${pad}" y="${rxY}" width="${w - pad * 2}" height="${rxBoxH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1.2" rx="4" />
  <rect x="${pad}" y="${rxY}" width="${w - pad * 2}" height="${stripH}" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${rxY + 11}" font-size="7" font-weight="bold" fill="#ffffff" letter-spacing="0.6" font-family="${fontFam}">℞ PRESCRIPTION</text>

  <!-- Sub-table header inside Prescription box -->
  <rect x="${pad}" y="${subThY}" width="${w - pad * 2}" height="${subThH}" fill="${primaryColor}10" />
  <line x1="${pad}" y1="${subThY + subThH}" x2="${w - pad}" y2="${subThY + subThH}" stroke="${primaryColor}20" stroke-width="0.8" />
  <text x="${pad + 10}" y="${subThY + 11}" font-size="7" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Drug</text>
  <text x="${pad + (w - pad * 2) * 0.44}" y="${subThY + 11}" text-anchor="middle" font-size="7" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Unit</text>
  <text x="${pad + (w - pad * 2) * 0.65}" y="${subThY + 11}" text-anchor="middle" font-size="7" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Frequency</text>
  <text x="${pad + (w - pad * 2) * 0.88}" y="${subThY + 11}" text-anchor="middle" font-size="7" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">Duration</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Box 5 Left: INVESTIGATIONS -->
  <rect x="${pad}" y="${invY}" width="${boxW2}" height="${invH}" fill="#ffffff" stroke="${accentColor}40" stroke-width="1.2" rx="4" />
  <rect x="${pad}" y="${invY}" width="${boxW2}" height="${stripH}" fill="${accentColor}" rx="3" />
  <text x="${pad + 8}" y="${invY + 11}" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">INVESTIGATIONS</text>
  <text x="${pad + 8}" y="${invY + 25}" font-size="7" fill="${patient.investigations ? '#0f172a' : '#94a3b8'}" font-family="${fontFam}">${patient.investigations ? escapeXml(safeTruncate(patient.investigations, 32)) : 'Tests ordered...'}</text>

  <!-- Box 5 Right: ADVICE -->
  <rect x="${pad + boxW2 + 8}" y="${invY}" width="${boxW2}" height="${invH}" fill="#ffffff" stroke="${accentColor}40" stroke-width="1.2" rx="4" />
  <rect x="${pad + boxW2 + 8}" y="${invY}" width="${boxW2}" height="${stripH}" fill="${accentColor}" rx="3" />
  <text x="${pad + boxW2 + 16}" y="${invY + 11}" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">ADVICE</text>
  <text x="${pad + boxW2 + 16}" y="${invY + 25}" font-size="7" fill="${patient.advice ? '#0f172a' : '#94a3b8'}" font-family="${fontFam}">${patient.advice ? escapeXml(safeTruncate(patient.advice, 32)) : 'Patient advice...'}</text>

  <!-- Footer Left: Follow-up / Next Visit (aligned under Investigations) -->
  <text x="${pad}" y="${sigLineY + 6}" font-size="7" fill="#475569" font-family="${fontFam}">Next visit: <tspan font-weight="bold" fill="${primaryColor}">${escapeXml(patient.followUp?.trim() ? safeTruncate(patient.followUp.trim(), 28) : 'As advised')}</tspan></text>
  <text x="${pad}" y="${sigLineY + 16}" font-size="6" fill="#94a3b8" font-family="${fontFam}">Bring this prescription on next visit</text>

  <!-- Footer Right: Doctor's Signature (aligned under Advice) -->
  ${renderSvgDoctorSignature(doctor, sigCenterX, sigLineY - 2, Math.min(85, sigLineW), 20, fontFam)}
  <line x1="${sigX1}" y1="${sigLineY}" x2="${sigX2}" y2="${sigLineY}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${sigCenterX}" y="${sigLineY + 9}" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#475569" font-family="${fontFam}">Doctor's Signature</text>
  <text x="${sigCenterX}" y="${sigLineY + 17}" text-anchor="middle" font-size="6" fill="#64748b" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
</svg>`
}

// ── 8. Compartmentalized Grid SVG Layout ───────────────────────────────────────
function generateGridSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'compartmentalized-grid') || MOBILE_TEMPLATES[9]
  const primaryColor = tpl.styles?.primaryColor || '#92400e'
  const accentColor = tpl.styles?.accentColor || '#f59e0b'
  const bgColor = tpl.styles?.bgColor || '#fffbeb'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const patH = 34
  const ccH = 20
  const diagH = 20
  const rxY = headH + patH + ccH + diagH + 8
  const thH = 18
  const tableY = rxY + 12
  const lineCount = Math.max(11, Math.round(11 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 32) || 'General consultation & clinical history...'
  const diagnosisClean = safeTruncate(patient.diagnosis, 32) || 'Primary clinical diagnosis...'
  const clinicClean = safeTruncate(doctor.clinicName, 26) || 'Medical Centre'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 26)

  const colW = w / 3

  const writingLines = generateWritingLines(tableY + thH + 5, h - 60, lineCount, 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Doctor Header with Corporate Split -->
  <rect x="0" y="0" width="${w * 0.58}" height="${headH}" fill="${primaryColor}" />
  <text x="12" y="${headH * 0.38}" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="12" y="${headH * 0.65}" font-size="7" fill="${accentColor}" font-family="${fontFam}">${escapeXml(doctor.qualification || 'MBBS, MD')} · Consultant</text>
  <text x="12" y="${headH * 0.86}" font-size="6" fill="rgba(255,255,255,0.75)" font-family="${fontFam}">Reg: ${escapeXml(doctor.registrationNumber || 'PMC-49102')}</text>

  <rect x="${w * 0.58}" y="0" width="${w * 0.42}" height="${headH}" fill="#ffffff" />
  <line x1="${w * 0.58}" y1="0" x2="${w * 0.58}" y2="${headH}" stroke="${primaryColor}" stroke-width="2" />
  <text x="${w - 12}" y="${headH * 0.38}" text-anchor="end" font-size="10" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="${w - 12}" y="${headH * 0.65}" text-anchor="end" font-size="6" fill="#64748b" font-family="${fontFam}">${escapeXml(doctor.clinicAddress ? safeTruncate(doctor.clinicAddress, 24) : 'Clinic Center')}</text>
  <text x="${w - 12}" y="${headH * 0.86}" text-anchor="end" font-size="6" fill="#64748b" font-family="${fontFam}">☎ ${escapeXml(doctor.phone || 'Contact Info')}</text>

  <!-- 3-Column Patient Bar -->
  <rect x="0" y="${headH}" width="${w}" height="${patH}" fill="${bgColor}" />
  <line x1="0" y1="${headH}" x2="${w}" y2="${headH}" stroke="${primaryColor}" stroke-width="2" />
  <line x1="${colW}" y1="${headH}" x2="${colW}" y2="${headH + patH}" stroke="${primaryColor}40" stroke-width="1" />
  <line x1="${colW * 2}" y1="${headH}" x2="${colW * 2}" y2="${headH + patH}" stroke="${primaryColor}40" stroke-width="1" />
  <line x1="0" y1="${headH + patH}" x2="${w}" y2="${headH + patH}" stroke="${primaryColor}" stroke-width="2" />

  <text x="10" y="${headH + 12}" font-size="6" fill="#94a3b8" letter-spacing="0.5" font-family="${fontFam}">PATIENT NAME</text>
  <text x="10" y="${headH + 26}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>

  <text x="${colW + 10}" y="${headH + 12}" font-size="6" fill="#94a3b8" letter-spacing="0.5" font-family="${fontFam}">AGE / SEX</text>
  <text x="${colW + 10}" y="${headH + 26}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.age ? `${patient.age} yrs` : '—')} / ${escapeXml(patient.sex || '—')}</text>

  <text x="${colW * 2 + 10}" y="${headH + 12}" font-size="6" fill="#94a3b8" letter-spacing="0.5" font-family="${fontFam}">DATE</text>
  <text x="${colW * 2 + 10}" y="${headH + 26}" font-size="8" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <!-- Chief Complaint Band -->
  <rect x="0" y="${headH + patH}" width="${w}" height="${ccH}" fill="${primaryColor}08" />
  <line x1="0" y1="${headH + patH + ccH}" x2="${w}" y2="${headH + patH + ccH}" stroke="${primaryColor}30" stroke-width="0.8" />
  <text x="10" y="${headH + patH + 14}" font-size="6" font-weight="bold" fill="${primaryColor}" letter-spacing="0.5" font-family="${fontFam}">CHIEF COMPLAINT:</text>
  <text x="110" y="${headH + patH + 14}" font-size="7" fill="#374151" font-family="${fontFam}">${escapeXml(complaintClean)}</text>

  <!-- Diagnosis Band -->
  <rect x="0" y="${headH + patH + ccH}" width="${w}" height="${diagH}" fill="${primaryColor}" />
  <text x="10" y="${headH + patH + ccH + 14}" font-size="7" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">DIAGNOSIS:</text>
  <text x="80" y="${headH + patH + ccH + 14}" font-size="8" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Rx Header -->
  <text x="10" y="${rxY + 8}" font-size="16" font-family="Georgia,serif" font-weight="bold" fill="${primaryColor}">℞</text>
  <line x1="32" y1="${rxY + 4}" x2="${w - 10}" y2="${rxY + 4}" stroke="${primaryColor}30" stroke-width="1.5" />

  <!-- 5-Column Grid Table Header -->
  <rect x="10" y="${tableY}" width="${w - 20}" height="${thH}" fill="${accentColor}" rx="2" />
  <text x="16" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Medicine / Drugs</text>
  <text x="${w * 0.44}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Unit</text>
  <text x="${w * 0.58}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${w * 0.74}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>
  <text x="${w * 0.88}" y="${tableY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Qty</text>

  ${writingLines}
  ${strokesSVG}

  <!-- 2-Column Footer: Advice | Follow-up + Signature -->
  <rect x="10" y="${h - 52}" width="${(w - 28) * 0.5}" height="34" fill="#ffffff" stroke="${accentColor}50" stroke-width="0.8" rx="3" />
  <text x="16" y="${h - 42}" font-size="6" font-weight="bold" fill="${accentColor}" letter-spacing="0.5" font-family="${fontFam}">ADVICE &amp; TESTS</text>
  <text x="16" y="${h - 30}" font-size="6.5" font-weight="${(patient.advice || patient.investigations) ? 'bold' : 'normal'}" fill="${(patient.advice || patient.investigations) ? '#0f172a' : '#64748b'}" font-family="${fontFam}">${escapeXml(safeTruncate(patient.advice || patient.investigations || 'Diet & precautions: _________', 32))}</text>

  <rect x="${14 + (w - 28) * 0.5}" y="${h - 52}" width="${(w - 28) * 0.5}" height="34" fill="#ffffff" stroke="${primaryColor}40" stroke-width="0.8" rx="3" />
  <text x="${20 + (w - 28) * 0.5}" y="${h - 42}" font-size="6" font-weight="bold" fill="${primaryColor}" letter-spacing="0.5" font-family="${fontFam}">FOLLOW-UP &amp; SIGNATURE</text>
  <text x="${20 + (w - 28) * 0.5}" y="${h - 30}" font-size="6" font-weight="${patient.followUp ? 'bold' : 'normal'}" fill="${patient.followUp ? '#0f172a' : '#64748b'}" font-family="${fontFam}">Review: ${patient.followUp ? escapeXml(patient.followUp) : '___________________'}</text>
  ${renderSvgDoctorSignature(doctor, 20 + (w - 28) * 0.5 + ((w - 28) * 0.5) / 2, h - 18, 70, 16, fontFam)}

  <!-- Bottom band -->
  <rect x="0" y="${h - 14}" width="${w}" height="14" fill="${primaryColor}" />
  <text x="10" y="${h - 4}" font-size="6" fill="${accentColor}" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="${w - 10}" y="${h - 4}" text-anchor="end" font-size="6" fill="${accentColor}" font-family="${fontFam}">prescriptionmaker.in</text>
</svg>`
}

// ── 9. Detailed Drug Chart SVG Layout ─────────────────────────────────────────
function generateDetailedChartSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'detailed-drug-chart') || MOBILE_TEMPLATES[5]
  const primaryColor = tpl.styles?.primaryColor || '#065f46'
  const accentColor = tpl.styles?.accentColor || '#10b981'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const pad = 10
  const patRowY = headH + 8
  const patRowH = 38
  const patW = Math.round((w - pad * 2 - 8) * 0.62)
  const diagW = (w - pad * 2 - 8) - patW

  const rxY = patRowY + patRowH + 8
  const thH = 20
  const tableY = rxY + 12
  const lineCount = Math.max(11, Math.round(11 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 22) || 'Clinical Diagnosis'
  const clinicClean = safeTruncate(doctor.clinicName, 28) || 'Specialty Medical Center'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const boxY = h - 90
  const boxH = 34
  const boxW = (w - 28) * 0.5

  const sigLineY = h - 24
  const sigLineW = Math.min(120, Math.round(boxW * 0.95))
  const sigX2 = w - 14
  const sigX1 = sigX2 - sigLineW
  const sigCenterX = sigX1 + sigLineW / 2

  const writingLines = generateWritingLines(tableY + thH + 5, boxY - 6, lineCount, 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Emerald Green Header -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="14" y="${headH * 0.38}" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="14" y="${headH * 0.68}" font-size="7" fill="${accentColor}" font-family="${fontFam}">${escapeXml(doctor.qualification || 'MBBS, MD')} · Clinical Specialist</text>
  <text x="${w - 14}" y="${headH * 0.38}" text-anchor="end" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="${w - 14}" y="${headH * 0.68}" text-anchor="end" font-size="6" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">☎ ${escapeXml(doctor.phone || 'Clinic Helpline')} · Reg: ${escapeXml(doctor.registrationNumber || 'MED-4819')}</text>

  <!-- Patient Card (Left) -->
  <rect x="${pad}" y="${patRowY}" width="${patW}" height="${patRowH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1" rx="4" />
  <text x="${pad + 8}" y="${patRowY + 12}" font-size="6" fill="#94a3b8" letter-spacing="0.5" font-family="${fontFam}">PATIENT</text>
  <text x="${pad + 8}" y="${patRowY + 24}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <text x="${pad + 8}" y="${patRowY + 34}" font-size="7" fill="#64748b" font-family="${fontFam}">${escapeXml(patient.age ? `Age: ${patient.age}y` : 'Age: —')} · ${escapeXml(patient.sex || '—')} · Date: ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <!-- Diagnosis Card (Right) -->
  <rect x="${pad + patW + 8}" y="${patRowY}" width="${diagW}" height="${patRowH}" fill="${accentColor}15" stroke="${accentColor}40" stroke-width="1" rx="4" />
  <text x="${pad + patW + 16}" y="${patRowY + 12}" font-size="6" fill="${primaryColor}" font-weight="bold" letter-spacing="0.5" font-family="${fontFam}">DIAGNOSIS</text>
  <text x="${pad + patW + 16}" y="${patRowY + 26}" font-size="9" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Rx Heading with accent underline -->
  <text x="10" y="${rxY + 8}" font-size="16" font-family="Georgia,serif" font-weight="bold" fill="${primaryColor}">℞</text>
  <line x1="30" y1="${rxY + 4}" x2="${w - 10}" y2="${rxY + 4}" stroke="${primaryColor}30" stroke-width="1.5" />

  <!-- 6-Column Detailed Drug Schedule Header -->
  <rect x="10" y="${tableY}" width="${w - 20}" height="${thH}" fill="${primaryColor}" rx="3" />
  <text x="14" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">#</text>
  <text x="28" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Medicine Name &amp; Strength</text>
  <text x="${w * 0.44}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Route</text>
  <text x="${w * 0.58}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Timing</text>
  <text x="${w * 0.73}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${w * 0.87}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Lab Investigations & Advice Box -->
  <rect x="10" y="${boxY}" width="${boxW}" height="${boxH}" fill="#ffffff" stroke="${accentColor}40" stroke-width="0.8" rx="3" />
  <text x="16" y="${boxY + 11}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">LAB INVESTIGATIONS</text>
  <text x="16" y="${boxY + 23}" font-size="6.5" font-weight="${patient.investigations ? 'bold' : 'normal'}" fill="${patient.investigations ? '#0f172a' : '#64748b'}" font-family="${fontFam}">${patient.investigations ? escapeXml(safeTruncate(patient.investigations, 30)) : 'CBC, LFT, KFT, Urine R/M: ______'}</text>

  <rect x="${14 + boxW}" y="${boxY}" width="${boxW}" height="${boxH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <text x="${20 + boxW}" y="${boxY + 11}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">SPECIAL INSTRUCTIONS</text>
  <text x="${20 + boxW}" y="${boxY + 23}" font-size="6.5" font-weight="${patient.advice ? 'bold' : 'normal'}" fill="${patient.advice ? '#0f172a' : '#64748b'}" font-family="${fontFam}">${patient.advice ? escapeXml(safeTruncate(patient.advice, 30)) : 'Take after meals with water'}</text>

  <!-- Footer Left: Follow-up -->
  <text x="14" y="${sigLineY + 6}" font-size="7" fill="#475569" font-family="${fontFam}">Follow-up: <tspan font-weight="bold" fill="${primaryColor}">${escapeXml(patient.followUp?.trim() ? safeTruncate(patient.followUp.trim(), 28) : 'As advised')}</tspan></text>
  <text x="14" y="${sigLineY + 16}" font-size="6" fill="#94a3b8" font-family="${fontFam}">Please bring this prescription for your next consultation</text>

  <!-- Footer Right: Doctor's Signature -->
  ${renderSvgDoctorSignature(doctor, sigCenterX, sigLineY - 2, Math.min(85, sigLineW), 20, fontFam)}
  <line x1="${sigX1}" y1="${sigLineY}" x2="${sigX2}" y2="${sigLineY}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${sigCenterX}" y="${sigLineY + 9}" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#475569" font-family="${fontFam}">Doctor's Signature</text>
  <text x="${sigCenterX}" y="${sigLineY + 17}" text-anchor="middle" font-size="6" fill="#64748b" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
</svg>`
}

// ── 10. Classic Letterhead SVG Layout (Default) ───────────────────────────────
function generateClassicLetterheadSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES[0]
  const styles = tpl.styles || {
    primaryColor: '#102A56',
    accentColor: '#155EEF',
    bgColor: '#ffffff',
    fontFamily: 'serif',
  }

  const primaryColor = styles.primaryColor || '#102A56'
  const fontFam = styles.fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.14)
  const patY = headH + 12
  const patH = 26
  const diagY = patY + patH + 4
  const diagH = 20
  const rxY = diagY + diagH + 10
  const lineCount = Math.max(14, Math.round(14 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Clinical Diagnosis'
  const clinicClean = safeTruncate(doctor.clinicName, 34) || 'CITY MEDICAL CLINIC'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Doctor Name', 30)

  const writingLines = generateWritingLines(rxY + 28, h - 55, lineCount, 14, w - 14)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Centered Letterhead Masthead -->
  <text x="${w / 2}" y="${headH * 0.32}" text-anchor="middle" font-size="16" font-weight="bold" fill="${primaryColor}" letter-spacing="1.2" font-family="${fontFam}">${escapeXml(clinicClean.toUpperCase())}</text>
  <text x="${w / 2}" y="${headH * 0.58}" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="${w / 2}" y="${headH * 0.78}" text-anchor="middle" font-size="8" fill="#64748b" font-family="${fontFam}">${escapeXml([doctor.qualification, doctor.specialization].filter(Boolean).join(', ') || 'Consultant Physician & Surgeon')}</text>
  <text x="${w / 2}" y="${headH * 0.94}" text-anchor="middle" font-size="7" fill="#94a3b8" font-family="${fontFam}">☎ ${escapeXml(doctor.phone || 'Clinic Contact')} · Reg. No: ${escapeXml(doctor.registrationNumber || 'DOC-REG-001')}${doctor.clinicAddress ? ` · ${escapeXml(safeTruncate(doctor.clinicAddress, 26))}` : ''}</text>

  <!-- Double Letterhead Border -->
  <line x1="12" y1="${headH + 4}" x2="${w - 12}" y2="${headH + 4}" stroke="${primaryColor}" stroke-width="2.2" />
  <line x1="12" y1="${headH + 8}" x2="${w - 12}" y2="${headH + 8}" stroke="${primaryColor}" stroke-width="0.8" />

  <!-- Patient + Date Row -->
  <text x="14" y="${patY + 16}" font-size="8" fill="#94a3b8" font-family="${fontFam}">Patient:</text>
  <text x="58" y="${patY + 16}" font-size="11" font-weight="bold" fill="#1e293b" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <line x1="58" y1="${patY + 19}" x2="${Math.min(w * 0.56, 58 + 140)}" y2="${patY + 19}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="2,2" />

  <text x="${w * 0.60}" y="${patY + 16}" font-size="8" fill="#64748b" font-family="${fontFam}">Age: ${escapeXml(patient.age || '—')}${patient.sex ? ` / ${escapeXml(patient.sex)}` : ''}</text>
  <text x="${w - 14}" y="${patY + 16}" text-anchor="end" font-size="8" fill="#64748b" font-family="${fontFam}">Date: ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <line x1="14" y1="${patY + patH}" x2="${w - 14}" y2="${patY + patH}" stroke="#e2e8f0" stroke-width="1" />

  <!-- Chief Complaint / Diagnosis Row -->
  <text x="14" y="${diagY + 14}" font-size="7" fill="#94a3b8" font-family="${fontFam}">Chief Complaint / Diagnosis:</text>
  <text x="140" y="${diagY + 14}" font-size="8" font-weight="bold" fill="#1e293b" font-family="${fontFam}">${escapeXml(diagnosisClean)}${complaintClean !== '—' ? ` · ${escapeXml(complaintClean)}` : ''}</text>

  <!-- Large Italic Serif ℞ -->
  <text x="14" y="${rxY + 20}" font-size="28" font-family="Georgia,serif" font-style="italic" font-weight="bold" fill="${primaryColor}">℞</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Advice & Lab Notice -->
  <text x="14" y="${h - 44}" font-size="7.5" font-weight="${patient.advice ? 'bold' : 'normal'}" fill="${patient.advice ? '#0f172a' : '#64748b'}" font-family="${fontFam}">Advice: ${escapeXml(patient.advice ? safeTruncate(patient.advice, 32) : '______________________')}</text>
  <text x="${w * 0.52}" y="${h - 44}" font-size="7.5" font-weight="${patient.investigations ? 'bold' : 'normal'}" fill="${patient.investigations ? '#0f172a' : '#64748b'}" font-family="${fontFam}">Investigations: ${escapeXml(patient.investigations ? safeTruncate(patient.investigations, 24) : '________________')}</text>

  <!-- Classic Signature Block -->
  <line x1="14" y1="${h - 32}" x2="${w - 14}" y2="${h - 32}" stroke="#e2e8f0" stroke-width="0.8" />
  <text x="14" y="${h - 18}" font-size="7.5" font-weight="${patient.followUp ? 'bold' : 'normal'}" fill="${patient.followUp ? '#0f172a' : '#64748b'}" font-family="${fontFam}">Follow-up on: ${escapeXml(patient.followUp ? safeTruncate(patient.followUp, 28) : '________________')}</text>
  ${renderSvgDoctorSignature(doctor, w - 62, h - 22, 85, 25, fontFam)}
  <line x1="${w - 110}" y1="${h - 20}" x2="${w - 14}" y2="${h - 20}" stroke="#475569" stroke-width="1" />
  <text x="${w - 62}" y="${h - 8}" text-anchor="middle" font-size="7" fill="#64748b" font-family="${fontFam}">Doctor's Signature</text>
  <text x="14" y="${h - 8}" font-size="5.5" fill="#cbd5e1" letter-spacing="0.5" font-family="${fontFam}">PrescriptionMaker.in · Classic Letterhead</text>
</svg>`
}

// ── 11. Dental & Clinic Rx SVG Layout ─────────────────────────────────────────
function generateDentalClinicSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, paths } = data
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'MARQUEZ DENTAL CLINIC'
  const addressClean = safeTruncate(doctor.clinicAddress, 45) || 'Brgy. San Jose, San Nicolas, Ilocos Norte'
  const phoneClean = doctor.phone || '09178302001'

  // Clean doctor name without duplicate 'Dra.' or 'Dr.'
  let rawDoc = (doctor.doctorName || 'Dra. Lois Gabrielle F. Marquez').trim()
  if (!/^(Dr|Dra)\.?\s+/i.test(rawDoc)) {
    rawDoc = `Dr. ${rawDoc}`
  }
  const qualClean = (doctor.qualification || 'DMD').trim()
  const doctorTitleClean = qualClean ? `${rawDoc}, ${qualClean}` : rawDoc

  const patientNameClean = safeTruncate(patient.patientName, 26)
  const patientAgeClean = (patient.age || '').trim()
  const todayStr = patient.date || new Date().toLocaleDateString('en-IN')

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const topH = Math.round(baseH * 0.125)
  const lineCount = Math.max(13, Math.round(13 * (h / baseH)))
  const fontFam = "Georgia, 'Times New Roman', serif"

  const leftMargin = Math.round(w * 0.05)
  const rightMargin = Math.round(w * 0.94)

  const writingLines = generateWritingLines(topH + 52, h - 85, lineCount, leftMargin, rightMargin)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  const pLabelSize = Math.max(6.8, Math.min(11, Math.round(w * 0.014)))
  const pValSize = Math.max(7.2, Math.min(12, Math.round(w * 0.015)))

  // Safe right boundary with 14% pure free whitespace on right
  const safeRight = Math.round(w * 0.86)
  const maxBlockWidth = Math.round(w * 0.46)
  const blockX = safeRight - maxBlockWidth
  const availableWidth = safeRight - blockX

  const targetDocSize = Math.max(5.5, Math.min(12.5, Math.round(w * 0.0155)))
  const maxDocSizeForLength = Math.floor((availableWidth - 10) / (Math.max(1, doctorTitleClean.length) * 0.65))
  const docFontSize = Math.max(5.5, Math.min(targetDocSize, maxDocSizeForLength, 12.5))

  const labelFontSize = Math.max(5, Math.min(10, Math.round(docFontSize * 0.82)))
  const licLabelW = Math.round(11 * labelFontSize * 0.65)
  const lineStartX = blockX + licLabelW + 6
  const underlineEndX = safeRight

  const maxValLen = Math.max(12, Math.floor((underlineEndX - lineStartX - 6) / (labelFontSize * 0.62)))
  const regNoClean = safeTruncate(doctor.registrationNumber || 'PRC-0078921', maxValLen)
  const specClean = safeTruncate(doctor.specialization || 'PTR-1234567', maxValLen)

  const docNameY = h - Math.max(48, Math.round(baseH * 0.052))
  const line1Y = docNameY + Math.max(14, Math.round(baseH * 0.016))
  const line2Y = line1Y + Math.max(14, Math.round(baseH * 0.016))

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Header: Large ℞ on Left, Clinic Details on Right -->
  <text x="${Math.round(w * 0.06)}" y="${Math.round(topH * 0.68)}" font-size="${Math.max(38, Math.round(w * 0.12))}" font-family="${fontFam}" fill="#111827">℞</text>

  <!-- Clinic Name -->
  <text x="${Math.round(w * 0.26)}" y="${Math.round(topH * 0.28)}" font-size="${Math.max(10, Math.round(w * 0.034))}" font-family="${fontFam}" font-weight="bold" fill="#111827" letter-spacing="0.4">${escapeXml(clinicClean.toUpperCase())}</text>

  <!-- Address -->
  <text x="${Math.round(w * 0.26)}" y="${Math.round(topH * 0.44)}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" font-family="${fontFam}" fill="#374151">${escapeXml(addressClean)}</text>

  <!-- Phone -->
  <text x="${Math.round(w * 0.26)}" y="${Math.round(topH * 0.58)}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" font-weight="bold" fill="#111827" font-family="Arial, sans-serif">📞 ${escapeXml(phoneClean)}</text>

  <!-- Clinic Hours -->
  <text x="${Math.round(w * 0.26)}" y="${Math.round(topH * 0.72)}" font-size="${Math.max(5.5, Math.round(w * 0.017))}" fill="#4b5563" font-family="${fontFam}">Clinic Hours: Monday – Saturday | 9:00 AM – 12:00 NN  1:00 PM – 5:00 PM</text>
  <text x="${Math.round(w * 0.26)}" y="${Math.round(topH * 0.84)}" font-size="${Math.max(5.5, Math.round(w * 0.017))}" fill="#4b5563" font-family="${fontFam}">Sunday                       | By appointment</text>

  <!-- Solid Black Divider Line -->
  <line x1="${leftMargin}" y1="${topH}" x2="${rightMargin}" y2="${topH}" stroke="#111827" stroke-width="2" />

  <!-- Patient Info Underlines -->
  <text x="${leftMargin}" y="${topH + 18}" font-size="${pLabelSize}" font-family="${fontFam}" fill="#111827">Patient's Name:</text>
  <line x1="${Math.round(w * 0.17)}" y1="${topH + 20}" x2="${Math.round(w * 0.58)}" y2="${topH + 20}" stroke="#111827" stroke-width="0.8" />
  ${patientNameClean ? `<text x="${Math.round(w * 0.18)}" y="${topH + 18}" font-size="${pValSize}" font-family="${fontFam}" font-weight="bold" fill="#111827">${escapeXml(patientNameClean)}</text>` : ''}

  <text x="${Math.round(w * 0.62)}" y="${topH + 18}" font-size="${pLabelSize}" font-family="${fontFam}" fill="#111827">Age:</text>
  <line x1="${Math.round(w * 0.67)}" y1="${topH + 20}" x2="${Math.round(w * 0.77)}" y2="${topH + 20}" stroke="#111827" stroke-width="0.8" />
  ${patientAgeClean ? `<text x="${Math.round(w * 0.68)}" y="${topH + 18}" font-size="${pValSize}" font-family="${fontFam}" fill="#111827">${escapeXml(patientAgeClean)}</text>` : ''}

  <text x="${Math.round(w * 0.80)}" y="${topH + 18}" font-size="${pLabelSize}" font-family="${fontFam}" fill="#111827">Gender:</text>
  <line x1="${Math.round(w * 0.87)}" y1="${topH + 20}" x2="${rightMargin}" y2="${topH + 20}" stroke="#111827" stroke-width="0.8" />
  ${patient.sex ? `<text x="${Math.round(w * 0.88)}" y="${topH + 18}" font-size="${pValSize}" font-family="${fontFam}" fill="#111827">${escapeXml(patient.sex)}</text>` : ''}

  <text x="${leftMargin}" y="${topH + 36}" font-size="${pLabelSize}" font-family="${fontFam}" fill="#111827">Address:</text>
  <line x1="${Math.round(w * 0.13)}" y1="${topH + 38}" x2="${Math.round(w * 0.58)}" y2="${topH + 38}" stroke="#111827" stroke-width="0.8" />
  ${patient.address ? `<text x="${Math.round(w * 0.14)}" y="${topH + 36}" font-size="${pValSize}" font-family="${fontFam}" fill="#111827">${escapeXml(safeTruncate(patient.address, 36))}</text>` : ''}

  <text x="${Math.round(w * 0.62)}" y="${topH + 36}" font-size="${pLabelSize}" font-family="${fontFam}" fill="#111827">Date:</text>
  <line x1="${Math.round(w * 0.67)}" y1="${topH + 38}" x2="${rightMargin}" y2="${topH + 38}" stroke="#111827" stroke-width="0.8" />
  <text x="${Math.round(w * 0.68)}" y="${topH + 36}" font-size="${pValSize}" font-family="${fontFam}" fill="#111827">${escapeXml(todayStr)}</text>

  <!-- Writing guide lines -->
  ${writingLines}

  <!-- Tablet handwriting strokes -->
  ${strokesSVG}

  <!-- Footer Doctor Credentials & Signature -->
  ${doctor.signature && doctor.signature.trim() ? `<image href="${escapeXml(doctor.signature)}" x="${blockX + 20}" y="${docNameY - 36}" width="130" height="32" preserveAspectRatio="xMidYMid meet" />` : ''}
  <text x="${blockX}" y="${docNameY}" font-size="${docFontSize}" font-family="${fontFam}" font-weight="bold" fill="#111827">${escapeXml(doctorTitleClean)}</text>

  <text x="${blockX}" y="${line1Y}" font-size="${labelFontSize}" font-family="${fontFam}" fill="#111827">License No.</text>
  <line x1="${lineStartX}" y1="${line1Y + 2}" x2="${underlineEndX}" y2="${line1Y + 2}" stroke="#111827" stroke-width="0.8" />
  ${regNoClean ? `<text x="${lineStartX + 4}" y="${line1Y}" font-size="${labelFontSize}" font-family="${fontFam}" fill="#111827">${escapeXml(regNoClean)}</text>` : ''}

  <text x="${blockX}" y="${line2Y}" font-size="${labelFontSize}" font-family="${fontFam}" fill="#111827">PTR No.</text>
  <line x1="${lineStartX}" y1="${line2Y + 2}" x2="${underlineEndX}" y2="${line2Y + 2}" stroke="#111827" stroke-width="0.8" />
  ${specClean ? `<text x="${lineStartX + 4}" y="${line2Y}" font-size="${labelFontSize}" font-family="${fontFam}" fill="#111827">${escapeXml(specClean)}</text>` : ''}
</svg>`
}

// ── 12. Modern Teal Ribbon SVG Layout ─────────────────────────────────────────
function generateModernTealRibbonSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, paths } = data
  const tealColor = '#00C4CC'
  const navyColor = '#0f2330'

  const rawDocName = (doctor.doctorName || '').replace(/^Dr\.?\s*/i, '').trim()
  const doctorClean = safeTruncate(rawDocName || 'Doctor Name', 24)
  const qualClean = (doctor.qualification || 'QUALIFICATION').toUpperCase()
  const otherDetails = safeTruncate(doctor.specialization || doctor.clinicName || 'Add other details', 32)
  const patientNameClean = safeTruncate(patient.patientName, 26)
  const diagnosisClean = safeTruncate(patient.diagnosis, 48)
  const todayStr = patient.date || new Date().toLocaleDateString('en-IN')
  const addressRaw = doctor.clinicAddress || '24 Dummy Street Area'
  const isLongAddress = addressRaw.trim().length > 22
  const addressClean = safeTruncate(addressRaw, isLongAddress ? 50 : 22)
  const phoneClean = safeTruncate(doctor.phone || '+12-345 678 9012', 20)

  // Standard A4 reference height for top header proportions
  const baseH = Math.min(h, Math.round(w * (1123 / 794)))

  // Top-Right "V" Ribbon (Matches Image 1 authentic template design)
  const rH = Math.round(baseH * 0.158)
  const cTopL = Math.round(w * 0.49)
  const cTopR = Math.round(w * 0.655)
  const cApex = Math.round(w * 0.825)
  const cBaseL = Math.round(w * 0.66)

  // Midpoint of Cyan's right edge where Navy meets Cyan in the fold
  const nInnerX = Math.round((cTopR + cApex) / 2)
  const nInnerY = Math.round(rH * 0.50)

  // Navy arm
  const nTopL = Math.round(w * 0.81)
  const nTopR = Math.round(w * 0.98)

  // Bottom-Left Folded 3D Corner Chevron (Matches Image 1 authentic template design)
  const peakX = Math.round(w * 0.105)
  const peakY = h - Math.round(baseH * 0.103)
  const cPeakR = Math.round(w * 0.24)
  const cBotR = Math.round(w * 0.35)
  const cBotL = Math.round(w * 0.215)
  const nMidX = Math.round(w * 0.174)
  const nMidY = h - Math.round(baseH * 0.043)
  const nBotX = Math.round(w * 0.148)

  // Caduceus Emblem (Centered above the chevron, proportional and graceful)
  const cadX = Math.round(w * 0.17)
  const cadY = h - Math.round(baseH * 0.20)
  const cadScale = Math.max(0.72, Math.min(1.15, w / 480))

  // Signature Block Coordinates (Elevated above footer to eliminate ANY overlap!)
  const sigY = h - Math.round(baseH * 0.145)
  const sigX1 = Math.round(w * 0.62)
  const sigX2 = Math.round(w * 0.88)
  const sigCenter = Math.round((sigX1 + sigX2) / 2)

  // Footer Contact Coordinates (Positioned cleanly on bottom margin)
  const footerY = h - Math.round(baseH * 0.045)
  const addrX = Math.round(w * 0.38)
  const phoneX = Math.round(w * 0.70)

  const fontFam = 'Arial, Helvetica, sans-serif'
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Top-Right Geometric Ribbon: clean diagonal V shape matching Image 1 -->
  <!-- Navy right arm (folds behind Cyan ribbon) -->
  <path d="M ${nTopL} 0 L ${nTopR} 0 L ${cApex} ${rH} L ${nInnerX} ${nInnerY} Z" fill="${navyColor}" />
  <!-- Cyan left arm (folds in front with flat base) -->
  <path d="M ${cTopL} 0 L ${cTopR} 0 L ${cApex} ${rH} L ${cBaseL} ${rH} Z" fill="${tealColor}" />

  <!-- Top-Left Doctor Info (Typography matching Image 1) -->
  <text x="${Math.round(w * 0.055)}" y="${Math.round(baseH * 0.088)}" font-size="${Math.max(14, Math.round(w * 0.044))}" font-weight="800" fill="#0e3860" font-family="${fontFam}">
    Dr. <tspan font-weight="400" fill="#1e3a5f">${escapeXml(doctorClean)}</tspan>
  </text>
  <text x="${Math.round(w * 0.055)}" y="${Math.round(baseH * 0.122)}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" font-weight="bold" fill="#64748b" letter-spacing="2.2" font-family="${fontFam}">${escapeXml(qualClean)}</text>
  <line x1="${Math.round(w * 0.055)}" y1="${Math.round(baseH * 0.130)}" x2="${Math.round(w * 0.055) + Math.min(110, Math.round(w * 0.22))}" y2="${Math.round(baseH * 0.130)}" stroke="#cbd5e1" stroke-width="1.2" />
  <text x="${Math.round(w * 0.055)}" y="${Math.round(baseH * 0.160)}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" font-style="italic" fill="#64748b" font-family="${fontFam}">${escapeXml(otherDetails)}</text>

  <!-- 3-Row Underlined Patient Strip (Clean, neat lines matching Image 1) -->
  <!-- Row 1: Patient Name & Date -->
  <text x="${Math.round(w * 0.055)}" y="${Math.round(baseH * 0.210)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#475569" font-family="${fontFam}">Patient Name:</text>
  <line x1="${Math.round(w * 0.22)}" y1="${Math.round(baseH * 0.213)}" x2="${Math.round(w * 0.63)}" y2="${Math.round(baseH * 0.213)}" stroke="#cbd5e1" stroke-width="1" />
  ${patientNameClean ? `<text x="${Math.round(w * 0.24)}" y="${Math.round(baseH * 0.208)}" font-size="${Math.max(7.5, Math.round(w * 0.022))}" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>` : ''}

  <text x="${Math.round(w * 0.66)}" y="${Math.round(baseH * 0.210)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#475569" font-family="${fontFam}">Date:</text>
  <line x1="${Math.round(w * 0.74)}" y1="${Math.round(baseH * 0.213)}" x2="${Math.round(w * 0.94)}" y2="${Math.round(baseH * 0.213)}" stroke="#cbd5e1" stroke-width="1" />
  <text x="${Math.round(w * 0.76)}" y="${Math.round(baseH * 0.208)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#334155" font-family="${fontFam}">${escapeXml(todayStr)}</text>

  <!-- Row 2: Age, Gender, Weight -->
  <text x="${Math.round(w * 0.055)}" y="${Math.round(baseH * 0.245)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#475569" font-family="${fontFam}">Age:</text>
  <line x1="${Math.round(w * 0.12)}" y1="${Math.round(baseH * 0.248)}" x2="${Math.round(w * 0.30)}" y2="${Math.round(baseH * 0.248)}" stroke="#cbd5e1" stroke-width="1" />
  ${patient.age ? `<text x="${Math.round(w * 0.14)}" y="${Math.round(baseH * 0.243)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.age)}</text>` : ''}

  <text x="${Math.round(w * 0.33)}" y="${Math.round(baseH * 0.245)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#475569" font-family="${fontFam}">Gender:</text>
  <line x1="${Math.round(w * 0.43)}" y1="${Math.round(baseH * 0.248)}" x2="${Math.round(w * 0.58)}" y2="${Math.round(baseH * 0.248)}" stroke="#cbd5e1" stroke-width="1" />
  ${patient.sex ? `<text x="${Math.round(w * 0.45)}" y="${Math.round(baseH * 0.243)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.sex)}</text>` : ''}

  <text x="${Math.round(w * 0.62)}" y="${Math.round(baseH * 0.245)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#475569" font-family="${fontFam}">Weight:</text>
  <line x1="${Math.round(w * 0.73)}" y1="${Math.round(baseH * 0.248)}" x2="${Math.round(w * 0.94)}" y2="${Math.round(baseH * 0.248)}" stroke="#cbd5e1" stroke-width="1" />
  ${patient.weight ? `<text x="${Math.round(w * 0.75)}" y="${Math.round(baseH * 0.243)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#0f172a" font-family="${fontFam}">${escapeXml(patient.weight)} kg</text>` : ''}

  <!-- Row 3: Diagnosis -->
  <text x="${Math.round(w * 0.055)}" y="${Math.round(baseH * 0.280)}" font-size="${Math.max(7, Math.round(w * 0.021))}" fill="#475569" font-family="${fontFam}">Diagnosis:</text>
  <line x1="${Math.round(w * 0.20)}" y1="${Math.round(baseH * 0.283)}" x2="${Math.round(w * 0.94)}" y2="${Math.round(baseH * 0.283)}" stroke="#cbd5e1" stroke-width="1" />
  ${diagnosisClean ? `<text x="${Math.round(w * 0.22)}" y="${Math.round(baseH * 0.278)}" font-size="${Math.max(7.2, Math.round(w * 0.022))}" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>` : ''}

  <!-- Tablet handwriting strokes (Clean canvas, no ruled lines) -->
  ${strokesSVG}

  <!-- Bottom-Left Folded 3D Corner Chevron (Exact geometry matching Image 1) -->
  <!-- Dark Navy Left Slope -->
  <path d="M 0 ${h} L ${peakX} ${peakY} L ${nMidX} ${nMidY} L ${nBotX} ${h} Z" fill="${navyColor}" />
  <!-- Vibrant Cyan Right Slope -->
  <path d="M ${peakX} ${peakY} L ${cPeakR} ${peakY} L ${cBotR} ${h} L ${cBotL} ${h} Z" fill="${tealColor}" />

  <!-- Authentic Medical Caduceus Emblem (Floating above the chevron) -->
  <!-- Top Sphere / Knob -->
  <circle cx="${cadX}" cy="${cadY - 26 * cadScale}" r="${4.8 * cadScale}" fill="${tealColor}" />
  <circle cx="${cadX}" cy="${cadY - 20 * cadScale}" r="${2.2 * cadScale}" fill="${tealColor}" />

  <!-- Central Staff -->
  <line x1="${cadX}" y1="${cadY - 20 * cadScale}" x2="${cadX}" y2="${cadY + 34 * cadScale}" stroke="${tealColor}" stroke-width="${2.4 * cadScale}" stroke-linecap="round" />
  <circle cx="${cadX}" cy="${cadY + 34 * cadScale}" r="${2.2 * cadScale}" fill="${tealColor}" />

  <!-- Symmetrical Graceful Wings (Eagle/Medical Wings matching Image 1) -->
  <!-- Left Wing -->
  <path d="M ${cadX - 2 * cadScale} ${cadY - 12 * cadScale} C ${cadX - 16 * cadScale} ${cadY - 24 * cadScale}, ${cadX - 32 * cadScale} ${cadY - 24 * cadScale}, ${cadX - 44 * cadScale} ${cadY - 14 * cadScale} C ${cadX - 35 * cadScale} ${cadY - 6 * cadScale}, ${cadX - 29 * cadScale} ${cadY - 5 * cadScale}, ${cadX - 31 * cadScale} ${cadY + 1 * cadScale} C ${cadX - 23 * cadScale} ${cadY + 2 * cadScale}, ${cadX - 19 * cadScale} ${cadY + 4 * cadScale}, ${cadX - 20 * cadScale} ${cadY + 8 * cadScale} C ${cadX - 12 * cadScale} ${cadY + 8 * cadScale}, ${cadX - 4 * cadScale} ${cadY + 4 * cadScale}, ${cadX - 2 * cadScale} ${cadY - 2 * cadScale} Z" fill="${tealColor}" />
  <!-- Right Wing -->
  <path d="M ${cadX + 2 * cadScale} ${cadY - 12 * cadScale} C ${cadX + 16 * cadScale} ${cadY - 24 * cadScale}, ${cadX + 32 * cadScale} ${cadY - 24 * cadScale}, ${cadX + 44 * cadScale} ${cadY - 14 * cadScale} C ${cadX + 35 * cadScale} ${cadY - 6 * cadScale}, ${cadX + 29 * cadScale} ${cadY - 5 * cadScale}, ${cadX + 31 * cadScale} ${cadY + 1 * cadScale} C ${cadX + 23 * cadScale} ${cadY + 2 * cadScale}, ${cadX - 19 * cadScale} ${cadY + 4 * cadScale}, ${cadX + 20 * cadScale} ${cadY + 8 * cadScale} C ${cadX + 12 * cadScale} ${cadY + 8 * cadScale}, ${cadX + 4 * cadScale} ${cadY + 4 * cadScale}, ${cadX + 2 * cadScale} ${cadY - 2 * cadScale} Z" fill="${tealColor}" />

  <!-- Twin Symmetrical Coiled Serpents (Figure-8 Waves) -->
  <path d="M ${cadX - 4 * cadScale} ${cadY - 6 * cadScale} C ${cadX - 14 * cadScale} ${cadY - 2 * cadScale}, ${cadX - 13 * cadScale} ${cadY + 3 * cadScale}, ${cadX} ${cadY + 7 * cadScale} C ${cadX + 14 * cadScale} ${cadY + 11 * cadScale}, ${cadX + 14 * cadScale} ${cadY + 17 * cadScale}, ${cadX} ${cadY + 21 * cadScale} C ${cadX - 10 * cadScale} ${cadY + 24 * cadScale}, ${cadX - 8 * cadScale} ${cadY + 28 * cadScale}, ${cadX - 2 * cadScale} ${cadY + 30 * cadScale}" fill="none" stroke="${tealColor}" stroke-width="${2 * cadScale}" stroke-linecap="round" />
  <path d="M ${cadX + 4 * cadScale} ${cadY - 6 * cadScale} C ${cadX + 14 * cadScale} ${cadY - 2 * cadScale}, ${cadX + 13 * cadScale} ${cadY + 3 * cadScale}, ${cadX} ${cadY + 7 * cadScale} C ${cadX - 14 * cadScale} ${cadY + 11 * cadScale}, ${cadX - 14 * cadScale} ${cadY + 17 * cadScale}, ${cadX} ${cadY + 21 * cadScale} C ${cadX + 10 * cadScale} ${cadY + 24 * cadScale}, ${cadX + 8 * cadScale} ${cadY + 28 * cadScale}, ${cadX + 2 * cadScale} ${cadY + 30 * cadScale}" fill="none" stroke="${tealColor}" stroke-width="${2 * cadScale}" stroke-linecap="round" />
  <circle cx="${cadX - 4 * cadScale}" cy="${cadY - 6 * cadScale}" r="${2 * cadScale}" fill="${tealColor}" />
  <circle cx="${cadX + 4 * cadScale}" cy="${cadY - 6 * cadScale}" r="${2 * cadScale}" fill="${tealColor}" />

  <!-- Bottom-Right Signature Block (Elevated to completely avoid footer overlap!) -->
  ${renderSvgDoctorSignature(doctor, sigCenter, sigY, 90, 24, fontFam)}
  <line x1="${sigX1}" y1="${sigY}" x2="${sigX2}" y2="${sigY}" stroke="#cbd5e1" stroke-width="1.2" />
  <text x="${sigCenter}" y="${sigY + 16}" text-anchor="middle" font-size="${Math.max(7.2, Math.round(w * 0.022))}" fill="#0f2330" font-family="${fontFam}">Signature</text>

  <!-- Footer Address & Phone (Matching Image 1, prevents any overlap) -->
  ${isLongAddress ? `
  <text x="${addrX}" y="${footerY - 7}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" fill="#475569" font-family="${fontFam}">📍 ${escapeXml(addressClean)}</text>
  <text x="${addrX}" y="${footerY + 8}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" fill="#475569" font-family="${fontFam}">📞 ${escapeXml(phoneClean)}</text>
  ` : `
  <text x="${addrX}" y="${footerY}" font-size="${Math.max(6.5, Math.round(w * 0.02))}" fill="#475569" font-family="${fontFam}">📍 ${escapeXml(addressClean)}</text>
  <text x="${Math.round(w * 0.94)}" y="${footerY}" text-anchor="end" font-size="${Math.max(6.5, Math.round(w * 0.02))}" fill="#475569" font-family="${fontFam}">📞 ${escapeXml(phoneClean)}</text>
  `}
</svg>`
}

/**
 * Generates standalone SVG for Tablet Mode prescription.
 * Delegates cleanly to the matching template layout.
 */
export function generateTabletPrescriptionSVG(data: TabletExportData): string {
  const { template: inputTpl } = data
  const template = inputTpl || MOBILE_TEMPLATES[0]

  switch (template.id) {
    case 'dental-clinic':
      return generateDentalClinicSVG(data)
    case 'modern-teal-ribbon':
      return generateModernTealRibbonSVG(data)
    case 'two-column-sidebar':
      return generateTwoColumnSidebarSVG(data)
    case 'soap-clinical':
      return generateSOAPSVG(data)
    case 'minimal-print-ruled':
      return generateMinimalSVG(data)
    case 'bilingual-indian':
      return generateBilingualSVG(data)
    case 'vitals-first':
      return generateVitalsFirstSVG(data)
    case 'multi-section-boxed':
      return generateBoxedSVG(data)
    case 'compartmentalized-grid':
      return generateGridSVG(data)
    case 'detailed-drug-chart':
      return generateDetailedChartSVG(data)
    case 'classic-letterhead':
    default:
      return generateClassicLetterheadSVG(data)
  }
}

/**
 * Renders SVG markup onto high-resolution HTML5 Canvas at exact A4 proportions (1588 x 2246).
 * Preserves aspect ratio, eliminating any horizontal stretch, and renders vector-sharp typography at 192 DPI.
 */
function svgToCanvas(svgString: string, targetWidth = 1588, targetHeight = 2245): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    let cleanSvg = svgString
    if (!cleanSvg.includes('xmlns=')) {
      cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    }

    // Ensure the SVG declares targetWidth and targetHeight so browser image engine renders at full high-res
    cleanSvg = cleanSvg
      .replace(/width="[^"]*"/, `width="${targetWidth}"`)
      .replace(/height="[^"]*"/, `height="${targetHeight}"`)

    const renderOnCanvas = (sourceImg: HTMLImageElement) => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        canvas.style.display = 'block'
        canvas.style.width = '794px'
        canvas.style.height = '1122px'
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'))
          return
        }

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetWidth, targetHeight)

        // Draw image directly across target dimensions
        ctx.drawImage(sourceImg, 0, 0, targetWidth, targetHeight)
        resolve(canvas)
      } catch (e) {
        reject(e)
      }
    }

    const img = new Image()
    img.onload = () => renderOnCanvas(img)

    img.onerror = () => {
      // Fallback via Blob URL
      try {
        const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const fallbackImg = new Image()
        fallbackImg.onload = () => {
          try {
            renderOnCanvas(fallbackImg)
            URL.revokeObjectURL(url)
          } catch (err) {
            URL.revokeObjectURL(url)
            reject(err)
          }
        }
        fallbackImg.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load SVG for canvas rendering'))
        }
        fallbackImg.src = url
      } catch (err) {
        reject(err)
      }
    }

    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`
  })
}

/**
 * Generates pixel-perfect SVG + HTML for Tablet Mode digital prescription.
 * Formatted strictly for A4 print with zero app clutter.
 */
export function generateTabletPrescriptionHTML(data: TabletExportData): string {
  const { doctor, patient, template: inputTpl } = data
  const template = inputTpl || MOBILE_TEMPLATES[0]
  const fontFam = template.styles?.fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif'
  const patientNameClean = safeTruncate(patient.patientName || '___________________________', 24)
  let fullSvg = generateTabletPrescriptionSVG(data)

  const aspectMultiplier = data.h / (data.w * (1123 / 794))
  const pageH = Math.round(1123 * Math.max(1, aspectMultiplier))
  const pageHeightMm = Math.round(297 * Math.max(1, aspectMultiplier))

  // Ensure SVG fills the page container cleanly without cut-off or distortion
  fullSvg = fullSvg
    .replace(/width="[^"]*"/, 'width="794"')
    .replace(/height="[^"]*"/, `height="${pageH}"`)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prescription - ${escapeXml(patientNameClean)}</title>
  <style>
    @page {
      size: ${aspectMultiplier > 1.05 ? `210mm ${pageHeightMm}mm` : 'A4 portrait'};
      margin: 0;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      font-family: ${fontFam};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .page-container {
      width: 794px;
      height: ${pageH}px;
      background: #ffffff;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: ${pageHeightMm}mm !important;
      }
      .page-container {
        width: 210mm !important;
        height: ${pageHeightMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${fullSvg}
  </div>
</body>
</html>`
}

/**
 * Clean isolated print helper.
 * Never prints the host window/app UI. Uses hidden iframe with exact A4 dimensions.
 */
export async function printCleanPrescription({ html }: { html: string }): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '0'
    iframe.style.top = '0'
    iframe.style.width = '794px'
    iframe.style.height = '1123px'
    iframe.style.zIndex = '-9999'
    iframe.style.border = 'none'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      throw new Error('Unable to access print frame')
    }

    doc.open()
    doc.write(html)
    doc.close()

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (e) {
          console.error('[printCleanPrescription] print error', e)
        }
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe)
          }
          resolve()
        }, 2000)
      }, 500)
    })
  }

  // Native
  await Print.printAsync({ html })
}

/**
 * Direct PDF download for Tablet Mode.
 * Rasterizes the complete digital pad (overlay + strokes) via native browser canvas at 1588 x 2245 (192 DPI),
 * embedding directly into jsPDF with zero stretch and vector-sharp typography!
 */
export async function downloadTabletPrescriptionPdf(
  data: TabletExportData,
  filename: string
): Promise<void> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const aspectMultiplier = data.h / (data.w * (1123 / 794))
      const targetCanvasW = 1588
      const targetCanvasH = Math.round(2245 * Math.max(1, aspectMultiplier))
      const targetOptW = 794
      const targetOptH = Math.round(1123 * Math.max(1, aspectMultiplier))
      const targetPdfH_mm = Math.round(297 * Math.max(1, aspectMultiplier))

      const svgMarkup = generateTabletPrescriptionSVG(data)
      const canvas = await svgToCanvas(svgMarkup, targetCanvasW, targetCanvasH)
      const html2pdf = await loadHtml2Pdf()
      if (!html2pdf) throw new Error('html2pdf library could not be loaded')

      const opt = {
        margin: [0, 0, 0, 0],
        filename: cleanFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: targetOptW,
          height: targetOptH,
        },
        jsPDF: { unit: 'mm', format: aspectMultiplier > 1.05 ? [210, targetPdfH_mm] : 'a4', orientation: 'portrait' },
      }

      // Directly pass the high-res canvas to html2pdf!
      // Produces an exact pristine, ultra-sharp vector PDF with 0% stretch!
      await html2pdf().set(opt).from(canvas).save()
      return
    } catch (err) {
      console.warn('[downloadTabletPrescriptionPdf] Web canvas export error, fallback to clean print:', err)
      const html = generateTabletPrescriptionHTML(data)
      await printCleanPrescription({ html })
      return
    }
  }

  // Native iOS / Android
  const html = generateTabletPrescriptionHTML(data)
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Download / Save Prescription PDF',
  })
}

/**
 * Direct PDF download helper for HTML prescriptions (Form Editor).
 * Uses positive zIndex with low opacity (0.01) so it paints in the foreground
 * without React Native Web '#root' occlusion, measures true element height,
 * and passes the rendered content node directly to html2pdf.
 */
export async function downloadPrescriptionPdf({
  html,
  filename,
}: {
  html: string
  filename: string
}): Promise<void> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const html2pdf = await loadHtml2Pdf()
      if (!html2pdf) throw new Error('html2pdf library could not be loaded')

      // Position container at top-left with high positive z-index and opacity: 0.01
      // (Never negative z-index: -9999 which paints behind React Native Web #root background!)
      const wrapper = document.createElement('div')
      wrapper.id = 'clean-pdf-export-wrapper'
      wrapper.style.position = 'fixed'
      wrapper.style.left = '0'
      wrapper.style.top = '0'
      wrapper.style.width = '794px'
      wrapper.style.backgroundColor = '#ffffff'
      wrapper.style.zIndex = '99999'
      wrapper.style.opacity = '0.01' // Invisible to user during render, but fully rendered by browser engine
      wrapper.style.pointerEvents = 'none'
      wrapper.style.color = '#1e293b'
      wrapper.style.fontSize = '12px'
      wrapper.style.fontFamily = 'Arial, Helvetica, sans-serif'
      wrapper.style.boxSizing = 'border-box'

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Copy style and link elements
      const styles = doc.querySelectorAll('style, link[rel="stylesheet"]')
      styles.forEach((s) => wrapper.appendChild(s.cloneNode(true)))

      // Extract .page element or fallback to body content
      const targetPage = doc.querySelector('.page')
      const contentNode = document.createElement('div')
      contentNode.className = targetPage ? targetPage.className : 'page'
      contentNode.style.width = '794px'
      contentNode.style.backgroundColor = '#ffffff'
      if (targetPage && targetPage.getAttribute('style')) {
        contentNode.setAttribute('style', targetPage.getAttribute('style')!)
        contentNode.style.width = '794px'
      }
      contentNode.innerHTML = targetPage ? targetPage.innerHTML : (doc.body ? doc.body.innerHTML : html)
      wrapper.appendChild(contentNode)
      document.body.appendChild(wrapper)

      // Allow 150ms for web fonts, table layout and styles to paint
      await new Promise(r => setTimeout(r, 150))

      // Measure exact rendered height
      const contentScrollHeight = contentNode.scrollHeight || 0
      const contentOffsetHeight = contentNode.offsetHeight || 0
      const wrapperOffsetHeight = wrapper.offsetHeight || 0
      const measuredHeight = Math.max(1120, contentScrollHeight, contentOffsetHeight, wrapperOffsetHeight)

      wrapper.style.height = `${measuredHeight}px`
      contentNode.style.height = `${measuredHeight}px`

      const opt = {
        margin: 0,
        filename: cleanFilename,
        image: { type: 'jpeg', quality: 0.98 },
        pagebreak: { mode: 'avoid-all' },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: 794,
          height: measuredHeight,
          windowWidth: 794,
          windowHeight: measuredHeight,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(opt).from(contentNode).save()

      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper)
      }
      return
    } catch (err: any) {
      console.warn('[downloadPrescriptionPdf] Web client error, fallback to clean print:', err)
      await printCleanPrescription({ html })
      return
    }
  }

  // Native iOS / Android
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Download / Save Prescription PDF',
  })
}
