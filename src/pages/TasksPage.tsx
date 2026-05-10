import { C } from '../theme'

export default function TasksPage() {
  return (
    <div style={{ padding: '48px 20px', background: C.bg, minHeight: '100dvh' }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
        fontSize: 24, color: C.text,
      }}>Tasks</div>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 11,
        color: C.muted, marginTop: 8,
      }}>Phase 2 — coming next</div>
    </div>
  )
}
