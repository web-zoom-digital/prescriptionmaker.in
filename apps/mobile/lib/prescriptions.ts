import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { savePatient } from './local-store'

export type Prescription = {
  id: string
  title: string
  status: 'draft' | 'complete' | 'archived'
  mode: 'form' | 'hand'
  diagnosis: string
  patient_info: any
  doctor_info: any
  medicines: any[]
  advice?: string
  follow_up_date?: string
  lab_tests?: string
  template_slug?: string
  created_at: string
  updated_at: string
}

// ── Offline Sync Helpers ───────────────────────────────────────────

const STORAGE_KEY = '@rx_maker_prescriptions'
const OFFLINE_QUEUE_KEY = '@rx_maker_offline_queue'

type OfflineAction = {
  id: string
  action: 'create' | 'update' | 'delete'
  payload?: any
  timestamp: number
}

// Ensure the local cache is updated with the latest data
async function setLocalCache(data: Prescription[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to set local prescription cache:', e)
  }
}

async function getLocalCache(): Promise<Prescription[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

// Add an action to the offline queue
async function queueAction(action: OfflineAction) {
  try {
    const q = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
    const queue: OfflineAction[] = q ? JSON.parse(q) : []
    queue.push(action)
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {}
}

// Run pending offline actions
export async function syncOfflineData() {
  try {
    const q = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!q) return
    const queue: OfflineAction[] = JSON.parse(q)
    if (queue.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const remainingQueue: OfflineAction[] = []

    for (const item of queue) {
      try {
        if (item.action === 'create') {
          await supabase.from('prescriptions').insert({ ...item.payload, id: item.id, user_id: user.id })
        } else if (item.action === 'update') {
          await supabase.from('prescriptions').update(item.payload).eq('id', item.id)
        } else if (item.action === 'delete') {
          await supabase.from('prescriptions').delete().eq('id', item.id)
        }
      } catch (err) {
        console.error('Sync failed for item', item, err)
        remainingQueue.push(item) // keep it in queue if sync fails
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue))
  } catch (e) {
    console.error('Offline sync error', e)
  }
}

// ── API Methods ───────────────────────────────────────────────────

// Get all prescriptions (combines remote + local storage)
export async function getPrescriptions(): Promise<Prescription[]> {
  const local = await getLocalCache()
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, title, status, mode, diagnosis, patient_info, doctor_info, medicines, advice, follow_up_date, lab_tests, template_slug, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      return local
    }

    if (data && data.length > 0) {
      // Merge remote prescriptions with any unsynced local-only prescriptions
      const remoteIds = new Set(data.map(p => p.id))
      const localOnly = local.filter(p => !remoteIds.has(p.id))
      const combined = [...data, ...localOnly]
      await setLocalCache(combined)
      return combined
    }

    return local
  } catch (err) {
    return local
  }
}

// Get single prescription
export async function getPrescription(id: string): Promise<Prescription | null> {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw error || new Error('Not found')
    return data
  } catch (err) {
    const cache = await getLocalCache()
    return cache.find(p => p.id === id) || null
  }
}

// Helper to sync patient info to local patient store
async function autoSavePatient(patientInfo: any) {
  if (!patientInfo) return
  const name = typeof patientInfo === 'string' ? '' : patientInfo.name?.trim()
  if (!name) return

  try {
    await savePatient({
      name,
      phone: patientInfo.phone?.trim() || '',
      age: patientInfo.age ? String(patientInfo.age) : '',
      gender: patientInfo.gender || '',
      weight: patientInfo.weight ? String(patientInfo.weight) : '',
      bloodGroup: patientInfo.bloodGroup || '',
      allergies: patientInfo.allergies || '',
      address: patientInfo.address || '',
    })
  } catch (err) {
    // Non-blocking
  }
}

// Create new prescription (offline-friendly, works even if not logged in)
export async function createPrescription(payload: Partial<Prescription>) {
  // Auto-sync patient
  if (payload.patient_info) {
    autoSavePatient(payload.patient_info)
  }

  const tempId = `rx-${Date.now()}`
  let user: any = null
  try {
    const authRes = await supabase.auth.getUser()
    user = authRes.data?.user
  } catch {}

  const newRx: Prescription = {
    id: tempId,
    title: payload.title ?? 'Untitled',
    status: payload.status ?? 'draft',
    mode: payload.mode ?? 'form',
    diagnosis: payload.diagnosis ?? '',
    patient_info: payload.patient_info ?? {},
    doctor_info: payload.doctor_info ?? {},
    medicines: payload.medicines ?? [],
    template_slug: payload.template_slug ?? 'classic-medical',
    advice: payload.advice ?? '',
    follow_up_date: payload.follow_up_date ?? '',
    lab_tests: payload.lab_tests ?? '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // 1. Always save to local cache optimistically
  const cache = await getLocalCache()
  await setLocalCache([newRx, ...cache.filter(p => p.id !== tempId)])

  // 2. If authenticated with Supabase, sync to remote
  if (user?.id) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          user_id: user.id,
          title: newRx.title,
          status: newRx.status,
          mode: newRx.mode,
          diagnosis: newRx.diagnosis,
          patient_info: newRx.patient_info,
          doctor_info: newRx.doctor_info,
          medicines: newRx.medicines,
          template_slug: newRx.template_slug,
          advice: newRx.advice,
          follow_up_date: newRx.follow_up_date,
          lab_tests: newRx.lab_tests,
        })
        .select('id')
        .single()

      if (!error && data?.id) {
        newRx.id = data.id
        const updatedCache = await getLocalCache()
        await setLocalCache(updatedCache.map(p => p.id === tempId ? { ...p, id: data.id } : p))
        return data
      }
    } catch (syncErr) {
      console.warn('Supabase sync deferred:', syncErr)
      await queueAction({ id: tempId, action: 'create', payload: newRx, timestamp: Date.now() })
    }
  }

  return { id: tempId }
}

// Update existing prescription
export async function updatePrescription(id: string, payload: Partial<Prescription>) {
  if (payload.patient_info) {
    autoSavePatient(payload.patient_info)
  }

  // Optimistically update local cache
  const cache = await getLocalCache()
  const idx = cache.findIndex(p => p.id === id)
  if (idx !== -1) {
    cache[idx] = { ...cache[idx], ...payload, updated_at: new Date().toISOString() }
    await setLocalCache(cache)
  }

  try {
    const { error } = await supabase
      .from('prescriptions')
      .update({
        title: payload.title,
        status: payload.status,
        diagnosis: payload.diagnosis,
        patient_info: payload.patient_info,
        doctor_info: payload.doctor_info,
        medicines: payload.medicines,
        advice: payload.advice,
        follow_up_date: payload.follow_up_date,
        lab_tests: payload.lab_tests,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw new Error(error.message)
  } catch (err) {
    await queueAction({ id, action: 'update', payload, timestamp: Date.now() })
  }
}

// Delete a prescription
export async function deletePrescription(id: string) {
  try {
    await supabase.from('prescriptions').delete().eq('id', id)
  } catch (err) {
    await queueAction({ id, action: 'delete', timestamp: Date.now() })
  } finally {
    const cache = await getLocalCache()
    await setLocalCache(cache.filter(p => p.id !== id))
  }
}

// Get all prescriptions for a specific patient
export async function getPatientPrescriptions(phoneOrName: string, fallbackName?: string): Promise<Prescription[]> {
  if (!phoneOrName && !fallbackName) return []
  
  const all = await getPrescriptions()
  const cleanQ = phoneOrName ? phoneOrName.replace(/\D/g, '').slice(-10) : ''
  const nameQ = (fallbackName || phoneOrName || '').trim().toLowerCase()

  return all.filter(p => {
    let info = p.patient_info
    if (typeof info === 'string') {
      try { info = JSON.parse(info) } catch {}
    }
    if (!info) return false
    const rxDigits = info.phone ? String(info.phone).replace(/\D/g, '').slice(-10) : ''
    const rxName = info.name ? String(info.name).trim().toLowerCase() : ''

    if (cleanQ && rxDigits && cleanQ === rxDigits) return true
    if (nameQ && rxName && (rxName === nameQ || rxName.includes(nameQ) || nameQ.includes(rxName))) return true
    return false
  })
}
