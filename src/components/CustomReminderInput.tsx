import { useState } from 'react'
import { C } from '../theme'

interface Props {
  reminders:    string[]
  setReminders: (fn: (prev: string[]) => string[]) => void
}

export default function CustomReminderInput({ reminders, setReminders }: Props) {
  const [show,      setShow]      = useState(false)
  const [customVal, setCustomVal] = useState('')
  const [unit,      setUnit]      = useState<'minutes' | 'hours' | 'days'>('minutes')

  function add() {
    const num = parseInt(customVal)
    if (!num || num <= 0) return
    const mins = unit === 'hours' ? num * 60 : unit === 'days' ? num * 1440 : num
    const key  = String(mins)
    if (reminders.includes(key)) { setCustomVal(''); setShow(false); return }
    setReminders((prev) => [...prev, key])
    setCustomVal('')
    setShow(false)
  }

  if (!show) {
    return (
      <div onClick={() => setShow(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 20,
        background: C.card, border: `1.5px dashed ${C.muted}44`,
        fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted,
        cursor: 'pointer', marginBottom: 8,
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Custom
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <input
        type="number" min="1" value={customVal}
        onChange={(e) => setCustomVal(e.target.value)}
        placeholder="e.g. 45"
        style={{
          width: 72, background: C.bg, border: `1.5px solid ${C.accent}66`,
          borderRadius: 12, padding: '8px 10px', color: C.text,
          fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none',
        }}
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as 'minutes' | 'hours' | 'days')}
        style={{
          background: C.bg, border: `1.5px solid ${C.muted}33`,
          borderRadius: 12, padding: '8px 10px', color: C.text,
          fontFamily: "'DM Mono', monospace", fontSize: 11, outline: 'none',
        }}
      >
        <option value="minutes">min</option>
        <option value="hours">hrs</option>
        <option value="days">days</option>
      </select>
      <div onClick={add} style={{
        background: C.accent, color: C.bg, borderRadius: 12,
        padding: '8px 14px', fontFamily: "'DM Mono', monospace",
        fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
      }}>Add</div>
      <div onClick={() => { setShow(false); setCustomVal('') }} style={{ color: C.muted, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</div>
    </div>
  )
}
