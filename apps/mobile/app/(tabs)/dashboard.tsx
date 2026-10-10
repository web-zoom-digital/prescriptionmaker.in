import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Alert, Platform, StatusBar, RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { useState, useEffect, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getPrescriptions, deletePrescription, type Prescription } from '../../lib/prescriptions'
import { getCurrentUser, signOut, type AuthUser } from '../../lib/auth'
import { Colors, Typography, Spacing, Radius, Shadow } from '../../lib/design-system'

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS = {
  complete: { color: Colors.success, bg: Colors.successLight, label: 'Complete', icon: 'checkmark-circle' as const },
  draft:    { color: Colors.warning, bg: Colors.warningLight, label: 'Draft', icon: 'time-outline' as const },
  archived: { color: Colors.textMuted, bg: Colors.surface, label: 'Archived', icon: 'archive-outline' as const },
}

// ── Time Greeting ─────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, color }: { value: number | string; label: string; icon: string; color: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color }]}>
      <View style={[statStyles.iconBox, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 12,
    borderTopWidth: 3, alignItems: 'flex-start', gap: 4,
    ...Shadow.sm,
  },
  iconBox: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
})

// ── Prescription Card ─────────────────────────────────────────────────────────
function PrescriptionCard({ item, onDelete }: { item: Prescription; onDelete: () => void }) {
  const st = STATUS[item.status as keyof typeof STATUS] ?? STATUS.draft
  const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const initial = (item.patient_info?.name || 'U').charAt(0).toUpperCase()

  return (
    <Pressable
      style={({ pressed }) => [rxCard.card, pressed && { opacity: 0.96 }]}
      onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
    >
      {/* Left accent */}
      <View style={[rxCard.accent, { backgroundColor: st.color }]} />

      <View style={rxCard.body}>
        {/* Header */}
        <View style={rxCard.header}>
          <View style={[rxCard.avatar, { backgroundColor: `${Colors.primaryBlue}12` }]}>
            <Text style={rxCard.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rxCard.name} numberOfLines={1}>
              {item.patient_info?.name || 'Unknown Patient'}
            </Text>
            <Text style={rxCard.diagnosis} numberOfLines={1}>
              {item.diagnosis || 'No diagnosis recorded'}
            </Text>
          </View>
          <View style={[rxCard.badge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={10} color={st.color} />
            <Text style={[rxCard.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={rxCard.meta}>
          <View style={rxCard.metaItem}>
            <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
            <Text style={rxCard.metaText}>{date}</Text>
          </View>
          {item.medicines?.length > 0 && (
            <View style={rxCard.metaItem}>
              <Ionicons name="medical-outline" size={11} color={Colors.textMuted} />
              <Text style={rxCard.metaText}>{item.medicines.length} medicines</Text>
            </View>
          )}
          <View style={rxCard.metaItem}>
            <Ionicons name={item.mode === 'hand' ? 'pencil-outline' : 'document-text-outline'} size={11} color={Colors.textMuted} />
            <Text style={rxCard.metaText}>{item.mode === 'hand' ? 'Handwritten' : 'Form'}</Text>
          </View>
        </View>

        {/* Action row */}
        <View style={rxCard.actions}>
          <Pressable
            style={rxCard.actionBtn}
            onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
          >
            <Ionicons name="create-outline" size={13} color={Colors.primaryBlue} />
            <Text style={[rxCard.actionText, { color: Colors.primaryBlue }]}>Edit</Text>
          </Pressable>
          <Pressable style={rxCard.actionBtn} onPress={() => router.push('/tablet-mode')}>
            <Ionicons name="eye-outline" size={13} color={Colors.textSecondary} />
            <Text style={[rxCard.actionText, { color: Colors.textSecondary }]}>Preview</Text>
          </Pressable>
          <Pressable
            style={[rxCard.actionBtn, { backgroundColor: Colors.errorLight }]}
            onPress={() => Alert.alert('Delete', 'Delete this prescription?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ])}
          >
            <Ionicons name="trash-outline" size={13} color={Colors.error} />
            <Text style={[rxCard.actionText, { color: Colors.error }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

const rxCard = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    flexDirection: 'row', marginBottom: Spacing.sm,
    overflow: 'hidden', ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  accent: { width: 4, borderRadius: 2 },
  body: { flex: 1, padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: Colors.primaryBlue },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  diagnosis: { fontSize: 12, color: Colors.textSecondary, marginTop: 1, fontWeight: '400' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  actionText: { fontSize: 11, fontWeight: '700' },
})

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[qaStyles.card, { borderColor: `${color}20` }]} onPress={onPress}>
      <View style={[qaStyles.iconBox, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={qaStyles.label}>{label}</Text>
    </Pressable>
  )
}

const qaStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    alignItems: 'center', paddingVertical: 14, gap: 6,
    borderWidth: 1, ...Shadow.sm,
  },
  iconBox: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
})

// ── Dashboard Screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const [u, rxs] = await Promise.all([getCurrentUser(), getPrescriptions()])
      setUser(u)
      setPrescriptions(rxs)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    try {
      await deletePrescription(id)
      setPrescriptions(prev => prev.filter(p => p.id !== id))
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login') } },
    ])
  }

  // Stats
  const totalRx = prescriptions.length
  const thisMonth = prescriptions.filter(p => {
    const d = new Date(p.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const drafts = prescriptions.filter(p => p.status === 'draft').length

  const firstName = user?.name?.split(' ')[0] || 'Doctor'
  const initial = (user?.name || 'D').charAt(0).toUpperCase()

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkNavy} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.doctorName}>Dr. {firstName}</Text>
          {user?.plan && user.plan !== 'free' && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>{user.plan.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Pressable style={styles.avatarBtn} onPress={handleSignOut}>
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryBlue} />}
      >
        {/* ── Create CTA ── */}
        <Pressable
          style={({ pressed }) => [styles.createCTA, pressed && { opacity: 0.93 }]}
          onPress={() => router.push('/editor')}
        >
          <View style={styles.createCTALeft}>
            <View style={styles.createIconBox}>
              <Ionicons name="add-circle" size={26} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.createTitle}>Create New Prescription</Text>
              <Text style={styles.createSub}>Choose a template and start creating</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* ── Stats ── */}
        {!loading && (
          <View style={styles.statsRow}>
            <StatCard value={totalRx} label="Total Rx" icon="document-text" color={Colors.primaryBlue} />
            <StatCard value={thisMonth} label="This Month" icon="calendar" color={Colors.success} />
            <StatCard value={drafts} label="Drafts" icon="time" color={Colors.warning} />
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="document-text-outline" label="Form Editor"
              color={Colors.primaryBlue}
              onPress={() => router.push('/editor')}
            />
            <QuickAction
              icon="tablet-landscape-outline" label="Tablet Mode"
              color="#7c3aed"
              onPress={() => router.push('/tablet-mode')}
            />
            <QuickAction
              icon="people-outline" label="Patients"
              color={Colors.success}
              onPress={() => router.push('/patients')}
            />
            <QuickAction
              icon="calculator-outline" label="Dosage Calc"
              color={Colors.warning}
              onPress={() => router.push('/dosage-calculator')}
            />
          </View>
        </View>

        {/* ── Recent Prescriptions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
            <Pressable onPress={() => router.push('/patients')}>
              <Text style={styles.sectionLink}>View all</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={Colors.primaryBlue} size="large" />
              <Text style={styles.centerText}>Loading prescriptions...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorState}>
              <Ionicons name="cloud-offline-outline" size={40} color={Colors.error} />
              <Text style={styles.errorTitle}>Could not load data</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={fetchData}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : prescriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="document-text-outline" size={32} color={Colors.primaryBlue} />
              </View>
              <Text style={styles.emptyTitle}>No prescriptions yet</Text>
              <Text style={styles.emptyText}>Create your first prescription to get started</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/editor')}>
                <Ionicons name="add" size={16} color={Colors.white} />
                <Text style={styles.emptyBtnText}>Create Prescription</Text>
              </Pressable>
            </View>
          ) : (
            prescriptions.slice(0, 8).map(item => (
              <PrescriptionCard
                key={item.id}
                item={item}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },

  // Header
  header: {
    backgroundColor: Colors.darkNavy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: 10, paddingBottom: 16,
  },
  headerLeft: { flex: 1, gap: 1 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', letterSpacing: 0.3 },
  doctorName: { ...Typography.h3, color: Colors.white },
  proBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryBlue,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3,
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.8 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  // Scroll
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Create CTA
  createCTA: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: Radius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Shadow.blue,
  },
  createCTALeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  createIconBox: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  createTitle: { fontSize: 15, fontWeight: '800', color: Colors.white },
  createSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '400' },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.xs },

  // Quick Actions
  quickActionsGrid: { flexDirection: 'row', gap: Spacing.xs, marginTop: 8 },

  // Sections
  section: { gap: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  sectionLink: { fontSize: 13, color: Colors.primaryBlue, fontWeight: '600' },

  // States
  centerState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  centerText: { ...Typography.bodySm, color: Colors.textMuted },
  errorState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  errorTitle: { ...Typography.h4, color: Colors.textPrimary },
  errorText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: Colors.primaryBlue,
    paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.md,
  },
  retryText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  emptyState: {
    alignItems: 'center', paddingVertical: 40, gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl,
  },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: Radius.xl,
    backgroundColor: Colors.lightBlue, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { ...Typography.h4, color: Colors.textPrimary, marginTop: 4 },
  emptyText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryBlue, paddingHorizontal: Spacing.lg,
    paddingVertical: 10, borderRadius: Radius.md, marginTop: 8,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
})
