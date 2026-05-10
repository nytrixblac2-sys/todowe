import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../theme'
import { Av } from './Avatar'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore } from '../store/useTaskStore'
import { useProjectStore } from '../store/useProjectStore'
import { useNotificationStore } from '../store/useNotificationStore'
import type { NotificationType } from '../types'

const TYPE_META: Record<NotificationType, { icon: string; label: string; color: () => string }> = {
  nudge_overdue:  { icon: '◉', label: 'Overdue',   color: () => C.amber  },
  nudge_stalled:  { icon: '◈', label: 'Stalled',   color: () => C.purple },
  assigned:       { icon: '◆', label: 'Assigned',  color: () => C.accent },
  status_change:  { icon: '▣', label: 'Status',    color: () => C.cyan   },
  reminder:       { icon: '◎', label: 'Reminder',  color: () => C.amber  },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Props {
  onClose:     () => void
  onOpenTask:  (taskId: string) => void
}

type MainTab = 'account' | 'notifications'
type NotifTab = 'inbox' | 'cleared'

export default function ProfileSheet({ onClose, onOpenTask }: Props) {
  const navigate = useNavigate()
  const { user, signOut }      = useAuthStore()
  const { tasks }              = useTaskStore()
  const { projects }           = useProjectStore()
  const { notifications, clearOne, clearAll, deleteOne, deleteCleared } = useNotificationStore()

  const [mainTab,  setMainTab]  = useState<MainTab>('account')
  const [notifTab, setNotifTab] = useState<NotifTab>('inbox')

  const allTasks   = useMemo(() => Object.values(tasks).flat(), [tasks])
  const totalTasks = allTasks.length
  const completed  = allTasks.filter((t) => t.status === 'completed').length
  const rate       = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100)

  const activeProjects = useMemo(() =>
    projects.filter((p) =>
      allTasks.some((t) => t.project_id === p.id && t.status !== 'completed' && t.status !== 'rejected')
    ).length,
    [projects, allTasks]
  )

  const inbox   = notifications.filter((n) => !n.cleared)
  const cleared = notifications.filter((n) => n.cleared)
  const unread  = inbox.filter((n) => !n.read).length

  const statusMsg =
    rate >= 70 ? "You're on fire this week." :
    rate >= 40 ? 'Making steady progress.' :
    totalTasks === 0 ? 'Ready to start your first task.' :
    'Room to push harder this week.'

  function handleNotifTap(notifId: string, taskId: string) {
    clearOne(notifId)
    onOpenTask(taskId)
    navigate('/tasks')
    onClose()
  }

  if (!user) return null

  const tabBtn = (id: MainTab, label: string, badge?: number) => (
    <button onClick={() => setMainTab(id)} style={{
      flex: 1, background: 'none', border: 'none', cursor: 'pointer',
      padding: '10px 0',
      borderBottom: `2px solid ${mainTab === id ? C.accent : 'transparent'}`,
      fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: .8,
      color: mainTab === id ? C.accent : C.muted,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'color .2s',
    }}>
      {label.toUpperCase()}
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: '#f87171', color: '#fff', borderRadius: '50%',
          width: 16, height: 16, fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{badge > 9 ? '9+' : badge}</span>
      )}
    </button>
  )

  const subTabBtn = (id: NotifTab, label: string, count: number) => (
    <button onClick={() => setNotifTab(id)} style={{
      flex: 1, background: notifTab === id ? C.accent + '18' : 'none',
      border: `1px solid ${notifTab === id ? C.accent + '44' : C.muted + '22'}`,
      borderRadius: 10, cursor: 'pointer', padding: '7px 0',
      fontFamily: "'DM Mono', monospace", fontSize: 10,
      color: notifTab === id ? C.accent : C.muted,
    }}>
      {label} {count > 0 && `(${count})`}
    </button>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, background: C.surface,
          borderRadius: '28px 28px 0 0', padding: '0 0 40px',
          maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
          animation: 'slideUp .28s cubic-bezier(.34,1.2,.64,1)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: C.muted + '44', borderRadius: 2, margin: '16px auto 0' }} />

        {/* Main tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.muted}22`, padding: '4px 20px 0', marginTop: 8 }}>
          {tabBtn('account', 'Account')}
          {tabBtn('notifications', 'Notifications', unread)}
        </div>

        {/* ── Account tab ── */}
        {mainTab === 'account' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <Av person={user} size={68} borderColor={C.accent} />
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, marginTop: 12 }}>
                {user.name}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginTop: 4 }}>
                {user.email}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted + '88', marginTop: 4, letterSpacing: .5 }}>
                Member since {user.member_since}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Tasks',    value: totalTasks },
                { label: 'Projects', value: activeProjects },
                { label: 'Rate',     value: `${rate}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: C.card, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, color: C.accent }}>{value}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Status message */}
            <div style={{
              background: C.card, borderRadius: 14, padding: '14px 16px', marginBottom: 28,
              borderLeft: `3px solid ${C.accent}`,
            }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.text }}>
                {statusMsg}
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={async () => { await signOut(); onClose() }}
              style={{
                width: '100%', background: 'none', border: `1.5px solid ${C.muted}33`,
                borderRadius: 14, padding: 14,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
                color: C.muted, cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* ── Notifications tab ── */}
        {mainTab === 'notifications' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {subTabBtn('inbox',   'Inbox',   inbox.length)}
              {subTabBtn('cleared', 'Cleared', cleared.length)}
            </div>

            {/* Inbox */}
            {notifTab === 'inbox' && (
              <>
                {inbox.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={clearAll} style={{
                      background: 'none', border: `1px solid ${C.muted}33`, borderRadius: 10,
                      padding: '5px 14px', fontFamily: "'DM Mono', monospace", fontSize: 9,
                      color: C.muted, cursor: 'pointer', letterSpacing: .5,
                    }}>Clear all</button>
                  </div>
                )}
                {inbox.length === 0 ? (
                  <Empty label="No new notifications" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {inbox.map((n) => {
                      const meta = TYPE_META[n.type]
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotifTap(n.id, n.task_id)}
                          style={{
                            background: C.card, borderRadius: 14, padding: '12px 14px',
                            display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                            borderLeft: `3px solid ${n.read ? C.muted + '33' : meta.color()}`,
                          }}
                        >
                          <span style={{ fontSize: 16, color: meta.color(), flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: meta.color(), letterSpacing: 1, textTransform: 'uppercase' }}>
                                {meta.label}
                              </span>
                              {!n.read && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color(), display: 'inline-block' }} />
                              )}
                            </div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 3 }}>
                              {n.title}
                            </div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                              {n.body}
                            </div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted + '66', marginTop: 6 }}>
                              {timeAgo(n.created_at)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); clearOne(n.id) }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: C.muted, fontSize: 14, flexShrink: 0, padding: 2,
                            }}
                          >✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Cleared */}
            {notifTab === 'cleared' && (
              <>
                {cleared.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={deleteCleared} style={{
                      background: 'none', border: `1px solid #f8717133`, borderRadius: 10,
                      padding: '5px 14px', fontFamily: "'DM Mono', monospace", fontSize: 9,
                      color: '#f87171', cursor: 'pointer', letterSpacing: .5,
                    }}>Delete all</button>
                  </div>
                )}
                {cleared.length === 0 ? (
                  <Empty label="Nothing cleared yet" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cleared.map((n) => {
                      const meta = TYPE_META[n.type]
                      return (
                        <div key={n.id} style={{
                          background: C.card, borderRadius: 14, padding: '12px 14px',
                          display: 'flex', gap: 12, alignItems: 'flex-start', opacity: .65,
                        }}>
                          <span style={{ fontSize: 16, color: C.muted, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                              {meta.label}
                            </div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 3 }}>
                              {n.title}
                            </div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                              {n.body}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteOne(n.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#f87171', fontSize: 14, flexShrink: 0, padding: 2,
                            }}
                          >✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ fontSize: 28, opacity: .12, marginBottom: 10, color: C.text }}>◈</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted }}>{label}</div>
    </div>
  )
}
