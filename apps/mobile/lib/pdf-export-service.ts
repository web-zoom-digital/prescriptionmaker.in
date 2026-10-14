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
  }
  patient: {
    patientName: string
    age?: string
    sex?: string
    date?: string
    chiefComplaint?: string
    diagnosis?: string
    address?: string
    allergies?: string
    bp?: string
    pulse?: string
    temp?: string
    spo2?: string
    weight?: string
    height?: string
    opdRef?: string
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
  const lineCount = 14

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

  <!-- Avatar Circle -->
  <circle cx="${sbW / 2}" cy="42" r="22" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
  <circle cx="${sbW / 2}" cy="42" r="18" fill="rgba(255,255,255,0.22)" />
  <text x="${sbW / 2}" y="48" text-anchor="middle" font-size="16">👨‍⚕️</text>

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
  <text x="${mainX + 14}" y="${h - 18}" font-size="7" fill="#64748b" font-family="${fontFam}">Doctor's Signature: __________________</text>
  <text x="${w - 14}" y="${h - 18}" text-anchor="end" font-size="6.5" fill="#94a3b8" font-family="${fontFam}">Two-Column Sidebar · PrescriptionMaker.in</text>
</svg>`
}

// ── 2. Hospital OPD Form SVG Layout ───────────────────────────────────────────
function generateHospitalOPDSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'hospital-opd') || MOBILE_TEMPLATES[2]
  const primaryColor = tpl.styles?.primaryColor || '#0B1B3D'
  const accentColor = tpl.styles?.accentColor || '#155EEF'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const topBannerH = 18
  const hospH = Math.round(h * 0.11)
  const metaBarY = topBannerH + hospH
  const metaBarH = 18
  const docBarY = metaBarY + metaBarH
  const docBarH = 20
  const patY = docBarY + docBarH + 6
  const patH = 38
  const rxY = patY + patH + 8
  const thH = 20
  const tableY = rxY + 14
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Clinical Assessment / OP Admission'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'ALL INDIA GENERAL HOSPITAL'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Attending Consultant', 28)

  const writingLines = generateWritingLines(tableY + thH + 6, h - 55, lineCount, 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Top Red Strip -->
  <rect x="0" y="0" width="${w}" height="${topBannerH}" fill="#b91c1c" />
  <text x="12" y="12" font-size="6.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">EMERGENCY / HELPLINE: 102 / 108 · 24x7 TRAUMA CARE</text>
  <rect x="${w - 78}" y="2" width="68" height="14" fill="#ffffff" rx="2" />
  <text x="${w - 44}" y="12" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#b91c1c" font-family="${fontFam}">OP-SLIP / A4</text>

  <!-- Hospital Banner -->
  <rect x="0" y="${topBannerH}" width="${w}" height="${hospH}" fill="${primaryColor}" />
  <text x="${w / 2}" y="${topBannerH + hospH * 0.35}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff" letter-spacing="1" font-family="${fontFam}">${escapeXml(clinicClean.toUpperCase())}</text>
  <text x="${w / 2}" y="${topBannerH + hospH * 0.62}" text-anchor="middle" font-size="7.5" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">CENTRAL GOVT. & ACCREDITED TERTIARY CARE HEALTH SYSTEM</text>
  <text x="${w / 2}" y="${topBannerH + hospH * 0.85}" text-anchor="middle" font-size="6.5" fill="rgba(255,255,255,0.7)" font-family="${fontFam}">${escapeXml(doctor.clinicAddress || 'Hospital Complex, Medical Enclave')} · Tel: ${escapeXml(doctor.phone || '011-26588500')}</text>

  <!-- MRN / Ward / Bed / IP-OP Bar -->
  <rect x="0" y="${metaBarY}" width="${w}" height="${metaBarH}" fill="#e2e8f0" />
  <text x="12" y="${metaBarY + 12}" font-size="6.5" font-weight="bold" fill="#1e293b" font-family="${fontFam}">MRN: <tspan font-weight="normal">2026-${escapeXml(doctor.registrationNumber ? doctor.registrationNumber.slice(-5) : '89421')}</tspan></text>
  <text x="${w * 0.30}" y="${metaBarY + 12}" font-size="6.5" font-weight="bold" fill="#1e293b" font-family="${fontFam}">DEPT: <tspan font-weight="normal">GENERAL OPD</tspan></text>
  <text x="${w * 0.60}" y="${metaBarY + 12}" font-size="6.5" font-weight="bold" fill="#1e293b" font-family="${fontFam}">UNIT: <tspan font-weight="normal">MED-II (ROOM 14)</tspan></text>
  <text x="${w - 12}" y="${metaBarY + 12}" text-anchor="end" font-size="6.5" font-weight="bold" fill="#b91c1c" font-family="${fontFam}">TYPE: REGULAR OP</text>

  <!-- Attending Physician & Specialty Bar -->
  <rect x="0" y="${docBarY}" width="${w}" height="${docBarH}" fill="${accentColor}18" />
  <text x="12" y="${docBarY + 14}" font-size="7.5" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">ATTENDING PHYSICIAN: ${escapeXml(doctorClean)}</text>
  <text x="${w - 12}" y="${docBarY + 14}" text-anchor="end" font-size="7" fill="#64748b" font-family="${fontFam}">${escapeXml(doctor.qualification || 'MBBS, MD')} · REG: ${escapeXml(doctor.registrationNumber || 'MCI-88219')}</text>

  <!-- Patient Information Box -->
  <rect x="10" y="${patY}" width="${w - 20}" height="${patH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1" rx="4" />
  <text x="16" y="${patY + 13}" font-size="6.5" fill="#64748b" font-family="${fontFam}">PATIENT NAME</text>
  <text x="16" y="${patY + 25}" font-size="10.5" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <text x="16" y="${patY + 35}" font-size="7" fill="#64748b" font-family="${fontFam}">${escapeXml(patient.age ? `Age: ${patient.age}y` : 'Age: —')} · ${escapeXml(patient.sex || '—')} · Ph: ${escapeXml(doctor.phone || '—')}</text>

  <text x="${w * 0.58}" y="${patY + 13}" font-size="6.5" fill="#64748b" font-family="${fontFam}">DIAGNOSIS / CHIEF COMPLAINT</text>
  <text x="${w * 0.58}" y="${patY + 25}" font-size="9" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>
  <text x="${w * 0.58}" y="${patY + 35}" font-size="7" fill="#64748b" font-family="${fontFam}">Date: ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))} · Time: 10:30 AM</text>

  <!-- Rx symbol -->
  <text x="12" y="${rxY + 8}" font-size="16" font-family="Georgia,serif" font-weight="bold" fill="${primaryColor}">℞</text>
  <text x="32" y="${rxY + 5}" font-size="7.5" font-weight="bold" fill="${primaryColor}" letter-spacing="0.5" font-family="${fontFam}">OPD PRESCRIPTION / MEDICATION ORDER</text>

  <!-- 6-Column OPD Table Header -->
  <rect x="10" y="${tableY}" width="${w - 20}" height="${thH}" fill="${primaryColor}" rx="2" />
  <text x="16" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">#</text>
  <text x="32" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Medicine Name &amp; Strength</text>
  <text x="${w * 0.44}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Dosage</text>
  <text x="${w * 0.58}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${w * 0.74}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>
  <text x="${w * 0.88}" y="${tableY + 13}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Qty</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Dual Signatures Footer -->
  <line x1="10" y1="${h - 40}" x2="${w - 10}" y2="${h - 40}" stroke="#cbd5e1" stroke-width="0.8" />
  <line x1="16" y1="${h - 20}" x2="110" y2="${h - 20}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="16" y="${h - 8}" font-size="6.5" font-weight="bold" fill="#64748b" font-family="${fontFam}">RESIDENT MEDICAL OFFICER</text>
  
  <line x1="${w - 120}" y1="${h - 20}" x2="${w - 16}" y2="${h - 20}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 16}" y="${h - 8}" text-anchor="end" font-size="6.5" font-weight="bold" fill="#64748b" font-family="${fontFam}">ATTENDING CONSULTANT</text>
</svg>`
}

// ── 3. SOAP Clinical Notes SVG Layout ─────────────────────────────────────────
function generateSOAPSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'soap-clinical') || MOBILE_TEMPLATES[3]
  const primaryColor = tpl.styles?.primaryColor || '#0f766e'
  const accentColor = tpl.styles?.accentColor || '#14b8a6'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const headH = Math.round(h * 0.11)
  const patH = 24
  const sBoxH = 30
  const oBoxH = 34
  const aBoxH = 30
  const pY = headH + patH + sBoxH + oBoxH + aBoxH + 8
  const thH = 18
  const tableY = pY + 12
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 40) || 'Patient presents with symptoms...'
  const diagnosisClean = safeTruncate(patient.diagnosis, 36) || 'Primary clinical diagnosis'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Clinical Care Centre'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const writingLines = generateWritingLines(tableY + thH + 5, h - 45, lineCount, 10, w - 10)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Header -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="14" y="${headH * 0.38}" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="14" y="${headH * 0.68}" font-size="7" font-weight="bold" fill="${accentColor}" letter-spacing="0.5" font-family="${fontFam}">SOAP CLINICAL PROGRESS NOTE · AMBULATORY CARE</text>
  <text x="${w - 14}" y="${headH * 0.38}" text-anchor="end" font-size="10.5" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="${w - 14}" y="${headH * 0.68}" text-anchor="end" font-size="6.5" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">Reg: ${escapeXml(doctor.registrationNumber || 'DOC-REG-01')}</text>

  <!-- Patient Strip -->
  <rect x="0" y="${headH}" width="${w}" height="${patH}" fill="#e6fffa" />
  <line x1="0" y1="${headH + patH}" x2="${w}" y2="${headH + patH}" stroke="${primaryColor}30" stroke-width="0.8" />
  <text x="12" y="${headH + 16}" font-size="7.5" fill="#0f766e" font-family="${fontFam}">
    <tspan font-weight="bold">PATIENT:</tspan> ${escapeXml(patientNameClean)}   |   <tspan font-weight="bold">Age/Sex:</tspan> ${escapeXml(patient.age ? `${patient.age}y` : '—')} / ${escapeXml(patient.sex || '—')}   |   <tspan font-weight="bold">Date:</tspan> ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}
  </text>

  <!-- S Box -->
  <rect x="10" y="${headH + patH + 4}" width="${w - 20}" height="${sBoxH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <rect x="10" y="${headH + patH + 4}" width="22" height="${sBoxH}" fill="${primaryColor}" rx="2" />
  <text x="21" y="${headH + patH + 23}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">S</text>
  <text x="38" y="${headH + patH + 15}" font-size="6.5" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">SUBJECTIVE (CHIEF COMPLAINT &amp; HPI)</text>
  <text x="38" y="${headH + patH + 26}" font-size="7.5" fill="#334155" font-family="${fontFam}">${escapeXml(complaintClean)}</text>

  <!-- O Box -->
  <rect x="10" y="${headH + patH + sBoxH + 8}" width="${w - 20}" height="${oBoxH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <rect x="10" y="${headH + patH + sBoxH + 8}" width="22" height="${oBoxH}" fill="${primaryColor}" rx="2" />
  <text x="21" y="${headH + patH + sBoxH + 28}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">O</text>
  <text x="38" y="${headH + patH + sBoxH + 19}" font-size="6.5" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">OBJECTIVE (VITALS: BP 120/80 · HR 74 · Temp 98.4°F · SpO₂ 99% · Wt 68kg · RR 16)</text>
  <text x="38" y="${headH + patH + sBoxH + 31}" font-size="7" fill="#64748b" font-family="${fontFam}">Physical Exam: Chest clear, S1/S2 heard, abdomen soft, no pedal edema</text>

  <!-- A Box -->
  <rect x="10" y="${headH + patH + sBoxH + oBoxH + 12}" width="${w - 20}" height="${aBoxH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <rect x="10" y="${headH + patH + sBoxH + oBoxH + 12}" width="22" height="${aBoxH}" fill="${primaryColor}" rx="2" />
  <text x="21" y="${headH + patH + sBoxH + oBoxH + 31}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">A</text>
  <text x="38" y="${headH + patH + sBoxH + oBoxH + 23}" font-size="6.5" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">ASSESSMENT (PRIMARY CLINICAL DIAGNOSIS)</text>
  <text x="38" y="${headH + patH + sBoxH + oBoxH + 34}" font-size="8" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- P Box -->
  <rect x="10" y="${pY}" width="${w - 20}" height="${thH}" fill="${accentColor}" rx="2" />
  <text x="16" y="${pY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">P — PLAN (℞ PRESCRIPTION ORDER)</text>
  <text x="${w * 0.44}" y="${pY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Dose / Route</text>
  <text x="${w * 0.65}" y="${pY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${w * 0.85}" y="${pY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Footer -->
  <line x1="10" y1="${h - 32}" x2="${w - 10}" y2="${h - 32}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="14" y="${h - 18}" font-size="6.5" fill="#64748b" font-family="${fontFam}">Review Date: _________________</text>
  <line x1="${w - 110}" y1="${h - 20}" x2="${w - 14}" y2="${h - 20}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 62}" y="${h - 8}" text-anchor="middle" font-size="6.5" fill="#94a3b8" font-family="${fontFam}">Attending Physician Signature</text>
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
  const lineCount = 14

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Clinical Assessment'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'CLINICAL PRACTICE'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Attending Physician', 28)

  const writingLines = generateWritingLines(rxY + 28, h - 45, lineCount, 12, w - 12)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Dark Solid Rule -->
  <line x1="12" y1="${headH}" x2="${w - 12}" y2="${headH}" stroke="#1a202c" stroke-width="2" />
  <text x="12" y="24" font-size="14" font-weight="bold" fill="#1a202c" letter-spacing="0.5" font-family="${fontFam}">${escapeXml(clinicClean.toUpperCase())}</text>
  <text x="12" y="38" font-size="9" font-weight="bold" fill="#2d3748" font-family="${fontFam}">${escapeXml(doctorClean)} <tspan font-style="italic" font-weight="normal" fill="#718096">· ${escapeXml(doctor.qualification || 'Physician & Surgeon')}</tspan></text>
  <text x="${w - 12}" y="38" text-anchor="end" font-size="7.5" fill="#a0aec0" font-family="${fontFam}">Reg. No. ${escapeXml(doctor.registrationNumber || 'DOC-REG-8812')}</text>

  <!-- Patient + Date -->
  <text x="12" y="${patY + 14}" font-size="8" fill="#a0aec0" font-family="${fontFam}">Patient: </text>
  <text x="56" y="${patY + 14}" font-size="10.5" font-weight="bold" fill="#2d3748" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <line x1="56" y1="${patY + 17}" x2="${Math.min(w * 0.6, 56 + 140)}" y2="${patY + 17}" stroke="#a0aec0" stroke-width="0.8" stroke-dasharray="2,2" />
  <text x="${w * 0.62}" y="${patY + 14}" font-size="8" fill="#718096" font-family="${fontFam}">${escapeXml(patient.age ? `Age ${patient.age}` : 'Age —')}${escapeXml(patient.sex ? ` / ${patient.sex}` : '')}</text>
  <text x="${w - 12}" y="${patY + 14}" text-anchor="end" font-size="8" fill="#718096" font-family="${fontFam}">${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>

  <!-- Diagnosis -->
  <text x="12" y="${diagY + 14}" font-size="7.5" font-style="italic" fill="#a0aec0" font-family="${fontFam}">Diagnosis: </text>
  <text x="64" y="${diagY + 14}" font-size="8.5" fill="#2d3748" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>
  <line x1="12" y1="${diagY + diagH}" x2="${w - 12}" y2="${diagY + diagH}" stroke="#e2e8f0" stroke-width="0.8" />

  <!-- Big Italic ℞ -->
  <text x="12" y="${rxY + 20}" font-size="34" font-family="${fontFam}" font-style="italic" fill="#1a202c">℞</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Footer -->
  <line x1="${w - 95}" y1="${h - 26}" x2="${w - 12}" y2="${h - 26}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="${w - 52}" y="${h - 14}" text-anchor="middle" font-size="7" fill="#94a3b8" font-family="Arial,sans-serif">Signature</text>
  <text x="12" y="${h - 14}" font-size="6.5" fill="#cbd5e1" letter-spacing="1" font-family="Arial,sans-serif">MINIMAL PRINT RULED</text>
</svg>`
}

// ── 5. Bilingual Indian SVG Layout ───────────────────────────────────────────
function generateBilingualSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'bilingual-indian') || MOBILE_TEMPLATES[8]
  const primaryColor = tpl.styles?.primaryColor || '#7c3aed'
  const accentColor = tpl.styles?.accentColor || '#a78bfa'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const headH = Math.round(h * 0.13)
  const patBoxY = headH + 8
  const patBoxH = Math.round(h * 0.12)
  const diagY = patBoxY + patBoxH + 6
  const diagH = 24
  const rxY = diagY + diagH + 10
  const thH = 20
  const tableY = rxY + 16
  const lineCount = 13

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
  <text x="14" y="${h - 40}" font-size="7" fill="#64748b" font-family="${fontFam}">जाँच / Investigations: ___________________</text>
  <text x="${w * 0.52}" y="${h - 40}" font-size="7" fill="#64748b" font-family="${fontFam}">सलाह / Advice: ________________________</text>

  <!-- Footer -->
  <line x1="10" y1="${h - 30}" x2="${w - 10}" y2="${h - 30}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="14" y="${h - 18}" font-size="7" fill="#64748b" font-family="${fontFam}">Next Visit / अगली मुलाकात: ____________</text>
  <line x1="${w - 120}" y1="${h - 18}" x2="${w - 14}" y2="${h - 18}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 67}" y="${h - 8}" text-anchor="middle" font-size="7" fill="#94a3b8" font-family="${fontFam}">डॉक्टर के हस्ताक्षर / Signature</text>
  <text x="14" y="${h - 8}" font-size="6" fill="#94a3b8" font-family="${fontFam}">PrescriptionMaker.in · द्विभाषी पर्ची</text>
</svg>`
}

// ── 6. Vitals-First SVG Layout ────────────────────────────────────────────────
function generateVitalsFirstSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'vitals-first') || MOBILE_TEMPLATES[4]
  const primaryColor = tpl.styles?.primaryColor || '#9b2335'
  const accentColor = tpl.styles?.accentColor || '#e53e3e'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const headH = Math.round(h * 0.11)
  const patBoxY = headH + 6
  const patBoxH = 26
  const vitalsBoxY = patBoxY + patBoxH + 6
  const vitalsH = 68
  const diagY = vitalsBoxY + vitalsH + 6
  const diagH = 22
  const rxY = diagY + diagH + 10
  const thH = 18
  const tableY = rxY + 14
  const lineCount = 11

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
  <text x="16" y="${vitalsBoxY + 11}" font-size="7" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">❤️  RECORDED VITALS &amp; CARDIAC PARAMETERS</text>

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
  <text x="14" y="${h - 10}" font-size="6" fill="#94a3b8" font-family="${fontFam}">Follow-up: _________________</text>
  <line x1="${w - 110}" y1="${h - 14}" x2="${w - 14}" y2="${h - 14}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 62}" y="${h - 6}" text-anchor="middle" font-size="6" fill="#94a3b8" font-family="${fontFam}">Cardiologist Signature</text>
</svg>`
}

// ── 7. Multi-Section Boxed SVG Layout ─────────────────────────────────────────
function generateBoxedSVG(data: TabletExportData): string {
  const { w, h, doctor, patient, template, paths } = data
  const tpl = template || MOBILE_TEMPLATES.find(t => t.id === 'multi-section-boxed') || MOBILE_TEMPLATES[6]
  const primaryColor = tpl.styles?.primaryColor || '#0c4a6e'
  const accentColor = tpl.styles?.accentColor || '#38bdf8'
  const fontFam = 'Arial, Helvetica, sans-serif'

  const headH = Math.round(h * 0.11)
  const pad = 10
  const boxW2 = (w - pad * 2 - 8) / 2

  const row1Y = headH + 8
  const row1H = 38
  const ccY = row1Y + row1H + 6
  const ccH = 26
  const diagY = ccY + ccH + 6
  const diagH = 26
  const rxY = diagY + diagH + 6
  const rxThH = 18
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 32) || 'Patient complaint and clinical history...'
  const diagnosisClean = safeTruncate(patient.diagnosis, 32) || 'Clinical diagnosis...'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Family & Child Health Clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const writingLines = generateWritingLines(rxY + rxThH + 5, h - 68, lineCount, pad + 2, w - pad - 2)
  const strokesSVG = paths.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff;display:block;">
  <!-- Deep Blue Header -->
  <rect x="0" y="0" width="${w}" height="${headH}" fill="${primaryColor}" />
  <text x="14" y="${headH * 0.38}" font-size="14" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(doctorClean)}</text>
  <text x="14" y="${headH * 0.68}" font-size="7" fill="${accentColor}" font-family="${fontFam}">${escapeXml(doctor.qualification || 'MBBS, MD')} · ${escapeXml(doctor.specialization || 'Consultant')}</text>
  <text x="${w - 14}" y="${headH * 0.38}" text-anchor="end" font-size="10" font-weight="bold" fill="#ffffff" font-family="${fontFam}">${escapeXml(clinicClean)}</text>
  <text x="${w - 14}" y="${headH * 0.68}" text-anchor="end" font-size="7" fill="rgba(255,255,255,0.85)" font-family="${fontFam}">Reg: ${escapeXml(doctor.registrationNumber || 'DOC-74892')}</text>

  <!-- Row 1 Left: PATIENT INFORMATION -->
  <rect x="${pad}" y="${row1Y}" width="${boxW2}" height="${row1H}" fill="#ffffff" stroke="${accentColor}50" stroke-width="1" rx="4" />
  <rect x="${pad}" y="${row1Y}" width="${boxW2}" height="14" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${row1Y + 10}" font-size="6" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">PATIENT INFORMATION</text>
  <text x="${pad + 8}" y="${row1Y + 24}" font-size="10" font-weight="bold" fill="#0f172a" font-family="${fontFam}">${escapeXml(patientNameClean)}</text>
  <text x="${pad + 8}" y="${row1Y + 34}" font-size="7" fill="#64748b" font-family="${fontFam}">${escapeXml(patient.age ? `Age: ${patient.age}` : 'Age: —')}  ·  ${escapeXml(patient.sex ? `Sex: ${patient.sex}` : 'Sex: —')}</text>

  <!-- Row 1 Right: DATE & REFERENCE -->
  <rect x="${pad + boxW2 + 8}" y="${row1Y}" width="${boxW2}" height="${row1H}" fill="#ffffff" stroke="${accentColor}50" stroke-width="1" rx="4" />
  <rect x="${pad + boxW2 + 8}" y="${row1Y}" width="${boxW2}" height="14" fill="${primaryColor}" rx="3" />
  <text x="${pad + boxW2 + 16}" y="${row1Y + 10}" font-size="6" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">DATE &amp; REFERENCE</text>
  <text x="${pad + boxW2 + 16}" y="${row1Y + 24}" font-size="8" fill="#0f172a" font-family="${fontFam}">Date: ${escapeXml(patient.date || new Date().toLocaleDateString('en-IN'))}</text>
  <text x="${pad + boxW2 + 16}" y="${row1Y + 34}" font-size="7" fill="#64748b" font-family="${fontFam}">Ref ID: ${escapeXml(doctor.registrationNumber || 'OPD-8821')}</text>

  <!-- Box 2: CHIEF COMPLAINT -->
  <rect x="${pad}" y="${ccY}" width="${w - pad * 2}" height="${ccH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1" rx="4" />
  <rect x="${pad}" y="${ccY}" width="${w - pad * 2}" height="13" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${ccY + 9}" font-size="6" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">CHIEF COMPLAINT &amp; HISTORY</text>
  <text x="${pad + 8}" y="${ccY + 22}" font-size="7" fill="#334155" font-family="${fontFam}">${escapeXml(complaintClean)}</text>

  <!-- Box 3: DIAGNOSIS -->
  <rect x="${pad}" y="${diagY}" width="${w - pad * 2}" height="${diagH}" fill="#ffffff" stroke="${primaryColor}30" stroke-width="1" rx="4" />
  <rect x="${pad}" y="${diagY}" width="${w - pad * 2}" height="13" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${diagY + 9}" font-size="6" font-weight="bold" fill="#ffffff" letter-spacing="0.5" font-family="${fontFam}">CLINICAL DIAGNOSIS</text>
  <text x="${pad + 8}" y="${diagY + 22}" font-size="8" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">${escapeXml(diagnosisClean)}</text>

  <!-- Box 4: ℞ PRESCRIPTION with table header -->
  <rect x="${pad}" y="${rxY}" width="${w - pad * 2}" height="${rxThH}" fill="${primaryColor}" rx="3" />
  <text x="${pad + 8}" y="${rxY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">℞ Drug</text>
  <text x="${w * 0.46}" y="${rxY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Unit</text>
  <text x="${w * 0.62}" y="${rxY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Frequency</text>
  <text x="${w * 0.82}" y="${rxY + 12}" font-size="7" font-weight="bold" fill="#ffffff" font-family="${fontFam}">Duration</text>

  ${writingLines}
  ${strokesSVG}

  <!-- Investigations & Advice Two-Column Boxes -->
  <rect x="${pad}" y="${h - 60}" width="${boxW2}" height="32" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <rect x="${pad}" y="${h - 60}" width="${boxW2}" height="11" fill="${primaryColor}18" rx="2" />
  <text x="${pad + 6}" y="${h - 52}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">INVESTIGATIONS</text>
  <text x="${pad + 6}" y="${h - 38}" font-size="6" fill="#64748b" font-family="${fontFam}">Lab tests / Imaging: _______</text>

  <rect x="${pad + boxW2 + 8}" y="${h - 60}" width="${boxW2}" height="32" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <rect x="${pad + boxW2 + 8}" y="${h - 60}" width="${boxW2}" height="11" fill="${primaryColor}18" rx="2" />
  <text x="${pad + boxW2 + 14}" y="${h - 52}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">ADVICE &amp; INSTRUCTIONS</text>
  <text x="${pad + boxW2 + 14}" y="${h - 38}" font-size="6" fill="#64748b" font-family="${fontFam}">Diet / Precaution: _________</text>

  <!-- Footer -->
  <line x1="${pad}" y1="${h - 22}" x2="${w - pad}" y2="${h - 22}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="${pad}" y="${h - 10}" font-size="6" fill="#94a3b8" font-family="${fontFam}">Review on: ________________</text>
  <line x1="${w - 110}" y1="${h - 14}" x2="${w - pad}" y2="${h - 14}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 60}" y="${h - 6}" text-anchor="middle" font-size="6" fill="#94a3b8" font-family="${fontFam}">Doctor's Signature</text>
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

  const headH = Math.round(h * 0.11)
  const patH = 34
  const ccH = 20
  const diagH = 20
  const rxY = headH + patH + ccH + diagH + 8
  const thH = 18
  const tableY = rxY + 12
  const lineCount = 11

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
  <text x="16" y="${h - 30}" font-size="6" fill="#64748b" font-family="${fontFam}">Diet &amp; precautions: _________</text>

  <rect x="${14 + (w - 28) * 0.5}" y="${h - 52}" width="${(w - 28) * 0.5}" height="34" fill="#ffffff" stroke="${primaryColor}40" stroke-width="0.8" rx="3" />
  <text x="${20 + (w - 28) * 0.5}" y="${h - 42}" font-size="6" font-weight="bold" fill="${primaryColor}" letter-spacing="0.5" font-family="${fontFam}">FOLLOW-UP &amp; SIGNATURE</text>
  <text x="${20 + (w - 28) * 0.5}" y="${h - 30}" font-size="6" fill="#64748b" font-family="${fontFam}">Review: ___________________</text>

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

  const headH = Math.round(h * 0.11)
  const pad = 10
  const patRowY = headH + 8
  const patRowH = 38
  const patW = Math.round((w - pad * 2 - 8) * 0.62)
  const diagW = (w - pad * 2 - 8) - patW

  const rxY = patRowY + patRowH + 8
  const thH = 20
  const tableY = rxY + 12
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 22) || 'Clinical Diagnosis'
  const clinicClean = safeTruncate(doctor.clinicName, 28) || 'Specialty Medical Center'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const writingLines = generateWritingLines(tableY + thH + 5, h - 58, lineCount, 10, w - 10)
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
  <rect x="10" y="${h - 52}" width="${(w - 28) * 0.5}" height="34" fill="#ffffff" stroke="${accentColor}40" stroke-width="0.8" rx="3" />
  <text x="16" y="${h - 42}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">LAB INVESTIGATIONS</text>
  <text x="16" y="${h - 30}" font-size="6" fill="#64748b" font-family="${fontFam}">CBC, LFT, KFT, Urine R/M: ______</text>

  <rect x="${14 + (w - 28) * 0.5}" y="${h - 52}" width="${(w - 28) * 0.5}" height="34" fill="#ffffff" stroke="${primaryColor}30" stroke-width="0.8" rx="3" />
  <text x="${20 + (w - 28) * 0.5}" y="${h - 42}" font-size="6" font-weight="bold" fill="${primaryColor}" font-family="${fontFam}">SPECIAL INSTRUCTIONS</text>
  <text x="${20 + (w - 28) * 0.5}" y="${h - 30}" font-size="6" fill="#64748b" font-family="${fontFam}">Take after meals with water</text>

  <!-- Footer -->
  <line x1="10" y1="${h - 16}" x2="${w - 10}" y2="${h - 16}" stroke="#cbd5e1" stroke-width="0.8" />
  <text x="14" y="${h - 6}" font-size="6" fill="#94a3b8" font-family="${fontFam}">Follow-up: ______________</text>
  <line x1="${w - 110}" y1="${h - 10}" x2="${w - 14}" y2="${h - 10}" stroke="#94a3b8" stroke-width="0.8" />
  <text x="${w - 62}" y="${h - 4}" text-anchor="middle" font-size="6" fill="#94a3b8" font-family="${fontFam}">Doctor's Signature</text>
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

  const headH = Math.round(h * 0.14)
  const patY = headH + 12
  const patH = 26
  const diagY = patY + patH + 4
  const diagH = 20
  const rxY = diagY + diagH + 10
  const lineCount = 14

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
  <text x="14" y="${h - 44}" font-size="7" fill="#94a3b8" font-family="${fontFam}">Advice: ________________________________</text>
  <text x="${w * 0.55}" y="${h - 44}" font-size="7" fill="#94a3b8" font-family="${fontFam}">Investigations: ____________________</text>

  <!-- Classic Signature Block -->
  <line x1="14" y1="${h - 32}" x2="${w - 14}" y2="${h - 32}" stroke="#e2e8f0" stroke-width="0.8" />
  <text x="14" y="${h - 18}" font-size="7" fill="#64748b" font-family="${fontFam}">Follow-up on: ________________</text>
  <line x1="${w - 110}" y1="${h - 20}" x2="${w - 14}" y2="${h - 20}" stroke="#475569" stroke-width="1" />
  <text x="${w - 62}" y="${h - 8}" text-anchor="middle" font-size="7" fill="#64748b" font-family="${fontFam}">Doctor's Signature</text>
  <text x="14" y="${h - 8}" font-size="5.5" fill="#cbd5e1" letter-spacing="0.5" font-family="${fontFam}">PrescriptionMaker.in · Classic Letterhead</text>
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
    case 'two-column-sidebar':
      return generateTwoColumnSidebarSVG(data)
    case 'hospital-opd':
      return generateHospitalOPDSVG(data)
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

  // Ensure SVG fills the 794x1123 A4 page container cleanly without cut-off or distortion
  fullSvg = fullSvg
    .replace(/width="[^"]*"/, 'width="794"')
    .replace(/height="[^"]*"/, 'height="1123"')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prescription - ${escapeXml(patientNameClean)}</title>
  <style>
    @page {
      size: A4 portrait;
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
      height: 1123px;
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
        height: 297mm !important;
      }
      .page-container {
        width: 210mm !important;
        height: 297mm !important;
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
      const svgMarkup = generateTabletPrescriptionSVG(data)
      const canvas = await svgToCanvas(svgMarkup, 1588, 2245)
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
          width: 794,
          height: 1122,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      // Directly pass the high-res 1588x2245 canvas to html2pdf!
      // Produces an exact 1-page pristine, ultra-sharp vector PDF with 0% stretch!
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
      contentNode.className = 'page'
      contentNode.style.width = '794px'
      contentNode.style.backgroundColor = '#ffffff'
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
