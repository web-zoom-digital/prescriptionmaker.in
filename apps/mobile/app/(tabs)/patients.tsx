import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Platform, StatusBar, TextInput
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

const TEAL = '#0d9488'
const TEAL_DARK = '#0f766e'

type PatientSummary = {
  name: string
  phone: string
  lastDate: string
  rxCount: number
}

// ── Avatar Color palette (deterministic from name) ──────
const AVATAR_COLORS = ['#0d9488', '#6366f1', '#d97706', '#e11d48', '#059669', '#7c3aed', '#0284c7']
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
      <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {!!item.phone && (
          <View style={styles.phoneLine}>
            <Ionicons name="call-outline" size={11} color="#94a3b8" />
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="document-text-outline" size={10} color={color} />
            <Text style={[styles.metaChipText, { color }]}>{item.rxCount} Rx</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={10} color="#94a3b8" />
            <Text style={styles.metaChipTextGray}>{item.lastDate}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.chevronWrap, { backgroundColor: `${color}10` }]}>
        <Ionicons name="chevron-forward" size={15} color={color} />
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
          patientMap.set(key, { name, phone: phone || '', lastDate: new Date(rx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), rxCount: 1 })
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
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Patients</Text>
            <Text style={styles.heroSub}>{patients.length} unique patients</Text>
          </View>
          <View style={[styles.heroCountBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text style={styles.heroCount}>{patients.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={TEAL} />
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
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // Hero
  hero: {
    backgroundColor: TEAL_DARK,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 12,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroSub: { fontSize: 12, color: '#99f6e4', marginTop: 2 },
  heroCountBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  heroCount: { fontSize: 20, fontWeight: '900', color: '#fff' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 },

  // List
  list: { padding: 14, gap: 8, paddingBottom: 32 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  phoneLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { fontSize: 12, color: '#64748b' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f8fafc', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3 },
  metaChipText: { fontSize: 10, fontWeight: '700' },
  metaChipTextGray: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  chevronWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#94a3b8' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#334155', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 19 },
})
