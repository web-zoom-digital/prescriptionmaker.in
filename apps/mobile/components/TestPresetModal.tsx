import { useState } from 'react'
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
  TextInput, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TEST_PRESETS, type TestPreset } from '../lib/test-presets'

type Props = {
  visible: boolean
  onClose: () => void
  currentTemplateId?: string
  mode: 'form-editor' | 'tablet-mode'
  onSelectPreset: (preset: TestPreset, jumpDirectly: boolean) => void
}

export default function TestPresetModal({
  visible,
  onClose,
  currentTemplateId,
  mode,
  onSelectPreset,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = TEST_PRESETS.filter(p => {
    const q = search.toLowerCase()
    return (
      p.templateName.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q) ||
      p.caseTitle.toLowerCase().includes(q) ||
      p.doctor.name.toLowerCase().includes(q) ||
      p.patient.diagnosis.toLowerCase().includes(q)
    )
  })

  const currentPreset = TEST_PRESETS.find(p => p.templateId === currentTemplateId) || TEST_PRESETS[0]

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.titleRow}>
              <View style={s.badge}>
                <Ionicons name="flask" size={16} color="#155EEF" />
                <Text style={s.badgeText}>Auto-Fill Test Lab</Text>
              </View>
              <Pressable style={s.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>
            <Text style={s.title}>Quick Test Presets (All 10 Templates)</Text>
            <Text style={s.subTitle}>
              Click any scenario to auto-fill realistic doctor, patient, diagnosis & medicines instantly.
            </Text>

            {/* Quick 1-Tap Fill for current template button */}
            {currentPreset && (
              <Pressable
                style={s.quickCurrentBtn}
                onPress={() => {
                  onSelectPreset(currentPreset, mode === 'form-editor')
                  onClose()
                }}
              >
                <View style={s.quickLeft}>
                  <Text style={s.quickEmoji}>{currentPreset.emoji}</Text>
                  <View>
                    <Text style={s.quickTitle}>Auto-Fill Current: {currentPreset.templateName}</Text>
                    <Text style={s.quickSub}>{currentPreset.caseTitle} • {currentPreset.doctor.name}</Text>
                  </View>
                </View>
                <View style={s.quickBadge}>
                  <Ionicons name="flash" size={14} color="#fff" />
                  <Text style={s.quickBadgeText}>{mode === 'form-editor' ? 'Fill & Review' : 'Fill & Draw'}</Text>
                </View>
              </Pressable>
            )}

            {/* Search */}
            <View style={s.searchWrap}>
              <Ionicons name="search" size={16} color="#94a3b8" />
              <TextInput
                style={s.searchInput}
                placeholder="Search by specialty, illness, doctor..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Presets List */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((preset, index) => {
              const isCurrent = preset.templateId === currentTemplateId
              return (
                <View
                  key={preset.id}
                  style={[s.card, isCurrent && s.cardActive]}
                >
                  <View style={s.cardHead}>
                    <View style={s.cardHeadLeft}>
                      <Text style={s.cardEmoji}>{preset.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={s.cardTemplateName}>{index + 1}. {preset.templateName}</Text>
                          {isCurrent && (
                            <View style={s.currentTag}>
                              <Text style={s.currentTagText}>Selected</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.cardSpecialty}>{preset.specialty}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Case Details */}
                  <View style={s.caseBox}>
                    <Text style={s.caseTitle}>📋 {preset.caseTitle}</Text>
                    <Text style={s.caseDesc}>{preset.description}</Text>

                    <View style={s.infoGrid}>
                      <View style={s.infoItem}>
                        <Text style={s.infoLabel}>👨‍⚕️ Doctor</Text>
                        <Text style={s.infoVal} numberOfLines={1}>{preset.doctor.name}</Text>
                        <Text style={s.infoSub} numberOfLines={1}>{preset.doctor.clinicName}</Text>
                      </View>
                      <View style={s.infoItem}>
                        <Text style={s.infoLabel}>🧑 Patient</Text>
                        <Text style={s.infoVal} numberOfLines={1}>{preset.patient.name} ({preset.patient.age}y/{preset.patient.gender})</Text>
                        <Text style={s.infoSub} numberOfLines={1}>{preset.patient.diagnosis}</Text>
                      </View>
                    </View>

                    {/* Medicines preview */}
                    <View style={s.medsPreview}>
                      <Text style={s.medsLabel}>💊 Rx ({preset.medicines.length} Medicines):</Text>
                      <Text style={s.medsList} numberOfLines={2}>
                        {preset.medicines.map(m => `${m.name} ${m.strength}`).join(' • ')}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={s.actionRow}>
                    <Pressable
                      style={s.editBtn}
                      onPress={() => {
                        onSelectPreset(preset, false)
                        onClose()
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color="#155EEF" />
                      <Text style={s.editBtnText}>Fill & Edit Form</Text>
                    </Pressable>

                    <Pressable
                      style={s.directBtn}
                      onPress={() => {
                        onSelectPreset(preset, true)
                        onClose()
                      }}
                    >
                      <Ionicons name="flash" size={16} color="#fff" />
                      <Text style={s.directBtnText}>
                        {mode === 'form-editor' ? '⚡ 1-Tap Fill & Preview' : '⚡ 1-Tap Fill & Draw'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#155EEF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  quickCurrentBtn: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quickEmoji: {
    fontSize: 24,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  quickSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#155EEF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderColor: '#155EEF',
    backgroundColor: '#F8FAFC',
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardTemplateName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  cardSpecialty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#155EEF',
    marginTop: 1,
  },
  caseBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  caseTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  caseDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  infoItem: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoSub: {
    fontSize: 10,
    color: '#64748B',
  },
  medsPreview: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 2,
  },
  medsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  medsList: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#155EEF',
  },
  directBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#155EEF',
    shadowColor: '#155EEF',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  directBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
})
