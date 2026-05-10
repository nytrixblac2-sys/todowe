import { useState } from 'react'
import { C, STATUS, CAT_ICON, projColor } from '../theme'
import { AvatarRow } from './Avatar'
import type { Task, Project, Person, AuthUser } from '../types'

interface TaskCardProps {
  task:      Task
  people:    (Person | AuthUser)[]
  projects:  Project[]
  index:     number
  onClick:   (t: Task) => void
  onEdit:    (t: Task) => void
  onDelete:  (id: string) => void
}

export default function TaskCard({ task, people, projects, index, onClick, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const st   = STATUS[task.status]
  const icon = CAT_ICON[task.category] ?? '◈'
  const proj = projects.find((p) => p.id === task.project_id) ?? null

  const assignedPeople = (task.assignees ?? [])
    .map((a) => people.find((p) => p.id === a.id))
    .filter((p): p is Person | AuthUser => !!p)

  function stopAndClose(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
  }

  return (
    <div style={{ marginBottom: 18, animation: 'fadeUp .3s ease both', animationDelay: `${index * 0.07}s`, position: 'relative' }}>

      {/* Kebab dropdown */}
      {menuOpen && (
        <>
          <div onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: 32, right: 10, zIndex: 20,
            background: C.surface, borderRadius: 14,
            boxShadow: '0 8px 32px #00000033',
            border: `1.5px solid ${C.muted}22`,
            overflow: 'hidden', minWidth: 130,
          }}>
            <div onClick={(e) => { stopAndClose(e); onEdit(task) }} style={{
              padding: '12px 16px', fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 13, color: C.text, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: `1px solid ${C.muted}18`,
            }}>
              <span style={{ fontSize: 14 }}>✎</span> Edit task
            </div>
            <div onClick={(e) => { stopAndClose(e); onDelete(task.id) }} style={{
              padding: '12px 16px', fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 13, color: '#f87171', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 14 }}>✕</span> Delete
            </div>
          </div>
        </>
      )}

      {/* Notch row */}
      <div onClick={() => onClick(task)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: -14, paddingLeft: 6, paddingRight: 10,
        position: 'relative', zIndex: 2, cursor: 'pointer',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: st.color, color: st.fg,
          borderRadius: 20, padding: '3px 12px',
          fontFamily: "'DM Mono', monospace", letterSpacing: .8,
          boxShadow: `0 2px 10px ${st.color}44`,
        }}>{st.label}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {assignedPeople.length > 0 && (
            <AvatarRow people={assignedPeople} size={26} />
          )}
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: C.card, border: `1px solid ${C.muted}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: C.muted,
          }}>+</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 50, height: 4, borderRadius: 2, background: C.card, overflow: 'hidden' }}>
              <div style={{ width: `${task.progress}%`, height: '100%', background: st.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: st.color, fontFamily: "'DM Mono', monospace" }}>{task.progress}%</span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div onClick={() => onClick(task)} style={{
        background: st.color + '20', border: `1.5px solid ${st.color}44`,
        borderRadius: 18, padding: '20px 16px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', zIndex: 1, cursor: 'pointer',
      }}>
        {/* Diamond icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: C.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: `1.5px solid ${st.color}44`,
          transform: 'rotate(45deg)',
        }}>
          <span style={{ transform: 'rotate(-45deg)', fontSize: 18, color: st.color }}>{icon}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 15, color: C.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{task.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{task.category}</span>
            {proj && (
              <>
                <span style={{ fontSize: 10, color: C.muted }}>·</span>
                <span style={{ fontSize: 10, color: projColor(proj), fontFamily: "'DM Mono', monospace" }}>
                  ⬡ {proj.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Kebab trigger */}
        <div
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          style={{ color: C.muted, fontSize: 20, cursor: 'pointer', flexShrink: 0, padding: '4px 2px', zIndex: 3 }}
        >⋮</div>
      </div>
    </div>
  )
}
