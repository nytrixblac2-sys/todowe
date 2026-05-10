import { C } from '../theme'
import type { Person, AuthUser } from '../types'

type AnyPerson = Person | AuthUser

interface AvProps {
  person: AnyPerson
  size?: number
  borderColor?: string
}

export function Av({ person, size = 28, borderColor }: AvProps) {
  const border = borderColor ?? C.bg
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: person.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#0f1629',
      border: `2.5px solid ${border}`,
      fontFamily: "'DM Mono', monospace",
      flexShrink: 0,
    }}>
      {person.initials}
    </div>
  )
}

interface AvatarRowProps {
  people: AnyPerson[]
  size?: number
  borderColor?: string
}

export function AvatarRow({ people, size = 26, borderColor }: AvatarRowProps) {
  const shown = people.slice(0, 3)
  const extra = people.length - shown.length

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -9, zIndex: shown.length - i }}>
          <Av person={p} size={size} borderColor={borderColor ?? C.surface} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: C.card, border: `2.5px solid ${borderColor ?? C.surface}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: C.muted, marginLeft: -9,
        }}>+{extra}</div>
      )}
    </div>
  )
}
