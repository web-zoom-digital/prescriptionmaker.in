import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Doctor Profile ───────────────────────────────────────────────
export type DoctorProfile = {
  name: string
  qualification: string
  specialization: string
  regNo: string
  clinicName: string
  address: string
  phone: string
  email: string
  signature: string
  logoUrl?: string
  stampUrl?: string
}

const PROFILE_KEY = '@doctor_profile'

export async function saveDoctorProfile(profile: DoctorProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export async function getDoctorProfile(): Promise<DoctorProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY)
  return raw ? JSON.parse(raw) : null
}

// ─── Patient Database ─────────────────────────────────────────────
export type SavedPatient = {
  id: string
  name: string
  age: string
  gender: string
  weight: string
  phone: string
  address: string
  bloodGroup: string
  allergies: string
  lastVisit: string
  visitCount: number
}

const PATIENTS_KEY = '@saved_patients'

export async function getSavedPatients(): Promise<SavedPatient[]> {
  const raw = await AsyncStorage.getItem(PATIENTS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function savePatient(patient: Omit<SavedPatient, 'id' | 'visitCount' | 'lastVisit'>): Promise<SavedPatient> {
  const patients = await getSavedPatients()
  const existing = patients.find(p => p.phone && p.phone === patient.phone)
  
  if (existing) {
    const updated = { ...existing, ...patient, visitCount: existing.visitCount + 1, lastVisit: new Date().toISOString() }
    const newList = patients.map(p => p.id === existing.id ? updated : p)
    await AsyncStorage.setItem(PATIENTS_KEY, JSON.stringify(newList))
    return updated
  }
  
  const newPatient: SavedPatient = {
    ...patient,
    id: Date.now().toString(),
    visitCount: 1,
    lastVisit: new Date().toISOString(),
  }
  await AsyncStorage.setItem(PATIENTS_KEY, JSON.stringify([newPatient, ...patients]))
  return newPatient
}

export async function searchPatients(query: string): Promise<SavedPatient[]> {
  const all = await getSavedPatients()
  const q = query.toLowerCase()
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.phone.includes(q)
  ).slice(0, 5)
}

export async function deletePatient(id: string) {
  const patients = await getSavedPatients()
  await AsyncStorage.setItem(PATIENTS_KEY, JSON.stringify(patients.filter(p => p.id !== id)))
}

// ─── Follow-up Reminders ──────────────────────────────────────────
export type Reminder = {
  id: string
  patientName: string
  note: string
  dueDate: string
  isDone: boolean
  createdAt: string
}

const REMINDERS_KEY = '@reminders'

export async function getReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function addReminder(reminder: Omit<Reminder, 'id' | 'isDone' | 'createdAt'>): Promise<Reminder> {
  const reminders = await getReminders()
  const newReminder: Reminder = { ...reminder, id: Date.now().toString(), isDone: false, createdAt: new Date().toISOString() }
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([newReminder, ...reminders]))
  return newReminder
}

export async function toggleReminder(id: string) {
  const reminders = await getReminders()
  const updated = reminders.map(r => r.id === id ? { ...r, isDone: !r.isDone } : r)
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated))
}

export async function deleteReminder(id: string) {
  const reminders = await getReminders()
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders.filter(r => r.id !== id)))
}
