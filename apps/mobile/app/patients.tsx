import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Platform, Alert, ActivityIndicator, Modal
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getSavedPatients, deletePatient, type SavedPatient } from '../lib/local-store'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function PatientsScreen() {
  const [patients, setPatients] = useState<SavedPatient[]>([])
  const [filtered, setFiltered] = useState<SavedPatient[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<SavedPatient | null>(null)

  const loadPatients = useCallback(async () => {
    const data = await getSavedPatients()
    setPatients(data)
    setFiltered(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadPatients() }, [loadPatients])

  useEffect(() => {
    if (!query) { setFiltered(patients); return }
    const q = query.toLowerCase()
    setFiltered(patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.bloodGroup?.includes(q)
    ))
  }, [query, patients])

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Patient', `Remove "${name}" from your patient list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deletePatient(id)
        loadPatients()
      }},
    ])
  }

  const handleNewPrescription = (patient: SavedPatient) => {
    setSelectedPatient(null)
    router.push({ pathname: '/editor', params: {
      prefill_name: patient.name,
      prefill_age: patient.age,
      prefill_gender: patient.gender,
      prefill_phone: patient.phone,
      prefill_weight: patient.weight,
    }})
  }

  const renderItem = ({ item }: { item: SavedPatient }) => (
    <Pressable style={styles.card} onPress={() => setSelectedPatient(item)}>
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={styles.cardMeta}>
          {item.age ? <Text style={styles.metaTag}>{item.age} yrs</Text> : null}
          {item.gender ? <Text style={styles.metaTag}>{item.gender}</Text> : null}
          {item.bloodGroup ? <Text style={[styles.metaTag, { backgroundColor: '#fff1f2', color: '#be123c' }]}>{item.bloodGroup}</Text> : null}
        </View>
        <Text style={styles.cardVisit}>
          {item.visitCount} visit{item.visitCount !== 1 ? 's' : ''} · Last: {new Date(item.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </Text>
      </View>
      <Pressable style={styles.rxBtn} onPress={() => handleNewPrescription(item)}>
        <Ionicons name="add-circle" size={28} color="#0f766e" />
      </Pressable>
    </Pressable>
  )

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Patient Records</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{patients.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
        />
        {query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color="#94a3b8" /></Pressable> : null}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#0f766e" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>{query ? 'No patients found' : 'No patients yet'}</Text>
              <Text style={styles.emptyText}>
                {query ? 'Try a different search term' : 'Patients are saved automatically when you create prescriptions with their phone number.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Patient Detail Modal */}
      <Modal visible={!!selectedPatient} transparent animationType="slide" onRequestClose={() => setSelectedPatient(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPatient(null)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            {selectedPatient && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{selectedPatient.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalName}>{selectedPatient.name}</Text>
                    <Text style={styles.modalSub}>{selectedPatient.age} yrs · {selectedPatient.gender}</Text>
                  </View>
                  <Pressable style={styles.modalClose} onPress={() => setSelectedPatient(null)}>
                    <Ionicons name="close" size={20} color="#94a3b8" />
                  </Pressable>
                </View>
                <View style={styles.modalBody}>
                  <DetailRow icon="call-outline" label="Phone" value={selectedPatient.phone} />
                  <DetailRow icon="water-outline" label="Blood Group" value={selectedPatient.bloodGroup} />
                  <DetailRow icon="scale-outline" label="Weight" value={selectedPatient.weight} />
                  <DetailRow icon="warning-outline" label="Allergies" value={selectedPatient.allergies} />
                  <DetailRow icon="location-outline" label="Address" value={selectedPatient.address} />
                  <DetailRow icon="calendar-outline" label="Visits" value={`${selectedPatient.visitCount} visit${selectedPatient.visitCount !== 1 ? 's' : ''}`} />
                </View>
                <View style={styles.modalActions}>
                  <Pressable style={styles.modalRxBtn} onPress={() => handleNewPrescription(selectedPatient)}>
                    <Ionicons name="document-text" size={18} color="#fff" />
                    <Text style={styles.modalRxText}>New Prescription</Text>
                  </Pressable>
                  <Pressable style={styles.modalDeleteBtn} onPress={() => { setSelectedPatient(null); handleDelete(selectedPatient.id, selectedPatient.name) }}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon as any} size={16} color="#0f766e" />
      <Text style={detailStyles.label}>{label}:</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  )
}
const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600', width: 90 },
  value: { fontSize: 13, color: '#1e293b', flex: 1 },
})

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#0f766e', flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  headerBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { flex: 1, paddingHorizontal: 32 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  cardAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaTag: { fontSize: 11, backgroundColor: '#f1f5f9', color: '#475569', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, fontWeight: '600' },
  cardVisit: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  rxBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  modalAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  modalName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  modalClose: { marginLeft: 'auto', padding: 4 },
  modalBody: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalRxBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f766e', paddingVertical: 14, borderRadius: 12 },
  modalRxText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalDeleteBtn: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
})
