import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { Link, router } from 'expo-router'
import { useState, useEffect, useCallback } from 'react'
import { getPrescriptions, deletePrescription, type Prescription } from '../../lib/prescriptions'
import { signOut } from '../../lib/auth'

export default function Dashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPrescriptions = useCallback(async () => {
    try {
      const data = await getPrescriptions()
      setPrescriptions(data)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadPrescriptions() }, [loadPrescriptions])

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deletePrescription(id)
              setPrescriptions(prev => prev.filter(p => p.id !== id))
            } catch (err: any) {
              Alert.alert('Error', err.message)
            }
          }
        }
      ]
    )
  }

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  const statusColor = (status: string) => {
    if (status === 'complete') return '#22c55e'
    if (status === 'draft') return '#f59e0b'
    return '#ef4444'
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </Pressable>
      </View>

      {/* New Prescription Button */}
      <Pressable style={styles.newBtn} onPress={() => router.push('/editor')}>
        <Text style={styles.newBtnText}>+ New Prescription</Text>
      </Pressable>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={prescriptions.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadPrescriptions() }}
              colors={['#0f766e']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No prescriptions yet</Text>
              <Text style={styles.emptyText}>Tap "+ New Prescription" to get started</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Left: Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.patientName}>
                  {item.patient_info?.name || 'Unknown Patient'}
                </Text>
                <Text style={styles.diagnosis}>{item.diagnosis || 'No diagnosis'}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </Text>
              </View>

              {/* Right: Badge + Actions */}
              <View style={styles.cardActions}>
                <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20' }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0f766e', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  logoutBtn: { fontSize: 14, color: '#99f6e4', fontWeight: '600' },
  newBtn: {
    margin: 16, backgroundColor: '#0f766e', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
    shadowColor: '#0f766e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  newBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardInfo: { flex: 1, marginRight: 12 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  diagnosis: { fontSize: 13, color: '#64748b', marginBottom: 3 },
  date: { fontSize: 12, color: '#94a3b8' },
  cardActions: { alignItems: 'flex-end', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#0f766e', fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  deleteBtnText: { color: '#e11d48', fontSize: 12, fontWeight: '700' },
})
