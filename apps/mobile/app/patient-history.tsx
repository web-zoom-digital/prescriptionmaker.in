import {
  View, Text, StyleSheet, FlatList, Pressable,
  Platform, Alert, ActivityIndicator, TextInput
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  getPatientPrescriptions, deletePrescription,
  type Prescription
} from '../lib/prescriptions'

function RxCard({ rx, onRepeat, onDelete }: {
  rx: Prescription
  onRepeat: (rx: Prescription) => void
  onDelete: (id: string) => void
}) {
  const date = new Date(rx.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const medCount = (rx.medicines ?? []).filter((m: any) => m.name).length
  const statusColor = rx.status === 'complete' ? '#16a34a' : rx.status === 'draft' ? '#d97706' : '#94a3b8'

  return (
    <View style={styles.rxCard}>
      {/* Date strip */}
      <View style={styles.rxDateStrip}>
        <View style={styles.rxDot} />
        <Text style={styles.rxDate}>{date}</Text>
        <View style={[styles.rxStatusBadge, { backgroundColor: `${statusColor}18` }]}>
          <Text style={[styles.rxStatusText, { color: statusColor }]}>
            {rx.status === 'complete' ? '✓ Complete' : rx.status === 'draft' ? '✎ Draft' : 'Archived'}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.rxBody}>
        {rx.diagnosis ? (
          <View style={styles.rxRow}>
            <Ionicons name="medical-outline" size={14} color="#0f766e" />
            <Text style={styles.rxLabel}>Diagnosis:</Text>
            <Text style={styles.rxValue} numberOfLines={1}>{rx.diagnosis}</Text>
          </View>
        ) : null}

        {medCount > 0 && (
          <View style={styles.rxRow}>
            <Ionicons name="flask-outline" size={14} color="#1e40af" />
            <Text style={styles.rxLabel}>Medicines:</Text>
            <Text style={styles.rxValue}>
              {rx.medicines.filter((m: any) => m.name).map((m: any) => m.name).slice(0, 3).join(', ')}
              {medCount > 3 ? ` +${medCount - 3} more` : ''}
            </Text>
          </View>
        )}

        {rx.doctor_info?.name && (
          <View style={styles.rxRow}>
            <Ionicons name="person-circle-outline" size={14} color="#7c3aed" />
            <Text style={styles.rxLabel}>Doctor:</Text>
            <Text style={styles.rxValue}>Dr. {rx.doctor_info.name}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.rxActions}>
        <Pressable style={styles.repeatBtn} onPress={() => onRepeat(rx)}>
          <Ionicons name="copy-outline" size={16} color="#fff" />
          <Text style={styles.repeatText}>Repeat Prescription</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => onDelete(rx.id)}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  )
}

export default function PatientHistoryScreen() {
  const params = useLocalSearchParams<{
    phone: string
    name: string
  }>()

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!params.phone) return
    setLoading(true)
    try {
      const data = await getPatientPrescriptions(params.phone)
      setPrescriptions(data)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }, [params.phone])

  useEffect(() => { load() }, [load])

  const handleRepeat = (rx: Prescription) => {
    // Navigate to editor with clone_id — editor will pre-fill everything
    router.push({
      pathname: '/editor',
      params: { clone_id: rx.id }
    })
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Prescription', 'Remove this prescription from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deletePrescription(id)
          setPrescriptions(prev => prev.filter(p => p.id !== id))
        } catch (err: any) {
          Alert.alert('Error', err.message)
        }
      }},
    ])
  }

  const handleNewRx = () => {
    // Open editor with patient pre-filled
    router.push({
      pathname: '/editor',
      params: {
        prefill_name: params.name,
        prefill_phone: params.phone,
      }
    })
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/patients')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{params.name?.charAt(0) ?? 'P'}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{params.name ?? 'Patient'}</Text>
            <Text style={styles.headerSub}>{params.phone} · {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <Pressable style={styles.newRxBtn} onPress={handleNewRx}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newRxText}>New Rx</Text>
        </Pressable>
      </View>

      {/* Timeline */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#0f766e" size="large" /></View>
      ) : prescriptions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Prescriptions Yet</Text>
          <Text style={styles.emptyText}>
            No prescriptions found for {params.name}. Create the first one now!
          </Text>
          <Pressable style={styles.emptyBtn} onPress={handleNewRx}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyBtnText}>Create First Prescription</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.timelineHeader}>
              <View style={styles.timelineLine} />
              <Text style={styles.timelineLabel}>PRESCRIPTION HISTORY</Text>
            </View>
          }
          renderItem={({ item }) => (
            <RxCard rx={item} onRepeat={handleRepeat} onDelete={handleDelete} />
          )}
          ListFooterComponent={
            <Pressable style={styles.footerNewBtn} onPress={handleNewRx}>
              <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
              <Text style={styles.footerNewText}>Create New Prescription</Text>
            </Pressable>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#0f766e', flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14,
    paddingHorizontal: 16, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  newRxBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  newRxText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f766e', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  timelineLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  timelineLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  rxCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: '#0f766e',
  },
  rxDateStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  rxDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0f766e' },
  rxDate: { fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1 },
  rxStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  rxStatusText: { fontSize: 11, fontWeight: '700' },
  rxBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 6 },
  rxRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rxLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', width: 70 },
  rxValue: { fontSize: 12, color: '#1e293b', flex: 1 },
  rxActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  repeatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#0f766e', paddingVertical: 10, borderRadius: 10,
  },
  repeatText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', borderRadius: 10, borderWidth: 1, borderColor: '#fecdd3' },
  footerNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#bbf7d0', borderStyle: 'dashed', marginTop: 4 },
  footerNewText: { color: '#0f766e', fontWeight: '700', fontSize: 14 },
})
