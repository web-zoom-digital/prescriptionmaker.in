import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'
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
          <View style={styles.visitBadge}>
            <Ionicons name="medical" size={13} color={Colors.primaryBlue} />
            <Text style={styles.visitBadgeText}>Visit #{visitNum} {index === 0 ? '(Latest)' : ''}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, isComplete ? styles.statusComplete : styles.statusDraft]}>
            <Text style={[styles.statusText, isComplete ? styles.textComplete : styles.textDraft]}>
              {isComplete ? '✓ Complete' : '✎ Draft'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Doctor & Clinic */}
          {(dInfo.name || dInfo.doctor_name || dInfo.clinicName || dInfo.clinic_name) ? (
            <View style={styles.doctorRow}>
              <Ionicons name="person-circle-outline" size={16} color={Colors.primaryBlue} />
              <Text style={styles.doctorName}>
                {dInfo.name || dInfo.doctor_name || 'Dr. Rahul Sharma'}
              </Text>
              {(dInfo.clinicName || dInfo.clinic_name) ? (
                <Text style={styles.clinicName}> • {dInfo.clinicName || dInfo.clinic_name}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Clinical Vitals & Chief Complaint */}
          {(pInfo.chiefComplaint || pInfo.bp || pInfo.temp || pInfo.pulse || pInfo.spo2) ? (
            <View style={styles.clinicalNotesBox}>
              {pInfo.chiefComplaint ? (
                <View style={styles.complaintRow}>
                  <Text style={styles.complaintLabel}>Complaint: </Text>
                  <Text style={styles.complaintText}>{pInfo.chiefComplaint}</Text>
                </View>
              ) : null}
              {(pInfo.bp || pInfo.temp || pInfo.pulse || pInfo.spo2) ? (
                <View style={styles.vitalsChipsRow}>
                  {pInfo.temp ? (
                    <View style={styles.vChip}><Text style={styles.vChipText}>🌡️ {pInfo.temp}</Text></View>
                  ) : null}
                  {pInfo.bp ? (
                    <View style={styles.vChip}><Text style={styles.vChipText}>💓 BP: {pInfo.bp}</Text></View>
                  ) : null}
                  {pInfo.pulse ? (
                    <View style={styles.vChip}><Text style={styles.vChipText}>🫀 Pulse: {pInfo.pulse}</Text></View>
                  ) : null}
                  {pInfo.spo2 ? (
                    <View style={styles.vChip}><Text style={styles.vChipText}>💨 SpO2: {pInfo.spo2}</Text></View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Diagnosis */}
          {item.diagnosis ? (
            <View style={styles.diagnosisBox}>
              <View style={styles.diagHeader}>
                <Ionicons name="pulse" size={14} color={Colors.primaryBlue} />
                <Text style={styles.diagLabel}>DIAGNOSIS</Text>
              </View>
              <Text style={styles.diagValue}>{item.diagnosis}</Text>
            </View>
          ) : null}

          {/* Prescribed Medicines (Full Readable Details for Doctor) */}
          {meds.length > 0 ? (
            <View style={styles.medsSection}>
              <View style={styles.medsHeaderRow}>
                <Ionicons name="bandage-outline" size={15} color={Colors.primaryBlue} />
                <Text style={styles.medsSectionTitle}>
                  PRESCRIBED MEDICINES ({meds.length})
                </Text>
              </View>

              <View style={styles.medsContainer}>
                {meds.map((m: any, i: number) => (
                  <View key={i} style={styles.medCard}>
                    <View style={styles.medHeaderRow}>
                      <Text style={styles.medNumber}>{i + 1}.</Text>
                      <Text style={styles.medNameText}>
                        {m.name} {m.strength ? `— ${m.strength}` : ''}
                      </Text>
                      {m.form ? (
                        <View style={styles.medFormBadge}>
                          <Text style={styles.medFormText}>{m.form}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.medMetaRow}>
                      {m.frequency ? (
                        <View style={styles.dosageBadge}>
                          <Ionicons name="time-outline" size={12} color={Colors.primaryBlue} />
                          <Text style={styles.dosageText}>{m.frequency}</Text>
                        </View>
                      ) : null}
                      {m.duration ? (
                        <View style={[styles.dosageBadge, { backgroundColor: '#e0e7ff' }]}>
                          <Ionicons name="calendar-outline" size={12} color="#4338ca" />
                          <Text style={[styles.dosageText, { color: '#4338ca' }]}>{m.duration}</Text>
                        </View>
                      ) : null}
                    </View>

                    {m.instructions ? (
                      <Text style={styles.medInstructions}>
                        • Instructions: {m.instructions}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Lab Tests */}
          {item.lab_tests ? (
            <View style={styles.extraBox}>
              <Text style={styles.extraTitle}>🧪 Lab Tests / Investigations:</Text>
              <Text style={styles.extraContent}>{item.lab_tests}</Text>
            </View>
          ) : null}

          {/* Advice */}
          {item.advice ? (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>📋 Doctor's Advice & Instructions:</Text>
              <Text style={styles.adviceContent}>{item.advice}</Text>
            </View>
          ) : null}

          {/* Follow Up */}
          {item.follow_up_date ? (
            <View style={styles.followUpRow}>
              <Ionicons name="alarm-outline" size={14} color={Colors.success} />
              <Text style={styles.followUpText}>
                Follow-up: <Text style={{ fontWeight: '700' }}>{item.follow_up_date}</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.repeatButton}
            onPress={() => router.push({ pathname: '/editor', params: { clone_id: item.id } })}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.white} />
            <Text style={styles.repeatButtonText}>Repeat This Prescription</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: patientName,
        headerStyle: { backgroundColor: Colors.darkNavy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      }} />
      
      {/* Vitals Overview Header */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patientName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{patientName}</Text>
            {patientPhone ? <Text style={styles.phone}>{patientPhone}</Text> : null}
          </View>
          <View style={styles.totalVisitsBadge}>
            <Ionicons name="documents-outline" size={14} color={Colors.primaryBlue} />
            <Text style={styles.totalVisitsText}>{displayVisits} {displayVisits === 1 ? 'Visit' : 'Visits'}</Text>
          </View>
        </View>

        <View style={styles.vitalsRow}>
          <View style={styles.vitalBox}>
            <Text style={styles.vitalLabel}>Age/Gender</Text>
            <Text style={styles.vitalValue}>
              {displayAge ? `${displayAge} Y` : '-'} {displayGender ? `/ ${displayGender}` : ''}
            </Text>
          </View>
          <View style={styles.vitalBox}>
            <Text style={styles.vitalLabel}>Weight</Text>
            <Text style={styles.vitalValue}>{displayWeight ? (displayWeight.includes('kg') ? displayWeight : `${displayWeight} kg`) : '-'}</Text>
          </View>
          <View style={[styles.vitalBox, { borderRightWidth: 0 }]}>
            <Text style={styles.vitalLabel}>Prescriptions</Text>
            <Text style={[styles.vitalValue, { color: Colors.primaryBlue }]}>{displayVisits} Rx</Text>
          </View>
        </View>

        {/* Extra info if available from patient record */}
        {Boolean(savedPatient?.bloodGroup || savedPatient?.allergies || savedPatient?.address) ? (
          <View style={styles.extraInfoRow}>
            {savedPatient?.bloodGroup ? (
              <View style={[styles.infoChip, { backgroundColor: '#fff1f2' }]}>
                <Text style={[styles.infoChipText, { color: '#be123c' }]}>🩸 Blood: {savedPatient.bloodGroup}</Text>
              </View>
            ) : null}
            {savedPatient?.allergies ? (
              <View style={[styles.infoChip, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.infoChipText, { color: '#92400e' }]}>⚠️ Allergy: {savedPatient.allergies}</Text>
              </View>
            ) : null}
            {savedPatient?.address ? (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>📍 {savedPatient.address}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Prescription History Section Title */}
      <View style={styles.historySectionHeader}>
        <Ionicons name="time" size={16} color={Colors.primaryBlue} />
        <Text style={styles.historySectionTitle}>CLINICAL PRESCRIPTION HISTORY</Text>
        <Text style={styles.historySectionCount}>({prescriptions.length} Records)</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={42} color={Colors.primaryBlue} />
              </View>
              <Text style={styles.emptyTitle}>No Prescriptions Recorded</Text>
              <Text style={styles.emptyText}>
                {patientName} is saved in your records, but no prescription has been completed for them yet.
              </Text>
              <TouchableOpacity style={styles.createRxActionBtn} onPress={handleNewRx}>
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.createRxActionText}>+ Create Prescription for {patientName}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sampleRxActionBtn} onPress={handleGenerateSampleRx}>
                <Ionicons name="flash" size={16} color={Colors.primaryBlue} />
                <Text style={styles.sampleRxActionText}>⚡ Auto-Fill Sample Prescription</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB for New Prescription */}
      <TouchableOpacity style={styles.fab} onPress={handleNewRx}>
        <Ionicons name="add" size={24} color={Colors.white} />
        <Text style={styles.fabText}>New Rx</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    backgroundColor: Colors.white, padding: Spacing.lg, 
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...Shadow.sm
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { 
    width: 52, height: 52, borderRadius: 26, 
    backgroundColor: Colors.primaryBlue, 
    justifyContent: 'center', alignItems: 'center',
    ...Shadow.blue
  },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  name: { ...Typography.h3, color: Colors.textPrimary },
  phone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  
  totalVisitsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.lightBlue, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: '#bfdbfe'
  },
  totalVisitsText: { fontSize: 12, fontWeight: '700', color: Colors.primaryBlue },

  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 10 },
  vitalBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.border },
  vitalLabel: { ...Typography.labelSm, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  vitalValue: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  
  extraInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  infoChip: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  infoChipText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  historySectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6
  },
  historySectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.5 },
  historySectionCount: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  list: { padding: Spacing.md, paddingBottom: 90, gap: 14 },
  card: { 
    backgroundColor: Colors.white, borderRadius: Radius.lg, 
    overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', 
    ...Shadow.sm 
  },
  cardHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 14, paddingVertical: 10, 
    backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' 
  },
  visitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.lightBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  visitBadgeText: { fontSize: 12, fontWeight: '800', color: Colors.primaryBlue },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  statusComplete: { backgroundColor: Colors.successLight, borderColor: '#bbf7d0' },
  statusDraft: { backgroundColor: Colors.warningLight, borderColor: '#fde68a' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textComplete: { color: Colors.success },
  textDraft: { color: Colors.warning },
  
  cardBody: { padding: 14, gap: 12 },
  
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  doctorName: { fontSize: 13, fontWeight: '700', color: Colors.primaryBlue },
  clinicName: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  clinicalNotesBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 },
  complaintRow: { flexDirection: 'row', flexWrap: 'wrap' },
  complaintLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  complaintText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  vitalsChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  vChip: { backgroundColor: Colors.white, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#e2e8f0' },
  vChipText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },

  diagnosisBox: { backgroundColor: '#eff6ff', padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: '#bfdbfe' },
  diagHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  diagLabel: { fontSize: 10, fontWeight: '800', color: Colors.primaryBlue, letterSpacing: 0.5 },
  diagValue: { fontSize: 14, fontWeight: '700', color: '#1e3a8a' },

  medsSection: { marginTop: 4 },
  medsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  medsSectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.5 },
  medsContainer: { gap: 8 },
  medCard: { backgroundColor: '#f8fafc', padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: '#e2e8f0' },
  medHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  medNumber: { fontSize: 13, fontWeight: '800', color: Colors.primaryBlue },
  medNameText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  medFormBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  medFormText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'capitalize' },
  medMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  dosageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.lightBlue, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  dosageText: { fontSize: 11, fontWeight: '700', color: Colors.primaryBlue },
  medInstructions: { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },

  extraBox: { backgroundColor: '#f5f3ff', padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: '#ddd6fe' },
  extraTitle: { fontSize: 11, fontWeight: '700', color: '#6d28d9', marginBottom: 2 },
  extraContent: { fontSize: 12, color: '#4c1d95', fontWeight: '500' },

  adviceBox: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: '#bbf7d0' },
  adviceTitle: { fontSize: 11, fontWeight: '700', color: '#15803d', marginBottom: 2 },
  adviceContent: { fontSize: 12, color: '#166534', fontWeight: '500', lineHeight: 17 },

  followUpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  followUpText: { fontSize: 12, color: Colors.textSecondary },

  cardFooter: { padding: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  repeatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryBlue, paddingVertical: 10, borderRadius: Radius.md, ...Shadow.blue },
  repeatButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.lightBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  
  createRxActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryBlue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.full, marginBottom: 10, ...Shadow.blue },
  createRxActionText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  
  sampleRxActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primaryBlue, paddingHorizontal: 20, paddingVertical: 11, borderRadius: Radius.full },
  sampleRxActionText: { color: Colors.primaryBlue, fontSize: 13, fontWeight: '700' },

  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBlue, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, gap: 8, ...Shadow.blue },
  fabText: { color: Colors.white, fontWeight: '800', fontSize: 15 }
})
