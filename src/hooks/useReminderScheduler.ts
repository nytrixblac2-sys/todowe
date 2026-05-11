import { useEffect, useRef } from 'react'
import type { Task } from '../types'

const MAX_SCHEDULE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

async function requestPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function fmtMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`
  if (mins === 60) return '1 hour'
  if (mins < 1440) return `${Math.round(mins / 60)} hours`
  return `${Math.round(mins / 1440)} day${Math.round(mins / 1440) !== 1 ? 's' : ''}`
}

export function useReminderScheduler(tasks: Record<string, Task[]>) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const permitted = useRef(false)

  // Request permission once on mount
  useEffect(() => {
    requestPermission().then((granted) => { permitted.current = granted })
  }, [])

  useEffect(() => {
    if (!permitted.current) return

    // Clear previous timers
    timers.current.forEach(clearTimeout)
    timers.current = []

    const now = Date.now()

    for (const dayTasks of Object.values(tasks)) {
      for (const task of dayTasks) {
        if (!task.reminders || task.reminders.length === 0) continue
        if (task.status === 'completed' || task.status === 'rejected') continue

        const startMs = new Date(`${task.date}T${task.start_time}:00`).getTime()

        for (const r of task.reminders) {
          const mins   = parseInt(r)
          const fireMs = startMs - mins * 60_000
          const delay  = fireMs - now

          if (delay <= 0 || delay > MAX_SCHEDULE_MS) continue

          const t = setTimeout(() => {
            if (Notification.permission !== 'granted') return
            new Notification(`Todowe — ${task.title}`, {
              body:  `Starting in ${fmtMinutes(mins)}`,
              icon:  '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag:   `${task.id}-${r}`, // deduplicates if fired twice
            })
          }, delay)

          timers.current.push(t)
        }
      }
    }

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [tasks])
}
