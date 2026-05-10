import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { swapTheme, C } from './theme'
import LoginPage from './pages/LoginPage'
import TasksPage from './pages/TasksPage'
import DashboardPage from './pages/DashboardPage'

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
  const { user, loading, init } = useAuthStore()
  const { isDark }              = useThemeStore()
  const [showProfile, setShowProfile] = useState(false)

  swapTheme(isDark)

  useEffect(() => { init() }, [init])

  if (loading) return <div style={{ minHeight: '100dvh', background: '#0f1629' }} />

  return (
    <Routes>
      <Route path="/login"     element={user ? <Navigate to="/tasks" replace /> : <LoginPage />} />
      <Route path="/tasks"     element={user ? (
        <>
          <TasksPage onOpenProfile={() => setShowProfile(true)} />
          <BottomNav />
          {showProfile && (
            <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowProfile(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 24, padding: '32px 28px', maxWidth: 340, width: '90%', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>Profile — Phase 4</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginBottom: 24 }}>Full profile sheet coming in Phase 4.</div>
                <button onClick={() => setShowProfile(false)} style={{ background: C.accent, color: C.bg, border: 'none', borderRadius: 12, padding: '12px 28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )}
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
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
