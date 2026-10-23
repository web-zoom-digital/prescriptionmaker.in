import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, Pressable, Platform,
  Alert, ActivityIndicator, Dimensions, PanResponder,
  StatusBar, ScrollView, TextInput, KeyboardAvoidingView,
  Modal, Image, Switch,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Line, Rect, Text as SvgText, Circle, Image as SvgImage, G } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import * as Print from 'expo-print'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

const { width: SW, height: SH } = Dimensions.get('window')

import { MOBILE_TEMPLATES, type Template, getTemplateFieldConfig } from '../lib/templates'
import { generatePrescriptionHTML } from '../lib/pdf-generator'
import {
  downloadPrescriptionPdf,
  downloadTabletPrescriptionPdf,
  printCleanPrescription,
  generateTabletPrescriptionHTML,
} from '../lib/pdf-export-service'
import TestPresetModal from '../components/TestPresetModal'
import { getTestPresetByTemplateId, type TestPreset } from '../lib/test-presets'
import { getDoctorProfile, saveDoctorProfile } from '../lib/local-store'

type DrawnPath = { d: string; color: string; width: number }
type Tool = 'pen' | 'eraser' | 'hand'
type Step = 'template' | 'form' | 'canvas'

// ── Sample Clinic Logo for Two-Column Sidebar Testing ────────────────────────
const SAMPLE_CARDIOLOGY_LOGO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23102A56"/><path d="M50 25 C35 10 15 25 25 45 C35 65 50 82 50 82 C50 82 65 65 75 45 C85 25 65 10 50 25 Z" fill="%23ffffff"/><path d="M28 50 L40 50 L45 38 L52 64 L58 46 L63 52 L72 52" fill="none" stroke="%23155EEF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

// ── Pen Config ────────────────────────────────────────────────────────────────
const PEN_COLORS = [
  '#0f172a', // Classic Black
  '#1e40af', // Royal Blue
  '#0f766e', // Medical Teal
  '#be123c', // Critical Red
  '#7c3aed', // Purple
  '#d97706', // Amber Orange
  '#047857', // Emerald Green
  '#475569', // Slate Gray
]
const PEN_WIDTHS = [1.5, 3, 5, 9, 16]

const PEN_COLOR_NAMES: Record<string, string> = {
  '#0f172a': 'Black',
  '#1e293b': 'Black',
  '#1e40af': 'Blue',
  '#0f766e': 'Teal',
  '#be123c': 'Red',
  '#7c3aed': 'Purple',
  '#d97706': 'Amber',
  '#047857': 'Green',
  '#475569': 'Slate',
}

const PEN_WIDTH_LABELS: Record<number, string> = {
  1.5: 'Fine',
  3: 'Standard',
  5: 'Medium',
  9: 'Thick',
  16: 'Marker',
}

// ── Form Types ────────────────────────────────────────────────────────────────
type DoctorForm = {
  doctorName: string
  qualification: string
  clinicName: string
  clinicAddress: string
  phone: string
  specialization?: string
  registrationNumber?: string
  signature?: string
  stampUrl?: string
  logoUrl?: string
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
  // Quick Post-Rx Advice & Tests
  advice?: string
  investigations?: string
  followUp?: string
  respiratoryRate?: string
  rr?: string
  examination?: string
  symptoms?: string
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
  initialTemplateId,
  onHighlight,
  onSelect,
  onOpenTestLab,
}: {
  initialTemplateId?: string
  onHighlight?: (t: SelectedTemplate) => void
  onSelect: (t: SelectedTemplate) => void
  onOpenTestLab?: () => void
}) {
  const [selected, setSelected] = useState<string | null>(initialTemplateId || null)
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
                  if (onHighlight) {
                    onHighlight({
                      id: tmpl.id,
                      name: tmpl.name,
                      emoji: tmpl.emoji,
                      primaryColor: tmpl.styles.primaryColor,
                      accentColor: tmpl.styles.accentColor,
                    })
                  }
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

            {/* Direct 1-Click Action to Continue with Selected Template */}
            <Pressable
              style={[
                tpS.popupSelectBtn,
                { backgroundColor: selectedTmpl.styles.primaryColor, marginTop: 12, justifyContent: 'center' }
              ]}
              onPress={() => {
                onSelect({
                  id: selectedTmpl.id,
                  name: selectedTmpl.name,
                  emoji: selectedTmpl.emoji,
                  primaryColor: selectedTmpl.styles.primaryColor,
                  accentColor: selectedTmpl.styles.accentColor,
                })
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={tpS.popupSelectText}>✓ Select & Use {selectedTmpl.name}</Text>
            </Pressable>
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

// ── Helper to render doctor signature onto SVG overlay ─────────────────────────
function renderOverlayDoctorSignature(
  doctor: DoctorForm,
  centerX: number,
  baselineY: number,
  maxW: number = 85,
  maxH: number = 24
) {
  if (doctor.signature && doctor.signature.trim()) {
    const x = Math.round(centerX - maxW / 2)
    const y = Math.round(baselineY - maxH - 2)
    return (
      <SvgImage
        href={doctor.signature}
        x={x}
        y={y}
        width={maxW}
        height={maxH}
        preserveAspectRatio="xMidYMid meet"
      />
    )
  }
  if (doctor.doctorName && doctor.doctorName.trim()) {
    const prefix = /^(dra)\.?/i.test(doctor.doctorName.trim()) ? 'Dra.' : 'Dr.'
    const cleanDoc = doctor.doctorName.trim().replace(/^(Dr|Dra)\.?\s*/i, '')
    const fullDoc = cleanDoc ? `${prefix} ${cleanDoc}` : ''
    const fs = fullDoc.length > 22 ? 9.5 : fullDoc.length > 17 ? 10.5 : 12
    return (
      <SvgText
        x={centerX}
        y={baselineY - 3}
        textAnchor="middle"
        fontSize={fs}
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="bold"
        fill="#0f172a"
      >
        {fullDoc}
      </SvgText>
    )
  }
  return null
}

// ── Helper to render clinic logo onto SVG overlay ─────────────────────────────
function renderOverlayClinicLogo(
  logoUrl: string | undefined,
  centerX: number,
  centerY: number,
  radius: number = 16
) {
  if (logoUrl && logoUrl.trim()) {
    const size = Math.round((radius - 1.5) * 2)
    const x = Math.round(centerX - size / 2)
    const y = Math.round(centerY - size / 2)
    return (
      <>
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="#ffffff"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={1.5}
        />
        <SvgImage
          href={logoUrl}
          x={x}
          y={y}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
        />
      </>
    )
  }
  return (
    <>
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.2}
      />
      <SvgText
        x={centerX}
        y={centerY + 5}
        textAnchor="middle"
        fontSize={14}
      >
        👨‍⚕️
      </SvgText>
    </>
  )
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const lineCount = Math.max(13, Math.round(13 * (h / baseH)))
  const rxStartY = Math.round(baseH * 0.355)
  const rxEndY = h - 42

  return (
    <>
      {/* ── Left Sidebar (Doctor & Clinic Info + Recorded Vitals) ── */}
      <Rect x={0} y={0} width={sbW} height={h} fill={primaryColor} />

      {/* Doctor photo / Clinic Logo */}
      {renderOverlayClinicLogo(doctor.logoUrl, sbW / 2, Math.round(baseH * 0.055), Math.max(15, Math.round(baseH * 0.026)))}

      {/* Doctor Info */}
      <SvgText x={sbW / 2} y={Math.round(baseH * 0.108)} textAnchor="middle" fontSize={Math.max(8.5, Math.round(w * 0.028))} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={sbW / 2} y={Math.round(baseH * 0.128)} textAnchor="middle" fontSize={Math.max(7, Math.round(w * 0.022))} fill="rgba(255,255,255,0.85)">{qualClean}</SvgText>
      <SvgText x={sbW / 2} y={Math.round(baseH * 0.147)} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill={accentColor}>General Medicine</SvgText>
      <Line x1={8} y1={Math.round(baseH * 0.162)} x2={sbW - 8} y2={Math.round(baseH * 0.162)} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />

      {/* Clinic */}
      <SvgText x={10} y={Math.round(baseH * 0.182)} fontSize={Math.max(6, Math.round(w * 0.019))} fontWeight="bold" fill="rgba(255,255,255,0.65)" letterSpacing={0.5}>CLINIC</SvgText>
      <SvgText x={10} y={Math.round(baseH * 0.203)} fontSize={Math.max(7.5, Math.round(w * 0.024))} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>
      {doctor.phone ? <SvgText x={10} y={Math.round(baseH * 0.222)} fontSize={Math.max(6.2, Math.round(w * 0.019))} fill="rgba(255,255,255,0.75)">{`☎ ${safeTruncate(doctor.phone, 14)}`}</SvgText> : null}
      <Line x1={8} y1={Math.round(baseH * 0.238)} x2={sbW - 8} y2={Math.round(baseH * 0.238)} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />

      {/* ── RECORDED VITALS (Exact match to preview pop-up!) ── */}
      <SvgText x={10} y={Math.round(baseH * 0.26)} fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="rgba(255,255,255,0.7)" letterSpacing={0.4}>RECORDED VITALS</SvgText>

      {/* BP */}
      <SvgText x={10} y={Math.round(baseH * 0.285)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">BP (mmHg)</SvgText>
      <Line x1={sbW - 44} y1={Math.round(baseH * 0.285)} x2={sbW - 8} y2={Math.round(baseH * 0.285)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.bp ? (
        <SvgText x={sbW - 9} y={Math.round(baseH * 0.285) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.bp}</SvgText>
      ) : null}

      {/* Pulse */}
      <SvgText x={10} y={Math.round(baseH * 0.312)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Pulse (bpm)</SvgText>
      <Line x1={sbW - 44} y1={Math.round(baseH * 0.312)} x2={sbW - 8} y2={Math.round(baseH * 0.312)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.pulse ? (
        <SvgText x={sbW - 9} y={Math.round(baseH * 0.312) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.pulse}</SvgText>
      ) : null}

      {/* Temp */}
      <SvgText x={10} y={Math.round(baseH * 0.339)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Temp (°F)</SvgText>
      <Line x1={sbW - 44} y1={Math.round(baseH * 0.339)} x2={sbW - 8} y2={Math.round(baseH * 0.339)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.temp ? (
        <SvgText x={sbW - 9} y={Math.round(baseH * 0.339) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.temp}</SvgText>
      ) : null}

      {/* SpO2 */}
      <SvgText x={10} y={Math.round(baseH * 0.366)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">SpO₂ (%)</SvgText>
      <Line x1={sbW - 44} y1={Math.round(baseH * 0.366)} x2={sbW - 8} y2={Math.round(baseH * 0.366)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.spo2 ? (
        <SvgText x={sbW - 9} y={Math.round(baseH * 0.366) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.spo2}</SvgText>
      ) : null}

      {/* Weight */}
      <SvgText x={10} y={Math.round(baseH * 0.393)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Weight (kg)</SvgText>
      <Line x1={sbW - 44} y1={Math.round(baseH * 0.393)} x2={sbW - 8} y2={Math.round(baseH * 0.393)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.weight ? (
        <SvgText x={sbW - 9} y={Math.round(baseH * 0.393) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.weight}</SvgText>
      ) : null}

      {/* Height */}
      <SvgText x={10} y={Math.round(baseH * 0.42)} fontSize={Math.max(6.8, Math.round(w * 0.021))} fill="#ffffff">Height (cm)</SvgText>
      <Line x1={sbW - 44} y1={Math.round(baseH * 0.42)} x2={sbW - 8} y2={Math.round(baseH * 0.42)} stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
      {patient.height ? (
        <SvgText x={sbW - 9} y={Math.round(baseH * 0.42) - 2} textAnchor="end" fontSize={Math.max(6.8, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">{patient.height}</SvgText>
      ) : null}

      {/* Sidebar Footer */}
      <SvgText x={sbW / 2} y={h - 12} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.4)">prescriptionmaker.in</SvgText>

      {/* ── Right Main Section ── */}
      {/* Top Header */}
      <SvgText x={mainX + 10} y={Math.round(baseH * 0.042)} fontSize={Math.max(8.5, Math.round(w * 0.028))} fontWeight="bold" fill={primaryColor} letterSpacing={0.8}>MEDICAL PRESCRIPTION</SvgText>
      <SvgText x={mainX + 10} y={Math.round(baseH * 0.066)} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#334155" fontWeight="bold">{`Date: ${todayStr}`}</SvgText>
      <SvgText x={w - 10} y={Math.round(baseH * 0.042)} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">
        {patient.opdRef ? `OPD Ref: ${patient.opdRef}` : 'OPD Ref: _________'}
      </SvgText>
      <Line x1={mainX + 10} y1={Math.round(baseH * 0.078)} x2={w - 10} y2={Math.round(baseH * 0.078)} stroke={accentColor} strokeWidth={1.5} />

      {/* PATIENT DETAILS Box (rounded light box) */}
      <Rect x={mainX + 10} y={Math.round(baseH * 0.092)} width={mainW - 20} height={Math.round(baseH * 0.076)} fill={accentColor + '18'} rx={4} />
      <SvgText x={mainX + 16} y={Math.round(baseH * 0.116)} fontSize={Math.max(6.5, Math.round(w * 0.019))} fontWeight="bold" fill="#64748b" letterSpacing={0.5}>PATIENT DETAILS</SvgText>
      <SvgText x={mainX + 16} y={Math.round(baseH * 0.146)} fontSize={Math.max(9.5, Math.round(w * 0.03))} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={w - 16} y={Math.round(baseH * 0.146)} textAnchor="end" fontSize={Math.max(7.5, Math.round(w * 0.023))} fill="#475569">{patientAgeSex}</SvgText>

      {/* DIAGNOSIS Box (bordered box with solid left accent) */}
      <Rect x={mainX + 10} y={Math.round(baseH * 0.182)} width={mainW - 20} height={Math.round(baseH * 0.065)} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <Rect x={mainX + 10} y={Math.round(baseH * 0.182)} width={3.5} height={Math.round(baseH * 0.065)} fill={primaryColor} />
      <SvgText x={mainX + 18} y={Math.round(baseH * 0.205)} fontSize={Math.max(6.5, Math.round(w * 0.019))} fontWeight="bold" fill="#64748b" letterSpacing={0.5}>DIAGNOSIS</SvgText>
      <SvgText x={mainX + 18} y={Math.round(baseH * 0.233)} fontSize={Math.max(8.5, Math.round(w * 0.027))} fontWeight="bold" fill={primaryColor}>{diagnosisClean}</SvgText>

      {/* ℞ Symbol */}
      <SvgText x={mainX + 10} y={Math.round(baseH * 0.282)} fontSize={16} fontWeight="bold" fill={primaryColor} fontFamily="Georgia">℞</SvgText>

      {/* Medicine Table Header (colored bar) */}
      <Rect x={mainX + 10} y={Math.round(baseH * 0.298)} width={mainW - 20} height={Math.round(baseH * 0.038)} fill={primaryColor} rx={2} />
      <SvgText x={mainX + 16} y={Math.round(baseH * 0.323)} fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Medicine</SvgText>
      <SvgText x={mainX + (mainW - 20) * 0.46} y={Math.round(baseH * 0.323)} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Unit</SvgText>
      <SvgText x={mainX + (mainW - 20) * 0.70} y={Math.round(baseH * 0.323)} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Frequency</SvgText>
      <SvgText x={w - 16} y={Math.round(baseH * 0.323)} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.021))} fontWeight="bold" fill="#ffffff">Duration</SvgText>

      {/* Writing lines */}
      {renderSvgWritingLines(rxStartY, rxEndY, lineCount, mainX + 10, w - 10)}

      {/* Signature & Footer */}
      {renderOverlayDoctorSignature(doctor, w - 52, h - 24, 80, 22)}
      <Line x1={w - 95} y1={h - 22} x2={w - 10} y2={h - 22} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 52} y={h - 12} textAnchor="middle" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">Doctor's Signature</SvgText>
      <SvgText x={mainX + 10} y={h - 12} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#64748b">
        {patient.followUp ? `Follow-up: ${patient.followUp}` : 'Two-Column Sidebar'}
      </SvgText>
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.10)
  const contentW = w - 20

  // Sanitize Doctor Name to prevent duplicate "Dr. Dr."
  const rawDoc = (doctor.doctorName || '').trim().replace(/^(Dr|Dra)\.?\s*/i, '')
  const doctorDisplayName = rawDoc ? `Dr. ${rawDoc}` : 'Dr. Doctor Name'
  const qualSpec = [doctor.qualification, doctor.specialization].filter(Boolean).join(' · ') || 'MBBS, MD · General Medicine'
  const clinicClean = safeTruncate(doctor.clinicName, 28) || 'Name of your clinic'

  const patientNameClean = safeTruncate(patient.patientName, 24) || 'Patient full name'
  const complaintClean = safeTruncate(patient.chiefComplaint, 40) || 'Acute Pharyngitis'
  const diagnosisClean = safeTruncate(patient.diagnosis, 36) || 'Acute Pharyngitis'
  const examClean = safeTruncate(patient.examination || patient.symptoms, 50) || 'Examination findings...'
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = [patient.age ? `Age ${patient.age}` : '', patient.sex].filter(Boolean).join(' / ')

  // Proportional font sizing
  const fDoc = Math.max(12, Math.round(w * 0.034))
  const fSub = Math.max(7.2, Math.round(w * 0.020))
  const fClinic = Math.max(9.5, Math.round(w * 0.024))
  const fHdrLetter = Math.max(12, Math.round(w * 0.032))
  const fHdrTitle = Math.max(7, Math.round(w * 0.019))
  const fText = Math.max(7.5, Math.round(w * 0.020))
  const fPill = Math.max(6.2, Math.round(w * 0.017))
  const fTh = Math.max(6.8, Math.round(w * 0.018))

  // Section Heights & Vertical Positions
  const patCardY = headH + 8
  const patCardH = Math.max(22, Math.round(baseH * 0.038))

  const hdrH = Math.max(16, Math.round(baseH * 0.028))

  // S — Subjective Box
  const sBoxY = patCardY + patCardH + 8
  const sBodyH = Math.max(26, Math.round(baseH * 0.046))
  const sBoxH = hdrH + sBodyH

  // O — Objective Box (contains 6 vitals badges + examination findings)
  const oBoxY = sBoxY + sBoxH + 8
  const pillH = Math.max(16, Math.round(baseH * 0.028))
  const oBodyH = pillH + 22
  const oBoxH = hdrH + oBodyH

  // A — Assessment Box
  const aBoxY = oBoxY + oBoxH + 8
  const aBodyH = Math.max(24, Math.round(baseH * 0.042))
  const aBoxH = hdrH + aBodyH

  // P — Plan Box (fills down to signature area)
  const pBoxY = aBoxY + aBoxH + 8
  const pBoxH = Math.max(140, (h - 48) - pBoxY)
  const medTitleY = pBoxY + hdrH + 13
  const thY = medTitleY + 5
  const thH = Math.max(15, Math.round(baseH * 0.026))

  // 6 Vitals Badges Calculation
  const vitalsPills = [
    { label: 'BP', val: patient.bp || '______' },
    { label: 'HR (bpm)', val: patient.pulse ? `${patient.pulse}` : '______' },
    { label: 'Temp (°F)', val: patient.temp ? `${patient.temp}` : '______' },
    { label: 'SpO₂ (%)', val: patient.spo2 ? `${patient.spo2}` : '______' },
    { label: 'Weight (kg)', val: patient.weight ? `${patient.weight}` : '______' },
    { label: 'RR (/min)', val: patient.respiratoryRate || (patient as any).rr || '______' },
  ]
  const pillsAvailableW = contentW - 16
  const pillGap = 5
  const pillW = Math.floor((pillsAvailableW - 5 * pillGap) / 6)
  const pillsY = oBoxY + hdrH + 5

  // 4-Column Table Header in Plan Box
  const pTableW = contentW - 12
  const colDrugX = 22
  const colDoseX = 16 + pTableW * 0.44
  const colFreqX = 16 + pTableW * 0.68
  const colDurX = 16 + pTableW * 0.88

  // Ruled writing lines inside Plan box
  const linesStartY = thY + thH + 6
  const linesEndY = pBoxY + pBoxH - 8
  const lineCount = Math.max(9, Math.round((linesEndY - linesStartY) / 20))

  const sigCenterY = h - 24

  return (
    <>
      {/* Header Banner (Deep Indigo) */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={14} y={headH * 0.42} fontSize={fDoc} fontWeight="bold" fill="#ffffff">{doctorDisplayName}</SvgText>
      <SvgText x={14} y={headH * 0.72} fontSize={fSub} fill="#c7d2fe">{qualSpec}</SvgText>
      <SvgText x={w - 14} y={headH * 0.42} textAnchor="end" fontSize={fClinic} fontWeight="bold" fill="#c7d2fe">{clinicClean}</SvgText>
      {doctor.phone ? (
        <SvgText x={w - 14} y={headH * 0.72} textAnchor="end" fontSize={fSub} fill="#c7d2fe">{`☎ ${doctor.phone}`}</SvgText>
      ) : doctor.registrationNumber ? (
        <SvgText x={w - 14} y={headH * 0.72} textAnchor="end" fontSize={fSub} fill="#a5b4fc">{`Reg: ${doctor.registrationNumber}`}</SvgText>
      ) : null}

      {/* Patient + Date Bar (Lavender Card) */}
      <Rect x={10} y={patCardY} width={contentW} height={patCardH} fill="#eef2ff" stroke="#c7d2fe" strokeWidth={0.8} rx={4} />
      <SvgText x={18} y={patCardY + patCardH * 0.65} fontSize={fText} fill="#0f172a" fontWeight="600">
        {`Patient: ${patientNameClean}${patientAgeSex ? `   ${patientAgeSex}` : ''}`}
      </SvgText>
      <SvgText x={w - 18} y={patCardY + patCardH * 0.65} textAnchor="end" fontSize={fText} fill="#0f172a" fontWeight="600">
        {`Date: ${dateStr}`}
      </SvgText>

      {/* S — SUBJECTIVE Box (Purple) */}
      <Rect x={10} y={sBoxY} width={contentW} height={sBoxH} fill="#ffffff" stroke="#7c3aed40" strokeWidth={0.8} rx={5} />
      <Rect x={10} y={sBoxY} width={contentW} height={hdrH} fill="#7c3aed" rx={4} />
      <SvgText x={18} y={sBoxY + hdrH * 0.75} fontSize={fHdrLetter} fontFamily="Georgia" fontWeight="900" fill="#ffffff">S</SvgText>
      <SvgText x={34} y={sBoxY + hdrH * 0.70} fontSize={fHdrTitle} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>SUBJECTIVE — CHIEF COMPLAINT & HISTORY</SvgText>
      <SvgText x={18} y={sBoxY + hdrH + sBodyH * 0.58} fontSize={fText} fill="#334155">{complaintClean}</SvgText>

      {/* O — OBJECTIVE Box (Royal Blue + 6 Vitals Badges) */}
      <Rect x={10} y={oBoxY} width={contentW} height={oBoxH} fill="#ffffff" stroke="#1d4ed840" strokeWidth={0.8} rx={5} />
      <Rect x={10} y={oBoxY} width={contentW} height={hdrH} fill="#1d4ed8" rx={4} />
      <SvgText x={18} y={oBoxY + hdrH * 0.75} fontSize={fHdrLetter} fontFamily="Georgia" fontWeight="900" fill="#ffffff">O</SvgText>
      <SvgText x={34} y={oBoxY + hdrH * 0.70} fontSize={fHdrTitle} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>OBJECTIVE — VITALS & EXAMINATION FINDINGS</SvgText>
      {vitalsPills.map((vp, idx) => {
        const px = 18 + idx * (pillW + pillGap)
        return (
          <G key={idx}>
            <Rect x={px} y={pillsY} width={pillW} height={pillH} fill="#eff6ff" stroke="#dbeafe" strokeWidth={0.8} rx={3} />
            <SvgText x={px + pillW / 2} y={pillsY + pillH * 0.68} textAnchor="middle" fontSize={fPill} fill="#1e293b" fontWeight="600">
              {`${vp.label}: ${vp.val}`}
            </SvgText>
          </G>
        )
      })}
      <SvgText x={18} y={pillsY + pillH + 13} fontSize={fText} fill={patient.examination || patient.symptoms ? '#334155' : '#94a3b8'}>{examClean}</SvgText>

      {/* A — ASSESSMENT Box (Emerald Green) */}
      <Rect x={10} y={aBoxY} width={contentW} height={aBoxH} fill="#ffffff" stroke="#065f4640" strokeWidth={0.8} rx={5} />
      <Rect x={10} y={aBoxY} width={contentW} height={hdrH} fill="#065f46" rx={4} />
      <SvgText x={18} y={aBoxY + hdrH * 0.75} fontSize={fHdrLetter} fontFamily="Georgia" fontWeight="900" fill="#ffffff">A</SvgText>
      <SvgText x={34} y={aBoxY + hdrH * 0.70} fontSize={fHdrTitle} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>ASSESSMENT — DIAGNOSIS</SvgText>
      <SvgText x={18} y={aBoxY + hdrH + aBodyH * 0.58} fontSize={fText} fontWeight="bold" fill="#065f46">{diagnosisClean}</SvgText>

      {/* P — PLAN Box (Deep Indigo + Medications Sub-table) */}
      <Rect x={10} y={pBoxY} width={contentW} height={pBoxH} fill="#ffffff" stroke={`${primaryColor}40`} strokeWidth={0.8} rx={5} />
      <Rect x={10} y={pBoxY} width={contentW} height={hdrH} fill={primaryColor} rx={4} />
      <SvgText x={18} y={pBoxY + hdrH * 0.75} fontSize={fHdrLetter} fontFamily="Georgia" fontWeight="900" fill="#ffffff">P</SvgText>
      <SvgText x={34} y={pBoxY + hdrH * 0.70} fontSize={fHdrTitle} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>PLAN — MEDICATIONS, INVESTIGATIONS & ADVICE</SvgText>
      <SvgText x={18} y={medTitleY} fontSize={fText} fontWeight="bold" fill={primaryColor}>℞ Medications</SvgText>

      {/* 4-Column Table Header */}
      <Rect x={16} y={thY} width={pTableW} height={thH} fill="#e0e7ff" rx={3} />
      <SvgText x={colDrugX} y={thY + thH * 0.68} fontSize={fTh} fontWeight="bold" fill={primaryColor}>Drug</SvgText>
      <SvgText x={colDoseX} y={thY + thH * 0.68} textAnchor="middle" fontSize={fTh} fontWeight="bold" fill={primaryColor}>Dose</SvgText>
      <SvgText x={colFreqX} y={thY + thH * 0.68} textAnchor="middle" fontSize={fTh} fontWeight="bold" fill={primaryColor}>Frequency</SvgText>
      <SvgText x={colDurX} y={thY + thH * 0.68} textAnchor="middle" fontSize={fTh} fontWeight="bold" fill={primaryColor}>Duration</SvgText>

      {/* Writing lines */}
      {renderSvgWritingLines(linesStartY, linesEndY, lineCount, 16, w - 16)}

      {/* Footer / Doctor Signature Area */}
      {renderOverlayDoctorSignature(doctor, w - 68, sigCenterY, 85, 22)}
      <Line x1={w - 120} y1={sigCenterY} x2={w - 16} y2={sigCenterY} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 68} y={sigCenterY + 10} textAnchor="middle" fontSize={fSub} fontWeight="bold" fill="#475569">Doctor's Signature</SvgText>
      <SvgText x={w - 68} y={sigCenterY + 19} textAnchor="middle" fontSize={fSub * 0.9} fill="#64748b">{doctorDisplayName}</SvgText>

      {/* Footer Left: Follow-up */}
      {patient.followUp ? (
        <SvgText x={16} y={sigCenterY + 10} fontSize={fSub} fill="#64748b">
          <SvgText fontWeight="bold" fill={primaryColor}>Follow-up: </SvgText>
          {patient.followUp}
        </SvgText>
      ) : (
        <SvgText x={16} y={sigCenterY + 10} fontSize={fSub * 0.9} fill="#94a3b8">SOAP Clinical Notes · prescriptionmaker.in</SvgText>
      )}
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const rxY = headH + 48
  const lineCount = Math.max(16, Math.round(16 * (h / baseH)))

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
      {renderOverlayDoctorSignature(doctor, w - 52, h - 28, 80, 22)}
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.13)
  const patBoxY = headH + 8
  const patBoxH = Math.round(baseH * 0.12)
  const diagY = patBoxY + patBoxH + 6
  const diagH = 24
  const rxY = diagY + diagH + 10
  const thH = 20
  const tableY = rxY + 16
  const lineCount = Math.max(13, Math.round(13 * (h / baseH)))

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
      <SvgText
        x={14}
        y={h - 40}
        fontSize={f7}
        fontWeight={patient.investigations ? 'bold' : 'normal'}
        fill={patient.investigations ? '#0f172a' : '#64748b'}
      >
        {`जाँच / Investigations: ${patient.investigations ? safeTruncate(patient.investigations, 24) : '___________________'}`}
      </SvgText>
      <SvgText
        x={w * 0.52}
        y={h - 40}
        fontSize={f7}
        fontWeight={patient.advice ? 'bold' : 'normal'}
        fill={patient.advice ? '#0f172a' : '#64748b'}
      >
        {`सलाह / Advice: ${patient.advice ? safeTruncate(patient.advice, 28) : '________________________'}`}
      </SvgText>

      {/* Footer */}
      <Line x1={10} y1={h - 30} x2={w - 10} y2={h - 30} stroke="#cbd5e1" strokeWidth={0.8} />
      <SvgText
        x={14}
        y={h - 18}
        fontSize={f7}
        fontWeight={patient.followUp ? 'bold' : 'normal'}
        fill={patient.followUp ? '#0f172a' : '#64748b'}
      >
        {`Next Visit / अगली मुलाकात: ${patient.followUp ? patient.followUp : '____________'}`}
      </SvgText>
      {renderOverlayDoctorSignature(doctor, w - 67, h - 20, 85, 22)}
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const patBoxY = headH + 6
  const patBoxH = 26
  const vitalsBoxY = patBoxY + patBoxH + 6
  const vitalsH = 68
  const diagY = vitalsBoxY + vitalsH + 6
  const diagH = 22
  const rxY = diagY + diagH + 10
  const thH = 18
  const tableY = rxY + 14
  const lineCount = Math.max(11, Math.round(11 * (h / baseH)))

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
      <SvgText x={16} y={vitalsBoxY + 11} fontSize={f7} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>❤️ VITALS</SvgText>

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
      <SvgText x={14} y={h - 10} fontSize={f6} fontWeight={patient.followUp ? 'bold' : 'normal'} fill={patient.followUp ? '#0f172a' : '#94a3b8'}>
        {`Follow-up: ${patient.followUp ? safeTruncate(patient.followUp, 26) : '_________________'}`}
      </SvgText>
      {renderOverlayDoctorSignature(doctor, w - 62, h - 16, 85, 20)}
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
  const bgColor = template.styles?.bgColor || '#f0f9ff'

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.065)
  const pad = 12
  const boxW2 = (w - pad * 2 - 8) / 2
  const stripH = 16

  // Row 1: Patient Information & Date/Ref
  const row1Y = headH + 8
  const row1H = 46

  // Box 2: Chief Complaint
  const ccY = row1Y + row1H + 6
  const ccH = 34

  // Box 3: Diagnosis
  const diagY = ccY + ccH + 6
  const diagH = 34

  // Box 5: Investigations & Advice (anchored to bottom with proper footer clearance)
  const invH = 36
  const invY = h - 90

  // Box 4: ℞ Prescription (stretches between Diagnosis and Investigations)
  const rxY = diagY + diagH + 6
  const rxBoxH = invY - rxY - 6
  const subThY = rxY + stripH
  const subThH = 16
  const lineCount = Math.max(10, Math.round(10 * (h / baseH)))

  const patientNameClean = safeTruncate(patient.patientName, 26) || 'Patient full name'
  const complaintClean = safeTruncate(patient.chiefComplaint, 45) || 'Acute Pharyngitis'
  const diagnosisClean = safeTruncate(patient.diagnosis, 45) || 'Acute Pharyngitis'
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'Name of your clinic'
  const doctorClean = safeTruncate(doctor.doctorName ? (doctor.doctorName.startsWith('Dr.') ? doctor.doctorName : `Dr. ${doctor.doctorName}`) : 'Dr. Full Name', 28)
  const docSub = [doctor.qualification, doctor.specialization].filter(Boolean).join(' · ') || 'MBBS, MD · General Medicine'
  const dateStr = patient.date || new Date().toLocaleDateString('en-IN')
  const patientAgeSex = [patient.age ? `Age: ${patient.age}` : 'Age: 34', patient.sex ? `Sex: ${patient.sex}` : 'Sex: Male'].filter(Boolean).join(' · ')
  const patientReg = doctor.registrationNumber ? `Reg: ${doctor.registrationNumber}` : 'Reg: ___________'

  const sigLineY = h - 24
  const sigLineW = Math.min(115, Math.round(boxW2 * 0.95))
  const sigX2 = w - pad
  const sigX1 = sigX2 - sigLineW
  const sigCenterX = sigX1 + sigLineW / 2

  const f14 = Math.max(12, Math.round(w * 0.035))
  const f10 = Math.max(9, Math.round(w * 0.025))
  const f8 = Math.max(7, Math.round(w * 0.020))
  const f7 = Math.max(6.5, Math.round(w * 0.0175))
  const f6 = Math.max(5.5, Math.round(w * 0.015))

  return (
    <>
      {/* Light Blue Page Background */}
      <Rect x={0} y={0} width={w} height={h} fill={bgColor} />

      {/* Deep Blue Header */}
      <Rect x={0} y={0} width={w} height={headH} fill={primaryColor} />
      <SvgText x={16} y={Math.round(headH * 0.44)} fontSize={f14} fontWeight="bold" fill="#ffffff">{doctorClean}</SvgText>
      <SvgText x={16} y={Math.round(headH * 0.76)} fontSize={f7} fill={accentColor}>{docSub}</SvgText>
      <SvgText x={w - 16} y={Math.round(headH * 0.54)} textAnchor="end" fontSize={f10} fontWeight="bold" fill="#ffffff">{clinicClean}</SvgText>

      {/* Row 1 Left: PATIENT INFORMATION */}
      <Rect x={pad} y={row1Y} width={boxW2} height={row1H} fill="#ffffff" stroke={accentColor + '40'} strokeWidth={1.2} rx={4} />
      <Rect x={pad} y={row1Y} width={boxW2} height={stripH} fill={accentColor} rx={3} />
      <SvgText x={pad + 8} y={row1Y + 11} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>PATIENT INFORMATION</SvgText>
      <SvgText x={pad + 8} y={row1Y + 28} fontSize={f10} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      <SvgText x={pad + 8} y={row1Y + 39} fontSize={f7} fill="#64748b">{patientAgeSex}</SvgText>

      {/* Row 1 Right: DATE & REFERENCE */}
      <Rect x={pad + boxW2 + 8} y={row1Y} width={boxW2} height={row1H} fill="#ffffff" stroke={accentColor + '40'} strokeWidth={1.2} rx={4} />
      <Rect x={pad + boxW2 + 8} y={row1Y} width={boxW2} height={stripH} fill={accentColor} rx={3} />
      <SvgText x={pad + boxW2 + 16} y={row1Y + 11} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>DATE & REFERENCE</SvgText>
      <SvgText x={pad + boxW2 + 16} y={row1Y + 28} fontSize={f7} fill="#64748b">Date: <SvgText fontWeight="bold" fill="#0f172a">{dateStr}</SvgText></SvgText>
      <SvgText x={pad + boxW2 + 16} y={row1Y + 39} fontSize={f7} fill="#64748b">{patientReg}</SvgText>

      {/* Box 2: CHIEF COMPLAINT */}
      <Rect x={pad} y={ccY} width={w - pad * 2} height={ccH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1.2} rx={4} />
      <Rect x={pad} y={ccY} width={w - pad * 2} height={stripH} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={ccY + 11} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>CHIEF COMPLAINT</SvgText>
      <SvgText x={pad + 8} y={ccY + 26} fontSize={f7} fill="#334155">{complaintClean}</SvgText>

      {/* Box 3: DIAGNOSIS */}
      <Rect x={pad} y={diagY} width={w - pad * 2} height={diagH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1.2} rx={4} />
      <Rect x={pad} y={diagY} width={w - pad * 2} height={stripH} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={diagY + 11} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>DIAGNOSIS</SvgText>
      <SvgText x={pad + 8} y={diagY + 26} fontSize={f8} fontWeight="bold" fill="#0f172a">{diagnosisClean}</SvgText>

      {/* Box 4: ℞ PRESCRIPTION (Contains header, sub-table header, and writing area) */}
      <Rect x={pad} y={rxY} width={w - pad * 2} height={rxBoxH} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={1.2} rx={4} />
      <Rect x={pad} y={rxY} width={w - pad * 2} height={stripH} fill={primaryColor} rx={3} />
      <SvgText x={pad + 8} y={rxY + 11} fontSize={f7} fontWeight="bold" fill="#ffffff" letterSpacing={0.6}>℞ PRESCRIPTION</SvgText>

      {/* Sub-table header inside Prescription box */}
      <Rect x={pad} y={subThY} width={w - pad * 2} height={subThH} fill={primaryColor + '10'} />
      <Line x1={pad} y1={subThY + subThH} x2={w - pad} y2={subThY + subThH} stroke={primaryColor + '20'} strokeWidth={0.8} />
      <SvgText x={pad + 10} y={subThY + 11} fontSize={f7} fontWeight="bold" fill={primaryColor}>Drug</SvgText>
      <SvgText x={pad + (w - pad * 2) * 0.44} y={subThY + 11} fontSize={f7} fontWeight="bold" fill={primaryColor} textAnchor="middle">Unit</SvgText>
      <SvgText x={pad + (w - pad * 2) * 0.65} y={subThY + 11} fontSize={f7} fontWeight="bold" fill={primaryColor} textAnchor="middle">Frequency</SvgText>
      <SvgText x={pad + (w - pad * 2) * 0.88} y={subThY + 11} fontSize={f7} fontWeight="bold" fill={primaryColor} textAnchor="middle">Duration</SvgText>

      {/* Ruled lines inside Prescription box */}
      {renderSvgWritingLines(subThY + subThH + 12, rxY + rxBoxH - 10, lineCount, pad + 6, w - pad - 6)}

      {/* Box 5 Left: INVESTIGATIONS */}
      <Rect x={pad} y={invY} width={boxW2} height={invH} fill="#ffffff" stroke={accentColor + '40'} strokeWidth={1.2} rx={4} />
      <Rect x={pad} y={invY} width={boxW2} height={stripH} fill={accentColor} rx={3} />
      <SvgText x={pad + 8} y={invY + 11} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>INVESTIGATIONS</SvgText>
      <SvgText x={pad + 8} y={invY + 25} fontSize={f7} fill={patient.investigations ? '#0f172a' : '#94a3b8'}>
        {patient.investigations ? safeTruncate(patient.investigations, 32) : 'Tests ordered...'}
      </SvgText>

      {/* Box 5 Right: ADVICE */}
      <Rect x={pad + boxW2 + 8} y={invY} width={boxW2} height={invH} fill="#ffffff" stroke={accentColor + '40'} strokeWidth={1.2} rx={4} />
      <Rect x={pad + boxW2 + 8} y={invY} width={boxW2} height={stripH} fill={accentColor} rx={3} />
      <SvgText x={pad + boxW2 + 16} y={invY + 11} fontSize={f6} fontWeight="bold" fill="#ffffff" letterSpacing={0.5}>ADVICE</SvgText>
      <SvgText x={pad + boxW2 + 16} y={invY + 25} fontSize={f7} fill={patient.advice ? '#0f172a' : '#94a3b8'}>
        {patient.advice ? safeTruncate(patient.advice, 32) : 'Patient advice...'}
      </SvgText>

      {/* Footer Left: Follow-up / Next Visit (aligned under Investigations) */}
      <SvgText x={pad} y={sigLineY + 6} fontSize={f7} fill="#475569">
        Next visit:{' '}
        <SvgText fontWeight="bold" fill={primaryColor}>
          {patient.followUp?.trim() ? safeTruncate(patient.followUp.trim(), 28) : 'As advised'}
        </SvgText>
      </SvgText>
      <SvgText x={pad} y={sigLineY + 16} fontSize={f6} fill="#94a3b8">
        Bring this prescription on next visit
      </SvgText>

      {/* Footer Right: Doctor's Signature (aligned under Advice) */}
      {renderOverlayDoctorSignature(doctor, sigCenterX, sigLineY - 2, Math.min(85, sigLineW), 20)}
      <Line x1={sigX1} y1={sigLineY} x2={sigX2} y2={sigLineY} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={sigCenterX} y={sigLineY + 9} textAnchor="middle" fontSize={f6} fontWeight="bold" fill="#475569">Doctor's Signature</SvgText>
      <SvgText x={sigCenterX} y={sigLineY + 17} textAnchor="middle" fontSize={f6} fill="#64748b">{doctorClean}</SvgText>
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const patH = 34
  const ccH = 20
  const diagH = 20
  const rxY = headH + patH + ccH + diagH + 8
  const thH = 18
  const tableY = rxY + 12
  const lineCount = Math.max(11, Math.round(11 * (h / baseH)))

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
      <SvgText x={16} y={h - 30} fontSize={f6} fontWeight={(patient.advice || patient.investigations) ? 'bold' : 'normal'} fill={(patient.advice || patient.investigations) ? '#0f172a' : '#64748b'}>
        {safeTruncate(patient.advice || patient.investigations || 'Diet & precautions: _________', 32)}
      </SvgText>

      <Rect x={14 + (w - 28) * 0.5} y={h - 52} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={primaryColor + '40'} strokeWidth={0.8} rx={3} />
      <SvgText x={20 + (w - 28) * 0.5} y={h - 42} fontSize={f6} fontWeight="bold" fill={primaryColor} letterSpacing={0.5}>FOLLOW-UP & SIGNATURE</SvgText>
      <SvgText x={20 + (w - 28) * 0.5} y={h - 30} fontSize={f6} fontWeight={patient.followUp ? 'bold' : 'normal'} fill={patient.followUp ? '#0f172a' : '#64748b'}>
        {`Review: ${patient.followUp ? safeTruncate(patient.followUp, 26) : '___________________'}`}
      </SvgText>
      {renderOverlayDoctorSignature(doctor, 20 + (w - 28) * 0.5 + ((w - 28) * 0.5) / 2, h - 18, 70, 16)}

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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.11)
  const pad = 10
  const patRowY = headH + 8
  const patRowH = 38
  const patW = Math.round((w - pad * 2 - 8) * 0.62)
  const diagW = (w - pad * 2 - 8) - patW

  const rxY = patRowY + patRowH + 8
  const thH = 20
  const tableY = rxY + 12
  const lineCount = Math.max(11, Math.round(11 * (h / baseH)))

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
      {renderSvgWritingLines(tableY + thH + 5, h - 96, lineCount, 10, w - 10)}

      {/* Lab Investigations & Advice Box */}
      <Rect x={10} y={h - 90} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={accentColor + '40'} strokeWidth={0.8} rx={3} />
      <SvgText x={16} y={h - 79} fontSize={f6} fontWeight="bold" fill={primaryColor}>LAB INVESTIGATIONS</SvgText>
      <SvgText x={16} y={h - 67} fontSize={f6} fontWeight={patient.investigations ? 'bold' : 'normal'} fill={patient.investigations ? '#0f172a' : '#64748b'}>
        {patient.investigations ? safeTruncate(patient.investigations, 30) : 'CBC, LFT, KFT, Urine R/M: ______'}
      </SvgText>

      <Rect x={14 + (w - 28) * 0.5} y={h - 90} width={(w - 28) * 0.5} height={34} fill="#ffffff" stroke={primaryColor + '30'} strokeWidth={0.8} rx={3} />
      <SvgText x={20 + (w - 28) * 0.5} y={h - 79} fontSize={f6} fontWeight="bold" fill={primaryColor}>SPECIAL INSTRUCTIONS</SvgText>
      <SvgText x={20 + (w - 28) * 0.5} y={h - 67} fontSize={f6} fontWeight={patient.advice ? 'bold' : 'normal'} fill={patient.advice ? '#0f172a' : '#64748b'}>
        {patient.advice ? safeTruncate(patient.advice, 30) : 'Take after meals with water'}
      </SvgText>

      {/* Footer Left: Follow-up */}
      <SvgText x={14} y={h - 18} fontSize={f7} fill="#475569">
        Follow-up:{' '}
        <SvgText fontWeight="bold" fill={primaryColor}>
          {patient.followUp?.trim() ? safeTruncate(patient.followUp.trim(), 28) : 'As advised'}
        </SvgText>
      </SvgText>
      <SvgText x={14} y={h - 8} fontSize={f6} fill="#94a3b8">
        Please bring this prescription for your next consultation
      </SvgText>

      {/* Footer Right: Doctor's Signature */}
      {renderOverlayDoctorSignature(doctor, w - 14 - Math.min(120, Math.round((w - 28) * 0.5 * 0.95)) / 2, h - 26, Math.min(85, Math.round((w - 28) * 0.5 * 0.95)), 20)}
      <Line x1={w - 14 - Math.min(120, Math.round((w - 28) * 0.5 * 0.95))} y1={h - 24} x2={w - 14} y2={h - 24} stroke="#94a3b8" strokeWidth={0.8} />
      <SvgText x={w - 14 - Math.min(120, Math.round((w - 28) * 0.5 * 0.95)) / 2} y={h - 15} textAnchor="middle" fontSize={f6} fontWeight="bold" fill="#475569">Doctor's Signature</SvgText>
      <SvgText x={w - 14 - Math.min(120, Math.round((w - 28) * 0.5 * 0.95)) / 2} y={h - 7} textAnchor="middle" fontSize={f6} fill="#64748b">{doctorClean}</SvgText>
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

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const headH = Math.round(baseH * 0.14)
  const patY = headH + 12
  const patH = 26
  const diagY = patY + patH + 4
  const diagH = 20
  const rxY = diagY + diagH + 10
  const lineCount = Math.max(14, Math.round(14 * (h / baseH)))

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
      <SvgText
        x={14}
        y={h - 44}
        fontSize={f7}
        fontWeight={patient.advice ? 'bold' : 'normal'}
        fill={patient.advice ? '#0f172a' : '#64748b'}
      >
        {`Advice: ${patient.advice ? safeTruncate(patient.advice, 32) : '______________________'}`}
      </SvgText>
      <SvgText
        x={w * 0.52}
        y={h - 44}
        fontSize={f7}
        fontWeight={patient.investigations ? 'bold' : 'normal'}
        fill={patient.investigations ? '#0f172a' : '#64748b'}
      >
        {`Investigations: ${patient.investigations ? safeTruncate(patient.investigations, 24) : '________________'}`}
      </SvgText>

      {/* Classic Signature Block */}
      <Line x1={14} y1={h - 32} x2={w - 14} y2={h - 32} stroke="#e2e8f0" strokeWidth={0.8} />
      <SvgText
        x={14}
        y={h - 18}
        fontSize={f7}
        fontWeight={patient.followUp ? 'bold' : 'normal'}
        fill={patient.followUp ? '#0f172a' : '#64748b'}
      >
        {`Follow-up on: ${patient.followUp ? safeTruncate(patient.followUp, 28) : '________________'}`}
      </SvgText>
      {renderOverlayDoctorSignature(doctor, w - 62, h - 22, 85, 25)}
      <Line x1={w - 110} y1={h - 20} x2={w - 14} y2={h - 20} stroke="#475569" strokeWidth={1} />
      <SvgText x={w - 62} y={h - 8} textAnchor="middle" fontSize={f7} fill="#64748b">Doctor's Signature</SvgText>
      <SvgText x={14} y={h - 8} fontSize={Math.max(5.5, Math.round(w * 0.016))} fill="#cbd5e1" letterSpacing={0.5}>PrescriptionMaker.in · Classic Letterhead</SvgText>
    </>
  )
}

// ── 11. Dental & Clinic Rx Overlay ──────────────────────────────────────────
function OverlayDentalClinic({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const clinicClean = safeTruncate(doctor.clinicName, 32) || 'MARQUEZ DENTAL CLINIC'
  const addressClean = safeTruncate(doctor.clinicAddress, 45) || 'Brgy. San Jose, San Nicolas, Ilocos Norte'
  const phoneClean = doctor.phone || '09178302001'

  // Clean doctor name without duplicate 'Dra.' or 'Dr.'
  let rawDoc = (doctor.doctorName || 'Dra. Lois Gabrielle F. Marquez').trim()
  if (!/^(Dr|Dra)\.?\s+/i.test(rawDoc)) {
    rawDoc = `Dr. ${rawDoc}`
  }
  const qualClean = (doctor.qualification || 'DMD').trim()
  const doctorTitleClean = qualClean ? `${rawDoc}, ${qualClean}` : rawDoc

  const patientNameClean = safeTruncate(patient.patientName, 26)
  const patientAgeClean = (patient.age || '').trim()
  const todayStr = patient.date || new Date().toLocaleDateString('en-IN')

  const baseH = Math.min(h, Math.round(w * (1123 / 794)))
  const topH = Math.round(baseH * 0.125)
  const lineCount = Math.max(13, Math.round(13 * (h / baseH)))

  const leftMargin = Math.round(w * 0.05)
  const rightMargin = Math.round(w * 0.94)

  const pLabelSize = Math.max(6.8, Math.min(11, Math.round(w * 0.014)))
  const pValSize = Math.max(7.2, Math.min(12, Math.round(w * 0.015)))

  // Safe right boundary with 14% pure free whitespace on right
  const safeRight = Math.round(w * 0.86)
  const maxBlockWidth = Math.round(w * 0.46)
  const blockX = safeRight - maxBlockWidth
  const availableWidth = safeRight - blockX

  const targetDocSize = Math.max(5.5, Math.min(12.5, Math.round(w * 0.0155)))
  const maxDocSizeForLength = Math.floor((availableWidth - 10) / (Math.max(1, doctorTitleClean.length) * 0.65))
  const docFontSize = Math.max(5.5, Math.min(targetDocSize, maxDocSizeForLength, 12.5))

  const labelFontSize = Math.max(5, Math.min(10, Math.round(docFontSize * 0.82)))
  const licLabelW = Math.round(11 * labelFontSize * 0.65)
  const lineStartX = blockX + licLabelW + 6
  const underlineEndX = safeRight

  const maxValLen = Math.max(12, Math.floor((underlineEndX - lineStartX - 6) / (labelFontSize * 0.62)))
  const regNoClean = safeTruncate(doctor.registrationNumber || 'PRC-0078921', maxValLen)
  const specClean = safeTruncate(doctor.specialization || 'PTR-1234567', maxValLen)

  const docNameY = h - Math.max(48, Math.round(baseH * 0.052))
  const line1Y = docNameY + Math.max(14, Math.round(baseH * 0.016))
  const line2Y = line1Y + Math.max(14, Math.round(baseH * 0.016))

  return (
    <>
      {/* Background */}
      <Rect x={0} y={0} width={w} height={h} fill="#ffffff" />

      {/* ── Header: Large ℞ on Left, Clinic Details on Right ── */}
      <SvgText
        x={Math.round(w * 0.06)}
        y={Math.round(topH * 0.68)}
        fontSize={Math.max(38, Math.round(w * 0.12))}
        fontFamily="serif"
        fontWeight="normal"
        fill="#111827"
      >
        ℞
      </SvgText>

      {/* Clinic Name */}
      <SvgText
        x={Math.round(w * 0.26)}
        y={Math.round(topH * 0.28)}
        fontSize={Math.max(10, Math.round(w * 0.034))}
        fontFamily="serif"
        fontWeight="bold"
        fill="#111827"
        letterSpacing={0.4}
      >
        {clinicClean.toUpperCase()}
      </SvgText>

      {/* Address */}
      <SvgText
        x={Math.round(w * 0.26)}
        y={Math.round(topH * 0.44)}
        fontSize={Math.max(6.5, Math.round(w * 0.02))}
        fontFamily="serif"
        fill="#374151"
      >
        {addressClean}
      </SvgText>

      {/* Phone */}
      <SvgText
        x={Math.round(w * 0.26)}
        y={Math.round(topH * 0.58)}
        fontSize={Math.max(6.5, Math.round(w * 0.02))}
        fontWeight="bold"
        fill="#111827"
      >
        {`📞 ${phoneClean}`}
      </SvgText>

      {/* Clinic Hours */}
      <SvgText
        x={Math.round(w * 0.26)}
        y={Math.round(topH * 0.72)}
        fontSize={Math.max(5.5, Math.round(w * 0.017))}
        fill="#4b5563"
      >
        Clinic Hours: Monday – Saturday | 9:00 AM – 12:00 NN  1:00 PM – 5:00 PM
      </SvgText>
      <SvgText
        x={Math.round(w * 0.26)}
        y={Math.round(topH * 0.84)}
        fontSize={Math.max(5.5, Math.round(w * 0.017))}
        fill="#4b5563"
      >
        Sunday                       | By appointment
      </SvgText>

      {/* Solid Black Divider Line */}
      <Line
        x1={leftMargin}
        y1={topH}
        x2={rightMargin}
        y2={topH}
        stroke="#111827"
        strokeWidth={2}
      />

      {/* ── Patient Info Underlines ── */}
      {/* Row 1: Patient's Name, Age, Gender */}
      <SvgText x={leftMargin} y={topH + 18} fontSize={pLabelSize} fontFamily="serif" fill="#111827">Patient's Name:</SvgText>
      <Line x1={Math.round(w * 0.17)} y1={topH + 20} x2={Math.round(w * 0.58)} y2={topH + 20} stroke="#111827" strokeWidth={0.8} />
      {patientNameClean ? (
        <SvgText x={Math.round(w * 0.18)} y={topH + 18} fontSize={pValSize} fontFamily="serif" fontWeight="bold" fill="#111827">{patientNameClean}</SvgText>
      ) : null}

      <SvgText x={Math.round(w * 0.62)} y={topH + 18} fontSize={pLabelSize} fontFamily="serif" fill="#111827">Age:</SvgText>
      <Line x1={Math.round(w * 0.67)} y1={topH + 20} x2={Math.round(w * 0.77)} y2={topH + 20} stroke="#111827" strokeWidth={0.8} />
      {patientAgeClean ? (
        <SvgText x={Math.round(w * 0.68)} y={topH + 18} fontSize={pValSize} fontFamily="serif" fill="#111827">{patientAgeClean}</SvgText>
      ) : null}

      <SvgText x={Math.round(w * 0.80)} y={topH + 18} fontSize={pLabelSize} fontFamily="serif" fill="#111827">Gender:</SvgText>
      <Line x1={Math.round(w * 0.87)} y1={topH + 20} x2={rightMargin} y2={topH + 20} stroke="#111827" strokeWidth={0.8} />
      {patient.sex ? (
        <SvgText x={Math.round(w * 0.88)} y={topH + 18} fontSize={pValSize} fontFamily="serif" fill="#111827">{patient.sex}</SvgText>
      ) : null}

      {/* Row 2: Address, Date */}
      <SvgText x={leftMargin} y={topH + 36} fontSize={pLabelSize} fontFamily="serif" fill="#111827">Address:</SvgText>
      <Line x1={Math.round(w * 0.13)} y1={topH + 38} x2={Math.round(w * 0.58)} y2={topH + 38} stroke="#111827" strokeWidth={0.8} />
      {patient.address ? (
        <SvgText x={Math.round(w * 0.14)} y={topH + 36} fontSize={pValSize} fontFamily="serif" fill="#111827">{safeTruncate(patient.address, 36)}</SvgText>
      ) : null}

      <SvgText x={Math.round(w * 0.62)} y={topH + 36} fontSize={pLabelSize} fontFamily="serif" fill="#111827">Date:</SvgText>
      <Line x1={Math.round(w * 0.67)} y1={topH + 38} x2={rightMargin} y2={topH + 38} stroke="#111827" strokeWidth={0.8} />
      <SvgText x={Math.round(w * 0.68)} y={topH + 36} fontSize={pValSize} fontFamily="serif" fill="#111827">{todayStr}</SvgText>

      {/* Writing guide lines */}
      {renderSvgWritingLines(topH + 52, h - 85, lineCount, leftMargin, rightMargin)}

      {/* ── Footer: Bottom Right Doctor Credentials & Signature ── */}
      {doctor.signature && doctor.signature.trim() ? (
        <SvgImage
          href={doctor.signature}
          x={blockX + 20}
          y={docNameY - 36}
          width={130}
          height={32}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
      <SvgText
        x={blockX}
        y={docNameY}
        fontSize={docFontSize}
        fontFamily="serif"
        fontWeight="bold"
        fill="#111827"
      >
        {doctorTitleClean}
      </SvgText>

      <SvgText x={blockX} y={line1Y} fontSize={labelFontSize} fontFamily="serif" fill="#111827">License No.</SvgText>
      <Line x1={lineStartX} y1={line1Y + 2} x2={underlineEndX} y2={line1Y + 2} stroke="#111827" strokeWidth={0.8} />
      {regNoClean ? (
        <SvgText x={lineStartX + 4} y={line1Y} fontSize={labelFontSize} fontFamily="serif" fill="#111827">{regNoClean}</SvgText>
      ) : null}

      <SvgText x={blockX} y={line2Y} fontSize={labelFontSize} fontFamily="serif" fill="#111827">PTR No.</SvgText>
      <Line x1={lineStartX} y1={line2Y + 2} x2={underlineEndX} y2={line2Y + 2} stroke="#111827" strokeWidth={0.8} />
      {specClean ? (
        <SvgText x={lineStartX + 4} y={line2Y} fontSize={labelFontSize} fontFamily="serif" fill="#111827">{specClean}</SvgText>
      ) : null}
    </>
  )
}

// ── 12. Modern Teal Ribbon Overlay ──────────────────────────────────────────
function OverlayModernTealRibbon({
  w, h, doctor, patient, template,
}: {
  w: number; h: number
  doctor: DoctorForm; patient: PatientForm
  template: Template
}) {
  const tealColor = '#00C4CC'
  const navyColor = '#0f2330'

  // Clean doctor name so "Dr. Dr. Aryan" never happens, and if empty/Dr. fallback to "Doctor Name"
  const rawName = (doctor.doctorName || '').replace(/^Dr\.?\s*/i, '').trim()
  const doctorClean = safeTruncate(rawName || 'Doctor Name', 24)
  const qualClean = (doctor.qualification || 'QUALIFICATION').toUpperCase()
  const otherDetails = safeTruncate(doctor.specialization || doctor.clinicName || 'Add other details', 32)
  const patientNameClean = safeTruncate(patient.patientName, 26)
  const diagnosisClean = safeTruncate(patient.diagnosis, 48)
  const todayStr = patient.date || new Date().toLocaleDateString('en-IN')
  const addressRaw = doctor.clinicAddress || '24 Dummy Street Area'
  const isLongAddress = addressRaw.trim().length > 22
  const addressClean = safeTruncate(addressRaw, isLongAddress ? 50 : 22)
  const phoneClean = safeTruncate(doctor.phone || '+12-345 678 9012', 20)

  // Standard A4 reference height for top header proportions
  const baseH = Math.min(h, Math.round(w * (1123 / 794)))

  // Top-Right "V" Ribbon (Matches Image 1 authentic template design)
  const rH = Math.round(baseH * 0.158)
  const cTopL = Math.round(w * 0.49)
  const cTopR = Math.round(w * 0.655)
  const cApex = Math.round(w * 0.825)
  const cBaseL = Math.round(w * 0.66)

  // Midpoint of Cyan's right edge where Navy meets Cyan in the fold
  const nInnerX = Math.round((cTopR + cApex) / 2)
  const nInnerY = Math.round(rH * 0.50)

  // Navy arm
  const nTopL = Math.round(w * 0.81)
  const nTopR = Math.round(w * 0.98)

  // Bottom-Left Folded 3D Corner Chevron (Matches Image 1 authentic template design)
  const peakX = Math.round(w * 0.105)
  const peakY = h - Math.round(baseH * 0.103)
  const cPeakR = Math.round(w * 0.24)
  const cBotR = Math.round(w * 0.35)
  const cBotL = Math.round(w * 0.215)
  const nMidX = Math.round(w * 0.174)
  const nMidY = h - Math.round(baseH * 0.043)
  const nBotX = Math.round(w * 0.148)

  // Caduceus Emblem (Centered above the chevron, proportional and graceful)
  const cadX = Math.round(w * 0.17)
  const cadY = h - Math.round(baseH * 0.20)
  const cadScale = Math.max(0.72, Math.min(1.15, w / 480))

  // Signature Block Coordinates (Elevated above footer to eliminate ANY overlap!)
  const sigY = h - Math.round(baseH * 0.145)
  const sigX1 = Math.round(w * 0.62)
  const sigX2 = Math.round(w * 0.88)
  const sigCenter = Math.round((sigX1 + sigX2) / 2)

  // Footer Contact Coordinates (Positioned cleanly on bottom margin)
  const footerY = h - Math.round(baseH * 0.045)
  const addrX = Math.round(w * 0.38)
  const phoneX = Math.round(w * 0.70)

  return (
    <>
      {/* Pure white clean canvas background (No notebook ruled lines!) */}
      <Rect x={0} y={0} width={w} height={h} fill="#ffffff" />

      {/* ── Top-Right Folded Geometric "V" Ribbon (Clean, sharp V shape matching Image 1) ── */}
      {/* Navy right arm (folds behind Cyan ribbon) */}
      <Path
        d={`M ${nTopL} 0 L ${nTopR} 0 L ${cApex} ${rH} L ${nInnerX} ${nInnerY} Z`}
        fill={navyColor}
      />
      {/* Cyan left arm (folds in front with flat base) */}
      <Path
        d={`M ${cTopL} 0 L ${cTopR} 0 L ${cApex} ${rH} L ${cBaseL} ${rH} Z`}
        fill={tealColor}
      />

      {/* ── Top-Left Doctor Info (Typography matching Image 1) ── */}
      <SvgText
        x={Math.round(w * 0.055)}
        y={Math.round(baseH * 0.088)}
        fontSize={Math.max(14, Math.round(w * 0.044))}
        fontWeight="800"
        fill="#0e3860"
      >
        Dr.
      </SvgText>
      <SvgText
        x={Math.round(w * 0.055) + Math.max(28, Math.round(w * 0.068))}
        y={Math.round(baseH * 0.088)}
        fontSize={Math.max(14, Math.round(w * 0.044))}
        fontWeight="400"
        fill="#1e3a5f"
      >
        {doctorClean}
      </SvgText>

      {/* Tracked Qualification */}
      <SvgText
        x={Math.round(w * 0.055)}
        y={Math.round(baseH * 0.122)}
        fontSize={Math.max(6.5, Math.round(w * 0.02))}
        fontWeight="bold"
        fill="#64748b"
        letterSpacing={2.2}
      >
        {qualClean}
      </SvgText>

      {/* Underline beneath qualification */}
      <Line
        x1={Math.round(w * 0.055)}
        y1={Math.round(baseH * 0.130)}
        x2={Math.round(w * 0.055) + Math.min(110, Math.round(w * 0.22))}
        y2={Math.round(baseH * 0.130)}
        stroke="#cbd5e1"
        strokeWidth={1.2}
      />

      {/* Other details (Specialization / Clinic Name / Subtitle) */}
      <SvgText
        x={Math.round(w * 0.055)}
        y={Math.round(baseH * 0.160)}
        fontSize={Math.max(6.5, Math.round(w * 0.02))}
        fontStyle="italic"
        fill="#64748b"
      >
        {otherDetails}
      </SvgText>

      {/* ── 3-Row Underlined Patient Strip (Clean, neat lines matching Image 1) ── */}
      {/* Row 1: Patient Name & Date */}
      <SvgText x={Math.round(w * 0.055)} y={Math.round(baseH * 0.210)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#475569">Patient Name:</SvgText>
      <Line x1={Math.round(w * 0.22)} y1={Math.round(baseH * 0.213)} x2={Math.round(w * 0.63)} y2={Math.round(baseH * 0.213)} stroke="#cbd5e1" strokeWidth={1} />
      {patientNameClean ? (
        <SvgText x={Math.round(w * 0.24)} y={Math.round(baseH * 0.208)} fontSize={Math.max(7.5, Math.round(w * 0.022))} fontWeight="bold" fill="#0f172a">{patientNameClean}</SvgText>
      ) : null}

      <SvgText x={Math.round(w * 0.66)} y={Math.round(baseH * 0.210)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#475569">Date:</SvgText>
      <Line x1={Math.round(w * 0.74)} y1={Math.round(baseH * 0.213)} x2={Math.round(w * 0.94)} y2={Math.round(baseH * 0.213)} stroke="#cbd5e1" strokeWidth={1} />
      <SvgText x={Math.round(w * 0.76)} y={Math.round(baseH * 0.208)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#334155">{todayStr}</SvgText>

      {/* Row 2: Age, Gender, Weight */}
      <SvgText x={Math.round(w * 0.055)} y={Math.round(baseH * 0.245)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#475569">Age:</SvgText>
      <Line x1={Math.round(w * 0.12)} y1={Math.round(baseH * 0.248)} x2={Math.round(w * 0.30)} y2={Math.round(baseH * 0.248)} stroke="#cbd5e1" strokeWidth={1} />
      {patient.age ? (
        <SvgText x={Math.round(w * 0.14)} y={Math.round(baseH * 0.243)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#0f172a">{patient.age}</SvgText>
      ) : null}

      <SvgText x={Math.round(w * 0.33)} y={Math.round(baseH * 0.245)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#475569">Gender:</SvgText>
      <Line x1={Math.round(w * 0.43)} y1={Math.round(baseH * 0.248)} x2={Math.round(w * 0.58)} y2={Math.round(baseH * 0.248)} stroke="#cbd5e1" strokeWidth={1} />
      {patient.sex ? (
        <SvgText x={Math.round(w * 0.45)} y={Math.round(baseH * 0.243)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#0f172a">{patient.sex}</SvgText>
      ) : null}

      <SvgText x={Math.round(w * 0.62)} y={Math.round(baseH * 0.245)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#475569">Weight:</SvgText>
      <Line x1={Math.round(w * 0.73)} y1={Math.round(baseH * 0.248)} x2={Math.round(w * 0.94)} y2={Math.round(baseH * 0.248)} stroke="#cbd5e1" strokeWidth={1} />
      {patient.weight ? (
        <SvgText x={Math.round(w * 0.75)} y={Math.round(baseH * 0.243)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#0f172a">{patient.weight} kg</SvgText>
      ) : null}

      {/* Row 3: Diagnosis */}
      <SvgText x={Math.round(w * 0.055)} y={Math.round(baseH * 0.280)} fontSize={Math.max(7, Math.round(w * 0.021))} fill="#475569">Diagnosis:</SvgText>
      <Line x1={Math.round(w * 0.20)} y1={Math.round(baseH * 0.283)} x2={Math.round(w * 0.94)} y2={Math.round(baseH * 0.283)} stroke="#cbd5e1" strokeWidth={1} />
      {diagnosisClean ? (
        <SvgText x={Math.round(w * 0.22)} y={Math.round(baseH * 0.278)} fontSize={Math.max(7.2, Math.round(w * 0.022))} fontWeight="bold" fill="#0f172a">{diagnosisClean}</SvgText>
      ) : null}

      {/* ── Bottom-Left Folded 3D Corner Chevron (Exact geometry matching Image 1) ── */}
      {/* Dark Navy Left Slope */}
      <Path
        d={`M 0 ${h} L ${peakX} ${peakY} L ${nMidX} ${nMidY} L ${nBotX} ${h} Z`}
        fill={navyColor}
      />
      {/* Vibrant Cyan Right Slope */}
      <Path
        d={`M ${peakX} ${peakY} L ${cPeakR} ${peakY} L ${cBotR} ${h} L ${cBotL} ${h} Z`}
        fill={tealColor}
      />

      {/* ── Authentic Medical Caduceus Emblem (Floating above the chevron) ── */}
      {/* Top Sphere / Knob */}
      <Circle cx={cadX} cy={cadY - 26 * cadScale} r={4.8 * cadScale} fill={tealColor} />
      <Circle cx={cadX} cy={cadY - 20 * cadScale} r={2.2 * cadScale} fill={tealColor} />

      {/* Central Staff */}
      <Line
        x1={cadX}
        y1={cadY - 20 * cadScale}
        x2={cadX}
        y2={cadY + 34 * cadScale}
        stroke={tealColor}
        strokeWidth={2.4 * cadScale}
        strokeLinecap="round"
      />
      <Circle cx={cadX} cy={cadY + 34 * cadScale} r={2.2 * cadScale} fill={tealColor} />

      {/* Symmetrical Graceful Wings (Eagle/Medical Wings matching Image 1) */}
      {/* Left Wing */}
      <Path
        d={`M ${cadX - 2 * cadScale} ${cadY - 12 * cadScale} C ${cadX - 16 * cadScale} ${cadY - 24 * cadScale}, ${cadX - 32 * cadScale} ${cadY - 24 * cadScale}, ${cadX - 44 * cadScale} ${cadY - 14 * cadScale} C ${cadX - 35 * cadScale} ${cadY - 6 * cadScale}, ${cadX - 29 * cadScale} ${cadY - 5 * cadScale}, ${cadX - 31 * cadScale} ${cadY + 1 * cadScale} C ${cadX - 23 * cadScale} ${cadY + 2 * cadScale}, ${cadX - 19 * cadScale} ${cadY + 4 * cadScale}, ${cadX - 20 * cadScale} ${cadY + 8 * cadScale} C ${cadX - 12 * cadScale} ${cadY + 8 * cadScale}, ${cadX - 4 * cadScale} ${cadY + 4 * cadScale}, ${cadX - 2 * cadScale} ${cadY - 2 * cadScale} Z`}
        fill={tealColor}
      />
      {/* Right Wing */}
      <Path
        d={`M ${cadX + 2 * cadScale} ${cadY - 12 * cadScale} C ${cadX + 16 * cadScale} ${cadY - 24 * cadScale}, ${cadX + 32 * cadScale} ${cadY - 24 * cadScale}, ${cadX + 44 * cadScale} ${cadY - 14 * cadScale} C ${cadX + 35 * cadScale} ${cadY - 6 * cadScale}, ${cadX + 29 * cadScale} ${cadY - 5 * cadScale}, ${cadX + 31 * cadScale} ${cadY + 1 * cadScale} C ${cadX + 23 * cadScale} ${cadY + 2 * cadScale}, ${cadX + 19 * cadScale} ${cadY + 4 * cadScale}, ${cadX + 20 * cadScale} ${cadY + 8 * cadScale} C ${cadX + 12 * cadScale} ${cadY + 8 * cadScale}, ${cadX + 4 * cadScale} ${cadY + 4 * cadScale}, ${cadX + 2 * cadScale} ${cadY - 2 * cadScale} Z`}
        fill={tealColor}
      />

      {/* Twin Symmetrical Coiled Serpents (Figure-8 Waves) */}
      <Path
        d={`M ${cadX - 4 * cadScale} ${cadY - 6 * cadScale} C ${cadX - 14 * cadScale} ${cadY - 2 * cadScale}, ${cadX - 13 * cadScale} ${cadY + 3 * cadScale}, ${cadX} ${cadY + 7 * cadScale} C ${cadX + 14 * cadScale} ${cadY + 11 * cadScale}, ${cadX + 14 * cadScale} ${cadY + 17 * cadScale}, ${cadX} ${cadY + 21 * cadScale} C ${cadX - 10 * cadScale} ${cadY + 24 * cadScale}, ${cadX - 8 * cadScale} ${cadY + 28 * cadScale}, ${cadX - 2 * cadScale} ${cadY + 30 * cadScale}`}
        fill="none"
        stroke={tealColor}
        strokeWidth={2 * cadScale}
        strokeLinecap="round"
      />
      <Path
        d={`M ${cadX + 4 * cadScale} ${cadY - 6 * cadScale} C ${cadX + 14 * cadScale} ${cadY - 2 * cadScale}, ${cadX + 13 * cadScale} ${cadY + 3 * cadScale}, ${cadX} ${cadY + 7 * cadScale} C ${cadX - 14 * cadScale} ${cadY + 11 * cadScale}, ${cadX - 14 * cadScale} ${cadY + 17 * cadScale}, ${cadX} ${cadY + 21 * cadScale} C ${cadX + 10 * cadScale} ${cadY + 24 * cadScale}, ${cadX + 8 * cadScale} ${cadY + 28 * cadScale}, ${cadX + 2 * cadScale} ${cadY + 30 * cadScale}`}
        fill="none"
        stroke={tealColor}
        strokeWidth={2 * cadScale}
        strokeLinecap="round"
      />
      {/* Snake Heads */}
      <Circle cx={cadX - 4 * cadScale} cy={cadY - 6 * cadScale} r={2 * cadScale} fill={tealColor} />
      <Circle cx={cadX + 4 * cadScale} cy={cadY - 6 * cadScale} r={2 * cadScale} fill={tealColor} />

      {/* ── Bottom-Right Signature Block (Elevated to completely avoid footer overlap!) ── */}
      {renderOverlayDoctorSignature(doctor, sigCenter, sigY, 90, 24)}
      <Line x1={sigX1} y1={sigY} x2={sigX2} y2={sigY} stroke="#cbd5e1" strokeWidth={1.2} />
      <SvgText x={sigCenter} y={sigY + 16} textAnchor="middle" fontSize={Math.max(7.2, Math.round(w * 0.022))} fill="#0f2330">
        Signature
      </SvgText>

      {/* ── Footer Contact Information (Matching Image 1, prevents any overlap) ── */}
      {isLongAddress ? (
        <>
          <SvgText x={addrX} y={footerY - 7} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#475569">
            📍 {addressClean}
          </SvgText>
          <SvgText x={addrX} y={footerY + 8} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#475569">
            📞 {phoneClean}
          </SvgText>
        </>
      ) : (
        <>
          <SvgText x={addrX} y={footerY} fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#475569">
            📍 {addressClean}
          </SvgText>
          <SvgText x={Math.round(w * 0.94)} y={footerY} textAnchor="end" fontSize={Math.max(6.5, Math.round(w * 0.02))} fill="#475569">
            📞 {phoneClean}
          </SvgText>
        </>
      )}
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
    case 'dental-clinic':
      return <OverlayDentalClinic w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'modern-teal-ribbon':
      return <OverlayModernTealRibbon w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
    case 'two-column-sidebar':
      return <OverlayTwoColumnSidebar w={w} h={h} doctor={doctor} patient={patient} template={fullTemplate} />
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
  onOpenTestLab, onQuickFillCurrent, selectedTemplate, profileLoaded,
}: {
  doctor: DoctorForm; setDoctor: (d: DoctorForm) => void
  patient: PatientForm; setPatient: (p: PatientForm) => void
  onNext: () => void
  onOpenTestLab?: () => void
  onQuickFillCurrent?: () => void
  selectedTemplate?: SelectedTemplate | null
  profileLoaded?: boolean
}) {
  const upD = (k: keyof DoctorForm, v: string) => setDoctor({ ...doctor, [k]: v })
  const upP = (k: keyof PatientForm, v: string) => setPatient({ ...patient, [k]: v })
  const hasDoctor = Boolean(doctor.doctorName?.trim())
  // Collapse doctor card when doctor info is already present
  const [doctorExpanded, setDoctorExpanded] = useState(!hasDoctor)

  const cfg = getTemplateFieldConfig(selectedTemplate?.id)
  const templateName = selectedTemplate?.name || 'Classic Letterhead'
  const templateEmoji = selectedTemplate?.emoji || '📜'

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
        setDoctor({ ...doctor, signature: b64 })
        getDoctorProfile().then(p => {
          if (p) saveDoctorProfile({ ...p, signature: b64 }).catch(() => { })
        })
      }
    } catch (e: any) {
      Alert.alert('Image Error', e?.message || 'Could not pick signature image')
    }
  }

  const clearSignature = () => {
    setDoctor({ ...doctor, signature: '' })
    getDoctorProfile().then(p => {
      if (p) saveDoctorProfile({ ...p, signature: '' }).catch(() => { })
    })
  }

  const pickLogo = async () => {
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
        setDoctor({ ...doctor, logoUrl: b64 })
        getDoctorProfile().then(p => {
          if (p) saveDoctorProfile({ ...p, logoUrl: b64 }).catch(() => { })
        })
      }
    } catch (e: any) {
      Alert.alert('Image Error', e?.message || 'Could not pick logo image')
    }
  }

  const clearLogo = () => {
    setDoctor({ ...doctor, logoUrl: '' })
    getDoctorProfile().then(p => {
      if (p) saveDoctorProfile({ ...p, logoUrl: '' }).catch(() => { })
    })
  }

  const appendAdvice = (text: string) => {
    const current = (patient.advice || '').trim()
    if (!current) {
      upP('advice', text)
    } else if (!current.includes(text)) {
      upP('advice', `${current}, ${text}`)
    }
  }

  const appendInvestigations = (text: string) => {
    const current = (patient.investigations || '').trim()
    if (!current) {
      upP('investigations', text)
    } else if (!current.includes(text)) {
      upP('investigations', `${current}, ${text}`)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={fS.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Active Template Indicator ── */}
        <View style={fS.activeTemplateBadge}>
          <View style={fS.activeTemplateDot} />
          <Text style={fS.activeTemplateText}>
            Selected Layout: <Text style={{ fontWeight: '800', color: '#0f172a' }}>{templateEmoji} {templateName}</Text>
          </Text>
          <View style={fS.fieldsCountChip}>
            <Text style={fS.fieldsCountText}>Exact Template Fields</Text>
          </View>
        </View>

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
                  address: '', allergies: '',
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
                <Text style={fS.quickTestBtnText}>Auto-Fill {templateName}</Text>
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

              {/* Doctor Signature Block */}
              <View style={fS.sigSection}>
                <View style={fS.sigHead}>
                  <Text style={fS.sigLabel}>Doctor Signature / डॉक्टर हस्ताक्षर</Text>
                  <Text style={{ fontSize: 9.5, color: '#64748b' }}>Printed on prescription footer</Text>
                </View>
                <View style={fS.sigPreviewRow}>
                  {doctor.signature ? (
                    <View style={fS.sigThumbWrap}>
                      <Image source={{ uri: doctor.signature }} style={fS.sigThumb} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={fS.sigCursiveBadge}>
                      <Ionicons name="sparkles" size={14} color="#16a34a" />
                      <Text style={fS.sigCursiveText} numberOfLines={1}>
                        Auto Cursive: Dr. {doctor.doctorName || 'Doctor'}
                      </Text>
                    </View>
                  )}
                  <Pressable style={fS.sigActionBtn} onPress={pickSignature}>
                    <Ionicons name="cloud-upload-outline" size={14} color="#155EEF" />
                    <Text style={fS.sigActionBtnText}>
                      {doctor.signature ? 'Change' : 'Upload Signature'}
                    </Text>
                  </Pressable>
                  {doctor.signature ? (
                    <Pressable style={fS.sigClearBtn} onPress={clearSignature}>
                      <Ionicons name="trash-outline" size={13} color="#dc2626" />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 4 }}>
                  {doctor.signature
                    ? '✓ Custom signature image saved to profile.'
                    : 'Auto-digital cursive script active. Upload an image anytime to override.'}
                </Text>
              </View>

              {/* Clinic / Hospital Logo Block */}
              <View style={fS.sigSection}>
                <View style={fS.sigHead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={fS.sigLabel}>Clinic / Hospital Logo / लोगो</Text>
                    {selectedTemplate?.id === 'two-column-sidebar' && (
                      <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe' }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#1d4ed8' }}>⭐ Key for Two-Column Sidebar</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 9.5, color: '#64748b' }}>Appears on Two-Column Sidebar & headers</Text>
                </View>
                <View style={fS.sigPreviewRow}>
                  {doctor.logoUrl ? (
                    <View style={fS.logoThumbWrap}>
                      <Image source={{ uri: doctor.logoUrl }} style={fS.logoThumb} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[fS.sigCursiveBadge, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                      <Text style={{ fontSize: 16 }}>🏥</Text>
                      <Text style={[fS.sigCursiveText, { color: '#64748b', fontStyle: 'normal' }]} numberOfLines={1}>
                        Default Doctor / Clinic Icon
                      </Text>
                    </View>
                  )}
                  <Pressable style={fS.sigActionBtn} onPress={pickLogo}>
                    <Ionicons name="image-outline" size={14} color="#155EEF" />
                    <Text style={fS.sigActionBtnText}>
                      {doctor.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Text>
                  </Pressable>
                  {doctor.logoUrl ? (
                    <Pressable style={fS.sigClearBtn} onPress={clearLogo}>
                      <Ionicons name="trash-outline" size={13} color="#dc2626" />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 4 }}>
                  {doctor.logoUrl
                    ? '✓ Custom clinic logo saved to profile.'
                    : 'Upload PNG/JPG logo (recommended 1:1 square or circular).'}
                </Text>
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
              <Text style={fS.cardSub}>Fills the patient strip on {templateName}</Text>
            </View>
          </View>

          {/* Row 1: Patient Name & Age */}
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

          {/* Row 2: Sex & Date */}
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

          {/* Weight in Patient Strip (e.g. Modern Teal Ribbon) */}
          {cfg.hasWeightInPatient && (
            <View style={fS.row}>
              <View style={[fS.fg, { flex: 1 }]}>
                <Text style={fS.label}>Weight (kg)</Text>
                <TextInput style={fS.input} placeholder="e.g. 68" placeholderTextColor="#94a3b8"
                  value={patient.weight || ''} onChangeText={v => upP('weight', v)} keyboardType="numeric" />
              </View>
            </View>
          )}

          {/* Patient Address (e.g. Dental Clinic & Bilingual) */}
          {cfg.hasAddress && (
            <View style={fS.fg}>
              <Text style={fS.label}>Patient Address</Text>
              <TextInput style={fS.input} placeholder="e.g. San Jose, Main Street" placeholderTextColor="#94a3b8"
                value={patient.address || ''} onChangeText={v => upP('address', v)} autoCapitalize="words" />
            </View>
          )}

          {/* Patient Allergies (e.g. Bilingual Indian) */}
          {cfg.hasAllergies && (
            <View style={fS.fg}>
              <Text style={fS.label}>Allergies / एलर्जी</Text>
              <TextInput style={fS.input} placeholder="e.g. Penicillin, Sulfa, None" placeholderTextColor="#94a3b8"
                value={patient.allergies || ''} onChangeText={v => upP('allergies', v)} autoCapitalize="words" />
            </View>
          )}

          {/* Chief Complaint & Diagnosis Fields */}
          {cfg.hasChiefComplaint && cfg.hasDiagnosis ? (
            <View style={fS.row}>
              <View style={[fS.fg, { flex: 1 }]}>
                <Text style={fS.label}>{cfg.chiefComplaintLabel || 'Chief Complaint'}</Text>
                <TextInput style={[fS.input, fS.textarea]} placeholder="e.g. High fever, throat pain for 3 days..." placeholderTextColor="#94a3b8"
                  value={patient.chiefComplaint} onChangeText={v => upP('chiefComplaint', v)}
                  multiline numberOfLines={2} textAlignVertical="top" autoCapitalize="sentences" />
              </View>
              <View style={[fS.fg, { flex: 1 }]}>
                <Text style={fS.label}>{cfg.diagnosisLabel || 'Diagnosis'}</Text>
                <TextInput style={[fS.input, fS.textarea]} placeholder="e.g. Acute Viral Fever with Pharyngitis..." placeholderTextColor="#94a3b8"
                  value={patient.diagnosis} onChangeText={v => upP('diagnosis', v)}
                  multiline numberOfLines={2} textAlignVertical="top" autoCapitalize="sentences" />
              </View>
            </View>
          ) : cfg.hasDiagnosis ? (
            <View style={fS.fg}>
              <Text style={fS.label}>{cfg.diagnosisLabel || 'Diagnosis'}</Text>
              <TextInput style={[fS.input, fS.textarea]} placeholder="e.g. Clinical diagnosis..." placeholderTextColor="#94a3b8"
                value={patient.diagnosis} onChangeText={v => upP('diagnosis', v)}
                multiline numberOfLines={2} textAlignVertical="top" autoCapitalize="sentences" />
            </View>
          ) : cfg.hasChiefComplaint ? (
            <View style={fS.fg}>
              <Text style={fS.label}>{cfg.chiefComplaintLabel || 'Chief Complaint'}</Text>
              <TextInput style={[fS.input, fS.textarea]} placeholder="e.g. Chief complaint..." placeholderTextColor="#94a3b8"
                value={patient.chiefComplaint} onChangeText={v => upP('chiefComplaint', v)}
                multiline numberOfLines={2} textAlignVertical="top" autoCapitalize="sentences" />
            </View>
          ) : null}
        </View>

        {/* ── Recorded Vitals & Clinical Measurements Card (ONLY for templates that actually have vitals or OPD Ref) ── */}
        {(cfg.hasVitals || cfg.hasOpdRef) && (
          <View style={fS.card}>
            <View style={fS.cardHead}>
              <View style={[fS.cardIcon, { backgroundColor: '#ef444415' }]}>
                <Ionicons name="pulse-outline" size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={fS.cardTitle}>{cfg.hasVitals ? 'Recorded Vitals' : 'Hospital OPD Reference'}</Text>
                  <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#DBEAFE' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#1e40af' }}>{templateName}</Text>
                  </View>
                </View>
                <Text style={fS.cardSub}>
                  {cfg.hasVitals
                    ? 'Fills the clinical vitals table on your prescription'
                    : 'Fills the hospital registration / OPD slip reference'}
                </Text>
              </View>
            </View>

            {cfg.hasVitals && (
              <>
                {/* Row 1: BP, Pulse, Temp */}
                <View style={fS.row}>
                  {cfg.vitalsList?.includes('bp') && (
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
                  )}
                  {cfg.vitalsList?.includes('pulse') && (
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
                  )}
                  {cfg.vitalsList?.includes('temp') && (
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
                  )}
                </View>

                {/* Row 2: SpO2, Weight, Height */}
                <View style={fS.row}>
                  {cfg.vitalsList?.includes('spo2') && (
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
                  )}
                  {cfg.vitalsList?.includes('weight') && (
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
                  )}
                  {cfg.vitalsList?.includes('height') && (
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
                  )}
                </View>
              </>
            )}

            {/* OPD Ref Number */}
            {cfg.hasOpdRef && (
              <View style={fS.row}>
                <View style={[fS.fg, { flex: 1 }]}>
                  <Text style={fS.label}>{cfg.opdRefLabel || 'OPD Ref / Slip No.'}</Text>
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
            )}
          </View>
        )}

        {/* ── Quick Advice, Lab Tests & Follow-Up Card (Instant 1-Tap Prescription Presets) ── */}
        {(cfg.hasAdvice || cfg.hasInvestigations || cfg.hasFollowUp) && (
          <View style={fS.card}>
            <View style={fS.cardHead}>
              <View style={[fS.cardIcon, { backgroundColor: '#10b98115' }]}>
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={fS.cardTitle}>Advice, Lab Tests & Follow-Up</Text>
                  <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#a7f3d0' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#047857' }}>⚡ 1-Tap Fast Fill</Text>
                  </View>
                </View>
                <Text style={fS.cardSub}>Quick chips to fill your prescription in seconds</Text>
              </View>
            </View>

            {/* Follow-Up on */}
            {cfg.hasFollowUp && (
              <View style={fS.fg}>
                <Text style={fS.label}>Follow-up On / Next Visit</Text>
                <TextInput
                  style={fS.input}
                  placeholder="e.g. After 5 days / SOS"
                  placeholderTextColor="#94a3b8"
                  value={patient.followUp || ''}
                  onChangeText={v => upP('followUp', v)}
                />
                <View style={fS.chipWrap}>
                  {['+3 Days', '+5 Days', '+1 Week', '+2 Weeks', 'SOS (As Needed)', 'After Lab Reports'].map(chip => (
                    <Pressable
                      key={chip}
                      style={[fS.chip, patient.followUp === chip && fS.chipActive]}
                      onPress={() => upP('followUp', chip)}
                    >
                      <Text style={[fS.chipText, patient.followUp === chip && fS.chipTextActive]}>{chip}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Advice & Instructions */}
            {cfg.hasAdvice && (
              <View style={fS.fg}>
                <Text style={fS.label}>Advice & Instructions / सलाह</Text>
                <TextInput
                  style={[fS.input, fS.textarea]}
                  placeholder="e.g. Drink plenty of warm water, take rest..."
                  placeholderTextColor="#94a3b8"
                  value={patient.advice || ''}
                  onChangeText={v => upP('advice', v)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
                <View style={fS.chipWrap}>
                  {[
                    '💧 Plenty of fluids',
                    '🛌 Bed rest 3 days',
                    '🥗 Light & soft diet',
                    '🚫 Avoid oily/spicy',
                    '🥛 With warm water',
                    '🍲 Steam inhalation',
                  ].map(chip => {
                    const text = chip.replace(/^[^\s]+\s*/, '')
                    const isSelected = patient.advice?.includes(text)
                    return (
                      <Pressable
                        key={chip}
                        style={[fS.chip, isSelected && fS.chipActive]}
                        onPress={() => appendAdvice(text)}
                      >
                        <Text style={[fS.chipText, isSelected && fS.chipTextActive]}>
                          {chip}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Lab Investigations */}
            {cfg.hasInvestigations && (
              <View style={fS.fg}>
                <Text style={fS.label}>Investigations & Lab Tests / जाँच</Text>
                <TextInput
                  style={[fS.input, fS.textarea]}
                  placeholder="e.g. CBC, Urine Routine, Blood Sugar..."
                  placeholderTextColor="#94a3b8"
                  value={patient.investigations || ''}
                  onChangeText={v => upP('investigations', v)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
                <View style={fS.chipWrap}>
                  {[
                    '🩸 CBC',
                    '🧪 LFT & KFT',
                    '📉 Fasting Sugar (FBS)',
                    '🔬 Urine R/M',
                    '🫀 ECG',
                    '🩻 Chest X-Ray',
                  ].map(chip => {
                    const text = chip.replace(/^[^\s]+\s*/, '')
                    const isSelected = patient.investigations?.includes(text)
                    return (
                      <Pressable
                        key={chip}
                        style={[fS.chip, isSelected && fS.chipActive]}
                        onPress={() => appendInvestigations(text)}
                      >
                        <Text style={[fS.chipText, isSelected && fS.chipTextActive]}>
                          {chip}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}
          </View>
        )}

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
  activeTemplateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  activeTemplateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#155EEF' },
  activeTemplateText: { fontSize: 11, color: '#475569', fontWeight: '500', flex: 1 },
  fieldsCountChip: {
    backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  fieldsCountText: { fontSize: 9.5, fontWeight: '700', color: '#1e40af' },
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
  // Signature thumbnail & buttons
  sigSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sigHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sigLabel: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.2 },
  sigPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sigThumbWrap: { width: 90, height: 42, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', padding: 4, justifyContent: 'center', alignItems: 'center' },
  sigThumb: { width: '100%', height: '100%' },
  logoThumbWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#ffffff', padding: 2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoThumb: { width: '100%', height: '100%', borderRadius: 20 },
  sigCursiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', flex: 1 },
  sigCursiveText: { fontSize: 11.5, color: '#166534', fontWeight: '600', fontStyle: 'italic' },
  sigActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  sigActionBtnText: { fontSize: 11, fontWeight: '700', color: '#155EEF' },
  sigClearBtn: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },

  // Quick Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  chipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#1d4ed8', fontWeight: '700' },
})

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
  hint: { position: 'absolute', top: '52%', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' as any },
  hintIcon: { fontSize: 36, opacity: 0.1, marginBottom: 6 },
  hintText: { fontSize: 13, color: '#cbd5e1', fontStyle: 'italic', opacity: 0.5 },
  heightControlCard: {
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heightControlTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  heightControlSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  heightResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  heightResetText: { fontSize: 11, color: '#475569', fontWeight: '700' },
  heightAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#0f766e' },
  heightAddText: { fontSize: 12, color: '#ffffff', fontWeight: '800' },
  jumpNavPill: {
    position: 'absolute',
    top: 10,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172af0',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    zIndex: 40,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  jumpNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  jumpNavText: { fontSize: 10.5, color: '#e2e8f0', fontWeight: '700' },
  floatingAddSpacePill: {
    position: 'absolute',
    top: 10,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172af0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 40,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingAddSpaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  floatingAddSpaceText: {
    fontSize: 11,
    color: '#14b8a6',
    fontWeight: '800',
  },
})

const dockStyles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172af6',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 50,
  },
  dockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  dockItemText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  colorMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#334155',
    marginHorizontal: 1,
  },
  colorCircleBtn: {
    padding: 3,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  sizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  sizeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  minimizedFab: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172af6',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  minimizedInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  minimizedBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  minimizedBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  flyoutCard: {
    position: 'absolute',
    bottom: 64,
    alignSelf: 'center',
    backgroundColor: '#1e293bf8',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 60,
    maxWidth: 380,
  },
  flyoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  flyoutTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  flyoutColorItem: {
    alignItems: 'center',
    gap: 3,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'transparent',
  },
  flyoutColorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  flyoutColorText: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '600',
  },
  flyoutSizeItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1.2,
    borderColor: '#334155',
  },
  flyoutSizeText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  flyoutSizeSub: {
    fontSize: 7.5,
    color: '#64748b',
  },
})

const toolModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#1e293b',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  toolRow: {
    gap: 8,
    marginTop: 8,
  },
  toolChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  toolChoiceActive: {
    borderColor: '#14b8a6',
    backgroundColor: '#0f766e18',
  },
  toolChoiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  toolChoiceSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  colorItem: {
    alignItems: 'center',
    gap: 4,
    width: 42,
    padding: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  widthGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  widthCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 3,
  },
  widthLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  widthSub: {
    fontSize: 8,
    color: '#64748b',
  },
  previewBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  previewCanvas: {
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewMeta: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    shadowColor: '#0f766e',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
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

// ── STEP 2: Canvas ────────────────────────────────────────────────────────────
function CanvasStep({
  doctor, patient, onEditInfo, templateColor, selectedTemplate
}: {
  doctor: DoctorForm; patient: PatientForm; onEditInfo: () => void
  templateColor: string
  selectedTemplate: SelectedTemplate | null
}) {
  const TOP_BAR_H = Platform.OS === 'ios' ? 44 : 42
  const SUB_BAR_H = 46
  const BOTTOM_INSET = Platform.OS === 'ios' ? 40 : 16

  const [pageHeightMultiplier, setPageHeightMultiplier] = useState(1.0)
  const [autoExpand, setAutoExpand] = useState(true)
  const [autoExpandToast, setAutoExpandToast] = useState<{ message: string; sub?: string } | null>(null)
  const toastTimeoutRef = useRef<any>(null)
  const scrollRef = useRef<ScrollView>(null)

  const strokeMaxYRef = useRef(0)
  const strokeMinYRef = useRef(0)
  const strokeMinXRef = useRef(0)
  const strokeMaxXRef = useRef(0)

  const pageHeightMultiplierRef = useRef(pageHeightMultiplier)
  useEffect(() => {
    pageHeightMultiplierRef.current = pageHeightMultiplier
  }, [pageHeightMultiplier])

  const autoExpandRef = useRef(autoExpand)
  useEffect(() => {
    autoExpandRef.current = autoExpand
  }, [autoExpand])

  const triggerToast = useCallback((message: string, sub?: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setAutoExpandToast({ message, sub })
    toastTimeoutRef.current = setTimeout(() => {
      setAutoExpandToast(null)
    }, 2800)
  }, [])

  // Standard A4 aspect ratio (210mm x 297mm = 794 / 1123 = 0.70703)
  // Full-width canvas: No permanent sidebar eating screen width!
  const availW = Math.max(280, SW - 16)
  const availH = Math.max(380, SH - TOP_BAR_H - SUB_BAR_H - BOTTOM_INSET)
  const A4_ASPECT = 794 / 1123

  let baseCW = availW
  let baseCH = Math.round(baseCW / A4_ASPECT)
  if (baseCH > availH) {
    baseCH = availH
    baseCW = Math.round(baseCH * A4_ASPECT)
  }

  const CW = baseCW
  const CH = Math.round(baseCH * pageHeightMultiplier)

  const handleAddSpace = useCallback((delta = 0.25) => {
    setPageHeightMultiplier(prev => {
      const next = Math.min(3.0, Number((prev + delta).toFixed(2)))
      if (next > prev) {
        triggerToast(`📄 Template Height: ${(next * 100).toFixed(0)}%`, `+${Math.round((next - 1.0) * 100)}% medicine space added`)
      }
      return next
    })
  }, [triggerToast])

  const handleResetSpace = useCallback(() => {
    setPageHeightMultiplier(1.0)
    triggerToast('📄 Reset to Standard A4 (100%)', 'Single-page prescription')
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }, 120)
  }, [triggerToast])

  const [paths, setPaths] = useState<DrawnPath[]>([])
  const [livePath, setLivePath] = useState<DrawnPath | null>(null)
  const [saving, setSaving] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showToolsModal, setShowToolsModal] = useState(false)
  const [isDockMinimized, setIsDockMinimized] = useState(false)
  const [activeFlyout, setActiveFlyout] = useState<'none' | 'color' | 'size'>('none')
  const [tool, setTool] = useState<Tool>('pen')
  const [penColor, setPenColor] = useState('#0f172a')
  const [penWidth, setPenWidth] = useState(3)
  const [redoStack, setRedoStack] = useState<DrawnPath[]>([])

  const penColorRef = useRef('#0f172a')
  const penWidthRef = useRef(3)
  const toolRef = useRef<Tool>('pen')
  const currentPathStr = useRef('')
  const isDrawing = useRef(false)

  const setColor = useCallback((c: string) => { penColorRef.current = c; setPenColor(c) }, [])
  const setWidth = useCallback((w: number) => { penWidthRef.current = w; setPenWidth(w) }, [])
  const setActiveTool = useCallback((t: Tool) => { toolRef.current = t; setTool(t) }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // When Hand/Scroll tool is active, let native ScrollView handle scrolling
        if (toolRef.current === 'hand') return false
        // Allow native 2-finger scroll/pinch gestures without drawing accidental strokes
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length > 1) return false
        return true
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (toolRef.current === 'hand') return false
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length > 1) return false
        return Math.abs(gestureState.dx) > 0.5 || Math.abs(gestureState.dy) > 0.5
      },
      onShouldBlockNativeResponder: () => toolRef.current !== 'hand',
      onPanResponderGrant: (evt) => {
        if (toolRef.current === 'hand') return
        setActiveFlyout('none')
        const { locationX, locationY } = evt.nativeEvent
        strokeMaxYRef.current = locationY
        strokeMinYRef.current = locationY
        strokeMinXRef.current = locationX
        strokeMaxXRef.current = locationX
        const d = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`
        currentPathStr.current = d
        isDrawing.current = true
        const isE = toolRef.current === 'eraser'
        setLivePath({ d, color: isE ? '#ffffff' : penColorRef.current, width: isE ? 20 : penWidthRef.current })
      },
      onPanResponderMove: (evt) => {
        if (!isDrawing.current || toolRef.current === 'hand') return
        const { locationX, locationY } = evt.nativeEvent
        if (locationY > strokeMaxYRef.current) strokeMaxYRef.current = locationY
        if (locationY < strokeMinYRef.current) strokeMinYRef.current = locationY
        if (locationX < strokeMinXRef.current) strokeMinXRef.current = locationX
        if (locationX > strokeMaxXRef.current) strokeMaxXRef.current = locationX
        currentPathStr.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`
        const isE = toolRef.current === 'eraser'
        setLivePath({ d: currentPathStr.current, color: isE ? '#ffffff' : penColorRef.current, width: isE ? 20 : penWidthRef.current })
      },
      onPanResponderRelease: () => {
        if (!isDrawing.current || toolRef.current === 'hand') return
        isDrawing.current = false
        // ⚠️ Capture values NOW before resetting refs.
        // setPaths uses a functional updater that runs asynchronously,
        // so if we reset currentPathStr.current before it runs,
        // the updater would read an empty string and commit a blank stroke.
        const capturedPath = currentPathStr.current
        const capturedColor = penColorRef.current
        const capturedWidth = penWidthRef.current
        const capturedIsEraser = toolRef.current === 'eraser'
        const capturedMaxY = strokeMaxYRef.current
        const capturedMinX = strokeMinXRef.current
        const capturedMinY = strokeMinYRef.current
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

          // ── Auto-Expand Space for Medicines when writing near bottom ──
          if (!capturedIsEraser && autoExpandRef.current && toolRef.current === 'pen') {
            const currentMult = pageHeightMultiplierRef.current
            const currentCH = Math.round(baseCH * currentMult)
            const baseH = Math.min(currentCH, Math.round(CW * (1123 / 794)))
            // Zone where footer & signature begins (bottom ~19% of base page)
            const writingLimitY = currentCH - Math.round(baseH * 0.19)
            // Skip auto-expand if user is just signing in bottom-right signature block
            const isSignatureZone =
              capturedMinX > CW * 0.55 &&
              capturedMinY > currentCH - Math.round(baseH * 0.16)

            if (!isSignatureZone && capturedMaxY > writingLimitY && currentMult < 3.0) {
              const nextMult = Math.min(3.0, Number((currentMult + 0.25).toFixed(2)))
              setPageHeightMultiplier(nextMult)
              triggerToast(
                `✨ Auto-Expanded: +25% Space for Medicines!`,
                `Page height increased to ${(nextMult * 100).toFixed(0)}%`
              )
              setTimeout(() => {
                scrollRef.current?.scrollTo({
                  y: Math.max(0, capturedMaxY - 120),
                  animated: true,
                })
              }, 100)
            }
          }
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
            } catch (_) { }
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
          {/* Quick Tools Pop-up Trigger Button */}
          <Pressable
            style={[
              cS.subBarBtn,
              {
                backgroundColor: tool === 'eraser' ? '#f59e0b' : tool === 'hand' ? '#2563eb' : '#0f766e',
                paddingHorizontal: 10,
                borderColor: 'rgba(255,255,255,0.25)',
                borderWidth: 1,
              }
            ]}
            onPress={() => setShowToolsModal(true)}
          >
            <View style={{
              width: 9,
              height: 9,
              borderRadius: 4.5,
              backgroundColor: tool === 'eraser' ? '#ffffff' : tool === 'hand' ? '#93c5fd' : penColor,
              borderWidth: 1,
              borderColor: '#ffffff',
            }} />
            <Ionicons name={tool === 'eraser' ? 'color-wand-outline' : tool === 'hand' ? 'hand-left-outline' : 'pencil'} size={14} color="#fff" />
            <Text style={[cS.subBarText, { color: '#fff', fontWeight: '800' }]}>
              {tool === 'eraser' ? 'Eraser' : tool === 'hand' ? 'Scroll / Pan' : `${PEN_COLOR_NAMES[penColor] || 'Pen'} (${penWidth}px)`}
            </Text>
            <Ionicons name="options-outline" size={13} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} />
          </Pressable>

          {/* Page Height Stepper Pill */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#0f172a',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: pageHeightMultiplier > 1.0 ? '#14b8a6' : '#334155',
            paddingHorizontal: 4,
            paddingVertical: 3,
            gap: 2,
          }}>
            <Pressable
              style={{ paddingHorizontal: 5, paddingVertical: 2, opacity: pageHeightMultiplier <= 1.0 ? 0.35 : 1 }}
              disabled={pageHeightMultiplier <= 1.0}
              onPress={() => setPageHeightMultiplier(prev => Math.max(1.0, Number((prev - 0.25).toFixed(2))))}
              hitSlop={6}
            >
              <Ionicons name="remove" size={14} color="#94a3b8" />
            </Pressable>
            <Pressable
              onPress={() => setShowToolsModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4 }}
            >
              <Ionicons name="resize-outline" size={13} color={pageHeightMultiplier > 1.0 ? '#14b8a6' : '#94a3b8'} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: pageHeightMultiplier > 1.0 ? '#14b8a6' : '#cbd5e1' }}>
                {(pageHeightMultiplier * 100).toFixed(0)}%
              </Text>
            </Pressable>
            <Pressable
              style={{ paddingHorizontal: 5, paddingVertical: 2, opacity: pageHeightMultiplier >= 3.0 ? 0.35 : 1 }}
              disabled={pageHeightMultiplier >= 3.0}
              onPress={() => handleAddSpace(0.25)}
              hitSlop={6}
            >
              <Ionicons name="add" size={14} color="#94a3b8" />
            </Pressable>
          </View>

          <View style={cS.subBarDivider} />

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

      {/* Main Workspace (Full-Width Canvas with Vertical ScrollView + Smart Mobile Floating Tool Dock) */}
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Floating Auto-Expand Toast Notification */}
        {autoExpandToast && (
          <View style={{
            position: 'absolute',
            top: tool === 'hand' ? 52 : 12,
            alignSelf: 'center',
            backgroundColor: '#0f172af6',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 24,
            zIndex: 60,
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
            borderWidth: 1.5,
            borderColor: '#14b8a6',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <Ionicons name="sparkles" size={16} color="#14b8a6" />
            <View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>
                {autoExpandToast.message}
              </Text>
              {autoExpandToast.sub && (
                <Text style={{ fontSize: 10, fontWeight: '500', color: '#94a3b8' }}>
                  {autoExpandToast.sub}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => setAutoExpandToast(null)}
              hitSlop={8}
              style={{ marginLeft: 6, padding: 2 }}
            >
              <Ionicons name="close-circle" size={16} color="#64748b" />
            </Pressable>
          </View>
        )}

        {/* Scroll Mode Active Floating Banner */}
        {tool === 'hand' && (
          <View style={{
            position: 'absolute',
            top: 10,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#1d4ed8f2',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
            zIndex: 45,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Ionicons name="hand-left" size={14} color="#ffffff" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
              Scroll Mode: Drag canvas to scroll up &amp; down
            </Text>
            <Pressable
              style={{ marginLeft: 4, backgroundColor: '#ffffff28', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}
              onPress={() => setActiveTool('pen')}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Pen ✍️</Text>
            </Pressable>
          </View>
        )}

        {/* Floating Quick Add Space & Auto-Expand Indicator */}
        <View style={cS.floatingAddSpacePill}>
          <Pressable
            style={cS.floatingAddSpaceBtn}
            onPress={() => handleAddSpace(0.25)}
            disabled={pageHeightMultiplier >= 3.0}
            hitSlop={4}
          >
            <Ionicons name="add-circle" size={14} color="#14b8a6" />
            <Text style={cS.floatingAddSpaceText}>
              +25% Space ({(pageHeightMultiplier * 100).toFixed(0)}%)
            </Text>
          </Pressable>
          {autoExpand && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 6, borderLeftWidth: 1, borderLeftColor: '#334155' }}>
              <Ionicons name="flash" size={11} color="#f59e0b" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#f59e0b' }}>Auto</Text>
            </View>
          )}
        </View>

        {/* Quick Jump (Top / Bottom) floating button when page is extended */}
        {pageHeightMultiplier > 1.0 && (
          <View style={cS.jumpNavPill}>
            <Pressable
              style={cS.jumpNavBtn}
              onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            >
              <Ionicons name="arrow-up" size={12} color="#14b8a6" />
              <Text style={cS.jumpNavText}>Top</Text>
            </Pressable>
            <View style={{ width: 1, height: 12, backgroundColor: '#334155' }} />
            <Pressable
              style={cS.jumpNavBtn}
              onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              <Ionicons name="arrow-down" size={12} color="#14b8a6" />
              <Text style={cS.jumpNavText}>Bottom</Text>
            </Pressable>
          </View>
        )}

        {/* Canvas Workspace wrapped in ScrollView for smooth 60fps vertical scrolling */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: '#0f172a08' }}
          contentContainerStyle={{
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 10,
            paddingHorizontal: 8,
            paddingBottom: 110, // Leave comfortable room for bottom floating dock
          }}
          showsVerticalScrollIndicator={true}
          bounces={true}
          nestedScrollEnabled={true}
        >
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

          {/* Under-Sheet Page Height Expander Banner */}
          <View style={[cS.heightControlCard, { width: CW }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={cS.heightControlTitle}>
                    📄 Canvas Height: {(pageHeightMultiplier * 100).toFixed(0)}%
                  </Text>
                  {pageHeightMultiplier > 1.0 && (
                    <View style={{ backgroundColor: '#0f766e20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#0f766e' }}>
                        +{(Math.round((pageHeightMultiplier - 1.0) * 100))}% Extra Space
                      </Text>
                    </View>
                  )}
                  {autoExpand && (
                    <View style={{ backgroundColor: '#f59e0b20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="flash" size={10} color="#f59e0b" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#f59e0b' }}>
                        Auto-Expand ON
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={cS.heightControlSub}>
                  {pageHeightMultiplier === 1.0
                    ? 'Standard single A4 page · Writing near the bottom automatically expands height for more medicines'
                    : 'Extra writing space active · Drag with 🖐️ Scroll tool or 2 fingers to scroll up & down'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {pageHeightMultiplier > 1.0 && (
                  <Pressable
                    style={cS.heightResetBtn}
                    onPress={handleResetSpace}
                  >
                    <Ionicons name="refresh" size={13} color="#475569" />
                    <Text style={cS.heightResetText}>Reset 1.0x</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[cS.heightAddBtn, pageHeightMultiplier >= 3.0 && { opacity: 0.5 }]}
                  disabled={pageHeightMultiplier >= 3.0}
                  onPress={() => handleAddSpace(0.25)}
                >
                  <Ionicons name="add-circle" size={15} color="#ffffff" />
                  <Text style={cS.heightAddText}>+25% Space</Text>
                </Pressable>
                <Pressable
                  style={[cS.heightAddBtn, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }, pageHeightMultiplier >= 3.0 && { opacity: 0.5 }]}
                  disabled={pageHeightMultiplier >= 3.0}
                  onPress={() => handleAddSpace(0.50)}
                >
                  <Ionicons name="add-circle-outline" size={14} color="#14b8a6" />
                  <Text style={[cS.heightAddText, { color: '#14b8a6' }]}>+50% Space</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Quick Color Palette Flyout (Floats right above dock) ── */}
        {activeFlyout === 'color' && !isDockMinimized && (
          <View style={dockStyles.flyoutCard}>
            <View style={dockStyles.flyoutHeader}>
              <Text style={dockStyles.flyoutTitle}>SELECT INK COLOR</Text>
              <Pressable onPress={() => setActiveFlyout('none')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {PEN_COLORS.map(c => {
                const isActive = penColor === c
                return (
                  <Pressable
                    key={c}
                    style={[
                      dockStyles.flyoutColorItem,
                      isActive && { borderColor: '#ffffff', transform: [{ scale: 1.08 }] }
                    ]}
                    onPress={() => {
                      setColor(c)
                      if (tool !== 'pen') setActiveTool('pen')
                      setActiveFlyout('none')
                    }}
                  >
                    <View style={[dockStyles.flyoutColorDot, { backgroundColor: c }]}>
                      {isActive && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                    </View>
                    <Text style={[dockStyles.flyoutColorText, isActive && { color: '#ffffff', fontWeight: '800' }]}>
                      {PEN_COLOR_NAMES[c] || c}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Quick Size Thickness Flyout (Floats right above dock) ── */}
        {activeFlyout === 'size' && !isDockMinimized && (
          <View style={dockStyles.flyoutCard}>
            <View style={dockStyles.flyoutHeader}>
              <Text style={dockStyles.flyoutTitle}>SELECT PEN THICKNESS</Text>
              <Pressable onPress={() => setActiveFlyout('none')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
              {PEN_WIDTHS.map(w => {
                const isActive = penWidth === w
                return (
                  <Pressable
                    key={w}
                    style={[
                      dockStyles.flyoutSizeItem,
                      isActive && { borderColor: '#14b8a6', backgroundColor: '#0f766e25' }
                    ]}
                    onPress={() => {
                      setWidth(w)
                      if (tool !== 'pen') setActiveTool('pen')
                      setActiveFlyout('none')
                    }}
                  >
                    <View style={{ height: 18, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ width: Math.min(w * 1.8, 20), height: Math.min(w * 1.8, 20), borderRadius: 99, backgroundColor: isActive ? '#14b8a6' : '#94a3b8' }} />
                    </View>
                    <Text style={[dockStyles.flyoutSizeText, isActive && { color: '#ffffff', fontWeight: '800' }]}>
                      {w}px
                    </Text>
                    <Text style={dockStyles.flyoutSizeSub}>
                      {PEN_WIDTH_LABELS[w] || ''}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* ── Smart Mobile Floating Tool Dock ── */}
        {isDockMinimized ? (
          /* Minimized State: Sleek Corner Floating FAB */
          <Pressable
            style={dockStyles.minimizedFab}
            onPress={() => setIsDockMinimized(false)}
          >
            <View style={[
              dockStyles.minimizedInner,
              { backgroundColor: tool === 'eraser' ? '#f59e0b' : tool === 'hand' ? '#2563eb' : penColor }
            ]}>
              <Ionicons name={tool === 'eraser' ? 'color-wand' : tool === 'hand' ? 'hand-left' : 'pencil'} size={15} color="#ffffff" />
            </View>
            <View style={dockStyles.minimizedBadge}>
              <Text style={dockStyles.minimizedBadgeText}>
                {tool === 'eraser' ? 'E' : tool === 'hand' ? 'S' : `${penWidth}`}
              </Text>
            </View>
          </Pressable>
        ) : (
          /* Expanded Compact Dock: Ergonomic Bottom Pill */
          <View style={dockStyles.dockContainer}>
            {/* 1. Pen Tool Button */}
            <Pressable
              style={[
                dockStyles.dockItem,
                tool === 'pen' && { backgroundColor: `${penColor}22`, borderColor: penColor }
              ]}
              onPress={() => {
                if (tool === 'pen') {
                  setActiveFlyout(prev => prev === 'color' ? 'none' : 'color')
                } else {
                  setActiveTool('pen')
                  setActiveFlyout('none')
                }
              }}
            >
              <View style={[
                dockStyles.colorMiniDot,
                { backgroundColor: penColor }
              ]} />
              <Ionicons
                name="pencil"
                size={15}
                color={tool === 'pen' ? '#ffffff' : '#94a3b8'}
              />
              <Text style={[
                dockStyles.dockItemText,
                tool === 'pen' && { color: '#ffffff', fontWeight: '800' }
              ]}>
                Pen
              </Text>
            </Pressable>

            {/* 2. Eraser Tool Button */}
            <Pressable
              style={[
                dockStyles.dockItem,
                tool === 'eraser' && { backgroundColor: '#f59e0b25', borderColor: '#f59e0b' }
              ]}
              onPress={() => {
                setActiveTool('eraser')
                setActiveFlyout('none')
              }}
            >
              <Ionicons
                name="color-wand-outline"
                size={15}
                color={tool === 'eraser' ? '#f59e0b' : '#94a3b8'}
              />
              <Text style={[
                dockStyles.dockItemText,
                tool === 'eraser' && { color: '#f59e0b', fontWeight: '800' }
              ]}>
                Erase
              </Text>
            </Pressable>

            {/* 3. Hand / Scroll Tool Button */}
            <Pressable
              style={[
                dockStyles.dockItem,
                tool === 'hand' && { backgroundColor: '#3b82f625', borderColor: '#3b82f6' }
              ]}
              onPress={() => {
                setActiveTool('hand')
                setActiveFlyout('none')
              }}
            >
              <Ionicons
                name="hand-left-outline"
                size={15}
                color={tool === 'hand' ? '#3b82f6' : '#94a3b8'}
              />
              <Text style={[
                dockStyles.dockItemText,
                tool === 'hand' && { color: '#3b82f6', fontWeight: '800' }
              ]}>
                Scroll
              </Text>
            </Pressable>

            <View style={dockStyles.divider} />

            {/* 3. Color Picker Flyout Trigger */}
            <Pressable
              style={[
                dockStyles.colorCircleBtn,
                activeFlyout === 'color' && { borderColor: '#14b8a6', transform: [{ scale: 1.1 }] }
              ]}
              onPress={() => {
                if (tool !== 'pen') setActiveTool('pen')
                setActiveFlyout(prev => prev === 'color' ? 'none' : 'color')
              }}
            >
              <View style={[dockStyles.colorSwatch, { backgroundColor: penColor }]} />
            </Pressable>

            {/* 4. Stroke Size Flyout Trigger */}
            <Pressable
              style={[
                dockStyles.sizeBtn,
                activeFlyout === 'size' && { borderColor: '#14b8a6', backgroundColor: '#0f766e25' }
              ]}
              onPress={() => {
                if (tool !== 'pen') setActiveTool('pen')
                setActiveFlyout(prev => prev === 'size' ? 'none' : 'size')
              }}
            >
              <View style={{ width: Math.min(penWidth * 1.5, 14), height: Math.min(penWidth * 1.5, 14), borderRadius: 99, backgroundColor: '#ffffff' }} />
              <Text style={dockStyles.sizeBtnText}>{penWidth}px</Text>
            </Pressable>

            <View style={dockStyles.divider} />

            {/* 5. Direct 1-Tap Undo */}
            <Pressable
              style={[dockStyles.iconActionBtn, !paths.length && { opacity: 0.35 }]}
              onPress={handleUndo}
              disabled={!paths.length}
            >
              <Ionicons name="arrow-undo-outline" size={15} color="#cbd5e1" />
            </Pressable>

            {/* 6. Direct 1-Tap Redo */}
            <Pressable
              style={[dockStyles.iconActionBtn, !redoStack.length && { opacity: 0.35 }]}
              onPress={handleRedo}
              disabled={!redoStack.length}
            >
              <Ionicons name="arrow-redo-outline" size={15} color="#cbd5e1" />
            </Pressable>

            <View style={dockStyles.divider} />

            {/* 7. Full Settings Modal Button */}
            <Pressable
              style={dockStyles.iconActionBtn}
              onPress={() => {
                setActiveFlyout('none')
                setShowToolsModal(true)
              }}
            >
              <Ionicons name="options-outline" size={16} color="#94a3b8" />
            </Pressable>

            {/* 8. Minimize Button */}
            <Pressable
              style={dockStyles.minimizeBtn}
              onPress={() => {
                setActiveFlyout('none')
                setIsDockMinimized(true)
              }}
            >
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Advance Pen & Tools Pop-up Modal */}
      <Modal
        visible={showToolsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowToolsModal(false)}
      >
        <Pressable style={toolModalStyles.overlay} onPress={() => setShowToolsModal(false)}>
          <Pressable style={toolModalStyles.card} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={toolModalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[toolModalStyles.iconCircle, { backgroundColor: tool === 'eraser' ? '#f59e0b20' : tool === 'hand' ? '#2563eb20' : '#0f766e20' }]}>
                  <Ionicons name={tool === 'eraser' ? 'color-wand' : tool === 'hand' ? 'hand-left' : 'brush'} size={22} color={tool === 'eraser' ? '#f59e0b' : tool === 'hand' ? '#2563eb' : '#0f766e'} />
                </View>
                <View>
                  <Text style={toolModalStyles.title}>Drawing &amp; Canvas Settings</Text>
                  <Text style={toolModalStyles.subtitle}>
                    Active: {tool === 'eraser' ? 'Eraser Mode (20px)' : tool === 'hand' ? 'Scroll / Pan Mode' : `${PEN_COLOR_NAMES[penColor] || 'Custom'} Pen (${penWidth}px)`}
                  </Text>
                </View>
              </View>
              <Pressable style={toolModalStyles.closeBtn} onPress={() => setShowToolsModal(false)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingVertical: 4 }}>
              {/* 1. Tool Selection (Pen vs Eraser vs Hand) */}
              <View style={toolModalStyles.section}>
                <Text style={toolModalStyles.sectionTitle}>SELECT TOOL</Text>
                <View style={toolModalStyles.toolRow}>
                  <Pressable
                    style={[toolModalStyles.toolChoice, tool === 'pen' && toolModalStyles.toolChoiceActive]}
                    onPress={() => setActiveTool('pen')}
                  >
                    <View style={[toolModalStyles.toolChoiceIcon, { backgroundColor: tool === 'pen' ? '#0f766e' : '#334155' }]}>
                      <Ionicons name="pencil" size={18} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[toolModalStyles.toolChoiceText, tool === 'pen' && { color: '#ffffff', fontWeight: '800' }]}>
                        Ballpoint Pen
                      </Text>
                      <Text style={toolModalStyles.toolChoiceSub}>
                        Smooth ink writing with responsive strokes
                      </Text>
                    </View>
                    {tool === 'pen' && <Ionicons name="checkmark-circle" size={20} color="#14b8a6" />}
                  </Pressable>

                  <Pressable
                    style={[toolModalStyles.toolChoice, tool === 'eraser' && { ...toolModalStyles.toolChoiceActive, borderColor: '#f59e0b', backgroundColor: '#f59e0b15' }]}
                    onPress={() => setActiveTool('eraser')}
                  >
                    <View style={[toolModalStyles.toolChoiceIcon, { backgroundColor: tool === 'eraser' ? '#f59e0b' : '#334155' }]}>
                      <Ionicons name="color-wand-outline" size={18} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[toolModalStyles.toolChoiceText, tool === 'eraser' && { color: '#ffffff', fontWeight: '800' }]}>
                        Eraser
                      </Text>
                      <Text style={toolModalStyles.toolChoiceSub}>
                        Remove strokes &amp; corrections
                      </Text>
                    </View>
                    {tool === 'eraser' && <Ionicons name="checkmark-circle" size={20} color="#f59e0b" />}
                  </Pressable>

                  <Pressable
                    style={[toolModalStyles.toolChoice, tool === 'hand' && { ...toolModalStyles.toolChoiceActive, borderColor: '#3b82f6', backgroundColor: '#3b82f618' }]}
                    onPress={() => setActiveTool('hand')}
                  >
                    <View style={[toolModalStyles.toolChoiceIcon, { backgroundColor: tool === 'hand' ? '#3b82f6' : '#334155' }]}>
                      <Ionicons name="hand-left-outline" size={18} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[toolModalStyles.toolChoiceText, tool === 'hand' && { color: '#ffffff', fontWeight: '800' }]}>
                        Hand / Pan Tool
                      </Text>
                      <Text style={toolModalStyles.toolChoiceSub}>
                        Drag anywhere to scroll canvas up and down
                      </Text>
                    </View>
                    {tool === 'hand' && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
                  </Pressable>
                </View>
              </View>

              {/* 2. Prescription Page Height & Canvas Space */}
              <View style={toolModalStyles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={toolModalStyles.sectionTitle}>PAGE HEIGHT &amp; WRITING SPACE</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#14b8a6' }}>
                    {(pageHeightMultiplier * 100).toFixed(0)}% ({pageHeightMultiplier === 1.0 ? 'Standard A4' : `+${Math.round((pageHeightMultiplier - 1.0) * 100)}% Space`})
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { label: '1.0x Standard', val: 1.0 },
                    { label: '1.25x (+25%)', val: 1.25 },
                    { label: '1.5x (+50%)', val: 1.5 },
                    { label: '1.75x (+75%)', val: 1.75 },
                    { label: '2.0x (Double)', val: 2.0 },
                    { label: '2.5x (Large)', val: 2.5 },
                    { label: '3.0x (Max Rx)', val: 3.0 },
                  ].map(item => {
                    const isActive = pageHeightMultiplier === item.val
                    return (
                      <Pressable
                        key={item.val}
                        style={[
                          toolModalStyles.actionBtn,
                          { flex: 1, minWidth: '30%', paddingVertical: 8 },
                          isActive && { borderColor: '#14b8a6', backgroundColor: '#0f766e25' }
                        ]}
                        onPress={() => {
                          setPageHeightMultiplier(item.val)
                          triggerToast(`📄 Template Height: ${(item.val * 100).toFixed(0)}%`)
                        }}
                      >
                        <Text style={[toolModalStyles.actionBtnText, isActive && { color: '#ffffff', fontWeight: '800' }]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                {/* Auto-Expand Switch */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                  backgroundColor: '#0f172a',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: autoExpand ? '#14b8a640' : '#334155',
                }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="flash" size={13} color={autoExpand ? '#f59e0b' : '#94a3b8'} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#f8fafc' }}>
                        Auto-Expand for Medicines
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      Automatically adds +25% space when writing near the bottom
                    </Text>
                  </View>
                  <Switch
                    value={autoExpand}
                    onValueChange={(val) => {
                      setAutoExpand(val)
                      triggerToast(val ? '⚡ Auto-Expand Enabled' : 'Auto-Expand Disabled')
                    }}
                    trackColor={{ false: '#334155', true: '#0f766e' }}
                    thumbColor={autoExpand ? '#14b8a6' : '#94a3b8'}
                  />
                </View>
              </View>

              {/* 2. Ink Color Palette (Only when Pen is active) */}
              {tool === 'pen' && (
                <View style={toolModalStyles.section}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={toolModalStyles.sectionTitle}>INK COLOR PALETTE</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: penColor }}>
                      {PEN_COLOR_NAMES[penColor] || penColor}
                    </Text>
                  </View>
                  <View style={toolModalStyles.colorGrid}>
                    {PEN_COLORS.map(c => {
                      const isActive = penColor === c
                      return (
                        <Pressable
                          key={c}
                          style={[
                            toolModalStyles.colorItem,
                            isActive && { borderColor: '#ffffff', transform: [{ scale: 1.08 }] }
                          ]}
                          onPress={() => setColor(c)}
                        >
                          <View style={[toolModalStyles.colorCircle, { backgroundColor: c }]}>
                            {isActive && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                          </View>
                          <Text style={[toolModalStyles.colorLabel, isActive && { color: '#ffffff', fontWeight: '700' }]}>
                            {PEN_COLOR_NAMES[c] || c}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* 3. Stroke Thickness (Size) */}
              {tool === 'pen' && (
                <View style={toolModalStyles.section}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={toolModalStyles.sectionTitle}>STROKE THICKNESS</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#14b8a6' }}>
                      {penWidth} px ({PEN_WIDTH_LABELS[penWidth] || 'Custom'})
                    </Text>
                  </View>
                  <View style={toolModalStyles.widthGrid}>
                    {PEN_WIDTHS.map(w => {
                      const isActive = penWidth === w
                      return (
                        <Pressable
                          key={w}
                          style={[
                            toolModalStyles.widthCard,
                            isActive && { borderColor: '#14b8a6', backgroundColor: '#0f766e25' }
                          ]}
                          onPress={() => setWidth(w)}
                        >
                          <View style={{ height: 26, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <View style={{ width: Math.min(w * 2.2, 28), height: Math.min(w * 2.2, 28), borderRadius: 99, backgroundColor: isActive ? '#14b8a6' : '#94a3b8' }} />
                          </View>
                          <Text style={[toolModalStyles.widthLabel, isActive && { color: '#ffffff', fontWeight: '800' }]}>
                            {w}px
                          </Text>
                          <Text style={toolModalStyles.widthSub}>
                            {PEN_WIDTH_LABELS[w] || ''}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* 4. Live Stroke Preview Box */}
              {tool === 'pen' && (
                <View style={toolModalStyles.previewBox}>
                  <Text style={toolModalStyles.previewLabel}>LIVE STROKE PREVIEW</Text>
                  <View style={toolModalStyles.previewCanvas}>
                    <Svg width="100%" height={40} viewBox="0 0 280 40">
                      <Path
                        d="M 20 20 Q 80 5 140 20 T 260 20"
                        stroke={penColor}
                        strokeWidth={penWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text style={toolModalStyles.previewMeta}>
                    {PEN_COLOR_NAMES[penColor] || 'Custom'} Ink · {penWidth}px thickness · Authentic Prescription Flow
                  </Text>
                </View>
              )}

              {/* 5. Quick Actions Row (Undo, Redo, Clear) */}
              <View style={toolModalStyles.section}>
                <Text style={toolModalStyles.sectionTitle}>QUICK ACTIONS</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    style={[toolModalStyles.actionBtn, !paths.length && { opacity: 0.4 }]}
                    onPress={handleUndo}
                    disabled={!paths.length}
                  >
                    <Ionicons name="arrow-undo-outline" size={16} color="#94a3b8" />
                    <Text style={toolModalStyles.actionBtnText}>Undo</Text>
                  </Pressable>
                  <Pressable
                    style={[toolModalStyles.actionBtn, !redoStack.length && { opacity: 0.4 }]}
                    onPress={handleRedo}
                    disabled={!redoStack.length}
                  >
                    <Ionicons name="arrow-redo-outline" size={16} color="#94a3b8" />
                    <Text style={toolModalStyles.actionBtnText}>Redo</Text>
                  </Pressable>
                  <Pressable
                    style={[toolModalStyles.actionBtn, { borderColor: '#ef444440', backgroundColor: '#ef444415' }, !paths.length && { opacity: 0.4 }]}
                    onPress={() => {
                      handleClear()
                      setShowToolsModal(false)
                    }}
                    disabled={!paths.length}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[toolModalStyles.actionBtnText, { color: '#ef4444' }]}>Clear All</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Footer: Done Button */}
            <Pressable style={toolModalStyles.doneBtn} onPress={() => setShowToolsModal(false)}>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={toolModalStyles.doneBtnText}>Apply &amp; Continue Writing</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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

// ── Root ──────────────────────────────────────────────────────────────────────
export default function TabletMode() {
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate>({
    id: MOBILE_TEMPLATES[0].id,
    name: MOBILE_TEMPLATES[0].name,
    emoji: MOBILE_TEMPLATES[0].emoji,
    primaryColor: MOBILE_TEMPLATES[0].styles.primaryColor,
    accentColor: MOBILE_TEMPLATES[0].styles.accentColor,
  })
  const [showTestModal, setShowTestModal] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [doctor, setDoctor] = useState<DoctorForm>({
    doctorName: '', qualification: '', clinicName: '', clinicAddress: '', phone: '',
  })
  const [patient, setPatient] = useState<PatientForm>({
    patientName: '', age: '', sex: 'Male',
    date: new Date().toLocaleDateString('en-IN'),
    chiefComplaint: '', diagnosis: '',
    advice: '', investigations: '', followUp: '',
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
          signature: p.signature || '',
          stampUrl: p.stampUrl || '',
          logoUrl: p.logoUrl || '',
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
    const isTwoCol = preset.templateId === 'two-column-sidebar'
    const isVitals = preset.templateId === 'vitals-first'
    setDoctor({
      doctorName: preset.doctor.name,
      qualification: preset.doctor.qualification,
      clinicName: preset.doctor.clinicName,
      clinicAddress: preset.doctor.address,
      phone: preset.doctor.phone,
      specialization: preset.doctor.specialization || '',
      registrationNumber: preset.doctor.regNo || '',
      signature: '',
      logoUrl: (preset.doctor as any).logoUrl || (isTwoCol ? SAMPLE_CARDIOLOGY_LOGO : ''),
    })
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
      advice: 'Drink warm water, take rest, light diet for 3 days',
      investigations: 'CBC, Urine Routine',
      followUp: 'After 5 days',
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
          initialTemplateId={selectedTemplate?.id}
          onHighlight={(t) => setSelectedTemplate(t)}
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
          selectedTemplate={selectedTemplate}
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

