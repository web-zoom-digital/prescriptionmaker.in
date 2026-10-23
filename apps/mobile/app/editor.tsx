import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MOBILE_TEMPLATES, getTemplateFieldConfig, type Template } from '../lib/templates'
import type { Medicine, PrescriptionData } from '../lib/pdf-generator'
import { generatePrescriptionHTML } from '../lib/pdf-generator'
import { createPrescription, updatePrescription, getPrescription } from '../lib/prescriptions'
import { DIAGNOSIS_TEMPLATES, searchTemplates, type DiagnosisTemplate } from '../lib/diagnosis-templates'
import { checkInteractions, type ActiveAlert } from '../lib/medicine-interactions'
import { searchMedicines, type MedicineEntry } from '../lib/medicine-db'
import { type LanguageCode, LANGUAGES } from '../lib/translations'
import { getDoctorProfile, saveDoctorProfile } from '../lib/local-store'
import * as ImagePicker from 'expo-image-picker'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import * as MailComposer from 'expo-mail-composer'
import { downloadPrescriptionPdf, printCleanPrescription } from '../lib/pdf-export-service'

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'
import Svg, { Path, Polygon, Circle, Line as SvgLine } from 'react-native-svg'
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

// ─── Template-Specific Prescription Review Card ───────────────────────
function PrescriptionReviewCard({
  template,
  doctorInfo,
  patientInfo,
  diagnosis,
  symptoms,
  medicines,
  advice,
  followUp,
  labTests,
  date,
}: {
  template: Template
  doctorInfo: {
    name?: string
    qualification?: string
    specialization?: string
    regNo?: string
    clinicName?: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
    stampUrl?: string
    signature?: string
  }
  patientInfo: {
    name?: string
    age?: string
    gender?: string
    phone?: string
    weight?: string
    bp?: string
    pulse?: string
    temp?: string
    temperature?: string
    spo2?: string
    respiratoryRate?: string
    rr?: string
    examination?: string
    address?: string
    allergies?: string
    chiefComplaint?: string
  }
  diagnosis: string
  symptoms: string
  medicines: Medicine[]
  advice: string
  followUp: string
  labTests: string[]
  date: string
}) {
  const primaryColor = template.styles?.primaryColor || '#102A56'
  const fontFamSerif = Platform.OS === 'ios' ? 'Georgia' : 'serif'
  const filledMeds = medicines.filter(m => m.name && m.name.trim())

  const rawDoc = (doctorInfo.name || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const qualSpec = [doctorInfo.qualification, doctorInfo.specialization].filter(Boolean).join(', ')

  const renderSigContent = (width = 120, serif = false) => {
    if (doctorInfo.signature && doctorInfo.signature.trim()) {
      return (
        <Image
          source={{ uri: doctorInfo.signature }}
          style={{ height: 36, width, marginBottom: 4 }}
          resizeMode="contain"
        />
      )
    }
    return (
      <Text
        style={{
          fontFamily: serif ? fontFamSerif : undefined,
          fontStyle: 'italic',
          fontWeight: '700',
          fontSize: 15,
          color: '#1e3a8a',
          textAlign: 'center',
          minWidth: width,
          paddingVertical: 3,
        }}
      >
        {doctorDisplayName.startsWith('Dr.') ? doctorDisplayName : `Dr. ${doctorDisplayName}`}
      </Text>
    )
  }

  // 1. CLASSIC LETTERHEAD & DENTAL CLINIC
  if (template.layout === 'classic' || template.id === 'classic-letterhead' || template.id === 'dental-clinic') {
    return (
      <View style={revStyles.classicContainer}>
        {/* Centered Masthead Header */}
        <View style={revStyles.classicHeader}>
          {doctorInfo.logoUrl ? (
            <Image source={{ uri: doctorInfo.logoUrl }} style={revStyles.classicLogo} resizeMode="contain" />
          ) : null}
          <Text style={[revStyles.classicClinic, { color: primaryColor, fontFamily: fontFamSerif }]}>
            {doctorInfo.clinicName?.toUpperCase() || 'MEDICAL CLINIC'}
          </Text>
          <Text style={[revStyles.classicDoc, { fontFamily: fontFamSerif }]}>{doctorDisplayName}</Text>
          {qualSpec ? <Text style={[revStyles.classicQual, { fontFamily: fontFamSerif }]}>{qualSpec}</Text> : null}
          {doctorInfo.regNo ? <Text style={revStyles.classicReg}>Reg. No: {doctorInfo.regNo}</Text> : null}
          <View style={revStyles.classicContact}>
            {doctorInfo.address ? <Text style={[revStyles.classicContactText, { fontFamily: fontFamSerif }]}>📍 {doctorInfo.address}</Text> : null}
            {doctorInfo.phone ? <Text style={[revStyles.classicContactText, { fontFamily: fontFamSerif }]}>☎ {doctorInfo.phone}</Text> : null}
          </View>

          {/* Double Letterhead Divider Line */}
          <View style={[revStyles.classicDoubleTop, { backgroundColor: primaryColor }]} />
          <View style={[revStyles.classicDoubleBottom, { backgroundColor: primaryColor }]} />
        </View>

        {/* Patient + Date Row */}
        <View style={revStyles.classicPatRow}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1, flexWrap: 'wrap' }}>
            <Text style={revStyles.classicPatLabel}>Patient: </Text>
            <Text style={[revStyles.classicPatName, { fontFamily: fontFamSerif }]}>
              {patientInfo.name || '___________________________'}
            </Text>
            {(patientInfo.age || patientInfo.gender) ? (
              <Text style={revStyles.classicPatMeta}>
                {'  '}Age: <Text style={{ fontWeight: '700' }}>{patientInfo.age || '—'}</Text>
                {patientInfo.gender ? ` / ${patientInfo.gender}` : ''}
              </Text>
            ) : null}
          </View>
          <Text style={revStyles.classicDateText}>
            Date: <Text style={{ fontWeight: '700' }}>{date}</Text>
          </Text>
        </View>

        {/* Chief Complaint / Diagnosis Row */}
        {(diagnosis || symptoms) ? (
          <View style={revStyles.classicDiagRow}>
            <Text style={revStyles.classicDiagLabel}>Chief Complaint / Diagnosis: </Text>
            <Text style={[revStyles.classicDiagVal, { fontFamily: fontFamSerif }]}>{diagnosis || symptoms}</Text>
          </View>
        ) : null}

        {/* Large Italic Serif ℞ */}
        <Text style={[revStyles.classicRxSym, { color: primaryColor, fontFamily: fontFamSerif }]}>℞</Text>

        {/* Numbered Medicine List — NO TABLE (Clean dotted letterhead entries) */}
        <View style={{ paddingLeft: 4, minHeight: 80 }}>
          {filledMeds.length === 0 ? (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, fontFamily: fontFamSerif }}>
                No medicines prescribed yet.
              </Text>
            </View>
          ) : (
            filledMeds.map((med, idx) => (
              <View key={med.id || idx} style={revStyles.classicMedItem}>
                <Text style={[revStyles.classicMedTitle, { fontFamily: fontFamSerif }]}>
                  {idx + 1}.  {med.name}{med.strength ? ` — ${med.strength}` : ''}{med.form ? ` (${med.form})` : ''}
                </Text>
                <Text style={[revStyles.classicMedSub, { fontFamily: fontFamSerif }]}>
                  {[med.frequency, med.timing, med.duration].filter(Boolean).join('  ·  ')}
                  {med.instructions ? ` (${med.instructions})` : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Advice & Instructions */}
        {advice ? (
          <View style={revStyles.classicSection}>
            <Text style={revStyles.classicSecTitle}>Advice & Instructions:</Text>
            <Text style={[revStyles.classicSecBody, { fontFamily: fontFamSerif }]}>{advice}</Text>
          </View>
        ) : null}

        {/* Investigations */}
        {labTests && labTests.length > 0 ? (
          <View style={revStyles.classicLabRow}>
            <Text style={revStyles.classicSecTitle}>Investigations: </Text>
            <Text style={[revStyles.classicLabVal, { fontFamily: fontFamSerif }]}>{labTests.join(', ')}</Text>
          </View>
        ) : null}

        {/* Follow-up */}
        {followUp ? (
          <View style={revStyles.classicFollowRow}>
            <Text style={revStyles.classicFollowLabel}>Follow-up on: </Text>
            <Text style={revStyles.classicFollowVal}>{followUp}</Text>
          </View>
        ) : null}

        {/* Signature Block */}
        <View style={revStyles.classicSigArea}>
          {doctorInfo.stampUrl ? (
            <Image source={{ uri: doctorInfo.stampUrl }} style={revStyles.classicStamp} resizeMode="contain" />
          ) : null}
          <View style={revStyles.classicSigBox}>
            {renderSigContent(140, true)}
            <View style={revStyles.classicSigLine} />
            <Text style={[revStyles.classicSigTitle, { fontFamily: fontFamSerif }]}>Doctor's Signature</Text>
            <Text style={[revStyles.classicSigDoc, { fontFamily: fontFamSerif }]}>{doctorDisplayName}</Text>
          </View>
        </View>

        {/* Subtle Watermark Footer */}
        <Text style={[revStyles.classicFooterBrand, { fontFamily: fontFamSerif }]}>prescriptionmaker.in</Text>
      </View>
    )
  }

  // 2. SOAP CLINICAL NOTES
  if (template.layout === 'soap' || template.id === 'soap-clinical') {
    const sColor = '#7c3aed'
    const oColor = '#1d4ed8'
    const aColor = '#065f46'
    const pColor = '#312e81'

    const vitalsPills = [
      { label: 'BP', value: patientInfo.bp || '______' },
      { label: 'HR (bpm)', value: patientInfo.pulse || '______' },
      { label: 'Temp (°F)', value: patientInfo.temp || patientInfo.temperature || '______' },
      { label: 'SpO₂ (%)', value: patientInfo.spo2 || '______' },
      { label: 'Weight (kg)', value: patientInfo.weight || '______' },
      { label: 'RR (/min)', value: patientInfo.respiratoryRate || patientInfo.rr || '______' },
    ]

    return (
      <View style={revStyles.soapContainer}>
        {/* Header Banner (Deep Indigo) */}
        <View style={revStyles.soapHeaderBanner}>
          <View style={revStyles.soapHeaderLeft}>
            {doctorInfo.logoUrl ? (
              <Image source={{ uri: doctorInfo.logoUrl }} style={revStyles.soapDocLogo} resizeMode="contain" />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={revStyles.soapDocName}>{doctorDisplayName}</Text>
              <Text style={revStyles.soapDocQual}>{qualSpec}</Text>
              {doctorInfo.regNo ? <Text style={revStyles.soapDocReg}>Reg: {doctorInfo.regNo}</Text> : null}
            </View>
          </View>
          <View style={revStyles.soapHeaderRight}>
            <Text style={revStyles.soapClinicName} numberOfLines={1}>{doctorInfo.clinicName?.toUpperCase() || 'CLINICAL CARE CENTRE'}</Text>
            {doctorInfo.phone ? <Text style={revStyles.soapMetaText}>☎ {doctorInfo.phone}</Text> : null}
            {doctorInfo.address ? <Text style={revStyles.soapMetaText} numberOfLines={1}>📍 {doctorInfo.address}</Text> : null}
          </View>
        </View>

        <View style={revStyles.soapBody}>
          {/* Patient + Date Bar (Lavender Card) */}
          <View style={revStyles.soapPatRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1, flexWrap: 'wrap' }}>
              <Text style={revStyles.soapPatLabel}>Patient: </Text>
              <Text style={revStyles.soapPatName}>{patientInfo.name || 'Patient Name'}</Text>
              {[patientInfo.age ? `Age ${patientInfo.age}` : '', patientInfo.gender].filter(Boolean).length > 0 && (
                <Text style={revStyles.soapPatAge}>
                  {'  '}{[patientInfo.age ? `Age ${patientInfo.age}` : '', patientInfo.gender].filter(Boolean).join(' / ')}
                </Text>
              )}
            </View>
            <Text style={revStyles.soapDateText}>Date: <Text style={{ fontWeight: '700' }}>{date}</Text></Text>
          </View>

          {/* S — SUBJECTIVE Box */}
          <View style={[revStyles.soapCard, { borderColor: sColor + '40' }]}>
            <View style={[revStyles.soapCardHeader, { backgroundColor: sColor }]}>
              <Text style={[revStyles.soapCardLetter, { fontFamily: fontFamSerif }]}>S</Text>
              <Text style={revStyles.soapCardTitle}>SUBJECTIVE — CHIEF COMPLAINT &amp; HISTORY</Text>
            </View>
            <View style={revStyles.soapCardBody}>
              <Text style={revStyles.soapBodyText}>
                {symptoms || diagnosis || 'Patient presents for clinical evaluation'}
              </Text>
            </View>
          </View>

          {/* O — OBJECTIVE Box */}
          <View style={[revStyles.soapCard, { borderColor: oColor + '40' }]}>
            <View style={[revStyles.soapCardHeader, { backgroundColor: oColor }]}>
              <Text style={[revStyles.soapCardLetter, { fontFamily: fontFamSerif }]}>O</Text>
              <Text style={revStyles.soapCardTitle}>OBJECTIVE — VITALS &amp; EXAMINATION FINDINGS</Text>
            </View>
            <View style={revStyles.soapCardBody}>
              {/* Vitals Pills Grid */}
              <View style={revStyles.soapVitalsGrid}>
                {vitalsPills.map(v => (
                  <View key={v.label} style={revStyles.soapVitalPill}>
                    <Text style={revStyles.soapVitalLabel}>{v.label}: </Text>
                    <Text style={revStyles.soapVitalVal}>{v.value}</Text>
                  </View>
                ))}
              </View>
              <Text style={revStyles.soapExamText}>
                Examination findings: {patientInfo.examination || symptoms || 'Normal heart sounds, clear chest, abdomen soft.'}
              </Text>
            </View>
          </View>

          {/* A — ASSESSMENT Box */}
          <View style={[revStyles.soapCard, { borderColor: aColor + '40' }]}>
            <View style={[revStyles.soapCardHeader, { backgroundColor: aColor }]}>
              <Text style={[revStyles.soapCardLetter, { fontFamily: fontFamSerif }]}>A</Text>
              <Text style={revStyles.soapCardTitle}>ASSESSMENT — DIAGNOSIS</Text>
            </View>
            <View style={revStyles.soapCardBody}>
              <Text style={revStyles.soapDiagText}>
                {diagnosis || 'Primary Clinical Diagnosis'}
              </Text>
            </View>
          </View>

          {/* P — PLAN Box */}
          <View style={[revStyles.soapCard, { borderColor: pColor + '40' }]}>
            <View style={[revStyles.soapCardHeader, { backgroundColor: pColor }]}>
              <Text style={[revStyles.soapCardLetter, { fontFamily: fontFamSerif }]}>P</Text>
              <Text style={revStyles.soapCardTitle}>PLAN — MEDICATIONS, INVESTIGATIONS &amp; ADVICE</Text>
            </View>
            <View style={revStyles.soapCardBody}>
              <Text style={revStyles.soapRxTitle}>℞ Medications</Text>

              {/* 4-Column Table */}
              <View style={revStyles.soapTableHeader}>
                <Text style={[revStyles.soapTableColHeader, { width: '42%' }]}>Drug</Text>
                <Text style={[revStyles.soapTableColHeader, { width: '20%', textAlign: 'center' }]}>Dose</Text>
                <Text style={[revStyles.soapTableColHeader, { width: '20%', textAlign: 'center' }]}>Frequency</Text>
                <Text style={[revStyles.soapTableColHeader, { width: '18%', textAlign: 'center' }]}>Duration</Text>
              </View>

              {filledMeds.length === 0 ? (
                <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11 }}>No medications prescribed</Text>
                </View>
              ) : (
                filledMeds.map((med, idx) => (
                  <View key={med.id || idx} style={revStyles.soapTableRow}>
                    <View style={{ width: '42%' }}>
                      <Text style={revStyles.soapMedName}>{med.name}{med.strength ? ` ${med.strength}` : ''}</Text>
                      {med.instructions ? <Text style={revStyles.soapMedInst}>({med.instructions})</Text> : null}
                    </View>
                    <Text style={[revStyles.soapTableCell, { width: '20%', textAlign: 'center' }]}>{med.form || '—'}</Text>
                    <Text style={[revStyles.soapTableCell, { width: '20%', textAlign: 'center' }]}>{med.frequency || '—'}</Text>
                    <Text style={[revStyles.soapTableCell, { width: '18%', textAlign: 'center' }]}>{med.duration || '—'}</Text>
                  </View>
                ))
              )}

              {/* Investigations */}
              {labTests && labTests.length > 0 ? (
                <View style={revStyles.soapPlanItem}>
                  <Text style={revStyles.soapPlanLabel}>Investigations: </Text>
                  <Text style={revStyles.soapPlanVal}>{labTests.join(', ')}</Text>
                </View>
              ) : null}

              {/* Advice */}
              {advice ? (
                <View style={revStyles.soapPlanItem}>
                  <Text style={revStyles.soapPlanLabel}>Advice / Patient Education: </Text>
                  <Text style={revStyles.soapPlanVal}>{advice}</Text>
                </View>
              ) : null}

              {/* Follow-up */}
              {followUp ? (
                <View style={revStyles.soapPlanItem}>
                  <Text style={revStyles.soapPlanLabel}>Follow-up: </Text>
                  <Text style={revStyles.soapPlanVal}>{followUp}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Footer / Signature Area */}
        <View style={revStyles.soapFooter}>
          <Text style={revStyles.soapBrand}>SOAP Clinical Notes · prescriptionmaker.in</Text>
          <View style={revStyles.soapSigBlock}>
            {renderSigContent(130, false)}
            <View style={revStyles.soapSigLine} />
            <Text style={revStyles.soapSigTitle}>Doctor's Signature</Text>
            <Text style={revStyles.soapSigDoc}>{doctorDisplayName}</Text>
          </View>
        </View>
      </View>
    )
  }

  // 3. VITALS-FIRST (Cardiology & Specialty)
  if (template.id === 'vitals-first') {
    const crimsonColor = '#9b2335'
    const rawBp = (patientInfo.bp || (patientInfo as any).bloodPressure || '').trim()
    const rawPulse = (patientInfo.pulse || (patientInfo as any).heartRate || (patientInfo as any).hr || '').trim()
    const rawSpo2 = (patientInfo.spo2 || (patientInfo as any).spO2 || '').trim()
    const rawTemp = (patientInfo.temp || patientInfo.temperature || '').trim()
    const rawWeight = (patientInfo.weight || '').trim()
    const rawRR = (patientInfo.respiratoryRate || (patientInfo as any).rr || '').trim()

    const bpVal = rawBp || '120/80'
    const hrVal = rawPulse || '72'
    const spo2Val = rawSpo2 ? (rawSpo2.includes('%') ? rawSpo2 : `${rawSpo2}%`) : '98%'
    const tempVal = rawTemp ? (rawTemp.includes('°') ? rawTemp : `${rawTemp}°F`) : '98.4°F'
    const wtVal = rawWeight ? (rawWeight.toLowerCase().includes('kg') ? rawWeight : `${rawWeight} kg`) : '70 kg'
    const rrVal = rawRR || '16'

    const defaultInvestigationItems = ['ECG', 'ECHO (TTE)', 'TMT', 'Holter', 'Lipid Profile', 'HbA1c', 'CBC', 'LFT/KFT']
    const userTests = (labTests && labTests.length > 0) ? labTests : []
    const combinedTests = Array.from(new Set([...defaultInvestigationItems, ...userTests]))

    return (
      <View style={revStyles.vfContainer}>
        {/* Top Crimson Header */}
        <View style={revStyles.vfHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={revStyles.vfDocName}>{doctorDisplayName}</Text>
            <Text style={revStyles.vfDocQual}>{doctorInfo.qualification || 'MBBS, MD'}</Text>
            <Text style={revStyles.vfDocSpec}>{doctorInfo.specialization || 'General Medicine'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={revStyles.vfClinicName}>{doctorInfo.clinicName || 'Name of your clinic'}</Text>
          </View>
        </View>

        {/* Patient Bar */}
        <View style={revStyles.vfPatBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <Text style={revStyles.vfPatLabel}>PATIENT: </Text>
            <Text style={revStyles.vfPatName}>{patientInfo.name || 'Patient full name'}</Text>
            <Text style={revStyles.vfPatMeta}>Age: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{patientInfo.age || '—'}</Text>  Sex: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{patientInfo.gender || '—'}</Text></Text>
          </View>
          <Text style={revStyles.vfDate}>Date: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{date}</Text></Text>
        </View>

        {/* ❤️ VITALS 2x3 Grid (Matching Screenshot 1) */}
        <View style={revStyles.vfVitalsBox}>
          <View style={revStyles.vfVitalsBanner}>
            <Text style={revStyles.vfVitalsBannerText}>❤️ VITALS</Text>
          </View>
          <View style={revStyles.vfVitalsGrid2x3}>
            {/* Row 1 */}
            <View style={revStyles.vfVitalsRow}>
              <View style={[revStyles.vfVitalCell, { borderRightWidth: 1, borderRightColor: 'rgba(155, 35, 53, 0.2)' }]}>
                <Text style={revStyles.vfVitalLabel}>BLOOD PRESSURE</Text>
                <Text style={revStyles.vfVitalUnit}>(mmHg)</Text>
                <View style={revStyles.vfVitalLine}>
                  <Text style={revStyles.vfVitalVal}>{bpVal}</Text>
                </View>
              </View>
              <View style={[revStyles.vfVitalCell, { borderRightWidth: 1, borderRightColor: 'rgba(155, 35, 53, 0.2)' }]}>
                <Text style={revStyles.vfVitalLabel}>HEART RATE</Text>
                <Text style={revStyles.vfVitalUnit}>(bpm)</Text>
                <View style={revStyles.vfVitalLine}>
                  <Text style={revStyles.vfVitalVal}>{hrVal}</Text>
                </View>
              </View>
              <View style={revStyles.vfVitalCell}>
                <Text style={revStyles.vfVitalLabel}>SPO₂</Text>
                <Text style={revStyles.vfVitalUnit}>(%)</Text>
                <View style={revStyles.vfVitalLine}>
                  <Text style={revStyles.vfVitalVal}>{spo2Val}</Text>
                </View>
              </View>
            </View>

            {/* Row 2 */}
            <View style={[revStyles.vfVitalsRow, { borderTopWidth: 1, borderTopColor: 'rgba(155, 35, 53, 0.2)' }]}>
              <View style={[revStyles.vfVitalCell, { borderRightWidth: 1, borderRightColor: 'rgba(155, 35, 53, 0.2)' }]}>
                <Text style={revStyles.vfVitalLabel}>TEMPERATURE</Text>
                <Text style={revStyles.vfVitalUnit}>(°F)</Text>
                <View style={revStyles.vfVitalLine}>
                  <Text style={revStyles.vfVitalVal}>{tempVal}</Text>
                </View>
              </View>
              <View style={[revStyles.vfVitalCell, { borderRightWidth: 1, borderRightColor: 'rgba(155, 35, 53, 0.2)' }]}>
                <Text style={revStyles.vfVitalLabel}>WEIGHT</Text>
                <Text style={revStyles.vfVitalUnit}>(kg)</Text>
                <View style={revStyles.vfVitalLine}>
                  <Text style={revStyles.vfVitalVal}>{wtVal}</Text>
                </View>
              </View>
              <View style={revStyles.vfVitalCell}>
                <Text style={revStyles.vfVitalLabel}>RR</Text>
                <Text style={revStyles.vfVitalUnit}>(/min)</Text>
                <View style={revStyles.vfVitalLine}>
                  <Text style={revStyles.vfVitalVal}>{rrVal}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Diagnosis Bar */}
        <View style={revStyles.vfDiagBar}>
          <Text style={revStyles.vfDiagTag}>DIAGNOSIS:</Text>
          <Text style={revStyles.vfDiagText}>{diagnosis || 'Acute Pharyngitis'}</Text>
        </View>

        {/* ℞ Prescription Medicines */}
        <View style={revStyles.vfRxSection}>
          <View style={revStyles.vfRxTitleRow}>
            <Text style={revStyles.vfRxGlyph}>℞</Text>
            <Text style={revStyles.vfRxHeading}>PRESCRIPTION MEDICINES</Text>
          </View>

          {/* Table Header */}
          <View style={revStyles.vfTableHead}>
            <Text style={[revStyles.vfTh, { width: 22, textAlign: 'center' }]}>#</Text>
            <Text style={[revStyles.vfTh, { flex: 1.8 }]}>Medicine (Strength)</Text>
            <Text style={[revStyles.vfTh, { width: 50, textAlign: 'center' }]}>Dosage</Text>
            <Text style={[revStyles.vfTh, { flex: 1, textAlign: 'center' }]}>Frequency</Text>
            <Text style={[revStyles.vfTh, { width: 55, textAlign: 'center' }]}>Duration</Text>
            <Text style={[revStyles.vfTh, { width: 40, textAlign: 'center' }]}>Qty</Text>
          </View>

          {/* Table Rows */}
          {filledMeds.map((med, i) => (
            <View key={med.id || i} style={[revStyles.vfTableRow, i % 2 === 0 ? { backgroundColor: '#ffffff' } : { backgroundColor: '#fff5f5' }]}>
              <Text style={[revStyles.vfTd, { width: 22, textAlign: 'center', fontWeight: '700', color: crimsonColor }]}>{i + 1}</Text>
              <View style={{ flex: 1.8 }}>
                <Text style={revStyles.vfMedName}>{med.name} {med.strength ? `(${med.strength})` : ''}</Text>
                {med.instructions ? <Text style={revStyles.vfMedInst}>{med.instructions}</Text> : null}
              </View>
              <Text style={[revStyles.vfTd, { width: 50, textAlign: 'center', color: '#64748b' }]}>{med.form || (med as any).dosage || '—'}</Text>
              <Text style={[revStyles.vfTd, { flex: 1, textAlign: 'center', fontWeight: '600' }]}>{med.frequency || '—'}</Text>
              <Text style={[revStyles.vfTd, { width: 55, textAlign: 'center', color: '#475569' }]}>{med.duration || '—'}</Text>
              <Text style={[revStyles.vfTd, { width: 40, textAlign: 'center', color: '#475569' }]}>{(med as any).qty || '—'}</Text>
            </View>
          ))}
        </View>

        {/* CARDIAC INVESTIGATIONS (Matching Screenshot 2) */}
        <View style={revStyles.vfInvCard}>
          <Text style={revStyles.vfInvTitle}>CARDIAC INVESTIGATIONS</Text>
          <View style={revStyles.vfInvGrid}>
            {combinedTests.map((test, idx) => {
              const isChecked = userTests.includes(test)
              return (
                <View key={idx} style={revStyles.vfInvItem}>
                  <View style={[revStyles.vfCheckboxSquare, isChecked && { backgroundColor: crimsonColor, borderColor: crimsonColor }]}>
                    {isChecked ? <Ionicons name="checkmark" size={9} color="#fff" /> : null}
                  </View>
                  <Text style={revStyles.vfInvText}>{test}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Advice */}
        {advice ? (
          <View style={revStyles.vfAdviceBox}>
            <Text style={revStyles.vfAdviceTitle}>Clinical Advice &amp; Lifestyle Guidance:</Text>
            <Text style={revStyles.vfAdviceText}>{advice}</Text>
          </View>
        ) : null}

        {/* Follow-up & Doctor's Signature (Matching Screenshot 2) */}
        <View style={revStyles.vfFollowSigRow}>
          <Text style={revStyles.vfFollowText}>
            Follow-up Date: <Text style={revStyles.vfFollowUnderline}>{followUp || '______________'}</Text>
          </Text>

          <View style={revStyles.vfSigBlock}>
            {renderSigContent(130, false)}
            <View style={revStyles.vfSigLine} />
            <Text style={revStyles.vfSigTitle}>Doctor's Signature</Text>
            <Text style={revStyles.vfSigDoc}>{doctorDisplayName}</Text>
          </View>
        </View>

        {/* Bottom Crimson Bar (Matching Screenshot 2) */}
        <View style={revStyles.vfBottomBar}>
          <Text style={revStyles.vfBottomText}>{doctorInfo.clinicName || 'Name of your clinic'}</Text>
          <Text style={revStyles.vfBottomText}>prescriptionmaker.in</Text>
        </View>
      </View>
    )
  }

  // 3.5 DETAILED DRUG CHART
  if (template.id === 'detailed-drug-chart' || template.layout === 'detailed') {
    const forestGreen = '#065f46'
    const formatRoute = (m: Medicine) => {
      if ((m as any).route) return (m as any).route
      const form = (m.form || '').toLowerCase()
      if (form.includes('inj')) return 'IV / IM'
      if (form.includes('drop')) return 'Drops'
      if (form.includes('cream') || form.includes('oint') || form.includes('gel')) return 'Topical'
      if (form.includes('inhale')) return 'Inhalation'
      return 'Oral'
    }

    const formatTiming = (m: Medicine) => {
      if ((m as any).timing) return (m as any).timing
      const inst = (m.instructions || '').toLowerCase()
      if (inst.includes('after meal') || inst.includes('after food')) return 'After Meals'
      if (inst.includes('before meal') || inst.includes('before food') || inst.includes('empty stomach')) return 'Before Meals'
      if (inst.includes('bedtime') || inst.includes('night')) return 'At Bedtime'
      if (inst.includes('morning')) return 'Morning'
      return '—'
    }

    const medsToRender = (filledMeds && filledMeds.length > 0)
      ? filledMeds
      : [
          { id: 'sample-1', name: 'Medicine Name', strength: '', form: 'Oral', frequency: '—', duration: '5 days', instructions: '' },
          { id: 'sample-2', name: 'Second Medicine', strength: '', form: 'Oral', frequency: '—', duration: '3 days', instructions: '' },
        ]

    return (
      <View style={revStyles.ddcContainer}>
        {/* Top Forest Green Header */}
        <View style={revStyles.ddcHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={revStyles.ddcDocName}>{doctorDisplayName}</Text>
            <Text style={revStyles.ddcDocQual}>{doctorInfo.qualification || 'MBBS, MD'} · {doctorInfo.specialization || 'General Medicine'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={revStyles.ddcClinicName}>{doctorInfo.clinicName || 'Name of your clinic'}</Text>
          </View>
        </View>

        {/* Side-by-Side Patient & Diagnosis Cards */}
        <View style={revStyles.ddcCardsRow}>
          {/* Patient Card */}
          <View style={revStyles.ddcPatientCard}>
            <Text style={revStyles.ddcCardLabel}>PATIENT</Text>
            <Text style={revStyles.ddcCardName}>{patientInfo.name || 'Patient full name'}</Text>
            <Text style={revStyles.ddcCardMeta}>Age {patientInfo.age || '34'} · {patientInfo.gender || 'Male'} · Date: {date}</Text>
          </View>

          {/* Diagnosis Card */}
          <View style={revStyles.ddcDiagCard}>
            <Text style={revStyles.ddcDiagLabel}>DIAGNOSIS</Text>
            <Text style={revStyles.ddcDiagText}>{diagnosis || 'Acute Pharyngitis'}</Text>
          </View>
        </View>

        {/* ℞ Line */}
        <View style={revStyles.ddcRxRow}>
          <Text style={revStyles.ddcRxGlyph}>℞</Text>
          <View style={revStyles.ddcRxLine} />
        </View>

        {/* Detailed Drug Cards */}
        <View style={{ marginHorizontal: 12 }}>
          {medsToRender.map((med, i) => (
            <View key={med.id || i} style={revStyles.ddcDrugCard}>
              {/* Card Header */}
              <View style={revStyles.ddcDrugHeader}>
                <Text style={revStyles.ddcDrugNum}>{i + 1}</Text>
                <Text style={revStyles.ddcDrugName}>
                  {med.name} {med.strength ? `(${med.strength})` : ''}
                </Text>
              </View>

              {/* 4 Columns Details */}
              <View style={revStyles.ddcDrugFieldsRow}>
                <View style={revStyles.ddcDrugFieldCell}>
                  <Text style={revStyles.ddcDrugFieldLabel}>ROUTE</Text>
                  <Text style={revStyles.ddcDrugFieldVal}>{formatRoute(med)}</Text>
                </View>
                <View style={revStyles.ddcDrugFieldCell}>
                  <Text style={revStyles.ddcDrugFieldLabel}>FREQUENCY</Text>
                  <Text style={revStyles.ddcDrugFieldVal}>{med.frequency || '—'}</Text>
                </View>
                <View style={revStyles.ddcDrugFieldCell}>
                  <Text style={revStyles.ddcDrugFieldLabel}>TIMING</Text>
                  <Text style={revStyles.ddcDrugFieldVal}>{formatTiming(med)}</Text>
                </View>
                <View style={revStyles.ddcDrugFieldCell}>
                  <Text style={revStyles.ddcDrugFieldLabel}>DURATION</Text>
                  <Text style={[revStyles.ddcDrugFieldVal, { fontWeight: '700', color: forestGreen }]}>{med.duration || '—'}</Text>
                </View>
              </View>

              {/* Optional Instructions */}
              {med.instructions ? (
                <View style={revStyles.ddcDrugNotes}>
                  <Text style={revStyles.ddcDrugNotesText}>
                    <Text style={{ fontWeight: '700', color: forestGreen }}>Note: </Text>
                    {med.instructions}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Optional Lab Investigations & Advice */}
        {((labTests && labTests.length > 0) || advice) ? (
          <View style={revStyles.ddcAdviceRow}>
            {labTests && labTests.length > 0 ? (
              <View style={[revStyles.ddcAdviceCard, { backgroundColor: '#ffffff' }]}>
                <Text style={revStyles.ddcAdviceLabel}>LAB INVESTIGATIONS</Text>
                <Text style={revStyles.ddcAdviceText}>{labTests.join(', ')}</Text>
              </View>
            ) : null}
            {advice ? (
              <View style={[revStyles.ddcAdviceCard, { backgroundColor: '#f0fdf4' }]}>
                <Text style={revStyles.ddcAdviceLabel}>SPECIAL INSTRUCTIONS / ADVICE</Text>
                <Text style={revStyles.ddcAdviceText}>{advice}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Doctor's Signature on Left & Follow-up on Right */}
        <View style={revStyles.ddcSigRow}>
          <View style={revStyles.ddcSigBlock}>
            {renderSigContent(120, false)}
            <View style={revStyles.ddcSigLine} />
            <Text style={revStyles.ddcSigTitle}>Doctor's Signature</Text>
            <Text style={revStyles.ddcSigDoc}>{doctorDisplayName}</Text>
          </View>

          {followUp ? (
            <Text style={revStyles.ddcFollowText}>
              Follow-up: <Text style={{ fontWeight: '700', color: forestGreen }}>{followUp}</Text>
            </Text>
          ) : null}
        </View>

        {/* Bottom Pill Bar */}
        <View style={revStyles.ddcBottomBar}>
          <Text style={revStyles.ddcBottomText}>Detailed Drug Chart Template · prescriptionmaker.in</Text>
        </View>
      </View>
    )
  }

  // 4. TWO-COLUMN SIDEBAR
  if (template.layout === 'two-column' || template.id === 'two-column-sidebar') {
    return (
      <View style={revStyles.twoColContainer}>
        {/* Left Sidebar */}
        <View style={[revStyles.twoColSidebar, { backgroundColor: primaryColor }]}>
          {doctorInfo.logoUrl ? (
            <Image source={{ uri: doctorInfo.logoUrl }} style={revStyles.twoColLogo} resizeMode="contain" />
          ) : null}
          <Text style={revStyles.twoColDoc}>{doctorDisplayName}</Text>
          <Text style={revStyles.twoColQual}>{doctorInfo.qualification || 'Consultant'}</Text>
          <View style={revStyles.twoColDivider} />
          <Text style={revStyles.twoColSecHeader}>CLINIC</Text>
          <Text style={revStyles.twoColClinic}>{doctorInfo.clinicName || 'Medical Clinic'}</Text>
          {doctorInfo.phone ? <Text style={revStyles.twoColMeta}>📞 {doctorInfo.phone}</Text> : null}
          <View style={revStyles.twoColDivider} />
          <Text style={revStyles.twoColSecHeader}>VITALS</Text>
          <Text style={revStyles.twoColMeta}>BP: {patientInfo.bp || '—'}</Text>
          <Text style={revStyles.twoColMeta}>Pulse: {patientInfo.pulse || '—'}</Text>
          <Text style={revStyles.twoColMeta}>Temp: {patientInfo.temperature || '—'}</Text>
          <Text style={revStyles.twoColMeta}>Weight: {patientInfo.weight || '—'}</Text>
        </View>

        {/* Right Content */}
        <View style={revStyles.twoColMain}>
          <View style={revStyles.twoColPatRow}>
            <View style={{ flex: 1 }}>
              <Text style={revStyles.twoColPatName}>{patientInfo.name || 'Patient Name'}</Text>
              <Text style={revStyles.twoColPatSub}>Age: {patientInfo.age || '—'} {patientInfo.gender}</Text>
            </View>
            <Text style={revStyles.twoColDate}>{date}</Text>
          </View>

          {diagnosis ? (
            <View style={revStyles.twoColDiagBox}>
              <Text style={revStyles.twoColDiagLabel}>Diagnosis</Text>
              <Text style={revStyles.twoColDiagVal}>{diagnosis}</Text>
            </View>
          ) : null}

          <Text style={[revStyles.twoColRx, { color: primaryColor }]}>℞</Text>
          {filledMeds.map((med, i) => (
            <View key={med.id || i} style={revStyles.twoColMedItem}>
              <Text style={revStyles.twoColMedName}>{i + 1}. {med.name} {med.strength}</Text>
              <Text style={revStyles.twoColMedDetail}>
                {[med.frequency, med.timing, med.duration].filter(Boolean).join('  ·  ')}
              </Text>
            </View>
          ))}

          {advice ? (
            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6 }}>
              <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>Advice:</Text>
              <Text style={{ fontSize: 11, color: '#334155' }}>{advice}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 14, alignItems: 'flex-end' }}>
            {renderSigContent(100, false)}
            <View style={{ borderTopWidth: 1, borderTopColor: '#94a3b8', width: 100, paddingTop: 2 }}>
              <Text style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>Doctor's Signature</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 4. MULTI-SECTION BOXED (Exact match to multi-section-boxed.jpg)
  if (template.layout === 'boxed' || template.id === 'multi-section-boxed') {
    const navyColor = '#0c3258'
    const chiefComplaint = symptoms || (patientInfo as any).chiefComplaint || diagnosis || 'Acute Pharyngitis'
    const diagText = diagnosis || 'Acute Pharyngitis'

    const medsToRender = (filledMeds && filledMeds.length > 0)
      ? filledMeds
      : [
          { id: 'sample-1', name: 'Medicine Name', strength: '', form: '—', frequency: '—', duration: '5 days', instructions: '' },
          { id: 'sample-2', name: 'Second Medicine', strength: '', form: '—', frequency: '—', duration: '3 days', instructions: '' },
        ]

    return (
      <View style={revStyles.msbContainer}>
        {/* Top Deep Navy Header */}
        <View style={revStyles.msbHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={revStyles.msbDocName}>{doctorDisplayName}</Text>
            <Text style={revStyles.msbDocQual}>{doctorInfo.qualification || 'MBBS, MD'} · {doctorInfo.specialization || 'General Medicine'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={revStyles.msbClinicName}>{doctorInfo.clinicName || 'Name of your clinic'}</Text>
          </View>
        </View>

        <View style={revStyles.msbBody}>
          {/* Row 1: Side-by-Side Patient & Date/Ref Boxes */}
          <View style={revStyles.msbSplitRow}>
            {/* Box 1: Patient Information (Sky Blue Banner) */}
            <View style={[revStyles.msbBox, { flex: 1.3 }]}>
              <View style={revStyles.msbBannerSky}>
                <Text style={revStyles.msbBannerText}>PATIENT INFORMATION</Text>
              </View>
              <View style={revStyles.msbBoxBody}>
                <Text style={revStyles.msbPatName}>{patientInfo.name || 'Patient full name'}</Text>
                <Text style={revStyles.msbPatMeta}>
                  Age: {patientInfo.age || '34'} · Sex: {patientInfo.gender || 'Male'}{patientInfo.weight ? ` · Wt: ${patientInfo.weight}` : ''}
                </Text>
              </View>
            </View>

            {/* Box 2: Date & Reference (Sky Blue Banner) */}
            <View style={[revStyles.msbBox, { flex: 1 }]}>
              <View style={revStyles.msbBannerSky}>
                <Text style={revStyles.msbBannerText}>DATE & REFERENCE</Text>
              </View>
              <View style={revStyles.msbBoxBody}>
                <Text style={revStyles.msbDateText}>Date: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{date}</Text></Text>
                <Text style={revStyles.msbRefText}>Reg: {doctorInfo.regNo || '________'}</Text>
              </View>
            </View>
          </View>

          {/* Box 3: Chief Complaint (Navy Banner) */}
          <View style={revStyles.msbBox}>
            <View style={revStyles.msbBannerNavy}>
              <Text style={revStyles.msbBannerText}>CHIEF COMPLAINT</Text>
            </View>
            <View style={revStyles.msbBoxBody}>
              <Text style={revStyles.msbComplaintText}>{chiefComplaint}</Text>
            </View>
          </View>

          {/* Box 4: Diagnosis (Navy Banner) */}
          <View style={revStyles.msbBox}>
            <View style={revStyles.msbBannerNavy}>
              <Text style={revStyles.msbBannerText}>DIAGNOSIS</Text>
            </View>
            <View style={revStyles.msbBoxBody}>
              <Text style={revStyles.msbDiagText}>{diagText}</Text>
            </View>
          </View>

          {/* Box 5: ℞ Prescription (Navy Banner) */}
          <View style={revStyles.msbBox}>
            <View style={revStyles.msbBannerNavy}>
              <Text style={revStyles.msbBannerText}>℞ PRESCRIPTION</Text>
            </View>
            {/* Table Header */}
            <View style={revStyles.msbTableHead}>
              <Text style={[revStyles.msbTh, { flex: 1.8 }]}>Drug</Text>
              <Text style={[revStyles.msbTh, { width: 50, textAlign: 'center' }]}>Unit</Text>
              <Text style={[revStyles.msbTh, { flex: 1, textAlign: 'center' }]}>Frequency</Text>
              <Text style={[revStyles.msbTh, { width: 65, textAlign: 'center' }]}>Duration</Text>
            </View>
            {/* Table Rows */}
            {medsToRender.map((med, i) => (
              <View key={med.id || i} style={[revStyles.msbTableRow, i < medsToRender.length - 1 && revStyles.msbTableBorder]}>
                <View style={{ flex: 1.8 }}>
                  <Text style={revStyles.msbMedName}>{i + 1}. {med.name} {med.strength ? `(${med.strength})` : ''}</Text>
                  {med.instructions ? <Text style={revStyles.msbMedInst}>{med.instructions}</Text> : null}
                </View>
                <Text style={[revStyles.msbTd, { width: 50, textAlign: 'center', color: '#64748b' }]}>{med.form || (med as any).unit || '—'}</Text>
                <Text style={[revStyles.msbTd, { flex: 1, textAlign: 'center', fontWeight: '600' }]}>{med.frequency || '—'}</Text>
                <Text style={[revStyles.msbTd, { width: 65, textAlign: 'center', color: '#475569' }]}>{med.duration || '—'}</Text>
              </View>
            ))}
          </View>

          {/* Row 6: Side-by-Side Investigations & Advice Boxes */}
          <View style={revStyles.msbSplitRow}>
            {/* Box 6: Investigations (Sky Blue Banner) */}
            <View style={[revStyles.msbBox, { flex: 1 }]}>
              <View style={revStyles.msbBannerSky}>
                <Text style={revStyles.msbBannerText}>INVESTIGATIONS</Text>
              </View>
              <View style={[revStyles.msbBoxBody, { minHeight: 40 }]}>
                <Text style={[revStyles.msbBoxContent, (labTests && labTests.length > 0) ? { color: '#0f172a' } : { color: '#94a3b8' }]}>
                  {(labTests && labTests.length > 0) ? labTests.join(', ') : 'Tests ordered...'}
                </Text>
              </View>
            </View>

            {/* Box 7: Advice (Sky Blue Banner) */}
            <View style={[revStyles.msbBox, { flex: 1 }]}>
              <View style={revStyles.msbBannerSky}>
                <Text style={revStyles.msbBannerText}>ADVICE</Text>
              </View>
              <View style={[revStyles.msbBoxBody, { minHeight: 40 }]}>
                <Text style={[revStyles.msbBoxContent, advice ? { color: '#0f172a' } : { color: '#94a3b8' }]}>
                  {advice || 'Patient advice...'}
                </Text>
              </View>
            </View>
          </View>

          {/* Doctor's Signature (Left Aligned matching template) & Follow-up */}
          <View style={revStyles.msbSigRow}>
            <View style={revStyles.msbSigBlock}>
              {renderSigContent(120, false)}
              <View style={revStyles.msbSigLine} />
              <Text style={revStyles.msbSigTitle}>Doctor's Signature</Text>
              <Text style={revStyles.msbSigDoc}>{doctorDisplayName}</Text>
            </View>

            {followUp ? (
              <Text style={revStyles.msbFollowText}>
                Follow-up: <Text style={{ fontWeight: '700', color: navyColor }}>{followUp}</Text>
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    )
  }

  // 5. MINIMAL PRINT RULED TEMPLATE
  if (template.id === 'minimal-print-ruled' || template.layout === 'minimal') {
    const ageGenderText = [
      patientInfo.age ? `Age ${patientInfo.age}` : '',
      patientInfo.gender || '',
    ].filter(Boolean).join(' / ')

    return (
      <View style={revStyles.mprContainer}>
        {/* Header Left-Aligned */}
        <View style={revStyles.mprHeader}>
          <Text style={[revStyles.mprClinicName, { fontFamily: fontFamSerif }]}>
            {doctorInfo.clinicName || 'Name of your clinic'}
          </Text>
          <View style={revStyles.mprDocRow}>
            <Text style={[revStyles.mprDocName, { fontFamily: fontFamSerif }]}>
              {doctorDisplayName}
            </Text>
            {qualSpec ? (
              <Text style={[revStyles.mprDocQual, { fontFamily: fontFamSerif }]}>
                {'  '}{qualSpec}
              </Text>
            ) : null}
            {doctorInfo.regNo ? (
              <Text style={[revStyles.mprDocReg, { fontFamily: fontFamSerif }]}>
                {'  '}· Reg: {doctorInfo.regNo}
              </Text>
            ) : null}
          </View>
          {doctorInfo.address || doctorInfo.phone ? (
            <Text style={[revStyles.mprContact, { fontFamily: fontFamSerif }]}>
              {[doctorInfo.address, doctorInfo.phone].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        {/* Thick 2px Solid Dark Rule */}
        <View style={revStyles.mprMainRule} />

        {/* Patient Bar */}
        <View style={revStyles.mprPatientBar}>
          <View style={revStyles.mprPatLine1}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1, flexWrap: 'wrap' }}>
              <Text style={[revStyles.mprPatLabel, { fontFamily: fontFamSerif }]}>Patient: </Text>
              <Text style={[revStyles.mprPatNameVal, { fontFamily: fontFamSerif }]}>
                {patientInfo.name || 'Patient full name'}
              </Text>
              {ageGenderText ? (
                <Text style={[revStyles.mprPatMeta, { fontFamily: fontFamSerif }]}>
                  {'   '}{ageGenderText}
                </Text>
              ) : null}
            </View>
            <Text style={[revStyles.mprDateVal, { fontFamily: fontFamSerif }]}>{date}</Text>
          </View>

          {diagnosis || symptoms ? (
            <View style={revStyles.mprPatLine2}>
              <Text style={[revStyles.mprDiagLabel, { fontFamily: fontFamSerif }]}>Diagnosis: </Text>
              <Text style={[revStyles.mprDiagVal, { fontFamily: fontFamSerif }]}>
                {diagnosis || symptoms}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Hairline Divider */}
        <View style={revStyles.mprHairline} />

        {/* Large Italic ℞ Glyph */}
        <Text style={[revStyles.mprRxSymbol, { fontFamily: fontFamSerif }]}>℞</Text>

        {/* Ruled Medicine Items */}
        {filledMeds.length === 0 ? (
          <View style={revStyles.mprEmptyMedBox}>
            <Text style={[revStyles.mprEmptyMedText, { fontFamily: fontFamSerif }]}>
              No medicines prescribed yet
            </Text>
          </View>
        ) : (
          filledMeds.map((med, i) => {
            const subline = [
              med.duration ? (med.duration.toLowerCase().includes('day') ? med.duration : `${med.duration} days`) : '',
              med.frequency,
              med.instructions,
            ].filter(Boolean).join(' · ')

            return (
              <View key={med.id || i} style={revStyles.mprMedRow}>
                <Text style={[revStyles.mprMedTitle, { fontFamily: fontFamSerif }]}>
                  {i + 1}. {med.name}{med.strength ? ` (${med.strength})` : ''}
                </Text>
                {subline ? (
                  <Text style={[revStyles.mprMedSub, { fontFamily: fontFamSerif }]}>
                    {subline}
                  </Text>
                ) : null}
              </View>
            )
          })
        )}

        {/* Blank Ruled Lines (Prescription Pad ruled aesthetic) */}
        {Array.from({ length: Math.max(2, 4 - filledMeds.length) }).map((_, idx) => (
          <View key={`mpr-empty-${idx}`} style={revStyles.mprEmptyRule} />
        ))}

        {/* Advice / Lab Tests / Follow-up */}
        {advice ? (
          <View style={revStyles.mprSecBlock}>
            <Text style={[revStyles.mprSecLabel, { fontFamily: fontFamSerif }]}>Advice:</Text>
            <Text style={[revStyles.mprSecText, { fontFamily: fontFamSerif }]}>{advice}</Text>
          </View>
        ) : null}

        {labTests && labTests.length > 0 ? (
          <View style={revStyles.mprSecBlock}>
            <Text style={[revStyles.mprSecLabel, { fontFamily: fontFamSerif }]}>Recommended Tests:</Text>
            <Text style={[revStyles.mprSecText, { fontFamily: fontFamSerif }]}>{labTests.join(', ')}</Text>
          </View>
        ) : null}

        {followUp ? (
          <View style={revStyles.mprFollowBlock}>
            <Text style={[revStyles.mprSecLabel, { fontFamily: fontFamSerif }]}>Follow-up: </Text>
            <Text style={[revStyles.mprFollowVal, { fontFamily: fontFamSerif }]}>{followUp}</Text>
          </View>
        ) : null}

        {/* Right-Aligned Signature */}
        <View style={revStyles.mprSigRow}>
          <View style={revStyles.mprSigBlock}>
            {renderSigContent(130, true)}
            <View style={revStyles.mprSigLine} />
            <Text style={[revStyles.mprSigTitle, { fontFamily: fontFamSerif }]}>Signature</Text>
            <Text style={[revStyles.mprSigDoc, { fontFamily: fontFamSerif }]}>{doctorDisplayName}</Text>
          </View>
        </View>

        {/* Watermark Centered */}
        <View style={revStyles.mprWatermarkRow}>
          <Text style={[revStyles.mprWatermark, { fontFamily: fontFamSerif }]}>
            P R E S C R I P T I O N M A K E R . I N
          </Text>
        </View>
      </View>
    )
  }

  // 6. BILINGUAL INDIAN TEMPLATE
  if (template.id === 'bilingual-indian' || template.layout === 'bilingual') {
    const purpleColor = primaryColor || '#7c3aed'

    return (
      <View style={revStyles.biContainer}>
        {/* Full-Width Solid Purple Header */}
        <View style={[revStyles.biHeader, { backgroundColor: purpleColor }]}>
          <Text style={revStyles.biClinicName}>
            {doctorInfo.clinicName || 'Name of your clinic'}
          </Text>
          <Text style={revStyles.biDocRow}>
            {doctorDisplayName}
            {qualSpec ? <Text style={revStyles.biDocQual}>  {qualSpec}</Text> : null}
          </Text>
          {doctorInfo.specialization ? (
            <Text style={revStyles.biSpec}>{doctorInfo.specialization}</Text>
          ) : null}
          {doctorInfo.regNo || doctorInfo.address || doctorInfo.phone ? (
            <Text style={revStyles.biContact}>
              {[
                doctorInfo.regNo ? `Reg: ${doctorInfo.regNo}` : '',
                doctorInfo.address || '',
                doctorInfo.phone ? `☎ ${doctorInfo.phone}` : ''
              ].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        <View style={revStyles.biBody}>
          {/* Patient Details / रोगी विवरण Card */}
          <View style={[revStyles.biPatCard, { borderColor: `${purpleColor}40` }]}>
            <View style={[revStyles.biPatHeaderRow, { backgroundColor: `${purpleColor}12`, borderBottomColor: `${purpleColor}25` }]}>
              <Text style={[revStyles.biPatTitle, { color: purpleColor }]}>
                PATIENT DETAILS / रोगी विवरण
              </Text>
              <Text style={revStyles.biPatDate}>Date: {date}</Text>
            </View>
            <View style={revStyles.biPatContent}>
              <View style={revStyles.biPatLine1}>
                <Text style={revStyles.biPatMetaText}>
                  Patient Name / मरीज का नाम:{' '}
                  <Text style={revStyles.biPatBoldVal}>{patientInfo.name || 'Patient full name'}</Text>
                </Text>
                <Text style={revStyles.biPatMetaText}>
                  Age / उम्र:{' '}
                  <Text style={revStyles.biPatBoldVal}>{patientInfo.age || '—'}</Text>
                </Text>
                <Text style={revStyles.biPatMetaText}>
                  Sex / लिंग:{' '}
                  <Text style={revStyles.biPatBoldVal}>{patientInfo.gender || '—'}</Text>
                </Text>
              </View>
              <View style={revStyles.biPatDivider} />
              <View style={revStyles.biPatLine2}>
                <Text style={revStyles.biPatMetaText}>
                  Address / पता:{' '}
                  <Text style={{ color: '#334155' }}>{patientInfo.address || '___________________'}</Text>
                </Text>
                <Text style={revStyles.biPatMetaText}>
                  Allergies / एलर्जी:{' '}
                  <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                    {patientInfo.allergies || '___________________'}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Diagnosis Box with Thick Purple Left Accent */}
          <View style={[revStyles.biDiagCard, { borderLeftColor: purpleColor }]}>
            <Text style={revStyles.biDiagLabel}>Diagnosis / रोग निदान: </Text>
            <Text style={revStyles.biDiagVal}>{diagnosis || symptoms || 'Acute Pharyngitis'}</Text>
          </View>

          {/* Rx Section Header */}
          <View style={revStyles.biRxHeaderRow}>
            <Text style={[revStyles.biRxSymbol, { color: purpleColor }]}>℞</Text>
            <Text style={[revStyles.biRxTitle, { color: purpleColor }]}>PRESCRIPTION / दवाइयाँ</Text>
          </View>

          {/* 5-Column Table Header */}
          <View style={[revStyles.biTableHeader, { backgroundColor: purpleColor }]}>
            <Text style={[revStyles.biThText, { width: '8%', textAlign: 'center' }]}>#</Text>
            <Text style={[revStyles.biThText, { width: '38%' }]}>दवाई / Medicine</Text>
            <Text style={[revStyles.biThText, { width: '14%', textAlign: 'center' }]}>Unit</Text>
            <Text style={[revStyles.biThText, { width: '20%', textAlign: 'center' }]}>Frequency / मात्रा</Text>
            <Text style={[revStyles.biThText, { width: '20%', textAlign: 'center' }]}>Duration / समय</Text>
          </View>

          {/* Table Data Rows */}
          {filledMeds.length === 0 ? (
            <View style={revStyles.biEmptyMedBox}>
              <Text style={revStyles.biEmptyMedText}>No medicines prescribed yet</Text>
            </View>
          ) : (
            filledMeds.map((med, i) => (
              <View
                key={med.id || i}
                style={[
                  revStyles.biTableRow,
                  { backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf5ff' },
                ]}
              >
                <Text style={[revStyles.biTdText, { width: '8%', textAlign: 'center', fontWeight: '700', color: purpleColor }]}>
                  {i + 1}
                </Text>
                <View style={{ width: '38%', paddingRight: 4 }}>
                  <Text style={revStyles.biMedName}>
                    {med.name}{med.strength ? ` (${med.strength})` : ''}
                  </Text>
                  {med.instructions ? (
                    <Text style={revStyles.biMedInst}>{med.instructions}</Text>
                  ) : null}
                </View>
                <Text style={[revStyles.biTdText, { width: '14%', textAlign: 'center', color: '#64748b' }]}>
                  {med.form || 'Tab'}
                </Text>
                <Text style={[revStyles.biTdText, { width: '20%', textAlign: 'center', fontWeight: '600', color: '#0f172a' }]}>
                  {med.frequency || '—'}
                </Text>
                <Text style={[revStyles.biTdText, { width: '20%', textAlign: 'center', color: '#334155' }]}>
                  {med.duration ? (med.duration.toLowerCase().includes('day') ? med.duration : `${med.duration} days`) : '—'}
                </Text>
              </View>
            ))
          )}

          {/* Advice / Lab Tests / Follow-up */}
          {advice ? (
            <View style={revStyles.biAdviceCard}>
              <Text style={[revStyles.biAdviceTitle, { color: purpleColor }]}>सलाह / Advice:</Text>
              <Text style={revStyles.biAdviceText}>{advice}</Text>
            </View>
          ) : null}

          {labTests && labTests.length > 0 ? (
            <View style={revStyles.biAdviceCard}>
              <Text style={[revStyles.biAdviceTitle, { color: purpleColor }]}>जाँच / Investigations:</Text>
              <Text style={revStyles.biAdviceText}>{labTests.join(', ')}</Text>
            </View>
          ) : null}

          {followUp ? (
            <View style={revStyles.biFollowRow}>
              <Text style={[revStyles.biFollowLabel, { color: purpleColor }]}>
                अगली मुलाकात / Next Visit (Follow-up):{' '}
              </Text>
              <Text style={revStyles.biFollowVal}>{followUp}</Text>
            </View>
          ) : null}

          {/* Left-Aligned Doctor's Signature */}
          <View style={revStyles.biSigRow}>
            <View style={revStyles.biSigBlock}>
              {renderSigContent(120, false)}
              <View style={revStyles.biSigLine} />
              <Text style={revStyles.biSigTitle}>Doctor's Signature</Text>
              <Text style={revStyles.biSigDoc}>{doctorDisplayName}</Text>
            </View>
          </View>

          {/* Bottom Solid Purple Ribbon */}
          <View style={[revStyles.biFooterRibbon, { backgroundColor: purpleColor }]}>
            <Text style={revStyles.biFooterText}>prescriptionmaker.in</Text>
          </View>
        </View>
      </View>
    )
  }

  // 7. COMPARTMENTALIZED GRID TEMPLATE
  if (template.id === 'compartmentalized-grid' || template.layout === 'grid') {
    const brownColor = primaryColor || '#8a3b14'
    const ochreColor = template.styles?.accentColor || '#ea8a10'
    const creamBg = '#fffdf7'

    return (
      <View style={[revStyles.cgContainer, { backgroundColor: creamBg }]}>
        {/* Split Header (50% solid brown / 50% cream) */}
        <View style={[revStyles.cgHeaderSplit, { borderBottomColor: brownColor }]}>
          <View style={[revStyles.cgHeaderLeft, { backgroundColor: brownColor }]}>
            <Text style={revStyles.cgDocName}>{doctorDisplayName}</Text>
            <Text style={revStyles.cgDocQual}>{qualSpec || 'MBBS, MD General Medicine'}</Text>
            {doctorInfo.regNo ? (
              <Text style={revStyles.cgDocReg}>Reg. No: {doctorInfo.regNo}</Text>
            ) : null}
          </View>
          <View style={revStyles.cgHeaderRight}>
            <Text style={[revStyles.cgClinicName, { color: brownColor }]}>
              {doctorInfo.clinicName || 'Name of your clinic'}
            </Text>
            {doctorInfo.address || doctorInfo.phone ? (
              <Text style={revStyles.cgClinicMeta}>
                {[doctorInfo.address, doctorInfo.phone ? `☎ ${doctorInfo.phone}` : ''].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 3-Column Patient Compartment Bar */}
        <View style={[revStyles.cgPatientBar, { borderBottomColor: brownColor }]}>
          <View style={[revStyles.cgPatCol, { flex: 1.2, borderRightWidth: 1, borderRightColor: '#dcd3c7' }]}>
            <Text style={[revStyles.cgPatLabel, { color: brownColor }]}>PATIENT NAME</Text>
            <Text style={revStyles.cgPatVal}>{patientInfo.name || 'Patient full name'}</Text>
          </View>
          <View style={[revStyles.cgPatCol, { flex: 0.9, borderRightWidth: 1, borderRightColor: '#dcd3c7' }]}>
            <Text style={[revStyles.cgPatLabel, { color: brownColor }]}>AGE / SEX</Text>
            <Text style={revStyles.cgPatVal}>{patientInfo.age || '—'} / {patientInfo.gender || '—'}</Text>
          </View>
          <View style={[revStyles.cgPatCol, { flex: 0.9 }]}>
            <Text style={[revStyles.cgPatLabel, { color: brownColor }]}>DATE</Text>
            <Text style={revStyles.cgPatVal}>{date}</Text>
          </View>
        </View>

        {/* Chief Complaint Strip */}
        <View style={revStyles.cgComplaintStrip}>
          <Text style={[revStyles.cgStripLabel, { color: brownColor }]}>CHIEF COMPLAINT: </Text>
          <Text style={revStyles.cgStripVal}>{symptoms || patientInfo.examination || 'Acute Pharyngitis'}</Text>
        </View>

        {/* Diagnosis Strip (Solid Deep Brown Bar) */}
        <View style={[revStyles.cgDiagStrip, { backgroundColor: brownColor }]}>
          <Text style={revStyles.cgDiagLabelWhite}>DIAGNOSIS: </Text>
          <Text style={revStyles.cgDiagValWhite}>{diagnosis || 'Acute Pharyngitis'}</Text>
        </View>

        {/* Main Body */}
        <View style={revStyles.cgBody}>
          {/* Rx Row with Hairline */}
          <View style={revStyles.cgRxRow}>
            <Text style={[revStyles.cgRxGlyph, { color: brownColor }]}>℞</Text>
            <View style={revStyles.cgRxLine} />
          </View>

          {/* 5-Column Table Header with Solid Ochre Header */}
          <View style={[revStyles.cgTableHeader, { backgroundColor: ochreColor }]}>
            <Text style={[revStyles.cgThText, { width: '40%' }]}>Medicine / Drugs</Text>
            <Text style={[revStyles.cgThText, { width: '14%', textAlign: 'center' }]}>Unit</Text>
            <Text style={[revStyles.cgThText, { width: '18%', textAlign: 'center' }]}>Frequency</Text>
            <Text style={[revStyles.cgThText, { width: '14%', textAlign: 'center' }]}>Duration</Text>
            <Text style={[revStyles.cgThText, { width: '14%', textAlign: 'center' }]}>Qty</Text>
          </View>

          {/* Table Data Rows */}
          {filledMeds.length === 0 ? (
            <View style={revStyles.cgEmptyMedBox}>
              <Text style={revStyles.cgEmptyMedText}>No medicines prescribed yet</Text>
            </View>
          ) : (
            filledMeds.map((med, i) => (
              <View key={med.id || i} style={revStyles.cgTableRow}>
                <View style={{ width: '40%', paddingRight: 4, borderRightWidth: 1, borderRightColor: '#f0e6d8' }}>
                  <Text style={revStyles.cgMedTitle}>
                    {i + 1}. {med.name}{med.strength ? ` (${med.strength})` : ''}
                  </Text>
                  {med.instructions ? (
                    <Text style={revStyles.cgMedInst}>{med.instructions}</Text>
                  ) : null}
                </View>
                <Text style={[revStyles.cgTdText, { width: '14%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#f0e6d8', color: '#64748b' }]}>
                  {med.form || '—'}
                </Text>
                <Text style={[revStyles.cgTdText, { width: '18%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#f0e6d8', fontWeight: '600', color: '#0f172a' }]}>
                  {med.frequency || '—'}
                </Text>
                <Text style={[revStyles.cgTdText, { width: '14%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#f0e6d8', color: '#334155' }]}>
                  {med.duration ? (med.duration.toLowerCase().includes('day') ? med.duration : `${med.duration} days`) : '—'}
                </Text>
                <Text style={[revStyles.cgTdText, { width: '14%', textAlign: 'center', color: '#94a3b8' }]}>
                  —
                </Text>
              </View>
            ))
          )}

          {/* 2-Column Bottom Compartments (Grid Boxes) */}
          <View style={revStyles.cgBottomGrid}>
            {/* Left Box: ADVICE */}
            <View style={revStyles.cgAdviceBox}>
              <Text style={[revStyles.cgBoxHeader, { color: ochreColor }]}>ADVICE</Text>
              <Text style={revStyles.cgAdviceBody}>
                {advice || 'Patient advice and dietary precautions...'}
              </Text>
              {labTests && labTests.length > 0 ? (
                <Text style={revStyles.cgLabText}>
                  <Text style={{ fontWeight: '700', color: brownColor }}>Tests: </Text>
                  {labTests.join(', ')}
                </Text>
              ) : null}
            </View>

            {/* Right Box: FOLLOW-UP & SIGNATURE */}
            <View style={revStyles.cgFollowBox}>
              <View>
                <Text style={[revStyles.cgBoxHeader, { color: ochreColor }]}>FOLLOW-UP</Text>
                <Text style={revStyles.cgFollowBody}>
                  {followUp ? `Review: ${followUp}` : 'As advised by the doctor'}
                </Text>
              </View>

              {/* Signature Block Aligned Right */}
              <View style={revStyles.cgSigBlock}>
                {renderSigContent(120, false)}
                <View style={[revStyles.cgSigLine, { borderTopColor: brownColor }]} />
                <Text style={revStyles.cgSigTitle}>Doctor's Signature</Text>
                <Text style={revStyles.cgSigDoc}>{doctorDisplayName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Solid Brown Footer Bar */}
        <View style={[revStyles.cgFooterBar, { backgroundColor: brownColor }]}>
          <Text style={revStyles.cgFooterText}>{doctorInfo.clinicName || 'Name of your clinic'}</Text>
          <Text style={revStyles.cgFooterText}>prescriptionmaker.in</Text>
        </View>
      </View>
    )
  }

  // 8. MODERN TEAL RIBBON TEMPLATE (Matches modern-teal-ribbon.jpg)
  if (template.id === 'modern-teal-ribbon' || template.layout === 'modern') {
    const tealColor = '#00c4cc'
    const navyColor = '#0f2330'
    const docCleanName = (doctorInfo.name || 'Doctor Name').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
    const qualUpper = (doctorInfo.qualification || 'QUALIFICATION').toUpperCase()
    const otherDetails = doctorInfo.specialization || doctorInfo.clinicName || 'Add other details'
    const addressStr = doctorInfo.address || '24 Dummy Street Area'
    const phoneStr = doctorInfo.phone || '+12-345 678 9012'

    return (
      <View style={revStyles.mtrContainer}>
        {/* Top-Right Intersecting Geometric Ribbon (Navy & Vibrant Teal V-Chevron) */}
        <View style={revStyles.mtrTopRibbonWrapper} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 410 168">
            <Polygon points="261,0 410,0 272,165 244,128" fill={navyColor} />
            <Polygon points="11,0 137,0 244,128 272,165 143,165" fill={tealColor} />
          </Svg>
        </View>

        {/* Doctor Header (Left side) */}
        <View style={revStyles.mtrHeader}>
          {doctorInfo.logoUrl ? (
            <Image source={{ uri: doctorInfo.logoUrl }} style={revStyles.mtrLogo} resizeMode="contain" />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={revStyles.mtrDocTitle}>
              <Text style={{ fontWeight: '900', color: '#0e3860' }}>Dr. </Text>
              <Text style={{ fontWeight: '400', color: '#1e3a5f' }}>{docCleanName}</Text>
            </Text>
            <Text style={revStyles.mtrDocQual}>{qualUpper}</Text>
            <View style={revStyles.mtrDocRule} />
            <Text style={revStyles.mtrDocOther}>{otherDetails}</Text>
          </View>
        </View>

        {/* 3-Row Underlined Patient Strip */}
        <View style={revStyles.mtrPatientStrip}>
          {/* Row 1: Patient Name & Date */}
          <View style={revStyles.mtrPatLine}>
            <Text style={revStyles.mtrPatLabel}>Patient Name:</Text>
            <View style={[revStyles.mtrPatUnderline, { flex: 2.2 }]}>
              <Text style={revStyles.mtrPatVal}>{patientInfo.name || '—'}</Text>
            </View>
            <Text style={[revStyles.mtrPatLabel, { marginLeft: 12 }]}>Date:</Text>
            <View style={[revStyles.mtrPatUnderline, { flex: 1.1 }]}>
              <Text style={revStyles.mtrPatVal}>{date || new Date().toLocaleDateString('en-IN')}</Text>
            </View>
          </View>

          {/* Row 2: Age, Gender, Weight */}
          <View style={revStyles.mtrPatLine}>
            <Text style={revStyles.mtrPatLabel}>Age:</Text>
            <View style={[revStyles.mtrPatUnderline, { flex: 1 }]}>
              <Text style={revStyles.mtrPatVal}>{patientInfo.age ? `${patientInfo.age} Y` : '—'}</Text>
            </View>
            <Text style={[revStyles.mtrPatLabel, { marginLeft: 10 }]}>Gender:</Text>
            <View style={[revStyles.mtrPatUnderline, { flex: 1 }]}>
              <Text style={revStyles.mtrPatVal}>{patientInfo.gender || '—'}</Text>
            </View>
            <Text style={[revStyles.mtrPatLabel, { marginLeft: 10 }]}>Weight:</Text>
            <View style={[revStyles.mtrPatUnderline, { flex: 1 }]}>
              <Text style={revStyles.mtrPatVal}>{patientInfo.weight ? `${patientInfo.weight} kg` : '—'}</Text>
            </View>
          </View>

          {/* Row 3: Diagnosis */}
          <View style={revStyles.mtrPatLine}>
            <Text style={revStyles.mtrPatLabel}>Diagnosis:</Text>
            <View style={[revStyles.mtrPatUnderline, { flex: 1 }]}>
              <Text style={[revStyles.mtrPatVal, { fontWeight: '700', color: '#0e3860' }]}>
                {diagnosis || symptoms || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Area: Table / Medicines */}
        <View style={revStyles.mtrBody}>
          {/* Table Header: Dark Navy with white text */}
          <View style={[revStyles.mtrTableHeader, { backgroundColor: navyColor }]}>
            <Text style={[revStyles.mtrThText, { flex: 2.3 }]}>MEDICINE / DRUG PRESCRIBED</Text>
            <Text style={[revStyles.mtrThText, { flex: 0.8, textAlign: 'center' }]}>FORM</Text>
            <Text style={[revStyles.mtrThText, { flex: 1, textAlign: 'center' }]}>FREQ</Text>
            <Text style={[revStyles.mtrThText, { flex: 0.9, textAlign: 'center' }]}>DUR</Text>
            <Text style={[revStyles.mtrThText, { flex: 1.5 }]}>INSTRUCTIONS</Text>
          </View>

          {/* Medicine Rows */}
          {filledMeds.length === 0 ? (
            <View style={revStyles.mtrEmptyMedBox}>
              <Text style={revStyles.mtrEmptyMedText}>No medicines prescribed yet</Text>
            </View>
          ) : (
            filledMeds.map((med, i) => {
              const isEven = i % 2 === 0
              return (
                <View
                  key={med.id || i}
                  style={[
                    revStyles.mtrTableRow,
                    { backgroundColor: isEven ? '#ffffff' : '#f0fdfe' },
                  ]}
                >
                  <View style={{ flex: 2.3, paddingRight: 4 }}>
                    <Text style={revStyles.mtrMedTitle}>
                      {i + 1}. {med.name}
                    </Text>
                    {med.strength ? (
                      <Text style={revStyles.mtrMedStrength}>{med.strength}</Text>
                    ) : null}
                  </View>
                  <Text style={[revStyles.mtrTdText, { flex: 0.8, textAlign: 'center' }]}>
                    {med.form || 'Tab'}
                  </Text>
                  <Text style={[revStyles.mtrTdText, { flex: 1, textAlign: 'center', fontWeight: '600', color: '#0f2330' }]}>
                    {med.frequency || '—'}
                  </Text>
                  <Text style={[revStyles.mtrTdText, { flex: 0.9, textAlign: 'center' }]}>
                    {med.duration ? (med.duration.toLowerCase().includes('day') ? med.duration : `${med.duration} d`) : '—'}
                  </Text>
                  <Text style={[revStyles.mtrTdText, { flex: 1.5, fontStyle: 'italic' }]}>
                    {med.instructions || '—'}
                  </Text>
                </View>
              )
            })
          )}

          {/* Additional Sections: Lab Tests / Investigations */}
          {labTests && labTests.length > 0 ? (
            <View style={[revStyles.mtrSecCard, { borderLeftColor: tealColor }]}>
              <Text style={revStyles.mtrSecTitle}>RECOMMENDED INVESTIGATIONS</Text>
              <Text style={revStyles.mtrSecBody}>{labTests.join('  •  ')}</Text>
            </View>
          ) : null}

          {/* Advice / Instructions */}
          {advice ? (
            <View style={[revStyles.mtrSecCard, { borderLeftColor: tealColor }]}>
              <Text style={revStyles.mtrSecTitle}>MEDICAL ADVICE & INSTRUCTIONS</Text>
              <Text style={revStyles.mtrSecBody}>{advice}</Text>
            </View>
          ) : null}

          {/* Follow-up Visit */}
          {followUp ? (
            <View style={[revStyles.mtrSecCard, { borderLeftColor: navyColor, backgroundColor: '#f8fafc' }]}>
              <Text style={revStyles.mtrSecTitle}>FOLLOW-UP VISIT</Text>
              <Text style={revStyles.mtrSecBody}>{followUp}</Text>
            </View>
          ) : null}

          {/* Signature Block (Right Aligned) */}
          <View style={revStyles.mtrSigRow}>
            <View style={revStyles.mtrSigBlock}>
              {renderSigContent(120, false)}
              <View style={revStyles.mtrSigLine} />
              <Text style={revStyles.mtrSigTitle}>Signature</Text>
            </View>
          </View>
        </View>

        {/* Bottom Section: Caduceus Emblem + Bottom Corner Folded Chevron + Contact Footer */}
        <View style={revStyles.mtrFooterContainer}>
          {/* Bottom Left Corner Chevron */}
          <View style={revStyles.mtrCornerRibbonWrapper} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 236 105">
              <Polygon points="0,105 78,1 145,81 113,105" fill={navyColor} />
              <Polygon points="80,0 187,0 232,105 167,105 145,81" fill={tealColor} />
            </Svg>
          </View>

          {/* Teal Medical Caduceus Winged Emblem */}
          <View style={revStyles.mtrCaduceusBox}>
            <Svg width={46} height={46} viewBox="0 0 100 100">
              <Circle cx="50" cy="18" r="5" fill={tealColor} />
              <SvgLine x1="50" y1="23" x2="50" y2="88" stroke={tealColor} strokeWidth="3" strokeLinecap="round" />
              <Circle cx="50" cy="88" r="3" fill={tealColor} />
              <Path d="M 48 34 C 30 18 14 18 2 28 C 14 38 20 40 18 46 C 28 46 32 50 32 54 C 42 54 46 50 48 44 Z" fill={tealColor} />
              <Path d="M 52 34 C 70 18 86 18 98 28 C 86 38 80 40 82 46 C 72 46 68 50 68 54 C 58 54 54 50 52 44 Z" fill={tealColor} />
              <Path d="M 46 38 C 34 44 35 50 50 54 C 66 58 66 68 50 72 C 38 76 40 82 48 84" fill="none" stroke={tealColor} strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M 54 38 C 66 44 65 50 50 54 C 34 58 34 68 50 72 C 62 76 60 82 52 84" fill="none" stroke={tealColor} strokeWidth="2.5" strokeLinecap="round" />
              <Circle cx="46" cy="38" r="2.5" fill={tealColor} />
              <Circle cx="54" cy="38" r="2.5" fill={tealColor} />
            </Svg>
          </View>

          {/* Contact Details on the bottom right/center */}
          <View style={revStyles.mtrFooterContact}>
            <Text style={revStyles.mtrFooterContactText} numberOfLines={1}>
              📍 {addressStr}
            </Text>
            <Text style={revStyles.mtrFooterContactText} numberOfLines={1}>
              📞 {phoneStr}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // 9. STANDARD / DEFAULT TEMPLATE
  return (
    <View style={[revStyles.stdContainer, { borderColor: primaryColor }]}>
      <View style={[revStyles.stdHeader, { borderBottomColor: primaryColor }]}>
        <View style={{ flex: 1 }}>
          <Text style={[revStyles.stdClinic, { color: primaryColor }]}>{doctorInfo.clinicName || 'Clinic'}</Text>
          <Text style={revStyles.stdDoc}>{doctorDisplayName}</Text>
          <Text style={revStyles.stdQual}>{qualSpec}</Text>
        </View>
        <Text style={[revStyles.stdRxBadge, { color: primaryColor }]}>℞</Text>
      </View>

      <View style={revStyles.stdBody}>
        <View style={revStyles.stdPatRow}>
          <Text style={revStyles.stdPatName}>Patient: <Text style={{ fontWeight: '700' }}>{patientInfo.name || '—'}</Text></Text>
          <Text style={revStyles.stdPatMeta}>Age: {patientInfo.age || '—'} {patientInfo.gender}</Text>
          <Text style={revStyles.stdDate}>Date: {date}</Text>
        </View>

        {diagnosis ? (
          <View style={revStyles.stdDiagRow}>
            <Text style={revStyles.stdDiagLabel}>Diagnosis: </Text>
            <Text style={revStyles.stdDiagVal}>{diagnosis}</Text>
          </View>
        ) : null}

        <View style={{ marginVertical: 8 }}>
          {filledMeds.map((med, i) => (
            <View key={med.id || i} style={revStyles.stdMedItem}>
              <Text style={revStyles.stdMedTitle}>{i + 1}. {med.name} {med.strength}</Text>
              <Text style={revStyles.stdMedSub}>
                {[med.frequency, med.timing, med.duration].filter(Boolean).join('  ·  ')}
              </Text>
            </View>
          ))}
        </View>

        {advice ? (
          <View style={revStyles.stdAdviceSec}>
            <Text style={revStyles.stdAdviceTitle}>Advice:</Text>
            <Text style={revStyles.stdAdviceText}>{advice}</Text>
          </View>
        ) : null}

        <View style={revStyles.stdSigArea}>
          {renderSigContent(120, false)}
          <View style={{ borderTopWidth: 1, borderTopColor: '#94a3b8', width: 120 }} />
          <Text style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 2 }}>Doctor's Signature</Text>
        </View>
      </View>
    </View>
  )
}

const revStyles = StyleSheet.create({
  // Classic Letterhead Styles
  classicContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 18,
    ...Shadow.md,
  },
  classicHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  classicLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  classicClinic: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  classicDoc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
  },
  classicQual: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'center',
  },
  classicReg: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  classicContact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 5,
  },
  classicContactText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  classicDoubleTop: {
    width: '100%',
    height: 2.5,
    marginTop: 12,
  },
  classicDoubleBottom: {
    width: '100%',
    height: 0.8,
    marginTop: 2.5,
  },
  classicPatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 12,
  },
  classicPatLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  classicPatName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textDecorationLine: 'underline',
  },
  classicPatMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  classicDateText: {
    fontSize: 11,
    color: '#64748b',
  },
  classicDiagRow: {
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  classicDiagLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  classicDiagVal: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '700',
  },
  classicRxSym: {
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 10,
    marginTop: 4,
    lineHeight: 36,
  },
  classicMedItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderStyle: 'dotted',
    paddingBottom: 8,
  },
  classicMedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  classicMedSub: {
    paddingLeft: 18,
    marginTop: 3,
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  classicSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  classicSecTitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  classicSecBody: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    paddingLeft: 4,
  },
  classicLabRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  classicLabVal: {
    fontSize: 11,
    color: '#374151',
  },
  classicFollowRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  classicFollowLabel: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  classicFollowVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  classicSigArea: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 16,
  },
  classicStamp: {
    width: 46,
    height: 46,
    opacity: 0.85,
  },
  classicSigBox: {
    alignItems: 'center',
    minWidth: 140,
  },
  classicSigImg: {
    height: 38,
    width: 120,
    marginBottom: 4,
  },
  classicSigLine: {
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    width: 130,
  },
  classicSigTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  classicSigDoc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  classicFooterBrand: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 9,
    color: '#cbd5e1',
    letterSpacing: 1,
  },

  // SOAP styles
  soapContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#312e81',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadow.md,
  },
  soapHeaderBanner: {
    backgroundColor: '#312e81',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  soapDocLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    padding: 2,
  },
  soapDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  soapDocQual: {
    fontSize: 10,
    color: '#c7d2fe',
    marginTop: 2,
  },
  soapDocReg: {
    fontSize: 9,
    color: '#a5b4fc',
    marginTop: 1,
  },
  soapHeaderRight: {
    alignItems: 'flex-end',
    maxWidth: '42%',
  },
  soapClinicName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#c7d2fe',
    letterSpacing: 0.5,
  },
  soapMetaText: {
    fontSize: 9.5,
    color: '#c7d2fe',
    marginTop: 2,
  },
  soapBody: {
    padding: 12,
  },
  soapPatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  soapPatLabel: {
    fontSize: 10.5,
    color: '#64748b',
  },
  soapPatName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  soapPatAge: {
    fontSize: 10.5,
    color: '#64748b',
  },
  soapDateText: {
    fontSize: 10.5,
    color: '#64748b',
  },
  soapCard: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  soapCardHeader: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soapCardLetter: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  soapCardTitle: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  soapCardBody: {
    padding: 10,
  },
  soapBodyText: {
    fontSize: 11.5,
    color: '#374151',
    lineHeight: 17,
  },
  soapVitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  soapVitalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  soapVitalLabel: {
    fontSize: 9.5,
    color: '#64748b',
  },
  soapVitalVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
  },
  soapExamText: {
    fontSize: 10.5,
    color: '#64748b',
    fontStyle: 'italic',
  },
  soapDiagText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065f46',
  },
  soapRxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#312e81',
    marginBottom: 6,
  },
  soapTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ff',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  soapTableColHeader: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#312e81',
  },
  soapTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  soapMedName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  soapMedInst: {
    fontSize: 9.5,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  soapTableCell: {
    fontSize: 10.5,
    color: '#475569',
  },
  soapPlanItem: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  soapPlanLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#312e81',
  },
  soapPlanVal: {
    fontSize: 10.5,
    color: '#374151',
  },
  soapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  soapBrand: {
    fontSize: 9,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  soapSigBlock: {
    alignItems: 'center',
    minWidth: 120,
  },
  soapSigImg: {
    height: 30,
    width: 110,
    marginBottom: 3,
  },
  soapSigLine: {
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    width: 120,
  },
  soapSigTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 3,
  },
  soapSigDoc: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 1,
  },

  // Two-Column Styles
  twoColContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadow.md,
  },
  twoColSidebar: {
    width: '34%',
    padding: 12,
  },
  twoColLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
    alignSelf: 'center',
  },
  twoColDoc: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  twoColQual: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 1,
  },
  twoColDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },
  twoColSecHeader: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  twoColClinic: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  twoColMeta: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  twoColMain: {
    flex: 1,
    padding: 12,
  },
  twoColPatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },
  twoColPatName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  twoColPatSub: {
    fontSize: 10,
    color: '#64748b',
  },
  twoColDate: {
    fontSize: 9,
    color: '#64748b',
  },
  twoColDiagBox: {
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 6,
    marginVertical: 6,
  },
  twoColDiagLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  twoColDiagVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  twoColRx: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  twoColMedItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
    marginBottom: 4,
  },
  twoColMedName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  twoColMedDetail: {
    fontSize: 9.5,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Boxed Styles
  boxedContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadow.md,
  },
  boxedHeader: {
    padding: 14,
    alignItems: 'center',
  },
  boxedClinic: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  boxedDoc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  boxedBody: {
    padding: 12,
    gap: 8,
  },
  boxedSection: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
  },
  boxedSecHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxedSecTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  boxedDate: {
    fontSize: 9.5,
    color: '#64748b',
  },
  boxedPatName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  boxedPatMeta: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  boxedDiagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  boxedMedRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 4,
  },
  boxedMedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  boxedMedDose: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
  },
  boxedAdvice: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },

  // Standard/Default Styles
  stdContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadow.md,
  },
  stdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 2,
    backgroundColor: '#f8fafc',
  },
  stdClinic: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stdDoc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  stdQual: {
    fontSize: 10.5,
    color: '#64748b',
    fontStyle: 'italic',
  },
  stdRxBadge: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  stdBody: {
    padding: 14,
  },
  stdPatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
    marginBottom: 8,
  },
  stdPatName: {
    fontSize: 12,
    color: '#475569',
  },
  stdPatMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  stdDate: {
    fontSize: 11,
    color: '#64748b',
  },
  stdDiagRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stdDiagLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  stdDiagVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  stdMedItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 6,
  },
  stdMedTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  stdMedSub: {
    fontSize: 10.5,
    color: '#64748b',
    fontStyle: 'italic',
    paddingLeft: 12,
    marginTop: 2,
  },
  stdAdviceSec: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  stdAdviceTitle: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  stdAdviceText: {
    fontSize: 11,
    color: '#334155',
  },
  stdSigArea: {
    marginTop: 18,
    alignItems: 'flex-end',
  },

  // ── Vitals-First Styles ──
  vfContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#9b2335',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  vfHeader: {
    backgroundColor: '#9b2335',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vfDocName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  vfDocQual: {
    fontSize: 10,
    color: '#fca5a5',
    marginTop: 1,
  },
  vfDocSpec: {
    fontSize: 10,
    color: '#fca5a5',
    marginTop: 1,
  },
  vfDocSub: {
    fontSize: 10.5,
    color: '#fecdd3',
    marginTop: 2,
    fontWeight: '500',
  },
  vfClinicName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  vfClinicMeta: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 1,
  },
  vfPatBar: {
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(155, 35, 53, 0.25)',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vfPatLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  vfPatName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  vfPatMeta: {
    fontSize: 10.5,
    color: '#475569',
    marginLeft: 8,
  },
  vfDate: {
    color: '#64748b',
    fontSize: 10.5,
  },
  vfVitalsBox: {
    marginHorizontal: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#9b2335',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  vfVitalsBanner: {
    backgroundColor: '#9b2335',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  vfVitalsBannerText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  vfVitalsGrid2x3: {
    backgroundColor: '#fdf2f2',
  },
  vfVitalsRow: {
    flexDirection: 'row',
  },
  vfVitalCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  vfVitalLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#9b2335',
    textTransform: 'uppercase',
  },
  vfVitalVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  vfVitalUnit: {
    fontSize: 7,
    color: '#94a3b8',
  },
  vfVitalLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#f87171',
    minHeight: 18,
    marginTop: 2,
    paddingBottom: 1,
    justifyContent: 'center',
  },
  vfDiagBar: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(229, 62, 62, 0.08)',
    borderLeftWidth: 3.5,
    borderLeftColor: '#9b2335',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vfDiagTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9b2335',
  },
  vfDiagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  vfRxSection: {
    marginHorizontal: 12,
    marginTop: 8,
  },
  vfRxTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  vfRxGlyph: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9b2335',
  },
  vfRxHeading: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9b2335',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vfTableHead: {
    flexDirection: 'row',
    backgroundColor: '#9b2335',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  vfTh: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  vfTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.8,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  vfTd: {
    fontSize: 10,
    color: '#1e293b',
  },
  vfMedName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  vfMedInst: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  vfInvCard: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(155, 35, 53, 0.2)',
    borderRadius: 4,
  },
  vfInvTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#9b2335',
    marginBottom: 4,
  },
  vfInvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vfInvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vfCheckboxSquare: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderColor: '#f87171',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  vfInvText: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '600',
  },
  vfAdviceBox: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#9b2335',
    borderRadius: 4,
  },
  vfAdviceTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9b2335',
    marginBottom: 2,
  },
  vfAdviceText: {
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 15,
  },
  vfFollowSigRow: {
    marginHorizontal: 12,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  vfFollowText: {
    fontSize: 11,
    color: '#64748b',
  },
  vfFollowUnderline: {
    textDecorationLine: 'underline',
    color: '#0f172a',
    fontWeight: '600',
  },
  vfSigBlock: {
    alignItems: 'center',
    minWidth: 120,
  },
  vfSigLine: {
    width: 120,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginTop: 2,
    marginBottom: 2,
  },
  vfSigTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  vfSigDoc: {
    fontSize: 8,
    color: '#94a3b8',
  },
  vfBottomBar: {
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: '#9b2335',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vfBottomText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '600',
  },

  // Detailed Drug Chart Styles (Matching detailed-drug-chart.jpg)
  ddcContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#065f46',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  ddcHeader: {
    backgroundColor: '#065f46',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ddcDocName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  ddcDocQual: {
    fontSize: 10,
    color: '#a7f3d0',
    marginTop: 2,
    fontWeight: '500',
  },
  ddcClinicName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  ddcCardsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 10,
    gap: 10,
  },
  ddcPatientCard: {
    flex: 1.3,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
  },
  ddcDiagCard: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 4,
    padding: 8,
  },
  ddcCardLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  ddcCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
  },
  ddcCardMeta: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },
  ddcDiagLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  ddcDiagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 1,
  },
  ddcRxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    gap: 8,
  },
  ddcRxGlyph: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: '900',
    color: '#065f46',
  },
  ddcRxLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: '#a7f3d0',
  },
  ddcDrugCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderLeftWidth: 4,
    borderLeftColor: '#065f46',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  ddcDrugHeader: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ddcDrugNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  ddcDrugName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  ddcDrugFieldsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  ddcDrugFieldCell: {
    flex: 1,
  },
  ddcDrugFieldLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.4,
  },
  ddcDrugFieldVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 1,
  },
  ddcDrugNotes: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  ddcDrugNotesText: {
    fontSize: 9.5,
    color: '#475569',
  },
  ddcAdviceRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 4,
    gap: 8,
  },
  ddcAdviceCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 4,
    padding: 8,
  },
  ddcAdviceLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.4,
  },
  ddcAdviceText: {
    fontSize: 10,
    color: '#334155',
    marginTop: 2,
  },
  ddcSigRow: {
    marginHorizontal: 12,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ddcSigBlock: {
    alignItems: 'flex-start',
    minWidth: 120,
  },
  ddcSigLine: {
    width: 120,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 2,
    marginBottom: 2,
  },
  ddcSigTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  ddcSigDoc: {
    fontSize: 8,
    color: '#94a3b8',
  },
  ddcFollowText: {
    fontSize: 10.5,
    color: '#64748b',
  },
  ddcBottomBar: {
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: '#064e3b',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ddcBottomText: {
    color: '#d1fae5',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Multi-Section Boxed Styles (Matching multi-section-boxed.jpg)
  msbContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0c3258',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  msbHeader: {
    backgroundColor: '#0c3258',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msbDocName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  msbDocQual: {
    fontSize: 10,
    color: '#7dd3fc',
    marginTop: 2,
    fontWeight: '500',
  },
  msbClinicName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  msbBody: {
    padding: 12,
  },
  msbSplitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  msbBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  msbBannerSky: {
    backgroundColor: '#38bdf8',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  msbBannerNavy: {
    backgroundColor: '#0c3258',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  msbBannerText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  msbBoxBody: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  msbPatName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  msbPatMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  msbDateText: {
    fontSize: 11,
    color: '#475569',
  },
  msbRefText: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },
  msbComplaintText: {
    fontSize: 11,
    color: '#1e293b',
  },
  msbDiagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  msbTableHead: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  msbTh: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  msbTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  msbTableBorder: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#f1f5f9',
  },
  msbTd: {
    fontSize: 10.5,
    color: '#1e293b',
  },
  msbMedName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  msbMedInst: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  msbBoxContent: {
    fontSize: 10.5,
    lineHeight: 15,
  },
  msbSigRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  msbSigBlock: {
    alignItems: 'flex-start',
    minWidth: 120,
  },
  msbSigLine: {
    width: 120,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 2,
    marginBottom: 2,
  },
  msbSigTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  msbSigDoc: {
    fontSize: 8,
    color: '#94a3b8',
  },
  msbFollowText: {
    fontSize: 10.5,
    color: '#64748b',
  },

  // ─── Minimal Print Ruled Review Card Styles ───
  mprContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mprHeader: {
    marginBottom: 8,
  },
  mprClinicName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  mprDocRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  mprDocName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  mprDocQual: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#374151',
  },
  mprDocReg: {
    fontSize: 11,
    color: '#6b7280',
  },
  mprContact: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 3,
  },
  mprMainRule: {
    height: 2,
    backgroundColor: '#111827',
    marginTop: 8,
    marginBottom: 10,
  },
  mprPatientBar: {
    paddingVertical: 2,
  },
  mprPatLine1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  mprPatLabel: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  mprPatNameVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
  },
  mprPatMeta: {
    fontSize: 11.5,
    color: '#6b7280',
  },
  mprDateVal: {
    fontSize: 11,
    color: '#6b7280',
  },
  mprPatLine2: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 5,
  },
  mprDiagLabel: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  mprDiagVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  mprHairline: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
    marginBottom: 8,
  },
  mprRxSymbol: {
    fontSize: 32,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#111827',
    marginVertical: 6,
  },
  mprEmptyMedBox: {
    paddingVertical: 12,
  },
  mprEmptyMedText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  mprMedRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  mprMedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  mprMedSub: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 2,
  },
  mprEmptyRule: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    height: 24,
    marginBottom: 4,
  },
  mprSecBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    marginTop: 4,
  },
  mprSecLabel: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#6b7280',
    marginBottom: 2,
  },
  mprSecText: {
    fontSize: 11.5,
    color: '#1f2937',
    lineHeight: 16,
  },
  mprFollowBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  mprFollowVal: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#111827',
  },
  mprSigRow: {
    marginTop: 18,
    alignItems: 'flex-end',
  },
  mprSigBlock: {
    alignItems: 'center',
    width: 130,
  },
  mprSigLine: {
    width: 130,
    borderTopWidth: 1,
    borderTopColor: '#6b7280',
    marginTop: 3,
    marginBottom: 3,
  },
  mprSigTitle: {
    fontSize: 9.5,
    color: '#9ca3af',
  },
  mprSigDoc: {
    fontSize: 8.5,
    color: '#6b7280',
    marginTop: 1,
  },
  mprWatermarkRow: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mprWatermark: {
    fontSize: 7.5,
    color: '#d1d5db',
    letterSpacing: 4,
  },

  // ─── Bilingual Indian Review Card Styles ───
  biContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    overflow: 'hidden',
    marginVertical: 4,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  biHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biClinicName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  biDocRow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  biDocQual: {
    fontSize: 11.5,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.88)',
  },
  biSpec: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 2,
  },
  biContact: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 3,
  },
  biBody: {
    padding: 14,
  },
  biPatCard: {
    borderWidth: 1.5,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  biPatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  biPatTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  biPatDate: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  biPatContent: {
    padding: 10,
  },
  biPatLine1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  biPatMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  biPatBoldVal: {
    fontWeight: '700',
    color: '#0f172a',
  },
  biPatDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  biPatLine2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  biDiagCard: {
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderLeftWidth: 4,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#faf5ff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  biDiagLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  biDiagVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  biRxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  biRxSymbol: {
    fontSize: 20,
    fontWeight: '800',
  },
  biRxTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  biTableHeader: {
    flexDirection: 'row',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  biThText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  biEmptyMedBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  biEmptyMedText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#94a3b8',
  },
  biTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3e8ff',
  },
  biTdText: {
    fontSize: 11,
  },
  biMedName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  biMedInst: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 2,
  },
  biAdviceCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
  },
  biAdviceTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  biAdviceText: {
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 16,
  },
  biFollowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  biFollowLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  biFollowVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  biSigRow: {
    marginTop: 16,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  biSigBlock: {
    alignItems: 'flex-start',
    minWidth: 120,
  },
  biSigLine: {
    width: 120,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginTop: 2,
    marginBottom: 2,
  },
  biSigTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#334155',
  },
  biSigDoc: {
    fontSize: 8.5,
    color: '#64748b',
  },
  biFooterRibbon: {
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  biFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // ─── Compartmentalized Grid Review Card Styles ───
  cgContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5dcd0',
    overflow: 'hidden',
    marginVertical: 4,
    shadowColor: '#8a3b14',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cgHeaderSplit: {
    flexDirection: 'row',
    borderBottomWidth: 2.5,
  },
  cgHeaderLeft: {
    width: '50%',
    padding: 12,
    justifyContent: 'center',
  },
  cgDocName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  cgDocQual: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  cgDocReg: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  cgHeaderRight: {
    width: '50%',
    padding: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cgClinicName: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  cgClinicMeta: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'right',
  },
  cgPatientBar: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    backgroundColor: '#fffdf7',
  },
  cgPatCol: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cgPatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cgPatVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  cgComplaintStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e5dcd0',
    backgroundColor: '#fffdf7',
  },
  cgStripLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cgStripVal: {
    fontSize: 11,
    color: '#1e293b',
    flex: 1,
  },
  cgDiagStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cgDiagLabelWhite: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cgDiagValWhite: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  cgBody: {
    padding: 12,
  },
  cgRxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cgRxGlyph: {
    fontSize: 22,
    fontWeight: '800',
    marginRight: 8,
  },
  cgRxLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d8cfc4',
  },
  cgTableHeader: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignItems: 'center',
  },
  cgThText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  cgEmptyMedBox: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cgEmptyMedText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94a3b8',
  },
  cgTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0e6d8',
  },
  cgMedTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  cgMedInst: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 2,
  },
  cgTdText: {
    fontSize: 10.5,
  },
  cgBottomGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cgAdviceBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e5dcd0',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fffdf9',
    minHeight: 90,
  },
  cgBoxHeader: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cgAdviceBody: {
    fontSize: 10.5,
    color: '#1e293b',
    lineHeight: 15,
  },
  cgLabText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
  },
  cgFollowBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e5dcd0',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fffdf9',
    minHeight: 90,
    justifyContent: 'space-between',
  },
  cgFollowBody: {
    fontSize: 10.5,
    color: '#1e293b',
  },
  cgSigBlock: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  cgSigLine: {
    width: 110,
    borderTopWidth: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  cgSigTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    width: 110,
  },
  cgSigDoc: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    width: 110,
  },
  cgFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  cgFooterText: {
    fontSize: 8.5,
    color: '#ffffff',
    opacity: 0.9,
  },

  // ─── Modern Teal Ribbon Review Card Styles ───
  mtrContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mtrTopRibbonWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 170,
    height: 72,
    zIndex: 1,
  },
  mtrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 80,
    paddingBottom: 6,
    zIndex: 2,
  },
  mtrLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  mtrDocTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  mtrDocQual: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  mtrDocRule: {
    width: 75,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    marginVertical: 4,
  },
  mtrDocOther: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#64748b',
  },
  mtrPatientStrip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mtrPatLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mtrPatLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#475569',
    marginRight: 6,
  },
  mtrPatUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 1,
    paddingHorizontal: 2,
    minHeight: 16,
    justifyContent: 'center',
  },
  mtrPatVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0f2330',
  },
  mtrBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  mtrTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  mtrThText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mtrEmptyMedBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mtrEmptyMedText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  mtrTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mtrMedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0e3860',
  },
  mtrMedStrength: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  mtrTdText: {
    fontSize: 9.5,
    color: '#475569',
  },
  mtrSecCard: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0fdfe',
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  mtrSecTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0e3860',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mtrSecBody: {
    fontSize: 9.5,
    color: '#334155',
    marginTop: 3,
    lineHeight: 14,
  },
  mtrSigRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    paddingRight: 6,
  },
  mtrSigBlock: {
    alignItems: 'center',
    minWidth: 110,
  },
  mtrSigLine: {
    width: 110,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 4,
  },
  mtrSigTitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#0f2330',
    marginTop: 3,
  },
  mtrFooterContainer: {
    position: 'relative',
    minHeight: 88,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  mtrCornerRibbonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 105,
    height: 46,
  },
  mtrCaduceusBox: {
    position: 'absolute',
    bottom: 48,
    left: 30,
  },
  mtrFooterContact: {
    paddingLeft: 120,
    paddingRight: 14,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  mtrFooterContactText: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 14,
  },
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
    bp: '', pulse: '', temp: '', spo2: '', respiratoryRate: '', examination: '',
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
      logoUrl: doctorInfo.logoUrl || '',
      stampUrl: doctorInfo.stampUrl || '',
      signature: doctorInfo.signature || preset.doctor.signature || '',
    })
    setPatientInfo({
      name: preset.patient.name,
      age: preset.patient.age,
      gender: preset.patient.gender,
      weight: preset.patient.weight,
      phone: preset.patient.phone,
      bp: preset.patient.bp || '',
      pulse: preset.patient.pulse || '',
      temp: preset.patient.temp || '',
      spo2: preset.patient.spo2 || '',
      respiratoryRate: preset.patient.respiratoryRate || '',
      examination: preset.patient.examination || '',
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

  const pickSignature = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      })
      if (!result.canceled && result.assets[0]?.base64) {
        const mime = result.assets[0].mimeType || 'image/png'
        const b64 = `data:${mime};base64,${result.assets[0].base64}`
        setDoctorInfo(prev => ({ ...prev, signature: b64 }))
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to select signature image')
    }
  }

  const clearSignature = () => {
    setDoctorInfo(prev => ({ ...prev, signature: '' }))
  }

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
    template,
    doctorInfo,
    patientInfo: {
      ...patientInfo,
      bp: patientInfo.bp,
      pulse: patientInfo.pulse,
      temp: patientInfo.temp,
      temperature: patientInfo.temp,
      spo2: patientInfo.spo2,
      respiratoryRate: patientInfo.respiratoryRate,
      rr: patientInfo.respiratoryRate,
      examination: patientInfo.examination,
    },
    diagnosis,
    symptoms,
    medicines: medicines.filter(m => m.name.trim()),
    advice,
    followUp,
    labTests,
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

              {/* Doctor Signature Card */}
              <View style={[styles.field, { marginTop: Spacing.sm }]}>
                <Text style={styles.label}>Doctor's Digital Signature</Text>
                <View style={{
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: Radius.md,
                  padding: Spacing.md,
                  backgroundColor: Colors.white,
                  alignItems: 'center',
                }}>
                  {doctorInfo.signature ? (
                    <View style={{ alignItems: 'center', width: '100%', marginBottom: Spacing.sm }}>
                      <Image
                        source={{ uri: doctorInfo.signature }}
                        style={{ width: 180, height: 60, marginBottom: 6 }}
                        resizeMode="contain"
                      />
                      <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                        Signature active on prescriptions &amp; PDFs
                      </Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', marginBottom: Spacing.sm, paddingVertical: 10 }}>
                      <Ionicons name="create-outline" size={32} color={Colors.textMuted} />
                      <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                        No signature image uploaded
                      </Text>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 2 }}>
                        (An automatic cursive digital signature will be generated on PDF)
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={pickSignature}
                      style={{
                        backgroundColor: Colors.primaryBlue,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: Radius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color={Colors.white} />
                      <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 13 }}>
                        {doctorInfo.signature ? 'Change Signature' : 'Upload Signature'}
                      </Text>
                    </Pressable>

                    {doctorInfo.signature ? (
                      <Pressable
                        onPress={clearSignature}
                        style={{
                          backgroundColor: '#fee2e2',
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          borderRadius: Radius.sm,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 13 }}>
                          Remove
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Step 2: Patient Info ── */}
          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Information</Text>

              {/* Patient Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Patient Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Arun Kumar"
                  placeholderTextColor={Colors.textMuted}
                  value={patientInfo.name}
                  onChangeText={v => setPatientInfo(prev => ({ ...prev, name: v }))}
                  autoCapitalize="words"
                />
              </View>

              {/* Age & Gender Row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={[styles.field, { flex: 1, marginBottom: 0 }]}>
                  <Text style={styles.label}>Age *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 35 yrs"
                    placeholderTextColor={Colors.textMuted}
                    value={patientInfo.age}
                    onChangeText={v => setPatientInfo(prev => ({ ...prev, age: v }))}
                  />
                </View>

                {/* Gender Segmented Selector */}
                <View style={[styles.field, { flex: 1.5, marginBottom: 0 }]}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={{ flexDirection: 'row', gap: 5, marginTop: 1 }}>
                    {['Male', 'Female', 'Other'].map(g => {
                      const isSelected = (patientInfo.gender || '').toLowerCase() === g.toLowerCase()
                      return (
                        <Pressable
                          key={g}
                          onPress={() => setPatientInfo(prev => ({ ...prev, gender: isSelected ? '' : g }))}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: Radius.md,
                            borderWidth: 1.5,
                            borderColor: isSelected ? Colors.primaryBlue : Colors.border,
                            backgroundColor: isSelected ? Colors.primaryBlue : Colors.white,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{
                            fontSize: 11,
                            fontWeight: isSelected ? '800' : '600',
                            color: isSelected ? Colors.white : Colors.textPrimary,
                          }}>
                            {g}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              </View>

              {/* Weight & Phone Row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={[styles.field, { flex: 1, marginBottom: 0 }]}>
                  <Text style={styles.label}>Weight</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 70 kg"
                    placeholderTextColor={Colors.textMuted}
                    value={patientInfo.weight}
                    onChangeText={v => setPatientInfo(prev => ({ ...prev, weight: v }))}
                  />
                </View>
                <View style={[styles.field, { flex: 1.5, marginBottom: 0 }]}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 99000 00000"
                    placeholderTextColor={Colors.textMuted}
                    value={patientInfo.phone}
                    onChangeText={v => setPatientInfo(prev => ({ ...prev, phone: v }))}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* ── Recorded Vitals & Examination Findings (Objective) ── */}
              {(template.layout === 'soap' || template.id === 'soap-clinical' || template.layout === 'detailed' || getTemplateFieldConfig(template.id).hasVitals) && (
                <View style={{
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1.5,
                  borderColor: '#BFDBFE',
                  borderRadius: Radius.lg,
                  padding: 14,
                  marginTop: 6,
                  marginBottom: 10,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <View style={{ backgroundColor: '#DBEAFE', padding: 6, borderRadius: 8 }}>
                      <Ionicons name="pulse" size={16} color="#1D4ED8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E40AF' }}>
                        Objective — Vitals & Examination
                      </Text>
                      <Text style={{ fontSize: 11, color: '#3B82F6' }}>
                        Fills the vitals badges in your prescription PDF
                      </Text>
                    </View>
                  </View>

                  {/* Vitals Row 1: BP, HR, Temp */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>BP (mmHg)</Text>
                      <TextInput
                        style={[styles.input, { padding: 8, fontSize: 13, backgroundColor: '#FFFFFF' }]}
                        placeholder="120/80"
                        placeholderTextColor={Colors.textMuted}
                        value={patientInfo.bp}
                        onChangeText={v => setPatientInfo(prev => ({ ...prev, bp: v }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>HR / Pulse (bpm)</Text>
                      <TextInput
                        style={[styles.input, { padding: 8, fontSize: 13, backgroundColor: '#FFFFFF' }]}
                        placeholder="72"
                        placeholderTextColor={Colors.textMuted}
                        value={patientInfo.pulse}
                        onChangeText={v => setPatientInfo(prev => ({ ...prev, pulse: v }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>Temp (°F)</Text>
                      <TextInput
                        style={[styles.input, { padding: 8, fontSize: 13, backgroundColor: '#FFFFFF' }]}
                        placeholder="98.6"
                        placeholderTextColor={Colors.textMuted}
                        value={patientInfo.temp}
                        onChangeText={v => setPatientInfo(prev => ({ ...prev, temp: v }))}
                      />
                    </View>
                  </View>

                  {/* Vitals Row 2: SpO2, RR */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>SpO₂ (%)</Text>
                      <TextInput
                        style={[styles.input, { padding: 8, fontSize: 13, backgroundColor: '#FFFFFF' }]}
                        placeholder="98"
                        placeholderTextColor={Colors.textMuted}
                        value={patientInfo.spo2}
                        onChangeText={v => setPatientInfo(prev => ({ ...prev, spo2: v }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>RR (/min)</Text>
                      <TextInput
                        style={[styles.input, { padding: 8, fontSize: 13, backgroundColor: '#FFFFFF' }]}
                        placeholder="16"
                        placeholderTextColor={Colors.textMuted}
                        value={patientInfo.respiratoryRate}
                        onChangeText={v => setPatientInfo(prev => ({ ...prev, respiratoryRate: v }))}
                      />
                    </View>
                  </View>

                  {/* Examination Findings */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>
                      Examination Findings
                    </Text>
                    <TextInput
                      style={[styles.input, { height: 56, textAlignVertical: 'top', padding: 8, fontSize: 13, backgroundColor: '#FFFFFF' }]}
                      placeholder="e.g. Normal heart sounds, clear chest, abdomen soft."
                      placeholderTextColor={Colors.textMuted}
                      value={patientInfo.examination}
                      onChangeText={v => setPatientInfo(prev => ({ ...prev, examination: v }))}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>
              )}
              
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.sectionTitle}>Review & Export</Text>
                <Pressable
                  style={styles.fullPreviewChip}
                  onPress={() => setFullscreenPreview(template)}
                >
                  <Ionicons name="expand-outline" size={13} color="#155EEF" />
                  <Text style={styles.fullPreviewChipText}>Full A4 Sheet</Text>
                </Pressable>
              </View>
              <Text style={styles.hint}>Verify details before generating PDF</Text>
              
              {/* Template Switcher Bar */}
              <View style={styles.reviewTemplateBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                  <Text style={{ fontSize: 24 }}>{template.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewTemplateSub}>Selected Template</Text>
                    <Text style={styles.reviewTemplateTitle} numberOfLines={1}>{template.name}</Text>
                  </View>
                </View>
                <Pressable
                  style={styles.reviewChangeBtn}
                  onPress={() => setStep(0)}
                >
                  <Ionicons name="swap-horizontal" size={14} color="#155EEF" />
                  <Text style={styles.reviewChangeBtnText}>Change</Text>
                </Pressable>
              </View>

              {/* Authentic Live Template Prescription Preview */}
              <PrescriptionReviewCard
                template={template}
                doctorInfo={doctorInfo}
                patientInfo={patientInfo}
                diagnosis={diagnosis}
                symptoms={symptoms}
                medicines={medicines}
                advice={advice}
                followUp={followUp}
                labTests={labTests}
                date={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              />

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
              if (step === 2 && !patientInfo.name.trim()) {
                Alert.alert('Patient Name Required', 'Please enter the patient name before proceeding.')
                return
              }
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
  
  fullPreviewChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  fullPreviewChipText: { fontSize: 11, fontWeight: '700', color: '#155EEF' },

  reviewTemplateBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14,
  },
  reviewTemplateSub: { fontSize: 9.5, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewTemplateTitle: { fontSize: 14, fontWeight: '800', color: '#102A56' },
  reviewChangeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  reviewChangeBtnText: { fontSize: 12, fontWeight: '700', color: '#155EEF' },

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
