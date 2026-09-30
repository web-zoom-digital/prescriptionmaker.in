import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getCurrentUser, signOut, type AuthUser } from '../../lib/auth'
import { getDoctorProfile, getReminders, getSavedPatients } from '../../lib/local-store'

function SettingRow({ icon, label, value, onPress, color = '#0f766e', destructive = false, badge }: {
  icon: string; label: string; value?: string; onPress?: () => void; color?: string; destructive?: boolean; badge?: number
}) {
  return (
    <Pressable style={[srStyles.row, destructive && srStyles.destructiveRow]} onPress={onPress}>
      <View style={[srStyles.iconBox, { backgroundColor: destructive ? '#fff1f2' : `${color}15` }]}>
        <Ionicons name={icon as any} size={18} color={destructive ? '#ef4444' : color} />
      </View>
      <View style={srStyles.content}>
        <Text style={[srStyles.label, destructive && { color: '#ef4444' }]}>{label}</Text>
        {value ? <Text style={srStyles.value}>{value}</Text> : null}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={srStyles.badge}><Text style={srStyles.badgeText}>{badge}</Text></View>
      )}
      {!destructive && <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />}
    </Pressable>
  )
}
const srStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 6 },
  destructiveRow: { backgroundColor: '#fff1f2' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  value: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  badge: { backgroundColor: '#ef4444', borderRadius: 99, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
})

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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings & Tools</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Dr. {user?.name || 'Loading...'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.planBadge}>
              <Ionicons name="star" size={10} color="#f59e0b" />
              <Text style={styles.planText}>{(user?.plan || 'free').toUpperCase()} Plan</Text>
            </View>
          </View>
          <Pressable style={styles.editProfileBtn} onPress={() => router.push('/doctor-profile')}>
            <Ionicons name="create-outline" size={16} color="#0f766e" />
          </Pressable>
        </View>

        {/* Profile Setup Warning */}
        {!hasProfile && (
          <Pressable style={styles.warningBanner} onPress={() => router.push('/doctor-profile')}>
            <Ionicons name="warning-outline" size={16} color="#d97706" />
            <Text style={styles.warningText}>Set up your Doctor Profile to auto-fill prescriptions faster!</Text>
            <Ionicons name="chevron-forward" size={14} color="#d97706" />
          </Pressable>
        )}

        {/* Quick Create */}
        <Text style={styles.sectionLabel}>Create Prescription</Text>
        <SettingRow icon="document-text-outline" label="New Prescription (Form Mode)" onPress={() => router.push('/editor')} />
        <SettingRow icon="pencil-outline" label="Hand Mode Drawing" onPress={() => router.push('/hand-mode')} color="#7c3aed" />

        {/* Doctor Tools */}
        <Text style={styles.sectionLabel}>Doctor Tools</Text>
        <SettingRow icon="person-circle-outline" label="My Doctor Profile" value={hasProfile ? '✓ Profile saved' : 'Set up profile'} onPress={() => router.push('/doctor-profile')} />
        <SettingRow icon="people-outline" label="Patient Records" value={`${patientCount} saved patients`} onPress={() => router.push('/patients')} color="#1e40af" badge={patientCount} />
        <SettingRow icon="notifications-outline" label="Follow-up Reminders" value={pendingReminders > 0 ? `${pendingReminders} pending` : 'No pending reminders'} onPress={() => router.push('/reminders')} color="#d97706" badge={pendingReminders} />
        <SettingRow icon="flask-outline" label="⚖️ Dosage Calculator" value="Pediatric & Adult doses" onPress={() => router.push('/dosage-calculator')} color="#0f766e" />

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <SettingRow icon="mail-outline" label="Email" value={user?.email || ''} color="#64748b" />
        <SettingRow icon="ribbon-outline" label="Plan" value={user?.plan === 'pro' ? '⭐ Pro Plan Active' : '🆓 Free Plan'} color="#f59e0b" />

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <SettingRow icon="information-circle-outline" label="App Version" value="2.0.0 (Beta)" color="#64748b" />
        <SettingRow icon="globe-outline" label="Website" value="prescriptionmaker.in" color="#64748b" />
        <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" color="#64748b" />

        {/* Danger */}
        <Text style={styles.sectionLabel}>Session</Text>
        <SettingRow icon="log-out-outline" label="Logout" onPress={handleLogout} destructive />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#0f766e' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  profileEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  planText: { fontSize: 10, fontWeight: '700', color: '#d97706' },
  editProfileBtn: { width: 34, height: 34, backgroundColor: '#f0fdf4', borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, paddingLeft: 4 },
})
