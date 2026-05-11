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
      document.body.style.background = next ? '#0f1629' : '#f0f3fa'
      return { isDark: next }
    }),
  setDark: (v) => {
    swapTheme(v)
    document.body.style.background = v ? '#0f1629' : '#f0f3fa'
    set({ isDark: v })
  },
}))
