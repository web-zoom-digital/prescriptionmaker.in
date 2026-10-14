import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, Pressable, Platform,
  Alert, ActivityIndicator, Dimensions, PanResponder,
  StatusBar, ScrollView, TextInput, KeyboardAvoidingView,
  Modal,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Line, Rect, Text as SvgText, Circle } from 'react-native-svg'
import * as Print from 'expo-print'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

const { width: SW, height: SH } = Dimensions.get('window')

import { MOBILE_TEMPLATES, type Template } from '../lib/templates'
import { generatePrescriptionHTML } from '../lib/pdf-generator'
import {
  downloadPrescriptionPdf,
  downloadTabletPrescriptionPdf,
  printCleanPrescription,
  generateTabletPrescriptionHTML,
} from '../lib/pdf-export-service'
import TestPresetModal from '../components/TestPresetModal'
import { getTestPresetByTemplateId, type TestPreset } from '../lib/test-presets'
import { getDoctorProfile } from '../lib/local-store'

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
  specialization?: string
  registrationNumber?: string
}

type PatientForm = {
  patientName: string
  age: string
  sex: string
  date: string
  chiefComplaint: string
  diagnosis: string
  address?: string
  allergies?: string
  // Recorded Vitals & Clinical Stats
  bp?: string
  pulse?: string
  temp?: string
  spo2?: string
  weight?: string
  height?: string
  opdRef?: string
}

type SelectedTemplate = {
  id: string
  name: string
  emoji: string
  primaryColor: string
  accentColor: string
}

// ── Template Picker Step ──────────────────────────────────────────────────────
function TemplatePickerStep({
  onSelect,
  onOpenTestLab,
}: {
  onSelect: (t: SelectedTemplate) => void
  onOpenTestLab?: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [popupTmpl, setPopupTmpl] = useState<Template | null>(null)

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={tpS.heading}>Choose a Template</Text>
            <Text style={tpS.sub}>Tap any template to preview full page & select</Text>
          </View>
          {onOpenTestLab && (
            <Pressable style={tpS.testLabBtn} onPress={onOpenTestLab}>
              <Ionicons name="flask" size={14} color="#fff" />
              <Text style={tpS.testLabBtnText}>⚡ 10 Test Cases</Text>
            </Pressable>
          )}
        </View>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Template grid with real images */}
        <View style={tpS.grid}>
          {filtered.map(tmpl => {
            const isSelected = selected === tmpl.id
            return (
              <Pressable
                key={tmpl.id}
                style={[tpS.card, isSelected && tpS.cardSelected]}
                onPress={() => {
                  setSelected(tmpl.id)
                  setPopupTmpl(tmpl)
                }}
              >
                {/* Thumbnail image */}
                <View style={tpS.imageWrap}>
                  <Image source={tmpl.image} style={tpS.cardImage} resizeMode="contain" />
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="eye-outline" size={12} color="#155EEF" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#155EEF' }}>Tap to Preview & Select</Text>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Large preview when selected — Shows 100% of the prescription (Top to Bottom, No Cut-Off) */}
        {selectedTmpl && (
          <View style={tpS.bigPreviewWrap}>
            <View style={tpS.bigPreviewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={tpS.bigPreviewEmoji}>{selectedTmpl.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={tpS.bigPreviewLabel} numberOfLines={1}>Selected: {selectedTmpl.name}</Text>
                  <View style={tpS.fullPageBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                    <Text style={tpS.fullPageBadgeText}>Complete A4 Layout (Header to Footer)</Text>
                  </View>
                </View>
              </View>
              <Pressable
                style={tpS.fullscreenBtn}
                onPress={() => setPopupTmpl(selectedTmpl)}
              >
                <Ionicons name="expand-outline" size={13} color="#155EEF" />
                <Text style={tpS.fullscreenBtnText}>Pop-up View</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                tpS.bigPreview,
                { borderColor: selectedTmpl.styles.primaryColor },
                pressed && { opacity: 0.9 }
              ]}
              onPress={() => setPopupTmpl(selectedTmpl)}
            >
              <Image source={selectedTmpl.image} style={tpS.bigPreviewImage} resizeMode="contain" />
            </Pressable>
            <Text style={tpS.bigPreviewHint}>Tap preview to open pop-up • Entire layout 100% visible</Text>
          </View>
        )}
      </ScrollView>

      {/* Pop-up Modal when user taps any template */}
      {popupTmpl && (
        <Modal
          visible={!!popupTmpl}
          animationType="slide"
          transparent
          onRequestClose={() => setPopupTmpl(null)}
        >
          <View style={tpS.popupOverlay}>
            <View style={tpS.popupCard}>
              {/* Header */}
              <View style={tpS.popupHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 24 }}>{popupTmpl.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={tpS.popupTitle} numberOfLines={1}>{popupTmpl.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <View style={[tpS.categoryBadge, { backgroundColor: popupTmpl.styles.primaryColor + '18' }]}>
                        <Text style={[tpS.categoryBadgeText, { color: popupTmpl.styles.primaryColor }]}>
                          {popupTmpl.category.toUpperCase()}
                        </Text>
                      </View>
                      <View style={tpS.fullPageBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                        <Text style={tpS.fullPageBadgeText}>Full A4 Page</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Pressable style={tpS.popupCloseBtn} onPress={() => setPopupTmpl(null)}>
                  <Ionicons name="close" size={22} color="#475569" />
                </Pressable>
              </View>

              {/* Scrollable preview body */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={tpS.popupScroll}
                showsVerticalScrollIndicator={true}
              >
                <View style={tpS.descBox}>
                  <Ionicons name="information-circle" size={16} color="#155EEF" />
                  <Text style={tpS.descText}>{popupTmpl.description}</Text>
                </View>

                {/* Complete A4 preview image with 100% visibility (no cut-off) */}
                <View style={[tpS.previewFrame, { borderColor: popupTmpl.styles.primaryColor }]}>
                  <Image
                    source={popupTmpl.image}
                    style={tpS.previewImg}
                    resizeMode="contain"
                  />
                </View>
                <Text style={tpS.previewFootNote}>100% Complete A4 layout • Header, Patient Details & Doctor Signature</Text>
              </ScrollView>

              {/* Bottom Sticky Action Footer */}
              <View style={tpS.popupFooter}>
                <Pressable
                  style={tpS.popupCancelBtn}
                  onPress={() => setPopupTmpl(null)}
                >
                  <Text style={tpS.popupCancelText}>Explore Others</Text>
                </Pressable>

                <Pressable
                  style={[tpS.popupSelectBtn, { backgroundColor: popupTmpl.styles.primaryColor }]}
                  onPress={() => {
                    const chosen = popupTmpl
                    setPopupTmpl(null)
                    onSelect({
                      id: chosen.id,
                      name: chosen.name,
                      emoji: chosen.emoji,
                      primaryColor: chosen.styles.primaryColor,
                      accentColor: chosen.styles.accentColor,
                    })
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={tpS.popupSelectText}>✓ Select & Use This Template</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
  imageWrap: { width: '100%', height: 136, backgroundColor: '#f8fafc', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  proBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  checkBadge: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#155EEF', alignItems: 'center', justifyContent: 'center' },
  colorBar: { height: 3, width: '100%' },
  cardBody: { padding: 10, gap: 3 },
  cardName: { fontSize: 13, fontWeight: '800', color: '#102A56', lineHeight: 17 },
  cardDesc: { fontSize: 11, color: '#64748b', lineHeight: 15, fontWeight: '500' },
  bigPreviewWrap: { marginHorizontal: 12, marginTop: 8, marginBottom: 12 },
  bigPreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bigPreviewEmoji: { fontSize: 24 },
  bigPreviewLabel: { fontSize: 14, fontWeight: '800', color: '#102A56' },
  fullPageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  fullPageBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  fullscreenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  fullscreenBtnText: { fontSize: 11, fontWeight: '700', color: '#155EEF' },
  bigPreview: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 2,
    width: '100%', maxWidth: 520, alignSelf: 'center',
    aspectRatio: 1588 / 2246, backgroundColor: '#ffffff',
    shadowColor: '#102A56', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  bigPreviewImage: { width: '100%', height: '100%' },
  bigPreviewHint: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 6, fontWeight: '500' },
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
  footer: { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8EEF8', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  useBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#155EEF', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#155EEF', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  useBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  testLabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#155EEF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  testLabBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
})


function safeTruncate(text: string | undefined | null, maxLen: number): string {
  if (!text) return ''
  const trimmed = text.trim()
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen - 1) + '…' : trimmed
}

// ── Helper to render SVG writing lines ────────────────────────────────────────
function renderSvgWritingLines(startY: number, endY: number, lineCount: number, x1: number, x2: number) {
  const lineSpacing = (endY - startY) / lineCount
  return Array.from({ length: lineCount }).map((_, i) => (
    <Line
      key={i}
      x1={x1}
      y1={Math.round(startY + (i + 1) * lineSpacing)}
      x2={x2}
      y2={Math.round(startY + (i + 1) * lineSpacing)}
      stroke="#e2e8f0"
      strokeWidth={0.9}
    />
  ))
}

// ── 1. Two-Column Sidebar Overlay ─────────────────────────────────────────────
function OverlayTwoColumnSidebar({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#102A56'
  const accentColor = template.styles?.accentColor || '#155EEF'

  const sbW = Math.round(w * 0.31)
  const mainX = sbW
  const mainW = w - sbW

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const diagnosisClean = safeTruncate(patient.diagnosis, 24) || 'Acute Pharyngitis'
  const clinicClean = safeTruncate(doctor.clinicName, 24) || 'Name of your clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Full Name', 22)
  const qualClean = safeTruncate(doctor.qualification || 'MBBS, MD', 22)
  const patientAgeSex = [patient.age ? `Age: ${patient.age}` : 'Age: 34', patient.sex ? `Sex: ${patient.sex}` : 'Sex: Male'].join(' · ')
  const todayStr = patient.date || new Date().toLocaleDateString('en-IN')

  const lineCount = 13
  const rxStartY = Math.round(h * 0.355)
  const rxEndY = h - 42

  return (
    <>
      {/* ── Left Sidebar (Doctor & Clinic Info + Recorded Vitals) ── */}
      <Rect x={0} y={0} width={sbW} height={h} fill={primaryColor} />

      {/* Doctor photo placeholder / Logo */}
      <Circle cx={sbW / 2} cy={Math.round(h * 0.055)} r={Math.max(14, Math.round(h * 0.026))} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} />
      <SvgText x={sbW / 2} y={Math.round(h * 0.055) + 5} textAnchor="middle" fontSize={14}>👨‍⚕️</SvgText>

      {/* Doctor Info */}
      <SvgText x={sbW / 2} y={Math.round(h * 0.108)} textAnchor="middle" fontSize={Math.max(8.5, Math.round(w * 0.028))} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={sbW / 2} y={Math.round(h * 0.128)} textAnchor="middle" fontSize={Math.max(7, Math.round(w * 0.022))} fill="rgba(255,255,255,0.85)">{qualClean}</SvgText>
      <SvgText x={sbW / 2} y={Math.round(h * 0.147)} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill={accentColor}>General Medicine</SvgText>
      <Line x1={8} y1={Math.round(h * 0.162)} x2={sbW - 8} y2={Math.round(h * 0.162)} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />

      {/* Clinic */}
      <SvgText x={10} y={Math.round(h * 0.182)} fontSize={Math.max(6, Math.round(w * 0.019))} fontWeight="bold" fill="rgba(255,255,255,0.65)" letterSpacing={0.5}>CLINIC</SvgText>
      <SvgText x={10} y={Math.round(h * 0.203)} fontSize={Math.max(7.5, Math.round(w * 0.024))} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      {doctor.phone ? <SvgText x={10} y={Math.round(h * 0.222)} fontSize={Math.max(6.2, Math.round(w * 0.019))} fill="rgba(255,255,255,0.75)">{`☎ ${safeTruncate(doctor.phone, 14)}`}</SvgText> : null}
      <Line x1={8} y1={Math.round(h * 0.238)} x2={sbW - 8} y2={Math.round(h * 0.238)} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />

      {/* ── RECORDED VITALS (Exact match to preview pop-up!) ── */}
      <SvgText x={10} y={Math.round(h * 0.26)} fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="rgba(255,255,255,0.7)" letterSpacing={0.4}>RECORDED VITALS</SvgText>
      
      {/* BP */}
      <SvgText x={10} y={Math.round(h * 0.285)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">BP <SvgText fontSize={Math.max(5.5, Math.round(w * 0.017))} fill="rgba(255,255,255,0.6)">(mmHg)</SvgText></SvgText>
      <Line x1={sbW - 44} y1={Math.round(h * 0.285)} x2={sbW - 8} y2={Math.round(h * 0.285)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.bp ? (
        <SvgText x={sbW - 9} y={Math.round(h * 0.285) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.bp}</SvgText>
      ) : null}

      {/* Pulse */}
      <SvgText x={10} y={Math.round(h * 0.312)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Pulse <SvgText fontSize={Math.max(5.5, Math.round(w * 0.017))} fill="rgba(255,255,255,0.6)">(bpm)</SvgText></SvgText>
      <Line x1={sbW - 44} y1={Math.round(h * 0.312)} x2={sbW - 8} y2={Math.round(h * 0.312)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.pulse ? (
        <SvgText x={sbW - 9} y={Math.round(h * 0.312) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.pulse}</SvgText>
      ) : null}

      {/* Temp */}
      <SvgText x={10} y={Math.round(h * 0.339)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Temp <SvgText fontSize={Math.max(5.5, Math.round(w * 0.017))} fill="rgba(255,255,255,0.6)">(°F)</SvgText></SvgText>
      <Line x1={sbW - 44} y1={Math.round(h * 0.339)} x2={sbW - 8} y2={Math.round(h * 0.339)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.temp ? (
        <SvgText x={sbW - 9} y={Math.round(h * 0.339) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.temp}</SvgText>
      ) : null}

      {/* SpO2 */}
      <SvgText x={10} y={Math.round(h * 0.366)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">SpO₂ <SvgText fontSize={Math.max(5.5, Math.round(w * 0.017))} fill="rgba(255,255,255,0.6)">(%)</SvgText></SvgText>
      <Line x1={sbW - 44} y1={Math.round(h * 0.366)} x2={sbW - 8} y2={Math.round(h * 0.366)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.spo2 ? (
        <SvgText x={sbW - 9} y={Math.round(h * 0.366) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.spo2}</SvgText>
      ) : null}

      {/* Weight */}
      <SvgText x={10} y={Math.round(h * 0.393)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Weight <SvgText fontSize={Math.max(5.5, Math.round(w * 0.017))} fill="rgba(255,255,255,0.6)">(kg)</SvgText></SvgText>
      <Line x1={sbW - 44} y1={Math.round(h * 0.393)} x2={sbW - 8} y2={Math.round(h * 0.393)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.weight ? (
        <SvgText x={sbW - 9} y={Math.round(h * 0.393) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.weight}</SvgText>
      ) : null}

      {/* Height */}
      <SvgText x={10} y={Math.round(h * 0.42)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Height <SvgText fontSize={Math.max(5.5, Math.round(w * 0.017))} fill="rgba(255,255,255,0.6)">(cm)</SvgText></SvgText>
      <Line x1={sbW - 44} y1={Math.round(h * 0.42)} x2={sbW - 8} y2={Math.round(h * 0.42)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.height ? (
        <SvgText x={sbW - 9} y={Math.round(h * 0.42) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.height}</SvgText>
      ) : null}

      {/* Sidebar Footer */}
      <SvgText x={sbW / 2} y={h - 12} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.4)">prescriptionmaker.in</SvgText>

      {/* ── Right Main Section ── */}
      {/* Top Header */}
      <SvgText x={mainX + 10} y={Math.round(h * 0.042)} fontSize={Math.max(8.5, Math.round(w * 0.028))} fontWeight="bold" fill={primaryColor} letterSpacing={0.8}>MEDICAL PRESCRIPTION</SvgText>
      <SvgText x={mainX + 10} y={Math.round(h * 0.066)} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">Date: <SvgText fontWeight="bold" fill="#334155">{todayStr}</SvgText></SvgText>
      <SvgText x={w - 10} y={Math.round(h * 0.042)} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">
        {patient.opdRef ? `OPD Ref: ${patient.opdRef}` : 'OPD Ref: _________'}
      </SvgText>
      <Line x1={mainX + 10} y1={Math.round(h * 0.078)} x2={w - 10} y2={Math.round(h * 0.078)} stroke={accentColor} strokeWidth={1.5} />

      {/* PATIENT DETAILS Box (rounded light box) */}
      <Rect x={mainX + 10} y={Math.round(h * 0.092)} width={mainW - 20} height={Math.round(h * 0.076)} fill={accentColor + '18'} rx={4} />
      <SvgText x={mainX + 16} y={Math.round(h * 0.116)} fontSize={Math.max(6.5, Math.round(w * 0.019))} fontWeight="bold" fill="#64748b" letterSpacing={0.5}>PATIENT DETAILS</SvgText>
      <SvgText x={mainX + 16} y={Math.round(h * 0.146)} fontSize={Math.max(9.5, Math.round(w * 0.03))} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={w - 16} y={Math.round(h * 0.146)} textAnchor="end" fontSize={Math.max(7.5, Math.round(w * 0.023))} fill="#475569">{patientAgeSex}</SvgText>

      {/* DIAGNOSIS Box (bordered box with solid left accent) */}
      <Rect x={mainX + 10} y={Math.round(h * 0.182)} width={mainW - 20} height={Math.round(h * 0.065)} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <Rect x={mainX + 10} y={Math.round(h * 0.182)} width={3.5} height={Math.round(h * 0.065)} fill={primaryColor} />
      <SvgText x={mainX + 18} y={Math.round(h * 0.205)} fontSize={Math.max(6.5, Math.round(w * 0.019))} fontWeight="bold" fill="#64748b" letterSpacing={0.5}>DIAGNOSIS</SvgText>
      <SvgText x={mainX + 18} y={Math.round(h * 0.233)} fontSize={Math.max(8.5, Math.round(w * 0.027))} fontWeight="bold" fill={primaryColor}>{diagnosisClean}</SvgText>

      {/* ℞ Symbol */}
      <SvgText x={mainX + 10} y={Math.round(h * 0.282)} fontSize={16} fontWeight="bold" fill={primaryColor} fontFamily="Georgia">℞</SvgText>

      {/* Medicine Table Header (colored bar) */}
      <Rect x={mainX + 10} y={Math.round(h * 0.298)} width={mainW - 20} height={Math.round(h * 0.038)} fill={primaryColor} rx={2} />
      <SvgText x={mainX + 16} y={Math.round(h * 0.323)} fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Medicine</SvgText>
      <SvgText x={mainX + (mainW - 20) * 0.46} y={Math.round(h * 0.323)} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Unit</SvgText>
      <SvgText x={mainX + (mainW - 20) * 0.70} y={Math.round(h * 0.323)} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Frequency</SvgText>
      <SvgText x={w - 16} y={Math.round(h * 0.323)} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Duration</SvgText>

      {/* Writing lines */}
      {renderSvgWritingLines(rxStartY, rxEndY, lineCount, mainX + 10, w - 10)}

      {/* Signature & Footer */}
      <Line x1={w - 95} y1={h - 22} x2={w - 10} y2={h - 22} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 52} y={h - 12} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">Doctor's Signature</SvgText>
      <SvgText x={mainX + 10} y={h - 12} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#94a3b8">Two-Column Sidebar</SvgText>
    </>
  )
}

// ── 2. Hospital OPD Form Overlay ──────────────────────────────────────────────
function OverlayHospitalOPD({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#0B1B3D'
  const accentColor = template.styles?.accentColor || '#155EEF'

  const hospH = Math.round(h * 0.10)
  const patientNameClean = safeTruncate(patient.patientName, 24) || '___________________________'
  const diagnosisClean = safeTruncate(patient.diagnosis, 26) || '_________________________'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'City Multispecialty Hospital'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Full Name', 24)
  const qualClean = safeTruncate(doctor.qualification || 'MBBS, MD', 20)
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = `${patient.age ? `${patient.age} yrs` : '—'} / ${patient.sex || '—'}`

  const row1Y = hospH + 4
  const row1H = 18
  const row2Y = row1Y + row1H + 3
  const row2H = 18
  const patBoxY = row2Y + row2H + 4
  const patBoxH = Math.round(h * 0.11)
  const rxY = patBoxY + patBoxH + 10
  const lineCount = 14

  return (
    <>
      {/* Hospital Banner */}
      <Rect x={0} y={0} width={w} height={hospH} fill={primaryColor} />
      <SvgText x={12} y={hospH * 0.42} fontSize={Math.max(10, Math.round(w * 0.034))} fontWeight="bold" fill="#ffffff">🏛️ {clinicClean}</SvgText>
      <SvgText x={12} y={hospH * 0.74} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="rgba(255,255,255,0.85)">Government / Multispecialty Hospital · OPD Department</SvgText>
      <SvgText x={w - 12} y={hospH * 0.42} textAnchor="end" fontSize={Math.max(8, Math.round(w * 0.026))} fontWeight="bold" fill="#ffffff">OPD / PRESCRIPTION</SvgText>
      <SvgText x={w - 12} y={hospH * 0.74} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="rgba(255,255,255,0.8)">{`Date: ${dateStr}`}</SvgText>

      {/* MRN / Ward / Bed / IP-OP Row */}
      <Rect x={10} y={row1Y} width={w - 20} height={row1H} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <SvgText x={16} y={row1Y + 12} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">MRN No: <SvgText fontWeight="bold" fill="#0f172a">_____</SvgText></SvgText>
      <SvgText x={10 + (w - 20) * 0.28} y={row1Y + 12} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">Ward: <SvgText fontWeight="bold" fill="#0f172a">_____</SvgText></SvgText>
      <SvgText x={10 + (w - 20) * 0.54} y={row1Y + 12} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">Bed: <SvgText fontWeight="bold" fill="#0f172a">_____</SvgText></SvgText>
      <SvgText x={w - 16} y={row1Y + 12} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">IP/OP: <SvgText fontWeight="bold" fill="#0f172a">OPD</SvgText></SvgText>

      {/* Attending Physician Bar */}
      <Rect x={10} y={row2Y} width={w - 20} height={row2H} fill={accentColor + '18'} stroke={accentColor + '40'} strokeWidth={0.8} rx={3} />
      <SvgText x={16} y={row2Y + 12} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">ATTENDING: <SvgText fontWeight="bold" fill={primaryColor}>{doctorClean}</SvgText> <SvgText fontSize={Math.max(6, Math.round(w * 0.018))} fill="#64748b">{qualClean}</SvgText></SvgText>
      <SvgText x={w - 16} y={row2Y + 12} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">SPECIALTY: <SvgText fontWeight="bold" fill={primaryColor}>General / OPD</SvgText></SvgText>

      {/* Patient Information Table */}
      <Rect x={10} y={patBoxY} width={w - 20} height={patBoxH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <Rect x={10} y={patBoxY} width={w - 20} height={14} fill={primaryColor + '15'} rx={2} />
      <SvgText x={16} y={patBoxY + 10} fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill={primaryColor} letterSpacing={0.5}>PATIENT INFORMATION</SvgText>
      <SvgText x={16} y={patBoxY + 26} fontSize={Math.max(9, Math.round(w * 0.028))} fontWeight="bold" fill="#0f172a">{`Patient: ${patientNameClean}`}</SvgText>
      <SvgText x={w - 16} y={patBoxY + 26} textAnchor="end" fontSize={Math.max(7.5, Math.round(w * 0.023))} fill="#475569">{patientAgeSex}</SvgText>
      <Line x1={10} y1={patBoxY + 32} x2={w - 10} y2={patBoxY + 32} stroke={primaryColor + '15'} strokeWidth={0.8} />
      <SvgText x={16} y={patBoxY + 44} fontSize={Math.max(7.5, Math.round(w * 0.023))} fill="#64748b">Diagnosis: <SvgText fontWeight="bold" fill={primaryColor}>{diagnosisClean}</SvgText></SvgText>

      {/* ℞ Prescription Table */}
      <SvgText x={12} y={rxY} fontSize={Math.max(8.5, Math.round(w * 0.028))} fontWeight="bold" fill={primaryColor}>℞ MEDICINES PRESCRIBED (OPD)</SvgText>
      <Rect x={10} y={rxY + 4} width={w - 20} height={Math.round(h * 0.036)} fill={primaryColor} rx={2} />
      <SvgText x={16} y={rxY + 16} fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Medication / Strength</SvgText>
      <SvgText x={10 + (w - 20) * 0.50} y={rxY + 16} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Dosage / Frequency</SvgText>
      <SvgText x={10 + (w - 20) * 0.74} y={rxY + 16} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Route</SvgText>
      <SvgText x={w - 16} y={rxY + 16} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Duration</SvgText>

      {/* Ruled lines */}
      {renderSvgWritingLines(rxY + 22, h - 45, lineCount, 10, w - 10)}

      {/* Dual Signature Footer */}
      <Line x1={16} y1={h - 22} x2={100} y2={h - 22} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={58} y={h - 12} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill="#64748b">HOD SIGNATURE</SvgText>

      <Line x1={w - 105} y1={h - 22} x2={w - 16} y2={h - 22} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 60} y={h - 12} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill="#64748b">ATTENDING DOCTOR</SvgText>
    </>
  )
}

// ── 3. SOAP Clinical Notes Overlay ────────────────────────────────────────────
function OverlaySOAP({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#312e81'
  const accentColor = template.styles?.accentColor || '#6366f1'

  const headH = Math.round(h * 0.09)
  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 32) || 'Reported symptoms, cough, fever...'
  const diagnosisClean = safeTruncate(patient.diagnosis, 32) || 'Clinical assessment pending'
  const clinicClean = safeTruncate(doctor.clinicName, 28) || 'Clinical Care Centre'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 24)
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = `${patient.age ? `${patient.age}y` : '—'} / ${patient.sex || '—'}`

  const patStripY = headH + 3
  const patStripH = 17
  const sBoxY = patStripY + patStripH + 4
  const sBoxH = 26
  const oBoxY = sBoxY + sBoxH + 4
  const oBoxH = 34
  const aBoxY = oBoxY + oBoxH + 4
  const aBoxH = 24
  const pY = aBoxY + aBoxH + 6
  const lineCount = 11

  return (
    <>
      {/* Header */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={12} y={headH * 0.42} fontSize={Math.max(10, Math.round(w * 0.034))} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      <SvgText x={12} y={headH * 0.74} fontSize={Math.max(7, Math.round(w * 0.022))} fill="rgba(255,255,255,0.85)">{`${doctorClean} · SOAP Clinical Record`}</SvgText>
      <SvgText x={w - 12} y={headH * 0.42} textAnchor="end" fontSize={Math.max(7.5, Math.round(w * 0.024))} fontWeight="bold" fill="#ffffff">SOAP PROGRESS NOTE</SvgText>
      <SvgText x={w - 12} y={headH * 0.74} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="rgba(255,255,255,0.8)">{dateStr}</SvgText>

      {/* Patient Strip */}
      <Rect x={10} y={patStripY} width={w - 20} height={patStripH} fill={accentColor + '18'} rx={3} />
      <SvgText x={16} y={patStripY + 12} fontSize={Math.max(6.8, Math.round(w * 0.022))} fill="#1e293b">
        Patient: <SvgText fontWeight="bold">{patientNameClean}</SvgText>   |   Age/Sex: <SvgText fontWeight="bold">{patientAgeSex}</SvgText>   |   Date: <SvgText fontWeight="bold">{dateStr}</SvgText>
      </SvgText>

      {/* S — Subjective */}
      <Rect x={10} y={sBoxY} width={w - 20} height={sBoxH} fill="#ffffff" stroke="#7c3aed40" strokeWidth={0.8} rx={3} />
      <Rect x={10} y={sBoxY} width={w - 20} height={12} fill="#7c3aed" rx={2} />
      <SvgText x={16} y={sBoxY + 9} fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill="#ffffff">S — SUBJECTIVE (CHIEF COMPLAINT & HISTORY)</SvgText>
      <SvgText x={16} y={sBoxY + 21} fontSize={Math.max(7.2, Math.round(w * 0.023))} fill="#334155">{complaintClean}</SvgText>

      {/* O — Objective (Includes 6 Vitals!) */}
      <Rect x={10} y={oBoxY} width={w - 20} height={oBoxH} fill="#ffffff" stroke="#1d4ed840" strokeWidth={0.8} rx={3} />
      <Rect x={10} y={oBoxY} width={w - 20} height={12} fill="#1d4ed8" rx={2} />
      <SvgText x={16} y={oBoxY + 9} fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill="#ffffff">O — OBJECTIVE (VITALS & EXAMINATION)</SvgText>
      <SvgText x={16} y={oBoxY + 21} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#1e293b">
        BP: <SvgText fontWeight="bold">120/80</SvgText>  HR: <SvgText fontWeight="bold">74bpm</SvgText>  Temp: <SvgText fontWeight="bold">98.4°F</SvgText>  SpO₂: <SvgText fontWeight="bold">99%</SvgText>  Wt: <SvgText fontWeight="bold">68kg</SvgText>
      </SvgText>
      <SvgText x={16} y={oBoxY + 30} fontSize={Math.max(6, Math.round(w * 0.018))} fill="#64748b">Exam findings: Normal heart sounds, clear chest, abdomen soft.</SvgText>

      {/* A — Assessment */}
      <Rect x={10} y={aBoxY} width={w - 20} height={aBoxH} fill="#ffffff" stroke="#065f4640" strokeWidth={0.8} rx={3} />
      <Rect x={10} y={aBoxY} width={w - 20} height={12} fill="#065f46" rx={2} />
      <SvgText x={16} y={aBoxY + 9} fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill="#ffffff">A — ASSESSMENT (CLINICAL DIAGNOSIS)</SvgText>
      <SvgText x={16} y={aBoxY + 20} fontSize={Math.max(7.5, Math.round(w * 0.024))} fontWeight="bold" fill="#065f46">{diagnosisClean}</SvgText>

      {/* P — Plan (Rx) */}
      <Rect x={10} y={pY} width={w - 20} height={14} fill="#b45309" rx={2} />
      <SvgText x={16} y={pY + 10} fontSize={Math.max(6.5, Math.round(w * 0.02))} fontWeight="bold" fill="#ffffff">P — PLAN (℞ PRESCRIPTION & MEDICINES)</SvgText>

      {/* Writing lines */}
      {renderSvgWritingLines(pY + 16, h - 38, lineCount, 10, w - 10)}

      {/* Footer */}
      <Line x1={w - 95} y1={h - 20} x2={w - 10} y2={h - 20} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 52} y={h - 10} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">Doctor's Signature</SvgText>
      <SvgText x={12} y={h - 10} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#94a3b8">SOAP Clinical Notes</SvgText>
    </>
  )
}

// ── 4. Minimal Print Ruled Overlay ────────────────────────────────────────────
function OverlayMinimal({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#102A56'

  const patientNameClean = safeTruncate(patient.patientName, 24) || '___________________________'
  const diagnosisClean = safeTruncate(patient.diagnosis, 26) || '_________________________'
  const clinicClean = safeTruncate(doctor.clinicName, 30) || 'Medical Practice'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 24)
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = `${patient.age ? `Age ${patient.age}` : ''}${patient.sex ? ` / ${patient.sex}` : ''}`

  const headH = Math.round(h * 0.11)
  const rxY = headH + 48
  const lineCount = 16

  return (
    <>
      <Line x1={12} y1={12} x2={w - 12} y2={12} stroke={primaryColor} strokeWidth={2} />
      <SvgText x={12} y={28} fontSize={Math.max(11, Math.round(w * 0.038))} fontWeight="bold" fill={primaryColor} fontFamily="Georgia">{doctorClean}</SvgText>
      <SvgText x={12} y={42} fontSize={Math.max(7, Math.round(w * 0.022))} fill="#64748b" fontStyle="italic">{doctor.qualification || 'Physician & Consultant'}</SvgText>

      <SvgText x={w - 12} y={28} textAnchor="end" fontSize={Math.max(9.5, Math.round(w * 0.03))} fontWeight="bold" fill="#0f172a">{clinicClean}</SvgText>
      <SvgText x={w - 12} y={42} textAnchor="end" fontSize={Math.max(7, Math.round(w * 0.022))} fill="#64748b">{dateStr}</SvgText>

      <Line x1={12} y1={headH} x2={w - 12} y2={headH} stroke="#cbd5e1" strokeWidth={0.8} />

      {/* Patient + Date line */}
      <SvgText x={12} y={headH + 16} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#94a3b8">PATIENT: </SvgText>
      <SvgText x={58} y={headH + 16} fontSize={Math.max(8.5, Math.round(w * 0.028))} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={w - 12} y={headH + 16} textAnchor="end" fontSize={Math.max(7, Math.round(w * 0.022))} fill="#64748b">{patientAgeSex}</SvgText>

      {/* Diagnosis Line */}
      <SvgText x={12} y={headH + 34} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#94a3b8">DIAGNOSIS: </SvgText>
      <SvgText x={68} y={headH + 34} fontSize={Math.max(8, Math.round(w * 0.026))} fill="#1e293b">{diagnosisClean}</SvgText>
      <Line x1={12} y1={headH + 40} x2={w - 12} y2={headH + 40} stroke="#e2e8f0" strokeWidth={0.8} />

      {/* Large Italic Serif Rx */}
      <SvgText x={12} y={rxY + 6} fontSize={32} fontFamily="Georgia" fontStyle="italic" fontWeight="bold" fill="#1a202c">℞</SvgText>

      {/* Clean writing lines */}
      {renderSvgWritingLines(rxY + 12, h - 45, lineCount, 12, w - 12)}

      {/* Minimal Footer */}
      <Line x1={w - 95} y1={h - 26} x2={w - 12} y2={h - 26} stroke="#cbd5e1" strokeWidth={0.8} />
      <SvgText x={w - 52} y={h - 14} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#94a3b8">Signature</SvgText>
      <SvgText x={12} y={h - 14} fontSize={Math.max(6, Math.round(w * 0.018))} fill="#cbd5e1" letterSpacing={1}>MINIMAL PRINT RULED</SvgText>
    </>
  )
}

// ── 5. Bilingual Indian Overlay ───────────────────────────────────────────────
function OverlayBilingual({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#7c3aed'
  const accentColor = template.styles?.accentColor || '#a78bfa'
  const bgColor = template.styles?.bgColor || '#faf5ff'

  const headH = Math.round(h * 0.13)
  const patBoxY = headH + 8
  const patBoxH = Math.round(h * 0.12)
  const diagY = patBoxY + patBoxH + 6
  const diagH = 24
  const rxY = diagY + diagH + 10
  const thH = 20
  const tableY = rxY + 16
  const lineCount = 13

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || '_________________________'
  const clinicClean = safeTruncate(doctor.clinicName, 36) || 'City Medical Clinic / क्लीनिक'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 30)

  const f14 = Math.max(12, Math.round(w * 0.038))
  const f10 = Math.max(9, Math.round(w * 0.026))
  const f8 = Math.max(7, Math.round(w * 0.021))
  const f7 = Math.max(6.5, Math.round(w * 0.018))

  return (
    <>
      {/* Purple Header */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={w / 2} y={headH * 0.32} textAnchor="middle" fontSize={f14} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      <SvgText x={w / 2} y={headH * 0.58} textAnchor="middle" fontSize={f10} fill="#ffffff">{`${doctorClean}${doctor.qualification ? ` · ${doctor.qualification}` : ''}`}</SvgText>
      <SvgText x={w / 2} y={headH * 0.82} textAnchor="middle" fontSize={f7} fill="rgba(255,255,255,0.85)">
        {`परामर्श पर्ची / PRESCRIPTION SLIP${doctor.registrationNumber ? ` · Reg: ${doctor.registrationNumber}` : ''}`}
      </SvgText>

      {/* Bilingual Patient Details Box */}
      <Rect x={10} y={patBoxY} width={w - 20} height={patBoxH} fill="#ffffff" stroke={primaryColor + '40'} strokeWidth={1.2} rx={4} />
      <Rect x={10} y={patBoxY} width={w - 20} height={18} fill={primaryColor + '18'} rx={4} />
      <SvgText x={16} y={patBoxY + 12} fontSize={f7} fontWeight="bold" fill={primaryColor}>PATIENT DETAILS / रोगी विवरण</SvgText>
      <SvgText x={w - 16} y={patBoxY + 12} textAnchor="end" fontSize={f7} fill="#64748b">{`तारीख / Date: ${patient.date || new Date().toLocaleDateString('en-IN')}`}</SvgText>

      {/* Row 1: Name, Age, Sex */}
      <SvgText x={16} y={patBoxY + 30} fontSize={f7} fill="#94a3b8">मरीज का नाम / Name</SvgText>
      <SvgText x={16} y={patBoxY + 42} fontSize={f10} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>

      <SvgText x={w * 0.56} y={patBoxY + 30} fontSize={f7} fill="#94a3b8">उम्र / Age</SvgText>
      <SvgText x={w * 0.56} y={patBoxY + 42} fontSize={f10} fontWeight="bold" fill="#0f172a">{patient.age ? `${patient.age} वर्ष` : '—'}</SvgText>

      <SvgText x={w * 0.78} y={patBoxY + 30} fontSize={f7} fill="#94a3b8">लिंग / Sex</SvgText>
      <SvgText x={w * 0.78} y={patBoxY + 42} fontSize={f10} fontWeight="bold" fill="#0f172a">{patient.sex || '—'}</SvgText>

      <Line x1={14} y1={patBoxY + 48} x2={w - 14} y2={patBoxY + 48} stroke={primaryColor + '20'} strokeWidth={0.8} />

      {/* Row 2: Address / पता & Allergies / एलर्जी */}
      <SvgText x={16} y={patBoxY + 59} fontSize={f7} fill="#94a3b8">पता / Address:</SvgText>
      <SvgText x={75} y={patBoxY + 59} fontSize={f7} fill="#334155">{patient.address ? safeTruncate(patient.address, 28) : '_______________________'}</SvgText>

      <SvgText x={w * 0.56} y={patBoxY + 59} fontSize={f7} fill="#94a3b8">एलर्जी / Allergies:</SvgText>
      <SvgText x={w * 0.56 + 72} y={patBoxY + 59} fontSize={f7} fill="#ef4444">{patient.allergies ? safeTruncate(patient.allergies, 18) : 'None / कोई नहीं'}</SvgText>

      {/* Bilingual Diagnosis Box */}
      <Rect x={10} y={diagY} width={w - 20} height={diagH} fill={primaryColor + '08'} stroke={primaryColor + '30'} strokeWidth={1} rx={3} />
      <Rect x={10} y={diagY} width={4} height={diagH} fill={primaryColor} rx={1} />
      <SvgText x={18} y={diagY + 15} fontSize={f8} fill="#64748b">रोग निदान / Diagnosis:</SvgText>
      <SvgText x={125} y={diagY + 15} fontSize={f10} fontWeight="bold" fill={primaryColor}>{diagnosisClean}</SvgText>

      {/* Rx Header */}
      <SvgText x={12} y={rxY + 8} fontSize={18} fontFamily="serif" fontWeight="bold" fill={primaryColor}>℞</SvgText>
      <SvgText x={36} y={rxY + 4} fontSize={f8} fontWeight="bold" fill={primaryColor}>PRESCRIPTION / दवाइयाँ</SvgText>

      {/* Bilingual 5-Column Table Header */}
      <Rect x={10} y={tableY} width={w - 20} height={thH} fill={primaryColor} rx={3} />
      <SvgText x={16} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">#</SvgText>
      <SvgText x={34} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">दवाई / Medicine</SvgText>
      <SvgText x={w * 0.45} y={tableY + 13} textAnchor="middle" fontSize={f7} fontWeight="bold" fill="#ffffff">Unit</SvgText>
      <SvgText x={w * 0.60} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Frequency / मात्रा</SvgText>
      <SvgText x={w * 0.82} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Duration / समय</SvgText>

      {/* Ruled lines */}
      {renderSvgWritingLines(tableY + thH + 6, h - 55, lineCount, 10, w - 10)}

      {/* Investigations / Advice notice */}
      <SvgText x={14} y={h - 40} fontSize={f7} fill="#64748b">जाँच / Investigations: ___________________</SvgText>
      <SvgText x={w * 0.52} y={h - 40} fontSize={f7} fill="#64748b">सलाह / Advice: ________________________</SvgText>

      {/* Footer */}
      <Line x1={10} y1={h - 30} x2={w - 10} y2={h - 30} stroke="#cbd5e1" strokeWidth={0.8} />
      <SvgText x={14} y={h - 18} fontSize={f7} fill="#64748b">Next Visit / अगली मुलाकात: ____________</SvgText>
      <Line x1={w - 120} y1={h - 18} x2={w - 14} y2={h - 18} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 67} y={h - 8} textAnchor="middle" fontSize={f7} fill="#94a3b8">डॉक्टर के हस्ताक्षर / Signature</SvgText>
      <SvgText x={14} y={h - 8} fontSize={Math.max(5.5, Math.round(w * 0.016))} fill="#94a3b8">PrescriptionMaker.in · द्विभाषी पर्ची</SvgText>
    </>
  )
}


// ── 6. Vitals-First Overlay ───────────────────────────────────────────────────
function OverlayVitalsFirst({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#9b2335'
  const accentColor = template.styles?.accentColor || '#e53e3e'
  const bgColor = template.styles?.bgColor || '#fff5f5'

  const headH = Math.round(h * 0.11)
  const patBoxY = headH + 6
  const patBoxH = 26
  const vitalsBoxY = patBoxY + patBoxH + 6
  const vitalsH = 68
  const diagY = vitalsBoxY + vitalsH + 6
  const diagH = 22
  const rxY = diagY + diagH + 10
  const thH = 18
  const tableY = rxY + 14
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Cardiovascular Assessment / Hypertension'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Cardiology & Heart Care'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const f14 = Math.max(12, Math.round(w * 0.038))
  const f10 = Math.max(9, Math.round(w * 0.026))
  const f8 = Math.max(7, Math.round(w * 0.021))
  const f7 = Math.max(6.5, Math.round(w * 0.018))
  const f6 = Math.max(5.5, Math.round(w * 0.016))

  const cardW = (w - 20) / 3
  const cardH = 24

  return (
    <>
      {/* Crimson Header */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={14} y={headH * 0.38} fontSize={f14} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={14} y={headH * 0.68} fontSize={f7} fill={accentColor + 'dd'}>{`${doctor.qualification || 'MBBS, MD (Cardiology)'} · Cardiologist`}</SvgText>
      <SvgText x={w - 14} y={headH * 0.38} textAnchor="end" fontSize={f10} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      <SvgText x={w - 14} y={headH * 0.68} textAnchor="end" fontSize={f7} fill="rgba(255,255,255,0.85)">{`Reg: ${doctor.registrationNumber || 'MCI-18492'}`}</SvgText>

      {/* Patient info bar */}
      <Rect x={10} y={patBoxY} width={w - 20} height={patBoxH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1} rx={4} />
      <SvgText x={16} y={patBoxY + 17} fontSize={f7} fill="#94a3b8">PATIENT:</SvgText>
      <SvgText x={60} y={patBoxY + 17} fontSize={f10} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={w * 0.55} y={patBoxY + 17} fontSize={f8} fill="#64748b">{`Age: ${patient.age || '—'}  Sex: ${patient.sex || '—'}`}</SvgText>
      <SvgText x={w - 16} y={patBoxY + 17} textAnchor="end" fontSize={f7} fill="#64748b">{`Date: ${patient.date || new Date().toLocaleDateString('en-IN')}`}</SvgText>

      {/* Prominent 6-card VITALS Box */}
      <Rect x={10} y={vitalsBoxY} width={w - 20} height={vitalsH} fill="#ffffff" stroke={primaryColor} strokeWidth={1.5} rx={4} />
      <Rect x={10} y={vitalsBoxY} width={w - 20} height={16} fill={primaryColor} rx={3} />
      <SvgText x={16} y={vitalsBoxY + 11} fontSize={f7} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>❤️  RECORDED VITALS & CARDIAC PARAMETERS</SvgText>

      {/* Row 1 of Vitals: BP, HR, SpO2 */}
      <Rect x={10} y={vitalsBoxY + 16} width={cardW} height={cardH} fill={accentColor + '10'} stroke={primaryColor + '20'} strokeWidth={0.5} />
      <SvgText x={14} y={vitalsBoxY + 25} fontSize={f6} fontWeight="bold" fill={primaryColor}>BLOOD PRESSURE (mmHg)</SvgText>
      <SvgText x={14} y={vitalsBoxY + 36} fontSize={f8} fontWeight="bold" fill="#0f172a">{patient.bp || '120/80'}</SvgText>

      <Rect x={10 + cardW} y={vitalsBoxY + 16} width={cardW} height={cardH} fill={primaryColor + '08'} stroke={primaryColor + '20'} strokeWidth={0.5} />
      <SvgText x={14 + cardW} y={vitalsBoxY + 25} fontSize={f6} fontWeight="bold" fill={primaryColor}>HEART RATE (bpm)</SvgText>
      <SvgText x={14 + cardW} y={vitalsBoxY + 36} fontSize={f8} fontWeight="bold" fill="#0f172a">{patient.pulse || '74'}</SvgText>

      <Rect x={10 + cardW * 2} y={vitalsBoxY + 16} width={cardW} height={cardH} fill={accentColor + '10'} stroke={primaryColor + '20'} strokeWidth={0.5} />
      <SvgText x={14 + cardW * 2} y={vitalsBoxY + 25} fontSize={f6} fontWeight="bold" fill={primaryColor}>SpO₂ (%)</SvgText>
      <SvgText x={14 + cardW * 2} y={vitalsBoxY + 36} fontSize={f8} fontWeight="bold" fill="#0f172a">{patient.spo2 ? (patient.spo2.includes('%') ? patient.spo2 : `${patient.spo2}%`) : '99%'}</SvgText>

      {/* Row 2 of Vitals: Temp, Weight, RR */}
      <Rect x={10} y={vitalsBoxY + 16 + cardH} width={cardW} height={cardH} fill={primaryColor + '08'} stroke={primaryColor + '20'} strokeWidth={0.5} />
      <SvgText x={14} y={vitalsBoxY + 25 + cardH} fontSize={f6} fontWeight="bold" fill={primaryColor}>TEMPERATURE (°F)</SvgText>
      <SvgText x={14} y={vitalsBoxY + 36 + cardH} fontSize={f8} fontWeight="bold" fill="#0f172a">{patient.temp ? (patient.temp.includes('°') ? patient.temp : `${patient.temp}°F`) : '98.4°F'}</SvgText>

      <Rect x={10 + cardW} y={vitalsBoxY + 16 + cardH} width={cardW} height={cardH} fill={accentColor + '10'} stroke={primaryColor + '20'} strokeWidth={0.5} />
      <SvgText x={14 + cardW} y={vitalsBoxY + 25 + cardH} fontSize={f6} fontWeight="bold" fill={primaryColor}>WEIGHT (kg)</SvgText>
      <SvgText x={14 + cardW} y={vitalsBoxY + 36 + cardH} fontSize={f8} fontWeight="bold" fill="#0f172a">{patient.weight ? (patient.weight.includes('kg') ? patient.weight : `${patient.weight} kg`) : '68 kg'}</SvgText>

      <Rect x={10 + cardW * 2} y={vitalsBoxY + 16 + cardH} width={cardW} height={cardH} fill={primaryColor + '08'} stroke={primaryColor + '20'} strokeWidth={0.5} />
      <SvgText x={14 + cardW * 2} y={vitalsBoxY + 25 + cardH} fontSize={f6} fontWeight="bold" fill={primaryColor}>RESP. RATE (/min)</SvgText>
      <SvgText x={14 + cardW * 2} y={vitalsBoxY + 36 + cardH} fontSize={f8} fontWeight="bold" fill="#0f172a">16</SvgText>

      {/* Cardiac Diagnosis Bar */}
      <Rect x={10} y={diagY} width={w - 20} height={diagH} fill={accentColor + '12'} stroke={accentColor + '40'} strokeWidth={1} rx={3} />
      <Rect x={10} y={diagY} width={4} height={diagH} fill={primaryColor} rx={1} />
      <SvgText x={18} y={diagY + 14} fontSize={f7} fontWeight="bold" fill={primaryColor}>DIAGNOSIS:</SvgText>
      <SvgText x={75} y={diagY + 14} fontSize={f10} fontWeight="bold" fill="#0f172a">{diagnosisClean}</SvgText>

      {/* Rx Header */}
      <SvgText x={12} y={rxY + 8} fontSize={18} fontFamily="serif" fontWeight="bold" fill={primaryColor}>℞</SvgText>
      <SvgText x={36} y={rxY + 5} fontSize={f8} fontWeight="bold" fill={primaryColor} letterSpacing={0.5}>PRESCRIPTION MEDICINES</SvgText>

      {/* 6-Column Table Header */}
      <Rect x={10} y={tableY} width={w - 20} height={thH} fill={primaryColor} rx={3} />
      <SvgText x={15} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">#</SvgText>
      <SvgText x={30} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Medicine (Strength)</SvgText>
      <SvgText x={w * 0.44} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Dosage</SvgText>
      <SvgText x={w * 0.58} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Frequency</SvgText>
      <SvgText x={w * 0.74} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Duration</SvgText>
      <SvgText x={w * 0.88} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Qty</SvgText>

      {/* Ruled lines */}
      {renderSvgWritingLines(tableY + thH + 5, h - 55, lineCount, 10, w - 10)}

      {/* Cardiac Investigations checklist */}
      <Rect x={10} y={h - 48} width={w - 20} height={20} fill="#ffffff" stroke={primaryColor + '25'} strokeWidth={0.8} rx={3} />
      <SvgText x={14} y={h - 35} fontSize={f6} fontWeight="bold" fill={primaryColor}>INVESTIGATIONS:</SvgText>
      <SvgText x={90} y={h - 35} fontSize={f6} fill="#475569">☐ ECG   ☐ ECHO   ☐ TMT   ☐ Holter   ☐ Lipid Profile   ☐ HbA1c</SvgText>

      {/* Footer */}
      <Line x1={10} y1={h - 24} x2={w - 10} y2={h - 24} stroke="#e2e8f0" strokeWidth={0.8} />
      <SvgText x={14} y={h - 10} fontSize={f6} fill="#94a3b8">Follow-up: _________________</SvgText>
      <Line x1={w - 110} y1={h - 14} x2={w - 14} y2={h - 14} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 62} y={h - 6} textAnchor="middle" fontSize={f6} fill="#94a3b8">Cardiologist Signature</SvgText>
    </>
  )
}

// ── 7. Multi-Section Boxed Overlay ────────────────────────────────────────────
function OverlayBoxed({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#0c4a6e'
  const accentColor = template.styles?.accentColor || '#38bdf8'

  const headH = Math.round(h * 0.11)
  const pad = 10
  const boxW2 = (w - pad * 2 - 8) / 2

  // Box 1: Patient Info & Date/Ref
  const row1Y = headH + 8
  const row1H = 38

  // Box 2: Chief Complaint
  const ccY = row1Y + row1H + 6
  const ccH = 26

  // Box 3: Diagnosis
  const diagY = ccY + ccH + 6
  const diagH = 26

  // Box 4: Rx Table
  const rxY = diagY + diagH + 6
  const rxThH = 18
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 32) || 'Patient complaint and clinical history...'
  const diagnosisClean = safeTruncate(patient.diagnosis, 32) || 'Clinical diagnosis...'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Family & Child Health Clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const f14 = Math.max(12, Math.round(w * 0.038))
  const f10 = Math.max(9, Math.round(w * 0.026))
  const f8 = Math.max(7, Math.round(w * 0.021))
  const f7 = Math.max(6.5, Math.round(w * 0.018))
  const f6 = Math.max(5.5, Math.round(w * 0.016))

  return (
    <>
      {/* Deep Blue Header */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={14} y={headH * 0.38} fontSize={f14} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={14} y={headH * 0.68} fontSize={f7} fill={accentColor}>{`${doctor.qualification || 'MBBS, MD'} · ${doctor.specialization || 'Consultant'}`}</SvgText>
      <SvgText x={w - 14} y={headH * 0.38} textAnchor="end" fontSize={f10} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      <SvgText x={w - 14} y={headH * 0.68} textAnchor="end" fontSize={f7} fill="rgba(255,255,255,0.85)">{`Reg: ${doctor.registrationNumber || 'DOC-74892'}`}</SvgText>

      {/* Row 1 Left: PATIENT INFORMATION */}
      <Rect x={pad} y={row1Y} width={boxW2} height={row1H} fill="#ffffff" stroke={accentColor + '50'} strokeWidth={1} rx={4} />
      <Rect x={pad} y={row1Y} width={boxW2} height={14} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={row1Y + 10} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>PATIENT INFORMATION</SvgText>
      <SvgText x={pad + 8} y={row1Y + 24} fontSize={f10} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={pad + 8} y={row1Y + 34} fontSize={f7} fill="#64748b">{`${patient.age ? `Age: ${patient.age}` : 'Age: —'}  ·  ${patient.sex ? `Sex: ${patient.sex}` : 'Sex: —'}`}</SvgText>

      {/* Row 1 Right: DATE & REFERENCE */}
      <Rect x={pad + boxW2 + 8} y={row1Y} width={boxW2} height={row1H} fill="#ffffff" stroke={accentColor + '50'} strokeWidth={1} rx={4} />
      <Rect x={pad + boxW2 + 8} y={row1Y} width={boxW2} height={14} fill={primaryColor} rx={3} />
      <SvgText x={pad + boxW2 + 16} y={row1Y + 10} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>DATE & REFERENCE</SvgText>
      <SvgText x={pad + boxW2 + 16} y={row1Y + 24} fontSize={f8} fill="#0f172a">{`Date: ${patient.date || new Date().toLocaleDateString('en-IN')}`}</SvgText>
      <SvgText x={pad + boxW2 + 16} y={row1Y + 34} fontSize={f7} fill="#64748b">{`Ref ID: ${doctor.registrationNumber || 'OPD-8821'}`}</SvgText>

      {/* Box 2: CHIEF COMPLAINT */}
      <Rect x={pad} y={ccY} width={w - pad * 2} height={ccH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1} rx={4} />
      <Rect x={pad} y={ccY} width={w - pad * 2} height={13} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={ccY + 9} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>CHIEF COMPLAINT & HISTORY</SvgText>
      <SvgText x={pad + 8} y={ccY + 22} fontSize={f7} fill="#334155">{complaintClean}</SvgText>

      {/* Box 3: DIAGNOSIS */}
      <Rect x={pad} y={diagY} width={w - pad * 2} height={diagH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1} rx={4} />
      <Rect x={pad} y={diagY} width={w - pad * 2} height={13} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={diagY + 9} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>CLINICAL DIAGNOSIS</SvgText>
      <SvgText x={pad + 8} y={diagY + 22} fontSize={f8} fontWeight="bold" fill={primaryColor}>{diagnosisClean}</SvgText>

      {/* Box 4: ℞ PRESCRIPTION with table header */}
      <Rect x={pad} y={rxY} width={w - pad * 2} height={rxThH} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={rxY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">℞ Drug</SvgText>
      <SvgText x={w * 0.46} y={rxY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Unit</SvgText>
      <SvgText x={w * 0.62} y={rxY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Frequency</SvgText>
      <SvgText x={w * 0.82} y={rxY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Duration</SvgText>

      {/* Ruled lines inside Prescription box */}
      {renderSvgWritingLines(rxY + rxThH + 5, h - 68, lineCount, pad + 2, w - pad - 2)}

      {/* Investigations & Advice Two-Column Boxes */}
      <Rect x={pad} y={h - 60} width={boxW2} height={32} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <Rect x={pad} y={h - 60} width={boxW2} height={11} fill={primaryColor + '18'} rx={2} />
      <SvgText x={pad + 6} y={h - 52} fontSize={f6} fontWeight="bold" fill={primaryColor}>INVESTIGATIONS</SvgText>
      <SvgText x={pad + 6} y={h - 38} fontSize={f6} fill="#64748b">Lab tests / Imaging: _______</SvgText>

      <Rect x={pad + boxW2 + 8} y={h - 60} width={boxW2} height={32} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <Rect x={pad + boxW2 + 8} y={h - 60} width={boxW2} height={11} fill={primaryColor + '18'} rx={2} />
      <SvgText x={pad + boxW2 + 14} y={h - 52} fontSize={f6} fontWeight="bold" fill={primaryColor}>ADVICE & INSTRUCTIONS</SvgText>
      <SvgText x={pad + boxW2 + 14} y={h - 38} fontSize={f6} fill="#64748b">Diet / Precaution: _________</SvgText>

      {/* Footer */}
      <Line x1={pad} y1={h - 22} x2={w - pad} y2={h - 22} stroke="#cbd5e1" strokeWidth={0.8} />
      <SvgText x={pad} y={h - 10} fontSize={f6} fill="#94a3b8">Review on: ________________</SvgText>
      <Line x1={w - 110} y1={h - 14} x2={w - pad} y2={h - 14} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 60} y={h - 6} textAnchor="middle" fontSize={f6} fill="#94a3b8">Doctor's Signature</SvgText>
    </>
  )
}

// ── 8. Compartmentalized Grid Overlay ─────────────────────────────────────────
function OverlayGrid({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#92400e'
  const accentColor = template.styles?.accentColor || '#f59e0b'
  const bgColor = template.styles?.bgColor || '#fffbeb'

  const headH = Math.round(h * 0.11)
  const patH = 34
  const ccH = 20
  const diagH = 20
  const rxY = headH + patH + ccH + diagH + 8
  const thH = 18
  const tableY = rxY + 12
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 32) || 'General consultation & clinical history...'
  const diagnosisClean = safeTruncate(patient.diagnosis, 32) || 'Primary clinical diagnosis...'
  const clinicClean = safeTruncate(doctor.clinicName, 26) || 'Medical Centre'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 26)

  const f14 = Math.max(12, Math.round(w * 0.038))
  const f10 = Math.max(9, Math.round(w * 0.026))
  const f8 = Math.max(7, Math.round(w * 0.021))
  const f7 = Math.max(6.5, Math.round(w * 0.018))
  const f6 = Math.max(5.5, Math.round(w * 0.016))

  const colW = w / 3

  return (
    <>
      {/* Doctor Header with Corporate Split */}
      <Rect x={0} y={0} width={w * 0.58} height={headH} fill={primaryColor} />
      <SvgText x={12} y={headH * 0.38} fontSize={f14} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={12} y={headH * 0.65} fontSize={f7} fill={accentColor}>{`${doctor.qualification || 'MBBS, MD'} · Consultant`}</SvgText>
      <SvgText x={12} y={headH * 0.86} fontSize={f6} fill="rgba(255,255,255,0.75)">{`Reg: ${doctor.registrationNumber || 'PMC-49102'}`}</SvgText>

      <Rect x={w * 0.58} y={0} width={w * 0.42} height={headH} fill="#ffffff" />
      <Line x1={w * 0.58} y1={0} x2={w * 0.58} y2={headH} stroke={primaryColor} strokeWidth={2} />
      <SvgText x={w - 12} y={headH * 0.38} textAnchor="end" fontSize={f10} fontWeight="bold" fill={primaryColor}>{clinicClean}</SvgText>
      <SvgText x={w - 12} y={headH * 0.65} textAnchor="end" fontSize={f6} fill="#64748b">{doctor.clinicAddress ? safeTruncate(doctor.clinicAddress, 24) : 'Clinic Center'}</SvgText>
      <SvgText x={w - 12} y={headH * 0.86} textAnchor="end" fontSize={f6} fill="#64748b">{`☎ ${doctor.phone || 'Contact Info'}`}</SvgText>

      {/* 3-Column Patient Bar */}
      <Rect x={0} y={headH} width={w} height={patH} fill={bgColor} />
      <Line x1={0} y1={headH} x2={w} y2={headH} stroke={primaryColor} strokeWidth={2} />
      <Line x1={colW} y1={headH} x2={colW} y2={headH + patH} stroke={primaryColor + '40'} strokeWidth={1} />
      <Line x1={colW * 2} y1={headH} x2={colW * 2} y2={headH + patH} stroke={primaryColor + '40'} strokeWidth={1} />
      <Line x1={0} y1={headH + patH} x2={w} y2={headH + patH} stroke={primaryColor} strokeWidth={2} />

      <SvgText x={10} y={headH + 12} fontSize={f6} fill="#94a3b8" letterSpacing={0.5}>PATIENT NAME</SvgText>
      <SvgText x={10} y={headH + 26} fontSize={f10} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>

      <SvgText x={colW + 10} y={headH + 12} fontSize={f6} fill="#94a3b8" letterSpacing={0.5}>AGE / SEX</SvgText>
      <SvgText x={colW + 10} y={headH + 26} fontSize={f8} fontWeight="bold" fill="#0f172a">{`${patient.age ? `${patient.age} yrs` : '—'} / ${patient.sex || '—'}`}</SvgText>

      <SvgText x={colW * 2 + 10} y={headH + 12} fontSize={f6} fill="#94a3b8" letterSpacing={0.5}>DATE</SvgText>
      <SvgText x={colW * 2 + 10} y={headH + 26} fontSize={f8} fontWeight="bold" fill="#0f172a">{patient.date || new Date().toLocaleDateString('en-IN')}</SvgText>

      {/* Chief Complaint Band */}
      <Rect x={0} y={headH + patH} width={w} height={ccH} fill={primaryColor + '08'} />
      <Line x1={0} y1={headH + patH + ccH} x2={w} y2={headH + patH + ccH} stroke={primaryColor + '30'} strokeWidth={0.8} />
      <SvgText x={10} y={headH + patH + 14} fontSize={f6} fontWeight="bold" fill={primaryColor} letterSpacing={0.5}>CHIEF COMPLAINT:</SvgText>
      <SvgText x={110} y={headH + patH + 14} fontSize={f7} fill="#374151">{complaintClean}</SvgText>

      {/* Diagnosis Band */}
      <Rect x={0} y={headH + patH + ccH} width={w} height={diagH} fill={primaryColor} />
      <SvgText x={10} y={headH + patH + ccH + 14} fontSize={f7} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>DIAGNOSIS:</SvgText>
      <SvgText x={80} y={headH + patH + ccH + 14} fontSize={f8} fontWeight="bold" fill="#ffffff">{diagnosisClean}</SvgText>

      {/* Rx Header */}
      <SvgText x={10} y={rxY + 8} fontSize={16} fontFamily="serif" fontWeight="bold" fill={primaryColor}>℞</SvgText>
      <Line x1={32} y1={rxY + 4} x2={w - 10} y2={rxY + 4} stroke={primaryColor + '30'} strokeWidth={1.5} />

      {/* 5-Column Grid Table Header */}
      <Rect x={10} y={tableY} width={w - 20} height={thH} fill={accentColor} rx={2} />
      <SvgText x={16} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Medicine / Drugs</SvgText>
      <SvgText x={w * 0.44} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Unit</SvgText>
      <SvgText x={w * 0.58} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Frequency</SvgText>
      <SvgText x={w * 0.74} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Duration</SvgText>
      <SvgText x={w * 0.88} y={tableY + 12} fontSize={f7} fontWeight="bold" fill="#ffffff">Qty</SvgText>

      {/* Ruled lines */}
      {renderSvgWritingLines(tableY + thH + 5, h - 60, lineCount, 10, w - 10)}

      {/* 2-Column Footer: Advice | Follow-up + Signature */}
      <Rect x={10} y={h - 52} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={accentColor + '50'} strokeWidth={0.8} rx={3} />
      <SvgText x={16} y={h - 42} fontSize={f6} fontWeight="bold" fill={accentColor} letterSpacing={0.5}>ADVICE & TESTS</SvgText>
      <SvgText x={16} y={h - 30} fontSize={f6} fill="#64748b">Diet & precautions: _________</SvgText>

      <Rect x={14 + (w - 28) * 0.5} y={h - 52} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={primaryColor + '40'} strokeWidth={0.8} rx={3} />
      <SvgText x={20 + (w - 28) * 0.5} y={h - 42} fontSize={f6} fontWeight="bold" fill={primaryColor} letterSpacing={0.5}>FOLLOW-UP & SIGNATURE</SvgText>
      <SvgText x={20 + (w - 28) * 0.5} y={h - 30} fontSize={f6} fill="#64748b">Review: ___________________</SvgText>

      {/* Bottom band */}
      <Rect x={0} y={h - 14} width={w} height={14} fill={primaryColor} />
      <SvgText x={10} y={h - 4} fontSize={f6} fill={accentColor}>{clinicClean}</SvgText>
      <SvgText x={w - 10} y={h - 4} textAnchor="end" fontSize={f6} fill={accentColor}>prescriptionmaker.in</SvgText>
    </>
  )
}

// ── 9. Detailed Drug Chart Overlay ────────────────────────────────────────────
function OverlayDetailedChart({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#065f46'
  const accentColor = template.styles?.accentColor || '#10b981'
  const bgColor = template.styles?.bgColor || '#f0fdf4'

  const headH = Math.round(h * 0.11)
  const pad = 10
  const patRowY = headH + 8
  const patRowH = 38
  const patW = Math.round((w - pad * 2 - 8) * 0.62)
  const diagW = (w - pad * 2 - 8) - patW

  const rxY = patRowY + patRowH + 8
  const thH = 20
  const tableY = rxY + 12
  const lineCount = 11

  const patientNameClean = safeTruncate(patient.patientName, 22) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 22) || 'Clinical Diagnosis'
  const clinicClean = safeTruncate(doctor.clinicName, 28) || 'Specialty Medical Center'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor Name', 28)

  const f14 = Math.max(12, Math.round(w * 0.038))
  const f10 = Math.max(9, Math.round(w * 0.026))
  const f9 = Math.max(8, Math.round(w * 0.024))
  const f8 = Math.max(7, Math.round(w * 0.021))
  const f7 = Math.max(6.5, Math.round(w * 0.018))
  const f6 = Math.max(5.5, Math.round(w * 0.016))

  return (
    <>
      {/* Emerald Green Header */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={14} y={headH * 0.38} fontSize={f14} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={14} y={headH * 0.68} fontSize={f7} fill={accentColor}>{`${doctor.qualification || 'MBBS, MD'} · Clinical Specialist`}</SvgText>
      <SvgText x={w - 14} y={headH * 0.38} textAnchor="end" fontSize={f10} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      <SvgText x={w - 14} y={headH * 0.68} textAnchor="end" fontSize={f6} fill="rgba(255,255,255,0.85)">{`☎ ${doctor.phone || 'Clinic Helpline'} · Reg: ${doctor.registrationNumber || 'MED-4819'}`}</SvgText>

      {/* Patient Card (Left) */}
      <Rect x={pad} y={patRowY} width={patW} height={patRowH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1} rx={4} />
      <SvgText x={pad + 8} y={patRowY + 12} fontSize={f6} fill="#94a3b8" letterSpacing={0.5}>PATIENT</SvgText>
      <SvgText x={pad + 8} y={patRowY + 24} fontSize={f10} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={pad + 8} y={patRowY + 34} fontSize={f7} fill="#64748b">{`${patient.age ? `Age: ${patient.age}y` : 'Age: —'} · ${patient.sex || '—'} · Date: ${patient.date || new Date().toLocaleDateString('en-IN')}`}</SvgText>

      {/* Diagnosis Card (Right) */}
      <Rect x={pad + patW + 8} y={patRowY} width={diagW} height={patRowH} fill={accentColor + '15'} stroke={accentColor + '40'} strokeWidth={1} rx={4} />
      <SvgText x={pad + patW + 16} y={patRowY + 12} fontSize={f6} fill={primaryColor} fontWeight="bold" letterSpacing={0.5}>DIAGNOSIS</SvgText>
      <SvgText x={pad + patW + 16} y={patRowY + 26} fontSize={f9} fontWeight="bold" fill={primaryColor}>{diagnosisClean}</SvgText>

      {/* Rx Heading with accent underline */}
      <SvgText x={10} y={rxY + 8} fontSize={16} fontFamily="serif" fontWeight="bold" fill={primaryColor}>℞</SvgText>
      <Line x1={30} y1={rxY + 4} x2={w - 10} y2={rxY + 4} stroke={primaryColor + '30'} strokeWidth={1.5} />

      {/* 6-Column Detailed Drug Schedule Header */}
      <Rect x={10} y={tableY} width={w - 20} height={thH} fill={primaryColor} rx={3} />
      <SvgText x={14} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">#</SvgText>
      <SvgText x={28} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Medicine Name & Strength</SvgText>
      <SvgText x={w * 0.44} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Route</SvgText>
      <SvgText x={w * 0.58} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Timing</SvgText>
      <SvgText x={w * 0.73} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Frequency</SvgText>
      <SvgText x={w * 0.87} y={tableY + 13} fontSize={f7} fontWeight="bold" fill="#ffffff">Duration</SvgText>

      {/* Ruled lines */}
      {renderSvgWritingLines(tableY + thH + 5, h - 58, lineCount, 10, w - 10)}

      {/* Lab Investigations & Advice Box */}
      <Rect x={10} y={h - 52} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={accentColor + '40'} strokeWidth={0.8} rx={3} />
      <SvgText x={16} y={h - 42} fontSize={f6} fontWeight="bold" fill={primaryColor}>LAB INVESTIGATIONS</SvgText>
      <SvgText x={16} y={h - 30} fontSize={f6} fill="#64748b">CBC, LFT, KFT, Urine R/M: ______</SvgText>

      <Rect x={14 + (w - 28) * 0.5} y={h - 52} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <SvgText x={20 + (w - 28) * 0.5} y={h - 42} fontSize={f6} fontWeight="bold" fill={primaryColor}>SPECIAL INSTRUCTIONS</SvgText>
      <SvgText x={20 + (w - 28) * 0.5} y={h - 30} fontSize={f6} fill="#64748b">Take after meals with water</SvgText>

      {/* Footer */}
      <Line x1={10} y1={h - 16} x2={w - 10} y2={h - 16} stroke="#cbd5e1" strokeWidth={0.8} />
      <SvgText x={14} y={h - 6} fontSize={f6} fill="#94a3b8">Follow-up: ______________</SvgText>
      <Line x1={w - 110} y1={h - 10} x2={w - 14} y2={h - 10} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 62} y={h - 4} textAnchor="middle" fontSize={f6} fill="#94a3b8">Doctor's Signature</SvgText>
    </>
  )
}

// ── 10. Classic Letterhead Overlay (Default) ──────────────────────────────────
function OverlayClassicLetterhead({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const primaryColor = template.styles?.primaryColor || '#102A56'
  const accentColor = template.styles?.accentColor || '#155EEF'

  const headH = Math.round(h * 0.14)
  const patY = headH + 12
  const patH = 26
  const diagY = patY + patH + 4
  const diagH = 20
  const rxY = diagY + diagH + 10
  const lineCount = 14

  const patientNameClean = safeTruncate(patient.patientName, 26) || '___________________________'
  const complaintClean = safeTruncate(patient.chiefComplaint, 24) || '—'
  const diagnosisClean = safeTruncate(patient.diagnosis, 28) || 'Clinical Diagnosis'
  const clinicClean = safeTruncate(doctor.clinicName, 34) || 'CITY MEDICAL CLINIC'
  const doctorClean = safeTruncate(doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Dr. Doctor Name', 30)

  const f16 = Math.max(13, Math.round(w * 0.042))
  const f11 = Math.max(10, Math.round(w * 0.028))
  const f8 = Math.max(7.5, Math.round(w * 0.021))
  const f7 = Math.max(6.5, Math.round(w * 0.018))

  return (
    <>
      {/* Centered Letterhead Masthead */}
      <SvgText x={w / 2} y={headH * 0.32} textAnchor="middle" fontSize={f16} fontWeight="bold" fill={primaryColor} letterSpacing={1.2}>
        {clinicClean.toUpperCase()}
      </SvgText>
      <SvgText x={w / 2} y={headH * 0.58} textAnchor="middle" fontSize={f11} fontWeight="bold" fill="#334155">
        {doctorClean}
      </SvgText>
      <SvgText x={w / 2} y={headH * 0.78} textAnchor="middle" fontSize={f8} fill="#64748b">
        {[doctor.qualification, doctor.specialization].filter(Boolean).join(', ') || 'Consultant Physician & Surgeon'}
      </SvgText>
      <SvgText x={w / 2} y={headH * 0.94} textAnchor="middle" fontSize={f7} fill="#94a3b8">
        {`☎ ${doctor.phone || 'Clinic Contact'} · Reg. No: ${doctor.registrationNumber || 'DOC-REG-001'}${doctor.clinicAddress ? ` · ${safeTruncate(doctor.clinicAddress, 26)}` : ''}`}
      </SvgText>

      {/* Double Letterhead Border */}
      <Line x1={12} y1={headH + 4} x2={w - 12} y2={headH + 4} stroke={primaryColor} strokeWidth={2.2} />
      <Line x1={12} y1={headH + 8} x2={w - 12} y2={headH + 8} stroke={primaryColor} strokeWidth={0.8} />

      {/* Patient + Date Row */}
      <SvgText x={14} y={patY + 16} fontSize={f8} fill="#94a3b8">Patient:</SvgText>
      <SvgText x={58} y={patY + 16} fontSize={f11} fontWeight="bold" fill="#1e293b">{patientNameClean}</SvgText>
      <Line x1={58} y1={patY + 19} x2={Math.min(w * 0.56, 58 + 140)} y2={patY + 19} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="2,2" />

      <SvgText x={w * 0.60} y={patY + 16} fontSize={f8} fill="#64748b">{`Age: ${patient.age || '—'}${patient.sex ? ` / ${patient.sex}` : ''}`}</SvgText>
      <SvgText x={w - 14} y={patY + 16} textAnchor="end" fontSize={f8} fill="#64748b">{`Date: ${patient.date || new Date().toLocaleDateString('en-IN')}`}</SvgText>

      <Line x1={14} y1={patY + patH} x2={w - 14} y2={patY + patH} stroke="#e2e8f0" strokeWidth={1} />

      {/* Chief Complaint / Diagnosis Row */}
      <SvgText x={14} y={diagY + 14} fontSize={f7} fill="#94a3b8">Chief Complaint / Diagnosis:</SvgText>
      <SvgText x={140} y={diagY + 14} fontSize={f8} fontWeight="bold" fill="#1e293b">{`${diagnosisClean}${complaintClean !== '—' ? ` · ${complaintClean}` : ''}`}</SvgText>

      {/* Large Italic Serif ℞ */}
      <SvgText x={14} y={rxY + 20} fontSize={28} fontFamily="serif" fontStyle="italic" fontWeight="bold" fill={primaryColor}>℞</SvgText>

      {/* Numbered Dotted Medicine Lines */}
      {renderSvgWritingLines(rxY + 28, h - 55, lineCount, 14, w - 14)}

      {/* Advice & Lab Notice */}
      <SvgText x={14} y={h - 44} fontSize={f7} fill="#94a3b8">Advice: ________________________________</SvgText>
      <SvgText x={w * 0.55} y={h - 44} fontSize={f7} fill="#94a3b8">Investigations: ____________________</SvgText>

      {/* Classic Signature Block */}
      <Line x1={14} y1={h - 32} x2={w - 14} y2={h - 32} stroke="#e2e8f0" strokeWidth={0.8} />
      <SvgText x={14} y={h - 18} fontSize={f7} fill="#64748b">Follow-up on: ________________</SvgText>
      <Line x1={w - 110} y1={h - 20} x2={w - 14} y2={h - 20} stroke="#475569" strokeWidth={1} />
      <SvgText x={w - 62} y={h - 8} textAnchor="middle" fontSize={f7} fill="#64748b">Doctor's Signature</SvgText>
      <SvgText x={14} y={h - 8} fontSize={Math.max(5.5, Math.round(w * 0.016))} fill="#cbd5e1" letterSpacing={0.5}>PrescriptionMaker.in · Classic Letterhead</SvgText>
    </>
  )
}

/**
 * Master Prescription Template Overlay for Tablet Mode.
 * Correctly delegates to the matching template layout so the on-screen canvas
 * precisely mirrors the selected template!
 */
function PrescriptionTemplateOverlay({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template?: SelectedTemplate | Template | null
}) {
  const fullTemplate = MOBILE_TEMPLATES.find(t => t.id === template?.id) || MOBILE_TEMPLATES[0]

  switch (fullTemplate.id) {
    case 'two-column-sidebar':
      return <OverlayTwoColumnSidebar w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'hospital-opd':
      return <OverlayHospitalOPD w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'soap-clinical':
      return <OverlaySOAP w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'minimal-print-ruled':
      return <OverlayMinimal w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'bilingual-indian':
      return <OverlayBilingual w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'vitals-first':
      return <OverlayVitalsFirst w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'multi-section-boxed':
      return <OverlayBoxed w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'compartmentalized-grid':
      return <OverlayGrid w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'detailed-drug-chart':
      return <OverlayDetailedChart w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'classic-letterhead':
    default:
      return <OverlayClassicLetterhead w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
  }
}

// ── STEP 1: Form ──────────────────────────────────────────────────────────────
function FormStep({
  doctor, setDoctor, patient, setPatient, onNext,
  onOpenTestLab, onQuickFillCurrent, selectedTemplateName, profileLoaded,
}: {
  doctor: DoctorForm; setDoctor: (d: DoctorForm) => void
  patient: PatientForm; setPatient: (p: PatientForm) => void
  onNext: () => void
  onOpenTestLab?: () => void
  onQuickFillCurrent?: () => void
  selectedTemplateName?: string
  profileLoaded?: boolean
}) {
  const upD = (k: keyof DoctorForm, v: string) => setDoctor({ ...doctor, [k]: v })
  const upP = (k: keyof PatientForm, v: string) => setPatient({ ...patient, [k]: v })
  const hasDoctor = Boolean(doctor.doctorName?.trim())
  // Collapse doctor card when doctor info is already present
  const [doctorExpanded, setDoctorExpanded] = useState(!hasDoctor)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={fS.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Auto-Fill Test Bar ── */}
        <View style={fS.testBar}>
          <View style={fS.testBarHead}>
            <View style={fS.testBadge}>
              <Ionicons name="flask" size={13} color="#155EEF" />
              <Text style={fS.testBadgeText}>⚡ Fast Testing Presets</Text>
            </View>
            <Pressable
              style={fS.clearBtn}
              onPress={() => {
                setDoctor({ doctorName: '', qualification: '', clinicName: '', clinicAddress: '', phone: '' })
                setPatient({
                  patientName: '', age: '', sex: 'Male',
                  date: new Date().toLocaleDateString('en-IN'),
                  chiefComplaint: '', diagnosis: '',
                  bp: '', pulse: '', temp: '', spo2: '', weight: '', height: '', opdRef: '',
                })
              }}
            >
              <Ionicons name="trash-outline" size={13} color="#64748b" />
              <Text style={fS.clearBtnText}>Clear</Text>
            </Pressable>
          </View>
          <View style={fS.testBtnRow}>
            {onQuickFillCurrent && (
              <Pressable style={fS.quickTestBtn} onPress={onQuickFillCurrent}>
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={fS.quickTestBtnText}>Auto-Fill {selectedTemplateName || 'Current'}</Text>
              </Pressable>
            )}
            {onOpenTestLab && (
              <Pressable style={fS.allPresetsBtn} onPress={onOpenTestLab}>
                <Ionicons name="list" size={14} color="#155EEF" />
                <Text style={fS.allPresetsBtnText}>10 Templates</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Doctor Card (Auto-filled from profile) ── */}
        <View style={fS.card}>
          <Pressable style={fS.cardHead} onPress={() => setDoctorExpanded(v => !v)}>
            <View style={[fS.cardIcon, { backgroundColor: hasDoctor ? '#16a34a15' : '#0f766e15' }]}>
              <Ionicons name={hasDoctor ? "checkmark-circle" : "person-circle-outline"} size={20} color={hasDoctor ? "#16a34a" : "#0f766e"} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={fS.cardTitle}>Doctor Information</Text>
                {hasDoctor && (
                  <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#166534' }}>✓ Saved Profile</Text>
                  </View>
                )}
              </View>
              {hasDoctor && !doctorExpanded ? (
                <Text style={[fS.cardSub, { color: '#0f766e', fontWeight: '700' }]}>
                  Dr. {doctor.doctorName} · {doctor.clinicName || doctor.qualification || 'Clinic'} — Tap to edit
                </Text>
              ) : (
                <Text style={fS.cardSub}>Appears on the prescription header</Text>
              )}
            </View>
            <Ionicons
              name={doctorExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#64748b"
            />
          </Pressable>

          {/* Profile loaded banner */}
          {doctorExpanded && (
            <View style={fS.profileBanner}>
              <Ionicons name={hasDoctor ? "checkmark-circle" : "information-circle"} size={14} color={hasDoctor ? "#0f766e" : "#0284c7"} />
              <Text style={fS.profileBannerText}>
                {hasDoctor
                  ? '✓ Auto-filled from your profile. Changes apply to this prescription only. '
                  : 'You can save your profile once in '}
              </Text>
              <Pressable onPress={() => router.push('/doctor-profile')}>
                <Text style={[fS.profileBannerText, { color: '#155EEF', fontWeight: '700', textDecorationLine: 'underline' }]}>Account Settings</Text>
              </Pressable>
              <Text style={fS.profileBannerText}>.</Text>
            </View>
          )}

          {doctorExpanded && (
            <>
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
            </>
          )}
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

        {/* ── Recorded Vitals & Clinical Measurements Card ── */}
        <View style={fS.card}>
          <View style={fS.cardHead}>
            <View style={[fS.cardIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="pulse-outline" size={20} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={fS.cardTitle}>Recorded Vitals</Text>
                <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#DBEAFE' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#1e40af' }}>Two-Column &amp; Vitals Layouts</Text>
                </View>
              </View>
              <Text style={fS.cardSub}>Fills the Recorded Vitals table &amp; OPD Ref on Two-Column Sidebar</Text>
            </View>
          </View>

          {/* Row 1: BP, Pulse, Temp */}
          <View style={fS.row}>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>BP (mmHg)</Text>
              <TextInput
                style={fS.input}
                placeholder="120/80"
                placeholderTextColor="#94a3b8"
                value={patient.bp || ''}
                onChangeText={v => upP('bp', v)}
              />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Pulse (bpm)</Text>
              <TextInput
                style={fS.input}
                placeholder="72"
                placeholderTextColor="#94a3b8"
                value={patient.pulse || ''}
                onChangeText={v => upP('pulse', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Temp (°F)</Text>
              <TextInput
                style={fS.input}
                placeholder="98.6"
                placeholderTextColor="#94a3b8"
                value={patient.temp || ''}
                onChangeText={v => upP('temp', v)}
              />
            </View>
          </View>

          {/* Row 2: SpO2, Weight, Height */}
          <View style={fS.row}>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>SpO₂ (%)</Text>
              <TextInput
                style={fS.input}
                placeholder="99"
                placeholderTextColor="#94a3b8"
                value={patient.spo2 || ''}
                onChangeText={v => upP('spo2', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Weight (kg)</Text>
              <TextInput
                style={fS.input}
                placeholder="68"
                placeholderTextColor="#94a3b8"
                value={patient.weight || ''}
                onChangeText={v => upP('weight', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>Height (cm)</Text>
              <TextInput
                style={fS.input}
                placeholder="172"
                placeholderTextColor="#94a3b8"
                value={patient.height || ''}
                onChangeText={v => upP('height', v)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Row 3: OPD Ref Number */}
          <View style={fS.row}>
            <View style={[fS.fg, { flex: 1 }]}>
              <Text style={fS.label}>OPD Ref / Slip No.</Text>
              <TextInput
                style={fS.input}
                placeholder="e.g. OPD-1048"
                placeholderTextColor="#94a3b8"
                value={patient.opdRef || ''}
                onChangeText={v => upP('opdRef', v)}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* ── Next Button ── */}
        <Pressable
          style={[fS.nextBtn, (!doctor.doctorName.trim() || !patient.patientName.trim()) && { opacity: 0.6 }]}
          onPress={() => {
            if (!doctor.doctorName.trim()) {
              setDoctorExpanded(true)
              Alert.alert('Doctor Name Required', 'Please enter your Doctor Name or set up your profile in Account Settings.')
              return
            }
            if (!patient.patientName.trim()) {
              Alert.alert('Patient Name Required', 'Please enter the patient name before proceeding.')
              return
            }
            onNext()
          }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={fS.nextBtnText}>Write Prescription →</Text>
        </Pressable>

        {(!doctor.doctorName.trim() || !patient.patientName.trim()) && (
          <Text style={fS.reqNote}>* Doctor Name and Patient Name are required.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const fS = StyleSheet.create({
  scroll: { padding: 14, gap: 12, paddingBottom: 28 },
  testBar: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, gap: 10,
    borderWidth: 1.5, borderColor: '#BFDBFE',
    shadowColor: '#155EEF', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  testBarHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  testBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  testBadgeText: { fontSize: 12, fontWeight: '800', color: '#155EEF' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6 },
  clearBtnText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  testBtnRow: { flexDirection: 'row', gap: 8 },
  quickTestBtn: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#155EEF', paddingVertical: 10, borderRadius: 10,
    shadowColor: '#155EEF', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  quickTestBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  allPresetsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#155EEF',
    paddingVertical: 10, borderRadius: 10,
  },
  allPresetsBtnText: { color: '#155EEF', fontSize: 12, fontWeight: '800' },
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
  profileBanner: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2,
    backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  profileBannerText: { fontSize: 11, color: '#166534', fontWeight: '500' },
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
  const SUB_BAR_H = 46
  const BOTTOM_INSET = Platform.OS === 'ios' ? 40 : 16

  // Standard A4 aspect ratio (210mm x 297mm = 794 / 1123 = 0.70703)
  const availW = Math.max(280, SW - SIDEBAR_W - 16)
  const availH = Math.max(380, SH - TOP_BAR_H - SUB_BAR_H - BOTTOM_INSET)
  const A4_ASPECT = 794 / 1123

  let CW = availW
  let CH = Math.round(CW / A4_ASPECT)
  if (CH > availH) {
    CH = availH
    CW = Math.round(CH * A4_ASPECT)
  }

  const [paths, setPaths] = useState<DrawnPath[]>([])
  const [livePath, setLivePath] = useState<DrawnPath | null>(null)
  const [saving, setSaving] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
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

  const handleExport = () => {
    if (!paths.length) { 
      if (Platform.OS === 'web') window.alert('Please write/draw medicines on the canvas first!'); 
      else Alert.alert('Empty Canvas', 'Write medicines on the canvas first.'); 
      return 
    }
    setShowExportModal(true)
  }

  const handleExportAction = async (action: 'download' | 'print' | 'share') => {
    setShowExportModal(false)
    setSaving(true)
    try {
      const fullTemplate = MOBILE_TEMPLATES.find(t => t.id === selectedTemplate?.id) || MOBILE_TEMPLATES[0]
      const html = generateTabletPrescriptionHTML({
        w: CW,
        h: CH,
        doctor,
        patient,
        template: fullTemplate,
        paths,
      })
      const patientNameClean = (patient.patientName || 'Patient').replace(/\s+/g, '_')
      const filename = `Prescription_${patientNameClean}.pdf`

      if (action === 'download') {
        await downloadTabletPrescriptionPdf({
          w: CW,
          h: CH,
          doctor,
          patient,
          template: fullTemplate,
          paths,
        }, filename)
        if (Platform.OS === 'web') {
          Alert.alert('Download Started', 'Your prescription PDF has been downloaded.')
        }
      } else if (action === 'print') {
        await printCleanPrescription({ html })
      } else if (action === 'share') {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && (navigator as any).share) {
            try {
              await (navigator as any).share({
                title: `Prescription for ${patient.patientName || 'Patient'}`,
                text: `Handwritten prescription from Dr. ${doctor.doctorName || 'Doctor'}`,
              })
            } catch (_) {}
          } else {
            await downloadPrescriptionPdf({ html, filename })
          }
        } else {
          const { uri } = await Print.printToFileAsync({ html, base64: false })
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription' })
        }
      }
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert('Export Error: ' + err.message)
      else Alert.alert('Export Error', err.message)
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

        {/* Canvas Workspace with authentic A4 paper pad aligned under toolbar */}
        <View style={{
          flex: 1,
          backgroundColor: '#0f172a08',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          paddingTop: 8,
          paddingHorizontal: 8,
          paddingBottom: 16,
        }}>
          <View
            style={{
              width: CW,
              height: CH,
              backgroundColor: '#ffffff',
              borderRadius: 4,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 14,
              elevation: 5,
            }}
            {...panResponder.panHandlers}
          >
            <Svg width={CW} height={CH} style={StyleSheet.absoluteFill} pointerEvents="none">
              <PrescriptionTemplateOverlay w={CW} h={CH} doctor={doctor} patient={patient} template={selectedTemplate} />
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
              <View style={[
                cS.hint,
                selectedTemplate?.id === 'two-column-sidebar' && { left: '28%' }
              ]}>
                <Text style={cS.hintIcon}>✍️</Text>
                <Text style={cS.hintText}>Touch and drag to write medicines here</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Export Options Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <Pressable
          style={modalStyles.overlay}
          onPress={() => setShowExportModal(false)}
        >
          <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
            <View style={modalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={modalStyles.iconCircle}>
                  <Ionicons name="document-text" size={22} color="#155EEF" />
                </View>
                <View>
                  <Text style={modalStyles.title}>Export Prescription</Text>
                  <Text style={modalStyles.subtitle}>
                    {patient.patientName ? `For ${patient.patientName}` : 'Patient Rx'} · {selectedTemplate?.name || 'Classic'}
                  </Text>
                </View>
              </View>
              <Pressable style={modalStyles.closeBtn} onPress={() => setShowExportModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>

            <Text style={modalStyles.sectionDesc}>
              Choose how you want to export your handwritten prescription:
            </Text>

            <View style={modalStyles.optionsList}>
              <Pressable
                style={[modalStyles.optionItem, { borderColor: '#155EEF', backgroundColor: '#eff6ff' }]}
                onPress={() => handleExportAction('download')}
              >
                <View style={[modalStyles.optIcon, { backgroundColor: '#155EEF' }]}>
                  <Ionicons name="download" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[modalStyles.optTitle, { color: '#102A56' }]}>Download PDF File</Text>
                  <Text style={modalStyles.optDesc}>Save clean A4 PDF file directly to device downloads</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#155EEF" />
              </Pressable>

              <Pressable
                style={modalStyles.optionItem}
                onPress={() => handleExportAction('print')}
              >
                <View style={[modalStyles.optIcon, { backgroundColor: '#0284c7' }]}>
                  <Ionicons name="print" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.optTitle}>Print Prescription</Text>
                  <Text style={modalStyles.optDesc}>Clean print preview with zero app headers or toolbars</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>

              <Pressable
                style={modalStyles.optionItem}
                onPress={() => handleExportAction('share')}
              >
                <View style={[modalStyles.optIcon, { backgroundColor: '#64748b' }]}>
                  <Ionicons name="share-social" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.optTitle}>Share Prescription</Text>
                  <Text style={modalStyles.optDesc}>Share via WhatsApp, Email, or device share sheet</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
            </View>

            <Pressable
              style={modalStyles.cancelBtn}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  const [showTestModal, setShowTestModal] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [doctor, setDoctor] = useState<DoctorForm>({
    doctorName: '', qualification: '', clinicName: '', clinicAddress: '', phone: '',
  })
  const [patient, setPatient] = useState<PatientForm>({
    patientName: '', age: '', sex: 'Male',
    date: new Date().toLocaleDateString('en-IN'),
    chiefComplaint: '', diagnosis: '',
  })

  // ── Auto-load doctor profile from saved profile on mount ──
  useEffect(() => {
    getDoctorProfile().then(p => {
      if (p?.name) {
        setDoctor({
          doctorName: p.name,
          qualification: p.qualification || '',
          clinicName: p.clinicName || '',
          clinicAddress: p.address || '',
          phone: p.phone || '',
          specialization: p.specialization || '',
          registrationNumber: p.regNo || '',
        })
        setProfileLoaded(true)
      }
    })
  }, [])

  const stepLabels = [
    { label: '1 · Template', key: 'template' },
    { label: '2 · Patient Info', key: 'form' },
    { label: '3 · Write Rx', key: 'canvas' },
  ]

  const handleApplyPreset = (preset: TestPreset, jumpDirectly: boolean) => {
    const tmpl = MOBILE_TEMPLATES.find(t => t.id === preset.templateId) || MOBILE_TEMPLATES[0]
    setSelectedTemplate({
      id: tmpl.id,
      name: tmpl.name,
      emoji: tmpl.emoji,
      primaryColor: tmpl.styles.primaryColor,
      accentColor: tmpl.styles.accentColor,
    })
    setDoctor({
      doctorName: preset.doctor.name,
      qualification: preset.doctor.qualification,
      clinicName: preset.doctor.clinicName,
      clinicAddress: preset.doctor.address,
      phone: preset.doctor.phone,
    })
    const isTwoCol = preset.templateId === 'two-column-sidebar'
    const isVitals = preset.templateId === 'vitals-first'
    setPatient({
      patientName: preset.patient.name,
      age: preset.patient.age,
      sex: preset.patient.gender,
      date: new Date().toLocaleDateString('en-IN'),
      chiefComplaint: preset.patient.chiefComplaint,
      diagnosis: preset.patient.diagnosis,
      weight: preset.patient.weight ? preset.patient.weight.replace(' kg', '') : (isTwoCol ? '68' : ''),
      bp: (preset.patient as any).bp || (isTwoCol ? '140/90' : isVitals ? '120/80' : ''),
      pulse: (preset.patient as any).pulse || (isTwoCol ? '78' : isVitals ? '74' : ''),
      temp: (preset.patient as any).temp || (isTwoCol ? '98.4' : isVitals ? '98.6' : ''),
      spo2: (preset.patient as any).spo2 || (isTwoCol ? '98' : isVitals ? '99' : ''),
      height: (preset.patient as any).height || (isTwoCol ? '172' : ''),
      opdRef: (preset.patient as any).opdRef || (isTwoCol ? 'OPD-8821' : ''),
    })
    if (jumpDirectly) {
      setStep('canvas')
    } else {
      setStep('form')
    }
  }

  const handleQuickFillCurrent = () => {
    const targetId = selectedTemplate?.id || 'classic-letterhead'
    const preset = getTestPresetByTemplateId(targetId)
    handleApplyPreset(preset, false)
  }

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
        {/* Navigation & Actions Row */}
        <View style={rS.navRow}>
          <View style={rS.navLeft}>
            <Pressable style={rS.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <Text style={rS.topTitle} numberOfLines={1}>📋 Tablet Mode</Text>
          </View>

          {/* Test Presets Button */}
          <Pressable style={rS.testBtn} onPress={() => setShowTestModal(true)}>
            <Ionicons name="flask" size={14} color="#fff" />
            <Text style={rS.testBtnText}>⚡ Presets</Text>
          </Pressable>
        </View>

        {/* Step indicators */}
        <View style={rS.stepsRow}>
          {stepLabels.map(s => {
            const isActive = step === s.key
            const stepOrder = ['template', 'form', 'canvas']
            const isDone = stepOrder.indexOf(s.key) < stepOrder.indexOf(step)
            return (
              <Pressable
                key={s.key}
                disabled={!isDone && !isActive}
                onPress={() => {
                  if (s.key === 'template') setStep('template')
                  else if (s.key === 'form' && selectedTemplate) setStep('form')
                  else if (s.key === 'canvas' && doctor.doctorName && patient.patientName) setStep('canvas')
                }}
                style={[
                  rS.stepChip,
                  isActive && rS.stepChipActive,
                  isDone && rS.stepChipDone,
                ]}
              >
                <Text
                  style={[
                    rS.stepChipText,
                    (isActive || isDone) && rS.stepChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {isDone ? '✓ ' : ''}{s.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Content */}
      {step === 'template' ? (
        <TemplatePickerStep
          onSelect={(t) => { setSelectedTemplate(t); setStep('form') }}
          onOpenTestLab={() => setShowTestModal(true)}
        />
      ) : step === 'form' ? (
        <FormStep
          doctor={doctor} setDoctor={setDoctor}
          patient={patient} setPatient={setPatient}
          onNext={() => setStep('canvas')}
          onOpenTestLab={() => setShowTestModal(true)}
          onQuickFillCurrent={handleQuickFillCurrent}
          selectedTemplateName={selectedTemplate?.name}
          profileLoaded={profileLoaded}
        />
      ) : (
        <CanvasStep
          doctor={doctor} patient={patient}
          onEditInfo={() => setStep('form')}
          templateColor={selectedTemplate?.primaryColor ?? '#0f766e'}
          selectedTemplate={selectedTemplate}
        />
      )}

      {/* Test Preset Modal */}
      <TestPresetModal
        visible={showTestModal}
        onClose={() => setShowTestModal(false)}
        currentTemplateId={selectedTemplate?.id}
        mode="tablet-mode"
        onSelectPreset={handleApplyPreset}
      />
    </View>
  )
}

const rS = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FF' },
  topBar: {
    backgroundColor: '#102A56',
    paddingTop: Platform.OS === 'ios' ? 50 : 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChipActive: { backgroundColor: '#155EEF' },
  stepChipDone: { backgroundColor: 'rgba(21,94,239,0.4)' },
  stepChipText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  stepChipTextActive: { color: '#fff' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#155EEF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  testBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
})

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 14,
    marginBottom: 14,
    lineHeight: 18,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  optIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  optDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
})
