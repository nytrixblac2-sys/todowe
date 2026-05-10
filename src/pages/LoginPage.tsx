import { useState } from 'react'
import { C } from '../theme'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const { signIn, error, loading } = useAuthStore()
  const { isDark, toggle } = useThemeStore()

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    await signIn(email.trim(), password.trim())
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh',
      padding: '0 28px', background: C.bg,
    }}>
      {/* Logo block */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, color: C.accent, marginBottom: 12 }}>◈</div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
          fontSize: 32, color: C.text,
        }}>Todowe</div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: C.muted, letterSpacing: 2, marginTop: 6, textTransform: 'uppercase',
        }}>Plan · Track · Deliver Together</div>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 9, color: C.muted, fontFamily: "'DM Mono', monospace",
            letterSpacing: 1.5, marginBottom: 7, textTransform: 'uppercase',
          }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="email"
            style={{
              width: '100%', background: C.surface,
              border: `1.5px solid ${C.muted}33`, borderRadius: 14,
              padding: '13px 16px', color: C.text,
              fontFamily: "'DM Mono', monospace", fontSize: 13,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 9, color: C.muted, fontFamily: "'DM Mono', monospace",
            letterSpacing: 1.5, marginBottom: 7, textTransform: 'uppercase',
          }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="current-password"
            style={{
              width: '100%', background: C.surface,
              border: `1.5px solid ${C.muted}33`, borderRadius: 14,
              padding: '13px 16px', color: C.text,
              fontFamily: "'DM Mono', monospace", fontSize: 13,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: '#f87171', fontSize: 11,
            fontFamily: "'DM Mono', monospace", marginBottom: 12,
          }}>{error}</div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', background: C.accent, color: C.bg,
            border: 'none', borderRadius: 16, padding: 16,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: `0 8px 28px ${C.accent}44`,
            letterSpacing: 0.3, marginTop: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >{loading ? 'Signing in…' : 'Sign In'}</button>

        {/* Theme toggle */}
        <div
          onClick={toggle}
          style={{
            textAlign: 'center', marginTop: 16,
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: C.muted, cursor: 'pointer', letterSpacing: 1,
          }}
        >{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</div>
      </div>
    </div>
  )
}
