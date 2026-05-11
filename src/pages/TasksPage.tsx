import { useState, useEffect, useMemo } from 'react'
import { C } from '../theme'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useTaskStore } from '../store/useTaskStore'
import { usePeopleStore } from '../store/usePeopleStore'
import { useProjectStore } from '../store/useProjectStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { useGreeting } from '../hooks/useGreeting'
import { useReminderScheduler } from '../hooks/useReminderScheduler'
import { Av } from '../components/Avatar'
import DayStrip from '../components/DayStrip'
import TaskCard from '../components/TaskCard'
import AddSheet, { type AddTaskPayload } from '../components/AddSheet'
import DetailSheet from '../components/DetailSheet'
import { SkeletonLoader } from '../components/SkeletonCard'
import type { Task, Person } from '../types'

function dk(d: Date) { return d.toISOString().slice(0, 10) }

const HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20]
function timeLabel(h: number) {
  if (h > 12) return `${h - 12} pm`
  if (h === 12) return '12 pm'
  return `${h} am`
}

interface TasksPageProps {
  onOpenProfile:     () => void
  openTaskId?:       string | null
  onClearOpenTaskId?: () => void
}

export default function TasksPage({ onOpenProfile, openTaskId, onClearOpenTaskId }: TasksPageProps) {
  const today = new Date()

  const { user }                            = useAuthStore()
  const { isDark, toggle: toggleTheme }     = useThemeStore()
  const { tasks, fetchAll, addTask, updateTask, deleteTask, loading, error } = useTaskStore()
  const { people, fetchPeople, addByEmail } = usePeopleStore()
  const { projects, fetchProjects, addProject } = useProjectStore()
  const { seedNudges }                      = useNotificationStore()
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.read && !n.cleared).length)

  const [selected,  setSelected]  = useState(today)
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [showAdd,   setShowAdd]   = useState(false)
  const [detail,    setDetail]    = useState<Task | null>(null)
  const [editing,   setEditing]   = useState<Task | null>(null)

  const greeting = useGreeting(user?.name.split(' ')[0] ?? '')
  useReminderScheduler(tasks)

  useEffect(() => {
    if (!user) return
    fetchAll(user.id)
    fetchPeople(user.id)
    fetchProjects(user.id)
  }, [user, fetchAll, fetchPeople, fetchProjects])

  // Seed Type 3 nudges once tasks are loaded
  useEffect(() => {
    if (!user || Object.keys(tasks).length === 0) return
    seedNudges(tasks, user.id)
  }, [tasks, user, seedNudges])

  // Open task from notification tap
  useEffect(() => {
    if (!openTaskId) return
    for (const dayTasks of Object.values(tasks)) {
      const found = dayTasks.find((t) => t.id === openTaskId)
      if (found) {
        setDetail(found)
        setSelected(new Date(found.date + 'T00:00:00'))
        setViewYear(new Date(found.date + 'T00:00:00').getFullYear())
        setViewMonth(new Date(found.date + 'T00:00:00').getMonth())
        onClearOpenTaskId?.()
        break
      }
    }
  }, [openTaskId, tasks, onClearOpenTaskId])

  const selectedKey = dk(selected)
  const dayTasks    = tasks[selectedKey] ?? []

  const taskDates = useMemo(() => new Set(Object.keys(tasks)), [tasks])

  const byHour = useMemo(() => {
    const m: Record<number, Task[]> = {}
    dayTasks.forEach((t) => {
      const h = parseInt(t.start_time.split(':')[0])
      if (!m[h]) m[h] = []
      m[h].push(t)
    })
    return m
  }, [dayTasks])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }
  function handleSelectDate(d: Date) {
    setSelected(d)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  async function handleAdd(payload: AddTaskPayload) {
    if (!user) return
    await addTask({ ...payload, date: selectedKey }, user.id)
    // addTask throws on error (caught by AddSheet), so reaching here means success
    setShowAdd(false)
  }

  async function handleSave(updated: Task) {
    await updateTask(updated.id, {
      title:       updated.title,
      category:    updated.category,
      status:      updated.status,
      progress:    updated.progress,
      start_time:  updated.start_time,
      end_time:    updated.end_time,
      project_id:  updated.project_id,
      assignee_ids: updated.assignees?.map((a) => a.id) ?? [],
      reminders:   updated.reminders ?? [],
    })
    setDetail(null)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    await deleteTask(id, selectedKey)
  }

  function handleAddPerson(email: string): Person {
    return addByEmail(email, user?.id ?? '')
  }

  async function handleAddProject(name: string) {
    return addProject(name, user?.id ?? '')
  }

  if (!user) return null

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative', transition: 'background .25s', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '48px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: .8, marginBottom: 6 }}>
              {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24, color: C.text, lineHeight: 1.25 }}>
              {greeting}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginTop: 5 }}>
              Here is what your day looks like
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexShrink: 0 }}>
            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{
              width: 44, height: 26, borderRadius: 13,
              background: C.card, border: `1.5px solid ${C.muted}44`,
              cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isDark ? 3 : 19,
                width: 18, height: 18, borderRadius: '50%',
                background: isDark ? C.muted : C.accent,
                transition: 'left .25s, background .25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
              }}>{isDark ? '☽' : '☀'}</div>
            </button>
            {/* Avatar with notification badge */}
            <div onClick={onOpenProfile} style={{ cursor: 'pointer', position: 'relative' }}>
              <Av person={user} size={44} borderColor={C.accent} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#f87171',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: '#fff',
                  fontFamily: "'DM Mono', monospace", border: `2px solid ${C.bg}`,
                }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day strip */}
      <div style={{ marginTop: 22, flexShrink: 0 }}>
        <DayStrip
          viewYear={viewYear} viewMonth={viewMonth}
          selected={selected} taskDates={taskDates}
          onSelect={handleSelectDate}
          onPrevMonth={prevMonth} onNextMonth={nextMonth}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 0' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted }}>
            {selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.accent }}>
            {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Scroll area — timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
        {error ? (
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <div style={{ fontSize: 28, opacity: .2, marginBottom: 14, color: C.text }}>◎</div>
            <div style={{ color: '#f87171', fontFamily: "'DM Mono', monospace", fontSize: 12, marginBottom: 16 }}>
              Failed to load tasks
            </div>
            <button onClick={() => user && fetchAll(user.id)} style={{
              background: C.accent, color: C.bg, border: 'none', borderRadius: 12,
              padding: '10px 24px', fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>Try again</button>
          </div>
        ) : loading ? (
          <SkeletonLoader />
        ) : dayTasks.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <div style={{ fontSize: 36, opacity: .15, marginBottom: 14, color: C.text }}>◈</div>
            <div style={{ color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Nothing scheduled</div>
            <div onClick={() => setShowAdd(true)} style={{ color: C.accent, fontFamily: "'DM Mono', monospace", fontSize: 10, marginTop: 10, cursor: 'pointer', letterSpacing: 1.2 }}>+ ADD TASK</div>
          </div>
        ) : (
          HOURS.map((h) => {
            const slot = byHour[h]
            if (!slot) return null
            return (
              <div key={h} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                {/* Time column */}
                <div style={{ width: 42, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 28 }}>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{timeLabel(h)}</span>
                  <div style={{ flex: 1, width: 1, borderLeft: `1.5px dashed ${C.muted}44`, margin: '6px 0 0' }} />
                </div>
                {/* Cards */}
                <div style={{ flex: 1 }}>
                  {slot.map((t, i) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      people={people}
                      projects={projects}
                      index={i}
                      onClick={(task) => setDetail(task)}
                      onEdit={(task) => setEditing(task)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 'calc(82px + env(safe-area-inset-bottom))', right: 'max(20px, calc(50% - 195px))',
        width: 54, height: 54, borderRadius: '50%',
        background: C.accent, border: 'none', fontSize: 26,
        color: isDark ? C.bg : '#ffffff',
        cursor: 'pointer', boxShadow: `0 8px 28px ${C.accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, zIndex: 50,
      }}>+</button>

      {/* Sheets */}
      {showAdd && (
        <AddSheet
          currentUser={user}
          people={people}
          projects={projects}
          selectedDate={selected}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          onAddPerson={handleAddPerson}
          onAddProject={handleAddProject}
        />
      )}
      {(detail || editing) && (
        <DetailSheet
          task={(detail ?? editing)!}
          currentUser={user}
          people={people}
          projects={projects}
          onClose={() => { setDetail(null); setEditing(null) }}
          onSave={handleSave}
          onAddPerson={handleAddPerson}
          onAddProject={handleAddProject}
        />
      )}
    </div>
  )
}
