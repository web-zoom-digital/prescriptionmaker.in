import { Platform } from 'react-native'

// Use a configurable environment variable, or fallback to sensible defaults for local development
// Note: For physical devices, you must replace this with your machine's local IP address (e.g., 'http://192.168.1.5:3005/api')
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }
  
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to point to host machine
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3005/api'
    }
    // iOS simulator can use localhost
    return 'http://localhost:3005/api'
  }
  
  // Production URL would go here
  return 'https://prescriptionmaker.in/api'
}

export const API_URL = getBaseUrl()

// Helper for making authenticated requests (assuming JWT is stored, though we'll keep it simple for now)
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // In a complete implementation, you'd retrieve the JWT token from SecureStore or AsyncStorage here
  // const token = await SecureStore.getItemAsync('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    // ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return response.json()
}
