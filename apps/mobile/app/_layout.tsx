import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { router, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'
import { syncOfflineData } from '../lib/prescriptions'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === 'login'
      if (!session && !inAuthGroup) {
        router.replace('/login')
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)/dashboard')
      }
      setChecked(true)
      syncOfflineData()
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === 'login'
      if (!session && !inAuthGroup) {
        router.replace('/login')
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)/dashboard')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!checked) return null
  return <>{children}</>
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#102A56' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700', fontSize: 16 },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="editor" options={{ title: 'New Prescription', presentation: 'modal' }} />
          <Stack.Screen name="tablet-mode" options={{ headerShown: false }} />
          <Stack.Screen name="doctor-profile" options={{ headerShown: false }} />
          <Stack.Screen name="patients" options={{ headerShown: false }} />
          <Stack.Screen name="reminders" options={{ headerShown: false }} />
          <Stack.Screen name="patient-history" options={{ headerShown: false }} />
          <Stack.Screen name="dosage-calculator" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </SafeAreaProvider>
  )
}
