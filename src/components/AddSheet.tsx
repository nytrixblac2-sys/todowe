import { useState, useRef, useEffect } from 'react'
import { C, STATUS, CAT_ICON, REMINDER_OPTIONS, AVATAR_COLORS, colorForEmail, initialsFor } from '../theme'
import { Av } from './Avatar'
import CustomReminderInput from './CustomReminderInput'
import type { Project, Person, AuthUser, TaskStatus, TaskCategory } from '../types'

const inputSt: React.CSSProperties = {
  width: '100%', background: C.bg, border: `1.5px solid ${C.muted}33`,
  borderRadius: 13, padding: '11px 14px', color: C.text,
  fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none',
  boxSizing: 'border-box', marginBottom: 14,
}
const selectSt: React.CSSProperties = {
  width: '100%', background: C.bg, border: `1.5px solid ${C.muted}33`,
  borderRadius: 13, padding: '11px 14px', color: C.text,
  fontFamily: "'DM Mono', monospace", fontSize: 12, outline: 'none', marginBottom: 14,
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, color: C.muted, fontFamily: "'DM Mono', monospace",
      letterSpacing: 1.4, marginBottom: 6, textTransform: 'uppercase',
    }}>{children}</div>
  )
}

export interface AddTaskPayload {
  title:       string
  category:    TaskCategory
  status:      TaskStatus
  start_time:  string
  end_time:    string
  project_id:  string | null
  assignee_ids: string[]
  reminders:   string[]
  progress:    number
}

interface Props {
  currentUser: AuthUser
  people:      Person[]
  projects:    Project[]
  selectedDate: Date
  onClose:     () => void
  onAdd:       (payload: AddTaskPayload) => Promise<void>
  onAddPerson: (email: string) => Person
  onAddProject:(name: string) => Project | Promise<Project>
}

export default function AddSheet({
  currentUser, people, projects, selectedDate,
  onClose, onAdd, onAddPerson, onAddProject,
}: Props) {
  const [title,     setTitle]     = useState('')
  const [cat,       setCat]       = useState<TaskCategory>('Client project')
  const [status,    setStatus]    = useState<TaskStatus>('pending')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime,   setEndTime]   = useState('10:00')
  const [projId,    setProjId]    = useState('')
  const [newProj,   setNewProj]   = useState('')
  const [selIds,    setSelIds]    = useState<string[]>([currentUser.id])
  const [newEmail,  setNewEmail]  = useState('')
  const [addingP,   setAddingP]   = useState(false)
  const [reminders, setReminders] = useState<string[]>([])
  const [saving,    setSaving]    = useState(false)
  const [saveErr,   setSaveErr]   = useState('')

  const allPeople: (AuthUser | Person)[] = [currentUser, ...people]
  const sheetRef = useRef<HTMLDivElement>(null)

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

  function addPerson() {
    if (!newEmail.trim()) return
    const p = onAddPerson(newEmail.trim())
    setSelIds((s) => [...s, p.id])
    setNewEmail('')
    setAddingP(false)
  }

  async function submit() {
    if (!title.trim()) { setSaveErr('Task name is required'); return }
    setSaving(true)
    setSaveErr('')
    try {
      let pid = projId
      if (projId === '__new__' && newProj.trim()) {
        const p = await onAddProject(newProj.trim())
        pid = p.id
      }
      await onAdd({
        title,
        category:     cat,
        status,
        start_time:   startTime,
        end_time:     endTime,
        project_id:   pid || null,
        assignee_ids: selIds,
        reminders,
        progress:     status === 'completed' ? 100 : 0,
      })
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div ref={sheetRef} onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, background: C.surface,
        borderRadius: '28px 28px 0 0', padding: '20px 20px 40px',
        maxHeight: '92dvh', overflowY: 'auto',
        animation: 'slideUp .28s cubic-bezier(.34,1.2,.64,1)',
      }}>
        <div style={{ width: 36, height: 4, background: C.muted + '44', borderRadius: 2, margin: '0 auto 22px' }} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 4 }}>New Task</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, marginBottom: 20 }}>
          {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        <Lbl>Task name</Lbl>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen…" style={inputSt} />

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Lbl>Category</Lbl>
            <select value={cat} onChange={(e) => setCat(e.target.value as TaskCategory)} style={selectSt}>
              {Object.keys(CAT_ICON).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Lbl>Status</Lbl>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} style={selectSt}>
              {Object.keys(STATUS).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {([['Start', startTime, setStartTime], ['End', endTime, setEndTime]] as const).map(([lbl, val, set]) => (
            <div key={lbl} style={{ flex: 1 }}>
              <Lbl>{lbl}</Lbl>
              <input type="time" value={val} onChange={(e) => set(e.target.value)} style={inputSt} />
            </div>
          ))}
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
            <button onClick={addPerson} style={{ background: C.accent, color: C.bg, border: 'none', borderRadius: 12, padding: '0 16px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>Add</button>
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

        {saveErr && (
          <div style={{ color: '#f87171', fontSize: 11, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
            {saveErr}
          </div>
        )}

        <button onClick={submit} disabled={saving} style={{
          width: '100%', background: C.accent, color: C.bg, border: 'none',
          borderRadius: 16, padding: 15,
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16,
          cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: `0 8px 24px ${C.accent}44`, marginTop: 6, letterSpacing: .3,
          opacity: saving ? 0.7 : 1,
        }}>{saving ? 'Saving…' : 'Add Task'}</button>
      </div>
    </div>
  )
}

// Export helpers needed by AddSheet and DetailSheet
export { inputSt, selectSt, Lbl }
export { colorForEmail, initialsFor, AVATAR_COLORS }
