import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { PrescriptionDocument } from '@/lib/pdf/prescription-document'
import { verifyJWT } from '@/lib/auth/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify auth (supports both custom JWT access_token and Supabase sb-access-token)
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.split(' ')[1] || req.cookies.get('access_token')?.value
    let userId: string | null = null

    if (token) {
      const payload = await verifyJWT(token)
      if (payload?.sub) {
        userId = payload.sub
      }
    }

    // Fallback: check sb-access-token
    if (!userId) {
      const sbToken = req.cookies.get('sb-access-token')?.value
      if (sbToken) {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(sbToken)
        if (!authError && user?.id) {
          userId = user.id
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 2. Fetch prescription (enforce user ownership)
    const { data: rx, error } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !rx) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // 3. Fetch doctor profile for letterhead
    const { data: profile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 4. Resolve template
    const templateSlug = rx.template_slug || 'classic-medical'
    const template = TEMPLATES.find((t) => t.slug === templateSlug) ?? TEMPLATES[0]!

    // 5. Build prescription data object for PDF renderer
    const doctorInfo = (rx.doctor_info as any) || {}
    const patientInfo = (rx.patient_info as any) || {}

    const doctorData = {
      name: profile?.doctor_name || doctorInfo.doctorName || doctorInfo.name || 'Doctor',
      qualifications: profile?.qualifications || doctorInfo.doctorQualifications || doctorInfo.qualifications || '',
      specialization: profile?.specialization || doctorInfo.doctorSpecialization || doctorInfo.specialization || '',
      registrationNumber: profile?.registration_number || doctorInfo.doctorRegNumber || doctorInfo.registrationNumber || '',
      clinicName: profile?.clinic_name || doctorInfo.clinicName || '',
      phone: profile?.clinic_phone || doctorInfo.clinicPhone || doctorInfo.phone || '',
      address: profile?.clinic_address
        ? `${profile.clinic_address}, ${profile.clinic_city || ''} ${profile.clinic_pincode || ''}`.trim()
        : doctorInfo.clinicAddress || doctorInfo.address || '',
      logoUrl: profile?.clinic_logo_url || doctorInfo.clinicLogoUrl || doctorInfo.logoUrl || null,
      stampUrl: profile?.stamp_url || doctorInfo.stampUrl || null,
      signatureUrl: profile?.signature_url || doctorInfo.signatureDataUrl || doctorInfo.signatureUrl || null,
    }

    const patientData = {
      name: patientInfo.name || 'Patient',
      age: patientInfo.age ? String(patientInfo.age) : '',
      gender: patientInfo.gender || '',
      address: patientInfo.address || '',
      allergies: patientInfo.allergies || '',
      insuranceNo: patientInfo.insuranceNo || '',
      careProvider: patientInfo.careProvider || '',
      mrn: patientInfo.mrn || '',
      ward: patientInfo.ward || '',
      bedNo: patientInfo.bedNo || '',
      ipOpNo: patientInfo.ipOpNo || '',
    }

    const dateFormatted = rx.created_at
      ? new Date(rx.created_at).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric'
        })

    // 6. Render to PDF buffer
    const pdfBuffer = await renderToBuffer(
      createElement(PrescriptionDocument, {
        templateName: template.name,
        templateSlug: template.slug,
        primaryColor: (rx as any).custom_color || template.styles?.primaryColor || '#0f766e',
        accentColor: template.styles?.accentColor || '#14b8a6',
        bgColor: (template.styles as any)?.bgColor ?? '#ffffff',
        layout: template.layout,
        doctor: doctorData,
        patient: patientData,
        diagnosis: rx.diagnosis || '',
        medicines: rx.medicines || [],
        labTests: rx.lab_tests || '',
        advice: rx.advice || '',
        followUpDate: rx.follow_up_date || '',
        date: dateFormatted,
        canvasImage: (rx as any).canvas_data_url || (rx as any).canvas_image || null,
        vitals: (rx as any).vitals || undefined,
        chiefComplaint: (rx as any).chief_complaint || undefined,
      } as any)
    )

    // 7. Store PDF in Supabase Storage if bucket exists (non-blocking)
    try {
      const pdfPath = `${userId}/${id}.pdf`
      const { error: storageError } = await supabaseAdmin.storage
        .from('prescription-pdfs')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (!storageError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('prescription-pdfs')
          .getPublicUrl(pdfPath)

        await supabaseAdmin
          .from('prescriptions')
          .update({
            pdf_url: urlData.publicUrl,
            pdf_generated_at: new Date().toISOString(),
          })
          .eq('id', id)
      }
    } catch (storageErr) {
      console.warn('[PDF Storage Warning]', storageErr)
    }

    // 8. Return PDF as download response
    const patientName = patientData.name || 'prescription'
    const filename = `prescription-${patientName.replace(/\s+/g, '-').toLowerCase()}-${id.slice(0, 8)}.pdf`

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    console.error('[PDF Generation Error]', err)
    return NextResponse.json({ error: 'PDF generation failed', details: err?.message || String(err) }, { status: 500 })
  }
}
