import { create } from 'zustand'
import { swapTheme } from '../theme'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
  setDark: (v: boolean) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: true,
  toggle: () =>
    set((s) => {
      const next = !s.isDark
      swapTheme(next)
      return { isDark: next }
    }),
  setDark: (v) => {
    swapTheme(v)
    set({ isDark: v })
  },
}))
