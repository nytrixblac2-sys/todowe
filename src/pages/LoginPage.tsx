import { useState } from 'react'
import { C } from '../theme'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'

type Mode = 'signin' | 'signup'

const inputSt: React.CSSProperties = {
  width: '100%', background: 'transparent',
  border: `1.5px solid ${C.muted}33`, borderRadius: 14,
  padding: '13px 16px', color: C.text,
  fontFamily: "'DM Mono', monospace", fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 9, color: C.muted, fontFamily: "'DM Mono', monospace",
        letterSpacing: 1.5, marginBottom: 7, textTransform: 'uppercase',
      }}>{label}</div>
      {children}
    </div>
  )
}

export default function LoginPage() {
  const [mode,     setMode]     = useState<Mode>('signin')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  const { signIn, signUp, error, message, loading } = useAuthStore()
  const { isDark, toggle } = useThemeStore()

  function switchMode(m: Mode) {
    setMode(m)
    setName('')
    setEmail('')
    setPassword('')
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    if (mode === 'signup') {
      if (!name.trim()) return
      await signUp(email.trim(), password.trim(), name.trim())
    } else {
      await signIn(email.trim(), password.trim())
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  const isSignUp = mode === 'signup'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100dvh', overflowY: 'auto',
      padding: '0 28px', background: C.bg, transition: 'background .25s',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, color: C.accent, marginBottom: 12 }}>◈</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 32, color: C.text }}>
          Todowe
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>
          Plan · Track · Deliver Together
        </div>
      </div>

      {/* Mode tab bar */}
      <div style={{
        display: 'flex', width: '100%', maxWidth: 380,
        background: C.card, borderRadius: 14, padding: 4, marginBottom: 28,
      }}>
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)} style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: 11,
            padding: '10px 0',
            background: mode === m ? C.surface : 'transparent',
            color: mode === m ? C.text : C.muted,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13,
            boxShadow: mode === m ? `0 2px 8px #00000022` : 'none',
            transition: 'background .2s, color .2s',
          }}>
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 380 }}>
        {isSignUp && (
          <Field label="Your name">
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="First and last name"
              autoComplete="name"
              style={inputSt}
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="email"
            style={inputSt}
          />
        </Field>

        <Field label="Password">
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            style={inputSt}
          />
        </Field>

        {/* Error */}
        {error && (
          <div style={{ color: '#f87171', fontSize: 11, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Success message (e.g. confirm email) */}
        {message && (
          <div style={{
            background: `${C.accent}18`, border: `1px solid ${C.accent}44`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 12,
            color: C.accent, fontSize: 11, fontFamily: "'DM Mono', monospace", lineHeight: 1.5,
          }}>
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', background: C.accent, color: C.bg,
            border: 'none', borderRadius: 16, padding: 16,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: `0 8px 28px ${C.accent}44`,
            letterSpacing: 0.3, marginTop: 6, opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        {/* Theme toggle */}
        <div
          onClick={toggle}
          style={{
            textAlign: 'center', marginTop: 20,
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: C.muted, cursor: 'pointer', letterSpacing: 1,
          }}
        >
          {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </div>
      </div>
    </div>
  )
}
