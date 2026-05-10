import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { AVATAR_COLORS } from '../theme'
import type { Project } from '../types'

const LIGHT_COLORS = ['#2d7a0f','#0891b2','#7c3aed','#d97706','#b91c1c','#065f46','#1d4ed8','#9d174d']

interface ProjectStore {
  projects: Project[]
  fetchProjects: (userId: string) => Promise<void>
  addProject: (name: string, ownerId: string) => Promise<Project>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],

  fetchProjects: async (userId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at')

    if (!error && data) {
      set({ projects: data as Project[] })
    }
  },

  addProject: async (name, ownerId) => {
    const idx        = get().projects.length
    const dark_color  = AVATAR_COLORS[idx % AVATAR_COLORS.length]
    const light_color = LIGHT_COLORS[idx % LIGHT_COLORS.length]

    const { data, error } = await supabase
      .from('projects')
      .insert({ owner_id: ownerId, name, dark_color, light_color })
      .select()
      .single()

    if (error || !data) {
      // Fallback: local-only project
      const local: Project = {
        id: `local_${Date.now()}`, owner_id: ownerId,
        name, dark_color, light_color, deadline: null, created_at: new Date().toISOString(),
      }
      set((s) => ({ projects: [...s.projects, local] }))
      return local
    }

    const proj = data as Project
    set((s) => ({ projects: [...s.projects, proj] }))
    return proj
  },
}))
