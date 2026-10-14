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
import * as FileSystem from 'expo-file-system/legacy'
import * as MailComposer from 'expo-mail-composer'
import { downloadPrescriptionPdf, printCleanPrescription } from '../lib/pdf-export-service'

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'
import TestPresetModal from '../components/TestPresetModal'
import { getTestPresetByTemplateId, type TestPreset } from '../lib/test-presets'

// ─── Step Indicator ───────────────────────────────────────────────
function StepDots({
  current,
  total,
  onSelectStep,
}: {
  current: number
  total: number
  onSelectStep?: (i: number) => void
}) {
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Pressable
          key={i}
          disabled={!onSelectStep}
          onPress={() => onSelectStep?.(i)}
          hitSlop={8}
          style={[
            stepStyles.dot,
            i < current && { backgroundColor: Colors.white, width: 22, opacity: 1 },
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
function TemplatePicker({
  selected,
  onSelect,
  onSelectAndProceed,
}: {
  selected: Template
  onSelect: (t: Template) => void
  onSelectAndProceed?: (t: Template) => void
}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [modalTmpl, setModalTmpl] = useState<Template | null>(null)

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
              onPress={() => {
                onSelect(t)
                setModalTmpl(t)
              }}
              style={[
                tpStyles.card,
                isSelected && tpStyles.cardSelected,
              ]}
            >
              {/* Thumbnail image */}
              <View style={tpStyles.imageWrap}>
                <Image source={t.image} style={tpStyles.cardImage} resizeMode="contain" />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="eye-outline" size={12} color="#155EEF" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#155EEF' }}>Tap to Preview & Select</Text>
                </View>
              </View>
            </Pressable>
          )
        })}
      </View>

      {/* Pop-up Modal when user taps any template card */}
      {modalTmpl && (
        <Modal
          visible={!!modalTmpl}
          animationType="slide"
          transparent
          onRequestClose={() => setModalTmpl(null)}
        >
          <View style={tpStyles.popupOverlay}>
            <View style={tpStyles.popupCard}>
              {/* Header */}
              <View style={tpStyles.popupHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 24 }}>{modalTmpl.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={tpStyles.popupTitle} numberOfLines={1}>{modalTmpl.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <View style={[tpStyles.categoryBadge, { backgroundColor: modalTmpl.styles.primaryColor + '18' }]}>
                        <Text style={[tpStyles.categoryBadgeText, { color: modalTmpl.styles.primaryColor }]}>
                          {modalTmpl.category.toUpperCase()}
                        </Text>
                      </View>
                      <View style={tpStyles.fullPageBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                        <Text style={tpStyles.fullPageBadgeText}>Full A4 Page</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Pressable style={tpStyles.popupCloseBtn} onPress={() => setModalTmpl(null)}>
                  <Ionicons name="close" size={22} color="#475569" />
                </Pressable>
              </View>

              {/* Scrollable preview body */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={tpStyles.popupScroll}
                showsVerticalScrollIndicator={true}
              >
                <View style={tpStyles.descBox}>
                  <Ionicons name="information-circle" size={16} color="#155EEF" />
                  <Text style={tpStyles.descText}>{modalTmpl.description}</Text>
                </View>

                {/* Complete A4 preview image with 100% visibility (no cut-off) */}
                <View style={[tpStyles.previewFrame, { borderColor: modalTmpl.styles.primaryColor }]}>
                  <Image
                    source={modalTmpl.image}
                    style={tpStyles.previewImg}
                    resizeMode="contain"
                  />
                </View>
                <Text style={tpStyles.previewFootNote}>100% Complete A4 layout • Header, Patient Details & Doctor Signature</Text>
              </ScrollView>

              {/* Bottom Sticky Action Footer */}
              <View style={tpStyles.popupFooter}>
                <Pressable
                  style={tpStyles.popupCancelBtn}
                  onPress={() => setModalTmpl(null)}
                >
                  <Text style={tpStyles.popupCancelText}>Explore Others</Text>
                </Pressable>

                <Pressable
                  style={[tpStyles.popupSelectBtn, { backgroundColor: modalTmpl.styles.primaryColor }]}
                  onPress={() => {
                    if (onSelectAndProceed) {
                      onSelectAndProceed(modalTmpl)
                    } else {
                      onSelect(modalTmpl)
                    }
                    setModalTmpl(null)
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={tpStyles.popupSelectText}>✓ Select & Use This Template</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  imageWrap: { width: '100%', height: 136, backgroundColor: '#f8fafc', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  proBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  checkBadge: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#155EEF', alignItems: 'center', justifyContent: 'center' },
  colorBar: { height: 3, width: '100%' },
  cardBody: { padding: 10, gap: 3 },
  cardName: { fontSize: 13, fontWeight: '800', color: '#102A56', lineHeight: 17 },
  cardDesc: { fontSize: 11, color: '#64748b', lineHeight: 15, fontWeight: '500' },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  popupCard: {
    width: '100%',
    maxWidth: 580,
    height: '92%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  popupTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  categoryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800' },
  fullPageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fullPageBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  popupCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  popupScroll: { padding: 16, paddingBottom: 24, alignItems: 'center' },
  descBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10, width: '100%', marginBottom: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  descText: { fontSize: 12, color: '#1e40af', fontWeight: '600', flex: 1, lineHeight: 16 },
  previewFrame: {
    width: '100%',
    aspectRatio: 1588 / 2246,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  previewImg: { width: '100%', height: '100%' },
  previewFootNote: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 10, fontWeight: '500' },
  popupFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  popupCancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCancelText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  popupSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  popupSelectText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
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
  const [fullscreenPreview, setFullscreenPreview] = useState<Template | null>(null)

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
  const [showTestModal, setShowTestModal] = useState(false)

  const handleApplyPreset = (preset: TestPreset, jumpDirectly: boolean) => {
    const tmpl = MOBILE_TEMPLATES.find(t => t.id === preset.templateId) || MOBILE_TEMPLATES[0]
    setTemplate(tmpl)
    setDoctorInfo({
      name: preset.doctor.name,
      qualification: preset.doctor.qualification,
      specialization: preset.doctor.specialization,
      regNo: preset.doctor.regNo,
      clinicName: preset.doctor.clinicName,
      address: preset.doctor.address,
      phone: preset.doctor.phone,
      email: preset.doctor.email,
      logoUrl: '',
      stampUrl: '',
      signature: '',
    })
    setPatientInfo({
      name: preset.patient.name,
      age: preset.patient.age,
      gender: preset.patient.gender,
      weight: preset.patient.weight,
      phone: preset.patient.phone,
    })
    setDiagnosis(preset.patient.diagnosis)
    setSymptoms(preset.symptoms)
    setMedicines(preset.medicines.map((m, i) => ({
      id: `med-tp-${Date.now()}-${i + 1}`,
      name: m.name,
      strength: m.strength,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
      form: m.form || 'tablet',
    })))
    setAdvice(preset.advice)
    setFollowUp(preset.followUp)
    setLabTests(preset.labTests)
    if (preset.language) {
      setLanguage(preset.language)
    }
    if (jumpDirectly) {
      setStep(4) // Directly to Review / PDF screen
    } else {
      setStep(3) // To Medicines screen
    }
  }

  const handleQuickFillCurrent = (jumpDirectly: boolean = false) => {
    const preset = getTestPresetByTemplateId(template.id)
    handleApplyPreset(preset, jumpDirectly)
  }

  const [profileLoaded, setProfileLoaded] = useState(false)

  // Load doctor profile on mount
  useEffect(() => {
    getDoctorProfile().then(p => {
      if (p?.name) {
        setDoctorInfo({
          name: p.name, qualification: p.qualification || '', specialization: p.specialization || '',
          regNo: p.regNo || '', clinicName: p.clinicName || '', address: p.address || '',
          phone: p.phone || '', email: p.email || '',
          logoUrl: p.logoUrl || '', stampUrl: p.stampUrl || '', signature: p.signature || ''
        })
        setProfileLoaded(true)
      }
    })
  }, [])

  const handleTemplateSelectAndProceed = (t: Template) => {
    setTemplate(t)
    // If doctor profile is already present from saved profile, go directly to Patient Info (step 2)!
    // If not filled, go to Doctor Info (step 1) to prompt for details.
    if (doctorInfo.name?.trim()) {
      setStep(2)
    } else {
      setStep(1)
    }
  }

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

  const handleExportAction = async (action: 'download' | 'print' | 'share' | 'email' | 'whatsapp') => {
    setSaving(true)
    try {
      const html = generatePrescriptionHTML(getPrescriptionData())
      const filename = `Prescription_${(patientInfo.name || 'Patient').replace(/\s+/g, '_')}.pdf`

      if (action === 'download') {
        await downloadPrescriptionPdf({ html, filename })
        return
      }

      if (action === 'print') {
        await printCleanPrescription({ html })
        return
      }

      if (Platform.OS === 'web') {
        if (action === 'whatsapp') {
          const text = encodeURIComponent(`Prescription for ${patientInfo.name || 'Patient'} by Dr. ${doctorInfo.name || 'Doctor'}`)
          window.open(`https://wa.me/?text=${text}`, '_blank')
          return
        }
        if (action === 'email') {
          const subject = encodeURIComponent(`Prescription for ${patientInfo.name || 'Patient'}`)
          const body = encodeURIComponent(`Dear ${patientInfo.name || 'Patient'},\n\nPlease find your prescription attached.\n\nDr. ${doctorInfo.name}\n${doctorInfo.clinicName}`)
          window.open(`mailto:${doctorInfo.email || ''}?subject=${subject}&body=${body}`, '_blank')
          return
        }
        // Share on web
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
          try {
            await (navigator as any).share({
              title: `Prescription for ${patientInfo.name || 'Patient'}`,
              text: `Prescription from Dr. ${doctorInfo.name}`,
            })
          } catch (_) {}
        } else {
          await downloadPrescriptionPdf({ html, filename })
        }
        return
      }

      // Native flow (iOS / Android)
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      switch (action) {
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
      Alert.alert('Export Error', err.message)
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
          <StepDots current={step} total={steps.length} onSelectStep={setStep} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Pressable onPress={() => setShowTestModal(true)} style={styles.testBtn}>
            <Ionicons name="flask" size={13} color="#fff" />
            <Text style={styles.testBtnText}>⚡ Test</Text>
          </Pressable>
          <Pressable onPress={handleSaveDraft} disabled={saving} style={styles.draftBtn}>
            <Text style={styles.saveText}>{saving ? '...' : 'Save Draft'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Test Presets Quick Bar (Visible across all steps) */}
      <View style={styles.testPresetsBar}>
        <View style={styles.testPresetsLeft}>
          <Ionicons name="flask" size={14} color="#155EEF" />
          <Text style={styles.testPresetsTitle} numberOfLines={1}>Test: {template.name}</Text>
        </View>
        <View style={styles.testPresetsBtns}>
          <Pressable
            style={styles.testQuickBtn}
            onPress={() => handleQuickFillCurrent(true)}
          >
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={styles.testQuickBtnText}>1-Tap Fill & Preview</Text>
          </Pressable>
          <Pressable
            style={styles.testAllBtn}
            onPress={() => setShowTestModal(true)}
          >
            <Ionicons name="list" size={12} color="#155EEF" />
            <Text style={styles.testAllBtnText}>10 Presets</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Step 0: Template ── */}
          {step === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Layout</Text>
              <Text style={styles.hint}>Select the design style for your prescription</Text>

              {/* Doctor Profile Banner */}
              {doctorInfo.name ? (
                <View style={styles.profileBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileBadgeTitle} numberOfLines={1}>
                        Dr. {doctorInfo.name} · {doctorInfo.clinicName || doctorInfo.qualification || 'Profile Active'}
                      </Text>
                      <Text style={styles.profileBadgeSub}>Auto-filled on prescription header</Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.profileBadgeEdit}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="pencil" size={12} color="#155EEF" />
                    <Text style={styles.profileBadgeEditText}>Edit</Text>
                  </Pressable>
                </View>
              ) : null}

              <TemplatePicker
                selected={template}
                onSelect={setTemplate}
                onSelectAndProceed={handleTemplateSelectAndProceed}
              />
              
              <View style={{ marginVertical: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 20 }}>{template.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#102A56' }} numberOfLines={1}>📋 Preview: {template.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>Complete A4 Layout (Header to Footer)</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                    onPress={() => setFullscreenPreview(template)}
                  >
                    <Ionicons name="scan-outline" size={13} color="#155EEF" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#155EEF' }}>Zoom Fullscreen</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.preview,
                    { borderColor: template.styles.primaryColor },
                    pressed && { opacity: 0.9 }
                  ]}
                  onPress={() => setFullscreenPreview(template)}
                >
                  <Image 
                    source={template.image} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="contain" 
                  />
                </Pressable>
                <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 6, fontWeight: '500' }}>
                  Tap preview to zoom full screen • Entire layout 100% visible
                </Text>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>Doctor Information</Text>
                <Pressable
                  style={styles.profileSettingsLink}
                  onPress={() => router.push('/doctor-profile')}
                >
                  <Ionicons name="settings-outline" size={13} color="#155EEF" />
                  <Text style={styles.profileSettingsLinkText}>Profile Settings</Text>
                </Pressable>
              </View>
              <Text style={styles.hint}>This appears in the prescription header</Text>

              {doctorInfo.name ? (
                <View style={styles.profileNoticeBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileNoticeTitle}>Auto-filled from saved profile</Text>
                    <Text style={styles.profileNoticeSub}>
                      Dr. {doctorInfo.name}{doctorInfo.clinicName ? ` (${doctorInfo.clinicName})` : ''} is set. Edits here apply only to this prescription.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.profileNoticeBanner, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                  <Ionicons name="information-circle" size={18} color="#d97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileNoticeTitle, { color: '#b45309' }]}>No profile saved</Text>
                    <Text style={[styles.profileNoticeSub, { color: '#92400e' }]}>
                      Save your profile in Account Settings so you never have to re-enter details again.
                    </Text>
                  </View>
                </View>
              )}
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
              <Text style={[styles.label, { marginTop: 20 }]}>Export & Print</Text>
              <View style={styles.exportGrid}>
                <Pressable style={[styles.exportBtn, { backgroundColor: Colors.primaryBlue }]} onPress={() => handleExportAction('download')} disabled={saving}>
                  <Ionicons name="download-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Download PDF</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: '#0284c7' }]} onPress={() => handleExportAction('print')} disabled={saving}>
                  <Ionicons name="print-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Print Rx</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: '#25D366' }]} onPress={() => handleExportAction('whatsapp')} disabled={saving}>
                  <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>WhatsApp</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: Colors.darkNavy }]} onPress={() => handleExportAction('email')} disabled={saving}>
                  <Ionicons name="mail-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Email</Text>
                </Pressable>
                <Pressable style={[styles.exportBtn, { backgroundColor: Colors.textSecondary, width: '100%' }]} onPress={() => handleExportAction('share')} disabled={saving}>
                  <Ionicons name="share-social-outline" size={18} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Share Prescription</Text>
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
          <Pressable
            style={styles.nextBtn}
            onPress={() => {
              if (step === 0 && doctorInfo.name?.trim()) {
                setStep(2) // Skip directly to Patient Info!
              } else {
                setStep(s => s + 1)
              }
            }}
          >
            <Text style={styles.nextBtnText}>
              {step === 0 && doctorInfo.name?.trim()
                ? 'Next: Patient Info (Step 2) →'
                : `Next: ${steps[step + 1]} →`}
            </Text>
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

      {/* Test Preset Modal */}
      <TestPresetModal
        visible={showTestModal}
        onClose={() => setShowTestModal(false)}
        currentTemplateId={template.id}
        mode="form-editor"
        onSelectPreset={handleApplyPreset}
      />

      {/* Fullscreen Template Preview Modal */}
      {fullscreenPreview && (
        <Modal
          visible={!!fullscreenPreview}
          animationType="fade"
          transparent
          onRequestClose={() => setFullscreenPreview(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.94)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 48, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{fullscreenPreview.emoji}</Text>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>{fullscreenPreview.name}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Full A4 Template Layout (Top to Bottom)</Text>
                </View>
              </View>
              <Pressable style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setFullscreenPreview(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, alignItems: 'center', justifyContent: 'center' }}
              showsVerticalScrollIndicator={true}
            >
              <View style={{ width: '100%', maxWidth: 640, aspectRatio: 1588 / 2246, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: fullscreenPreview.styles.primaryColor }}>
                <Image
                  source={fullscreenPreview.image}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

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
  testBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#155EEF', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  testBtnText: { fontSize: 11, color: Colors.white, fontWeight: '800' },
  draftBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  saveText: { fontSize: 11, color: Colors.white, fontWeight: '700' },

  // Test Presets Quick Bar
  testPresetsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EFF6FF', borderBottomWidth: 1.5, borderBottomColor: '#BFDBFE',
    paddingHorizontal: 14, paddingVertical: 8, gap: 8,
  },
  testPresetsLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  testPresetsTitle: { fontSize: 11, fontWeight: '800', color: '#155EEF' },
  testPresetsBtns: { flexDirection: 'row', gap: 6 },
  testQuickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#155EEF', paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 8, shadowColor: '#155EEF', shadowOpacity: 0.25, shadowRadius: 4, elevation: 2,
  },
  testQuickBtnText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  testAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#155EEF',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
  },
  testAllBtnText: { fontSize: 11, color: '#155EEF', fontWeight: '800' },
  
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
    aspectRatio: 1588/2246, marginTop: 4, maxWidth: 520, alignSelf: 'center', width: '100%',
    backgroundColor: '#ffffff', ...Shadow.md
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

  // Profile Auto-fill Elements
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14,
  },
  profileBadgeTitle: { fontSize: 13, fontWeight: '800', color: '#1e3a8a' },
  profileBadgeSub: { fontSize: 11, color: '#15803d', fontWeight: '600', marginTop: 1 },
  profileBadgeEdit: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#bfdbfe',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm,
  },
  profileBadgeEditText: { fontSize: 11, fontWeight: '700', color: '#155EEF' },

  profileSettingsLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm,
  },
  profileSettingsLinkText: { fontSize: 11, fontWeight: '700', color: '#155EEF' },

  profileNoticeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    borderRadius: Radius.md, padding: 12, marginBottom: 14,
  },
  profileNoticeTitle: { fontSize: 13, fontWeight: '800', color: '#166534' },
  profileNoticeSub: { fontSize: 11, color: '#15803d', marginTop: 2, lineHeight: 16 },
})
