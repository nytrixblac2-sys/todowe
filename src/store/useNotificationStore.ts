import { create } from 'zustand'
import type { Notification, Task } from '../types'

function makeId() { return Math.random().toString(36).slice(2, 11) }

function fmtTime(t: string): string {
  const [hStr, m] = t.split(':')
  const h = parseInt(hStr)
  return h > 12 ? `${h - 12}:${m} pm` : h === 12 ? `12:${m} pm` : `${h}:${m} am`
}

// Persists which task+type nudges have been created so they never repeat across sessions
const NUDGE_LOG_KEY = 'todowe-nudge-log'
function getNudgeLog(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NUDGE_LOG_KEY) ?? '[]') as string[]) }
  catch { return new Set() }
}
function persistNudge(key: string) {
  try {
    const s = getNudgeLog(); s.add(key)
    localStorage.setItem(NUDGE_LOG_KEY, JSON.stringify([...s]))
  } catch {}
}

interface NotificationStore {
  notifications: Notification[]
  seedNudges:    (tasks: Record<string, Task[]>, userId: string) => void
  markRead:      (id: string) => void
  clearOne:      (id: string) => void
  clearAll:      () => void
  deleteOne:     (id: string) => void
  deleteCleared: () => void
  reset:         () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  seedNudges: (tasks, userId) => {
    const todayStr  = new Date().toISOString().slice(0, 10)
    const nowMs     = Date.now()
    const firedLog  = getNudgeLog() // persisted across sessions — nudges never repeat

    const newNudges: Notification[] = []

    for (const [date, dayTasks] of Object.entries(tasks)) {
      for (const t of dayTasks) {
        if (t.status === 'completed' || t.status === 'rejected') continue

        const overdueKey  = `${t.id}:nudge_overdue`
        const stalledKey  = `${t.id}:nudge_stalled`
        const endMs       = new Date(`${date}T${t.end_time}`).getTime()

        if (endMs < nowMs && !firedLog.has(overdueKey)) {
          newNudges.push({
            id: makeId(), user_id: userId, task_id: t.id,
            type: 'nudge_overdue', title: 'Overdue task',
            body: `"${t.title}" was due at ${fmtTime(t.end_time)} and is still not complete.`,
            read: false, cleared: false, created_at: new Date().toISOString(),
          })
          persistNudge(overdueKey)
          continue
        }

        if (t.status === 'running' && t.progress < 30 && date <= todayStr && !firedLog.has(stalledKey)) {
          newNudges.push({
            id: makeId(), user_id: userId, task_id: t.id,
            type: 'nudge_stalled', title: 'Stalled task',
            body: `"${t.title}" is Running but only at ${t.progress}% progress.`,
            read: false, cleared: false, created_at: new Date().toISOString(),
          })
          persistNudge(stalledKey)
        }
      }
    }

    if (newNudges.length > 0) {
      set((s) => ({ notifications: [...s.notifications, ...newNudges] }))

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        for (const n of newNudges) {
          new Notification(`Todowe — ${n.title}`, {
            body: n.body, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png',
            tag:  `${n.task_id}:${n.type}`,
          })
        }
      }
    }
  },

  markRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),

  clearOne: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true, cleared: true } : n),
  })),

  clearAll: () => set((s) => ({
    notifications: s.notifications.map((n) => n.cleared ? n : { ...n, read: true, cleared: true }),
  })),

  deleteOne: (id) => set((s) => ({
    notifications: s.notifications.filter((n) => n.id !== id),
  })),

  deleteCleared: () => set((s) => ({
    notifications: s.notifications.filter((n) => !n.cleared),
  })),

  reset: () => {
    try { localStorage.removeItem(NUDGE_LOG_KEY) } catch {}
    set({ notifications: [] })
  },
}))
