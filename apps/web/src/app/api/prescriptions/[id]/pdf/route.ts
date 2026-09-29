import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PrescriptionDocument } from '@/lib/pdf/prescription-document'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify auth
    const token = req.cookies.get('sb-access-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 2. Fetch prescription (enforce user ownership)
    const { data: rx, error } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !rx) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // 3. Fetch doctor profile for letterhead
    const { data: profile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 4. Build prescription data object for PDF renderer
    const prescriptionData = {
      doctor: {
        name: profile?.doctor_name ?? '',
        qualifications: profile?.qualifications ?? '',
        specialization: profile?.specialization ?? '',
        registrationNumber: profile?.registration_number ?? '',
        clinicName: profile?.clinic_name ?? '',
        clinicPhone: profile?.clinic_phone ?? '',
        clinicAddress: `${profile?.clinic_address ?? ''}, ${profile?.clinic_city ?? ''} ${profile?.clinic_pincode ?? ''}`.trim(),
        clinicLogoUrl: profile?.clinic_logo_url ?? null,
        stampUrl: profile?.stamp_url ?? null,
        signatureUrl: profile?.signature_url ?? null,
      },
      patient: rx.patient_info ?? {},
      diagnosis: rx.diagnosis ?? '',
      medicines: rx.medicines ?? [],
      labTests: rx.lab_tests ?? '',
      advice: rx.advice ?? '',
      followUpDate: rx.follow_up_date ?? '',
      date: new Date(rx.created_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
      }),
    }

    // 5. Render to PDF buffer
    const pdfBuffer = await renderToBuffer(
      createElement(PrescriptionDocument as any, {
        data: prescriptionData,
        template: {
          name: rx.template_slug ?? 'classic-medical',
          primaryColor: '#0f766e',
          secondaryColor: '#f0fdf4',
        }
      }) as any
    )

    // 6. Optionally store PDF in Supabase Storage & update record
    const pdfPath = `${user.id}/${id}.pdf`
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

      // Update the prescription record with PDF URL
      await supabaseAdmin
        .from('prescriptions')
        .update({
          pdf_url: urlData.publicUrl,
          pdf_generated_at: new Date().toISOString(),
        })
        .eq('id', id)
    }

    // 7. Return PDF as download response
    const patientName = (rx.patient_info as any)?.name ?? 'prescription'
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
    return NextResponse.json({ error: 'PDF generation failed', details: err.message }, { status: 500 })
  }
}
