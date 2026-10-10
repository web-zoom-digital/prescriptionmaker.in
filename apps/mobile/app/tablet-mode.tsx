import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, Pressable, Platform,
  Alert, ActivityIndicator, Dimensions, PanResponder,
  StatusBar, ScrollView, TextInput, KeyboardAvoidingView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Line, Rect, Text as SvgText } from 'react-native-svg'
import * as Print from 'expo-print'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

const { width: SW, height: SH } = Dimensions.get('window')

import { MOBILE_TEMPLATES } from '../lib/templates'
import { generatePrescriptionHTML } from '../lib/pdf-generator'

type DrawnPath = { d: string; color: string; width: number }
type Tool = 'pen' | 'eraser'
type Step = 'template' | 'form' | 'canvas'

// ── Pen Config ────────────────────────────────────────────────────────────────
const PEN_COLORS = ['#1e293b', '#0f766e', '#1e40af', '#be123c', '#7c3aed', '#d97706']
const PEN_WIDTHS = [1.5, 3, 5, 9, 16]

// ── Form Types ────────────────────────────────────────────────────────────────
type DoctorForm = {
  doctorName: string
  qualification: string
  clinicName: string
  clinicAddress: string
  phone: string
}

type PatientForm = {
  patientName: string
  age: string
  sex: string
  date: string
  chiefComplaint: string
  diagnosis: string
}

type SelectedTemplate = {
  id: string
  name: string
  emoji: string
  primaryColor: string
  accentColor: string
}

// ── Template Picker Step ──────────────────────────────────────────────────────
function TemplatePickerStep({ onSelect }: { onSelect: (t: SelectedTemplate) => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'clinic', label: 'Clinic' },
    { id: 'hospital', label: 'Hospital' },
    { id: 'specialty', label: 'Specialty' },
    { id: 'general', label: 'General' },
  ]
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? MOBILE_TEMPLATES
    : MOBILE_TEMPLATES.filter(t => t.category === activeCategory)

  const selectedTmpl = MOBILE_TEMPLATES.find(t => t.id === selected)

  return (
    <View style={tpS.root}>
      {/* Header */}
      <View style={tpS.headerSection}>
        <Text style={tpS.heading}>Choose a Template</Text>
        <Text style={tpS.sub}>Select the prescription layout that fits your practice</Text>
      </View>

      {/* Category pills */}
      <View style={tpS.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tpS.catRow}>
          {categories.map(c => (
            <Pressable
              key={c.id}
              style={[tpS.catPill, activeCategory === c.id && tpS.catPillActive]}
              onPress={() => setActiveCategory(c.id)}
            >
              <Text style={[tpS.catPillText, activeCategory === c.id && tpS.catPillTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Template grid with real images */}
        <View style={tpS.grid}>
          {filtered.map(tmpl => {
            const isSelected = selected === tmpl.id
            return (
              <Pressable
                key={tmpl.id}
                style={[tpS.card, isSelected && tpS.cardSelected]}
                onPress={() => setSelected(tmpl.id)}
              >
                {/* Thumbnail image */}
                <View style={tpS.imageWrap}>
                  <Image source={tmpl.image} style={tpS.cardImage} resizeMode="cover" />
                  {tmpl.isPremium && (
                    <View style={tpS.proBadge}>
                      <Text style={tpS.proBadgeText}>PRO</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={tpS.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Color accent bar */}
                <View style={[tpS.colorBar, { backgroundColor: tmpl.styles.primaryColor }]} />

                {/* Card info */}
                <View style={tpS.cardBody}>
                  <Text style={[tpS.cardName, isSelected && { color: tmpl.styles.primaryColor }]} numberOfLines={1}>
                    {tmpl.name}
                  </Text>
                  <Text style={tpS.cardDesc} numberOfLines={2}>{tmpl.description}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Large preview when selected */}
        {selectedTmpl && (
          <View style={tpS.bigPreviewWrap}>
            <Text style={tpS.bigPreviewLabel}>Preview: {selectedTmpl.name}</Text>
            <View style={[tpS.bigPreview, { borderColor: selectedTmpl.styles.primaryColor }]}>
              <Image source={selectedTmpl.image} style={tpS.bigPreviewImage} resizeMode="cover" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={tpS.footer}>
        <Pressable
          style={[tpS.useBtn, !selected && { opacity: 0.45 }]}
          onPress={() => {
            if (!selected) return
            const tmpl = MOBILE_TEMPLATES.find(t => t.id === selected)!
            onSelect({
              id: tmpl.id,
              name: tmpl.name,
              emoji: tmpl.emoji,
              primaryColor: tmpl.styles.primaryColor,
              accentColor: tmpl.styles.accentColor,
            })
          }}
          disabled={!selected}
        >
          <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
          <Text style={tpS.useBtnText}>
            {selected ? `Use ${MOBILE_TEMPLATES.find(t => t.id === selected)?.name}` : 'Select a Template to Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

import { Image } from 'react-native'

const tpS = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FF' },
  headerSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8EEF8' },
  heading: { fontSize: 20, fontWeight: '900', color: '#102A56', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#64748b', marginTop: 3, fontWeight: '500' },
  catContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8EEF8' },
  catRow: { paddingHorizontal: 14, gap: 8, paddingVertical: 12 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F4F7FF', borderWidth: 1.5, borderColor: '#E8EEF8' },
  catPillActive: { backgroundColor: '#102A56', borderColor: '#102A56' },
  catPillText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catPillTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: {
    width: '47.5%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#E8EEF8',
    shadowColor: '#102A56', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardSelected: {
    borderColor: '#155EEF', borderWidth: 2.5,
    shadowColor: '#155EEF', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  imageWrap: { width: '100%', height: 120, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  proBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  checkBadge: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#155EEF', alignItems: 'center', justifyContent: 'center' },
  colorBar: { height: 3, width: '100%' },
  cardBody: { padding: 10, gap: 3 },
  cardName: { fontSize: 13, fontWeight: '800', color: '#102A56', lineHeight: 17 },
  cardDesc: { fontSize: 11, color: '#64748b', lineHeight: 15, fontWeight: '500' },
  bigPreviewWrap: { marginHorizontal: 12, marginTop: 4, marginBottom: 8 },
  bigPreviewLabel: { fontSize: 13, fontWeight: '700', color: '#102A56', marginBottom: 8 },
  bigPreview: { borderRadius: 14, overflow: 'hidden', borderWidth: 2, height: 280 },
  bigPreviewImage: { width: '100%', height: '100%' },
  footer: { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8EEF8', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  useBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#155EEF', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#155EEF', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  useBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
})


function PrescriptionTemplateOverlay({
  w, h, doctor, patient,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
}) {
  const headerH = Math.round(h * 0.15)
  const infoH = Math.round(h * 0.19)
  const rxY = headerH + infoH + 2
  const lineCount = 20
  const lineSpacing = (h - rxY - 70) / lineCount

  return (
    <>
      {/* ── Header ── */}
      <Rect x={0} y={0} width={w} height={headerH} fill="#0f766e" />
      <SvgText x={w / 2} y={headerH * 0.40} textAnchor="middle" fontSize={15} fontWeight="bold" fill="white">
        {doctor.clinicName || 'My Clinic / Hospital'}
      </SvgText>
      <SvgText x={w / 2} y={headerH * 0.66} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.85)">
        {doctor.doctorName ? `Dr. ${doctor.doctorName}${doctor.qualification ? ` — ${doctor.qualification}` : ''}` : 'Doctor Name'}
      </SvgText>
      {doctor.phone ? (
        <SvgText x={w / 2} y={headerH * 0.88} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.65)">
          {`📞 ${doctor.phone}`}
        </SvgText>
      ) : null}

      {/* ── Patient Info Strip ── */}
      <Rect x={0} y={headerH} width={w} height={infoH} fill="#f0fdf4" />
      <Line x1={0} y1={headerH} x2={w} y2={headerH} stroke="#a7f3d0" strokeWidth={1} />
      <Line x1={0} y1={headerH + infoH} x2={w} y2={headerH + infoH} stroke="#a7f3d0" strokeWidth={1} />

      <SvgText x={12} y={headerH + 13} fontSize={8} fontWeight="bold" fill="#0f766e">PATIENT INFORMATION</SvgText>

      {/* Name */}
      <SvgText x={12} y={headerH + 26} fontSize={8} fill="#6b7280">Patient Name</SvgText>
      <SvgText x={12} y={headerH + 40} fontSize={11} fontWeight="bold" fill="#0f172a">
        {patient.patientName || '___________________________'}
      </SvgText>

      {/* Divider 1 */}
      <Line x1={w * 0.5} y1={headerH + 16} x2={w * 0.5} y2={headerH + infoH - 8} stroke="#a7f3d0" strokeWidth={0.8} />

      {/* Age / Sex */}
      <SvgText x={w * 0.51} y={headerH + 26} fontSize={8} fill="#6b7280">Age / Sex</SvgText>
      <SvgText x={w * 0.51} y={headerH + 40} fontSize={11} fontWeight="bold" fill="#0f172a">
        {patient.age ? `${patient.age} yrs` : '___ yrs'} / {patient.sex || '____'}
      </SvgText>

      {/* Date */}
      <SvgText x={w * 0.78} y={headerH + 26} fontSize={8} fill="#6b7280">Date</SvgText>
      <SvgText x={w * 0.78} y={headerH + 40} fontSize={10} fontWeight="bold" fill="#0f172a">
        {patient.date || new Date().toLocaleDateString('en-IN')}
      </SvgText>

      {/* Row 2 divider */}
      <Line x1={12} y1={headerH + 52} x2={w - 12} y2={headerH + 52} stroke="#a7f3d0" strokeWidth={0.5} />

      {/* Chief Complaint */}
      <SvgText x={12} y={headerH + 63} fontSize={8} fill="#6b7280">Chief Complaint</SvgText>
      <SvgText x={12} y={headerH + 76} fontSize={10} fill="#0f172a">
        {patient.chiefComplaint || '_________________________'}
      </SvgText>

      <Line x1={w * 0.5} y1={headerH + 52} x2={w * 0.5} y2={headerH + infoH - 8} stroke="#a7f3d0" strokeWidth={0.5} />

      {/* Diagnosis */}
      <SvgText x={w * 0.51} y={headerH + 63} fontSize={8} fill="#6b7280">Diagnosis</SvgText>
      <SvgText x={w * 0.51} y={headerH + 76} fontSize={10} fill="#1e293b">
        {patient.diagnosis || '_________________________'}
      </SvgText>

      {/* ── Rx Area ── */}
      <SvgText x={12} y={rxY + 14} fontSize={8} fontWeight="bold" fill="#0f766e" opacity={0.55}>
        ℞ PRESCRIPTION — WRITE MEDICINES BELOW
      </SvgText>

      {/* Watermark */}
      <SvgText x={w / 2 - 40} y={rxY + h * 0.25} fontSize={60} fontWeight="bold" fill="#0f766e" opacity={0.04}>℞</SvgText>

      {/* Writing lines */}
      {Array.from({ length: lineCount }).map((_, i) => (
        <Line
          key={i}
          x1={12} y1={rxY + 22 + (i + 1) * lineSpacing}
          x2={w - 12} y2={rxY + 22 + (i + 1) * lineSpacing}
          stroke="#e2e8f0" strokeWidth={0.9}
        />
      ))}

      {/* ── Footer ── */}
      <Line x1={12} y1={h - 38} x2={w - 12} y2={h - 38} stroke="#e2e8f0" strokeWidth={0.8} />
      <SvgText x={12} y={h - 22} fontSize={8} fill="#94a3b8">Doctor's Signature</SvgText>
      <SvgText x={w / 2} y={h - 22} textAnchor="middle" fontSize={8} fill="#94a3b8">Next Visit Date</SvgText>
      <SvgText x={w - 12} y={h - 22} textAnchor="end" fontSize={8} fill="#94a3b8">Patient Signature</SvgText>
      <SvgText x={w / 2} y={h - 8} textAnchor="middle" fontSize={7} fill="#cbd5e1">PrescriptionMaker.in</SvgText>
    </>
  )
}

// ── STEP 1: Form ──────────────────────────────────────────────────────────────
function FormStep({
  doctor, setDoctor, patient, setPatient, onNext,
}: {
  doctor: DoctorForm; setDoctor: (d: DoctorForm) => void
  patient: PatientForm; setPatient: (p: PatientForm) => void
  onNext: () => void
}) {
  const upD = (k: keyof DoctorForm, v: string) => setDoctor({ ...doctor, [k]: v })
  const upP = (k: keyof PatientForm, v: string) => setPatient({ ...patient, [k]: v })
  const canProceed = doctor.doctorName.trim() && patient.patientName.trim()

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={fS.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Doctor Card ── */}
        <View style={fS.card}>
          <View style={fS.cardHead}>
            <View style={[fS.cardIcon, { backgroundColor: '#0f766e15' }]}>
              <Ionicons name="person-circle-outline" size={20} color="#0f766e" />
            </View>
            <View>
              <Text style={fS.cardTitle}>Doctor Information</Text>
              <Text style={fS.cardSub}>Appears on the prescription header</Text>
            </View>
          </View>

          <View style={fS.row}>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Doctor Name <Text style={fS.req}>*</Text></Text>
              <TextInput style={fS.input} placeholder="e.g. Rahul Sharma" placeholderTextColor="#94a3b8"
                value={doctor.doctorName} onChangeText={v => upD('doctorName', v)} autoCapitalize="words" />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Qualification</Text>
              <TextInput style={fS.input} placeholder="MBBS, MD..." placeholderTextColor="#94a3b8"
                value={doctor.qualification} onChangeText={v => upD('qualification', v)} autoCapitalize="characters" />
            </View>
          </View>

          <View style={fS.row}>
            <View style={[fS.fg, { flex: 2 }]}>
              <Text style={fS.label}>Clinic / Hospital Name</Text>
              <TextInput style={fS.input} placeholder="City Clinic, Apollo, etc." placeholderTextColor="#94a3b8"
                value={doctor.clinicName} onChangeText={v => upD('clinicName', v)} autoCapitalize="words" />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Phone Number</Text>
              <TextInput style={fS.input} placeholder="9876543210" placeholderTextColor="#94a3b8"
                value={doctor.phone} onChangeText={v => upD('phone', v)} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={fS.fg}>
            <Text style={fS.label}>Clinic Address</Text>
            <TextInput style={fS.input} placeholder="123, Main Street, City" placeholderTextColor="#94a3b8"
              value={doctor.clinicAddress} onChangeText={v => upD('clinicAddress', v)} autoCapitalize="words" />
          </View>
        </View>

        {/* ── Patient Card ── */}
        <View style={fS.card}>
          <View style={fS.cardHead}>
            <View style={[fS.cardIcon, { backgroundColor: '#6366f115' }]}>
              <Ionicons name="accessibility-outline" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={fS.cardTitle}>Patient Information</Text>
              <Text style={fS.cardSub}>Fills the patient strip on the prescription</Text>
            </View>
          </View>

          <View style={fS.row}>
            <View style={[fS.fg, { flex: 2 }]}>
              <Text style={fS.label}>Patient Name <Text style={fS.req}>*</Text></Text>
              <TextInput style={fS.input} placeholder="e.g. Aarav Sharma" placeholderTextColor="#94a3b8"
                value={patient.patientName} onChangeText={v => upP('patientName', v)} autoCapitalize="words" />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Age</Text>
              <TextInput style={fS.input} placeholder="25" placeholderTextColor="#94a3b8"
                value={patient.age} onChangeText={v => upP('age', v)} keyboardType="numeric" />
            </View>
          </View>

          <View style={fS.row}>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Sex</Text>
              <View style={fS.segRow}>
                {['Male', 'Female', 'Other'].map(s => (
                  <Pressable key={s}
                    style={[fS.segBtn, patient.sex === s && fS.segBtnActive]}
                    onPress={() => upP('sex', s)}
                  >
                    <Text style={[fS.segText, patient.sex === s && fS.segTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Date</Text>
              <TextInput style={fS.input} placeholder={new Date().toLocaleDateString('en-IN')} placeholderTextColor="#94a3b8"
                value={patient.date} onChangeText={v => upP('date', v)} />
            </View>
          </View>

          <View style={fS.row}>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Chief Complaint</Text>
              <TextInput style={[fS.input, fS.textarea]} placeholder="e.g. Fever, headache for 3 days..." placeholderTextColor="#94a3b8"
                value={patient.chiefComplaint} onChangeText={v => upP('chiefComplaint', v)}
                multiline numberOfLines={2} textAlignVertical="top" autoCapitalize="sentences" />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Diagnosis</Text>
              <TextInput style={[fS.input, fS.textarea]} placeholder="e.g. Viral fever, Tonsillitis..." placeholderTextColor="#94a3b8"
                value={patient.diagnosis} onChangeText={v => upP('diagnosis', v)}
                multiline numberOfLines={2} textAlignVertical="top" autoCapitalize="sentences" />
            </View>
          </View>
        </View>

        {/* ── Next Button ── */}
        <Pressable style={[fS.nextBtn, !canProceed && { opacity: 0.45 }]} onPress={onNext} disabled={!canProceed}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={fS.nextBtnText}>Write Prescription →</Text>
        </Pressable>

        {!canProceed && (
          <Text style={fS.reqNote}>* Doctor Name and Patient Name are required.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const fS = StyleSheet.create({
  scroll: { padding: 14, gap: 12, paddingBottom: 28 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  cardSub: { fontSize: 10, color: '#94a3b8', marginTop: 1, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10 },
  fg: { gap: 4 },
  label: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.2 },
  req: { color: '#ef4444' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13,
    color: '#0f172a', backgroundColor: '#f8fafc', fontWeight: '500',
  },
  textarea: { minHeight: 52, paddingTop: 9 },
  segRow: { flexDirection: 'row', gap: 6 },
  segBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5,
    borderColor: '#e2e8f0', backgroundColor: '#f8fafc', alignItems: 'center',
  },
  segBtnActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  segText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  segTextActive: { color: '#fff' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#0f766e', paddingVertical: 14, borderRadius: 14,
    shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  reqNote: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: -6 },
})

// ── STEP 2: Canvas ────────────────────────────────────────────────────────────
function CanvasStep({
  doctor, patient, onEditInfo, templateColor, selectedTemplate
}: {
  doctor: DoctorForm; patient: PatientForm; onEditInfo: () => void
  templateColor: string
  selectedTemplate: SelectedTemplate | null
}) {
  const SIDEBAR_W = 60
  const TOP_BAR_H = Platform.OS === 'ios' ? 44 : 42
  const CW = SW - SIDEBAR_W
  const CH = SH - TOP_BAR_H - (Platform.OS === 'ios' ? 50 : 14)

  const [paths, setPaths] = useState<DrawnPath[]>([])
  const [livePath, setLivePath] = useState<DrawnPath | null>(null)
  const [saving, setSaving] = useState(false)
  const [tool, setTool] = useState<Tool>('pen')
  const [penColor, setPenColor] = useState('#1e293b')
  const [penWidth, setPenWidth] = useState(3)
  const [redoStack, setRedoStack] = useState<DrawnPath[]>([])

  const penColorRef = useRef('#1e293b')
  const penWidthRef = useRef(3)
  const toolRef = useRef<Tool>('pen')
  const currentPathStr = useRef('')
  const isDrawing = useRef(false)

  const setColor = useCallback((c: string) => { penColorRef.current = c; setPenColor(c) }, [])
  const setWidth = useCallback((w: number) => { penWidthRef.current = w; setPenWidth(w) }, [])
  const setActiveTool = useCallback((t: Tool) => { toolRef.current = t; setTool(t) }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        const d = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`
        currentPathStr.current = d
        isDrawing.current = true
        const isE = toolRef.current === 'eraser'
        setLivePath({ d, color: isE ? '#ffffff' : penColorRef.current, width: isE ? 20 : penWidthRef.current })
      },
      onPanResponderMove: (evt) => {
        if (!isDrawing.current) return
        const { locationX, locationY } = evt.nativeEvent
        currentPathStr.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`
        const isE = toolRef.current === 'eraser'
        setLivePath({ d: currentPathStr.current, color: isE ? '#ffffff' : penColorRef.current, width: isE ? 20 : penWidthRef.current })
      },
      onPanResponderRelease: () => {
        isDrawing.current = false
        // ⚠️ Capture values NOW before resetting refs.
        // setPaths uses a functional updater that runs asynchronously,
        // so if we reset currentPathStr.current before it runs,
        // the updater would read an empty string and commit a blank stroke.
        const capturedPath = currentPathStr.current
        const capturedColor = penColorRef.current
        const capturedWidth = penWidthRef.current
        const capturedIsEraser = toolRef.current === 'eraser'
        currentPathStr.current = ''   // reset ref immediately, safe now

        if (capturedPath) {
          const newPath = {
            d: capturedPath,
            color: capturedIsEraser ? '#ffffff' : capturedColor,
            width: capturedIsEraser ? 20 : capturedWidth,
          }
          setPaths(prev => [...prev, newPath])
          setRedoStack([])
          setLivePath(null)
        }
      },
      onPanResponderTerminate: () => {
        isDrawing.current = false
        setLivePath(null)
        currentPathStr.current = ''
      },
    })
  ).current

  const handleUndo = () => setPaths(prev => { if (!prev.length) return prev; setRedoStack(r => [...r, prev[prev.length - 1]]); return prev.slice(0, -1) })
  const handleRedo = () => setRedoStack(prev => { if (!prev.length) return prev; setPaths(p => [...p, prev[prev.length - 1]]); return prev.slice(0, -1) })
  const handleClear = () => Alert.alert('Clear', 'Remove all strokes?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => { setPaths([]); setRedoStack([]) } }])

  const handleExport = async () => {
    if (!paths.length) { 
      if (Platform.OS === 'web') window.alert('Please write/draw medicines on the canvas first!'); 
      else Alert.alert('Empty', 'Write medicines on the canvas first.'); 
      return 
    }
    setSaving(true)
    try {
      const strokesHTML = paths.map(p =>
        `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      ).join('\n')

      const strokesSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;" preserveAspectRatio="none">
        ${strokesHTML}
      </svg>`

      const fullTemplate = MOBILE_TEMPLATES.find(t => t.id === selectedTemplate?.id) || MOBILE_TEMPLATES[0]
      const pdfData = {
        template: fullTemplate,
        doctorInfo: {
          name: doctor.doctorName,
          qualification: doctor.qualification,
          specialization: '',
          regNo: '',
          clinicName: doctor.clinicName,
          address: doctor.clinicAddress,
          phone: doctor.phone,
          email: '',
          logoUrl: undefined,
          stampUrl: undefined,
          signature: undefined,
        },
        patientInfo: {
          name: patient.patientName,
          age: patient.age,
          gender: patient.sex,
          weight: '',
          phone: '',
        },
        date: patient.date || new Date().toLocaleDateString('en-IN'),
        chiefComplaint: patient.chiefComplaint,
        diagnosis: patient.diagnosis,
        symptoms: '',
        medicines: [], // drawn on canvas
        labTests: [],
        advice: '',
        followUp: '',
        language: 'en' as const
      }

      let html = generatePrescriptionHTML(pdfData)
      // Inject strokes SVG just before closing body
      html = html.replace('</body>', `${strokesSVG}</body>`)
      
      if (Platform.OS === 'web') {
        try {
          await Print.printAsync({ html })
        } catch (e: any) {
          window.alert('Web Print Error: ' + e.message)
        }
      } else {
        // Mobile (iOS/Android) native flow
        try {
          const { uri } = await Print.printToFileAsync({ html, base64: false })
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription' })
        } catch (e: any) {
          Alert.alert('Native Export Error', e.message)
        }
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Canvas sub-toolbar */}
      <View style={cS.subBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', gap: 6 }}>
          <Pressable style={cS.subBarBtn} onPress={onEditInfo}>
            <Ionicons name="create-outline" size={14} color="#94a3b8" />
            <Text style={cS.subBarText}>Edit Info</Text>
          </Pressable>
          <View style={cS.subBarDivider} />
          <Pressable style={[cS.subBarBtn, paths.length === 0 && { opacity: 0.4 }]} onPress={handleUndo} disabled={!paths.length}>
            <Ionicons name="arrow-undo-outline" size={14} color="#94a3b8" />
            <Text style={cS.subBarText}>Undo</Text>
          </Pressable>
          <Pressable style={[cS.subBarBtn, redoStack.length === 0 && { opacity: 0.4 }]} onPress={handleRedo} disabled={!redoStack.length}>
            <Ionicons name="arrow-redo-outline" size={14} color="#94a3b8" />
            <Text style={cS.subBarText}>Redo</Text>
          </Pressable>
          <Pressable style={[cS.subBarBtn, { backgroundColor: '#fff1f2' }, paths.length === 0 && { opacity: 0.4 }]} onPress={handleClear} disabled={!paths.length}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={[cS.subBarText, { color: '#ef4444' }]}>Clear</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 20 }} />
          <Pressable style={cS.exportBtn} onPress={handleExport} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="share-outline" size={14} color="#fff" />
                <Text style={cS.exportBtnText}>Export</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>

      {/* Main: sidebar + canvas */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar */}
        <View style={cS.sidebar}>
          <View style={cS.sec}>
            <Text style={cS.secLabel}>TOOL</Text>
            <Pressable style={[cS.toolBtn, tool === 'pen' && cS.toolBtnActive]} onPress={() => setActiveTool('pen')}>
              <Ionicons name="pencil" size={16} color={tool === 'pen' ? '#fff' : '#64748b'} />
              <Text style={[cS.toolText, tool === 'pen' && { color: '#fff' }]}>Pen</Text>
            </Pressable>
            <Pressable style={[cS.toolBtn, tool === 'eraser' && { ...cS.toolBtnActive, backgroundColor: '#f59e0b' }]} onPress={() => setActiveTool('eraser')}>
              <Ionicons name="color-wand-outline" size={16} color={tool === 'eraser' ? '#fff' : '#64748b'} />
              <Text style={[cS.toolText, tool === 'eraser' && { color: '#fff' }]}>Erase</Text>
            </Pressable>
          </View>

          {tool === 'pen' && (
            <View style={cS.sec}>
              <Text style={cS.secLabel}>COLOR</Text>
              {PEN_COLORS.map(c => (
                <Pressable key={c} style={[cS.colorDot, { backgroundColor: c }, penColor === c && cS.colorDotActive]}
                  onPress={() => setColor(c)} />
              ))}
            </View>
          )}

          {tool === 'pen' && (
            <View style={cS.sec}>
              <Text style={cS.secLabel}>SIZE</Text>
              {PEN_WIDTHS.map(w => (
                <Pressable key={w} style={[cS.widthBtn, penWidth === w && { borderColor: penColor, backgroundColor: `${penColor}18` }]}
                  onPress={() => setWidth(w)}>
                  <View style={{ width: Math.min(w * 2, 22), height: Math.min(w * 2, 22), borderRadius: 99, backgroundColor: penWidth === w ? penColor : '#64748b' }} />
                </Pressable>
              ))}
            </View>
          )}

          {tool === 'pen' && (
            <View style={[cS.penPreview, { borderColor: penColor }]}>
              <View style={{ width: Math.min(penWidth * 2, 22), height: Math.min(penWidth * 2, 22), borderRadius: 99, backgroundColor: penColor }} />
            </View>
          )}
        </View>

        {/* Canvas */}
        <View style={{ flex: 1, backgroundColor: '#fff' }} {...panResponder.panHandlers}>
          <Svg width={CW} height={CH} style={StyleSheet.absoluteFill} pointerEvents="none">
            <PrescriptionTemplateOverlay w={CW} h={CH} doctor={doctor} patient={patient} />
          </Svg>
          <Svg width={CW} height={CH} style={StyleSheet.absoluteFill} pointerEvents="none">
            {paths.map((p, i) => (
              <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
          {livePath && (
            <Svg width={CW} height={CH} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Path d={livePath.d} stroke={livePath.color} strokeWidth={livePath.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
          {!paths.length && !livePath && (
            <View style={cS.hint}>
              <Text style={cS.hintIcon}>✍️</Text>
              <Text style={cS.hintText}>Touch and drag to write medicines here</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const cS = StyleSheet.create({
  subBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  subBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, backgroundColor: '#334155' },
  subBarText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  subBarDivider: { width: 1, height: 18, backgroundColor: '#334155', marginHorizontal: 2 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3,
  },
  exportBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sidebar: {
    width: 60, backgroundColor: '#1e293b',
    paddingVertical: 10, paddingHorizontal: 6,
    alignItems: 'center', gap: 10,
    borderRightWidth: 1, borderRightColor: '#334155',
  },
  sec: { alignItems: 'center', gap: 6, width: '100%' },
  secLabel: { fontSize: 7, fontWeight: '800', color: '#475569', letterSpacing: 0.8 },
  toolBtn: { width: 44, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155', gap: 1 },
  toolBtnActive: { backgroundColor: '#0f766e' },
  toolText: { fontSize: 7, color: '#64748b', fontWeight: '700' },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  widthBtn: { width: 44, height: 32, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  penPreview: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', marginTop: 2 },
  hint: { position: 'absolute', top: '52%', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' as any },
  hintIcon: { fontSize: 36, opacity: 0.1, marginBottom: 6 },
  hintText: { fontSize: 13, color: '#cbd5e1', fontStyle: 'italic', opacity: 0.5 },
})

// ── Root ──────────────────────────────────────────────────────────────────────
export default function TabletMode() {
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null)
  const [doctor, setDoctor] = useState<DoctorForm>({
    doctorName: '', qualification: '', clinicName: '', clinicAddress: '', phone: '',
  })
  const [patient, setPatient] = useState<PatientForm>({
    patientName: '', age: '', sex: 'Male',
    date: new Date().toLocaleDateString('en-IN'),
    chiefComplaint: '', diagnosis: '',
  })

  const stepLabels = [
    { label: '1 · Template', key: 'template' },
    { label: '2 · Patient Info', key: 'form' },
    { label: '3 · Write Rx', key: 'canvas' },
  ]

  const handleBack = () => {
    if (step === 'canvas') setStep('form')
    else if (step === 'form') setStep('template')
    else router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')
  }

  return (
    <View style={rS.root}>
      <StatusBar barStyle="light-content" backgroundColor="#102A56" />

      {/* Top bar */}
      <View style={rS.topBar}>
        <View style={rS.topHeaderLeft}>
          <Pressable style={rS.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text style={rS.topTitle}>📋 Tablet Mode</Text>
        </View>

        {/* Step indicators */}
        <View style={rS.steps}>
          {stepLabels.map(s => {
            const isActive = step === s.key
            const stepOrder = ['template', 'form', 'canvas']
            const isDone = stepOrder.indexOf(s.key) < stepOrder.indexOf(step)
            return (
              <View key={s.key} style={[rS.stepChip, isActive && rS.stepChipActive, isDone && rS.stepChipDone]}>
                <Text style={[rS.stepChipText, (isActive || isDone) && rS.stepChipTextActive]}>
                  {isDone ? '✓ ' : ''}{s.label}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Content */}
      {step === 'template' ? (
        <TemplatePickerStep
          onSelect={(t) => { setSelectedTemplate(t); setStep('form') }}
        />
      ) : step === 'form' ? (
        <FormStep
          doctor={doctor} setDoctor={setDoctor}
          patient={patient} setPatient={setPatient}
          onNext={() => setStep('canvas')}
        />
      ) : (
        <CanvasStep
          doctor={doctor} patient={patient}
          onEditInfo={() => setStep('form')}
          templateColor={selectedTemplate?.primaryColor ?? '#0f766e'}
          selectedTemplate={selectedTemplate}
        />
      )}
    </View>
  )
}

const rS = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FF' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#102A56',
    paddingTop: Platform.OS === 'ios' ? 50 : 14,
    paddingBottom: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topTitle: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  steps: { flexDirection: 'row', gap: 5 },
  stepChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepChipActive: { backgroundColor: '#155EEF' },
  stepChipDone: { backgroundColor: 'rgba(21,94,239,0.4)' },
  stepChipText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  stepChipTextActive: { color: '#fff' },
})
