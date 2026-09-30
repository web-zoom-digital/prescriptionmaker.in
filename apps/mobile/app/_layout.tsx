import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { router, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'

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
            headerStyle: { backgroundColor: '#0f766e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="editor" options={{ title: 'New Prescription', presentation: 'modal' }} />
          <Stack.Screen name="hand-mode" options={{ title: 'Hand Mode', presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthGuard>
    </SafeAreaProvider>
  )
}
