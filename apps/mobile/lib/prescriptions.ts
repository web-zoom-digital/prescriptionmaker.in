import { supabase } from './supabase'

export type Prescription = {
  id: string
  title: string
  status: 'draft' | 'complete' | 'archived'
  mode: 'form' | 'hand'
  diagnosis: string
  patient_info: any
  doctor_info: any
  medicines: any[]
  created_at: string
  updated_at: string
}

// Get all prescriptions for logged-in user
export async function getPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('id, title, status, mode, diagnosis, patient_info, doctor_info, medicines, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Get single prescription
export async function getPrescription(id: string): Promise<Prescription | null> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// Create new prescription
export async function createPrescription(payload: Partial<Prescription>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('prescriptions')
    .insert({
      user_id: user.id,
      title: payload.title ?? 'Untitled',
      status: payload.status ?? 'draft',
      mode: payload.mode ?? 'form',
      diagnosis: payload.diagnosis ?? '',
      patient_info: payload.patient_info ?? {},
      doctor_info: payload.doctor_info ?? {},
      medicines: payload.medicines ?? [],
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Update existing prescription
export async function updatePrescription(id: string, payload: Partial<Prescription>) {
  const { error } = await supabase
    .from('prescriptions')
    .update({
      title: payload.title,
      status: payload.status,
      diagnosis: payload.diagnosis,
      patient_info: payload.patient_info,
      medicines: payload.medicines,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Delete a prescription
export async function deletePrescription(id: string) {
  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
