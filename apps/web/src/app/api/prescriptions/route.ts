import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyJWT } from '@/lib/auth/jwt'

// Use Service Role key for backend operations.
// IMPORTANT: Since this bypasses RLS, we MUST enforce authorization logic
// (e.g., matching user_id) manually in these API routes.
const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

// GET /api/prescriptions — List user's prescriptions
export async function GET(request: NextRequest) {
  try {
    // 1. Verify user is logged in
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1] || request.cookies.get('access_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 2. Fetch prescriptions for this user
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, title, status, template_slug, patient_info, diagnosis, created_at, updated_at')
      .eq('user_id', payload.sub)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching prescriptions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/prescriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/prescriptions — Create a new prescription (draft or complete)
export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is logged in
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1] || request.cookies.get('access_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    // Normally we would validate with Zod here, but we'll accept flexible JSON
    // since drafts might be incomplete.

    // 3. Insert into database
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        user_id: payload.sub,
        title: body.title || 'Untitled Prescription',
        status: body.status || 'draft',
        template_slug: body.templateSlug || 'classic-medical',
        mode: body.mode || 'form',
        doctor_info: body.doctorInfo || {},
        patient_info: body.patientInfo || {},
        diagnosis: body.diagnosis || '',
        medicines: body.medicines || [],
        lab_tests: body.labTests || '',
        advice: body.advice || '',
        follow_up_date: body.followUpDate || '',
        canvas_data: body.canvasData || null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error creating prescription:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/prescriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
