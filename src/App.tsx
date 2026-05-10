import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { swapTheme } from './theme'
import LoginPage from './pages/LoginPage'
import TasksPage from './pages/TasksPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const { user, loading, init } = useAuthStore()
  const { isDark } = useThemeStore()

  // Swap module-level theme refs on every render so all components get current tokens
  swapTheme(isDark)

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: '#0f1629',
      }} />
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/tasks" replace /> : <LoginPage />}
        />
        <Route
          path="/tasks"
          element={user ? <TasksPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? '/tasks' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
