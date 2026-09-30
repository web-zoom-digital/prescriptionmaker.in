import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Alert, RefreshControl, Platform
} from 'react-native'
import { router } from 'expo-router'
import { useState, useEffect, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { getPrescriptions, deletePrescription, type Prescription } from '../../lib/prescriptions'
import { signOut, getCurrentUser, type AuthUser } from '../../lib/auth'

const STATUS_CONFIG = {
  complete: { color: '#16a34a', bg: '#f0fdf4', label: 'Complete', icon: 'checkmark-circle' },
  draft: { color: '#d97706', bg: '#fffbeb', label: 'Draft', icon: 'time-outline' },
  archived: { color: '#94a3b8', bg: '#f8fafc', label: 'Archived', icon: 'archive-outline' },
} as const

export default function Dashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [filter, setFilter] = useState<'all' | 'complete' | 'draft'>('all')

  const loadData = useCallback(async () => {
    try {
      const [rxData, userData] = await Promise.all([getPrescriptions(), getCurrentUser()])
      setPrescriptions(rxData)
      setUser(userData)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Prescription', `Delete prescription for "${name}"?`, [
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await signOut()
        router.replace('/login')
      }},
    ])
  }

  const filtered = filter === 'all' ? prescriptions : prescriptions.filter(p => p.status === filter)

  const stats = {
    total: prescriptions.length,
    complete: prescriptions.filter(p => p.status === 'complete').length,
    draft: prescriptions.filter(p => p.status === 'draft').length,
  }

  const renderItem = ({ item }: { item: Prescription }) => {
    const st = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: st.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{item.patient_info?.name || 'Unknown Patient'}</Text>
              <Text style={styles.diagnosis} numberOfLines={1}>
                {item.diagnosis || 'No diagnosis recorded'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Ionicons name={st.icon as any} size={11} color={st.color} />
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.metaDate}>
              <Ionicons name="calendar-outline" size={11} color="#94a3b8" /> {' '}
              {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            {item.medicines?.length > 0 && (
              <Text style={styles.metaMed}>
                <Ionicons name="medical-outline" size={11} color="#94a3b8" /> {' '}
                {item.medicines.length} medicine{item.medicines.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={styles.cardActions}>
            <Pressable style={styles.editBtn} onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}>
              <Ionicons name="create-outline" size={14} color="#0f766e" />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.viewBtn} onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}>
              <Ionicons name="document-text-outline" size={14} color="#1e40af" />
              <Text style={[styles.editBtnText, { color: '#1e40af' }]}>View</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.patient_info?.name || 'this')}>
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getTimeGreeting()} 👋</Text>
          <Text style={styles.doctorName}>Dr. {user?.name || 'Doctor'}</Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} color="#0f766e" icon="documents-outline" />
        <StatCard label="Complete" value={stats.complete} color="#16a34a" icon="checkmark-circle-outline" />
        <StatCard label="Drafts" value={stats.draft} color="#d97706" icon="time-outline" />
      </View>

      {/* New Prescription CTA */}
      <View style={styles.ctaRow}>
        <Pressable style={styles.newFormBtn} onPress={() => router.push('/editor')}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.newBtnText}>Form Mode</Text>
        </Pressable>
        <Pressable style={styles.newHandBtn} onPress={() => router.push('/hand-mode')}>
          <Ionicons name="pencil" size={20} color="#1e293b" />
          <Text style={styles.handBtnText}>Hand Mode</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'complete', 'draft'] as const).map(f => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? `All (${stats.total})` : f === 'complete' ? `Done (${stats.complete})` : `Drafts (${stats.draft})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} colors={['#0f766e']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No prescriptions yet</Text>
              <Text style={styles.emptyText}>Tap "Form Mode" or "Hand Mode" above to create your first prescription</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}
const statStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
})

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  greeting: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  doctorName: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  ctaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  newFormBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f766e', paddingVertical: 14, borderRadius: 12, shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  newHandBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0' },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  handBtnText: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, backgroundColor: '#f1f5f9', marginHorizontal: 16, borderRadius: 10, padding: 3 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  filterText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  filterTextActive: { color: '#0f766e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  diagnosis: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: 14 },
  metaDate: { fontSize: 11, color: '#94a3b8' },
  metaMed: { fontSize: 11, color: '#94a3b8' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#0f766e', fontSize: 12, fontWeight: '700' },
  deleteBtn: { marginLeft: 'auto', backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
})
