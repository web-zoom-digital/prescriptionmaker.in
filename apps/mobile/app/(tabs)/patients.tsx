import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Platform, StatusBar, TextInput
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography, Spacing, Radius, Shadow } from '../../lib/design-system'

type PatientSummary = {
  name: string
  phone: string
  lastDate: string
  rxCount: number
}

// ── Avatar Color palette (Premium hues) ──────
const AVATAR_COLORS = [
  Colors.primaryBlue, '#6366f1', '#d97706', '#e11d48', '#059669', '#7c3aed', '#0284c7'
]
function getAvatarColor(name: string): string {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]!
}

// ── Patient Card ───────────────────────────────────────
function PatientCard({ item, onPress }: { item: PatientSummary; onPress: () => void }) {
  const color = getAvatarColor(item.name)
  const initials = item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
      onPress={onPress}
    >
      <View style={[styles.avatar, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {!!item.phone && (
          <View style={styles.phoneLine}>
            <Ionicons name="call" size={10} color={Colors.textMuted} />
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: `${color}10` }]}>
            <Ionicons name="document-text" size={10} color={color} />
            <Text style={[styles.metaChipText, { color }]}>{item.rxCount} Rx</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={10} color={Colors.textMuted} />
            <Text style={styles.metaChipTextGray}>{item.lastDate}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.chevronWrap, { backgroundColor: Colors.surface }]}>
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>
    </Pressable>
  )
}

// ── MAIN SCREEN ────────────────────────────────────────
export default function PatientsTab() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadPatients = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('prescriptions')
        .select('patient_info, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const patientMap = new Map<string, PatientSummary>()
      for (const rx of data) {
        const name = rx.patient_info?.name?.trim()
        const phone = rx.patient_info?.phone?.trim()
        if (!name) continue
        const key = phone || name

        if (!patientMap.has(key)) {
          patientMap.set(key, { 
            name, phone: phone || '', 
            lastDate: new Date(rx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), 
            rxCount: 1 
          })
        } else {
          patientMap.get(key)!.rxCount += 1
        }
      }
      setPatients(Array.from(patientMap.values()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { loadPatients() }, []))

  const filtered = search.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search))
    : patients

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkNavy} />

      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Patient Records</Text>
            <Text style={styles.heroSub}>{patients.length} unique patients treated</Text>
          </View>
          <View style={styles.heroCountBadge}>
            <Text style={styles.heroCount}>{patients.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>{search ? 'No results found' : 'No Patients Yet'}</Text>
          <Text style={styles.emptyDesc}>
            {search ? `No patient matching "${search}"` : 'Create a prescription to add patients.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.phone || item.name}
          renderItem={({ item }) => (
            <PatientCard
              item={item}
              onPress={() => router.push({
                pathname: '/patient/[phone]',
                params: { phone: item.phone || item.name, name: item.name, byname: item.phone ? '0' : '1' }
              })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },

  // Hero
  hero: {
    backgroundColor: Colors.darkNavy,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 24,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: Spacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { ...Typography.h1, color: Colors.white, marginBottom: 2 },
  heroSub: { ...Typography.bodySm, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroCountBadge: { 
    width: 48, height: 48, borderRadius: 24, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  heroCount: { fontSize: 20, fontWeight: '900', color: Colors.white },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.md, 
    paddingHorizontal: 16, paddingVertical: 12,
    ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 0, fontWeight: '500' },

  // List
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 14,
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1, gap: 4 },
  name: { ...Typography.h4, color: Colors.textPrimary },
  phoneLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phone: { ...Typography.caption, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  metaChipText: { fontSize: 10, fontWeight: '800' },
  metaChipTextGray: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  chevronWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { ...Typography.bodySm, color: Colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 6 },
  emptyDesc: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
