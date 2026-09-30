import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getCurrentUser, signOut, type AuthUser } from '../../lib/auth'

function SettingRow({ icon, label, value, onPress, color = '#0f766e', destructive = false }: {
  icon: string; label: string; value?: string; onPress?: () => void; color?: string; destructive?: boolean
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
})

export default function SettingsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
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
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Dr. {user?.name || 'Loading...'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.planBadge}>
              <Ionicons name="star" size={10} color="#f59e0b" />
              <Text style={styles.planText}>{(user?.plan || 'free').toUpperCase()} Plan</Text>
            </View>
          </View>
        </View>

        {/* Prescription */}
        <Text style={styles.sectionLabel}>Prescription</Text>
        <SettingRow icon="document-text-outline" label="New Prescription (Form)" onPress={() => router.push('/editor')} />
        <SettingRow icon="pencil-outline" label="Hand Mode Drawing" onPress={() => router.push('/hand-mode')} />
        <SettingRow icon="newspaper-outline" label="View All Prescriptions" onPress={() => router.push('/(tabs)/dashboard')} />

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <SettingRow icon="person-outline" label="Profile" value={user?.name || ''} />
        <SettingRow icon="mail-outline" label="Email" value={user?.email || ''} />
        <SettingRow icon="ribbon-outline" label="Plan" value={user?.plan === 'pro' ? '⭐ Pro Plan' : '🆓 Free Plan'} />

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <SettingRow icon="information-circle-outline" label="App Version" value="1.0.0" />
        <SettingRow icon="globe-outline" label="Website" value="prescriptionmaker.in" />
        <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" />

        {/* Danger */}
        <Text style={styles.sectionLabel}>Session</Text>
        <SettingRow icon="log-out-outline" label="Logout" onPress={handleLogout} destructive />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#0f766e',
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  profileEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  planText: { fontSize: 10, fontWeight: '700', color: '#d97706' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, paddingLeft: 4 },
})
