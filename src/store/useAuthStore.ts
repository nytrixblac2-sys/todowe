import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { initialsFor, colorForEmail } from '../theme'
import type { AuthUser } from '../types'

interface AuthStore {
  user: AuthUser | null
  loading: boolean
  error: string | null
  message: string | null
  signIn:  (email: string, password: string) => Promise<void>
  signUp:  (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  init:    () => Promise<void>
}

function buildUser(sbUser: { id: string; email?: string; user_metadata?: Record<string, string>; created_at?: string }): AuthUser {
  const email = sbUser.email ?? ''
  const rawName =
    sbUser.user_metadata?.full_name ??
    email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    id:          sbUser.id,
    email,
    name:        rawName,
    initials:    initialsFor(rawName),
    color:       colorForEmail(email),
    member_since: sbUser.created_at
      ? new Date(sbUser.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : '',
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:    null,
  loading: true,
  error:   null,
  message: null,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ? buildUser(session.user) : null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ? buildUser(session.user) : null })
    })
  },

  signIn: async (email, password) => {
    set({ error: null, message: null, loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ user: data.user ? buildUser(data.user) : null, loading: false })
  },

  signUp: async (email, password, name) => {
    set({ error: null, message: null, loading: true })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    if (data.session) {
      // Email confirmation disabled — signed in immediately
      set({ user: data.user ? buildUser(data.user) : null, loading: false })
    } else {
      // Email confirmation required
      set({ message: 'Account created! Check your email to confirm before signing in.', loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
