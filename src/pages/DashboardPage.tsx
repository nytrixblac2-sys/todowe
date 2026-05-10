import { C } from '../theme'

export default function DashboardPage() {
  return (
    <div style={{ padding: '48px 20px', background: C.bg, minHeight: '100dvh' }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
        fontSize: 26, color: C.text,
      }}>Dashboard</div>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 11,
        color: C.muted, marginTop: 8,
      }}>Phase 3 — coming next</div>
    </div>
  )
}
