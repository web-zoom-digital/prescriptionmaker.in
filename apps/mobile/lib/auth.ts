import { supabase } from './supabase'

export type AuthUser = {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  role: string
}

// Sign up a new user
export async function signUp(email: string, password: string, name: string) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? 'Signup failed')
  }

  // 2. Create user profile in public.users
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    name,
    role: 'doctor',
    plan: 'free',
    status: 'active',
  })

  if (profileError) {
    throw new Error(profileError.message)
  }

  return authData.user
}

// Sign in existing user
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut()
}

// Get current logged-in user profile
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name, plan, role')
    .eq('id', user.id)
    .single()

  return profile ?? null
}
