import {
  View, Text, StyleSheet, Pressable, ScrollView, Image,
  ActivityIndicator, Alert, Platform, StatusBar
} from 'react-native'
import { router } from 'expo-router'
import { useState, useEffect, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { getPrescriptions, deletePrescription, type Prescription } from '../../lib/prescriptions'
import { signOut, getCurrentUser, type AuthUser } from '../../lib/auth'
import { MOBILE_TEMPLATES, TEMPLATE_CATEGORIES } from '../../lib/templates'

// ── Design Tokens ─────────────────────────────────────
const TEAL = '#0d9488'
const TEAL_DARK = '#0f766e'
const TEAL_LIGHT = '#ccfbf1'
const BG = '#f8fafc'

const STATUS_CONFIG = {
  complete: { color: '#059669', bg: '#d1fae5', label: 'Done', icon: 'checkmark-circle' },
  draft:    { color: '#d97706', bg: '#fef3c7', label: 'Draft', icon: 'time-outline' },
  archived: { color: '#94a3b8', bg: '#f1f5f9', label: 'Archived', icon: 'archive-outline' },
} as const

// ── Prescription Card ──────────────────────────────────
function PrescriptionCard({ item, onDelete }: { item: Prescription; onDelete: () => void }) {
  const st = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
  const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <Pressable
      style={({ pressed }) => [pStyles.card, pressed && { opacity: 0.97, transform: [{ scale: 0.995 }] }]}
      onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
    >
      <View style={[pStyles.accentLine, { backgroundColor: st.color }]} />
      <View style={pStyles.cardInner}>
        {/* Top Row */}
        <View style={pStyles.topRow}>
          <View style={[pStyles.patientAvatar, { backgroundColor: `${TEAL}18` }]}>
            <Text style={[pStyles.patientInitial, { color: TEAL }]}>
              {(item.patient_info?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pStyles.patientName} numberOfLines={1}>
              {item.patient_info?.name || 'Unknown Patient'}
            </Text>
            <Text style={pStyles.diagnosis} numberOfLines={1}>
              {item.diagnosis || 'No diagnosis'}
            </Text>
          </View>
          <View style={[pStyles.statusBadge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon as any} size={10} color={st.color} />
            <Text style={[pStyles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={pStyles.metaRow}>
          <View style={pStyles.metaItem}>
            <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
            <Text style={pStyles.metaText}>{date}</Text>
          </View>
          {item.medicines?.length > 0 && (
            <View style={pStyles.metaItem}>
              <Ionicons name="medical-outline" size={11} color="#94a3b8" />
              <Text style={pStyles.metaText}>{item.medicines.length} medicines</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={pStyles.actions}>
          <Pressable style={pStyles.actionBtn} onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}>
            <Ionicons name="create-outline" size={13} color={TEAL} />
            <Text style={[pStyles.actionText, { color: TEAL }]}>Edit</Text>
          </Pressable>
          <Pressable style={pStyles.actionBtn} onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}>
            <Ionicons name="eye-outline" size={13} color="#6366f1" />
            <Text style={[pStyles.actionText, { color: '#6366f1' }]}>View</Text>
          </Pressable>
          <Pressable style={[pStyles.actionBtn, pStyles.deleteBtn]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={13} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

const pStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    overflow: 'hidden',
  },
  accentLine: { width: 4 },
  cardInner: { flex: 1, padding: 12, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patientAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  patientInitial: { fontSize: 15, fontWeight: '800' },
  patientName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  diagnosis: { fontSize: 12, color: '#64748b', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#94a3b8' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  actionText: { fontSize: 12, fontWeight: '700' },
  deleteBtn: { marginLeft: 'auto' as any, backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
})

// ── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, color, icon, sub }: { label: string; value: number; color: string; icon: string; sub?: string }) {
  return (
    <View style={[sStyles.card, { borderTopColor: color }]}>
      <View style={[sStyles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[sStyles.value, { color }]}>{value}</Text>
      <Text style={sStyles.label}>{label}</Text>
      {sub && <Text style={sStyles.sub}>{sub}</Text>}
    </View>
  )
}
const sStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  iconBox: { width: 30, height: 30, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: 24, fontWeight: '900' },
  label: { fontSize: 11, color: '#64748b', fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 9, color: '#94a3b8' },
})

// ── Template Card ──────────────────────────────────────
function TemplateCard({ tmpl }: { tmpl: (typeof MOBILE_TEMPLATES)[number] }) {
  return (
    <Pressable
      style={({ pressed }) => [tmplStyles.card, pressed && { opacity: 0.93 }]}
      onPress={() => router.push({ pathname: '/editor', params: { templateId: tmpl.id } })}
    >
      <View style={[tmplStyles.colorTop, { backgroundColor: tmpl.styles.primaryColor }]} />
      <Image source={tmpl.image} style={tmplStyles.preview} resizeMode="cover" />
      <View style={tmplStyles.body}>
        <Text style={[tmplStyles.name, { color: tmpl.styles.primaryColor }]} numberOfLines={2}>{tmpl.name}</Text>
        <Text style={tmplStyles.desc} numberOfLines={2}>{tmpl.description}</Text>
        <View style={tmplStyles.footer}>
          {tmpl.isPremium && (
            <View style={tmplStyles.proBadge}><Text style={tmplStyles.proText}>PRO</Text></View>
          )}
          <View style={[tmplStyles.catBadge, { backgroundColor: `${tmpl.styles.primaryColor}15` }]}>
            <Text style={[tmplStyles.catText, { color: tmpl.styles.primaryColor }]}>{tmpl.category}</Text>
          </View>
        </View>
        <Pressable
          style={[tmplStyles.useBtn, { backgroundColor: tmpl.styles.primaryColor }]}
          onPress={() => router.push({ pathname: '/editor', params: { templateId: tmpl.id } })}
        >
          <Text style={tmplStyles.useBtnText}>Use Template</Text>
          <Ionicons name="arrow-forward" size={12} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  )
}
const tmplStyles = StyleSheet.create({
  card: { width: 168, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  colorTop: { height: 3, width: '100%' },
  preview: { width: '100%', height: 130 },
  body: { padding: 10, gap: 5 },
  name: { fontSize: 13, fontWeight: '800', lineHeight: 17 },
  desc: { fontSize: 11, color: '#64748b', lineHeight: 14 },
  footer: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 2 },
  proBadge: { backgroundColor: '#f59e0b', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  proText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  catBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  catText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' as const },
  useBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  useBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})

// ── Time Greeting ──────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// ── MAIN DASHBOARD ─────────────────────────────────────
export default function Dashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [filter, setFilter] = useState<'all' | 'complete' | 'draft'>('all')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showTemplates, setShowTemplates] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [rxData, userData] = await Promise.all([getPrescriptions(), getCurrentUser()])
      setPrescriptions(rxData)
      setUser(userData)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete', `Delete prescription for "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deletePrescription(id)
        setPrescriptions(prev => prev.filter(p => p.id !== id))
      }},
    ])
  }

  const filtered = filter === 'all' ? prescriptions : prescriptions.filter(p => p.status === filter)
  const stats = {
    total: prescriptions.length,
    complete: prescriptions.filter(p => p.status === 'complete').length,
    draft: prescriptions.filter(p => p.status === 'draft').length,
  }

  const filteredTemplates = MOBILE_TEMPLATES.filter(t => activeCategory === 'all' || t.category === activeCategory)

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* ── Hero Header ── */}
      <View style={styles.heroHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
            <Text style={styles.doctorName}>Dr. {user?.name || 'Doctor'}</Text>
          </View>
          <Pressable
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.avatarLetter}>{(user?.name || 'D').charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>

        {/* Stats inline in header */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} color={TEAL} icon="documents-outline" />
          <StatCard label="Done" value={stats.complete} color="#059669" icon="checkmark-circle-outline" />
          <StatCard label="Drafts" value={stats.draft} color="#d97706" icon="time-outline" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActions}>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/editor')}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>New Prescription</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/hand-mode')}>
            <Ionicons name="pencil" size={18} color={TEAL} />
            <Text style={styles.secondaryBtnText}>Hand Mode</Text>
          </Pressable>
        </View>

        {/* ── Templates Section ── */}
        <View style={styles.sectionCard}>
          <Pressable style={styles.sectionHeader} onPress={() => setShowTemplates(v => !v)}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconBox, { backgroundColor: `${TEAL}18` }]}>
                <Ionicons name="layers-outline" size={16} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Prescription Templates</Text>
                <Text style={styles.sectionSub}>Pick a professional design</Text>
              </View>
            </View>
            <Ionicons name={showTemplates ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
          </Pressable>

          {showTemplates && (
            <View>
              {/* Category Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.id}
                    style={[styles.catPill, activeCategory === cat.id && styles.catPillActive]}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Text style={[styles.catPillText, activeCategory === cat.id && styles.catPillTextActive]}>
                      {cat.emoji} {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Template Cards */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tmplRow}>
                {filteredTemplates.map(tmpl => (
                  <TemplateCard key={tmpl.id} tmpl={tmpl} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── Prescriptions Section ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconBox, { backgroundColor: '#6366f115' }]}>
                <Ionicons name="document-text-outline" size={16} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>My Prescriptions</Text>
                <Text style={styles.sectionSub}>{prescriptions.length} total</Text>
              </View>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            {(['all', 'complete', 'draft'] as const).map(f => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f === 'all' ? `All (${stats.total})` : f === 'complete' ? `Done (${stats.complete})` : `Drafts (${stats.draft})`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* List */}
          <View style={styles.listContent}>
            {isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={TEAL} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No prescriptions yet</Text>
                <Text style={styles.emptyText}>Tap "New Prescription" above to get started</Text>
              </View>
            ) : (
              filtered.map(item => (
                <PrescriptionCard
                  key={item.id}
                  item={item}
                  onDelete={() => handleDelete(item.id, item.patient_info?.name || 'this')}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Hero header
  heroHeader: {
    backgroundColor: TEAL_DARK,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, color: '#99f6e4', fontWeight: '500' },
  doctorName: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 2 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarLetter: { fontSize: 17, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10 },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: TEAL, paddingVertical: 14, borderRadius: 14,
    shadowColor: TEAL, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: TEAL,
  },
  secondaryBtnText: { color: TEAL, fontWeight: '800', fontSize: 14 },

  // Section card
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sectionSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  // Category pills
  catRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  catPillActive: { backgroundColor: TEAL, borderColor: TEAL },
  catPillText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  catPillTextActive: { color: '#fff' },

  // Template cards row
  tmplRow: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },

  // Filter tabs
  filterRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, gap: 6 },
  filterTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center', backgroundColor: '#f8fafc' },
  filterTabActive: { backgroundColor: `${TEAL}18` },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  filterTabTextActive: { color: TEAL },

  // List content
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },

  // States
  center: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#94a3b8' },
  empty: { paddingVertical: 40, alignItems: 'center', paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
})
