import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { useNotificationStore } from './store/useNotificationStore'
import { swapTheme, C } from './theme'
import LoginPage from './pages/LoginPage'
import TasksPage from './pages/TasksPage'
import DashboardPage from './pages/DashboardPage'
import ProfileSheet from './components/ProfileSheet'

function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const tab       = location.pathname === '/dashboard' ? 'dashboard' : 'tasks'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, background: C.surface,
      borderTop: `1.5px solid ${C.muted}22`, display: 'flex',
      padding: '10px 0 24px', zIndex: 40, transition: 'background .3s',
    }}>
      {[
        { id: 'tasks',     icon: '▣', label: 'Tasks',     path: '/tasks'     },
        { id: 'dashboard', icon: '◈', label: 'Dashboard', path: '/dashboard' },
      ].map((n) => (
        <button key={n.id} onClick={() => navigate(n.path)} style={{
          flex: 1, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 22, color: tab === n.id ? C.accent : C.muted, transition: 'color .2s' }}>{n.icon}</span>
          <span style={{ fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", color: tab === n.id ? C.accent : C.muted, transition: 'color .2s' }}>{n.label}</span>
        </button>
      ))}
    </div>
  )
}

function AppShell() {
  const { user, loading, init }  = useAuthStore()
  const { isDark }               = useThemeStore()
  const { reset }                = useNotificationStore()

  const [showProfile, setShowProfile] = useState(false)
  const [openTaskId,  setOpenTaskId]  = useState<string | null>(null)

  swapTheme(isDark)

  useEffect(() => { init() }, [init])

  // Reset notification store on sign-out
  useEffect(() => { if (!user) reset() }, [user, reset])

  if (loading) return <div style={{ minHeight: '100dvh', background: '#0f1629' }} />

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/tasks" replace /> : <LoginPage />} />
        <Route path="/tasks" element={user ? (
          <>
            <TasksPage
              onOpenProfile={() => setShowProfile(true)}
              openTaskId={openTaskId}
              onClearOpenTaskId={() => setOpenTaskId(null)}
            />
            <BottomNav />
          </>
        ) : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={user ? (
          <>
            <DashboardPage onOpenProfile={() => setShowProfile(true)} />
            <BottomNav />
          </>
        ) : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={user ? '/tasks' : '/login'} replace />} />
      </Routes>

      {showProfile && user && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          onOpenTask={(taskId) => {
            setOpenTaskId(taskId)
            setShowProfile(false)
          }}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
