import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native'
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { getPrescriptions, createPrescription, INITIAL_SAMPLE_PRESCRIPTIONS, type Prescription } from '../../lib/prescriptions'
import { getSavedPatients, type SavedPatient } from '../../lib/local-store'
import { TEST_PRESETS } from '../../lib/test-presets'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography, Spacing, Radius, Shadow } from '../../lib/design-system'

export default function PatientHistory() {
  const router = useRouter()
  const { phone, name, byname } = useLocalSearchParams<{ phone: string, name: string, byname: string }>()
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [savedPatient, setSavedPatient] = useState<SavedPatient | null>(null)
  const [loading, setLoading] = useState(true)

  const isByName = byname === '1'

  const cleanDigits = (val?: string) => (val ? val.replace(/\D/g, '').slice(-10) : '')
  const cleanName = (val?: string) => (val ? val.trim().toLowerCase().replace(/\s+/g, ' ') : '')

  const qDigits = cleanDigits(phone)
  const qName = cleanName(name)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const [all, savedList] = await Promise.all([
        getPrescriptions().catch(() => []),
        getSavedPatients().catch(() => []),
      ])

      // Find saved patient record
      const foundSaved = savedList.find(sp => {
        const spDigits = cleanDigits(sp.phone)
        const spName = cleanName(sp.name)
        if (qDigits && spDigits && qDigits === spDigits) return true
        if (qName && spName && (spName === qName || spName.includes(qName) || qName.includes(spName))) return true
        return false
      })
      setSavedPatient(foundSaved || null)

      // Filter matching prescriptions
      let filtered = all.filter(rx => {
        let p = rx.patient_info
        if (typeof p === 'string') {
          try { p = JSON.parse(p) } catch {}
        }
        if (!p) return false
        const rxDigits = cleanDigits(p.phone)
        const rxName = cleanName(p.name)

        if (isByName) {
          return Boolean(qName && (rxName === qName || rxName.includes(qName) || qName.includes(rxName)))
        }
        return Boolean((qDigits && rxDigits && qDigits === rxDigits) || (qName && (rxName.includes(qName) || qName.includes(rxName))))
      })

      // If Aarav Verma or sample patient has 0 prescriptions, initialize the 2 clinical visits
      if (filtered.length === 0 && (qName.includes('aarav') || qDigits === '9876543210')) {
        filtered = INITIAL_SAMPLE_PRESCRIPTIONS
      }

      // Sort chronological descending (latest visit first)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setPrescriptions(filtered)
    } catch (err) {
      console.error('Error fetching patient history:', err)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory()
    }, [phone, name, byname])
  )

  const latestInfo = prescriptions[0]?.patient_info || {}
  const displayAge = latestInfo.age || savedPatient?.age || ''
  const displayGender = latestInfo.gender || savedPatient?.gender || ''
  const displayWeight = latestInfo.weight || savedPatient?.weight || ''
  const displayVisits = prescriptions.length > 0 ? prescriptions.length : (savedPatient?.visitCount || 0)

  const patientName = name || savedPatient?.name || 'Aarav Verma'
  const patientPhone = !isByName && (phone || savedPatient?.phone) ? (phone || savedPatient?.phone) : (savedPatient?.phone || '+91 98765 43210')

  const handleNewRx = () => {
    router.push({
      pathname: '/editor',
      params: {
        prefill_name: patientName,
        prefill_phone: patientPhone,
        prefill_age: displayAge,
        prefill_gender: displayGender,
        prefill_weight: displayWeight,
      }
    })
  }

  const matchingPreset = TEST_PRESETS.find(p => {
    const pName = cleanName(p.patient.name)
    const pPhone = cleanDigits(p.patient.phone)
    if (qDigits && pPhone && qDigits === pPhone) return true
    return qName && (pName === qName || pName.includes(qName) || qName.includes(pName))
  }) || TEST_PRESETS[0]

  const handleGenerateSampleRx = async () => {
    setLoading(true)
    try {
      const preset = matchingPreset
      await createPrescription({
        title: `Rx: ${patientName}`,
        status: 'complete',
        mode: 'form',
        diagnosis: preset.patient.diagnosis,
        doctor_info: preset.doctor,
        patient_info: {
          name: patientName,
          phone: patientPhone,
          age: displayAge || preset.patient.age,
          gender: displayGender || preset.patient.gender,
          weight: displayWeight || preset.patient.weight,
        },
        medicines: preset.medicines.map((m, i) => ({
          id: `sample-${Date.now()}-${i}`,
          name: m.name,
          strength: m.strength,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
          form: m.form || 'tablet',
        })),
        advice: preset.advice,
        follow_up_date: preset.followUp,
      })
      await loadHistory()
      Alert.alert('✅ Prescription Created', `Sample prescription for ${patientName} has been saved to records.`)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    let pInfo = item.patient_info || {}
    if (typeof pInfo === 'string') {
      try { pInfo = JSON.parse(pInfo) } catch {}
    }
    let dInfo = item.doctor_info || {}
    if (typeof dInfo === 'string') {
      try { dInfo = JSON.parse(dInfo) } catch {}
    }
    const meds = Array.isArray(item.medicines) ? item.medicines : []
    const date = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
    const isComplete = item.status === 'complete'
    const visitNum = prescriptions.length - index

    return (
      <View style={styles.card}>
        {/* Card Header: Visit Number, Date, Status */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.visitPill}>
              <Text style={styles.visitPillText}>Visit #{visitNum}</Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
            {index === 0 ? (
              <View style={styles.latestTag}>
                <Text style={styles.latestTagText}>Latest</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, isComplete ? styles.statusComplete : styles.statusDraft]}>
              <View style={[styles.statusDot, isComplete ? styles.dotComplete : styles.dotDraft]} />
              <Text style={[styles.statusText, isComplete ? styles.textComplete : styles.textDraft]}>
                {isComplete ? 'Complete' : 'Draft'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Doctor Row */}
          {(dInfo.name || dInfo.doctor_name) ? (
            <View style={styles.drRow}>
              <Ionicons name="medkit-outline" size={14} color={Colors.primaryBlue} />
              <Text style={styles.drName}>{dInfo.name || dInfo.doctor_name}</Text>
              {(dInfo.clinicName || dInfo.clinic_name) ? (
                <Text style={styles.drClinic}>• {dInfo.clinicName || dInfo.clinic_name}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Diagnosis & Complaint Box */}
          <View style={styles.diagnosisSection}>
            <Text style={styles.diagnosisLabel}>DIAGNOSIS</Text>
            <Text style={styles.diagnosisTitle}>{item.diagnosis || 'General Medical Consultation'}</Text>
            
            {pInfo.chiefComplaint ? (
              <Text style={styles.complaintText}>
                <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>Complaint: </Text>
                {pInfo.chiefComplaint}
              </Text>
            ) : null}

            {/* Vitals Inline Chips */}
            {(pInfo.bp || pInfo.temp || pInfo.pulse || pInfo.spo2) ? (
              <View style={styles.vitalsRowInline}>
                {pInfo.temp ? <Text style={styles.vVital}>🌡️ {pInfo.temp}</Text> : null}
                {pInfo.bp ? <Text style={styles.vVital}>💓 {pInfo.bp}</Text> : null}
                {pInfo.pulse ? <Text style={styles.vVital}>🫀 {pInfo.pulse}</Text> : null}
                {pInfo.spo2 ? <Text style={styles.vVital}>💨 {pInfo.spo2}</Text> : null}
              </View>
            ) : null}
          </View>

          {/* Prescribed Medicines — Clean Prescription Pad Style */}
          {meds.length > 0 ? (
            <View style={styles.medsContainer}>
              <View style={styles.medsHeader}>
                <Text style={styles.medsHeading}>PRESCRIBED MEDICINES</Text>
                <Text style={styles.medsCountBadge}>{meds.length} items</Text>
              </View>

              <View style={styles.medsTable}>
                {meds.map((m: any, i: number) => (
                  <View key={i} style={[styles.medRow, i === meds.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.medLeft}>
                      <View style={styles.medTitleLine}>
                        <Text style={styles.medIndexNum}>{i + 1}.</Text>
                        <Text style={styles.medNameBold}>{m.name}</Text>
                        {m.strength ? <Text style={styles.medStrengthTag}>{m.strength}</Text> : null}
                        {m.form ? (
                          <View style={styles.formTag}>
                            <Text style={styles.formTagText}>{m.form}</Text>
                          </View>
                        ) : null}
                      </View>
                      {m.instructions ? (
                        <Text style={styles.medInstructionsText}>👉 {m.instructions}</Text>
                      ) : null}
                    </View>

                    <View style={styles.medRight}>
                      {m.frequency ? (
                        <View style={styles.freqPill}>
                          <Text style={styles.freqText}>{m.frequency}</Text>
                        </View>
                      ) : null}
                      {m.duration ? (
                        <Text style={styles.durationText}>{m.duration}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Clinical Advice & Investigations Notes */}
          {(item.lab_tests || item.advice || item.follow_up_date) ? (
            <View style={styles.clinicalNotesCard}>
              {item.lab_tests ? (
                <View style={styles.noteItem}>
                  <Text style={styles.noteLabel}>🧪 Tests:</Text>
                  <Text style={styles.noteValue}>{item.lab_tests}</Text>
                </View>
              ) : null}

              {item.advice ? (
                <View style={styles.noteItem}>
                  <Text style={styles.noteLabel}>📋 Advice:</Text>
                  <Text style={styles.noteValue}>{item.advice}</Text>
                </View>
              ) : null}

              {item.follow_up_date ? (
                <View style={styles.noteItem}>
                  <Text style={styles.noteLabel}>📅 Follow-up:</Text>
                  <Text style={[styles.noteValue, { fontWeight: '700', color: Colors.primaryBlue }]}>
                    {item.follow_up_date}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Card Footer: Clean Action Buttons */}
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.repeatBtn}
            onPress={() => router.push({ pathname: '/editor', params: { clone_id: item.id } })}
          >
            <Ionicons name="repeat" size={15} color={Colors.white} />
            <Text style={styles.repeatBtnText}>Repeat Prescription</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
          >
            <Ionicons name="eye-outline" size={15} color={Colors.textPrimary} />
            <Text style={styles.viewDetailsBtnText}>Open in Editor</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.pageBackground}>
      <Stack.Screen options={{ 
        title: 'Patient Record',
        headerStyle: { backgroundColor: Colors.darkNavy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      }} />

      <View style={styles.container}>
        {/* Clean Patient Summary Header */}
        <View style={styles.patientProfileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{patientName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientPhone}>{patientPhone}</Text>
            </View>
            <TouchableOpacity style={styles.primaryNewRxBtn} onPress={handleNewRx}>
              <Ionicons name="add" size={16} color={Colors.white} />
              <Text style={styles.primaryNewRxBtnText}>New Rx</Text>
            </TouchableOpacity>
          </View>

          {/* Clean Vitals & Tags Bar */}
          <View style={styles.vitalsBar}>
            <View style={styles.vitalPill}>
              <Text style={styles.vitalPillLabel}>Age/Gender</Text>
              <Text style={styles.vitalPillValue}>{displayAge || '32'} Y / {displayGender || 'Male'}</Text>
            </View>
            <View style={styles.vitalDivider} />
            <View style={styles.vitalPill}>
              <Text style={styles.vitalPillLabel}>Weight</Text>
              <Text style={styles.vitalPillValue}>{displayWeight || '68 kg'}</Text>
            </View>
            <View style={styles.vitalDivider} />
            <View style={styles.vitalPill}>
              <Text style={styles.vitalPillLabel}>Total Visits</Text>
              <Text style={[styles.vitalPillValue, { color: Colors.primaryBlue }]}>{displayVisits} Visits</Text>
            </View>
          </View>

          {/* Medical Badges (Blood, Allergy, Address) */}
          {(savedPatient?.bloodGroup || savedPatient?.allergies || savedPatient?.address) ? (
            <View style={styles.medicalBadgesRow}>
              {savedPatient?.bloodGroup ? (
                <View style={styles.medBadge}>
                  <Text style={styles.medBadgeText}>🩸 Blood: <Text style={{ fontWeight: '700' }}>{savedPatient.bloodGroup}</Text></Text>
                </View>
              ) : null}
              {savedPatient?.allergies ? (
                <View style={[styles.medBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.medBadgeText, { color: '#92400e' }]}>⚠️ Allergy: {savedPatient.allergies}</Text>
                </View>
              ) : null}
              {savedPatient?.address ? (
                <View style={styles.medBadge}>
                  <Text style={styles.medBadgeText}>📍 {savedPatient.address}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Timeline Header */}
        <View style={styles.timelineHeaderRow}>
          <View style={styles.timelineDotIndicator} />
          <Text style={styles.timelineHeading}>VISIT HISTORY ({prescriptions.length})</Text>
          <Text style={styles.timelineSubheading}>Chronological medical records</Text>
        </View>

        {/* History List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : (
          <FlatList
            data={prescriptions}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Prescriptions Recorded</Text>
                <Text style={styles.emptySubtitle}>
                  {patientName} is saved in your directory, but has no prescriptions yet.
                </Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={handleNewRx}>
                  <Text style={styles.emptyActionBtnText}>+ Create First Prescription</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 20 : 12,
  },
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Patient Profile Header
  patientProfileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  patientPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  primaryNewRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    ...Shadow.blue,
  },
  primaryNewRxBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Vitals Bar
  vitalsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  vitalPill: {
    flex: 1,
    alignItems: 'center',
  },
  vitalPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  vitalPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vitalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },

  medicalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  medBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  medBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Timeline Header
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 8,
  },
  timelineDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryBlue,
  },
  timelineHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  timelineSubheading: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  listContent: {
    paddingBottom: 40,
    gap: 12,
  },

  // Clean Prescription Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  visitPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  latestTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  latestTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  headerRight: {},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusComplete: {
    backgroundColor: '#f0fdf4',
  },
  statusDraft: {
    backgroundColor: '#fffbeb',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotComplete: {
    backgroundColor: '#16a34a',
  },
  dotDraft: {
    backgroundColor: '#d97706',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textComplete: {
    color: '#16a34a',
  },
  textDraft: {
    color: '#d97706',
  },

  cardBody: {
    padding: 16,
    gap: 14,
  },

  drRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  drClinic: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Diagnosis Section
  diagnosisSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryBlue,
    gap: 4,
  },
  diagnosisLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  diagnosisTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  complaintText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  vitalsRowInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  vVital: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    backgroundColor: Colors.white,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Medicines Table
  medsContainer: {
    gap: 6,
  },
  medsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  medsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  medsCountBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  medsTable: {
    backgroundColor: '#fbfcfe',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  medLeft: {
    flex: 1,
    gap: 2,
  },
  medTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  medIndexNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  medNameBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  medStrengthTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  formTag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  formTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  medInstructionsText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  medRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  freqPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  freqText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },

  // Notes & Advice
  clinicalNotesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#edf2f7',
    gap: 6,
  },
  noteItem: {
    flexDirection: 'row',
    gap: 6,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    minWidth: 80,
  },
  noteValue: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },

  // Footer Actions
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  repeatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadow.blue,
  },
  repeatBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  viewDetailsBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    marginTop: 10,
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  emptyActionBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
})
