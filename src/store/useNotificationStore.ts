import { create } from 'zustand'
import type { Notification, Task } from '../types'

function makeId() { return Math.random().toString(36).slice(2, 11) }

function fmtTime(t: string): string {
  const [hStr, m] = t.split(':')
  const h = parseInt(hStr)
  return h > 12 ? `${h - 12}:${m} pm` : h === 12 ? `12:${m} pm` : `${h}:${m} am`
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

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  seedNudges: (tasks, userId) => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const nowMs    = Date.now()
    const existing = get().notifications

    // Track which task+type pairs already exist (cleared or not) to avoid duplicates
    const existingKeys = new Set(existing.map((n) => `${n.task_id}:${n.type}`))

    const newNudges: Notification[] = []

    for (const [date, dayTasks] of Object.entries(tasks)) {
      for (const t of dayTasks) {
        if (t.status === 'completed' || t.status === 'rejected') continue

        const endMs = new Date(`${date}T${t.end_time}:00`).getTime()

        if (endMs < nowMs && !existingKeys.has(`${t.id}:nudge_overdue`)) {
          newNudges.push({
            id:         makeId(),
            user_id:    userId,
            task_id:    t.id,
            type:       'nudge_overdue',
            title:      'Overdue task',
            body:       `"${t.title}" was due at ${fmtTime(t.end_time)} and is still not complete.`,
            read:       false,
            cleared:    false,
            created_at: new Date().toISOString(),
          })
          continue
        }

        if (
          t.status === 'running' && t.progress < 30 &&
          date <= todayStr && !existingKeys.has(`${t.id}:nudge_stalled`)
        ) {
          newNudges.push({
            id:         makeId(),
            user_id:    userId,
            task_id:    t.id,
            type:       'nudge_stalled',
            title:      'Stalled task',
            body:       `"${t.title}" is Running but only at ${t.progress}% progress.`,
            read:       false,
            cleared:    false,
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    if (newNudges.length > 0) {
      set((s) => ({ notifications: [...s.notifications, ...newNudges] }))
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

  reset: () => set({ notifications: [] }),
}))
