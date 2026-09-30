import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyJWT } from '@/lib/auth/jwt'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

// Helper to authenticate and get user ID
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.split(' ')[1] || request.cookies.get('access_token')?.value
  if (!token) return null
  const payload = await verifyJWT(token)
  return payload ? payload.sub : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // ENFORCE RLS manually
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error GET prescription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        title: body.title,
        status: body.status,
        template_slug: body.templateSlug,
        mode: body.mode,
        doctor_info: body.doctorInfo,
        patient_info: body.patientInfo,
        diagnosis: body.diagnosis,
        medicines: body.medicines,
        lab_tests: body.labTests,
        advice: body.advice,
        follow_up_date: body.followUpDate,
        canvas_data: body.canvasData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId) // ENFORCE RLS manually
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prescription not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error PUT prescription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // ENFORCE RLS manually

    if (error) {
      return NextResponse.json({ error: 'Delete failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error DELETE prescription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
