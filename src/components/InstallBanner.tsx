import { useState, useEffect } from 'react'
import { C } from '../theme'

const DISMISSED_KEY = 'todowe-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as Record<string, unknown>).standalone === true)
  )
}

export default function InstallBanner() {
  const [show,          setShow]          = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios,           setIos]           = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (isInStandaloneMode()) return // already installed

    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    if (isIOS()) {
      setIos(true)
      setShow(true)
    } else {
      window.addEventListener('beforeinstallprompt', handlePrompt)
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    else dismiss()
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 86, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)', maxWidth: 390,
      background: C.surface, borderRadius: 18,
      border: `1.5px solid ${C.accent}33`,
      padding: '14px 16px', zIndex: 45,
      boxShadow: `0 8px 32px #00000044`,
      animation: 'slideUp .3s cubic-bezier(.34,1.2,.64,1)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 24, flexShrink: 0 }}>◈</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>
          Add Todowe to Home Screen
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
          {ios
            ? 'Tap the Share icon in Safari, then "Add to Home Screen"'
            : 'Install for a faster, full-screen experience'}
        </div>
      </div>
      {!ios && (
        <button onClick={install} style={{
          background: C.accent, color: C.bg, border: 'none', borderRadius: 12,
          padding: '8px 14px', fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0,
        }}>Install</button>
      )}
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.muted, fontSize: 16, flexShrink: 0, padding: 2,
      }}>✕</button>
    </div>
  )
}
