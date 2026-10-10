import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, ScrollView, StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { signIn, signUp } from '../lib/auth'
import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'

type Tab = 'login' | 'signup'

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (tab === 'signup' && !name.trim()) e.name = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    if (tab === 'signup' && password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAuth = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, name.trim())
      }
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message ?? 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setErrors({})
    setName('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkNavy} />

      {/* Blue header band */}
      <View style={styles.headerBand}>
        {/* Brand mark */}
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>Rx</Text>
        </View>
        <Text style={styles.brandName}>PrescriptionMaker</Text>
        <Text style={styles.brandTagline}>Professional prescription management</Text>
      </View>

      {/* Auth card */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabBar}>
            {(['login', 'signup'] as Tab[]).map(t => (
              <Pressable
                key={t}
                style={[styles.tabItem, tab === t && styles.tabItemActive]}
                onPress={() => switchTab(t)}
              >
                <Text style={[styles.tabItemText, tab === t && styles.tabItemTextActive]}>
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formBody}>
            {/* Welcome heading */}
            <Text style={styles.formTitle}>
              {tab === 'login' ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {tab === 'login'
                ? 'Sign in to access your prescriptions'
                : 'Start creating professional prescriptions'}
            </Text>

            {/* Full Name */}
            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={[styles.inputWrapper, errors.name && styles.inputWrapperError]}>
                  <Ionicons name="person-outline" size={18} color={errors.name ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Dr. Rahul Sharma"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: '' })) }}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                <Ionicons name="mail-outline" size={18} color={errors.email ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="doctor@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: '' })) }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={18} color={errors.password ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: '' })) }}
                  secureTextEntry={!showPassword}
                  returnKeyType={tab === 'login' ? 'done' : 'next'}
                />
                <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off-outline'} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
            </View>

            {/* Confirm Password */}
            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={errors.confirmPassword ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={v => { setConfirmPassword(v); setErrors(e => ({ ...e, confirmPassword: '' })) }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleAuth}
                  />
                </View>
                {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}
              </View>
            )}

            {/* Forgot password link */}
            {tab === 'login' && (
              <Pressable style={styles.forgotBtn} hitSlop={8}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            )}

            {/* Primary CTA */}
            <Pressable
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.primaryBtnText}>
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              }
            </Pressable>

            {/* Terms notice for signup */}
            {tab === 'signup' && (
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.disclaimer}>
          For licensed medical practitioners only
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkNavy },

  // Header band
  headerBand: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
  },
  brandMark: {
    width: 60, height: 60, borderRadius: Radius.lg,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    ...Shadow.blue,
  },
  brandMarkText: { color: Colors.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandName: { ...Typography.h2, color: Colors.white, marginBottom: 4 },
  brandTagline: { ...Typography.bodySm, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Scroll
  scrollContent: { flexGrow: 1 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    minHeight: 520,
    flex: 1,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primaryBlue,
  },
  tabItemText: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabItemTextActive: {
    color: Colors.primaryBlue,
    fontWeight: '700',
  },

  // Form body
  formBody: {
    padding: Spacing.xl,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },

  // Fields
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, backgroundColor: Colors.paleBlue,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: { padding: 4 },
  fieldError: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },

  // Forgot
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -4 },
  forgotText: {
    ...Typography.bodySm,
    color: Colors.primaryBlue,
    fontWeight: '600',
  },

  // Primary button
  primaryBtn: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadow.blue,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Terms
  termsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  termsLink: { color: Colors.primaryBlue, fontWeight: '600' },

  // Disclaimer
  disclaimer: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
})
