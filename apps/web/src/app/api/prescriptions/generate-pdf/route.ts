/**
 * PDF Generation API Route
 *
 * POST /api/prescriptions/generate-pdf
 *
 * Accepts prescription data + template slug, renders the PDF server-side
 * using @react-pdf/renderer, and returns the PDF binary with correct headers.
 *
 * This runs exclusively on the Node.js server — @react-pdf/renderer is not
 * bundled into the client bundle at all.
 */

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { PrescriptionDocument } from '@/lib/pdf/prescription-document'
import { z } from 'zod'

// ── Request schema ────────────────────────────────────────────────────────────

const generatePdfSchema = z.object({
  templateSlug: z.string().min(1),
  customColor: z.string().nullable().optional(),
  doctor: z.object({
    name: z.string().nullable().optional(),
    qualifications: z.string().nullable().optional(),
    specialization: z.string().nullable().optional(),
    registrationNumber: z.string().nullable().optional(),
    clinicName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    signatureUrl: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    stampUrl: z.string().nullable().optional(),
  }),
  patient: z.object({
    name: z.string().nullable().optional(),
    age: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
  }),
  diagnosis: z.string().nullable().optional(),
  medicines: z.array(
    z.object({
      name: z.string().nullable().optional(),
      strength: z.string().nullable().optional(),
      form: z.string().nullable().optional(),
      frequency: z.string().nullable().optional(),
      timing: z.string().nullable().optional(),
      duration: z.string().nullable().optional(),
    })
  ).default([]),
  labTests: z.string().nullable().optional(),
  advice: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  canvasImage: z.string().nullable().optional(),
  vitals: z.record(z.string()).nullable().optional(),
  chiefComplaint: z.string().nullable().optional(),
})

export type GeneratePdfRequest = z.infer<typeof generatePdfSchema>

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = generatePdfSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Resolve template
  const template = TEMPLATES.find((t) => t.slug === data.templateSlug)
  if (!template) {
    return NextResponse.json(
      { error: `Template '${data.templateSlug}' not found` },
      { status: 404 }
    )
  }

  // Generate PDF buffer
  try {
    const pdfBuffer = await renderToBuffer(
      (createElement(PrescriptionDocument, {
        templateName: template.name,
        templateSlug: template.slug,
        primaryColor: data.customColor || template.styles.primaryColor,
        accentColor: template.styles.accentColor,
        bgColor: (template.styles as any).bgColor ?? '#ffffff',
        layout: template.layout,
        doctor: data.doctor,
        patient: data.patient,
        diagnosis: data.diagnosis,
        medicines: data.medicines,
        labTests: data.labTests,
        advice: data.advice,
        followUpDate: data.followUpDate,
        canvasImage: data.canvasImage,
        vitals: data.vitals || undefined,
        chiefComplaint: data.chiefComplaint,
      }) as any)
    )

    // Build a clean filename
    const patientName = data.patient.name?.replace(/\s+/g, '_') ?? 'Prescription'
    const date = new Date().toISOString().split('T')[0]
    const filename = `${patientName}_${date}.pdf`

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[generate-pdf] Render error:', err)
    return NextResponse.json(
      { error: 'PDF generation failed. Please try again.' },
      { status: 500 }
    )
  }
}

// GET — preview mode: streams inline PDF for in-browser preview
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateSlug = searchParams.get('template') ?? 'classic-medical'

  const template = TEMPLATES.find((t) => t.slug === templateSlug) ?? TEMPLATES[0]!

  try {
    const pdfBuffer = await renderToBuffer(
      (createElement(PrescriptionDocument, {
        templateName: template.name,
        primaryColor: template.styles.primaryColor,
        accentColor: template.styles.accentColor,
        layout: template.layout,
        doctor: { name: 'Dr. Sample Doctor', qualifications: 'MBBS, MD', specialization: 'General Medicine', registrationNumber: 'MH-2020-1234' },
        patient: { name: 'Sample Patient', age: '35', gender: 'male' },
        diagnosis: 'Acute Upper Respiratory Tract Infection',
        medicines: [
          { name: 'Amoxicillin', strength: '500mg', form: 'capsule', frequency: 'Twice daily (BD)', timing: 'After food', duration: '5 days' },
          { name: 'Paracetamol', strength: '650mg', form: 'tablet', frequency: 'SOS', timing: 'After food', duration: '3 days' },
        ],
        advice: 'Rest adequately. Drink plenty of warm fluids. Avoid cold food and beverages.',
        followUpDate: 'After 5 days',
      }) as any)
    )

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="sample-prescription.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[generate-pdf GET] Error:', err)
    return NextResponse.json({ error: 'Failed to generate sample PDF' }, { status: 500 })
  }
}
