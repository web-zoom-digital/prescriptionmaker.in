'use client'
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, Switch, ActivityIndicator
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getDoctorProfile, saveDoctorProfile, type DoctorProfile } from '../lib/local-store'

const FIELDS: { key: keyof DoctorProfile; label: string; placeholder: string; required?: boolean }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Dr. Rahul Sharma', required: true },
  { key: 'qualification', label: 'Qualification', placeholder: 'MBBS, MD, DM', required: true },
  { key: 'specialization', label: 'Specialization', placeholder: 'General Physician / Cardiologist' },
  { key: 'regNo', label: 'Medical Reg. No.', placeholder: 'MCI-12345 / State-67890' },
  { key: 'clinicName', label: 'Clinic / Hospital Name', placeholder: 'City Medical Centre' },
  { key: 'address', label: 'Address', placeholder: 'Sector 5, Noida, UP - 201301' },
  { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
  { key: 'email', label: 'Email', placeholder: 'dr.rahul@clinic.com' },
]

export default function DoctorProfileScreen() {
  const [profile, setProfile] = useState<DoctorProfile>({
    name: '', qualification: '', specialization: '', regNo: '',
    clinicName: '', address: '', phone: '', email: '', signature: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoctorProfile().then(p => {
      if (p) setProfile(p)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    if (!profile.name || !profile.qualification) {
      Alert.alert('Required', 'Please fill Name and Qualification.')
      return
    }
    setSaving(true)
    try {
      await saveDoctorProfile(profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#0f766e" />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> :
            <Text style={[styles.saveBtn, saved && { color: '#99f6e4' }]}>{saved ? '✓ Saved!' : 'Save'}</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Info Banner */}
        <View style={styles.banner}>
          <Ionicons name="information-circle-outline" size={16} color="#0369a1" />
          <Text style={styles.bannerText}>
            Save your details once — they'll auto-fill in every prescription you create.
          </Text>
        </View>

        {/* Avatar Preview */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name?.charAt(0) || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.avatarName}>Dr. {profile.name || 'Your Name'}</Text>
            <Text style={styles.avatarSub}>{profile.qualification || 'Qualification'}</Text>
            {profile.clinicName ? <Text style={styles.avatarClinic}>{profile.clinicName}</Text> : null}
          </View>
        </View>

        {/* Fields */}
        {FIELDS.map(f => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.label}>{f.label} {f.required && <Text style={{ color: '#ef4444' }}>*</Text>}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor="#94a3b8"
              value={profile[f.key]}
              onChangeText={v => setProfile(prev => ({ ...prev, [f.key]: v }))}
              autoCapitalize={f.key === 'email' ? 'none' : 'words'}
              keyboardType={f.key === 'email' ? 'email-address' : f.key === 'phone' ? 'phone-pad' : 'default'}
            />
          </View>
        ))}

        <Pressable style={styles.saveFullBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> :
            <Text style={styles.saveFullText}>
              {saved ? '✓ Profile Saved!' : '💾 Save Profile'}
            </Text>}
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#0f766e', flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  saveBtn: { fontSize: 15, color: '#fff', fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  banner: {
    flexDirection: 'row', gap: 8, backgroundColor: '#e0f2fe',
    borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#0ea5e9',
  },
  bannerText: { flex: 1, fontSize: 13, color: '#0369a1', lineHeight: 18 },
  avatarSection: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#0f766e',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  avatarName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  avatarSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  avatarClinic: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 13, fontSize: 15, color: '#1e293b',
  },
  saveFullBtn: {
    backgroundColor: '#0f766e', padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  saveFullText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
