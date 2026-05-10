import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { colorForEmail, initialsFor } from '../theme'
import type { Person } from '../types'

interface PeopleStore {
  people: Person[]
  fetchPeople: (userId: string) => Promise<void>
  addByEmail: (email: string, invitedBy: string) => Person
}

export const usePeopleStore = create<PeopleStore>((set, get) => ({
  people: [],

  fetchPeople: async (userId) => {
    const { data, error } = await supabase
      .from('task_assignees')
      .select('user_id')
      .neq('user_id', userId)

    if (error) { console.error('[fetchPeople] error:', error.message); return }
    if (!data || data.length === 0) return

    const ids = [...new Set(data.map((r) => r.user_id as string))]

    // Fetch their profile metadata from auth.users via a RPC or from a profiles table.
    // For now we build Person objects from whatever we can derive — full profile
    // table will be added in Phase 4. We store email-derived people in local state only.
    const existing = get().people
    const newPeople = ids
      .filter((id) => !existing.find((p) => p.id === id))
      .map((id) => buildFromId(id))

    if (newPeople.length > 0) {
      set((s) => ({ people: [...s.people, ...newPeople] }))
    }
  },

  addByEmail: (email, _invitedBy) => {
    const existing = get().people.find((p) => p.email === email)
    if (existing) return existing

    const name    = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const person: Person = {
      id:         `local_${email}`,
      name,
      email,
      initials:   initialsFor(name),
      color:      colorForEmail(email),
      avatar_url: null,
    }
    set((s) => ({ people: [...s.people, person] }))
    return person
  },
}))

function buildFromId(id: string): Person {
  return {
    id,
    name:       'Teammate',
    email:      '',
    initials:   'TM',
    color:      colorForEmail(id),
    avatar_url: null,
  }
}
