import { useRef } from 'react'
import { C } from '../theme'

const WDAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function dk(d: Date) { return d.toISOString().slice(0, 10) }

interface DayStripProps {
  viewYear:    number
  viewMonth:   number
  selected:    Date
  taskDates:   Set<string>  // set of YYYY-MM-DD strings that have tasks
  onSelect:    (d: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export default function DayStrip({
  viewYear, viewMonth, selected, taskDates, onSelect, onPrevMonth, onNextMonth,
}: DayStripProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const today    = dk(new Date())
  const days     = daysInMonth(viewYear, viewMonth)

  function scrollToDay(el: HTMLDivElement | null) {
    if (!el || !stripRef.current) return
    const strip = stripRef.current
    strip.scrollTo({ left: el.offsetLeft - strip.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:12 }}>
        <button onClick={onPrevMonth} style={{ background:'none', border:'none', color:C.muted, fontSize:18, cursor:'pointer', padding:'4px 8px', lineHeight:1 }}>‹</button>
        <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:16, color:C.text, letterSpacing:.3 }}>
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button onClick={onNextMonth} style={{ background:'none', border:'none', color:C.muted, fontSize:18, cursor:'pointer', padding:'4px 8px', lineHeight:1 }}>›</button>
      </div>

      {/* Scrollable strip */}
      <div ref={stripRef} style={{ overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
        <div style={{ display:'flex', gap:7, padding:'0 20px', width:'max-content' }}>
          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const d      = new Date(viewYear, viewMonth, day)
            const key    = dk(d)
            const isSel  = key === dk(selected)
            const isToday = key === today
            const hasTasks = taskDates.has(key)
            const wday  = WDAYS[d.getDay()]

            return (
              <div
                key={day}
                ref={isSel ? scrollToDay : null}
                onClick={() => onSelect(d)}
                style={{
                  width: 48, padding: '10px 0 8px', borderRadius: 14, flexShrink: 0,
                  background: isSel ? C.accent : C.surface + (isToday ? '' : '99'),
                  border: isToday && !isSel ? `1.5px solid ${C.accent}55` : '1.5px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: 'pointer', transition: 'background .18s',
                }}
              >
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 16,
                  color: isSel ? C.bg : isToday ? C.accent : C.text, lineHeight: 1,
                }}>{day}</span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                  color: isSel ? C.bg + '99' : C.muted, letterSpacing: .4,
                }}>{wday}</span>
                {hasTasks && (
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isSel ? C.bg + '77' : C.accent, marginTop: 1,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
