'use client'
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, ActivityIndicator, Image
} from 'react-native'
import { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { getDoctorProfile, saveDoctorProfile, type DoctorProfile } from '../lib/local-store'
import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'

const PROFILE_FIELDS: { key: keyof DoctorProfile; label: string; placeholder: string; required?: boolean }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Dr. Rahul Sharma', required: true },
  { key: 'qualification', label: 'Qualification', placeholder: 'MBBS, MD, DM', required: true },
  { key: 'specialization', label: 'Specialization', placeholder: 'General Physician / Cardiologist' },
  { key: 'regNo', label: 'Medical Reg. No.', placeholder: 'MCI-12345 / State-67890' },
  { key: 'email', label: 'Email', placeholder: 'dr.rahul@clinic.com' },
]

const CLINIC_FIELDS: { key: keyof DoctorProfile; label: string; placeholder: string; required?: boolean }[] = [
  { key: 'clinicName', label: 'Clinic / hospital name', placeholder: 'Sunrise Heart Clinic', required: true },
  { key: 'clinicRegNo', label: 'License / Registration no.', placeholder: 'REG-2024-XXXXX' },
  { key: 'phone', label: 'Clinic/Hospital phone', placeholder: '+91 98765 43210', required: true },
  { key: 'clinicEmail', label: 'Clinic/Hospital email', placeholder: 'contact@clinic.com' },
  { key: 'clinicWebsite', label: 'Clinic/Hospital website', placeholder: 'www.clinic.com' },
  { key: 'address', label: 'Full address', placeholder: 'Building, street, area / landmark', required: true },
  { key: 'country', label: 'Country', placeholder: 'India (IN)' },
  { key: 'state', label: 'State', placeholder: 'Maharashtra' },
  { key: 'city', label: 'City', placeholder: 'Pune' },
  { key: 'pincode', label: 'Pincode', placeholder: '411001' },
]

export default function DoctorProfileScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'assets'>(
    (tab as any) || 'profile'
  )
  
  const [profile, setProfile] = useState<DoctorProfile>({
    name: '', qualification: '', specialization: '', regNo: '',
    clinicName: '', address: '', phone: '', email: '', signature: '',
    clinicType: 'Clinic'
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

  useEffect(() => {
    if (tab && ['profile', 'clinic', 'assets'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [tab])

  const pickImage = async (field: 'logoUrl' | 'stampUrl' | 'signature') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0]?.base64) {
      const mime = result.assets[0].mimeType || 'image/png'
      const b64 = `data:${mime};base64,${result.assets[0].base64}`
      setProfile(prev => ({ ...prev, [field]: b64 }))
    }
  }

  const handleSave = async () => {
    if (!profile.name || !profile.qualification) {
      Alert.alert('Required', 'Please fill Name and Qualification in the Profile section.')
      setActiveTab('profile')
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paleBlue }}>
        <ActivityIndicator color={Colors.primaryBlue} size="large" />
      </View>
    )
  }

  const renderField = (f: any) => (
    <View key={f.key} style={styles.field}>
      <Text style={styles.label}>{f.label} {f.required && <Text style={{ color: Colors.error }}>*</Text>}</Text>
      <TextInput
        style={styles.input}
        placeholder={f.placeholder}
        placeholderTextColor={Colors.textMuted}
        value={profile[f.key as keyof DoctorProfile]}
        onChangeText={v => setProfile(prev => ({ ...prev, [f.key]: v }))}
        autoCapitalize={f.key === 'email' ? 'none' : 'words'}
        keyboardType={f.key === 'email' ? 'email-address' : f.key === 'phone' ? 'phone-pad' : 'default'}
      />
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} size="small" /> :
            <Text style={[styles.saveBtn, saved && { color: Colors.successLight }]}>{saved ? '✓ Saved!' : 'Save'}</Text>}
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]} 
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'clinic' && styles.activeTab]} 
          onPress={() => setActiveTab('clinic')}
        >
          <Text style={[styles.tabText, activeTab === 'clinic' && styles.activeTabText]}>Clinic</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'assets' && styles.activeTab]} 
          onPress={() => setActiveTab('assets')}
        >
          <Text style={[styles.tabText, activeTab === 'assets' && styles.activeTabText]}>Assets</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <View>
            {/* Avatar Preview */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.name?.charAt(0).toUpperCase() || 'D'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.avatarName}>Dr. {profile.name || 'Your Name'}</Text>
                <Text style={styles.avatarSub}>{profile.qualification || 'Qualification'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              {PROFILE_FIELDS.map(renderField)}
            </View>
          </View>
        )}

        {/* Clinic Tab */}
        {activeTab === 'clinic' && (
          <View style={styles.card}>
            <View style={styles.banner}>
              <Ionicons name="business" size={18} color={Colors.primaryBlue} />
              <Text style={styles.bannerText}>
                These details will be printed on the letterhead of your prescriptions.
              </Text>
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeToggleRow}>
                {['Clinic', 'Hospital', 'Nursing Home', 'Diagnostic Centre'].map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeToggleBtn, profile.clinicType === type && styles.typeToggleActive]}
                    onPress={() => setProfile(prev => ({ ...prev, clinicType: type as any }))}
                  >
                    <Text style={[styles.typeToggleText, profile.clinicType === type && styles.typeToggleActiveText]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {CLINIC_FIELDS.map(renderField)}
          </View>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Logo & Stamp</Text>
            
            <View style={styles.imageField}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Clinic Logo</Text>
                <Text style={styles.helpText}>Shown at the top of the prescription.</Text>
              </View>
              <Pressable onPress={() => pickImage('logoUrl')} style={styles.imagePickerBtn}>
                {profile.logoUrl ? (
                  <Image source={{ uri: profile.logoUrl }} style={styles.imagePreview} />
                ) : (
                  <Ionicons name="image-outline" size={24} color={Colors.primaryBlue} />
                )}
              </Pressable>
            </View>

            <View style={styles.imageField}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Doctor Stamp / Seal</Text>
                <Text style={styles.helpText}>Circular stamp shown at the bottom.</Text>
              </View>
              <Pressable onPress={() => pickImage('stampUrl')} style={styles.imagePickerBtn}>
                {profile.stampUrl ? (
                  <Image source={{ uri: profile.stampUrl }} style={styles.imagePreview} />
                ) : (
                  <Ionicons name="image-outline" size={24} color={Colors.primaryBlue} />
                )}
              </Pressable>
            </View>

            <View style={styles.imageField}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Digital Signature</Text>
                <Text style={styles.helpText}>Handwritten signature image.</Text>
              </View>
              <Pressable onPress={() => pickImage('signature')} style={styles.imagePickerBtn}>
                {profile.signature ? (
                  <Image source={{ uri: profile.signature }} style={[styles.imagePreview, { width: 80 }]} resizeMode="contain" />
                ) : (
                  <Ionicons name="image-outline" size={24} color={Colors.primaryBlue} />
                )}
              </Pressable>
            </View>
          </View>
        )}

        <Pressable style={styles.saveFullBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> :
            <Text style={styles.saveFullText}>
              {saved ? '✓ Changes Saved!' : '💾 Save Changes'}
            </Text>}
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },
  header: {
    backgroundColor: Colors.darkNavy, flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, ...Typography.h3, color: Colors.white },
  saveBtn: { fontSize: 15, color: Colors.white, fontWeight: '700' },
  
  tabsContainer: {
    flexDirection: 'row', backgroundColor: Colors.white, 
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: Colors.primaryBlue },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  activeTabText: { color: Colors.primaryBlue, fontWeight: '800' },
  
  content: { padding: Spacing.md, paddingBottom: 40, gap: Spacing.md },
  
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm, gap: 12
  },

  banner: {
    flexDirection: 'row', gap: 10, backgroundColor: Colors.lightBlue,
    borderRadius: Radius.md, padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.primaryBlue,
    marginBottom: 8
  },
  bannerText: { flex: 1, ...Typography.bodySm, color: Colors.primaryBlue, fontWeight: '500' },
  
  avatarSection: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm, marginBottom: 12
  },
  avatar: { 
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: Colors.primaryBlue, alignItems: 'center', justifyContent: 'center',
    ...Shadow.blue
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: Colors.white },
  avatarName: { ...Typography.h3, color: Colors.textPrimary },
  avatarSub: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  
  
  field: { gap: 6, marginBottom: 8 },
  label: { ...Typography.label, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: 13, fontSize: 15, color: Colors.textPrimary,
    fontWeight: '500'
  },
  
  typeToggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, marginBottom: 4 },
  typeToggleBtn: { 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, 
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white 
  },
  typeToggleActive: { backgroundColor: Colors.primaryBlue, borderColor: Colors.primaryBlue },
  typeToggleText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  typeToggleActiveText: { color: Colors.white },
  
  saveFullBtn: {
    backgroundColor: Colors.primaryBlue, padding: 16, borderRadius: Radius.md,
    alignItems: 'center', marginTop: 8, ...Shadow.blue,
  },
  saveFullText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
  
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  imageField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  helpText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  imagePickerBtn: {
    width: 64, height: 64, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.paleBlue, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
})
