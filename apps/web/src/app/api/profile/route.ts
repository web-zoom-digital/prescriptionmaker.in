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

// GET /api/profile — Fetch doctor profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if profile exists
    let { data: profile, error } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If no profile found, create an empty one
    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('doctor_profiles')
        .insert({ user_id: userId })
        .select('*')
        .single()
      
      if (createError) {
        throw createError
      }
      profile = newProfile
    } else if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: profile }, { status: 200 })
  } catch (error) {
    console.error('Error GET profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile — Update doctor profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const { data, error } = await supabase
      .from('doctor_profiles')
      .update({
        doctor_name: body.doctorName,
        qualifications: body.qualifications,
        specialization: body.specialization,
        registration_number: body.registrationNumber,
        experience_years: body.experienceYears,
        clinic_name: body.clinicName,
        clinic_phone: body.clinicPhone,
        clinic_address: body.clinicAddress,
        clinic_city: body.clinicCity,
        clinic_state: body.clinicState,
        clinic_pincode: body.clinicPincode,
        clinic_email: body.clinicEmail,
        clinic_website: body.clinicWebsite,
        default_template_slug: body.defaultTemplateSlug,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error PUT profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
