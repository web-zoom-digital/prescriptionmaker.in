import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Switch
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MOBILE_TEMPLATES, type Template } from '../lib/templates'
import type { Medicine, PrescriptionData } from '../lib/pdf-generator'
import { generatePrescriptionHTML } from '../lib/pdf-generator'
import { createPrescription, updatePrescription } from '../lib/prescriptions'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as MailComposer from 'expo-mail-composer'

// ─── Step Indicator ───────────────────────────────────────────────
function StepDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[stepStyles.dot, i < current && { backgroundColor: color, width: 24 }, i === current && { backgroundColor: color }]}
        />
      ))}
    </View>
  )
}
const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#e2e8f0' },
})

// ─── Template Picker ──────────────────────────────────────────────
function TemplatePicker({ selected, onSelect }: { selected: Template; onSelect: (t: Template) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}>
      {MOBILE_TEMPLATES.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => onSelect(t)}
          style={[
            tpStyles.card,
            { borderColor: selected.id === t.id ? t.styles.primaryColor : '#e2e8f0' },
            selected.id === t.id && { backgroundColor: t.styles.bgColor },
          ]}
        >
          <Text style={tpStyles.emoji}>{t.emoji}</Text>
          <Text style={[tpStyles.name, selected.id === t.id && { color: t.styles.primaryColor }]}>{t.name}</Text>
          {t.isPremium && <Text style={tpStyles.pro}>PRO</Text>}
          <View style={[tpStyles.colorBar, { backgroundColor: t.styles.primaryColor }]} />
        </Pressable>
      ))}
    </ScrollView>
  )
}
const tpStyles = StyleSheet.create({
  card: {
    width: 110, padding: 12, borderRadius: 12, borderWidth: 2,
    backgroundColor: '#fff', alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emoji: { fontSize: 28 },
  name: { fontSize: 11, fontWeight: '700', color: '#475569', textAlign: 'center' },
  pro: { fontSize: 9, backgroundColor: '#f59e0b', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, fontWeight: '700' },
  colorBar: { height: 3, width: '80%', borderRadius: 99, marginTop: 4 },
})

// ─── Medicine Row ─────────────────────────────────────────────────
function MedicineRow({ med, index, onUpdate, onDelete, color }: {
  med: Medicine; index: number; onUpdate: (id: string, field: keyof Medicine, val: string) => void;
  onDelete: (id: string) => void; color: string
}) {
  return (
    <View style={[medStyles.container, { borderLeftColor: color }]}>
      <View style={medStyles.header}>
        <Text style={[medStyles.num, { color }]}>#{index + 1}</Text>
        <Pressable onPress={() => onDelete(med.id)}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </Pressable>
      </View>
      <TextInput style={medStyles.nameInput} placeholder="Medicine name *" value={med.name}
        onChangeText={v => onUpdate(med.id, 'name', v)} placeholderTextColor="#94a3b8" />
      <View style={medStyles.row}>
        <TextInput style={[medStyles.smallInput, { flex: 1 }]} placeholder="Strength (500mg)" value={med.strength}
          onChangeText={v => onUpdate(med.id, 'strength', v)} placeholderTextColor="#94a3b8" />
        <TextInput style={[medStyles.smallInput, { flex: 1 }]} placeholder="Frequency (1-0-1)" value={med.frequency}
          onChangeText={v => onUpdate(med.id, 'frequency', v)} placeholderTextColor="#94a3b8" />
        <TextInput style={[medStyles.smallInput, { flex: 0.8 }]} placeholder="Duration" value={med.duration}
          onChangeText={v => onUpdate(med.id, 'duration', v)} placeholderTextColor="#94a3b8" />
      </View>
      <TextInput style={medStyles.instructInput} placeholder="Instructions (e.g. after meals)" value={med.instructions}
        onChangeText={v => onUpdate(med.id, 'instructions', v)} placeholderTextColor="#94a3b8" />
    </View>
  )
}
const medStyles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  num: { fontSize: 13, fontWeight: '700' },
  nameInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 9, fontSize: 14, color: '#1e293b', marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  smallInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, fontSize: 12, color: '#374151' },
  instructInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, fontSize: 12, color: '#374151' },
})

// ─── Main Editor Screen ───────────────────────────────────────────
export default function PrescriptionEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const [step, setStep] = useState(0) // 0=template, 1=doctor, 2=patient, 3=rx, 4=review
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<Template>(MOBILE_TEMPLATES[0])

  const [doctorInfo, setDoctorInfo] = useState({
    name: '', qualification: '', specialization: '', regNo: '',
    clinicName: '', address: '', phone: '', email: '',
  })
  const [patientInfo, setPatientInfo] = useState({ name: '', age: '', gender: '', weight: '', phone: '' })
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: '1', name: '', strength: '', frequency: '', duration: '', instructions: '' }
  ])
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')

  const color = template.styles.primaryColor

  const addMedicine = () => {
    setMedicines(prev => [...prev, { id: Date.now().toString(), name: '', strength: '', frequency: '', duration: '', instructions: '' }])
  }

  const updateMedicine = (id: string, field: keyof Medicine, val: string) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m))
  }

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
  }

  const getPrescriptionData = (): PrescriptionData => ({
    template,
    doctorInfo,
    patientInfo,
    diagnosis,
    symptoms,
    medicines: medicines.filter(m => m.name.trim()),
    advice,
    followUp,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
  })

  const generateAndGetUri = async (): Promise<string> => {
    const html = generatePrescriptionHTML(getPrescriptionData())
    const { uri } = await Print.printToFileAsync({ html, base64: false })
    // Move to a named file
    const dest = `${FileSystem.documentDirectory}prescription_${patientInfo.name.replace(/\s/g, '_') || 'rx'}_${Date.now()}.pdf`
    await FileSystem.moveAsync({ from: uri, to: dest })
    return dest
  }

  const handleDownload = async () => {
    setSaving(true)
    try {
      const uri = await generateAndGetUri()
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Prescription PDF' })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    setSaving(true)
    try {
      const uri = await generateAndGetUri()
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEmail = async () => {
    const available = await MailComposer.isAvailableAsync()
    if (!available) {
      Alert.alert('Not Available', 'Email is not available on this device.')
      return
    }
    setSaving(true)
    try {
      const uri = await generateAndGetUri()
      await MailComposer.composeAsync({
        subject: `Prescription for ${patientInfo.name} — ${new Date().toLocaleDateString('en-IN')}`,
        body: `Dear ${patientInfo.name},\n\nPlease find your prescription attached.\n\nDr. ${doctorInfo.name}\n${doctorInfo.clinicName}`,
        recipients: [],
        attachments: [uri],
      })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const payload = {
        title: `Rx: ${patientInfo.name || 'Draft'}`,
        status: 'draft' as const,
        mode: 'form' as const,
        diagnosis,
        patient_info: patientInfo,
        doctor_info: doctorInfo,
        medicines: medicines.filter(m => m.name),
      }
      if (id) await updatePrescription(id, payload)
      else await createPrescription(payload)
      Alert.alert('Saved!', 'Draft saved successfully.', [{ text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard') }])
    } catch (err: any) {
      Alert.alert('Save Failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  const steps = ['Template', 'Doctor', 'Patient', 'Medicines', 'Review']

  return (
    <View style={styles.root}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: color }]}>
        <Pressable onPress={() => step > 0 ? setStep(s => s - 1) : router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')}>
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={22} color="#fff" />
        </Pressable>
        <View style={styles.topMid}>
          <Text style={styles.topTitle}>{steps[step]}</Text>
          <StepDots current={step} total={steps.length} color="#fff" />
        </View>
        <Pressable onPress={handleSaveDraft} disabled={saving}>
          <Text style={styles.saveText}>{saving ? '...' : 'Draft'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Step 0: Template ── */}
          {step === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Template</Text>
              <Text style={styles.hint}>Select the design style for your prescription</Text>
              <TemplatePicker selected={template} onSelect={setTemplate} />
              <View style={[styles.preview, { backgroundColor: template.styles.bgColor, borderColor: color }]}>
                <Text style={[styles.previewTitle, { color }]}>{template.emoji} {template.name}</Text>
                <Text style={styles.previewDesc}>{template.description}</Text>
                <View style={[styles.previewBar, { backgroundColor: color }]} />
                <Text style={styles.previewLayout}>Layout: {template.layout}</Text>
              </View>
            </View>
          )}

          {/* ── Step 1: Doctor Info ── */}
          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Information</Text>
              <Text style={styles.hint}>This appears in the prescription header</Text>
              {[
                { key: 'name', label: 'Full Name *', placeholder: 'Dr. Rahul Sharma' },
                { key: 'qualification', label: 'Qualification *', placeholder: 'MBBS, MD' },
                { key: 'specialization', label: 'Specialization', placeholder: 'General Physician' },
                { key: 'regNo', label: 'Registration No.', placeholder: 'MCI-12345' },
                { key: 'clinicName', label: 'Clinic / Hospital Name', placeholder: 'City Medical Centre' },
                { key: 'address', label: 'Address', placeholder: 'Sector 5, New Delhi' },
                { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
                { key: 'email', label: 'Email', placeholder: 'dr.rahul@clinic.com' },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={[styles.label, { color }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: `${color}40` }]}
                    placeholder={f.placeholder}
                    placeholderTextColor="#94a3b8"
                    value={(doctorInfo as any)[f.key]}
                    onChangeText={v => setDoctorInfo(prev => ({ ...prev, [f.key]: v }))}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ── Step 2: Patient Info ── */}
          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              {[
                { key: 'name', label: 'Patient Name *', placeholder: 'Arun Kumar' },
                { key: 'age', label: 'Age *', placeholder: '35 years', keyboard: 'default' },
                { key: 'gender', label: 'Gender', placeholder: 'Male / Female / Other' },
                { key: 'weight', label: 'Weight', placeholder: '70 kg' },
                { key: 'phone', label: 'Phone', placeholder: '+91 99000 00000' },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={[styles.label, { color }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: `${color}40` }]}
                    placeholder={f.placeholder}
                    placeholderTextColor="#94a3b8"
                    value={(patientInfo as any)[f.key]}
                    onChangeText={v => setPatientInfo(prev => ({ ...prev, [f.key]: v }))}
                  />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={[styles.label, { color }]}>Diagnosis *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: `${color}40` }]}
                  placeholder="e.g. Viral fever with upper respiratory tract infection"
                  placeholderTextColor="#94a3b8"
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color }]}>Symptoms / Chief Complaints</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: `${color}40` }]}
                  placeholder="e.g. Fever since 3 days, headache, body ache"
                  placeholderTextColor="#94a3b8"
                  value={symptoms}
                  onChangeText={setSymptoms}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          )}

          {/* ── Step 3: Medicines ── */}
          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>℞ Medicines</Text>
              <Text style={styles.hint}>Add all medicines for this prescription</Text>
              {medicines.map((med, idx) => (
                <MedicineRow
                  key={med.id} med={med} index={idx} color={color}
                  onUpdate={updateMedicine} onDelete={deleteMedicine}
                />
              ))}
              <Pressable style={[styles.addMedBtn, { borderColor: color }]} onPress={addMedicine}>
                <Ionicons name="add-circle-outline" size={18} color={color} />
                <Text style={[styles.addMedText, { color }]}>Add Another Medicine</Text>
              </Pressable>
              <View style={styles.field}>
                <Text style={[styles.label, { color }]}>Advice & Instructions</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: `${color}40` }]}
                  placeholder="e.g. Take rest, drink fluids, avoid cold food..."
                  placeholderTextColor="#94a3b8"
                  value={advice}
                  onChangeText={setAdvice}
                  multiline numberOfLines={3}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color }]}>Follow-up</Text>
                <TextInput
                  style={[styles.input, { borderColor: `${color}40` }]}
                  placeholder="e.g. After 5 days / 2 weeks"
                  placeholderTextColor="#94a3b8"
                  value={followUp}
                  onChangeText={setFollowUp}
                />
              </View>
            </View>
          )}

          {/* ── Step 4: Review & Export ── */}
          {step === 4 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Review & Export</Text>
              <View style={[styles.reviewCard, { backgroundColor: template.styles.bgColor, borderColor: color }]}>
                <View style={[styles.reviewHeader, { backgroundColor: color }]}>
                  <Text style={styles.reviewDrName}>Dr. {doctorInfo.name || 'Your Name'}</Text>
                  <Text style={styles.reviewDrSub}>{doctorInfo.qualification} {doctorInfo.specialization}</Text>
                  {doctorInfo.clinicName ? <Text style={styles.reviewClinic}>{doctorInfo.clinicName}</Text> : null}
                </View>
                <View style={styles.reviewBody}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewKey}>Patient:</Text>
                    <Text style={styles.reviewVal}>{patientInfo.name || '—'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewKey}>Age:</Text>
                    <Text style={styles.reviewVal}>{patientInfo.age || '—'} {patientInfo.gender}</Text>
                  </View>
                  {diagnosis ? (
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewKey}>Diagnosis:</Text>
                      <Text style={[styles.reviewVal, { flex: 1 }]}>{diagnosis}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.rxLabel, { borderColor: color }]}>
                    <Text style={[styles.rxText, { color }]}>℞ {medicines.filter(m => m.name).length} medicine(s) prescribed</Text>
                  </View>
                  {medicines.filter(m => m.name).map((m, i) => (
                    <Text key={m.id} style={styles.medLine}>{i + 1}. {m.name} {m.strength} — {m.frequency} × {m.duration}</Text>
                  ))}
                  {advice ? <Text style={styles.adviceLine}>💡 {advice}</Text> : null}
                </View>
              </View>

              {/* Export Buttons */}
              <Text style={[styles.label, { color, marginTop: 20 }]}>Export Options</Text>
              <View style={styles.exportBtns}>
                <Pressable style={[styles.exportBtn, { backgroundColor: color }]} onPress={handleDownload} disabled={saving}>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.exportBtnText}>Download PDF</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: '#1e40af' }]} onPress={handleShare} disabled={saving}>
                  <Ionicons name="share-social-outline" size={20} color="#fff" />
                  <Text style={styles.exportBtnText}>Share</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: '#7c3aed' }]} onPress={handleEmail} disabled={saving}>
                  <Ionicons name="mail-outline" size={20} color="#fff" />
                  <Text style={styles.exportBtnText}>Email</Text>
                </Pressable>
              </View>
              <Pressable style={styles.saveFinalBtn} onPress={async () => {
                setSaving(true)
                try {
                  const payload = {
                    title: `Rx: ${patientInfo.name || 'Prescription'}`,
                    status: 'complete' as const, mode: 'form' as const,
                    diagnosis, patient_info: patientInfo, doctor_info: doctorInfo,
                    medicines: medicines.filter(m => m.name),
                  }
                  if (id) await updatePrescription(id, payload)
                  else await createPrescription(payload)
                  Alert.alert('✅ Complete!', 'Prescription saved.', [{ text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard') }])
                } catch (err: any) { Alert.alert('Error', err.message) }
                finally { setSaving(false) }
              }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveFinalText}>✓ Complete & Save</Text>}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Nav */}
      {step < 4 && (
        <View style={[styles.bottomBar, { borderTopColor: `${color}20` }]}>
          <Pressable style={[styles.nextBtn, { backgroundColor: color }]} onPress={() => setStep(s => s + 1)}>
            <Text style={styles.nextBtnText}>Next: {steps[step + 1]} →</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  topMid: { flex: 1, alignItems: 'center', gap: 4 },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  saveText: { fontSize: 13, color: '#fff', fontWeight: '600', opacity: 0.85 },
  content: { padding: 16, paddingBottom: 40 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  hint: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fff', color: '#1e293b' },
  textArea: { height: 80, textAlignVertical: 'top' },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, padding: 14, justifyContent: 'center' },
  addMedText: { fontSize: 14, fontWeight: '700' },
  preview: { borderWidth: 2, borderRadius: 16, padding: 20, gap: 8, marginTop: 8 },
  previewTitle: { fontSize: 17, fontWeight: '800' },
  previewDesc: { fontSize: 13, color: '#475569' },
  previewBar: { height: 3, borderRadius: 99, marginVertical: 4 },
  previewLayout: { fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' },
  reviewCard: { borderWidth: 2, borderRadius: 16, overflow: 'hidden' },
  reviewHeader: { padding: 16 },
  reviewDrName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  reviewDrSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  reviewClinic: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  reviewBody: { padding: 16, gap: 8 },
  reviewRow: { flexDirection: 'row', gap: 8 },
  reviewKey: { fontSize: 12, fontWeight: '700', color: '#64748b', width: 70 },
  reviewVal: { fontSize: 13, color: '#1e293b', fontWeight: '500' },
  rxLabel: { borderWidth: 1, borderRadius: 8, padding: 8, marginVertical: 4 },
  rxText: { fontSize: 13, fontWeight: '700' },
  medLine: { fontSize: 13, color: '#374151', paddingLeft: 4 },
  adviceLine: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 },
  exportBtns: { gap: 10, marginTop: 4 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  saveFinalBtn: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveFinalText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bottomBar: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1 },
  nextBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
