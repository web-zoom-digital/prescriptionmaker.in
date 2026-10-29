import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { getPrescriptions, createPrescription } from '../../lib/prescriptions'
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
        if (qName && spName && qName === spName) return true
        return false
      })
      setSavedPatient(foundSaved || null)

      // Filter matching prescriptions
      const filtered = all.filter(rx => {
        let p = rx.patient_info
        if (typeof p === 'string') {
          try { p = JSON.parse(p) } catch {}
        }
        if (!p) return false
        const rxDigits = cleanDigits(p.phone)
        const rxName = cleanName(p.name)

        if (isByName) {
          return Boolean(qName && rxName === qName)
        }
        return Boolean((qDigits && rxDigits && qDigits === rxDigits) || (qName && rxName === qName))
      })

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

  const handleNewRx = () => {
    router.push({
      pathname: '/editor',
      params: {
        prefill_name: name,
        prefill_phone: !isByName && phone ? phone : (savedPatient?.phone || ''),
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
        title: `Rx: ${name}`,
        status: 'complete',
        mode: 'form',
        diagnosis: preset.patient.diagnosis,
        doctor_info: preset.doctor,
        patient_info: {
          name,
          phone: phone || preset.patient.phone || '',
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
      Alert.alert('✅ Prescription Created', `Sample prescription for ${name} has been saved to records.`)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: { item: any }) => {
    const meds = item.medicines || []
    const date = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
    const isComplete = item.status === 'complete'

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
            <View style={styles.dot} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, isComplete ? styles.statusComplete : styles.statusDraft]}>
            <Text style={[styles.statusText, isComplete ? styles.textComplete : styles.textDraft]}>
              {isComplete ? '✓ Complete' : '✎ Draft'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {!!item.diagnosis && (
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={14} color={Colors.primaryBlue} style={{ marginTop: 2 }} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>DIAGNOSIS</Text>
                <Text style={styles.infoValue}>{item.diagnosis}</Text>
              </View>
            </View>
          )}

          {meds.length > 0 && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="bandage" size={14} color={Colors.primaryBlue} style={{ marginTop: 2 }} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>MEDICINES ({meds.length})</Text>
                <View style={styles.tagsContainer}>
                  {meds.slice(0, 3).map((m: any, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{m.name}</Text>
                    </View>
                  ))}
                  {meds.length > 3 && (
                    <Text style={styles.moreText}>+{meds.length - 3} more</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.repeatButton}
            onPress={() => router.push({ pathname: '/editor', params: { clone_id: item.id } })}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.white} />
            <Text style={styles.repeatButtonText}>Repeat Prescription</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: name,
        headerStyle: { backgroundColor: Colors.darkNavy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      }} />
      
      {/* Vitals Overview */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            {!isByName && <Text style={styles.phone}>{phone || savedPatient?.phone}</Text>}
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
            <Text style={styles.vitalLabel}>Visits</Text>
            <Text style={styles.vitalValue}>{displayVisits}</Text>
          </View>
        </View>

        {/* Extra info if available from patient record */}
        {(savedPatient?.bloodGroup || savedPatient?.allergies || savedPatient?.address) && (
          <View style={styles.extraInfoRow}>
            {savedPatient.bloodGroup ? (
              <View style={[styles.infoChip, { backgroundColor: '#fff1f2' }]}>
                <Text style={[styles.infoChipText, { color: '#be123c' }]}>🩸 {savedPatient.bloodGroup}</Text>
              </View>
            ) : null}
            {savedPatient.allergies ? (
              <View style={[styles.infoChip, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.infoChipText, { color: '#92400e' }]}>⚠️ {savedPatient.allergies}</Text>
              </View>
            ) : null}
            {savedPatient.address ? (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>📍 {savedPatient.address}</Text>
              </View>
            ) : null}
          </View>
        )}
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
                {name} is saved in your records, but no prescription has been completed for them yet.
              </Text>
              <TouchableOpacity style={styles.createRxActionBtn} onPress={handleNewRx}>
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.createRxActionText}>+ Create Prescription for {name}</Text>
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
  container: { flex: 1, backgroundColor: Colors.paleBlue },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    backgroundColor: Colors.white, padding: Spacing.lg, 
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...Shadow.sm
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { 
    width: 52, height: 52, borderRadius: 26, 
    backgroundColor: Colors.primaryBlue, 
    justifyContent: 'center', alignItems: 'center',
    ...Shadow.blue
  },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  name: { ...Typography.h3, color: Colors.textPrimary },
  phone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 10 },
  vitalBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.border },
  vitalLabel: { ...Typography.labelSm, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  vitalValue: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  
  extraInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  infoChip: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  infoChipText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  list: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryBlue },
  dateText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  statusComplete: { backgroundColor: Colors.successLight, borderColor: '#bbf7d0' },
  statusDraft: { backgroundColor: Colors.warningLight, borderColor: '#fde68a' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textComplete: { color: Colors.success },
  textDraft: { color: Colors.warning },
  
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoCol: { flex: 1 },
  infoLabel: { ...Typography.labelSm, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { backgroundColor: Colors.lightBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  tagText: { fontSize: 12, color: Colors.primaryBlue, fontWeight: '600' },
  moreText: { fontSize: 12, color: Colors.textSecondary, alignSelf: 'center', fontWeight: '500' },
  
  cardFooter: { padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.paleBlue },
  repeatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primaryBlue, paddingVertical: 10, borderRadius: Radius.md, ...Shadow.blue },
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
