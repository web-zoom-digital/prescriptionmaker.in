import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getCurrentUser, signOut, type AuthUser } from '../../lib/auth'
import { getDoctorProfile, getReminders, getSavedPatients } from '../../lib/local-store'

const TEAL = '#0d9488'
const TEAL_DARK = '#0f766e'

// ── Setting Row ────────────────────────────────────────
function SettingRow({
  icon, label, value, onPress, color = TEAL, destructive = false, badge, arrow = true
}: {
  icon: string; label: string; value?: string; onPress?: () => void
  color?: string; destructive?: boolean; badge?: number; arrow?: boolean
}) {
  const iconBg = destructive ? '#fff1f2' : `${color}15`
  const iconColor = destructive ? '#ef4444' : color
  const textColor = destructive ? '#ef4444' : '#0f172a'

  return (
    <Pressable
      style={({ pressed }) => [srStyles.row, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[srStyles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={17} color={iconColor} />
      </View>
      <View style={srStyles.rowContent}>
        <Text style={[srStyles.label, { color: textColor }]}>{label}</Text>
        {value ? <Text style={srStyles.value} numberOfLines={1}>{value}</Text> : null}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[srStyles.badge, { backgroundColor: color }]}>
          <Text style={srStyles.badgeText}>{badge}</Text>
        </View>
      )}
      {arrow && onPress && !destructive && (
        <Ionicons name="chevron-forward" size={15} color="#cbd5e1" />
      )}
    </Pressable>
  )
}

const srStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  value: { fontSize: 11, color: '#94a3b8' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
})

// ── Section Card ───────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={scStyles.card}>
      <Text style={scStyles.label}>{title}</Text>
      <View style={scStyles.inner}>{children}</View>
    </View>
  )
}
const scStyles = StyleSheet.create({
  card: { marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6, paddingLeft: 2 },
  inner: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
})

// ── MAIN SETTINGS SCREEN ───────────────────────────────
export default function SettingsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [patientCount, setPatientCount] = useState(0)
  const [pendingReminders, setPendingReminders] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    getCurrentUser().then(setUser)
    getSavedPatients().then(p => setPatientCount(p.length))
    getReminders().then(r => setPendingReminders(r.filter(rem => !rem.isDone).length))
    getDoctorProfile().then(p => setHasProfile(!!p?.name))
  }, [])

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await signOut()
        router.replace('/login')
      }},
    ])
  }

  const isPro = user?.plan === 'pro'

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* ── Hero Profile Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{(user?.name || 'D').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>Dr. {user?.name || 'Loading...'}</Text>
            <Text style={styles.heroEmail}>{user?.email || ''}</Text>
            <View style={styles.planBadge}>
              <Ionicons name={isPro ? 'star' : 'star-outline'} size={10} color={isPro ? '#f59e0b' : '#94a3b8'} />
              <Text style={[styles.planText, { color: isPro ? '#f59e0b' : '#94a3b8' }]}>
                {isPro ? 'PRO PLAN' : 'FREE PLAN'}
              </Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/doctor-profile')}>
            <Ionicons name="create-outline" size={15} color={TEAL} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile warning */}
        {!hasProfile && (
          <Pressable style={styles.warningBanner} onPress={() => router.push('/doctor-profile')}>
            <Ionicons name="warning" size={15} color="#d97706" />
            <Text style={styles.warningText}>Set up your Doctor Profile to auto-fill prescriptions faster!</Text>
            <Ionicons name="chevron-forward" size={13} color="#d97706" />
          </Pressable>
        )}

        <SectionCard title="Create">
          <SettingRow icon="document-text-outline" label="New Prescription" value="Form mode editor" onPress={() => router.push('/editor')} />
          <SettingRow icon="pencil-outline" label="Hand Mode" value="Draw a prescription" onPress={() => router.push('/hand-mode')} color="#7c3aed" />
        </SectionCard>

        <SectionCard title="Doctor Tools">
          <SettingRow icon="person-circle-outline" label="My Doctor Profile" value={hasProfile ? '✓ Profile saved' : 'Not set up yet'} onPress={() => router.push('/doctor-profile')} />
          <SettingRow icon="people-outline" label="Patient Records" value={`${patientCount} saved patients`} onPress={() => router.push('/(tabs)/patients')} color="#6366f1" badge={patientCount} />
          <SettingRow icon="notifications-outline" label="Follow-up Reminders" value={pendingReminders > 0 ? `${pendingReminders} pending` : 'None pending'} onPress={() => router.push('/reminders')} color="#d97706" badge={pendingReminders} />
          <SettingRow icon="flask-outline" label="Dosage Calculator" value="Pediatric & Adult doses" onPress={() => router.push('/dosage-calculator')} color="#059669" />
        </SectionCard>

        <SectionCard title="Account">
          <SettingRow icon="mail-outline" label="Email" value={user?.email || ''} arrow={false} color="#64748b" />
          <SettingRow
            icon="ribbon-outline"
            label="Plan"
            value={isPro ? '⭐ Pro Plan Active' : '🆓 Free Plan — Upgrade for more'}
            color="#f59e0b"
            arrow={!isPro}
          />
        </SectionCard>

        <SectionCard title="About">
          <SettingRow icon="information-circle-outline" label="App Version" value="2.0.0" arrow={false} color="#64748b" />
          <SettingRow icon="globe-outline" label="prescriptionmaker.in" value="Visit website" color="#64748b" />
          <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" color="#64748b" />
        </SectionCard>

        <SectionCard title="Session">
          <SettingRow icon="log-out-outline" label="Logout" onPress={handleLogout} destructive arrow={false} />
        </SectionCard>

        <Text style={styles.footerText}>PrescriptionMaker v2.0 · Made for Indian doctors 🇮🇳</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // Hero
  hero: {
    backgroundColor: TEAL_DARK,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroEmail: { fontSize: 12, color: '#99f6e4', marginTop: 1 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  planText: { fontSize: 10, fontWeight: '800' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: TEAL },

  // Content
  content: { padding: 16, paddingBottom: 40, gap: 0 },

  // Warning
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 17 },

  footerText: { textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 20, marginBottom: 8 },
})
