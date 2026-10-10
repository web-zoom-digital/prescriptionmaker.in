import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getCurrentUser, signOut, type AuthUser } from '../../lib/auth'
import { Colors, Typography, Spacing, Radius, Shadow } from '../../lib/design-system'

type SettingRow = {
  icon: string; label: string; sublabel?: string;
  onPress: () => void; danger?: boolean; value?: string
}

function SettingItem({ item }: { item: SettingRow }) {
  return (
    <Pressable
      style={({ pressed }) => [sItem.row, pressed && { backgroundColor: Colors.lightBlue }]}
      onPress={item.onPress}
    >
      <View style={[sItem.iconBox, { backgroundColor: item.danger ? Colors.errorLight : Colors.lightBlue }]}>
        <Ionicons name={item.icon as any} size={18} color={item.danger ? Colors.error : Colors.primaryBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[sItem.label, item.danger && { color: Colors.error }]}>{item.label}</Text>
        {item.sublabel ? <Text style={sItem.sublabel}>{item.sublabel}</Text> : null}
      </View>
      {item.value ? <Text style={sItem.value}>{item.value}</Text> : null}
      {!item.value && (
        <Ionicons name="chevron-forward" size={16} color={item.danger ? Colors.error : Colors.textMuted} />
      )}
    </Pressable>
  )
}

const sItem = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    backgroundColor: Colors.white,
  },
  iconBox: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sublabel: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  value: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
})

function SettingSection({ title, items }: { title: string; items: SettingRow[] }) {
  return (
    <View style={sSection.wrap}>
      <Text style={sSection.title}>{title}</Text>
      <View style={sSection.card}>
        {items.map((item, i) => (
          <View key={item.label}>
            <SettingItem item={item} />
            {i < items.length - 1 && <View style={sSection.divider} />}
          </View>
        ))}
      </View>
    </View>
  )
}

const sSection = StyleSheet.create({
  wrap: { gap: 6 },
  title: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, paddingHorizontal: 4, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
})

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    getCurrentUser().then(u => { setUser(u); setLoading(false) })
  }, [])

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          await signOut()
          router.replace('/login')
        },
      },
    ])
  }

  const initial = (user?.name || 'D').charAt(0).toUpperCase()

  const accountItems: SettingRow[] = [
    {
      icon: 'person-outline', label: 'Edit Profile',
      sublabel: 'Update your name, photo, and credentials',
      onPress: () => router.push({ pathname: '/doctor-profile', params: { tab: 'profile' } }),
    },
    {
      icon: 'business-outline', label: 'Clinic Details',
      sublabel: 'Manage clinic name, address, and contact',
      onPress: () => router.push({ pathname: '/doctor-profile', params: { tab: 'clinic' } }),
    },
    {
      icon: 'images-outline', label: 'Clinic Assets',
      sublabel: 'Logo, digital signature, doctor seal',
      onPress: () => router.push({ pathname: '/doctor-profile', params: { tab: 'assets' } }),
    },
  ]

  const workflowItems: SettingRow[] = [
    {
      icon: 'calculator-outline', label: 'Dosage Calculator',
      onPress: () => router.push('/dosage-calculator'),
    },
    {
      icon: 'time-outline', label: 'Reminders',
      sublabel: 'Patient follow-up reminders',
      onPress: () => router.push('/reminders'),
    },
    {
      icon: 'people-outline', label: 'Patient Records',
      sublabel: 'View and manage patient history',
      onPress: () => router.push('/patients'),
    },
  ]

  const helpItems: SettingRow[] = [
    {
      icon: 'help-circle-outline', label: 'Help & Support',
      onPress: () => Alert.alert('Support', 'Contact us at support@prescriptionmaker.in'),
    },
    {
      icon: 'shield-checkmark-outline', label: 'Privacy Policy',
      onPress: () => Alert.alert('Privacy', 'Visit prescriptionmaker.in/privacy'),
    },
    {
      icon: 'document-text-outline', label: 'Terms of Service',
      onPress: () => Alert.alert('Terms', 'Visit prescriptionmaker.in/terms'),
    },
    {
      icon: 'information-circle-outline', label: 'About',
      sublabel: 'PrescriptionMaker v1.0.0',
      value: '1.0.0',
      onPress: () => {},
    },
  ]

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkNavy} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Profile Card */}
        {loading ? (
          <View style={styles.profileCardLoading}>
            <ActivityIndicator color={Colors.primaryBlue} />
          </View>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name || 'Doctor'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <View style={styles.profilePlanRow}>
                <View style={[
                  styles.planBadge,
                  user?.plan === 'pro' && { backgroundColor: Colors.primaryBlue },
                  user?.plan === 'enterprise' && { backgroundColor: Colors.darkNavy },
                ]}>
                  <Text style={styles.planBadgeText}>
                    {(user?.plan ?? 'free').toUpperCase()}
                  </Text>
                </View>
                {user?.role === 'doctor' && (
                  <View style={styles.roleBadge}>
                    <Ionicons name="medical" size={9} color={Colors.success} />
                    <Text style={styles.roleBadgeText}>Verified Doctor</Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable
              style={styles.editProfileBtn}
              onPress={() => router.push('/doctor-profile')}
            >
              <Ionicons name="pencil" size={16} color={Colors.primaryBlue} />
            </Pressable>
          </View>
        )}

        {/* Settings sections */}
        <SettingSection title="Account" items={accountItems} />
        <SettingSection title="Tools" items={workflowItems} />
        <SettingSection title="Help & Legal" items={helpItems} />

        {/* Sign out */}
        <View style={sSection.card}>
          <Pressable
            style={({ pressed }) => [sItem.row, pressed && { backgroundColor: Colors.errorLight }]}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            <View style={[sItem.iconBox, { backgroundColor: Colors.errorLight }]}>
              {signingOut
                ? <ActivityIndicator size="small" color={Colors.error} />
                : <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              }
            </View>
            <Text style={[sItem.label, { color: Colors.error }]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          PrescriptionMaker.in · For licensed medical practitioners
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },
  header: {
    backgroundColor: Colors.darkNavy,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    paddingBottom: 16,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Profile card
  profileCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...Shadow.md, borderWidth: 1, borderColor: Colors.border,
  },
  profileCardLoading: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 28,
    alignItems: 'center', ...Shadow.sm,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primaryBlue, alignItems: 'center', justifyContent: 'center',
    ...Shadow.blue,
  },
  profileAvatarText: { fontSize: 22, fontWeight: '900', color: Colors.white },
  profileName: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 2 },
  profileEmail: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 6 },
  profilePlanRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  planBadge: {
    backgroundColor: Colors.textMuted, borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  planBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.successLight, borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.success },
  editProfileBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.lightBlue, alignItems: 'center', justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center', fontSize: 11, color: Colors.textMuted,
    fontWeight: '500', marginTop: 4,
  },
})
