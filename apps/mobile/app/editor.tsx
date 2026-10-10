import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MOBILE_TEMPLATES, type Template } from '../lib/templates'
import type { Medicine, PrescriptionData } from '../lib/pdf-generator'
import { generatePrescriptionHTML } from '../lib/pdf-generator'
import { createPrescription, updatePrescription, getPrescription } from '../lib/prescriptions'
import { DIAGNOSIS_TEMPLATES, searchTemplates, type DiagnosisTemplate } from '../lib/diagnosis-templates'
import { checkInteractions, type ActiveAlert } from '../lib/medicine-interactions'
import { searchMedicines, type MedicineEntry } from '../lib/medicine-db'
import { type LanguageCode, LANGUAGES } from '../lib/translations'
import { getDoctorProfile } from '../lib/local-store'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as MailComposer from 'expo-mail-composer'

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'

// ─── Step Indicator ───────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            stepStyles.dot,
            i < current && { backgroundColor: Colors.white, width: 24, opacity: 1 },
            i === current && { backgroundColor: Colors.white, opacity: 1 },
          ]}
        />
      ))}
    </View>
  )
}
const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: Colors.white, opacity: 0.3 },
})

// ─── Template Picker ──────────────────────────────────────────────
function TemplatePicker({ selected, onSelect }: { selected: Template; onSelect: (t: Template) => void }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'clinic', label: 'Clinic' },
    { id: 'hospital', label: 'Hospital' },
    { id: 'specialty', label: 'Specialty' },
    { id: 'general', label: 'General' },
  ]
  const filtered = activeCategory === 'all' ? MOBILE_TEMPLATES : MOBILE_TEMPLATES.filter(t => t.category === activeCategory)

  return (
    <View style={tpStyles.root}>
      {/* Category pills */}
      <View style={tpStyles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tpStyles.catRow}>
          {categories.map(c => (
            <Pressable
              key={c.id}
              style={[tpStyles.catPill, activeCategory === c.id && tpStyles.catPillActive]}
              onPress={() => setActiveCategory(c.id)}
            >
              <Text style={[tpStyles.catPillText, activeCategory === c.id && tpStyles.catPillTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Template grid */}
      <View style={tpStyles.grid}>
        {filtered.map((t) => {
          const isSelected = selected.id === t.id
          return (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t)}
              style={[
                tpStyles.card,
                isSelected && tpStyles.cardSelected,
              ]}
            >
              {/* Thumbnail image */}
              <View style={tpStyles.imageWrap}>
                <Image source={t.image} style={tpStyles.cardImage} resizeMode="cover" />
                {t.isPremium && (
                  <View style={tpStyles.proBadge}>
                    <Text style={tpStyles.proBadgeText}>PRO</Text>
                  </View>
                )}
                {isSelected && (
                  <View style={tpStyles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>

              {/* Color bar */}
              <View style={[tpStyles.colorBar, { backgroundColor: t.styles.primaryColor }]} />

              {/* Card info */}
              <View style={tpStyles.cardBody}>
                <Text style={[tpStyles.cardName, isSelected && { color: t.styles.primaryColor }]} numberOfLines={1}>
                  {t.name}
                </Text>
                <Text style={tpStyles.cardDesc} numberOfLines={2}>{t.description}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const tpStyles = StyleSheet.create({
  root: { marginBottom: 12 },
  catContainer: { marginBottom: 12 },
  catRow: { gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F4F7FF', borderWidth: 1.5, borderColor: '#E8EEF8' },
  catPillActive: { backgroundColor: '#102A56', borderColor: '#102A56' },
  catPillText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catPillTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#E8EEF8',
    shadowColor: '#102A56', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardSelected: {
    borderColor: '#155EEF', borderWidth: 2.5,
    shadowColor: '#155EEF', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  imageWrap: { width: '100%', height: 110, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  proBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  checkBadge: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#155EEF', alignItems: 'center', justifyContent: 'center' },
  colorBar: { height: 3, width: '100%' },
  cardBody: { padding: 10, gap: 3 },
  cardName: { fontSize: 13, fontWeight: '800', color: '#102A56', lineHeight: 17 },
  cardDesc: { fontSize: 11, color: '#64748b', lineHeight: 15, fontWeight: '500' },
})

// ─── Medicine Row ─────────────────────────────────────────────────
function MedicineRow({ med, index, onUpdate, onDelete }: {
  med: Medicine; index: number; onUpdate: (id: string, field: keyof Medicine, val: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const handleSelectMed = (entry: MedicineEntry) => {
    onUpdate(med.id, 'name', entry.name)
    onUpdate(med.id, 'strength', entry.commonStrengths[0] || '')
    onUpdate(med.id, 'frequency', entry.commonFrequency)
    onUpdate(med.id, 'duration', entry.commonDuration)
    setShowSuggestions(false)
  }

  const results = showSuggestions ? searchMedicines(med.name) : []

  return (
    <View style={medStyles.container}>
      <View style={medStyles.header}>
        <Text style={medStyles.num}>Medicine #{index + 1}</Text>
        <Pressable onPress={() => onDelete(med.id)} style={medStyles.delBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </Pressable>
      </View>
      <View style={{ zIndex: 10 }}>
        <TextInput 
          style={medStyles.nameInput} 
          placeholder="Medicine name *" 
          value={med.name}
          onChangeText={v => {
            onUpdate(med.id, 'name', v)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholderTextColor={Colors.textMuted} 
        />
        {results.length > 0 && (
          <View style={medStyles.suggestionBox}>
            {results.map((r, i) => (
              <Pressable key={i} style={medStyles.suggestionItem} onPress={() => handleSelectMed(r)}>
                <Text style={medStyles.suggName}>{r.name}</Text>
                <Text style={medStyles.suggCat}>{r.category}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <View style={medStyles.row}>
        <TextInput style={[medStyles.smallInput, { flex: 1 }]} placeholder="Strength (500mg)" value={med.strength}
          onChangeText={v => onUpdate(med.id, 'strength', v)} placeholderTextColor={Colors.textMuted} />
        <TextInput style={[medStyles.smallInput, { flex: 1 }]} placeholder="Freq (1-0-1)" value={med.frequency}
          onChangeText={v => onUpdate(med.id, 'frequency', v)} placeholderTextColor={Colors.textMuted} />
        <TextInput style={[medStyles.smallInput, { flex: 0.8 }]} placeholder="Duration" value={med.duration}
          onChangeText={v => onUpdate(med.id, 'duration', v)} placeholderTextColor={Colors.textMuted} />
      </View>
      <TextInput style={medStyles.instructInput} placeholder="Instructions (e.g. after meals)" value={med.instructions}
        onChangeText={v => onUpdate(med.id, 'instructions', v)} placeholderTextColor={Colors.textMuted} />
    </View>
  )
}
const medStyles = StyleSheet.create({
  container: { 
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 14, marginBottom: Spacing.sm, 
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  num: { ...Typography.labelSm, color: Colors.primaryBlue },
  delBtn: { padding: 4 },
  nameInput: { 
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, 
    fontSize: 15, color: Colors.textPrimary, marginBottom: 8, fontWeight: '600',
    backgroundColor: Colors.paleBlue
  },
  suggestionBox: { 
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, 
    borderRadius: Radius.sm, marginTop: -4, marginBottom: 8, ...Shadow.md,
    maxHeight: 150, overflow: 'scroll'
  },
  suggestionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.surface },
  suggName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  suggCat: { fontSize: 11, color: Colors.textSecondary },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  smallInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 10, fontSize: 13, color: Colors.textPrimary },
  instructInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 10, fontSize: 13, color: Colors.textPrimary },
})

// ─── Main Editor Screen ───────────────────────────────────────────
export default function PrescriptionEditor() {
  const { id, clone_id, templateId, prefill_name, prefill_phone, prefill_age, prefill_gender, prefill_weight } = useLocalSearchParams<{
    id?: string; clone_id?: string; templateId?: string; prefill_name?: string;
    prefill_phone?: string; prefill_age?: string; prefill_gender?: string; prefill_weight?: string;
  }>()
  const initialTemplate = templateId ? (MOBILE_TEMPLATES.find(t => t.id === templateId) || MOBILE_TEMPLATES[0]) : MOBILE_TEMPLATES[0]
  const [step, setStep] = useState(templateId ? 1 : 0)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<Template>(initialTemplate)
  const [language, setLanguage] = useState<LanguageCode>('en')

  const [doctorInfo, setDoctorInfo] = useState({
    name: '', qualification: '', specialization: '', regNo: '',
    clinicName: '', address: '', phone: '', email: '',
    logoUrl: '', stampUrl: '', signature: ''
  })
  const [patientInfo, setPatientInfo] = useState({
    name: prefill_name ?? '', age: prefill_age ?? '', gender: prefill_gender ?? '',
    weight: prefill_weight ?? '', phone: prefill_phone ?? '',
  })
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: '1', name: '', strength: '', frequency: '', duration: '', instructions: '' }
  ])
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [labTests, setLabTests] = useState<string[]>([])
  const [templateSearch, setTemplateSearch] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Load doctor profile on mount
  useEffect(() => {
    getDoctorProfile().then(p => {
      if (p?.name) setDoctorInfo({
        name: p.name, qualification: p.qualification, specialization: p.specialization,
        regNo: p.regNo, clinicName: p.clinicName, address: p.address,
        phone: p.phone, email: p.email,
        logoUrl: p.logoUrl || '', stampUrl: p.stampUrl || '', signature: p.signature || ''
      })
    })
  }, [])

  // If clone_id passed → load old prescription and pre-fill
  useEffect(() => {
    if (!clone_id) return
    getPrescription(clone_id).then(old => {
      if (!old) return
      if (old.patient_info) setPatientInfo(old.patient_info)
      if (old.doctor_info) setDoctorInfo(old.doctor_info)
      if (old.diagnosis) setDiagnosis(old.diagnosis)
      if (old.medicines?.length) {
        setMedicines(old.medicines.map((m: any, i: number) => ({ ...m, id: m.id ?? String(i + 1) })))
      }
      if ((old as any).lab_tests) {
        setLabTests((old as any).lab_tests.split(',').map((s: string) => s.trim()).filter(Boolean))
      }
      setStep(2)
    })
  }, [clone_id])

  const activeAlerts = checkInteractions(medicines)

  const addMedicine = () => {
    setMedicines(prev => [...prev, { id: Date.now().toString(), name: '', strength: '', frequency: '', duration: '', instructions: '' }])
  }

  const updateMedicine = (id: string, field: keyof Medicine, val: string) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m))
  }

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
  }

  const applyDiagnosisTemplate = (tpl: DiagnosisTemplate) => {
    setDiagnosis(tpl.diagnosis)
    setSymptoms(tpl.symptoms)
    
    const newMeds = tpl.medicines.map((m, i) => ({
      id: `tpl-${Date.now()}-${i}`,
      name: m.name, strength: m.strength, frequency: m.frequency,
      duration: m.duration, instructions: m.instructions
    }))
    
    if (medicines.length === 1 && !medicines[0].name) {
      setMedicines(newMeds)
    } else {
      setMedicines(prev => [...prev, ...newMeds])
    }
    
    if (tpl.advice) setAdvice(prev => prev ? `${prev}\n${tpl.advice}` : tpl.advice)
    if (tpl.followUp) setFollowUp(tpl.followUp)
    if (tpl.labTests && tpl.labTests.length > 0) {
      setLabTests(prev => Array.from(new Set([...prev, ...tpl.labTests!])))
    }
    
    setShowTemplateModal(false)
    Alert.alert('Template Applied', `${tpl.name} template has been applied to this prescription.`)
  }

  const getPrescriptionData = (): PrescriptionData => ({
    template, doctorInfo, patientInfo, diagnosis, symptoms,
    medicines: medicines.filter(m => m.name.trim()),
    advice, followUp, labTests,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    language,
  })

  const generateAndGetUri = async (): Promise<string> => {
    const html = generatePrescriptionHTML(getPrescriptionData())
    
    if (Platform.OS === 'web') {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      iframe.style.visibility = 'hidden'
      document.body.appendChild(iframe)
      iframe.contentDocument?.open()
      iframe.contentDocument?.write(html)
      iframe.contentDocument?.close()
      
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
          setTimeout(() => document.body.removeChild(iframe), 2000)
          resolve('web-printed')
        }, 500)
      })
    }

    const { uri } = await Print.printToFileAsync({ html, base64: false })
    // @ts-ignore
    const dest = `${FileSystem.documentDirectory}prescription_${patientInfo.name.replace(/\s/g, '_') || 'rx'}_${Date.now()}.pdf`
    await FileSystem.moveAsync({ from: uri, to: dest })
    return dest
  }

  const handleExportAction = async (action: 'download' | 'share' | 'email' | 'whatsapp') => {
    setSaving(true)
    try {
      const uri = await generateAndGetUri()
      if (Platform.OS === 'web') return
      
      switch (action) {
        case 'download':
        case 'share':
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription' })
          break
        case 'email':
          const available = await MailComposer.isAvailableAsync()
          if (!available) {
            Alert.alert('Not Available', 'Email is not available on this device.')
            return
          }
          await MailComposer.composeAsync({
            subject: `Prescription for ${patientInfo.name}`,
            body: `Dear ${patientInfo.name},\n\nPlease find your prescription attached.\n\nDr. ${doctorInfo.name}\n${doctorInfo.clinicName}`,
            recipients: [],
            attachments: [uri],
          })
          break
        case 'whatsapp':
          if (Platform.OS === 'android') {
             await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share via WhatsApp' })
          } else {
             await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' })
          }
          break
      }
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
        status: 'draft' as const, mode: 'form' as const,
        diagnosis, patient_info: patientInfo, doctor_info: doctorInfo,
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
      <View style={styles.topBar}>
        <Pressable onPress={() => step > 0 ? setStep(s => s - 1) : router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')} style={styles.backBtn}>
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={22} color={Colors.white} />
        </Pressable>
        <View style={styles.topMid}>
          <Text style={styles.topTitle}>{steps[step]}</Text>
          <StepDots current={step} total={steps.length} />
        </View>
        <Pressable onPress={handleSaveDraft} disabled={saving} style={styles.draftBtn}>
          <Text style={styles.saveText}>{saving ? '...' : 'Save Draft'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Step 0: Template ── */}
          {step === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Layout</Text>
              <Text style={styles.hint}>Select the design style for your prescription</Text>
              <TemplatePicker selected={template} onSelect={setTemplate} />
              
              <View style={{ marginVertical: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#102A56', marginBottom: 8 }}>📋 Preview: {template.name}</Text>
                <View style={[styles.preview, { borderColor: template.styles.primaryColor }]}>
                  <Image 
                    source={template.image} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Patient Language 🇮🇳</Text>
              <Text style={styles.hint}>Medical instructions will be translated</Text>
              <View style={styles.langGrid}>
                {LANGUAGES.map(lang => (
                  <Pressable
                    key={lang.code}
                    onPress={() => setLanguage(lang.code as LanguageCode)}
                    style={[
                      styles.langBtn,
                      language === lang.code && styles.langBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.langText,
                      language === lang.code && styles.langTextActive
                    ]}>{lang.label}</Text>
                  </Pressable>
                ))}
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
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
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
                { key: 'age', label: 'Age *', placeholder: '35 years' },
                { key: 'gender', label: 'Gender', placeholder: 'Male / Female / Other' },
                { key: 'weight', label: 'Weight', placeholder: '70 kg' },
                { key: 'phone', label: 'Phone', placeholder: '+91 99000 00000' },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={(patientInfo as any)[f.key]}
                    onChangeText={v => setPatientInfo(prev => ({ ...prev, [f.key]: v }))}
                  />
                </View>
              ))}
              
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>Diagnosis *</Text>
                  <Pressable 
                    onPress={() => setShowTemplateModal(true)}
                    style={styles.useTplBtn}
                  >
                    <Ionicons name="flash" size={14} color={Colors.white} />
                    <Text style={styles.useTplBtnText}>Use Template</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. Viral fever with URTI"
                  placeholderTextColor={Colors.textMuted}
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  multiline numberOfLines={3}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Symptoms / Chief Complaints</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. Fever since 3 days, headache"
                  placeholderTextColor={Colors.textMuted}
                  value={symptoms}
                  onChangeText={setSymptoms}
                  multiline numberOfLines={2}
                />
              </View>
            </View>
          )}

          {/* ── Step 3: Medicines ── */}
          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>℞ Medicines</Text>
              <Text style={styles.hint}>Add all medicines for this prescription</Text>
              
              {activeAlerts.length > 0 && (
                <View style={styles.alertBox}>
                  <View style={styles.alertHeader}>
                    <Ionicons name="warning" size={16} color={Colors.error} />
                    <Text style={styles.alertTitle}>Interaction Alerts ({activeAlerts.length})</Text>
                  </View>
                  {activeAlerts.map((alert, i) => (
                    <View key={i} style={{ marginBottom: i < activeAlerts.length - 1 ? 8 : 0 }}>
                      <Text style={styles.alertDrugs}>{alert.foundDrugs[0]} + {alert.foundDrugs[1]}</Text>
                      <Text style={styles.alertDesc}>{alert.interaction.description}</Text>
                      <Text style={styles.alertRec}>Recommended: {alert.interaction.recommendation}</Text>
                    </View>
                  ))}
                </View>
              )}

              {medicines.map((med, idx) => (
                <MedicineRow
                  key={med.id} med={med} index={idx}
                  onUpdate={updateMedicine} onDelete={deleteMedicine}
                />
              ))}
              
              <Pressable style={styles.addMedBtn} onPress={addMedicine}>
                <Ionicons name="add-circle" size={20} color={Colors.primaryBlue} />
                <Text style={styles.addMedText}>Add Another Medicine</Text>
              </Pressable>
              
              <View style={styles.field}>
                <Text style={styles.label}>Lab Tests / Investigations</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. CBC, LFT, Chest X-Ray..."
                  placeholderTextColor={Colors.textMuted}
                  value={labTests.join(', ')}
                  onChangeText={(val) => setLabTests(val.split(',').map(s => s.trim()).filter(s => s))}
                  multiline numberOfLines={3}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Advice & Instructions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. Take rest, drink fluids..."
                  placeholderTextColor={Colors.textMuted}
                  value={advice}
                  onChangeText={setAdvice}
                  multiline numberOfLines={3}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Follow-up</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. After 5 days"
                  placeholderTextColor={Colors.textMuted}
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
              <Text style={styles.hint}>Verify details before generating PDF</Text>
              
              <View style={[styles.reviewCard, { backgroundColor: template.styles.bgColor }]}>
                <View style={[styles.reviewHeader, { backgroundColor: template.styles.primaryColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewDrName}>Dr. {doctorInfo.name || 'Your Name'}</Text>
                    <Text style={styles.reviewDrSub}>{doctorInfo.qualification} {doctorInfo.specialization}</Text>
                    {doctorInfo.clinicName ? <Text style={styles.reviewClinic}>{doctorInfo.clinicName}</Text> : null}
                  </View>
                </View>
                <View style={styles.reviewBody}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewKey}>Patient:</Text>
                    <Text style={styles.reviewVal}>{patientInfo.name || '—'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewKey}>Age / Sex:</Text>
                    <Text style={styles.reviewVal}>{patientInfo.age || '—'} {patientInfo.gender}</Text>
                  </View>
                  {diagnosis ? (
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewKey}>Diagnosis:</Text>
                      <Text style={[styles.reviewVal, { flex: 1 }]}>{diagnosis}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.rxLabel, { borderColor: template.styles.primaryColor }]}>
                    <Text style={[styles.rxText, { color: template.styles.primaryColor }]}>℞ {medicines.filter(m => m.name).length} medicine(s) prescribed</Text>
                  </View>
                  {medicines.filter(m => m.name).map((m, i) => (
                    <Text key={m.id} style={styles.medLine}>{i + 1}. {m.name} {m.strength} — {m.frequency} × {m.duration}</Text>
                  ))}
                  {advice ? <Text style={styles.adviceLine}>💡 {advice}</Text> : null}
                </View>
              </View>

              {/* Export Buttons */}
              <Text style={[styles.label, { marginTop: 20 }]}>Export Options</Text>
              <View style={styles.exportGrid}>
                <Pressable style={[styles.exportBtn, { backgroundColor: '#25D366' }]} onPress={() => handleExportAction('whatsapp')} disabled={saving}>
                  <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>WhatsApp</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: Colors.primaryBlue }]} onPress={() => handleExportAction('download')} disabled={saving}>
                  <Ionicons name="download-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Save PDF</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: Colors.darkNavy }]} onPress={() => handleExportAction('email')} disabled={saving}>
                  <Ionicons name="mail-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Email</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: Colors.textSecondary }]} onPress={() => handleExportAction('share')} disabled={saving}>
                  <Ionicons name="share-social-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Share</Text>
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
                    lab_tests: labTests.join(', '),
                    advice, follow_up_date: followUp
                  }
                  if (id) await updatePrescription(id, payload)
                  else await createPrescription(payload)
                  Alert.alert('✅ Complete!', 'Prescription saved to records.', [{ text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard') }])
                } catch (err: any) { Alert.alert('Error', err.message) }
                finally { setSaving(false) }
              }}>
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveFinalText}>✓ Save to Records</Text>}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Nav */}
      {step < 4 && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.nextBtn} onPress={() => setStep(s => s + 1)}>
            <Text style={styles.nextBtnText}>Next: {steps[step + 1]} →</Text>
          </Pressable>
        </View>
      )}

      {/* Diagnosis Template Modal */}
      <Modal visible={showTemplateModal} transparent animationType="slide" onRequestClose={() => setShowTemplateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diagnosis Templates</Text>
              <Pressable onPress={() => setShowTemplateModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search templates (e.g. Viral Fever)"
                value={templateSearch}
                onChangeText={setTemplateSearch}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <FlatList 
              data={searchTemplates(templateSearch)}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Pressable style={styles.templateItem} onPress={() => applyDiagnosisTemplate(item)}>
                  <View style={styles.templateIcon}>
                    <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <Text style={styles.templateCategory}>{item.category} • {item.medicines.length} medicines</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },
  
  // Top Bar (Royal Blue)
  topBar: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.darkNavy,
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12 
  },
  backBtn: { padding: 4 },
  topMid: { flex: 1, alignItems: 'center', gap: 6 },
  topTitle: { ...Typography.h4, color: Colors.white },
  draftBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  saveText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
  
  content: { padding: Spacing.md, paddingBottom: 40 },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 2 },
  hint: { ...Typography.bodySm, color: Colors.textSecondary, marginBottom: 8 },
  
  field: { gap: 6, marginBottom: 8 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...Typography.label, color: Colors.primaryBlue },
  input: { 
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, 
    padding: 12, fontSize: 15, backgroundColor: Colors.white, color: Colors.textPrimary,
    fontWeight: '500'
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  useTplBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    backgroundColor: Colors.primaryBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
    ...Shadow.sm
  },
  useTplBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  
  addMedBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.lightBlue,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primaryBlue, 
    borderRadius: Radius.md, padding: 14, justifyContent: 'center',
    marginBottom: Spacing.sm
  },
  addMedText: { fontSize: 14, fontWeight: '700', color: Colors.primaryBlue },
  
  preview: { 
    borderWidth: 2, borderRadius: Radius.lg, padding: 0, overflow: 'hidden',
    aspectRatio: 1588/2246, marginTop: 8, ...Shadow.md
  },
  
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  langBtn: { 
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white 
  },
  langBtnActive: { borderColor: Colors.primaryBlue, backgroundColor: Colors.primaryBlue },
  langText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  langTextActive: { color: Colors.white, fontWeight: '700' },
  
  alertBox: { backgroundColor: Colors.errorLight, borderRadius: Radius.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  alertTitle: { fontWeight: '700', color: Colors.error, fontSize: 13 },
  alertDrugs: { fontSize: 13, fontWeight: '700', color: '#991b1b' },
  alertDesc: { fontSize: 12, color: '#b91c1c', marginTop: 2 },
  alertRec: { fontSize: 11, color: Colors.error, marginTop: 4, fontWeight: '600' },
  
  reviewCard: { borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md },
  reviewHeader: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  reviewDrName: { fontSize: 17, fontWeight: '800', color: Colors.white },
  reviewDrSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  reviewClinic: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  reviewBody: { padding: 16, gap: 8 },
  reviewRow: { flexDirection: 'row', gap: 8 },
  reviewKey: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, width: 70 },
  reviewVal: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  rxLabel: { borderWidth: 1, borderRadius: Radius.sm, padding: 8, marginVertical: 4, backgroundColor: Colors.white },
  rxText: { fontSize: 13, fontWeight: '800' },
  medLine: { fontSize: 13, color: Colors.textPrimary, paddingLeft: 4, fontWeight: '500' },
  adviceLine: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
  
  exportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  exportBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.md, ...Shadow.sm },
  exportBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  
  saveFinalBtn: { backgroundColor: Colors.success, padding: 16, borderRadius: Radius.md, alignItems: 'center', marginTop: 12, ...Shadow.sm },
  saveFinalText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  
  bottomBar: { backgroundColor: Colors.white, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadow.md },
  nextBtn: { backgroundColor: Colors.primaryBlue, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', ...Shadow.blue },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(16, 42, 86, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '80%', padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { ...Typography.h3, color: Colors.textPrimary },
  modalClose: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, backgroundColor: Colors.paleBlue, marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary, marginLeft: 8 },
  templateItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  templateIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paleBlue, borderRadius: Radius.sm, marginRight: 12 },
  templateName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  templateCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
})
