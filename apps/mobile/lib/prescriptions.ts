import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

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
  if (Platform.OS === 'web') return
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (e) {}
}

async function getLocalCache(): Promise<Prescription[]> {
  if (Platform.OS === 'web') return []
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

// Add an action to the offline queue
async function queueAction(action: OfflineAction) {
  if (Platform.OS === 'web') return
  try {
    const q = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
    const queue: OfflineAction[] = q ? JSON.parse(q) : []
    queue.push(action)
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {}
}

// Run pending offline actions
export async function syncOfflineData() {
  if (Platform.OS === 'web') return
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

// Get all prescriptions
export async function getPrescriptions(): Promise<Prescription[]> {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, title, status, mode, diagnosis, patient_info, doctor_info, medicines, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    await setLocalCache(data || [])
    return data ?? []
  } catch (err) {
    console.warn('Network failed, falling back to local cache')
    return await getLocalCache()
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

    if (error) throw error
    return data
  } catch (err) {
    const cache = await getLocalCache()
    return cache.find(p => p.id === id) || null
  }
}

// Create new prescription
export async function createPrescription(payload: Partial<Prescription>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const tempId = Date.now().toString()
  const newRx = {
    user_id: user.id,
    title: payload.title ?? 'Untitled',
    status: payload.status ?? 'draft',
    mode: payload.mode ?? 'form',
    diagnosis: payload.diagnosis ?? '',
    patient_info: payload.patient_info ?? {},
    doctor_info: payload.doctor_info ?? {},
    medicines: payload.medicines ?? [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert(newRx)
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return data
  } catch (err) {
    // Offline fallback
    const fullPayload = { ...newRx, id: tempId }
    await queueAction({ id: tempId, action: 'create', payload: newRx, timestamp: Date.now() })
    
    // Update local cache optimistically
    const cache = await getLocalCache()
    await setLocalCache([fullPayload as unknown as Prescription, ...cache])
    
    return { id: tempId }
  }
}

// Update existing prescription
export async function updatePrescription(id: string, payload: Partial<Prescription>) {
  try {
    const { error } = await supabase
      .from('prescriptions')
      .update({
        title: payload.title,
        status: payload.status,
        diagnosis: payload.diagnosis,
        patient_info: payload.patient_info,
        medicines: payload.medicines,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw new Error(error.message)
  } catch (err) {
    // Offline fallback
    await queueAction({ id, action: 'update', payload, timestamp: Date.now() })
    
    // Update local cache optimistically
    const cache = await getLocalCache()
    const idx = cache.findIndex(p => p.id === id)
    if (idx !== -1) {
      cache[idx] = { ...cache[idx], ...payload, updated_at: new Date().toISOString() }
      await setLocalCache(cache)
    }
  }
}

// Delete a prescription
export async function deletePrescription(id: string) {
  try {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  } catch (err) {
    // Offline fallback
    await queueAction({ id, action: 'delete', timestamp: Date.now() })
    
    const cache = await getLocalCache()
    await setLocalCache(cache.filter(p => p.id !== id))
  }
}

// Get all prescriptions for a specific patient
export async function getPatientPrescriptions(phone: string): Promise<Prescription[]> {
  if (!phone) return []
  
  const all = await getPrescriptions()
  return all.filter(p => p.patient_info?.phone && p.patient_info.phone === phone)
}
