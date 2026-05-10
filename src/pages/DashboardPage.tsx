import { useState, useEffect, useRef, useMemo } from 'react'
import OpenAI from 'openai'
import { C, STATUS, projColor, CAT_ICON } from '../theme'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useTaskStore } from '../store/useTaskStore'
import { useProjectStore } from '../store/useProjectStore'
import { Av } from '../components/Avatar'
import type { TaskStatus } from '../types'

const STATUS_ORDER: TaskStatus[] = ['running', 'pending', 'todo', 'completed', 'rejected']

function dk(d: Date) { return d.toISOString().slice(0, 10) }

function getWeekKeys(): string[] {
  const today = new Date()
  const day   = today.getDay()
  const diff  = day === 0 ? -6 : 1 - day // offset to Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + diff + i)
    return dk(d)
  })
}

function localFallback(rate: number, done: number, total: number): string {
  if (total === 0) return 'No tasks scheduled this week. Add one on the Tasks screen to get started.'
  if (rate >= 70) return `${done} of ${total} tasks done — a strong week by any measure.`
  if (rate >= 40) return `Halfway there. ${total - done} task${total - done !== 1 ? 's' : ''} left to close out the week.`
  return `${done} of ${total} tasks complete. The week is not over — push through.`
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted,
      marginBottom: 12, marginTop: 28, letterSpacing: 1.4, textTransform: 'uppercase',
    } as React.CSSProperties}>{title}</div>
  )
}

interface Props {
  onOpenProfile: () => void
}

export default function DashboardPage({ onOpenProfile }: Props) {
  const { user }                            = useAuthStore()
  const { isDark, toggle: toggleTheme }     = useThemeStore()
  const { tasks, fetchAll }                 = useTaskStore()
  const { projects, fetchProjects }         = useProjectStore()

  const [smartMsg,    setSmartMsg]    = useState('')
  const [msgLoading,  setMsgLoading]  = useState(false)
  const msgFetched = useRef(false)

  useEffect(() => {
    if (!user) return
    fetchAll(user.id)
    fetchProjects(user.id)
  }, [user, fetchAll, fetchProjects])

  const today    = new Date()
  const todayKey = dk(today)

  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks])
  const weekKeys = useMemo(() => getWeekKeys(), [])
  const weekTasks = useMemo(() => weekKeys.flatMap(k => tasks[k] ?? []), [weekKeys, tasks])

  const weekTotal      = weekTasks.length
  const weekDone       = weekTasks.filter(t => t.status === 'completed').length
  const completionRate = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100)

  const statusCounts = useMemo(() => {
    const c: Record<TaskStatus, number> = { todo: 0, pending: 0, running: 0, completed: 0, rejected: 0 }
    for (const t of allTasks) c[t.status]++
    return c
  }, [allTasks])

  const totalAllTasks = allTasks.length

  const projectStats = useMemo(() =>
    projects
      .map(proj => {
        const pt   = allTasks.filter(t => t.project_id === proj.id)
        const done = pt.filter(t => t.status === 'completed').length
        const pct  = pt.length === 0 ? 0 : Math.round((done / pt.length) * 100)
        return { proj, done, total: pt.length, pct }
      })
      .filter(ps => ps.total > 0),
    [projects, allTasks]
  )

  const upNext = useMemo(() =>
    allTasks
      .filter(t => t.date >= todayKey && t.status !== 'completed' && t.status !== 'rejected')
      .sort((a, b) => a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.start_time.localeCompare(b.start_time))
      .slice(0, 5),
    [allTasks, todayKey]
  )

  // Smart message — fetch once per session, fall back to local string
  useEffect(() => {
    if (msgFetched.current) return
    msgFetched.current = true

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
    if (!apiKey) {
      setSmartMsg(localFallback(completionRate, weekDone, weekTotal))
      return
    }
    setMsgLoading(true)
    const level = completionRate >= 70 ? 'excellent' : completionRate >= 40 ? 'moderate' : 'low'
    const ai    = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    ai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 60,
      messages:   [{
        role:    'user',
        content: `You are a witty productivity coach. This week the user completed ${weekDone} of ${weekTotal} tasks (${completionRate}% — ${level}). Write one honest, motivating sentence (max 18 words). No emojis, no quotation marks.`,
      }],
    })
      .then(r => setSmartMsg(r.choices[0].message.content?.trim() ?? localFallback(completionRate, weekDone, weekTotal)))
      .catch(() => setSmartMsg(localFallback(completionRate, weekDone, weekTotal)))
      .finally(() => setMsgLoading(false))
  }, [completionRate, weekDone, weekTotal])

  if (!user) return null

  const msgSymbol = completionRate >= 70 ? '◆' : completionRate >= 40 ? '◈' : '◎'
  const msgLabel  = completionRate >= 70 ? 'Strong week' : completionRate >= 40 ? 'Making progress' : 'Room to grow'

  function fmtDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    if (dateStr === todayKey) return 'Today'
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (dateStr === dk(tomorrow)) return 'Tomorrow'
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function fmtTime(t: string) {
    const [hStr, m] = t.split(':')
    const h = parseInt(hStr)
    return h > 12 ? `${h - 12}:${m} pm` : h === 12 ? `12:${m} pm` : `${h}:${m} am`
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '48px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: .8, marginBottom: 6 }}>
              {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24, color: C.text, lineHeight: 1.25 }}>
              Dashboard
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginTop: 5 }}>
              Here is how your week is going
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexShrink: 0 }}>
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
            <div onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
              <Av person={user} size={44} borderColor={C.accent} />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>

        {/* Smart message card */}
        <div style={{
          background: C.surface, borderRadius: 20, padding: '20px 20px 22px',
          border: `1.5px solid ${C.accent}22`, marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18, color: C.accent }}>{msgSymbol}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.accent, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {msgLabel}
            </span>
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15,
            color: C.text, lineHeight: 1.5, minHeight: 46,
          }}>
            {msgLoading ? (
              <span style={{ color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Thinking…</span>
            ) : smartMsg}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, color: C.accent }}>
                {completionRate}%
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 2 }}>This week</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>
                {weekDone}/{weekTotal}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 2 }}>Tasks done</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>
                {totalAllTasks}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 2 }}>All time</div>
            </div>
          </div>
        </div>

        {/* Status grid */}
        <SectionHead title="Task Status" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
          {STATUS_ORDER.slice(0, 3).map(s => (
            <StatusCard key={s} status={s} count={statusCounts[s]} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {STATUS_ORDER.slice(3).map(s => (
            <StatusCard key={s} status={s} count={statusCounts[s]} />
          ))}
        </div>

        {/* Completion breakdown */}
        {totalAllTasks > 0 && (
          <>
            <SectionHead title="Breakdown" />
            <div style={{ background: C.surface, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STATUS_ORDER.filter(s => statusCounts[s] > 0).map(s => {
                const pct = Math.round((statusCounts[s] / totalAllTasks) * 100)
                return (
                  <div key={s}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.dim }}>
                        {STATUS[s].label}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: STATUS[s].color }}>
                        {statusCounts[s]} · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: C.card, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: STATUS[s].color, borderRadius: 3, transition: 'width .6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Project tracker */}
        {projectStats.length > 0 && (
          <>
            <SectionHead title="Projects" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projectStats.map(({ proj, done, total, pct }) => (
                <div key={proj.id} style={{ background: C.surface, borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: projColor(proj), flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.name}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, flexShrink: 0 }}>
                      {done}/{total} · {pct}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: C.card, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: projColor(proj), borderRadius: 3, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Up Next */}
        {upNext.length > 0 && (
          <>
            <SectionHead title="Up Next" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upNext.map(t => (
                <div key={t.id} style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C.muted, flexShrink: 0 }}>{CAT_ICON[t.category] ?? '◈'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 3 }}>
                      {fmtDate(t.date)} · {fmtTime(t.start_time)}
                    </div>
                  </div>
                  <div style={{
                    background: STATUS[t.status].color + '22',
                    border: `1px solid ${STATUS[t.status].color}55`,
                    borderRadius: 10, padding: '3px 9px',
                    fontFamily: "'DM Mono', monospace", fontSize: 9,
                    color: STATUS[t.status].color, flexShrink: 0,
                  }}>
                    {STATUS[t.status].label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {totalAllTasks === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 36, opacity: .12, marginBottom: 14, color: C.text }}>◈</div>
            <div style={{ color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>No tasks yet</div>
            <div style={{ color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 10, marginTop: 6, opacity: .7 }}>
              Add tasks on the Tasks screen to see your stats here
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCard({ status, count }: { status: TaskStatus; count: number }) {
  const s = STATUS[status]
  return (
    <div style={{
      background: C.surface, borderRadius: 14, padding: '14px 14px 12px',
      border: `1.5px solid ${s.color}22`,
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
        fontSize: 24, color: s.color, lineHeight: 1,
      }}>{count}</div>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        color: C.muted, marginTop: 6, letterSpacing: .5,
      }}>{s.label}</div>
      <div style={{ marginTop: 8, height: 3, background: C.card, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: count > 0 ? '100%' : '0%', background: s.color, borderRadius: 2 }} />
      </div>
    </div>
  )
}
