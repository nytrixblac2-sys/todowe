import { useState, useRef, useEffect } from 'react'
import { C, STATUS, CAT_ICON, REMINDER_OPTIONS } from '../theme'
import { Av } from './Avatar'
import CustomReminderInput from './CustomReminderInput'
import { inputSt, selectSt, Lbl } from './AddSheet'
import type { Task, Project, Person, AuthUser, TaskStatus, TaskCategory } from '../types'

interface Props {
  task:        Task
  currentUser: AuthUser
  people:      Person[]
  projects:    Project[]
  onClose:     () => void
  onSave:      (updated: Task) => void
  onAddPerson: (email: string) => Person
  onAddProject:(name: string) => Project | Promise<Project>
}

export default function DetailSheet({
  task, currentUser, people, projects,
  onClose, onSave, onAddPerson, onAddProject,
}: Props) {
  const [title,     setTitle]     = useState(task.title)
  const [cat,       setCat]       = useState<TaskCategory>(task.category)
  const [status,    setStatus]    = useState<TaskStatus>(task.status)
  const [startTime, setStartTime] = useState(task.start_time)
  const [endTime,   setEndTime]   = useState(task.end_time)
  const [progress,  setProgress]  = useState(task.progress)
  const [projId,    setProjId]    = useState(task.project_id ?? '')
  const [newProj,   setNewProj]   = useState('')
  const [selIds,    setSelIds]    = useState<string[]>(
    task.assignees?.map((a) => a.id) ?? [currentUser.id]
  )
  const [newEmail,  setNewEmail]  = useState('')
  const [addingP,   setAddingP]   = useState(false)
  const [reminders, setReminders] = useState<string[]>(task.reminders ?? [])

  const st = STATUS[status]
  const allPeople: (AuthUser | Person)[] = [currentUser, ...people]
  const sheetRef = useRef<HTMLDivElement>(null)

  // Non-passive touchmove listener: prevents background panning on iOS while allowing sheet scroll
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (!sheetRef.current?.contains(e.target as Node)) e.preventDefault()
    }
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => document.removeEventListener('touchmove', prevent)
  }, [])

  function togglePerson(id: string) {
    setSelIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  function addPersonInline() {
    if (!newEmail.trim()) return
    const p = onAddPerson(newEmail.trim())
    setSelIds((s) => [...s, p.id])
    setNewEmail('')
    setAddingP(false)
  }

  async function save() {
    if (!title.trim()) return
    let pid = projId
    if (projId === '__new__' && newProj.trim()) {
      const p = await onAddProject(newProj.trim())
      pid = p.id
    }
    onSave({
      ...task,
      title,
      category:   cat,
      status,
      start_time: startTime,
      end_time:   endTime,
      progress,
      project_id: pid || null,
      reminders,
      assignees:  selIds.map((id) => {
        const found = allPeople.find((p) => p.id === id)
        return found
          ? { id: found.id, name: found.name, email: found.email, initials: found.initials, color: found.color, avatar_url: null }
          : { id, name: '', email: '', initials: '', color: '', avatar_url: null }
      }),
    })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div ref={sheetRef} onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, background: C.surface,
        borderRadius: '28px 28px 0 0', padding: '20px 20px 44px',
        maxHeight: '92dvh', overflowY: 'auto',
        animation: 'slideUp .28s cubic-bezier(.34,1.2,.64,1)',
      }}>
        <div style={{ width: 36, height: 4, background: C.muted + '44', borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 20, color: C.text }}>Edit Task</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <Lbl>Task name</Lbl>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputSt} />

        <Lbl>Category</Lbl>
        <select value={cat} onChange={(e) => setCat(e.target.value as TaskCategory)} style={selectSt}>
          {Object.keys(CAT_ICON).map((c) => <option key={c}>{c}</option>)}
        </select>

        <Lbl>Status</Lbl>
        <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} style={selectSt}>
          {Object.keys(STATUS).map((s) => <option key={s}>{s}</option>)}
        </select>

        <Lbl>Start</Lbl>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputSt} />

        <Lbl>End</Lbl>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputSt} />

        {/* Progress slider */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Lbl>Progress</Lbl>
            <span style={{ fontSize: 10, color: st.color, fontFamily: "'DM Mono', monospace" }}>{progress}%</span>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: st.color, borderRadius: 3 }} />
            </div>
            <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(+e.target.value)}
              style={{ position: 'absolute', inset: '-8px 0', opacity: 0, cursor: 'pointer', width: '100%' }} />
          </div>
        </div>

        <Lbl>Project</Lbl>
        <select value={projId} onChange={(e) => setProjId(e.target.value)} style={selectSt}>
          <option value="">No project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="__new__">Create new project…</option>
        </select>
        {projId === '__new__' && (
          <input value={newProj} onChange={(e) => setNewProj(e.target.value)} placeholder="Project name…" style={inputSt} />
        )}

        <Lbl>People</Lbl>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {allPeople.map((p) => {
            const sel = selIds.includes(p.id)
            return (
              <div key={p.id} onClick={() => togglePerson(p.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <div style={{ borderRadius: '50%', padding: 2.5, border: `2.5px solid ${sel ? p.color : 'transparent'}`, transition: 'border .15s' }}>
                  <Av person={p} size={36} />
                </div>
                <span style={{ fontSize: 8, color: sel ? p.color : C.muted, fontFamily: "'DM Mono', monospace", maxWidth: 44, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ')[0]}
                </span>
              </div>
            )
          })}
          <div onClick={() => setAddingP((v) => !v)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <div style={{ width: 41, height: 41, borderRadius: '50%', background: C.card, border: `2px dashed ${C.muted}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: C.muted }}>+</div>
            <span style={{ fontSize: 8, color: C.muted, fontFamily: "'DM Mono', monospace" }}>Add</span>
          </div>
        </div>

        {addingP && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="colleague@email.com"
              style={{ ...inputSt, flex: 1, marginBottom: 0 }} />
            <button onClick={addPersonInline} style={{ background: C.accent, color: C.bg, border: 'none', borderRadius: 12, padding: '0 16px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>Add</button>
          </div>
        )}

        <Lbl>Reminders</Lbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
          {REMINDER_OPTIONS.filter((o) => o.value !== '').map((opt) => {
            const active = reminders.includes(opt.value)
            return (
              <div key={opt.value} onClick={() => setReminders((r) => active ? r.filter((x) => x !== opt.value) : [...r, opt.value])} style={{
                padding: '7px 14px', borderRadius: 20,
                background: active ? C.accent : C.card,
                color: active ? C.bg : C.muted,
                border: `1.5px solid ${active ? C.accent : C.muted + '33'}`,
                fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer',
                transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {active && <span style={{ fontSize: 8 }}>✓</span>}
                {opt.label}
              </div>
            )
          })}
        </div>

        <CustomReminderInput reminders={reminders} setReminders={setReminders} />

        {reminders.length > 0 ? (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.accent, marginBottom: 6, letterSpacing: .5 }}>
              {reminders.length} reminder{reminders.length > 1 ? 's' : ''} set
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {reminders.map((r) => {
                const preset = REMINDER_OPTIONS.find((o) => o.value === r)
                const label  = preset ? preset.label : `${r} min before`
                return (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.accent + '18', border: `1px solid ${C.accent}44`, borderRadius: 20, padding: '4px 10px', fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.accent }}>
                    {label}
                    <span onClick={() => setReminders((p) => p.filter((x) => x !== r))} style={{ cursor: 'pointer', fontSize: 10, opacity: .7 }}>✕</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted + '88', marginBottom: 18, letterSpacing: .5 }}>
            Tap to add reminders — select as many as you need
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, background: C.card, color: C.muted, border: 'none',
            borderRadius: 16, padding: 15,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
            cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={save} style={{
            flex: 2, background: C.accent, color: C.bg, border: 'none',
            borderRadius: 16, padding: 15,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 16,
            cursor: 'pointer', boxShadow: `0 8px 24px ${C.accent}44`, letterSpacing: .3,
          }}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
